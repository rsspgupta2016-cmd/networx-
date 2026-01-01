import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, MessageCircle, Send, Clock, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useConnection } from "@/contexts/ConnectionContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";

const MIN_CODE_LENGTH = 6;

const CodeCard = () => {
    const { user, isLoading: authLoading } = useAuth();
    const { currentCode, generateConnectionCode, refreshCode } = useConnection();
    const [codeInput, setCodeInput] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!user || authLoading) return;
        setError(null);
        setSuccess(null);
        await generateConnectionCode();
    };

    const handleVerify = async () => {
        if (!user || authLoading) return;
        setIsVerifying(true);
        setError(null);
        setSuccess(null);

        try {
            if (currentCode?.code === codeInput) {
                setError("You cannot use your own code!");
                setIsVerifying(false);
                return;
            }

            const { data: codeData, error: codeError } = await supabase
                .from("connection_codes")
                .select("*")
                .eq("code", codeInput)
                .eq("is_active", true)
                .single();

            if (codeError || !codeData) {
                setError("Invalid or expired code!");
                setIsVerifying(false);
                return;
            }

            if (codeData.max_uses && codeData.current_uses && codeData.current_uses >= codeData.max_uses) {
                setError("This code has reached its maximum uses!");
                setIsVerifying(false);
                return;
            }

            const { error: connectionError } = await supabase
                .from("connections")
                .insert({
                    user_id: user.id,
                    connected_user_id: codeData.user_id,
                    name: "New Connection",
                });

            if (connectionError) {
                setError("Failed to create connection!");
                setIsVerifying(false);
                return;
            }

            await supabase
                .from("connection_codes")
                .update({ current_uses: (codeData.current_uses || 0) + 1 })
                .eq("id", codeData.id);

            setSuccess("Connection successful!");
            setCodeInput("");
            await refreshCode();
        } catch (err) {
            console.error(err);
            setError("Something went wrong.");
        } finally {
            setIsVerifying(false);
        }
    };

    const qrValue = currentCode?.code || "------";

    return (
        <div className="p-4 bg-card border-b border-border">
            <div className="flex items-center gap-2 mb-3">
                <MessageCircle size={18} className="text-primary" />
                <span className="text-foreground font-medium">Connection Code</span>
            </div>

            <div className="p-4 bg-gradient-to-r from-muted to-card border border-border rounded-lg">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-sm text-muted-foreground">Your Code</span>
                    <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={handleGenerate} disabled={authLoading}>
                            <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" className="h-7 w-7 p-0" size="icon">
                            <Settings className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-4 mb-4">
                    <div className="bg-white p-2 rounded-lg">
                        <QRCodeSVG value={qrValue} size={80} />
                    </div>
                    <div className="flex-1">
                        <div className="text-2xl font-bold tracking-widest text-foreground mb-2">
                            {currentCode?.code ?? "------"}
                        </div>
                        {currentCode && (
                            <div className="text-xs flex flex-col gap-1 text-muted-foreground">
                                <span>
                                    <Clock className="h-3 w-3 inline-block mr-1" />
                                    {currentCode.settings?.expirationMinutes ?? "—"} min
                                </span>
                                <span>
                                    {currentCode.settings?.maxUses === null
                                        ? "Unlimited uses"
                                        : `Uses: ${currentCode.usesLeft ?? 0}/${currentCode.settings?.maxUses ?? "—"}`}
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-2">
                    <Input
                        value={codeInput}
                        onChange={(e) => setCodeInput(e.target.value)}
                        placeholder="Enter someone's code"
                        maxLength={MIN_CODE_LENGTH}
                        className="flex-grow"
                    />
                    <Button
                        onClick={handleVerify}
                        disabled={isVerifying || codeInput.trim().length < MIN_CODE_LENGTH || authLoading}
                        className="bg-primary hover:bg-primary/90"
                    >
                        <Send className="h-4 w-4 mr-1" /> Connect
                    </Button>
                </div>

                {(error || success) && (
                    <div className={`mt-2 text-sm ${error ? "text-destructive" : "text-green-500"}`}>
                        {error ?? success}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CodeCard;