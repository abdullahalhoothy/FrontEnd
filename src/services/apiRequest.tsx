import axios, { AxiosRequestConfig } from "axios";
import urls from "../urls.json";
const baseUrl = urls.REACT_APP_API_URL;

const axiosInstance = axios.create({
  baseURL: baseUrl, // Replace with your actual base URL
});

interface AuthResponse {
  idToken: string;
  refreshToken: string;
}

interface ApiRequestOptions extends AxiosRequestConfig {
  isAuthRequest?: boolean;
  body?: any;
  options?: AxiosRequestConfig;
}

// move this to auth module
export const addAuthTokenToLocalStorage = (token: string) => {
  localStorage.setItem("token", token); // Store the new token
};

const getAuthResponse = (): AuthResponse | null => {
  const storedResponse = localStorage.getItem("authResponse");
  return storedResponse ? JSON.parse(storedResponse) : null;
};

const setAuthorizationHeader = (options: AxiosRequestConfig, token: string) => {
  options.headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };
};


const refreshAuthToken = async (refreshToken: string): Promise<string> => {
  const res = await axiosInstance.post("/refresh-token", {
    refresh_token: refreshToken,
  });
  const newToken = res.data.token; // Assuming the new token is here
  return newToken;
};

const makeApiCall = async ({
  url,
  method,
  body,
  options,
}: {
  url: string;
  method: string;
  body?: any;
  options?: AxiosRequestConfig;
}) => {
  // Wrap the body if the method is not GET
  const wrappedBody =
    method.toUpperCase() !== "GET"
      ? {
          message: "Request from frontend",
          request_info: {},
          request_body: body,
        }
      : undefined;
  return await axiosInstance({
    url,
    method,
    data: wrappedBody,
    ...options,
  });
};

const apiRequest = async ({
  url,
  method = "GET",
  body = {},
  options = {},
  isAuthRequest = false,
}: ApiRequestOptions): Promise<any> => {
  const authResponse = getAuthResponse();

  if (isAuthRequest && !authResponse) {
    throw new Error("Not authenticated");
  } else if (isAuthRequest) {
    const token = authResponse.idToken;
    setAuthorizationHeader(options, token);
  }

  try {
    const response = await makeApiCall({ url, method, body, options });
    return response;
  } catch (err) {
    if (isAuthRequest && err.response && err.response.status === 401) {
      try {
        const refreshToken = authResponse.refreshToken; // Get refresh token from authResponse
        const newToken = await refreshAuthToken(refreshToken);
        addAuthTokenToLocalStorage(newToken);

        // Retry the original request with the new token
        setAuthorizationHeader(options, newToken);
        const retryResponse = await makeApiCall({ url, method, body, options });
        return retryResponse;
      } catch (tokenErr) {
        console.error("Token refresh error:", tokenErr);
        throw new Error("Unable to refresh token. Please log in again.");
      }
    }
    console.error("API request error:", err);
    throw new Error("API request failed. Please try again.");
  }
};

export default apiRequest;
