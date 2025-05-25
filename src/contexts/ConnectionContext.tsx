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
  muted: boolean;
  callsMuted: boolean;
  isIndustry?: boolean;
  identityCode?: string;
};

export type CodeSettings = {
  expirationMinutes: number | null; // Null for no expiration
  maxUses: number | null; // Null for unlimited uses within expiration time
  permanentCode: string | null; // User's permanent code
  usePermanentCode: boolean; // Whether to use permanent code
};

type CodeStatus = {
  code: string;
  createdAt: string;
  settings: CodeSettings;
  usesLeft: number | null; // Null for unlimited uses
  isExpired: boolean;
  isPermanent: boolean; // Whether this is a permanent code
};

type ConnectionContextType = {
  connections: Connection[];
  activeConnection: Connection | null;
  setActiveConnection: (connection: Connection | null) => void;
  generateConnectionCode: (settings?: Partial<CodeSettings>) => string;
  verifyConnectionCode: (code: string) => Promise<boolean>;
  addConnection: (connection: Connection) => void;
  removeConnection: (connectionId: string) => void;
  muteConnection: (connectionId: string) => void;
  muteConnectionCalls: (connectionId: string) => void;
  currentCode: CodeStatus | null;
  updateCodeSettings: (settings: Partial<CodeSettings>) => void;
  defaultCodeSettings: CodeSettings;
  validatePermanentCode: (code: string) => boolean;
};

const DEFAULT_CODE_SETTINGS: CodeSettings = {
  expirationMinutes: 15, // Default: 15 minutes expiration
  maxUses: null, // Default: unlimited uses within time period
  permanentCode: null,
  usePermanentCode: false,
};

