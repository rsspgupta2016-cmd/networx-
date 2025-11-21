import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useConnection } from "./ConnectionContext";
import { useAuth } from "./AuthContext";

type ChatContextType = {
    latestCode: string | null;
    setLatestCode: (code: string | null) => void;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
    const { activeConnection } = useConnection();
    const { user } = useAuth();

    const [latestCode, setLatestCode] = useState<string | null>(null);

    // Fetch latest code from backend when user or activeConnection changes
    useEffect(() => {
        const fetchLatestCode = async () => {
            if (!user || !activeConnection) return; // safety check
            try {
                const { data, error } = await activeConnection.supabase
                    .from("connections")
                    .select("*")
                    .eq("created_by", user.id)
                    .eq("verified", false)
                    .order("created_at", { ascending: false })
                    .limit(1);

                if (error) {
                    console.error("Supabase fetch error:", error.message);
                    return;
                }

                if (data && data.length > 0) {
                    setLatestCode(data[0].code || null);
                }
            } catch (err) {
                console.error("Fetch latest code error:", err);
            }
        };

        fetchLatestCode();
    }, [user, activeConnection]);

    return (
        <ChatContext.Provider value={{ latestCode, setLatestCode }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) throw new Error("useChat must be used within ChatProvider");
    return context;
};
