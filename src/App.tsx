
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ConnectionProvider } from "./contexts/ConnectionContext";
import { ChatProvider } from "./contexts/ChatContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { useIsMobile } from "./hooks/use-mobile";

// Pages
import ProductionAuth from "./pages/ProductionAuth";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import AdminPanel from "./components/AdminPanel";
import MobileLayout from "./components/MobileLayout";
import Discovery from "./pages/Discovery";

const queryClient = new QueryClient();

const App = () => {
  const isMobile = useIsMobile();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ConnectionProvider>
          <ChatProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                {isMobile ? (
                  <MobileLayout>
                    <Routes>
                      {/* Auth Routes */}
                      <Route path="/auth" element={<ProductionAuth />} />
                      <Route path="/signup" element={<Signup />} />
                      
                      {/* Protected Routes */}
                      <Route 
                        path="/home" 
                        element={
                          <ProtectedRoute>
                            <Home />
                          </ProtectedRoute>
                        } 
                      />
                      
                      {/* Discovery Route */}
                      <Route 
                        path="/discovery" 
                        element={
                          <ProtectedRoute>
                            <Discovery />
                          </ProtectedRoute>
                        } 
                      />
                      
                      <Route 
                        path="/settings" 
                        element={
                          <ProtectedRoute>
                            <Settings />
                          </ProtectedRoute>
                        } 
                      />
                      
                      {/* Admin Panel Route - Make sure it's protected */}
                      <Route 
                        path="/admin" 
                        element={
                          <ProtectedRoute>
                            <AdminPanel />
                          </ProtectedRoute>
                        } 
                      />
                      
                      {/* Redirect root to auth */}
                      <Route path="/" element={<Navigate to="/auth" />} />
                      
                      {/* 404 Route */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </MobileLayout>
                ) : (
                  <Routes>
                    {/* Auth Routes */}
                    <Route path="/auth" element={<ProductionAuth />} />
                    <Route path="/signup" element={<Signup />} />
                    
                    {/* Protected Routes */}
                    <Route 
                      path="/home" 
                      element={
                        <ProtectedRoute>
                          <Home />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* Discovery Route */}
                    <Route 
                      path="/discovery" 
                      element={
                        <ProtectedRoute>
                          <Discovery />
                        </ProtectedRoute>
                      } 
                    />
                    
                    <Route 
                      path="/settings" 
                      element={
                        <ProtectedRoute>
                          <Settings />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* Admin Panel Route - Make sure it's protected */}
                    <Route 
                      path="/admin" 
                      element={
                        <ProtectedRoute>
                          <AdminPanel />
                        </ProtectedRoute>
                      } 
                    />
                    
                    {/* Redirect root to auth */}
                    <Route path="/" element={<Navigate to="/auth" />} />
                    
                    {/* 404 Route */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                )}
              </BrowserRouter>
            </TooltipProvider>
          </ChatProvider>
        </ConnectionProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
