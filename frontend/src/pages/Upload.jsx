import React, { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { uploadAudio } from "../redux/audioSlice";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const instruments = [
  "Acoustic Grand Piano", "Violin", "Flute", "Clarinet",
  "Electric Guitar", "Trumpet", "Trombone", "Cello", "Xylophone",
  "Sitar", "Harmonica", "Drum Kit"
];

export default function Upload() {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.audio);

  const mediaRecorderRef = useRef(null);
  const [instrument, setInstrument] = useState("");
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const startRecording = async () => {
    if (!instrument) {
      toast.warn("Please select an instrument before recording.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      let chunks = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        chunks.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });

        if (blob.size > 5 * 1024 * 1024) {
          toast.error("Recording is too large. Please keep it under 5MB.");
          return;
        }

        setAudioBlob(blob);
        setAudioURL(URL.createObjectURL(blob));
        chunks = [];
      };

      mediaRecorderRef.current.start();
      setRecording(true);

      // Stop after 10 seconds max
      setTimeout(() => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
          mediaRecorderRef.current.stop();
          setRecording(false);
        }
      }, 10000);
    } catch (err) {
      console.error("Could not start recording:", err);
      toast.error("Failed to start recording.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!audioBlob || !instrument) {
      toast.error("Audio and instrument must be selected!");
      return;
    }

    const formData = new FormData();
    formData.append("audio", audioBlob, `recording_${Date.now()}.webm`);
    formData.append("instrument", instrument);

    setIsUploading(true);
    try {
      await dispatch(uploadAudio(formData)).unwrap();
      toast.success("Audio uploaded!! 🎉");
      setAudioBlob(null);
      setAudioURL("");
    } catch (err) {
      toast.error("Upload failed.");
      console.error(err);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6">
      <h2 className="text-2xl font-semibold text-center">🎶 Hummify Audio Upload</h2>

      {/* Instrument Selector */}
      <div className="flex flex-col space-y-2">
        <label htmlFor="instrument" className="font-medium">Choose Instrument:</label>
        <select
          id="instrument"
          value={instrument}
          onChange={(e) => setInstrument(e.target.value)}
          className="p-2 border rounded-md"
        >
          <option value="">-- Select --</option>
          {instruments.map((inst, i) => (
            <option key={i} value={inst}>{inst}</option>
          ))}
        </select>
      </div>

      {/* Recorder Button */}
      <div className="flex flex-col items-center space-y-4">
        {!recording ? (
          <button
            onClick={startRecording}
            disabled={!instrument || isUploading}
            className="px-4 py-2 bg-green-500 text-white rounded-lg shadow disabled:opacity-50"
          >
            🎤 Start Recording
          </button>
        ) : (
          <button
            onClick={stopRecording}
            className="px-4 py-2 bg-red-500 text-white rounded-lg shadow"
          >
            ⏹️ Stop Recording
          </button>
        )}

        {audioURL && (
          <audio controls src={audioURL} className="mt-4 w-full"></audio>
        )}

        {isUploading && (
          <p className="text-blue-600 font-medium">Uploading to Cloudinary...</p>
        )}

        {audioBlob && !isUploading && (
          <button
            onClick={handleUpload}
            disabled={loading}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg shadow disabled:opacity-50"
          >
            {loading ? "Uploading..." : "📤 Upload to Server"}
          </button>
        )}

        {error && <p className="text-red-600 mt-2">{error}</p>}
      </div>
    </div>
  );
}
