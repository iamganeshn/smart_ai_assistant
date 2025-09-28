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

export const createConversation = (title = 'New Conversation') => {
  return axios.post('/conversations', { title });
};

export const updateConversation = (id, data) => {
  return axios.put(`/conversations/${id}`, data);
};

export const deleteConversation = (id) => {
  return axios.delete(`/conversations/${id}`);
};

export const uploadDocuments = (files, conversationId = null) => {
  const formData = new FormData();
  files.forEach((f) => formData.append('files[]', f));
  if (conversationId) formData.append('conversation_id', conversationId);
  return fetch(
    `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/documents`,
    {
      method: 'POST',
      body: formData,
    }
  ).then((r) => r.json());
};

export const fetchDocuments = (ids, conversationId = null) => {
  const params = new URLSearchParams();
  if (conversationId) params.append('conversation_id', conversationId);
  return fetch(
    `${
      import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'
    }/documents?${params.toString()}`
  ).then((r) => r.json());
};

export const deleteDocument = (id) => {
  return fetch(
    `${
      import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'
    }/documents/${id}`,
    { method: 'DELETE' }
  ).then(async (r) => {
    if (!r.ok) throw new Error('Failed to delete document');
    return r.json().catch(() => ({}));
  });
};
