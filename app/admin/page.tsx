'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Edit, Plus, X, Trash, ChartBar, Users, CheckCircle, Download, UserCheck, QrCode, Cog, CreditCard, User, UserPlus, Briefcase, Coins, BookOpen, FileText, Award, Settings, LogOut, Ban } from 'lucide-react';
import * as Flags from 'country-flag-icons/react/3x2';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, push, update, remove, onValue } from 'firebase/database';
import Select from 'react-select';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Legend } from 'recharts';
import emailjs from '@emailjs/browser';

// Updated Committee Type
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

type EBMember = {
  id: string;
  name: string;
  role: 'chair' | 'vice-chair' | 'rapporteur';
  email: string;
  bio?: string;
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
  const [pinInput, setPinInput] = useState('');
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'committee' | 'eb' | 'portfolio' | 'resource'>('committee');
  const [showBlacklistModal, setShowBlacklistModal] = useState(false);
  const [blacklistReason, setBlacklistReason] = useState('');
  const [currentDelegateToBlacklist, setCurrentDelegateToBlacklist] = useState<Delegate | null>(null);

  // Initialize Firebase
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);

  // Initialize EmailJS
  useEffect(() => {
    emailjs.init(process.env.NEXT_PUBLIC_EMAILJS_USER_ID || '');
  }, []);

  // Fetch all data with real-time updates
  useEffect(() => {
    if (!accessGranted) return;

    setLoading(true);
    
    // Committees listener
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
                bio: e.bio || ''
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

    // Registrations listener
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

    // Resources listener
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

    // Blacklisted delegates listener
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

    // Cleanup function
    return () => {
      committeesUnsubscribe();
      registrationsUnsubscribe();
      resourcesUnsubscribe();
      blacklistedUnsubscribe();
    };
  }, [accessGranted]);

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '515234') {
      setAccessGranted(true);
    } else {
      alert('Incorrect PIN');
      setPinInput('');
    }
  };

      // Email functions (modified slightly)
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
          // Add to blacklist in database
          const newBlacklisted = {
            id: delegate.id,
            name: delegate.name,
            email: delegate.email,
            reason: reason,
            timestamp: Date.now()
          };
          
          await push(ref(db, 'blacklisted'), newBlacklisted);
          
          // Send debarred email
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
  
    const delegate = delegates.find(d => 
      d.id.includes(barcodeInput) || 
      d.phone === barcodeInput || 
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
      
      // Send welcome email
      await sendWelcomeEmail(delegate);
      
      setBarcodeInput('');
      alert('Checked in successfully! Welcome email sent.');
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
      bio: ''
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

  const totalDelegates = delegates.length;
  const checkedInDelegates = delegates.filter(d => d.isCheckedIn).length;
  const singleDelegates = delegates.filter(d => !d.isDoubleDel).length;
  const doubleDelegates = delegates.filter(d => d.isDoubleDel).length;
  const amountReceived = (singleDelegates * 1260.03) + (doubleDelegates * 2424.03);
  const portfoliosVacant = committees.reduce((acc, c) => acc + c.portfolios.filter(p => p.isVacant).length, 0);
  const portfoliosOccupied = committees.reduce((acc, c) => acc + c.portfolios.filter(p => !p.isVacant).length, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };



  const exportExcel = (data: any[], fileName: string) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  };

  const exportPDF = (data: any[], headers: string[], fileName: string) => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [headers],
      body: data,
      theme: 'grid'
    });
    doc.save(`${fileName}.pdf`);
  };

  const filteredDelegates = delegates.filter(d => {
    const committeeMatch = selectedCommittee ? d.committeeId === selectedCommittee : true;
    
    if (viewMode === 'checkedIn') return d.isCheckedIn && committeeMatch;
    if (viewMode === 'notCheckedIn') return !d.isCheckedIn && committeeMatch;
    return committeeMatch;
  });

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
        bio: eb.bio || ''
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
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="bg-gray-800 p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold text-orange-500 mb-6 text-center">Admin Access</h1>
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <label htmlFor="pin" className="block text-sm font-medium text-gray-300 mb-1">
                Enter Access PIN
              </label>
              <input
                type="password"
                id="pin"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Enter PIN"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-2 rounded-md"
            >
              Submit
            </Button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-orange-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center p-6 bg-gray-800 rounded-lg max-w-md">
          <h2 className="text-xl font-bold text-orange-500 mb-2">Error</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 flex">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white fixed h-full">
        <div className="p-4 border-b border-gray-700">
          <h1 className="text-xl font-bold flex items-center">
            <Award className="mr-2 text-orange-500" /> KIMUN 2025
          </h1>
        </div>
        <nav className="p-4 space-y-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center w-full p-3 rounded-lg transition-colors ${activeTab === 'dashboard' ? 'bg-orange-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
          >
            <ChartBar className="mr-3" /> Dashboard
          </button>
          <button
            onClick={() => setActiveTab('delegates')}
            className={`flex items-center w-full p-3 rounded-lg transition-colors ${activeTab === 'delegates' ? 'bg-orange-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
          >
            <UserCheck className="mr-3" /> Delegates
          </button>
          <button
            onClick={() => setActiveTab('committees')}
            className={`flex items-center w-full p-3 rounded-lg transition-colors ${activeTab === 'committees' ? 'bg-orange-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
          >
            <Users className="mr-3" /> Committees
          </button>
          <button
            onClick={() => setActiveTab('eb')}
            className={`flex items-center w-full p-3 rounded-lg transition-colors ${activeTab === 'eb' ? 'bg-orange-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
          >
            <Briefcase className="mr-3" /> Executive Board
          </button>
          <button
            onClick={() => setActiveTab('resources')}
            className={`flex items-center w-full p-3 rounded-lg transition-colors ${activeTab === 'resources' ? 'bg-orange-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}
          >
            <BookOpen className="mr-3" /> Resources
          </button>
          
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-700">
          <button 
            onClick={() => {
              setAccessGranted(false);
              setPinInput('');
            }}
            className="flex items-center w-full p-3 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
          >
            <LogOut className="mr-3" /> Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800 capitalize">
              {activeTab === 'dashboard' && 'Dashboard'}
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
                  className="pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
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
              <div className="h-10 w-10 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold">
                AD
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="p-6">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                      <User className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Delegates</p>
                      <p className="text-2xl font-bold">{totalDelegates}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-full bg-green-100 text-green-600">
                      <CheckCircle className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Checked In</p>
                      <p className="text-2xl font-bold">{checkedInDelegates}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                      <Coins className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Amount Received</p>
                      <p className="text-2xl font-bold">{formatCurrency(amountReceived)}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Committees</p>
                      <p className="text-2xl font-bold">{committees.length}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold mb-4">Registrations by Committee</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={committees.map(c => ({
                        name: c.name,
                        registrations: delegates.filter(d => d.committeeId === c.id).length
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="name" stroke="#6b7280" />
                        <YAxis stroke="#6b7280" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderRadius: '0.5rem' }}
                          itemStyle={{ color: '#1f2937' }}
                        />
                        <Bar dataKey="registrations" fill="#f97316" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold mb-4">Portfolio Distribution</h3>
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
                          <Cell fill="#ef4444" />
                          <Cell fill="#10b981" />
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e5e7eb', borderRadius: '0.5rem' }}
                          formatter={(value, name) => [value, name]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Recent Check-ins */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Recent Check-ins</h3>
                  <Button 
                    variant="outline" 
                    className="border-orange-500 text-orange-500 hover:bg-orange-50"
                    onClick={() => setActiveTab('delegates')}
                  >
                    View All
                  </Button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delegate</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Committee</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Portfolio</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {delegates
                        .filter(d => d.isCheckedIn)
                        .sort((a, b) => (b.checkInTime || '').localeCompare(a.checkInTime || ''))
                        .slice(0, 5)
                        .map(delegate => (
                          <tr key={delegate.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-semibold">
                                  {delegate.name.charAt(0)}
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{delegate.name}</div>
                                  <div className="text-sm text-gray-500">{delegate.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {committees.find(c => c.id === delegate.committeeId)?.name || 'N/A'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {committees.find(c => c.id === delegate.committeeId)
                                  ?.portfolios.find(p => p.id === delegate.portfolioId)?.country || 'N/A'}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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

          {/* Delegates Tab */}
          {activeTab === 'delegates' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                  <div className="flex-1">
                    <Select
                      options={committees.map(c => ({ value: c.id, label: c.name }))}
                      placeholder="Filter by Committee"
                      onChange={(selected) => setSelectedCommittee(selected?.value || null)}
                      isClearable
                      className="react-select-container"
                      classNamePrefix="react-select"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant={viewMode === 'all' ? 'default' : 'outline'}
                      onClick={() => setViewMode('all')}
                      className="border-gray-300"
                    >
                      All
                    </Button>
                    <Button
                      variant={viewMode === 'checkedIn' ? 'default' : 'outline'}
                      onClick={() => setViewMode('checkedIn')}
                      className="border-gray-300"
                    >
                      Checked In
                    </Button>
                    <Button
                      variant={viewMode === 'notCheckedIn' ? 'default' : 'outline'}
                      onClick={() => setViewMode('notCheckedIn')}
                      className="border-gray-300"
                    >
                      Not Checked In
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6 p-4 bg-orange-50 rounded-lg">
                  <div className="flex-1">
                    <div className="relative">
                      <QrCode className="absolute left-3 top-3 h-5 w-5 text-orange-500" />
                      <input
                        type="text"
                        placeholder="Scan Delegate ID/Phone/Email"
                        value={barcodeInput}
                        onChange={(e) => setBarcodeInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCheckIn()}
                        className="pl-10 pr-4 py-2 w-full border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                  </div>
                  <Button onClick={handleCheckIn} className="bg-orange-600 hover:bg-orange-700 text-white">
                    <CheckCircle className="mr-2 h-5 w-5" /> Check In
                  </Button>
                </div>

                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">
                    {viewMode === 'all' && 'All Delegates'}
                    {viewMode === 'checkedIn' && 'Checked In Delegates'}
                    {viewMode === 'notCheckedIn' && 'Not Checked In Delegates'}
                    {selectedCommittee && ` (${committees.find(c => c.id === selectedCommittee)?.name})`}
                  </h3>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => exportExcel(
                        filteredDelegates.map(d => ({
                          ID: d.id,
                          Name: d.name,
                          Email: d.email,
                          Phone: d.phone,
                          Committee: committees.find(c => c.id === d.committeeId)?.name,
                          Portfolio: committees.find(c => c.id === d.committeeId)?.portfolios.find(p => p.id === d.portfolioId)?.country,
                          Status: d.isCheckedIn ? 'Checked In' : 'Not Checked In',
                          'Check-in Time': d.checkInTime || 'N/A'
                        })),
                        'delegates'
                      )}
                      className="border-green-500 text-green-600 hover:bg-green-50"
                    >
                      <Download className="mr-2 h-5 w-5" /> Excel
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => exportPDF(
                        filteredDelegates.map(d => [
                          d.id,
                          d.name,
                          committees.find(c => c.id === d.committeeId)?.name || 'N/A',
                          committees.find(c => c.id === d.committeeId)?.portfolios.find(p => p.id === d.portfolioId)?.country || 'N/A',
                          d.isCheckedIn ? 'Yes' : 'No'
                        ]),
                        ['ID', 'Name', 'Committee', 'Portfolio', 'Checked In'],
                        'delegates'
                      )}
                      className="border-red-500 text-red-600 hover:bg-red-50"
                    >
                      <Download className="mr-2 h-5 w-5" /> PDF
                    </Button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Committee</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Portfolio</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                    {filteredDelegates.length > 0 ? (
    filteredDelegates.map(delegate => (
      <tr key={delegate.id} className="hover:bg-gray-50">
        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{delegate.id}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{delegate.name}</td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {committees.find(c => c.id === delegate.committeeId)?.name || 'N/A'}
        </td>
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
          {committees.find(c => c.id === delegate.committeeId)
            ?.portfolios.find(p => p.id === delegate.portfolioId)?.country || 'N/A'}
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            delegate.isCheckedIn 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {delegate.isCheckedIn ? 'Checked In' : 'Not Checked In'}
          </span>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex space-x-2">
            {!delegate.isCheckedIn && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCurrentDelegateToBlacklist(delegate);
                  setShowBlacklistModal(true);
                }}
                className="text-red-500 hover:text-red-700"
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
      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
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

          {/* Committees Tab */}
          {activeTab === 'committees' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Committees</h2>
                  <Button 
                    onClick={() => openCommitteeModal(null)}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    <Plus className="mr-2 h-5 w-5" /> Add Committee
                  </Button>
                </div>

                <div className="space-y-4">
                  {committees.map(committee => (
                    <div key={committee.id} className="border rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-b">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">{committee.emoji}</span>
                          <h3 className="text-lg font-semibold">{committee.name}</h3>
                          <span className="ml-3 px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-700 capitalize">
                            {committee.type}
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openCommitteeModal(committee)}
                            className="border-gray-300"
                          >
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openPortfolioModal(null, committee.id)}
                            className="border-orange-300 text-orange-600 hover:bg-orange-50"
                          >
                            <Plus className="mr-2 h-4 w-4" /> Add Portfolio
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteItem(`committees/${committee.id}`)}
                            className="border-red-300 text-red-600 hover:bg-red-50"
                          >
                            <Trash className="mr-2 h-4 w-4" /> Delete
                          </Button>
                        </div>
                      </div>
                      <div className="p-6">
                        <p className="text-gray-600 mb-4">{committee.description}</p>
                        
                        <div className="mb-6">
                          <h4 className="font-medium mb-2">Agenda Items:</h4>
                          <ul className="list-disc pl-5 space-y-1 text-gray-600">
                            {committee.topics.map((topic, i) => (
                              <li key={i}>{topic}</li>
                            ))}
                          </ul>
                        </div>

                        {committee.backgroundGuide && (
                          <div className="mb-4">
                            <h4 className="font-medium mb-2">Background Guide:</h4>
                            <a 
                              href={committee.backgroundGuide} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-orange-600 hover:underline"
                            >
                              View Background Guide
                            </a>
                          </div>
                        )}

                        {committee.rules && (
                          <div className="mb-6">
                            <h4 className="font-medium mb-2">Rules of Procedure:</h4>
                            <a 
                              href={committee.rules} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-orange-600 hover:underline"
                            >
                              View Rules
                            </a>
                          </div>
                        )}

                        <div className="mb-6">
                          <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium">Portfolios ({committee.portfolios.length})</h4>
                            <span className="text-sm text-gray-500">
                              {committee.portfolios.filter(p => !p.isVacant).length} assigned •{' '}
                              {committee.portfolios.filter(p => p.isVacant).length} vacant
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {committee.portfolios.map(portfolio => {
                              const FlagComponent = Flags[`${portfolio.countryCode}Flag` as keyof typeof Flags];
                              return (
                                <div key={portfolio.id} className="border rounded-lg p-3 flex justify-between items-center">
                                  <div className="flex items-center">
                                    {FlagComponent && (
                                      <div className="w-6 h-6 mr-2 overflow-hidden rounded-sm">
                                        <FlagComponent className="w-full h-full object-cover" />
                                      </div>
                                    )}
                                    <div>
                                      <p className="font-medium">{portfolio.country}</p>
                                      <p className="text-xs text-gray-500">
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
                                      className="text-gray-500 hover:text-gray-700"
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => deleteItem(`committees/${committee.id}/portfolios/${portfolio.id}`)}
                                      className="text-red-500 hover:text-red-700"
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

          {/* Executive Board Tab */}
          {activeTab === 'eb' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Executive Board</h2>
                  <Select
                    options={committees.map(c => ({ value: c.id, label: c.name }))}
                    placeholder="Filter by Committee"
                    onChange={(selected) => setSelectedCommittee(selected?.value || null)}
                    isClearable
                    className="react-select-container w-64"
                    classNamePrefix="react-select"
                  />
                </div>

                <div className="space-y-4">
                  {committees
                    .filter(c => !selectedCommittee || c.id === selectedCommittee)
                    .map(committee => (
                      <div key={committee.id} className="border rounded-lg overflow-hidden">
                        <div className="bg-gray-50 px-6 py-4 flex justify-between items-center border-b">
                          <div className="flex items-center">
                            <span className="text-2xl mr-3">{committee.emoji}</span>
                            <h3 className="text-lg font-semibold">{committee.name}</h3>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEBModal(null, committee.id)}
                            className="border-orange-300 text-orange-600 hover:bg-orange-50"
                          >
                            <Plus className="mr-2 h-4 w-4" /> Add EB Member
                          </Button>
                        </div>
                        <div className="p-6">
                          {committee.eb.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {committee.eb.map(member => (
                                <div key={member.id} className="border rounded-lg p-4">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h4 className="font-medium">{member.name}</h4>
                                      <p className="text-sm text-gray-500 capitalize">{member.role}</p>
                                    </div>
                                    <div className="flex space-x-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openEBModal(member, committee.id)}
                                        className="text-gray-500 hover:text-gray-700"
                                      >
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => deleteItem(`committees/${committee.id}/eb/${member.id}`)}
                                        className="text-red-500 hover:text-red-700"
                                      >
                                        <Trash className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                  <div className="mt-3">
                                    <p className="text-sm text-gray-600">
                                      <a href={`mailto:${member.email}`} className="text-orange-600 hover:underline">
                                        {member.email}
                                      </a>
                                    </p>
                                    {member.bio && (
                                      <p className="mt-2 text-sm text-gray-600">{member.bio}</p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-gray-500 text-center py-4">No EB members added yet</p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Resources Tab */}
          {activeTab === 'resources' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">Resources</h2>
                  <Button 
                    onClick={() => openResourceModal(null)}
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    <Plus className="mr-2 h-5 w-5" /> Add Resource
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Committee</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {resources.map(resource => (
                        <tr key={resource.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <a 
                              href={resource.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-orange-600 hover:underline"
                            >
                              {resource.title}
                            </a>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800 capitalize">
                              {resource.type}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {resource.committeeId 
                              ? committees.find(c => c.id === resource.committeeId)?.name 
                              : 'All Committees'}
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-sm text-gray-500 line-clamp-2">{resource.description}</p>
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
                                className="text-gray-500 hover:text-gray-700"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteItem(`resources/${resource.id}`)}
                                className="text-red-500 hover:text-red-700"
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

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-xl font-semibold mb-6">Settings</h2>
              <div className="space-y-6">
                <div className="border rounded-lg p-6">
                  <h3 className="text-lg font-medium mb-4">Conference Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Conference Name</label>
                      <input
                        type="text"
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        defaultValue="Kalinga International MUN"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Conference Dates</label>
                      <input
                        type="text"
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        defaultValue="August 30, 31, 2025"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Venue</label>
                      <input
                        type="text"
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        defaultValue="BMPS"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Registration Fee (Single)</label>
                      <input
                        type="text"
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        defaultValue="1200 INR"
                      />
                    </div>
                  </div>
                  <div className="mt-6">
                    <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                      Save Changes
                    </Button>
                  </div>
                </div>

                <div className="border rounded-lg p-6">
                  <h3 className="text-lg font-medium mb-4">Admin Settings</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email</label>
                      <input
                        type="email"
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        defaultValue="admin@kimun.in"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Change Password</label>
                      <input
                        type="password"
                        placeholder="New Password"
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 mb-2"
                      />
                      <input
                        type="password"
                        placeholder="Confirm Password"
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      />
                    </div>
                    <div className="pt-2">
                      <Button className="bg-orange-600 hover:bg-orange-700 text-white">
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

      {/* Modals */}
      <AnimatePresence>
        {isModalOpen && (
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
                  <h3 className="text-lg font-semibold">
                    {modalType === 'committee' && (editingCommittee?.id ? 'Edit Committee' : 'Add Committee')}
                    {modalType === 'eb' && (editingEB?.id ? 'Edit EB Member' : 'Add EB Member')}
                    {modalType === 'portfolio' && (editingPortfolio?.id ? 'Edit Portfolio' : 'Add Portfolio')}
                    {modalType === 'resource' && (editingResource?.id ? 'Edit Resource' : 'Add Resource')}
                  </h3>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Committee Form */}
                {modalType === 'committee' && editingCommittee && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={editingCommittee.name}
                        onChange={(e) => setEditingCommittee({...editingCommittee, name: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Emoji</label>
                      <input
                        type="text"
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={editingCommittee.emoji}
                        onChange={(e) => setEditingCommittee({...editingCommittee, emoji: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        rows={3}
                        value={editingCommittee.description}
                        onChange={(e) => setEditingCommittee({...editingCommittee, description: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Topics (comma separated)</label>
                      <textarea
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        rows={2}
                        value={editingCommittee.topics.join(', ')}
                        onChange={(e) => setEditingCommittee({...editingCommittee, topics: e.target.value.split(',').map(t => t.trim())})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Background Guide URL</label>
                      <input
                        type="url"
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        value={editingCommittee.backgroundGuide || ''}
                        onChange={(e) => setEditingCommittee({...editingCommittee, backgroundGuide: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Rules of Procedure URL</label>
                      <input
                        type="url"
                        className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
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
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        Save Committee
                      </Button>
                    </div>
                  </div>
                )}

                {/* EB Member Form */}
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

                {/* Portfolio Form */}
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

                {/* Resource Form */}
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
                        <option value="sample">Sample Documents</option>
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
