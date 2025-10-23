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

    // Get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ 
        error: 'TIP_001: No authorization header',
        code: 'TIP_001',
        message: 'You must be logged in to send tips'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: userError } = await supabaseAnonClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      return new Response(JSON.stringify({ 
        error: 'TIP_002: Invalid token',
        code: 'TIP_002',
        message: 'Invalid or expired authentication'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { recipient_id, amount, message } = body;

    console.log(`[TIP_001] Processing tip: sender=${user.id}, recipient=${recipient_id}, amount=${amount}`);

    // Validate inputs
    if (!recipient_id || !amount) {
      return new Response(JSON.stringify({ 
        error: 'TIP_003: Missing required fields',
        code: 'TIP_003',
        message: 'Recipient ID and amount are required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (amount < 1) {
      return new Response(JSON.stringify({ 
        error: 'TIP_004: Invalid amount',
        code: 'TIP_004',
        message: 'Tip amount must be at least $1'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if sender is verified
    const { data: senderProfile } = await supabaseClient
      .from('profiles')
      .select('is_verified')
      .eq('id', user.id)
      .single();

    if (!senderProfile?.is_verified) {
      return new Response(JSON.stringify({ 
        error: 'TIP_005: Verification required',
        code: 'TIP_005',
        message: 'You must be verified to send tips. Get verified to unlock this feature!'
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // In a real implementation, you would:
    // 1. Process payment via Stripe
    // 2. Record transaction in database
    // 3. Send notification to recipient
    
    // For now, we'll just create a notification
    await supabaseClient.from('notifications').insert({
      user_id: recipient_id,
      type: 'tip',
      title: 'New Tip Received',
      content: message || `You received a $${amount} tip!`,
      data: { 
        sender_id: user.id, 
        amount: amount,
        message: message
      }
    });

    console.log(`[TIP_002] Tip processed successfully`);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Tip sent successfully',
      amount: amount
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[TIP_ERROR] Error processing tip:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(JSON.stringify({ 
      error: errorMessage,
      code: 'TIP_999',
      message: 'Failed to process tip'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
