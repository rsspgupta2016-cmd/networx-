
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
  signupWithOTP: (phone: string) => Promise<void>;
  verifyOTP: (phone: string, token: string) => Promise<void>;
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
          setUser(null);
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

  const loginWithOTP = async (phone: string) => {
    try {
      setIsLoading(true);
      
      // For demo purposes, we'll simulate sending OTP
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

  const signupWithOTP = async (phone: string) => {
    try {
      setIsLoading(true);
      
      // For demo purposes, we'll simulate sending OTP
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

  const verifyOTP = async (phone: string, token: string) => {
    try {
      setIsLoading(true);
      
      // For demo purposes, accept any 6-digit OTP
      if (token.length === 6) {
        // Create a demo user with email auth (since phone auth isn't configured)
        const demoEmail = `${phone.replace(/\D/g, '')}@demo.netwox.com`;
        const demoPassword = 'demo123456';
        
        // Try to sign in first
        let { data, error } = await supabase.auth.signInWithPassword({
          email: demoEmail,
          password: demoPassword,
        });
        
        // If user doesn't exist, create them
        if (error && error.message.includes('Invalid login credentials')) {
          console.log('Creating new demo user...');
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: demoEmail,
            password: demoPassword,
            options: {
              data: {
                full_name: phone,
                phone: phone,
              },
              emailRedirectTo: undefined // Skip email confirmation for demo
            }
          });
          
          if (signUpError) throw signUpError;
          
          // For demo purposes, immediately sign in the user
          if (signUpData.user && !signUpData.user.email_confirmed_at) {
            console.log('Auto-confirming demo user...');
            // Try signing in again after signup
            const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
              email: demoEmail,
              password: demoPassword,
            });
            
            if (loginError && loginError.message.includes('Email not confirmed')) {
              // Create a demo session manually for development
              setUser({
                id: signUpData.user.id,
                phone: phone,
                displayName: phone,
                identityCode: `NX-${signUpData.user.id.slice(0, 8).toUpperCase()}`,
                interests: [],
              });
              
              toast({
                title: "Phone verified (Demo)",
                description: "Demo user created successfully.",
              });
              return;
            }
            
            data = loginData;
          }
        } else if (error) {
          throw error;
        }
        
        toast({
          title: "Phone verified (Demo)",
          description: "Your phone number has been verified successfully.",
        });
      } else {
        throw new Error('Please enter a 6-digit code');
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
      
      // Update the user's profile with the display name
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: displayName,
          phone: phone,
        }
      });

      if (error) throw error;

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
        variant: "destructive",
      });
    }
  };

  const value = {
    user,
    isLoading,
    loginWithOTP,
    signupWithOTP,
    verifyOTP,
    signup,
    logout,
    updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
