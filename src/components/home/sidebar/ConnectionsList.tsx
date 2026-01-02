// src/components/home/Sidebar/ConnectionsList.tsx
import React, { useMemo, useState } from "react";
import { useConnection, Connection } from "@/contexts/ConnectionContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, VolumeX, Volume2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import EditConnectionNameDialog from "@/components/home/Dialogs/EditConnectionNameDialog";

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
    const [editConnection, setEditConnection] = useState<Connection | null>(null);
    const [showEditDialog, setShowEditDialog] = useState(false);

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

    const handleEditName = (conn: Connection, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditConnection(conn);
        setShowEditDialog(true);
    };

    const isDummyContact = (id: string) => id.startsWith("dummy-");

    if (!connections) {
        return <p className="text-muted-foreground p-4">Loading connections...</p>;
    }

    if (filteredConnections.length === 0) {
        return <p className="text-muted-foreground p-4">No connections available</p>;
    }

    return (
        <>
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
                        <span className="font-medium text-foreground flex-1">{conn.custom_name || conn.name}</span>
                        
                        {!isDummyContact(conn.id) && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={(e) => handleEditName(conn, e as any)}>
                                        <Pencil className="h-4 w-4 mr-2" />
                                        Edit name
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>
                                        {conn.is_muted ? (
                                            <>
                                                <Volume2 className="h-4 w-4 mr-2" />
                                                Unmute
                                            </>
                                        ) : (
                                            <>
                                                <VolumeX className="h-4 w-4 mr-2" />
                                                Mute
                                            </>
                                        )}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </li>
                ))}
            </ul>

            <EditConnectionNameDialog 
                show={showEditDialog} 
                setShow={setShowEditDialog} 
                connection={editConnection} 
            />
        </>
    );
};

export default ConnectionsList;
