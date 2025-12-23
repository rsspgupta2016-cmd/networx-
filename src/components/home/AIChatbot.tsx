import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, X, Send, Loader2, User, GraduationCap, DollarSign, AlertCircle } from "lucide-react";

type Message = {
    id: string;
    role: "user" | "assistant";
    content: string;
};

type StudentInfo = {
    name: string;
    department: string;
    section: string;
    issue: "attendance" | "fees" | "both";
    attendancePercent?: number;
    feesDue?: number;
};

// Mock data for demonstration
const mockStudentData: StudentInfo[] = [
    { name: "John Smith", department: "Liberal Studies", section: "A", issue: "attendance", attendancePercent: 68 },
    { name: "Emma Wilson", department: "Liberal Studies", section: "A", issue: "fees", feesDue: 15000 },
    { name: "Michael Brown", department: "Liberal Studies", section: "B", issue: "both", attendancePercent: 72, feesDue: 8500 },
    { name: "Sarah Davis", department: "Computer Science", section: "A", issue: "attendance", attendancePercent: 65 },
    { name: "James Johnson", department: "Computer Science", section: "B", issue: "fees", feesDue: 20000 },
    { name: "Emily Taylor", department: "Engineering", section: "A", issue: "attendance", attendancePercent: 70 },
    { name: "David Lee", department: "Engineering", section: "C", issue: "both", attendancePercent: 60, feesDue: 12000 },
    { name: "Lisa Anderson", department: "Business", section: "A", issue: "fees", feesDue: 5000 },
];

