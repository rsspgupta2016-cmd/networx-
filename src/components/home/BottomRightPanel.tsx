import React, { useState } from "react";
import { Calendar, X } from "lucide-react";
import SchedulePanel from "./sidebar/SchedulePanel";

const BottomRightPanel = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed bottom-4 left-4 z-50">
            {/* Expanded Panel */}
            {isOpen && (
                <div className="mb-2 w-[500px] max-h-[500px] bg-card border border-border rounded-lg shadow-lg flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between p-3 border-b border-border bg-muted/50">
                        <span className="font-medium text-foreground flex items-center gap-2">
                            <Calendar size={16} /> Weekly Schedule
                        </span>
                        <button 
                            onClick={() => setIsOpen(false)}
                            className="p-1 hover:bg-muted rounded"
                        >
                            <X size={16} className="text-muted-foreground" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-auto">
                        <SchedulePanel />
                    </div>
                </div>
            )}

            {/* Schedule Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg transition-colors bg-primary text-primary-foreground hover:bg-primary/90"
            >
                <Calendar size={18} />
                <span className="text-sm font-medium">Schedule</span>
            </button>
        </div>
    );
};

export default BottomRightPanel;
