import React, { useState } from "react";

const Calculation = () => {
  const [message, setMessage] = useState("");
  const [matchedData, setMatchedData] = useState([]);
  const [riskScore, setRiskScore] = useState(null);
  const url = "https://1w7vd0hz-5000.inc1.devtunnels.ms/";

  

  const processMatchedData = async () => {
    try {
      const response = await fetch(url + "process-matched-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      if (data.result) {
        setMatchedData(data.data); // Use the 'data' field from the backend response
        setMessage(data.message);
        calculateRiskScore(data.data);
      } else {
        setMessage(data.error || "An error occurred.");
      }
    } catch (error) {
      setMessage("An error occurred while processing matched data.");
    }
  };

  const safeJsonParse = (value) => {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  };

  const calculateRiskScore = (data) => {
    let totalRiskScore = 0;

    data.forEach((item) => {
      const faceDetection = safeJsonParse(item.face_detection);
      const gazeDetection = safeJsonParse(item.gaze_detection);
      const multipleFaces = safeJsonParse(item.multiple_faces);
      const identityVerification = safeJsonParse(item.identity_verification);
      const livenessDetection = safeJsonParse(item.liveness_detection);
      const person = safeJsonParse(item.person);
      const electronicDevices = safeJsonParse(item.electronic_devices);
      const activity = safeJsonParse(item.activity);

      // Rule 1: Gaze detection or activity looking at screen
      if (
        !(gazeDetection?.gaze_status === "Looking at Screen" || activity?.looking_at_screen)
      ) {
        totalRiskScore += 5;
      }

      // Rule 2: Face detection
      if (faceDetection?.status !== "valid") {
        totalRiskScore += 3;
      }

      // Rule 3: Multiple faces
      if (multipleFaces?.multiple_faces !== "One Face Detected") {
        totalRiskScore += 3;
      }

      // Rule 4: Identity verification
      if (identityVerification?.identity_status !== "Same Face") {
        totalRiskScore += 3;
      }

      // Rule 5: Liveness detection
      if (livenessDetection?.liveness_status !== "Real Face Detected") {
        totalRiskScore += 3;
      }

      // Rule 6: Person detection
      if (person?.status !== "valid" || person?.message !== "One person detected.") {
        totalRiskScore += 3;
      }

      // Rule 7: Electronic devices
      if (
        electronicDevices?.status !== "valid" ||
        electronicDevices?.message !== "Only one laptop detected."
      ) {
        totalRiskScore += 2;
      }

      // Rule 8: Activity sitting
      if (!activity?.sitting) {
        totalRiskScore += 5;
      }
    });

    setRiskScore(totalRiskScore);
  };

  const isViolation = (item) => {
    const faceDetection = safeJsonParse(item.face_detection);
    const gazeDetection = safeJsonParse(item.gaze_detection);
    const multipleFaces = safeJsonParse(item.multiple_faces);
    const identityVerification = safeJsonParse(item.identity_verification);
    const livenessDetection = safeJsonParse(item.liveness_detection);
    const person = safeJsonParse(item.person);
    const electronicDevices = safeJsonParse(item.electronic_devices);
    const activity = safeJsonParse(item.activity);

    return (
      !(gazeDetection?.gaze_status === "Looking at Screen" || activity?.looking_at_screen) ||
      faceDetection?.status !== "valid" ||
      multipleFaces?.multiple_faces !== "One Face Detected" ||
      identityVerification?.identity_status !== "Same Face" ||
      livenessDetection?.liveness_status !== "Real Face Detected" ||
      person?.status !== "valid" || person?.message !== "One person detected." ||
      electronicDevices?.status !== "valid" || electronicDevices?.message !== "Only one laptop detected." ||
      !activity?.sitting
    );
  };

  const clearData = async () => {
    try {
      const response = await fetch(url + "clear-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await response.json();
      setMessage(data.message || data.error);
    } catch (error) {
      setMessage("An error occurred while clearing data.");
    }
  };

  return (
    <div>
      <h1>Data Management</h1>
      <button onClick={clearData}>Clear Data</button>
      <button onClick={processMatchedData}>Process Matched Data</button>
      <p>{message}</p>
      {riskScore !== null && <p><strong>Risk Score:</strong> {riskScore}</p>}
      {matchedData.length > 0 && (
        <div>
          <h2>Violations</h2>
          {matchedData
            .filter(isViolation)
.map((item, index) => (
            <div
key={index}
style={{
border: "1px solid red",
margin: "10px",
padding: "10px"
                }}
>
              <p><strong>Task ID:</strong> {item.task_id}</p>
              <p><strong>User ID:</strong> {item.userId}</p>
              <p><strong>Face Detection:</strong> {JSON.stringify(safeJsonParse(item.face_detection))}</p>
              <p><strong>Gaze Detection:</strong> {JSON.stringify(safeJsonParse(item.gaze_detection))}</p>
              <p><strong>Device Detection:</strong> {JSON.stringify(safeJsonParse(item.device_detection))}</p>
              <p><strong>Multiple Faces:</strong> {JSON.stringify(safeJsonParse(item.multiple_faces))}</p>
              <p><strong>Identity Verification:</strong> {JSON.stringify(safeJsonParse(item.identity_verification))}</p>
              <p><strong>Liveness Detection:</strong> {JSON.stringify(safeJsonParse(item.liveness_detection))}</p>
              <p><strong>Person:</strong> {JSON.stringify(safeJsonParse(item.person))}</p>
              <p><strong>Electronic Devices:</strong> {JSON.stringify(safeJsonParse(item.electronic_devices))}</p>
                            <p><strong>Activity:</strong> {JSON.stringify(safeJsonParse(item.activity))}</p>
              {item.results_image && (
                <div>
                  <p><strong>Results Image:</strong></p>
                  <img src={`data:image/png;base64,${item.results_image}`} alt="Results" style={{ maxWidth: "100%" }} />
                </div>
              )}
              {item.phone_image && (
                <div>
                  <p><strong>Phone Image:</strong></p>
                  <img src={`data:image/png;base64,${item.phone_image}`} alt="Phone" style={{ maxWidth: "100%" }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Calculation;
