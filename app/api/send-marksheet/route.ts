import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

// Type definitions
type Delegate = {
  email: string
  country: string
  alt: string
  gsl: number
  mod1: number
  mod2: number
  mod3: number
  mod4: number
  lobby: number
  chits: number
  fp: number
  doc: number
  total: number
  portfolioId: string
}

type RequestData = {
  committeeName: string
  delegates: Delegate[]
}

type EmailResult = {
  success: boolean
  email: string
  error?: string
}

export const dynamic = 'force-dynamic' // Prevent static optimization

export async function POST(request: Request) {
  try {
    // Validate environment variables
    const requiredEnvVars = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASSWORD']
    const missingEnvVars = requiredEnvVars.filter(env => !process.env[env])
    
    if (missingEnvVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`)
    }

    // Parse and validate request body
    const requestBody = await request.json()
    const { committeeName, delegates } = requestBody as RequestData

    if (!committeeName || !delegates || !Array.isArray(delegates)) {
      throw new Error('Invalid request data: committeeName and delegates array are required')
    }

    console.log(`Received request to send ${delegates.length} marksheets for ${committeeName}`)

    // Configure email transporter
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '465'),
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
      // Add connection timeout
      connectionTimeout: 10000, // 10 seconds
    })

    // Verify SMTP connection
    try {
      await transporter.verify()
      console.log('SMTP connection verified')
    } catch (error) {
      throw new Error(`SMTP connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    // Process emails in batches to avoid overwhelming the server
    const BATCH_SIZE = 10
    const results: EmailResult[] = []

    for (let i = 0; i < delegates.length; i += BATCH_SIZE) {
      const batch = delegates.slice(i, i + BATCH_SIZE)
      const batchResults = await Promise.all(
        batch.map(async (delegate) => {
          try {
            if (!delegate.email) {
              throw new Error('No email address provided')
            }

            // Validate email format
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(delegate.email)) {
              throw new Error('Invalid email format')
            }

            const emailContent = generateMarksheetEmail(committeeName, delegate)

            // Send email
            const info = await transporter.sendMail({
              from: `"KIMUN Secretariat" <${process.env.SMTP_USER}>`,
              to: delegate.email,
              subject: `Your KIMUN ${committeeName} Marksheet`,
              html: emailContent,
              // Add headers for tracking
              headers: {
                'X-KIMUN-Committee': committeeName,
                'X-KIMUN-Country': delegate.country,
              }
            })

            console.log(`Email sent to ${delegate.email}: ${info.messageId}`)
            
            return {
              success: true,
              email: delegate.email
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error'
            console.error(`Failed to send to ${delegate.email}: ${errorMessage}`)
            
            return {
              success: false,
              email: delegate.email,
              error: errorMessage
            }
          }
        })
      )

      results.push(...batchResults)
      
      // Small delay between batches to avoid rate limiting
      if (i + BATCH_SIZE < delegates.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    // Calculate statistics
    const successful = results.filter(r => r.success).length
    const failed = results.length - successful

    return NextResponse.json({
      success: true,
      message: `Emails processed successfully. ${successful} sent, ${failed} failed.`,
      sentCount: successful,
      failedCount: failed,
      results: results
    })

  } catch (error) {
    console.error('API Error:', error)
    
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
        errorDetails: process.env.NODE_ENV === 'development' ? 
          (error instanceof Error ? error.stack : undefined) : undefined
      },
      { status: 500 }
    )
  }
}

function generateMarksheetEmail(committeeName: string, delegate: Delegate): string {
  const categories = [
    { name: 'GSL', value: delegate.gsl, max: 10 },
    { name: 'MOD 1', value: delegate.mod1, max: 5 },
    { name: 'MOD 2', value: delegate.mod2, max: 5 },
    { name: 'MOD 3', value: delegate.mod3, max: 5 },
    { name: 'MOD 4', value: delegate.mod4, max: 5 },
    { name: 'Lobby', value: delegate.lobby, max: 5 },
    { name: 'Chits', value: delegate.chits, max: 5 },
    { name: 'FP', value: delegate.fp, max: 5 },
    { name: 'DOC', value: delegate.doc, max: 5 },
  ]

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Your KIMUN ${committeeName} Marksheet</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #111827; padding: 20px; border-radius: 8px 8px 0 0; text-align: center; }
        .header h1 { color: #f59e0b; margin: 0; }
        .header p { color: white; margin: 5px 0 0; }
        .content { background-color: white; padding: 20px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background-color: #f59e0b; color: white; font-weight: 600; text-align: left; padding: 12px; border: 1px solid #e5e7eb; }
        td { padding: 12px; border: 1px solid #e5e7eb; }
        .footer { margin-top: 24px; padding: 16px; background-color: #f3f4f6; border-radius: 6px; }
        .signature { margin-top: 24px; }
        a { color: #3b82f6; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>KIMUN ${committeeName}</h1>
          <p>Delegate Performance Marksheet</p>
        </div>
        
        <div class="content">
          <p>Dear Delegate of ${delegate.country},</p>
          <p>Here are your performance marks from ${committeeName}:</p>
          
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Score</th>
                <th>Max</th>
              </tr>
            </thead>
            <tbody>
              ${categories.map(cat => `
                <tr>
                  <td>${cat.name}</td>
                  <td>${cat.value}</td>
                  <td>${cat.max}</td>
                </tr>
              `).join('')}
              <tr style="font-weight: 600; background-color: #f3f4f6;">
                <td>TOTAL</td>
                <td>${delegate.total.toFixed(2)}</td>
                <td>50</td>
              </tr>
            </tbody>
          </table>
          
          <div class="footer">
            <p>For any questions about your marks:</p>
            <p style="font-weight: 600; margin: 0;">Delegate Affairs Team</p>
            <p style="margin: 4px 0;">
              <a href="mailto:delegateaffairs@kimun.in.net">delegateaffairs@kimun.in.net</a>
            </p>
          </div>
          
          <p class="signature">Best regards,<br/>KIMUN Secretariat</p>
        </div>
      </div>
    </body>
    </html>
  `
}