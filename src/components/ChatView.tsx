
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { Connection } from '@/contexts/ConnectionContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send } from 'lucide-react';

type ChatViewProps = {
  connection: Connection;
};

const ChatView = ({ connection }: ChatViewProps) => {
  const { user } = useAuth();
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

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center p-4 border-b bg-white">
        <Avatar className="h-10 w-10">
          <AvatarImage src={connection.profileImage} />
          <AvatarFallback>{getInitials(connection.name)}</AvatarFallback>
        </Avatar>
        <div className="ml-3">
          <h2 className="font-semibold">{connection.name}</h2>
        </div>
      </div>
      
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4">
        {messages.map((message) => {
          const isOwnMessage = message.senderId === user?.id;
          
          return (
            <div 
              key={message.id} 
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              {!isOwnMessage && (
                <Avatar className="h-8 w-8 mr-2 mt-1">
                  <AvatarFallback>{getInitials(connection.name)}</AvatarFallback>
                </Avatar>
              )}
              <div>
                <div
                  className={`${
                    isOwnMessage ? 'chat-bubble-sent' : 'chat-bubble-received'
                  }`}
                >
                  {message.content}
                </div>
                <div 
                  className={`text-xs mt-1 ${
                    isOwnMessage ? 'text-right text-gray-500' : 'text-gray-500'
                  }`}
                >
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message Input */}
      <form 
        onSubmit={handleSendMessage}
        className="p-4 border-t bg-white flex items-center space-x-2"
      >
        <Input
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-grow"
        />
        <Button type="submit" size="icon" disabled={!messageInput.trim()}>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};

export default ChatView;
