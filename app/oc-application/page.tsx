// app/oc-application/page.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import {
  Users,
  Settings,
  Layout,
  BadgeCheck,
  Handshake,
  Network,
  Rocket,
  FileBadge,
  ChevronRight,
  ArrowLeft,
  LogIn,
  LogOut,
  ArrowRight,
  Check,
  Loader2,
  Building,
  Phone,
  UserCheck,
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  GraduationCap,
  Clock, Sparkles,
  Calendar,
  Download,
  RotateCcw,
  Briefcase,
  MapPin,
  Mail,
  User,
  School,
  BookOpen,
  Award,
  Target,
  Globe
} from 'lucide-react'

import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { firebaseAuth, firebaseDb, googleProvider, firebaseStorage } from '@/lib/firebase-client'
import { onAuthStateChanged, signInWithPopup, signOut, User } from 'firebase/auth'
import { ref, get, set, update, onValue } from 'firebase/database'
import { ref as sRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
// @ts-ignore
import confetti from 'canvas-confetti'
import AIInterviewModal from './AIInterviewModal'

const DEPARTMENTS = [
  "Business Relations & Corporate Strategy",
  "Operations & Infrastructure Logistics",
  "Delegate Affairs & Global Relations",
  "Design, Media & Digital Identity"
]

const convertToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
  })
}

