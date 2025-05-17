import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  VolumeX
} from 'lucide-react';
import ChatView from '../components/ChatView';
import { Slider } from '@/components/ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const Home = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
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

  return (
    <div className="flex h-screen bg-blue-50">
      {/* Sidebar */}
      <div className="w-full md:w-1/3 lg:w-1/4 bg-white border-r border-blue-200 flex flex-col">
        {/* User header */}
        <div className="flex items-center justify-between p-4 border-b border-blue-100 bg-gradient-to-r from-green-500 to-green-600 text-white">
          <div className="flex items-center">
            <Avatar className="h-10 w-10 bg-green-700 border-2 border-white">
              <AvatarFallback className="bg-green-700 text-white">{user?.displayName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <h2 className="text-lg font-semibold">{user?.displayName}</h2>
              <p className="text-xs text-green-100">
                {user?.identityCode ? `ID: ${user.identityCode}` : 'NetworX'}
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="ghost" size="icon" onClick={handleSettings} className="text-white hover:bg-green-600">
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout} className="text-white hover:bg-green-600">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Connection code card */}
        <div className="p-4 bg-white border-b border-green-100">
          <Card className="overflow-hidden bg-gradient-to-r from-green-100 to-green-50 border-green-200">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-base flex justify-between items-center">
                <span className="flex items-center gap-1">
                  <MessageCircle size={18} className="text-green-600" />
                  Connection Code
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setTempSettings({...defaultCodeSettings});
                    setShowCodeSettings(true);
                  }}
                  className="h-7 w-7 p-0"
                >
                  <Settings className="h-4 w-4 text-green-800" />
                </Button>
              </CardTitle>
              <CardDescription className="text-xs text-green-700">
                Share this code to connect with someone
              </CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white rounded-lg border border-green-200 flex-grow text-center">
                  <span className="text-2xl font-bold tracking-widest text-green-700">
                    {currentCode?.code || '------'}
                  </span>
                </div>
                <Button 
                  size="sm" 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleGenerateCode}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  New
                </Button>
              </div>
              
              {currentCode && (
                <div className="mt-2 text-xs text-center flex items-center justify-between text-green-800">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatTimeLeft()}</span>
                  </div>
                  <span>Uses: {currentCode.usesLeft}/{currentCode.settings.maxUses}</span>
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
                className="border-green-200 focus:border-green-400"
                maxLength={6}
              />
            </div>
            <Button 
              className="ml-2 bg-green-500 hover:bg-green-600" 
              onClick={handleVerifyCode} 
              disabled={isVerifying || codeInput.length < 6}
            >
              <Send className="h-4 w-4 mr-1" />
              Connect
            </Button>
          </div>
        </div>

        {/* Connections */}
        <div className="flex-1 overflow-y-auto border-t border-green-50">
          <div className="p-4 border-b border-green-50">
            <h2 className="font-medium text-sm text-green-800">Recent Chats</h2>
          </div>
          
          {connections.length === 0 ? (
            <div className="p-6 text-center">
              <User className="mx-auto h-12 w-12 text-green-300" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No connections</h3>
              <p className="mt-1 text-sm text-gray-500">
                Share your code with someone to start chatting.
              </p>
            </div>
          ) : (
            connections.map(connection => (
              <div 
                key={connection.id}
                className={`flex items-center justify-between p-4 cursor-pointer hover:bg-green-50 border-b border-green-50 ${
                  activeConnection?.id === connection.id ? 'bg-green-100' : ''
                }`}
                onClick={() => handleConnectionClick(connection)}
              >
                <div className="flex items-center flex-1">
                  <Avatar className="h-12 w-12 border border-green-100">
                    <AvatarImage src={connection.profileImage} />
                    <AvatarFallback className="bg-gradient-to-r from-green-400 to-green-500 text-white">
                      {getInitials(connection.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-3 overflow-hidden">
                    <div className="flex items-center">
                      <p className="font-medium text-green-900">{connection.name}</p>
                      {connection.muted && (
                        <BellOff size={14} className="ml-1 text-gray-400" />
                      )}
                      {connection.callsMuted && (
                        <VolumeX size={14} className="ml-1 text-gray-400" />
                      )}
                    </div>
                    <p className={`text-sm ${connection.muted ? 'text-gray-400' : 'text-green-600'} truncate`}>
                      {connection.lastMessage?.content}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  {connection.lastMessage && (
                    <span className="text-xs text-green-500">
                      {new Date(connection.lastMessage.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  )}
                  {getUnreadCount(connection.id) > 0 && (
                    <span className="bg-green-500 text-white text-xs rounded-full px-2 py-0.5 mt-1 font-medium">
                      {getUnreadCount(connection.id)}
                    </span>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={e => e.stopPropagation()}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        muteConnection(connection.id);
                      }} 
                      className="flex items-center"
                    >
                      <BellOff className="mr-2 h-4 w-4" />
                      {connection.muted ? 'Unmute messages' : 'Mute messages'}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        muteConnectionCalls(connection.id);
                      }} 
                      className="flex items-center"
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
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={(e) => {
                        e.stopPropagation();
                        removeConnection(connection.id);
                      }} 
                      className="text-red-600"
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
          <div className="flex flex-col items-center justify-center h-full bg-blue-50">
            <div className="text-center">
              <MessageCircle className="mx-auto h-16 w-16 text-green-300 mb-4" />
              <h3 className="mt-2 text-xl font-medium text-green-800">Welcome to NetworX</h3>
              <p className="mt-2 text-green-600 max-w-md">
                Choose a conversation from the sidebar or share your connection code to start a new conversation.
              </p>
              <Button 
                className="mt-6 bg-green-600 hover:bg-green-700"
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connection Code Settings</DialogTitle>
            <DialogDescription>
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
                  <span className="text-sm text-gray-500">
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
                        // If checked, set default value of 5 minutes
                        setTempSettings({...tempSettings, expirationMinutes: 5});
                      } else {
                        // If unchecked, set to null (no expiration)
                        setTempSettings({...tempSettings, expirationMinutes: null});
                      }
                    }}
                  />
                  <label htmlFor="useExpiration" className="text-sm">Enable expiration time</label>
                </div>
                
                {tempSettings.expirationMinutes !== null && (
                  <Slider
                    value={[tempSettings.expirationMinutes]}
                    min={1}
                    max={60}
                    step={1}
                    className="bg-green-100"
                    onValueChange={(value) => setTempSettings({...tempSettings, expirationMinutes: value[0]})}
                  />
                )}
              </div>
              
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">
                    Maximum Uses Per Code
                  </label>
                  <span className="text-sm text-gray-500">
                    {tempSettings.maxUses} uses
                  </span>
                </div>
                <Slider
                  value={[tempSettings.maxUses]}
                  min={1}
                  max={10}
                  step={1}
                  className="bg-green-100"
                  onValueChange={(value) => setTempSettings({...tempSettings, maxUses: value[0]})}
                />
              </div>
            </div>
            
            <div className="pt-2">
              <p className="text-xs text-gray-500">
                These settings will apply to all new codes you generate. 
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCodeSettings(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCodeSettings} className="bg-green-600 hover:bg-green-700">
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Home;
