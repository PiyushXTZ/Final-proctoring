from flask import Flask, request, jsonify
import cv2
import numpy as np
from utils.image_utils import preprocess_image
from utils.detection import detect_objects
from utils.violation import check_violations
from utils.result import generate_result
import os

app = Flask(__name__)
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER


@app.route("/analyze", methods=["POST"])
def analyze_image():
    try:
        # Get image from request
        file = request.files["image"]
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], file.filename)
        file.save(filepath)

        npimg = np.frombuffer(file.read(), np.uint8)
        image = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

        # Preprocess image
        processed_image = preprocess_image(image)

        # Detect objects
        detections = detect_objects(processed_image)

        # Check for violations
        violations = check_violations(detections)

        # Generate result
        result = generate_result(detections, violations)

        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)
