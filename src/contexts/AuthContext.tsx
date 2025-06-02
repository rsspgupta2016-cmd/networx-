import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import type { User } from '@supabase/supabase-js';

type AuthUser = {
  id: string;
  phone: string;
  displayName: string;
  profileImage?: string;
  identityCode?: string;
  interests: string[];
};

type AuthContextType = {
  user: AuthUser | null;
  isLoading: boolean;
  loginWithOTP: (phone: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithOTP: (phone: string) => Promise<void>;
  signupWithEmail: (email: string, password: string) => Promise<void>;
  verifyOTP: (identifier: string, token: string, type: 'phone' | 'email') => Promise<void>;
  signup: (phone: string, password: string, displayName: string, interests: string[]) => Promise<void>;
  logout: () => void;
  updateUserProfile: (updates: Partial<Omit<AuthUser, 'id' | 'phone' | 'identityCode'>>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for demo user in localStorage first
    const demoUser = localStorage.getItem('demoUser');
    if (demoUser) {
      try {
        const parsedUser = JSON.parse(demoUser);
        setUser(parsedUser);
        setIsLoading(false);
        return;
      } catch (error) {
        localStorage.removeItem('demoUser');
      }
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user);
      }
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await loadUserProfile(session.user);
        } else {
          // Check for demo user when session is null
          const demoUser = localStorage.getItem('demoUser');
          if (demoUser) {
            try {
              const parsedUser = JSON.parse(demoUser);
              setUser(parsedUser);
            } catch (error) {
              setUser(null);
              localStorage.removeItem('demoUser');
            }
          } else {
            setUser(null);
          }
        }
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (authUser: User) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      setUser({
        id: authUser.id,
        phone: authUser.phone || authUser.email || '',
        displayName: profile?.full_name || authUser.phone || authUser.email || '',
        profileImage: profile?.avatar_url,
        identityCode: `NX-${authUser.id.slice(0, 8).toUpperCase()}`,
        interests: [],
      });
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const createDemoUser = (identifier: string) => {
    const demoUser = {
      id: `demo-${Date.now()}`,
      phone: identifier,
      displayName: identifier,
      identityCode: `NX-DEMO${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      interests: [],
    };
    
    // Store demo user in localStorage for persistence
    localStorage.setItem('demoUser', JSON.stringify(demoUser));
    setUser(demoUser);
    return demoUser;
  };

  const loginWithOTP = async (phone: string) => {
    try {
      setIsLoading(true);
      console.log('Demo: OTP would be sent to', phone);
      
      toast({
        title: "OTP sent (Demo)",
        description: "For demo purposes, use any 6-digit code to proceed.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to send OTP",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Login successful",
        description: "Welcome back!",
      });
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Invalid credentials",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signupWithOTP = async (phone: string) => {
    try {
      setIsLoading(true);
      console.log('Demo: OTP would be sent to', phone);
      
      toast({
        title: "OTP sent (Demo)",
        description: "For demo purposes, use any 6-digit code to proceed.",
      });
    } catch (error: any) {
      toast({
        title: "Failed to send OTP",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signupWithEmail = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/home`
        }
      });

      if (error) throw error;

      toast({
        title: "Check your email",
        description: "We've sent you a verification link.",
      });
    } catch (error: any) {
      toast({
        title: "Signup failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOTP = async (identifier: string, token: string, type: 'phone' | 'email') => {
    try {
      setIsLoading(true);
      
      if (type === 'phone') {
        // Demo OTP verification for phone
        if (token.length === 6) {
          const demoUser = createDemoUser(identifier);
          
          toast({
            title: "Phone verified (Demo)",
            description: "Your phone number has been verified successfully.",
          });
          return;
        } else {
          throw new Error('Please enter a 6-digit code');
        }
      } else {
        // Email OTP verification
        const { data, error } = await supabase.auth.verifyOtp({
          email: identifier,
          token,
          type: 'email'
        });

        if (error) throw error;

        toast({
          title: "Email verified",
          description: "Your email has been verified successfully.",
        });
      }
    } catch (error: any) {
      console.error('Verification error:', error);
      toast({
        title: "Verification failed",
        description: error.message || "Invalid verification code",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (phone: string, password: string, displayName: string, interests: string[] = []) => {
    try {
      setIsLoading(true);
      
      // Update the current user with display name and interests
      if (user) {
        const updatedUser = {
          ...user,
          displayName,
          interests
        };
        setUser(updatedUser);
        localStorage.setItem('demoUser', JSON.stringify(updatedUser));
      }

      toast({
        title: "Account created!",
        description: "Welcome to NetworX!",
      });
    } catch (error: any) {
      toast({
        title: "Signup failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };
  
  const updateUserProfile = async (updates: Partial<Omit<AuthUser, 'id' | 'phone' | 'identityCode'>>) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: updates.displayName,
          avatar_url: updates.profileImage,
        })
        .eq('id', user.id);

      if (error) throw error;
      
      setUser(prev => prev ? { ...prev, ...updates } : null);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      // Clear demo user from localStorage
      localStorage.removeItem('demoUser');
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      toast({
        title: "Logged out",
        description: "You have been logged out successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Logout failed",
        description: error.message || "Something went wrong",
      });
    }
  };

  const value = {
    user,
    isLoading,
    loginWithOTP,
    loginWithEmail,
    signupWithOTP,
    signupWithEmail,
    verifyOTP,
    signup,
    logout,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
