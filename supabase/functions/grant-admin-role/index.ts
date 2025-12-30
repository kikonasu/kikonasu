import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, email } = await req.json();

    // Only allow granting admin to the test admin email
    const ADMIN_EMAIL = "admin@kikonasu.com";
    if (email !== ADMIN_EMAIL) {
      return new Response(
        JSON.stringify({ error: "Unauthorized: Only test admin account can be granted admin role" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    // Create a Supabase client with the service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Insert admin role for the user
    const { error: insertError } = await supabaseAdmin
      .from("user_roles")
      .upsert(
        { user_id: userId, role: "admin" },
        { onConflict: "user_id,role" }
      );

    if (insertError) {
      console.error("Error inserting admin role:", insertError);
      return new Response(
        JSON.stringify({ error: insertError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Admin role granted successfully" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error in grant-admin-role function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
