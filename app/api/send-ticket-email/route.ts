import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend with the API key from environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, reference_code, show_title, show_date, show_time, venue_name, seats } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Using Resend's testing domain for sending the email
    const { data, error } = await resend.emails.send({
      from: 'BookSeat <onboarding@resend.dev>',
      to: [email],
      subject: `Your Tickets for ${show_title}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 4px solid #000; background-color: #f8fafc;">
          <h1 style="text-transform: uppercase; border-bottom: 4px solid #000; padding-bottom: 10px; margin-top: 0; font-size: 28px;">You're Going!</h1>
          
          <h2 style="font-size: 24px; color: #EF6400; text-transform: uppercase; margin-bottom: 10px;">${show_title}</h2>
          
          <p style="font-size: 16px; margin: 5px 0;"><strong>Date:</strong> ${show_date} @ ${show_time}</p>
          <p style="font-size: 16px; margin: 5px 0;"><strong>Venue:</strong> ${venue_name}</p>
          <p style="font-size: 16px; margin: 5px 0;"><strong>Seats:</strong> ${seats.join(', ')}</p>
          
          <div style="margin-top: 30px; padding: 20px; background-color: #fcd34d; border: 4px solid #000; text-align: center;">
            <p style="margin-bottom: 5px; font-weight: bold; text-transform: uppercase; font-size: 14px;">Reference Code</p>
            <h1 style="margin: 0; font-size: 32px; font-family: monospace;">${reference_code}</h1>
          </div>
          
          <p style="margin-top: 20px; font-size: 12px; color: #666;">Present this reference code or your QR code at the venue.</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error }, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Email API route error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
