
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

type ConnectionContextType = {
  connections: Connection[];
  activeConnection: Connection | null;
  setActiveConnection: (connection: Connection | null) => void;
  generateConnectionCode: () => string;
  verifyConnectionCode: (code: string) => Promise<boolean>;
  addConnection: (connection: Connection) => void;
  removeConnection: (connectionId: string) => void;
  blockConnection: (connectionId: string) => void;
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
    }
  }, [user]);

  // Update localStorage when connections change
  useEffect(() => {
    if (user && connections.length > 0) {
      localStorage.setItem(`networx-connections-${user.id}`, JSON.stringify(connections));
    }
  }, [connections, user]);

  const generateConnectionCode = () => {
    // Generate a random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // In a real app, save this to the database with an expiration
    // For demo, store in localStorage temporarily
    if (user) {
      localStorage.setItem(`networx-connection-code-${user.id}`, code);
      
      // Set code to expire in 5 minutes
      setTimeout(() => {
        localStorage.removeItem(`networx-connection-code-${user.id}`);
      }, 5 * 60 * 1000);
    }
    
    return code;
  };

  const verifyConnectionCode = async (code: string): Promise<boolean> => {
    // In a real app, this would verify with the backend
    // For demo, we'll simulate a successful connection
    await new Promise(resolve => setTimeout(resolve, 1000));
    
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
  };

  return <ConnectionContext.Provider value={value}>{children}</ConnectionContext.Provider>;
};
