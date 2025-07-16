
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SMSRequest {
  phone: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone }: SMSRequest = await req.json();
    
    console.log(`Processing SMS verification request for phone: ${phone}`);
    
    // Generate verification code (use fixed code for demo)
    const code = '123456'; // Fixed demo code
    
    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Check for Twilio credentials
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioPhoneNumber = Deno.env.get('TWILIO_PHONE_NUMBER');

    let smsResult = null;

    if (twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
      try {
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
          const errorText = await twilioResponse.text();
          console.error('Twilio error:', errorText);
          throw new Error(`Twilio API error: ${twilioResponse.status}`);
        }

        smsResult = await twilioResponse.json();
        console.log('SMS sent successfully via Twilio:', smsResult.sid);
      } catch (twilioError) {
        console.error('Twilio SMS failed, falling back to demo mode:', twilioError);
        console.log(`Demo SMS to ${phone}: Your verification code is ${code}`);
      }
    } else {
      // Demo mode - log the verification code
      console.log(`Demo SMS to ${phone}: Your verification code is ${code}`);
      console.log('Twilio credentials not configured - running in demo mode');
    }

    // Store verification code in database for validation
    const { error: insertError } = await supabaseClient
      .from('verification_codes')
      .insert({
        phone,
        code,
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year for demo
        verified: false
      });

    if (insertError) {
      console.error('Error storing verification code:', insertError);
      throw new Error('Failed to store verification code');
    }

    console.log('Verification code stored successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: smsResult ? 'SMS sent via Twilio' : 'Verification code generated (demo mode)',
        demo: !smsResult,
        code: !smsResult ? code : undefined // Return the code only in demo mode
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in send-sms-verification:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
