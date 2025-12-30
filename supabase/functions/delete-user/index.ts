import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.74.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Verify the requesting user is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Check if user has admin role
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      throw new Error('User is not an admin');
    }

    // Get the user ID to delete from the request
    const { userId } = await req.json();

    if (!userId) {
      throw new Error('User ID is required');
    }

    console.log('Deleting user:', userId);

    // Try to delete from auth.users first
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    // If user not found in auth, that's okay - we'll clean up their data anyway
    if (deleteError && deleteError.message !== 'User not found') {
      console.error('Error deleting user:', deleteError);
      throw deleteError;
    }

    // Clean up profile and related data (in case auth user was already deleted)
    if (deleteError?.message === 'User not found') {
      console.log('User not found in auth, cleaning up orphaned data');
      
      // Delete profile which should cascade to related tables via foreign keys
      const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .delete()
        .eq('user_id', userId);
      
      if (profileError) {
        console.error('Error deleting profile:', profileError);
      }
    }

    console.log('User deleted successfully:', userId);

    return new Response(
      JSON.stringify({ success: true, message: 'User deleted successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in delete-user function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
