import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, MessageCircle, Send, Clock, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useConnection } from "@/contexts/ConnectionContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

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
            await refreshCode(); // refresh current code
        } catch (err) {
            console.error(err);
            setError("Something went wrong.");
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <div className="p-4 bg-[#0F1628] border-b border-[#232e48]">
            <div className="p-4 bg-gradient-to-r from-[#1C2A41] to-[#162039] border border-[#232e48] rounded-lg">
                <div className="flex justify-between items-center mb-5">
          <span className="flex items-center gap-1 text-white">
            <MessageCircle size={18} className="text-networx-primary" /> Connection code
          </span>
                    <Button size="sm" className="h-7 w-7 p-0 text-white" onClick={handleGenerate} disabled={authLoading}>
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" className="h-7 w-7 p-0" size="icon">
                        <Settings className="h-10 w-5" />
                    </Button>
                </div>

                <div className="text-center text-2xl font-bold tracking-widest text-networx-light mb-2">
                    {currentCode?.code ?? "------"}
                </div>

                {currentCode && (
                    <div className="text-xs flex justify-between text-networx-light/70">
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

                <div className="mt-3 flex gap-2">
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
                        className="bg-networx-primary hover:bg-networx-secondary text-white"
                    >
                        <Send className="h-4 w-4 mr-1" /> Connect
                    </Button>
                </div>

                {(error || success) && (
                    <div className={`mt-2 text-sm ${error ? "text-red-500" : "text-green-500"}`}>
                        {error ?? success}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CodeCard;
