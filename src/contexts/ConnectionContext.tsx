
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { toast } from '@/hooks/use-toast';

export type Connection = {
  id: string;
  userId: string;
  name: string;
  lastMessage?: {
    content: string;
    timestamp: string;
    isRead: boolean;
  };
  profileImage?: string;
  connectionCode?: string;
  blocked: boolean;
};

export type CodeSettings = {
  expirationMinutes: number;
  maxUses: number;
};

type CodeStatus = {
  code: string;
  createdAt: string;
  settings: CodeSettings;
  usesLeft: number;
  isExpired: boolean;
};

type ConnectionContextType = {
  connections: Connection[];
  activeConnection: Connection | null;
  setActiveConnection: (connection: Connection | null) => void;
  generateConnectionCode: (settings?: Partial<CodeSettings>) => string;
  verifyConnectionCode: (code: string) => Promise<boolean>;
  addConnection: (connection: Connection) => void;
  removeConnection: (connectionId: string) => void;
  blockConnection: (connectionId: string) => void;
  currentCode: CodeStatus | null;
  updateCodeSettings: (settings: Partial<CodeSettings>) => void;
  defaultCodeSettings: CodeSettings;
};

const DEFAULT_CODE_SETTINGS: CodeSettings = {
  expirationMinutes: 5,
  maxUses: 1,
};

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined);

export const useConnection = () => {
  const context = useContext(ConnectionContext);
  if (context === undefined) {
    throw new Error("useConnection must be used within a ConnectionProvider");
  }
  return context;
};

