import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

type AuthContextType = {
    user: any | null;
    setUser: (user: any | null) => void;
    isLoading: boolean;
    logout: () => Promise<void>;
    handleLogout: () => Promise<void>;
    loginWithEmail: (email: string, password: string) => Promise<void>;
    signupWithEmail: (email: string, password: string) => Promise<void>;
    sendEmailOtp: (email: string) => Promise<void>;
    verifyEmailOtp: (email: string, code: string) => Promise<void>;
    loginWithEmailPassword: (email: string, password: string) => Promise<void>;
    signupWithOTP: (phone: string) => Promise<void>;
    verifyOTP: (phone: string, otp: string, type: 'phone' | 'email') => Promise<void>;
    signup: (identifier: string, password: string, displayName: string, interests: string[]) => Promise<void>;
    updateUserProfile: (data: { displayName?: string; interests?: string[] }) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initAuth = async () => {
            try {
                const { data: sessionData } = await supabase.auth.getSession();
                const sessionUser = sessionData?.session?.user;

                if (sessionUser) {
                    setUser(sessionUser);
                    return;
                }

                const { data: userData } = await supabase.auth.getUser();
                if (userData?.user) {
                    setUser(userData.user);
                    return;
                }

                // Demo login support (dummy OTP)
                const demoPhone = localStorage.getItem("demo_user_phone");
                if (demoPhone) {
                    setUser({
                        id: `demo-${demoPhone}`,
                        phone: demoPhone,
                        displayName: demoPhone,
                        identityCode: "DEMO",
                        isDemo: true,
                    });
                    return;
                }

                setUser(null);
            } catch (err) {
                console.error("Auth load error:", err);
                setUser(null);
            } finally {
                setIsLoading(false);
            }
        };

        initAuth();

        const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
            const demoPhone = localStorage.getItem("demo_user_phone");
            setUser(
                session?.user ??
                    (demoPhone
                        ? {
                              id: `demo-${demoPhone}`,
                              phone: demoPhone,
                              displayName: demoPhone,
                              identityCode: "DEMO",
                              isDemo: true,
                          }
                        : null)
            );
        });

        return () => {
            listener.subscription.unsubscribe();
        };
    }, []);

    const logout = async () => {
        try {
            // Clear demo login (dummy OTP)
            localStorage.removeItem("demo_user_phone");

            await supabase.auth.signOut();
            setUser(null);
        } catch (err) {
            console.error("Logout error:", err);
        }
    };

    const handleLogout = logout;

    const loginWithEmail = async (email: string, password: string) => {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
    };

    const signupWithEmail = async (email: string, password: string) => {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
    };

    const sendEmailOtp = async (email: string) => {
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) throw error;
    };

    const verifyEmailOtp = async (email: string, code: string) => {
        const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
        if (error) throw error;
    };

    const loginWithEmailPassword = loginWithEmail;

    const signupWithOTP = async (phone: string) => {
        const { error } = await supabase.auth.signInWithOtp({ phone });
        if (error) throw error;
    };

    const verifyOTP = async (phone: string, otp: string, type: 'phone' | 'email') => {
        if (type === 'phone') {
            const { error } = await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' });
            if (error) throw error;
        } else {
            const { error } = await supabase.auth.verifyOtp({ email: phone, token: otp, type: 'email' });
            if (error) throw error;
        }
    };

    const signup = async (identifier: string, password: string, displayName: string, interests: string[]) => {
        // Profile creation handled by trigger
        console.log("Signup complete for:", identifier, displayName, interests);
    };

    const updateUserProfile = async (data: { displayName?: string; interests?: string[] }) => {
        if (!user?.id) return;
        const { error } = await supabase
            .from("profiles")
            .update({ full_name: data.displayName })
            .eq("id", user.id);
        if (error) throw error;
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            setUser, 
            isLoading, 
            logout,
            handleLogout,
            loginWithEmail,
            signupWithEmail,
            sendEmailOtp,
            verifyEmailOtp,
            loginWithEmailPassword,
            signupWithOTP,
            verifyOTP,
            signup,
            updateUserProfile
        }}>
            {!isLoading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};