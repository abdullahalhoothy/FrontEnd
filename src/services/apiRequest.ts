import axios, { AxiosRequestConfig } from "axios";
import urls from "../urls.json";
import { ApiRequestOptions, AuthResponse, IAuthResponse } from "../types/allTypesAndInterfaces";

const baseUrl = urls.REACT_APP_API_URL;

const axiosInstance = axios.create({
  baseURL: baseUrl, // Replace with your actual base URL
});

// move this to auth module
export const addAuthTokenToLocalStorage = (token: object) => {
  const authResponse = getAuthResponse();

  if (authResponse) {
    const newAuthResponse = {
      ...authResponse,
      idToken: token.idToken,
      refreshToken: token.refreshToken,
    };
    localStorage.setItem("authResponse", JSON.stringify(newAuthResponse));
  } else {
    console.error("Auth response not found in local storage");
  }
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
      noBodyWrap: false,
    });
    
    if (!res.data?.idToken) {
      handleAuthError()
      throw new Error("Invalid token refresh response");
    }
    
    return res.data;
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
  noBodyWrap = false,
}: {
  url: string;
  method: string;
  body?: any;
  options?: AxiosRequestConfig;
  noBodyWrap?: boolean;
}) => {
  const data = noBodyWrap ? body : (
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
  noBodyWrap = false,
}: ApiRequestOptions): Promise<any> => {
  const authResponse = getAuthResponse();

  // Set auth header for authenticated requests
  if (authResponse?.idToken) {
    setAuthorizationHeader(options, authResponse.idToken);
  }

  if (isAuthRequest && !authResponse) {
    console.error('Not authenticated');
    handleAuthError();
  }

  try {
    const response = await makeApiCall({ url, method, body, options, noBodyWrap });
    return response;
  } catch (err: any) {
    if (err?.response?.status === 401 || err?.response?.status === 403) {
      // Clear existing auth data on auth errors
      localStorage.removeItem("authResponse");
      
      if (authResponse?.refreshToken) {
        try {
          const newToken = await refreshAuthToken(authResponse.refreshToken);
          addAuthTokenToLocalStorage(newToken);

          console.log("Retrying request with refreshed token");
          
          // Retry the original request with new token
          setAuthorizationHeader(options, newToken.idToken);
          const retryResponse = await makeApiCall({ url, method, body, options, noBodyWrap });
          return retryResponse;
        } catch (tokenErr) {
          console.error("Token refresh error:", tokenErr);
          throw new Error("Unable to refresh token. Please log in again.");
        }
      } else {
        console.error("No refresh token available");
        throw new Error("Authentication required");
      }
    }
    // Handle navigation after throwing errors
    if (err.message === "Not authenticated" || 
        err.message === "Unable to refresh token. Please log in again." ||
        err.message === "Authentication required") {
      handleAuthError();
    }
    else {
      console.error("API request error:", err); 
      throw err;
    }
  }
};

export default apiRequest;
