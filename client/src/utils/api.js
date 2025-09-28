import axios from './axios';

export const googleLogin = (params) => {
  return axios.post('/google/callback', params);
};

export const chat = async (content, conversationId = null) => {
  const body = { query: content };
  if (conversationId) {
    body.conversation_id = conversationId;
  }

  let user = window.localStorage.getItem('tech9gpt_user');
  user = user ? JSON.parse(user) : null;

  const headers = { 'Content-Type': 'application/json' };
  console.log('user', user);
  if (user?.token) {
    headers['Authorization'] = user.token;
  }

  return fetch(
    `${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'}/chat`,
    {
      method: 'POST',
      headers: headers,
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
  console.log('files', files);
  files.forEach((f) => formData.append('files[]', f));

  if (conversationId) formData.append('conversation_id', conversationId);

  const headers = {};
  headers['Content-Type'] = 'multipart/form-data';

  return axios
    .post('/documents', formData, { headers })
    .then((response) => response.data)
    .catch((error) => {
      console.error('Failed to upload documents:', error);
      throw error;
    });
};

export const fetchDocuments = (ids, conversationId = null) => {
  const params = {};
  if (conversationId) params.conversation_id = conversationId;

  return axios
    .get('/documents', { params })
    .then((response) => response.data)
    .catch((error) => {
      console.error('Failed to fetch documents:', error);
      throw error;
    });
};

export const updateDocumentFile = (id, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return axios
    .put(`/documents/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    .then((r) => r.data);
};

export const deleteDocument = (id) => {
  return axios
    .delete(`/documents/${id}`)
    .then((response) => response.data)
    .catch((error) => {
      console.error('Failed to delete document:', error);
      throw error;
    });
};
