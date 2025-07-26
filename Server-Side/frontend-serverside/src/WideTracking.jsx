import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebaseConfig"; // Ensure Firebase is properly configured

const WideTracking = () => {
    let userId="fff112";
    const canvasRef = useRef(null);
    const [currentImage, setCurrentImage] = useState(null);
    const [fetching, setFetching] = useState(false);
    const resultRef = useRef({
        person: "Waiting...",
        electronic_devices: "Waiting...",
        notebook: "Waiting...",
        activity: "Waiting..."
    });

    useEffect(() => {
        const interval = setInterval(() => {
            fetchAndProcessImage();
        }, 5000); // Process every 5 sec

        return () => clearInterval(interval);
    }, []);

    const fetchAndProcessImage = async () => {
        if (fetching || !userId) return;
        setFetching(true);

        try {
            const userDocRef = doc(db, "images", userId);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
                const userData = userDocSnap.data();
                const imageList = userData.images || [];

                if (imageList.length === 0) {
                    console.log("No images available.");
                    setFetching(false);
                    return;
                }

                // Get the first image
                const base64Image = imageList[0];
                setCurrentImage(base64Image);

                // Convert Base64 to Blob
                const blob = base64toBlob(base64Image, "image/jpeg");

                // Draw image on canvas (optional)
                if (canvasRef.current) {
                    const canvas = canvasRef.current;
                    const ctx = canvas.getContext("2d");
                    const img = new Image();
                    img.src = base64Image;
                    img.onload = () => ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                }

                // Process the image
                await sendImageToBackend(blob);

                // Remove the processed image from Firestore
                await deleteProcessedImage(imageList);
            }
        } catch (error) {
            console.error("Error fetching image:", error);
        } finally {
            setFetching(false);
        }
    };

    const deleteProcessedImage = async (imageList) => {
        if (!userId) return;

        try {
            const userDocRef = doc(db, "images", userId);
            imageList.shift(); // Remove first image

            await updateDoc(userDocRef, { images: imageList });
            console.log("Deleted processed image, remaining:", imageList.length);
        } catch (error) {
            console.error("Error deleting image:", error);
        }
    };

    const sendImageToBackend = async (blob) => {
        const formData = new FormData();
        formData.append("image", blob, "frame.jpg");

        try {
            const response = await axios.post("http://127.0.0.1:5000/analyze", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            if (response.data.status === "queued") {
                fetchResult(response.data.task_id);
            }
        } catch (error) {
            console.error("Error sending image:", error.message);
        }
    };

    const fetchResult = async (taskId) => {
        try {
            const resultResponse = await axios.get(`http://127.0.0.1:5000/result/${taskId}`);

            if (resultResponse.data.status === "processing") {
                setTimeout(() => fetchResult(taskId), 2000); // Poll every 2 sec
            } else {
                resultRef.current = {
                    person: resultResponse.data.person || "Unknown",
                    electronic_devices: resultResponse.data.electronic_devices || "Unknown",
                    notebook: resultResponse.data.notebook || "Unknown",
                    activity: resultResponse.data.activity || "Unknown",
                };
                console.log("Result from server:", resultRef.current);
            }
        } catch (error) {
            console.error("Error fetching result:", error);
        }
    };

    const base64toBlob = (base64, mimeType) => {
        const byteCharacters = atob(base64.split(",")[1]);
        const byteNumbers = new Array(byteCharacters.length).fill(null).map((_, i) => byteCharacters.charCodeAt(i));
        const byteArray = new Uint8Array(byteNumbers);
        return new Blob([byteArray], { type: mimeType });
    };

    return (
        <div className="flex flex-col items-center p-5">
            <h1 className="text-2xl font-bold mb-4">Work Environment Monitoring</h1>
            <canvas ref={canvasRef} width="640" height="480" hidden />
            <div className="mt-4 p-4 border rounded bg-gray-100">
                <p><strong>Person Detection:</strong> {resultRef.current.person}</p>
                <p><strong>Electronic Devices:</strong> {resultRef.current.electronic_devices}</p>
                <p><strong>Notebook Detection:</strong> {resultRef.current.notebook}</p>
                <p><strong>Activity Recognition:</strong> {resultRef.current.activity}</p>
            </div>
        </div>
    );
};

export default WideTracking;




//Below Code IMP
// import React, { useEffect, useRef } from "react";
// import axios from "axios";

// const WideTracking = () => {
//     const videoRef = useRef(null);
//     const canvasRef = useRef(null);
//     const resultRef = useRef({
//         person: "Waiting...",
//         electronic_devices: "Waiting...",
//         notebook: "Waiting...",
//         activity: "Waiting..."
//     });

//     useEffect(() => {
//         const startCamera = async () => {
//             try {
//                 const stream = await navigator.mediaDevices.getUserMedia({ video: true });
//                 if (videoRef.current) {
//                     videoRef.current.srcObject = stream;
//                 }
//             } catch (error) {
//                 console.error("Error accessing webcam:", error);
//             }
//         };

//         startCamera();

//         // Send a new frame every 20 seconds
//         const interval = setInterval(() => {
//             captureFrame();
//         }, 5000); // 20 sec interval

//         return () => clearInterval(interval);
//     }, []);

//     const captureFrame = async () => {
//         if (!videoRef.current || !canvasRef.current) return;

//         const canvas = canvasRef.current;
//         const context = canvas.getContext("2d");
//         context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

//         canvas.toBlob(async (blob) => {
//             const formData = new FormData();
//             formData.append("image", blob, "frame.jpg");

