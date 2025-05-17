
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';

type User = {
  id: string;
  phoneNumber: string;
  displayName: string;
  profileImage?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (phoneNumber: string, code: string) => Promise<void>;
  signup: (phoneNumber: string, displayName: string) => Promise<void>;
  logout: () => void;
  sendVerificationCode: (phoneNumber: string) => Promise<void>;
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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // For demo purposes, check if user exists in localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem('networx-user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (phoneNumber: string, code: string) => {
    try {
      setIsLoading(true);
      
      // In a real app, this would verify the code with Supabase/backend
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      
      // For demo: validate code (would be done by backend)
      if (code !== '123456') {
        throw new Error("Invalid verification code");
      }
      
      // Check if user exists in our mock database
      const mockUser = {
        id: crypto.randomUUID(),
        phoneNumber,
        displayName: phoneNumber.replace('+', '') // Default name
      };

      setUser(mockUser);
      localStorage.setItem('networx-user', JSON.stringify(mockUser));
      toast({
        title: "Welcome back!",
        description: "You have successfully logged in.",
      });
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (phoneNumber: string, displayName: string) => {
    try {
      setIsLoading(true);
      
      // In a real app, this would create a user in Supabase
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      
      const newUser = {
        id: crypto.randomUUID(),
        phoneNumber,
        displayName: displayName || phoneNumber.replace('+', '')
      };

      setUser(newUser);
      localStorage.setItem('networx-user', JSON.stringify(newUser));
      toast({
        title: "Account created!",
        description: "Your NetworX account has been created successfully.",
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

  const sendVerificationCode = async (phoneNumber: string) => {
    try {
      // In a real app, this would send an SMS via Supabase Functions
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast({
        title: "Verification code sent",
        description: `A code has been sent to ${phoneNumber}`,
      });
      
      return true;
    } catch (error: any) {
      toast({
        title: "Failed to send code",
        description: error.message || "Please try again later",
        variant: "destructive",
      });
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('networx-user');
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
  };

  const value = {
    user,
    isLoading,
    login,
    signup,
    logout,
    sendVerificationCode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
