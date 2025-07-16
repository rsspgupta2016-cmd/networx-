
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

    // Check verification code
    const { data: verificationData, error: verifyError } = await supabaseClient
      .from('verification_codes')
      .select('*')
      .eq('phone', phone)
      .eq('code', code)
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
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

    // Create a demo user with phone number
    const email = `${phone}@demo.networx.com`;
    const password = 'demo-password-123';

    // Create user in auth
    const { data: authData, error: signupError } = await supabaseClient.auth.admin.createUser({
      email,
      password,
      phone,
      email_confirm: true,
      phone_confirm: true,
    });

    if (signupError) {
      console.error('User creation error:', signupError);
      // If user already exists, that's fine
      if (!signupError.message.includes('already exists')) {
        return new Response(
          JSON.stringify({ error: 'Failed to create user account' }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json', ...corsHeaders },
          }
        );
      }
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
