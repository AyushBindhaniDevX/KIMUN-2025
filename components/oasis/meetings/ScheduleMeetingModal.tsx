import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Clock,
  Video,
  Users,
  MapPin,
  Link as LinkIcon,
  Plus,
  Trash2,
  Send,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Layers,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Meeting, AgendaItem, DEPARTMENTS } from './types';
import { generateWhatsAppMeetingInvite, resolveMeetingRecipients } from './meetings-utils';

interface ScheduleMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (meetingData: Partial<Meeting>, sendInvite: boolean) => Promise<void>;
  initialData?: Meeting | null;
  dbApplications?: any[];
  dbEbApplications?: any[];
  currentUser?: any;
}

export function ScheduleMeetingModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  dbApplications = [],
  dbEbApplications = [],
  currentUser
}: ScheduleMeetingModalProps) {
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('All Departments');
  const [type, setType] = useState<Meeting['type']>('General Sync');
  const [dateTime, setDateTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [meetingPlatform, setMeetingPlatform] = useState<Meeting['meetingPlatform']>('google_meet');
  const [meetingLink, setMeetingLink] = useState('');
  const [venue, setVenue] = useState('');
  const [targetAudience, setTargetAudience] = useState<Meeting['targetAudience']>('all_oc');
  const [customAttendees, setCustomAttendees] = useState<string[]>([]);
  const [customMemberInput, setCustomMemberInput] = useState('');
  const [agenda, setAgenda] = useState<AgendaItem[]>([]);
  const [newTopic, setNewTopic] = useState('');
  const [newPresenter, setNewPresenter] = useState('');
  const [newDuration, setNewDuration] = useState('10 mins');
  const [sendInviteEmail, setSendInviteEmail] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Pre-fill form when editing or resetting
  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDepartment(initialData.department || 'All Departments');
      setType(initialData.type || 'General Sync');
      setDateTime(initialData.dateTime || '');
      setDurationMinutes(initialData.durationMinutes || 45);
      setMeetingPlatform(initialData.meetingPlatform || 'google_meet');
      setMeetingLink(initialData.meetingLink || '');
      setVenue(initialData.venue || '');
      setTargetAudience(initialData.targetAudience || 'all_oc');
      setCustomAttendees(initialData.customAttendees || []);
      setAgenda(initialData.agenda || []);
    } else {
      // Default new meeting state
      setTitle('');
      setDepartment('All Departments');
      setType('General Sync');
      // default to tomorrow at 19:00
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(19, 0, 0, 0);
      const tzOffset = tomorrow.getTimezoneOffset() * 60000;
      const localISOTime = new Date(tomorrow.getTime() - tzOffset).toISOString().slice(0, 16);
      setDateTime(localISOTime);
      setDurationMinutes(45);
      setMeetingPlatform('google_meet');
      setMeetingLink('');
      setVenue('');
      setTargetAudience('all_oc');
      setCustomAttendees([]);
      setAgenda([
        { id: '1', topic: 'Roll Call & Opening Remarks', presenter: 'Secretariat', duration: '5 mins' },
        { id: '2', topic: 'Progress Review & Department Updates', presenter: 'Department Leads', duration: '25 mins' },
        { id: '3', topic: 'Action Items Allocation & Q&A', presenter: 'Open Floor', duration: '15 mins' }
      ]);
      setErrorMsg('');
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleAddAgendaItem = () => {
    if (!newTopic.trim()) return;
    const item: AgendaItem = {
      id: Date.now().toString(),
      topic: newTopic.trim(),
      presenter: newPresenter.trim() || undefined,
      duration: newDuration.trim() || undefined
    };
    setAgenda([...agenda, item]);
    setNewTopic('');
    setNewPresenter('');
  };

  const handleRemoveAgendaItem = (id: string) => {
    setAgenda(agenda.filter(item => item.id !== id));
  };

  const handleAddCustomAttendee = (email: string) => {
    const trimmed = email.trim();
    if (!trimmed || customAttendees.includes(trimmed)) return;
    setCustomAttendees([...customAttendees, trimmed]);
    setCustomMemberInput('');
  };

  const handleRemoveCustomAttendee = (email: string) => {
    setCustomAttendees(customAttendees.filter(e => e !== email));
  };

  const handleQuickCreateGoogleMeet = () => {
    window.open('https://meet.google.com/new', '_blank');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Please enter a meeting title');
      return;
    }
    if (!dateTime) {
      setErrorMsg('Please select a valid date and time');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');

    try {
      const payload: Partial<Meeting> = {
        title: title.trim(),
        department,
        type,
        dateTime,
        durationMinutes: Number(durationMinutes) || 45,
        meetingPlatform,
        meetingLink: meetingLink.trim(),
        venue: venue.trim(),
        targetAudience,
        customAttendees: targetAudience === 'custom' ? customAttendees : undefined,
        agenda,
        hostName: initialData?.hostName || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Secretariat',
        hostEmail: initialData?.hostEmail || currentUser?.email || 'secretariat@kimun.org',
        status: initialData?.status || 'scheduled',
        updatedAt: Date.now()
      };

      await onSave(payload, sendInviteEmail);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save meeting');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden text-slate-800"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-indigo-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/20 border border-indigo-400/30 text-indigo-300">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">
                {initialData ? 'Edit Meeting & Agenda' : 'Schedule Conference Meeting'}
              </h2>
              <p className="text-xs text-indigo-200">
                Setup meeting details, generate direct join links, target members, and prepare agenda.
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

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> General Details
              </h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Meeting Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Core Secretariat Sync: Venue & Logistics Run-Through"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department / Domain
                </label>
                <select
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition bg-white"
                >
                  {DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Meeting Category
                </label>
                <select
                  value={type}
                  onChange={e => setType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition bg-white"
                >
                  <option value="General Sync">General Sync</option>
                  <option value="Departmental">Departmental Sync</option>
                  <option value="Secretariat Core">Secretariat Core</option>
                  <option value="Executive Board">Executive Board (EB)</option>
                  <option value="Review & Dry Run">Review & Dry Run</option>
                  <option value="Emergency">Emergency Meeting</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Date, Time & Platform */}
          <div className="space-y-4 pt-3 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Date, Time & Platform
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date & Time (IST) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={dateTime}
                  onChange={e => setDateTime(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Duration (Minutes)
                </label>
                <div className="flex items-center gap-1.5">
                  {[30, 45, 60, 90].map(mins => (
                    <button
                      key={mins}
                      type="button"
                      onClick={() => setDurationMinutes(mins)}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition ${
                        durationMinutes === mins
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {mins}m
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Meeting Platform
                </label>
                <select
                  value={meetingPlatform}
                  onChange={e => setMeetingPlatform(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition bg-white"
                >
                  <option value="google_meet">Google Meet</option>
                  <option value="zoom">Zoom Video</option>
                  <option value="teams">Microsoft Teams</option>
                  <option value="in_person">In-Person (Offline)</option>
                  <option value="other">Other Platform</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Meeting Link / URL
                  </label>
                  {meetingPlatform === 'google_meet' && (
                    <button
                      type="button"
                      onClick={handleQuickCreateGoogleMeet}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" /> Launch New Google Meet
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="url"
                    value={meetingLink}
                    onChange={e => setMeetingLink(e.target.value)}
                    placeholder="https://meet.google.com/xxx-yyyy-zzz or Zoom URL"
                    className="w-full pl-9 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-mono text-xs"
                  />
                  <LinkIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>
            </div>

            {(meetingPlatform === 'in_person' || venue) && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Room / Venue Location (Campus)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={venue}
                    onChange={e => setVenue(e.target.value)}
                    placeholder="e.g. ASBMU Campus 1, Boardroom B or Conference Hall 2"
                    className="w-full pl-9 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  />
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Target Audience */}
          <div className="space-y-4 pt-3 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Target Audience & Members
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: 'all_oc', label: 'All OC Members', sub: 'Broadcast to everyone' },
                { id: 'department', label: 'Department Only', sub: `${department}` },
                { id: 'secretariat', label: 'Core Secretariat', sub: 'Secretariat leads' },
                { id: 'eb', label: 'Executive Board', sub: 'Chairs & Co-Chairs' },
                { id: 'custom', label: 'Custom List', sub: 'Pick members' }
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTargetAudience(opt.id as any)}
                  className={`p-3 rounded-xl border text-left transition ${
                    targetAudience === opt.id
                      ? 'bg-indigo-50/80 border-indigo-400 text-indigo-950 ring-2 ring-indigo-200'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-bold text-xs">{opt.label}</div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">{opt.sub}</div>
                </button>
              ))}
            </div>

            {targetAudience === 'custom' && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="text-xs font-semibold text-slate-700">Add Specific Members:</div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customMemberInput}
                    onChange={e => setCustomMemberInput(e.target.value)}
                    placeholder="Enter member email or select from list below"
                    className="flex-1 px-3.5 py-2 border border-slate-300 rounded-lg text-xs"
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomAttendee(customMemberInput);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleAddCustomAttendee(customMemberInput)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-xs text-white"
                  >
                    Add
                  </Button>
                </div>

                {/* Quick suggestions from database */}
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
                  {dbApplications.slice(0, 15).map(app => (
                    <button
                      key={app.uid || app.email}
                      type="button"
                      onClick={() => handleAddCustomAttendee(app.email)}
                      className={`text-[11px] px-2 py-1 rounded-md border transition ${
                        customAttendees.includes(app.email)
                          ? 'bg-indigo-100 text-indigo-800 border-indigo-300 font-semibold'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      + {app.name || app.email}
                    </button>
                  ))}
                </div>

                {/* Selected Custom Members */}
                {customAttendees.length > 0 && (
                  <div className="pt-2 flex flex-wrap gap-1.5">
                    {customAttendees.map(email => (
                      <span
                        key={email}
                        className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-1 rounded-full text-xs font-medium"
                      >
                        {email}
                        <button
                          type="button"
                          onClick={() => handleRemoveCustomAttendee(email)}
                          className="hover:text-rose-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 4: Agenda Builder */}
          <div className="space-y-4 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> Meeting Agenda & Discussion Points
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {agenda.length} items planned
              </span>
            </div>

            {/* List of current items */}
            <div className="space-y-2">
              {agenda.map((item, idx) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between p-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white transition group"
                >
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-slate-800">{item.topic}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        {item.presenter && <span>Lead: {item.presenter}</span>}
                        {item.duration && <span>• {item.duration}</span>}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveAgendaItem(item.id)}
                    className="text-slate-400 hover:text-rose-600 p-1 opacity-60 group-hover:opacity-100 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add new agenda item */}
            <div className="p-3.5 bg-slate-50 border border-dashed border-slate-300 rounded-xl space-y-3">
              <div className="text-xs font-semibold text-slate-700">Add Agenda Item:</div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={newTopic}
                  onChange={e => setNewTopic(e.target.value)}
                  placeholder="Topic / Agenda description"
                  className="sm:col-span-2 px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
                <input
                  type="text"
                  value={newPresenter}
                  onChange={e => setNewPresenter(e.target.value)}
                  placeholder="Lead / Presenter (optional)"
                  className="px-3 py-2 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Duration:</span>
                  {['5 mins', '10 mins', '15 mins', '30 mins'].map(dur => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setNewDuration(dur)}
                      className={`text-[11px] px-2 py-1 rounded-md border ${
                        newDuration === dur
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}
                    >
                      {dur}
                    </button>
                  ))}
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddAgendaItem}
                  className="bg-indigo-600 hover:bg-indigo-700 text-xs text-white"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Topic
                </Button>
              </div>
            </div>
          </div>

          {/* Section 5: Notification Option */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between p-3 bg-indigo-50/60 rounded-xl border border-indigo-100">
            <div className="flex items-center gap-2.5">
              <Send className="w-4 h-4 text-indigo-600" />
              <div>
                <div className="text-xs font-bold text-indigo-950">
                  Send Meeting Invite & Agenda Now
                </div>
                <div className="text-[11px] text-indigo-600">
                  Dispatches meeting link and agenda to targeted members via email
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={sendInviteEmail}
                onChange={e => setSendInviteEmail(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs"
          >
            Cancel
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleSubmit}
            disabled={isSaving}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-5 shadow-sm"
          >
            {isSaving ? 'Saving...' : initialData ? 'Update Meeting' : 'Schedule & Confirm'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
