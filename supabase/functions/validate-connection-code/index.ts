
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ValidateRequest {
  code: string;
  requestingUserId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { code, requestingUserId }: ValidateRequest = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Find and validate connection code
    const { data: connectionCode, error: findError } = await supabaseClient
      .from('connection_codes')
      .select(`
        *,
        profiles!connection_codes_user_id_fkey (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq('code', code)
      .eq('is_active', true)
      .single();

    if (findError || !connectionCode) {
      return new Response(
        JSON.stringify({ error: 'Invalid connection code' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Check if code is expired
    if (connectionCode.expires_at && new Date(connectionCode.expires_at) < new Date()) {
      return new Response(
        JSON.stringify({ error: 'Connection code has expired' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Check if max uses exceeded
    if (connectionCode.max_uses && connectionCode.current_uses >= connectionCode.max_uses) {
      return new Response(
        JSON.stringify({ error: 'Connection code has reached maximum uses' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Check if user is trying to connect to themselves
    if (connectionCode.user_id === requestingUserId) {
      return new Response(
        JSON.stringify({ error: 'Cannot connect to yourself' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Check if connection already exists
    const { data: existingConnection } = await supabaseClient
      .from('connections')
      .select('id')
      .eq('user_id', requestingUserId)
      .eq('connected_user_id', connectionCode.user_id)
      .single();

    if (existingConnection) {
      return new Response(
        JSON.stringify({ error: 'Connection already exists' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Create the connection
    const { error: connectionError } = await supabaseClient
      .from('connections')
      .insert({
        user_id: requestingUserId,
        connected_user_id: connectionCode.user_id,
        name: connectionCode.profiles?.full_name || 'Anonymous User',
        profile_image: connectionCode.profiles?.avatar_url,
        identity_code: `NX-${connectionCode.user_id.slice(0, 8).toUpperCase()}`
      });

    if (connectionError) {
      console.error('Error creating connection:', connectionError);
      throw new Error('Failed to create connection');
    }

    // Update connection code usage
    await supabaseClient
      .from('connection_codes')
      .update({ 
        current_uses: connectionCode.current_uses + 1,
        is_active: connectionCode.max_uses && (connectionCode.current_uses + 1) >= connectionCode.max_uses ? false : true
      })
      .eq('id', connectionCode.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        connection: {
          name: connectionCode.profiles?.full_name || 'Anonymous User',
          email: connectionCode.profiles?.email,
          profileImage: connectionCode.profiles?.avatar_url
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in validate-connection-code:', error);
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
