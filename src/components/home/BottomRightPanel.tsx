import React, { useState } from "react";
import { Calendar, ClipboardList, X } from "lucide-react";
import SchedulePanel from "./sidebar/SchedulePanel";

type Assignment = {
    subject: string;
    units: { name: string; status: "Pending" | "Completed" | "Not Assigned" }[];
};

const dummyAssignments: Assignment[] = [
    {
        subject: "Business Management",
        units: [
            { name: "Unit 1", status: "Pending" },
            { name: "Unit 2", status: "Completed" },
            { name: "Unit 3", status: "Not Assigned" },
        ],
    },
    {
        subject: "Economics",
        units: [
            { name: "Unit 1", status: "Completed" },
            { name: "Unit 2", status: "Pending" },
            { name: "Unit 3", status: "Pending" },
        ],
    },
    {
        subject: "Mathematics",
        units: [
            { name: "Unit 1", status: "Completed" },
            { name: "Unit 2", status: "Completed" },
            { name: "Unit 3", status: "Not Assigned" },
        ],
    },
];

const getStatusColor = (status: Assignment["units"][0]["status"]) => {
    switch (status) {
        case "Completed":
            return "text-green-400";
        case "Pending":
            return "text-yellow-400";
        case "Not Assigned":
            return "text-muted-foreground";
    }
};

const BottomRightPanel = () => {
    const [activeTab, setActiveTab] = useState<"schedule" | "assignment" | null>(null);

    const closePanel = () => setActiveTab(null);

    return (
        <div className="fixed bottom-4 left-4 z-50">
            {/* Expanded Panel */}
            {activeTab && (
                <div className="mb-2 w-[500px] max-h-[500px] bg-card border border-border rounded-lg shadow-lg flex flex-col overflow-hidden">
                    <div className="flex items-center justify-between p-3 border-b border-border bg-muted/50">
                        <span className="font-medium text-foreground flex items-center gap-2">
                            {activeTab === "schedule" ? (
                                <>
                                    <Calendar size={16} /> Weekly Schedule
                                </>
                            ) : (
                                <>
                                    <ClipboardList size={16} /> Assignments
                                </>
                            )}
                        </span>
                        <button 
                            onClick={closePanel}
                            className="p-1 hover:bg-muted rounded"
                        >
                            <X size={16} className="text-muted-foreground" />
                        </button>
                    </div>
                    <div className="flex-1 overflow-auto">
                        {activeTab === "schedule" ? (
                            <SchedulePanel />
                        ) : (
                            <div className="p-4 space-y-4">
                                {dummyAssignments.map((assignment) => (
                                    <div key={assignment.subject} className="border border-border rounded-lg p-3">
                                        <h3 className="font-semibold text-foreground mb-2">{assignment.subject}</h3>
                                        <div className="space-y-1">
                                            {assignment.units.map((unit) => (
                                                <div key={unit.name} className="flex justify-between text-sm">
                                                    <span className="text-muted-foreground">{unit.name}</span>
                                                    <span className={getStatusColor(unit.status)}>{unit.status}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Tab Buttons */}
            <div className="flex gap-2">
                <button
                    onClick={() => setActiveTab(activeTab === "schedule" ? null : "schedule")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg transition-colors ${
                        activeTab === "schedule" 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }`}
                >
                    <Calendar size={18} />
                    <span className="text-sm font-medium">Schedule</span>
                </button>
                <button
                    onClick={() => setActiveTab(activeTab === "assignment" ? null : "assignment")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg shadow-lg transition-colors ${
                        activeTab === "assignment" 
                            ? "bg-primary text-primary-foreground" 
                            : "bg-primary text-primary-foreground hover:bg-primary/90"
                    }`}
                >
                    <ClipboardList size={18} />
                    <span className="text-sm font-medium">Assignment</span>
                </button>
            </div>
        </div>
    );
};

export default BottomRightPanel;