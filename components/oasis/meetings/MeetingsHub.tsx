import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  Video,
  Users,
  Plus,
  Search,
  Filter,
  ExternalLink,
  Copy,
  Check,
  Share2,
  FileText,
  Send,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Play,
  MapPin,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Layers,
  Edit2,
  Trash2,
  Download,
  Flame,
  CheckSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Meeting, DEPARTMENTS, MoMData, AttendanceRecord } from './types';
import { ScheduleMeetingModal } from './ScheduleMeetingModal';
import { MomStudioModal } from './MomStudioModal';
import {
  generateWhatsAppMeetingInvite,
  generateMeetingMoMPdf,
  resolveMeetingRecipients
} from './meetings-utils';
import { ref, push, update, remove } from 'firebase/database';
import { firebaseDb } from '@/lib/firebase-client';

interface MeetingsHubProps {
  meetings: Meeting[];
  dbApplications: any[];
  dbEbApplications?: any[];
  currentUser: any;
  role: 'admin' | 'oc_member' | null;
}

export function MeetingsHub({
  meetings = [],
  dbApplications = [],
  dbEbApplications = [],
  currentUser,
  role
}: MeetingsHubProps) {
  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('All Departments');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'upcoming' | 'live' | 'completed'>('all');
  const [expandedAgendaId, setExpandedAgendaId] = useState<string | null>(null);

  // Modals state
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [isMomOpen, setIsMomOpen] = useState(false);
  const [activeMomMeeting, setActiveMomMeeting] = useState<Meeting | null>(null);

  // Notification / Feedback toast
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [copiedMeetingId, setCopiedMeetingId] = useState<string | null>(null);
  const [dispatchingInviteId, setDispatchingInviteId] = useState<string | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  // KPI Calculations
  const now = new Date();
  const kpis = useMemo(() => {
    const total = meetings.length;
    let upcomingCount = 0;
    let liveCount = 0;
    let completedCount = 0;
    let totalActionItems = 0;
    let pendingActionItems = 0;

    meetings.forEach(m => {
      const mDate = new Date(m.dateTime);
      const isPast = mDate.getTime() + (m.durationMinutes || 45) * 60000 < now.getTime();
      const isNow =
        mDate.getTime() <= now.getTime() &&
        mDate.getTime() + (m.durationMinutes || 45) * 60000 >= now.getTime();

      if (m.status === 'completed' || isPast) {
        completedCount++;
      } else if (m.status === 'live' || isNow) {
        liveCount++;
      } else {
        upcomingCount++;
      }

      if (m.mom?.actionItems) {
        totalActionItems += m.mom.actionItems.length;
        pendingActionItems += m.mom.actionItems.filter(ai => ai.status !== 'completed').length;
      }
    });

    return {
      total,
      upcoming: upcomingCount,
      live: liveCount,
      completed: completedCount,
      totalActionItems,
      pendingActionItems
    };
  }, [meetings, now]);

  // Filtered Meetings List
  const filteredMeetings = useMemo(() => {
    return meetings
      .filter(m => {
        // Department filter
        if (selectedDept !== 'All Departments') {
          if (m.department !== selectedDept && m.department !== 'All Departments') {
            return false;
          }
        }

        // Status filter
        const mDate = new Date(m.dateTime);
        const isPast = mDate.getTime() + (m.durationMinutes || 45) * 60000 < now.getTime();
        const isNow =
          mDate.getTime() <= now.getTime() &&
          mDate.getTime() + (m.durationMinutes || 45) * 60000 >= now.getTime();

        if (selectedStatus === 'upcoming') {
          if (m.status === 'completed' || isPast) return false;
        } else if (selectedStatus === 'live') {
          if (m.status !== 'live' && !isNow) return false;
        } else if (selectedStatus === 'completed') {
          if (m.status !== 'completed' && !isPast) return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = m.title.toLowerCase().includes(q);
          const matchDept = m.department.toLowerCase().includes(q);
          const matchHost = (m.hostName || '').toLowerCase().includes(q);
          const matchAgenda = (m.agenda || []).some(a => a.topic.toLowerCase().includes(q));
          if (!matchTitle && !matchDept && !matchHost && !matchAgenda) return false;
        }

        return true;
      })
      .sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());
  }, [meetings, selectedDept, selectedStatus, searchQuery, now]);

  // Save / Update Meeting Handler
  const handleSaveMeeting = async (meetingData: Partial<Meeting>, sendInvite: boolean) => {
    try {
      let meetingId = editingMeeting?.id;
      let finalMeeting: Meeting;

      if (meetingId) {
        // Update existing
        const meetingRef = ref(firebaseDb, `meetings/${meetingId}`);
        await update(meetingRef, meetingData);
        finalMeeting = { ...editingMeeting, ...meetingData } as Meeting;
        showToast('Meeting details updated successfully!');
      } else {
        // Create new
        const meetingsListRef = ref(firebaseDb, 'meetings');
        const newRef = push(meetingsListRef);
        meetingId = newRef.key!;
        const newMeeting: Meeting = {
          id: meetingId,
          title: meetingData.title || 'Untitled Sync',
          department: meetingData.department || 'All Departments',
          type: meetingData.type || 'General Sync',
          dateTime: meetingData.dateTime || new Date().toISOString(),
          durationMinutes: meetingData.durationMinutes || 45,
          meetingPlatform: meetingData.meetingPlatform || 'google_meet',
          meetingLink: meetingData.meetingLink || '',
          venue: meetingData.venue || '',
          hostName: meetingData.hostName || currentUser?.displayName || 'Secretariat',
          hostEmail: meetingData.hostEmail || currentUser?.email || 'secretariat@kimun.org',
          targetAudience: meetingData.targetAudience || 'all_oc',
          customAttendees: meetingData.customAttendees || [],
          agenda: meetingData.agenda || [],
          status: 'scheduled',
          createdAt: Date.now(),
          updatedAt: Date.now()
        };

        await update(newRef, newMeeting);
        finalMeeting = newMeeting;
        showToast('Meeting scheduled successfully!');
      }

      // If invite email requested, dispatch it
      if (sendInvite && finalMeeting) {
        await handleSendInviteEmail(finalMeeting);
      }
    } catch (err: any) {
      console.error('Error saving meeting:', err);
      showToast(err.message || 'Failed to save meeting', 'error');
    }
  };

  // Delete Meeting Handler
  const handleDeleteMeeting = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to cancel and delete "${title}"?`)) return;
    try {
      const meetingRef = ref(firebaseDb, `meetings/${id}`);
      await remove(meetingRef);
      showToast('Meeting cancelled and deleted.');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete meeting', 'error');
    }
  };

  // Save MoM Handler
  const handleSaveMoM = async (
    meetingId: string,
    momData: MoMData,
    attendance: Record<string, AttendanceRecord>,
    publish: boolean
  ) => {
    const meetingRef = ref(firebaseDb, `meetings/${meetingId}`);
    const updates: any = {
      mom: momData,
      attendance,
      updatedAt: Date.now()
    };
    if (publish) {
      updates.status = 'completed';
    }
    await update(meetingRef, updates);
  };

  // Send Meeting Invitation Email via API
  const handleSendInviteEmail = async (meeting: Meeting) => {
    setDispatchingInviteId(meeting.id);
    try {
      const recipients = resolveMeetingRecipients(meeting, dbApplications, dbEbApplications);
      if (recipients.length === 0) {
        showToast('No member email addresses found for this audience target.', 'error');
        return;
      }

      const res = await fetch('/api/send-meeting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'meeting_invite',
          recipients,
          meeting
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast(`Meeting invitation dispatched to ${data.totalRecipients} members!`);
      } else {
        showToast(data.error || 'Could not send emails automatically', 'error');
      }
    } catch (err: any) {
      console.error('Email invite dispatch error:', err);
      showToast('Failed to dispatch meeting invite email', 'error');
    } finally {
      setDispatchingInviteId(null);
    }
  };

  // Send MoM Broadcast Email via API
  const handleSendMoMEmail = async (meeting: Meeting, momData: MoMData) => {
    const recipients = resolveMeetingRecipients(meeting, dbApplications, dbEbApplications);
    if (recipients.length === 0) {
      showToast('No recipient email addresses found.', 'error');
      return;
    }

    const attendanceRecords = Object.values(meeting.attendance || {});
    const presentCount = attendanceRecords.filter(a => a.status === 'present').length;

    const res = await fetch('/api/send-meeting', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'meeting_mom',
        recipients,
        meeting: {
          ...meeting,
          mom: momData,
          attendanceStats: {
            presentCount,
            absentCount: attendanceRecords.length - presentCount,
            totalCount: attendanceRecords.length
          }
        }
      })
    });

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to broadcast MoM via email');
    }
  };

  // 1-Click Copy WhatsApp Invitation
  const handleCopyWhatsAppInvite = (meeting: Meeting) => {
    const text = generateWhatsAppMeetingInvite(meeting);
    navigator.clipboard.writeText(text);
    setCopiedMeetingId(meeting.id);
    showToast('Formatted WhatsApp invite copied to clipboard!');
    setTimeout(() => setCopiedMeetingId(null), 3000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 text-xs font-bold text-white ${
              toastMessage.type === 'success'
                ? 'bg-emerald-600 shadow-emerald-900/20'
                : 'bg-rose-600 shadow-rose-900/20'
            }`}
          >
            {toastMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            <span>{toastMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI Header Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-slate-50 to-white border border-indigo-100 shadow-sm">
          <div className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" /> Total Scheduled
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{kpis.total}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Across all departments</div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-500/10 via-slate-50 to-white border border-sky-100 shadow-sm">
          <div className="text-[11px] font-bold text-sky-600 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Upcoming Syncs
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{kpis.upcoming}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Scheduled on calendar</div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-slate-50 to-white border border-emerald-100 shadow-sm">
          <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span> Live Now
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{kpis.live}</div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">In active session</div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-500/10 via-slate-50 to-white border border-teal-100 shadow-sm">
          <div className="text-[11px] font-bold text-teal-600 uppercase tracking-wider flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5" /> MoM Documented
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">{kpis.completed}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Minutes recorded</div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-50 to-white border border-amber-100 shadow-sm col-span-2 md:col-span-1">
          <div className="text-[11px] font-bold text-amber-600 uppercase tracking-wider flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5" /> Action Items
          </div>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {kpis.pendingActionItems}
            <span className="text-xs font-semibold text-slate-400">/{kpis.totalActionItems}</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Pending deliverables</div>
        </div>
      </div>

      {/* Action and Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search meetings, topics, leads..."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          {/* Status Segmented Buttons */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-full md:w-auto overflow-x-auto">
            {[
              { id: 'all', label: 'All' },
              { id: 'upcoming', label: 'Upcoming' },
              { id: 'live', label: 'Live Now' },
              { id: 'completed', label: 'Completed' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedStatus(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  selectedStatus === tab.id
                    ? 'bg-white text-indigo-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Schedule Meeting CTA */}
          <Button
            type="button"
            onClick={() => {
              setEditingMeeting(null);
              setIsScheduleOpen(true);
            }}
            className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 px-4 py-2 rounded-xl flex items-center justify-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" /> Schedule Conference Meeting
          </Button>
        </div>

        {/* Department filter scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 pb-0.5 scrollbar-thin">
          <span className="text-[11px] font-bold text-slate-400 mr-1 uppercase">Filter:</span>
          {DEPARTMENTS.map(dept => (
            <button
              key={dept}
              onClick={() => setSelectedDept(dept)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap transition border ${
                selectedDept === dept
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {dept}
            </button>
          ))}
        </div>
      </div>

      {/* Meetings Grid / List */}
      {filteredMeetings.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
            <Calendar className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">No Meetings Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            No meetings match the active filters. Schedule a new conference sync to coordinate with members.
          </p>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setEditingMeeting(null);
              setIsScheduleOpen(true);
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Schedule First Meeting
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredMeetings.map(meeting => {
            const meetingDate = new Date(meeting.dateTime);
            const isLive =
              meeting.status === 'live' ||
              (meetingDate.getTime() <= now.getTime() &&
                meetingDate.getTime() + (meeting.durationMinutes || 45) * 60000 >= now.getTime());
            const isPast =
              meeting.status === 'completed' ||
              meetingDate.getTime() + (meeting.durationMinutes || 45) * 60000 < now.getTime();
            const isAgendaExpanded = expandedAgendaId === meeting.id;

            const formattedDate = meetingDate.toLocaleString('en-IN', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            });

            return (
              <motion.div
                key={meeting.id}
                layout
                className={`bg-white rounded-2xl border transition-all flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md ${
                  isLive
                    ? 'border-emerald-400 ring-2 ring-emerald-200'
                    : isPast
                    ? 'border-slate-200'
                    : 'border-indigo-100 hover:border-indigo-300'
                }`}
              >
                {/* Top Section */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {isLive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider">
                          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                          Live Now
                        </span>
                      ) : isPast ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                          Concluded
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-bold uppercase tracking-wider">
                          Scheduled
                        </span>
                      )}

                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-semibold">
                        {meeting.department}
                      </span>

                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px]">
                        {meeting.type}
                      </span>
                    </div>

                    {/* Platform Badge */}
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 capitalize bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md">
                      <Video className="w-3 h-3 text-indigo-500" />
                      {meeting.meetingPlatform.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-slate-900 leading-snug mb-1.5">
                    {meeting.title}
                  </h3>

                  {/* Date, Time & Location */}
                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-600 mb-3">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="font-semibold text-slate-800">{formattedDate}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{meeting.durationMinutes} Minutes</span>
                    </div>

                    {meeting.venue && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-rose-500" />
                        <span className="truncate max-w-[150px]">{meeting.venue}</span>
                      </div>
                    )}
                  </div>

                  {/* Audience and Host summary */}
                  <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-2.5">
                    <div>
                      <span className="font-semibold text-slate-700">Audience: </span>
                      <span className="capitalize">
                        {meeting.targetAudience === 'all_oc'
                          ? 'All OC Members'
                          : meeting.targetAudience === 'department'
                          ? `${meeting.department} Team`
                          : meeting.targetAudience}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Host: </span>
                      <span className="font-medium text-slate-700">{meeting.hostName || 'Secretariat'}</span>
                    </div>
                  </div>

                  {/* Agenda Drawer preview */}
                  {meeting.agenda && meeting.agenda.length > 0 && (
                    <div className="mt-3 border-t border-slate-100 pt-2.5">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedAgendaId(isAgendaExpanded ? null : meeting.id)
                        }
                        className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 hover:text-indigo-600 transition"
                      >
                        <span className="flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Pre-Meeting Agenda ({meeting.agenda.length} items)</span>
                        </span>
                        {isAgendaExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {isAgendaExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-2 space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs"
                        >
                          {meeting.agenda.map((ag, idx) => (
                            <div key={ag.id || idx} className="flex items-start gap-2">
                              <span className="w-4 h-4 rounded-full bg-indigo-200 text-indigo-900 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                {idx + 1}
                              </span>
                              <div className="flex-1">
                                <div className="font-semibold text-slate-800">{ag.topic}</div>
                                {(ag.presenter || ag.duration) && (
                                  <div className="text-[10px] text-slate-500">
                                    {ag.presenter && `Lead: ${ag.presenter}`}
                                    {ag.duration && ` • ${ag.duration}`}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </div>
                  )}

                  {/* MoM Status Indicator Bar */}
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {meeting.mom?.published ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          MoM Ratified & Published
                        </span>
                      ) : meeting.mom ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md">
                          <FileText className="w-3 h-3 text-amber-600" />
                          MoM Draft In Progress
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          No MoM recorded yet
                        </span>
                      )}
                    </div>

                    {meeting.mom?.actionItems && (
                      <span className="text-[11px] font-semibold text-indigo-600">
                        {meeting.mom.actionItems.length} Action Items
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {/* Join Meeting Direct Link */}
                    {meeting.meetingLink ? (
                      <a
                        href={meeting.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-sm"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Join Room</span>
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Link pending</span>
                    )}

                    {/* Copy WhatsApp Invite */}
                    <button
                      type="button"
                      onClick={() => handleCopyWhatsAppInvite(meeting)}
                      title="Copy WhatsApp Invitation Text"
                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition"
                    >
                      {copiedMeetingId === meeting.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Share2 className="w-3.5 h-3.5 text-slate-600" />
                      )}
                    </button>

                    {/* Send Invite Email */}
                    <button
                      type="button"
                      onClick={() => handleSendInviteEmail(meeting)}
                      disabled={dispatchingInviteId === meeting.id}
                      title="Send Invite & Agenda via Email"
                      className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 transition"
                    >
                      <Send className="w-3.5 h-3.5 text-slate-600" />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Open MoM Studio */}
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setActiveMomMeeting(meeting);
                        setIsMomOpen(true);
                      }}
                      className="text-xs h-8 border-teal-300 text-teal-800 hover:bg-teal-50 font-semibold gap-1"
                    >
                      <FileText className="w-3.5 h-3.5 text-teal-600" />
                      <span>{meeting.mom?.published ? 'View MoM' : 'MoM Studio'}</span>
                    </Button>

                    {/* Edit & Delete (Admin or Host) */}
                    {(role === 'admin' || meeting.hostEmail === currentUser?.email) && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMeeting(meeting);
                            setIsScheduleOpen(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 transition"
                          title="Edit Meeting"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMeeting(meeting.id, meeting.title)}
                          className="p-1.5 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-600 transition"
                          title="Delete Meeting"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Schedule Meeting Modal */}
      <ScheduleMeetingModal
        isOpen={isScheduleOpen}
        onClose={() => {
          setIsScheduleOpen(false);
          setEditingMeeting(null);
        }}
        onSave={handleSaveMeeting}
        initialData={editingMeeting}
        dbApplications={dbApplications}
        dbEbApplications={dbEbApplications}
        currentUser={currentUser}
      />

      {/* Minutes of Meeting (MoM) Studio Modal */}
      <MomStudioModal
        isOpen={isMomOpen}
        onClose={() => {
          setIsMomOpen(false);
          setActiveMomMeeting(null);
        }}
        meeting={activeMomMeeting}
        onSaveMoM={handleSaveMoM}
        onSendEmailMoM={handleSendMoMEmail}
        dbApplications={dbApplications}
        dbEbApplications={dbEbApplications}
        currentUser={currentUser}
      />
    </div>
  );
}
