import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, MessageCircle, Send, Clock, Settings, ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useConnection } from "@/contexts/ConnectionContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const MIN_CODE_LENGTH = 6;

const CodeCard = () => {
    const { user, isLoading: authLoading } = useAuth();
    const { currentCode, generateConnectionCode, refreshCode } = useConnection();
    const [codeInput, setCodeInput] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);

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

            const { data: codeData, error } = await supabase
                .from("connections")
                .select("*")
                .eq("code", codeInput)
                .eq("verified", false)
                .single();

            if (error || !codeData) {
                setError("Invalid or already used code!");
                setIsVerifying(false);
                return;
            }

            await supabase
                .from("connections")
                .update({ verified: true, used_by: user.id })
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

    return (
        <div className="p-4 bg-card border-b border-border">
            <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                <CollapsibleTrigger asChild>
                    <button className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-muted to-card border border-border rounded-lg hover:bg-muted/50 transition-colors">
                        <span className="flex items-center gap-2 text-foreground font-medium">
                            <MessageCircle size={18} className="text-primary" /> 
                            Connection Code
                        </span>
                        {isOpen ? (
                            <ChevronUp size={18} className="text-muted-foreground" />
                        ) : (
                            <ChevronDown size={18} className="text-muted-foreground" />
                        )}
                    </button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="mt-3">
                    <div className="p-4 bg-gradient-to-r from-muted to-card border border-border rounded-lg">
                        <div className="flex justify-between items-center mb-5">
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

                        <div className="text-center text-2xl font-bold tracking-widest text-foreground mb-2">
                            {currentCode?.code ?? "------"}
                        </div>

                        {currentCode && (
                            <div className="text-xs flex justify-between text-muted-foreground">
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

                        <div className="mt-4 flex gap-2">
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
                </CollapsibleContent>
            </Collapsible>
        </div>
    );
};

export default CodeCard;