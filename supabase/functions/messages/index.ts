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

    const url = new URL(req.url);
    const method = req.method;
    const chatId = url.searchParams.get('chat_id');

    console.log(`Messages API: ${method} ${url.pathname}`);

    if (method === 'GET' && chatId) {
      // Get messages for a chat
      const { data: messages, error } = await supabaseClient
        .from('messages')
        .select(`
          *,
          sender:sender_id (
            username,
            display_name,
            avatar_url
          ),
          reply_to_message:reply_to (
            id,
            content,
            sender:sender_id (display_name)
          )
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      return new Response(JSON.stringify(messages), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (method === 'POST') {
      const body = await req.json();
      const { chat_id, content, media_url, media_type, reply_to } = body;

      // Input validation
      if (!chat_id || typeof chat_id !== 'string') {
        throw new Error('Invalid chat_id');
      }
      
      if (!content && !media_url) {
        throw new Error('Message must have either content or media');
      }

      if (content && typeof content !== 'string') {
        throw new Error('Content must be a string');
      }

      if (content && content.length > 5000) {
        throw new Error('Message too long (max 5000 characters)');
      }

      if (media_url && typeof media_url !== 'string') {
        throw new Error('Invalid media_url');
      }

      if (reply_to && typeof reply_to !== 'string') {
        throw new Error('Invalid reply_to');
      }

      // Verify user is participant in the chat
      const { data: participant } = await supabaseClient
        .from('chat_participants')
        .select('*')
        .eq('chat_id', chat_id)
        .eq('user_id', user.id)
        .single();

      if (!participant) {
        throw new Error('User is not a participant in this chat');
      }

      const { data: message, error } = await supabaseClient
        .from('messages')
        .insert({
          chat_id,
          sender_id: user.id,
          content,
          media_url,
          media_type,
          reply_to
        })
        .select(`
          *,
          sender:sender_id (
            username,
            display_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      // Update chat's updated_at
      await supabaseClient
        .from('chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', chat_id);

      // Create notifications for other participants
      const { data: participants } = await supabaseClient
        .from('chat_participants')
        .select('user_id')
        .eq('chat_id', chat_id)
        .neq('user_id', user.id);

      if (participants && participants.length > 0) {
        const notifications = participants.map(p => ({
          user_id: p.user_id,
          type: 'message',
          title: 'New message',
          content: content || 'Sent a media file',
          data: { chat_id, message_id: message.id, sender_id: user.id }
        }));

        await supabaseClient.from('notifications').insert(notifications);
      }

      return new Response(JSON.stringify(message), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (method === 'PUT') {
      const messageId = url.pathname.split('/').pop();
      const body = await req.json();
      const { content } = body;

      const { data: message, error } = await supabaseClient
        .from('messages')
        .update({
          content,
          is_edited: true
        })
        .eq('id', messageId)
        .eq('sender_id', user.id) // Ensure user owns the message
        .select(`
          *,
          sender:sender_id (
            username,
            display_name,
            avatar_url
          )
        `)
        .single();

      if (error) throw error;

      return new Response(JSON.stringify(message), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (method === 'DELETE') {
      const messageId = url.pathname.split('/').pop();

      const { error } = await supabaseClient
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', user.id); // Ensure user owns the message

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
    console.error('Messages API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});