const AIChatbot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: "welcome",
            role: "assistant",
            content: "Hello! I'm your Faculty Assistant. I can help you find students with:\n\n• Attendance below 75%\n• Outstanding fee dues\n• Both issues combined\n\nTry asking: \"Show me students with low attendance in Liberal Studies\" or \"List all students with pending fees\""
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const processQuery = (query: string): string => {
        const lowerQuery = query.toLowerCase();
        
        // Determine what to filter
        const checkAttendance = lowerQuery.includes("attendance") || lowerQuery.includes("absent");
        const checkFees = lowerQuery.includes("fee") || lowerQuery.includes("payment") || lowerQuery.includes("due");
        
        // Extract department if mentioned
        let departmentFilter: string | null = null;
        if (lowerQuery.includes("liberal")) departmentFilter = "Liberal Studies";
        else if (lowerQuery.includes("computer") || lowerQuery.includes("cs")) departmentFilter = "Computer Science";
        else if (lowerQuery.includes("engineering")) departmentFilter = "Engineering";
        else if (lowerQuery.includes("business")) departmentFilter = "Business";

        // Filter students
        let filteredStudents = mockStudentData;
        
        if (departmentFilter) {
            filteredStudents = filteredStudents.filter(s => s.department === departmentFilter);
        }

        if (checkAttendance && !checkFees) {
            filteredStudents = filteredStudents.filter(s => s.issue === "attendance" || s.issue === "both");
        } else if (checkFees && !checkAttendance) {
            filteredStudents = filteredStudents.filter(s => s.issue === "fees" || s.issue === "both");
        }

        if (filteredStudents.length === 0) {
            return "No students found matching your criteria. Try a different query or check a specific department.";
        }

        // Group by department and section
        const grouped: Record<string, Record<string, StudentInfo[]>> = {};
        filteredStudents.forEach(student => {
            if (!grouped[student.department]) grouped[student.department] = {};
            if (!grouped[student.department][student.section]) grouped[student.department][student.section] = [];
            grouped[student.department][student.section].push(student);
        });

        // Build response
        let response = `📊 **Student Report**\n\n`;
        
        Object.entries(grouped).forEach(([dept, sections]) => {
            response += `**${dept} Department**\n`;
            Object.entries(sections).forEach(([section, students]) => {
                response += `└─ Section ${section}:\n`;
                students.forEach(student => {
                    response += `   • ${student.name}`;
                    if (student.attendancePercent) {
                        response += ` (📉 ${student.attendancePercent}% attendance)`;
                    }
                    if (student.feesDue) {
                        response += ` (💰 ₹${student.feesDue.toLocaleString()} due)`;
                    }
                    response += `\n`;
                });
            });
            response += `\n`;
        });

        response += `---\n**Summary:** ${filteredStudents.length} student(s) found`;
        
        return response;
    };

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = {
            id: Date.now().toString(),
            role: "user",
            content: input.trim()
        };

        setMessages(prev => [...prev, userMessage]);
        setInput("");
        setIsLoading(true);

        // Simulate AI processing delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        const response = processQuery(userMessage.content);
        
        const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: "assistant",
            content: response
        };

        setMessages(prev => [...prev, assistantMessage]);
        setIsLoading(false);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <>
            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-all duration-200 flex items-center justify-center"
            >
                {isOpen ? <X size={24} /> : <Bot size={24} />}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 z-50 w-96 h-[500px] bg-card border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
                    {/* Header */}
                    <div className="p-4 bg-gradient-to-r from-primary to-secondary text-primary-foreground">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                                <Bot size={20} />
                            </div>
                            <div>
                                <h3 className="font-semibold">Faculty Assistant</h3>
                                <p className="text-xs opacity-80">AI-powered management helper</p>
                            </div>
                        </div>
                    </div>

                    {/* Messages */}
                    <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                        <div className="space-y-4">
                            {messages.map((message) => (
                                <div
                                    key={message.id}
                                    className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                                >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                        message.role === "user" 
                                            ? "bg-primary text-primary-foreground" 
                                            : "bg-muted text-muted-foreground"
                                    }`}>
                                        {message.role === "user" ? <User size={16} /> : <Bot size={16} />}
                                    </div>
                                    <div className={`max-w-[80%] p-3 rounded-lg text-sm whitespace-pre-wrap ${
                                        message.role === "user"
                                            ? "bg-primary text-primary-foreground rounded-br-none"
                                            : "bg-muted text-foreground rounded-bl-none"
                                    }`}>
                                        {message.content}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                        <Bot size={16} className="text-muted-foreground" />
                                    </div>
                                    <div className="bg-muted p-3 rounded-lg rounded-bl-none">
                                        <Loader2 size={16} className="animate-spin text-muted-foreground" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>

                    {/* Quick Actions */}
                    <div className="px-4 py-2 border-t border-border">
                        <div className="flex gap-2 overflow-x-auto pb-2">
                            <button 
                                onClick={() => setInput("Show students with attendance below 75%")}
                                className="flex items-center gap-1 px-3 py-1 text-xs bg-muted hover:bg-muted/80 rounded-full whitespace-nowrap"
                            >
                                <GraduationCap size={12} /> Low Attendance
                            </button>
                            <button 
                                onClick={() => setInput("List students with pending fees")}
                                className="flex items-center gap-1 px-3 py-1 text-xs bg-muted hover:bg-muted/80 rounded-full whitespace-nowrap"
                            >
                                <DollarSign size={12} /> Fee Dues
                            </button>
                            <button 
                                onClick={() => setInput("Show all students with issues")}
                                className="flex items-center gap-1 px-3 py-1 text-xs bg-muted hover:bg-muted/80 rounded-full whitespace-nowrap"
                            >
                                <AlertCircle size={12} /> All Issues
                            </button>
                        </div>
                    </div>

                    {/* Input */}
                    <div className="p-4 border-t border-border">
                        <div className="flex gap-2">
                            <Input
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyPress={handleKeyPress}
                                placeholder="Ask about students..."
                                className="flex-1"
                                disabled={isLoading}
                            />
                            <Button 
                                onClick={handleSend} 
                                disabled={!input.trim() || isLoading}
                                size="icon"
                            >
                                <Send size={16} />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default AIChatbot;