import cv2
import torch
from torchvision import models, transforms

# Load pre-trained Faster R-CNN model
model = models.detection.fasterrcnn_resnet50_fpn(pretrained=True)
model.eval()

# Define transformation
transform = transforms.Compose([
    transforms.ToPILImage(),
    transforms.ToTensor()
])

# COCO class index for relevant electronic devices
LAPTOP_CLASS_ID = 73
MOBILE_CLASS_ID = 77
TABLET_CLASS_IDS = [60, 67]  # Some models classify tablets differently

# Function to detect electronic devices


def detect_electronic_devices(image):
    """Detects if only a laptop is present among electronic devices."""
    try:
        # Convert image to tensor
        img_tensor = transform(image).unsqueeze(0)

        # Perform inference
        with torch.no_grad():
            predictions = model(img_tensor)[0]

        # Identify detected objects with confidence > 0.5
        detected_devices = []
        for i in range(len(predictions['labels'])):
            label = predictions['labels'][i].item()
            confidence = predictions['scores'][i].item()

            # Consider only high-confidence detections
            if confidence > 0.5 and label in [LAPTOP_CLASS_ID, MOBILE_CLASS_ID] + TABLET_CLASS_IDS:
                detected_devices.append(label)

        # Debug output
        print(f"Detected electronic devices: {detected_devices}")

        # Check if ONLY one laptop is present
        if detected_devices.count(LAPTOP_CLASS_ID) == 1 and len(detected_devices) == 1:
            return {"status": "valid", "message": "Only one laptop detected."}
        else:
            return {"status": "violation", "message": "Other electronic devices detected!"}

    except Exception as e:
        return {"status": "error", "message": str(e)}


# import cv2
# import torch
# from torchvision import models, transforms

# # Load pre-trained Faster R-CNN model
# model = models.detection.fasterrcnn_resnet50_fpn(pretrained=True)
# model.eval()

# # Define transformation
# transform = transforms.Compose([
#     transforms.ToPILImage(),
#     transforms.ToTensor()
# ])

# # COCO class index for laptop
# LAPTOP_CLASS_ID = 73


# def detect_electronic_devices(image):
#     """Detects if only a laptop is present among electronic devices."""
#     try:
#         # Convert image to tensor
#         img_tensor = transform(image).unsqueeze(0)

#         # Perform inference
#         with torch.no_grad():
#             predictions = model(img_tensor)[0]

#         # Identify electronic devices
#         detected_devices = [predictions['labels'][i].item() for i in range(
#             len(predictions['labels'])) if predictions['scores'][i] > 0.5]

#         # Check for violations
#         if detected_devices.count(LAPTOP_CLASS_ID) == 1 and len(detected_devices) == 1:
#             return {"status": "valid", "message": "Only one laptop detected."}
#         else:
#             return {"status": "violation", "message": "Invalid electronic devices detected."}
#     except Exception as e:
#         return {"status": "error", "message": str(e)}
