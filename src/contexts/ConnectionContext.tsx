import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { Connection, CodeSettings, CodeStatus } from "@/types/connection";

type ConnectionContextType = {
    connections: Connection[];
    activeConnection: Connection | null;
    setActiveConnection: (conn: Connection | null) => void;
    currentCode: CodeStatus | null;
    generateConnectionCode: () => Promise<void>;
    refreshCode: () => Promise<void>;
    handleSaveCodeSettings: (settings: Partial<CodeSettings>) => Promise<void>;
};

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined);

export const ConnectionProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const [connections, setConnections] = useState<Connection[]>([]);
    const [activeConnection, setActiveConnection] = useState<Connection | null>(null);
    const [currentCode, setCurrentCode] = useState<CodeStatus | null>(null);

    // Fetch connections when user changes
    useEffect(() => {
        const fetchConnections = async () => {
            if (!user?.id) return;

            try {
                const { data, error } = await supabase
                    .from("connections")
                    .select("*")
                    .eq("user_id", user.id)
                    .order("created_at", { ascending: false });

                if (error) {
                    console.error("Supabase fetch error:", error.message);
                    return;
                }

                if (data) {
                    const mapped: Connection[] = data.map((conn) => ({
                        id: conn.id,
                        user_id: conn.user_id,
                        connected_user_id: conn.connected_user_id ?? undefined,
                        name: conn.name,
                        custom_name: conn.custom_name ?? undefined,
                        identity_code: conn.identity_code ?? undefined,
                        profile_image: conn.profile_image ?? undefined,
                        is_muted: conn.is_muted ?? false,
                        calls_muted: conn.calls_muted ?? false,
                        is_industry: conn.is_industry ?? false,
                        created_at: conn.created_at ?? undefined,
                        updated_at: conn.updated_at ?? undefined,
                    }));
                    setConnections(mapped);
                }
            } catch (err) {
                console.error("Fetch connections error:", err);
            }
        };

        fetchConnections();
    }, [user]);

    const generateConnectionCode = async () => {
        if (!user?.id) return;
        
        const code = Math.random().toString(36).substring(2, 8).toUpperCase();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        
        const { error } = await supabase.from("connection_codes").insert({
            user_id: user.id,
            code,
            expires_at: expiresAt,
            expiration_minutes: 15,
            max_uses: 1,
        });

        if (!error) {
            setCurrentCode({
                code,
                createdAt: new Date().toISOString(),
                settings: {
                    expirationMinutes: 15,
                    maxUses: 1,
                    permanentCode: null,
                    usePermanentCode: false,
                },
                usesLeft: 1,
                isExpired: false,
                isPermanent: false,
            });
        }
    };

    const refreshCode = async () => {
        if (!user?.id) return;
        
        const { data, error } = await supabase
            .from("connection_codes")
            .select("*")
            .eq("user_id", user.id)
            .eq("is_active", true)
            .order("created_at", { ascending: false })
            .limit(1)
            .single();

        if (!error && data) {
            setCurrentCode({
                code: data.code,
                createdAt: data.created_at ?? new Date().toISOString(),
                settings: {
                    expirationMinutes: data.expiration_minutes,
                    maxUses: data.max_uses,
                    permanentCode: null,
                    usePermanentCode: data.is_permanent ?? false,
                },
                usesLeft: data.max_uses ? data.max_uses - (data.current_uses ?? 0) : null,
                isExpired: data.expires_at ? new Date(data.expires_at) < new Date() : false,
                isPermanent: data.is_permanent ?? false,
            });
        }
    };

    const handleSaveCodeSettings = async (settings: Partial<CodeSettings>) => {
        if (!user?.id) return;
        console.log("Saving code settings:", settings);
    };

    return (
        <ConnectionContext.Provider value={{ 
            connections, 
            activeConnection, 
            setActiveConnection,
            currentCode,
            generateConnectionCode,
            refreshCode,
            handleSaveCodeSettings
        }}>
            {children}
        </ConnectionContext.Provider>
    );
};

export const useConnection = () => {
    const context = useContext(ConnectionContext);
    if (!context) throw new Error("useConnection must be used within ConnectionProvider");
    return context;
};

export type { Connection };