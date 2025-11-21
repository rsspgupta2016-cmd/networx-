import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

export type Connection = {
    id: string;
    code: string;
    verified: boolean;
    created_at: string;
    created_by: string;
};

type ConnectionContextType = {
    connections: Connection[];
    activeConnection: Connection | null;
    setActiveConnection: (conn: Connection | null) => void;
};

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined);

export const ConnectionProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const [connections, setConnections] = useState<Connection[]>([]);
    const [activeConnection, setActiveConnection] = useState<Connection | null>(null);

    // Fetch connections when user changes
    useEffect(() => {
        const fetchConnections = async () => {
            if (!user?.id) return; // safety check

            try {
                const { data, error } = await supabase
                    .from("connections")
                    .select("*")
                    .eq("created_by", user.id)
                    .order("created_at", { ascending: false });

                if (error) {
                    console.error("Supabase fetch error:", error.message);
                    return;
                }

                if (data) setConnections(data);
            } catch (err) {
                console.error("Fetch connections error:", err);
            }
        };

        fetchConnections();
    }, [user]);

    return (
        <ConnectionContext.Provider value={{ connections, activeConnection, setActiveConnection }}>
            {children}
        </ConnectionContext.Provider>
    );
};

export const useConnection = () => {
    const context = useContext(ConnectionContext);
    if (!context) throw new Error("useConnection must be used within ConnectionProvider");
    return context;
};
