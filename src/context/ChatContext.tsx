import { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import apiRequest from '../services/apiRequest';
import { ChatContextType, topics, ChatMessage } from '../types';
import urls from '../urls.json';
import { useCatalogContext } from './CatalogContext';
import { useLayerContext } from './LayerContext';

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { authResponse } = useAuth();
  const { geoPoints } = useCatalogContext();
  const { handleFetchDataset, setCentralizeOnce, incrementFormStage } = useLayerContext();

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

  const fetchDataset = async (endpoint: string, body: any) => {
    try {
      setIsLoading(true);

      const response = await apiRequest({
        url: endpoint,
        method: 'post',
        body: body,
        isAuthRequest: true,
      });

      const responseData = response?.data?.data;

      const successMessage: ChatMessage = {
        content: `Dataset fetched successfully. ${responseData?.features?.length || 0} records retrieved.`,
        isUser: false,
        timestamp: new Date().toISOString(),
        responseData: {
          is_valid: true,
          reason: null,
          suggestions: null,
          endpoint: endpoint,
          body: responseData,
        },
      };

      setMessages(prev => [...prev, successMessage]);

      if (body.action === 'full data') {
        setCentralizeOnce(true);
      }

      setShowLoaderTopup(true);

      await handleFetchDataset(body.action || 'sample', undefined, undefined, undefined, body);

      incrementFormStage();

      return responseData;
    } catch (error) {
      console.error('Error fetching dataset:', error);

      const errorMessage: ChatMessage = {
        content: 'Sorry, there was an error fetching the dataset.',
        isUser: false,
        timestamp: new Date().toISOString(),
        responseData: {
          is_valid: false,
          reason: error instanceof Error ? error.message : 'Unknown error',
          suggestions: null,
          endpoint: null,
          body: null,
        },
      };

      setMessages(prev => [...prev, errorMessage]);

      return null;
    } finally {
      setIsLoading(false);
    }
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

      let url = '';
      let reqBody = {};

      if (topic === topics.RECOLOR) {
        url = urls.gradient_color_based_on_zone_llm;
        reqBody = { user_id: authResponse?.localId, prompt: content.trim(), layers: geoPoints };
      } else if (topic === topics.DATASET) {
        url = urls.process_llm_query;
        reqBody = { query: content.trim(), user_id: authResponse?.localId };
      } else {
        url = urls.gradient_color_based_on_zone_llm;
        reqBody = { user_id: authResponse?.localId, prompt: content.trim(), layers: geoPoints };
      }

      const response = await apiRequest({
        url,
        method: 'post',
        body: reqBody,
        isAuthRequest: true,
      });

      const responseData = response?.data?.data;

      let responseMessage = '';
      if (responseData?.is_valid === 'Valid' || responseData?.is_valid === true) {
        if (topic === topics.DATASET) {
          responseMessage = `I found a dataset matching your request: "${responseData.body.boolean_query}" in ${responseData.body.city_name}, ${responseData.body.country_name}.`;
        } else {
          responseMessage = 'I can apply these changes for you. Would you like to proceed?';
        }
      } else {
        responseMessage = responseData?.reason || 'Sorry, I could not process your request.';
      }

      const botMessage: ChatMessage = {
        content: responseMessage,
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
        fetchDataset,
        topic,
        setTopic,
        setMessages,
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
