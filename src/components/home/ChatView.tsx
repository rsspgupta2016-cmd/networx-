import React, { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Phone, Video, MoreVertical } from "lucide-react";
import { Connection } from "@/contexts/ConnectionContext";

type ChatViewProps = {
    connection: Connection;
};

const ChatView = ({ connection }: ChatViewProps) => {
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState<{ id: number; text: string; sender: "me" | "them"; time: string }[]>([
        { id: 1, text: "Hey! How are you?", sender: "them", time: "10:30 AM" },
        { id: 2, text: "I'm good, thanks! How about you?", sender: "me", time: "10:32 AM" },
        { id: 3, text: "Great! Just working on some assignments.", sender: "them", time: "10:33 AM" },
    ]);

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const handleSend = () => {
        if (!message.trim()) return;
        setMessages((prev) => [
            ...prev,
            { id: Date.now(), text: message, sender: "me", time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) },
        ]);
        setMessage("");
    };

    return (
        <div className="h-full flex flex-col bg-background">
            {/* Chat Header */}
            <div className="flex items-center justify-between p-4 border-b border-border bg-card">
                <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                        <AvatarImage src={connection.profile_image || undefined} alt={connection.name} />
                        <AvatarFallback className="bg-primary/20 text-primary font-medium">
                            {getInitials(connection.name)}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <h3 className="font-semibold text-foreground">{connection.name}</h3>
                        <p className="text-sm text-muted-foreground">Online</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                        <Phone className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                        <Video className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                        <MoreVertical className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === "me" ? "justify-end" : "justify-start"}`}>
                        <div
                            className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                                msg.sender === "me"
                                    ? "bg-primary text-primary-foreground rounded-br-sm"
                                    : "bg-muted text-foreground rounded-bl-sm"
                            }`}
                        >
                            <p>{msg.text}</p>
                            <p className={`text-xs mt-1 ${msg.sender === "me" ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                {msg.time}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-border bg-card">
                <div className="flex items-center gap-2">
                    <Input
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 bg-background"
                        onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    />
                    <Button onClick={handleSend} size="icon" className="shrink-0">
                        <Send className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ChatView;
