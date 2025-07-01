'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Edit, Plus, X, Trash, ChartBar, Users, CheckCircle, Download, UserCheck, QrCode, Cog, CreditCard, User, UserPlus, Briefcase, Coins, BookOpen, Printer, FileText, Award, Settings, LogOut, Ban, RefreshCw, Send, Loader2, Ticket } from 'lucide-react';
import * as Flags from 'country-flag-icons/react/3x2';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, push, update, remove, onValue } from 'firebase/database';
import { getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import Select from 'react-select';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Legend } from 'recharts';
import emailjs from '@emailjs/browser';

type Committee = {
  id: string;
  name: string;
  emoji: string;
  type: 'general' | 'specialized' | 'crisis' | 'regional';
  description: string;
  topics: string[];
  eb: EBMember[];
  portfolios: Portfolio[];
  backgroundGuide?: string;
  rules?: string;
};

type Coupon = {
  id: string;
  code: string;
  title: string;
  description: string;
  discount: string;
  expiry: string;
  logo: string;
  partner: string;
  terms: string;
  isUsed: boolean;
  usedBy: string | null;
  assignedAt: number | null;
};

type EBMember = {
  id: string;
  name: string;
  role: 'chair' | 'vice-chair' | 'rapporteur';
  email: string;
  bio?: string;
  photourl?: string;
  instagram?: string;
};

type Portfolio = {
  id: string;
  country: string;
  countryCode: string;
  isDoubleDelAllowed: boolean;
  isVacant: boolean;
  minExperience: number;
  assignedDelegates?: string[];
};

type Delegate = {
  id: string;
  name: string;
  email: string;
  phone: string;
  experience: number;
  institution?: string;
  course?: string;
  year?: string;
  committeeId: string;
  portfolioId: string;
  isCheckedIn: boolean;
  checkInTime?: string;
  isDoubleDel: boolean;
  paymentId: string;
  timestamp: number;
};

type Resource = {
  id: string;
  title: string;
  type: 'guide' | 'rules' | 'sample' | 'other';
  url: string;
  committeeId?: string;
  description?: string;
  pages?: number;
};

type BlacklistedDelegate = {
  id: string;
  name: string;
  email: string;
  reason: string;
  timestamp: number;
};

const countryOptions = Object.entries(Flags)
  .filter(([key]) => key.endsWith('Flag'))
  .map(([key]) => ({
    value: key.replace('Flag', ''),
    label: key.replace('Flag', '').replace(/([A-Z])/g, ' $1').trim(),
  }));

