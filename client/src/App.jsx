import './App.css';
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from 'react-router-dom';
import { Backdrop, CircularProgress } from '@mui/material';

import { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LoginScreen } from './components/LoginScreen';
import ChatScreen from './components/ChatScreen';
import { DocumentUploadScreen } from './components/DocumentUploadScreen';
import { EmployeeProjectScreen } from './components/EmployeeProjectScreen';
import Notification from './utils/Notification';

import AppLayout from './AppLayout';
import { ConversationProvider } from './contexts/ConversationContext';

import { useGoogleLoginHook } from './hooks/useGoogleLoginHook';
import { useAuth } from './hooks/useAuth';

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
  const location = useLocation();
  const { user, logout } = useAuth();
  const [openBackdrop, setOpenBackdrop] = useState(false);
  const [alert, setAlert] = useState({
    message: location.state?.alert?.message,
    type: location.state?.alert?.type,
  });

  const navigate = useNavigate();

  const handleBackdropClose = () => {
    setOpenBackdrop(false);
  };
  const handleBackdropOpen = () => {
    setOpenBackdrop(true);
  };
  const { googleLogin } = useGoogleLoginHook(
    `${window.location.origin}`,
    handleBackdropClose,
    handleBackdropOpen,
    (userInfo) => {
      navigate('/', {
        state: {
          alert: {
            message: 'Login successful — welcome back!.',
            type: 'success',
          },
        },
      });
    },
    (error) => {
      console.error('Login failed:', error);
      setAlert({ message: error, type: 'error' });
    }
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Notification alert={alert} setAlert={setAlert} />

      {!user ? (
        <LoginScreen
          onLogin={() => {
            handleBackdropOpen();
            googleLogin();
          }}
        />
      ) : (
        <ConversationProvider>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Navigate to="/chat" />} />
              <Route
                path="/chat"
                element={<ChatScreen onLogout={() => logout()} />}
              />
              <Route
                path="/chat/:conversationId"
                element={<ChatScreen onLogout={() => logout()} />}
              />
              <Route
                path="/sign_in"
                element={
                  <LoginScreen
                    onLogin={() => {
                      handleBackdropOpen();
                      googleLogin();
                    }}
                  />
                }
              />
              {user.role === 'admin' && (
                <>
                  <Route path="/documents" element={<DocumentUploadScreen />} />
                  <Route
                    path="/employees"
                    element={<EmployeeProjectScreen />}
                  />
                </>
              )}
              <Route path="*" element={<Navigate to="/chat" />} />
            </Routes>
          </AppLayout>
        </ConversationProvider>
      )}
      <Backdrop
        sx={(theme) => ({
          color: '#fff',
          zIndex: theme.zIndex.drawer + 1,
        })}
        open={openBackdrop}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
    </ThemeProvider>
  );
}
