export interface AgendaItem {
  id: string;
  topic: string;
  presenter?: string;
  duration?: string;
  notes?: string;
}

export interface ActionItem {
  id: string;
  task: string;
  assignee: string;
  dueDate?: string;
  priority: 'High' | 'Medium' | 'Low';
  status: 'pending' | 'in_progress' | 'completed';
}

export interface AttendanceRecord {
  name: string;
  email: string;
  role?: string;
  department?: string;
  status: 'present' | 'absent' | 'excused';
  timestamp?: number;
}

export interface MoMData {
  summary: string;
  keyDiscussions: string[];
  decisions: string[];
  actionItems: ActionItem[];
  recordedBy: string;
  recordedAt: number;
  published: boolean;
  publishedAt?: number;
}

export interface Meeting {
  id: string;
  title: string;
  description?: string;
  department: string;
  type: 'General Sync' | 'Departmental' | 'Secretariat Core' | 'Executive Board' | 'Emergency' | 'Review & Dry Run';
  dateTime: string; // ISO format or YYYY-MM-DDTHH:mm
  durationMinutes: number;
  meetingPlatform: 'google_meet' | 'zoom' | 'teams' | 'in_person' | 'other';
  meetingLink: string;
  venue?: string;
  hostName: string;
  hostEmail: string;
  targetAudience: 'all_oc' | 'department' | 'eb' | 'secretariat' | 'custom';
  customAttendees?: string[];
  agenda: AgendaItem[];
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  attendance?: Record<string, AttendanceRecord>;
  mom?: MoMData;
  createdAt: number;
  updatedAt: number;
}

export const DEPARTMENTS = [
  'All Departments',
  'Secretariat',
  'Logistics & Operations',
  'Hospitality & Venue',
  'Finance & Sponsorships',
  'Delegate Affairs',
  'Public Relations & Outreach',
  'Design & Media',
  'Tech & Web Systems',
  'Executive Board',
  'Crisis Staff',
  'Security & Protocol'
] as const;
