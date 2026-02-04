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
  const corsHeaders = getCorsHeaders(req.headers.get('origin'));
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || typeof email !== 'string' || !emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Valid email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize email
    const sanitizedEmail = email.toLowerCase().trim();

    // Rate limiting: 5 requests per minute per email
    if (!checkRateLimit(sanitizedEmail, 5, 60000)) {
      return new Response(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if user exists in auth.users
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error checking user:', userError);
      // Don't reveal if user exists or not for security
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'If an account exists with this email, a verification code will be sent.' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userExists = userData.users.some(
      (user) => user.email?.toLowerCase() === sanitizedEmail
    );

    if (!userExists) {
      // Don't reveal that user doesn't exist - return same message
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'If an account exists with this email, a verification code will be sent.' 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Generate cryptographically secure 6-digit OTP
    const randomBytes = new Uint8Array(4);
    crypto.getRandomValues(randomBytes);
    const randomNumber = new DataView(randomBytes.buffer).getUint32(0, false);
    const code = (100000 + (randomNumber % 900000)).toString();

    // Store OTP in database (expires in 10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    
    // Delete any existing OTPs for this email first
    await supabase
      .from('email_otps')
      .delete()
      .eq('email', sanitizedEmail);

    const { error: insertError } = await supabase
      .from('email_otps')
      .insert({
        email: sanitizedEmail,
        code,
        expires_at: expiresAt
      });

    if (insertError) {
      console.error('Error inserting OTP:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to generate verification code' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send email with OTP
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (resendApiKey) {
      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'POST UP <onboarding@resend.dev>',
            to: [sanitizedEmail],
            subject: 'Your POST UP Sign-In Code',
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #333;">Sign In to POST UP</h1>
                <p style="font-size: 16px; color: #666;">Your sign-in code is:</p>
                <div style="background: #f5f5f5; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
                  <h2 style="font-size: 32px; letter-spacing: 8px; margin: 0; color: #333;">${code}</h2>
                </div>
                <p style="font-size: 14px; color: #666;">This code will expire in 10 minutes.</p>
                <p style="font-size: 14px; color: #999;">If you didn't request this code, please ignore this email.</p>
              </div>
            `,
          }),
        });

        if (!emailResponse.ok) {
          const errorText = await emailResponse.text();
          console.error('Failed to send email:', errorText);
        }
      } catch (emailError) {
        console.error('Error sending email:', emailError);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'If an account exists with this email, a verification code will be sent.',
        // In development, return the code for testing
        ...(Deno.env.get('ENVIRONMENT') === 'development' ? { code } : {})
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-login-otp:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to send verification code' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
