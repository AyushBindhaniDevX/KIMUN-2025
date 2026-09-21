import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import Imap from 'imap';
import bwipjs from 'bwip-js';

interface RegistrationData {
  email: string;
  name: string;
  registrationId: string;
  committee: string;
  portfolio: string;
  zone: string;
  secondDelegate?: string;
}

interface EmailContent {
  email: string;
  subject: string;
  body: string;
}

export async function POST(req: Request) {
  // Validate environment variables
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error('❌ SMTP credentials not configured');
    return NextResponse.json(
      { success: false, error: "Server configuration error" },
      { status: 500 }
    );
  }

  try {
    const reqBody: RegistrationData = await req.json();
    
    // Validate required fields
    if (!reqBody.email || !reqBody.registrationId || !reqBody.name) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log(`📩 Sending Confirmation Email to: ${reqBody.email}`);

    // Generate barcode and QR code
    const [barcodeBase64, qrCodeUrl] = await Promise.all([
      generateBarcode(reqBody.registrationId),
      generateQRCode(reqBody.registrationId)
    ]);

    // Configure email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.titan.email",
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Create email content
    const subject = '🎉 KIMUN 2025 Registration Confirmation';
    const body = generateEmailTemplate({
      ...reqBody,
      barcodeBase64,
      qrCodeUrl,
      registrationId: reqBody.registrationId.toUpperCase()
    });

    const senderEmail = (process.env.SMTP_USER && process.env.SMTP_USER.includes('@')) 
      ? process.env.SMTP_USER 
      : 'onboarding@resend.dev';

    // Send email
    const mailOptions = {
      from: `"KIMUN Registration" <${senderEmail}>`,
      to: reqBody.email,
      subject: subject,
      html: body,
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Email Sent Successfully!');

    // Append to Sent folder
    await appendToSentFolder({
      email: reqBody.email,
      subject,
      body
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('❌ Error Sending Email:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Helper function to generate barcode
async function generateBarcode(text: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    bwipjs.toBuffer(
      {
        bcid: 'code128',
        text: text,
        scale: 3,
        height: 10,
        includetext: true,
        textxalign: 'center',
      },
      (err, buffer) => {
        if (err) reject(err);
        else resolve(`data:image/png;base64,${buffer.toString('base64')}`);
      }
    );
  });
}

// Helper function to generate QR code
async function generateQRCode(text: string): Promise<string> {
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(text)}`;
}

// Generate beautiful email template
function generateEmailTemplate(data: RegistrationData & { barcodeBase64: string; qrCodeUrl: string }): string {
  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KIMUN Registration Confirmation</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 28px 16px; color: #0f172a;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08);">
        <!-- Top Gradient Accent Bar -->
        <div style="height: 5px; background: linear-gradient(90deg, #f59e0b 0%, #6366f1 50%, #4338ca 100%);"></div>

        <!-- Header -->
        <div style="background: linear-gradient(145deg, #090d16 0%, #111827 50%, #1e1b4b 100%); padding: 36px 30px 28px; text-align: center; color: #ffffff;">
            <div style="display: inline-block; padding: 5px 16px; background: rgba(99, 102, 241, 0.2); border: 1px solid rgba(165, 180, 252, 0.35); border-radius: 9999px; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 800; color: #c7d2fe; margin-bottom: 14px;">
                KIMUN • OFFICIAL CONFIRMATION
            </div>
            <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #ffffff; line-height: 1.35; letter-spacing: -0.3px;">
                Registration Confirmed
            </h1>
            <p style="margin: 8px 0 0; font-size: 13px; color: #cbd5e1;">Official Delegate Credentials & Access Pass</p>
        </div>
        
        <div style="padding: 28px 28px 24px;">
            <p style="font-size: 15px; margin-top: 0; color: #1e293b;">Dear <strong>${data.name}</strong>,</p>
            
            <p style="color: #475569; line-height: 1.6;">We are pleased to confirm your registration for <strong>KIMUN</strong>! Below you will find your official delegate allotment details and digital entry pass.</p>
            
            <!-- Delegate Info Card -->
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px 22px; margin: 22px 0;">
                <h3 style="margin: 0 0 14px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #4338ca; font-weight: 800;">
                    Delegate Allocation Details
                </h3>
                
                <table style="width: 100%; border-collapse: collapse; font-size: 13.5px;">
                    <tr style="border-bottom: 1px solid #edf2f7;">
                        <td style="padding: 8px 0; color: #64748b; width: 130px; font-weight: 600;">Delegate ID:</td>
                        <td style="padding: 8px 0; font-weight: 800; font-family: monospace; color: #4338ca; font-size: 14px;">${data.registrationId}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #edf2f7;">
                        <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Committee:</td>
                        <td style="padding: 8px 0; font-weight: 700; color: #0f172a;">${data.committee}</td>
                    </tr>
                    <tr style="border-bottom: 1px solid #edf2f7;">
                        <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Portfolio:</td>
                        <td style="padding: 8px 0; font-weight: 700; color: #0f172a;">${data.portfolio}</td>
                    </tr>
                    ${data.secondDelegate ? `
                    <tr style="border-bottom: 1px solid #edf2f7;">
                        <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Co-Delegate:</td>
                        <td style="padding: 8px 0; font-weight: 600; color: #334155;">${data.secondDelegate}</td>
                    </tr>
                    ` : ''}
                    <tr>
                        <td style="padding: 8px 0; color: #64748b; font-weight: 600;">Status:</td>
                        <td style="padding: 8px 0; font-weight: 700; color: #059669;">Verified & Ratified</td>
                    </tr>
                </table>
            </div>
            
            <!-- Important Highlight -->
            <div style="margin: 22px 0; padding: 14px 18px; background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 8px; font-size: 12.5px; color: #92400e; line-height: 1.55;">
                <strong>Entry Requirement:</strong> Please present this confirmation (digital or printed) at the registration desk for verification. The QR pass below will be scanned for your conference badge.
            </div>
            
            <!-- QR Code Section -->
            <div style="text-align: center; margin: 26px 0; padding: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px;">
                <div style="font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px;">
                    Official Entry Pass (QR)
                </div>
                <img src="${data.qrCodeUrl}" alt="Delegate QR Code" style="max-width: 180px; height: auto; border-radius: 8px; border: 1px solid #e2e8f0; padding: 6px; background: #ffffff;">
                <div style="margin-top: 10px; font-family: monospace; font-size: 12px; color: #64748b; font-weight: 600;">
                    ${data.registrationId}
                </div>
            </div>
            
            <!-- Policies Section -->
            <div style="margin-top: 24px;">
                <h4 style="margin: 0 0 10px; font-size: 13px; font-weight: 800; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px;">
                    Conference Policies & Guidelines
                </h4>
                <ul style="margin: 0; padding-left: 20px; color: #475569; font-size: 12.5px; line-height: 1.6;">
                    <li>All participants must adhere to conference regulations and parliamentary procedures.</li>
                    <li>Official badges must be worn visibly at all times within committee chambers.</li>
                    <li>Participation in all assigned committee sessions is mandatory for award eligibility.</li>
                    <li>Valid institutional identification must accompany this pass during physical check-in.</li>
                </ul>
            </div>
        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 22px 28px; text-align: center;">
            <div style="font-size: 12px; font-weight: 800; color: #0f172a; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px;">KIMUN Secretariat</div>
            <div style="font-size: 11px; color: #64748b; line-height: 1.5;">
                Official Operational Communication • OASIS KIMUN System<br/>
                Bhubaneswar, India
            </div>
        </div>
    </div>
</body>
</html>
  `;
}

// Append email to Sent folder using IMAP
async function appendToSentFolder(content: EmailContent): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const imap = new Imap({
      user: process.env.SMTP_USER,
      password: process.env.SMTP_PASS,
      host: process.env.IMAP_HOST || "imap.titan.email",
      port: Number(process.env.IMAP_PORT) || 993,
      tls: true,
    });

    imap.once('ready', () => {
      imap.openBox('Sent', false, (err) => {
        if (err) {
          console.error('❌ Error Opening "Sent" Folder:', err);
          imap.end();
          return reject(err);
        }

        const senderEmail = (process.env.SMTP_USER && process.env.SMTP_USER.includes('@')) 
          ? process.env.SMTP_USER 
          : 'onboarding@resend.dev';

        const emailMessage = `From: ${senderEmail}\r\nTo: ${content.email}\r\nSubject: ${content.subject}\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n${content.body}`;

        imap.append(emailMessage, { mailbox: 'Sent' }, (appendErr) => {
          if (appendErr) {
            console.error('❌ Error Appending Email to "Sent" Folder:', appendErr);
            reject(appendErr);
          } else {
            console.log('✅ Email Appended to "Sent" Folder.');
            resolve();
          }
          imap.end();
        });
      });
    });

    imap.once('error', (imapErr) => {
      console.error('❌ IMAP Error:', imapErr);
      reject(imapErr);
    });

    imap.connect();
  });
}
