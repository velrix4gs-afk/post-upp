import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  'https://post-upp.lovable.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

const getCorsHeaders = (origin: string | null) => ({
  'Access-Control-Allow-Origin': ALLOWED_ORIGINS.includes(origin || '') ? origin! : ALLOWED_ORIGINS[0],
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
});

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code } = await req.json();

    // Validate inputs
    if (!email || !code) {
      return new Response(
        JSON.stringify({ error: 'Email and code are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const sanitizedEmail = email.toLowerCase().trim();
    const sanitizedCode = code.trim();

    // Validate code format
    if (!/^\d{6}$/.test(sanitizedCode)) {
      return new Response(
        JSON.stringify({ error: 'Invalid code format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify OTP from database
    const { data: otpData, error: otpError } = await supabase
      .from('email_otps')
      .select('*')
      .eq('email', sanitizedEmail)
      .eq('code', sanitizedCode)
      .gte('expires_at', new Date().toISOString())
      .single();

    if (otpError || !otpData) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired code' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Delete the used OTP
    await supabase
      .from('email_otps')
      .delete()
      .eq('id', otpData.id);

    // Generate a magic link for the user to sign in
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: sanitizedEmail,
    });

    if (linkError || !linkData) {
      console.error('Error generating magic link:', linkError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate sign-in link' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract the token from the magic link
    // The link format is like: https://xxx.supabase.co/auth/v1/verify?token=xxx&type=magiclink&redirect_to=xxx
    const url = new URL(linkData.properties.action_link);
    const token = url.searchParams.get('token');
    const type = url.searchParams.get('type');

    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Failed to extract authentication token' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        token,
        type: type || 'magiclink',
        email: sanitizedEmail
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in verify-login-otp:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to verify code' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
