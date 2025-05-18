
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader } from 'lucide-react';
import InterestsSelector from '@/components/InterestsSelector';

const Signup = () => {
  const navigate = useNavigate();
  const { signup, sendVerificationCode } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [step, setStep] = useState<'phone' | 'verification' | 'profile' | 'interests'>('phone');
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
    
    // In a real app, verify with backend
    // For demo: hard-code the valid code as 123456
    if (verificationCode === '123456') {
      setStep('profile');
    } else {
      // Handle invalid code
      alert('Invalid code. For demo, use 123456');
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!displayName) {
      return;
    }
    
    // Move to interests selection
    setStep('interests');
  };
  
  const handleSignupComplete = async (selectedInterests: string[]) => {
    try {
      setIsSubmitting(true);
      setInterests(selectedInterests);
      await signup(phoneNumber, displayName, selectedInterests);
      navigate('/home');
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSkipInterests = async () => {
    try {
      setIsSubmitting(true);
      await signup(phoneNumber, displayName, []);
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
            {step === 'phone' && 'Create a new account'}
            {step === 'verification' && 'Enter the verification code sent to your phone'}
            {step === 'profile' && 'Set up your profile'}
            {step === 'interests' && 'Almost done!'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 'phone' && (
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
          )}
          
          {step === 'verification' && (
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
                  <p className="text-xs text-center text-muted-foreground">
                    For the demo, use code: 123456
                  </p>
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <><Loader className="mr-2 h-4 w-4 animate-spin" /> Verifying</>
                  ) : (
                    'Verify'
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
          
          {step === 'profile' && (
            <form onSubmit={handleProfileSubmit}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Input
                    id="displayName"
                    type="text"
                    placeholder="Your display name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <><Loader className="mr-2 h-4 w-4 animate-spin" /> Processing</>
                  ) : (
                    'Continue'
                  )}
                </Button>
              </div>
            </form>
          )}
          
          {step === 'interests' && (
            <InterestsSelector 
              selectedInterests={interests}
              onChange={handleSignupComplete}
              onSkip={handleSkipInterests}
              showSkip={true}
            />
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium underline-offset-4 hover:underline">
              Log in
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Signup;
