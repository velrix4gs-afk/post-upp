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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Get user from JWT
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(authHeader.replace('Bearer ', ''));
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

      // Check if reaction already exists
      const { data: existingReaction } = await supabaseClient
        .from('reactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('target_id', target_id)
        .eq('target_type', target_type)
        .single();

      if (existingReaction) {
        // Update existing reaction or remove if same type
        if (existingReaction.reaction_type === reaction_type) {
          // Remove reaction
          const { error } = await supabaseClient
            .from('reactions')
            .delete()
            .eq('id', existingReaction.id);

          if (error) throw error;

          // Update count in target table
          if (target_type === 'post') {
            await supabaseClient.rpc('decrement_post_likes', { post_id: target_id });
          }

          return new Response(JSON.stringify({ action: 'removed', reaction_type }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } else {
          // Update reaction type
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
        // Create new reaction
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

        // Update count in target table
        if (target_type === 'post') {
          await supabaseClient.rpc('increment_post_likes', { post_id: target_id });
        }

        // Create notification for post/comment owner
        if (target_type === 'post') {
          const { data: post } = await supabaseClient
            .from('posts')
            .select('user_id, profiles:user_id(display_name)')
            .eq('id', target_id)
            .single();

          if (post && post.user_id !== user.id) {
            await supabaseClient.from('notifications').insert({
              user_id: post.user_id,
              type: 'like',
              title: 'New reaction on your post',
              content: `Someone reacted with ${reaction_type} to your post`,
              data: { post_id: target_id, user_id: user.id, reaction_type }
            });
          }
        }

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