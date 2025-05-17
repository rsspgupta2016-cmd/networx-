
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useChat } from '@/contexts/ChatContext';
import { Connection } from '@/contexts/ConnectionContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, User } from 'lucide-react';

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
      <div className="flex items-center p-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md">
        <Avatar className="h-10 w-10 border-2 border-white">
          <AvatarImage src={connection.profileImage} />
          <AvatarFallback className="bg-blue-700 text-white">{getInitials(connection.name)}</AvatarFallback>
        </Avatar>
        <div className="ml-3">
          <h2 className="font-semibold">{connection.name}</h2>
          <p className="text-xs text-blue-100">Online</p>
        </div>
      </div>
      
      {/* Messages Area */}
      <div 
        className="flex-1 overflow-y-auto p-4 bg-[#e0f2ff] bg-opacity-50 bg-[url('/pattern-bg.svg')] space-y-4"
        style={{ backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDYwIDYwIj48ZyBmaWxsPSJub25lIj48cGF0aCBmaWxsPSIjZGVlYmZmIiBkPSJNMzYgMzBhNiA2IDAgMSAxLTEyIDAgNiA2IDAgMCAxIDEyIDB6Ii8+PHBhdGggZmlsbD0iI2VkZjRmZiIgZD0iTTAgMGgxMnYxMkgwem0yNCAwaDEydjEySDI0em00OCAwaDEydjEySDcyek0wIDI0aDEydjEySDB6bTI0IDBoMTJ2MTJIMjR6bTQ4IDBoMTJ2MTJINzJ6TTAgNDhoMTJ2MTJIMHB6bTI0IDBoMTJ2MTJIMjR6bTQ4IDBoMTJ2MTJINzJ6Ii8+PC9nPjwvc3ZnPg==')" }}
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full opacity-60">
            <User size={40} className="text-blue-500 mb-2" />
            <p className="text-center text-sm text-blue-700">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwnMessage = message.senderId === user?.id;
            const messageDate = new Date(message.timestamp);
            const messageDateStr = messageDate.toDateString();
            const showDateSeparator = messageDateStr !== lastMessageDate;
            
            if (showDateSeparator) {
              lastMessageDate = messageDateStr;
            }
            
            return (
              <React.Fragment key={message.id}>
                {showDateSeparator && (
                  <div className="flex justify-center my-4">
                    <div className="px-3 py-1 bg-blue-100 rounded-full text-xs text-blue-600 font-medium">
                      {getDateSeparator(messageDate)}
                    </div>
                  </div>
                )}
                <div 
                  className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                >
                  {!isOwnMessage && (
                    <Avatar className="h-8 w-8 mr-2 mt-1">
                      <AvatarFallback className="bg-blue-500 text-white">{getInitials(connection.name)}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`max-w-[75%] ${isOwnMessage ? 'mr-1' : 'ml-1'}`}>
                    <div
                      className={`p-3 rounded-lg shadow-sm ${
                        isOwnMessage 
                          ? 'bg-green-100 text-blue-900 rounded-br-none' 
                          : 'bg-white text-blue-900 rounded-bl-none'
                      }`}
                    >
                      {message.content}
                    </div>
                    <div 
                      className={`text-xs mt-1 flex items-center ${
                        isOwnMessage ? 'justify-end text-blue-600' : 'text-blue-500'
                      }`}
                    >
                      {formatTime(message.timestamp)}
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
          className="flex-grow border-blue-200 focus:border-blue-400"
        />
        <Button 
          type="submit" 
          size="icon" 
          disabled={!messageInput.trim()}
          className={`rounded-full ${messageInput.trim() ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-300'}`}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
};

export default ChatView;
