import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';

interface MeetingEmailPayload {
  type: 'meeting_invite' | 'meeting_mom';
  recipients: Array<{ name: string; email: string }>;
  meeting: {
    id: string;
    title: string;
    department?: string;
    type?: string;
    dateTime: string;
    durationMinutes?: number;
    meetingPlatform?: string;
    meetingLink?: string;
    venue?: string;
    hostName?: string;
    hostEmail?: string;
    agenda?: Array<{ topic: string; presenter?: string; duration?: string; notes?: string }> | string;
    mom?: {
      summary?: string;
      keyDiscussions?: string[];
      decisions?: string[];
      actionItems?: Array<{ task: string; assignee: string; dueDate?: string; priority?: string; status?: string }>;
      recordedBy?: string;
      publishedAt?: number;
    };
    attendanceStats?: {
      presentCount: number;
      absentCount: number;
      totalCount: number;
    };
  };
}

export async function POST(req: Request) {
  try {
    const payload: MeetingEmailPayload = await req.json();
    const { type, recipients, meeting } = payload;

    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No recipients provided' },
        { status: 400 }
      );
    }

    const validRecipients = recipients
      .map(r => ({ name: r.name || 'Team Member', email: (r.email || '').trim() }))
      .filter(r => r.email && r.email.includes('@'));

    if (validRecipients.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid recipient email addresses found' },
        { status: 400 }
      );
    }

    // Format formatted date
    const meetingDateFormatted = meeting.dateTime
      ? new Date(meeting.dateTime).toLocaleString('en-IN', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short'
        })
      : 'Date TBA';

    let subject = '';
    let htmlContent = '';

    if (type === 'meeting_invite') {
      subject = `📅 [KIMUN 2026] Meeting Invitation: ${meeting.title}`;
      
      const agendaItems = Array.isArray(meeting.agenda) ? meeting.agenda : [];
      const agendaHtml = agendaItems.length > 0
        ? agendaItems
            .map(
              (item, i) => `
              <tr style="border-bottom: 1px solid #e2e8f0;">
                <td style="padding: 10px 12px; font-weight: 600; color: #4338ca; width: 32px;">${i + 1}.</td>
                <td style="padding: 10px 12px; color: #1e293b;">
                  <strong>${escapeHtml(item.topic)}</strong>
                  ${item.notes ? `<div style="font-size: 12px; color: #64748b; margin-top: 3px;">${escapeHtml(item.notes)}</div>` : ''}
                </td>
                <td style="padding: 10px 12px; font-size: 12px; color: #475569; white-space: nowrap;">${item.presenter ? escapeHtml(item.presenter) : 'General'}</td>
                <td style="padding: 10px 12px; font-size: 12px; color: #64748b; text-align: right; white-space: nowrap;">${item.duration ? escapeHtml(item.duration) : '--'}</td>
              </tr>
            `
            )
            .join('')
        : `<tr><td colspan="4" style="padding: 14px; text-align: center; color: #94a3b8; font-style: italic;">No specific agenda items registered. Open floor discussion.</td></tr>`;

      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${escapeHtml(meeting.title)}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 28px 16px; color: #0f172a;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08);">
            <!-- Top Gradient Accent Bar -->
            <div style="height: 5px; background: linear-gradient(90deg, #f59e0b 0%, #6366f1 50%, #4338ca 100%);"></div>

            <!-- Header -->
            <div style="background: linear-gradient(145deg, #090d16 0%, #111827 50%, #1e1b4b 100%); padding: 36px 30px 30px; text-align: center; color: #ffffff;">
              <div style="display: inline-block; padding: 5px 16px; background: rgba(99, 102, 241, 0.18); border: 1px solid rgba(165, 180, 252, 0.35); border-radius: 9999px; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 800; color: #c7d2fe; margin-bottom: 14px;">
                KIMUN 2026 • OFFICIAL SECRETARIAT
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; line-height: 1.35; letter-spacing: -0.3px;">
                ${escapeHtml(meeting.title)}
              </h1>
              <div style="margin-top: 14px;">
                <span style="display: inline-block; margin: 2px 4px; padding: 4px 12px; background: rgba(255,255,255,0.12); border-radius: 6px; font-size: 11.5px; font-weight: 700; color: #e0e7ff;">
                  ${escapeHtml(meeting.department || 'All Departments')}
                </span>
                <span style="display: inline-block; margin: 2px 4px; padding: 4px 12px; background: rgba(255,255,255,0.08); border-radius: 6px; font-size: 11.5px; font-weight: 600; color: #cbd5e1;">
                  ${escapeHtml(meeting.type || 'Official Sync')}
                </span>
              </div>
            </div>

            <!-- Key Info Box -->
            <div style="padding: 28px 28px 24px;">
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px 22px; margin-bottom: 26px;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 7px 0; font-size: 13px; color: #64748b; width: 120px; font-weight: 600;">📅 Date & Time:</td>
                    <td style="padding: 7px 0; font-size: 14px; font-weight: 700; color: #0f172a;">${meetingDateFormatted}</td>
                  </tr>
                  <tr>
                    <td style="padding: 7px 0; font-size: 13px; color: #64748b; font-weight: 600;">⏱️ Duration:</td>
                    <td style="padding: 7px 0; font-size: 14px; font-weight: 600; color: #334155;">${meeting.durationMinutes || 45} Minutes</td>
                  </tr>
                  <tr>
                    <td style="padding: 7px 0; font-size: 13px; color: #64748b; font-weight: 600;">📍 Platform:</td>
                    <td style="padding: 7px 0; font-size: 14px; font-weight: 700; color: #4338ca;">
                      ${escapeHtml(meeting.meetingPlatform || 'Online Video Conference')}
                      ${meeting.venue ? ` <span style="font-weight: normal; color: #64748b;">(${escapeHtml(meeting.venue)})</span>` : ''}
                    </td>
                  </tr>
                  ${meeting.hostName ? `
                  <tr>
                    <td style="padding: 7px 0; font-size: 13px; color: #64748b; font-weight: 600;">👤 Organized By:</td>
                    <td style="padding: 7px 0; font-size: 14px; font-weight: 600; color: #334155;">${escapeHtml(meeting.hostName)}</td>
                  </tr>` : ''}
                </table>
              </div>

              <!-- CTA Join Button -->
              ${meeting.meetingLink ? `
              <div style="text-align: center; margin: 26px 0;">
                <a href="${escapeHtml(meeting.meetingLink)}" target="_blank" style="display: inline-block; background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%); color: #ffffff; text-decoration: none; padding: 14px 34px; border-radius: 12px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 14px rgba(79, 70, 229, 0.35);">
                  👉 Join Meeting Room
                </a>
                <div style="font-size: 11px; color: #64748b; margin-top: 10px;">
                  Direct Link: <a href="${escapeHtml(meeting.meetingLink)}" style="color: #4f46e5; text-decoration: underline;">${escapeHtml(meeting.meetingLink)}</a>
                </div>
              </div>` : ''}

              <!-- Agenda Section -->
              <div style="margin-top: 28px;">
                <h3 style="font-size: 14.5px; font-weight: 800; color: #0f172a; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.5px;">
                  📋 Pre-Meeting Agenda
                </h3>
                <table style="width: 100%; border-collapse: collapse; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; font-size: 13px;">
                  <thead>
                    <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; color: #475569; text-align: left;">
                      <th style="padding: 9px 12px; width: 32px;">#</th>
                      <th style="padding: 9px 12px;">Topic</th>
                      <th style="padding: 9px 12px;">Lead</th>
                      <th style="padding: 9px 12px; text-align: right;">Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${agendaHtml}
                  </tbody>
                </table>
              </div>

              <!-- Important Note -->
              <div style="margin-top: 24px; padding: 14px 16px; background-color: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 8px; font-size: 12px; color: #92400e; line-height: 1.55;">
                <strong>Attendance Notice:</strong> Official attendance will be recorded on OASIS during this sync. Please join promptly on time.
              </div>
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
    } else if (type === 'meeting_mom') {
      subject = `📝 [KIMUN 2026] Minutes of Meeting (MoM): ${meeting.title}`;

      const mom = meeting.mom || {};
      const keyDiscussions = mom.keyDiscussions || [];
      const decisions = mom.decisions || [];
      const actionItems = mom.actionItems || [];

      const discussionsHtml = keyDiscussions.length > 0
        ? keyDiscussions.map(d => `<li style="margin-bottom: 7px; color: #334155; line-height: 1.55;">${escapeHtml(d)}</li>`).join('')
        : '<li style="color: #94a3b8; font-style: italic;">No specific discussion points logged.</li>';

      const decisionsHtml = decisions.length > 0
        ? decisions.map(d => `<li style="margin-bottom: 7px; color: #047857; font-weight: 600; line-height: 1.55;">✅ ${escapeHtml(d)}</li>`).join('')
        : '<li style="color: #94a3b8; font-style: italic;">No formal decisions recorded.</li>';

      const actionItemsHtml = actionItems.length > 0
        ? actionItems.map((item, i) => `
            <tr style="border-bottom: 1px solid #e2e8f0;">
              <td style="padding: 10px 12px; font-weight: 700; color: #047857;">${i + 1}</td>
              <td style="padding: 10px 12px; color: #0f172a; font-weight: 600;">${escapeHtml(item.task)}</td>
              <td style="padding: 10px 12px; color: #334155;">${escapeHtml(item.assignee || 'Unassigned')}</td>
              <td style="padding: 10px 12px; color: #64748b; font-size: 12px;">${item.dueDate ? escapeHtml(item.dueDate) : 'Immediate'}</td>
              <td style="padding: 10px 12px; text-align: right;">
                <span style="display: inline-block; padding: 2px 8px; border-radius: 9999px; font-size: 11px; font-weight: 700; ${
                  item.priority === 'High' ? 'background: #fee2e2; color: #b91c1c;' :
                  item.priority === 'Low' ? 'background: #f1f5f9; color: #475569;' :
                  'background: #fef3c7; color: #92400e;'
                }">
                  ${escapeHtml(item.priority || 'Medium')}
                </span>
              </td>
            </tr>
          `).join('')
        : `<tr><td colspan="5" style="padding: 14px; text-align: center; color: #94a3b8; font-style: italic;">No pending action items created.</td></tr>`;

      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>MoM: ${escapeHtml(meeting.title)}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 28px 16px; color: #0f172a;">
          <div style="max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08);">
            <!-- Top Gradient Accent Bar -->
            <div style="height: 5px; background: linear-gradient(90deg, #10b981 0%, #059669 50%, #047857 100%);"></div>

            <!-- Header -->
            <div style="background: linear-gradient(145deg, #022c22 0%, #064e3b 50%, #065f46 100%); padding: 36px 30px 30px; text-align: center; color: #ffffff;">
              <div style="display: inline-block; padding: 5px 16px; background: rgba(16, 185, 129, 0.2); border: 1px solid rgba(167, 243, 208, 0.35); border-radius: 9999px; font-size: 11px; text-transform: uppercase; letter-spacing: 2px; font-weight: 800; color: #a7f3d0; margin-bottom: 14px;">
                KIMUN 2026 • OFFICIAL MINUTES OF MEETING (MoM)
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; line-height: 1.35; letter-spacing: -0.3px;">
                ${escapeHtml(meeting.title)}
              </h1>
              <div style="margin-top: 12px; font-size: 12px; color: #d1fae5;">
                Conducted: ${meetingDateFormatted} • Recorded by: ${escapeHtml(mom.recordedBy || meeting.hostName || 'Secretariat')}
              </div>
            </div>

            <!-- Content Area -->
            <div style="padding: 28px;">
              <!-- Executive Summary -->
              ${mom.summary ? `
              <div style="margin-bottom: 26px;">
                <h3 style="font-size: 13.5px; text-transform: uppercase; letter-spacing: 1px; color: #047857; margin-bottom: 10px; font-weight: 800;">
                  📌 Executive Summary
                </h3>
                <div style="background-color: #f8fafc; border-left: 4px solid #059669; padding: 16px 18px; border-radius: 8px; font-size: 13.5px; line-height: 1.65; color: #334155;">
                  ${escapeHtml(mom.summary).replace(/\n/g, '<br/>')}
                </div>
              </div>` : ''}

              <!-- Key Decisions -->
              <div style="margin-bottom: 26px;">
                <h3 style="font-size: 13.5px; text-transform: uppercase; letter-spacing: 1px; color: #047857; margin-bottom: 10px; font-weight: 800;">
                  🎯 Key Decisions Ratified
                </h3>
                <ul style="margin: 0; padding-left: 20px; font-size: 13.5px; line-height: 1.55;">
                  ${decisionsHtml}
                </ul>
              </div>

              <!-- Discussion Notes -->
              <div style="margin-bottom: 26px;">
                <h3 style="font-size: 13.5px; text-transform: uppercase; letter-spacing: 1px; color: #0f172a; margin-bottom: 10px; font-weight: 800;">
                  💬 Key Discussions & Highlights
                </h3>
                <ul style="margin: 0; padding-left: 20px; font-size: 13.5px; line-height: 1.55;">
                  ${discussionsHtml}
                </ul>
              </div>

              <!-- Action Items Table -->
              <div style="margin-bottom: 26px;">
                <h3 style="font-size: 13.5px; text-transform: uppercase; letter-spacing: 1px; color: #0f172a; margin-bottom: 12px; font-weight: 800;">
                  ⚡ Action Items & Assignees
                </h3>
                <table style="width: 100%; border-collapse: collapse; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; font-size: 13px;">
                  <thead>
                    <tr style="background-color: #f8fafc; border-bottom: 1px solid #e2e8f0; color: #334155; text-align: left;">
                      <th style="padding: 9px 12px; width: 28px;">#</th>
                      <th style="padding: 9px 12px;">Task</th>
                      <th style="padding: 9px 12px;">Assignee</th>
                      <th style="padding: 9px 12px;">Deadline</th>
                      <th style="padding: 9px 12px; text-align: right;">Priority</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${actionItemsHtml}
                  </tbody>
                </table>
              </div>

              <!-- Attendance Stats -->
              ${meeting.attendanceStats ? `
              <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 10px; padding: 14px 18px; font-size: 12.5px; color: #475569; display: flex; justify-content: space-between; align-items: center;">
                <span>👥 Attendance Record: <strong>${meeting.attendanceStats.presentCount} Present</strong> / ${meeting.attendanceStats.totalCount} Invited</span>
                <span style="background: #e2e8f0; padding: 3px 10px; border-radius: 9999px; font-weight: 700; color: #0f172a;">
                  Rate: ${Math.round((meeting.attendanceStats.presentCount / (meeting.attendanceStats.totalCount || 1)) * 100)}%
                </span>
              </div>` : ''}
            </div>

            <!-- Footer -->
            <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 22px 28px; text-align: center;">
              <div style="font-size: 12px; font-weight: 800; color: #0f172a; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px;">KIMUN Secretariat</div>
              <div style="font-size: 11px; color: #64748b; line-height: 1.5;">
                Published via <strong>OASIS KIMUN 2026</strong> System.<br/>
                All assigned team members are requested to complete their deliverables on schedule.
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
    }

    // Now dispatch emails using available transporter
    let sendMethod = 'none';
    let sentCount = 0;
    const errors: string[] = [];

    const emailList = validRecipients.map(r => r.email);

    // Option A: Try Resend if configured
    if (process.env.RESEND_API_KEY) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        const fromAddress = process.env.RESEND_FROM || 'KIMUN Secretariat <onboarding@resend.dev>';

        // Resend batch or single
        for (const recipient of validRecipients) {
          try {
            await resend.emails.send({
              from: fromAddress,
              to: recipient.email,
              subject: subject,
              html: htmlContent
            });
            sentCount++;
          } catch (err: any) {
            errors.push(`Resend error for ${recipient.email}: ${err.message}`);
          }
        }
        sendMethod = 'resend';
      } catch (e: any) {
        errors.push(`Resend initialization failed: ${e.message}`);
      }
    }

    // Option B: Try Nodemailer SMTP if Resend not used or failed
    if (sentCount === 0 && process.env.SMTP_USER && process.env.SMTP_PASS) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.titan.email',
          port: Number(process.env.SMTP_PORT) || 465,
          secure: true,
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });

        const senderEmail = process.env.SMTP_USER;
        for (const recipient of validRecipients) {
          try {
            await transporter.sendMail({
              from: `"KIMUN Secretariat" <${senderEmail}>`,
              to: recipient.email,
              subject: subject,
              html: htmlContent
            });
            sentCount++;
          } catch (err: any) {
            errors.push(`SMTP error for ${recipient.email}: ${err.message}`);
          }
        }
        sendMethod = 'smtp';
      } catch (e: any) {
        errors.push(`SMTP initialization failed: ${e.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      sentCount,
      totalRecipients: validRecipients.length,
      sendMethod,
      errors: errors.length > 0 ? errors : undefined,
      subject,
      previewHtml: htmlContent
    });
  } catch (error: any) {
    console.error('Error in /api/send-meeting:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Unknown server error' },
      { status: 500 }
    );
  }
}

function escapeHtml(str: string = ''): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
