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

    console.log(`Messages API: ${method} ${url.pathname}`);

    // Parse request body
    const body = method !== 'GET' ? await req.json() : {};
    const action = body.action;

    // Handle list chats action
    if (action === 'list_chats' || (method === 'POST' && !body.chat_id && !body.messageId)) {
      const { data: participantChats, error: participantError } = await supabaseClient
        .from('chat_participants')
        .select('chat_id')
        .eq('user_id', user.id);

      if (participantError) throw participantError;

      const chatIds = participantChats?.map(p => p.chat_id) || [];
      
      if (chatIds.length === 0) {
        return new Response(JSON.stringify([]), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const { data, error } = await supabaseClient
        .from('chats')
        .select(`
          id,
          name,
          avatar_url,
          type,
          created_at
        `)
        .in('id', chatIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const chatsWithParticipants = await Promise.all(
        (data || []).map(async (chat) => {
          const { data: participants } = await supabaseClient
            .from('chat_participants')
            .select(`
              user_id,
              role,
              joined_at,
              profiles:user_id (
                username,
                display_name,
                avatar_url
              )
            `)
            .eq('chat_id', chat.id);

          return {
            ...chat,
            is_group: chat.type === 'group',
            created_by: '',
            updated_at: chat.created_at,
            participants: participants?.map(p => ({
              user_id: p.user_id,
              role: p.role,
              joined_at: p.joined_at,
              profiles: p.profiles
            })) || []
          };
        })
      );

      return new Response(JSON.stringify(chatsWithParticipants), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle fetch messages action
    if (body.chat_id && !action) {
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
        .eq('chat_id', body.chat_id)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) throw error;

      return new Response(JSON.stringify(messages || []), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle send message action
    if (action === 'send') {
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

    // Handle edit message action
    if (action === 'edit') {
      const { messageId, content } = body;

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

    // Handle delete message action
    if (action === 'delete') {
      const { messageId, deleteFor } = body; // deleteFor: 'me' | 'everyone'

      if (deleteFor === 'everyone') {
        // Delete for everyone - actually delete the message
        const { error } = await supabaseClient
          .from('messages')
          .delete()
          .eq('id', messageId)
          .eq('sender_id', user.id);

        if (error) throw error;
      } else {
        // Delete for me - add user to deleted_for array
        const { data: message, error: fetchError } = await supabaseClient
          .from('messages')
          .select('deleted_for')
          .eq('id', messageId)
          .single();

        if (fetchError) throw fetchError;

        const deletedFor = message.deleted_for || [];
        if (!deletedFor.includes(user.id)) {
          deletedFor.push(user.id);
        }

        const { error } = await supabaseClient
          .from('messages')
          .update({ deleted_for: deletedFor })
          .eq('id', messageId);

        if (error) throw error;
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle react to message
    if (action === 'react') {
      const { messageId, reactionType } = body;

      // Check if reaction already exists
      const { data: existing } = await supabaseClient
        .from('message_reactions')
        .select('id')
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        // Update existing reaction
        const { error } = await supabaseClient
          .from('message_reactions')
          .update({ reaction_type: reactionType })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new reaction
        const { error } = await supabaseClient
          .from('message_reactions')
          .insert({
            message_id: messageId,
            user_id: user.id,
            reaction_type: reactionType
          });

        if (error) throw error;
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle remove reaction
    if (action === 'unreact') {
      const { messageId } = body;

      const { error } = await supabaseClient
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', user.id);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle star/unstar message
    if (action === 'star' || action === 'unstar') {
      const { messageId } = body;

      if (action === 'star') {
        const { error } = await supabaseClient
          .from('starred_messages')
          .insert({
            user_id: user.id,
            message_id: messageId
          });

        if (error && error.code !== '23505') throw error; // Ignore duplicate key error
      } else {
        const { error } = await supabaseClient
          .from('starred_messages')
          .delete()
          .eq('user_id', user.id)
          .eq('message_id', messageId);

        if (error) throw error;
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle forward message
    if (action === 'forward') {
      const { messageId, toChatIds } = body;

      // Get original message
      const { data: originalMessage, error: fetchError } = await supabaseClient
        .from('messages')
        .select('content, media_url, media_type')
        .eq('id', messageId)
        .single();

      if (fetchError) throw fetchError;

      // Create forwarded messages for each chat
      const forwardedMessages = toChatIds.map((chatId: string) => ({
        chat_id: chatId,
        sender_id: user.id,
        content: originalMessage.content,
        media_url: originalMessage.media_url,
        media_type: originalMessage.media_type,
        is_forwarded: true,
        forwarded_from_message_id: messageId
      }));

      const { error } = await supabaseClient
        .from('messages')
        .insert(forwardedMessages);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle mark message as read
    if (action === 'mark_read') {
      const { messageId } = body;

      const { error } = await supabaseClient
        .from('message_reads')
        .insert({
          message_id: messageId,
          user_id: user.id
        });

      if (error && error.code !== '23505') throw error; // Ignore duplicate

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Handle typing indicator
    if (action === 'typing') {
      const { chatId, isTyping } = body;

      const { error } = await supabaseClient
        .from('typing_status')
        .upsert({
          chat_id: chatId,
          user_id: user.id,
          is_typing: isTyping,
          updated_at: new Date().toISOString()
        });

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