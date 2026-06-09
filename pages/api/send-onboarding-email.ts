import type { NextApiRequest, NextApiResponse } from 'next'
import nodemailer from 'nodemailer'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed' })
  }

  try {
    const { to, type, candidateName } = req.body

    if (!to || !type || !candidateName) {
      return res.status(400).json({ success: false, error: 'Missing required parameters' })
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.resend.com',
      port: Number(process.env.SMTP_PORT || '465'),
      secure: Number(process.env.SMTP_PORT || '465') === 465,
      auth: {
        user: process.env.SMTP_USER || 'resend',
        pass: process.env.SMTP_PASS || 're_J79PF5sS_79WzUSiPsV28if1zjU3B4r1b'
      }
    })

    const senderEmail = (process.env.SMTP_USER && process.env.SMTP_USER.includes('@')) 
      ? process.env.SMTP_USER 
      : 'onboarding@resend.dev'

    let subject = ''
    let html = ''

    if (type === 'applied') {
      subject = 'Application Received - KIMUN 2026 Organizing Committee'
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #4f46e5; margin-bottom: 20px; font-weight: 800; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px;">KIMUN 2026</h2>
          <p>Dear ${candidateName},</p>
          <p>Thank you for applying to join the KIMUN 2026 Organizing Committee!</p>
          <p>We have successfully received your application. Our selection panel is currently reviewing your statement of purpose, preferences, and qualifications. Your application status is currently <strong>Pending</strong>.</p>
          <p>You can track the progress of your application in real-time by logging in to the candidate portal at:</p>
          <p style="margin: 20px 0;"><a href="https://kimun.in.net/oc-application" style="color: #4f46e5; font-weight: bold; text-decoration: underline;">KIMUN Candidate Portal</a></p>
          <p>Our team will contact you if your profile is shortlisted for the interview round.</p>
          <br />
          <p style="color: #64748b; font-size: 11px; border-t: 1px solid #f1f5f9; pt: 12px;">Best regards,<br /><strong>KIMUN 2026 Secretariat</strong></p>
        </div>
      `
    } else if (type === 'interview') {
      subject = 'Shortlisted for Interview - KIMUN 2026 Organizing Committee'
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #4f46e5; margin-bottom: 20px; font-weight: 800; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px;">KIMUN 2026</h2>
          <p>Dear ${candidateName},</p>
          <p>Congratulations! We are pleased to inform you that your application for the KIMUN 2026 Organizing Committee has been shortlisted.</p>
          <p>You have been advanced to the <strong>Interview Stage</strong>. Our recruitment coordinators will contact you via phone or email shortly to schedule your online interview slot.</p>
          <p>Please prepare to discuss your motivation, chosen department preferences, and past experiences.</p>
          <p>You can view your status updates at any time: <a href="https://kimun.in.net/oc-application" style="color: #4f46e5; font-weight: bold; text-decoration: underline;">KIMUN Candidate Portal</a>.</p>
          <br />
          <p style="color: #64748b; font-size: 11px; border-t: 1px solid #f1f5f9; pt: 12px;">Best regards,<br /><strong>KIMUN 2026 Secretariat</strong></p>
        </div>
      `
    } else if (type === 'onboarding') {
      subject = 'Interview Cleared: Document Submission Required - KIMUN 2026'
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #4f46e5; margin-bottom: 20px; font-weight: 800; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px;">KIMUN 2026</h2>
          <p>Dear ${candidateName},</p>
          <p>Fantastic news! You have cleared the interview round for the KIMUN 2026 Organizing Committee.</p>
          <p>To proceed with your onboarding, please submit your onboarding documents. You are required to upload:</p>
          <ul>
            <li>College / School Student ID Card</li>
            <li>Aadhar Card (or government identity proof)</li>
            <li>Recent profile photo</li>
          </ul>
          <p>Please log in to the candidate portal to upload your documents: <a href="https://kimun.in.net/oc-application" style="color: #4f46e5; font-weight: bold; text-decoration: underline;">Submit Onboarding Documents</a>.</p>
          <p>Once submitted, we will prepare your Non-Disclosure Agreement (NDA) for signature.</p>
          <br />
          <p style="color: #64748b; font-size: 11px; border-t: 1px solid #f1f5f9; pt: 12px;">Best regards,<br /><strong>KIMUN 2026 Secretariat</strong></p>
        </div>
      `
    } else if (type === 'contract') {
      subject = 'Action Required: Review & Sign NDA Contract - KIMUN 2026'
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #4f46e5; margin-bottom: 20px; font-weight: 800; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px;">KIMUN 2026</h2>
          <p>Dear ${candidateName},</p>
          <p>Your onboarding documents have been verified successfully.</p>
          <p>The final step in your onboarding process is to review and sign the **Non-Disclosure Agreement (NDA) & Organizing Committee Contract**.</p>
          <p>Please log in to sign the agreement: <a href="https://kimun.in.net/oc-application" style="color: #4f46e5; font-weight: bold; text-decoration: underline;">Sign NDA Contract</a>.</p>
          <p>After signing, you will be officially welcomed into the committee and granted access to the executive operational portal.</p>
          <br />
          <p style="color: #64748b; font-size: 11px; border-t: 1px solid #f1f5f9; pt: 12px;">Best regards,<br /><strong>KIMUN 2026 Secretariat</strong></p>
        </div>
      `
    } else if (type === 'welcomed') {
      subject = 'Welcome to KIMUN 2026 Organizing Committee!'
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #4f46e5; margin-bottom: 20px; font-weight: 800; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px;">KIMUN 2026</h2>
          <p>Dear ${candidateName},</p>
          <p>Welcome aboard! You have officially signed the NDA and completed all onboarding requirements.</p>
          <p>You are now a verified member of the KIMUN 2026 Organizing Committee. You have been granted access to the executive operational portal.</p>
          <p>You can now log in to the OC Dashboard using your Google account to view announcements, check scheduled meetings, and manage tasks:</p>
          <p style="text-align: center; margin: 20px 0;">
            <a href="https://kimun.in.net/oc-dashboard" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">Enter OC Dashboard</a>
          </p>
          <p>We are excited to have you on the team and look forward to working together to deliver an outstanding conference!</p>
          <br />
          <p style="color: #64748b; font-size: 11px; border-t: 1px solid #f1f5f9; pt: 12px;">Best regards,<br /><strong>KIMUN 2026 Secretariat</strong></p>
        </div>
      `
    } else if (type === 'rejected') {
      subject = 'Application Status Update - KIMUN 2026'
      html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <h2 style="color: #4f46e5; margin-bottom: 20px; font-weight: 800; border-bottom: 2px solid #f1f5f9; padding-bottom: 12px;">KIMUN 2026</h2>
          <p>Dear ${candidateName},</p>
          <p>Thank you for applying to join the KIMUN 2026 Organizing Committee and for taking the time to share your credentials with us.</p>
          <p>After careful evaluation of all candidates, we regret to inform you that we are unable to accept your application at this time. Due to limited slots and high volume, our selection process was extremely competitive.</p>
          <p>We highly appreciate your interest in KIMUN 2026 and invite you to participate as a delegate in the conference. We wish you the very best in all your future endeavors.</p>
          <br />
          <p style="color: #64748b; font-size: 11px; border-t: 1px solid #f1f5f9; pt: 12px;">Best regards,<br /><strong>KIMUN 2026 Secretariat</strong></p>
        </div>
      `
    }

    await transporter.sendMail({
      from: `"KIMUN Secretariat" <${senderEmail}>`,
      to,
      subject,
      html
    })

    return res.status(200).json({ success: true, message: `Email sent successfully to ${to}` })
  } catch (error: any) {
    console.error('Email dispatch error:', error)
    return res.status(500).json({ success: false, error: error.message })
  }
}
