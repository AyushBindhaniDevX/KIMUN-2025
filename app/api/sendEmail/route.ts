import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import Imap from 'imap';
import bwipjs from 'bwip-js';

export async function POST(req: Request) {
  try {
    const reqBody = await req.json();
    const { email, name, registrationId, committee, portfolio,zone, secondDelegate } = reqBody;

    console.log(`📩 Sending Confirmation Email to: ${email}`);

    // ✅ Generate Barcode as Base64 Image
    const barcodeBase64 = await new Promise<string>((resolve, reject) => {
      bwipjs.toBuffer(
        {
          bcid: 'code128', // Barcode type
          text: registrationId,
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

    // ✅ Configure Titan Mail SMTP
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.titan.email",
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });


    // ✅ Email Content with Inline Barcode
    const subject = '🎉 KIMUN 2025 Registration Confirmation';
    const body = `

      <h2>Hello ${name},</h2>
      <p>Thank you for registering for Kalinga International Model United Nations 2025!</p>

      <h3>Delegate Info:</h3>
      <ul>
        <li><strong>Delegate ID:</strong> ${registrationId.toUpperCase()}</li>
        <li><strong>Committee:</strong> ${committee}</li>
        <li><strong>Portfolio:</strong> ${portfolio}</li>
        <li><strong>Venue:</strong> BMPS Takshila School Patia</li>
        <li><strong>Gate:</strong> 1 : Zone ${zone}</li>
        <li><strong>Valid From/To:</strong> Feb 16 to June 16, 2025</li>
      </ul>

              <section>
            <h2>General Policies</h2>
            <ul>
                <li>All participants must comply with local laws and KIMUN regulations.</li>
                <li>Participation implies acceptance of all policies.</li>
                <li>The Secretary-General holds the authority for any policy exceptions.</li>
                <li>Open to students from Secondary, Higher-Secondary, Undergraduate, and Graduate programs.</li>
                <li>Formal dress code is mandatory during committee sessions.</li>
                <li>Delegates must pay their registration fee before participation.</li>
                <li>No refunds for withdrawals.</li>
            </ul>
        </section>



      <h2>Please bring this email and your barcode to the event for verification.</h2>

      <h3>📌 Your Barcode:</h3>
      <img src="${barcodeBase64}" alt="Delegate ID" />

      <h4>Best Regards,<br/>MUN Team</h4>
    `;

    const mailOptions = {
      from: `"KIMUN Registration" <${process.env.SMTP_USER}>`,
      to: email,
      subject: subject,
      html: body,
    };

    // ✅ Send Email
    await transporter.sendMail(mailOptions);
    console.log('✅ Email Sent Successfully!');

    // ✅ Append Email to "Sent" Folder
    await appendToSentFolder({ email, subject, body });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error Sending Email:', error);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}

// ✅ Append Email to "Sent" Folder using IMAP
async function appendToSentFolder({ email, subject, body }) {
  const imap = new Imap({
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASS,
    host: process.env.IMAP_HOST || "imap.titan.email",
    port: Number(process.env.IMAP_PORT) || 993,
    tls: true,
  });

  return new Promise<void>((resolve, reject) => {
    imap.once('ready', () => {
      imap.openBox('Sent', false, (err) => {
        if (err) {
          console.error('❌ Error Opening "Sent" Folder:', err);
          imap.end();
          return reject(err);
        }

        // Create MIME Message
        const emailMessage = `From: ${process.env.SMTP_USER}\r\nTo: ${email}\r\nSubject: ${subject}\r\n\r\n${body}`;

        // Append to "Sent" Folder
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