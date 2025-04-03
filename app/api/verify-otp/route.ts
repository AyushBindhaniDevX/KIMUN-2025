import { NextResponse } from 'next/server'
import admin from 'firebase-admin'

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
    const { email, otp } = await request.json()

    // Validate inputs
    if (!email || !otp || otp.length !== 6) {
      return NextResponse.json(
        { error: 'Invalid email or OTP format' },
        { status: 400 }
      )
    }

    // Get stored OTP data
    const otpRef = db.ref('otps').child(email.replace(/\./g, ','))
    const snapshot = await otpRef.get()

    if (!snapshot.exists()) {
      return NextResponse.json(
        { error: 'OTP not found or expired. Please request a new one.' },
        { status: 404 }
      )
    }

    const otpData = snapshot.val()

    // Check attempts
    if (otpData.attempts >= 3) {
      await otpRef.remove()
      return NextResponse.json(
        { error: 'Too many attempts. Please request a new OTP.' },
        { status: 429 }
      )
    }

    // Check expiry
    if (Date.now() > otpData.expiresAt) {
      await otpRef.remove()
      return NextResponse.json(
        { error: 'OTP expired. Please request a new one.' },
        { status: 410 }
      )
    }

    // Verify OTP
    if (otp !== otpData.otp) {
      await otpRef.update({ attempts: otpData.attempts + 1 })
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 401 }
      )
    }

    // OTP is valid - remove it
    await otpRef.remove()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in verify-otp:', error)
    return NextResponse.json(
      { error: 'Failed to verify OTP. Please try again later.' },
      { status: 500 }
    )
  }
}