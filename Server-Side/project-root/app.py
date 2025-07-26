import threading
from concurrent.futures import ThreadPoolExecutor
import queue
import uuid
from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import torch
import sqlite3
import psutil  # For monitoring memory usage
import json
import base64  # Add this import for Base64 encoding
from detection.person_detection import detect_person
from detection.electronic_device_detection import detect_electronic_devices
from detection.notebook_detection import detect_notebook
from detection.activity_recognition import recognize_activities

app = Flask(__name__)

# Allow multiple common localhost ports with credentials support
CORS(app, supports_credentials=True, origins=[
     "http://localhost:5173",
    "http://localhost:5175",
    "http://127.0.0.1:5174"
])

request_queue = queue.Queue()
results = {}
results_lock = threading.Lock()  # Lock for thread-safe access to results

# Thread pool for concurrent processing
executor = ThreadPoolExecutor(max_workers=4)

# Initialize SQLite database
def init_db():
    conn = sqlite3.connect('results.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS Phone (
            task_id TEXT,
            user_id TEXT,
            person TEXT,
            electronic_devices TEXT,
            notebook TEXT,
            activity TEXT,
            image_blob BLOB,
            PRIMARY KEY (task_id, user_id)
        )
    ''')
    conn.commit()
    conn.close()

init_db()

def log_memory_usage():
    """Log the current memory usage of the process."""
    process = psutil.Process()
    memory_info = process.memory_info()
    print(f"Memory Usage: RSS={memory_info.rss / (1024 * 1024):.2f} MB, VMS={memory_info.vms / (1024 * 1024):.2f} MB")

def save_result_to_db(task_id, user_id, result, image_blob):
    try:
        with sqlite3.connect('results.db') as conn:
            cursor = conn.cursor()
            # Serialize result fields to JSON strings
            cursor.execute('''
                INSERT INTO Phone (task_id, user_id, person, electronic_devices, notebook, activity, image_blob)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            ''', (
                str(task_id),
                str(user_id),
                json.dumps(result['person']),
                json.dumps(result['electronic_devices']),
                json.dumps(result['notebook']),
                json.dumps(result['activity']),
                image_blob
            ))
            conn.commit()
            print(f"Successfully saved task {task_id} for user {user_id} to the database.")
    except sqlite3.Error as e:
        print(f"SQLite error while saving to DB: {e}")
    finally:
        log_memory_usage()

def test_db_connection():
    try:
        conn = sqlite3.connect('results.db')
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = cursor.fetchall()
        print(f"Database connection successful. Tables: {tables}")
        conn.close()
    except sqlite3.Error as e:
        print(f"SQLite error during test connection: {e}")

# Call this function during app startup to verify database connectivity
test_db_connection()

def get_result_from_db(task_id, user_id):
    try:
        conn = sqlite3.connect('results.db')
        cursor = conn.cursor()
        # Debug log to verify parameter types
        print(f"Fetching from DB: task_id={task_id} (type={type(task_id)}), user_id={user_id} (type={type(user_id)})")
        # Ensure all parameters are strings
        cursor.execute('SELECT person, electronic_devices, notebook, activity FROM Phone WHERE task_id = ? AND user_id = ?', (str(task_id), str(user_id)))
        row = cursor.fetchone()
        if row:
            return {
                "person": row[0],
                "electronic_devices": row[1],
                "notebook": row[2],
                "activity": row[3]
            }
    except sqlite3.Error as e:
        print(f"SQLite error: {e}")
    finally:
        conn.close()
    return None

def process_queue():
    while True:
        task_id, user_id, img = request_queue.get()
        if task_id is None:
            break
        # Submit task to thread pool for concurrent processing
        future = executor.submit(process_image, task_id, user_id, img)
        future.add_done_callback(lambda f: request_queue.task_done())

def process_image(task_id, user_id, img):
    try:
        # Perform analysis and store results
        result = {
            "person": detect_person(img),
            "electronic_devices": detect_electronic_devices(img),
            "notebook": detect_notebook(img),
            "activity": recognize_activities(img)
        }
        # Save result to database
        _, img_encoded = cv2.imencode('.jpg', img)
        save_result_to_db(task_id, user_id, result, img_encoded.tobytes())
        
        # Store result in memory for quick access
        with results_lock:
            results[(str(task_id), str(user_id))] = result
        print(f"Processed task {task_id} for user {user_id}: {result}")
    except MemoryError as e:
        print(f"Memory error while processing task {task_id} for user {user_id}: {e}")
    except Exception as e:
        print(f"Error processing task {task_id} for user {user_id}: {e}")
    finally:
        log_memory_usage()

worker_thread = threading.Thread(target=process_queue, daemon=True)
worker_thread.start()

@app.route('/analyze', methods=['POST'])
def analyze():
    try:
        blob = request.files['image'].read()
        user_id = str(request.form.get('userId', '3'))  # Ensure user_id is a string
        task_id = request.form.get('currentTime')
        if not task_id:
            return jsonify({"error": "Missing 'currentTime' in request"}), 400
        task_id = str(task_id)

        npimg = np.frombuffer(blob, np.uint8)
        img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

        # Resize only if necessary
        if img.shape[:2] != (480, 640):  # Standardized size
            img = cv2.resize(img, (640, 480))

        request_queue.put((task_id, user_id, img))
        print(f"Task {task_id} for user {user_id} queued for processing.")
        return jsonify({"status": "queued", "task_id": task_id})
    except MemoryError as e:
        print(f"Memory error in /analyze: {e}")
        return jsonify({"error": "Memory error occurred while processing the image."})
    except Exception as e:
        print(f"Error in /analyze: {e}")
        return jsonify({"error": str(e)})
    finally:
        log_memory_usage()

@app.route('/result/<task_id>/<user_id>', methods=['GET'])
def get_result(task_id, user_id):
    try:
        with results_lock:
            if (str(task_id), str(user_id)) in results:
                if torch.cuda.is_available():
                    print("GPU Name in use:", torch.cuda.get_device_name(0))
                else:
                    print("No GPU detected.")
                return jsonify(results.pop((str(task_id), str(user_id))))
        db_result = get_result_from_db(task_id, user_id)
        if db_result:
            return jsonify(db_result)
        return jsonify({"status": "processing"}), 202
    except Exception as e:
        print(f"Error in /result: {e}")
        return jsonify({"error": str(e)})

@app.route("/cors-test")
def cors_test():
    return jsonify({"msg": "CORS is working"})

@app.route('/clear-data', methods=['POST'])
def clear_data():
    """Clears data from both 'results' and 'Phone' tables."""
    try:
        conn = sqlite3.connect('results.db')
        cursor = conn.cursor()
        cursor.execute('DELETE FROM results')
        cursor.execute('DELETE FROM Phone')
        conn.commit()
        conn.close()
        return jsonify({"message": "Data cleared from both tables"}), 200
    except sqlite3.Error as e:
        return jsonify({"error": f"SQLite error: {e}"}), 500

def safe_json_loads(data):
    """Safely parse JSON, returning None if parsing fails."""
    try:
        return json.loads(data) if data else None
    except json.JSONDecodeError as e:
        print(f"JSON decode error: {e}")
        return None

@app.route('/process-matched-data', methods=['POST'])
def process_matched_data():
    """Matches task_id from 'results' and 'Phone', includes images, and returns all data."""
    try:
        conn = sqlite3.connect('results.db')
        cursor = conn.cursor()

        # Fetch all matched data dynamically without relying on the table
        cursor.execute('''
            SELECT r.task_id, r.userId, r.face_detection, r.gaze_detection, r.device_detection,
                   r.multiple_faces, r.identity_verification, r.liveness_detection, r.image_blob AS results_image,
                   p.person, p.electronic_devices, p.notebook, p.activity, p.image_blob AS phone_image
            FROM results r
            INNER JOIN Phone p ON r.task_id = p.task_id
        ''')
        rows = cursor.fetchall()
        conn.close()

        # Convert data to JSON
        matched_data = []
        for row in rows:
            matched_data.append({
                "task_id": row[0],
                "userId": row[1],
                "face_detection": safe_json_loads(row[2]),
                "gaze_detection": safe_json_loads(row[3]),
                "device_detection": safe_json_loads(row[4]),
                "multiple_faces": safe_json_loads(row[5]),
                "identity_verification": safe_json_loads(row[6]),
                "liveness_detection": safe_json_loads(row[7]),
                "results_image": base64.b64encode(row[8]).decode('utf-8') if row[8] else None,  # Encode results_image as Base64
                "person": safe_json_loads(row[9]),
                "electronic_devices": safe_json_loads(row[10]),
                "notebook": safe_json_loads(row[11]),
                "activity": safe_json_loads(row[12]),
                "phone_image": base64.b64encode(row[13]).decode('utf-8') if row[13] else None  # Encode phone_image as Base64
            })

        # Pass data to a function (leave implementation empty)
        result = process_data_function(matched_data)

        return jsonify({"message": "Data processed successfully", "result": result, "data": matched_data}), 200
    except sqlite3.Error as e:
        return jsonify({"error": f"SQLite error: {e}"}), 500
    except Exception as e:
        return jsonify({"error": f"Unexpected error: {e}"}), 500

def process_data_function(data):
    """Process the matched data (implementation left empty)."""
    # User can implement this function as needed
    return len(data)  # Example: return the number of records processed

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
