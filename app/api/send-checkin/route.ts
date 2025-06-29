// app/api/send-checkin/route.ts
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: Request) {
  try {
    const { toEmail, toName, committeeName } = await request.json()

    // Validate input
    if (!toEmail || !toName) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    // Generate email HTML
    const emailHtml = `
      <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="background-color: #111827; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="color: #f59e0b; margin: 0;">Welcome to KIMUN 2025</h1>
          <p style="color: white; margin: 5px 0 0;">Delegate Check-in Confirmation</p>
        </div>
        
        <div style="background-color: white; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
          <p style="color: #4b5563;">Dear ${toName},</p>
          <p style="color: #4b5563;">Welcome to KIMUN 2025! We're thrilled to have you with us.</p>
          
          ${committeeName ? `
            <p style="color: #4b5563;">You are registered for the <strong>${committeeName}</strong> committee.</p>
          ` : ''}
          
          
          <!-- Check-in Experience Rating Section -->
          <div style="margin-top: 24px; padding: 16px; background-color: #ecfdf5; border-radius: 6px; border: 1px solid #a7f3d0;">
            <h3 style="color: #065f46; margin-top: 0;">Rate Your Check-in Experience</h3>
            <p style="color: #4b5563;">Help us improve by rating your check-in experience:</p>
            <div style="text-align: center; margin: 16px 0;">
              <a href="https://docs.google.com/forms/d/e/1FAIpQLSeuxMRLhICbYL4XkXZHVI8GqcxJAPdlLwFAbU2U7PUt6iOd3Q/viewform?usp=sharing&ouid=116158285842169947705" 
                 style="display: inline-block; background-color: #059669; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: 600;">
                Rate Now (1-5 Stars)
              </a>
            </div>
            <p style="color: #4b5563; font-size: 0.875rem; margin-bottom: 0;">
              Your feedback helps us enhance the KIMUN experience for everyone.
            </p>
          </div>
          
          <div style="margin-top: 24px; padding: 16px; background-color: #eff6ff; border-radius: 6px; border: 1px solid #bfdbfe;">
            <p style="color: #4b5563; margin-bottom: 8px;"><strong>Need help or have questions?</strong></p>
            <p style="color: #1e40af; font-weight: 600; margin: 4px 0;">
              <a href="mailto:info@kimun.in.net" style="color: #1e40af; text-decoration: none;">
                delegateaffairs@kimun.in.net
              </a>
            </p>
            <p style="color: #4b5563; font-size: 0.875rem; margin-bottom: 0;">
              Our delegate affairs team is available to assist you.
            </p>
          </div>
          
          <p style="color: #4b5563; margin-top: 24px;">We look forward to seeing you at the conference!</p>
          <p style="color: #4b5563; margin: 0;">Best regards,<br/>The KIMUN Secretariat</p>
        </div>
        
        <div style="margin-top: 16px; text-align: center; font-size: 0.75rem; color: #6b7280;">
          <p>Kalinga International Model United Nations 2025</p>
          <p>ASBMU, Bhubaneswar, Odisha, India</p>
        </div>
      </div>
    `

    // Send email
    const info = await transporter.sendMail({
      from: `"KIMUN Secretariat" <${process.env.SMTP_USER}>`,
      to: `${toName} <${toEmail}>`,
      subject: `Welcome to KIMUN 2025 - Rate Your Check-in Experience`,
      html: emailHtml,
    })

    return NextResponse.json({ 
      success: true, 
      messageId: info.messageId 
    })
  } catch (error) {
    console.error('Error sending check-in email:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send check-in email' },
      { status: 500 }
    )
  }
}
