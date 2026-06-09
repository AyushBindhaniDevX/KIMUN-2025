import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const { emails, subject, content } = await req.json();

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const senderEmail = (process.env.SMTP_USER && process.env.SMTP_USER.includes('@')) 
      ? process.env.SMTP_USER 
      : 'onboarding@resend.dev';

    const sendPromises = emails.map((email: string) => 
      transporter.sendMail({
        from: `"KIMUN Organizers" <${senderEmail}>`,
        to: email,
        subject,
        html: content,
      })
    );

    await Promise.all(sendPromises);

    return NextResponse.json({ 
      success: true, 
      message: `Emails sent to ${emails.length} recipients` 
    });
  } catch (error) {
    console.error('Bulk email error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
