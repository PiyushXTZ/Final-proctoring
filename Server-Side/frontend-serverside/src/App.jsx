import React from "react";
import FaceTracking from "./FaceTracking";
// import EyeTracking from "./EyeTracking";
import VoiceDetection from "./VoiceDetection";
import EyeBallTrack from "./EyeBallTrack";
import WideTracking from "./WideTracking";
import WebcamCapture from "./WebCamCapture";
import QRGenerator from "./QrGen";
function App() {
    return (
        <div>
            {/* <QRGenerator /> */}
            <h2>AI-Based Proctoring</h2>
            {/* <FaceTracking /> */}
            {/* <EyeTracking /> */}
            {/* <VoiceDetection /> */}
            <EyeBallTrack />
            {/* <CameraCapture /> */}
            {/* <WebcamCapture /> */}
            {/* <QRGenerator /> */}
            {/* <WideTracking /> */}
        </div>
    );
}

export default App;

