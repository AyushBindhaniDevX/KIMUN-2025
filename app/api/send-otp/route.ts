import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import admin from 'firebase-admin'

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy')

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

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiresAt = Date.now() + 15 * 60 * 1000

    // Store OTP in Firebase
    await db.ref('otps').child(email.replace(/\./g, ',')).set({
      otp,
      expiresAt,
      attempts: 0
    })

    // Send OTP Email
    const { error } = await resend.emails.send({
      from: 'KIMUN Secretariat <onboarding@resend.dev>',
      to: email,
      subject: 'Your KIMUN Login OTP',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:20px">
          <h2>KIMUN Delegate Portal</h2>

          <p>Your One-Time Password (OTP) is:</p>

          <div style="
            font-size:32px;
            font-weight:bold;
            letter-spacing:8px;
            padding:15px;
            background:#f5f5f5;
            text-align:center;
            border-radius:8px;
          ">
            ${otp}
          </div>

          <p style="margin-top:20px;">
            This OTP is valid for <strong>15 minutes</strong>.
          </p>

          <p>
            If you did not request this OTP, please ignore this email.
          </p>

          <hr>

          <p style="font-size:12px;color:#666;">
            Kalinga International Model United Nations (KIMUN)
          </p>
        </div>
      `
    })

    if (error) {
      console.error('Resend Error:', error)

      return NextResponse.json(
        { error: 'Failed to send OTP email' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'OTP sent successfully'
    })

  } catch (error) {
    console.error('Error in send-otp:', error)

    return NextResponse.json(
      { error: 'Failed to send OTP. Please try again later.' },
      { status: 500 }
    )
  }
}