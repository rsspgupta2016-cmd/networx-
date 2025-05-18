
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useConnection } from '@/contexts/ConnectionContext';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { BellOff, Trash2, VolumeX } from 'lucide-react';

const Settings = () => {
  const { user, logout } = useAuth();
  const { connections, removeConnection, muteConnection, muteConnectionCalls } = useConnection();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8 text-green-800">Account Settings</h1>
      
      <Card className="mb-8 border-green-100">
        <CardHeader className="bg-green-50">
          <CardTitle className="text-green-800">Your Profile</CardTitle>
          <CardDescription>Your personal information</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center mb-6">
            <Avatar className="h-16 w-16 mr-4 bg-green-600 text-white text-xl">
              <AvatarFallback>{user?.displayName.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-xl font-semibold">{user?.displayName}</h3>
              <p className="text-sm text-gray-500">Account created on {new Date().toLocaleDateString()}</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Identity Code</label>
              <div className="bg-gray-100 p-2 rounded font-mono text-sm">{user?.identityCode || 'NX-XXXXX'}</div>
              <p className="mt-1 text-xs text-gray-500">This is your unique identifier in the NetworX system</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card className="mb-8 border-green-100">
        <CardHeader className="bg-green-50">
          <CardTitle className="text-green-800">Connection Management</CardTitle>
          <CardDescription>Manage your connections</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {connections.length === 0 ? (
            <p className="text-center text-gray-500 py-4">You don't have any connections yet</p>
          ) : (
            <div className="space-y-4">
              {connections.map(connection => (
                <div key={connection.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarFallback className="bg-gradient-to-r from-green-400 to-green-500 text-white">
                        {getInitials(connection.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">{connection.name}</h4>
                      <div className="flex items-center text-xs text-gray-500 space-x-2 mt-1">
                        {connection.muted && (
                          <span className="flex items-center">
                            <BellOff size={12} className="mr-1" />
                            Messages muted
                          </span>
                        )}
                        {connection.callsMuted && (
                          <span className="flex items-center">
                            <VolumeX size={12} className="mr-1" />
                            Calls muted
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-gray-500" 
                      onClick={() => muteConnection(connection.id)}
                    >
                      <BellOff size={16} className="mr-1" />
                      {connection.muted ? 'Unmute' : 'Mute'}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-gray-500" 
                      onClick={() => muteConnectionCalls(connection.id)}
                    >
                      <VolumeX size={16} className="mr-1" />
                      {connection.callsMuted ? 'Unmute Calls' : 'Mute Calls'}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-700">
                          <Trash2 size={16} />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove Connection</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to remove {connection.name}? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction 
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => removeConnection(connection.id)}
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card className="mb-8 border-red-100">
        <CardHeader className="bg-red-50">
          <CardTitle className="text-red-800">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Log Out</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Log Out</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to log out of NetworX?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction 
                  className="bg-red-600 hover:bg-red-700"
                  onClick={logout}
                >
                  Log Out
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
