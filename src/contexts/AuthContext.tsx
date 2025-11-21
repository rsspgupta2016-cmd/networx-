import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

type AuthContextType = {
    user: any | null;
    setUser: (user: any | null) => void;
    isLoading: boolean;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Initialize auth session
        const initAuth = async () => {
            try {
                const { data: sessionData } = await supabase.auth.getSession();
                if (sessionData?.session?.user) {
                    setUser(sessionData.session.user);
                } else {
                    // Fallback to getUser() if session exists but user info not loaded
                    const { data: userData } = await supabase.auth.getUser();
                    setUser(userData?.user ?? null);
                }
            } catch (err) {
                console.error("Auth load error:", err);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();

        // Listen for auth changes (login, logout, token refresh)
        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => {
            listener.subscription.unsubscribe();
        };
    }, []);

    const logout = async () => {
        try {
            await supabase.auth.signOut();
            setUser(null);
        } catch (err) {
            console.error("Logout error:", err);
        }
    };

    return (
        <AuthContext.Provider value={{ user, setUser, isLoading, logout }}>
            {!isLoading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};
