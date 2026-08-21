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
    const payload = await req.json();
    const { waitlist_id, user_id, show_id, position } = payload;

    if (!waitlist_id || !user_id || !show_id) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Fetch user email from profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', user_id)
      .single();

    if (profileError || !profile) {
      throw new Error(`Profile not found for user ${user_id}`);
    }

    // Fetch show details
    const { data: show, error: showError } = await supabase
      .from('shows')
      .select('title, show_date, show_time, venues(name)')
      .eq('id', show_id)
      .single();

    if (showError || !show) {
      throw new Error(`Show not found for id ${show_id}`);
    }

    const venue_name = show.venues?.name || 'the venue';
    const clientUrl = Deno.env.get("NEXT_PUBLIC_APP_URL") || "http://localhost:3000";
    const waitlistUrl = `${clientUrl}/waitlist`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b, #ea580c); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Waitlist Offer Available!</h1>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
          <p style="font-size: 16px; color: #1e293b;">Hi ${profile.full_name || 'there'},</p>
          <p style="font-size: 16px; color: #1e293b;">Good news! A seat has become available for <strong>${show.title}</strong>.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
            <p style="margin: 5px 0; color: #64748b; font-size: 14px;"><strong>Date:</strong> ${show.show_date}</p>
            <p style="margin: 5px 0; color: #64748b; font-size: 14px;"><strong>Time:</strong> ${show.show_time}</p>
            <p style="margin: 5px 0; color: #64748b; font-size: 14px;"><strong>Venue:</strong> ${venue_name}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #ea580c; font-weight: bold; margin-bottom: 15px;">You have 10 minutes to accept this offer before it expires.</p>
            <a href="${waitlistUrl}" style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              View and Accept Offer
            </a>
          </div>

          <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 30px;">
            This is an automated email. Please do not reply.<br/>
            BookSeat - Ticket Booking Platform
          </p>
        </div>
      </div>
    `;

    // Send email using Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (resendApiKey) {
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "BookSeat <tickets@bookseat.app>",
          to: profile.email,
          subject: `Waitlist Offer: ${show.title}`,
          html: html,
        }),
      });

      if (!emailResponse.ok) {
        const errText = await emailResponse.text();
        console.error("Email send failed:", errText);
        return new Response(JSON.stringify({ error: "Failed to send email", details: errText }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const emailData = await emailResponse.json();
      return new Response(JSON.stringify({ success: true, email_id: emailData.id }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      console.log("Email not sent (no RESEND_API_KEY). Would have sent to:", profile.email);
      return new Response(JSON.stringify({ success: true, email_sent: false, message: "RESEND_API_KEY not configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
