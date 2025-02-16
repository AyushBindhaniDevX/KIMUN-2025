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
        <style>
            body {
                font-family: Arial, sans-serif;
                margin: 20px;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                max-width: 800px;
                margin: 0 auto;
                background: white;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
            }
            h1, h2, h3, h4 {
                color: #333;
            }
            ul {
                list-style-type: none;
                padding: 0;
            }
            li {
                padding: 5px 0;
            }
            img {
                max-width: 100%;
                height: auto;
            }
        </style>
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
            </ul>
        </section>

        <section>
            <h2>Registration Guidelines</h2>
            <ul>
                <li>Open to students from Secondary, Higher-Secondary, Undergraduate, and Graduate programs.</li>
                <li>Formal dress code is mandatory during committee sessions.</li>
                <li>Delegates must pay their registration fee before participation.</li>
                <li>No refunds for withdrawals.</li>
            </ul>
        </section>

        <section>
            <h2>Code of Conduct</h2>
            <ul>
                <li>No consumption of alcohol, drugs, or smoking within conference premises.</li>
                <li>Delegates must maintain diplomatic decorum and use English as the official language.</li>
                <li>Attending at least 75% of the sessions is required for certification.</li>
            </ul>
        </section>

        <section>
            <h2>Anti-Sexual Harassment Policy</h2>
            <h3>A. Policy Provisions</h3>
            <ul>
                <li>All members of the Organizing Committee and Executive Board must prevent and deter sexual harassment.</li>
                <li>Sexual harassment includes unwelcome physical, verbal, and non-verbal conduct of a sexual nature.</li>
                <li>Organizing Committee must ensure clear anti-harassment policies are displayed and enforced.</li>
            </ul>
            
            <h3>B. Examples of Sexual Harassment</h3>
            <ul>
                <li>Unwanted physical contact such as patting, pinching, or inappropriate touching.</li>
                <li>Verbal harassment including sexual jokes, comments, or threats.</li>
                <li>Sending sexually explicit messages.</li>
                <li>Non-verbal gestures such as whistling, suggestive looks, or displaying inappropriate content.</li>
            </ul>
        </section>

      <p>Please bring this email and your barcode to the event for verification.</p>

      <h3>📌 Your Barcode:</h3>
      <img src="${barcodeBase64}" alt="Delegate Barcode" />

      <h4>Best Regards,<br/>MUN Team</h4>
    `;

    const mailOptions = {
      from: `"MUN Registration" <${process.env.SMTP_USER}>`,
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
