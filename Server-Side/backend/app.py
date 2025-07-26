from face_verification import verify_identity
from face_detection import detect_multiple_faces, detect_faces
from device_detection import detect_device
from gaze_tracking import detect_gaze
from truehuman import process_image

from flask import Flask, request, jsonify, Response
import cv2
import numpy as np
from flask_cors import CORS
import sqlite3
import logging
import os
import json
import base64  # Add this import for Base64 encoding

# Configure logging
logging.basicConfig(level=logging.ERROR, format='%(asctime)s - %(levelname)s - %(message)s')

# Initialize Flask App
app = Flask(__name__)

# Allow CORS
CORS(app, supports_credentials=True, origins=[
    "http://localhost:5173",
    "http://localhost:5175",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:3000"
])

# Update database path to use a fixed relative path
DB_PATH = '../project-root/results.db'

# Initialize SQLite Database
def init_db():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS results (
            task_id TEXT PRIMARY KEY,
            userId TEXT NOT NULL,
            face_detection TEXT,
            gaze_detection TEXT,
            device_detection TEXT,
            multiple_faces TEXT,
            identity_verification TEXT,
            liveness_detection TEXT,
            image_blob BLOB
        )
    ''')  # Re-added image_blob column
    conn.commit()
    conn.close()

def get_db_connection():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def safe_json_loads(data):
    try:
        return json.loads(data)
    except (TypeError, json.JSONDecodeError):
        return data

init_db()

@app.route('/process', methods=['POST'])
def process_frame():
    if 'frame' not in request.files or 'userId' not in request.form or 'currentTime' not in request.form:
        return jsonify({"error": "Missing frame, userId, or currentTime"}), 400

    task_id = str(request.form['currentTime'])
    userId = str(request.form['userId'])
    file = request.files['frame']

    file_bytes = np.frombuffer(file.read(), np.uint8)
    frame = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

    if frame is None:
        return jsonify({"error": "Invalid image format"}), 400

    # Convert image to BLOB
    _, buffer = cv2.imencode('.jpg', frame)
    image_blob = buffer.tobytes()

    # Perform detection tasks
    face_result = detect_faces(frame)
    gaze_result = detect_gaze(frame)
    device_result = detect_device(frame)
    multiple_faces_result = detect_multiple_faces(frame)
    liveness_result = process_image(frame)

    try:
        identity_result = verify_identity(frame, userId)
    except Exception as e:
        logging.error(f"Error in face verification: {e}")
        identity_result = {"error": "Face verification failed"}  # Gracefully handle the error

    # Store in DB
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            INSERT INTO results (
                task_id, userId, face_detection, gaze_detection, device_detection,
                multiple_faces, identity_verification, liveness_detection, image_blob
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            task_id, userId,
            json.dumps(face_result),
            json.dumps(gaze_result),
            json.dumps(device_result),
            json.dumps(multiple_faces_result),
            json.dumps(identity_result),
            json.dumps(liveness_result),
            image_blob
        ))
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"error": "Duplicate task_id. This frame was already processed."}), 409
    conn.close()

    # Response
    response = {
        "face_detection": face_result,
        "gaze_detection": gaze_result,
        "device_detection": device_result,
        "multiple_faces": multiple_faces_result,
        "identity_verification": identity_result,
        "liveness_detection": liveness_result
    }

    return jsonify(response), 200

@app.route('/results/<userId>', methods=['GET'])
def get_results(userId):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT task_id, userId, face_detection, gaze_detection, device_detection, multiple_faces, identity_verification, liveness_detection, image_blob FROM results WHERE userId = ?', (userId,))
    rows = cursor.fetchall()
    conn.close()

    results = []
    for row in rows:
        results.append({
            "task_id": row["task_id"],
            "userId": row["userId"],
            "face_detection": safe_json_loads(row["face_detection"]),
            "gaze_detection": safe_json_loads(row["gaze_detection"]),
            "device_detection": safe_json_loads(row["device_detection"]),
            "multiple_faces": safe_json_loads(row["multiple_faces"]),
            "identity_verification": safe_json_loads(row["identity_verification"]),
            "liveness_detection": safe_json_loads(row["liveness_detection"]),
            "image_blob": base64.b64encode(row["image_blob"]).decode('utf-8') if row["image_blob"] else None  # Encode image_blob as Base64
        })

    return jsonify(results), 200

@app.route('/image/<task_id>', methods=['GET'])
def get_image(task_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT image_blob FROM results WHERE task_id = ?', (task_id,))
    row = cursor.fetchone()
    conn.close()

    if row and row["image_blob"]:
        return Response(row["image_blob"], mimetype='image/jpeg')
    else:
        return jsonify({"error": "Image not found"}), 404

if __name__ == '__main__':
    app.run(debug=True, host="0.0.0.0", port=5001, threaded=True)
