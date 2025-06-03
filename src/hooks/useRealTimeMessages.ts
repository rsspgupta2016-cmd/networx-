
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface Message {
  id: string;
  content: string;
  sender_id: string;
  connection_id: string;
  created_at: string;
  is_read: boolean;
}

export const useRealTimeMessages = (connectionId: string | null) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load initial messages
  useEffect(() => {
    if (!connectionId || !user) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    const loadMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .eq('connection_id', connectionId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data || []);
      } catch (error) {
        console.error('Error loading messages:', error);
        toast({
          title: "Error loading messages",
          description: "Unable to load conversation history",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [connectionId, user]);

  // Set up real-time subscription
  useEffect(() => {
    if (!connectionId || !user) return;

    const channel = supabase
      .channel('messages-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `connection_id=eq.${connectionId}`
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages(prev => [...prev, newMessage]);
          
          // Show notification for messages from others
          if (newMessage.sender_id !== user.id) {
            toast({
              title: "New message",
              description: newMessage.content.substring(0, 50) + (newMessage.content.length > 50 ? '...' : ''),
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `connection_id=eq.${connectionId}`
        },
        (payload) => {
          const updatedMessage = payload.new as Message;
          setMessages(prev => 
            prev.map(msg => 
              msg.id === updatedMessage.id ? updatedMessage : msg
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [connectionId, user]);

  const sendMessage = async (content: string) => {
    if (!connectionId || !user || !content.trim()) return;

    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          content: content.trim(),
          sender_id: user.id,
          connection_id: connectionId,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Failed to send message",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  return {
    messages,
    isLoading,
    sendMessage,
    markAsRead
  };
};
