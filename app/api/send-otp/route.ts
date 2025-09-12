import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import admin from 'firebase-admin'

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    }),
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
  })
}

const db = admin.database()

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    
    // Validate email format
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = Date.now() + 15 * 60 * 1000 // 15 minutes expiry

    // Store OTP in Firebase
    await db.ref('otps').child(email.replace(/\./g, ',')).set({
      otp,
      expiresAt,
      attempts: 0
    })

    // For development/testing - log OTP to console instead of sending email
    if (process.env.NODE_ENV === 'development') {
      console.log(`OTP for ${email}: ${otp}`)
      return NextResponse.json({ success: true, debug: true, otp })
    }

    // Gmail SMTP Configuration (for production)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD, // Use App Password, not regular password
      },
    })

    await transporter.sendMail({
      from: `"KIMUN Secretariat" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Your KIMUN Login OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #D97706;">KIMUN 2025 Delegate Portal</h2>
          </div>
          <p>Hello,</p>
          <p>Your verification code for KIMUN delegate login is:</p>
          <div style="text-align: center; margin: 30px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #D97706; letter-spacing: 5px;">${otp}</span>
          </div>
          <p>This code will expire in 15 minutes for security reasons.</p>
          <p>If you didn't request this code, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 30px 0;">
          <p style="font-size: 12px; color: #666;">KIMUN Secretariat Team</p>
        </div>
      `,
      text: `Your KIMUN verification code is: ${otp}. This code will expire in 15 minutes.`
    })

    console.log('OTP sent successfully to:', email)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in send-otp:', error)
    
    // More specific error messages
    let errorMessage = 'Failed to send OTP. Please try again later.'
    if (error.code === 'EAUTH') {
      errorMessage = 'Email authentication failed. Please check email credentials.'
    } else if (error.code === 'ECONNECTION') {
      errorMessage = 'Cannot connect to email server. Please try again later.'
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}