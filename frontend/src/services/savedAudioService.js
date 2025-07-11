// src/services/savedAudioService.js
// Helper function to extract error message from an HTTP response (similar to your audioSlice)
const getErrorMessage = async (response) => {
  try {
    const errorData = await response.json();
    return errorData.message || errorData.error || response.statusText || 'An unknown error occurred.';
  } catch (e) {
    return response.statusText || 'An unknown error occurred.';
  }
};

// Get user token from local storage
const getToken = () => {
  return localStorage.getItem('token');
  return token ? token : null;
};

const API_URL = '/api/saved-audios'; // Let Vite handle proxy


// --- API Calls ---

// Save a converted audio
const saveConvertedAudio = async (audioData) => {
  const token = getToken();
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(audioData),
  });

  if (!response.ok) {
    const errorMessage = await getErrorMessage(response);
    throw new Error(errorMessage);
  }

  return await response.json();
};

// Get all saved audios for the user
const getSavedAudios = async () => {
  const token = getToken();
  const response = await fetch(API_URL, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorMessage = await getErrorMessage(response);
    throw new Error(errorMessage);
  }

  return await response.json();
};

// Get a single saved audio by ID (optional, but good to have)
const getSavedAudioById = async (audioId) => {
  const token = getToken();
  const response = await fetch(`${API_URL}/${audioId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorMessage = await getErrorMessage(response);
    throw new Error(errorMessage);
  }

  return await response.json();
};

// Update a saved audio (e.g., rename)
const updateSavedAudio = async (audioId, newAudioData) => {
  const token = getToken();
  const response = await fetch(`${API_URL}/${audioId}`, {
    method: 'PUT', // Or PATCH depending on your backend
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(newAudioData),
  });

  if (!response.ok) {
    const errorMessage = await getErrorMessage(response);
    throw new Error(errorMessage);
  }

  return await response.json();
};

// Delete a saved audio
const deleteSavedAudio = async (audioId) => {
  const token = getToken();
  const response = await fetch(`${API_URL}/${audioId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorMessage = await getErrorMessage(response);
    throw new Error(errorMessage);
  }

  return await response.json(); // Backend might return a success message
};

const savedAudioService = {
  saveConvertedAudio,
  getSavedAudios,
  getSavedAudioById,
  updateSavedAudio,
  deleteSavedAudio,
};

export default savedAudioService;