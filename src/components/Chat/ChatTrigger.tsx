import { HiOutlineChat } from 'react-icons/hi';
import { useChatContext } from '../../context/ChatContext';
import { ReactElement } from 'react';

interface ChatTriggerProps {
  position?: string;
  size?: string;
  colors?: string;
  cN?: string;
  title?: string;
  afterIcon?: ReactElement;
  beforeIcon?: ReactElement;
}

const defaultProps: ChatTriggerProps = {
  position: 'fixed lg:bottom-6 lg:right-6 bottom-4 right-4',
  size: 'w-16 h-16',
  colors: 'bg-[#28A745]',
  cN: '',
  title: '',
  beforeIcon: <HiOutlineChat className="text-gray-100 w-8 h-8" />,
  afterIcon: <></>,
};

function ChatTrigger(props: ChatTriggerProps = defaultProps) {
  const { toggleChat, isOpen } = useChatContext();
  const { position, size, colors, cN, title, beforeIcon, afterIcon } = {
    ...defaultProps,
    ...props,
  };

  return (
    <button
      onClick={toggleChat}
      className={`${position} ${colors} ${size}
        rounded-2xl shadow-xl flex items-center justify-center 
        transition-all duration-300 hover:scale-105 ease-in-out hover:brightness-125 z-20 gap-2 ${cN}
        ${isOpen ? 'opacity-90 pointer-events-none' : 'opacity-100'}`}
      aria-label={title || 'Open chat'}
    >
      {beforeIcon}
      {title}
      {afterIcon}
    </button>
  );
}

export default ChatTrigger;
