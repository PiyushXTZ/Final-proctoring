import React, { useState, useEffect, useRef } from "react";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";

function CameraCapture() {
  const [deviceId, setDeviceId] = useState(null);
  const [userId, setUserId] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
      setIsCapturing(true);
    }
  }, []);

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      const videoDevices = devices.filter((device) => device.kind === "videoinput");
      if (videoDevices.length > 1) {
        setDeviceId(videoDevices[videoDevices.length - 1].deviceId);
      } else if (videoDevices.length === 1) {
        setDeviceId(videoDevices[0].deviceId);
      }
    });
  }, []);

  useEffect(() => {
    if (isCapturing && userId) {
      startCamera();
      captureImages();
    }
  }, [isCapturing, userId]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: deviceId ? { exact: deviceId } : undefined, facingMode: "environment" }
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  const captureImages = async () => {
    let count = 0;
    const captureInterval = setInterval(async () => {
      if (count >= 5) {
        clearInterval(captureInterval);
        return;
      }
      await captureAndUploadImage();
    }, 10000);
  };

  const captureAndUploadImage = async () => {
    try {
      const video = videoRef.current;
      if (!video) return;

      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageBase64 = canvas.toDataURL("image/jpeg");
      await storeImageBase64(userId, imageBase64);
      console.log("Image captured and stored!");
    } catch (error) {
      console.error("Error capturing image:", error);
    }
  };

  const storeImageBase64 = async (userId, imageBase64) => {
    const userDocRef = doc(db, "images", userId);
    const userDocSnap = await getDoc(userDocRef);
    let imageList = [];

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      imageList = userData.images || [];
    }

    imageList.push(imageBase64);
    await setDoc(userDocRef, { unique_id: userId, images: imageList });
    console.log(`Image stored for user ${userId}, total images: ${imageList.length}`);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (userId) {
      localStorage.setItem("userId", userId);
      setIsCapturing(true);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      {!isCapturing ? (
        <form onSubmit={handleSubmit} className="w-full max-w-md p-4 border rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Enter User ID</h2>
          <input
            type="text"
            placeholder="Enter User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full p-2 mb-4 border rounded-md"
            required
          />
          <button
            type="submit"
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-md"
          >
            Proceed
          </button>
        </form>
      ) : (
        <div className="w-full max-w-md p-4 border rounded-lg shadow-md">
          <h2 className="text-xl font-bold mb-4">Camera Capture</h2>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full rounded-md mt-4"
            style={{ width: "100%" }}
          ></video>
        </div>
      )}
    </div>
  );
}

export default CameraCapture;
