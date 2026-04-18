import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, MessageCircle, Send, Clock, Settings, Infinity, Users, ChevronDown, Lock } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { useConnection } from "@/contexts/ConnectionContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { QRCodeSVG } from "qrcode.react";
import CodeSettingsDialog from "@/components/home/Dialogs/CodeSettingsDialog";

const MIN_CODE_LENGTH = 6;

const CodeCard = () => {
    const { user, isLoading: authLoading } = useAuth();
    const { currentCode, generateConnectionCode, refreshCode, fetchConnections } = useConnection();
    const [codeInput, setCodeInput] = useState("");
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [showSettings, setShowSettings] = useState(false);
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

            const { data: codeData, error: codeError } = await supabase
                .from("connection_codes")
                .select("*")
                .eq("code", codeInput)
                .eq("is_active", true)
                .maybeSingle();

            if (codeError || !codeData) {
                setError("Invalid or expired code!");
                setIsVerifying(false);
                return;
            }

            // Check if expired
            if (codeData.expires_at && new Date(codeData.expires_at) < new Date()) {
                setError("This code has expired!");
                setIsVerifying(false);
                return;
            }

            // Check max uses (only if not permanent and max_uses is set)
            if (!codeData.is_permanent && codeData.max_uses && codeData.current_uses && codeData.current_uses >= codeData.max_uses) {
                setError("This code has reached its maximum uses!");
                setIsVerifying(false);
                return;
            }

            // Check if already connected
            const { data: existingConnection } = await supabase
                .from("connections")
                .select("id")
                .eq("user_id", user.id)
                .eq("connected_user_id", codeData.user_id)
                .maybeSingle();

            if (existingConnection) {
                setError("You are already connected with this user!");
                setIsVerifying(false);
                return;
            }

            // Get the code owner's profile for the name
            const { data: profileData } = await supabase
                .from("profiles")
                .select("full_name, email")
                .eq("id", codeData.user_id)
                .maybeSingle();

            const connectionName = profileData?.full_name || profileData?.email || "New Connection";

            // Create connection
            const { error: connectionError } = await supabase
                .from("connections")
                .insert({
                    user_id: user.id,
                    connected_user_id: codeData.user_id,
                    name: connectionName,
                });

            if (connectionError) {
                setError("Failed to create connection!");
                setIsVerifying(false);
                return;
            }

            // Update code uses
            await supabase
                .from("connection_codes")
                .update({ current_uses: (codeData.current_uses || 0) + 1 })
                .eq("id", codeData.id);

            // If max uses reached and not permanent, deactivate the code
            if (!codeData.is_permanent && codeData.max_uses && (codeData.current_uses || 0) + 1 >= codeData.max_uses) {
                await supabase
                    .from("connection_codes")
                    .update({ is_active: false })
                    .eq("id", codeData.id);
            }

            setSuccess("Connection successful!");
            setCodeInput("");
            await fetchConnections();
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
        <>
            <div className="p-4 bg-card border-b border-border">
                <Collapsible open={isOpen} onOpenChange={setIsOpen}>
                    <CollapsibleTrigger asChild>
                        <button className="w-full flex items-center justify-between gap-2 p-3 bg-gradient-to-r from-primary/10 to-primary/5 hover:from-primary/15 hover:to-primary/10 border border-primary/20 rounded-lg transition-colors">
                            <div className="flex items-center gap-2">
                                <Lock size={16} className="text-primary" />
                                <span className="text-foreground font-medium text-sm">Connect securely</span>
                            </div>
                            <ChevronDown
                                size={18}
                                className={`text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                            />
                        </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3">
                        <div className="p-4 bg-gradient-to-r from-muted to-card border border-border rounded-lg">
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-sm text-muted-foreground">Your Code</span>
                                <div className="flex gap-1">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        className="h-7 w-7 p-0"
                                        onClick={handleGenerate}
                                        disabled={authLoading}
                                        title="Generate new code"
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        className="h-7 w-7 p-0"
                                        size="icon"
                                        onClick={() => setShowSettings(true)}
                                        title="Code settings"
                                    >
                                        <Settings className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 mb-4">
                                <div className="bg-[#0B1120] p-2 rounded-lg">
                                    <QRCodeSVG value={qrValue} size={80} bgColor="#0B1120" fgColor="#FFFFFF" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-2xl font-bold tracking-widest text-foreground mb-2">
                                        {currentCode?.code ?? "------"}
                                    </div>
                                    {currentCode && (
                                        <div className="text-xs flex flex-col gap-1 text-muted-foreground">
                                            {currentCode.isPermanent ? (
                                                <span className="flex items-center gap-1">
                                                    <Infinity className="h-3 w-3" />
                                                    Permanent code
                                                </span>
                                            ) : (
                                                <>
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {currentCode.settings?.expirationMinutes ?? "—"} min
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Users className="h-3 w-3" />
                                                        {currentCode.usesLeft === null
                                                            ? "Unlimited uses"
                                                            : `${currentCode.usesLeft} use${currentCode.usesLeft !== 1 ? 's' : ''} left`}
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Input
                                    value={codeInput}
                                    onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                                    placeholder="Enter someone's code"
                                    maxLength={MIN_CODE_LENGTH}
                                    className="flex-grow uppercase tracking-widest font-mono"
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

            <CodeSettingsDialog show={showSettings} setShow={setShowSettings} />
        </>
    );
};

export default CodeCard;
