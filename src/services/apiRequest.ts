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

// Add cache implementation
interface CacheEntry {
  data: any;
  timestamp: number;
}

const CACHE_KEY_PREFIX = 'api_cache_';
const DURATION_IN_MINUTES = 60;
const CACHE_EXPIRY = DURATION_IN_MINUTES * 60 * 1000;

// Generic cache helper functions
const generateCacheKey = (url: string, method: string, data: any): string => {
  // For POST requests, we only care about the request_body part of the data
  const keyData = method === "POST" ? data?.request_body : data;
  
  const cacheKey = CACHE_KEY_PREFIX + JSON.stringify({
    url,
    method,
    data: keyData
  });

  return cacheKey;
};

const getCachedResponse = (key: string): any | null => {
  try {
    const cached = localStorage.getItem(key);
    if (!cached) {
      return null;
    }

    const { data, timestamp } = JSON.parse(cached) as CacheEntry;
    
    if (Date.now() - timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(key);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error reading from cache:', error);
    return null;
  }
};

const setCacheEntry = (key: string, data: any) => {
  try {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (error) {
    console.error('Error writing to cache:', error);
    // If localStorage is full, clear it and try again
    if (error.name === 'QuotaExceededError') {
      clearCache();
      try {
        const entry: CacheEntry = {
          data,
          timestamp: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(entry));
      } catch (retryError) {
        console.error('Failed to cache even after clearing:', retryError);
      }
    }
  }
};

// Cache management functions
export const clearCache = () => {
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(CACHE_KEY_PREFIX)) {
      localStorage.removeItem(key);
    }
  }
  console.info('Cache cleared');
};

const cleanupCache = () => {
  const now = Date.now();
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(CACHE_KEY_PREFIX)) {
      try {
        const cached = localStorage.getItem(key);
        if (cached) {
          const { timestamp } = JSON.parse(cached) as CacheEntry;
          if (now - timestamp > CACHE_EXPIRY) {
            localStorage.removeItem(key);
            console.log('Removed expired cache entry:', key);
          }
        }
      } catch (error) {
        console.error('Error cleaning up cache entry:', error);
        localStorage.removeItem(key);
      }
    }
  }
};

// Run cleanup periodically
setInterval(cleanupCache, CACHE_EXPIRY / 2);

// Update makeApiCall to use the new localStorage cache functions
const makeApiCall = async ({
  url,
  method,
  body,
  options,
  isFormData = false,
  useCache = false,
}: {
  url: string;
  method: string;
  body?: any;
  options?: AxiosRequestConfig;
  isFormData?: boolean;
  useCache?: boolean;
}) => {

  // Skip cache for form data or when caching is not requested
  if (isFormData || !useCache) {
    return await axiosInstance({
      url,
      method,
      data: isFormData ? body : {
        message: "Request from frontend",
        request_info: {},
        request_body: body,
      },
      ...options,
    });
  }

  // For cacheable requests, try cache first
  const data = {
    message: "Request from frontend",
    request_info: {},
    request_body: body,
  };

  const cacheKey = generateCacheKey(url, method, data);
  const cachedResponse = getCachedResponse(cacheKey);
  
  if (cachedResponse) {
    return cachedResponse;
  }

  // Make the request and cache the response
  const response = await axiosInstance({
    url,
    method,
    data,
    ...options,
  });

  setCacheEntry(cacheKey, response);

  return response;
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
  useCache = false,
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
    const response = await makeApiCall({ url, method, body, options, isFormData, useCache });
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
          const retryResponse = await makeApiCall({ url, method, body, options, isFormData, useCache });
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
