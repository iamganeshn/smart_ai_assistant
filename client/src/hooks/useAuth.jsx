// src/hooks/useAuth.jsx

import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from './useLocalStorage';
import * as API from '../utils/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useLocalStorage('tech9gpt_user', null);
  const navigate = useNavigate();

  // call this function when you want to authenticate the user
  const login = async (data) => {
    setUser(data);
    let redirect_url = window.localStorage.getItem(
      'tech9gpt_after_login_redirect_url'
    );
    if (redirect_url) {
      navigate(redirect_url, { replace: true });
      window.localStorage.removeItem('tech9gpt_after_login_redirect_url');
    }
  };

  // call this function to sign out logged in user
  const logout = () => {
    setUser(null);
    navigate('/', { replace: true });
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
