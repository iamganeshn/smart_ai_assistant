import axios from './axios';

export const googleLogin = (params) => {
  return axios.post('/google/callback', params);
};

export const chat = async (content) => {
  return fetch(
    `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/chat`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: content }),
    }
  );
};
