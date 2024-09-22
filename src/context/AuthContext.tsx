import React, { createContext, useState, useContext, useEffect } from "react";
import { HttpReq } from "../services/apiService";
import {
  AuthContextType,
  AuthResponse,
  AuthSuccessResponse,
} from "../types/allTypesAndInterfaces";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [authResponse, setAuthResponse] = useState<AuthResponse>(
    localStorage.getItem("authResponse")
      ? (JSON.parse(
          localStorage.getItem("authResponse")!
        ) as AuthSuccessResponse)
      : null
  );

  const refreshToken = async (expiredAuthResponse: AuthSuccessResponse) => {
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
      // logout();
    }
  };

  const logout = () => {
    setAuthResponse(null);
    localStorage.removeItem("authResponse");
  };

  // useEffect(() => {

  //   const refreshTokenInterval = setInterval(() => {
  //     if (!isAuthenticated) return
  //     refreshToken(authResponse)
  //   }, 60_000) //Refresh every minute

  //   return () => clearInterval(refreshTokenInterval)
  // }, []);

  useEffect(() => {
    if (authResponse && "idToken" in authResponse) {
      localStorage.setItem("authResponse", JSON.stringify(authResponse));
    } else {
      localStorage.removeItem("authResponse");
    }
  }, [authResponse]);

  const isAuthenticated = !!(authResponse && "idToken" in authResponse);

  const value = {
    authResponse,
    setAuthResponse,
    isAuthenticated,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
