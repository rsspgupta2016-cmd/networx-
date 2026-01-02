import React, { useState } from "react";
import { Megaphone, Calendar, X } from "lucide-react";
import NoticesPanel from "./sidebar/NoticesPanel";
import SchedulePanel from "./sidebar/SchedulePanel";

const BottomRightPanel = () => {
    const [activeTab, setActiveTab] = useState<"NOTICES" | "SCHEDULE" | null>(null);

    const toggleTab = (tab: "NOTICES" | "SCHEDULE") => {
        setActiveTab(activeTab === tab ? null : tab);
    };

    return (
        <div className="fixed bottom-4 right-4 z-50">
            {/* Expanded Panel */}
            {activeTab && (
                <div className="mb-2 w-80 h-96 bg-card border border-border rounded-lg shadow-lg flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between p-3 border-b border-border bg-muted/50">
                        <span className="font-medium text-foreground flex items-center gap-2">
                            {activeTab === "NOTICES" ? (
                                <>
                                    <Megaphone size={16} /> Notices
                                </>
                            ) : (
                                <>
                                    <Calendar size={16} /> Schedule
                                </>
                            )}
                        </span>
                        <button 
                            onClick={() => setActiveTab(null)}
                            className="p-1 hover:bg-muted rounded"
                        >
                            <X size={16} className="text-muted-foreground" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        {activeTab === "NOTICES" ? <NoticesPanel /> : <SchedulePanel />}
                    </div>
                </div>
            )}

            {/* Tab Buttons */}
            <div className="flex gap-2 bg-card border border-border rounded-lg p-2 shadow-lg">
                <button
                    onClick={() => toggleTab("NOTICES")}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                        activeTab === "NOTICES"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                >
                    <Megaphone size={16} />
                    <span className="text-sm">Notices</span>
                </button>
                <button
                    onClick={() => toggleTab("SCHEDULE")}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                        activeTab === "SCHEDULE"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                >
                    <Calendar size={16} />
                    <span className="text-sm">Schedule</span>
                </button>
            </div>
        </div>
    );
};

export default BottomRightPanel;
