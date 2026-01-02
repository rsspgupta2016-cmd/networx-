// src/components/home/Sidebar/ConnectionsList.tsx
import React, { useMemo } from "react";
import { useConnection, Connection } from "@/contexts/ConnectionContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

type Props = {
    activeSection: string;
    activeConnection: Connection | null;
    setActiveConnection: (conn: Connection) => void;
};

// Dummy contacts for Personal section
const dummyPersonalContacts: Connection[] = [
    {
        id: "dummy-1",
        name: "Alex Johnson",
        user_id: "dummy",
        is_muted: false,
        calls_muted: false,
        is_industry: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        profile_image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face",
    },
    {
        id: "dummy-2",
        name: "Sarah Williams",
        user_id: "dummy",
        is_muted: false,
        calls_muted: false,
        is_industry: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        profile_image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face",
    },
];

const ConnectionsList: React.FC<Props> = ({ activeSection, activeConnection, setActiveConnection }) => {
    const { connections } = useConnection();

    // Filter connections by section and add dummy contacts for Personal
    const filteredConnections = useMemo(() => {
        const realConnections = connections?.filter((conn) => {
            if (activeSection === "PERSONAL") return !conn.is_industry;
            if (activeSection === "WORK") return conn.is_industry;
            return true;
        }) ?? [];

        // Add dummy contacts for Personal section
        if (activeSection === "PERSONAL") {
            return [...dummyPersonalContacts, ...realConnections];
        }

        return realConnections;
    }, [connections, activeSection]);

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    if (!connections) {
        return <p className="text-muted-foreground p-4">Loading connections...</p>;
    }

    if (filteredConnections.length === 0) {
        return <p className="text-muted-foreground p-4">No connections available</p>;
    }

    return (
        <ul className="overflow-y-auto flex-1 p-2 space-y-2">
            {filteredConnections.map((conn) => (
                <li
                    key={conn.id}
                    className={`p-3 cursor-pointer rounded-lg border border-border/30 hover:bg-accent/20 transition-colors flex items-center gap-3 ${
                        activeConnection?.id === conn.id ? "bg-accent/30 border-primary/50" : "bg-card/50"
                    }`}
                    onClick={() => setActiveConnection(conn)}
                >
                    <Avatar className="h-10 w-10">
                        <AvatarImage src={conn.profile_image || undefined} alt={conn.name} />
                        <AvatarFallback className="bg-primary/20 text-primary text-sm font-medium">
                            {getInitials(conn.name)}
                        </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-foreground">{conn.name}</span>
                </li>
            ))}
        </ul>
    );
};

export default ConnectionsList;
