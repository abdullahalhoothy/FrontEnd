import axios, { AxiosRequestConfig } from "axios";
import urls from "../urls.json";
import { ApiRequestOptions, AuthResponse, IAuthResponse } from "../types/allTypesAndInterfaces";

const baseUrl = urls.REACT_APP_API_URL;

const axiosInstance = axios.create({
  baseURL: baseUrl,
});

export const addAuthTokenToLocalStorage = (token: AuthResponse) => {
  const authResponse = getAuthResponse() || {};
  
  const newAuthResponse = {
    ...authResponse,
    ...token
  };
  localStorage.setItem("authResponse", JSON.stringify(newAuthResponse));
};

const getAuthResponse = (): IAuthResponse | null => {
  const storedResponse = localStorage.getItem("authResponse");
  return storedResponse ? JSON.parse(storedResponse) : null;
};

const setAuthorizationHeader = (options: AxiosRequestConfig, token: string) => {
  options.headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };
};

const refreshAuthToken = async (refreshToken: string): Promise<AuthResponse> => {
  try {
    const res = await makeApiCall({
      url: "/refresh-token",
      method: "POST",
      body: {
        refresh_token: refreshToken,
        grant_type: "refresh_token",
      },
      isFormData: false,
    });
    
    console.log("Token refresh response:", res);
    const refreshTokenData = res.data?.data;
    if (!refreshTokenData?.idToken) {
      handleAuthError();
      throw new Error("Invalid token refresh response");
    }
    
    return refreshTokenData;
  } catch (error) {
    console.error("Token refresh failed:", error);
    throw error;
  }
};

const makeApiCall = async ({
  url,
  method,
  body,
  options,
  isFormData = false,
}: {
  url: string;
  method: string;
  body?: any;
  options?: AxiosRequestConfig;
  isFormData?: boolean;
}) => {
  const data = isFormData ? body : (
    method.toUpperCase() !== "GET"
      ? {
          message: "Request from frontend",
          request_info: {},
          request_body: body,
        }
      : undefined
  );

  return await axiosInstance({
    url,
    method,
    data,
    ...options,
  });
};

// Since we can't use hooks directly in a non-component function, 
// we'll create a navigation handler
let navigationHandler: ((path: string) => void) | null = null;

export const setNavigationHandler = (handler: (path: string) => void) => {
  navigationHandler = handler;
};

const handleAuthError = () => {
  // Redirect to auth page
  if (navigationHandler) {
    navigationHandler("/auth");
  }
};

const apiRequest = async ({
  url,
  method = "GET",
  body = {},
  options = {},
  isAuthRequest = false,
  isFormData = false,
}: ApiRequestOptions): Promise<any> => {
  const authResponse = getAuthResponse();

  if (authResponse?.idToken) {
    setAuthorizationHeader(options, authResponse.idToken);
  }

  if (isAuthRequest && !authResponse) {
    console.error('Not authenticated');
    handleAuthError();
    throw new Error("Not authenticated");
  }

  try {
    const response = await makeApiCall({ url, method, body, options, isFormData });
    return response;
  } catch (err: any) {
    if (err?.response?.status === 403) {
      localStorage.removeItem("authResponse");
      handleAuthError();
      throw new Error("Access forbidden");
    }

    if (err?.response?.status === 401) {
      localStorage.removeItem("authResponse");
      
      if (authResponse?.refreshToken) {
        try {
          const newToken = await refreshAuthToken(authResponse.refreshToken);
          addAuthTokenToLocalStorage(newToken);
          
          setAuthorizationHeader(options, newToken.idToken);
          const retryResponse = await makeApiCall({ url, method, body, options, isFormData });
          return retryResponse;
        } catch (tokenErr) {
          console.error("Token refresh error:", tokenErr);
          handleAuthError();
          throw new Error("Unable to refresh token. Please log in again.");
        }
      } else {
        console.error("No refresh token available");
        handleAuthError();
        throw new Error("Authentication required");
      }
    }
    
    console.error("API request error:", err);
    throw err;
  }
};

export default apiRequest;
