import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useConnection } from "@/contexts/ConnectionContext";
import { Clock, Users, Key, Infinity } from "lucide-react";

type Props = {
    show: boolean;
    setShow: (show: boolean) => void;
};

const CodeSettingsDialog: React.FC<Props> = ({ show, setShow }) => {
    const { handleSaveCodeSettings, codeSettings } = useConnection();
    const [usePermanentCode, setUsePermanentCode] = useState(false);
    const [permanentCode, setPermanentCode] = useState("");
    const [expirationMinutes, setExpirationMinutes] = useState(15);
    const [maxUses, setMaxUses] = useState<number | null>(1);
    const [unlimitedUses, setUnlimitedUses] = useState(false);

    // Load current settings when dialog opens
    useEffect(() => {
        if (show) {
            setUsePermanentCode(codeSettings.usePermanentCode);
            setPermanentCode(codeSettings.permanentCode || "");
            setExpirationMinutes(codeSettings.expirationMinutes || 15);
            setMaxUses(codeSettings.maxUses);
            setUnlimitedUses(codeSettings.maxUses === null);
        }
    }, [show, codeSettings]);

    const handleSave = async () => {
        await handleSaveCodeSettings({
            usePermanentCode,
            permanentCode: usePermanentCode ? permanentCode.toUpperCase() : null,
            expirationMinutes: usePermanentCode ? null : expirationMinutes,
            maxUses: usePermanentCode ? null : (unlimitedUses ? null : maxUses),
        });
        setShow(false);
    };

    return (
        <Dialog open={show} onOpenChange={setShow}>
            <DialogContent className="sm:max-w-md bg-card border-border">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5 text-primary" />
                        Connection Code Settings
                    </DialogTitle>
                    <DialogDescription>
                        Customize how your connection codes work
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Permanent Code Option */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Infinity className="h-4 w-4 text-muted-foreground" />
                                <Label htmlFor="permanent-code">Use Permanent Code</Label>
                            </div>
                            <Switch
                                id="permanent-code"
                                checked={usePermanentCode}
                                onCheckedChange={setUsePermanentCode}
                            />
                        </div>
                        {usePermanentCode && (
                            <div className="pl-6">
                                <Label className="text-sm text-muted-foreground mb-2 block">
                                    Your permanent 6-digit code
                                </Label>
                                <Input
                                    value={permanentCode}
                                    onChange={(e) => setPermanentCode(e.target.value.toUpperCase().slice(0, 6))}
                                    placeholder="Enter 6-digit code (e.g., ABC123)"
                                    maxLength={6}
                                    className="uppercase tracking-widest font-mono"
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    This code never expires and allows unlimited connections
                                </p>
                            </div>
                        )}
                    </div>

                    {!usePermanentCode && (
                        <>
                            {/* Time Expiration */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <Label>Code Expiration Time</Label>
                                </div>
                                <div className="pl-6">
                                    <Slider
                                        value={[expirationMinutes]}
                                        onValueChange={([val]) => setExpirationMinutes(val)}
                                        min={1}
                                        max={60}
                                        step={1}
                                        className="w-full"
                                    />
                                    <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                                        <span>1 min</span>
                                        <span className="font-medium text-foreground">{expirationMinutes} minutes</span>
                                        <span>60 min</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Anyone can connect using this code during this time
                                    </p>
                                </div>
                            </div>

                            {/* Max Uses */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                        <Label>Maximum Uses</Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Label htmlFor="unlimited-uses" className="text-sm text-muted-foreground">
                                            Unlimited
                                        </Label>
                                        <Switch
                                            id="unlimited-uses"
                                            checked={unlimitedUses}
                                            onCheckedChange={(checked) => {
                                                setUnlimitedUses(checked);
                                                if (!checked && maxUses === null) {
                                                    setMaxUses(1);
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                                {!unlimitedUses && (
                                    <div className="pl-6">
                                        <Slider
                                            value={[maxUses || 1]}
                                            onValueChange={([val]) => setMaxUses(val)}
                                            min={1}
                                            max={10}
                                            step={1}
                                            className="w-full"
                                        />
                                        <div className="flex justify-between mt-2 text-sm text-muted-foreground">
                                            <span>1 use</span>
                                            <span className="font-medium text-foreground">{maxUses} {maxUses === 1 ? 'use' : 'uses'}</span>
                                            <span>10 uses</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            Code becomes invalid after this many connections
                                        </p>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => setShow(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={usePermanentCode && permanentCode.length < 6}>
                        Save Settings
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default CodeSettingsDialog;
