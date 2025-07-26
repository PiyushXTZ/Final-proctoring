import React, { useEffect, useState, useRef } from "react";

const VoiceDetection = () => {
    const [transcript, setTranscript] = useState("");
    const [error, setError] = useState(null);
    const recognitionRef = useRef(null); // Store recognition instance

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setError("SpeechRecognition API is not supported in this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true; // Keep listening continuously
        recognition.interimResults = true; // Get real-time results
        recognition.lang = "en-US";
        recognitionRef.current = recognition; // Store reference

        // Handle speech results
        recognition.onresult = (event) => {
            let latestTranscript = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
                latestTranscript += event.results[i][0].transcript + " ";
            }
            setTranscript(latestTranscript.trim());
        };

        // Handle errors
        recognition.onerror = (event) => {
            console.error("Speech recognition error:", event.error);
            setError(`Error: ${event.error}`);
            if (event.error === "network") {
                setError("Network error. Please check your internet connection.");
            }
        };

        // Restart recognition when it stops
        recognition.onend = () => {
            console.warn("Speech recognition stopped. Restarting in 1 second...");
            setTimeout(() => {
                if (recognitionRef.current) {
                    recognitionRef.current.start(); // Restart recognition after a delay
                }
            }, 1000);
        };

        recognition.start(); // Start listening

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop(); // Cleanup when component unmounts
            }
        };
    }, []);

    return (
        <div>
            <h3>🎤 Listening for Speech...</h3>
            {error && <p style={{ color: "red" }}>{error}</p>}
            {transcript && <p><strong>Detected Speech:</strong> {transcript}</p>}
        </div>
    );
};

export default VoiceDetection;



// import React, { useEffect } from "react";

// const VoiceDetection = () => {
//     useEffect(() => {
//         const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

//         if (!SpeechRecognition) {
//             console.error("SpeechRecognition API is not supported in this browser.");
//             return;
//         }

//         const recognition = new SpeechRecognition();
//         recognition.continuous = true;

//         recognition.onresult = (event) => {
//             console.log("Speech detected:", event.results[0][0].transcript);
//         };

//         recognition.onerror = (event) => {
//             if (event.error === "no-speech") {
//                 console.warn("No speech detected. Please try speaking again.");
//             } else {
//                 console.error("Speech recognition error:", event.error);
//             }
//         };

//         recognition.start();

//         return () => recognition.stop();
//     }, []);

//     return <h3>Listening for Speech...</h3>;
// };

// export default VoiceDetection;
