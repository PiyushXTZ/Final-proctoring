# def check_violations(detections):
#     """
#     Checks for violations based on detected objects considering side-view images.
#     """
#     allowed_objects = {"person": 1, "laptop": 1, "notebook": 1}
#     detected_counts = {"person": 0, "laptop": 0,
#                        "notebook": 0, "other_devices": 0}
#     violations = []

#     for obj in detections:
#         obj_class = obj["class"]

#         if obj_class in detected_counts:
#             detected_counts[obj_class] += 1
#         else:
#             detected_counts["other_devices"] += 1

#         # Detect standing by bounding box height (Y-coordinates)
#         if obj_class == "person":
#             y1, y2 = obj["bbox"][1], obj["bbox"][3]
#             height = y2 - y1

#             if height > 0.75 * image_height:  # Threshold to identify standing posture
#                 violations.append("Person detected standing up")
#             # Threshold for sitting posture (assuming seated person is smaller)
#             elif height < 0.5 * image_height:
#                 violations.append("Person detected sitting")

#     # Check for violations
#     if detected_counts["person"] > allowed_objects["person"]:
#         violations.append("More than one person detected")
#     if detected_counts["laptop"] > allowed_objects["laptop"]:
#         violations.append("More than one laptop detected")
#     if detected_counts["notebook"] > allowed_objects["notebook"]:
#         violations.append("More than one notebook detected")
#     if detected_counts["other_devices"] > 0:
#         violations.append("Unauthorized electronic device detected")

#     return violations


# def check_violations(detections):
#     """
#     Checks for violations based on detected objects.
#     """
#     allowed_objects = {"person": 1, "laptop": 1, "notebook": 1}
#     detected_counts = {"person": 0, "laptop": 0,
#                        "notebook": 0, "other_devices": 0}
#     violations = []

#     for obj in detections:
#         obj_class = obj["class"]

#         if obj_class in detected_counts:
#             detected_counts[obj_class] += 1
#         else:
#             detected_counts["other_devices"] += 1

#     # Check for violations
#     if detected_counts["person"] > allowed_objects["person"]:
#         violations.append("More than one person detected")
#     if detected_counts["laptop"] > allowed_objects["laptop"]:
#         violations.append("More than one laptop detected")
#     if detected_counts["notebook"] > allowed_objects["notebook"]:
#         violations.append("More than one notebook detected")
#     if detected_counts["other_devices"] > 0:
#         violations.append("Unauthorized electronic device detected")

#     return violations

import mediapipe as mp
import math
import cv2

mp_pose = mp.solutions.pose
pose = mp_pose.Pose()


def get_pose_keypoints(image):
    """
    Returns the keypoints of the person detected in the image using MediaPipe Pose.
    """
    image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    results = pose.process(image_rgb)

    if results.pose_landmarks:
        keypoints = {}
        for id, landmark in enumerate(results.pose_landmarks.landmark):
            keypoints[id] = (landmark.x, landmark.y, landmark.z)
        return keypoints
    return None


def is_standing(keypoints, image_height):
    """
    Determines if the person is standing or sitting based on keypoint analysis.
    """
    if not keypoints:
        return False

    # Get key points for torso and legs
    # These are the body parts used to estimate sitting vs standing
    shoulder_y = keypoints[mp_pose.PoseLandmark.LEFT_SHOULDER.value][1]
    hip_y = keypoints[mp_pose.PoseLandmark.LEFT_HIP.value][1]
    knee_y = keypoints[mp_pose.PoseLandmark.LEFT_KNEE.value][1]

    torso_height = abs(shoulder_y - hip_y)
    leg_height = abs(hip_y - knee_y)

    # Standing condition: torso is high and legs are long (vertical alignment)
    if torso_height > 0.3 * image_height and leg_height > 0.3 * image_height:
        return True  # Person is standing
    return False  # Person is seated


def check_violations(detections, image, image_height):
    """
    Checks for violations based on detected objects considering side-view images.
    """
    allowed_objects = {"person": 1, "laptop": 1, "notebook": 1}
    detected_counts = {"person": 0, "laptop": 0,
                       "notebook": 0, "other_devices": 0}
    violations = []

    for obj in detections:
        obj_class = obj["class"]

        if obj_class in detected_counts:
            detected_counts[obj_class] += 1
        else:
            detected_counts["other_devices"] += 1

        # Detect posture using MediaPipe pose keypoints
        if obj_class == "person":
            keypoints = get_pose_keypoints(image)
            if keypoints:
                standing = is_standing(keypoints, image_height)
                if standing:
                    violations.append("Person detected standing up")
                else:
                    violations.append("Person detected sitting down")

    # Check for violations
    if detected_counts["person"] > allowed_objects["person"]:
        violations.append("More than one person detected")
    if detected_counts["laptop"] > allowed_objects["laptop"]:
        violations.append("More than one laptop detected")
    if detected_counts["notebook"] > allowed_objects["notebook"]:
        violations.append("More than one notebook detected")
    if detected_counts["other_devices"] > 0:
        violations.append("Unauthorized electronic device detected")

    return violations
