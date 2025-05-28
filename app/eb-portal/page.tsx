'use client'

import { useState, useEffect, Suspense } from 'react'
import { initializeApp } from 'firebase/app'
import { getDatabase, ref, get, query, orderByChild, equalTo, set, update, push } from 'firebase/database'
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  Mail, Lock, User, FileText, Award, Download, QrCode, 
  Loader2, Copy, Users, CheckCircle, XCircle, Globe, 
  Edit, Save, Plus, Trash2, Calendar, Clock, BookOpen, 
  Search, Filter, Upload, FileUp
} from 'lucide-react'
import { Toaster, toast } from 'sonner'
import Link from 'next/link'
import Image from 'next/image'
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
const storage = getStorage(app)

type Committee = {
  id: string
  name: string
  description: string
  topics: string[]
  backgroundGuide: string
  rules: string
  studyGuide?: string
  trainingMaterials?: string[]
  portfolios: {
    [key: string]: {
      country: string
      countryCode: string
      isDoubleDelAllowed: boolean
      isVacant: boolean
      minExperience: number
      email?: string
    }
  }
  eb?: {
    [key: string]: {
      name: string
      role: string
      email: string
      photourl: string
      instagram: string
      bio: string
    }
  }
}

type Delegate = {
  id: string
  name: string
  email: string
  committeeId: string
  portfolioId: string
  isCheckedIn: boolean
  institution?: string
  experience?: number
}

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
  notes?: string
}

type Resource = {
  id: string
  title: string
  description: string
  type: 'guide' | 'rules' | 'template' | 'training' | 'study' | 'rop'
  url: string
  committee?: string
  pages?: number
  uploadedAt?: string
  uploadedBy?: string
}

type Coupon = {
  id: string
  title: string
  description: string
  code: string
  partner: string
  logo: string
  expiry: string
  discount: string
  terms: string
  isActive: boolean
}

function EBPortalContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const step = searchParams.get('step')

  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [ebMember, setEbMember] = useState<any>(null)
  const [committees, setCommittees] = useState<Committee[]>([])
  const [selectedCommittee, setSelectedCommittee] = useState<string>('')
  const [delegates, setDelegates] = useState<Delegate[]>([])
  const [marks, setMarks] = useState<Mark[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState({
    login: false,
    verify: false,
    committees: false,
    delegates: false,
    marks: false,
    resources: false,
    coupons: false,
    saving: false,
    uploading: false
  })
  const [error, setError] = useState({
    login: null as string | null,
    verify: null as string | null
  })
  const [editingMark, setEditingMark] = useState<Mark | null>(null)
  const [tempMark, setTempMark] = useState<Partial<Mark>>({})
  const [showFilters, setShowFilters] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('dashboard')
  const [uploadingFile, setUploadingFile] = useState({
    type: 'study' as 'study' | 'rop' | 'training',
    file: null as File | null
  })

  // Check for existing session on initial load
  useEffect(() => {
    const session = sessionStorage.getItem('ebSession')
    if (session) {
      const { loggedIn, email, ebMember } = JSON.parse(session)
      if (loggedIn) {
        setLoggedIn(true)
        setEmail(email)
        setEbMember(ebMember)
        fetchEbData(email)
      }
    }
  }, [router])

  // Fetch EB member data and related information
  const fetchEbData = async (email: string) => {
    try {
      setLoading(prev => ({ ...prev, committees: true }))
      
      const committeesRef = ref(db, 'committees')
      const committeesSnapshot = await get(committeesRef)
      
      if (committeesSnapshot.exists()) {
        const committeesData = committeesSnapshot.val()
        const committeesArray: Committee[] = []
        let foundEbMember = null
        
        for (const committeeId in committeesData) {
          const committeeData = committeesData[committeeId]
          if (committeeData.eb) {
            for (const ebId in committeeData.eb) {
              if (committeeData.eb[ebId].email.toLowerCase() === email.toLowerCase()) {
                foundEbMember = {
                  id: ebId,
                  committeeId,
                  ...committeeData.eb[ebId]
                }
              }
            }
          }
          
          committeesArray.push({
            id: committeeId,
            ...committeeData
          })
        }
        
        if (!foundEbMember) {
          throw new Error('No EB member found with this email')
        }
        
        setEbMember(foundEbMember)
        setCommittees(committeesArray)
        setSelectedCommittee(foundEbMember.committeeId)
        
        fetchDelegates(foundEbMember.committeeId)
        fetchMarks(foundEbMember.committeeId)
        fetchResources(foundEbMember.committeeId)
        fetchCoupons()

        sessionStorage.setItem('ebSession', JSON.stringify({
          loggedIn: true,
          email,
          ebMember: foundEbMember
        }))
      }
    } catch (error) {
      console.error('Error fetching EB data:', error)
      handleLogout()
    } finally {
      setLoading(prev => ({ ...prev, committees: false }))
    }
  }

  const fetchDelegates = async (committeeId: string) => {
    try {
      setLoading(prev => ({ ...prev, delegates: true }))
      
      const delegatesRef = ref(db, 'registrations')
      const delegatesQuery = query(
        delegatesRef,
        orderByChild('committeeId'),
        equalTo(committeeId)
      )
      const snapshot = await get(delegatesQuery)
      
      if (snapshot.exists()) {
        const delegatesData = snapshot.val()
        const delegatesList = Object.keys(delegatesData).map(key => ({
          id: key,
          ...delegatesData[key].delegateInfo.delegate1,
          committeeId: delegatesData[key].committeeId,
          portfolioId: delegatesData[key].portfolioId,
          isCheckedIn: delegatesData[key].isCheckedIn || false
        })) as Delegate[]
        setDelegates(delegatesList)
      }
    } catch (error) {
      console.error('Error fetching delegates:', error)
    } finally {
      setLoading(prev => ({ ...prev, delegates: false }))
    }
  }

  const fetchMarks = async (committeeId: string) => {
    try {
      setLoading(prev => ({ ...prev, marks: true }))
      
      const marksRef = ref(db, `marksheets/${committeeId}/marks`)
      const marksSnapshot = await get(marksRef)
      
      if (marksSnapshot.exists()) {
        const marksData = marksSnapshot.val()
        const marksList = Object.keys(marksData).map(key => ({
          id: key,
          ...marksData[key]
        })) as Mark[]
        setMarks(marksList)
      } else {
        setMarks([])
      }
    } catch (error) {
      console.error('Error fetching marks:', error)
    } finally {
      setLoading(prev => ({ ...prev, marks: false }))
    }
  }

  const fetchResources = async (committeeId: string) => {
    try {
      setLoading(prev => ({ ...prev, resources: true }))
      
      const committeeRef = ref(db, `committees/${committeeId}`)
      const committeeSnapshot = await get(committeeRef)
      const resourcesList: Resource[] = []
      
      if (committeeSnapshot.exists()) {
        const committeeData = committeeSnapshot.val()
        
        // Add study guide
        if (committeeData.studyGuide) {
          resourcesList.push({
            id: `study-${committeeId}`,
            title: `${committeeData.name} Study Guide`,
            description: `Study guide for ${committeeData.name}`,
            type: 'study',
            url: committeeData.studyGuide,
            committee: committeeId,
            uploadedAt: committeeData.updatedAt || new Date().toISOString(),
            uploadedBy: 'EB Organizer'
          })
        }
        
        // Add rules of procedure
        if (committeeData.rules) {
          resourcesList.push({
            id: `rules-${committeeId}`,
            title: `Rules of Procedure`,
            description: `Rules for ${committeeData.name}`,
            type: 'rules',
            url: committeeData.rules,
            committee: committeeId,
            uploadedAt: committeeData.updatedAt || new Date().toISOString(),
            uploadedBy: 'EB Organizer'
          })
        }
        
        // Add training materials
        if (committeeData.trainingMaterials && Array.isArray(committeeData.trainingMaterials)) {
          committeeData.trainingMaterials.forEach((url: string, index: number) => {
            resourcesList.push({
              id: `training-${committeeId}-${index}`,
              title: `Training Material ${index + 1}`,
              description: `Training material for ${committeeData.name}`,
              type: 'training',
              url,
              committee: committeeId,
              uploadedAt: committeeData.updatedAt || new Date().toISOString(),
              uploadedBy: 'EB Organizer'
            })
          })
        }
        
        // Add background guide
        if (committeeData.backgroundGuide) {
          resourcesList.push({
            id: `guide-${committeeId}`,
            title: `Background Guide`,
            description: `Background guide for ${committeeData.name}`,
            type: 'guide',
            url: committeeData.backgroundGuide,
            committee: committeeId,
            uploadedAt: committeeData.updatedAt || new Date().toISOString(),
            uploadedBy: 'EB Organizer'
          })
        }
      }
      
      // Fetch additional resources from resources node
      const resourcesRef = ref(db, 'resources')
      const resourcesSnapshot = await get(resourcesRef)
      
      if (resourcesSnapshot.exists()) {
        const resourcesData = resourcesSnapshot.val()
        Object.keys(resourcesData).forEach(key => {
          if (resourcesData[key].committee === committeeId) {
            resourcesList.push({
              id: key,
              ...resourcesData[key]
            })
          }
        })
      }
      
      setResources(resourcesList)
    } catch (error) {
      console.error('Error fetching resources:', error)
    } finally {
      setLoading(prev => ({ ...prev, resources: false }))
    }
  }

  const fetchCoupons = async () => {
    try {
      setLoading(prev => ({ ...prev, coupons: true }))
      
      const couponsRef = ref(db, 'coupons')
      const couponsSnapshot = await get(couponsRef)
      
      if (couponsSnapshot.exists()) {
        const couponsData = couponsSnapshot.val()
        const couponsList = Object.keys(couponsData).map(key => ({
          id: key,
          ...couponsData[key]
        })) as Coupon[]
        setCoupons(couponsList.filter(c => c.isActive))
      }
    } catch (error) {
      console.error('Error fetching coupons:', error)
    } finally {
      setLoading(prev => ({ ...prev, coupons: false }))
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(prev => ({ ...prev, login: true }))
    setError(prev => ({ ...prev, login: null }))

    try {
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new Error('Please enter a valid email address')
      }

      const response = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send OTP')
      }
      
      sessionStorage.setItem('ebEmail', email)
      router.push('/eb-portal?step=verify')
      toast.success('OTP sent to your email')
    } catch (err: any) {
      setError(prev => ({ ...prev, login: err.message }))
      toast.error(err.message)
    } finally {
      setLoading(prev => ({ ...prev, login: false }))
    }
  }

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(prev => ({ ...prev, verify: true }))
    setError(prev => ({ ...prev, verify: null }))

    try {
      if (!otp || otp.length !== 6 || !/^\d+$/.test(otp)) {
        throw new Error('Please enter a valid 6-digit OTP')
      }

      const response = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Invalid OTP')
      }

      setLoggedIn(true)
      sessionStorage.removeItem('ebEmail')
      
      fetchEbData(email)
      router.push('/eb-portal')
      toast.success('Login successful')
    } catch (err: any) {
      setError(prev => ({ ...prev, verify: err.message }))
      toast.error(err.message)
    } finally {
      setLoading(prev => ({ ...prev, verify: false }))
    }
  }

  const handleLogout = () => {
    setLoggedIn(false)
    setEbMember(null)
    setCommittees([])
    setDelegates([])
    setMarks([])
    setResources([])
    setCoupons([])
    sessionStorage.removeItem('ebSession')
    sessionStorage.removeItem('ebEmail')
    router.push('/eb-portal')
    toast.info('Logged out successfully')
  }

  const toggleCheckIn = async (delegateId: string, isCheckedIn: boolean) => {
    try {
      await update(ref(db, `registrations/${delegateId}`), {
        isCheckedIn: !isCheckedIn
      })
      
      setDelegates(prev => 
        prev.map(d => 
          d.id === delegateId ? { ...d, isCheckedIn: !isCheckedIn } : d
        )
      )
      
      toast.success(`Attendance ${!isCheckedIn ? 'marked' : 'unmarked'} successfully`)
    } catch (error) {
      console.error('Error updating attendance:', error)
      toast.error('Failed to update attendance')
    }
  }

  const startEditingMark = (mark?: Mark) => {
    if (mark) {
      setEditingMark(mark)
      setTempMark({ ...mark })
    } else {
      setEditingMark({
        id: '',
        portfolioId: '',
        country: '',
        alt: 'p',
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
        notes: ''
      })
      setTempMark({
        portfolioId: '',
        country: '',
        alt: 'p',
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
        notes: ''
      })
    }
  }

  const cancelEditingMark = () => {
    setEditingMark(null)
    setTempMark({})
  }

  const handleMarkChange = (field: keyof Mark, value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    setTempMark(prev => ({
      ...prev,
      [field]: isNaN(numValue) ? value : numValue,
      total: field !== 'total' ? calculateTotal({ ...prev, [field]: isNaN(numValue) ? value : numValue }) : numValue
    }))
  }

  const calculateTotal = (markData: Partial<Mark>): number => {
    return (
      (markData.gsl || 0) +
      (markData.mod1 || 0) +
      (markData.mod2 || 0) +
      (markData.mod3 || 0) +
      (markData.mod4 || 0) +
      (markData.lobby || 0) +
      (markData.chits || 0) +
      (markData.fp || 0) +
      (markData.doc || 0)
    )
  }

  const saveMark = async () => {
    if (!editingMark || !selectedCommittee) return
    
    try {
      setLoading(prev => ({ ...prev, saving: true }))
      
      const markData = {
        ...tempMark,
        total: calculateTotal(tempMark),
        committeeId: selectedCommittee,
        updatedAt: new Date().toISOString(),
        updatedBy: ebMember?.name || 'EB Member'
      }

      if (editingMark.id) {
        await set(ref(db, `marksheets/${selectedCommittee}/marks/${editingMark.id}`), markData)
      } else {
        const newMarkRef = ref(db, `marksheets/${selectedCommittee}/marks`)
        await push(newMarkRef, markData)
      }
      
      toast.success('Marks saved successfully')
      fetchMarks(selectedCommittee)
      cancelEditingMark()
    } catch (error) {
      console.error('Error saving marks:', error)
      toast.error('Failed to save marks')
    } finally {
      setLoading(prev => ({ ...prev, saving: false }))
    }
  }

  const deleteMark = async (markId: string) => {
    if (!confirm('Are you sure you want to delete this mark entry?')) return
    
    try {
      await set(ref(db, `marksheets/${selectedCommittee}/marks/${markId}`), null)
      toast.success('Mark deleted successfully')
      fetchMarks(selectedCommittee)
    } catch (error) {
      console.error('Error deleting mark:', error)
      toast.error('Failed to delete mark')
    }
  }

  const downloadMarksheetPDF = () => {
    if (!selectedCommittee || !ebMember) return
    
    const committee = committees.find(c => c.id === selectedCommittee)
    if (!committee) return
    
    const sortedMarks = [...marks].sort((a, b) => b.total - a.total)
    
    const doc = new jsPDF()
    
    doc.setFontSize(16)
    doc.text(`${committee.name} Marksheet`, 14, 15)
    doc.setFontSize(10)
    doc.text(`Generated by ${ebMember.name} (${ebMember.role}) on ${new Date().toLocaleDateString()}`, 14, 22)
    
    const headers = [
      'Rank', 'Country', 'Alt', 'GSL (10)', 'MOD 1 (5)', 'MOD 2 (5)', 'MOD 3 (5)', 
      'MOD4 (5)', 'Lobby (5)', 'Chits (5)', 'FP (5)', 'DOC (5)', 'Total (50)', 'Award', 'Notes'
    ]
    
    const data = sortedMarks.map((mark, index) => [
      index + 1,
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
      index === 3 ? 'Verbal Mention' : '',
      mark.notes || ''
    ])
    
    ;(doc as any).autoTable({
      head: [headers],
      body: data,
      startY: 30,
      styles: { fontSize: 8, cellPadding: 2, halign: 'center' },
      headStyles: {
        fillColor: [241, 196, 15],
        textColor: [0, 0, 0],
        fontStyle: 'bold'
      },
      columnStyles: {
        0: { halign: 'center' },
        1: { halign: 'left' },
        2: { halign: 'center' },
        13: { fontStyle: 'bold' },
        14: { fontStyle: 'italic' },
        15: { halign: 'left', cellWidth: 30 }
      }
    })
    
    doc.save(`${committee.name.replace(/[^a-z0-9]/gi, '_')}_Marksheet.pdf`)
  }

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!uploadingFile.file || !selectedCommittee) {
      toast.error('Please select a file and ensure a committee is selected')
      return
    }

    try {
      setLoading(prev => ({ ...prev, uploading: true }))
      
      const fileRef = storageRef(storage, `committees/${selectedCommittee}/${uploadingFile.type}/${uploadingFile.file.name}`)
      const snapshot = await uploadBytes(fileRef, uploadingFile.file)
      const downloadURL = await getDownloadURL(fileRef)
      
      const committeeRef = ref(db, `committees/${selectedCommittee}`)
      const committeeSnapshot = await get(committeeRef)
      
      if (committeeSnapshot.exists()) {
        const committeeData = committeeSnapshot.val()
        let updateData = {}
        
        if (uploadingFile.type === 'study') {
          updateData = { studyGuide: downloadURL }
        } else if (uploadingFile.type === 'rop') {
          updateData = { rules: downloadURL }
        } else if (uploadingFile.type === 'training') {
          const existingMaterials = committeeData.trainingMaterials || []
          updateData = { trainingMaterials: [...existingMaterials, downloadURL] }
        }
        
        await update(committeeRef, updateData)
        
        const newResourceRef = ref(db, 'resources')
        const resourceData = {
          title: `${committees.find(c => c.id === selectedCommittee)?.name} ${uploadingFile.type === 'study' ? 'Study Guide' : uploadingFile.type === 'rop' ? 'Rules of Procedure' : 'Training Material'}`,
          description: `Uploaded by ${ebMember?.name}`,
          type: uploadingFile.type === 'study' ? 'study' : uploadingFile.type === 'rop' ? 'rules' : 'training',
          url: downloadURL,
          committee: selectedCommittee,
          uploadedAt: new Date().toISOString(),
          uploadedBy: ebMember?.name || 'EB Member'
        }
        await push(newResourceRef, resourceData)
        
        toast.success('File uploaded successfully')
        fetchEbData(email)
        fetchResources(selectedCommittee)
        setUploadingFile({ type: 'study', file: null })
      } else {
        toast.error('Committee not found')
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      toast.error('Failed to upload file')
    } finally {
      setLoading(prev => ({ ...prev, uploading: false }))
    }
  }

  const filteredDelegates = delegates.filter(delegate => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      return (
        delegate.name.toLowerCase().includes(term) ||
        (delegate.email && delegate.email.toLowerCase().includes(term)) ||
        (delegate.institution && delegate.institution.toLowerCase().includes(term))
      )
    }
    
    if (statusFilter !== 'all') {
      const desiredStatus = statusFilter === 'checkedIn'
      if (delegate.isCheckedIn !== desiredStatus) return false
    }
    
    return true
  })

  const filteredMarks = marks.filter(mark => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      return (
        mark.country.toLowerCase().includes(term) ||
        (mark.email && mark.email.toLowerCase().includes(term))
      )
    }
    return true
  })

  // Login form
  if (!loggedIn && step !== 'verify') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black to-amber-950/20 flex items-center justify-center p-4">
        <Toaster position="top-center" richColors theme="dark" />
        <div className="bg-gradient-to-b from-black to-amber-950/80 border border-amber-800/50 p-8 rounded-xl shadow-lg shadow-amber-900/10 w-full max-w-md">
          <div className="text-center mb-8">
            <User className="h-12 w-12 text-amber-400 mx-auto" />
            <h1 className="text-3xl font-bold mt-4 text-amber-300">Executive Board Portal</h1>
            <p className="text-amber-100/80 mt-2">Sign in with your registered EB email</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-amber-200 mb-1">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-black/70 border border-amber-500/50 rounded-lg text-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="your@email.com"
                required
                disabled={loading.login}
              />
              {error.login && (
                <p className="mt-1 text-sm text-red-400">{error.login}</p>
              )}
            </div>
            <Button 
              type="submit" 
              className="w-full bg-amber-600 hover:bg-amber-700 h-11 text-black font-bold"
              disabled={loading.login}
            >
              {loading.login ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" /> 
                  Send OTP
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    )
  }

  // OTP verification form
  if (!loggedIn && step === 'verify') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black to-amber-950/20 flex items-center justify-center p-4">
        <Toaster position="top-center" richColors theme="dark" />
        <div className="bg-gradient-to-b from-black to-amber-950/80 border border-amber-800/50 p-8 rounded-xl shadow-lg shadow-amber-900/10 w-full max-w-md">
          <div className="text-center mb-8">
            <User className="h-12 w-12 text-amber-400 mx-auto" />
            <h1 className="text-3xl font-bold mt-4 text-amber-300">Verify Your OTP</h1>
            <p className="text-amber-100/80 mt-2">We sent a 6-digit code to {email}</p>
          </div>
          
          <form onSubmit={verifyOtp} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-amber-200 mb-1">OTP Code</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-2 bg-black/70 border border-amber-500/50 rounded-lg text-white text-center text-xl tracking-widest focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                placeholder="123456"
                required
                disabled={loading.verify}
              />
              {error.verify && (
                <p className="mt-1 text-sm text-red-400">{error.verify}</p>
              )}
            </div>
            <div className="flex gap-4">
              <Button
                type="button"
                variant="outline"
                className="w-full border-amber-500 text-amber-300 hover:bg-amber-900/30 h-11"
                onClick={() => {
                  setOtp('')
                  router.push('/eb-portal')
                }}
                disabled={loading.verify}
              >
                Back
              </Button>
              <Button 
                type="submit" 
                className="w-full bg-amber-600 hover:bg-amber-700 h-11 text-black font-bold"
                disabled={loading.verify}
              >
                {loading.verify ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" /> 
                    Verify & Login
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  // Main dashboard
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-amber-950/20 text-white">
      <Toaster position="top-right" richColors theme="dark" />
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-amber-800/30">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <Button variant="ghost" className="p-2 rounded-full group-hover:bg-amber-900/30 transition-colors">
              <span className="text-amber-300">Home</span>
            </Button>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-amber-200 hidden sm:inline">{ebMember?.name} ({ebMember?.role})</span>
            <Button 
              variant="outline" 
              onClick={handleLogout}
              className="border-amber-500 text-amber-300 hover:bg-amber-900/30 h-9"
            >
              <Lock className="h-4 w-4 mr-2" /> 
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 pt-20 pb-16">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-amber-900/40 to-amber-950/40 text-white p-6 rounded-xl mb-8 border border-amber-800/30">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <div>
              <h1 className="text-2xl font-bold mb-2 text-amber-300">Welcome, {ebMember?.name}!</h1>
              <p className="text-amber-100/80">
                {committees.find(c => c.id === selectedCommittee)?.name || 'Executive Board Portal'}
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center gap-4">
              <div className="bg-black/50 p-2 rounded-lg border border-amber-800/30">
                <p className="text-xs text-amber-200/80">Your Role</p>
                <p className="text-sm font-mono text-amber-300">{ebMember?.role}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-amber-800/30 mb-8">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 font-medium ${activeTab === 'dashboard' ? 'text-amber-300 border-b-2 border-amber-400' : 'text-amber-200/70 hover:text-amber-300'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('delegates')}
            className={`px-4 py-2 font-medium ${activeTab === 'delegates' ? 'text-amber-300 border-b-2 border-amber-400' : 'text-amber-200/70 hover:text-amber-300'}`}
          >
            Delegates
          </button>
          <button
            onClick={() => setActiveTab('marks')}
            className={`px-4 py-2 font-medium ${activeTab === 'marks' ? 'text-amber-300 border-b-2 border-amber-400' : 'text-amber-200/70 hover:text-amber-300'}`}
          >
            Marks Management
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`px-4 py-2 font-medium ${activeTab === 'resources' ? 'text-amber-300 border-b-2 border-amber-400' : 'text-amber-200/70 hover:text-amber-300'}`}
          >
            Resources
          </button>
          <button
            onClick={() => setActiveTab('coupons')}
            className={`px-4 py-2 font-medium ${activeTab === 'coupons' ? 'text-amber-300 border-b-2 border-amber-400' : 'text-amber-200/70 hover:text-amber-300'}`}
          >
            Partner Coupons
          </button>
        </div>

        {selectedCommittee && activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Committee Overview */}
            <div className="bg-black/40 backdrop-blur-sm border border-amber-800/30 rounded-xl p-6">
              <h2 className="text-xl font-bold text-amber-300 mb-4 flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                Committee Overview
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-amber-200/80">Committee Name</p>
                  <p className="text-lg font-bold text-amber-300">
                    {committees.find(c => c.id === selectedCommittee)?.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-amber-200/80">Total Delegates</p>
                  <p className="text-lg font-bold text-amber-300">{delegates.length}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-amber-200/80">Agenda</p>
                  <ul className="list-disc pl-5 text-amber-100">
                    {committees.find(c => c.id === selectedCommittee)?.topics.map((topic, index) => (
                      <li key={index} className="text-sm">{topic}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* File Upload Section */}
            <div className="bg-black/40 backdrop-blur-sm border border-amber-800/30 rounded-xl p-6">
              <h2 className="text-xl font-bold text-amber-300 mb-4 flex items-center">
                <FileUp className="h-5 w-5 mr-2" />
                Upload Committee Documents
              </h2>
              <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Study Guide Upload */}
                <div className="bg-black/50 p-4 rounded-lg border border-amber-800/20">
                  <h3 className="text-amber-300 mb-2">Study Guide</h3>
                  <form onSubmit={handleFileUpload} className="flex flex-col gap-2">
                    <input
                      type="file"
                      accept=".pdf"
                      key={uploadingFile.file?.name || 'study-input'}
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file && file.type === 'application/pdf') {
                          setUploadingFile({ type: 'study', file })
                        } else {
                          toast.error('Please select a valid PDF file')
                        }
                      }}
                      className="file-input file-input-bordered file-input-sm w-full bg-black/30 border-amber-800/30 text-amber-100"
                    />
                    <Button 
                      type="submit"
                      className="bg-amber-600-400 hover:bg-amber-700 600 text-black"
                      disabled={!uploadingFile.file || uploadingFile.type !== 'study' || loading.uploading}
                    >
                      {loading.uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>Upload Study Guide</>
                      )}
                    </Button>
                  </form>
                </div>

                {/* Rules of Procedure Upload */}
                <div className="bg-black/50 p-4 rounded-lg border border-amber-800/30">
                  <h3 className="text-amber-300 mb-2">Rules of Procedure</h3>
                  <form onSubmit={handleFileUpload} className="flex flex-col gap-2">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        const file = e.target?.files?.[0]
                        if (file && file.type === 'application/pdf') {
                          setUploadingFile({ type: 'rop', file })
                        } else {
                          toast.error('Please select a valid PDF file')
                        }
                      }}
                      className="file-input file-input-bordered file-input-sm w-full bg-black/30 border-amber-800/30 text-amber-100"
                    />
                    <Button 
                      type="submit"
                      className="bg-amber-600 hover:bg-amber-700 text-black"
                      disabled={loading.uploading || !uploadingFile.file || uploadingFile.type !== 'rop'}
                    >
                      {loading.uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>Upload RoP</>
                      )}
                    </Button>
                  </form>
                </div>

                {/* Training Materials Upload */}
                <div className="bg-black/50 p-4 rounded-lg border border-amber-800/30">
                  <h3 className="text-amber-300 mb-2">Training Materials</h3>
                  <form onSubmit={handleFileUpload} className="flex flex-col gap-2">
                    <input
                      type="file"
                      accept=".pdf,.ppt,.pptx"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file && ['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument'.includes(file.type) {
                          setUploadingFile({ type: 'training', file })
                        } else {
                          toast.error('Please select a valid PDF or PPT file')
                        }
                      }}
                      className="file-input file-input-bordered file-input-sm w-full bg-black/30 border-amber-800/30 text-amber-100"
                    />
                    <Button 
                      type="submit" 
                      className="bg-amber-600 hover:bg-amber-700 text-black"
                      disabled={loading.uploading || !uploadingFile.file || uploadingFile.type !== 'training'}
                    >
                      {loading.uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>Upload Training Material</>
                      )}
                    </Button>
                  </form>
                </div>
              </div>

            {/* Quick Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-black/40 backdrop-blur-sm border border-amber-800/30 p-6 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-200/80">Total Delegates</p>
                    <p className="text-3xl font-bold text-amber-300">{delegates.length}</p>
                  </div>
                  <Users className="h-8 w-8 text-amber-400/80" />
                </div>
              </div>
              <div className="bg-black/40 backdrop-blur-sm border border-amber-800/30 p-6 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-200/80">Checked In</p>
                    <p className="text-3xl font-bold text-amber-300">
                      {delegates.filter(d => d.isCheckedIn).length}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-400/80" />
                </div>
              </div>
              <div className="bg-black/40 backdrop-blur-sm border border-amber-800/30 p-6 rounded-xl">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-amber-200/80">Available Resources</p>
                    <p className="text-3xl font-bold text-amber-300">
                      {resources.length}
                    </p>
                  </div>
                  <FileText className="h-8 w-8 text-amber-400/80" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delegates Tab */}
        {activeTab === 'delegates' && (
          <div className="bg-black/40 backdrop-blur-sm border border-amber-800/30 rounded-xl overflow-hidden shadow-lg shadow-amber-900/10">
            <div className="bg-gradient-to-r from-amber-900/40 to-amber-950/40 px-6 py-4 border-b border-amber-800/30">
              <h2 className="text-xl font-bold text-amber-300 flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Delegates Management
              </h2>
            </div>
            <div className="p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search delegates..."
                    className="w-full pl-10 pr-4 py-2 bg-black/50 border border-amber-800/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-400" />
                </div>
                <Button 
                  onClick={() => setShowFilters(!showFilters)}
                  className="bg-amber-900/30 hover:bg-amber-800/30 text-amber-300"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </Button>
              </div>

              {showFilters && (
                <div className="mb-4 p-4 bg-black/30 border border-amber-800/30 rounded-lg">
                  <label className="block text-sm font-medium text-amber-300 mb-2">Status</label>
                  <select
                    className="w-full bg-black/50 border border-amber-800/30 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-amber-500"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="checkedIn">Checked In</option>
                    <option value="notCheckedIn">Not Checked In</option>
                  </select>
                </div>
              )}

              <div className="space-y-4 max-h-[600px] overflow-y-auto">
                {filteredDelegates.length > 0 ? (
                  filteredDelegates.map(delegate => (
                    <div 
                      key={delegate.id} 
                      className="flex items-center justify-between p-4 bg-black/50 rounded-lg border border-amber-800/30 hover:bg-amber-900/20 transition-colors"
                    >
                      <div className="flex-1">
                        <h3 className="font-medium text-amber-100">{delegate.name}</h3>
                        <p className="text-sm text-amber-200/80">{delegate.email}</p>
                        {delegate.institution && (
                          <p className="text-xs mt-1 text-amber-400/80">
                            {delegate.institution} ({delegate.experience || 0} confs)
                          </p>
                        )}
                      </div>
                      <Button
                        onClick={() => toggleCheckIn(delegate.id, delegate.isCheckedIn)}
                        className={`${
                          delegate.isCheckedIn 
                            ? 'bg-green-900/30 text-green-400 hover:bg-green-800/30' 
                            : 'bg-amber-900/30 text-amber-300 hover:bg-amber-800/30'
                        }`}
                      >
                        {delegate.isCheckedIn ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" /> Checked In
                          </>
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 mr-2" /> Check In
                          </>
                        )}
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-amber-200/80">
                    No delegates found
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Marks Management Tab */}
        {activeTab === 'marks' && (
          <div className="bg-black/40 backdrop-blur-sm border border-amber-800/30 rounded-xl overflow-hidden shadow-lg shadow-amber-900/10">
            <div className="bg-gradient-to-r from-amber-900/40 to-amber-950/40 px-6 py-4 border-b border-amber-800/30">
              <h2 className="text-xl font-bold text-amber-300 flex items-center">
                <Award className="h-5 w-5 mr-2" />
                Marks Management System
              </h2>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <Button 
                  onClick={() => startEditingMark()}
                  className="bg-amber-600 hover:bg-amber-700 text-black"
                >
                  <Plus className="h-4 w-4 mr-2" /> Add New Marks
                </Button>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={downloadMarksheetPDF}
                    class="border-amber-500 text-amber-300 hover:bg-amber-900/30"
                  >
                    <Download className="h-4 w-4 mr-2" /> Export PDF
                  </Button>
                </div>
              </div>

              {editingMark && (
                <div className="bg-black/30 p-4 rounded-lg border border-amber-800/30">
                  <h3 className="text-lg font-bold mb-4 text-amber-300">
                    {editingMark.id ? "Edit Marks" : "Add New Marks"}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-amber-200/80">Country</label>
                      <input
                        type="text"
                        value={tempMark.country || ''}                        onChange={(e) => handleMarkChange('country', e.target.value)}
                        className="w-full bg-black/30 border border-amber-800/30 rounded-md p-2 text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm text-amber-200/80">Alternative</label>
                      <select
                        value={tempMark.alt || ''}                        onChange={(e) => handleMarkChange('alt', e.target.value)}
                        className="w-full bg-black/30 border border-amber-800/30 rounded-md p-2 text-white"
                      >
                        <option value="p">Prime</option>
                        <option value="a">Alternative</option>
                      </select>
                    </div>
                    {['gsl', 'mod1', 'mod2', 'mod2', 'mod3', 'mod4', 'lobby', 'chits', 'fp', 'doc'].map((field) => (
                      <div key={field}>
                        <label className="text-sm text-amber-200/80 capitalize">
                          {field} ({field === 'gsl' ? 10 : 5})
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={field === 'gsl' ? 10 : 5}
                          step={0.1}
                          value={tempMark[field as keyof Mark] || 0}                          onChange={(e) => handleMarkChange(field as keyof Mark, e.target.value)}
                          className="w-full bg-black/30 border border-amber-800/30 rounded-md p-2 text-white"
                        />
                      </div>
                    ))}
                    <div className="col-span-full">
                      <label className="text-sm text-amber-200/80">Notes</label>
                      <textarea
                        value={tempMark.notes || ''}
                        onChange={(e) => handleMarkChange('notes', e.target.value)}
                        className="w-full bg-black/30 border border-amber-800/30 rounded-md p-2 text-white"
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={cancelEditingMark}
                      className="border-amber-500 text-amber-300"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={saveMark}
                      className="bg-amber-600 hover:bg-amber-700 text-black"
                      disabled={loading.saving}
                    >
                      {loading.saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save Marks
                    </Button>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-amber-900/30">
                    <tr>
                      <th className="p-3 text-left text-sm text-amber-300">Country</th>
                      <th className="p-3 text-sm text-amber-300">Alt</th>
                      {['GSL', 'MOD1', 'MOD2', 'MOD3', 'MOD4', 'Lobby', 'Chits', 'FP', 'DOC', 'Total'].map((h) => (
                        <th key={h} className="p-3 text-sm text-amber-300">{h}</th>
                      ))}
                      <th className="p-3 text-sm text-amber-300">Notes</th>
                      <th className="p-3 text-sm text-amber-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMarks.map((mark) => (
                      <tr key={mark.id} className="border-b border-amber-800/30 hover:bg-amber-900/10">
                        <td className="p-3">{mark.country}</td>
                        <td className="p-3 text-center">{mark.alt?.toUpperCase()}</td>
                        <td className="p-3 text-center">{mark.gsl}</td>
                        <td><className="p-3">text-center<td>{mark.mod1}</td>
                        <td><className="p-3">text-center<td>{mark.mod2}</td>
                        <td><className="p-3 text-center">{mark.mod3}</td>
                        <td><className="p-3">text-center<td>{mark.mod4}</td>
                        <td><td className="p-3 text-center">{mark.lobby}</td>
                        <td><td className="p-3 text-center">{mark.chits}</td>
                        <td><td className="p-3 text-center">{mark.fp}</td>
                        <td><td className="p-3 text-center">{mark.doc}</td>
                        <td className="p-3 text-center font-bold text-amber-300">{mark.total.toFixed(1)}</td>
                        <td className="p-3 max-w-[200px] truncate">{mark.notes}</td>
                        <td className="p-3 flex flex-wrap gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditingMark(mark)}
                            className="text-amber-300 hover:bg-amber-900/30"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => mark.id && deleteMark(mark.id)}
                            className="text-red-400 hover:bg-red-900/30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        {/* Resources Tab */}
        {activeTab === 'resources' && (
          <div className="bg-black/40 backdrop-blur-sm border border-amber-800/30 rounded-xl overflow-hidden shadow-lg shadow-amber-900/10">
            <div className="bg-gradient-to-to-r from-amber-900/40 to-amber-950/40 px-6 py-4 border-b border-amber-800/30">
              <h2 className="text-xl font-bold text-amber-300 flex items-center">
                <FileText className="h-5 w-5 mr-amber-2" />
                Committee Resources
              </h2>
            </div>
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search resources..."
                    className="w-full pl-10 pr-4 py-2 bg-black/50 border border-amber-800/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-amber-500 focus:border-amber-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-400" />
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => fetchResources(selectedCommittee)}
                    className="border-amber-500 text-amber-300 hover:bg-amber-900/30"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {resources.filter(r => searchTerm ? r.title.toLowerCase().includes(searchTerm.toLowerCase()) : true).map((resource) => (
                  <div 
                    key={resource.id} 
                    className="bg-black/50 p-4 rounded-lg border border-amber-800/30 hover:border-amber-500 transition-colors"
                  >
                    <div className="flex items-start mb-3">
                      <div className="bg-amber-900/30 p-2 rounded-lg mr-3">
                        {resource.type === 'study' && <BookOpen className="h-5 w-5 text-amber-400" />}
                        {resource.type === 'rules' && <FileText className="h-5 w-5 text-amber-400" />}
                        {resource.type === 'training' && <Award className="h-5 w-5 text-amber-400" />}
                        {resource.type === 'guide' && <FileText className="h-5 w-5 text-amber-400" />}
                      </div>
                      <div>
                        <h3 className="font-medium text-amber-300">{resource.title}</h3>
                        <p className="text-sm text-amber-100/80">{resource.description}</p>
                        <p className="text-xs text-amber-500/80 mt-1">
                          Uploaded by {resource.uploadedBy} • {new Date(resource.uploadedAt || '').toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs bg-amber-900/30 px-2 py-1 rounded-full text-amber-300">
                        {resource.type.toUpperCase()}
                      </span>
                      <Button 
                        asChild
                        variant="outline"
                        className="border-amber-500 text-amber-300 hover:bg-amber-900/30"
                      >
                        <Link href={resource.url} target="_blank">
                          <Download className="h-4 w-4 mr-2" />
                          Download
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
                {resources.length === 0 && (
                  <div className="col-span-full text-center py-6 text-amber-200/80">
                    No resources available
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Coupons Tab */}
        {activeTab === 'coupons' && (
          <div className="bg-black/40 backdrop-blur-sm border border-amber-800/30 rounded-xl overflow-hidden shadow-lg shadow-amber-900/10">
            <div className="bg-gradient-to-r from-amber-900/40 to-amber-950/40 px-6 py-4 border-b border-amber-800/30">
              <h2 className="text-xl font-bold text-amber-300 flex items-center">
                <QrCode className="h-5 w-5 mr-2" />
                Partner Coupons Management
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coupons.map((coupon) => (
                  <div 
                    key={coupon.id} 
                    className="bg-black/50 p-4 rounded-lg border border-amber-800/30 hover:border-amber-500 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {coupon.logo && (
                          <Image
                            src={coupon.logo}
                            alt={coupon.partner}
                            width={40}
                            height={40}
                            className="rounded-lg object-cover"
                          />
                        )}
                        <div>
                          <h3 className="font-medium text-amber-300">{coupon.title}</h3>
                          <p className="text-sm text-amber-200/80">{coupon.partner}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        coupon.isActive ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                      }`}>
                        {coupon.isActive ? 'Active' : 'Expired'}
                      </span>
                    </div>
                    <div className="mb-4">
                      <p className="text-sm text-amber-200/80 mb-2">{coupon.description}</p>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-amber-500/80">
                            Expires: {new Date(coupon.expiry).toLocaleDateString()}
                          </p>
                        </div>
                        <span className="text-lg font-bold text-amber-400">
                          {coupon.discount}
                        </span>
                      </div>
                    </div>
                    <div className="bg-black/30 p-3 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-amber-300">{coupon.code}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(coupon.code)
                            toast.success('Coupon code copied!')
                          }}
                          className="text-amber-300 hover:bg-amber-900/30"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default function Page() {
  return <Suspense fallback={<div>Loading...</div>}>
          <EBPortalContent />
         </Suspense>
}