export const ConnectionProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [connections, setConnections] = useState<Connection[]>([]);
  const [activeConnection, setActiveConnection] = useState<Connection | null>(null);
  const [currentCode, setCurrentCode] = useState<CodeStatus | null>(null);
  const [defaultCodeSettings, setDefaultCodeSettings] = useState<CodeSettings>(DEFAULT_CODE_SETTINGS);

  // For demo: load mock connections from localStorage
  useEffect(() => {
    if (user) {
      const storedConnections = localStorage.getItem(`networx-connections-${user.id}`);
      if (storedConnections) {
        setConnections(JSON.parse(storedConnections));
      } else {
        // Add some dummy connections for demo
        const demoConnections: Connection[] = [
          {
            id: '1',
            userId: 'user-1',
            name: 'Alice Smith',
            lastMessage: {
              content: 'Hey, how are you doing?',
              timestamp: new Date().toISOString(),
              isRead: false,
            },
            blocked: false,
          },
          {
            id: '2',
            userId: 'user-2',
            name: 'Bob Johnson',
            lastMessage: {
              content: 'Did you see the movie last night?',
              timestamp: new Date(Date.now() - 3600000).toISOString(),
              isRead: true,
            },
            blocked: false,
          },
        ];
        setConnections(demoConnections);
        localStorage.setItem(`networx-connections-${user.id}`, JSON.stringify(demoConnections));
      }
      
      // Also load any active code
      const storedCode = localStorage.getItem(`networx-connection-code-${user.id}`);
      if (storedCode) {
        const parsedCode = JSON.parse(storedCode) as CodeStatus;
        
        // Check if code is expired
        const expirationTime = new Date(parsedCode.createdAt).getTime() + 
          (parsedCode.settings.expirationMinutes * 60 * 1000);
        
        if (expirationTime > Date.now() && parsedCode.usesLeft > 0) {
          setCurrentCode({
            ...parsedCode,
            isExpired: false
          });
        } else {
          // Clean up expired code
          localStorage.removeItem(`networx-connection-code-${user.id}`);
          setCurrentCode(null);
        }
      }
      
      // Load custom settings
      const storedSettings = localStorage.getItem(`networx-code-settings-${user.id}`);
      if (storedSettings) {
        setDefaultCodeSettings(JSON.parse(storedSettings));
      }
    }
  }, [user]);

  // Update localStorage when connections change
  useEffect(() => {
    if (user && connections.length > 0) {
      localStorage.setItem(`networx-connections-${user.id}`, JSON.stringify(connections));
    }
  }, [connections, user]);

  // Check for code expiration
  useEffect(() => {
    if (!currentCode || !user) return;
    
    const checkCodeExpiration = () => {
      const expirationTime = new Date(currentCode.createdAt).getTime() + 
        (currentCode.settings.expirationMinutes * 60 * 1000);
      
      if (expirationTime <= Date.now() || currentCode.usesLeft <= 0) {
        localStorage.removeItem(`networx-connection-code-${user.id}`);
        setCurrentCode(null);
        toast({
          title: "Connection code expired",
          description: "Your one-time code is no longer valid",
        });
      }
    };
    
    const intervalId = setInterval(checkCodeExpiration, 10000); // Check every 10 seconds
    return () => clearInterval(intervalId);
  }, [currentCode, user]);

  const updateCodeSettings = (settings: Partial<CodeSettings>) => {
    const newSettings = {
      ...defaultCodeSettings,
      ...settings
    };
    
    setDefaultCodeSettings(newSettings);
    if (user) {
      localStorage.setItem(`networx-code-settings-${user.id}`, JSON.stringify(newSettings));
    }
    
    toast({
      title: "Settings updated",
      description: "Your connection code settings have been saved",
    });
  };

  const generateConnectionCode = (customSettings?: Partial<CodeSettings>) => {
    // Generate a random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Use custom settings or default
    const settings = {
      ...defaultCodeSettings,
      ...(customSettings || {})
    };
    
    // Create code status object
    const codeStatus: CodeStatus = {
      code,
      createdAt: new Date().toISOString(),
      settings,
      usesLeft: settings.maxUses,
      isExpired: false
    };
    
    // Store in state and localStorage
    setCurrentCode(codeStatus);
    
    if (user) {
      localStorage.setItem(`networx-connection-code-${user.id}`, JSON.stringify(codeStatus));
      
      // Set code to expire
      const expirationTime = settings.expirationMinutes * 60 * 1000;
      setTimeout(() => {
        const currentStoredCode = localStorage.getItem(`networx-connection-code-${user.id}`);
        if (currentStoredCode) {
          const parsedCode = JSON.parse(currentStoredCode);
          if (parsedCode.code === code) {
            localStorage.removeItem(`networx-connection-code-${user.id}`);
            setCurrentCode(null);
          }
        }
      }, expirationTime);
    }
    
    return code;
  };

  const verifyConnectionCode = async (code: string): Promise<boolean> => {
    // In a real app, this would verify with the backend
    // For demo, we'll simulate a successful connection
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update the uses left
    if (currentCode && currentCode.code === code) {
      const updatedUsesLeft = currentCode.usesLeft - 1;
      const updatedCode = {
        ...currentCode,
        usesLeft: updatedUsesLeft
      };
      
      setCurrentCode(updatedCode);
      if (user) {
        if (updatedUsesLeft <= 0) {
          localStorage.removeItem(`networx-connection-code-${user.id}`);
          setCurrentCode(null);
        } else {
          localStorage.setItem(`networx-connection-code-${user.id}`, JSON.stringify(updatedCode));
        }
      }
    }
    
    // Add a mock connection for the code
    const newConnection: Connection = {
      id: crypto.randomUUID(),
      userId: `user-${Math.floor(Math.random() * 1000)}`,
      name: `User ${Math.floor(Math.random() * 100)}`,
      lastMessage: {
        content: 'Connected via one-time code',
        timestamp: new Date().toISOString(),
        isRead: false,
      },
      blocked: false,
    };
    
    addConnection(newConnection);
    toast({
      title: "Connection successful!",
      description: `You're now connected with ${newConnection.name}`,
    });
    
    return true;
  };

  const addConnection = (connection: Connection) => {
    setConnections(prev => [...prev, connection]);
  };

  const removeConnection = (connectionId: string) => {
    setConnections(prev => prev.filter(conn => conn.id !== connectionId));
    if (activeConnection?.id === connectionId) {
      setActiveConnection(null);
    }
    toast({
      title: "Connection removed",
      description: "This contact can no longer message you",
    });
  };

  const blockConnection = (connectionId: string) => {
    setConnections(prev => 
      prev.map(conn => 
        conn.id === connectionId 
          ? { ...conn, blocked: true } 
          : conn
      )
    );
    if (activeConnection?.id === connectionId) {
      setActiveConnection(null);
    }
    toast({
      title: "Contact blocked",
      description: "This contact can no longer message you and cannot reconnect",
      variant: "destructive",
    });
  };

  const value = {
    connections,
    activeConnection,
    setActiveConnection,
    generateConnectionCode,
    verifyConnectionCode,
    addConnection,
    removeConnection,
    blockConnection,
    currentCode,
    updateCodeSettings,
    defaultCodeSettings,
  };

  return <ConnectionContext.Provider value={value}>{children}</ConnectionContext.Provider>;
};
