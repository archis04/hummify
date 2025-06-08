// frontend/src/pages/Home.jsx
import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center space-y-6 bg-gradient-to-b from-blue-50 to-blue-100">
      <h1 className="text-4xl font-bold">Welcome to AudioApp</h1>
      <div className="space-x-4">
        <Link
          to="/upload"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
        >
          Record & Upload
        </Link>
        <Link
          to="/audios"
          className="px-6 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-700"
        >
          View Audios
        </Link>
      </div>
    </div>
  );
}