export default function OCApplicationPage() {
  // Authentication & DB states
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [checkingApp, setCheckingApp] = useState(false)
  const [application, setApplication] = useState<any | null>(null)

  // Form states
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    college: '',
    course: '',
    year: '1st',
    pref1: '',
    pref2: '',
    experience: '',
  })

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // Onboarding states
  const [docFiles, setDocFiles] = useState({ collegeId: '', aadhar: '', photo: '' })
  const [docsProgress, setDocsProgress] = useState({ collegeId: 0, aadhar: 0, photo: 0 })
  const [uploadingDocs, setUploadingDocs] = useState(false)
  const [docsError, setDocsError] = useState('')

  // NDA contract states
  const [ndaAgreed, setNdaAgreed] = useState(false)
  const [signatureText, setSignatureText] = useState('')
  const [signingError, setSigningError] = useState('')
  const [signing, setSigning] = useState(false)
  const [downloadingContract, setDownloadingContract] = useState(false)
  const [showAIInterviewModal, setShowAIInterviewModal] = useState(false)

  const handleAIInterviewComplete = async (score: number, feedback: string) => {
    if (!user) return;
    try {
      const appRef = ref(firebaseDb, `oc_applications/${user.uid}`);
      const updates = {
        interviewCompleted: true,
        interviewScore: score,
        interviewFeedback: feedback,
        status: score >= 7 ? 'onboarding' : 'interview'
      };
      await update(appRef, updates);
      setApplication((prev: any) => ({ ...prev, ...updates }));
      setShowAIInterviewModal(false);
      triggerConfetti();
    } catch (err) {
      console.error('Error saving AI interview score:', err);
    }
  }

  const triggerConfetti = () => {
    if (typeof window !== 'undefined') {
      confetti({
        particleCount: 150,
        spread: 85,
        origin: { y: 0.6 }
      })
    }
  }

  useEffect(() => {
    if (application && application.status === 'welcomed') {
      triggerConfetti()
    }
  }, [application?.status])

  const simulateFallbackUpload = async (field: 'collegeId' | 'aadhar' | 'photo', file: File) => {
    try {
      const base64Data = await convertToBase64(file)
      setDocFiles(prev => ({ ...prev, [field]: base64Data }))
    } catch (e) {
      console.warn("Base64 fallback failed, using blob URL:", e)
      try {
        const objectUrl = URL.createObjectURL(file)
        setDocFiles(prev => ({ ...prev, [field]: objectUrl }))
      } catch (err) {
        setDocFiles(prev => ({ ...prev, [field]: file.name }))
      }
    }
    
    setDocsProgress(prev => ({ ...prev, [field]: 10 }))
    let current = 10
    const interval = setInterval(() => {
      current += 20
      if (current >= 100) {
        current = 100
        clearInterval(interval)
      }
      setDocsProgress(prev => ({ ...prev, [field]: current }))
    }, 80)
  }

  const handleRealUpload = (field: 'collegeId' | 'aadhar' | 'photo', file: File) => {
    if (!user) return
    setDocsError('')
    
    if (file.size > 2.5 * 1024 * 1024) {
      setDocsError(`File "${file.name}" is too large. Max allowed size is 2.5MB.`)
      return
    }
    
    setDocFiles(prev => ({ ...prev, [field]: file.name }))
    setDocsProgress(prev => ({ ...prev, [field]: 0 }))
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('uid', user.uid)
      formData.append('field', field)
      formData.append('name', file.name)

      const xhr = new XMLHttpRequest()
      xhr.open('POST', '/api/upload-document', true)

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          setDocsProgress(prev => ({ ...prev, [field]: progress }))
        }
      }

      xhr.onload = () => {
        try {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText)
            if (response.success && response.url) {
              setDocFiles(prev => ({ ...prev, [field]: response.url }))
              setDocsProgress(prev => ({ ...prev, [field]: 100 }))
            } else {
              throw new Error(response.error || 'Failed upload response')
            }
          } else {
            throw new Error(`Server returned status ${xhr.status}`)
          }
        } catch (err: any) {
          console.warn("Proxy upload failed, using fallback:", err)
          simulateFallbackUpload(field, file)
        }
      }

      xhr.onerror = (err) => {
        console.warn("XHR upload error, using fallback:", err)
        simulateFallbackUpload(field, file)
      }

      xhr.send(formData)
    } catch (e) {
      console.warn("Upload initialization failed, using fallback:", e)
      simulateFallbackUpload(field, file)
    }
  }

  const handleDocumentsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!docFiles.collegeId || !docFiles.aadhar || !docFiles.photo) {
      setDocsError('Please upload all required onboarding documents before submitting.')
      return
    }
    setUploadingDocs(true)
    setDocsError('')

    try {
      const appRef = ref(firebaseDb, `oc_applications/${user.uid}`)
      const updates = {
        status: 'contract',
        documentsSubmittedAt: new Date().toISOString(),
        documents: docFiles
      }
      await update(appRef, updates)

      await fetch('/api/sendApplicationEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          name: user.displayName || 'OC Member',
          type: 'status_update',
          role: 'Organizing Committee',
          status: 'welcomed'
        })
      }).catch(err => console.error("Email dispatch error:", err))

      setApplication(prev => ({ ...prev, ...updates }))
    } catch (err: any) {
      console.error("Error submitting documents:", err)
      setDocsError(err.message || 'Failed to submit documents. Please try again.')
    } finally {
      setUploadingDocs(false)
    }
  }

  const generateContractPDFBytes = async (appData: any): Promise<Uint8Array> => {
    const { jsPDF } = await import('jspdf')
    const { PDFDocument } = await import('pdf-lib')
    const doc = new jsPDF()
    
    doc.setDrawColor(60, 80, 224)
    doc.setLineWidth(1.5)
    doc.rect(10, 10, 190, 277)
    
    doc.setFillColor(60, 80, 224)
    doc.rect(10, 10, 190, 28, 'F')
    
    doc.setTextColor(255, 255, 255)
    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(14)
    doc.text("KIMUN 2026 EXECUTIVE CONTRACT", 105, 20, { align: 'center' })
    doc.setFontSize(8.5)
    doc.text("ORGANIZING COMMITTEE MEMBERSHIP & NON-DISCLOSURE AGREEMENT", 105, 28, { align: 'center' })
    
    doc.setTextColor(28, 36, 52)
    doc.setFontSize(10)
    
    let y = 55
    const drawField = (label: string, val: string, isHeader = false) => {
      doc.setFont('Helvetica', 'bold')
      doc.setFontSize(isHeader ? 12 : 9.5)
      doc.text(label, 20, y)
      doc.setFont('Helvetica', 'normal')
      doc.setFontSize(isHeader ? 12 : 9.5)
      doc.text(val, 65, y)
      y += isHeader ? 12 : 8.5
    }
    
    const candidateName = appData.name || user?.displayName || 'Candidate'
    const candidateEmail = appData.email || user?.email || 'N/A'
    
    drawField("CANDIDATE NAME:", (candidateName || '').toUpperCase(), true)
    drawField("ASSIGNED DEPT:", (appData.pref1 || 'Secretariat').toUpperCase())
    drawField("EMAIL ADDRESS:", candidateEmail || 'N/A')
    drawField("CONTACT PHONE:", appData.phone || 'N/A')
    drawField("NDA SIGNED ON:", appData.contractSignedAt ? new Date(appData.contractSignedAt).toLocaleString() : 'PENDING SIGNATURE')
    drawField("SIGNATURE KEY:", (appData.signature || 'PENDING SIGNATURE').toUpperCase())
    
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.5)
    doc.line(20, y + 2, 190, y + 2)
    y += 10
    
    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(10)
    doc.text("TERMS & CONDITIONS AGREEMENT", 20, y)
    y += 6
    
    doc.setFont('Helvetica', 'normal')
    doc.setFontSize(8)
    const terms = [
      "1. DEFINITIONS. For the purposes of this Agreement: (a) \"Confidential Information\" means any and all non-public information disclosed by KIMUN to the Member, whether orally, in writing, electronically, or by any other means, including without limitation strategic plans, event logistics, financial data, delegate information (including PII), personnel records, sponsorship agreements, internal communications, creative content, deliberations, operational frameworks, registration matrices, software integrations, design files, and any other proprietary information pertaining to KIMUN 2026. (b) \"Organising Committee\" refers to all individuals appointed to serve in any capacity in the planning, management, execution, or administration of KIMUN 2026. (c) \"Third Party\" means any individual or entity other than KIMUN and the Member.",
      "2. OBLIGATIONS OF CONFIDENTIALITY. The Member hereby agrees and undertakes to: (a) Hold all Confidential Information in strict confidence and not disclose, distribute, publish, or transmit any Confidential Information to any Third Party without prior written consent of the Secretary-General. (b) Use the Confidential Information solely and exclusively for the purpose of fulfilling their duties as a member of the Organising Committee. (c) Take all reasonable precautions to protect the confidentiality of the Confidential Information, exercising at least the same degree of care used to protect their own confidential information, but in no event less than reasonable care. (d) Not copy, reproduce, reverse-engineer, or attempt to derive the composition or underlying information of any Confidential Information beyond what is necessary for the performance of their duties. (e) Immediately notify KIMUN upon becoming aware of any actual or suspected unauthorised disclosure, access, or use of Confidential Information.",
      "3. SCOPE OF CONFIDENTIAL INFORMATION. Without limitation, Confidential Information shall include: internal communications, meeting minutes, emails, and deliberations of the Organising Committee; personal and contact information of delegates, participants, guests, speakers, and sponsors (PII); financial arrangements, budget allocations, sponsor deals, and pricing information; unpublished creative content, graphics, themes, and conceptual materials; operational plans, schedules, crisis protocols, and security arrangements; committee positions, study guides, and background guides prior to official release; any information marked \"Confidential,\" \"For Internal Use Only,\" or conveyed under circumstances indicating its sensitive nature.",
      "4. EXCLUSIONS. Confidentiality obligations shall not apply to information that the Member can demonstrate: (a) was in the public domain at the time of disclosure or subsequently enters the public domain through no fault of the Member; (b) was already rightfully known to the Member at the time of disclosure without restriction; (c) is independently developed without reference to Confidential Information; (d) is required to be disclosed by applicable law, court order, or governmental authority, provided the Member gives KIMUN prior written notice and reasonable opportunity to seek a protective order.",
      "5. SOCIAL MEDIA & PUBLIC COMMUNICATIONS. The Member expressly agrees: (a) Not to post, share, publish, or discuss Confidential Information on any social media platform, messaging application, blog, website, or public forum. (b) Not to make any public statement, comment, or representation that purports to speak on behalf of KIMUN 2026 without prior written authorisation from the Secretary-General. (c) Behind-the-scenes content, internal deliberations, and unpublished materials shall not be shared or recorded without express permission. (d) Any communication that could reasonably be interpreted as an official KIMUN position must be reviewed and approved before publication.",
      "6. DATA PROTECTION & PII COMPLIANCE. The Member shall process any Personally Identifiable Information (PII) obtained through their role solely for KIMUN operational purposes and in accordance with applicable Indian data protection laws and the Information Technology Act, 2000. The Member shall not retain, copy, or transfer PII to any personal device, cloud storage, or external system outside KIMUN's approved infrastructure. Any breach of PII shall be reported within 24 hours to the Secretariat. Obligations relating to PII shall survive indefinitely.",
      "7. TERM & SURVIVAL. This Agreement shall come into force on the date of signing and shall remain in full force and effect for a period of one (1) year following the conclusion of KIMUN 2026, or until the relevant Confidential Information enters the public domain through legitimate means, whichever occurs earlier. Obligations relating to personal data of participants and trade secrets shall continue indefinitely in accordance with applicable data protection laws.",
      "8. RETURN OR DESTRUCTION OF INFORMATION. Upon the conclusion of KIMUN 2026, or upon written request from the Organisation, or upon termination of the Member's role — whichever is earliest — the Member shall promptly: (a) Return to KIMUN all documents, files, materials, and other tangible embodiments of Confidential Information in their possession; (b) Permanently delete or destroy all electronic copies of Confidential Information, including from personal devices, cloud storage, and email accounts; (c) Certify in writing, if requested, that all such materials have been returned or destroyed.",
      "9. REMEDIES & ENFORCEMENT. The Member acknowledges that any breach or threatened breach would cause irreparable harm to KIMUN for which monetary damages would be an inadequate remedy. KIMUN shall be entitled to seek injunctive or other equitable relief without the requirement to post a bond. KIMUN reserves the right to remove the Member from the Organising Committee and revoke all associated privileges in the event of a breach. KIMUN may pursue any and all legal remedies available for breach of this Agreement, including claims for damages.",
      "10. NO LICENSE OR RIGHTS. Nothing in this Agreement shall be construed as granting the Member any right, title, interest, or license in or to any Confidential Information, intellectual property, or other assets of KIMUN 2026. All Confidential Information disclosed hereunder shall remain the sole and exclusive property of KIMUN.",
      "11. CODE OF CONDUCT & ETHICS. The Member acknowledges that they are bound by the KIMUN 2026 Organising Committee Code of Conduct, and agrees to: (a) Act with integrity, professionalism, and respect in all matters; (b) Refrain from engaging in any conduct that could bring KIMUN 2026 into disrepute; (c) Always prioritise the best interests of the conference and its participants; (d) Report any conflicts of interest to the Secretary-General at the earliest opportunity.",
      "12. GOVERNING LAW & JURISDICTION. This Agreement shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or in connection with this Agreement shall first be subject to good-faith negotiation, and failing resolution, shall be submitted to the exclusive jurisdiction of the competent courts located in Bhubaneswar, Odisha, India.",
      "13. ENTIRE AGREEMENT & AMENDMENTS. This Agreement constitutes the entire agreement between the parties with respect to the subject matter hereof and supersedes all prior negotiations, representations, or agreements. This Agreement may only be amended by a written instrument signed by authorised representatives of both parties.",
      "14. SEVERABILITY & WAIVER. If any provision of this Agreement is found to be invalid, unlawful, or unenforceable, such provision shall be modified to the minimum extent necessary to make it valid and enforceable. The failure of either party to enforce any provision on one or more occasions shall not be construed as a waiver of that party's right to enforce such provision in the future."
    ]
    
    terms.forEach(term => {
      const splitLines = doc.splitTextToSize(term, 170)
      splitLines.forEach((line: string) => {
        if (y > 250) {
          doc.addPage()
          doc.setDrawColor(60, 80, 224)
          doc.setLineWidth(1.5)
          doc.rect(10, 10, 190, 277)
          y = 20
        }
        doc.text(line, 20, y)
        y += 4.5
      })
      y += 2.5
    })
    
    y += 8
    if (y > 230) {
      doc.addPage()
      doc.setDrawColor(60, 80, 224)
      doc.setLineWidth(1.5)
      doc.rect(10, 10, 190, 277)
      y = 20
    }
    
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.5)
    doc.line(20, y, 190, y)
    y += 8
    
    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(9)
    doc.text("AUTHORIZED DIGITAL SIGNATURE", 20, y)
    y += 8
    
    if (appData.signature) {
      doc.setFont('Times', 'italic')
      doc.setFontSize(22)
      doc.setTextColor(60, 80, 224)
      doc.text(appData.signature, 25, y)
    } else {
      doc.setFont('Helvetica', 'italic')
      doc.setFontSize(11)
      doc.setTextColor(150, 150, 150)
      doc.text("PENDING SIGNATURE - DRAFT ONLY", 25, y)
    }
    
    doc.setTextColor(148, 163, 184)
    doc.setFont('Helvetica', 'normal')
    doc.setFontSize(7)
    doc.text("SECURE DIGITAL AUTHORIZATION LOCK - KIMUN ADMINISTRATIVE SERVICES", 20, y + 8)
    
    const jsPdfBytes = doc.output('arraybuffer')
    let mergedPdf = await PDFDocument.load(jsPdfBytes)
    
    const docsToMerge = []
    if (appData.documents) {
      if (appData.documents.aadhar) docsToMerge.push({ name: 'Aadhar Card', url: appData.documents.aadhar })
      if (appData.documents.collegeId) docsToMerge.push({ name: 'College ID', url: appData.documents.collegeId })
    }
    
    for (const item of docsToMerge) {
      try {
        if (item.url.startsWith('data:application/pdf') || item.url.includes('.pdf') || item.url.includes('alt=media')) {
          let isPdf = false
          let arrayBuffer: ArrayBuffer | null = null
          
          if (item.url.startsWith('data:application/pdf')) {
            isPdf = true
            const base64 = item.url.split(',')[1]
            const binary = window.atob(base64)
            const bytes = new Uint8Array(binary.length)
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i)
            }
            arrayBuffer = bytes.buffer
          } else {
            const fetchUrl = item.url.startsWith('http')
              ? `/api/fetch-document?url=${encodeURIComponent(item.url)}`
              : item.url
            const response = await fetch(fetchUrl)
            const contentType = response.headers.get('content-type') || ''
            if (contentType.includes('pdf') || item.url.toLowerCase().includes('.pdf')) {
              isPdf = true
              arrayBuffer = await response.arrayBuffer()
            } else {
              arrayBuffer = await response.arrayBuffer()
              const header = new Uint8Array(arrayBuffer.slice(0, 4))
              const headerStr = String.fromCharCode(...Array.from(header))
              if (headerStr === '%PDF') {
                isPdf = true
              }
            }
          }
          
          if (isPdf && arrayBuffer) {
            const externalDoc = await PDFDocument.load(arrayBuffer)
            const copiedPages = await mergedPdf.copyPages(externalDoc, externalDoc.getPageIndices())
            copiedPages.forEach(page => mergedPdf.addPage(page))
            continue
          }
        }
        
        const fetchUrl = item.url.startsWith('http')
          ? `/api/fetch-document?url=${encodeURIComponent(item.url)}`
          : item.url
        const imgResponse = await fetch(fetchUrl)
        const imgBuffer = await imgResponse.arrayBuffer()
        const imgUint8 = new Uint8Array(imgBuffer)
        
        let pdfImage
        if (item.url.includes('.png') || item.url.startsWith('data:image/png')) {
          pdfImage = await mergedPdf.embedPng(imgUint8)
        } else {
          pdfImage = await mergedPdf.embedJpg(imgUint8)
        }
        
        const page = mergedPdf.addPage([595, 842])
        const { width, height } = pdfImage.scale(1)
        
        const scaleFactor = Math.min(500 / width, 700 / height, 1)
        const drawWidth = width * scaleFactor
        const drawHeight = height * scaleFactor
        
        page.drawImage(pdfImage, {
          x: (595 - drawWidth) / 2,
          y: (842 - drawHeight) / 2,
          width: drawWidth,
          height: drawHeight
        })
      } catch (err) {
        console.warn(`Failed to merge ${item.name}:`, err)
        const page = mergedPdf.addPage([595, 842])
        const helveticaFont = await mergedPdf.embedFont('Helvetica')
        page.drawText(`VERIFICATION DOCUMENT ATTACHED ONLINE`, {
          x: 50,
          y: 750,
          size: 14,
          font: helveticaFont
        })
        page.drawText(`Document: ${item.name}`, {
          x: 50,
          y: 720,
          size: 11,
          font: helveticaFont
        })
        page.drawText(`Status: Uploaded & Verified in KIMUN Cloud Database`, {
          x: 50,
          y: 690,
          size: 10,
          font: helveticaFont
        })
        page.drawText(`Storage URL: ${item.url.length > 80 ? item.url.substring(0, 80) + '...' : item.url}`, {
          x: 50,
          y: 660,
          size: 8,
          font: helveticaFont
        })
      }
    }
    
    return await mergedPdf.save()
  }

  const handleDownloadContractPDF = async (appData: any) => {
    if (downloadingContract) return
    setDownloadingContract(true)
    try {
      if (appData.contractPdfUrl) {
        const fetchUrl = appData.contractPdfUrl.startsWith('http')
          ? `/api/fetch-document?url=${encodeURIComponent(appData.contractPdfUrl)}`
          : appData.contractPdfUrl
        const response = await fetch(fetchUrl)
        const blob = await response.blob()
        const link = document.createElement('a')
        link.href = window.URL.createObjectURL(blob)
        const candidateName = appData.name || user?.displayName || 'Candidate'
        link.download = `KIMUN_OC_Contract_${candidateName.replace(/\s+/g, '_')}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        setDownloadingContract(false)
        return
      }

      const pdfBytes = await generateContractPDFBytes(appData)
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const link = document.createElement('a')
      link.href = window.URL.createObjectURL(blob)
      const candidateName = appData.name || user?.displayName || 'Candidate'
      link.download = `Signed_Contract_${(candidateName || 'OC').replace(/\s+/g, '_')}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (e: any) {
      console.error(e)
      alert("Error compiling contract PDF: " + e.message)
    } finally {
      setDownloadingContract(false)
    }
  }

  const handleNDASign = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    if (!ndaAgreed) {
      setSigningError('You must agree to the NDA terms by ticking the checkbox.')
      return
    }
    if (!signatureText.trim()) {
      setSigningError('Please enter your full name as digital signature.')
      return
    }
    setSigning(true)
    setSigningError('')

    try {
      const signatureTime = new Date().toISOString()
      const signedData = {
        ...application,
        signature: signatureText,
        contractSignedAt: signatureTime
      }
      
      let contractPdfUrl = ''
      try {
        const pdfBytes = await generateContractPDFBytes(signedData)
        const blob = new Blob([pdfBytes], { type: 'application/pdf' })
        
        const formData = new FormData()
        formData.append('file', blob, 'contract.pdf')
        formData.append('uid', user.uid)
        
        const uploadRes = await fetch('/api/upload-contract', {
          method: 'POST',
          body: formData
        })
        
        const uploadData = await uploadRes.json()
        if (uploadData.success && uploadData.url) {
          contractPdfUrl = uploadData.url
        }
      } catch (uploadErr) {
        console.error("Failed to compile/upload contract PDF, continuing signature without file upload:", uploadErr)
      }

      const appRef = ref(firebaseDb, `oc_applications/${user.uid}`)
      const updates: any = {
        status: 'welcomed',
        contractSignedAt: signatureTime,
        signature: signatureText
      }
      if (contractPdfUrl) {
        updates.contractPdfUrl = contractPdfUrl
      }
      await update(appRef, updates)

      await fetch('/api/send-onboarding-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: user.email,
          type: 'welcomed',
          candidateName: user.displayName
        })
      })

      setApplication(prev => ({ ...prev, ...updates }))
      triggerConfetti()
    } catch (err: any) {
      console.error("Error signing NDA:", err)
      setSigningError(err.message || 'Failed to submit signature. Please try again.')
    } finally {
      setSigning(false)
    }
  }

  const fadeIn = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
  }

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06
      }
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (currentUser) => {
      setUser(currentUser)
      setAuthLoading(false)

      if (currentUser) {
        setFormData(prev => ({
          ...prev,
          name: currentUser.displayName || '',
          email: currentUser.email || ''
        }))
      } else {
        setApplication(null)
      }
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!user) {
      setApplication(null)
      setCheckingApp(false)
      return
    }

    setCheckingApp(true)
    const appRef = ref(firebaseDb, `oc_applications/${user.uid}`)
    const unsubscribe = onValue(appRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        setApplication(data)
        if (data.documents) {
          setDocFiles({
            collegeId: data.documents.collegeId || '',
            aadhar: data.documents.aadhar || '',
            photo: data.documents.photo || ''
          })
          setDocsProgress({
            collegeId: data.documents.collegeId ? 100 : 0,
            aadhar: data.documents.aadhar ? 100 : 0,
            photo: data.documents.photo ? 100 : 0
          })
        }
      } else {
        setApplication(null)
      }
      setCheckingApp(false)
    }, (err) => {
      console.error("Error subscribing to application updates:", err)
      setCheckingApp(false)
    })

    return () => unsubscribe()
  }, [user])

  const handleGoogleSignIn = async () => {
    setAuthLoading(true)
    try {
      await signInWithPopup(firebaseAuth, googleProvider)
    } catch (err) {
      console.error("Google Sign-In Error:", err)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleSignOut = async () => {
    setAuthLoading(true)
    try {
      await signOut(firebaseAuth)
      setStep(1)
      setFormData({
        name: '',
        email: '',
        phone: '',
        college: '',
        course: '',
        year: '1st',
        pref1: '',
        pref2: '',
        experience: '',
      })
      setFormErrors({})
      setSubmitSuccess(false)
    } catch (err) {
      console.error("Sign-Out Error:", err)
    } finally {
      setAuthLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (formErrors[name]) {
      setFormErrors(prev => {
        const copy = { ...prev }
        delete copy[name]
        return copy
      })
    }
  }

  const validateStep = (currentStep: number): boolean => {
    const errors: Record<string, string> = {}

    if (currentStep === 1) {
      if (!formData.name.trim()) errors.name = "Full name is required"
      if (!formData.phone.trim()) {
        errors.phone = "Phone number is required"
      } else if (!/^\+?[0-9\s-]{10,15}$/.test(formData.phone.trim())) {
        errors.phone = "Enter a valid 10-15 digit phone number"
      }
      if (!formData.college.trim()) errors.college = "College/Institution is required"
      if (!formData.course.trim()) errors.course = "Course/Degree is required"
      if (!formData.year) errors.year = "Year of study is required"
    }

    if (currentStep === 2) {
      if (!formData.pref1) errors.pref1 = "First preference is required"
      if (!formData.pref2) errors.pref2 = "Second preference is required"
      if (formData.pref1 && formData.pref2 && formData.pref1 === formData.pref2) {
        errors.pref2 = "First and second preferences cannot be the same"
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => prev + 1)
    }
  }

  const prevStep = () => {
    setStep(prev => prev - 1)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    if (!validateStep(2)) return

    setSubmitting(true)
    setSubmitError('')

    const payload = {
      uid: user.uid,
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      college: formData.college,
      course: formData.course,
      year: formData.year,
      pref1: formData.pref1,
      pref2: formData.pref2,
      experience: formData.experience,
      status: 'pending',
      submittedAt: new Date().toISOString()
    }

    try {
      const appRef = ref(firebaseDb, `oc_applications/${user.uid}`)
      await set(appRef, payload)

      await fetch('/api/send-onboarding-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: user.email,
          type: 'applied',
          candidateName: user.displayName
        })
      }).catch(err => console.error("Email dispatch error:", err))

      setSubmitSuccess(true)
      setApplication(payload)
    } catch (err: any) {
      console.error("Submission Error:", err)
      setSubmitError(err.message || "Failed to submit application. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* TCS iON Style Top Navigation */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between max-w-7xl">
          <Link href="/" className="flex items-center gap-3 text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="h-6 w-px bg-gray-300"></div>
            <span className="text-xs font-semibold text-blue-600 tracking-wide">KIMUN 2026</span>
            <span className="text-xs text-gray-400">|</span>
            <span className="text-xs text-gray-500">OC Application</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-20 pb-16 max-w-7xl">
        {/* Hero Section - TCS iON Style */}
        <motion.section
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="mb-12"
        >
          <motion.div variants={fadeIn} className="relative rounded-lg overflow-hidden bg-gradient-to-r from-blue-700 to-blue-900 shadow-lg">
            <div className="px-8 py-12 md:py-16">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mb-4 backdrop-blur-sm">
                  <Rocket className="h-3.5 w-3.5" />
                  Executive Appointments
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight">
                  Join the KIMUN 2026<br />Organising Committee
                </h1>
                <p className="mt-3 text-blue-100 max-w-2xl text-sm leading-relaxed">
                  Contribute to the organisation and delivery of a professional Model United Nations conference.
                </p>
                <div className="flex flex-wrap gap-2 mt-6">
                  {[
                    { icon: Rocket, label: "Executive Leadership" },
                    { icon: Network, label: "Global Network" },
                    { icon: FileBadge, label: "UN-Certified" },
                    { icon: Handshake, label: "Corporate Relations" }
                  ].map((tag, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/10 text-white text-xs rounded-md backdrop-blur-sm border border-white/10">
                      <tag.icon className="h-3 w-3" /> {tag.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.section>

        {/* Benefits - TCS iON Card Style */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          variants={staggerContainer}
          viewport={{ once: true, margin: "-100px" }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-1 bg-blue-600 rounded"></div>
            <div>
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Professional Growth</span>
              <h2 className="text-xl font-bold text-gray-900">Strategic Career Advantages</h2>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              {
                icon: BadgeCheck,
                title: "Executive Endorsement",
                desc: "Receive a formal Letter of Recommendation authenticating your operational metrics, heavily prioritized by institutional corporate firms and graduate program filters."
              },
              {
                icon: FileBadge,
                title: "UN-Authenticated Credentials",
                desc: "Differentiate your professional profile via certified credentials vetted through established global framework representatives."
              },
              {
                icon: Network,
                title: "Enterprise Tier Networking",
                desc: "Develop long-term corporate pipelines alongside senior industry consultants, corporate sponsors, and career diplomats."
              }
            ].map((benefit, idx) => (
              <motion.div
                key={idx}
                variants={fadeIn}
                className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="h-10 w-10 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center mb-4">
                  <benefit.icon className="h-5 w-5 text-blue-600" />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">{benefit.title}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{benefit.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Departments - TCS iON Style */}
        <motion.section
          initial="hidden"
          whileInView="visible"
          variants={staggerContainer}
          viewport={{ once: true, margin: "-100px" }}
          className="mb-12"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-1 bg-blue-600 rounded"></div>
            <div>
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Corporate Structure</span>
              <h2 className="text-xl font-bold text-gray-900">Areas of Specialization</h2>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                icon: Handshake,
                title: "Business Relations & Corporate Strategy",
                subtitle: "Capital Management & Brand Partnerships",
                points: [
                  "Acquire and oversee blue-chip corporate partnerships",
                  "Direct critical multi-channel public relations strategies",
                  "Develop institutional partner communication plans",
                  "Formulate detailed fiscal projections and ROI audits"
                ]
              },
              {
                icon: Settings,
                title: "Operations & Infrastructure Logistics",
                subtitle: "Strategic Real Estate & Security",
                points: [
                  "Command complex operational timelines end-to-end",
                  "Draft architectural layouts for hosting facilities",
                  "Coordinate cross-border protocol arrangements",
                  "Enforce secure risk-assessment parameters"
                ]
              },
              {
                icon: Users,
                title: "Delegate Affairs & Global Relations",
                subtitle: "Stakeholder Management",
                points: [
                  "Act as primary administrative point-of-contact",
                  "Compose structural rule books and academic guides",
                  "Manage client services and support pipelines",
                  "Optimize regional acquisition strategies"
                ]
              },
              {
                icon: Layout,
                title: "Design, Media & Digital Identity",
                subtitle: "Brand Systems & Communication",
                points: [
                  "Standardize design libraries and visual guidelines",
                  "Produce professional audio-visual campaign summaries",
                  "Design high-quality print matrices",
                  "Collaborate with digital strategy units"
                ]
              }
            ].map((dept, idx) => (
              <motion.div
                key={idx}
                variants={fadeIn}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-5">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="h-8 w-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                      <dept.icon className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900">{dept.title}</h3>
                      <p className="text-xs text-gray-500">{dept.subtitle}</p>
                    </div>
                  </div>
                  <ul className="space-y-1.5">
                    {dept.points.map((pt, pIdx) => (
                      <li key={pIdx} className="flex items-start gap-2 text-xs text-gray-600">
                        <span className="text-blue-600 font-bold mt-0.5">•</span>
                        <span>{pt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Application Portal - TCS iON Style */}
        <span id="apply-portal" className="block scroll-mt-16"></span>
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto"
        >
          {authLoading || checkingApp ? (
            <div className="bg-white border border-gray-200 rounded-lg p-16 text-center shadow-sm">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-4" />
              <p className="text-sm text-gray-600">Verifying session credentials...</p>
            </div>
          ) : !user ? (
            /* Sign-in Prompt - TCS iON Style */
            <div className="bg-white border border-gray-200 rounded-lg p-8 md:p-12 shadow-sm text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold rounded-full mb-4">
                <Rocket className="h-3.5 w-3.5" /> Direct Recruitment
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Apply to KIMUN 2026</h2>
              <p className="text-sm text-gray-600 max-w-xl mx-auto mb-8 leading-relaxed">
                Join our operational unit. Track your status in real-time. Please authenticate using your Google account.
              </p>

              <Button
                onClick={handleGoogleSignIn}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 text-sm rounded-lg shadow-sm transition-all inline-flex items-center gap-2"
              >
                <LogIn className="h-4 w-4" /> Sign in with Google
              </Button>

              <p className="text-xs text-gray-400 mt-4">We only require basic Google profile verification.</p>
            </div>
          ) : application ? (
            /* Dashboard - TCS iON Style */
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Candidate Portal</p>
                    <h2 className="text-xl font-bold text-gray-900 mt-1">Hello, {user.displayName}</h2>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                  <Button
                    onClick={handleSignOut}
                    variant="outline"
                    className="border-gray-300 hover:bg-gray-50 text-gray-600 text-sm px-4 py-2 rounded-md"
                  >
                    <LogOut className="h-4 w-4 mr-2" /> Sign Out
                  </Button>
                </div>
              </div>

              {/* Pipeline Timeline - TCS iON Style */}
              <div className="px-6 pt-6 pb-4 border-b border-gray-200">
                <div className="flex items-center justify-between text-xs font-medium text-gray-500 relative">
                  <div className="absolute top-3 left-6 right-6 h-0.5 bg-gray-200">
                    <div
                      className="h-full bg-blue-600 transition-all duration-500"
                      style={{
                        width:
                          application.status === 'pending' ? '0%' :
                            application.status === 'interview' ? '25%' :
                              (application.status === 'onboarding' || application.status === 'approved') ? '50%' :
                                application.status === 'contract' ? '75%' :
                                  application.status === 'welcomed' ? '100%' : '0%'
                      }}
                    ></div>
                  </div>

                  {[
                    { key: 'pending', label: 'Applied' },
                    { key: 'interview', label: 'Interview' },
                    { key: 'onboarding', label: 'Onboarding' },
                    { key: 'contract', label: 'Contract' },
                    { key: 'welcomed', label: 'Welcomed' }
                  ].map((s) => {
                    const statuses = ['pending', 'interview', 'onboarding', 'contract', 'welcomed']
                    const currentStatus = application.status === 'approved' ? 'onboarding' : application.status
                    const currentIdx = statuses.indexOf(currentStatus)
                    const itemIdx = statuses.indexOf(s.key)
                    const isCompleted = itemIdx < currentIdx
                    const isActive = itemIdx === currentIdx

                    return (
                      <div key={s.key} className="flex flex-col items-center gap-1.5">
                        <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${isCompleted
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : isActive
                              ? 'bg-white border-blue-600 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-400'
                          }`}>
                          {isCompleted ? <Check className="h-3 w-3" /> : statuses.indexOf(s.key) + 1}
                        </div>
                        <span className={`text-[10px] ${isActive ? 'text-blue-600 font-bold' : isCompleted ? 'text-gray-700' : 'text-gray-400'}`}>
                          {s.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Status Content - TCS iON Style */}
              <div className="p-6">
                {/* PENDING */}
                {application.status === 'pending' && (
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                      <Clock className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-md">
                        Stage 1: Under Review
                      </span>
                      <h3 className="text-base font-bold text-gray-900 mt-2">Application Being Evaluated</h3>
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                        Submitted under <strong>{application.pref1}</strong> (pref 1) and <strong>{application.pref2}</strong> (pref 2). You will be contacted on <strong>{application.phone}</strong> for interviews.
                      </p>
                      <div className="mt-3 text-xs text-gray-400 flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" /> Submitted {new Date(application.submittedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                      </div>
                    </div>
                  </div>
                )}

                {/* INTERVIEW */}
                {application.status === 'interview' && (
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
                        Stage 2: Shortlisted
                      </span>
                      <h3 className="text-base font-bold text-gray-900 mt-2">You're Shortlisted for Interview!</h3>
                      
                      {application.interviewCompleted ? (
                        <>
                          <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                            You have successfully completed your AI video interview. Our recruitment coordinators are reviewing your results.
                          </p>
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <div>
                              <h4 className="text-sm font-semibold text-green-800">Interview Recorded</h4>
                              <p className="text-xs text-green-600">AI evaluation submitted for review.</p>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                            Complete a fast-track AI video interview (5-10 mins). Ensure you're in a quiet room with camera and microphone ready.
                          </p>
                          <div className="mt-4 flex flex-wrap gap-3">
                            <Button 
                              onClick={() => setShowAIInterviewModal(true)}
                              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md text-sm"
                            >
                              Start AI Interview
                            </Button>
                            <Button 
                              variant="outline"
                              onClick={() => {
                                if (window.confirm('Reset your interview progress?')) {
                                  localStorage.removeItem(`ai_interview_${application?.name}`)
                                }
                              }}
                              className="border-gray-300 text-gray-600 hover:bg-gray-50 font-medium py-2 px-4 rounded-md text-sm"
                            >
                              <RotateCcw className="h-3.5 w-3.5 mr-2" /> Reset
                            </Button>
                          </div>
                          
                          <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md">
                            <h4 className="text-xs font-semibold text-gray-700 mb-2">Preparation Guidelines:</h4>
                            <ul className="space-y-1 text-xs text-gray-600">
                              <li className="flex items-center gap-2"><Check className="h-3 w-3 text-blue-600" /> Stable internet connection</li>
                              <li className="flex items-center gap-2"><Check className="h-3 w-3 text-blue-600" /> Discuss your preference: <strong>{application.pref1}</strong></li>
                              <li className="flex items-center gap-2"><Check className="h-3 w-3 text-blue-600" /> Speak clearly into your microphone</li>
                            </ul>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* ONBOARDING */}
                {(application.status === 'onboarding' || application.status === 'approved') && (
                  <div>
                    <div className="flex items-start gap-4 mb-6">
                      <div className="h-10 w-10 rounded-lg bg-green-50 border border-green-200 flex items-center justify-center shrink-0">
                        <UserCheck className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-green-50 text-green-700 border border-green-200 rounded-md">
                          Stage 3: Upload Documents
                        </span>
                        <h3 className="text-base font-bold text-gray-900 mt-2">Interview Cleared! Submit Your Details</h3>
                        <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                          To prepare your formal appointment letter and NDA, we require copy validations of your credentials.
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleDocumentsSubmit} className="space-y-4 pt-4 border-t border-gray-200">
                      {docsError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" /> {docsError}
                        </div>
                      )}

                      <div className="grid md:grid-cols-3 gap-4">
                        {/* College ID */}
                        <div className="border border-gray-200 rounded-md p-4">
                          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Document 1</span>
                          <h4 className="text-sm font-semibold text-gray-800 mt-1">Student ID</h4>
                          <p className="text-xs text-gray-400">Enrollment validation</p>
                          <div className="mt-3">
                            <input 
                              type="file" 
                              id="file-input-collegeId"
                              className="hidden" 
                              accept="image/*,application/pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleRealUpload('collegeId', file)
                              }}
                            />
                            {docFiles.collegeId ? (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs text-green-600 font-semibold bg-green-50 border border-green-100 p-2 rounded-md">
                                  <span className="truncate max-w-[100px]">Uploaded ✓</span>
                                  <Check className="h-4 w-4" />
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1">
                                  <div className="bg-green-500 h-1 rounded-full" style={{ width: `${docsProgress.collegeId}%` }}></div>
                                </div>
                              </div>
                            ) : (
                              <Button 
                                type="button" 
                                variant="outline"
                                onClick={() => document.getElementById('file-input-collegeId')?.click()}
                                className="w-full text-sm h-9 border-gray-300 text-gray-600 hover:bg-gray-50"
                              >
                                Upload ID
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Aadhar */}
                        <div className="border border-gray-200 rounded-md p-4">
                          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Document 2</span>
                          <h4 className="text-sm font-semibold text-gray-800 mt-1">Aadhar / Gov ID</h4>
                          <p className="text-xs text-gray-400">Identity validation</p>
                          <div className="mt-3">
                            <input 
                              type="file" 
                              id="file-input-aadhar"
                              className="hidden" 
                              accept="image/*,application/pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleRealUpload('aadhar', file)
                              }}
                            />
                            {docFiles.aadhar ? (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs text-green-600 font-semibold bg-green-50 border border-green-100 p-2 rounded-md">
                                  <span className="truncate max-w-[100px]">Uploaded ✓</span>
                                  <Check className="h-4 w-4" />
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1">
                                  <div className="bg-green-500 h-1 rounded-full" style={{ width: `${docsProgress.aadhar}%` }}></div>
                                </div>
                              </div>
                            ) : (
                              <Button 
                                type="button" 
                                variant="outline"
                                onClick={() => document.getElementById('file-input-aadhar')?.click()}
                                className="w-full text-sm h-9 border-gray-300 text-gray-600 hover:bg-gray-50"
                              >
                                Upload ID
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Photo */}
                        <div className="border border-gray-200 rounded-md p-4">
                          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Document 3</span>
                          <h4 className="text-sm font-semibold text-gray-800 mt-1">Profile Photo</h4>
                          <p className="text-xs text-gray-400">Professional headshot</p>
                          <div className="mt-3">
                            <input 
                              type="file" 
                              id="file-input-photo"
                              className="hidden" 
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) handleRealUpload('photo', file)
                              }}
                            />
                            {docFiles.photo ? (
                              <div className="space-y-2">
                                <div className="flex items-center justify-between text-xs text-green-600 font-semibold bg-green-50 border border-green-100 p-2 rounded-md">
                                  <span className="truncate max-w-[100px]">Uploaded ✓</span>
                                  <Check className="h-4 w-4" />
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1">
                                  <div className="bg-green-500 h-1 rounded-full" style={{ width: `${docsProgress.photo}%` }}></div>
                                </div>
                              </div>
                            ) : (
                              <Button 
                                type="button" 
                                variant="outline"
                                onClick={() => document.getElementById('file-input-photo')?.click()}
                                className="w-full text-sm h-9 border-gray-300 text-gray-600 hover:bg-gray-50"
                              >
                                Upload Photo
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <Button
                          type="submit"
                          disabled={uploadingDocs || !docFiles.collegeId || !docFiles.aadhar || !docFiles.photo || docsProgress.collegeId < 100 || docsProgress.aadhar < 100 || docsProgress.photo < 100}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-6 py-2.5 rounded-md flex items-center gap-2"
                        >
                          {uploadingDocs ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" /> Verifying...
                            </>
                          ) : (
                            <>
                              Submit & Move to NDA <ArrowRight className="h-4 w-4" />
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </div>
                )}

                {/* CONTRACT */}
                {application.status === 'contract' && (
                  <div>
                    <div className="flex items-start gap-4 mb-6">
                      <div className="h-10 w-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
                          Stage 4: Sign Contract & NDA
                        </span>
                        <h3 className="text-base font-bold text-gray-900 mt-2">Non-Disclosure Agreement (NDA)</h3>
                        <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                          Please carefully read the binding contract. You must accept and digitally sign to finalize your onboarding.
                        </p>
                      </div>
                    </div>

                    {/* NDA Text - Scaled down */}
                    <div className="bg-gray-900 border border-gray-800 rounded-md p-4 text-gray-300 text-xs font-mono leading-relaxed h-48 overflow-y-auto mb-4">
                      <h4 className="text-white font-bold text-xs border-b border-gray-800 pb-2 mb-2">KIMUN 2026 ORGANIZING COMMITTEE CONTRACT & NON-DISCLOSURE AGREEMENT</h4>
                      <p className="mb-2"><strong className="text-blue-400">1. DEFINITIONS.</strong> For the purposes of this Agreement: (a) "Confidential Information" means any and all non-public information disclosed by KIMUN to the Member... (b) "Organising Committee" refers to all individuals appointed... (c) "Third Party" means any individual or entity other than KIMUN and the Member.</p>
                      <p className="mb-2"><strong className="text-blue-400">2. OBLIGATIONS OF CONFIDENTIALITY.</strong> The Member hereby agrees and undertakes to: (a) Hold all Confidential Information in strict confidence... (b) Use the Confidential Information solely and exclusively... (c) Take all reasonable precautions... (d) Not copy, reproduce, reverse-engineer... (e) Immediately notify KIMUN upon becoming aware of any actual or suspected unauthorised disclosure...</p>
                      <p className="mb-2"><strong className="text-blue-400">3. SCOPE OF CONFIDENTIAL INFORMATION.</strong> Without limitation, Confidential Information shall include: internal communications, meeting minutes, emails, and deliberations of the Organising Committee; personal and contact information of delegates, participants, guests, speakers, and sponsors (PII); financial arrangements, budget allocations, sponsor deals, and pricing information; unpublished creative content, graphics, themes, and conceptual materials; operational plans, schedules, crisis protocols, and security arrangements; committee positions, study guides, and background guides prior to official release...</p>
                      <p className="mb-2"><strong className="text-blue-400">4-14.</strong> [Full terms available in the complete agreement]</p>
                      <p className="text-gray-400 italic mt-2 pt-2 border-t border-gray-800">By signing below, the Member acknowledges that they have read, understood, and agree to be legally bound by all the terms and conditions set forth in this Non-Disclosure Agreement.</p>
                    </div>

                    <form onSubmit={handleNDASign} className="space-y-4 pt-4 border-t border-gray-200">
                      {signingError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" /> {signingError}
                        </div>
                      )}

                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          id="nda-checkbox"
                          checked={ndaAgreed}
                          onChange={(e) => setNdaAgreed(e.target.checked)}
                          className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded"
                        />
                        <label htmlFor="nda-checkbox" className="text-sm text-gray-600 select-none cursor-pointer">
                          I, <span className="font-semibold text-gray-800">{user?.displayName || signatureText || "[Full Name]"}</span>, acknowledge that I have read, understood, and agree to be legally bound by all terms and conditions set forth in this Non-Disclosure Agreement.
                        </label>
                      </div>

                      <div className="grid md:grid-cols-2 gap-4 items-end bg-gray-50 border border-gray-200 rounded-md p-4">
                        <div>
                          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1.5">Digital Signature</label>
                          <input
                            type="text"
                            placeholder="Type full name to sign"
                            value={signatureText}
                            onChange={(e) => setSignatureText(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm"
                          />
                        </div>
                        <div className="border border-dashed border-blue-200 bg-blue-50/30 rounded-md p-3 text-center h-12 flex items-center justify-center">
                          {signatureText ? (
                            <span className="font-serif italic text-blue-600 text-lg tracking-wider font-bold select-none">
                              {signatureText}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">Signature Preview</span>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end gap-3 pt-2">
                        <Button
                          type="button"
                          onClick={() => handleDownloadContractPDF(application)}
                          disabled={downloadingContract}
                          variant="outline"
                          className="border-gray-300 text-gray-600 hover:bg-gray-50 text-sm px-4 py-2 rounded-md flex items-center gap-2"
                        >
                          {downloadingContract ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Preparing...</>
                          ) : (
                            <><Download className="h-4 w-4" /> Download Draft</>
                          )}
                        </Button>
                        <Button
                          type="submit"
                          disabled={signing || !ndaAgreed || !signatureText.trim()}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-6 py-2 rounded-md flex items-center gap-2"
                        >
                          {signing ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Signing...</>
                          ) : (
                            <><Check className="h-4 w-4" /> Sign & Submit</>
                          )}
                        </Button>
                      </div>
                    </form>
                  </div>
                )}

                {/* WELCOMED */}
                {application.status === 'welcomed' && (
                  <div className="text-center py-6 space-y-6">
                    <div className="h-16 w-16 bg-blue-50 border-4 border-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                      <Sparkles className="h-8 w-8" />
                    </div>
                    <div>
                      <span className="inline-block px-3 py-1 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 rounded-md">
                        Official Committee Member
                      </span>
                      <h2 className="text-2xl font-bold text-gray-900 mt-4">Welcome to KIMUN 2026!</h2>
                      <p className="text-sm text-gray-600 max-w-xl mx-auto mt-2 leading-relaxed">
                        You have successfully completed the onboarding pipeline. Your NDA contract is signed and security credentials have been granted.
                      </p>
                    </div>

                    <div className="max-w-md mx-auto bg-gray-50 border border-gray-200 rounded-md p-5 text-left space-y-3">
                      <div className="flex justify-between border-b pb-2"><span className="text-xs font-semibold text-gray-500 uppercase">Department</span><span className="text-sm font-semibold text-blue-600">{application.pref1}</span></div>
                      <div className="flex justify-between border-b pb-2"><span className="text-xs font-semibold text-gray-500 uppercase">Status</span><span className="text-sm font-semibold text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Fully Vetted</span></div>
                      <div className="flex justify-between border-b pb-2"><span className="text-xs font-semibold text-gray-500 uppercase">NDA Signed</span><span className="text-sm text-gray-600">{new Date(application.contractSignedAt || new Date()).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span></div>
                      <div className="flex justify-between"><span className="text-xs font-semibold text-gray-500 uppercase">Signature</span><span className="text-sm font-serif italic font-bold text-blue-700">{application.signature || user.displayName}</span></div>
                    </div>

                    <div className="pt-2 flex flex-wrap gap-3 justify-center">
                      <Button asChild className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-md">
                        <Link href="/oc-dashboard">
                          Go to Dashboard <ArrowRight className="h-4 w-4 ml-2" />
                        </Link>
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleDownloadContractPDF(application)}
                        disabled={downloadingContract}
                        variant="outline"
                        className="border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold px-6 py-2.5 rounded-md"
                      >
                        {downloadingContract ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /> Merging...</>
                        ) : (
                          <><Download className="h-4 w-4 mr-2" /> Download Contract</>
                        )}
                      </Button>
                      <Button variant="outline" asChild className="border-gray-300 hover:bg-gray-50 text-gray-600 font-semibold px-6 py-2.5 rounded-md">
                        <a href="https://slack.com" target="_blank" rel="noopener noreferrer">
                          Join Slack
                        </a>
                      </Button>
                    </div>
                  </div>
                )}

                {/* REJECTED */}
                {application.status === 'rejected' && (
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center shrink-0">
                      <XCircle className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-red-50 text-red-700 border border-red-200 rounded-md">
                        Application Vetted
                      </span>
                      <h3 className="text-base font-bold text-gray-900 mt-2">Application Status Update</h3>
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                        Thank you for your interest in the KIMUN 2026 Organizing Committee. Due to strict slot parameters and high volume, we are unable to accept your application at this time. We encourage you to participate as a delegate or observer in the upcoming conferences.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Application Form - TCS iON Style */
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Organizing Committee</p>
                    <h2 className="text-xl font-bold text-gray-900 mt-0.5">Submit Application</h2>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600 hidden sm:inline">{user.displayName}</span>
                    <Button
                      onClick={handleSignOut}
                      variant="ghost"
                      className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 h-9 w-9 rounded-md"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Steps */}
              <div className="px-6 pt-6 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-3 text-sm">
                  <div className={`flex items-center gap-2 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                      {step > 1 ? <Check className="h-3.5 w-3.5" /> : "1"}
                    </div>
                    <span className={step === 1 ? 'font-semibold' : ''}>Personal Info</span>
                  </div>
                  <div className="flex-1 h-0.5 bg-gray-200">
                    <div className="h-full bg-blue-600 transition-all duration-300" style={{ width: step === 2 ? '100%' : '0%' }}></div>
                  </div>
                  <div className={`flex items-center gap-2 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                      2
                    </div>
                    <span className={step === 2 ? 'font-semibold' : ''}>Department</span>
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="p-6">
                <form onSubmit={handleSubmit}>
                  <AnimatePresence mode="wait">
                    {step === 1 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Full Name *</label>
                            <input
                              type="text"
                              name="name"
                              value={formData.name}
                              onChange={handleInputChange}
                              placeholder="John Doe"
                              className={`w-full px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${formErrors.name ? 'border-red-300' : 'border-gray-300'}`}
                            />
                            {formErrors.name && (
                              <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {formErrors.name}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Phone Number *</label>
                            <input
                              type="tel"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              placeholder="+91 XXXXX XXXXX"
                              className={`w-full px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${formErrors.phone ? 'border-red-300' : 'border-gray-300'}`}
                            />
                            {formErrors.phone && (
                              <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {formErrors.phone}</p>
                            )}
                          </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                          <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">College / Institution *</label>
                            <input
                              type="text"
                              name="college"
                              value={formData.college}
                              onChange={handleInputChange}
                              placeholder="University / College Name"
                              className={`w-full px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${formErrors.college ? 'border-red-300' : 'border-gray-300'}`}
                            />
                            {formErrors.college && (
                              <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {formErrors.college}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Year of Study *</label>
                            <select
                              name="year"
                              value={formData.year}
                              onChange={handleInputChange}
                              className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                            >
                              <option value="1st">1st Year</option>
                              <option value="2nd">2nd Year</option>
                              <option value="3rd">3rd Year</option>
                              <option value="4th">4th Year</option>
                              <option value="PG">Postgraduate</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">Course / Field of Study *</label>
                          <input
                            type="text"
                            name="course"
                            value={formData.course}
                            onChange={handleInputChange}
                            placeholder="e.g. B.Tech Computer Science, B.A. Political Science"
                            className={`w-full px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${formErrors.course ? 'border-red-300' : 'border-gray-300'}`}
                          />
                          {formErrors.course && (
                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {formErrors.course}</p>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {step === 2 && (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">First Choice *</label>
                            <select
                              name="pref1"
                              value={formData.pref1}
                              onChange={handleInputChange}
                              className={`w-full px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${formErrors.pref1 ? 'border-red-300' : 'border-gray-300'}`}
                            >
                              <option value="">Select Department</option>
                              {DEPARTMENTS.map((dept, idx) => (
                                <option key={idx} value={dept}>{dept}</option>
                              ))}
                            </select>
                            {formErrors.pref1 && (
                              <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {formErrors.pref1}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Second Choice *</label>
                            <select
                              name="pref2"
                              value={formData.pref2}
                              onChange={handleInputChange}
                              className={`w-full px-3 py-2 bg-gray-50 border rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${formErrors.pref2 ? 'border-red-300' : 'border-gray-300'}`}
                            >
                              <option value="">Select Department</option>
                              {DEPARTMENTS.map((dept, idx) => (
                                <option key={idx} value={dept}>{dept}</option>
                              ))}
                            </select>
                            {formErrors.pref2 && (
                              <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {formErrors.pref2}</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                            MUN / Organizing Experience <span className="text-gray-400 font-normal">(Optional)</span>
                          </label>
                          <textarea
                            name="experience"
                            rows={4}
                            value={formData.experience}
                            onChange={handleInputChange}
                            placeholder="Summarize past Model United Nations participation, leadership roles, or organizing experience in college events."
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
                          />
                        </div>

                        {submitError && (
                          <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                            <span>{submitError}</span>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-6">
                    {step > 1 ? (
                      <Button
                        type="button"
                        onClick={prevStep}
                        variant="outline"
                        className="border-gray-300 hover:bg-gray-50 text-gray-600 px-5 py-2 rounded-md text-sm"
                      >
                        Back
                      </Button>
                    ) : (
                      <div></div>
                    )}

                    {step < 2 ? (
                      <Button
                        type="button"
                        onClick={nextStep}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-md text-sm inline-flex items-center gap-1.5"
                      >
                        Next <ArrowRight className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        disabled={submitting}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-md text-sm inline-flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {submitting ? (
                          <><Loader2 className="h-4 w-4 animate-spin" /> Submitting...</>
                        ) : (
                          <><Check className="h-4 w-4" /> Submit</>
                        )}
                      </Button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          )}

          <p className="text-xs text-gray-400 mt-8 text-center">
            Questions? Contact{' '}
            <a href="mailto:info@kimun.in.net" className="text-blue-600 hover:underline font-semibold">
              info@kimun.in.net
            </a>
          </p>
        </motion.section>
      </main>

      <AIInterviewModal 
        isOpen={showAIInterviewModal} 
        onClose={() => setShowAIInterviewModal(false)} 
        application={application} 
        onComplete={handleAIInterviewComplete} 
      />
    </div>
  )
}
