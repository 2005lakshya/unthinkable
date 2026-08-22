import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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
    const { booking_id, email, reference_code, show_title, show_date, show_time, venue_name, seats } = await req.json();

    if (!booking_id || !email || !reference_code) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate QR code using a free QR API (qrserver.com)
    const qrData = encodeURIComponent(reference_code);
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`;

    // Build email content
    const seatList = seats ? seats.join(", ") : "See booking details";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f59e0b, #ea580c); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Booking Confirmed!</h1>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0;">
          <p style="font-size: 16px; color: #1e293b;">Your booking for <strong>${show_title}</strong> has been confirmed.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
            <p style="margin: 5px 0; color: #64748b; font-size: 14px;"><strong>Reference:</strong> ${reference_code}</p>
            <p style="margin: 5px 0; color: #64748b; font-size: 14px;"><strong>Date:</strong> ${show_date}</p>
            <p style="margin: 5px 0; color: #64748b; font-size: 14px;"><strong>Time:</strong> ${show_time}</p>
            <p style="margin: 5px 0; color: #64748b; font-size: 14px;"><strong>Venue:</strong> ${venue_name}</p>
            <p style="margin: 5px 0; color: #64748b; font-size: 14px;"><strong>Seats:</strong> ${seatList}</p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <img src="${qrImageUrl}" alt="QR Code Ticket" style="width: 200px; height: 200px; border-radius: 8px;" />
            <p style="color: #64748b; font-size: 13px; margin-top: 10px;">Scan this QR code at the venue entrance</p>
          </div>

          <p style="color: #94a3b8; font-size: 12px; text-align: center; margin-top: 30px;">
            This is an automated email. Please do not reply.<br/>
            BookSeat - Ticket Booking Platform
          </p>
        </div>
      </div>
    `;

    // Send email using Resend (or fallback to logging)
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (resendApiKey) {
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: Deno.env.get("RESEND_FROM_EMAIL") || "BookSeat <tickets@bookseat.app>",
          to: email,
          subject: `Your ticket for ${show_title} - ${reference_code}`,
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
      return new Response(JSON.stringify({ success: true, email_id: emailData.id, qr_image_url: qrImageUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else {
      // No email service configured - log and return QR URL
      console.log("Email not sent (no RESEND_API_KEY). QR URL:", qrImageUrl);
      return new Response(JSON.stringify({ success: true, qr_image_url: qrImageUrl, email_sent: false, message: "RESEND_API_KEY not configured" }), {
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
