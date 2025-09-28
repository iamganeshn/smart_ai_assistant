import axios from './axios';

export const googleLogin = (params) => {
  return axios.post('/google/callback', params);
};

export const chat = async (content, conversationId = null) => {
  const body = { query: content };
  if (conversationId) {
    body.conversation_id = conversationId;
  }
  
  return fetch(
    `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/chat`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );
};

export const getConversations = () => {
  return axios.get('/conversations');
};

export const getConversation = (id) => {
  return axios.get(`/conversations/${id}`);
};

export const updateConversation = (id, data) => {
  return axios.put(`/conversations/${id}`, data);
};

export const deleteConversation = (id) => {
  return axios.delete(`/conversations/${id}`);
};
