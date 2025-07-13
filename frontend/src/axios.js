import axios from 'axios';

const instance = axios.create({
  baseURL: 'https://hummify-backend.onrender.com', // ✅ use your backend URL
  withCredentials: true,
});

export default instance;
