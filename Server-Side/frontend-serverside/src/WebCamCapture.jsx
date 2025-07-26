import React, { useRef, useState } from "react";

const WebcamCapture = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);

  // Start Webcam
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing webcam:", error);
    }
  };

  // Capture Image
  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      context.drawImage(videoRef.current, 0, 0, 640, 480);
      
      const imageDataUrl = canvasRef.current.toDataURL("image/jpeg"); // Convert to Base64
      setCapturedImage(imageDataUrl);
    }
  };

  // Send Image to Backend as JSON (Base64)
  const sendToBackend = async () => {
    if (!capturedImage) return;
    
    const uniqueInteger = 2; // Using timestamp as unique identifier

    try {
      const response = await fetch("http://localhost:5000/upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image: capturedImage, // Base64 image
          unique_id: uniqueInteger,
        }),
      });
      
      const result = await response.json();
      console.log("Server Response:", result);
    } catch (error) {
      console.error("Error sending image:", error);
    }
  };

  return (
    <div>
      <h1>Webcam Capture</h1>
      <video ref={videoRef} autoPlay width="640" height="480"></video>
      <canvas ref={canvasRef} width="640" height="480" style={{ display: "none" }}></canvas>
      <br />
      <button onClick={startWebcam}>Start Webcam</button>
      <button onClick={captureImage}>Capture</button>
      <button onClick={sendToBackend}>Send to Backend</button>
      {capturedImage && <p>Image captured! Ready to send.</p>}
    </div>
  );
};

export default WebcamCapture;

