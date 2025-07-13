import axios from '../axios'; // This should have baseURL set to backend + withCredentials: true

// Base API path
const API_URL = '/api/saved-audios';

// Save a converted audio
const saveConvertedAudio = async (audioData) => {
  const response = await axios.post(API_URL, audioData);
  return response.data; // Expects { success, data, message }
};

// Get all saved audios for the user
const getSavedAudios = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

// Get a single saved audio by ID (optional)
const getSavedAudioById = async (audioId) => {
  const response = await axios.get(`${API_URL}/${audioId}`);
  return response.data;
};

// Update a saved audio (e.g., rename)
const updateSavedAudio = async (audioId, newAudioData) => {
  const response = await axios.put(`${API_URL}/${audioId}`, newAudioData);
  return response.data;
};

// Delete a saved audio
const deleteSavedAudio = async (audioId) => {
  const response = await axios.delete(`${API_URL}/${audioId}`);
  return response.data; // Backend should return { success, message }
};

// Export service methods
const savedAudioService = {
  saveConvertedAudio,
  getSavedAudios,
  getSavedAudioById,
  updateSavedAudio,
  deleteSavedAudio,
};

export default savedAudioService;
