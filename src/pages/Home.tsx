import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useConnection, Connection, CodeSettings } from '@/contexts/ConnectionContext';
import { useChat } from '@/contexts/ChatContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { 
  User, 
  Settings, 
  LogOut, 
  Plus, 
  MoreVertical,
  Send,
  Clock,
  RefreshCw,
  MessageCircle,
  BellOff,
  Volume,
  VolumeX,
  ArrowLeft,
  Users,
  Building,
  Ticket
} from 'lucide-react';
import ChatView from '../components/ChatView';
import { Slider } from '@/components/ui/slider';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Extend Connection interface to include isIndustry property
declare module '@/contexts/ConnectionContext' {
  interface Connection {
    isIndustry?: boolean;
    identityCode?: string;
  }
}

// Chat section types
enum ChatSection {
  PERSONAL = 'personal',
  INDUSTRY = 'industry'
}

const Home = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const isMobile = useIsMobile();
  const { 
    connections, 
    activeConnection, 
    setActiveConnection,
    generateConnectionCode,
    verifyConnectionCode,
    removeConnection,
    muteConnection,
    muteConnectionCalls,
    currentCode,
    defaultCodeSettings,
    updateCodeSettings
  } = useConnection();
  const { getMessagesForConnection, markMessagesAsRead } = useChat();
  
  const [showConnectDialog, setShowConnectDialog] = useState(false);
  const [connectionCode, setConnectionCode] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showCodeSettings, setShowCodeSettings] = useState(false);
  const [tempSettings, setTempSettings] = useState<CodeSettings>(defaultCodeSettings);
  const [showMobileSidebar, setShowMobileSidebar] = useState(true);
  const [activeSection, setActiveSection] = useState<ChatSection>(ChatSection.PERSONAL);

  // Get active connection ID from URL for mobile view
  const activeChatId = searchParams.get('chat');
  
  // Set active connection based on URL param when on mobile
  useEffect(() => {
    if (isMobile && activeChatId && connections.length > 0) {
      const connection = connections.find(conn => conn.id === activeChatId);
      if (connection) {
        setActiveConnection(connection);
        markMessagesAsRead(connection.id);
      }
    }
  }, [activeChatId, connections, isMobile, markMessagesAsRead, setActiveConnection]);

  // Auto-generate a code when the page loads if no code exists
  useEffect(() => {
    if (!currentCode && user) {
      handleGenerateCode();
    }
  }, [user, currentCode]);

  const handleGenerateCode = () => {
    const code = generateConnectionCode();
    setConnectionCode(code);
  };

  const handleVerifyCode = async () => {
    if (codeInput.length < 4) return;
    
    setIsVerifying(true);
    try {
      await verifyConnectionCode(codeInput);
      setShowConnectDialog(false);
      setCodeInput('');
    } catch (error) {
      console.error(error);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleConnectionClick = (connection: Connection) => {
    setActiveConnection(connection);
    markMessagesAsRead(connection.id);
    
    // For mobile, navigate to chat view
    if (isMobile) {
      setShowMobileSidebar(false);
      setSearchParams({ chat: connection.id });
    }
  };

  const handleBackToContacts = () => {
    setShowMobileSidebar(true);
    setSearchParams({});
  };

  const handleSettings = () => {
    navigate('/settings');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleSaveCodeSettings = () => {
    updateCodeSettings(tempSettings);
    setShowCodeSettings(false);
  };

  // Count unread messages for a connection
  const getUnreadCount = (connectionId: string) => {
    const messages = getMessagesForConnection(connectionId);
    return messages.filter(m => !m.isRead && m.senderId !== user?.id).length;
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatTimeLeft = () => {
    if (!currentCode || currentCode.settings.expirationMinutes === null) return 'No expiration';
    
    const expirationTime = new Date(currentCode.createdAt).getTime() + 
      (currentCode.settings.expirationMinutes * 60 * 1000);
    const timeLeftMs = expirationTime - Date.now();
    
    if (timeLeftMs <= 0) return 'Expired';
    
    const minutesLeft = Math.floor(timeLeftMs / 60000);
    const secondsLeft = Math.floor((timeLeftMs % 60000) / 1000);
    
    return `${minutesLeft}:${secondsLeft.toString().padStart(2, '0')}`;
  };

  // Filter connections based on active section
  const filteredConnections = connections.filter(connection => {
    if (activeSection === ChatSection.PERSONAL) {
      return !connection.isIndustry;
    } else {
      return connection.isIndustry;
    }
  });

  // Mobile layout or desktop layout
  if (isMobile) {
    // Show chat view if we have an active connection and not showing sidebar
    if (activeConnection && !showMobileSidebar) {
      return <ChatView connection={activeConnection} />;
    }
    
    // Otherwise show connection list
    return (
      <div className="flex flex-col h-full bg-networx-dark">
        {/* Connection code card */}
        <div className="p-4 bg-[#0F1628] border-b border-[#232e48]">
          <Card className="overflow-hidden bg-gradient-to-r from-[#1C2A41] to-[#162039] border-[#232e48]">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-base flex justify-between items-center">
                <span className="flex items-center gap-1 text-white">
                  <MessageCircle size={18} className="text-networx-primary" />
                  Connection Code
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setTempSettings({...defaultCodeSettings});
                    setShowCodeSettings(true);
                  }}
                  className="h-7 w-7 p-0 text-white hover:bg-[#1c2a41]/50"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </CardTitle>
              <CardDescription className="text-xs text-networx-light/70">
                Share this code to connect with someone
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#0B1120] rounded-lg border border-[#232e48] flex-grow text-center">
                  <span className="text-2xl font-bold tracking-widest text-networx-light">
                    {currentCode?.code || '------'}
                  </span>
                </div>
                <Button 
                  size="sm" 
                  className="bg-networx-primary hover:bg-networx-secondary text-white"
                  onClick={handleGenerateCode}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  New
                </Button>
              </div>
              
              {currentCode && (
                <div className="mt-2 text-xs text-center flex items-center justify-between text-networx-light/70">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatTimeLeft()}</span>
                  </div>
                  {currentCode.settings.expirationMinutes === null && (
                    <span>Uses: {currentCode.usesLeft}/{currentCode.settings.maxUses}</span>
                  )}
                  {currentCode.settings.expirationMinutes !== null && (
                    <span>Unlimited uses</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="mt-3 flex items-center">
            <div className="flex-grow">
              <Input 
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="Enter someone's code"
                className="border-[#232e48] bg-[#121A2F] text-white placeholder:text-gray-500"
                maxLength={6}
              />
            </div>
            <Button 
              className="ml-2 bg-networx-primary hover:bg-networx-secondary text-white" 
              onClick={handleVerifyCode} 
              disabled={isVerifying || codeInput.length < 6}
            >
              <Send className="h-4 w-4 mr-1" />
              Connect
            </Button>
          </div>
        </div>

        {/* Chat Section Toggle */}
        <div className="px-4 pt-4 bg-[#0F1628]">
          <div className="chat-section-toggle">
            <button 
              className={`chat-section-button ${activeSection === ChatSection.PERSONAL ? 'chat-section-button-active' : 'chat-section-button-inactive'}`}
              onClick={() => setActiveSection(ChatSection.PERSONAL)}
            >
              <div className="flex items-center justify-center gap-2">
                <User size={16} />
                <span>Personal</span>
              </div>
            </button>
            <button 
              className={`chat-section-button ${activeSection === ChatSection.INDUSTRY ? 'chat-section-button-active' : 'chat-section-button-inactive'}`}
              onClick={() => setActiveSection(ChatSection.INDUSTRY)}
            >
              <div className="flex items-center justify-center gap-2">
                <Building size={16} />
                <span>Industry/Perks</span>
              </div>
            </button>
          </div>
        </div>

        {/* Connections */}
        <div className="flex-1 overflow-y-auto bg-[#0F1628]">
          <div className="p-4 border-b border-[#232e48]">
            <h2 className="font-medium text-sm text-networx-light">
              {activeSection === ChatSection.PERSONAL ? 'Personal Chats' : 'Industry/Perks Connections'}
            </h2>
          </div>
          
          {filteredConnections.length === 0 ? (
            <div className="p-6 text-center">
              {activeSection === ChatSection.PERSONAL ? (
                <User className="mx-auto h-12 w-12 text-[#2A3A57]" />
              ) : (
                <Ticket className="mx-auto h-12 w-12 text-[#2A3A57]" />
              )}
              <h3 className="mt-2 text-sm font-semibold text-networx-light">
                {activeSection === ChatSection.PERSONAL 
                  ? 'No personal connections' 
                  : 'No industry connections'}
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {activeSection === ChatSection.PERSONAL
                  ? 'Share your code with someone to start chatting.'
                  : 'Connect with industry professionals to see offers.'}
              </p>
            </div>
          ) : (
            filteredConnections.map(connection => (
              <div 
                key={connection.id}
                className={`connection-item ${
                  activeConnection?.id === connection.id ? 'connection-item-active' : ''
                }`}
                onClick={() => handleConnectionClick(connection)}
              >
                <div className="flex items-center flex-1">
                  <Avatar className="h-12 w-12 border border-[#232e48]">
                    <AvatarImage src={connection.profileImage} />
                    <AvatarFallback className="bg-gradient-to-r from-networx-primary to-networx-secondary text-white">
                      {getInitials(connection.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-3 overflow-hidden">
                    <div className="flex items-center">
                      <p className="font-medium text-networx-light">{connection.name}</p>
                      <span className="ml-2 text-xs text-networx-light/50">
                        {connection.identityCode}
                      </span>
                      {connection.muted && (
                        <BellOff size={14} className="ml-1 text-gray-500" />
                      )}
                      {connection.callsMuted && (
                        <VolumeX size={14} className="ml-1 text-gray-500" />
                      )}
                    </div>
                    <p className={`text-sm ${connection.muted ? 'text-gray-500' : 'text-networx-light/70'} truncate`}>
                      {connection.lastMessage?.content}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  {connection.lastMessage && (
                    <span className="text-xs text-networx-light/50">
                      {new Date(connection.lastMessage.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  )}
                  {getUnreadCount(connection.id) > 0 && (
                    <span className="bg-networx-primary text-white text-xs rounded-full px-2 py-0.5 mt-1 font-medium">
                      {getUnreadCount(connection.id)}
                    </span>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={e => e.stopPropagation()} className="text-networx-light">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#121A2F] border border-[#232e48] text-networx-light">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-[#232e48]" />
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        muteConnection(connection.id);
                      }} 
                      className="flex items-center hover:bg-[#1C2A41] cursor-pointer"
                    >
                      <BellOff className="mr-2 h-4 w-4" />
                      {connection.muted ? 'Unmute messages' : 'Mute messages'}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        muteConnectionCalls(connection.id);
                      }} 
                      className="flex items-center hover:bg-[#1C2A41] cursor-pointer"
                    >
                      {connection.callsMuted ? (
                        <>
                          <Volume className="mr-2 h-4 w-4" />
                          Unmute calls
                        </>
                      ) : (
                        <>
                          <VolumeX className="mr-2 h-4 w-4" />
                          Mute calls
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-[#232e48]" />
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeConnection(connection.id);
                      }} 
                      className="text-networx-primary hover:bg-[#1C2A41] cursor-pointer"
                    >
                      Remove Connection
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>
        
        {/* Code Settings Dialog */}
        <Dialog open={showCodeSettings} onOpenChange={setShowCodeSettings}>
          <DialogContent className="sm:max-w-md bg-[#121A2F] border-[#232e48] text-networx-light">
            <DialogHeader>
              <DialogTitle>Connection Code Settings</DialogTitle>
              <DialogDescription className="text-networx-light/70">
                Customize how your connection codes work
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium">
                      Code Expiration Time
                    </label>
                    <span className="text-sm text-networx-light/70">
                      {tempSettings.expirationMinutes === null ? 'No expiration' : `${tempSettings.expirationMinutes} minutes`}
                    </span>
                  </div>
                  
                  <div className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id="useExpiration"
                      className="mr-2"
                      checked={tempSettings.expirationMinutes !== null}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setTempSettings({...tempSettings, expirationMinutes: 5});
                        } else {
                          setTempSettings({...tempSettings, expirationMinutes: null});
                        }
                      }}
                    />
                    <label htmlFor="useExpiration" className="text-sm">Enable time-based expiration (unlimited uses during time period)</label>
                  </div>
                  
                  {tempSettings.expirationMinutes !== null && (
                    <Slider
                      value={[tempSettings.expirationMinutes]}
                      min={1}
                      max={60}
                      step={1}
                      className="bg-[#1C2A41]"
                      onValueChange={(value) => setTempSettings({...tempSettings, expirationMinutes: value[0]})}
                    />
                  )}
                </div>
                
                {tempSettings.expirationMinutes === null && (
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-sm font-medium">
                        Maximum Uses Per Code
                      </label>
                      <span className="text-sm text-networx-light/70">
                        {tempSettings.maxUses} uses
                      </span>
                    </div>
                    <Slider
                      value={[tempSettings.maxUses || 1]}
                      min={1}
                      max={10}
                      step={1}
                      className="bg-[#1C2A41]"
                      onValueChange={(value) => setTempSettings({...tempSettings, maxUses: value[0]})}
                    />
                  </div>
                )}
              </div>
              
              <div className="pt-2">
                <p className="text-xs text-networx-light/70">
                  {tempSettings.expirationMinutes !== null 
                    ? "Time-based codes allow unlimited people to connect during the specified time period."
                    : "Use-based codes allow a specific number of connections before expiring."
                  }
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCodeSettings(false)}
                className="border-[#232e48] text-networx-light hover:bg-[#1C2A41] hover:text-networx-light">
                Cancel
              </Button>
              <Button onClick={handleSaveCodeSettings} className="bg-networx-primary hover:bg-networx-secondary text-white">
                Save Settings
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Desktop layout
  return (
    <div className="flex h-screen bg-networx-dark">
      {/* Sidebar */}
      <div className="w-full md:w-1/3 lg:w-1/4 bg-[#0F1628] border-r border-[#232e48] flex flex-col">
        {/* User header */}
        <div className="flex items-center justify-between p-4 border-b border-[#232e48] bg-gradient-to-r from-[#0B1120] to-[#162039] text-white">
          <div className="flex items-center">
            <Avatar className="h-10 w-10 bg-[#1C2A41] border-2 border-[#232e48]">
              <AvatarFallback className="bg-networx-dark text-white">{user?.displayName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <h2 className="text-lg font-semibold">{user?.displayName}</h2>
              <p className="text-xs text-networx-light/70">
                {user?.identityCode ? `ID: ${user.identityCode}` : 'NetworX'}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="ghost" size="icon" onClick={handleSettings} className="text-white hover:bg-[#1c2a41]/30">
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-white hover:bg-[#1c2a41]/30">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Connection code card */}
        <div className="p-4 bg-[#0F1628] border-b border-[#232e48]">
          <Card className="overflow-hidden bg-gradient-to-r from-[#1C2A41] to-[#162039] border-[#232e48]">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-base flex justify-between items-center">
                <span className="flex items-center gap-1 text-white">
                  <MessageCircle size={18} className="text-networx-primary" />
                  Connection Code
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setTempSettings({...defaultCodeSettings});
                    setShowCodeSettings(true);
                  }}
                  className="h-7 w-7 p-0 text-white hover:bg-[#1c2a41]/50"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </CardTitle>
              <CardDescription className="text-xs text-networx-light/70">
                Share this code to connect with someone
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#0B1120] rounded-lg border border-[#232e48] flex-grow text-center">
                  <span className="text-2xl font-bold tracking-widest text-networx-light">
                    {currentCode?.code || '------'}
                  </span>
                </div>
                <Button 
                  size="sm" 
                  className="bg-networx-primary hover:bg-networx-secondary text-white"
                  onClick={handleGenerateCode}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  New
                </Button>
              </div>
              
              {currentCode && (
                <div className="mt-2 text-xs text-center flex items-center justify-between text-networx-light/70">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatTimeLeft()}</span>
                  </div>
                  {currentCode.settings.expirationMinutes === null && (
                    <span>Uses: {currentCode.usesLeft}/{currentCode.settings.maxUses}</span>
                  )}
                  {currentCode.settings.expirationMinutes !== null && (
                    <span>Unlimited uses</span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="mt-3 flex items-center">
            <div className="flex-grow">
              <Input 
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="Enter someone's code"
                className="border-[#232e48] bg-[#121A2F] text-white placeholder:text-gray-500"
                maxLength={6}
              />
            </div>
            <Button 
              className="ml-2 bg-networx-primary hover:bg-networx-secondary text-white" 
              onClick={handleVerifyCode} 
              disabled={isVerifying || codeInput.length < 6}
            >
              <Send className="h-4 w-4 mr-1" />
              Connect
            </Button>
          </div>
        </div>

        {/* Chat Section Toggle */}
        <div className="px-4 pt-4 bg-[#0F1628]">
          <div className="chat-section-toggle">
            <button 
              className={`chat-section-button ${activeSection === ChatSection.PERSONAL ? 'chat-section-button-active' : 'chat-section-button-inactive'}`}
              onClick={() => setActiveSection(ChatSection.PERSONAL)}
            >
              <div className="flex items-center justify-center gap-2">
                <User size={16} />
                <span>Personal</span>
              </div>
            </button>
            <button 
              className={`chat-section-button ${activeSection === ChatSection.INDUSTRY ? 'chat-section-button-active' : 'chat-section-button-inactive'}`}
              onClick={() => setActiveSection(ChatSection.INDUSTRY)}
            >
              <div className="flex items-center justify-center gap-2">
                <Building size={16} />
                <span>Industry/Perks</span>
              </div>
            </button>
          </div>
        </div>

        {/* Connections */}
        <div className="flex-1 overflow-y-auto border-t border-[#232e48]">
          <div className="p-4 border-b border-[#232e48]">
            <h2 className="font-medium text-sm text-networx-light">
              {activeSection === ChatSection.PERSONAL ? 'Personal Chats' : 'Industry/Perks Connections'}
            </h2>
          </div>
          
          {filteredConnections.length === 0 ? (
            <div className="p-6 text-center">
              {activeSection === ChatSection.PERSONAL ? (
                <User className="mx-auto h-12 w-12 text-[#2A3A57]" />
              ) : (
                <Ticket className="mx-auto h-12 w-12 text-[#2A3A57]" />
              )}
              <h3 className="mt-2 text-sm font-semibold text-networx-light">
                {activeSection === ChatSection.PERSONAL 
                  ? 'No personal connections' 
                  : 'No industry connections'}
              </h3>
              <p className="mt-1 text-sm text-networx-light/70">
                {activeSection === ChatSection.PERSONAL
                  ? 'Share your code with someone to start chatting.'
                  : 'Connect with industry professionals to see offers.'}
              </p>
            </div>
          ) : (
            filteredConnections.map(connection => (
              <div 
                key={connection.id}
                className={`connection-item ${
                  activeConnection?.id === connection.id ? 'connection-item-active' : ''
                }`}
                onClick={() => handleConnectionClick(connection)}
              >
                <div className="flex items-center flex-1">
                  <Avatar className="h-12 w-12 border border-[#232e48]">
                    <AvatarImage src={connection.profileImage} />
                    <AvatarFallback className="bg-gradient-to-r from-networx-primary to-networx-secondary text-white">
                      {getInitials(connection.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-3 overflow-hidden">
                    <div className="flex items-center">
                      <p className="font-medium text-networx-light">{connection.name}</p>
                      <span className="ml-2 text-xs text-networx-light/50">
                        {connection.identityCode}
                      </span>
                      {connection.muted && (
                        <BellOff size={14} className="ml-1 text-gray-500" />
                      )}
                      {connection.callsMuted && (
                        <VolumeX size={14} className="ml-1 text-gray-500" />
                      )}
                    </div>
                    <p className={`text-sm ${connection.muted ? 'text-gray-500' : 'text-networx-light/70'} truncate`}>
                      {connection.lastMessage?.content}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  {connection.lastMessage && (
                    <span className="text-xs text-networx-light/50">
                      {new Date(connection.lastMessage.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  )}
                  {getUnreadCount(connection.id) > 0 && (
                    <span className="bg-networx-primary text-white text-xs rounded-full px-2 py-0.5 mt-1 font-medium">
                      {getUnreadCount(connection.id)}
                    </span>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={e => e.stopPropagation()} className="text-networx-light">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#121A2F] border border-[#232e48] text-networx-light">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-[#232e48]" />
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        muteConnection(connection.id);
                      }} 
                      className="flex items-center hover:bg-[#1C2A41] cursor-pointer"
                    >
                      <BellOff className="mr-2 h-4 w-4" />
                      {connection.muted ? 'Unmute messages' : 'Mute messages'}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        muteConnectionCalls(connection.id);
                      }} 
                      className="flex items-center hover:bg-[#1C2A41] cursor-pointer"
                    >
                      {connection.callsMuted ? (
                        <>
                          <Volume className="mr-2 h-4 w-4" />
                          Unmute calls
                        </>
                      ) : (
                        <>
                          <VolumeX className="mr-2 h-4 w-4" />
                          Mute calls
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-[#232e48]" />
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeConnection(connection.id);
                      }} 
                      className="text-networx-primary hover:bg-[#1C2A41] cursor-pointer"
                    >
                      Remove Connection
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="hidden md:block md:w-2/3 lg:w-3/4">
        {activeConnection ? (
          <ChatView connection={activeConnection} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-networx-dark">
            <div className="text-center">
              <MessageCircle className="mx-auto h-16 w-16 text-[#2A3A57] mb-4" />
              <h3 className="mt-2 text-xl font-medium text-networx-light">Welcome to NetworX</h3>
              <p className="mt-2 text-networx-light/70 max-w-md">
                Choose a conversation from the sidebar or share your connection code to start a new conversation.
              </p>
              <Button 
                className="mt-6 bg-networx-primary hover:bg-networx-secondary text-white"
                onClick={() => setShowConnectDialog(true)}
              >
                <Plus className="mr-2 h-4 w-4" /> New Connection
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Code Settings Dialog */}
      <Dialog open={showCodeSettings} onOpenChange={setShowCodeSettings}>
        <DialogContent className="sm:max-w-md bg-[#121A2F] border-[#232e48] text-networx-light">
          <DialogHeader>
            <DialogTitle>Connection Code Settings</DialogTitle>
            <DialogDescription className="text-networx-light/70">
              Customize how your connection codes work
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">
                    Code Expiration Time
                  </label>
                  <span className="text-sm text-networx-light/70">
                    {tempSettings.expirationMinutes === null ? 'No expiration' : `${tempSettings.expirationMinutes} minutes`}
                  </span>
                </div>
                
                <div className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id="useExpiration"
                    className="mr-2"
                    checked={tempSettings.expirationMinutes !== null}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setTempSettings({...tempSettings, expirationMinutes: 5});
                      } else {
                        setTempSettings({...tempSettings, expirationMinutes: null});
                      }
                    }}
                  />
                  <label htmlFor="useExpiration" className="text-sm">Enable time-based expiration (unlimited uses during time period)</label>
                </div>
                
                {tempSettings.expirationMinutes !== null && (
                  <Slider
                    value={[tempSettings.expirationMinutes]}
                    min={1}
                    max={60}
                    step={1}
                    className="bg-[#1C2A41]"
                    onValueChange={(value) => setTempSettings({...tempSettings, expirationMinutes: value[0]})}
                  />
                )}
              </div>
              
              {tempSettings.expirationMinutes === null && (
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm font-medium">
                      Maximum Uses Per Code
                    </label>
                    <span className="text-sm text-networx-light/70">
                      {tempSettings.maxUses} uses
                    </span>
                  </div>
                  <Slider
                    value={[tempSettings.maxUses || 1]}
                    min={1}
                    max={10}
                    step={1}
                    className="bg-[#1C2A41]"
                    onValueChange={(value) => setTempSettings({...tempSettings, maxUses: value[0]})}
                  />
                </div>
              )}
            </div>
            
            <div className="pt-2">
              <p className="text-xs text-networx-light/70">
                {tempSettings.expirationMinutes !== null 
                  ? "Time-based codes allow unlimited people to connect during the specified time period."
                  : "Use-based codes allow a specific number of connections before expiring."
                }
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCodeSettings(false)}
              className="border-[#232e48] text-networx-light hover:bg-[#1C2A41] hover:text-networx-light">
              Cancel
            </Button>
            <Button onClick={handleSaveCodeSettings} className="bg-networx-primary hover:bg-networx-secondary text-white">
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Home;
