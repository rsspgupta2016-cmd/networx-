
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SMSRequest {
  phone: string;
  code: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, code }: SMSRequest = await req.json();
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // For testing purposes, we'll use a demo SMS service
    // In production, integrate with Twilio or similar
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
      // Real Twilio integration
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`;
      
      const formData = new URLSearchParams();
      formData.append('To', phone);
      formData.append('From', twilioPhoneNumber);
      formData.append('Body', `Your NetworX verification code is: ${code}`);

      const twilioResponse = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`${twilioAccountSid}:${twilioAuthToken}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      });

      if (!twilioResponse.ok) {
        throw new Error('Failed to send SMS via Twilio');
      }

      console.log('SMS sent successfully via Twilio to:', phone);
    } else {
      // Demo mode - log the verification code
      console.log(`Demo SMS to ${phone}: Your verification code is ${code}`);
    }

    // Store verification code in database for validation
    const { error: insertError } = await supabaseClient
      .from('verification_codes')
      .insert({
        phone,
        code,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 minutes
        verified: false
      });

    if (insertError) {
      console.error('Error storing verification code:', insertError);
      throw new Error('Failed to store verification code');
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Verification code sent' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in send-sms-verification:', error);
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
