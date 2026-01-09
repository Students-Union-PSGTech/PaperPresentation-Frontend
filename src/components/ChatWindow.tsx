import { useState, useEffect } from 'react';
import { Send } from 'lucide-react';
import axios from 'axios';

// Configure axios to send cookies with requests
axios.defaults.withCredentials = true;

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

interface Message {
  _id?: string;
  text: string;
  sender: 'user' | 'evaluator';
  timestamp: string;
}

interface PaperChat {
  _id: string;
  paperId: string;
  userId: string;
  reviewer_id: string;
  status: 'pending' | 'completed' | 'declined';
  messages?: Message[];
  createdAt: string;
}

export default function ChatWindow() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [paperChat, setPaperChat] = useState<PaperChat | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewerName, setReviewerName] = useState('Assigned Reviewer');

  useEffect(() => {
    const fetchChatData = async () => {
      try {
        const userId = localStorage.getItem('userId');
        const paperId = new URLSearchParams(window.location.search).get('paperId') || 'PRP01';

        if (!userId) {
          setError('User not logged in');
          setLoading(false);
          return;
        }

        // Fetch the PaperChat document
        const response = await axios.get(
          `${API_BASE_URL}/inf/api/events/paper/${paperId}/chat`,
          {
            params: { userId }
            
          }
        );

        if (response.data.success) {
          setPaperChat(response.data.data);
          
          // If messages are stored in the response, set them
          if (response.data.data.messages) {
            setMessages(response.data.data.messages);
          }
          // Try to fetch reviewer name if available
          if (response.data.data.reviewer_id) {
            setReviewerName(response.data.data.reviewer_name || 'Dr. Smith (assigned reviewer)');
          }
        } else {
          setError('Failed to fetch chat data');
        }
      } catch (err) {
        const errorMessage = axios.isAxiosError(err)
          ? err.response?.data?.message || err.message
          : 'Failed to fetch chat';
        setError(errorMessage);
        console.error('Chat fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchChatData();
  }, []);

  const handleSend = async () => {
    if (!input.trim() || !paperChat) return;

    try {
      const userId = localStorage.getItem('userId');
      // Add user message to UI immediately (optimistic update)
      const newMessage: Message = {
        text: input,
        sender: 'user',
        timestamp: new Date().toISOString()
      };

      setMessages([...messages, newMessage]);
      setInput("");

      // Send message to backend
      const response = await axios.post(
        `${API_BASE_URL}/inf/api/events/paper/${paperChat.paperId}/chat/message`,
        {
          userId,
          text: input,
          sender: 'user'
        }
      );

      if (!response.data.success) {
        setError('Failed to send message');
      }
    } catch (err) {
      const errorMessage = axios.isAxiosError(err)
        ? err.response?.data?.message || err.message
        : 'Failed to send message';
      setError(errorMessage);
      console.error('Send message error:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <p className="text-gray-600">Loading chat...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 mb-2">Error: {error}</p>
          <p className="text-sm text-gray-600">Chat status: {paperChat?.status}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200 shadow-sm">
        <h2 className="font-semibold text-gray-800">Reviewer Chat</h2>
        <p className="text-xs text-gray-500">{reviewerName}</p>
        {paperChat && (
          <p className="text-xs text-gray-400 mt-1">
            Status: <span className={`font-semibold ${
              paperChat.status === 'completed' ? 'text-green-600' : 
              paperChat.status === 'declined' ? 'text-red-600' : 
              'text-yellow-600'
            }`}>{paperChat.status}</span>
          </p>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-center">No messages yet. Start a conversation with your reviewer.</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const msgTime = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return (
              <div 
                key={msg._id || idx}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] p-4 rounded-xl text-sm ${
                  msg.sender === 'user' 
                    ? 'bg-blue-600 text-white rounded-br-none' 
                    : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'
                }`}>
                  <p>{msg.text}</p>
                  <span className={`text-[10px] block mt-2 ${
                    msg.sender === 'user' ? 'text-blue-200' : 'text-gray-400'
                  }`}>
                    {msgTime}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input Area - Disabled if chat is completed or declined */}
      <div className="p-4 bg-white border-t border-gray-200">
        {paperChat?.status !== 'pending' && (
          <p className="text-xs text-gray-500 mb-3 text-center">
            Chat is {paperChat?.status}. No new messages can be sent.
          </p>
        )}
        <div className="relative">
          <textarea
            className="w-full bg-gray-100 border-0 rounded-lg p-3 pr-12 focus:ring-2 focus:ring-blue-500 resize-none h-24 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            placeholder={paperChat?.status === 'pending' ? "Type your message here..." : "Chat is closed"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={paperChat?.status !== 'pending'}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && paperChat?.status === 'pending') {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <button 
            onClick={handleSend}
            disabled={paperChat?.status !== 'pending' || !input.trim()}
            className="absolute bottom-3 right-3 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}