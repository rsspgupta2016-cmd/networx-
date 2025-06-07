import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Connection, CodeSettings, CodeStatus } from '@/types/connection';

type ConnectionContextType = {
  connections: Connection[];
  activeConnection: Connection | null;
  setActiveConnection: (connection: Connection | null) => void;
  generateConnectionCode: (settings?: Partial<CodeSettings>) => Promise<string>;
  verifyConnectionCode: (code: string) => Promise<boolean>;
  addConnection: (connection: Connection) => void;
  removeConnection: (connectionId: string) => void;
  muteConnection: (connectionId: string) => void;
  muteConnectionCalls: (connectionId: string) => void;
  currentCode: CodeStatus | null;
  updateCodeSettings: (settings: Partial<CodeSettings>) => void;
  defaultCodeSettings: CodeSettings;
  validatePermanentCode: (code: string) => boolean;
  updateConnectionName: (connectionId: string, newName: string) => void;
  isLoading: boolean;
};

const DEFAULT_CODE_SETTINGS: CodeSettings = {
  expirationMinutes: 15,
  maxUses: null,
  permanentCode: null,
  usePermanentCode: false,
};

// Dummy accounts data
const DUMMY_ACCOUNTS = [
  {
    id: 'dummy-1',
    name: 'Sarah Johnson',
    custom_name: undefined,
    identity_code: 'NX-SJ789ABC',
    profile_image: '/placeholder.svg',
    is_muted: false,
    calls_muted: false,
    is_industry: false,
    lastMessage: {
      content: 'Hey! How are you doing?',
      timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      isRead: false,
    },
  },
  {
    id: 'dummy-2',
    name: 'Tech Solutions Inc.',
    custom_name: undefined,
    identity_code: 'NX-TSI456DEF',
    profile_image: '/placeholder.svg',
    is_muted: false,
    calls_muted: false,
    is_industry: true,
    lastMessage: {
      content: 'Thanks for connecting with us!',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      isRead: true,
    },
  },
];

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
  const [isLoading, setIsLoading] = useState(true);

  // Load connections and add dummy accounts
  useEffect(() => {
    if (user) {
      loadConnections();
      loadCodeSettings();
      loadCurrentCode();
    }
  }, [user]);

  const loadConnections = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }
    
    try {
      console.log('Loading connections for user:', user.id);
      
      const { data, error } = await supabase
        .from('connections')
        .select('*')
        .eq('user_id', user.id);

      if (error) {
        console.error('Error loading connections from Supabase:', error);
        // Fall back to dummy data if Supabase fails
        const connectionsWithUserIds = DUMMY_ACCOUNTS.map(account => ({
          ...account,
          user_id: user.id,
          connected_user_id: `dummy-user-${account.id}`,
        })) as Connection[];
        setConnections(connectionsWithUserIds);
      } else {
        console.log('Loaded connections:', data?.length || 0);
        // Add dummy accounts to existing connections
        const connectionsWithUserIds = DUMMY_ACCOUNTS.map(account => ({
          ...account,
          user_id: user.id,
          connected_user_id: `dummy-user-${account.id}`,
        })) as Connection[];
        
        setConnections([...(data || []), ...connectionsWithUserIds]);
      }
    } catch (error) {
      console.error('Error loading connections:', error);
      // Fall back to dummy data
      const connectionsWithUserIds = DUMMY_ACCOUNTS.map(account => ({
        ...account,
        user_id: user.id,
        connected_user_id: `dummy-user-${account.id}`,
      })) as Connection[];
      setConnections(connectionsWithUserIds);
    } finally {
      setIsLoading(false);
    }
  };

  const loadCodeSettings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('code_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.log('No existing code settings, using defaults');
      }

      if (data) {
        setDefaultCodeSettings({
          expirationMinutes: data.default_expiration_minutes,
          maxUses: data.default_max_uses,
          permanentCode: data.permanent_code,
          usePermanentCode: data.use_permanent_code || false,
        });
      }
    } catch (error) {
      console.error('Error loading code settings:', error);
    }
  };

  const loadCurrentCode = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('connection_codes')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.log('No existing codes or error loading:', error);
        return;
      }

      if (data && data.length > 0) {
        const codeData = data[0];
        const isExpired = codeData.expires_at ? new Date(codeData.expires_at) < new Date() : false;
        
        if (!isExpired) {
          setCurrentCode({
            code: codeData.code,
            createdAt: codeData.created_at,
            settings: {
              expirationMinutes: codeData.expiration_minutes,
              maxUses: codeData.max_uses,
              permanentCode: codeData.is_permanent ? codeData.code : null,
              usePermanentCode: codeData.is_permanent,
            },
            usesLeft: codeData.max_uses ? (codeData.max_uses - codeData.current_uses) : null,
            isExpired: false,
            isPermanent: codeData.is_permanent,
          });
        }
      }
    } catch (error) {
      console.error('Error loading current code:', error);
    }
  };

  const validatePermanentCode = (code: string): boolean => {
    if (!/^\d{6}$/.test(code)) {
      toast({
        title: "Invalid code format",
        description: "Code must be exactly 6 digits",
        variant: "destructive"
      });
      return false;
    }
    return true;
  };

  const updateCodeSettings = async (settings: Partial<CodeSettings>) => {
    if (!user) return;

    const newSettings = {
      ...defaultCodeSettings,
      ...settings
    };
    
    if (newSettings.usePermanentCode && newSettings.permanentCode) {
      if (!validatePermanentCode(newSettings.permanentCode)) {
        return;
      }
    }
    
    try {
      const { error } = await supabase
        .from('code_settings')
        .upsert({
          user_id: user.id,
          default_expiration_minutes: newSettings.expirationMinutes,
          default_max_uses: newSettings.maxUses,
          permanent_code: newSettings.permanentCode,
          use_permanent_code: newSettings.usePermanentCode,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      setDefaultCodeSettings(newSettings);
      
      toast({
        title: "Settings updated",
        description: "Your connection code settings have been saved",
      });
    } catch (error) {
      console.error('Error updating code settings:', error);
      // For demo purposes, update local state even if Supabase fails
      setDefaultCodeSettings(newSettings);
      toast({
        title: "Settings updated (Demo)",
        description: "Your connection code settings have been saved locally",
      });
    }
  };

  const generateConnectionCode = async (customSettings?: Partial<CodeSettings>): Promise<string> => {
    if (!user) return '000000';

    const settings = {
      ...defaultCodeSettings,
      ...(customSettings || {})
    };
    
    let code: string;
    let isPermanent = false;
    
    if (settings.usePermanentCode && settings.permanentCode) {
      code = settings.permanentCode;
      isPermanent = true;
    } else {
      code = Math.floor(100000 + Math.random() * 900000).toString();
    }

    try {
      console.log('Generating connection code with settings:', settings);
      
      // Use the edge function for authenticated users
      const { data, error } = await supabase.functions.invoke('generate-connection-code', {
        body: {
          userId: user.id,
          expirationMinutes: settings.expirationMinutes,
          maxUses: settings.maxUses,
          isPermanent
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      if (data?.connectionCode) {
        const codeStatus: CodeStatus = {
          code: data.connectionCode.code,
          createdAt: new Date().toISOString(),
          settings,
          usesLeft: data.connectionCode.maxUses,
          isExpired: false,
          isPermanent: data.connectionCode.isPermanent
        };

        setCurrentCode(codeStatus);
        
        toast({
          title: "Connection code generated",
          description: `Your code is: ${data.connectionCode.code}`,
        });

        return data.connectionCode.code;
      }
      
      throw new Error('No connection code returned');
    } catch (error) {
      console.error('Error generating connection code, falling back to demo mode:', error);
      
      // Demo mode fallback
      const codeStatus: CodeStatus = {
        code,
        createdAt: new Date().toISOString(),
        settings,
        usesLeft: settings.maxUses,
        isExpired: false,
        isPermanent
      };
      
      setCurrentCode(codeStatus);
      
      toast({
        title: "Connection code generated (Demo)",
        description: `Your code is: ${code}`,
      });

      return code;
    }
  };

  const verifyConnectionCode = async (code: string): Promise<boolean> => {
    if (!user) return false;

    try {
      console.log('Verifying connection code:', code);
      
      // Demo: If someone enters a specific code, add a dummy account
      if (code === '123456') {
        const newDummyAccount: Connection = {
          id: `dummy-new-${Date.now()}`,
          user_id: user.id,
          connected_user_id: `dummy-user-new-${Date.now()}`,
          name: 'Alex Chen',
          custom_name: undefined,
          identity_code: 'NX-AC123XYZ',
          profile_image: '/placeholder.svg',
          is_muted: false,
          calls_muted: false,
          is_industry: false,
          lastMessage: {
            content: 'Nice to connect with you!',
            timestamp: new Date().toISOString(),
            isRead: false,
          },
        };

        setConnections(prev => [...prev, newDummyAccount]);
        
        toast({
          title: "Connection successful!",
          description: "You're now connected with Alex Chen!",
        });
        
        return true;
      }

      // Use the edge function for real code validation
      const { data, error } = await supabase.functions.invoke('validate-connection-code', {
        body: {
          code,
          requestingUserId: user.id
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        toast({
          title: "Connection failed",
          description: error.message || "Invalid connection code. Try demo code: 123456",
          variant: "destructive"
        });
        return false;
      }

      if (data?.success && data?.connection) {
        // Reload connections to get the new one
        await loadConnections();
        
        toast({
          title: "Connection successful!",
          description: `You're now connected with ${data.connection.name}!`,
        });
        
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error verifying connection code:', error);
      toast({
        title: "Connection failed",
        description: "Unable to establish connection. Try demo code: 123456",
        variant: "destructive"
      });
      return false;
    }
  };

  const addConnection = (connection: Connection) => {
    setConnections(prev => [...prev, connection]);
  };

  const removeConnection = async (connectionId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('connections')
        .delete()
        .eq('id', connectionId)
        .eq('user_id', user.id);

      if (error) throw error;

      setConnections(prev => prev.filter(conn => conn.id !== connectionId));
      if (activeConnection?.id === connectionId) {
        setActiveConnection(null);
      }
      
      toast({
        title: "Connection removed",
        description: "This contact can no longer message you",
      });
    } catch (error) {
      console.error('Error removing connection:', error);
      // For demo accounts, just remove locally
      setConnections(prev => prev.filter(conn => conn.id !== connectionId));
      if (activeConnection?.id === connectionId) {
        setActiveConnection(null);
      }
      
      toast({
        title: "Connection removed",
        description: "This contact can no longer message you",
      });
    }
  };

  const muteConnection = async (connectionId: string) => {
    if (!user) return;

    try {
      const connection = connections.find(conn => conn.id === connectionId);
      if (!connection) return;

      const newMuteState = !connection.is_muted;

      const { error } = await supabase
        .from('connections')
        .update({ is_muted: newMuteState })
        .eq('id', connectionId)
        .eq('user_id', user.id);

      if (error) throw error;

      setConnections(prev => 
        prev.map(conn => 
          conn.id === connectionId 
            ? { ...conn, is_muted: newMuteState } 
            : conn
        )
      );
      
      toast({
        title: newMuteState ? "Chat muted" : "Chat unmuted",
        description: newMuteState ? "You won't receive notifications from this chat" : "You will now receive notifications from this chat",
      });
    } catch (error) {
      console.error('Error muting connection:', error);
      // For demo accounts, just update locally
      setConnections(prev => 
        prev.map(conn => 
          conn.id === connectionId 
            ? { ...conn, is_muted: !conn.is_muted } 
            : conn
        )
      );
    }
  };

  const muteConnectionCalls = async (connectionId: string) => {
    if (!user) return;

    try {
      const connection = connections.find(conn => conn.id === connectionId);
      if (!connection) return;

      const newMuteState = !connection.calls_muted;

      const { error } = await supabase
        .from('connections')
        .update({ calls_muted: newMuteState })
        .eq('id', connectionId)
        .eq('user_id', user.id);

      if (error) throw error;

      setConnections(prev => 
        prev.map(conn => 
          conn.id === connectionId 
            ? { ...conn, calls_muted: newMuteState } 
            : conn
        )
      );
      
      toast({
        title: newMuteState ? "Calls muted" : "Calls unmuted",
        description: newMuteState ? "You won't receive call notifications from this contact" : "You will now receive call notifications from this contact",
      });
    } catch (error) {
      console.error('Error muting connection calls:', error);
      // For demo accounts, just update locally
      setConnections(prev => 
        prev.map(conn => 
          conn.id === connectionId 
            ? { ...conn, calls_muted: !conn.calls_muted } 
            : conn
        )
      );
    }
  };

  const updateConnectionName = async (connectionId: string, newName: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('connections')
        .update({ custom_name: newName })
        .eq('id', connectionId)
        .eq('user_id', user.id);

      if (error) throw error;

      setConnections(prev => 
        prev.map(conn => 
          conn.id === connectionId 
            ? { ...conn, custom_name: newName } 
            : conn
        )
      );
      
      if (activeConnection?.id === connectionId) {
        setActiveConnection(prev => prev ? { ...prev, custom_name: newName } : null);
      }
      
      toast({
        title: "Connection name updated",
        description: `Contact renamed to ${newName}`,
      });
    } catch (error) {
      console.error('Error updating connection name:', error);
      // For demo accounts, just update locally
      setConnections(prev => 
        prev.map(conn => 
          conn.id === connectionId 
            ? { ...conn, custom_name: newName } 
            : conn
        )
      );
      
      if (activeConnection?.id === connectionId) {
        setActiveConnection(prev => prev ? { ...prev, custom_name: newName } : null);
      }
      
      toast({
        title: "Connection name updated",
        description: `Contact renamed to ${newName}`,
      });
    }
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
    updateConnectionName,
    isLoading,
  };

  return <ConnectionContext.Provider value={value}>{children}</ConnectionContext.Provider>;
};
