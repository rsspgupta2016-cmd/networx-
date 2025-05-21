
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MessageCircle, User, Settings, ArrowLeft, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

interface MobileLayoutProps {
  children: React.ReactNode;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // Check if current route is chat view
  const isChatView = location.pathname === '/home' && location.search.includes('chat');
  // Check if we're in discovery section
  const isDiscoverySection = location.pathname === '/discovery';
  // Check if we're on login/signup routes
  const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
  
  const handleBack = () => {
    if (isChatView) {
      navigate('/home');
    } else {
      navigate(-1);
    }
  };
  
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-screen bg-purple-50">
      {/* Don't show header on login/signup */}
      {!isAuthPage && (
        <header className="networx-gradient text-white p-4 flex items-center justify-between">
          <div className="flex items-center">
            {location.pathname !== '/home' && location.pathname !== '/discovery' && (
              <Button 
                variant="ghost" 
                className="mr-2 text-white hover:bg-purple-600/30 p-1" 
                onClick={handleBack}
              >
                <ArrowLeft size={24} />
              </Button>
            )}
            <h1 className="text-xl font-bold">NetworX</h1>
          </div>
          
          <div>
            {user && (
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-purple-600/30">
                    <User size={24} />
                  </Button>
                </SheetTrigger>
                <SheetContent className="bg-white">
                  <div className="flex flex-col h-full">
                    <div className="p-4 networx-gradient text-white mb-4 -mt-6 -mx-6">
                      <h2 className="text-xl font-bold">{user.displayName}</h2>
                      <p className="text-sm opacity-80">ID: {user.identityCode || 'NX-XXXXX'}</p>
                    </div>
                    
                    <div className="space-y-4">
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start" 
                        onClick={() => navigate('/settings')}
                      >
                        <Settings size={18} className="mr-2" />
                        Settings
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start text-red-500 hover:text-red-600" 
                        onClick={handleLogout}
                      >
                        Logout
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </header>
      )}
      
      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
      
      {/* Mobile navigation bar - only show when authenticated and not on auth pages */}
      {user && !isAuthPage && (
        <nav className="bg-white border-t border-purple-200 p-2 flex justify-around">
          <Button 
            variant="ghost" 
            className={`flex flex-col items-center ${location.pathname === '/home' ? 'text-networx-primary' : 'text-gray-500'}`}
            onClick={() => navigate('/home')}
          >
            <MessageCircle size={24} />
            <span className="text-xs mt-1">Chats</span>
          </Button>
          
          <Button 
            variant="ghost" 
            className={`flex flex-col items-center ${isDiscoverySection ? 'text-networx-primary' : 'text-gray-500'}`}
            onClick={() => navigate('/discovery')}
          >
            <Sparkles size={24} />
            <span className="text-xs mt-1">Discovery</span>
          </Button>
          
          <Button 
            variant="ghost" 
            className={`flex flex-col items-center ${location.pathname === '/settings' ? 'text-networx-primary' : 'text-gray-500'}`}
            onClick={() => navigate('/settings')}
          >
            <Settings size={24} />
            <span className="text-xs mt-1">Settings</span>
          </Button>
        </nav>
      )}
    </div>
  );
};

export default MobileLayout;
