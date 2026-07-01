import { NextResponse } from 'next/server'
import fast2sms from '@api/fast2sms'

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const { phone, name, registrationId, committee, portfolio } = data

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    const apiKey = process.env.FAST2SMS_API_KEY
    if (!apiKey) {
      console.error('FAST2SMS_API_KEY is not defined in environment variables')
      return NextResponse.json({ error: 'SMS service is not configured' }, { status: 500 })
    }

    // Clean phone number (remove +91 if exists)
    let cleanPhone = phone.trim()
    if (cleanPhone.startsWith('+91')) {
      cleanPhone = cleanPhone.substring(3)
    }

    // Construct the message (Max 160 characters for 1 SMS)
    const message = `Dear ${name}, your KIMUN 2025 registration is confirmed! ID: ${registrationId}. Comm: ${committee}. Port: ${portfolio}. We look forward to seeing you!`

    // Initialize SDK with API Key
    fast2sms.auth(apiKey)

    // Call the Quick SMS endpoint using the SDK
    const response = await fast2sms.get_newEndpoint({
      authorization: apiKey,
      route: 'q',
      message: message,
      numbers: cleanPhone
    })

    if (response.data.return) {
      return NextResponse.json({ success: true, result: response.data })
    } else {
      console.error('Fast2SMS Error:', response.data)
      return NextResponse.json({ error: 'Failed to send SMS', details: response.data }, { status: 400 })
    }
  } catch (error: any) {
    console.error('Error sending SMS:', error)
    if (error.data) {
      console.error('Fast2SMS Error Response:', error.data)
      return NextResponse.json({ error: 'Failed to send SMS', details: error.data }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
