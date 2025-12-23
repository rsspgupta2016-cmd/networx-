// src/App.tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./contexts/AuthContext";
import { ConnectionProvider } from "./contexts/ConnectionContext.tsx";
import { ChatProvider } from "./contexts/ChatContext";
import ProtectedRoute from "./components/ProtectedRoute";
import { useIsMobile } from "./hooks/use-mobile";

// ✅ Pages you're keeping
import Login from "./pages/Login";
import Home from "./components/home/Home.tsx";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import AdminPanel from "./components/AdminPanel";
import MobileLayout from "./components/MobileLayout";
import Discovery from "./pages/Discovery";

const queryClient = new QueryClient();

// Separate component for routes that need context
const AppRoutes = () => {
    const isMobile = useIsMobile();

    if (isMobile) {
        return (
            <MobileLayout>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route
                        path="/home"
                        element={
                            <ProtectedRoute>
                                <Home />
                            </ProtectedRoute>
                        }
                    />
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
                    <Route
                        path="/admin"
                        element={
                            <ProtectedRoute>
                                <AdminPanel />
                            </ProtectedRoute>
                        }
                    />
                    <Route path="/" element={<Navigate to="/login" />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </MobileLayout>
        );
    }

    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route
                path="/home"
                element={
                    <ProtectedRoute>
                        <Home />
                    </ProtectedRoute>
                }
            />
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
            <Route
                path="/admin"
                element={
                    <ProtectedRoute>
                        <AdminPanel />
                    </ProtectedRoute>
                }
            />
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
};

const App = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <ConnectionProvider>
                    <ChatProvider>
                        <TooltipProvider>
                            <Toaster />
                            <Sonner />
                            <BrowserRouter>
                                <AppRoutes />
                            </BrowserRouter>
                        </TooltipProvider>
                    </ChatProvider>
                </ConnectionProvider>
            </AuthProvider>
        </QueryClientProvider>
    );
};

export default App;
