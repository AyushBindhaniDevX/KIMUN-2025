// app/api/sendApplicationEmail/route.ts
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

interface ApplicationEmailData {
  email?: string;
  name?: string;
  type: 'receipt' | 'status_update' | 'task_added' | 'task_updated' | 'broadcast';
  role?: string;
  status?: string;
  taskTitle?: string;
  taskDescription?: string;
  broadcastTitle?: string;
  broadcastContent?: string;
  emails?: string[];
}

// Initialize Resend with your API key
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  // Validate environment variables
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured');
    return NextResponse.json(
      {
        success: false,
        error: "Server configuration error: Missing RESEND_API_KEY"
      },
      { status: 500 }
    );
  }

  try {
    const data: ApplicationEmailData = await req.json();

    // Validate required fields
    if (!data.type) {
      return NextResponse.json(
        { success: false, error: "Missing required field: type" },
        { status: 400 }
      );
    }

    // Validate email for non-broadcast types
    if (data.type !== 'broadcast' && !data.email) {
      return NextResponse.json(
        { success: false, error: "Missing required field: email" },
        { status: 400 }
      );
    }

    // Validate broadcast data
    if (data.type === 'broadcast') {
      if (!data.broadcastTitle || !data.broadcastContent) {
        return NextResponse.json(
          { success: false, error: "Broadcast requires title and content" },
          { status: 400 }
        );
      }
      if (!data.emails || data.emails.length === 0) {
        return NextResponse.json(
          { success: false, error: "Broadcast requires at least one recipient email" },
          { status: 400 }
        );
      }
    }

    // Generate email content
    const { subject, body, toField } = generateEmailContent(data);

    // For Resend, you need to use a verified domain or their sandbox
    // For testing, you can use the sandbox domain: onbarding@resend.dev
    // But for production, you MUST verify your domain
    const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';

    // If using broadcast, send individual emails (Resend doesn't support BCC in the same way)
    if (data.type === 'broadcast' && data.emails) {
      // Send to each email individually
      const emailPromises = data.emails.map(email => {
        return resend.emails.send({
          from: `KIMUN Team <${fromEmail}>`,
          to: email,
          subject: subject,
          html: body,
          text: body.replace(/<[^>]*>?/gm, ''),
        });
      });

      const results = await Promise.allSettled(emailPromises);

      // Check if any failed
      const failed = results.filter(r => r.status === 'rejected');
      if (failed.length > 0) {
        console.error(`${failed.length} emails failed to send`);
      }

      return NextResponse.json({
        success: true,
        sent: results.filter(r => r.status === 'fulfilled').length,
        failed: failed.length,
        message: `Sent to ${results.filter(r => r.status === 'fulfilled').length} recipients`
      });
    }

    // Send single email
    const { data: emailData, error } = await resend.emails.send({
      from: `KIMUN Team <${fromEmail}>`,
      to: toField || data.email || '',
      subject: subject,
      html: body,
      text: body.replace(/<[^>]*>?/gm, ''),
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      id: emailData?.id
    });

  } catch (error) {
    console.error('Email API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email'
      },
      { status: 500 }
    );
  }
}

