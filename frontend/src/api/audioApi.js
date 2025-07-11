// frontend/src/api/audioApi.js
import axios from "axios";

const API_BASE_URL = "/api/audio";

export const uploadAudioFile = async (formData) => {
  const config = {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  };
  const res = await axios.post(`${API_BASE_URL}/upload`, formData, config);
  return res.data;
};

export const fetchAllAudios = async () => {
  const res = await axios.get(API_BASE_URL);
  return res.data;
};

export const deleteAudioById = async (id) => {
  const res = await axios.delete(`${API_BASE_URL}/${id}`);
  return res.data;
};
