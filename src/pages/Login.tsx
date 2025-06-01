
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Loader } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { loginWithOTP, verifyOTP } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phoneNumber) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      await loginWithOTP(phoneNumber);
      setStep('otp');
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOTPSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otp || otp.length !== 6) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      await verifyOTP(phoneNumber, otp);
      navigate('/home');
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToPhone = () => {
    setStep('phone');
    setOtp('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-[350px]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">NetworX</CardTitle>
          <CardDescription>
            {step === 'phone' ? 'Sign in with your mobile number' : 'Enter the verification code'}
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
                    placeholder="Enter your mobile number"
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
                    <><Loader className="mr-2 h-4 w-4 animate-spin" /> Sending OTP</>
                  ) : (
                    'Send OTP'
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleOTPSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground text-center">
                    We sent a verification code to {phoneNumber}
                  </p>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={otp}
                      onChange={setOtp}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting || otp.length !== 6}
                >
                  {isSubmitting ? (
                    <><Loader className="mr-2 h-4 w-4 animate-spin" /> Verifying</>
                  ) : (
                    'Verify OTP'
                  )}
                </Button>
                <Button 
                  type="button"
                  variant="link" 
                  className="w-full"
                  onClick={handleBackToPhone}
                >
                  Back to phone number
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
