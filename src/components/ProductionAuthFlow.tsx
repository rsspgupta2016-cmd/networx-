
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
import { useNavigate } from 'react-router-dom';

const ProductionAuthFlow = () => {
  const { loginWithEmail, isLoading } = useAuth();
  const { sendSMSVerification, verifyPhoneCode } = useBackendServices();
  const navigate = useNavigate();
  
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
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
      const result = await sendSMSVerification(phoneNumber);
      
      if (result.demo) {
        setIsDemoMode(true);
        toast({
          title: "Demo Mode Active",
          description: `For testing, use code: ${result.code}`,
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
        // Login with the generated email/password
        try {
          await loginWithEmail(result.email, 'demo-password-123');
        } catch (loginError) {
          console.log('Login attempted, user may need to be created first');
        }
        
        // Navigate to home page
        navigate('/home');
        
        toast({
          title: "Welcome to NetworX!",
          description: "You've been successfully logged in.",
        });
      }
    } catch (error: any) {
      console.error('Code verification error:', error);
      setError('Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setError(null);
    if (step === 'verify') {
      setStep('phone');
      setVerificationCode('');
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
            {step === 'phone' && 'Enter your phone number'}
            {step === 'verify' && 'Enter verification code'}
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
                Demo mode: Use code <strong>123456</strong> to continue.
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
                    'Login'
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
