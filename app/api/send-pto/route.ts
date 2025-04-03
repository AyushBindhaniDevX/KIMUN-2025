import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(request: Request) {
  const { delegate, email, request } = await request.json()
  
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
    from: `"KIMUN Delegate" <${process.env.SMTP_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `PTO Request from ${delegate}`,
    html: `
      <h3>New PTO Request</h3>
      <p><strong>Delegate:</strong> ${delegate}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Request:</strong></p>
      <p>${request}</p>
    `
  })

  return NextResponse.json({ success: true })
}