export default function AdminDashboard() {
  const [accessGranted, setAccessGranted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [blacklistedDelegates, setBlacklistedDelegates] = useState<BlacklistedDelegate[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedCommittee, setSelectedCommittee] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'all' | 'checkedIn' | 'notCheckedIn'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingCommittee, setEditingCommittee] = useState<Committee | null>(null);
  const [editingEB, setEditingEB] = useState<EBMember | null>(null);
  const [editingPortfolio, setEditingPortfolio] = useState<Portfolio | null>(null);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [editingDelegate, setEditingDelegate] = useState<Delegate | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'committee' | 'eb' | 'portfolio' | 'resource' | 'coupon' | 'delegate'>('committee');
  const [showBlacklistModal, setShowBlacklistModal] = useState(false);
  const [blacklistReason, setBlacklistReason] = useState('');
  const [currentDelegateToBlacklist, setCurrentDelegateToBlacklist] = useState<Delegate | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const generateDelegateId = (name: string, phone: string) => {
    const namePart = name.replace(/\s+/g, '').substring(0, 4).toUpperCase();
    const phonePart = phone.replace(/\D/g, '').slice(-4);
    return `${namePart}${phonePart}`;
  };

  const isDelegateIdFormat = (input: string) => {
    return /^[A-Z]{4}\d{4}$/.test(input);
  };

  const findDelegateByIdFormat = (input: string) => {
    if (!isDelegateIdFormat(input)) return null;
    const namePart = input.substring(0, 4).toLowerCase();
    const phonePart = input.substring(4);
    return delegates.find(delegate => {
      const delegateName = delegate.name.replace(/\s+/g, '').substring(0, 4).toLowerCase();
      const delegatePhone = delegate.phone.replace(/\D/g, '').slice(-4);
      return delegateName.includes(namePart) && delegatePhone.includes(phonePart);
    });
  };

  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const padPhoneNumber = (phone: string): string => {
    const digits = phone.replace(/\D/g, '');
    return digits.padStart(12, '0');
  };

  const generateBarcodeLabelsPDF = async (delegates: Delegate[]) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    doc.setProperties({
      title: 'KIMUN Delegate ID Cards',
      subject: 'Delegate Identification',
      author: 'KIMUN Admin',
      keywords: 'kimun, delegate, id, cards',
      creator: 'KIMUN Admin Portal'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const cardWidth = (pageWidth - margin * 3) / 2;
    const cardHeight = 50;
    const padding = 5;
    
    const logoUrl = 'https://i.ibb.co/xqSCdHHm/KIMUN-Logo-Color.png';
    
    try {
      await loadImage(logoUrl);
    } catch (error) {
      console.warn('Logo could not be loaded:', error);
    }

    let x = margin;
    let y = margin;
    let page = 1;

    for (let i = 0; i < delegates.length; i++) {
      const delegate = delegates[i];
      const committee = committees.find(c => c.id === delegate.committeeId);
      const portfolio = committee?.portfolios.find(p => p.id === delegate.portfolioId);
      const delegateId = generateDelegateId(delegate.name, delegate.phone);
      
      if (i > 0 && i % 4 === 0) {
        doc.addPage();
        page++;
        x = margin;
        y = margin;
      } else if (i % 2 === 0 && i > 0) {
        x = margin;
        y += cardHeight + margin;
      }
      
      doc.setDrawColor(200, 200, 200);
      doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'S');
      
      doc.setFontSize(10);
      doc.setTextColor(0, 0, 0);
      
      try {
        doc.addImage(logoUrl, 'PNG', x + padding, y + padding, 20, 10);
      } catch (error) {
        doc.setFontSize(12);
        doc.text('KIMUN 2025', x + padding, y + padding + 5);
      }
      
      doc.setFontSize(8);
      doc.text(`ID: ${delegateId}`, x + padding, y + padding + 15);
      doc.text(`Name: ${delegate.name}`, x + padding, y + padding + 20);
      doc.text(`Committee: ${committee?.name || 'N/A'}`, x + padding, y + padding + 25);
      doc.text(`Country: ${portfolio?.country || 'N/A'}`, x + padding, y + padding + 30);
      
      const barcodeUrl = `https://barcode.tec-it.com/barcode.ashx?data=${encodeURIComponent(delegateId)}&code=Code93&multiplebarcodes=false&translate-esc=false&unit=Fit&dpi=96&imagetype=Gif&rotation=0&color=%23000000&bgcolor=%23ffffff&codepage=Default&qunit=Mm&quiet=0`;
      
      try {
        await loadImage(barcodeUrl);
        doc.addImage(barcodeUrl, 'GIF', x + cardWidth - 40, y + padding + 15, 35, 15);
      } catch (error) {
        console.warn('Barcode could not be generated:', error);
        doc.text(`ID: ${delegateId}`, x + cardWidth - 35, y + padding + 25);
      }
      
      if (i % 2 === 0) {
        x += cardWidth + margin;
      }
    }

    doc.save(`KIMUN_Delegate_ID_Cards_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const exportDelegatesToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      delegates.map(d => {
        const committee = committees.find(c => c.id === d.committeeId);
        const portfolio = committee?.portfolios.find(p => p.id === d.portfolioId);
        return {
          'Delegate ID': generateDelegateId(d.name, d.phone),
          'Name': d.name,
          'Email': d.email,
          'Phone': d.phone,
          'Institution': d.institution || 'N/A',
          'Committee': committee?.name || 'N/A',
          'Country': portfolio?.country || 'N/A',
          'Experience': d.experience,
          'Status': d.isCheckedIn ? 'Checked In' : 'Not Checked In',
          'Check-in Time': d.checkInTime || 'N/A',
          'Double Delegation': d.isDoubleDel ? 'Yes' : 'No'
        }
      })
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Delegates');
    XLSX.writeFile(workbook, `KIMUN_Delegates_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);
  const auth = getAuth(app);

  useEffect(() => {
    emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_USER_ID || '');
  }, []);

  const loadImage = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => resolve(url);
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
      img.src = url;
    });
  };

  useEffect(() => {
    if (!accessGranted) return;
    setLoading(true);
    
    const committeesRef = ref(db, 'committees');
    const committeesUnsubscribe = onValue(committeesRef, (snapshot) => {
      if (snapshot.exists()) {
        const committeesData = snapshot.val();
        const committeesList = Object.keys(committeesData).map(id => ({
          id,
          name: committeesData[id].name || '',
          emoji: committeesData[id].emoji || '',
          type: committeesData[id].type || 'general',
          description: committeesData[id].description || '',
          topics: Array.isArray(committeesData[id].topics) 
            ? committeesData[id].topics 
            : typeof committeesData[id].topics === 'string' 
              ? [committeesData[id].topics] 
              : [],
          eb: committeesData[id].eb 
            ? Object.entries(committeesData[id].eb).map(([eid, e]: [string, any]) => ({
              id: eid,
              name: e.name || '',
              role: e.role || 'chair',
              email: e.email || '',
              bio: e.bio || '',
              photourl: e.photourl || '',
              instagram: e.instagram || ''
            })) 
            : [],
          portfolios: committeesData[id].portfolios 
            ? Object.entries(committeesData[id].portfolios).map(([pid, p]: [string, any]) => ({
                id: pid,
                country: p.country || '',
                countryCode: p.countryCode || '',
                isDoubleDelAllowed: p.isDoubleDelAllowed || false,
                isVacant: p.isVacant !== undefined ? p.isVacant : true,
                minExperience: typeof p.minExperience === 'string' 
                  ? parseInt(p.minExperience) || 0 
                  : p.minExperience || 0
              }))
            : [],
          backgroundGuide: committeesData[id].backgroundGuide || '',
          rules: committeesData[id].rules || ''
        }));
        setCommittees(committeesList);
      } else {
        setCommittees([]);
      }
    });

    const registrationsRef = ref(db, 'registrations');
    const registrationsUnsubscribe = onValue(registrationsRef, (snapshot) => {
      if (snapshot.exists()) {
        const registrationsData = snapshot.val();
        const delegatesList = Object.entries(registrationsData).flatMap(([regId, reg]: [string, any]) => {
          return Object.entries(reg.delegateInfo || {}).map(([delId, del]: [string, any]) => ({
            id: `${regId}_${delId}`,
            name: del.name || '',
            email: del.email || '',
            phone: del.phone || '',
            experience: typeof del.experience === 'string' 
              ? parseInt(del.experience) || 0 
              : del.experience || 0,
            institution: del.institution || '',
            course: del.course || '',
            year: del.year || '',
            committeeId: reg.committeeId || '',
            portfolioId: reg.portfolioId || '',
            isCheckedIn: del.isCheckedIn || false,
            checkInTime: del.checkInTime || '',
            isDoubleDel: reg.isDoubleDel || false,
            paymentId: reg.paymentId || '',
            timestamp: reg.timestamp || 0,
          }));
        });
        setDelegates(delegatesList);
      } else {
        setDelegates([]);
      }
    });
    const couponsRef = ref(db, 'coupons');
    const couponsUnsubscribe = onValue(couponsRef, (snapshot) => {
      if (snapshot.exists()) {
        const couponsData = snapshot.val();
        const couponsList = Object.entries(couponsData).map(([id, data]: [string, any]) => ({
          id,
          code: data.code,
          title: data.title,
          description: data.description,
          discount: data.discount,
          expiry: data.expiry,
          logo: data.logo,
          partner: data.partner,
          terms: data.terms,
          isUsed: data.isUsed || false,
          usedBy: data.usedBy || null,
          assignedAt: data.assignedAt || null
        }));
        setCoupons(couponsList);
      } else {
        setCoupons([]);
      }
    });
    const resourcesRef = ref(db, 'resources');
    const resourcesUnsubscribe = onValue(resourcesRef, (snapshot) => {
      if (snapshot.exists()) {
        const resourcesData = snapshot.val();
        const resourcesList = Object.entries(resourcesData).map(([id, res]: [string, any]) => ({
          id,
          title: res.title || '',
          type: res.type || 'other',
          url: res.url || '',
          committeeId: res.committeeId || '',
          description: res.description || '',
          pages: res.pages || 0
        }));
        setResources(resourcesList);
      } else {
        setResources([]);
      }
    });

    const blacklistedRef = ref(db, 'blacklisted');
    const blacklistedUnsubscribe = onValue(blacklistedRef, (snapshot) => {
      if (snapshot.exists()) {
        const blacklistedData = snapshot.val();
        const blacklistedList = Object.entries(blacklistedData).map(([id, data]: [string, any]) => ({
          id,
          name: data.name || '',
          email: data.email || '',
          reason: data.reason || '',
          timestamp: data.timestamp || 0
        }));
        setBlacklistedDelegates(blacklistedList);
      } else {
        setBlacklistedDelegates([]);
      }
    });

    setLoading(false);

    return () => {
      committeesUnsubscribe();
      registrationsUnsubscribe();
      resourcesUnsubscribe();
      blacklistedUnsubscribe();
    };
  }, [accessGranted]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setAccessGranted(true);
    } catch (error: any) {
      console.error('Login error:', error);
      setLoginError(error.message || 'Login failed. Please check your credentials.');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setAccessGranted(false);
      setEmail('');
      setPassword('');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const sendWelcomeEmail = async (delegate: Delegate) => {
    try {
      const response = await fetch('/api/send-checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toEmail: delegate.email,
          toName: delegate.name,
          committeeName: committees.find(c => c.id === delegate.committeeId)?.name
        }),
      });
  
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send welcome email');
      }
      console.log('Welcome email sent successfully');
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      throw error;
    }
  };

  const sendDebarredEmail = async (delegate: Delegate, reason: string) => {
    try {
      const response = await fetch('/api/send-ban', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toEmail: delegate.email,
          toName: delegate.name,
          reason: reason
        }),
      });
  
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send debarred email');
      }
      console.log('Debarred email sent successfully');
    } catch (error) {
      console.error('Failed to send debarred email:', error);
      throw error;
    }
  };

  const blacklistDelegate = async (delegate: Delegate, reason: string) => {
    try {
      const newBlacklisted = {
        id: delegate.id,
        name: delegate.name,
        email: delegate.email,
        reason: reason,
        timestamp: Date.now()
      };
      await push(ref(db, 'blacklisted'), newBlacklisted);
      await sendDebarredEmail(delegate, reason);
      alert('Delegate has been blacklisted and notified');
      setShowBlacklistModal(false);
      setBlacklistReason('');
      setCurrentDelegateToBlacklist(null);
    } catch (error) {
      console.error('Error blacklisting delegate:', error);
      alert(`Failed to blacklist delegate: ${error instanceof Error ? error.message : ''}`);
    }
  };

  const handleCheckIn = async () => {
    if (!barcodeInput) return;
    const delegateById = findDelegateByIdFormat(barcodeInput);
    const delegate = delegateById || delegates.find(d => 
      padPhoneNumber(d.phone) === padPhoneNumber(barcodeInput) || 
      d.email === barcodeInput
    );
  
    if (!delegate) {
      alert('Delegate not found!');
      return;
    }
  
    if (delegate.isCheckedIn) {
      alert('Delegate already checked in!');
      setBarcodeInput('');
      return;
    }
  
    try {
      const [regId, delId] = delegate.id.split('_');
      await update(ref(db, `registrations/${regId}/delegateInfo/${delId}`), {
        isCheckedIn: true,
        checkInTime: new Date().toISOString()
      });
      await sendWelcomeEmail(delegate);
      setBarcodeInput('');
      alert(`Checked in successfully! Welcome email sent to ${delegate.name}.`);
    } catch (error) {
      console.error('Check-in failed:', error);
      alert(`Check-in failed! ${error instanceof Error ? error.message : ''}`);
    }
  };

  const openCommitteeModal = (committee: Committee | null) => {
    setEditingCommittee(committee || {
      id: '',
      name: '',
      emoji: '',
      type: 'general',
      description: '',
      topics: [],
      eb: [],
      portfolios: [],
      backgroundGuide: '',
      rules: ''
    });
    setModalType('committee');
    setIsModalOpen(true);
  };

  const openEBModal = (eb: EBMember | null, committeeId: string) => {
    setEditingEB(eb || {
      id: '',
      name: '',
      role: 'chair',
      email: '',
      bio: '',
      photourl: '',
      instagram: ''
    });
    setEditingCommittee(committees.find(c => c.id === committeeId) || null);
    setModalType('eb');
    setIsModalOpen(true);
  };

  const openPortfolioModal = (portfolio: Portfolio | null, committeeId: string) => {
    setEditingPortfolio(portfolio || {
      id: '',
      country: '',
      countryCode: '',
      isDoubleDelAllowed: false,
      isVacant: true,
      minExperience: 0
    });
    setEditingCommittee(committees.find(c => c.id === committeeId) || null);
    setModalType('portfolio');
    setIsModalOpen(true);
  };

  const openResourceModal = (resource: Resource | null) => {
    setEditingResource(resource || {
      id: '',
      title: '',
      type: 'guide',
      url: '',
      committeeId: '',
      description: '',
      pages: 0
    });
    setModalType('resource');
    setIsModalOpen(true);
  };

  const openDelegateModal = (delegate: Delegate | null) => {
    setEditingDelegate(delegate || {
      id: '',
      name: '',
      email: '',
      phone: '',
      experience: 0,
      institution: '',
      course: '',
      year: '',
      committeeId: '',
      portfolioId: '',
      isCheckedIn: false,
      isDoubleDel: false,
      paymentId: '',
      timestamp: 0
    });
    setModalType('delegate');
    setIsModalOpen(true);
  };

  const saveDelegate = async (delegate: Delegate) => {
    try {
      const [regId, delId] = delegate.id.split('_');
      const delegateData = {
        name: delegate.name,
        email: delegate.email,
        phone: delegate.phone,
        experience: delegate.experience,
        institution: delegate.institution || '',
        course: delegate.course || '',
        year: delegate.year || '',
        isCheckedIn: delegate.isCheckedIn,
        checkInTime: delegate.checkInTime || '',
      };

      await update(ref(db, `registrations/${regId}/delegateInfo/${delId}`), delegateData);
      
      if (delegate.committeeId && delegate.portfolioId) {
        await update(ref(db, `registrations/${regId}`), {
          committeeId: delegate.committeeId,
          portfolioId: delegate.portfolioId,
          isDoubleDel: delegate.isDoubleDel
        });
      }
      
      setDelegates(prev => 
        prev.map(d => d.id === delegate.id ? delegate : d)
      );
      setIsModalOpen(false);
      return true;
    } catch (error) {
      console.error('Error saving delegate:', error);
      return false;
    }
  };

  const totalDelegates = delegates.length;
  const checkedInDelegates = delegates.filter(d => d.isCheckedIn).length;
  const singleDelegates = delegates.filter(d => !d.isDoubleDel).length;
  const doubleDelegates = delegates.filter(d => d.isDoubleDel).length;
  const amountReceived = (singleDelegates * 1260.03) + (doubleDelegates * 1212.015);
  const portfoliosVacant = committees.reduce((acc, c) => acc + c.portfolios.filter(p => p.isVacant).length, 0);
  const portfoliosOccupied = committees.reduce((acc, c) => acc + c.portfolios.filter(p => !p.isVacant).length, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const saveCommittee = async (committee: Committee) => {
    try {
      const committeeData = {
        name: committee.name,
        emoji: committee.emoji,
        type: committee.type,
        description: committee.description,
        topics: committee.topics,
        backgroundGuide: committee.backgroundGuide || '',
        rules: committee.rules || '',
        portfolios: committee.portfolios.reduce((acc, p) => {
          acc[p.id] = {
            country: p.country,
            countryCode: p.countryCode,
            isDoubleDelAllowed: p.isDoubleDelAllowed,
            isVacant: p.isVacant,
            minExperience: p.minExperience
          };
          return acc;
        }, {} as Record<string, any>)
      };

      if (committee.id) {
        await update(ref(db, `committees/${committee.id}`), committeeData);
      } else {
        const newRef = push(ref(db, 'committees'), committeeData);
        committee.id = newRef.key!;
      }
      
      setCommittees(prev => 
        committee.id 
          ? prev.map(c => c.id === committee.id ? committee : c)
          : [...prev, committee]
      );
      setIsModalOpen(false);
      return true;
    } catch (error) {
      console.error('Error saving committee:', error);
      return false;
    }
  };

  const saveEB = async (eb: EBMember, committeeId: string) => {
    try {
      const ebData = {
        name: eb.name,
        role: eb.role,
        email: eb.email,
        bio: eb.bio,
        photourl: eb.photourl || null,
        instagram: eb.instagram || null
      };

      if (eb.id) {
        await update(ref(db, `committees/${committeeId}/eb/${eb.id}`), ebData);
      } else {
        const newRef = push(ref(db, `committees/${committeeId}/eb`), ebData);
        eb.id = newRef.key!;
      }
      
      setCommittees(prev => 
        prev.map(c => 
          c.id === committeeId
            ? {
                ...c,
                eb: eb.id 
                  ? c.eb.map(e => e.id === eb.id ? eb : e)
                  : [...c.eb, eb]
              }
            : c
        )
      );
      setIsModalOpen(false);
      return true;
    } catch (error) {
      console.error('Error saving EB member:', error);
      return false;
    }
  };

  const savePortfolio = async (portfolio: Portfolio, committeeId: string) => {
    try {
      const portfolioData = {
        country: portfolio.country,
        countryCode: portfolio.countryCode,
        isDoubleDelAllowed: portfolio.isDoubleDelAllowed,
        isVacant: portfolio.isVacant,
        minExperience: portfolio.minExperience
      };

      if (portfolio.id) {
        await update(ref(db, `committees/${committeeId}/portfolios/${portfolio.id}`), portfolioData);
      } else {
        const newRef = push(ref(db, `committees/${committeeId}/portfolios`), portfolioData);
        portfolio.id = newRef.key!;
      }
      
      setCommittees(prev => 
        prev.map(c => 
          c.id === committeeId
            ? {
                ...c,
                portfolios: portfolio.id 
                  ? c.portfolios.map(p => p.id === portfolio.id ? portfolio : p)
                  : [...c.portfolios, portfolio]
              }
            : c
        )
      );
      setIsModalOpen(false);
      return true;
    } catch (error) {
      console.error('Error saving portfolio:', error);
      return false;
    }
  };

  const saveResource = async (resource: Resource) => {
    try {
      const resourceData = {
        title: resource.title,
        type: resource.type,
        url: resource.url,
        committeeId: resource.committeeId || '',
        description: resource.description || '',
        pages: resource.pages || 0
      };

      if (resource.id) {
        await update(ref(db, `resources/${resource.id}`), resourceData);
      } else {
        const newRef = push(ref(db, 'resources'), resourceData);
        resource.id = newRef.key!;
      }
      
      setResources(prev => 
        resource.id 
          ? prev.map(r => r.id === resource.id ? resource : r)
          : [...prev, resource]
      );
      setIsModalOpen(false);
      return true;
    } catch (error) {
      console.error('Error saving resource:', error);
      return false;
    }
  };

  const deleteItem = async (path: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return false;
    try {
      await remove(ref(db, path));
      return true;
    } catch (error) {
      console.error('Error deleting:', error);
      return false;
    }
  };

  if (!accessGranted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-amber-900">
        <div className="bg-gray-800 p-8 rounded-xl shadow-2xl max-w-md w-full border border-amber-600">
          <div className="text-center mb-6">
            <Award className="mx-auto h-16 w-16 text-amber-500 animate-pulse" />
            <h1 className="text-3xl font-bold text-amber-500 mt-4">KIMUN 2025 Portal</h1>
            <p className="text-gray-400 mt-2">Admin Dashboard</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
                {loginError}
              </div>
            )}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-amber-300 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                placeholder="admin@example.com"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-amber-300 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                placeholder="Enter password"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white py-3 rounded-lg font-semibold transition-all shadow-lg"
            >
              Login
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-amber-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-6 text-amber-300 text-lg font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 to-amber-900">
        <div className="text-center p-6 bg-gray-800/90 rounded-xl max-w-md border border-amber-600 shadow-xl">
          <h2 className="text-2xl font-bold text-amber-500 mb-4">Error</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  const filteredDelegates = delegates.filter(d => {
    const committeeMatch = selectedCommittee ? d.committeeId === selectedCommittee : true;
    if (viewMode === 'checkedIn') return d.isCheckedIn && committeeMatch;
    if (viewMode === 'notCheckedIn') return !d.isCheckedIn && committeeMatch;
    return committeeMatch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-amber-900 text-gray-100 flex">
      <div className="w-64 bg-gray-800/90 text-white fixed h-full border-r border-amber-700/50 shadow-xl">
        <div className="p-6 border-b border-gray-700/50">
          <h1 className="text-2xl font-bold flex items-center justify-center">
            <Award className="mr-3 text-amber-500 h-8 w-8" /> 
            <span className="bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
              KIMUN 2025
            </span>
          </h1>
          <p className="text-xs text-gray-400 text-center mt-1">Admin Portal</p>
        </div>
        <nav className="p-4 space-y-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center w-full p-4 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-amber-900/50 text-amber-300 shadow-md' : 'text-gray-300 hover:bg-gray-700/50 hover:text-amber-200'}`}
          >
            <ChartBar className="mr-3 h-5 w-5" /> Dashboard
          </button>
          <button
            onClick={() => setActiveTab('delegates')}
            className={`flex items-center w-full p-4 rounded-xl transition-all ${activeTab === 'delegates' ? 'bg-amber-900/50 text-amber-300 shadow-md' : 'text-gray-300 hover:bg-gray-700/50 hover:text-amber-200'}`}
          >
            <UserCheck className="mr-3 h-5 w-5" /> Delegates
          </button>
          <button
            onClick={() => setActiveTab('coupons')}
            className={`flex items-center w-full p-4 rounded-xl transition-all ${activeTab === 'coupons' ? 'bg-amber-900/50 text-amber-300 shadow-md' : 'text-gray-300 hover:bg-gray-700/50 hover:text-amber-200'}`}
          >
            <Ticket className="mr-3 h-5 w-5" /> Coupons
          </button>
          <button
            onClick={() => setActiveTab('committees')}
            className={`flex items-center w-full p-4 rounded-xl transition-all ${activeTab === 'committees' ? 'bg-amber-900/50 text-amber-300 shadow-md' : 'text-gray-300 hover:bg-gray-700/50 hover:text-amber-200'}`}
          >
            <Users className="mr-3 h-5 w-5" /> Committees
          </button>
          <button
            onClick={() => setActiveTab('eb')}
            className={`flex items-center w-full p-4 rounded-xl transition-all ${activeTab === 'eb' ? 'bg-amber-900/50 text-amber-300 shadow-md' : 'text-gray-300 hover:bg-gray-700/50 hover:text-amber-200'}`}
          >
            <Briefcase className="mr-3 h-5 w-5" /> Executive Board
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`flex items-center w-full p-4 rounded-xl transition-all ${activeTab === 'resources' ? 'bg-amber-900/50 text-amber-300 shadow-md' : 'text-gray-300 hover:bg-gray-700/50 hover:text-amber-200'}`}
          >
            <BookOpen className="mr-3 h-5 w-5" /> Resources
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center w-full p-4 rounded-xl transition-all ${activeTab === 'settings' ? 'bg-amber-900/50 text-amber-300 shadow-md' : 'text-gray-300 hover:bg-gray-700/50 hover:text-amber-200'}`}
          >
            <Settings className="mr-3 h-5 w-5" /> Settings
          </button>
        </nav>
      </div>

      <div className="flex-1 ml-64">
        <header className="bg-gray-800/80 backdrop-blur-sm p-4 border-b border-amber-700/30 shadow-sm">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-amber-300 capitalize">
              {activeTab === 'dashboard' && 'Conference Dashboard'}
              {activeTab === 'delegates' && 'Delegates Management'}
              {activeTab === 'committees' && 'Committees Management'}
              {activeTab === 'eb' && 'Executive Board'}
              {activeTab === 'resources' && 'Resources'}
              {activeTab === 'settings' && 'Settings'}
            </h2>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-white placeholder-gray-400 transition-all"
                />
                <svg
                  className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center text-white font-semibold shadow">
                {email.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </header>

        <main className="p-6">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gray-800/60 p-6 rounded-xl shadow-lg border border-amber-700/30 backdrop-blur-sm">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-full bg-amber-100/10 text-amber-400">
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm text-amber-300">Total Delegates</p>
                      <p className="text-2xl font-bold text-white">{totalDelegates}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-800/60 p-6 rounded-xl shadow-lg border border-green-700/30 backdrop-blur-sm">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-full bg-green-100/10 text-green-400">
                      <CheckCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm text-green-300">Checked In</p>
                      <p className="text-2xl font-bold text-white">{checkedInDelegates}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-800/60 p-6 rounded-xl shadow-lg border border-blue-700/30 backdrop-blur-sm">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-full bg-blue-100/10 text-blue-400">
                      <Coins className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm text-blue-300">Amount Received</p>
                      <p className="text-2xl font-bold text-white">{formatCurrency(amountReceived)}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-800/60 p-6 rounded-xl shadow-lg border border-purple-700/30 backdrop-blur-sm">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-full bg-purple-100/10 text-purple-400">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm text-purple-300">Committees</p>
                      <p className="text-2xl font-bold text-white">{committees.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-800/60 p-6 rounded-xl shadow-lg border border-amber-700/30 backdrop-blur-sm">
                  <h3 className="text-lg font-semibold mb-4 text-amber-300">Registrations by Committee</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={committees.map(c => ({
                          name: c.name,
                          registrations: delegates.filter(d => d.committeeId === c.id).length
                        }))}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#4b5563" />
                        <XAxis 
                          dataKey="name" 
                          stroke="#d1d5db"
                          tick={{ fill: '#d1d5db' }}
                        />
                        <YAxis 
                          stroke="#d1d5db"
                          tick={{ fill: '#d1d5db' }}
                        />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1f2937', 
                            borderColor: '#4b5563', 
                            borderRadius: '0.5rem',
                            color: '#f3f4f6'
                          }}
                          itemStyle={{ color: '#f3f4f6' }}
                        />
                        <Bar dataKey="registrations" fill="#d97706" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-gray-800/60 p-6 rounded-xl shadow-lg border border-amber-700/30 backdrop-blur-sm">
                  <h3 className="text-lg font-semibold mb-4 text-amber-300">Portfolio Distribution</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Vacant', value: portfoliosVacant },
                            { name: 'Occupied', value: portfoliosOccupied },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          <Cell fill="#b45309" />
                          <Cell fill="#10b981" />
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#1f2937',
                            borderColor: '#4b5563',
                            borderRadius: '0.5rem',
                            color: '#f3f4f6'
                          }}
                          formatter={(value, name) => [value, name]}
                        />
                        <Legend 
                          wrapperStyle={{ color: '#d1d5db' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/60 p-6 rounded-xl shadow-lg border border-amber-700/30 backdrop-blur-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-amber-300">Recent Check-ins</h3>
                  <Button 
                    variant="outline" 
                    className="border-amber-500/50 text-amber-400 hover:bg-amber-900/50 hover:text-amber-300"
                    onClick={() => setActiveTab('delegates')}
                  >
                    View All
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700/50">
                    <thead className="bg-gray-700/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-amber-400 uppercase tracking-wider">Delegate</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-amber-400 uppercase tracking-wider">Committee</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-amber-400 uppercase tracking-wider">Portfolio</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-amber-400 uppercase tracking-wider">Time</th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800/30 divide-y divide-gray-700/30">
                      {delegates
                        .filter(d => d.isCheckedIn)
                        .sort((a, b) => (b.checkInTime || '').localeCompare(a.checkInTime || ''))
                        .slice(0, 5)
                        .map(delegate => (
                          <tr key={delegate.id} className="hover:bg-gray-700/30">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-amber-100/10 flex items-center justify-center text-amber-400 font-semibold">
                                  {delegate.name.charAt(0)}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-white">{delegate.name}</div>
                                  <div className="text-sm text-gray-300">{delegate.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-white">
                                {committees.find(c => c.id === delegate.committeeId)?.name || 'N/A'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-white">
                                {committees.find(c => c.id === delegate.committeeId)
                                  ?.portfolios.find(p => p.id === delegate.portfolioId)?.country || 'N/A'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {delegate.checkInTime ? new Date(delegate.checkInTime).toLocaleString() : 'N/A'}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'delegates' && (
            <div className="space-y-6">
              <div className="bg-gray-800/60 p-6 rounded-xl shadow-lg border border-amber-700/30 backdrop-blur-sm">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                  <div className="flex-1">
                    <Select
                      options={committees.map(c => ({ value: c.id, label: c.name }))}
                      placeholder="Filter by Committee"
                      onChange={(selected) => setSelectedCommittee(selected?.value || null)}
                      isClearable
                      className="react-select-container"
                      classNamePrefix="react-select"
                      styles={{
                        control: (base) => ({
                          ...base,
                          backgroundColor: '#1f2937',
                          borderColor: '#4b5563',
                          color: 'white'
                        }),
                        singleValue: (base) => ({
                          ...base,
                          color: 'white'
                        }),
                        menu: (base) => ({
                          ...base,
                          backgroundColor: '#1f2937',
                          color: 'white'
                        }),
                        option: (base) => ({
                          ...base,
                          backgroundColor: '#1f2937',
                          ':hover': {
                            backgroundColor: '#374151'
                          }
                        })
                      }}
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant={viewMode === 'all' ? 'default' : 'outline'}
                      onClick={() => setViewMode('all')}
                      className={`${viewMode === 'all' ? 'bg-amber-700/50 border-amber-600/50 text-amber-200' : 'border-gray-600/50 text-gray-300 hover:bg-gray-700/50'}`}
                    >
                      All
                    </Button>
                    <Button
                      variant={viewMode === 'checkedIn' ? 'default' : 'outline'}
                      onClick={() => setViewMode('checkedIn')}
                      className={`${viewMode === 'checkedIn' ? 'bg-green-700/50 border-green-600/50 text-green-200' : 'border-gray-600/50 text-gray-300 hover:bg-gray-700/50'}`}
                    >
                      Checked In
                    </Button>
                    <Button
                      variant={viewMode === 'notCheckedIn' ? 'default' : 'outline'}
                      onClick={() => setViewMode('notCheckedIn')}
                      className={`${viewMode === 'notCheckedIn' ? 'bg-red-700/50 border-red-600/50 text-red-200' : 'border-gray-600/50 text-gray-300 hover:bg-gray-700/50'}`}
                    >
                      Not Checked In
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6 p-4 bg-amber-900/30 rounded-xl border border-amber-700/30">
                  <div className="flex-1">
                    <div className="relative">
                      <QrCode className="absolute left-3 top-3 h-5 w-5 text-amber-400" />
                      <input
                        type="text"
                        placeholder="Scan Delegate ID (e.g. JOHN1234) or enter phone/email"
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCheckIn()}
                        className="pl-10 pr-4 py-2 w-full bg-gray-700/50 border border-amber-600/50 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-white placeholder-gray-400 transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      onClick={handleCheckIn} 
                      className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-lg"
                    >
                      <CheckCircle className="mr-2 h-5 w-5" /> Check In
                    </Button>
                  </div>
                </div>

                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-amber-300">
                    {viewMode === 'all' && 'All Delegates'}
                    {viewMode === 'checkedIn' && 'Checked In Delegates'}
                    {viewMode === 'notCheckedIn' && 'Not Checked In Delegates'}
                    {selectedCommittee && ` (${committees.find(c => c.id === selectedCommittee)?.name})`}
                  </h3>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={exportDelegatesToExcel}
                      className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-900/30 hover:text-emerald-300"
                    >
                      <Download className="mr-2 h-5 w-5" /> Export Excel
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => generateBarcodeLabelsPDF(filteredDelegates)}
                      className="border-purple-500/50 text-purple-400 hover:bg-purple-900/30 hover:text-purple-300"
                    >
                      <Printer className="mr-2 h-5 w-5" /> Print ID Cards
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700/50">
                    <thead className="bg-gray-700/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-amber-400 uppercase tracking-wider">Delegate ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-amber-400 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-amber-400 uppercase tracking-wider">Phone</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-amber-400 uppercase tracking-wider">Committee</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-amber-400 uppercase tracking-wider">Portfolio</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-amber-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-amber-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800/30 divide-y divide-gray-700/30">
                      {filteredDelegates.length > 0 ? (
                        filteredDelegates.map(delegate => (
                          <tr key={delegate.id} className="hover:bg-gray-700/30">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-amber-400">
                              {generateDelegateId(delegate.name, delegate.phone)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{delegate.name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-white">{delegate.phone}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {committees.find(c => c.id === delegate.committeeId)?.name || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                              {committees.find(c => c.id === delegate.committeeId)
                                ?.portfolios.find(p => p.id === delegate.portfolioId)?.country || 'N/A'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                delegate.isCheckedIn 
                                  ? 'bg-green-100/20 text-green-300' 
                                  : 'bg-red-100/20 text-red-300'
                              }`}>
                                {delegate.isCheckedIn ? 'Checked In' : 'Not Checked In'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex space-x-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openDelegateModal(delegate)}
                                  className="text-amber-500 hover:text-amber-400 hover:bg-amber-900/20"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                {!delegate.isCheckedIn && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setCurrentDelegateToBlacklist(delegate);
                                      setShowBlacklistModal(true);
                                    }}
                                    className="text-red-500 hover:text-red-400 hover:bg-red-900/20"
                                  >
                                    <Ban className="h-4 w-4" />
                                  </Button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-300">
                            No delegates found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'coupons' && (
            <div className="space-y-6">
              <div className="bg-gray-800/60 p-6 rounded-xl shadow-lg border border-amber-700/30 backdrop-blur-sm">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-amber-300">Coupons Management</h2>
                  <Button 
                    onClick={() => {
                      setEditingCoupon({
                        id: '',
                        code: '',
                        title: '',
                        description: '',
                        discount: '',
                        expiry: '',
                        logo: '',
                        partner: '',
                        terms: '',
                        isUsed: false,
                        usedBy: null,
                        assignedAt: null
                      });
                      setIsModalOpen(true);
                      setModalType('coupon');
                    }}
                    className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-lg"
                  >
                    <Plus className="mr-2 h-5 w-5" /> Add Coupon
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {coupons.map(coupon => (
                    <div key={coupon.id} className="bg-gray-700/50 p-4 rounded-xl border border-amber-600/30">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          {coupon.logo && (
                            <img src={coupon.logo} alt={coupon.partner} className="h-8 w-8 object-contain rounded" />
                          )}
                          <h3 className="font-semibold text-white">{coupon.title}</h3>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          coupon.isUsed ? 'bg-red-100/20 text-red-300' : 'bg-green-100/20 text-green-300'
                        }`}>
                          {coupon.isUsed ? 'Used' : 'Active'}
                        </span>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm text-amber-400 font-mono">{coupon.code}</p>
                        <p className="text-white">{coupon.description}</p>
                        <p className="text-gray-300 text-sm">Discount: {coupon.discount}</p>
                        <p className="text-gray-300 text-sm">Expiry: {coupon.expiry}</p>
                        <div className="flex space-x-2 mt-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingCoupon(coupon);
                              setIsModalOpen(true);
                              setModalType('coupon');
                            }}
                            className="text-amber-500 hover:text-amber-400 hover:bg-amber-900/20"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteItem(`coupons/${coupon.id}`)}
                            className="text-red-500 hover:text-red-400 hover:bg-red-900/20"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'committees' && (
            <div className="space-y-6">
              <div className="bg-gray-800/60 p-6 rounded-xl shadow-lg border border-amber-700/30 backdrop-blur-sm">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-amber-300">Committees</h2>
                  <Button 
                    onClick={() => openCommitteeModal(null)}
                    className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-lg"
                  >
                    <Plus className="mr-2 h-5 w-5" /> Add Committee
                  </Button>
                </div>

                <div className="space-y-4">
                  {committees.map(committee => (
                    <div key={committee.id} className="border border-amber-700/30 rounded-xl overflow-hidden">
                      <div className="bg-gray-700/50 px-6 py-4 flex justify-between items-center border-b border-amber-700/30">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">{committee.emoji}</span>
                          <h3 className="text-lg font-semibold text-white">{committee.name}</h3>
                          <span className="ml-3 px-2 py-1 text-xs rounded-full bg-amber-900/30 text-amber-300 capitalize">
                            {committee.type}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPortfolioModal(null, committee.id)}
                            className="border-amber-500/50 text-amber-400 hover:bg-amber-900/30"
                          >
                            <Plus className="mr-2 h-4 w-4" /> Add Portfolio
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openCommitteeModal(committee)}
                            className="border-gray-500/50 text-gray-300 hover:bg-gray-700/50"
                          >
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteItem(`committees/${committee.id}`)}
                            className="border-red-500/50 text-red-400 hover:bg-red-900/30"
                          >
                            <Trash className="mr-2 h-4 w-4" /> Delete
                          </Button>
                        </div>
                      </div>
                      
                      <div className="p-6">
                        <p className="text-gray-300 mb-4">{committee.description}</p>
                        
                        <div className="mb-6">
                          <h4 className="font-medium mb-2 text-amber-300">Agenda Items:</h4>
                          <ul className="list-disc pl-5 space-y-1 text-gray-300">
                            {committee.topics.map((topic, i) => (
                              <li key={i}>{topic}</li>
                            ))}
                          </ul>
                        </div>

                        {committee.backgroundGuide && (
                          <div className="mb-4">
                            <h4 className="font-medium text-amber-300 mb-2">Background Guide:</h4>
                            <a 
                              href={committee.backgroundGuide} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-amber-400 hover:underline"
                            >
                              View Background Guide
                            </a>
                          </div>
                        )}

                        {committee.rules && (
                          <div className="mb-6">
                            <h4 className="font-medium text-amber-300 mb-2">Rules of Procedure:</h4>
                            <a 
                              href={committee.rules} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-amber-400 hover:underline"
                            >
                              View Rules
                            </a>
                          </div>
                        )}

                        <div className="mb-6">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium text-amber-300">Portfolios ({committee.portfolios.length})</h4>
                            <div className="flex items-center">
                              <span className="text-sm text-gray-400 mr-4">
                                {committee.portfolios.filter(p => !p.isVacant).length} assigned •{' '}
                                {committee.portfolios.filter(p => p.isVacant).length} vacant
                              </span>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {committee.portfolios.map(portfolio => {
                              const FlagComponent = Flags[`${portfolio.countryCode}Flag` as keyof typeof Flags];
                              return (
                                <div key={portfolio.id} className="border border-amber-700/30 rounded-xl p-3 flex justify-between items-center">
                                  <div className="flex items-center">
                                    {FlagComponent && (
                                      <div className="w-6 h-6 mr-2 overflow-hidden rounded-sm">
                                        <FlagComponent className="w-full h-full object-cover" />
                                      </div>
                                    )}
                                    <div>
                                      <p className="font-medium text-white">{portfolio.country}</p>
                                      <p className="text-xs text-gray-400">
                                        {portfolio.isVacant ? 'Vacant' : 'Assigned'} •{' '}
                                        {portfolio.isDoubleDelAllowed ? 'Double Del' : 'Single Del'}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex space-x-1">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => openPortfolioModal(portfolio, committee.id)}
                                      className="text-amber-500 hover:text-amber-400 hover:bg-amber-900/20"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => deleteItem(`committees/${committee.id}/portfolios/${portfolio.id}`)}
                                      className="text-red-500 hover:text-red-400 hover:bg-red-900/20"
                                    >
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'eb' && (
            <div className="space-y-6">
              <div className="bg-gray-800/60 p-6 rounded-xl shadow-lg border border-amber-700/30 backdrop-blur-sm">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-amber-300">Executive Board</h2>
                  <Select
                    options={committees.map(c => ({ value: c.id, label: c.name }))}
                    placeholder="Filter by Committee"
                    onChange={(selected) => setSelectedCommittee(selected?.value || null)}
                    isClearable
                    className="react-select-container w-64"
                    classNamePrefix="react-select"
                    styles={{
                      control: (base) => ({
                        ...base,
                        backgroundColor: '#1f2937',
                        borderColor: '#4b5563',
                        color: 'white'
                      }),
                      singleValue: (base) => ({
                        ...base,
                        color: 'white'
                      }),
                      menu: (base) => ({
                        ...base,
                        backgroundColor: '#1f2937',
                        color: 'white'
                      }),
                      option: (base) => ({
                        ...base,
                        backgroundColor: '#1f2937',
                        ':hover': {
                          backgroundColor: '#374151'
                        }
                      })
                    }}
                  />
                </div>

                <div className="space-y-4">
                  {committees
                    .filter(c => !selectedCommittee || c.id === selectedCommittee)
                    .map(committee => (
                      <div key={committee.id} className="border border-amber-700/30 rounded-xl overflow-hidden">
                        <div className="bg-gray-700/50 px-6 py-4 flex justify-between items-center border-b border-amber-700/30">
                          <div className="flex items-center">
                            <span className="text-2xl mr-3">{committee.emoji}</span>
                            <h3 className="text-lg font-semibold text-white">{committee.name}</h3>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEBModal(null, committee.id)}
                            className="border-amber-500/50 text-amber-400 hover:bg-amber-900/30"
                          >
                            <Plus className="mr-2 h-4 w-4" /> Add EB Member
                          </Button>
                        </div>
                        
                        <div className="p-6">
                          {committee.eb.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {committee.eb.map(member => (
                                <div key={member.id} className="border border-amber-700/30 rounded-xl p-4">
                                  <div className="flex items-start space-x-4">
                                    {member.photourl && (
                                      <div className="flex-shrink-0">
                                        <img 
                                          src={member.photourl} 
                                          alt={member.name}
                                          className="h-12 w-12 rounded-full object-cover border-2 border-amber-600/30"
                                        />
                                      </div>
                                    )}
                                    <div className="flex-1">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <h4 className="font-medium text-white">{member.name}</h4>
                                          <p className="text-sm text-amber-400 capitalize">{member.role}</p>
                                        </div>
                                        <div className="flex space-x-1">
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openEBModal(member, committee.id)}
                                            className="text-amber-500 hover:text-amber-400 hover:bg-amber-900/20"
                                          >
                                            <Edit className="h-4 w-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => deleteItem(`committees/${committee.id}/eb/${member.id}`)}
                                            className="text-red-500 hover:text-red-400 hover:bg-red-900/20"
                                          >
                                            <Trash className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      </div>
                                      <div className="mt-3">
                                        <p className="text-sm text-gray-300">
                                          <a href={`mailto:${member.email}`} className="text-amber-400 hover:underline">
                                            {member.email}
                                          </a>
                                        </p>
                                        {member.instagram && (
                                          <p className="mt-1 text-sm text-gray-300">
                                            Instagram:{" "}
                                            <a
                                              href={`https://instagram.com/${member.instagram}`}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              className="text-amber-400 hover:underline"
                                            >
                                              @{member.instagram}
                                            </a>
                                          </p>
                                        )}
                                        {member.bio && (
                                          <p className="mt-2 text-sm text-gray-300">{member.bio}</p>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-400 text-center py-4">No EB members added yet</p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'resources' && (
            <div className="space-y-6">
              <div className="bg-gray-800/60 p-6 rounded-xl shadow-lg border border-amber-700/30 backdrop-blur-sm">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-amber-300">Resources</h2>
                  <Button 
                    onClick={() => openResourceModal(null)}
                    className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white shadow-lg"
                  >
                    <Plus className="mr-2 h-5 w-5" /> Add Resource
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700/50">
                    <thead className="bg-gray-700/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-amber-400 uppercase tracking-wider">Title</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-amber-400 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-amber-400 uppercase tracking-wider">Committee</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-amber-400 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-amber-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800/30 divide-y divide-gray-700/30">
                      {resources.map(resource => (
                        <tr key={resource.id} className="hover:bg-gray-700/30">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <a 
                              href={resource.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-amber-400 hover:underline"
                            >
                              {resource.title}
                            </a>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs rounded-full bg-amber-900/30 text-amber-300 capitalize">
                              {resource.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-white">
                            {resource.committeeId 
                              ? committees.find(c => c.id === resource.committeeId)?.name 
                              : 'All Committees'}
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-300 line-clamp-2">{resource.description}</p>
                            {resource.pages && (
                              <p className="text-xs text-gray-400 mt-1">{resource.pages} pages</p>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex space-x-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openResourceModal(resource)}
                                className="text-amber-500 hover:text-amber-400 hover:bg-amber-900/20"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteItem(`resources/${resource.id}`)}
                                className="text-red-500 hover:text-red-400 hover:bg-red-900/20"
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-gray-800/60 p-6 rounded-xl shadow-lg border border-amber-700/30 backdrop-blur-sm">
              <h2 className="text-xl font-semibold mb-6 text-amber-300">Settings</h2>
              <div className="space-y-6">
                <div className="border border-amber-700/30 rounded-xl p-6">
                  <h3 className="text-lg font-medium mb-4 text-amber-300">Conference Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-amber-300 mb-1">Conference Name</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        defaultValue="Kalinga International MUN"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-amber-300 mb-1">Conference Dates</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        defaultValue="August 30, 31, 2025"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-amber-300 mb-1">Venue</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        defaultValue="BMPS"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-amber-300 mb-1">Registration Fee (Single)</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        defaultValue="1200 INR"
                      />
                    </div>
                  </div>
                  <div className="mt-6">
                    <Button className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white">
                      Save Changes
                    </Button>
                  </div>
                </div>

                <div className="border border-amber-700/30 rounded-xl p-6">
                  <h3 className="text-lg font-medium mb-4 text-amber-300">Admin Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-amber-300 mb-1">Admin Email</label>
                      <input
                        type="email"
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        defaultValue="admin@kimun.in"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-amber-300 mb-1">Change Password</label>
                      <input
                        type="password"
                        placeholder="New Password"
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 mb-2"
                      />
                      <input
                        type="password"
                        placeholder="Confirm Password"
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      />
                    </div>
                    <div className="pt-2">
                      <Button className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white">
                        Update Credentials
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-800/90 backdrop-blur-sm border-t border-amber-700/30 z-40">
        <div className="flex justify-around p-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`p-3 rounded-lg ${activeTab === 'dashboard' ? 'text-amber-400 bg-amber-900/30' : 'text-gray-300'}`}
          >
            <ChartBar className="h-5 w-5 mx-auto" />
            <span className="text-xs mt-1">Dashboard</span>
          </button>
          <button
            onClick={() => setActiveTab('delegates')}
            className={`p-3 rounded-lg ${activeTab === 'delegates' ? 'text-amber-400 bg-amber-900/30' : 'text-gray-300'}`}
          >
            <UserCheck className="h-5 w-5 mx-auto" />
            <span className="text-xs mt-1">Delegates</span>
          </button>
          <button
            onClick={() => setActiveTab('committees')}
            className={`p-3 rounded-lg ${activeTab === 'committees' ? 'text-amber-400 bg-amber-900/30' : 'text-gray-300'}`}
          >
            <Users className="h-5 w-5 mx-auto" />
            <span className="text-xs mt-1">Committees</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`p-3 rounded-lg ${activeTab === 'settings' ? 'text-amber-400 bg-amber-900/30' : 'text-gray-300'}`}
          >
            <Settings className="h-5 w-5 mx-auto" />
            <span className="text-xs mt-1">Settings</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-gray-800/90 backdrop-blur-lg rounded-xl shadow-2xl w-full max-w-md border border-amber-700/30"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-amber-300">
                    {modalType === 'committee' && (editingCommittee?.id ? 'Edit Committee' : 'Add Committee')}
                    {modalType === 'eb' && (editingEB?.id ? 'Edit EB Member' : 'Add EB Member')}
                    {modalType === 'portfolio' && (editingPortfolio?.id ? 'Edit Portfolio' : 'Add Portfolio')}
                    {modalType === 'resource' && (editingResource?.id ? 'Edit Resource' : 'Add Resource')}
                    {modalType === 'coupon' && (editingCoupon?.id ? 'Edit Coupon' : 'Add Coupon')}
                    {modalType === 'delegate' && (editingDelegate?.id ? 'Edit Delegate' : 'Add Delegate')}
                  </h3>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-400 hover:text-amber-400"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {modalType === 'delegate' && editingDelegate && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-amber-300 mb-1">Name</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        value={editingDelegate.name}
                        onChange={(e) => setEditingDelegate({...editingDelegate, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-amber-300 mb-1">Email</label>
                      <input
                        type="email"
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        value={editingDelegate.email}
                        onChange={(e) => setEditingDelegate({...editingDelegate, email: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-amber-300 mb-1">Phone</label>
                      <input
                        type="tel"
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        value={editingDelegate.phone}
                        onChange={(e) => setEditingDelegate({...editingDelegate, phone: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-amber-300 mb-1">Institution</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        value={editingDelegate.institution || ''}
                        onChange={(e) => setEditingDelegate({...editingDelegate, institution: e.target.value})}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-amber-300 mb-1">Committee</label>
                        <Select
                          options={committees.map(c => ({ value: c.id, label: c.name }))}
                          value={committees.find(c => c.id === editingDelegate.committeeId)}
                          onChange={(option) => setEditingDelegate({...editingDelegate, committeeId: option?.value || ''})}
                          className="react-select-container"
                          classNamePrefix="react-select"
                          styles={{
                            control: (base) => ({
                              ...base,
                              backgroundColor: '#1f2937',
                              borderColor: '#4b5563',
                              color: 'white'
                            }),
                            singleValue: (base) => ({
                              ...base,
                              color: 'white'
                            }),
                            menu: (base) => ({
                              ...base,
                              backgroundColor: '#1f2937',
                              color: 'white'
                            }),
                            option: (base) => ({
                              ...base,
                              backgroundColor: '#1f2937',
                              ':hover': {
                                backgroundColor: '#374151'
                              }
                            })
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-amber-300 mb-1">Portfolio</label>
                        <Select
                          options={committees
                            .find(c => c.id === editingDelegate.committeeId)
                            ?.portfolios.map(p => ({ 
                              value: p.id, 
                              label: `${p.country} ${p.isVacant ? '' : '(Assigned)'}`
                            })) || []}
                          value={committees
                            .find(c => c.id === editingDelegate.committeeId)
                            ?.portfolios.find(p => p.id === editingDelegate.portfolioId)}
                          onChange={(option) => setEditingDelegate({...editingDelegate, portfolioId: option?.value || ''})}
                          className="react-select-container"
                          classNamePrefix="react-select"
                          styles={{
                            control: (base) => ({
                              ...base,
                              backgroundColor: '#1f2937',
                              borderColor: '#4b5563',
                              color: 'white'
                            }),
                            singleValue: (base) => ({
                              ...base,
                              color: 'white'
                            }),
                            menu: (base) => ({
                              ...base,
                              backgroundColor: '#1f2937',
                              color: 'white'
                            }),
                            option: (base) => ({
                              ...base,
                              backgroundColor: '#1f2937',
                              ':hover': {
                                backgroundColor: '#374151'
                              }
                            })
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isCheckedIn"
                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                        checked={editingDelegate.isCheckedIn}
                        onChange={(e) => setEditingDelegate({...editingDelegate, isCheckedIn: e.target.checked})}
                      />
                      <label htmlFor="isCheckedIn" className="ml-2 block text-sm text-amber-300">
                        Checked In
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="isDoubleDel"
                        className="h-4 w-4 text-amber-600 focus:ring-amber-500 border-gray-300 rounded"
                        checked={editingDelegate.isDoubleDel}
                        onChange={(e) => setEditingDelegate({...editingDelegate, isDoubleDel: e.target.checked})}
                      />
                      <label htmlFor="isDoubleDel" className="ml-2 block text-sm text-amber-300">
                        Double Delegation
                      </label>
                    </div>
                    <div className="pt-4">
                      <Button 
                        onClick={async () => {
                          const success = await saveDelegate(editingDelegate);
                          if (success) setIsModalOpen(false);
                        }}
                        className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white py-2 rounded-lg"
                      >
                        Save Delegate
                      </Button>
                    </div>
                  </div>
                )}

                {modalType === 'coupon' && editingCoupon && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-amber-300 mb-1">Code</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        value={editingCoupon.code}
                        onChange={(e) => setEditingCoupon({...editingCoupon, code: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-amber-300 mb-1">Title</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        value={editingCoupon.title}
                        onChange={(e) => setEditingCoupon({...editingCoupon, title: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-amber-300 mb-1">Description</label>
                      <textarea
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        value={editingCoupon.description}
                        onChange={(e) => setEditingCoupon({...editingCoupon, description: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-amber-300 mb-1">Discount</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        value={editingCoupon.discount}
                        onChange={(e) => setEditingCoupon({...editingCoupon, discount: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-amber-300 mb-1">Expiry Date</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        value={editingCoupon.expiry}
                        onChange={(e) => setEditingCoupon({...editingCoupon, expiry: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-amber-300 mb-1">Logo Url</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        value={editingCoupon.logo}
                        onChange={(e) => setEditingCoupon({...editingCoupon, logo: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-amber-300 mb-1">Partner</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        value={editingCoupon.partner}
                        onChange={(e) => setEditingCoupon({...editingCoupon, partner: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-amber-300 mb-1">Terms</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        value={editingCoupon.terms}
                        onChange={(e) => setEditingCoupon({...editingCoupon, terms: e.target.value})}
                      />
                    </div>
                    <div className="pt-4">
                      <Button 
                        onClick={async () => {
                          try {
                            const couponData = {
                              code: editingCoupon.code,
                              title: editingCoupon.title,
                              description: editingCoupon.description,
                              discount: editingCoupon.discount,
                              expiry: editingCoupon.expiry,
                              logo: editingCoupon.logo,
                              partner: editingCoupon.partner,
                              terms: editingCoupon.terms,
                              isUsed: editingCoupon.isUsed,
                              usedBy: editingCoupon.usedBy,
                              assignedAt: editingCoupon.assignedAt
                            };

                            if (editingCoupon.id) {
                              await update(ref(db, `coupons/${editingCoupon.id}`), couponData);
                            } else {
                              await push(ref(db, 'coupons'), couponData);
                            }
                            setIsModalOpen(false);
                          } catch (error) {
                            console.error('Error saving coupon:', error);
                          }
                        }}
                        className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white py-2 rounded-lg"
                      >
                        Save Coupon
                      </Button>
                    </div>
                  </div>
                )}

                {modalType === 'committee' && editingCommittee && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-amber-300 mb-1">Name</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        value={editingCommittee.name}
                        onChange={(e) => setEditingCommittee({...editingCommittee, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-amber-300 mb-1">Emoji</label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        value={editingCommittee.emoji}
                        onChange={(e) => setEditingCommittee({...editingCommittee, emoji: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-amber-300 mb-1">Type</label>
                      <select
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        value={editingCommittee.type}
                        onChange={(e) => setEditingCommittee({...editingCommittee, type: e.target.value as any})}
                      >
                        <option value="general">General Assembly</option>
                        <option value="specialized">Specialized Agency</option>
                        <option value="crisis">Crisis Committee</option>
                        <option value="regional">Regional Body</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-amber-300 mb-1">Description</label>
                      <textarea
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        rows={3}
                        value={editingCommittee.description}
                        onChange={(e) => setEditingCommittee({...editingCommittee, description: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-amber-300 mb-1">Topics (comma separated)</label>
                      <textarea
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        rows={2}
                        value={editingCommittee.topics.join(', ')}
                        onChange={(e) => setEditingCommittee({...editingCommittee, topics: e.target.value.split(',').map(t => t.trim())})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-amber-300 mb-1">Background Guide URL</label>
                      <input
                        type="url"
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        value={editingCommittee.backgroundGuide || ''}
                        onChange={(e) => setEditingCommittee({...editingCommittee, backgroundGuide: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-amber-300 mb-1">Rules of Procedure URL</label>
                      <input
                        type="url"
                        className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        value={editingCommittee.rules || ''}
                        onChange={(e) => setEditingCommittee({...editingCommittee, rules: e.target.value})}
                      />
                    </div>
                    <div className="pt-4">
                      <Button 
                        onClick={async () => {
                          const success = await saveCommittee(editingCommittee);
                          if (success) setIsModalOpen(false);
                        }}
                        className="w-full bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white py-2 rounded-lg"
                      >
                        Save Committee
                      </Button>
                    </div>
                  </div>
                )}
                {modalType === 'eb' && editingEB && editingCommittee && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={editingEB.name}
                        onChange={(e) => setEditingEB({...editingEB, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                      <select
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={editingEB.role}
                        onChange={(e) => setEditingEB({...editingEB, role: e.target.value as any})}
                      >
                        <option value="chair">Chairperson</option>
                        <option value="vice-chair">Vice-Chairperson</option>
                        <option value="rapporteur">Rapporteur</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Photo URL</label>
                      <input
                        type="url"
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={editingEB.photourl}
                        onChange={(e) => setEditingEB({...editingEB, photourl: e.target.value})}
                        placeholder="https://example.com/photo.jpg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                      <input
                        type="text"
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={editingEB.instagram}
                        onChange={(e) => setEditingEB({...editingEB, instagram: e.target.value})}
                        placeholder="username"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={editingEB.email}
                        onChange={(e) => setEditingEB({...editingEB, email: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                      <textarea
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        rows={3}
                        value={editingEB.bio || ''}
                        onChange={(e) => setEditingEB({...editingEB, bio: e.target.value})}
                      />
                    </div>
                    <div className="pt-4">
                      <Button 
                        onClick={async () => {
                          const success = await saveEB(editingEB, editingCommittee.id);
                          if (success) setIsModalOpen(false);
                        }}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        Save EB Member
                      </Button>
                    </div>
                  </div>
                )}

                {modalType === 'portfolio' && editingPortfolio && editingCommittee && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                      <input
                        type="text"
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={editingPortfolio.country}
                        onChange={(e) => setEditingPortfolio({...editingPortfolio, country: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country Code</label>
                      <Select
                        options={countryOptions}
                        value={countryOptions.find(opt => opt.value === editingPortfolio.countryCode)}
                        onChange={(option) => setEditingPortfolio({...editingPortfolio, countryCode: option?.value || ''})}
                        className="react-select-container"
                        classNamePrefix="react-select"
                      />
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="doubleDel"
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                        checked={editingPortfolio.isDoubleDelAllowed}
                        onChange={(e) => setEditingPortfolio({...editingPortfolio, isDoubleDelAllowed: e.target.checked})}
                      />
                      <label htmlFor="doubleDel" className="ml-2 block text-sm text-gray-700">
                        Double Delegation Allowed
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="vacant"
                        className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                        checked={editingPortfolio.isVacant}
                        onChange={(e) => setEditingPortfolio({...editingPortfolio, isVacant: e.target.checked})}
                      />
                      <label htmlFor="vacant" className="ml-2 block text-sm text-gray-700">
                        Vacant
                      </label>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Experience (years)</label>
                      <input
                        type="number"
                        min="0"
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={editingPortfolio.minExperience}
                        onChange={(e) => setEditingPortfolio({...editingPortfolio, minExperience: parseInt(e.target.value) || 0})}
                      />
                    </div>
                    <div className="pt-4">
                      <Button 
                        onClick={async () => {
                          const success = await savePortfolio(editingPortfolio, editingCommittee.id);
                          if (success) setIsModalOpen(false);
                        }}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        Save Portfolio
                      </Button>
                    </div>
                  </div>
                )}

                {modalType === 'resource' && editingResource && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                      <input
                        type="text"
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={editingResource.title}
                        onChange={(e) => setEditingResource({...editingResource, title: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={editingResource.type}
                        onChange={(e) => setEditingResource({...editingResource, type: e.target.value as any})}
                      >
                        <option value="guide">Background Guide</option>
                        <option value="rules">Rules of Procedure</option>
                        <option value="templates">Templates</option>
                        <option value="training">Training</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
                      <input
                        type="url"
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={editingResource.url}
                        onChange={(e) => setEditingResource({...editingResource, url: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        rows={3}
                        value={editingResource.description || ''}
                        onChange={(e) => setEditingResource({...editingResource, description: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Pages</label>
                      <input
                        type="number"
                        min="0"
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={editingResource.pages || 0}
                        onChange={(e) => setEditingResource({...editingResource, pages: parseInt(e.target.value) || 0})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Committee (leave blank for all)</label>
                      <Select
                        options={committees.map(c => ({ value: c.id, label: c.name }))}
                        value={committees.find(c => c.id === editingResource.committeeId)}
                        onChange={(option) => setEditingResource({...editingResource, committeeId: option?.value || ''})}
                        isClearable
                        className="react-select-container"
                        classNamePrefix="react-select"
                      />
                    </div>
                    <div className="pt-4">
                      <Button 
                        onClick={async () => {
                          const success = await saveResource(editingResource);
                          if (success) setIsModalOpen(false);
                        }}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        Save Resource
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {showBlacklistModal && currentDelegateToBlacklist && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-white rounded-xl shadow-xl w-full max-w-md"
            >
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Blacklist Delegate</h3>
                  <button 
                    onClick={() => {
                      setShowBlacklistModal(false);
                      setBlacklistReason('');
                      setCurrentDelegateToBlacklist(null);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      You are about to blacklist <span className="font-semibold">{currentDelegateToBlacklist.name}</span> ({currentDelegateToBlacklist.email}).
                      This will prevent them from participating in the conference.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason for blacklisting</label>
                    <textarea
                      className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      rows={3}
                      value={blacklistReason}
                      onChange={(e) => setBlacklistReason(e.target.value)}
                      placeholder="Enter reason for blacklisting..."
                    />
                  </div>
                  <div className="pt-4">
                    <Button 
                      onClick={() => blacklistDelegate(currentDelegateToBlacklist, blacklistReason)}
                      className="w-full bg-red-600 hover:bg-red-700 text-white"
                      disabled={!blacklistReason.trim()}
                    >
                      Confirm Blacklist
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
