// app/api/sendApplicationEmail/route.ts
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

interface ApplicationEmailData {
  email?: string;
  name?: string;
  type: 'receipt' | 'status_update' | 'task_added' | 'task_updated' | 'task_status_changed' | 'task_completed' | 'task_claimed' | 'task_verified' | 'broadcast';
  role?: string;
  status?: string;
  taskTitle?: string;
  taskDescription?: string;
  taskStatus?: string;
  taskPriority?: string;
  taskDueDate?: string;
  awardedPoints?: number;
  updatedBy?: string;
  broadcastTitle?: string;
  broadcastContent?: string;
  emails?: string[];
}

export async function POST(req: Request) {
  console.log('📧 Email API called');

  // Check for API key
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY is not set');
    return NextResponse.json(
      {
        success: false,
        error: "Server configuration error: RESEND_API_KEY not configured",
        details: "Please set RESEND_API_KEY in environment variables"
      },
      { status: 500 }
    );
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    // Parse request body
    let data: ApplicationEmailData;
    try {
      data = await req.json();
      console.log('📝 Request data:', { type: data.type, email: data.email || 'broadcast' });
    } catch (parseError) {
      console.error('❌ Failed to parse JSON:', parseError);
      return NextResponse.json(
        { success: false, error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!data.type) {
      console.error('❌ Missing type field');
      return NextResponse.json(
        { success: false, error: "Missing required field: type" },
        { status: 400 }
      );
    }

    // Validate email for non-broadcast types
    if (data.type !== 'broadcast' && !data.email) {
      console.error('❌ Missing email for type:', data.type);
      return NextResponse.json(
        { success: false, error: "Missing required field: email" },
        { status: 400 }
      );
    }

    // Validate broadcast data
    if (data.type === 'broadcast') {
      if (!data.broadcastTitle || !data.broadcastContent) {
        console.error('❌ Broadcast missing title or content');
        return NextResponse.json(
          { success: false, error: "Broadcast requires title and content" },
          { status: 400 }
        );
      }
      if (!data.emails || data.emails.length === 0) {
        console.error('❌ Broadcast missing recipients');
        return NextResponse.json(
          { success: false, error: "Broadcast requires at least one recipient email" },
          { status: 400 }
        );
      }
    }

    // Generate email content
    const { subject, body, toField } = generateEmailContent(data);
    console.log('📧 Generated email:', { subject, recipient: toField || 'broadcast' });

    // Use Resend domain or fallback
    const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';
    console.log('📧 Sending from:', fromEmail);

    // Handle broadcast emails
    if (data.type === 'broadcast' && data.emails) {
      console.log(`📨 Sending broadcast to ${data.emails.length} recipients`);

      const emailPromises = data.emails.map(email => {
        return resend.emails.send({
          from: `KIMUN Team <${fromEmail}>`,
          to: email.trim(),
          subject: subject,
          html: body,
          text: body.replace(/<[^>]*>?/gm, ''),
        });
      });

      const results = await Promise.allSettled(emailPromises);

      const fulfilled = results.filter(r => r.status === 'fulfilled');
      const rejected = results.filter(r => r.status === 'rejected');

      console.log(`✅ ${fulfilled.length} emails sent, ❌ ${rejected.length} failed`);

      if (rejected.length > 0) {
        console.error('❌ Failed emails:', rejected.map(r => (r as PromiseRejectedResult).reason));
      }

      return NextResponse.json({
        success: true,
        sent: fulfilled.length,
        failed: rejected.length,
        message: `Sent to ${fulfilled.length} of ${data.emails.length} recipients`
      });
    }

    // Send single email
    console.log('📨 Sending single email to:', toField || data.email);

    const { data: emailData, error } = await resend.emails.send({
      from: `KIMUN Team <${fromEmail}>`,
      to: toField || data.email || '',
      subject: subject,
      html: body,
      text: body.replace(/<[^>]*>?/gm, ''),
    });

    if (error) {
      console.error('❌ Resend API error:', error);
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          details: error
        },
        { status: 500 }
      );
    }

    console.log('✅ Email sent successfully:', emailData?.id);
    return NextResponse.json({
      success: true,
      id: emailData?.id,
      message: 'Email sent successfully'
    });

  } catch (error) {
    console.error('❌ Email API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email',
        details: error instanceof Error ? error.stack : undefined
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

  const renderEmailWrapper = ({
    title,
    badgeText,
    badgeBg = 'rgba(99, 102, 241, 0.2)',
    badgeColor = '#c7d2fe',
    accentGradient = 'linear-gradient(90deg, #f59e0b 0%, #6366f1 50%, #4338ca 100%)',
    contentHtml
  }: {
    title: string;
    badgeText: string;
    badgeBg?: string;
    badgeColor?: string;
    accentGradient?: string;
    contentHtml: string;
  }) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${escapeHtml(title)}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 28px 16px; color: #0f172a;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08);">
        <!-- Top Gradient Accent Bar -->
        <div style="height: 5px; background: ${accentGradient};"></div>

        <!-- Header -->
        <div style="background: linear-gradient(145deg, #090d16 0%, #111827 50%, #1e1b4b 100%); padding: 36px 30px 28px; text-align: center; color: #ffffff;">
          <div style="display: inline-block; padding: 5px 16px; background: ${badgeBg}; border: 1px solid rgba(165, 180, 252, 0.35); border-radius: 9999px; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 800; color: ${badgeColor}; margin-bottom: 14px;">
            ${badgeText}
          </div>
          <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; line-height: 1.35; letter-spacing: -0.3px;">
            ${title}
          </h1>
        </div>

        <!-- Body Content -->
        <div style="padding: 28px 28px 24px;">
          ${contentHtml}
        </div>

        <!-- Footer -->
        <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 22px 28px; text-align: center;">
          <div style="font-size: 12px; font-weight: 800; color: #0f172a; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px;">KIMUN Secretariat</div>
          <div style="font-size: 11px; color: #64748b; line-height: 1.5;">
            Official Operational Communication • OASIS KIMUN System<br/>
            Bhubaneswar, India
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  if (data.type === 'receipt') {
    subject = `✅ Application Received - KIMUN 2026`;
    body = renderEmailWrapper({
      title: 'Application Successfully Received',
      badgeText: 'KIMUN 2026 • RECRUITMENT',
      contentHtml: `
        <p style="font-size: 15px; margin-top: 0; color: #1e293b;">Dear <strong>${escapeHtml(data.name || 'Applicant')}</strong>,</p>
        <p style="color: #475569; line-height: 1.6;">Thank you for applying to be a part of <strong>KIMUN 2026</strong> ${data.role ? `(${escapeHtml(data.role)})` : ''}. We have successfully recorded your submission in the Secretariat database.</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; margin: 20px 0;">
          <div style="font-weight: 700; font-size: 13px; color: #0f172a; margin-bottom: 8px;">Application Summary:</div>
          <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <tr>
              <td style="padding: 4px 0; color: #64748b; width: 110px;">Position:</td>
              <td style="padding: 4px 0; font-weight: 600; color: #0f172a;">${escapeHtml(data.role || 'OC Member')}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Date:</td>
              <td style="padding: 4px 0; color: #334155;">${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Reference:</td>
              <td style="padding: 4px 0; font-family: monospace; font-weight: 700; color: #4338ca;">KIMUN-${Date.now().toString().slice(-6)}</td>
            </tr>
          </table>
        </div>

        <p style="color: #475569; line-height: 1.6;">Our Secretariat board will review your profile and contact you regarding the subsequent rounds and onboarding.</p>
      `
    });
  } else if (data.type === 'status_update') {
    const formattedStatus = (data.status || 'updated').charAt(0).toUpperCase() + (data.status || 'updated').slice(1);
    subject = `Application Status Update: ${formattedStatus} - KIMUN 2026`;

    let statusMessage = '';
    let statusColor = '#4338ca';
    let statusEmoji = '📋';

    if (data.status === 'interview') {
      statusMessage = 'We would like to invite you for an interview. Our Secretariat team will contact you shortly to schedule your slot.';
      statusColor = '#d97706';
      statusEmoji = '🎯';
    } else if (data.status === 'onboarding') {
      statusMessage = 'Congratulations! You have been shortlisted for onboarding into the KIMUN 2026 team. Welcome materials will follow shortly.';
      statusColor = '#059669';
      statusEmoji = '🚀';
    } else if (data.status === 'welcomed') {
      statusMessage = 'Welcome to the team! Your onboarding is complete and you are officially ratified as a member of KIMUN 2026.';
      statusColor = '#059669';
      statusEmoji = '🎉';
    } else if (data.status === 'rejected') {
      statusMessage = 'Thank you for your application to KIMUN. While we cannot offer you a position at this moment due to limited capacity, we sincerely appreciate your interest.';
      statusColor = '#e11d48';
      statusEmoji = '✉️';
    } else {
      statusMessage = `Your application status has been updated to: ${formattedStatus}.`;
      statusEmoji = '📝';
    }

    body = renderEmailWrapper({
      title: `${statusEmoji} Application Status: ${formattedStatus}`,
      badgeText: 'KIMUN 2026 • ONBOARDING',
      contentHtml: `
        <p style="font-size: 15px; margin-top: 0; color: #1e293b;">Dear <strong>${escapeHtml(data.name || 'Applicant')}</strong>,</p>
        <p style="color: #475569; line-height: 1.6;">There is an official status update regarding your application for <strong>KIMUN 2026</strong> ${data.role ? `(${escapeHtml(data.role)})` : ''}.</p>
        
        <div style="background-color: #f8fafc; border-left: 4px solid ${statusColor}; border-radius: 8px; padding: 18px 20px; margin: 20px 0; border-top: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0;">
          <div style="margin-bottom: 8px;">
            <span style="font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #64748b; font-weight: 700;">Current Decision:</span>
            <div style="font-size: 17px; font-weight: 800; color: ${statusColor}; margin-top: 2px;">${formattedStatus}</div>
          </div>
          <p style="margin: 10px 0 0; color: #334155; line-height: 1.6;">${statusMessage}</p>
        </div>

        <p style="color: #64748b; font-size: 13px;">For any queries regarding this update, please reach out to the Secretariat.</p>
      `
    });
  } else if (data.type === 'task_added' || data.type === 'task_updated' || data.type === 'task_status_changed' || data.type === 'task_completed' || data.type === 'task_claimed' || data.type === 'task_verified') {
    let action = 'Task Update';
    let emoji = '📋';
    let headerColor = '#4338ca';

    if (data.type === 'task_added') {
      action = 'New Task Assigned';
      emoji = '📋';
      headerColor = '#2563eb';
    } else if (data.type === 'task_updated') {
      action = 'Task Details Updated';
      emoji = '📝';
      headerColor = '#4f46e5';
    } else if (data.type === 'task_status_changed') {
      action = `Task Status: ${(data.taskStatus || 'Updated').replace('_', ' ').toUpperCase()}`;
      emoji = '🔄';
      headerColor = '#d97706';
    } else if (data.type === 'task_completed') {
      action = 'Task Completed!';
      emoji = '✅';
      headerColor = '#059669';
    } else if (data.type === 'task_claimed') {
      action = 'Task Claimed';
      emoji = '🤝';
      headerColor = '#7c3aed';
    } else if (data.type === 'task_verified') {
      action = 'Task Verified & Points Awarded';
      emoji = '🏆';
      headerColor = '#059669';
    }

    subject = `${emoji} [KIMUN OASIS] ${action}: ${data.taskTitle || 'Task'}`;
    const formattedTaskStatus = (data.taskStatus || 'Todo').replace('_', ' ');

    body = renderEmailWrapper({
      title: `${emoji} ${action}`,
      badgeText: 'KIMUN 2026 • OASIS WORKPLACE',
      contentHtml: `
        <p style="font-size: 15px; margin-top: 0; color: #1e293b;">Dear <strong>${escapeHtml(data.name || 'Team Member')}</strong>,</p>
        <p style="color: #475569; line-height: 1.6;">You have a live update regarding a deliverable on the <strong>OASIS KIMUN</strong> platform.</p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
          <div style="font-size: 16px; font-weight: 800; color: #0f172a; margin-bottom: 6px;">
            ${escapeHtml(data.taskTitle || 'Untitled Task')}
          </div>
          ${data.taskDescription ? `<p style="margin: 0 0 14px; color: #475569; font-size: 13.5px; line-height: 1.55;">${escapeHtml(data.taskDescription)}</p>` : ''}

          <table style="width: 100%; border-collapse: collapse; font-size: 12.5px; margin-top: 10px;">
            <tr>
              <td style="padding: 5px 0; color: #64748b; width: 100px;">Status:</td>
              <td style="padding: 5px 0; font-weight: 700; color: #0f172a; text-transform: uppercase;">${escapeHtml(formattedTaskStatus)}</td>
            </tr>
            ${data.taskPriority ? `
            <tr>
              <td style="padding: 5px 0; color: #64748b;">Priority:</td>
              <td style="padding: 5px 0; font-weight: 700; color: ${data.taskPriority === 'High' ? '#b91c1c' : '#4338ca'};">${escapeHtml(data.taskPriority)}</td>
            </tr>` : ''}
            ${data.taskDueDate ? `
            <tr>
              <td style="padding: 5px 0; color: #64748b;">Due Date:</td>
              <td style="padding: 5px 0; font-weight: 600; color: #334155;">${escapeHtml(data.taskDueDate)}</td>
            </tr>` : ''}
            ${data.awardedPoints ? `
            <tr>
              <td style="padding: 5px 0; color: #64748b;">Points:</td>
              <td style="padding: 5px 0; font-weight: 800; color: #059669;">+${data.awardedPoints} pts</td>
            </tr>` : ''}
          </table>
        </div>

        <div style="text-align: center; margin: 24px 0;">
          <a href="https://kimun.in.net/oasis" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%); color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);">
            Open OASIS Task Board
          </a>
        </div>
      `
    });
  } else if (data.type === 'broadcast') {
    subject = `📢 [KIMUN 2026] Bulletin: ${data.broadcastTitle}`;
    toField = data.emails?.[0] || '';

    body = renderEmailWrapper({
      title: '📢 Official Bulletin Broadcast',
      badgeText: 'KIMUN 2026 • GENERAL BROADCAST',
      accentGradient: 'linear-gradient(90deg, #ea580c 0%, #f59e0b 100%)',
      contentHtml: `
        <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
          <h2 style="margin: 0 0 10px; color: #9a3412; font-size: 18px; font-weight: 800;">
            ${escapeHtml(data.broadcastTitle)}
          </h2>
          <div style="color: #431407; font-size: 14px; line-height: 1.65; white-space: pre-wrap;">
            ${escapeHtml(data.broadcastContent)}
          </div>
        </div>

        <div style="text-align: center; margin: 24px 0;">
          <a href="https://kimun.in.net/oasis" style="display: inline-block; background: #ea580c; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 10px; font-weight: 700; font-size: 14px;">
            Open OASIS Bulletin Board
          </a>
        </div>
      `
    });
  }

  return { subject, body, toField };
}

function escapeHtml(str: string = ''): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}