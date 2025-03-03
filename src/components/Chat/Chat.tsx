import { useEffect, useRef, useState } from 'react';
import { HiArrowRight, HiX, HiArrowUp } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import { useChatContext } from '../../context/ChatContext';
import { ChatMessage, topics } from '../../types';
import Loader from '../Loader/Loader';
import _ from 'lodash';

interface ChatProps {
  position?: string;
  topic?: topics;
}

const defaultProps = {
  position: `fixed lg:bottom-6 lg:right-6 bottom-4 right-4 `,
  topic: topics.DEFAULT,
};

function Chat(props: ChatProps = defaultProps) {
  const {
    messages,
    isLoading,
    isOpen,
    sendMessage,
    closeChat,
    clearChat,
    applyGradientColor,
    topic,
    setTopic,
  } = useChatContext();
  const { authResponse } = useAuth();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // For message history navigation
  const [historyIndex, setHistoryIndex] = useState(-1);
  const userMessages = messages.filter(m => m.isUser).map(m => m.content);

  useEffect(() => {
    if (props.topic) setTopic(props.topic);
  }, [props.topic]);

  // Reset history index when messages change
  useEffect(() => {
    setHistoryIndex(-1);
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim().length < 10 || isLoading) return;

    await sendMessage(input);
    setInput('');
    setHistoryIndex(-1); // Reset history index after sending
  };

  // Navigate through message history
  const handleHistoryNavigation = () => {
    if (userMessages.length === 0) return;

    // Calculate the next index (cycling through history)
    const nextIndex =
      historyIndex === -1
        ? userMessages.length - 1
        : (historyIndex - 1 + userMessages.length) % userMessages.length;

    setHistoryIndex(nextIndex);
    setInput(userMessages[nextIndex]);

    // Focus and move cursor to end of input
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.selectionStart = inputRef.current.value.length;
        inputRef.current.selectionEnd = inputRef.current.value.length;
      }
    }, 0);
  };

  const renderMessage = (message: ChatMessage, index: number) => {
    const isBot = !message.isUser;
    const isLastMessage = index === messages.length - 1;

    const hasResponseData = isBot && message.responseData;
    const isValidResponse = hasResponseData && message.responseData.is_valid === true;
    const isInvalidResponse = hasResponseData && message.responseData.is_valid === false;

    return (
      <div
        key={index}
        className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-4 ${isLastMessage ? 'animate-fade-in-up' : ''}`}
      >
        <div
          className={`${
            isBot
              ? 'bg-gray-100 rounded-2xl p-4 rounded-tl-none border border-gray-200'
              : 'bg-gem-gradient text-white rounded-2xl p-4 rounded-tr-none'
          } ${isInvalidResponse ? 'bg-amber-50 border-amber-200' : ''} max-w-[85%]`}
        >
          <div className="whitespace-pre-wrap">{message.content}</div>

          {isInvalidResponse && message.responseData.suggestions && (
            <div className="mt-2 text-sm">
              <p className="font-semibold">Suggestions:</p>
              <ul className="list-disc pl-5 mt-1">
                {message.responseData.suggestions.map((suggestion, i) => (
                  <li key={i}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          {isValidResponse && (
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  if (message.responseData?.endpoint && message.responseData?.body) {
                    applyGradientColor(message.responseData.endpoint, message.responseData.body);
                  }
                }}
                className="bg-gem-green text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gem-green/80 transition-colors"
              >
                Apply
              </button>
              <button
                onClick={() => {
                  clearChat();
                  closeChat();
                }}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`${props.position}
        lg:w-[400px] w-[95vw] max-h-[70vh] bg-white rounded-2xl shadow-xl 
        transform-gpu transition-all duration-500 ease-out z-20
        ${isOpen ? '-translate-x-0 scale-100 opacity-100' : '-translate-x-1/4 scale-95 opacity-0 pointer-events-none'}`}
    >
      <div className="flex items-center justify-between bg-gem-gradient-animated bg-200% animate-gradient-shift p-4 rounded-t-2xl">
        <h2 className="text-gray-100 font-semibold">{`AI ${_.upperFirst(topics[topic].toLowerCase())}`}</h2>
        <button
          onClick={closeChat}
          className="text-gray-100 hover:text-white transition-colors"
          aria-label="Close chat"
        >
          <HiX className="w-6 h-6" />
        </button>
      </div>

      <div
        ref={containerRef}
        className="p-4 space-y-4 min-h-[200px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
        style={{ maxHeight: 'calc(70vh - 140px)' }}
      >
        {messages.map(renderMessage)}
        {isLoading && (
          <div className="flex justify-start animate-fade-in-up">
            <div className="bg-gray-100 rounded-2xl p-4 rounded-tl-none border border-gray-200">
              <Loader />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleHistoryNavigation}
            disabled={userMessages.length === 0}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Show previous message"
          >
            <HiArrowUp className="w-5 h-5 text-gray-500" />
          </button>
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              className="w-full p-2 pr-16 border rounded-lg focus:outline-none focus:border-[#28A745]"
              placeholder="Type your message..."
              maxLength={200}
            />
            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">
              {input.length}/200
            </span>
          </div>
          <button
            type="submit"
            disabled={input.trim().length < 10 || isLoading}
            className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <HiArrowRight className="w-6 h-6 text-[#28A745]" />
          </button>
        </div>
      </form>
    </div>
  );
}

export default Chat;
