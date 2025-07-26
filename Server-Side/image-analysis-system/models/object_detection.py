# import torch
# import cv2
# import numpy as np
# from ultralytics import YOLO


# def load_model():
#     """
#     Loads the YOLOv8 pre-trained model for object detection.
#     """
#     model = YOLO("yolov8n.pt")  # Using the YOLOv8 nano model for efficiency
#     return model


# def run_detection(model, image):
#     """
#     Runs object detection using the YOLO model.
#     Returns detected objects with class names, confidence scores, and bounding boxes.
#     """
#     results = model(image)
#     detections = []

#     for result in results:
#         for box in result.boxes.data.tolist():
#             x1, y1, x2, y2, confidence, class_id = box
#             class_name = model.names[int(class_id)]

#             detections.append({
#                 "class": class_name,
#                 "confidence": confidence,
#                 "bbox": [x1, y1, x2, y2]
#             })

#     return detections


import torch
import cv2
import numpy as np
from ultralytics import YOLO

def load_model():
    """
    Loads the YOLOv8 pre-trained model and moves it to GPU if available.
    """
    model = YOLO("yolov8n.pt")
    if torch.cuda.is_available():
        model.to('cuda')  # Move model to GPU
        print("[INFO] Model loaded to GPU")
    else:
        print("[WARNING] GPU not available, running on CPU")
    return model

def run_detection(model, image):
    """
    Runs object detection using the YOLO model on GPU (if available).
    """
    # If the image is not already on GPU, YOLO handles that internally
    results = model(image)
    detections = []

    for result in results:
        for box in result.boxes.data.tolist():
            x1, y1, x2, y2, confidence, class_id = box
            class_name = model.names[int(class_id)]
            detections.append({
                "class": class_name,
                "confidence": confidence,
                "bbox": [x1, y1, x2, y2]
            })

    return detections