//             try {
//                 const response = await axios.post("http://127.0.0.1:5000/analyze", formData, {
//                     headers: { "Content-Type": "multipart/form-data" },
//                 });

//                 if (response.data.status === "queued") {
//                     fetchResult(response.data.task_id);
//                 }
//             } catch (error) {
//                 console.error("Error sending frame:", error.message);
//             }
//         }, "image/jpeg");
//     };

//     const fetchResult = async (taskId) => {
//         try {
//             const resultResponse = await axios.get(`http://127.0.0.1:5000/result/${taskId}`);

//             if (resultResponse.data.status === "processing") {
//                 setTimeout(() => fetchResult(taskId), 2000); // Poll every 2 sec
//             } else {
//                 resultRef.current = {
//                     person: resultResponse.data.person || "Unknown",
//                     electronic_devices: resultResponse.data.electronic_devices || "Unknown",
//                     notebook: resultResponse.data.notebook || "Unknown",
//                     activity: resultResponse.data.activity || "Unknown",
//                 };
//                 console.log("Result from server:", resultRef.current);
//             }
//         } catch (error) {
//             console.error("Error fetching result:", error);
//         }
//     };

//     return (
//         <div className="flex flex-col items-center p-5">
//             <h1 className="text-2xl font-bold mb-4">Work Environment Monitoring</h1>
//             <video ref={videoRef} autoPlay playsInline className="w-80 h-60 border" />
//             <canvas ref={canvasRef} width="640" height="480" hidden />
//             <div className="mt-4 p-4 border rounded bg-gray-100">
//                 <p><strong>Person Detection:</strong> {resultRef.current.person}</p>
//                 <p><strong>Electronic Devices:</strong> {resultRef.current.electronic_devices}</p>
//                 <p><strong>Notebook Detection:</strong> {resultRef.current.notebook}</p>
//                 <p><strong>Activity Recognition:</strong> {resultRef.current.activity}</p>
//             </div>
//         </div>
//     );
// };

// export default WideTracking;




// import React, { useEffect, useRef } from "react";
// import axios from "axios";

// const WideTracking = () => {
//     const videoRef = useRef(null);
//     const canvasRef = useRef(null);
//     const resultRef = useRef({
//         person: "Waiting...",
//         electronic_devices: "Waiting...",
//         notebook: "Waiting...",
//         activity: "Waiting..."
//     });

//     useEffect(() => {
//         const startCamera = async () => {
//             try {
//                 const stream = await navigator.mediaDevices.getUserMedia({ video: true });
//                 if (videoRef.current) {
//                     videoRef.current.srcObject = stream;
//                 }
//             } catch (error) {
//                 console.error("Error accessing webcam:", error);
//             }
//         };

//         startCamera();
//         const interval = setInterval(captureFrame, 50000); // Capture every 10 seconds
//         return () => clearInterval(interval);
//     }, []);

//     const captureFrame = async () => {
//         if (!videoRef.current || !canvasRef.current) return;

//         const canvas = canvasRef.current;
//         const context = canvas.getContext("2d");
//         context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

//         canvas.toBlob(async (blob) => {
//             const formData = new FormData();
//             formData.append("image", blob, "frame.jpg");

//             try {
//                 const response = await axios.post("http://127.0.0.1:5000/analyze", formData, {
//                     headers: { "Content-Type": "multipart/form-data" },
//                 });

//                 if (response.data.status === "queued") {
//                     fetchResult(response.data.task_id);
//                 }
//             } catch (error) {
//                 console.error("Error sending frame:", error.message);
//             }
//         }, "image/jpeg");
//     };

//     const fetchResult = async (taskId) => {
//         try {
//             const resultResponse = await axios.get(`http://127.0.0.1:5000/result/${taskId}`);

//             if (resultResponse.data.status === "processing") {
//                 setTimeout(() => fetchResult(taskId), 2000); // Poll every 2 sec
//             } else {
//                 resultRef.current = {
//                     person: resultResponse.data.person || "Unknown",
//                     electronic_devices: resultResponse.data.electronic_devices || "Unknown",
//                     notebook: resultResponse.data.notebook || "Unknown",
//                     activity: resultResponse.data.activity || "Unknown",
//                 };

//                 console.log("Result from server:", resultRef.current);

//                 // Update UI manually
//                 // document.getElementById("person").innerText = resultRef.current.person;
//                 // document.getElementById("electronic_devices").innerText = resultRef.current.electronic_devices;
//                 // document.getElementById("notebook").innerText = resultRef.current.notebook;
//                 // document.getElementById("activity").innerText = resultRef.current.activity;
//             }
//         } catch (error) {
//             console.error("Error fetching result:", error);
//         }
//     };

//     return (
//         <div className="flex flex-col items-center p-5">
//             <h1 className="text-2xl font-bold mb-4">Work Environment Monitoring</h1>
//             <video ref={videoRef} autoPlay playsInline className="w-80 h-60 border" />
//             <canvas ref={canvasRef} width="640" height="480" hidden />
//             <div className="mt-4 p-4 border rounded bg-gray-100">
//                 <p><strong>Person Detection:</strong> <span id="person">{resultRef.current.person}</span></p>
//                 <p><strong>Electronic Devices:</strong> <span id="electronic_devices">{resultRef.current.electronic_devices}</span></p>
//                 <p><strong>Notebook Detection:</strong> <span id="notebook">{resultRef.current.notebook}</span></p>
//                 <p><strong>Activity Recognition:</strong> <span id="activity">{resultRef.current.activity}</span></p>
//             </div>
//         </div>
//     );
// };

// export default WideTracking;