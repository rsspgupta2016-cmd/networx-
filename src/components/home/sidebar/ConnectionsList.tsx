// src/components/home/Sidebar/ConnectionsList.tsx
import React, { useMemo } from "react";
import { useConnection, Connection } from "@/contexts/ConnectionContext";

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
    },
];

const ConnectionsList: React.FC<Props> = ({ activeSection, activeConnection, setActiveConnection }) => {
    const { connections } = useConnection();

    // Filter connections by section and add dummy contacts for Personal
    const filteredConnections = useMemo(() => {
        const realConnections = connections?.filter((conn) => {
            if (activeSection === "PERSONAL") return !conn.is_industry;
            if (activeSection === "INDUSTRY") return conn.is_industry;
            return true;
        }) ?? [];

        // Add dummy contacts for Personal section
        if (activeSection === "PERSONAL") {
            return [...dummyPersonalContacts, ...realConnections];
        }

        return realConnections;
    }, [connections, activeSection]);

    if (!connections) {
        return <p className="text-networx-light/50 p-4">Loading connections...</p>;
    }

    if (filteredConnections.length === 0) {
        return <p className="text-networx-light/50 p-4">No connections available</p>;
    }

    return (
        <ul className="overflow-y-auto flex-1">
            {filteredConnections.map((conn) => (
                <li
                    key={conn.id}
                    className={`p-2 cursor-pointer hover:bg-[#1B2440] ${
                        activeConnection?.id === conn.id ? "bg-[#1B2440]" : ""
                    }`}
                    onClick={() => setActiveConnection(conn)}
                >
                    {conn.name}
                </li>
            ))}
        </ul>
    );
};

export default ConnectionsList;
