import { useParams } from 'react-router-dom';

function Chat() {
  const { conversationId } = useParams();
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-gray-900">Chat</h1>
      <p className="text-gray-600 mt-2">
        {conversationId ? `Conversation: ${conversationId}` : 'Select a conversation – Chunk 5.'}
      </p>
    </div>
  );
}

export default Chat;
