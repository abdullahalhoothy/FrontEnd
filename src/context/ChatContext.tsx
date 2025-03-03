import { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import apiRequest from '../services/apiRequest';
import { Message, ChatContextType, topics } from '../types';
import urls from '../urls.json';
import { useCatalogContext } from './CatalogContext';
import { ChatMessage, GradientColorResponse } from '../types/allTypesAndInterfaces';

interface ChatContextType {
  messages: ChatMessage[];
  isLoading: boolean;
  isOpen: boolean;
  sendMessage: (content: string) => Promise<void>;
  toggleChat: () => void;
  closeChat: () => void;
  clearChat: () => void;
  applyGradientColor: (endpoint: string, body: any) => Promise<void>;
  topic: topics;
  setTopic: (topic: topics) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { authResponse } = useAuth();
  const { geoPoints } = useCatalogContext();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [topic, setTopic] = useState<topics>(topics.DEFAULT);
  const hasGreeted = useRef(false);

  useEffect(() => {
    if (isOpen && !hasGreeted.current) {
      const greetingMessage = {
        content: `Hi, ${authResponse?.displayName || 'there'} how can I help you?`,
        isUser: false,
        timestamp: new Date().toISOString(),
      };

      const timer = setTimeout(() => {
        setMessages(prev => [...prev, greetingMessage]);
        hasGreeted.current = true;
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isOpen, authResponse?.displayName]);

  const clearChat = () => {
    setMessages([]);
    hasGreeted.current = false;
  };

  const closeChat = () => {
    setIsOpen(false);
    clearChat();
  };

  const sendMessage = async (content: string) => {
    try {
      setIsLoading(true);
      const userMessage: ChatMessage = {
        content,
        isUser: true,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, userMessage]);

      const reqBody = { user_id: authResponse?.localId, prompt: content.trim(), layers: geoPoints };

      const response = await apiRequest({
        url: urls.gradient_color_based_on_zone_llm,
        method: 'post',
        body: reqBody,
        isAuthRequest: true,
      });

      const responseData: GradientColorResponse = response?.data?.data;

      const botMessage: ChatMessage = {
        content: responseData?.is_valid
          ? 'I can apply these changes for you. Would you like to proceed?'
          : responseData?.reason || 'Sorry, I could not process your request.',
        isUser: false,
        timestamp: new Date().toISOString(),
        responseData: responseData,
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: ChatMessage = {
        content: 'Sorry, an error occurred while processing your request.',
        isUser: false,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const applyGradientColor = async (endpoint: string, body: any) => {
    try {
      setIsLoading(true);

      const response = await apiRequest({
        url: urls[endpoint],
        method: 'post',
        body,
        isAuthRequest: true,
      });

      const successMessage: ChatMessage = {
        content: 'Changes applied successfully!',
        isUser: false,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, successMessage]);
    } catch (error) {
      console.error('Apply gradient color error:', error);
      const errorMessage: ChatMessage = {
        content: 'Sorry, an error occurred while applying the changes.',
        isUser: false,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleChat = () => setIsOpen(prev => !prev);

  return (
    <ChatContext.Provider
      value={{
        messages,
        isLoading,
        isOpen,
        sendMessage,
        toggleChat,
        closeChat,
        clearChat,
        applyGradientColor,
        topic,
        setTopic,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}