// Store of used codes to prevent collisions (in real app, this would be server-side)
const USED_CODES = new Set<string>();

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
            muted: false,
            callsMuted: false,
            identityCode: 'NX-12345',
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
            muted: false,
            callsMuted: false,
            identityCode: 'NX-67890',
          },
        ];
        setConnections(demoConnections);
        localStorage.setItem(`networx-connections-${user.id}`, JSON.stringify(demoConnections));
      }
      
      // Also load any active code
      const storedCode = localStorage.getItem(`networx-connection-code-${user.id}`);
      if (storedCode) {
        const parsedCode = JSON.parse(storedCode) as CodeStatus;
        
        // Check if code is expired (if it has an expiration time)
        if (parsedCode.settings.expirationMinutes !== null) {
          const expirationTime = new Date(parsedCode.createdAt).getTime() + 
            (parsedCode.settings.expirationMinutes * 60 * 1000);
          
          if (expirationTime > Date.now()) {
            setCurrentCode({
              ...parsedCode,
              isExpired: false
            });
          } else {
            // Clean up expired code
            localStorage.removeItem(`networx-connection-code-${user.id}`);
            setCurrentCode(null);
          }
        } else {
          // For codes with no expiration, they should stay active indefinitely
          setCurrentCode({
            ...parsedCode,
            isExpired: false
          });
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
    if (!currentCode || !user || currentCode.settings.expirationMinutes === null) return;
    
    const checkCodeExpiration = () => {
      const expirationTime = new Date(currentCode.createdAt).getTime() + 
        (currentCode.settings.expirationMinutes * 60 * 1000);
      
      if (expirationTime <= Date.now()) {
        localStorage.removeItem(`networx-connection-code-${user.id}`);
        setCurrentCode(null);
        toast({
          title: "Connection code expired",
          description: "Your time-limited code is no longer valid",
        });
      }
    };
    
    const intervalId = setInterval(checkCodeExpiration, 10000); // Check every 10 seconds
    return () => clearInterval(intervalId);
  }, [currentCode, user]);

  const validatePermanentCode = (code: string): boolean => {
    // Check if code is 6 digits
    if (!/^\d{6}$/.test(code)) {
      toast({
        title: "Invalid code format",
        description: "Code must be exactly 6 digits",
        variant: "destructive"
      });
      return false;
    }

    // Check if code is already in use
    if (USED_CODES.has(code)) {
      toast({
        title: "Code already in use",
        description: "This code is already taken by another user. Please choose a different one.",
        variant: "destructive"
      });
      return false;
    }

    // Check against existing user's current code
    if (currentCode && currentCode.code === code) {
      return true; // User is setting the same code they already have
    }

    return true;
  };

  const updateCodeSettings = (settings: Partial<CodeSettings>) => {
    const newSettings = {
      ...defaultCodeSettings,
      ...settings
    };
    
    // Validate permanent code if being set
    if (newSettings.usePermanentCode && newSettings.permanentCode) {
      if (!validatePermanentCode(newSettings.permanentCode)) {
        return; // Validation failed, don't update
      }
    }
    
    setDefaultCodeSettings(newSettings);
    if (user) {
      localStorage.setItem(`networx-code-settings-${user.id}`, JSON.stringify(newSettings));
    }
    
    // If permanent code is enabled and we have a permanent code, generate it
    if (newSettings.usePermanentCode && newSettings.permanentCode) {
      // Remove old code from used set if it exists
      if (currentCode && currentCode.isPermanent) {
        USED_CODES.delete(currentCode.code);
      }
      
      // Add new code to used set
      USED_CODES.add(newSettings.permanentCode);
      
      const permanentCodeStatus: CodeStatus = {
        code: newSettings.permanentCode,
        createdAt: new Date().toISOString(),
        settings: newSettings,
        usesLeft: null, // Permanent codes have unlimited uses
        isExpired: false,
        isPermanent: true
      };
      
      setCurrentCode(permanentCodeStatus);
      if (user) {
        localStorage.setItem(`networx-connection-code-${user.id}`, JSON.stringify(permanentCodeStatus));
      }
    }
    
    toast({
      title: "Settings updated",
      description: "Your connection code settings have been saved",
    });
  };

  const generateConnectionCode = (customSettings?: Partial<CodeSettings>) => {
    const settings = {
      ...defaultCodeSettings,
      ...(customSettings || {})
    };
    
    let code: string;
    let isPermanent = false;
    
    // Use permanent code if enabled and available
    if (settings.usePermanentCode && settings.permanentCode) {
      code = settings.permanentCode;
      isPermanent = true;
      
      // Add to used codes set
      USED_CODES.add(code);
    } else {
      // Generate a unique random 6-digit code
      let attempts = 0;
      do {
        code = Math.floor(100000 + Math.random() * 900000).toString();
        attempts++;
        
        // Prevent infinite loop
        if (attempts > 100) {
          toast({
            title: "Code generation failed",
            description: "Unable to generate a unique code. Please try again.",
            variant: "destructive"
          });
          return currentCode?.code || '000000';
        }
      } while (USED_CODES.has(code));
      
      // Add to used codes set
      USED_CODES.add(code);
    }
    
    // Remove old code from used set if it exists
    if (currentCode && !currentCode.isPermanent) {
      USED_CODES.delete(currentCode.code);
    }
    
    // Create code status object
    const codeStatus: CodeStatus = {
      code,
      createdAt: new Date().toISOString(),
      settings: {
        ...settings,
        maxUses: settings.expirationMinutes !== null ? null : settings.maxUses
      },
      usesLeft: settings.expirationMinutes !== null ? null : settings.maxUses,
      isExpired: false,
      isPermanent
    };
    
    // Store in state and localStorage
    setCurrentCode(codeStatus);
    
    if (user) {
      localStorage.setItem(`networx-connection-code-${user.id}`, JSON.stringify(codeStatus));
      
      // Only set expiration timeout for non-permanent codes with expiration time
      if (!isPermanent && settings.expirationMinutes !== null) {
        const expirationTime = settings.expirationMinutes * 60 * 1000;
        setTimeout(() => {
          const currentStoredCode = localStorage.getItem(`networx-connection-code-${user.id}`);
          if (currentStoredCode) {
            const parsedCode = JSON.parse(currentStoredCode);
            if (parsedCode.code === code && !parsedCode.isPermanent) {
              USED_CODES.delete(code); // Remove from used codes when expired
              localStorage.removeItem(`networx-connection-code-${user.id}`);
              setCurrentCode(null);
            }
          }
        }, expirationTime);
      }
    }
    
    return code;
  };

  const verifyConnectionCode = async (code: string): Promise<boolean> => {
    // In a real app, this would verify with the backend
    // For demo, we'll simulate a successful connection
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For time-based codes, don't update uses since they're unlimited during the time period
    // Only update uses for non-expiring codes with use limits
    if (currentCode && currentCode.code === code && currentCode.settings.expirationMinutes === null && currentCode.usesLeft !== null) {
      const updatedUsesLeft = currentCode.usesLeft - 1;
      const updatedCode = {
        ...currentCode,
        usesLeft: updatedUsesLeft
      };
      
      setCurrentCode(updatedCode);
      if (user) {
        if (updatedUsesLeft <= 0) {
          USED_CODES.delete(code); // Remove from used codes when expired
          localStorage.removeItem(`networx-connection-code-${user.id}`);
          setCurrentCode(null);
        } else {
          USED_CODES.add(code); // Add back to used codes if still valid
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
      muted: false,
      callsMuted: false,
      identityCode: `NX-${Math.floor(10000 + Math.random() * 90000)}`,
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

  const muteConnection = (connectionId: string) => {
    setConnections(prev => 
      prev.map(conn => 
        conn.id === connectionId 
          ? { ...conn, muted: !conn.muted } 
          : conn
      )
    );
    
    const connection = connections.find(conn => conn.id === connectionId);
    const newMuteState = !connection?.muted;
    
    toast({
      title: newMuteState ? "Chat muted" : "Chat unmuted",
      description: newMuteState ? "You won't receive notifications from this chat" : "You will now receive notifications from this chat",
    });
  };

  const muteConnectionCalls = (connectionId: string) => {
    setConnections(prev => 
      prev.map(conn => 
        conn.id === connectionId 
          ? { ...conn, callsMuted: !conn.callsMuted } 
          : conn
      )
    );
    
    const connection = connections.find(conn => conn.id === connectionId);
    const newMuteState = !connection?.callsMuted;
    
    toast({
      title: newMuteState ? "Calls muted" : "Calls unmuted",
      description: newMuteState ? "You won't receive call notifications from this contact" : "You will now receive call notifications from this contact",
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
    muteConnection,
    muteConnectionCalls,
    currentCode,
    updateCodeSettings,
    defaultCodeSettings,
    validatePermanentCode,
  };

  return <ConnectionContext.Provider value={value}>{children}</ConnectionContext.Provider>;
};
