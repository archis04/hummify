import axios from 'axios';

const instance = axios.create({
  baseURL: '/', // ✅ use your backend URL
  withCredentials: true,
});

export default instance;
