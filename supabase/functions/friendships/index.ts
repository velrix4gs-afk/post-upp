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
    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create service role client for auth verification
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

    // Get user from JWT using service role client
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (userError || !user) {
      console.error('Auth error:', userError);
      throw new Error('Invalid or expired token');
    }

    console.log('Authenticated user:', user.id);

    const method = req.method;
    console.log(`Friendships API: ${method}`);

    if (method === 'GET') {
      // Get user's friendships
      const { data: friendships, error } = await supabaseClient
        .from('friendships')
        .select(`
          *,
          requester:requester_id (
            id,
            username,
            display_name,
            avatar_url,
            is_verified
          ),
          addressee:addressee_id (
            id,
            username,
            display_name,
            avatar_url,
            is_verified
          )
        `)
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify(friendships), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (method === 'POST') {
      const body = await req.json();
      const { addressee_id, action, participant_id, participant_uuid } = body;

      // Handle chat creation - accepts both participant_id and participant_uuid
      if (action === 'create_chat') {
        const targetUserId = participant_uuid || participant_id;
        
        if (!targetUserId) {
          return new Response(JSON.stringify({ 
            error: 'CHAT_001: participant_uuid is required',
            code: 'CHAT_001',
            message: 'Missing participant UUID for chat creation'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(targetUserId)) {
          return new Response(JSON.stringify({ 
            error: 'CHAT_002: Invalid UUID format',
            code: 'CHAT_002',
            message: 'Participant UUID must be a valid UUID'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Check if trying to chat with self
        if (targetUserId === user.id) {
          return new Response(JSON.stringify({ 
            error: 'CHAT_003: Cannot create chat with yourself',
            code: 'CHAT_003',
            message: 'Cannot create a chat with yourself'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Check if chat already exists between these users
        const { data: existingParticipants } = await supabaseClient
          .from('chat_participants')
          .select('chat_id')
          .eq('user_id', user.id);

        if (existingParticipants) {
          for (const ep of existingParticipants) {
            const { data: chatInfo } = await supabaseClient
              .from('chats')
              .select('type')
              .eq('id', ep.chat_id)
              .maybeSingle();

            if (chatInfo?.type === 'private') {
              const { data: otherParticipant } = await supabaseClient
                .from('chat_participants')
                .select('user_id')
                .eq('chat_id', ep.chat_id)
                .neq('user_id', user.id)
                .maybeSingle();

              if (otherParticipant?.user_id === targetUserId) {
                return new Response(JSON.stringify({ 
                  chat_id: ep.chat_id, 
                  existing: true,
                  message: 'Chat already exists'
                }), {
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
              }
            }
          }
        }

        // Create new chat
        const { data: newChat, error: chatError } = await supabaseClient
          .from('chats')
          .insert({
            type: 'private',
            created_by: user.id
          })
          .select('id')
          .single();

        if (chatError) {
          return new Response(JSON.stringify({ 
            error: `CHAT_004: ${chatError.message}`,
            code: 'CHAT_004',
            message: 'Failed to create chat - check RLS policies',
            details: chatError
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        if (!newChat?.id) {
          return new Response(JSON.stringify({ 
            error: 'CHAT_005: No chat ID returned',
            code: 'CHAT_005',
            message: 'Chat created but no ID returned - RLS policy issue'
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Add participants
        const { error: participantsError } = await supabaseClient
          .from('chat_participants')
          .insert([
            { chat_id: newChat.id, user_id: user.id, role: 'member' },
            { chat_id: newChat.id, user_id: targetUserId, role: 'member' }
          ]);

        if (participantsError) {
          return new Response(JSON.stringify({ 
            error: `CHAT_006: ${participantsError.message}`,
            code: 'CHAT_006',
            message: 'Failed to add participants - check RLS policies',
            details: participantsError
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ 
          chat_id: newChat.id, 
          existing: false,
          message: 'Chat created successfully'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (!addressee_id) {
        throw new Error('addressee_id is required');
      }

      if (addressee_id === user.id) {
        throw new Error('Cannot send friend request to yourself');
      }

      if (action === 'request') {
        // Send friend request
        const { data: friendship, error } = await supabaseClient
          .from('friendships')
          .insert({
            requester_id: user.id,
            addressee_id,
            status: 'pending'
          })
          .select(`
            *,
            requester:requester_id (
              username,
              display_name,
              avatar_url
            ),
            addressee:addressee_id (
              username,
              display_name,
              avatar_url
            )
          `)
          .single();

        if (error) {
          if (error.code === '23505') { // Unique constraint violation
            throw new Error('Friend request already exists');
          }
          throw error;
        }

        // Create notification
        await supabaseClient.from('notifications').insert({
          user_id: addressee_id,
          type: 'friend_request',
          title: 'New friend request',
          content: `${friendship.requester.display_name} sent you a friend request`,
          data: { friendship_id: friendship.id, requester_id: user.id }
        });

        return new Response(JSON.stringify(friendship), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (action === 'accept' || action === 'decline') {
        // Accept or decline friend request
        const status = action === 'accept' ? 'accepted' : 'declined';
        
        const { data: friendship, error } = await supabaseClient
          .from('friendships')
          .update({ status })
          .eq('requester_id', addressee_id)
          .eq('addressee_id', user.id)
          .eq('status', 'pending')
          .select(`
            *,
            requester:requester_id (
              username,
              display_name,
              avatar_url
            ),
            addressee:addressee_id (
              username,
              display_name,
              avatar_url
            )
          `)
          .single();

        if (error) throw error;

        if (action === 'accept') {
          // Create notification for requester
          await supabaseClient.from('notifications').insert({
            user_id: addressee_id,
            type: 'friend_request',
            title: 'Friend request accepted',
            content: `${friendship.addressee.display_name} accepted your friend request`,
            data: { friendship_id: friendship.id, accepter_id: user.id }
          });
        }

        return new Response(JSON.stringify(friendship), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      throw new Error('Invalid action. Use: request, accept, or decline');
    }

    if (method === 'DELETE') {
      const body = await req.json();
      const { friend_id } = body;

      if (!friend_id) {
        throw new Error('friend_id is required');
      }

      // Remove friendship (unfriend or cancel request)
      const { error } = await supabaseClient
        .from('friendships')
        .delete()
        .or(`and(requester_id.eq.${user.id},addressee_id.eq.${friend_id}),and(requester_id.eq.${friend_id},addressee_id.eq.${user.id})`);

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
    console.error('Friendships API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});