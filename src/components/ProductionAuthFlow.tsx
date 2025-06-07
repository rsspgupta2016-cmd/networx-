
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useBackendServices } from '@/hooks/useBackendServices';
import { Loader2, Phone, Shield, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const ProductionAuthFlow = () => {
  const { signupWithEmail, loginWithEmail, isLoading } = useAuth();
  const { sendSMSVerification, verifyPhoneCode, sendEmailNotification } = useBackendServices();
  
  const [step, setStep] = useState<'phone' | 'verify' | 'email'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear error when step changes
  useEffect(() => {
    setError(null);
  }, [step]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const result = await sendSMSVerification(phoneNumber, code);
      
      if (result.demo) {
        setIsDemoMode(true);
        toast({
          title: "Demo Mode Active",
          description: `For testing, use code: ${code}`,
        });
      } else {
        toast({
          title: "Verification Code Sent",
          description: "Please check your phone for the verification code.",
        });
      }
      
      setStep('verify');
    } catch (error: any) {
      console.error('Phone verification error:', error);
      setError('Failed to send verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim()) {
      setError('Please enter the verification code');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await verifyPhoneCode(phoneNumber, verificationCode);
      
      if (result.verified) {
        toast({
          title: "Phone Verified",
          description: "Your phone number has been verified successfully.",
        });
        setStep('email');
      }
    } catch (error: any) {
      console.error('Code verification error:', error);
      setError('Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      await signupWithEmail(email, password);
      
      // Send welcome email
      try {
        await sendEmailNotification(
          email,
          "Welcome to NetworX!",
          `
            <h1>Welcome to NetworX!</h1>
            <p>Your account has been created successfully.</p>
            <p>Your verified phone number: ${phoneNumber}</p>
            <p>Start networking and building meaningful professional connections!</p>
          `,
          'welcome'
        );
      } catch (emailError) {
        console.warn('Welcome email failed to send:', emailError);
      }

      toast({
        title: "Account Created",
        description: "Welcome to NetworX! Please check your email for verification.",
      });
    } catch (error: any) {
      console.error('Email signup error:', error);
      setError('Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setError(null);
    if (step === 'verify') {
      setStep('phone');
      setVerificationCode('');
    } else if (step === 'email') {
      setStep('verify');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            NetworX
          </CardTitle>
          <CardDescription>
            {step === 'phone' && 'Verify your phone number'}
            {step === 'verify' && 'Enter verification code'}
            {step === 'email' && 'Complete your account setup'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isDemoMode && step === 'verify' && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Demo mode: SMS service not configured. Use any 6-digit code to proceed.
              </AlertDescription>
            </Alert>
          )}

          {step === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Code...
                  </>
                ) : (
                  'Send Verification Code'
                )}
              </Button>
            </form>
          )}

          {step === 'verify' && (
            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="code"
                    type="text"
                    placeholder="123456"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="pl-10"
                    maxLength={6}
                    required
                  />
                </div>
                <p className="text-sm text-gray-600">
                  Code sent to {phoneNumber}
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleBack}
                  className="flex-1"
                  disabled={loading}
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify Code'
                  )}
                </Button>
              </div>
            </form>
          )}

          {step === 'email' && (
            <form onSubmit={handleEmailSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <div className="flex gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleBack}
                  className="flex-1"
                  disabled={loading}
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={loading || isLoading}>
                  {(loading || isLoading) ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductionAuthFlow;
