// frontend/src/App.jsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Upload from "./pages/Upload";
import AudioList from "./features/Audio/audioList";

export default function App() {
  return (
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/upload" element={<Upload />} />
        <Route path="/audios" element={<AudioList />} />
      </Routes>
  );
}
