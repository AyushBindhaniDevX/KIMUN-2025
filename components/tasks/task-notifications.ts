// components/tasks/task-notifications.ts

export interface TaskRecipient {
  name: string;
  email: string;
  phone?: string;
}

export interface TaskNotificationPayload {
  task: {
    id?: string;
    title: string;
    description?: string;
    department?: string;
    priority?: string;
    dueDate?: string;
    assignee?: string;
    status?: string;
    maxPoints?: number;
    awardedPoints?: number;
  };
  eventType: 'task_added' | 'task_updated' | 'task_status_changed' | 'task_completed' | 'task_claimed' | 'task_verified';
  actorName?: string;
  newStatus?: string;
  awardedPoints?: number;
  dbApplications?: any[];
  onSuccess?: () => void;
  onError?: (err: any) => void;
}

/**
 * Resolves assignee emails and phone numbers from the application database.
 */
export function resolveTaskRecipients(
  assignee: string | undefined,
  department: string | undefined,
  dbApplications: any[] = []
): TaskRecipient[] {
  const recipients: TaskRecipient[] = [];
  if (!assignee) return recipients;

  if (assignee === 'ALL') {
    const matchedApps = dbApplications.filter(
      (a) =>
        a.status === 'welcomed' &&
        (a.pref1 === department || a.department === department)
    );
    return matchedApps.map((a) => ({
      name: a.name || 'Team Member',
      email: a.email,
      phone: a.phone,
    }));
  }

  const names = assignee.split(',').map((n) => n.trim());
  names.forEach((n) => {
    const matchedApp = dbApplications.find((a) => a.name?.toLowerCase() === n.toLowerCase());
    if (matchedApp && matchedApp.email) {
      recipients.push({
        name: matchedApp.name,
        email: matchedApp.email,
        phone: matchedApp.phone,
      });
    }
  });

  return recipients;
}

/**
 * Sends notifications (email & WhatsApp if applicable) on task actions.
 */
export async function sendTaskNotification(payload: TaskNotificationPayload) {
  const {
    task,
    eventType,
    actorName = 'Secretariat',
    newStatus,
    awardedPoints,
    dbApplications = [],
  } = payload;

  const recipients = resolveTaskRecipients(task.assignee, task.department, dbApplications);
  if (recipients.length === 0) return;

  const emailPromises = recipients.map(async (recipient) => {
    try {
      await fetch('/api/sendApplicationEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: recipient.email,
          name: recipient.name,
          type: eventType,
          taskTitle: task.title,
          taskDescription: task.description,
          taskStatus: newStatus || task.status,
          taskPriority: task.priority,
          taskDueDate: task.dueDate,
          awardedPoints: awardedPoints ?? task.awardedPoints ?? task.maxPoints,
          updatedBy: actorName,
        }),
      });
    } catch (err) {
      console.error(`Failed to send email notification to ${recipient.email}:`, err);
    }
  });

  await Promise.allSettled(emailPromises);
}
