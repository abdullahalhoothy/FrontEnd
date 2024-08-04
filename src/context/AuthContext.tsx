import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { AuthContextType, User, AuthResponse, AuthSuccessResponse} from '../types/allTypesAndInterfaces';
import { HttpReq } from '../services/apiService'; // Import the HttpReq function

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
    const [authResponse, setAuthResponse] = useState<AuthResponse>(null);

    const refreshToken = useCallback(async (expiredAuthResponse: AuthSuccessResponse) => {
      try {
        await HttpReq<AuthSuccessResponse>(
          "/refresh_token",
          setAuthResponse,
          () => {}, // setResMessage (not used here)
          () => {}, // setResId (not used here)
          () => {}, // setLoading (not used here)
          (error) => console.error("Failed to refresh token:", error),
          "post",
          expiredAuthResponse
        );
      } catch (error) {
        console.error("Failed to refresh token:", error);
        logout();
      }
    }, []);

    const logout = useCallback(() => {
        setAuthResponse(null);
        localStorage.removeItem('authResponse');
        // You might want to redirect to the home page or login page after logout
        window.location.href = '/';
      }, []);

    useEffect(() => {
      const storedResponse = localStorage.getItem('authResponse');
      if (storedResponse) {
        const parsedResponse = JSON.parse(storedResponse) as AuthSuccessResponse;
        // Check if the token has expired
        const now = Date.now();
        const expirationTime = new Date(parsedResponse.created_at).getTime() + (parseInt(parsedResponse.expiresIn) * 1000);
        if (now < expirationTime) {
          setAuthResponse(parsedResponse);
        } else {
          // Token is expired, try to refresh
          refreshToken(parsedResponse);
        }
      }
    }, [refreshToken]);

    useEffect(() => {
      if (authResponse && 'idToken' in authResponse) {
        localStorage.setItem('authResponse', JSON.stringify(authResponse));
      } else {
        localStorage.removeItem('authResponse');
      }
    }, [authResponse]);

    const isAuthenticated = !!(authResponse && 'idToken' in authResponse);

    const value = {
      authResponse,
      setAuthResponse,
      isAuthenticated,
      logout,
      refreshToken,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};