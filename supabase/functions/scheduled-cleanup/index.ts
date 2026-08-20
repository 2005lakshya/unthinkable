import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Release expired seat holds
    const { data: releasedHolds, error: holdError } = await supabase.rpc("release_expired_holds");
    if (holdError) {
      console.error("Error releasing expired holds:", holdError);
    }

    // Expire waitlist offers and offer to next in line
    const { data: expiredOffers, error: waitlistError } = await supabase.rpc("expire_waitlist_offers");
    if (waitlistError) {
      console.error("Error expiring waitlist offers:", waitlistError);
    }

    const result = {
      success: true,
      released_holds: releasedHolds || 0,
      expired_waitlist_offers: expiredOffers || 0,
      timestamp: new Date().toISOString(),
    };

    console.log("Scheduled cleanup result:", result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Cleanup error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
