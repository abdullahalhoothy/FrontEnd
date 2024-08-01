import axios, { AxiosInstance } from "axios";
import urls from "../urls.json";

const baseUrl = urls.REACT_APP_API_URL;

export const apiClient: AxiosInstance = axios.create({
  baseURL: baseUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

// export async function HttpReq<T>(
//   end_point: string,
//   setResData: (data: T | string) => void,
//   setResMessage: (message: string) => void,
//   setResId: (id: string) => void,
//   setLoading: (loading: boolean) => void,
//   setError: (error: Error | null) => void
// ) {
//   try {
//     const response = await apiClient.get(`${end_point}`);
//     const message: string = response.data.message;
//     const request_id: string = response.data.request_id;
//     const data: T|string = response.data.data;

//     setResData(data);
//     setResMessage(message);
//     setResId(request_id);
//     setLoading(false);
//     setError(null);
//   } catch (fetchError: any) {
//     setResData("");
//     setResMessage("");
//     setResId("");
//     setLoading(false);
//     setError(fetchError);
//   }
// }

export async function HttpReq<T>(
  end_point: string,
  setResData: (data: T) => void,
  setResMessage: (message: string) => void,
  setResId: (id: string) => void,
  setLoading: (loading: boolean) => void,
  setError: (error: Error | null) => void,
  method: "get" | "post" | "put" | "delete" | "patch" = "get",
  body?: any
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

    const response = await apiClient[method](end_point, wrappedBody);

    const message: string = response.data.message;
    const request_id: string = response.data.request_id;
    const data: T = response.data.data;

    setResData(data);
    setResMessage(message);
    setResId(request_id);
    setLoading(false);
    setError(null);
  } catch (fetchError: any) {
    setResData({} as T); // Handle accordingly
    setResMessage("");
    setResId("");
    setLoading(false);
    setError(fetchError);
  }
}

export async function wSCall<T>(
  wSURL: string,
  reqId: string,
  reqBody: any,
  setResData: (geoData: T) => void,
  setResMessage: (message: string) => void,
  setResId: (id: string) => void,
  setLoading: (loading: boolean) => void,
  setError: (error: Event | null) => void
): Promise<void> {
  try {
    const websocket = new WebSocket(`${baseUrl}${wSURL}${reqId}`);

    websocket.onopen = function onOpen() {
      websocket.send(JSON.stringify(reqBody));
    };

    websocket.onmessage = function onMessage(event) {
      const res = JSON.parse(event.data);
      setResData(res.data as T);
      setResMessage(res.message);
      setResId(res.request_id);
      setLoading(false);
      setError(null);
    };

    websocket.onerror = function onError(event) {
      websocket.close();
      console.error("WebSocket error:", event);
      setResData("" as T);
      setResMessage("");
      setResId("");
      setLoading(false);
      setError(event);
    };

    websocket.onclose = function onClose() {
      console.log("WebSocket connection closed");
    };
  } catch (error) {
    console.error("Error fetching businesses:", error);
    setResData("" as T);
    setResMessage("");
    setResId("");
    setLoading(false);
    setError(error as Event);
  }
}
