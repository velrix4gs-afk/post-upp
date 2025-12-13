import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

// This function should only be called by Supabase Cron or with service role key
// No public CORS headers - this is an internal function

serve(async (req) => {
  // Only allow POST requests (cron uses POST)
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Verify authorization - require service role key or cron secret
    const authHeader = req.headers.get('authorization');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const cronSecret = Deno.env.get('CRON_SECRET');
    
    // Check if request is authorized
    const isAuthorized = authHeader && (
      authHeader === `Bearer ${serviceRoleKey}` ||
      (cronSecret && authHeader === `Bearer ${cronSecret}`)
    );
    
    if (!isAuthorized) {
      console.log('Unauthorized access attempt to delete-expired-messages');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      serviceRoleKey
    );

    console.log('Starting expired messages cleanup...');

    // Delete expired messages
    const { data, error } = await supabaseAdmin
      .from('messages')
      .delete()
      .lte('expires_at', new Date().toISOString())
      .eq('auto_delete_enabled', true)
      .select();

    if (error) {
      console.error('Error deleting expired messages:', error);
      throw error;
    }

    const deletedCount = data?.length || 0;
    console.log(`Deleted ${deletedCount} expired messages`);

    return new Response(
      JSON.stringify({
        success: true,
        deleted: deletedCount,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error in delete-expired-messages function:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        success: false
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
