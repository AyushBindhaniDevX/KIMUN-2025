import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import Imap from 'imap';

interface ApplicationEmailData {
  email?: string;
  name?: string;
  type: 'receipt' | 'status_update' | 'task_added' | 'task_updated' | 'broadcast';
  role?: string;
  status?: string;
  taskTitle?: string;
  taskDescription?: string;
  broadcastTitle?: string;
  broadcastContent?: string;
  emails?: string[];
}

export async function POST(req: Request) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('SMTP credentials not configured');
    return NextResponse.json({ success: false, error: "Server configuration error" }, { status: 500 });
  }

  try {
    const data: ApplicationEmailData = await req.json();
    
    if (!data.type) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    let subject = '';
    let body = '';
    let toField = data.email || '';
    let bccField = '';

    if (data.type === 'receipt') {
      subject = `Application Received - KIMUN 2025`;
      body = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #4f46e5;">Application Received!</h2>
          <p>Dear ${data.name},</p>
          <p>Thank you for applying to be a part of the KIMUN 2025 ${data.role || 'Staff'}. We have successfully received your application!</p>
          <p>Our Secretariat will review your responses and get back to you shortly regarding the next steps.</p>
          <br/>
          <p>Best Regards,</p>
          <p><strong>The KIMUN Organizing Committee</strong></p>
        </div>
      `;
    } else if (data.type === 'status_update') {
      const formattedStatus = (data.status || 'updated').charAt(0).toUpperCase() + (data.status || 'updated').slice(1);
      subject = `Application Status Update: ${formattedStatus} - KIMUN 2025`;
      
      let statusMessage = '';
      if (data.status === 'interview') statusMessage = 'We would like to invite you for an interview. Our team will contact you shortly to schedule it.';
      else if (data.status === 'onboarding') statusMessage = 'Congratulations! You have moved to the onboarding phase. We will send you further instructions soon.';
      else if (data.status === 'welcomed') statusMessage = 'Welcome aboard! Your onboarding is complete and you are officially part of the KIMUN team.';
      else if (data.status === 'rejected') statusMessage = 'Thank you for your interest in KIMUN. Unfortunately, we are unable to move forward with your application at this time.';
      else statusMessage = `Your application status has been changed to: ${formattedStatus}.`;

      body = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #4f46e5;">Application Update</h2>
          <p>Dear ${data.name},</p>
          <p>There is an update regarding your application for KIMUN 2025 ${data.role ? `(${data.role})` : ''}.</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Status:</strong> ${formattedStatus}</p>
            <p style="margin: 10px 0 0 0;">${statusMessage}</p>
          </div>
          <p>If you have any questions, please feel free to reach out.</p>
          <br/>
          <p>Best Regards,</p>
          <p><strong>The KIMUN Secretariat</strong></p>
        </div>
      `;
    } else if (data.type === 'task_added' || data.type === 'task_updated') {
      subject = data.type === 'task_added' ? `New Task Assigned: ${data.taskTitle}` : `Task Updated: ${data.taskTitle}`;
      body = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #4f46e5;">${data.type === 'task_added' ? 'New Task Assigned' : 'Task Updated'}</h2>
          <p>Dear ${data.name},</p>
          <p>You have an update regarding a task on the Oasis Dashboard.</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Task:</strong> ${data.taskTitle}</p>
            <p style="margin: 10px 0 0 0;">${data.taskDescription || ''}</p>
          </div>
          <p>Please log in to the KIMUN Oasis Dashboard to view details.</p>
          <br/>
          <p>Best Regards,</p>
          <p><strong>The KIMUN Secretariat</strong></p>
        </div>
      `;
    } else if (data.type === 'broadcast') {
      subject = `Announcement: ${data.broadcastTitle}`;
      if (data.emails && data.emails.length > 0) {
        toField = '"KIMUN Team" <onboarding@kimun.in.net>';
        bccField = data.emails.join(',');
      }
      body = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #ea580c;">Bulletin Broadcast</h2>
          <div style="background-color: #fff7ed; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #ffedd5;">
            <p style="margin: 0; font-weight: bold; color: #9a3412; font-size: 1.1em;">${data.broadcastTitle}</p>
            <p style="margin: 15px 0 0 0; color: #431407; white-space: pre-wrap;">${data.broadcastContent}</p>
          </div>
          <p>Please log in to the KIMUN Oasis Dashboard to view further details.</p>
          <br/>
          <p>Best Regards,</p>
          <p><strong>The KIMUN Secretariat</strong></p>
        </div>
      `;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'exolive.subedge.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true,
      tls: { rejectUnauthorized: false },
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const senderEmail = (process.env.SMTP_USER && process.env.SMTP_USER.includes('@')) 
      ? process.env.SMTP_USER 
      : 'onboarding@kimun.in.net';

    const mailOptions: any = {
      from: senderEmail,
      to: toField,
      subject: subject,
      text: body.replace(/<[^>]*>?/gm, ''),
    };
    if (bccField) mailOptions.bcc = bccField;

    await transporter.sendMail(mailOptions);

    // Optional: Append to Sent folder via IMAP
    if (process.env.IMAP_HOST) {
      try {
        await appendToSentFolder({ email: toField, subject, body }, senderEmail);
      } catch (e) {
        console.error("IMAP Error silently caught:", e);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json({ success: false, error: 'Failed to send email' }, { status: 500 });
  }
}

// Append email to Sent folder using IMAP
async function appendToSentFolder(content: { email: string, subject: string, body: string }, senderEmail: string): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const imap = new Imap({
      user: (process.env.IMAP_USER || process.env.SMTP_USER) as string,
      password: (process.env.IMAP_PASS || process.env.SMTP_PASS) as string,
      host: process.env.IMAP_HOST || "imap.titan.email",
      port: Number(process.env.IMAP_PORT) || 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    });

    imap.once('ready', () => {
      imap.openBox('INBOX.Sent', false, (err) => {
        if (err) {
          imap.end();
          return reject(err);
        }
        const emailMessage = `From: ${senderEmail}\r\nTo: ${content.email}\r\nSubject: ${content.subject}\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n${content.body}`;
        imap.append(emailMessage, { mailbox: 'INBOX.Sent' }, (appendErr) => {
          if (appendErr) reject(appendErr);
          else resolve();
          imap.end();
        });
      });
    });

    imap.once('error', (imapErr) => reject(imapErr));
    imap.connect();
  });
}




