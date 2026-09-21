import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Meeting } from './types';

/**
 * Converts an email or string into a safe Firebase Realtime Database key.
 * Firebase keys cannot contain '.', '#', '$', '/', '[', or ']'.
 */
export function emailToKey(email: string = ''): string {
  return String(email)
    .toLowerCase()
    .trim()
    .replace(/[\.\#\$\/\[\]@]/g, '_');
}

/**
 * Recursively cleans an object/array so that no key contains `undefined`
 * or illegal Firebase characters (., #, $, /, [, ]), which Firebase Realtime
 * Database strictly rejects with an error.
 */
export function sanitizeForFirebase<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as any;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => (item === undefined ? null : sanitizeForFirebase(item))) as any;
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        // Firebase keys cannot contain ., #, $, /, [, or ]
        const safeKey = key.replace(/[\.\#\$\/\[\]]/g, '_');
        cleaned[safeKey] = sanitizeForFirebase(value);
      }
    }
    return cleaned;
  }
  return obj;
}

/**
 * Resolves audience members list (names, emails, phones) from database applications.
 */
export function resolveMeetingRecipients(
  meeting: Meeting,
  dbApplications: any[] = [],
  dbEbApplications: any[] = []
): Array<{ name: string; email: string; phone?: string; department?: string; role?: string }> {
  const map = new Map<string, { name: string; email: string; phone?: string; department?: string; role?: string }>();

  const addPerson = (person: any, defaultRole = 'OC Member') => {
    if (!person || !person.email) return;
    const email = person.email.trim().toLowerCase();
    if (!map.has(email)) {
      map.set(email, {
        name: person.name || 'Member',
        email: person.email.trim(),
        phone: person.phone || person.contact || person.whatsapp,
        department: person.department || person.pref1 || 'General',
        role: person.role || defaultRole
      });
    }
  };

  if (meeting.targetAudience === 'all_oc') {
    dbApplications.forEach(app => addPerson(app, 'OC Member'));
  } else if (meeting.targetAudience === 'eb') {
    dbEbApplications.forEach(app => addPerson(app, 'Executive Board'));
  } else if (meeting.targetAudience === 'secretariat') {
    dbApplications
      .filter(app => {
        const dept = (app.department || app.pref1 || '').toLowerCase();
        const role = (app.role || '').toLowerCase();
        return dept.includes('secretariat') || role.includes('secretariat') || role.includes('secretary') || role.includes('lead');
      })
      .forEach(app => addPerson(app, 'Secretariat'));
  } else if (meeting.targetAudience === 'department') {
    const deptFilter = meeting.department.toLowerCase();
    dbApplications
      .filter(app => {
        const d1 = (app.department || '').toLowerCase();
        const d2 = (app.pref1 || '').toLowerCase();
        return d1.includes(deptFilter) || d2.includes(deptFilter) || deptFilter.includes(d1) || deptFilter.includes(d2);
      })
      .forEach(app => addPerson(app, `${meeting.department} Member`));
  } else if (meeting.targetAudience === 'custom') {
    const customList = meeting.customAttendees || [];
    customList.forEach(emailOrId => {
      const match =
        dbApplications.find(a => a.email === emailOrId || a.uid === emailOrId) ||
        dbEbApplications.find(a => a.email === emailOrId || a.uid === emailOrId);
      if (match) {
        addPerson(match);
      } else if (emailOrId.includes('@')) {
        map.set(emailOrId.toLowerCase(), {
          name: emailOrId.split('@')[0],
          email: emailOrId,
          role: 'Invited Member'
        });
      }
    });
  }

  // Fallback: if database has very few records, always ensure host is included
  if (meeting.hostEmail && !map.has(meeting.hostEmail.toLowerCase())) {
    map.set(meeting.hostEmail.toLowerCase(), {
      name: meeting.hostName || 'Host',
      email: meeting.hostEmail,
      role: 'Host'
    });
  }

  return Array.from(map.values());
}

/**
 * Generates formatted WhatsApp broadcast text for meeting invitation
 */
