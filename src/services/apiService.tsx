import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import urls from "../urls.json";
const baseUrl = urls.REACT_APP_API_URL;

export const apiClient: AxiosInstance = axios.create({
  baseURL: baseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function HttpReq<T>(
  end_point: string,
  setResData: (data: T) => void,
  setResMessage: (message: string) => void,
  setResId: (id: string) => void,
  setLoading: (loading: boolean) => void,
  setError: (error: Error | null) => void,
  method: "get" | "post" | "put" | "delete" | "patch" = "get",
  body?: any,
  token?: string // Add this parameter
) {
  setLoading(true);
  try {
    const wrappedBody =
      method !== "get"
        ? {
            message: "Request from frontend",
            request_info: {},
            request_body: body,
          }
        : undefined;

    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    const response = await apiClient[method](end_point, wrappedBody, {
      headers,
    });

    const message: string = response.data.message;
    const request_id: string = response.data.request_id;
    const data: T = response.data.data || response.data;

    setResData(data);
    setResMessage(message);
    setResId(request_id);
    setLoading(false);
    setError(null);
  } catch (fetchError: any) {
    setResData({} as T);
    setResMessage("");
    setResId("");
    setLoading(false);
    setError(fetchError);
  }
}
