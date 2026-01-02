import React from "react";
import { User, Ticket } from "lucide-react";

type Props = {
    activeSection: string;
    setActiveSection: (section: string) => void;
};

const SectionToggle = ({ activeSection, setActiveSection }: Props) => {
    const sections = [
        { id: "PERSONAL", label: "Personal", icon: User },
        { id: "INDUSTRY", label: "Work", icon: Ticket },
    ];

    return (
        <div className="px-4 pt-4 bg-card flex gap-2">
            {sections.map(({ id, label, icon: Icon }) => (
                <button
                    key={id}
                    className={`flex-1 py-2 rounded-lg transition-colors ${
                        activeSection === id 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                    onClick={() => setActiveSection(id)}
                >
                    <div className="flex items-center justify-center gap-2 text-sm">
                        <Icon size={16} /> {label}
                    </div>
                </button>
            ))}
        </div>
    );
};

export default SectionToggle;