import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
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

      // Check if reaction already exists for posts
      if (target_type === 'post') {
        const { data: existingReaction } = await supabaseClient
          .from('post_reactions')
          .select('*')
          .eq('user_id', user.id)
          .eq('post_id', target_id)
          .single();

        if (existingReaction) {
          // Remove reaction if clicking same type (toggle)
          if (existingReaction.reaction_type === reaction_type) {
            const { error } = await supabaseClient
              .from('post_reactions')
              .delete()
              .eq('id', existingReaction.id);

            if (error) throw error;

            return new Response(JSON.stringify({ action: 'removed', reaction_type }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          } else {
            // Update reaction type
            const { data: reaction, error } = await supabaseClient
              .from('post_reactions')
              .update({ reaction_type })
              .eq('id', existingReaction.id)
              .select()
              .single();

            if (error) throw error;

            return new Response(JSON.stringify({ action: 'updated', reaction }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        } else {
          // Create new reaction
          const { data: reaction, error } = await supabaseClient
            .from('post_reactions')
            .insert({
              user_id: user.id,
              post_id: target_id,
              reaction_type
            })
            .select()
            .single();

          if (error) throw error;

          return new Response(JSON.stringify({ action: 'created', reaction }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      // For other target types (messages, etc), use the reactions table
      const { data: existingReaction } = await supabaseClient
        .from('reactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('target_id', target_id)
        .eq('target_type', target_type)
        .single();

      if (existingReaction) {
        if (existingReaction.reaction_type === reaction_type) {
          const { error } = await supabaseClient
            .from('reactions')
            .delete()
            .eq('id', existingReaction.id);

          if (error) throw error;

          return new Response(JSON.stringify({ action: 'removed', reaction_type }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          const { data: reaction, error } = await supabaseClient
            .from('reactions')
            .update({ reaction_type })
            .eq('id', existingReaction.id)
            .select()
            .single();

          if (error) throw error;

          return new Response(JSON.stringify({ action: 'updated', reaction }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } else {
        const { data: reaction, error } = await supabaseClient
          .from('reactions')
          .insert({
            user_id: user.id,
            target_id,
            target_type,
            reaction_type
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify({ action: 'created', reaction }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Reactions API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});