export function generateWhatsAppMeetingInvite(meeting: Meeting): string {
  const formattedDate = meeting.dateTime
    ? new Date(meeting.dateTime).toLocaleString('en-IN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      })
    : 'TBA';

  let text = `📢 *KIMUN 2026 • OFFICIAL MEETING INVITATION*\n\n`;
  text += `📌 *Topic:* ${meeting.title}\n`;
  text += `🏛️ *Audience:* ${meeting.department} (${meeting.type})\n`;
  text += `📅 *Date & Time:* ${formattedDate}\n`;
  text += `⏱️ *Duration:* ${meeting.durationMinutes} mins\n`;
  text += `📍 *Platform / Venue:* ${meeting.meetingPlatform.toUpperCase()}${meeting.venue ? ` - ${meeting.venue}` : ''}\n\n`;

  if (meeting.meetingLink) {
    text += `🔗 *Join Link:* ${meeting.meetingLink}\n\n`;
  }

  if (meeting.agenda && meeting.agenda.length > 0) {
    text += `📋 *Meeting Agenda:*\n`;
    meeting.agenda.forEach((item, idx) => {
      text += `${idx + 1}. *${item.topic}* ${item.presenter ? `(Lead: ${item.presenter})` : ''} ${item.duration ? `[${item.duration}]` : ''}\n`;
      if (item.notes) text += `   ↳ _${item.notes}_\n`;
    });
    text += `\n`;
  }

  text += `👤 *Organized by:* ${meeting.hostName || 'Secretariat'}\n`;
  text += `⚠️ *Note:* Attendance will be actively recorded on OASIS. Please be punctual!\n`;
  text += `\n_KIMUN Secretariat_`;

  return text;
}

/**
 * Generates formatted WhatsApp broadcast text for post-meeting MoM
 */
export function generateWhatsAppMoM(meeting: Meeting): string {
  const mom = meeting.mom;
  const formattedDate = meeting.dateTime
    ? new Date(meeting.dateTime).toLocaleDateString('en-IN', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    : '';

  let text = `📝 *KIMUN 2026 • MINUTES OF MEETING (MoM)*\n`;
  text += `📌 *${meeting.title}*\n`;
  text += `📅 Conducted on: ${formattedDate} | Recorded by: ${mom?.recordedBy || meeting.hostName || 'Secretariat'}\n\n`;

  if (mom?.summary) {
    text += `🔹 *EXECUTIVE SUMMARY:*\n${mom.summary}\n\n`;
  }

  if (mom?.decisions && mom.decisions.length > 0) {
    text += `🎯 *KEY DECISIONS APPROVED:*\n`;
    mom.decisions.forEach(d => {
      text += `✅ ${d}\n`;
    });
    text += `\n`;
  }

  if (mom?.keyDiscussions && mom.keyDiscussions.length > 0) {
    text += `💬 *KEY DISCUSSIONS:*\n`;
    mom.keyDiscussions.forEach(kd => {
      text += `• ${kd}\n`;
    });
    text += `\n`;
  }

  if (mom?.actionItems && mom.actionItems.length > 0) {
    text += `⚡ *ACTION ITEMS & DELIVERABLES:*\n`;
    mom.actionItems.forEach((ai, idx) => {
      text += `${idx + 1}. *${ai.task}*\n`;
      text += `   👤 Assignee: ${ai.assignee || 'Unassigned'}\n`;
      text += `   ⏰ Deadline: ${ai.dueDate || 'Immediate'} [Priority: ${ai.priority}]\n`;
    });
    text += `\n`;
  }

  // Attendance stats
  if (meeting.attendance) {
    const records = Object.values(meeting.attendance);
    const present = records.filter(r => r.status === 'present').length;
    text += `👥 *Attendance:* ${present}/${records.length} members present\n\n`;
  }

  text += `_Please ensure all action items are followed up on schedule._\n`;
  text += `_Access full records on OASIS KIMUN: https://kimun.org/oasis_`;

  return text;
}

/**
 * Generates an official PDF document for the Meeting & MoM
 */
export function generateMeetingMoMPdf(meeting: Meeting) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const mom = meeting.mom;
  const formattedDate = meeting.dateTime
    ? new Date(meeting.dateTime).toLocaleString('en-IN', {
        weekday: 'short',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'N/A';

  // --- Header Banner ---
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(226, 232, 240);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('KIMUN 2026 • OFFICIAL SECRETARIAT RECORD', 14, 12);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text('OFFICIAL MINUTES OF MEETING (MoM)', 14, 22);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`DOC REF: KIMUN/MOM/${meeting.id ? meeting.id.slice(-6).toUpperCase() : 'REC'}`, 150, 12);
  doc.text(`DATE: ${new Date().toLocaleDateString('en-IN')}`, 150, 18);

  // --- Meeting Metadata Box ---
  let currentY = 40;
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, currentY, 182, 34, 3, 3, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(meeting.title, 18, currentY + 8);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  doc.text(`Department: ${meeting.department}`, 18, currentY + 16);
  doc.text(`Type: ${meeting.type}`, 105, currentY + 16);

  doc.text(`Conducted: ${formattedDate}`, 18, currentY + 22);
  doc.text(`Duration: ${meeting.durationMinutes} minutes`, 105, currentY + 22);

  doc.text(`Platform/Venue: ${meeting.meetingPlatform.toUpperCase()}${meeting.venue ? ` (${meeting.venue})` : ''}`, 18, currentY + 28);
  doc.text(`Organizer/Host: ${meeting.hostName || 'Secretariat'}`, 105, currentY + 28);

  currentY += 42;

  // --- Executive Summary ---
  if (mom?.summary) {
    doc.setTextColor(67, 56, 202);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('1. EXECUTIVE SUMMARY', 14, currentY);
    currentY += 5;

    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    const splitSummary = doc.splitTextToSize(mom.summary, 182);
    doc.text(splitSummary, 14, currentY);
    currentY += splitSummary.length * 4.5 + 6;
  }

  // --- Key Decisions ---
  if (mom?.decisions && mom.decisions.length > 0) {
    doc.setTextColor(4, 120, 87);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('2. KEY DECISIONS ADOPTED', 14, currentY);
    currentY += 5;

    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    mom.decisions.forEach((dec) => {
      const splitDec = doc.splitTextToSize(`• ${dec}`, 178);
      doc.text(splitDec, 18, currentY);
      currentY += splitDec.length * 4.2;
    });
    currentY += 5;
  }

  // --- Key Discussions ---
  if (mom?.keyDiscussions && mom.keyDiscussions.length > 0) {
    doc.setTextColor(67, 56, 202);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('3. DISCUSSION HIGHLIGHTS', 14, currentY);
    currentY += 5;

    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    mom.keyDiscussions.forEach((disc) => {
      const splitDisc = doc.splitTextToSize(`• ${disc}`, 178);
      doc.text(splitDisc, 18, currentY);
      currentY += splitDisc.length * 4.2;
    });
    currentY += 6;
  }

  // --- Action Items Table ---
  if (mom?.actionItems && mom.actionItems.length > 0) {
    doc.setTextColor(67, 56, 202);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('4. ACTION ITEMS & DELIVERABLES', 14, currentY);
    currentY += 3;

    const actionTableData = mom.actionItems.map((ai, index) => [
      index + 1,
      ai.task,
      ai.assignee || 'Unassigned',
      ai.dueDate || 'Immediate',
      ai.priority,
      ai.status.toUpperCase()
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Task Description', 'Assignee', 'Due Date', 'Priority', 'Status']],
      body: actionTableData,
      theme: 'grid',
      headStyles: {
        fillColor: [67, 56, 202],
        textColor: 255,
        fontSize: 8.5,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 8,
        cellPadding: 2.5
      },
      columnStyles: {
        0: { cellWidth: 10 },
        1: { cellWidth: 70 },
        2: { cellWidth: 35 },
        3: { cellWidth: 25 },
        4: { cellWidth: 20 },
        5: { cellWidth: 22 }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // --- Attendance Table ---
  if (meeting.attendance && Object.keys(meeting.attendance).length > 0) {
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }

    doc.setTextColor(67, 56, 202);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('5. ATTENDANCE ROSTER', 14, currentY);
    currentY += 3;

    const attendanceData = Object.values(meeting.attendance).map((att, idx) => [
      idx + 1,
      att.name,
      att.email,
      att.department || att.role || 'OC',
      att.status.toUpperCase()
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Member Name', 'Email', 'Role/Dept', 'Status']],
      body: attendanceData,
      theme: 'striped',
      headStyles: {
        fillColor: [30, 41, 59],
        textColor: 255,
        fontSize: 8.5,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 8,
        cellPadding: 2
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 12;
  }

  // --- Sign-off & Footer ---
  if (currentY > 240) {
    doc.addPage();
    currentY = 25;
  }

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(`Document ratified and archived by OASIS KIMUN 2026 Secretariat.`, 14, currentY);
  doc.text(`Recorded By: ${mom?.recordedBy || meeting.hostName || 'Secretariat'}`, 14, currentY + 5);

  const safeFilename = `${meeting.title.replace(/[^a-zA-Z0-9]/g, '_')}_MoM.pdf`;
  doc.save(safeFilename);
}
