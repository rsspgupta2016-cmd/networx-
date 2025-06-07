
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CodeRequest {
  userId: string;
  expirationMinutes?: number;
  maxUses?: number;
  isPermanent?: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting connection code generation...');
    
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

    const { userId, expirationMinutes = 60, maxUses = 5, isPermanent = false }: CodeRequest = await req.json();
    
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

    if (user.id !== userId) {
      console.error('User ID mismatch');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    // Generate unique connection code
    const code = `${Math.random().toString(36).substr(2, 4).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    
    const expiresAt = isPermanent ? null : new Date(Date.now() + expirationMinutes * 60 * 1000).toISOString();

    console.log(`Generating code ${code} for user ${userId}`);

    // Deactivate existing codes first
    const { error: deactivateError } = await supabaseClient
      .from('connection_codes')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (deactivateError) {
      console.log('Note: Could not deactivate existing codes:', deactivateError);
    }

    // Store connection code
    const { data: connectionCode, error: insertError } = await supabaseClient
      .from('connection_codes')
      .insert({
        user_id: userId,
        code,
        expires_at: expiresAt,
        max_uses: isPermanent ? null : maxUses,
        is_permanent: isPermanent,
        is_active: true,
        current_uses: 0,
        expiration_minutes: expirationMinutes
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error creating connection code:', insertError);
      throw new Error('Failed to create connection code');
    }

    console.log('Connection code created successfully:', connectionCode.code);

    return new Response(
      JSON.stringify({ 
        success: true, 
        connectionCode: {
          code: connectionCode.code,
          expiresAt: connectionCode.expires_at,
          maxUses: connectionCode.max_uses,
          isPermanent: connectionCode.is_permanent
        }
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error('Error in generate-connection-code:', error);
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
