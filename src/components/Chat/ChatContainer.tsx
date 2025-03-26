import Chat from './Chat';
import ChatTrigger from './ChatTrigger';
import { useAuth } from '../../context/AuthContext';

function ChatContainer() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) return null;

  return (
    <>
      <ChatTrigger />
      <Chat />
    </>
  );
}

export default ChatContainer;
