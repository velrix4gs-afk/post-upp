import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  'https://post-upp.lovable.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:8080',
];

const getCorsHeaders = (origin: string | null) => ({
  'Access-Control-Allow-Origin': origin && ALLOWED_ORIGINS.includes(origin) 
    ? origin 
    : ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Credentials': 'true',
});

serve(async (req) => {
  const origin = req.headers.get('origin');
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create client with service role for database operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );
    
    // Create anon client for auth verification
    const supabaseAnonClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get user from JWT using anon client
    const { data: { user }, error: userError } = await supabaseAnonClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      throw new Error('Invalid or expired token');
    }

    const method = req.method;
    console.log(`Reactions API: ${method}`);

    if (method === 'POST') {
      const body = await req.json();
      const { target_id, target_type, reaction_type } = body;

      // Validate required fields
      if (!target_id || !target_type || !reaction_type) {
        throw new Error('Missing required fields: target_id, target_type, reaction_type');
      }

      console.log(`[REACT_001] Checking for existing reaction: user=${user.id}, post=${target_id}`);

      // Check if reaction already exists using post_reactions table
      const { data: existingReaction } = await supabaseClient
        .from('post_reactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('post_id', target_id)
        .single();

      if (existingReaction) {
        // Update existing reaction or remove if same type
        if (existingReaction.reaction_type === reaction_type) {
          console.log(`[REACT_002] Removing existing reaction: ${existingReaction.id}`);
          // Remove reaction - trigger will handle count update
          const { error } = await supabaseClient
            .from('post_reactions')
            .delete()
            .eq('id', existingReaction.id);

          if (error) {
            console.error(`[REACT_003] Error removing reaction:`, error);
            throw new Error(`[REACT_003] ${error.message}`);
          }

          return new Response(JSON.stringify({ 
            action: 'removed', 
            reaction_type,
            code: 'SUCCESS',
            message: 'Reaction removed successfully'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          console.log(`[REACT_004] Updating reaction type: ${reaction_type}`);
          // Update reaction type
          const { data: reaction, error } = await supabaseClient
            .from('post_reactions')
            .update({ reaction_type })
            .eq('id', existingReaction.id)
            .select()
            .single();

          if (error) {
            console.error(`[REACT_005] Error updating reaction:`, error);
            throw new Error(`[REACT_005] ${error.message}`);
          }

          return new Response(JSON.stringify({ 
            action: 'updated', 
            reaction,
            code: 'SUCCESS',
            message: 'Reaction updated successfully'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } else {
        console.log(`[REACT_006] Creating new reaction: type=${reaction_type}`);
        // Create new reaction - trigger will handle count update
        const { data: reaction, error } = await supabaseClient
          .from('post_reactions')
          .insert({
            user_id: user.id,
            post_id: target_id,
            reaction_type
          })
          .select()
          .single();

        if (error) {
          console.error(`[REACT_007] Error creating reaction:`, error);
          throw new Error(`[REACT_007] ${error.message}`);
        }

        return new Response(JSON.stringify({ 
          action: 'created', 
          reaction,
          code: 'SUCCESS',
          message: 'Reaction created successfully'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[REACT_ERROR] Reactions API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorCode = errorMessage.includes('[REACT_') ? errorMessage.split(']')[0].replace('[', '') : 'REACT_999';
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      code: errorCode,
      message: 'Failed to process reaction'
    }), {
      status: 400,
      headers: { ...getCorsHeaders(req.headers.get('origin')), 'Content-Type': 'application/json' },
    });
  }
});
