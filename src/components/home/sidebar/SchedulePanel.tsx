import React from "react";
import { Clock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

type ClassSlot = {
    time: string;
    subject: string | null;
};

type DaySchedule = {
    day: string;
    slots: ClassSlot[];
};

const scheduleData: DaySchedule[] = [
    {
        day: "Monday",
        slots: [
            { time: "8:00 AM - 8:50 AM", subject: "Principles of Management" },
            { time: "8:50 AM - 9:40 AM", subject: null },
            { time: "9:40 AM - 10:30 AM", subject: "Business Economics" },
            { time: "10:30 AM - 11:20 AM", subject: "Financial Accounting" },
            { time: "11:20 AM - 12:10 PM", subject: null },
            { time: "12:10 PM - 1:00 PM", subject: "Business Communication" },
        ],
    },
    {
        day: "Tuesday",
        slots: [
            { time: "8:00 AM - 8:50 AM", subject: "Business Statistics" },
            { time: "8:50 AM - 9:40 AM", subject: "Principles of Management" },
            { time: "9:40 AM - 10:30 AM", subject: null },
            { time: "10:30 AM - 11:20 AM", subject: "Business Economics" },
            { time: "11:20 AM - 12:10 PM", subject: "Financial Accounting" },
            { time: "12:10 PM - 1:00 PM", subject: null },
        ],
    },
    {
        day: "Wednesday",
        slots: [
            { time: "8:00 AM - 8:50 AM", subject: null },
            { time: "8:50 AM - 9:40 AM", subject: "Business Communication" },
            { time: "9:40 AM - 10:30 AM", subject: "Business Statistics" },
            { time: "10:30 AM - 11:20 AM", subject: "Principles of Management" },
            { time: "11:20 AM - 12:10 PM", subject: "Business Economics" },
            { time: "12:10 PM - 1:00 PM", subject: "Financial Accounting" },
        ],
    },
    {
        day: "Thursday",
        slots: [
            { time: "8:00 AM - 8:50 AM", subject: "Financial Accounting" },
            { time: "8:50 AM - 9:40 AM", subject: null },
            { time: "9:40 AM - 10:30 AM", subject: "Business Communication" },
            { time: "10:30 AM - 11:20 AM", subject: "Business Statistics" },
            { time: "11:20 AM - 12:10 PM", subject: "Principles of Management" },
            { time: "12:10 PM - 1:00 PM", subject: null },
        ],
    },
    {
        day: "Friday",
        slots: [
            { time: "8:00 AM - 8:50 AM", subject: "Business Economics" },
            { time: "8:50 AM - 9:40 AM", subject: "Financial Accounting" },
            { time: "9:40 AM - 10:30 AM", subject: null },
            { time: "10:30 AM - 11:20 AM", subject: "Business Communication" },
            { time: "11:20 AM - 12:10 PM", subject: "Business Statistics" },
            { time: "12:10 PM - 1:00 PM", subject: "Principles of Management" },
        ],
    },
    {
        day: "Saturday",
        slots: [
            { time: "8:00 AM - 8:50 AM", subject: "Tutorial Session" },
            { time: "8:50 AM - 9:40 AM", subject: "Tutorial Session" },
            { time: "9:40 AM - 10:30 AM", subject: null },
            { time: "10:30 AM - 11:20 AM", subject: "Lab/Practical" },
            { time: "11:20 AM - 12:10 PM", subject: "Lab/Practical" },
            { time: "12:10 PM - 1:00 PM", subject: null },
        ],
    },
];

const SchedulePanel = () => {
    return (
        <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <Clock size={20} />
                    Weekly Timetable
                </h3>
                
                {scheduleData.map((daySchedule) => (
                    <div key={daySchedule.day} className="bg-muted/50 rounded-lg p-3">
                        <h4 className="font-medium text-foreground mb-2 border-b border-border pb-1">
                            {daySchedule.day}
                        </h4>
                        <div className="space-y-1">
                            {daySchedule.slots.map((slot, index) => (
                                <div 
                                    key={index} 
                                    className={`flex items-start gap-2 text-sm p-2 rounded ${
                                        slot.subject 
                                            ? "bg-primary/10 border-l-2 border-primary" 
                                            : "bg-muted/30"
                                    }`}
                                >
                                    <span className="text-muted-foreground text-xs min-w-[120px]">
                                        {slot.time}
                                    </span>
                                    <span className={slot.subject ? "text-foreground font-medium" : "text-muted-foreground italic"}>
                                        {slot.subject || "Free Period"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </ScrollArea>
    );
};

export default SchedulePanel;
