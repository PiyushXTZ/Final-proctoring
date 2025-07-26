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

# Hypothetical COCO class index for a notebook (if using COCO dataset, adjust if necessary)
NOTEBOOK_CLASS_ID = 60  # Placeholder; might need adjustment based on dataset


def detect_notebook(image):
    """Detects if a notebook is present in the image."""
    try:
        # Convert image to tensor
        img_tensor = transform(image).unsqueeze(0)

        # Perform inference
        with torch.no_grad():
            predictions = model(img_tensor)[0]

        # Identify notebooks
        detected_notebooks = [predictions['labels'][i].item() for i in range(
            len(predictions['labels'])) if predictions['scores'][i] > 0.5]

        # Check if a notebook is detected
        if NOTEBOOK_CLASS_ID in detected_notebooks:
            return {"status": "valid", "message": "Notebook detected."}
        else:
            return {"status": "violation", "message": "No notebook detected."}
    except Exception as e:
        return {"status": "error", "message": str(e)}
