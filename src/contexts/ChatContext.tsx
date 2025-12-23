import React, { createContext, useContext, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

type Message = {
    id: string;
    connection_id: string;
    sender_id: string;
    content: string;
    created_at: string;
    is_read: boolean;
};

type ChatContextType = {
    latestCode: string | null;
    setLatestCode: (code: string | null) => void;
    getMessagesForConnection: (connectionId: string) => Message[];
    sendMessage: (connectionId: string, content: string) => Promise<void>;
    markMessagesAsRead: (connectionId: string) => Promise<void>;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const [latestCode, setLatestCode] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);

    const getMessagesForConnection = (connectionId: string): Message[] => {
        return messages.filter(m => m.connection_id === connectionId);
    };

    const sendMessage = async (connectionId: string, content: string) => {
        if (!user?.id) return;

        const { data, error } = await supabase.from("messages").insert({
            connection_id: connectionId,
            sender_id: user.id,
            content,
        }).select().single();

        if (!error && data) {
            setMessages(prev => [...prev, data as Message]);
        }
    };

    const markMessagesAsRead = async (connectionId: string) => {
        if (!user?.id) return;

        await supabase
            .from("messages")
            .update({ is_read: true })
            .eq("connection_id", connectionId)
            .neq("sender_id", user.id);
    };

    return (
        <ChatContext.Provider value={{ 
            latestCode, 
            setLatestCode,
            getMessagesForConnection,
            sendMessage,
            markMessagesAsRead
        }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) throw new Error("useChat must be used within ChatProvider");
    return context;
};