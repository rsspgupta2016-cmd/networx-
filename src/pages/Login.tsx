
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { login, sendVerificationCode } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'phone' | 'verification'>('phone');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber || phoneNumber.length < 10) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      await sendVerificationCode(phoneNumber);
      setStep('verification');
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!verificationCode || verificationCode.length !== 6) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      await login(phoneNumber, verificationCode);
      navigate('/home');
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-[350px]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">NetworX</CardTitle>
          <CardDescription>
            {step === 'phone' 
              ? 'Enter your phone number to continue' 
              : 'Enter the verification code sent to your phone'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'phone' ? (
            <form onSubmit={handlePhoneSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1234567890"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <><Loader className="mr-2 h-4 w-4 animate-spin" /> Please wait</>
                  ) : (
                    'Get Verification Code'
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleCodeSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Input
                    id="code"
                    type="text"
                    placeholder="6-digit code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.slice(0, 6))}
                    required
                    maxLength={6}
                    className="text-center text-xl tracking-wider"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <><Loader className="mr-2 h-4 w-4 animate-spin" /> Verifying</>
                  ) : (
                    'Verify & Log in'
                  )}
                </Button>
                <Button 
                  type="button"
                  variant="link" 
                  className="w-full"
                  onClick={() => setStep('phone')}
                >
                  Change Phone Number
                </Button>
              </div>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary font-medium underline-offset-4 hover:underline">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
