import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useConnection } from "@/contexts/ConnectionContext";
import UserHeader from "./sidebar/UserHeader";
import CodeCard from "./sidebar/CodeCard";
import SectionToggle from "./sidebar/SectionToggle";
import ConnectionsList from "./sidebar/ConnectionsList";
import NoticesPanel from "./sidebar/NoticesPanel";
import SchedulePanel from "./sidebar/SchedulePanel";
import CodeSettingsDialog from "./Dialogs/CodeSettingsDialog";
import ChatView from "./ChatView";
import ConnectDialog from "./Dialogs/ConnectDialog";
import AIChatbot from "./AIChatbot";

const Home = () => {
    const { user, handleLogout } = useAuth();
    const { activeConnection, setActiveConnection } = useConnection();

    const [activeSection, setActiveSection] = useState("PERSONAL");
    const [showCodeSettings, setShowCodeSettings] = useState(false);
    const [showConnectDialog, setShowConnectDialog] = useState(false);

    const renderSidebarContent = () => {
        switch (activeSection) {
            case "NOTICES":
                return <NoticesPanel />;
            case "SCHEDULE":
                return <SchedulePanel />;
            default:
                return (
                    <ConnectionsList 
                        activeSection={activeSection} 
                        activeConnection={activeConnection} 
                        setActiveConnection={setActiveConnection} 
                    />
                );
        }
    };

    return (
        <div className="flex h-screen bg-background">
            {/* Sidebar */}
            <div className="w-full md:w-1/3 lg:w-1/4 flex flex-col bg-card border-r border-border">
                <UserHeader user={user} onLogout={handleLogout} onOpenSettings={() => setShowCodeSettings(true)} />
                <CodeCard />
                <SectionToggle activeSection={activeSection} setActiveSection={setActiveSection} />
                
                {renderSidebarContent()}
            </div>

            {/* Chat Area */}
            <div className="hidden md:block md:w-2/3 lg:w-3/4">
                {activeConnection ? (
                    <ChatView connection={activeConnection} />
                ) : (
                    <div className="flex flex-col items-center justify-center h-full bg-background">
                        <div className="text-center">
                            <p className="mt-2 text-muted-foreground max-w-md">Choose a conversation or share your connection code.</p>
                            <button 
                                onClick={() => setShowConnectDialog(true)}
                                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
                            >
                                New Connection
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* AI Chatbot */}
            <AIChatbot />

            {/* Dialogs */}
            <CodeSettingsDialog show={showCodeSettings} setShow={setShowCodeSettings} />
            <ConnectDialog show={showConnectDialog} setShow={setShowConnectDialog} />
        </div>
    );
};

export default Home;