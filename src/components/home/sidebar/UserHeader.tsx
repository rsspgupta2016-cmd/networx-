import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Settings, LogOut } from "lucide-react";

const UserHeader = ({ user, onLogout, onOpenSettings }) => {
    return (
        <div className="flex items-center justify-between p-4 border-b border-[#232e48] bg-gradient-to-r from-[#0B1120] to-[#162039] text-white">
            <div className="flex items-center">
                <Avatar className="h-10 w-10 bg-[#1C2A41] border-2 border-[#232e48]">
                    <AvatarFallback>{(user?.displayName ?? "U").charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="ml-3">
                    <h2 className="text-lg font-semibold">{user?.displayName ?? "NetworX User"}</h2>
                    <p className="text-xs text-networx-light/70">{user?.identityCode ? `ID: ${user.identityCode}` : "NetworX"}</p>
                </div>
            </div>
            <div className="flex space-x-2">
                <Button variant="ghost" size="icon" onClick={onOpenSettings}>
                    <Settings className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onLogout}>
                    <LogOut className="h-5 w-5" />
                </Button>
            </div>
        </div>
    );
};

export default UserHeader;
