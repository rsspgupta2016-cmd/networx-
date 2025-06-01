
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { Connection } from '@/types/connection';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, Send, User, BellOff, VolumeX } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

type ChatViewProps = {
  connection: Connection;
};

const ChatView = ({ connection }: ChatViewProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const { getMessagesForConnection, sendMessage, markMessagesAsRead } = useChat();
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const messages = getMessagesForConnection(connection.id);
  
  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Mark messages as read when viewing the chat
  useEffect(() => {
    markMessagesAsRead(connection.id);
  }, [connection.id, markMessagesAsRead]);
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim()) {
      sendMessage(connection.id, messageInput);
      setMessageInput('');
    }
  };

  const handleBackToChats = () => {
    if (isMobile) {
      setSearchParams({});
    }
  };
  
  // Format timestamp to readable time
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getDateSeparator = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString(undefined, { 
        weekday: 'long', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  // Group messages by date for date separators
  let lastMessageDate = "";

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-[#0B1120] to-[#1C2A41] text-white shadow-md border-b border-[#232e48]">
        {isMobile && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-[#283a56] mr-2"
            onClick={handleBackToChats}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div className="flex items-center">
          <Avatar className="h-10 w-10 border-2 border-networx-primary">
            <AvatarImage src={connection.profile_image} />
            <AvatarFallback className="bg-[#1C2A41] text-networx-primary">{getInitials(connection.name)}</AvatarFallback>
          </Avatar>
          <div className="ml-3">
            <div className="flex items-center">
              <h2 className="font-semibold">{connection.name}</h2>
              <div className="flex ml-2">
                {connection.is_muted && (
                  <div className="bg-networx-primary rounded-full p-0.5 mr-1" title="Messages muted">
                    <BellOff className="h-3 w-3" />
                  </div>
                )}
                {connection.calls_muted && (
                  <div className="bg-networx-primary rounded-full p-0.5" title="Calls muted">
                    <VolumeX className="h-3 w-3" />
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-networx-light/70">Online</p>
          </div>
        </div>
        <div className="text-xs bg-[#283a56] px-2 py-1 rounded-full">
          ID: {user?.identityCode || 'NX-XXXXX'}
        </div>
      </div>
      
      {/* Messages Area */}
      <div 
        className="flex-1 overflow-y-auto p-4 bg-[#e8f4ff]"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-60">
            <User size={40} className="text-green-500 mb-2" />
            <p className="text-center text-sm text-green-700">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwnMessage = message.sender_id === user?.id;
            const messageDate = new Date(message.created_at);
            const messageDateStr = messageDate.toDateString();
            const showDateSeparator = messageDateStr !== lastMessageDate;
            
            if (showDateSeparator) {
              lastMessageDate = messageDateStr;
            }
            
            return (
              <React.Fragment key={message.id}>
                {showDateSeparator && (
                  <div className="flex justify-center my-4">
                    <div className="px-3 py-1 bg-green-100 rounded-full text-xs text-green-600 font-medium">
                      {getDateSeparator(messageDate)}
                    </div>
                  </div>
                )}
                <div 
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  {!isOwnMessage && (
                    <Avatar className="h-8 w-8 mr-2 mt-1">
                      <AvatarFallback className="bg-green-500 text-white">{getInitials(connection.name)}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`max-w-[75%] ${isOwnMessage ? 'mr-1' : 'ml-1'}`}>
                    <div
                      className={`p-3 rounded-lg shadow-sm ${
                        isOwnMessage 
                          ? 'bg-green-100 text-green-900 rounded-br-none' 
                          : 'bg-white text-green-900 rounded-bl-none'
                      }`}
                    >
                      {message.content}
                    </div>
                    <div 
                      className={`text-xs mt-1 flex items-center ${
                        isOwnMessage ? 'justify-end text-green-600' : 'text-green-500'
                      }`}
                    >
                      {formatTime(message.created_at)}
                    </div>
                  </div>
                </div>
              </React.Fragment>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message Input */}
      <form 
        onSubmit={handleSendMessage}
        className="p-4 bg-white shadow-lg flex items-center space-x-2"
      >
        <Input
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-grow border-[#232e48] focus:border-networx-primary"
        />
        <Button 
          type="submit" 
          size="icon" 
          disabled={!messageInput.trim()}
          className={`rounded-full ${messageInput.trim() ? 'bg-networx-primary hover:bg-networx-secondary' : 'bg-gray-300'}`}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};

export default ChatView;
