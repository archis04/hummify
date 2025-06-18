import React, { useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { uploadAudio,analyzeAudio,convertAudio,resetState } from "../redux/audioSlice";
import { toast } from "react-toastify";
import axios from "axios";
import "react-toastify/dist/ReactToastify.css";

const instruments = [
  "Acoustic Grand Piano", "Violin", "Flute", "Clarinet",
  "Electric Guitar", "Trumpet", "Trombone", "Cello",
  "Xylophone", "Sitar", "Harmonica", "Drum Kit"
];

export default function Upload() {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.audio);

  const mediaRecorderRef = useRef(null);
  const [instrument, setInstrument] = useState("");
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState("");
  const [convertedAudioUrl, setConvertedAudioUrl] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

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
          toast.error("Recording too large. Keep it under 5MB.");
          return;
        }
        setAudioBlob(blob);
        setAudioURL(URL.createObjectURL(blob));
        chunks = [];
      };

      mediaRecorderRef.current.start();
      setRecording(true);

      setTimeout(() => {
        if (mediaRecorderRef.current?.state === "recording") {
          mediaRecorderRef.current.stop();
          setRecording(false);
        }
      }, 10000);
    } catch (err) {
      console.error("Recording error:", err);
      toast.error("Failed to start recording.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
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
    setConvertedAudioUrl("");
    try {
      const uploaded = await dispatch(uploadAudio(formData));
      console.log("Upload successful:", uploaded);
      console.log("data",uploaded.data);
      

      const audioUrl = uploaded.payload.url;
      console.log("Analyzing audio from:", audioUrl);

      const analyzeRes = await axios.post("http://localhost:5000/api/audio/analyze", {
        audioUrl,
      });
      console.log("analyze payload",analyzeRes.payload)
      const notes = analyzeRes.payload.notes;
      console.log("Detected notes:", notes);

      if (!notes || notes.length === 0) {
        toast.error("No notes detected.");
        return;
      }

      setIsConverting(true);
      const convertRes = await axios.post("http://localhost:5000/api/audio/convert", {
        notes,
        instrument,
      });

      console.log("Conversion result:", convertRes.payload);
      setConvertedAudioUrl(convertRes.payload.url);
      toast.success("Conversion complete 🎉");
    } catch (err) {
      console.error("Upload/conversion error:", err);
      toast.error("Something went wrong.");
    } finally {
      setIsUploading(false);
      setIsConverting(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 space-y-6">
      <h2 className="text-2xl font-semibold text-center">🎶 Hummify Upload</h2>

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

      {/* Recording Controls */}
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

        {audioURL && <audio controls src={audioURL} className="mt-4 w-full"></audio>}

        {audioBlob && !isUploading && (
          <button
            onClick={handleUpload}
            disabled={loading}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg shadow disabled:opacity-50"
          >
            {loading ? "Uploading..." : "📤 Upload to Server"}
          </button>
        )}

        {isUploading && <p className="text-blue-600 font-medium">Uploading audio...</p>}
        {isConverting && <p className="text-yellow-600 font-medium">Converting to {instrument}...</p>}

        {convertedAudioUrl && (
          <div className="mt-6 w-full">
            <h4 className="text-lg font-semibold">🎧 Final Instrumental Audio:</h4>
            <audio controls src={convertedAudioUrl} className="w-full mt-2" />
          </div>
        )}

        {error && <p className="text-red-600 mt-2">{error}</p>}
      </div>
    </div>
  );
}
