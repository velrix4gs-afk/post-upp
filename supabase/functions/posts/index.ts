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

    const url = new URL(req.url);
    const method = req.method;

    console.log(`Posts API: ${method} ${url.pathname}`);

    if (method === 'GET') {
      // Get posts feed
      const { data: posts, error } = await supabaseClient
        .from('posts')
        .select(`
          *,
          profiles:user_id (
            username,
            display_name,
            avatar_url,
            is_verified
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Get reactions for each post
      const postsWithReactions = await Promise.all(
        (posts || []).map(async (post) => {
          const { data: reactions } = await supabaseClient
            .from('post_reactions')
            .select('*')
            .eq('post_id', post.id);

          return {
            ...post,
            reactions: reactions || [],
            likes_count: reactions?.filter(r => r.reaction_type === 'like').length || 0,
            comments_count: post.comments_count || 0,
            shares_count: 0
          };
        })
      );

      return new Response(JSON.stringify(postsWithReactions), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (method === 'POST') {
      let body;
      try {
        const text = await req.text();
        body = text ? JSON.parse(text) : {};
      } catch (parseError) {
        console.error('Failed to parse request body:', parseError);
        throw new Error('Invalid request body');
      }

      const { content, media_url, media_type, location, tagged_users, hashtags, privacy } = body;

      console.log('Post data received:', { content, media_url, media_type });

      // Validate required fields - check for truthy values
      if ((!content || content.trim() === '') && (!media_url || media_url.trim() === '')) {
        throw new Error('Post must have content or media');
      }

      const { data: post, error } = await supabaseClient
        .from('posts')
        .insert({
          user_id: user.id,
          content,
          media_url,
          media_type,
          privacy: privacy || 'public'
        })
        .select(`
          *,
          profiles:user_id (
            username,
            display_name,
            avatar_url,
            is_verified
          )
        `)
        .single();

      if (error) throw error;

      // Create notification for tagged users
      if (tagged_users?.length > 0) {
        const notifications = tagged_users.map((taggedUserId: string) => ({
          user_id: taggedUserId,
          type: 'mention',
          title: 'You were tagged in a post',
          content: `${post.profiles.display_name} tagged you in a post`,
          data: { post_id: post.id, user_id: user.id }
        }));

        await supabaseClient.from('notifications').insert(notifications);
      }

      return new Response(JSON.stringify(post), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (method === 'PUT') {
      const postId = url.pathname.split('/').pop();
      const body = await req.json();
      const { content, media_url, media_type, privacy } = body;

      const { data: post, error } = await supabaseClient
        .from('posts')
        .update({
          content,
          media_url,
          media_type,
          privacy
        })
        .eq('id', postId)
        .eq('user_id', user.id) // Ensure user owns the post
        .select(`
          *,
          profiles:user_id (
            username,
            display_name,
            avatar_url,
            is_verified
          )
        `)
        .single();

      if (error) throw error;

      return new Response(JSON.stringify(post), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (method === 'DELETE') {
      const postId = url.pathname.split('/').pop();

      const { error } = await supabaseClient
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id); // Ensure user owns the post

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Posts API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});