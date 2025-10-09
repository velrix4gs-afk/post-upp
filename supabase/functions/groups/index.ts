import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
    
    const supabaseAnonClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    );

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const { data: { user }, error: userError } = await supabaseAnonClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (userError || !user) {
      throw new Error('Invalid or expired token');
    }

    const { action, ...body } = await req.json();
    console.log(`Groups API: ${action}`);

    if (action === 'create') {
      const { name, description, privacy, avatar_url, cover_url } = body;

      // Create group
      const { data: group, error: groupError } = await supabaseClient
        .from('groups')
        .insert({
          name,
          description,
          privacy: privacy || 'public',
          avatar_url,
          cover_url,
          created_by: user.id,
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add creator as admin
      const { error: memberError } = await supabaseClient
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'admin'
        });

      if (memberError) throw memberError;

      return new Response(JSON.stringify({ group }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'update') {
      const { group_id, name, description, privacy, avatar_url, cover_url } = body;

      const { data: group, error } = await supabaseClient
        .from('groups')
        .update({
          name,
          description,
          privacy,
          avatar_url,
          cover_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', group_id)
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ group }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'delete') {
      const { group_id } = body;

      const { error } = await supabaseClient
        .from('groups')
        .delete()
        .eq('id', group_id);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'join') {
      const { group_id } = body;

      const { error } = await supabaseClient
        .from('group_members')
        .insert({
          group_id,
          user_id: user.id,
          role: 'member'
        });

      if (error) throw error;

      // Update member count
      await supabaseClient.rpc('increment', { 
        table_name: 'groups',
        row_id: group_id,
        column_name: 'member_count'
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'leave') {
      const { group_id } = body;

      const { error } = await supabaseClient
        .from('group_members')
        .delete()
        .eq('group_id', group_id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update member count
      await supabaseClient.rpc('decrement', {
        table_name: 'groups',
        row_id: group_id,
        column_name: 'member_count'
      });

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'update_member_role') {
      const { group_id, member_id, role } = body;

      const { error } = await supabaseClient
        .from('group_members')
        .update({ role })
        .eq('group_id', group_id)
        .eq('user_id', member_id);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Groups API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
