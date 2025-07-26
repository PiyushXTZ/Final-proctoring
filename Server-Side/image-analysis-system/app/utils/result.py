def generate_result(detections, violations):
    """
    Formats the detection and violation results into a JSON response.
    """
    result = {
        "detections": detections,
        "violations": violations,
        "status": "Success" if not violations else "Violation Detected"
    }

    return result
