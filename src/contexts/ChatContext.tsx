
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useConnection } from './ConnectionContext';
import { supabase } from '@/integrations/supabase/client';

export type Message = {
  id: string;
  connection_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
};

type ChatContextType = {
  messages: Record<string, Message[]>;
  sendMessage: (connectionId: string, content: string) => void;
  getMessagesForConnection: (connectionId: string) => Message[];
  markMessagesAsRead: (connectionId: string) => void;
  isLoading: boolean;
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user && connections.length > 0) {
      loadMessages();
    }
  }, [user, connections]);

  const loadMessages = async () => {
    if (!user || connections.length === 0) return;

    try {
      const connectionIds = connections.map(conn => conn.id);
      
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .in('connection_id', connectionIds)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Group messages by connection_id
      const groupedMessages: Record<string, Message[]> = {};
      data?.forEach(message => {
        if (!groupedMessages[message.connection_id]) {
          groupedMessages[message.connection_id] = [];
        }
        groupedMessages[message.connection_id].push(message);
      });

      setMessages(groupedMessages);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (connectionId: string, content: string) => {
    if (!content.trim() || !user) return;
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          connection_id: connectionId,
          sender_id: user.id,
          content,
        })
        .select()
        .single();

      if (error) throw error;

      setMessages(prev => {
        const connectionMessages = prev[connectionId] || [];
        return {
          ...prev,
          [connectionId]: [...connectionMessages, data]
        };
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const getMessagesForConnection = (connectionId: string): Message[] => {
    return messages[connectionId] || [];
  };

  const markMessagesAsRead = async (connectionId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('connection_id', connectionId)
        .neq('sender_id', user.id)
        .eq('is_read', false);

      if (error) throw error;

      setMessages(prev => {
        const connectionMessages = prev[connectionId] || [];
        const updatedMessages = connectionMessages.map(msg => 
          msg.sender_id !== user.id && !msg.is_read 
            ? { ...msg, is_read: true } 
            : msg
        );
        
        return {
          ...prev,
          [connectionId]: updatedMessages
        };
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const value = {
    messages,
    sendMessage,
    getMessagesForConnection,
    markMessagesAsRead,
    isLoading,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
