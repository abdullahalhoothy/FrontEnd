import { createContext, useContext, useState, useRef, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import apiRequest from '../services/apiRequest';
import { ChatContextType, topics, ChatMessage, llms } from '../types';
import urls from '../urls.json';
import { useCatalogContext } from './CatalogContext';
import { useLayerContext } from './LayerContext';

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { authResponse } = useAuth();
  const { geoPoints, setGeoPoints, setGradientColorBasedOnZone } = useCatalogContext();
  const { handleFetchDataset, setCentralizeOnce, incrementFormStage } = useLayerContext();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [topic, setTopic] = useState<topics>(topics.DEFAULT);
  const [colors, setColors] = useState<string[][]>([]);
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

  const applyGradientColor = async (endpointOrResponseData: string | any, body?: any) => {
    try {
      setIsLoading(true);

      // Determine if first parameter is an endpoint string or response data object
      const isEndpointString = typeof endpointOrResponseData === 'string';

      let processedBody: any;
      let endpoint: string;

      if (isEndpointString) {
        // Original behavior - direct API call with endpoint and body
        endpoint = endpointOrResponseData;
        processedBody = body;
      } else {
        // Handle LLM response data
        const responseData = endpointOrResponseData;

        // Extract and validate parameters from LLM response
        if (!responseData || !responseData.body) {
          throw new Error('Invalid LLM response data');
        }

        // Determine which endpoint to use based on the response
        if (responseData.endpoint) {
          endpoint = responseData.endpoint;
        } else {
          // Default to the LLM-based endpoint if not specified
          endpoint = llms.FETCH;
        }

        // Process and validate the LLM response body
        processedBody = processLLMResponseBody(responseData.body);
      }

      // Make the API request with validated parameters
      const response = await apiRequest({
        url: urls[endpoint as keyof typeof urls],
        method: 'post',
        body: processedBody,
        isAuthRequest: true,
      });

      // Process the response data if needed
      if (response?.data?.data) {
        await handleRecolorResponse(response.data.data);
      }

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

  // Helper function to process LLM response body
  const processLLMResponseBody = (responseBody: any) => {
    // Ensure required fields are present
    if (!responseBody) {
      throw new Error('Missing response body');
    }

    // Extract parameters, defaulting if necessary
    const {
      color_grid_choice = colors?.[0] || ['#ff0000', '#00ff00', '#0000ff'],
      change_lyr_id,
      change_lyr_name,
      based_on_lyr_id,
      based_on_lyr_name,
      coverage_property = 'radius',
      coverage_value = 1000,
      color_based_on,
      list_names = [],
      threshold,
      user_id = authResponse?.localId,
    } = responseBody;

    // Validate essential parameters
    if (!change_lyr_id || !based_on_lyr_id) {
      throw new Error('Missing required layer IDs in response');
    }

    // Format parameters appropriately
    return {
      color_grid_choice,
      change_lyr_id,
      change_lyr_name: change_lyr_name || `Layer ${change_lyr_id}`,
      based_on_lyr_id,
      based_on_lyr_name: based_on_lyr_name || `Layer ${based_on_lyr_id}`,
      coverage_property,
      coverage_value,
      change_lyr_new_color: responseBody.change_lyr_new_color || '',
      change_lyr_orginal_color: responseBody.change_lyr_orginal_color || '',
      color_based_on,
      list_names: Array.isArray(list_names)
        ? list_names.filter((name: string) => name.trim() !== '')
        : [],
      threshold,
      user_id,
    };
  };

  // Helper function to handle recolor response
  const handleRecolorResponse = async (responseData: any) => {
    if (!responseData) return;

    // If response is an array of gradient color data, process it
    if (Array.isArray(responseData)) {
      // Process gradient data for UI update
      const combinedFeatures = responseData.flatMap(group =>
        (group.features || []).map((feature: any) => ({
          ...feature,
          properties: {
            ...feature.properties,
            gradient_color: group.points_color,
            gradient_legend: group.layer_legend,
          },
        }))
      );

      // Update geoPoints with gradient information
      setGeoPoints(prev => {
        return prev.map(point => {
          const matchingGroup = responseData.find(g => g.prdcer_lyr_id === point.prdcer_lyr_id);
          if (matchingGroup) {
            return {
              ...point,
              prdcer_layer_name: matchingGroup.prdcer_layer_name || point.prdcer_layer_name,
              layer_legend: matchingGroup.layer_legend || point.layer_legend,
              features: combinedFeatures.filter((f: any) => f.layer_id === point.layerId),
              gradient_groups: responseData.map(group => ({
                color: group.points_color,
                legend: group.layer_legend,
                count: group.records_count || 0,
              })),
              is_gradient: true,
              gradient_based_on: matchingGroup.based_on_lyr_id || null,
            };
          }
          return point;
        });
      });

      // Store gradient color data for reference
      setGradientColorBasedOnZone(responseData);
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
        takeAction: () => {},
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
