
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useConnection } from '@/contexts/ConnectionContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
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
} from "@/components/ui/alert-dialog";
import { ArrowLeft, ShieldAlert, UserX, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const Settings = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { connections, blockConnection, removeConnection } = useConnection();

  const [displayName, setDisplayName] = useState(user?.displayName || '');

  const handleSaveProfile = () => {
    // In a real app, this would update the user profile in the database
    if (user) {
      const updatedUser = {
        ...user,
        displayName
      };
      
      localStorage.setItem('networx-user', JSON.stringify(updatedUser));
      toast({
        title: "Profile updated",
        description: "Your changes have been saved.",
      });
    }
  };

  const blockedConnections = connections.filter(conn => conn.blocked);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="flex items-center p-4 bg-white border-b">
        <Button variant="ghost" size="icon" onClick={() => navigate('/home')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="ml-4 text-lg font-semibold">Settings</h1>
      </div>

      <div className="container max-w-2xl py-6 space-y-8">
        {/* Profile Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Profile</h2>
          
          <div className="flex items-center mb-6">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">
                {user?.displayName.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div className="ml-4">
              <p className="text-sm text-gray-500">Your photo is only visible to connections</p>
              <Button variant="outline" size="sm" className="mt-2">
                Change Photo
              </Button>
            </div>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                value={user?.phoneNumber}
                disabled
              />
              <p className="text-xs text-gray-500">
                Your phone number is never shared with other users
              </p>
            </div>
            
            <Button onClick={handleSaveProfile} className="mt-2">
              Save Changes
            </Button>
          </div>
        </div>
        
        {/* Blocked Users Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Blocked Users</h2>
          
          {blockedConnections.length === 0 ? (
            <p className="text-gray-500">You haven't blocked any users</p>
          ) : (
            <div className="space-y-4">
              {blockedConnections.map(connection => (
                <div 
                  key={connection.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>
                        {connection.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="ml-3 font-medium">{connection.name}</span>
                  </div>
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={() => removeConnection(connection.id)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Danger Zone */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 text-red-500">Danger Zone</h2>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Delete Account</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete your account and remove all your connections. 
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => {
                  logout();
                  navigate('/login');
                }}>
                  Delete Account
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <p className="mt-2 text-xs text-gray-500">
            Deleting your account will remove all your data and connections permanently.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
