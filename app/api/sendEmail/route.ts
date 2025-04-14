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

    // Send email
    const mailOptions = {
      from: `"KIMUN Registration" <${process.env.SMTP_USER}>`,
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
function generateEmailTemplate(data: {
  name: string;
  registrationId: string;
  committee: string;
  portfolio: string;
  zone: string;
  secondDelegate?: string;
  barcodeBase64: string;
  qrCodeUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KIMUN 2025 Registration</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
        }
        .header {
            background-color: #1a365d;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .logo {
            max-width: 150px;
            margin-bottom: 15px;
        }
        .container {
            background-color: white;
            border-radius: 0 0 8px 8px;
            padding: 25px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        h1 {
            color: #1a365d;
            margin-top: 0;
        }
        h2 {
            color: #2c5282;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 8px;
            margin-top: 25px;
        }
        .delegate-info {
            background-color: #f8fafc;
            padding: 15px;
            border-radius: 6px;
            margin: 20px 0;
        }
        .info-item {
            margin-bottom: 10px;
        }
        .info-label {
            font-weight: bold;
            color: #4a5568;
        }
        .barcode-container {
            display: flex;
            justify-content: space-around;
            margin: 25px 0;
            flex-wrap: wrap;
        }
        .barcode-item {
            text-align: center;
            margin: 10px;
        }
        .barcode-image {
            max-width: 200px;
            height: auto;
        }
        .footer {
            margin-top: 30px;
            font-size: 0.9em;
            color: #718096;
            text-align: center;
        }
        .policy-list {
            padding-left: 20px;
        }
        .policy-list li {
            margin-bottom: 8px;
        }
        .highlight {
            background-color: #fffaf0;
            padding: 15px;
            border-left: 4px solid #dd6b20;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="header">
        <!-- Replace with your actual logo URL -->
        <img src="https://kimun497636615.wordpress.com/wp-content/uploads/2025/03/kimun_logo_color.png" alt="KIMUN Logo" class="logo">
        <h1>KIMUN 2025 Registration Confirmation</h1>
    </div>
    
    <div class="container">
        <p>Dear ${data.name},</p>
        
        <p>We're thrilled to confirm your registration for the <strong>Kalinga International Model United Nations 2025</strong>! 
        Below you'll find all the important details about your participation.</p>
        
        <div class="delegate-info">
            <h2>Your Delegate Information</h2>
            
            <div class="info-item">
                <span class="info-label">Delegate ID:</span> ${data.registrationId}
            </div>
            
            <div class="info-item">
                <span class="info-label">Committee:</span> ${data.committee}
            </div>
            
            <div class="info-item">
                <span class="info-label">Portfolio:</span> ${data.portfolio}
            </div>
            
            ${data.secondDelegate ? `
            <div class="info-item">
                <span class="info-label">Second Delegate:</span> ${data.secondDelegate}
            </div>
            ` : ''}
            
            <div class="info-item">
                <span class="info-label">Venue:</span> TBA
            </div>
            
            <div class="info-item">
                <span class="info-label">Gate Entry:</span> TBA
            </div>
            
            <div class="info-item">
                <span class="info-label">Event Dates:</span> JULY 5,6, 2025
            </div>
        </div>
        
        <div class="highlight">
            <strong>Important:</strong> Please bring this email (printed or digital) and your identification 
            to the event for verification. Your QR code below will be scanned for entry.
        </div>
        
        <h2>Your Access Codes</h2>
        <div class="barcode-container">
            
            <div class="barcode-item">
                <h3>Entry Code</h3>
                <img src="${data.qrCodeUrl}" alt="Delegate QR Code" class="barcode-image">
            </div>
        </div>
        
        <h2>Event Policies</h2>
        <ul class="policy-list">
            <li>All participants must comply with local laws and KIMUN regulations.</li>
            <li>Participation implies acceptance of all policies.</li>
            <li>The Secretary-General holds the authority for any policy exceptions.</li>
            <li>Formal dress code is mandatory during committee sessions.</li>
            <li>Delegates must complete registration fee payment before participation.</li>
            <li>No refunds will be issued for withdrawals after registration.</li>
            <li>All delegates must carry valid identification.</li>
        </ul>
        
        <h2>Contact Information</h2>
        <p>If you have any questions, please contact our registration team:</p>
        <ul class="policy-list">
            <li>Phone: +918249979557</li>
            <li>Website: www.kimun.in.net</li>
        </ul>
        
        <div class="footer">
            <p>We look forward to seeing you at KIMUN 2025!</p>
            <p><strong>The KIMUN Organizing Committee</strong></p>
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

        const emailMessage = `From: ${process.env.SMTP_USER}\r\nTo: ${content.email}\r\nSubject: ${content.subject}\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n${content.body}`;

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
