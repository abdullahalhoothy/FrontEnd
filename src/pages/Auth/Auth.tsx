import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { HttpReq } from '../../services/apiService';
import { useEffect, useState } from 'react';
import urls from '../../urls.json';
import { AuthResponse } from '../../types/allTypesAndInterfaces';
import styles from './Auth.module.css';
import { FaEnvelope, FaLock, FaUser } from 'react-icons/fa';

const Auth = () => {
  const nav = useNavigate();
  const { isAuthenticated, setAuthResponse } = useAuth();

  // RENDER STATE
  const [isLogin, setIsLogin] = useState(true);
  const [isPasswordReset, setIsPasswordReset] = useState(false);

  // INPUT
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setName] = useState('');

  // MESSAGES
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [requestId, setRequestId] = useState<string>('');
  const [error, setError] = useState<Error | null>(null);

  const [isRegistered, setIsRegistered] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const handleLogin = async (email: string, password: string) => {
    await HttpReq(
      urls.login,
      data => {
        console.log('Logged In');
        if (!('idToken' in (data as any))) {
          setError(new Error('Login Error'));
          return;
        }
        setAuthResponse(data as AuthResponse);
        setTimeout(() => {
          nav('/');
        }, 100);
      },
      () => {},
      () => {},
      () => {},
      e => {
        if (e.response?.status === 401) {
          setIsAuthorized(false);
          setAuthMessage(e.response.data.detail || 'Unauthorized access');
        } else {
          setError(e);
        }
      },
      'post',
      { email, password }
    );
  };

  const handleRegistration = async (email: string, password: string, username: string) => {
    await HttpReq(
      urls.create_user_profile,
      (data: any) => {
        if (Array.isArray(data) && data.length > 0) {
          const userProfileResponse = data[0];

          if (userProfileResponse?.data?.user_id) {
            setAuthResponse({
              localId: userProfileResponse.data.user_id,
              email: email,
              displayName: username,
            } as AuthResponse);
            setAuthMessage(
              'Registration successful! Please check your email to verify your account.'
            );
            setIsRegistered(true);
          } else {
            setError(new Error('Invalid registration response'));
            setAuthMessage('Registration failed. Please try again.');
          }
        } else if (data?.detail) {
          setError(new Error(data.detail));
          setAuthMessage(data.detail);
        } else {
          setError(new Error('Registration failed - invalid response format'));
          setAuthMessage('Registration failed. Please try again.');
        }
      },
      () => {},
      setRequestId,
      setIsLoading,
      (error: any) => {
        if (!error) return;
        if (error.response?.data?.detail) {
          setError(new Error(error.response.data.detail));
          setAuthMessage(error.response.data.detail);
        }
      },
      'post',
      { email, password, username }
    );
  };

  useEffect(() => {
    if (isRegistered && !error) {
      setIsLogin(true);
      setTimeout(() => {
        setAuthMessage(null);
        setIsRegistered(false);
      }, 5000);
    }
  }, [isRegistered]);

  const handlePasswordReset = async (email: string) => {
    await HttpReq(
      urls.reset_password,
      setAuthResponse,
      setAuthMessage,
      setRequestId,
      setIsLoading,
      setError,
      'post',
      { email }
    );

    if (!error) {
      setAuthMessage('Password reset email sent. Please check your inbox.');
      setIsPasswordReset(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthMessage(null);
    setError(null);

    if (isPasswordReset) {
      await handlePasswordReset(email);
    } else if (isLogin) {
      await handleLogin(email, password);
    } else {
      await handleRegistration(email, password, username);
    }
  };

  useEffect(() => {
    if (isAuthenticated) nav('/');
  }, []);

  const renderForm = () => {
    if (isPasswordReset) {
      return (
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div className={styles.inputGroup}>
            <FaEnvelope className={styles.icon} />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className={styles.authInput}
            />
          </div>
          <button type="submit" className={styles.authButton} disabled={isLoading}>
            Reset Password
          </button>
        </form>
      );
    }

    return (
      <form onSubmit={handleSubmit} className="flex flex-col">
        {!isLogin && (
          <div className="flex items-center mb-4 bg-[#f0f8f0] rounded-md">
            <FaUser className="text-[#006400] ml-3" />
            <input
              type="text"
              placeholder="Name"
              value={username}
              onChange={e => setName(e.target.value)}
              required
              className="flex-1 px-3 py-2 text-lg bg-transparent outline-none"
            />
          </div>
        )}
        <div className={styles.inputGroup}>
          <FaEnvelope className={styles.icon} />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className={styles.authInput}
          />
        </div>
        <div className={styles.inputGroup}>
          <FaLock className={styles.icon} />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className={styles.authInput}
          />
        </div>
        <button
          type="submit"
          className="px-4 py-3 text-lg text-white bg-[#155315] rounded-md hover:bg-[#1a651a] disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={isLoading}
        >
          {isLogin ? 'Login' : 'Register'}
        </button>
      </form>
    );
  };

  return (
    <div className="w-full h-full lg:border-l">
      <div className="flex items-center justify-center h-screen bg-[#115740]">
        <div className="bg-white p-10 rounded-lg shadow-lg w-full max-w-md">
          <h2 className="text-2xl text-[#006400] mb-5 text-center">
            {isPasswordReset ? 'Reset Password' : isLogin ? 'Login' : 'Register'}
          </h2>
          {!!authMessage && (
            <p className={`mb-4 text-center ${isRegistered ? 'text-green-600' : 'text-red-500'}`}>
              {authMessage}
            </p>
          )}
          {renderForm()}
          <div className="flex justify-between mt-4">
            <button
              onClick={() => {
                if (isLogin) {
                  nav('/sign-up');
                } else {
                  setIsLogin(true);
                  setIsPasswordReset(false);
                }
              }}
              className="text-[#006400] text-sm hover:underline"
            >
              {isLogin ? 'Need to register?' : 'Already have an account?'}
            </button>
            {isLogin && (
              <button
                onClick={() => setIsPasswordReset(!isPasswordReset)}
                className="text-[#006400] text-sm hover:underline"
              >
                {isPasswordReset ? 'Back to Login' : 'Forgot Password?'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
