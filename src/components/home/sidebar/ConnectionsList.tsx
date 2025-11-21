// src/components/home/Sidebar/ConnectionsList.tsx
import React from "react";
import { useConnection, Connection } from "@/contexts/ConnectionContext";

type Props = {
    activeSection: string;
    activeConnection: Connection | null;
    setActiveConnection: (conn: Connection) => void;
};

const ConnectionsList: React.FC<Props> = ({ activeSection, activeConnection, setActiveConnection }) => {
    const { connections } = useConnection();

    // Filter connections by section (example)
    const filteredConnections = connections?.filter((conn) => {
        if (activeSection === "PERSONAL") return !conn.name.includes("Team");
        if (activeSection === "TEAM") return conn.name.includes("Team");
        return true;
    }) ?? [];

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
