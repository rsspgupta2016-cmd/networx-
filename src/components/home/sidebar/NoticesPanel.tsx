import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Megaphone, CheckCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

type Notice = {
    id: string;
    message: string;
    departments: string[];
    createdAt: string;
    sentBy: string;
};

const departments = [
    "Liberal Studies",
    "Computer Science",
    "Engineering",
    "Business",
    "Mathematics",
    "Physics",
];

const NoticesPanel = () => {
    const [message, setMessage] = useState("");
    const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
    const [selectAll, setSelectAll] = useState(false);
    const [sentNotices, setSentNotices] = useState<Notice[]>([
        {
            id: "1",
            message: "Reminder: All department heads meeting tomorrow at 10 AM in Conference Room A.",
            departments: ["All Departments"],
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            sentBy: "Dean Office"
        },
        {
            id: "2",
            message: "Mid-semester evaluation forms are due by end of this week.",
            departments: ["Computer Science", "Engineering"],
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            sentBy: "Dean Office"
        }
    ]);

    const handleSelectAll = (checked: boolean) => {
        setSelectAll(checked);
        setSelectedDepartments(checked ? [...departments] : []);
    };

    const handleDepartmentToggle = (dept: string) => {
        setSelectedDepartments(prev => 
            prev.includes(dept) 
                ? prev.filter(d => d !== dept)
                : [...prev, dept]
        );
        setSelectAll(false);
    };

    const handleSendNotice = () => {
        if (!message.trim()) {
            toast({
                title: "Error",
                description: "Please enter a message",
                variant: "destructive"
            });
            return;
        }

        if (selectedDepartments.length === 0 && !selectAll) {
            toast({
                title: "Error",
                description: "Please select at least one department",
                variant: "destructive"
            });
            return;
        }

        const newNotice: Notice = {
            id: Date.now().toString(),
            message: message.trim(),
            departments: selectAll ? ["All Departments"] : selectedDepartments,
            createdAt: new Date().toISOString(),
            sentBy: "You"
        };

        setSentNotices(prev => [newNotice, ...prev]);
        setMessage("");
        setSelectedDepartments([]);
        setSelectAll(false);

        toast({
            title: "Notice Sent",
            description: `Broadcast sent to ${selectAll ? "all departments" : selectedDepartments.length + " department(s)"}`
        });
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Yesterday";
        return date.toLocaleDateString();
    };

    return (
        <div className="flex flex-col h-full">
            {/* Compose Notice */}
            <div className="p-4 border-b border-border space-y-4">
                <div className="flex items-center gap-2 text-foreground font-medium">
                    <Megaphone size={18} className="text-primary" />
                    Broadcast Notice
                </div>

                <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your notice message..."
                    className="min-h-[100px] resize-none"
                />

                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Checkbox 
                            id="select-all"
                            checked={selectAll}
                            onCheckedChange={handleSelectAll}
                        />
                        <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                            All Departments
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        {departments.map(dept => (
                            <div key={dept} className="flex items-center gap-2">
                                <Checkbox 
                                    id={dept}
                                    checked={selectedDepartments.includes(dept)}
                                    onCheckedChange={() => handleDepartmentToggle(dept)}
                                    disabled={selectAll}
                                />
                                <label 
                                    htmlFor={dept} 
                                    className={`text-sm cursor-pointer ${selectAll ? "text-muted-foreground" : ""}`}
                                >
                                    {dept}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                <Button 
                    onClick={handleSendNotice} 
                    className="w-full"
                    disabled={!message.trim() || (selectedDepartments.length === 0 && !selectAll)}
                >
                    <Send size={16} className="mr-2" />
                    Send Notice
                </Button>
            </div>

            {/* Sent Notices */}
            <div className="flex-1 overflow-hidden">
                <div className="p-4 pb-2 text-sm font-medium text-muted-foreground">
                    Recent Broadcasts
                </div>
                <ScrollArea className="h-full px-4 pb-4">
                    <div className="space-y-3">
                        {sentNotices.map(notice => (
                            <div 
                                key={notice.id} 
                                className="p-3 rounded-lg bg-muted/50 border border-border"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm text-foreground">{notice.message}</p>
                                    <CheckCircle size={14} className="text-green-500 flex-shrink-0 mt-0.5" />
                                </div>
                                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                                    <span>{formatDate(notice.createdAt)}</span>
                                    <span>•</span>
                                    <span>{notice.departments.join(", ")}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>
            </div>
        </div>
    );
};

export default NoticesPanel;