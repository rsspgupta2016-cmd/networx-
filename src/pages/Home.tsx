
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useConnection, Connection, CodeSettings } from '@/contexts/ConnectionContext';
import { useChat } from '@/contexts/ChatContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  UserX, 
  ShieldAlert,
  Send,
  Clock
} from 'lucide-react';
import ChatView from '../components/ChatView';
import { Slider } from '@/components/ui/slider';

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
    blockConnection,
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
    if (!currentCode) return '';
    
    const expirationTime = new Date(currentCode.createdAt).getTime() + 
      (currentCode.settings.expirationMinutes * 60 * 1000);
    const timeLeftMs = expirationTime - Date.now();
    
    if (timeLeftMs <= 0) return 'Expired';
    
    const minutesLeft = Math.floor(timeLeftMs / 60000);
    const secondsLeft = Math.floor((timeLeftMs % 60000) / 1000);
    
    return `${minutesLeft}:${secondsLeft.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-full md:w-1/3 lg:w-1/4 bg-white border-r border-gray-200">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{user?.displayName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="ml-3">
              <h2 className="text-lg font-semibold">{user?.displayName}</h2>
              <p className="text-xs text-gray-500">NetworX</p>
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="ghost" size="icon" onClick={handleSettings}>
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="p-4">
          <Button 
            onClick={() => setShowConnectDialog(true)} 
            className="w-full"
          >
            <Plus className="mr-2 h-4 w-4" /> New Connection
          </Button>
        </div>

        <div className="overflow-y-auto h-[calc(100vh-160px)]">
          {connections.length === 0 ? (
            <div className="p-6 text-center">
              <User className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No connections</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating a new connection.
              </p>
            </div>
          ) : (
            connections.map(connection => (
              !connection.blocked && (
                <div 
                  key={connection.id}
                  className={`flex items-center justify-between p-4 border-b cursor-pointer hover:bg-gray-50 ${
                    activeConnection?.id === connection.id ? 'bg-gray-100' : ''
                  }`}
                  onClick={() => handleConnectionClick(connection)}
                >
                  <div className="flex items-center flex-1">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={connection.profileImage} />
                      <AvatarFallback>{getInitials(connection.name)}</AvatarFallback>
                    </Avatar>
                    <div className="ml-3 overflow-hidden">
                      <p className="font-medium">{connection.name}</p>
                      <p className="text-sm text-gray-500 truncate">
                        {connection.lastMessage?.content}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    {connection.lastMessage && (
                      <span className="text-xs text-gray-500">
                        {new Date(connection.lastMessage.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    )}
                    {getUnreadCount(connection.id) > 0 && (
                      <span className="bg-primary text-white text-xs rounded-full px-2 py-0.5 mt-1">
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
                      <DropdownMenuItem onClick={() => removeConnection(connection.id)}>
                        <UserX className="mr-2 h-4 w-4" />
                        Remove Connection
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => blockConnection(connection.id)}>
                        <ShieldAlert className="mr-2 h-4 w-4" />
                        Block User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="hidden md:block md:w-2/3 lg:w-3/4">
        {activeConnection ? (
          <ChatView connection={activeConnection} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full bg-gray-50">
            <div className="text-center">
              <h3 className="mt-2 text-lg font-medium text-gray-900">Select a conversation</h3>
              <p className="mt-1 text-sm text-gray-500">
                Choose a connection to start messaging
              </p>
              <Button 
                className="mt-4"
                onClick={() => setShowConnectDialog(true)}
              >
                <Plus className="mr-2 h-4 w-4" /> New Connection
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Connection Dialog */}
      <Dialog open={showConnectDialog} onOpenChange={setShowConnectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Connect with someone</DialogTitle>
            <DialogDescription>
              Generate a code to share, or enter a code you received to create a connection.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Generate your code</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    setTempSettings({...defaultCodeSettings});
                    setShowCodeSettings(true);
                  }}
                >
                  <Settings className="h-4 w-4 mr-1" /> 
                  Code Settings
                </Button>
              </div>
              
              <div className="flex items-center space-x-2">
                <Input 
                  value={connectionCode || (currentCode?.code || '')} 
                  readOnly 
                  placeholder="Your code will appear here" 
                  className="text-center text-xl font-bold tracking-wider"
                />
                <Button 
                  onClick={handleGenerateCode}
                  disabled={!!currentCode && currentCode.usesLeft > 0}
                >
                  Generate
                </Button>
              </div>
              
              {currentCode && (
                <div className="mt-2 text-xs text-center space-y-1">
                  <div className="flex items-center justify-center gap-1 text-amber-600">
                    <Clock className="h-3 w-3" />
                    <span>Expires in {formatTimeLeft()}</span>
                  </div>
                  <p className="text-gray-500">
                    Uses left: {currentCode.usesLeft} of {currentCode.settings.maxUses}
                  </p>
                </div>
              )}
              
              {connectionCode && !currentCode && (
                <p className="text-xs text-center mt-1 text-amber-600">
                  This code will expire in {defaultCodeSettings.expirationMinutes} minutes. 
                  Share it with your contact in person.
                </p>
              )}
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-background text-muted-foreground">OR</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Enter a code you received</h3>
              <div className="flex items-center space-x-2">
                <Input 
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                  className="text-center text-xl font-bold tracking-wider"
                />
                <Button onClick={handleVerifyCode} disabled={isVerifying || codeInput.length < 6}>
                  {isVerifying ? 'Verifying...' : 'Connect'}
                </Button>
              </div>
              <p className="text-xs text-center mt-1 text-gray-500">
                For demo: any 6-digit code will work
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConnectDialog(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Code Settings Dialog */}
      <Dialog open={showCodeSettings} onOpenChange={setShowCodeSettings}>
        <DialogContent>
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
                    {tempSettings.expirationMinutes} minutes
                  </span>
                </div>
                <Slider
                  value={[tempSettings.expirationMinutes]}
                  min={1}
                  max={60}
                  step={1}
                  onValueChange={(value) => setTempSettings({...tempSettings, expirationMinutes: value[0]})}
                />
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
                  onValueChange={(value) => setTempSettings({...tempSettings, maxUses: value[0]})}
                />
              </div>
            </div>
            
            <div className="pt-2">
              <p className="text-xs text-gray-500">
                These settings will apply to all new codes you generate. 
                Note that in a real app, these would be stored securely in the database.
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCodeSettings(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCodeSettings}>
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Home;