// Helper function to generate email content
function generateEmailContent(data: ApplicationEmailData): {
  subject: string;
  body: string;
  toField: string;
} {
  let subject = '';
  let body = '';
  let toField = data.email || '';

  const baseStyle = `
    <style>
      .email-container {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        background-color: #ffffff;
      }
      .header {
        color: #4f46e5;
        margin-bottom: 20px;
        font-size: 24px;
        font-weight: 600;
      }
      .content-box {
        background-color: #f8fafc;
        padding: 15px;
        border-radius: 6px;
        margin: 20px 0;
      }
      .footer {
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #e2e8f0;
        color: #64748b;
        font-size: 14px;
      }
    </style>
  `;

  if (data.type === 'receipt') {
    subject = `Application Received - KIMUN 2025`;
    body = `
      <div class="email-container">
        ${baseStyle}
        <h2 class="header">✅ Application Received!</h2>
        <p>Dear ${data.name || 'Applicant'},</p>
        <p>Thank you for applying to be a part of the KIMUN 2025 ${data.role || 'Staff'}. We have successfully received your application!</p>
        <div class="content-box">
          <p style="margin: 0;"><strong>Application Details:</strong></p>
          <ul style="margin-top: 10px; padding-left: 20px;">
            <li>Position: ${data.role || 'Staff'}</li>
            <li>Application Date: ${new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}</li>
            <li>Reference ID: KIMUN-${Date.now().toString().slice(-6)}</li>
          </ul>
        </div>
        <p>Our Secretariat will review your responses and get back to you shortly regarding the next steps.</p>
        <div class="footer">
          <p>Best Regards,</p>
          <p><strong>The KIMUN Organizing Committee</strong></p>
          <p style="font-size: 12px; color: #94a3b8; margin-top: 10px;">This is an automated message, please do not reply directly to this email.</p>
        </div>
      </div>
    `;
  }
  else if (data.type === 'status_update') {
    const formattedStatus = (data.status || 'updated').charAt(0).toUpperCase() + (data.status || 'updated').slice(1);
    subject = `Application Status Update: ${formattedStatus} - KIMUN 2025`;

    let statusMessage = '';
    let statusColor = '#4f46e5';
    let statusEmoji = '📋';

    if (data.status === 'interview') {
      statusMessage = 'We would like to invite you for an interview. Our team will contact you shortly to schedule a convenient time.';
      statusColor = '#f59e0b';
      statusEmoji = '🎯';
    } else if (data.status === 'onboarding') {
      statusMessage = 'Congratulations! You have moved to the onboarding phase. We will send you further instructions and welcome materials soon.';
      statusColor = '#10b981';
      statusEmoji = '🚀';
    } else if (data.status === 'welcomed') {
      statusMessage = 'Welcome aboard! Your onboarding is complete and you are officially part of the KIMUN team. We look forward to working with you!';
      statusColor = '#10b981';
      statusEmoji = '🎉';
    } else if (data.status === 'rejected') {
      statusMessage = 'Thank you for your interest in KIMUN. Unfortunately, we are unable to move forward with your application at this time. We encourage you to apply for future opportunities and wish you the best in your future endeavors.';
      statusColor = '#ef4444';
      statusEmoji = '📧';
    } else {
      statusMessage = `Your application status has been changed to: ${formattedStatus}.`;
      statusEmoji = '📝';
    }

    body = `
      <div class="email-container">
        ${baseStyle}
        <h2 class="header">${statusEmoji} Application Status Update</h2>
        <p>Dear ${data.name || 'Applicant'},</p>
        <p>There is an update regarding your application for KIMUN 2025 ${data.role ? `(${data.role})` : ''}.</p>
        <div class="content-box" style="border-left: 4px solid ${statusColor};">
          <p style="margin: 0;"><strong>Current Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${formattedStatus}</span></p>
          <p style="margin: 10px 0 0 0;">${statusMessage}</p>
        </div>
        <p>If you have any questions, please feel free to reach out to us.</p>
        <div class="footer">
          <p>Best Regards,</p>
          <p><strong>The KIMUN Secretariat</strong></p>
        </div>
      </div>
    `;
  }
  else if (data.type === 'task_added' || data.type === 'task_updated') {
    const action = data.type === 'task_added' ? 'New Task Assigned' : 'Task Updated';
    const emoji = data.type === 'task_added' ? '📋' : '📝';
    subject = data.type === 'task_added' ? `New Task: ${data.taskTitle}` : `Task Updated: ${data.taskTitle}`;

    body = `
      <div class="email-container">
        ${baseStyle}
        <h2 class="header">${emoji} ${action}</h2>
        <p>Dear ${data.name || 'Team Member'},</p>
        <p>You have an update regarding a task on the Oasis Dashboard.</p>
        <div class="content-box">
          <p style="margin: 0;"><strong>Task:</strong> ${data.taskTitle || 'Untitled Task'}</p>
          ${data.taskDescription ? `<p style="margin: 10px 0 0 0;"><strong>Description:</strong> ${data.taskDescription}</p>` : ''}
          <p style="margin: 10px 0 0 0;"><strong>Status:</strong> ${data.type === 'task_added' ? 'New' : 'Updated'}</p>
        </div>
        <p>Please log in to the KIMUN Oasis Dashboard to view and manage this task.</p>
        <div class="footer">
          <p>Best Regards,</p>
          <p><strong>The KIMUN Secretariat</strong></p>
        </div>
      </div>
    `;
  }
  else if (data.type === 'broadcast') {
    subject = `📢 Announcement: ${data.broadcastTitle}`;
    // For broadcast, we'll send individually, so use the first email for the to field
    // But we'll handle this in the main function
    toField = data.emails?.[0] || '';

    body = `
      <div class="email-container" style="border-color: #ea580c;">
        ${baseStyle}
        <h2 style="color: #ea580c; font-size: 24px; font-weight: 600;">📢 Bulletin Broadcast</h2>
        <div style="background-color: #fff7ed; padding: 20px; border-radius: 6px; margin: 20px 0; border: 1px solid #ffedd5;">
          <h3 style="margin: 0; color: #9a3412; font-size: 20px;">${data.broadcastTitle}</h3>
          <div style="margin: 15px 0 0 0; color: #431407; white-space: pre-wrap; line-height: 1.6;">
            ${data.broadcastContent}
          </div>
        </div>
        <p>Please log in to the KIMUN Oasis Dashboard for more details and updates.</p>
        <div class="footer">
          <p>Best Regards,</p>
          <p><strong>The KIMUN Secretariat</strong></p>
          <p style="font-size: 12px; color: #94a3b8; margin-top: 10px;">This is a broadcast message sent to all team members.</p>
        </div>
      </div>
    `;
  }

  return { subject, body, toField };
}