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

    // Send email
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })

    await transporter.sendMail({
      from: `"KIMUN Secretariat" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Your KIMUN Login OTP",
      html: `
        <p>Your OTP for KIMUN delegate login is: <strong>${otp}</strong></p>
        <p>This OTP is valid for 15 minutes.</p>
      `
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in send-otp:', error)
    return NextResponse.json(
      { error: 'Failed to send OTP. Please try again later.' },
      { status: 500 }
    )
  }
}
