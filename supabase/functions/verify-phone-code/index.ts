
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyRequest {
  phone: string;
  code: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, code }: VerifyRequest = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check verification code (allow reuse of demo code 123456)
    const { data: verificationData, error: verifyError } = await supabaseClient
      .from('verification_codes')
      .select('*')
      .eq('phone', phone)
      .eq('code', code)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (verifyError || !verificationData) {
      console.error('Verification failed:', verifyError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired verification code' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Mark code as verified
    await supabaseClient
      .from('verification_codes')
      .update({ verified: true })
      .eq('id', verificationData.id);

    // Clean phone number for email (remove spaces and special characters)
    const cleanPhone = phone.replace(/\s+/g, '').replace(/[^0-9]/g, '');
    const email = `${cleanPhone}@demo.networx.com`;
    const password = 'demo-password-123';

    // Check if user already exists first
    const { data: existingUser } = await supabaseClient.auth.admin.listUsers();
    const userExists = existingUser.users.some(user => user.email === email || user.phone === phone);

    let authData = null;
    
    if (!userExists) {
      // Create user in auth only if they don't exist
      const { data: newUser, error: signupError } = await supabaseClient.auth.admin.createUser({
        email,
        password,
        phone,
        email_confirm: true,
        phone_confirm: true,
      });

      if (signupError) {
        console.error('User creation error:', signupError);
        return new Response(
          JSON.stringify({ error: 'Failed to create user account' }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }
      authData = newUser;
    } else {
      // Get existing user
      const existingUserData = existingUser.users.find(user => user.email === email || user.phone === phone);
      authData = { user: existingUserData };
    }

    // Generate session token for immediate login
    const { data: sessionData, error: sessionError } = await supabaseClient.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
    });

    if (sessionError) {
      console.error('Session generation error:', sessionError);
    }

    // Generate identity code
    const identityCode = `NX-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;

    return new Response(
      JSON.stringify({ 
        success: true, 
        verified: true,
        identityCode,
        phone,
        email,
        password,
        user: authData?.user,
        sessionUrl: sessionData?.properties?.action_link,
        message: 'Phone number verified successfully' 
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in verify-phone-code:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
