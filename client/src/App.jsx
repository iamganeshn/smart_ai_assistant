import './App.css';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';

import { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LoginScreen } from './components/LoginScreen';
import { ChatScreen } from './components/ChatScreen';
import { DocumentUploadScreen } from './components/DocumentUploadScreen';
import { EmployeeProjectScreen } from './components/EmployeeProjectScreen';
import AppLayout from './AppLayout';

const theme = createTheme({
  palette: {
    primary: {
      main: '#0b60b0ff',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#f8fafc',
      contrastText: '#1a1a1a',
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff',
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#fefefeff',
    },
    divider: '#e2e8f0',
    grey: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        {!isLoggedIn ? (
          <LoginScreen onLogin={() => setIsLoggedIn(true)} />
        ) : (
          <AppLayout>
            <Routes>
              <Route
                path="/chat"
                element={
                  <ChatScreen
                    // Todo: change isAdmin based on actual user role
                    isAdmin={true}
                    onLogout={() => setIsLoggedIn(false)}
                  />
                }
              />
              <Route path="/documents" element={<DocumentUploadScreen />} />
              <Route path="/employees" element={<EmployeeProjectScreen />} />
              <Route path="*" element={<Navigate to="/chat" />} />
            </Routes>
          </AppLayout>
        )}
      </Router>
    </ThemeProvider>
  );
}
