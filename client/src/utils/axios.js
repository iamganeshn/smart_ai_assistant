import axios from 'axios';

// Create axios instance
const instance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add a request interceptor to dynamically add the Authorization token
instance.interceptors.request.use(
  (config) => {
    // Get user data from localStorage
    let user = window.localStorage.getItem('tech9gpt_user');
    user = user ? JSON.parse(user) : null;

    // If a token exists, add it to the request headers
    if (user?.token) {
      config.headers['Authorization'] = user.token;
    }
    return config;
  },
  (error) => {
    // Do something with request error
    return Promise.reject(error);
  }
);

instance.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('Error in axios :', error.status);
    if (error.status == 401 && window.location.pathname !== '/sign_in') {
      localStorage.removeItem('tech9gpt_user');
      window.location.href = '/sign_in';
    }
    return Promise.reject(error);
  }
);

export default instance;
