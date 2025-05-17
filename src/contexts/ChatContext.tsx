
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { Connection, useConnection } from './ConnectionContext';

export type Message = {
  id: string;
  connectionId: string;
  senderId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
};

type ChatContextType = {
  messages: Record<string, Message[]>;
  sendMessage: (connectionId: string, content: string) => void;
  getMessagesForConnection: (connectionId: string) => Message[];
  markMessagesAsRead: (connectionId: string) => void;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { connections } = useConnection();
  const [messages, setMessages] = useState<Record<string, Message[]>>({});

  // For demo: load messages from localStorage
  useEffect(() => {
    if (user) {
      const storedMessages = localStorage.getItem(`networx-messages-${user.id}`);
      if (storedMessages) {
        setMessages(JSON.parse(storedMessages));
      } else {
        // Create initial messages for demo connections
        const initialMessages: Record<string, Message[]> = {};
        
        connections.forEach(connection => {
          initialMessages[connection.id] = [
            {
              id: crypto.randomUUID(),
              connectionId: connection.id,
              senderId: connection.userId,
              content: "Hey there! This is a demo message.",
              timestamp: new Date(Date.now() - 3600000).toISOString(),
              isRead: true
            },
            {
              id: crypto.randomUUID(),
              connectionId: connection.id,
              senderId: user.id,
              content: "Hi! Nice to meet you through NetworX!",
              timestamp: new Date(Date.now() - 3000000).toISOString(),
              isRead: true
            },
            {
              id: crypto.randomUUID(),
              connectionId: connection.id,
              senderId: connection.userId,
              content: connection.lastMessage?.content || "How's it going?",
              timestamp: connection.lastMessage?.timestamp || new Date().toISOString(),
              isRead: connection.lastMessage?.isRead || false
            }
          ];
        });
        
        setMessages(initialMessages);
        localStorage.setItem(`networx-messages-${user.id}`, JSON.stringify(initialMessages));
      }
    }
  }, [user, connections]);

  // Update localStorage when messages change
  useEffect(() => {
    if (user && Object.keys(messages).length > 0) {
      localStorage.setItem(`networx-messages-${user.id}`, JSON.stringify(messages));
    }
  }, [messages, user]);

  const sendMessage = (connectionId: string, content: string) => {
    if (!content.trim()) return;
    
    const newMessage: Message = {
      id: crypto.randomUUID(),
      connectionId,
      senderId: user?.id || '',
      content,
      timestamp: new Date().toISOString(),
      isRead: false
    };
    
    setMessages(prev => {
      const connectionMessages = prev[connectionId] || [];
      return {
        ...prev,
        [connectionId]: [...connectionMessages, newMessage]
      };
    });
  };

  const getMessagesForConnection = (connectionId: string): Message[] => {
    return messages[connectionId] || [];
  };

  const markMessagesAsRead = (connectionId: string) => {
    setMessages(prev => {
      const connectionMessages = prev[connectionId] || [];
      const updatedMessages = connectionMessages.map(msg => 
        msg.senderId !== user?.id && !msg.isRead 
          ? { ...msg, isRead: true } 
          : msg
      );
      
      return {
        ...prev,
        [connectionId]: updatedMessages
      };
    });
  };

  const value = {
    messages,
    sendMessage,
    getMessagesForConnection,
    markMessagesAsRead
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
