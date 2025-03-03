import { useEffect, useRef, useState } from 'react';
import { HiArrowRight, HiX } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import { useChatContext } from '../../context/ChatContext';
import { Message, topics } from '../../types';
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
  const { messages, isLoading, isOpen, sendMessage, closeChat, topic, setTopic } = useChatContext();
  const { authResponse } = useAuth();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (props.topic) setTopic(props.topic);
  }, [props.topic]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (input.length < 10 || isLoading) return;

    await sendMessage(input);
    setInput('');
  };

  const renderMessage = (message: Message, index: number) => {
    const isGreeting = index === 0 && !message.isUser;

    return (
      <div
        key={index}
        className={`flex ${message.isUser ? 'justify-end' : 'justify-start'} ${
          isGreeting ? 'animate-fade-in-up' : ''
        }`}
      >
        <div
          className={`break-words whitespace-pre-wrap rounded-2xl p-4 shadow-sm max-w-[85%]
            ${
              message.isUser
                ? 'bg-[#28A745]/90 text-white rounded-tr-none'
                : 'bg-gray-100 text-gray-800 rounded-tl-none border border-gray-200'
            }`}
        >
          {message.content}
          {isGreeting && (!authResponse || !authResponse.displayName) && (
            <span className="block mt-2 text-xs text-gray-500">(Sign in to personalize)</span>
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
        className="p-4 space-y-4 min-h-[200px] overflow-y-auto"
        style={{ maxHeight: 'calc(70vh - 140px)' }}
      >
        {messages.map(renderMessage)}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl p-4 rounded-tl-none border border-gray-200">
              <Loader />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input
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
            disabled={input.length < 10 || isLoading}
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
