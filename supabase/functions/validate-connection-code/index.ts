
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
    console.log('Starting connection code validation...');
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    const { code, requestingUserId }: ValidateRequest = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
    
    if (authError || !user) {
      console.error('Authentication failed:', authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    if (user.id !== requestingUserId) {
      console.error('User ID mismatch');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    console.log(`Validating code ${code} for user ${requestingUserId}`);

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
      console.log('Connection code not found or inactive:', findError);
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
      console.log('Connection code expired');
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
      console.log('Connection code max uses reached');
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
      console.log('User trying to connect to themselves');
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
      console.log('Connection already exists');
      return new Response(
        JSON.stringify({ error: 'Connection already exists' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Get the target user's profile for connection details
    const { data: targetProfile } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', connectionCode.user_id)
      .single();

    // Create the connection
    const { data: newConnection, error: connectionError } = await supabaseClient
      .from('connections')
      .insert({
        user_id: requestingUserId,
        connected_user_id: connectionCode.user_id,
        name: targetProfile?.full_name || 'Anonymous User',
        profile_image: targetProfile?.avatar_url,
        identity_code: `NX-${connectionCode.user_id.slice(0, 8).toUpperCase()}`,
        is_muted: false,
        calls_muted: false,
        is_industry: false
      })
      .select()
      .single();

    if (connectionError) {
      console.error('Error creating connection:', connectionError);
      throw new Error('Failed to create connection');
    }

    // Update connection code usage
    const newUses = connectionCode.current_uses + 1;
    const shouldDeactivate = connectionCode.max_uses && newUses >= connectionCode.max_uses;
    
    await supabaseClient
      .from('connection_codes')
      .update({ 
        current_uses: newUses,
        is_active: !shouldDeactivate
      })
      .eq('id', connectionCode.id);

    console.log('Connection created successfully:', newConnection.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        connection: {
          id: newConnection.id,
          name: newConnection.name,
          email: targetProfile?.email,
          profileImage: newConnection.profile_image,
          identityCode: newConnection.identity_code
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
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
};

serve(handler);
