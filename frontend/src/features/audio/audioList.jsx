// frontend/src/features/audio/AudioList.jsx
import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getAudios,deleteAudio } from "../../redux/audioSlice.js";

export default function AudioList() {
  const dispatch = useDispatch();
  const { audios, loading, error } = useSelector((state) => state.audio);

  useEffect(() => {
    dispatch(getAudios());
  }, [dispatch]);

  const handleDelete = (id) => {
    dispatch(deleteAudio(id));
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <h2 className="text-2xl font-semibold text-center">Uploaded Audios</h2>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-600">{error}</p>}
      {audios.length === 0 && !loading && (
        <p className="text-gray-600 text-center">No audios found.</p>
      )}
      <ul className="space-y-3">
        {audios.map((audio) => (
          <li
            key={audio._id}
            className="flex items-center justify-between bg-gray-100 rounded-lg p-3"
          >
            <div>
              <p className="font-medium">{audio.original_filename}</p>
              <audio controls src={audio.url} />
            </div>
            <button
              onClick={() => handleDelete(audio._id)}
              className="px-3 py-1 bg-red-500 text-white rounded-lg shadow"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
