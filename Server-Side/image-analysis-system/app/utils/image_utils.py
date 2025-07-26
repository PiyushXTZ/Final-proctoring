import cv2
import numpy as np


def preprocess_image(image):
    """
    Preprocesses the input image for object detection.
    - Converts to grayscale
    - Resizes to a fixed size (e.g., 640x640 for YOLO models)
    - Normalizes pixel values
    """
    try:
        # Convert to grayscale
        gray_image = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        # Resize image to 640x640
        resized_image = cv2.resize(gray_image, (640, 640))

        # Normalize pixel values (0-1 range)
        normalized_image = resized_image / 255.0

        # Convert back to 3-channel format for model input
        preprocessed_image = np.stack((normalized_image,)*3, axis=-1)

        return preprocessed_image

    except Exception as e:
        print(f"Error in preprocessing: {e}")
        return None
