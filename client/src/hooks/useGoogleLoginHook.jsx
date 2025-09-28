import { useGoogleLogin } from '@react-oauth/google';
import { useAuth } from './useAuth';
import * as API from '../utils/api';

export const useGoogleLoginHook = (
  redirectUri,
  handleBackdropClose,
  handleBackdropOpen,
  onSuccess,
  onError
) => {
  // Success handler for Google login
  const { login } = useAuth();

  const handleLoginSuccess = async (result) => {
    try {
      const { code } = result; // Authorization code returned by Google OAuth
      handleBackdropOpen();
      const response = await API.googleLogin({
        code,
        redirect_uri: redirectUri,
      });

      if (onSuccess) {
        const userInfo = {
          token: response.headers?.authorization,
          ...response.data?.user,
        };
        console.log('response.headers', response.headers);
        login(userInfo);

        handleBackdropClose();
        onSuccess(userInfo);
      }
    } catch (error) {
      console.error('Error during Google login:', error);
      handleLoginError(error?.response?.data?.error || error);
    }
  };

  // Error handler for Google login
  const handleLoginError = (error) => {
    if (onError) {
      handleBackdropClose();
      onError(error);
    }
  };

  // Trigger Google login flow
  const googleLogin = useGoogleLogin({
    onSuccess: handleLoginSuccess,
    onError: handleLoginError,
    redirect_uri: redirectUri,
    flow: 'auth-code', // Use authorization code flow
  });

  // Return the login function from the hook
  return { googleLogin };
};
