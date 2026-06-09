// app/eb-portal/page.tsx
'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { ref, get, query, orderByChild, equalTo, set, update, push, onValue } from 'firebase/database';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  User, FileText, Award, Download, QrCode,
  Loader2, Copy, Users, CheckCircle, XCircle, Globe,
  Edit, Save, Plus, Trash2, Calendar, Clock, BookOpen,
  Search, Filter, Upload, FileUp, Lock, ChevronDown, ChevronUp,
  TrendingUp, Briefcase, Mail, Phone, MapPin, Building, GraduationCap,
  DollarSign, Ticket, AlertCircle, RefreshCw
} from 'lucide-react'
import * as Flags from 'country-flag-icons/react/3x2'
import { Toaster, toast } from 'sonner'
import Link from 'next/link'
import Image from 'next/image'
import { jsPDF } from 'jspdf'
import 'jspdf-autotable'
import { firebaseApp, firebaseAuth, firebaseDb, googleProvider } from '@/lib/firebase-client'

const db = firebaseDb
const storage = getStorage(firebaseApp)

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
  phone?: string
  institution?: string
  year?: string
  course?: string
  experience?: number
  committeeId: string
  portfolioId: string
  isCheckedIn: boolean
  isDoubleDel?: boolean
  paymentId?: string
  registrationPhase?: string
  coDelegate?: {
    name: string
    email: string
    phone: string
    institution: string
    year: string
    course: string
    experience: number
  }
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
  isApproved?: boolean
}

type Resource = {
  id: string
  title: string
  description: string
  type: 'guide' | 'rules' | 'template' | 'training' | 'study' | 'rop'
  url: string
  committee?: string
  committeeId?: string
  pages?: number
  uploadedAt?: string
  uploadedBy?: string
  isApproved?: boolean
}

interface Coupon {
  id: string;
  title: string;
  partner: string;
  description: string;
  discount: string;
  expiry: string;
  code: string;
  logo: string;
  terms: string;
  isActive: boolean;
}

function EBPortalContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [authLoading, setAuthLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)
  const [ebMember, setEbMember] = useState<any>(null)
  const [committees, setCommittees] = useState<Committee[]>([])
  const [selectedCommittee, setSelectedCommittee] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ebSelectedCommittee') || ''
    }
    return ''
  })
  const [delegates, setDelegates] = useState<Delegate[]>([])
  const [marks, setMarks] = useState<Mark[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState({
    login: false,
    committees: false,
    delegates: false,
    marks: false,
    resources: false,
    coupons: false,
    saving: false,
    uploading: false,
  });
  const [couponError, setCouponError] = useState<string | null>(null);
  const [editingMark, setEditingMark] = useState<Mark | null>(null)
  const [tempMark, setTempMark] = useState<Partial<Mark>>({})
  const [showFilters, setShowFilters] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ebActiveTab') || 'dashboard'
    }
    return 'dashboard'
  })
  const [uploadingFile, setUploadingFile] = useState({
    type: 'study' as 'study' | 'rop' | 'training',
    file: null as File | null
  })
  const [expandedDelegates, setExpandedDelegates] = useState<Record<string, boolean>>({})
  const [showMarkForm, setShowMarkForm] = useState(false)

  const toggleDelegateExpand = (id: string) => {
    setExpandedDelegates(prev => ({
      ...prev,
      [id]: !prev[id]
    }))
  }

  // Persist activeTab to localStorage
  useEffect(() => {
    localStorage.setItem('ebActiveTab', activeTab)
  }, [activeTab])

  // Persist selectedCommittee to localStorage
  useEffect(() => {
    if (selectedCommittee) {
      localStorage.setItem('ebSelectedCommittee', selectedCommittee)
    }
  }, [selectedCommittee])

  // Firebase Auth listener – persistent session
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user: any) => {
      if (user?.email) {
        setLoggedIn(true)
        setEmail(user.email)
        setAuthError(null)
        fetchEbData(user.email)
      } else {
        setLoggedIn(false)
        setEbMember(null)
        setCommittees([])
      }
      setAuthLoading(false)
    })
    return () => unsubscribe()
  }, [])

  // Fetch EB member data and related information
  const fetchEbData = async (userEmail: string) => {
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
              if (committeeData.eb[ebId].email.toLowerCase() === userEmail.toLowerCase()) {
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

        // Use persisted committee if available, otherwise default to EB member's committee
        const savedCommittee = localStorage.getItem('ebSelectedCommittee')
        const committeeToUse = savedCommittee && committeesArray.some(c => c.id === savedCommittee)
          ? savedCommittee
          : foundEbMember.committeeId
        setSelectedCommittee(committeeToUse)

        fetchDelegates(committeeToUse)
        fetchMarks(committeeToUse)
        fetchResources(committeeToUse)
        fetchCoupons()
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

      const registrationsRef = ref(db, 'registrations')
      const snapshot = await get(registrationsRef)

      if (snapshot.exists()) {
        const registrationsData = snapshot.val()
        const delegatesList: Delegate[] = []

        for (const regId in registrationsData) {
          const reg = registrationsData[regId]
          if (reg.committeeId === committeeId) {
            const d1 = reg.delegateInfo?.delegate1
            const d2 = reg.delegateInfo?.delegate2

            delegatesList.push({
              id: regId,
              name: d1?.name || '',
              email: d1?.email || '',
              phone: d1?.phone || '',
              institution: d1?.institution || '',
              year: d1?.year || '',
              course: d1?.course || '',
              experience: typeof d1?.experience === 'string' ? parseInt(d1.experience) || 0 : d1?.experience || 0,
              committeeId: reg.committeeId,
              portfolioId: reg.portfolioId,
              isCheckedIn: d1?.isCheckedIn || d2?.isCheckedIn || false,
              isDoubleDel: reg.isDoubleDel || false,
              paymentId: reg.paymentId || '',
              registrationPhase: reg.registrationPhase || 'Unknown',
              coDelegate: reg.isDoubleDel && d2 ? {
                name: d2.name || '',
                email: d2.email || '',
                phone: d2.phone || '',
                institution: d2.institution || '',
                year: d2.year || '',
                course: d2.course || '',
                experience: typeof d2.experience === 'string' ? parseInt(d2.experience) || 0 : d2.experience || 0,
              } : undefined
            })
          }
        }
        setDelegates(delegatesList)
      } else {
        setDelegates([])
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
      setLoading((prev) => ({ ...prev, coupons: true }));
      setCouponError(null);

      const couponsRef = ref(db, 'coupons');
      const snapshot = await get(couponsRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const couponsList: Coupon[] = Object.entries(data).map(([id, coupon]: [string, any]) => {
          let expiryDate: Date;
          try {
            if (coupon.expiry.includes('-')) {
              expiryDate = new Date(coupon.expiry);
            } else {
              expiryDate = new Date(coupon.expiry.replace(',', ''));
            }
            if (isNaN(expiryDate.getTime())) throw new Error('Invalid date');
          } catch (error) {
            console.error(`Invalid date format for coupon ${id}: ${coupon.expiry}`, error);
            expiryDate = new Date();
          }

          const isActive = !coupon.isUsed && expiryDate >= new Date();

          return {
            id,
            title: coupon.title || 'Untitled Coupon',
            description: coupon.description || 'No description',
            code: coupon.code || 'No code',
            partner: coupon.partner || 'Unknown Partner',
            logo: coupon.logo || '',
            expiry: coupon.expiry,
            discount: coupon.discount || 'N/A',
            terms: coupon.terms || 'No terms specified',
            isActive,
          };
        });
        setCoupons(couponsList);
      } else {
        setCoupons([]);
      }
    } catch (error) {
      console.error('Error fetching coupons:', error);
      setCouponError('Failed to load coupons. Please try again.');
      toast.error('Failed to load coupons');
    } finally {
      setLoading((prev) => ({ ...prev, coupons: false }));
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(prev => ({ ...prev, login: true }))
    setAuthError(null)
    try {
      await signInWithPopup(firebaseAuth, googleProvider)
    } catch (err: any) {
      setAuthError(err?.message || 'Google sign-in failed')
      toast.error(err?.message || 'Google sign-in failed')
    } finally {
      setLoading(prev => ({ ...prev, login: false }))
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(firebaseAuth)
    } catch (err) {
      console.error('Logout error:', err)
    }
    setLoggedIn(false)
    setEbMember(null)
    setCommittees([])
    setDelegates([])
    setMarks([])
    setResources([])
    setCoupons([])
    localStorage.removeItem('ebActiveTab')
    localStorage.removeItem('ebSelectedCommittee')
    router.push('/eb-portal')
    toast.info('Logged out successfully')
  }

  const toggleCheckIn = async (delegateId: string, isCheckedIn: boolean) => {
    try {
      const newStatus = !isCheckedIn;
      const updates: any = {
        isCheckedIn: newStatus
      };

      const regRef = ref(db, `registrations/${delegateId}`);
      const snapshot = await get(regRef);
      if (snapshot.exists()) {
        const reg = snapshot.val();
        if (reg.delegateInfo?.delegate1) {
          updates['delegateInfo/delegate1/isCheckedIn'] = newStatus;
          updates['delegateInfo/delegate1/checkInTime'] = newStatus ? new Date().toISOString() : '';
        }
        if (reg.isDoubleDel && reg.delegateInfo?.delegate2) {
          updates['delegateInfo/delegate2/isCheckedIn'] = newStatus;
          updates['delegateInfo/delegate2/checkInTime'] = newStatus ? new Date().toISOString() : '';
        }
      }

      await update(ref(db, `registrations/${delegateId}`), updates);

      setDelegates(prev =>
        prev.map(d =>
          d.id === delegateId ? { ...d, isCheckedIn: newStatus } : d
        )
      )

      toast.success(`Attendance ${newStatus ? 'marked' : 'unmarked'} successfully`)
    } catch (error) {
      console.error('Error updating attendance:', error)
      toast.error('Failed to update attendance')
    }
  }

  // Marks Management Functions
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
    setShowMarkForm(true)
  }

  const cancelEditingMark = () => {
    setEditingMark(null)
    setTempMark({})
    setShowMarkForm(false)
  }

  const handleMarkChange = (field: keyof Mark, value: string | number) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value
    const updatedMark = {
      ...tempMark,
      [field]: isNaN(numValue) ? value : numValue
    }
    const total = calculateTotal(updatedMark)
    setTempMark({
      ...updatedMark,
      total: total
    })
  }

  const calculateTotal = (markData: Partial<Mark>): number => {
    return Number((
      (markData.gsl || 0) +
      (markData.mod1 || 0) +
      (markData.mod2 || 0) +
      (markData.mod3 || 0) +
      (markData.mod4 || 0) +
      (markData.lobby || 0) +
      (markData.chits || 0) +
      (markData.fp || 0) +
      (markData.doc || 0)
    ).toFixed(2))
  }

  const saveMark = async () => {
    if (!editingMark || !selectedCommittee) return

    try {
      setLoading(prev => ({ ...prev, saving: true }))

      const markData = {
        portfolioId: tempMark.portfolioId || editingMark.portfolioId,
        country: tempMark.country || editingMark.country,
        alt: tempMark.alt || editingMark.alt || 'p',
        gsl: tempMark.gsl || 0,
        mod1: tempMark.mod1 || 0,
        mod2: tempMark.mod2 || 0,
        mod3: tempMark.mod3 || 0,
        mod4: tempMark.mod4 || 0,
        lobby: tempMark.lobby || 0,
        chits: tempMark.chits || 0,
        fp: tempMark.fp || 0,
        doc: tempMark.doc || 0,
        total: calculateTotal(tempMark),
        notes: tempMark.notes || '',
        updatedAt: new Date().toISOString(),
        updatedBy: ebMember?.name || 'EB Member',
        isApproved: false
      }

      if (editingMark.id) {
        await set(ref(db, `marksheets/${selectedCommittee}/marks/${editingMark.id}`), markData)
        toast.success('Marks updated successfully')
      } else {
        const newMarkRef = push(ref(db, `marksheets/${selectedCommittee}/marks`))
        await set(newMarkRef, markData)
        toast.success('New marks added successfully')
      }

      await fetchMarks(selectedCommittee)
      cancelEditingMark()
    } catch (error) {
      console.error('Error saving marks:', error)
      toast.error('Failed to save marks')
    } finally {
      setLoading(prev => ({ ...prev, saving: false }))
    }
  }

  const deleteMark = async (markId: string, country: string) => {
    if (!confirm(`Are you sure you want to delete marks for ${country}?`)) return

    try {
      await set(ref(db, `marksheets/${selectedCommittee}/marks/${markId}`), null)
      toast.success('Marks deleted successfully')
      await fetchMarks(selectedCommittee)
    } catch (error) {
      console.error('Error deleting mark:', error)
      toast.error('Failed to delete marks')
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

      ; (doc as any).autoTable({
        head: [headers],
        body: data,
        startY: 30,
        styles: { fontSize: 8, cellPadding: 2, halign: 'center' },
        headStyles: {
          fillColor: [245, 158, 11],
          textColor: [0, 0, 0],
          fontStyle: 'bold'
        },
        columnStyles: {
          0: { halign: 'center' },
          1: { halign: 'left' },
          2: { halign: 'center' },
          13: { fontStyle: 'bold' },
          14: { halign: 'left', cellWidth: 30 }
        }
      })

    doc.save(`${committee.name.replace(/[^a-z0-9]/gi, '_')}_Marksheet.pdf`)
    toast.success('Marksheet downloaded successfully')
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
          committeeId: selectedCommittee,
          uploadedAt: new Date().toISOString(),
          uploadedBy: ebMember?.name || 'EB Member',
          isApproved: false
        }
        await push(newResourceRef, resourceData)

        toast.success('File uploaded successfully')
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
      const matchesDelegate1 =
        delegate.name.toLowerCase().includes(term) ||
        (delegate.email && delegate.email.toLowerCase().includes(term)) ||
        (delegate.institution && delegate.institution.toLowerCase().includes(term))

      const matchesDelegate2 = delegate.coDelegate ? (
        delegate.coDelegate.name.toLowerCase().includes(term) ||
        (delegate.coDelegate.email && delegate.coDelegate.email.toLowerCase().includes(term)) ||
        (delegate.coDelegate.institution && delegate.coDelegate.institution.toLowerCase().includes(term))
      ) : false

      if (!matchesDelegate1 && !matchesDelegate2) return false
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

  // Auth loading spinner
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-indigo-500 mx-auto" />
          <p className="text-slate-600 mt-4 text-sm">Loading your session...</p>
        </div>
      </div>
    )
  }

  // Google Sign-In form
  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
        <Toaster position="top-center" richColors />
        <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-xl w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto">
              <User className="h-8 w-8 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 mt-4">Executive Board Portal</h1>
            <p className="text-slate-500 mt-2">Sign in with your registered Google account</p>
          </div>

          {authError && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
              {authError}
            </div>
          )}

          <Button
            onClick={handleGoogleSignIn}
            className="w-full bg-indigo-600 hover:bg-indigo-700 h-12 text-white font-semibold text-base rounded-xl"
            disabled={loading.login}
          >
            {loading.login ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Sign in with Google
              </>
            )}
          </Button>

          <p className="text-center text-slate-400 text-xs mt-6">
            Use the Google account associated with your EB registration.
          </p>
        </div>
      </div>
    )
  }

  // Main dashboard
  const currentCommittee = committees.find(c => c.id === selectedCommittee)
  const totalDelegates = delegates.length
  const checkedInDelegates = delegates.filter(d => d.isCheckedIn)
  const checkedInCount = checkedInDelegates.length

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Toaster position="top-right" richColors />

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-indigo-600 font-semibold">KIMUN EB Portal</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full">
              <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center">
                <User className="h-3 w-3 text-indigo-600" />
              </div>
              <span className="text-sm font-medium text-slate-700">{ebMember?.name}</span>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-slate-200 text-slate-600 hover:text-red-600 hover:border-red-200 h-9"
            >
              <Lock className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 pt-20 pb-16">
        {/* Welcome Banner */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Welcome, {ebMember?.name}!</h1>
              <p className="text-slate-500 mt-1">
                {currentCommittee?.name || 'Executive Board Portal'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-slate-50 p-2 rounded-xl border border-slate-200">
                <p className="text-xs text-slate-500">Your Role</p>
                <p className="text-sm font-semibold text-indigo-600 capitalize">{ebMember?.role}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 mb-8">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-2 font-medium rounded-t-lg transition-all ${activeTab === 'dashboard'
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white'
                : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('delegates')}
            className={`px-4 py-2 font-medium rounded-t-lg transition-all ${activeTab === 'delegates'
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white'
                : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            Delegates
          </button>
          <button
            onClick={() => setActiveTab('marks')}
            className={`px-4 py-2 font-medium rounded-t-lg transition-all ${activeTab === 'marks'
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white'
                : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            Marks Management
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`px-4 py-2 font-medium rounded-t-lg transition-all ${activeTab === 'resources'
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white'
                : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            Resources
          </button>
          <button
            onClick={() => setActiveTab('coupons')}
            className={`px-4 py-2 font-medium rounded-t-lg transition-all ${activeTab === 'coupons'
                ? 'text-indigo-600 border-b-2 border-indigo-600 bg-white'
                : 'text-slate-500 hover:text-slate-700'
              }`}
          >
            Partner Coupons
          </button>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Total Delegates</p>
                    <p className="text-2xl font-bold text-slate-800">{totalDelegates}</p>
                  </div>
                  <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                    <Users className="h-5 w-5 text-indigo-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Checked In</p>
                    <p className="text-2xl font-bold text-green-600">{checkedInCount}</p>
                  </div>
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Resources</p>
                    <p className="text-2xl font-bold text-slate-800">{resources.length}</p>
                  </div>
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <FileText className="h-5 w-5 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Committee Overview */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-500" />
                Committee Overview
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-slate-500">Committee Name</p>
                  <p className="font-semibold text-slate-800">{currentCommittee?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Committee Type</p>
                  <p className="font-semibold text-slate-800 capitalize">{currentCommittee?.type || 'General'}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-slate-500 mb-2">Agenda Topics</p>
                  <ul className="list-disc pl-5 space-y-1">
                    {(currentCommittee?.topics || []).map((topic, index) => (
                      <li key={index} className="text-slate-600">{topic}</li>
                    ))}
                  </ul>
                </div>
                <div className="md:col-span-2">
                  <p className="text-sm text-slate-500 mb-2">Description</p>
                  <p className="text-slate-600">{currentCommittee?.description}</p>
                </div>
              </div>
            </div>

            {/* Recent Check-ins */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Clock className="h-5 w-5 text-indigo-500" />
                Recent Check-ins
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Delegate</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Country</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500">Check-in Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {delegates.filter(d => d.isCheckedIn).slice(0, 5).map(delegate => {
                      const portfolio = currentCommittee?.portfolios?.[delegate.portfolioId]
                      return (
                        <tr key={delegate.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3">
                            <p className="font-medium text-slate-800">{delegate.name}</p>
                            <p className="text-xs text-slate-500">{delegate.email}</p>
                          </td>
                          <td className="px-4 py-3 text-slate-600">{portfolio?.country || delegate.portfolioId}</td>
                          <td className="px-4 py-3 text-slate-500 text-sm">{delegate.checkInTime ? new Date(delegate.checkInTime).toLocaleString() : 'N/A'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Delegates Tab */}
        {activeTab === 'delegates' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Users className="h-5 w-5 text-indigo-500" />
                Delegates Management
              </h2>
            </div>
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Search delegates by name, email, or institution..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  variant="outline"
                  className="border-slate-200"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {showFilters ? 'Hide Filters' : 'Show Filters'}
                </Button>
              </div>

              {showFilters && (
                <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                  <select
                    className="w-full border border-slate-200 rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="checkedIn">Checked In</option>
                    <option value="notCheckedIn">Not Checked In</option>
                  </select>
                </div>
              )}

              <div className="space-y-4">
                {filteredDelegates.length > 0 ? (
                  filteredDelegates.map(delegate => {
                    const portfolio = currentCommittee?.portfolios?.[delegate.portfolioId]
                    const countryName = portfolio?.country || delegate.portfolioId
                    const countryCode = portfolio?.countryCode
                    const FlagComponent = countryCode ? (Flags as any)[`${countryCode}Flag`] : null
                    const isExpanded = !!expandedDelegates[delegate.id]

                    return (
                      <div
                        key={delegate.id}
                        className="border border-slate-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <div
                          onClick={() => toggleDelegateExpand(delegate.id)}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 cursor-pointer hover:bg-slate-50 gap-4"
                        >
                          <div className="flex items-center gap-3">
                            <div className="bg-indigo-50 p-2 rounded-lg">
                              {FlagComponent ? (
                                <FlagComponent className="w-6 h-4 rounded-sm" />
                              ) : (
                                <Globe className="h-5 w-5 text-indigo-500" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                                {countryName}
                                {delegate.isDoubleDel && (
                                  <span className="text-[10px] bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
                                    Double Del
                                  </span>
                                )}
                              </h3>
                              <p className="text-sm text-slate-500">
                                {delegate.name}
                                {delegate.coDelegate && ` & ${delegate.coDelegate.name}`}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                            <span
                              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${delegate.isCheckedIn
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-amber-100 text-amber-700'
                                }`}
                            >
                              <span className={`h-1.5 w-1.5 rounded-full mr-1.5 ${delegate.isCheckedIn ? 'bg-green-500' : 'bg-amber-500'}`} />
                              {delegate.isCheckedIn ? 'Checked In' : 'Not Checked In'}
                            </span>

                            <Button
                              onClick={() => toggleCheckIn(delegate.id, delegate.isCheckedIn)}
                              className={`h-9 px-3 text-xs font-medium ${delegate.isCheckedIn
                                  ? 'bg-red-50 text-red-600 border border-red-200 hover:bg-red-100'
                                  : 'bg-green-50 text-green-600 border border-green-200 hover:bg-green-100'
                                }`}
                            >
                              {delegate.isCheckedIn ? 'Mark Absent' : 'Mark Present'}
                            </Button>

                            <button className="p-1 rounded-full hover:bg-slate-100">
                              {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="p-5 border-t border-slate-100 bg-slate-50/30 space-y-5">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                              {/* Delegate 1 */}
                              <div className="bg-white rounded-xl p-4 border border-slate-100">
                                <h4 className="text-sm font-semibold text-indigo-600 mb-3 flex items-center gap-2">
                                  <User className="h-4 w-4" />
                                  {delegate.isDoubleDel ? 'Delegate 1' : 'Delegate Details'}
                                </h4>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div><span className="text-slate-500 text-xs block">Full Name</span><span className="text-slate-800 font-medium">{delegate.name}</span></div>
                                  <div><span className="text-slate-500 text-xs block">Email</span><span className="text-slate-800 break-all">{delegate.email}</span></div>
                                  <div><span className="text-slate-500 text-xs block">Phone</span><span className="text-slate-800">{delegate.phone || 'N/A'}</span></div>
                                  <div><span className="text-slate-500 text-xs block">Institution</span><span className="text-slate-800">{delegate.institution || 'N/A'}</span></div>
                                  <div><span className="text-slate-500 text-xs block">Course & Year</span><span className="text-slate-800">{delegate.course ? `${delegate.course} (Y${delegate.year})` : 'N/A'}</span></div>
                                  <div><span className="text-slate-500 text-xs block">Experience</span><span className="text-slate-800">{delegate.experience || 0} MUNs</span></div>
                                </div>
                              </div>

                              {/* Delegate 2 */}
                              {delegate.isDoubleDel && delegate.coDelegate && (
                                <div className="bg-white rounded-xl p-4 border border-slate-100">
                                  <h4 className="text-sm font-semibold text-indigo-600 mb-3 flex items-center gap-2">
                                    <Users className="h-4 w-4" />
                                    Co-Delegate
                                  </h4>
                                  <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div><span className="text-slate-500 text-xs block">Full Name</span><span className="text-slate-800 font-medium">{delegate.coDelegate.name}</span></div>
                                    <div><span className="text-slate-500 text-xs block">Email</span><span className="text-slate-800 break-all">{delegate.coDelegate.email}</span></div>
                                    <div><span className="text-slate-500 text-xs block">Phone</span><span className="text-slate-800">{delegate.coDelegate.phone || 'N/A'}</span></div>
                                    <div><span className="text-slate-500 text-xs block">Institution</span><span className="text-slate-800">{delegate.coDelegate.institution || 'N/A'}</span></div>
                                    <div><span className="text-slate-500 text-xs block">Course & Year</span><span className="text-slate-800">{delegate.coDelegate.course ? `${delegate.coDelegate.course} (Y${delegate.coDelegate.year})` : 'N/A'}</span></div>
                                    <div><span className="text-slate-500 text-xs block">Experience</span><span className="text-slate-800">{delegate.coDelegate.experience || 0} MUNs</span></div>
                                  </div>
                                </div>
                              )}
                            </div>

                            <div className="bg-slate-50 rounded-xl p-4 text-sm grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div><span className="text-slate-500 text-xs block">Registration ID</span><span className="font-mono text-xs">{delegate.id.slice(0, 12)}...</span></div>
                              <div><span className="text-slate-500 text-xs block">Payment ID</span><span className="font-mono text-xs">{delegate.paymentId || 'N/A'}</span></div>
                              <div><span className="text-slate-500 text-xs block">Registration Phase</span><span className="text-slate-700">{delegate.registrationPhase}</span></div>
                              <div><span className="text-slate-500 text-xs block">Delegation Type</span><span className="text-slate-700">{delegate.isDoubleDel ? 'Double' : 'Single'}</span></div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    No delegates found
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Marks Tab - Fully Functional */}
        {activeTab === 'marks' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
              <div className="p-6 border-b border-slate-100 flex flex-wrap justify-between items-center gap-4">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Award className="h-5 w-5 text-indigo-500" />
                  Marks Management System
                </h2>
                <div className="flex gap-2">
                  <Button
                    onClick={() => startEditingMark()}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Marks
                  </Button>
                  <Button
                    onClick={downloadMarksheetPDF}
                    variant="outline"
                    className="border-slate-200"
                    disabled={marks.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download PDF
                  </Button>
                  <Button
                    onClick={() => fetchMarks(selectedCommittee)}
                    variant="outline"
                    className="border-slate-200"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              </div>

              <div className="p-6">
                {/* Search Bar */}
                <div className="relative mb-6">
                  <input
                    type="text"
                    placeholder="Search marks by country..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>

                {/* Marks Table */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Country</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Alt</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">GSL</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">M1</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">M2</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">M3</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">M4</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Lobby</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Chits</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">FP</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">DOC</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Total</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Status</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-slate-500">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {loading.marks ? (
                        <tr>
                          <td colSpan={13} className="text-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-indigo-500 mx-auto" />
                          </td>
                        </tr>
                      ) : filteredMarks.length > 0 ? (
                        filteredMarks.map((mark) => (
                          <tr key={mark.id} className="hover:bg-slate-50">
                            <td className="px-3 py-2 text-slate-800 font-medium">{mark.country}</td>
                            <td className="px-3 py-2 text-slate-600">{mark.alt}</td>
                            <td className="px-3 py-2 text-slate-600">{mark.gsl}</td>
                            <td className="px-3 py-2 text-slate-600">{mark.mod1}</td>
                            <td className="px-3 py-2 text-slate-600">{mark.mod2}</td>
                            <td className="px-3 py-2 text-slate-600">{mark.mod3}</td>
                            <td className="px-3 py-2 text-slate-600">{mark.mod4}</td>
                            <td className="px-3 py-2 text-slate-600">{mark.lobby}</td>
                            <td className="px-3 py-2 text-slate-600">{mark.chits}</td>
                            <td className="px-3 py-2 text-slate-600">{mark.fp}</td>
                            <td className="px-3 py-2 text-slate-600">{mark.doc}</td>
                            <td className="px-3 py-2 font-bold text-indigo-600">{mark.total}</td>
                            <td className="px-3 py-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                mark.isApproved
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}>
                                {mark.isApproved ? 'Approved' : 'Pending'}
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex gap-2">
                                <button
                                  onClick={() => startEditingMark(mark)}
                                  className="p-1 text-indigo-500 hover:bg-indigo-50 rounded"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => deleteMark(mark.id!, mark.country)}
                                  className="p-1 text-red-500 hover:bg-red-50 rounded"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={13} className="text-center py-8 text-slate-500">
                            No marks data available. Click "Add Marks" to get started.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Resources Tab */}
        {activeTab === 'resources' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-500" />
                Committee Resources
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {resources.map((resource) => (
                  <div
                    key={resource.id}
                    className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="bg-indigo-50 p-2 rounded-lg">
                        {resource.type === 'study' && <BookOpen className="h-5 w-5 text-indigo-500" />}
                        {resource.type === 'rules' && <FileText className="h-5 w-5 text-indigo-500" />}
                        {resource.type === 'training' && <Award className="h-5 w-5 text-indigo-500" />}
                        {resource.type === 'guide' && <BookOpen className="h-5 w-5 text-indigo-500" />}
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-800">{resource.title}</h3>
                        <p className="text-sm text-slate-500">{resource.description}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          Uploaded by {resource.uploadedBy} • {resource.uploadedAt ? new Date(resource.uploadedAt).toLocaleDateString() : 'Recently'}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="flex gap-2 items-center">
                        <span className="text-xs bg-slate-100 px-2 py-1 rounded-full text-slate-600 font-medium">
                          {resource.type.toUpperCase()}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          resource.isApproved !== false
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {resource.isApproved !== false ? 'Approved' : 'Pending'}
                        </span>
                      </div>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                      >
                        <Link href={resource.url} target="_blank">
                          <Download className="h-3 w-3 mr-1" />
                          Download
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
                {resources.length === 0 && (
                  <div className="col-span-full text-center py-8 text-slate-500">
                    No resources available
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Coupons Tab */}
        {activeTab === 'coupons' && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Ticket className="h-5 w-5 text-indigo-500" />
                Partner Coupons
              </h2>
            </div>
            <div className="p-6">
              {loading.coupons ? (
                <div className="text-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-indigo-500 mx-auto" />
                </div>
              ) : coupons.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {coupons.map((coupon) => (
                    <div key={coupon.id} className="border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3 mb-3">
                        {coupon.logo && (
                          <img src={coupon.logo} alt={coupon.partner} className="w-10 h-10 rounded-lg object-cover" />
                        )}
                        <div>
                          <h3 className="font-semibold text-slate-800">{coupon.title}</h3>
                          <p className="text-sm text-slate-500">{coupon.partner}</p>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{coupon.description}</p>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-lg font-bold text-indigo-600">{coupon.discount}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${coupon.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {coupon.isActive ? 'Active' : 'Expired'}
                        </span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg flex items-center justify-between">
                        <code className="font-mono text-sm text-slate-700">{coupon.code}</code>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(coupon.code);
                            toast.success('Coupon code copied!');
                          }}
                          className="p-1 text-indigo-500 hover:bg-indigo-100 rounded"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  No coupons available
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Marks Modal */}
      {showMarkForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={cancelEditingMark}>
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex justify-between items-center mb-5">
                <h3 className="text-lg font-semibold text-slate-800">
                  {editingMark?.id ? 'Edit Marks' : 'Add New Marks'}
                </h3>
                <button onClick={cancelEditingMark} className="text-slate-400 hover:text-slate-600">
                  <XCircle className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Country / Portfolio ID</label>
                    {editingMark?.id ? (
                      <input
                        type="text"
                        disabled
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed focus:outline-none"
                        value={tempMark.country || ''}
                      />
                    ) : (
                      <select
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                        value={tempMark.portfolioId || ''}
                        onChange={(e) => {
                          const portId = e.target.value
                          const delegate = checkedInDelegates.find(d => d.portfolioId === portId)
                          if (delegate) {
                            const portfolio = currentCommittee?.portfolios?.[portId]
                            const countryName = portfolio?.country || portId
                            setTempMark(prev => ({
                              ...prev,
                              portfolioId: portId,
                              country: countryName
                            }))
                          } else {
                            setTempMark(prev => ({
                              ...prev,
                              portfolioId: '',
                              country: ''
                            }))
                          }
                        }}
                      >
                        <option value="">Select a Country</option>
                        {checkedInDelegates.length === 0 ? (
                          <option value="" disabled>No checked-in delegates available</option>
                        ) : (
                          checkedInDelegates.map(delegate => {
                            const portfolio = currentCommittee?.portfolios?.[delegate.portfolioId]
                            const countryName = portfolio?.country || delegate.portfolioId
                            const isMarked = marks.some(m => m.portfolioId === delegate.portfolioId)
                            return (
                              <option key={delegate.id} value={delegate.portfolioId}>
                                {countryName} ({isMarked ? 'Marked' : 'Unmarked'})
                              </option>
                            )
                          })
                        )}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Alternate Score (p/a)</label>
                    <select
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={tempMark.alt || 'p'}
                      onChange={(e) => handleMarkChange('alt', e.target.value)}
                    >
                      <option value="p">Primary</option>
                      <option value="a">Alternate</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">GSL (10)</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={tempMark.gsl || 0}
                      onChange={(e) => handleMarkChange('gsl', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">MOD 1 (5)</label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={tempMark.mod1 || 0}
                      onChange={(e) => handleMarkChange('mod1', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">MOD 2 (5)</label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={tempMark.mod2 || 0}
                      onChange={(e) => handleMarkChange('mod2', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">MOD 3 (5)</label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={tempMark.mod3 || 0}
                      onChange={(e) => handleMarkChange('mod3', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">MOD 4 (5)</label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={tempMark.mod4 || 0}
                      onChange={(e) => handleMarkChange('mod4', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Lobby (5)</label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={tempMark.lobby || 0}
                      onChange={(e) => handleMarkChange('lobby', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Chits (5)</label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={tempMark.chits || 0}
                      onChange={(e) => handleMarkChange('chits', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">FP (5)</label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={tempMark.fp || 0}
                      onChange={(e) => handleMarkChange('fp', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">DOC (5)</label>
                    <input
                      type="number"
                      min="0"
                      max="5"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={tempMark.doc || 0}
                      onChange={(e) => handleMarkChange('doc', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="bg-indigo-50 rounded-lg p-3">
                    <label className="block text-xs font-medium text-indigo-600 mb-1">Total Score</label>
                    <p className="text-2xl font-bold text-indigo-600">{calculateTotal(tempMark).toFixed(2)}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notes</label>
                  <textarea
                    rows={3}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={tempMark.notes || ''}
                    onChange={(e) => handleMarkChange('notes', e.target.value)}
                    placeholder="Additional notes or comments..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button onClick={saveMark} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white" disabled={loading.saving}>
                    {loading.saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {editingMark?.id ? 'Update Marks' : 'Save Marks'}
                  </Button>
                  <Button onClick={cancelEditingMark} variant="outline" className="flex-1 border-slate-200">
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Page() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-500" /></div>}>
    <EBPortalContent />
  </Suspense>
}