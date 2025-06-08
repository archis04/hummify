// frontend/src/pages/Upload.jsx
import React, { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { uploadAudio } from "../redux/audioSlice";

export default function Upload() {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.audio);

  const mediaRecorderRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState("");

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      let chunks = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        setAudioBlob(blob);
        setAudioURL(URL.createObjectURL(blob));
        chunks = [];
      };

      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (err) {
      console.error("Could not start recording:", err);
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setRecording(false);
  };

  const handleUpload = (e) => {
    // Prevent any default navigation or form‐submission
    e.preventDefault();

    if (!audioBlob) return;
    console.log(audioBlob);
    const formData = new FormData();
    // “audio” must exactly match the field name multer expects
    formData.append("audio", audioBlob, `recording_${Date.now()}.webm`);
    console.log(formData);
    dispatch(uploadAudio(formData));
  };

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6">
      <h2 className="text-2xl font-semibold text-center">Record & Upload Audio</h2>

      <div className="flex flex-col items-center space-y-4">
        {!recording ? (
          <button
            onClick={startRecording}
            className="px-4 py-2 bg-green-500 text-white rounded-lg shadow"
          >
            Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="px-4 py-2 bg-red-500 text-white rounded-lg shadow"
          >
            Stop Recording
          </button>
        )}

        {audioURL && (
          <audio controls src={audioURL} className="mt-4 w-full"></audio>
        )}

        {audioBlob && (
          // Note: There is NO action="/api/audio/upload" here
          <button
            onClick={handleUpload}
            disabled={loading}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg shadow disabled:opacity-50"
          >
            {loading ? "Uploading..." : "Upload to Server"}
          </button>
        )}

        {error && <p className="text-red-600 mt-2">{error}</p>}
      </div>
    </div>
  );
}
