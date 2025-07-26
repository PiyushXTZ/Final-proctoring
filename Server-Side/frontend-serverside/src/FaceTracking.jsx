import React, { useEffect, useRef, useState } from "react";
import * as faceapi from "face-api.js";

const FaceTracking = () => {
    // const videoRef = useRef(null);
    // const [faceDetected, setFaceDetected] = useState(false);

    // useEffect(() => {
    //     const loadModels = async () => {
    //         try {
    //             const modelURL = "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js-models@master";
                
    //             await faceapi.nets.tinyFaceDetector.loadFromUri(modelURL);
    //             await faceapi.nets.faceLandmark68Net.loadFromUri(modelURL);
    //             await faceapi.nets.faceRecognitionNet.loadFromUri(modelURL);

    //             console.log("Face-API models loaded from CDN");
    //         } catch (error) {
    //             console.error("Error loading Face-API models from CDN:", error);
    //         }
    //     };

    //     const startVideo = async () => {
    //         try {
    //             const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    //             if (videoRef.current) {
    //                 videoRef.current.srcObject = stream;
    //             }
    //         } catch (error) {
    //             console.error("Error accessing webcam:", error);
    //         }
    //     };

    //     const detectFace = async () => {
    //         if (!videoRef.current) return;
    //         try {
    //             const detections = await faceapi.detectAllFaces(
    //                 videoRef.current,
    //                 new faceapi.TinyFaceDetectorOptions()
    //             );
    //             setFaceDetected(detections.length > 0);
    //         } catch (error) {
    //             console.error("Error detecting faces:", error);
    //         }
    //     };

    //     loadModels().then(startVideo);
    //     const interval = setInterval(detectFace, 3000);

    //     return () => clearInterval(interval);
    // }, []);

    // return (
    //     <div>
    //         <video ref={videoRef} autoPlay muted width="600" height="400" />
    //         {!faceDetected && <div>No face detected!</div>}
    //     </div>
    // );
    return <></>
};

export default FaceTracking;
