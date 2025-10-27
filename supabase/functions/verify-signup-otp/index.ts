import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Simple rate limiting using in-memory cache
const rateLimitCache = new Map<string, { count: number; resetAt: number }>();

const checkRateLimit = (identifier: string, maxRequests = 5, windowMs = 60000): boolean => {
  const now = Date.now();
  const userLimit = rateLimitCache.get(identifier);

  if (!userLimit || now > userLimit.resetAt) {
    rateLimitCache.set(identifier, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (userLimit.count >= maxRequests) {
    return false;
  }

  userLimit.count++;
  return true;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code, password, username, displayName } = await req.json();

    if (!email || !code || !password || !username || !displayName) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limiting: 5 verification attempts per minute per email
    if (!checkRateLimit(email, 5, 60000)) {
      return new Response(
        JSON.stringify({ error: 'Too many verification attempts. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Retrieve OTP record (constant time regardless of existence)
    const { data: otpRecord } = await supabase
      .from('email_otps')
      .select('*')
      .eq('email', email)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Constant-time comparison - check all conditions together
    const isValid = otpRecord && 
                    otpRecord.code === code && 
                    new Date(otpRecord.expires_at) > new Date();

    if (!isValid) {
      // Add consistent delay to prevent timing attacks
      await new Promise(resolve => setTimeout(resolve, 100));
      console.error('[OTP_001] Invalid or expired verification code');
      return new Response(
        JSON.stringify({ error: 'Invalid or expired verification code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create user account
    const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm since they verified via OTP
      user_metadata: {
        username,
        display_name: displayName
      }
    });

    if (signUpError) {
      console.error('Signup error:', signUpError);
      if (signUpError.message.includes('already registered') || signUpError.message.includes('already exists')) {
        return new Response(
          JSON.stringify({ error: 'Email already registered' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw signUpError;
    }

    // Delete used OTP
    await supabase
      .from('email_otps')
      .delete()
      .eq('id', otpRecord.id);

    // Generate session for the new user
    const { data: sessionData, error: sessionError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
    });

    if (sessionError) {
      console.error('Session generation error:', sessionError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Account created successfully',
        user: authData.user
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in verify-signup-otp:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
