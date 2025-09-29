import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProfileUpdateRequest {
  username?: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  cover_url?: string;
  location?: string;
  website?: string;
  birth_date?: string;
  relationship_status?: string;
  theme_color?: string;
  is_private?: boolean;
}

interface SettingsUpdateRequest {
  notification_messages?: boolean;
  notification_friend_requests?: boolean;
  notification_post_reactions?: boolean;
  privacy_who_can_message?: 'everyone' | 'friends' | 'nobody';
  privacy_who_can_view_profile?: 'everyone' | 'friends' | 'nobody';
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        }
      );
    }

    const url = new URL(req.url);
    const method = req.method;

    // GET /profiles - Get user profile
    if (method === 'GET') {
      const userId = url.searchParams.get('user_id') || user.id;
      
      const { data: profile, error } = await supabaseClient
        .from('profiles_view')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      return new Response(JSON.stringify(profile), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // PUT /profiles - Update user profile
    if (method === 'PUT') {
      const body: ProfileUpdateRequest = await req.json();
      
      const { data, error } = await supabaseClient
        .from('profiles')
        .update({
          ...body,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // PUT /profiles/settings - Update user settings
    if (method === 'PUT' && url.pathname.includes('/settings')) {
      const body: SettingsUpdateRequest = await req.json();
      
      const { data, error } = await supabaseClient
        .from('user_settings')
        .upsert({
          user_id: user.id,
          ...body,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      return new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    // GET /profiles/settings - Get user settings
    if (method === 'GET' && url.pathname.includes('/settings')) {
      const { data: settings, error } = await supabaseClient
        .from('settings_view')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
        );
      }

      return new Response(JSON.stringify(settings), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (error: any) {
    console.error('Error in profiles function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
};

serve(handler);