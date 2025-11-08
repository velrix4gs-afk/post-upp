import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

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
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
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
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Error in delete-expired-messages function:', error);
    return new Response(
      JSON.stringify({
        error: (error as Error).message,
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
