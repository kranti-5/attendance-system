import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";

export default function AttendanceScreen() {
  const webcamRef = useRef(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [captureTime, setCaptureTime] = useState("");
  const [faceDetected, setFaceDetected] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // Load face-api.js models
  useEffect(() => {
    const loadModels = async () => {
      if (window.faceapi) {
        try {
          await window.faceapi.nets.tinyFaceDetector.loadFromUri("/models");
          setModelsLoaded(true);
        } catch (error) {
          console.error("Model loading failed:", error);
        }
      } else {
        console.warn("face-api.js not found in window.");
      }
    };
    loadModels();
  }, []);

  // Scan face in the captured image
  const scanFace = async (imageSrc) => {
    setScanning(true);
    if (window.faceapi && modelsLoaded) {
      const img = document.createElement("img");
      img.src = imageSrc;
      img.onload = async () => {
        const detections = await window.faceapi.detectAllFaces(img, new window.faceapi.TinyFaceDetectorOptions());
        setFaceDetected(detections.length > 0);
        setScanning(false);
      };
    } else {
      console.error("Models not loaded.");
      setScanning(false);
    }
  };

  const handleCapture = async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setCapturedPhoto(imageSrc);
    setCaptureTime(new Date().toLocaleTimeString());
    setShowCamera(false);
    setFaceDetected(false);
    scanFace(imageSrc);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 40 }}>
      <h2>Attendance (Face Recognition)</h2>
      {showCamera ? (
        <>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            width={320}
            height={240}
          />
          <button style={styles.button} onClick={handleCapture}>Capture</button>
        </>
      ) : (
        <>
          {capturedPhoto ? (
            <>
              <img
                src={capturedPhoto}
                alt="Captured"
                width={320}
                height={240}
                style={{ borderRadius: 8, marginBottom: 8 }}
              />
              <div style={{ color: faceDetected ? "green" : "red", marginBottom: 10 }}>
                {scanning
                  ? "🔍 Scanning for face..."
                  : faceDetected
                  ? "✅ Face detected"
                  : "❌ No face detected"}
              </div>
              <div style={{ color: "green", marginBottom: 10 }}>Captured at: {captureTime}</div>
            </>
          ) : (
            <div style={styles.placeholder}>
              <span style={{ color: "#888" }}>No photo captured</span>
            </div>
          )}
          <button style={styles.button} onClick={() => setShowCamera(true)}>Open Camera</button>
        </>
      )}

      <div style={styles.attendanceBox}>
        <div style={{ fontWeight: "bold", color: "#1976d2", marginBottom: 4 }}>🗓️ Today's Attendance</div>
        <div>Check-in: 09:15 AM</div>
        <div>Check-out: 06:00 PM</div>
        <div>Status: Present</div>
      </div>
    </div>
  );
}

const styles = {
  button: {
    marginTop: 16,
    marginBottom: 16,
    padding: "10px 20px",
    fontSize: 16,
    backgroundColor: "#1976d2",
    color: "#fff",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },
  placeholder: {
    width: 320,
    height: 240,
    background: "#eee",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  attendanceBox: {
    marginTop: 24,
    textAlign: "center",
    border: "1px solid #ccc",
    borderRadius: 8,
    padding: 10,
    backgroundColor: "#f9f9f9",
    width: 300,
  },
};
