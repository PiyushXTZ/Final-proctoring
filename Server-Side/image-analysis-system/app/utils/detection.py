import cv2
import numpy as np
import torch
from models.object_detection import load_model, run_detection

# Load the pre-trained model (YOLOv5 or other suitable model)
model = load_model()


def detect_objects(image):
    """
    Detects objects in the preprocessed image using a pre-trained model.
    Returns a dictionary with detected objects and their bounding boxes.
    """
    try:
        # Run object detection
        detections = run_detection(model, image)

        detected_objects = []
        for det in detections:
            class_name, confidence, bbox = det["class"], det["confidence"], det["bbox"]
            detected_objects.append({
                "class": class_name,
                "confidence": confidence,
                "bbox": bbox
            })

        return detected_objects

    except Exception as e:
        print(f"Error in object detection: {e}")
        return []
