// app/marksheet/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Edit, Lock, Save, X, Loader2, Download, Plus, Mail } from 'lucide-react'
import Link from 'next/link'
import { initializeApp } from 'firebase/app'
import { getDatabase, ref, get, set, push } from 'firebase/database'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const db = getDatabase(app)

type Mark = {
  id?: string
  portfolioId: string
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
  email?: string
}

type CommitteeData = {
  id: string
  name: string
  portfolios: {
    id: string
    country: string
    isVacant: boolean
    email?: string
  }[]
  marks: Mark[]
  pin: string
}

export default function MarksheetPage() {
  const [committees, setCommittees] = useState<CommitteeData[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<{committeeId: string, markId?: string} | null>(null)
  const [tempMarks, setTempMarks] = useState<Partial<Mark>>({})
  const [authModal, setAuthModal] = useState(false)
  const [pin, setPin] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [saving, setSaving] = useState(false)
  const [sendingEmails, setSendingEmails] = useState(false)
  const [emailStatus, setEmailStatus] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const committeesRef = ref(db, 'committees')
        const committeesSnapshot = await get(committeesRef)
        
        if (committeesSnapshot.exists()) {
          const committeesData = committeesSnapshot.val()
          const committeesArray: CommitteeData[] = []
          
          const committeePins: Record<string, string> = {
            "-OMXF6IG-ImKpreblirV": "515234",
            "-OMXLYbzoySe9OsNASty": "515233"
          }

          for (const committeeId in committeesData) {
            const marksRef = ref(db, `marksheets/${committeeId}/marks`)
            const marksSnapshot = await get(marksRef)
            
            const portfolios = Object.keys(committeesData[committeeId].portfolios || {}).map(portfolioId => ({
              id: portfolioId,
              country: committeesData[committeeId].portfolios[portfolioId].country,
              isVacant: committeesData[committeeId].portfolios[portfolioId].isVacant,
              email: committeesData[committeeId].portfolios[portfolioId].email || ''
            }))

            const marks = marksSnapshot.exists() 
              ? Object.keys(marksSnapshot.val()).map(markId => ({
                  id: markId,
                  ...marksSnapshot.val()[markId]
                }))
              : []

            committeesArray.push({
              id: committeeId,
              name: committeesData[committeeId].name,
              portfolios,
              marks,
              pin: committeePins[committeeId] || '000000'
            })
          }

          setCommittees(committeesArray)
        }
        setLoading(false)
      } catch (err) {
        console.error('Failed to load data:', err)
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleAdminAuth = () => {
    if (pin === '515234' || pin === '515233') {
      setIsAdmin(true)
      setAuthModal(false)
      setPin('')
    } else {
      alert('Incorrect PIN')
    }
  }

  const startEditing = (committeeId: string, mark?: Mark) => {
    setEditing({ committeeId, markId: mark?.id })
    setTempMarks(mark ? { ...mark } : {
      portfolioId: '',
      country: '',
      alt: '',
      gsl: 0,
      mod1: 0,
      mod2: 0,
      mod3: 0,
      mod4: 0,
      lobby: 0,
      chits: 0,
      fp: 0,
      doc: 0,
      total: 0,
      email: ''
    })
  }

  const cancelEditing = () => {
    setEditing(null)
    setTempMarks({})
  }

  const saveChanges = async () => {
    if (!editing) return
    
    try {
      setSaving(true)
      const { committeeId, markId } = editing
      const committee = committees.find(c => c.id === committeeId)
      if (!committee) return

      const calculatedTotal = (
        (tempMarks.gsl || 0) +
        (tempMarks.mod1 || 0) +
        (tempMarks.mod2 || 0) +
        (tempMarks.mod3 || 0) +
        (tempMarks.mod4 || 0) +
        (tempMarks.lobby || 0) +
        (tempMarks.chits || 0) +
        (tempMarks.fp || 0) +
        (tempMarks.doc || 0)
      )

      const markData = {
        ...tempMarks,
        total: calculatedTotal
      }

      if (markId) {
        await set(ref(db, `marksheets/${committeeId}/marks/${markId}`), markData)
        
        setCommittees(prev => 
          prev.map(c => {
            if (c.id === committeeId) {
              return {
                ...c,
                marks: c.marks.map(m => 
                  m.id === markId ? { ...m, ...markData, id: markId } : m
                )
              }
            }
            return c
          })
        )
      } else {
        const newMarkRef = push(ref(db, `marksheets/${committeeId}/marks`))
        await set(newMarkRef, markData)
        
        setCommittees(prev => 
          prev.map(c => {
            if (c.id === committeeId) {
              return {
                ...c,
                marks: [...c.marks, { ...markData, id: newMarkRef.key }]
              }
            }
            return c
          })
        )
      }
      
      setEditing(null)
      setTempMarks({})
    } catch (error) {
      console.error('Error saving marks:', error)
      alert('Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  const deleteMark = async (committeeId: string, markId: string) => {
    if (!confirm('Are you sure you want to delete this mark entry?')) return
    
    try {
      await set(ref(db, `marksheets/${committeeId}/marks/${markId}`), null)
      
      setCommittees(prev => 
        prev.map(c => {
          if (c.id === committeeId) {
            return {
              ...c,
              marks: c.marks.filter(m => m.id !== markId)
            }
          }
          return c
        })
      )
    } catch (error) {
      console.error('Error deleting mark:', error)
      alert('Failed to delete mark')
    }
  }

  const handleMarkChange = (field: keyof Mark, value: string) => {
    const numValue = parseFloat(value)
    setTempMarks(prev => ({
      ...prev,
      [field]: isNaN(numValue) ? value : numValue
    }))
  }

  const downloadCommitteePDF = (committee: CommitteeData) => {
    const sortedMarks = [...committee.marks].sort((a, b) => b.total - a.total)
    
    const doc = new jsPDF()
    
    doc.setFontSize(16)
    doc.text(`${committee.name} Marksheet`, 14, 15)
    doc.setFontSize(10)
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 22)
    
    const headers = [
      'Country', 'Alt', 'GSL (10)', 'MOD 1 (5)', 'MOD 2 (5)', 'MOD 3 (5)', 
      'MOD4 (5)', 'Lobby (5)', 'Chits (5)', 'FP (5)', 'DOC (5)', 'Total (50)', 'Award'
    ]
    
    const data = sortedMarks.map((mark, index) => [
      mark.country,
      mark.alt,
      mark.gsl,
      mark.mod1,
      mark.mod2,
      mark.mod3,
      mark.mod4,
      mark.lobby,
      mark.chits,
      mark.fp,
      mark.doc,
      mark.total.toFixed(2),
      index === 0 ? 'Best Delegate' : 
      index === 1 ? 'High Commendation' : 
      index === 2 ? 'Special Mention' : 
      index === 3 ? 'Verbal Mention' : ''
    ])
    
    ;(doc as any).autoTable({
      head: [headers],
      body: data,
      startY: 25,
      styles: { fontSize: 8, cellPadding: 2, halign: 'center' },
      headStyles: {
        fillColor: [241, 196, 15],
        textColor: [0, 0, 0],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { halign: 'left' },
        1: { halign: 'center' },
        11: { fontStyle: 'bold' },
        12: { fontStyle: 'italic' }
      }
    })
    
    doc.save(`${committee.name.replace(/[^a-z0-9]/gi, '_')}_Marksheet.pdf`)
  }

  const sendAllMarksheets = async (committee: CommitteeData) => {
    if (!confirm(`Send marksheets to all delegates in ${committee.name}?`)) return;
    
    try {
      setSendingEmails(true);
      setEmailStatus(`Preparing to send emails...`);
  
      let delegates = committee.marks.map(mark => {
        const portfolio = committee.portfolios.find(p => p.id === mark.portfolioId);
        return {
          ...mark,
          email: portfolio?.email || ''
        };
      }).filter(delegate => delegate.email);
  
      // Fallback to registration emails if no portfolio emails
      if (delegates.length === 0) {
        setEmailStatus('Checking registration data for emails...');
        const registrationsRef = ref(db, 'registrations');
        const registrationsSnapshot = await get(registrationsRef);
        const registrations = registrationsSnapshot.exists() ? registrationsSnapshot.val() : {};
  
        delegates = committee.marks.map(mark => {
          const registration = Object.values(registrations).find((reg: any) => 
            reg.portfolioId === mark.portfolioId
          ) as any;
          
          return {
            ...mark,
            email: registration?.delegateInfo?.delegate1?.email || ''
          };
        }).filter(delegate => delegate.email);
      }
  
      if (delegates.length === 0) {
        const portfolioList = committee.portfolios.map(p => p.country).join(', ');
        throw new Error(
          `No valid emails found for ${committee.name}. ` +
          `Portfolios: ${portfolioList}. ` +
          `Please ensure emails are added to portfolios or registrations.`
        );
      }
  
      setEmailStatus(`Sending to ${delegates.length} delegates...`);
      
      const results = await Promise.allSettled(
        delegates.map(async (delegate) => {
          try {
            if (!delegate.email || !delegate.country) {
              throw new Error(`Invalid delegate data for ${delegate.country}`);
            }
  
            const response = await fetch('/api/send-marksheet', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                toEmail: delegate.email,
                toName: delegate.country,
                committeeName: committee.name,
                marks: delegate,
                allMarks: committee.marks // Include all marks for award calculation
              }),
            });
  
            const data = await response.json();
            
            if (!response.ok) {
              throw new Error(data.error || 'Failed to send marksheet');
            }
            
            return { success: true, email: delegate.email };
          } catch (error) {
            console.error(`Failed to send to ${delegate.email}:`, error);
            return { 
              success: false, 
              email: delegate.email,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        })
      );
  
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failed = results.length - successful;
      
      setEmailStatus(`Emails sent: ${successful} successful, ${failed} failed`);
      alert(`Emails processed. ${successful} sent, ${failed} failed.`);
    } catch (error) {
      console.error('Error sending emails:', error);
      setEmailStatus('Failed to send emails');
      alert(`Error: ${error instanceof Error ? error.message : 'Failed to send emails'}`);
    } finally {
      setSendingEmails(false);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-amber-950/20 text-white">
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-amber-800/30">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Button variant="ghost" className="p-2 rounded-full group-hover:bg-amber-900/30 transition-colors">
              <span className="text-amber-300">Home</span>
            </Button>
          </Link>
          
          <div className="flex items-center gap-4">
            <Button 
              variant={isAdmin ? "default" : "outline"} 
              className={`flex items-center gap-2 ${isAdmin ? "bg-amber-600 hover:bg-amber-700 text-white" : "border-amber-500 text-amber-300 hover:bg-amber-900/30"}`}
              onClick={() => isAdmin ? setIsAdmin(false) : setAuthModal(true)}
            >
              {isAdmin ? (
                <>
                  <Lock className="h-4 w-4" />
                  <span className="hidden sm:inline">Admin Mode</span>
                </>
              ) : (
                <>
                  <Edit className="h-4 w-4" />
                  <span className="hidden sm:inline">Admin Login</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-20 pb-16">
        <div className="mb-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-amber-300 mb-3">
            Committee Marksheets
          </h1>
          <p className="text-lg text-amber-100/80 max-w-2xl mx-auto">
            View and manage delegate performance across all committees
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-12 w-12 text-amber-500 animate-spin" />
          </div>
        ) : (
          <div className="space-y-8">
            {committees.map((committee) => {
              const isAddingNew = editing?.committeeId === committee.id && !editing.markId
              const sortedMarks = [...committee.marks].sort((a, b) => b.total - a.total)
              
              return (
                <div key={committee.id} className="bg-black/40 backdrop-blur-sm border border-amber-800/30 rounded-xl overflow-hidden shadow-lg shadow-amber-900/10">
                  <div className="bg-gradient-to-r from-amber-900/40 to-amber-950/40 px-6 py-4 border-b border-amber-800/30 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <h2 className="text-xl font-bold text-amber-300">{committee.name}</h2>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className="border-amber-500 text-amber-300 hover:bg-amber-900/30 flex items-center gap-1"
                        onClick={() => downloadCommitteePDF(committee)}
                      >
                        <Download className="h-4 w-4" />
                        <span>Download PDF</span>
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      {isAdmin && (
                        <Button 
                          size="sm" 
                          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1"
                          onClick={() => sendAllMarksheets(committee)}
                          disabled={sendingEmails}
                        >
                          {sendingEmails ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Mail className="h-4 w-4" />
                          )}
                          <span>Email All Delegates</span>
                        </Button>
                      )}
                      {isAdmin && (
                        <Button 
                          size="sm" 
                          className="bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1"
                          onClick={() => startEditing(committee.id)}
                          disabled={!!editing}
                        >
                          <Plus className="h-4 w-4" />
                          <span>Add Row</span>
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {emailStatus && (
                    <div className="px-6 py-2 bg-blue-900/30 text-blue-200 text-sm">
                      {emailStatus}
                    </div>
                  )}
                  
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-amber-800/30 bg-amber-900/10">
                          <th className="px-4 py-3 text-left text-xs font-medium text-amber-300 uppercase tracking-wider">Country</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-amber-300 uppercase tracking-wider">Alt</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-amber-300 uppercase tracking-wider">GSL (10)</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-amber-300 uppercase tracking-wider">MOD 1 (5)</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-amber-300 uppercase tracking-wider">MOD 2 (5)</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-amber-300 uppercase tracking-wider">MOD 3 (5)</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-amber-300 uppercase tracking-wider">MOD4 (5)</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-amber-300 uppercase tracking-wider">Lobby (5)</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-amber-300 uppercase tracking-wider">Chits (5)</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-amber-300 uppercase tracking-wider">FP (5)</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-amber-300 uppercase tracking-wider">DOC (5)</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-amber-300 uppercase tracking-wider">Total (50)</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-amber-300 uppercase tracking-wider">Award</th>
                          {isAdmin && (
                            <th className="px-4 py-3 text-left text-xs font-medium text-amber-300 uppercase tracking-wider">Actions</th>
                          )}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-amber-800/20">
                        {isAddingNew && (
                          <tr className="bg-amber-900/10">
                            <td className="px-4 py-3 whitespace-nowrap">
                              <select
                                value={tempMarks.portfolioId || ''}
                                onChange={(e) => {
                                  const portfolioId = e.target.value
                                  const portfolio = committee.portfolios.find(p => p.id === portfolioId)
                                  handleMarkChange('portfolioId', portfolioId)
                                  handleMarkChange('country', portfolio?.country || '')
                                  handleMarkChange('email', portfolio?.email || '')
                                }}
                                className="w-full max-w-[120px] bg-black/70 border border-amber-500/50 rounded px-2 py-1 text-white text-sm focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                              >
                                <option value="">Select Country</option>
                                {committee.portfolios.map(portfolio => (
                                  <option key={portfolio.id} value={portfolio.id}>
                                    {portfolio.country}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <select
                                value={tempMarks.alt || ''}
                                onChange={(e) => handleMarkChange('alt', e.target.value)}
                                className="w-full max-w-[60px] bg-black/70 border border-amber-500/50 rounded px-2 py-1 text-white text-sm focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                              >
                                <option value="">Alt</option>
                                <option value="p">p</option>
                                <option value="PV">PV</option>
                                <option value="nv">nv</option>
                              </select>
                            </td>
                            
                            {['gsl', 'mod1', 'mod2', 'mod3', 'mod4', 'lobby', 'chits', 'fp', 'doc'].map((field) => (
                              <td key={field} className="px-4 py-3 whitespace-nowrap">
                                <input
                                  type="number"
                                  value={tempMarks[field as keyof Mark] || 0}
                                  onChange={(e) => handleMarkChange(field as keyof Mark, e.target.value)}
                                  className="w-full max-w-[60px] bg-black/70 border border-amber-500/50 rounded px-2 py-1 text-white text-sm focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                                  step="0.25"
                                  min="0"
                                  max={field === 'gsl' ? 10 : 5}
                                />
                              </td>
                            ))}
                            
                            <td className="px-4 py-3 whitespace-nowrap font-bold text-amber-300 text-sm">
                              {Object.keys(tempMarks).length > 0 ? 
                                (Object.values(tempMarks).slice(3, 12).reduce((sum: number, val) => sum + (typeof val === 'number' ? val : 0), 0).toFixed(2))
                                : '0.00'
                              }
                            </td>
                            
                            <td className="px-4 py-3 whitespace-nowrap text-sm italic text-amber-200">
                              Auto-assigned
                            </td>
                            
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex gap-1">
                                <Button 
                                  size="sm" 
                                  className="bg-green-600 hover:bg-green-700 h-8 px-2"
                                  onClick={saveChanges}
                                  disabled={saving}
                                >
                                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="border-amber-500 text-amber-300 h-8 px-2"
                                  onClick={cancelEditing}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )}
                        
                        {sortedMarks.map((mark, index) => {
                          const isEditing = editing?.committeeId === committee.id && editing.markId === mark.id
                          const currentMark = isEditing ? { ...mark, ...tempMarks } : mark
                          const total = isEditing ? 
                            (Object.values(tempMarks).slice(3, 12).reduce((sum: number, val) => sum + (typeof val === 'number' ? val : 0), 0))
                            : mark.total
                          const award = index === 0 ? 'Best Delegate' : 
                                        index === 1 ? 'High Commendation' : 
                                        index === 2 ? 'Special Mention' : 
                                        index === 3 ? 'Verbal Mention' : ''
                          
                          return (
                            <tr key={mark.id} className={`hover:bg-amber-900/10 group ${
                              index === 0 ? 'bg-amber-900/20' : 
                              index === 1 ? 'bg-amber-900/10' : 
                              index === 2 ? 'bg-amber-900/5' : ''
                            }`}>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-white">
                                {isEditing ? (
                                  <select
                                    value={tempMarks.portfolioId || mark.portfolioId}
                                    onChange={(e) => {
                                      const portfolioId = e.target.value
                                      const portfolio = committee.portfolios.find(p => p.id === portfolioId)
                                      handleMarkChange('portfolioId', portfolioId)
                                      handleMarkChange('country', portfolio?.country || mark.country)
                                      handleMarkChange('email', portfolio?.email || mark.email || '')
                                    }}
                                    className="w-full max-w-[120px] bg-black/70 border border-amber-500/50 rounded px-2 py-1 text-white text-sm focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                                  >
                                    {committee.portfolios.map(portfolio => (
                                      <option key={portfolio.id} value={portfolio.id}>
                                        {portfolio.country}
                                      </option>
                                    ))}
                                  </select>
                                ) : (
                                  mark.country
                                )}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-amber-100">
                                {isEditing ? (
                                  <select
                                    value={tempMarks.alt || mark.alt}
                                    onChange={(e) => handleMarkChange('alt', e.target.value)}
                                    className="w-full max-w-[60px] bg-black/70 border border-amber-500/50 rounded px-2 py-1 text-white text-sm focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                                  >
                                    <option value="p">p</option>
                                    <option value="PV">PV</option>
                                    <option value="nv">nv</option>
                                  </select>
                                ) : (
                                  mark.alt
                                )}
                              </td>
                              
                              {['gsl', 'mod1', 'mod2', 'mod3', 'mod4', 'lobby', 'chits', 'fp', 'doc'].map((field) => (
                                <td key={field} className="px-4 py-3 whitespace-nowrap text-sm text-amber-100">
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      value={tempMarks[field as keyof Mark] ?? mark[field as keyof Mark]}
                                      onChange={(e) => handleMarkChange(field as keyof Mark, e.target.value)}
                                      className="w-full max-w-[60px] bg-black/70 border border-amber-500/50 rounded px-2 py-1 text-white text-sm focus:ring-1 focus:ring-amber-500 focus:border-amber-500"
                                      step="0.25"
                                      min="0"
                                      max={field === 'gsl' ? 10 : 5}
                                    />
                                  ) : (
                                    currentMark[field as keyof Mark]
                                  )}
                                </td>
                              ))}
                              
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-amber-300">
                                {total.toFixed(2)}
                              </td>
                              
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-amber-100 italic">
                                {award}
                              </td>
                              
                              {isAdmin && (
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-amber-100">
                                  {isEditing ? (
                                    <div className="flex gap-1">
                                      <Button 
                                        size="sm" 
                                        className="bg-green-600 hover:bg-green-700 h-8 px-2"
                                        onClick={saveChanges}
                                        disabled={saving}
                                      >
                                        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="border-amber-500 text-amber-300 h-8 px-2"
                                        onClick={cancelEditing}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="destructive"
                                        className="h-8 px-2"
                                        onClick={() => deleteMark(committee.id, mark.id!)}
                                      >
                                        Delete
                                      </Button>
                                    </div>
                                  ) : (
                                    <div className="flex gap-1">
                                      <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="border-amber-500 text-amber-300 h-8 px-2"
                                        onClick={() => startEditing(committee.id, mark)}
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  )}
                                </td>
                              )}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {authModal && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-gradient-to-b from-black to-amber-950/80 border border-amber-800/50 rounded-xl p-6 max-w-md w-full shadow-xl shadow-amber-900/10">
            <h3 className="text-2xl font-bold text-amber-300 mb-4">Admin Authentication</h3>
            <p className="text-amber-100 mb-4">Enter admin PIN to access editing features:</p>
            
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full bg-black/70 border border-amber-500/50 rounded-lg px-4 py-3 text-white mb-4 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              placeholder="Enter PIN"
            />
            
            <div className="flex justify-end gap-3">
              <Button 
                variant="outline" 
                className="border-amber-500 text-amber-300 hover:bg-amber-900/30"
                onClick={() => setAuthModal(false)}
              >
                Cancel
              </Button>
              <Button 
                className="bg-amber-600 hover:bg-amber-700 text-white font-bold"
                onClick={handleAdminAuth}
              >
                Authenticate
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}