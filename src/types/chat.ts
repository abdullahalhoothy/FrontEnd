export interface Message {
  content: string;
  isUser: boolean;
  timestamp: string;
}

export interface ChatContextType {
  messages: ChatMessage[];
  isLoading: boolean;
  isOpen: boolean;
  sendMessage: (content: string) => Promise<void>;
  toggleChat: () => void;
  closeChat: () => void;
  clearChat: () => void;
  applyGradientColor: (endpointOrResponseData: string | any, body?: any) => Promise<void>;
  takeAction: any;
  fetchDataset: (endpoint: string, body: any) => Promise<any> | any;
  topic: topics;
  setTopic: (topic: topics) => void;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
}

export interface LlmGradientColorResponse {
  is_valid: boolean;
  reason?: string | null;
  suggestions?: string[] | null;
  endpoint?: string | null;
  body?: any | null;
}

export interface LlmFetchDatasetResponse {
  is_valid: boolean | string;
  query: string;
  reason?: string | null;
  suggestions?: string[] | null;
  endpoint?: string | null;
  cost: string;
  body?: any | null;
}
export interface ChatMessage {
  content: string;
  isUser: boolean;
  timestamp: string;
  responseData?: LlmGradientColorResponse | LlmFetchDatasetResponse | GradientColorResponse;
}

export enum topics {
  DEFAULT,
  DATASET,
  RECOLOR,
}

export enum llms {
  FETCH = 'process_llm_query',
  RECOLOR = 'gradient_color_based_on_zone_llm',
}

export interface GradientColorResponse {
  is_valid: boolean;
  reason?: string | null;
  suggestions?: string[] | null;
  endpoint?: string | null;
  body?: any | null;
}
