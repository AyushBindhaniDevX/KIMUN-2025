// app/api/send-marksheet/route.ts
import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: Request) {
  try {
    const { toEmail, toName, committeeName, marks, allMarks } = await request.json()

    // Validate input
    if (!toEmail || !toName || !committeeName || !marks || !allMarks) {
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
    const emailHtml = generateMarksheetEmail(committeeName, marks, allMarks)

    // Send email
    const info = await transporter.sendMail({
      from: `"KIMUN Secretariat" <${process.env.SMTP_USER}>`,
      to: `${toName} <${toEmail}>`,
      subject: `Your KIMUN ${committeeName} Marksheet`,
      html: emailHtml,
    })

    return NextResponse.json({ 
      success: true, 
      messageId: info.messageId 
    })
  } catch (error) {
    console.error('Error sending marksheet:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send marksheet' },
      { status: 500 }
    )
  }
}

function generateMarksheetEmail(committeeName: string, delegate: any, allMarks: any[]) {
  const award = getAwardForDelegate(delegate, allMarks)
  
  return `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <div style="background-color: #111827; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
        <h1 style="color: #f59e0b; margin: 0;">KIMUN ${committeeName}</h1>
        <p style="color: white; margin: 5px 0 0;">Delegate Performance Marksheet</p>
      </div>
      
      <div style="background-color: white; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
        <p style="color: #4b5563;">Dear Delegate of ${delegate.country},</p>
        <p style="color: #4b5563;">Here are your performance marks from ${committeeName}:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background-color: #f59e0b; color: white; font-weight: 600;">
              <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Category</th>
              <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Score</th>
              <th style="padding: 12px; text-align: left; border: 1px solid #e5e7eb;">Max</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(delegate)
              .filter(([key]) => !['total', 'portfolioId', 'email', 'country', 'alt', 'id'].includes(key))
              .map(([category, score]) => `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 12px; border: 1px solid #e5e7eb;">${category.toUpperCase()}</td>
                  <td style="padding: 12px; border: 1px solid #e5e7eb;">${score}</td>
                  <td style="padding: 12px; border: 1px solid #e5e7eb;">${category === 'gsl' ? 10 : 5}</td>
                </tr>
              `).join('')}
            <tr style="font-weight: 600; background-color: #f3f4f6;">
              <td style="padding: 12px; border: 1px solid #e5e7eb;">TOTAL</td>
              <td style="padding: 12px; border: 1px solid #e5e7eb;">${delegate.total?.toFixed(2) || '0.00'}</td>
              <td style="padding: 12px; border: 1px solid #e5e7eb;">50</td>
            </tr>
          </tbody>
        </table>
        
        ${award ? `
        <div style="margin-top: 16px; padding: 12px; background-color: #f0fdf4; border-radius: 6px; border: 1px solid #bbf7d0;">
          <p style="color: #166534; font-weight: 600; margin: 0;">Award: ${award}</p>
        </div>
        ` : ''}
        
        <div style="margin-top: 24px; padding: 16px; background-color: #f3f4f6; border-radius: 6px;">
          <p style="color: #4b5563; margin-bottom: 8px;">For any questions about your marks:</p>
          <p style="color: #111827; font-weight: 600; margin: 0;">Delegate Affairs Team</p>
          <p style="color: #3b82f6; margin: 4px 0;">
            <a href="mailto:delegateaffairs@kimun.in.net" style="color: #3b82f6; text-decoration: none;">
              delegateaffairs@kimun.in.net
            </a>
          </p>
        </div>
        
        <p style="color: #4b5563; margin-top: 24px;">Best regards,<br/>KIMUN Secretariat</p>
      </div>
    </div>
  `
}

function getAwardForDelegate(delegate: any, allMarks: any[]): string {
  if (!Array.isArray(allMarks)) {
    console.error('allMarks is not an array:', allMarks)
    return ''
  }
  
  const sorted = [...allMarks].sort((a, b) => b.total - a.total)
  const index = sorted.findIndex(m => m.id === delegate.id)
  
  return index === 0 ? 'Best Delegate' :
         index === 1 ? 'High Commendation' :
         index === 2 ? 'Special Mention' :
         index === 3 ? 'Verbal Mention' : ''
}