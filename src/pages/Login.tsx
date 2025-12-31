import React, { useState, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Loader2, Phone, KeyRound } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const DEMO_OTP = "123456";

export default function Login() {
    const [phone, setPhone] = useState("");
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);

    const navigate = useNavigate();

    const handleSendOtp = async (e: FormEvent) => {
        e.preventDefault();
        if (!phone) {
            toast({
                title: "Error",
                description: "Please enter your phone number",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        // Demo mode - skip actual SMS
        setTimeout(() => {
            setOtpSent(true);
            setLoading(false);
            toast({
                title: "OTP Sent!",
                description: "Use code: 123456",
            });
        }, 500);
    };

    const handleVerifyOtp = async (e: FormEvent) => {
        e.preventDefault();
        if (!otp) {
            toast({
                title: "Error",
                description: "Please enter the verification code",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        
        // Demo mode - check for demo code
        setTimeout(() => {
            if (otp === DEMO_OTP) {
                // Store phone in localStorage for demo purposes
                localStorage.setItem("demo_user_phone", phone);
                toast({
                    title: "Welcome!",
                    description: "You have successfully logged in.",
                });
                navigate("/home");
            } else {
                toast({
                    title: "Verification failed",
                    description: "Invalid code. Use 123456 for demo.",
                    variant: "destructive"
                });
            }
            setLoading(false);
        }, 500);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
            <Card className="w-full max-w-md shadow-xl border-border">
                <CardHeader className="text-center space-y-2">
                    <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        NetworX
                    </CardTitle>
                    <CardDescription>
                        {otpSent ? "Enter verification code" : "Enter your phone number to continue"}
                    </CardDescription>
                </CardHeader>

                <CardContent>
                    {!otpSent ? (
                        <form onSubmit={handleSendOtp} className="space-y-4">
                            <div className="space-y-2">
                                <div className="relative">
                                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="tel"
                                        placeholder="Enter your phone number"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        className="pl-10"
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Sending OTP...
                                    </>
                                ) : (
                                    "Send OTP"
                                )}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOtp} className="space-y-4">
                            <div className="space-y-2">
                                <div className="relative">
                                    <KeyRound className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="text"
                                        placeholder="Enter 6-digit code"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="pl-10"
                                        maxLength={6}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground text-center">
                                    Demo code: 123456
                                </p>
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Verifying...
                                    </>
                                ) : (
                                    "Verify & Login"
                                )}
                            </Button>

                            <button
                                type="button"
                                onClick={() => {
                                    setOtpSent(false);
                                    setOtp("");
                                }}
                                className="w-full text-sm text-primary hover:underline"
                            >
                                Change phone number
                            </button>
                        </form>
                    )}
                </CardContent>

                <CardFooter className="flex justify-center">
                    <p className="text-xs text-muted-foreground text-center">
                        By continuing, you agree to our Terms of Service and Privacy Policy
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}
