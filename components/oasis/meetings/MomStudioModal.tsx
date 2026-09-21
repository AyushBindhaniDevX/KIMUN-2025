import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Send,
  Download,
  Share2,
  Copy,
  Users,
  Check,
  Clock,
  Sparkles,
  Calendar,
  CheckSquare,
  XCircle,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Meeting, MoMData, ActionItem, AttendanceRecord } from './types';
import {
  generateWhatsAppMoM,
  generateMeetingMoMPdf,
  resolveMeetingRecipients,
  emailToKey
} from './meetings-utils';

interface MomStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: Meeting | null;
  onSaveMoM: (meetingId: string, momData: MoMData, attendance: Record<string, AttendanceRecord>, publish: boolean) => Promise<void>;
  onSendEmailMoM: (meeting: Meeting, momData: MoMData) => Promise<void>;
  dbApplications?: any[];
  dbEbApplications?: any[];
  currentUser?: any;
}

export function MomStudioModal({
  isOpen,
  onClose,
  meeting,
  onSaveMoM,
  onSendEmailMoM,
  dbApplications = [],
  dbEbApplications = [],
  currentUser
}: MomStudioModalProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'action_items' | 'attendance'>('summary');
  const [summary, setSummary] = useState('');
  const [recordedBy, setRecordedBy] = useState('');
  const [decisions, setDecisions] = useState<string[]>([]);
  const [newDecision, setNewDecision] = useState('');
  const [keyDiscussions, setKeyDiscussions] = useState<string[]>([]);
  const [newDiscussion, setNewDiscussion] = useState('');

  // Action items
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [newTask, setNewTask] = useState('');
  const [newAssignee, setNewAssignee] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newPriority, setNewPriority] = useState<ActionItem['priority']>('Medium');

  // Attendance
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [attendanceSearch, setAttendanceSearch] = useState('');

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [copiedWhatsApp, setCopiedWhatsApp] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Pre-load data
  useEffect(() => {
    if (meeting) {
      const existingMoM = meeting.mom;
      setSummary(existingMoM?.summary || '');
      setRecordedBy(
        existingMoM?.recordedBy ||
        currentUser?.displayName ||
        currentUser?.email?.split('@')[0] ||
        'Secretariat'
      );
      setDecisions(existingMoM?.decisions || []);
      setKeyDiscussions(existingMoM?.keyDiscussions || []);
      setActionItems(existingMoM?.actionItems || []);

      // Initialize Attendance map with safe Firebase keys
      const recipients = resolveMeetingRecipients(meeting, dbApplications, dbEbApplications);
      const initialAttendance: Record<string, AttendanceRecord> = {};

      if (meeting.attendance) {
        Object.entries(meeting.attendance).forEach(([rawKey, rec]) => {
          if (rec) {
            const email = rec.email || rawKey;
            const k = emailToKey(email);
            initialAttendance[k] = {
              ...rec,
              email: rec.email || email
            };
          }
        });
      }

      recipients.forEach(r => {
        const key = emailToKey(r.email);
        if (!initialAttendance[key]) {
          initialAttendance[key] = {
            name: r.name,
            email: r.email,
            department: r.department,
            role: r.role,
            status: 'absent'
          };
        }
      });

      setAttendance(initialAttendance);
      setSuccessMsg('');
      setErrorMsg('');
    }
  }, [meeting, isOpen]);

  if (!isOpen || !meeting) return null;

  // Decision management
  const handleAddDecision = () => {
    if (!newDecision.trim()) return;
    setDecisions([...decisions, newDecision.trim()]);
    setNewDecision('');
  };

  const handleRemoveDecision = (index: number) => {
    setDecisions(decisions.filter((_, i) => i !== index));
  };

  // Discussion management
  const handleAddDiscussion = () => {
    if (!newDiscussion.trim()) return;
    setKeyDiscussions([...keyDiscussions, newDiscussion.trim()]);
    setNewDiscussion('');
  };

  const handleRemoveDiscussion = (index: number) => {
    setKeyDiscussions(keyDiscussions.filter((_, i) => i !== index));
  };

  // Action items management
  const handleAddActionItem = () => {
    if (!newTask.trim()) return;
    const item: ActionItem = {
      id: Date.now().toString(),
      task: newTask.trim(),
      assignee: newAssignee.trim() || 'Unassigned',
      dueDate: newDueDate || '',
      priority: newPriority,
      status: 'pending'
    };
    setActionItems([...actionItems, item]);
    setNewTask('');
    setNewAssignee('');
    setNewDueDate('');
  };

  const handleRemoveActionItem = (id: string) => {
    setActionItems(actionItems.filter(ai => ai.id !== id));
  };

  const handleToggleActionStatus = (id: string) => {
    setActionItems(
      actionItems.map(ai => {
        if (ai.id !== id) return ai;
        const nextStatus: ActionItem['status'] =
          ai.status === 'pending'
            ? 'in_progress'
            : ai.status === 'in_progress'
            ? 'completed'
            : 'pending';
        return { ...ai, status: nextStatus };
      })
    );
  };

  // Attendance management
  const handleSetAttendanceStatus = (email: string, status: AttendanceRecord['status']) => {
    const key = emailToKey(email);
    setAttendance(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        status,
        timestamp: Date.now()
      }
    }));
  };

  const handleMarkAllAttendance = (status: AttendanceRecord['status']) => {
    const updated = { ...attendance };
    Object.keys(updated).forEach(k => {
      updated[k] = { ...updated[k], status, timestamp: Date.now() };
    });
    setAttendance(updated);
  };

  const attendanceList = Object.values(attendance);
  const presentCount = attendanceList.filter(a => a.status === 'present').length;
  const absentCount = attendanceList.filter(a => a.status === 'absent').length;
  const excusedCount = attendanceList.filter(a => a.status === 'excused').length;
  const totalAttendees = attendanceList.length || 1;
  const attendanceRate = Math.round((presentCount / totalAttendees) * 100);

  const filteredAttendance = attendanceList.filter(a => {
    const q = attendanceSearch.toLowerCase();
    return (
      a.name.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      (a.department && a.department.toLowerCase().includes(q))
    );
  });

  // Construct current MoM data object
  const buildCurrentMoMData = (publish = false): MoMData => ({
    summary: summary.trim(),
    keyDiscussions: keyDiscussions || [],
    decisions: decisions || [],
    actionItems: (actionItems || []).map(ai => ({
      id: ai.id || Date.now().toString(),
      task: ai.task || '',
      assignee: ai.assignee || 'Unassigned',
      dueDate: ai.dueDate || '',
      priority: ai.priority || 'Medium',
      status: ai.status || 'pending'
    })),
    recordedBy: recordedBy.trim() || 'Secretariat',
    recordedAt: meeting.mom?.recordedAt || Date.now(),
    published: publish || Boolean(meeting.mom?.published),
    publishedAt: publish ? Date.now() : (meeting.mom?.publishedAt || 0)
  });

  // Convert current attendance state to guaranteed-safe Firebase keys
  const getGuaranteedSafeAttendance = () => {
    const safe: Record<string, AttendanceRecord> = {};
    Object.entries(attendance).forEach(([k, v]) => {
      const safeKey = emailToKey(v.email || k);
      safe[safeKey] = {
        ...v,
        email: v.email || k
      };
    });
    return safe;
  };

  // Save handler
  const handleSave = async (publish = false) => {
    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const momData = buildCurrentMoMData(publish);
      const safeAttendance = getGuaranteedSafeAttendance();
      await onSaveMoM(meeting.id, momData, safeAttendance, publish);
      setSuccessMsg(publish ? 'MoM successfully published!' : 'MoM draft saved!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save MoM');
    } finally {
      setIsSaving(false);
    }
  };

  // Send email broadcast
  const handleSendEmailBroadcast = async () => {
    setIsSendingEmail(true);
    setErrorMsg('');
    try {
      const momData = buildCurrentMoMData(true);
      const safeAttendance = getGuaranteedSafeAttendance();
      await onSaveMoM(meeting.id, momData, safeAttendance, true);
      await onSendEmailMoM(meeting, momData);
      setSuccessMsg('MoM email broadcast dispatched to all members!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to dispatch email broadcast');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Copy WhatsApp broadcast
  const handleCopyWhatsApp = () => {
    const momData = buildCurrentMoMData();
    const fullMeeting: Meeting = {
      ...meeting,
      mom: momData,
      attendance
    };
    const text = generateWhatsAppMoM(fullMeeting);
    navigator.clipboard.writeText(text);
    setCopiedWhatsApp(true);
    setTimeout(() => setCopiedWhatsApp(false), 3000);
  };

  // Export PDF
  const handleExportPdf = () => {
    const momData = buildCurrentMoMData();
    const fullMeeting: Meeting = {
      ...meeting,
      mom: momData,
      attendance
    };
    generateMeetingMoMPdf(fullMeeting);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white flex items-center justify-between border-b border-teal-800/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">Minutes of Meeting (MoM) Studio</h2>
                {meeting.mom?.published ? (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                    Published
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                    Draft
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-200 line-clamp-1">
                {meeting.title} • {meeting.department}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action & Feedback Banner */}
        {(successMsg || errorMsg) && (
          <div
            className={`px-6 py-2.5 text-xs font-semibold flex items-center gap-2 border-b ${
              successMsg
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            {successMsg ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{successMsg || errorMsg}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-200 bg-slate-50 flex items-center justify-between gap-4">
          <div className="flex gap-2 pt-2">
            {[
              { id: 'summary', label: 'Summary & Decisions', count: decisions.length },
              { id: 'action_items', label: 'Action Items', count: actionItems.length },
              { id: 'attendance', label: 'Attendance Sheet', count: `${presentCount}/${totalAttendees}` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-emerald-600 text-emerald-700 bg-white rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                <span className="px-1.5 py-0.2 rounded-full bg-slate-200/80 text-[10px] text-slate-700 font-semibold">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 pb-1 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyWhatsApp}
              className="text-xs gap-1 h-8 text-emerald-700 border-emerald-300 hover:bg-emerald-50"
            >
              {copiedWhatsApp ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              <span>{copiedWhatsApp ? 'Copied WhatsApp' : 'WhatsApp Text'}</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleExportPdf}
              className="text-xs gap-1 h-8 text-slate-700 border-slate-300 hover:bg-slate-100"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </Button>
          </div>
        </div>

        {/* Tab Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: SUMMARY & DECISIONS */}
          {activeTab === 'summary' && (
            <div className="space-y-6">
              {/* Executive Summary */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Executive Summary of Discussions
                </label>
                <textarea
                  rows={4}
                  value={summary}
                  onChange={e => setSummary(e.target.value)}
                  placeholder="Provide an overview of the key proceedings, updates presented, and strategic directions decided..."
                  className="w-full p-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition leading-relaxed"
                />
              </div>

              {/* Recorded By */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    MoM Recorded By
                  </label>
                  <input
                    type="text"
                    value={recordedBy}
                    onChange={e => setRecordedBy(e.target.value)}
                    placeholder="e.g. Ayush Bindhani (Secretariat)"
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Key Decisions */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Key Decisions Approved
                  </label>
                  <span className="text-xs text-slate-500 font-medium">
                    {decisions.length} decisions logged
                  </span>
                </div>

                <div className="space-y-2">
                  {decisions.map((dec, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl border border-emerald-200 bg-emerald-50/50 text-xs text-emerald-950 font-medium group"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center font-bold text-[11px] shrink-0">
                          {idx + 1}
                        </span>
                        <span>{dec}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDecision(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 opacity-60 group-hover:opacity-100 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newDecision}
                    onChange={e => setNewDecision(e.target.value)}
                    placeholder="Enter formal decision ratified during sync..."
                    className="flex-1 px-3.5 py-2 border border-slate-300 rounded-lg text-xs"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddDecision();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddDecision}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Decision
                  </Button>
                </div>
              </div>

              {/* Discussion Points */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Discussion Highlights & Notes
                  </label>
                  <span className="text-xs text-slate-500 font-medium">
                    {keyDiscussions.length} points
                  </span>
                </div>

                <div className="space-y-2">
                  {keyDiscussions.map((point, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs text-slate-800 group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-indigo-500 font-bold">•</span>
                        <span>{point}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveDiscussion(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 opacity-60 group-hover:opacity-100 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newDiscussion}
                    onChange={e => setNewDiscussion(e.target.value)}
                    placeholder="Add key talking point or highlight..."
                    className="flex-1 px-3.5 py-2 border border-slate-300 rounded-lg text-xs"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddDiscussion();
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleAddDiscussion}
                    className="text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Point
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACTION ITEMS */}
          {activeTab === 'action_items' && (
            <div className="space-y-6">
              <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-indigo-950">
                    Action Items & Deliverables Engine
                  </div>
                  <div className="text-[11px] text-indigo-700">
                    Assign responsible leads, set strict deadlines, and track follow-ups directly on OASIS.
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-indigo-200 text-indigo-900 font-bold text-xs">
                  {actionItems.filter(a => a.status === 'completed').length} / {actionItems.length} Done
                </span>
              </div>

              {/* Action items list */}
              <div className="space-y-2.5">
                {actionItems.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border transition flex items-center justify-between gap-4 ${
                      item.status === 'completed'
                        ? 'bg-slate-50 border-slate-200 opacity-75'
                        : 'bg-white border-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => handleToggleActionStatus(item.id)}
                        className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition ${
                          item.status === 'completed'
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : item.status === 'in_progress'
                            ? 'bg-amber-100 border-amber-400 text-amber-700'
                            : 'border-slate-300 text-transparent hover:border-slate-400'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <div>
                        <div
                          className={`text-xs font-bold ${
                            item.status === 'completed'
                              ? 'line-through text-slate-500'
                              : 'text-slate-800'
                          }`}
                        >
                          {item.task}
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-1">
                          <span className="font-semibold text-slate-700">
                            👤 {item.assignee}
                          </span>
                          {item.dueDate && <span>📅 Due: {item.dueDate}</span>}
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              item.priority === 'High'
                                ? 'bg-rose-100 text-rose-700'
                                : item.priority === 'Low'
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {item.priority}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleActionStatus(item.id)}
                        className="text-[10px] font-semibold px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                      >
                        {item.status.toUpperCase()}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveActionItem(item.id)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Action Item Form */}
              <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl space-y-3">
                <div className="text-xs font-bold text-slate-700">Add New Action Item:</div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    value={newTask}
                    onChange={e => setNewTask(e.target.value)}
                    placeholder="Task deliverable description..."
                    className="sm:col-span-2 px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                  <input
                    type="text"
                    value={newAssignee}
                    onChange={e => setNewAssignee(e.target.value)}
                    placeholder="Assignee name / email..."
                    className="px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                  <input
                    type="date"
                    value={newDueDate}
                    onChange={e => setNewDueDate(e.target.value)}
                    className="px-3 py-2 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Priority:</span>
                    {(['Low', 'Medium', 'High'] as const).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setNewPriority(p)}
                        className={`text-[11px] px-2.5 py-1 rounded-md border font-semibold ${
                          newPriority === p
                            ? p === 'High'
                              ? 'bg-rose-50 border-rose-300 text-rose-700'
                              : 'bg-indigo-50 border-indigo-300 text-indigo-700'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAddActionItem}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Action Item
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ATTENDANCE SHEET */}
          {activeTab === 'attendance' && (
            <div className="space-y-4">
              {/* Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="text-[11px] font-bold text-emerald-700 uppercase">Present</div>
                  <div className="text-xl font-extrabold text-emerald-900">{presentCount}</div>
                </div>
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl">
                  <div className="text-[11px] font-bold text-rose-700 uppercase">Absent</div>
                  <div className="text-xl font-extrabold text-rose-900">{absentCount}</div>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="text-[11px] font-bold text-amber-700 uppercase">Excused</div>
                  <div className="text-xl font-extrabold text-amber-900">{excusedCount}</div>
                </div>
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <div className="text-[11px] font-bold text-indigo-700 uppercase">Attendance Rate</div>
                  <div className="text-xl font-extrabold text-indigo-900">{attendanceRate}%</div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <input
                  type="text"
                  value={attendanceSearch}
                  onChange={e => setAttendanceSearch(e.target.value)}
                  placeholder="Search member by name or email..."
                  className="w-full sm:w-72 px-3.5 py-2 border border-slate-300 rounded-xl text-xs"
                />

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => handleMarkAllAttendance('present')}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-semibold"
                  >
                    Mark All Present
                  </button>
                  <button
                    type="button"
                    onClick={() => handleMarkAllAttendance('absent')}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Attendance Table */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <tr>
                      <th className="p-3 text-left">Member Name</th>
                      <th className="p-3 text-left hidden sm:table-cell">Email / Department</th>
                      <th className="p-3 text-right">Attendance Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredAttendance.map(att => {
                      const safeKey = emailToKey(att.email);
                      return (
                        <tr key={safeKey} className="hover:bg-slate-50/60 transition">
                          <td className="p-3">
                            <div className="font-bold text-slate-800">{att.name}</div>
                            <div className="text-[11px] text-slate-500 sm:hidden">{att.email}</div>
                          </td>
                          <td className="p-3 hidden sm:table-cell">
                            <div className="text-slate-600">{att.email}</div>
                            <div className="text-[10px] text-slate-400">{att.department || att.role}</div>
                          </td>
                          <td className="p-3 text-right">
                            <div className="inline-flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                              <button
                                type="button"
                                onClick={() => handleSetAttendanceStatus(att.email, 'present')}
                                className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                                  att.status === 'present'
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-white'
                                }`}
                              >
                                Present
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetAttendanceStatus(att.email, 'excused')}
                                className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                                  att.status === 'excused'
                                    ? 'bg-amber-500 text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-white'
                                }`}
                              >
                                Excused
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetAttendanceStatus(att.email, 'absent')}
                                className={`px-2.5 py-1 rounded text-[11px] font-bold transition ${
                                  att.status === 'absent'
                                    ? 'bg-rose-600 text-white shadow-sm'
                                    : 'text-slate-600 hover:bg-white'
                                }`}
                              >
                                Absent
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              Close
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleSave(false)}
              disabled={isSaving}
              className="text-xs"
            >
              {isSaving ? 'Saving...' : 'Save Draft'}
            </Button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Button
              type="button"
              size="sm"
              onClick={() => handleSave(true)}
              disabled={isSaving}
              className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              Publish MoM
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleSendEmailBroadcast}
              disabled={isSendingEmail}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm"
            >
              <Send className="w-3.5 h-3.5 mr-1" />
              {isSendingEmail ? 'Dispatching...' : 'Broadcast MoM via Email'}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
