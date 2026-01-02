import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";
import { Connection, CodeSettings, CodeStatus } from "@/types/connection";

type ConnectionContextType = {
    connections: Connection[];
    activeConnection: Connection | null;
    setActiveConnection: (conn: Connection | null) => void;
    currentCode: CodeStatus | null;
    codeSettings: CodeSettings;
    generateConnectionCode: () => Promise<void>;
    refreshCode: () => Promise<void>;
    handleSaveCodeSettings: (settings: Partial<CodeSettings>) => Promise<void>;
    updateConnectionName: (connectionId: string, newName: string) => Promise<void>;
    fetchConnections: () => Promise<void>;
};

const defaultCodeSettings: CodeSettings = {
    expirationMinutes: 15,
    maxUses: 1,
    permanentCode: null,
    usePermanentCode: false,
};

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined);

export const ConnectionProvider = ({ children }: { children: ReactNode }) => {
    const { user } = useAuth();
    const [connections, setConnections] = useState<Connection[]>([]);
    const [activeConnection, setActiveConnection] = useState<Connection | null>(null);
    const [currentCode, setCurrentCode] = useState<CodeStatus | null>(null);
    const [codeSettings, setCodeSettings] = useState<CodeSettings>(defaultCodeSettings);

    // Fetch connections when user changes
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
                    name: conn.custom_name || conn.name,
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

    useEffect(() => {
        fetchConnections();
    }, [user]);

    // Fetch code settings on user load
    useEffect(() => {
        const fetchCodeSettings = async () => {
            if (!user?.id) return;

            const { data, error } = await supabase
                .from("code_settings")
                .select("*")
                .eq("user_id", user.id)
                .maybeSingle();

            if (!error && data) {
                setCodeSettings({
                    expirationMinutes: data.default_expiration_minutes ?? 15,
                    maxUses: data.default_max_uses ?? 1,
                    permanentCode: data.permanent_code ?? null,
                    usePermanentCode: data.use_permanent_code ?? false,
                });
            }
        };

        fetchCodeSettings();
    }, [user]);

    // Load current active code on mount
    useEffect(() => {
        if (user?.id) {
            refreshCode();
        }
    }, [user]);

    const generateCode = () => {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    };

    const generateConnectionCode = async () => {
        if (!user?.id) return;

        // If using permanent code, use that instead
        if (codeSettings.usePermanentCode && codeSettings.permanentCode) {
            // Check if permanent code already exists
            const { data: existingCode } = await supabase
                .from("connection_codes")
                .select("*")
                .eq("user_id", user.id)
                .eq("code", codeSettings.permanentCode)
                .eq("is_permanent", true)
                .eq("is_active", true)
                .maybeSingle();

            if (!existingCode) {
                // Create permanent code
                await supabase.from("connection_codes").insert({
                    user_id: user.id,
                    code: codeSettings.permanentCode,
                    is_permanent: true,
                    is_active: true,
                    max_uses: null,
                    expires_at: null,
                    expiration_minutes: null,
                });
            }

            setCurrentCode({
                code: codeSettings.permanentCode,
                createdAt: new Date().toISOString(),
                settings: codeSettings,
                usesLeft: null,
                isExpired: false,
                isPermanent: true,
            });
            return;
        }

        // Deactivate any existing active codes for this user (non-permanent)
        await supabase
            .from("connection_codes")
            .update({ is_active: false })
            .eq("user_id", user.id)
            .eq("is_permanent", false);

        const code = generateCode();
        const expiresAt = codeSettings.expirationMinutes
            ? new Date(Date.now() + codeSettings.expirationMinutes * 60 * 1000).toISOString()
            : null;

        const { error } = await supabase.from("connection_codes").insert({
            user_id: user.id,
            code,
            expires_at: expiresAt,
            expiration_minutes: codeSettings.expirationMinutes,
            max_uses: codeSettings.maxUses,
            is_permanent: false,
        });

        if (!error) {
            setCurrentCode({
                code,
                createdAt: new Date().toISOString(),
                settings: codeSettings,
                usesLeft: codeSettings.maxUses,
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
            .maybeSingle();

        if (!error && data) {
            const isExpired = data.expires_at ? new Date(data.expires_at) < new Date() : false;
            const usesExhausted = data.max_uses && data.current_uses && data.current_uses >= data.max_uses;

            // If code is expired or uses exhausted and not permanent, generate new code
            if ((isExpired || usesExhausted) && !data.is_permanent) {
                await generateConnectionCode();
                return;
            }

            setCurrentCode({
                code: data.code,
                createdAt: data.created_at ?? new Date().toISOString(),
                settings: {
                    expirationMinutes: data.expiration_minutes,
                    maxUses: data.max_uses,
                    permanentCode: data.is_permanent ? data.code : null,
                    usePermanentCode: data.is_permanent ?? false,
                },
                usesLeft: data.max_uses ? data.max_uses - (data.current_uses ?? 0) : null,
                isExpired,
                isPermanent: data.is_permanent ?? false,
            });
        } else {
            // No active code, generate one
            await generateConnectionCode();
        }
    };

    const handleSaveCodeSettings = async (settings: Partial<CodeSettings>) => {
        if (!user?.id) return;

        const newSettings = { ...codeSettings, ...settings };
        setCodeSettings(newSettings);

        // Upsert code_settings
        const { error } = await supabase
            .from("code_settings")
            .upsert({
                user_id: user.id,
                default_expiration_minutes: newSettings.expirationMinutes,
                default_max_uses: newSettings.maxUses,
                permanent_code: newSettings.permanentCode,
                use_permanent_code: newSettings.usePermanentCode,
                updated_at: new Date().toISOString(),
            }, { onConflict: 'user_id' });

        if (error) {
            console.error("Error saving code settings:", error);
        } else {
            // Regenerate code with new settings
            await generateConnectionCode();
        }
    };

    const updateConnectionName = async (connectionId: string, newName: string) => {
        if (!user?.id) return;

        const { error } = await supabase
            .from("connections")
            .update({ custom_name: newName, updated_at: new Date().toISOString() })
            .eq("id", connectionId)
            .eq("user_id", user.id);

        if (!error) {
            setConnections((prev) =>
                prev.map((conn) =>
                    conn.id === connectionId ? { ...conn, name: newName, custom_name: newName } : conn
                )
            );
        }
    };

    return (
        <ConnectionContext.Provider value={{
            connections,
            activeConnection,
            setActiveConnection,
            currentCode,
            codeSettings,
            generateConnectionCode,
            refreshCode,
            handleSaveCodeSettings,
            updateConnectionName,
            fetchConnections,
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
