'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Button } from '@/components/ui/button';
import { Edit, Plus, X, Trash, ChartBar, Users, CheckCircle, Download, UserCheck, QrCode, Cog } from 'lucide-react';
import * as Flags from 'country-flag-icons/react/3x2';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, push, update, remove, onValue } from 'firebase/database';
import Select from 'react-select';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Legend } from 'recharts';

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
const fetchData = async () => {
  try {
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

    setLoading(false); // ✅ This should be inside try block
  } catch (error) {
    console.error('Error fetching data:', error);
    setError('Failed to load data');
  } finally {
    setLoading(false); // ✅ Ensure setLoading(false) runs no matter what
  }
};


    fetchData();
  }, []);

  // Handle check-in
  const handleCheckIn = async () => {
    if (!barcodeInput) return;

    try {
      // Find delegate by ID, phone, or email
      const registration = registrations.find(r => 
        r.delegates.some(d => d.id === barcodeInput || d.phone === barcodeInput || d.email === barcodeInput)
      );

    if (!delegate) {
      alert('Delegate not found!');
      return;
    }

      // Prevent duplicate check-ins
      const isCheckedIn = checkedIn.some(c => 
        c.delegates?.some(d => d.id === barcodeInput)
      );
      
      if (isCheckedIn) {
        alert('Delegate already checked in!');
        setBarcodeInput('');
        return;
      }

      // Create sanitized check-in data
      const checkInData = {
        registrationId: registration.id,
        timestamp: new Date().toISOString(),
        delegates: registration.delegates.map(d => ({
          id: d.id,
          name: d.name,
          email: d.email,
          phone: d.phone
        })),
        committee: committees.find(c => c.id === registration.committeeId)?.name,
        portfolio: committees.find(c => c.id === registration.committeeId)
          ?.portfolios.find(p => p.id === registration.portfolioId)?.country
      };

      // Push to Firebase
      await push(ref(db, 'checkedIn'), checkInData);
      setBarcodeInput('');
      alert('Checked in successfully!');
    } catch (error) {
      console.error('Check-in failed:', error);
      alert('Check-in failed!');
    }
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

  // Render the table row for each delegate
  const renderDelegateRow = (registration) => {
    return registration.delegates.map(delegate => (
      <tr key={delegate.id}>
        <td className="px-6 py-4">{delegate.id}</td>
        <td className="px-6 py-4">{delegate.name}</td>
        <td className="px-6 py-4">
          {committees.find(c => c.id === registration.committeeId)?.name}
        </td>
        <td className="px-6 py-4">
          {committees.find(c => c.id === registration.committeeId)
            ?.portfolios.find(p => p.id === registration.portfolioId)?.country}
        </td>
        <td className="px-6 py-4">
          <span className={`px-2 py-1 rounded-full text-xs ${
            checkedIn.some(c => c.registrationId === registration.id) 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
          }`}>
            {checkedIn.some(c => c.registrationId === registration.id) ? 'Checked In' : 'Not Checked In'}
          </span>
        </td>
      </tr>
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm fixed w-full top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <span className="text-2xl font-bold text-orange-600">MUN Admin</span>
            <div className="flex space-x-8">
              <button onClick={() => setActiveTab('dashboard')} className={`tab-button ${activeTab === 'dashboard' ? 'active' : ''}`}>
                <ChartBar size={18} className="mr-2" /> Dashboard
              </button>
              <button onClick={() => setActiveTab('delegates')} className={`tab-button ${activeTab === 'delegates' ? 'active' : ''}`}>
                <UserCheck size={18} className="mr-2" /> Delegates
              </button>
              <button onClick={() => setActiveTab('committees')} className={`tab-button ${activeTab === 'committees' ? 'active' : ''}`}>
                <Users size={18} className="mr-2" /> Committees
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {activeTab === 'dashboard' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold mb-4 text-orange-600">Registrations by Committee</h3>
                <BarChart width={500} height={300} data={committees.map(c => ({
                  name: c.name,
                  registrations: c.portfolios?.length || 0
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="registrations" fill="#FF6B6B" />
                </BarChart>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold mb-4 text-orange-600">Registration Distribution</h3>
                <PieChart width={500} height={300}>
                  <Pie
                    data={committees.map(c => ({
                      name: c.name,
                      registrations: c.portfolios?.length || 0
                    }))}
                    cx={250}
                    cy={150}
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="registrations"
                  >
                    {committees.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', '#FF9999'][index % 6]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold mb-4 text-orange-600">Quick Stats</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">{committees.length}</div>
                  <div className="text-sm text-gray-600">Total Committees</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {committees.reduce((acc, curr) => acc + (curr.portfolios?.length || 0), 0)}
                  </div>
                  <div className="text-sm text-gray-600">Total Portfolios</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'delegates' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="bg-white p-4 rounded-lg shadow">
              <Select
                options={committees.map(c => ({ value: c.id, label: c.name }))}
                placeholder="Select Committee"
                onChange={(selected) => setSelectedCommittee(selected?.value)}
                isClearable
              />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex items-center space-x-4">
                <QrCode size={24} className="text-orange-600" />
                <input
                  type="text"
                  placeholder="Scan Delegate ID/Phone/Email"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="flex-1 border p-2 rounded-lg"
                />
                <Button onClick={handleCheckIn} className="bg-orange-600 hover:bg-orange-700 text-white">
                  <CheckCircle className="mr-2" /> Check In
                </Button>
              </div>
            </div>

            <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow">
              <div className="flex space-x-4">
                <Button variant={viewMode === 'all' ? 'default' : 'outline'} onClick={() => setViewMode('all')}>
                  All Delegates
                </Button>
                <Button variant={viewMode === 'checkedIn' ? 'default' : 'outline'} onClick={() => setViewMode('checkedIn')}>
                  Checked-In
                </Button>
                <Button variant={viewMode === 'notCheckedIn' ? 'default' : 'outline'} onClick={() => setViewMode('notCheckedIn')}>
                  Not Checked-In
                </Button>
              </div>
              <div className="flex space-x-4">
                <Button onClick={exportExcel} className="bg-green-600 hover:bg-green-700 text-white">
                  <Download className="mr-2" /> Excel
                </Button>
                <Button onClick={exportPDF} className="bg-red-600 hover:bg-red-700 text-white">
                  <Download className="mr-2" /> PDF
                </Button>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">Delegate ID</th>
                    <th className="px-6 py-3 text-left">Name</th>
                    <th className="px-6 py-3 text-left">Committee</th>
                    <th className="px-6 py-3 text-left">Portfolio</th>
                    <th className="px-6 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredDelegates.flatMap(registration => renderDelegateRow(registration))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'committees' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-orange-600">Committees Management</h2>
              <Button onClick={() => setIsAddCommitteeModalOpen(true)} className="bg-orange-500 hover:bg-orange-600 text-white">
                <Plus size={16} className="mr-2" /> Add Committee
              </Button>
            </div>

            <div className="space-y-4">
              {committees.map((committee) => (
                <motion.div key={committee.id} className="border p-4 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow" whileHover={{ scale: 1.02 }}>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="text-2xl mr-2">{committee.emoji}</span>
                      <span className="text-xl font-semibold text-orange-600">{committee.name}</span>
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => { setEditingCommittee(committee); setIsModalOpen(true); }} className="text-orange-500 hover:text-orange-700">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => deleteCommittee(committee.id)} className="text-red-500 hover:text-red-700">
                        <Trash size={16} />
                      </button>
                      <button onClick={() => { setIsAddPortfolioModalOpen(true); setEditingCommittee(committee); }} className="text-green-500 hover:text-green-700">
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-2">Portfolios</h3>
                    {committee.portfolios.map((portfolio) => (
                      <motion.div key={portfolio.id} className="border p-2 rounded-lg bg-gray-50 mb-2 flex justify-between items-center" whileHover={{ scale: 1.01 }}>
                        <div>
                          {portfolio.country} ({portfolio.countryCode})
                        </div>
                        <div className="flex space-x-2">
                          <button onClick={() => { setEditingPortfolio({ ...portfolio, committeeId: committee.id }); setIsModalOpen(true); }} className="text-orange-500 hover:text-orange-700">
                            <Edit size={16} />
                          </button>
                          <button onClick={() => deletePortfolio(committee.id, portfolio.id)} className="text-red-500 hover:text-red-700">
                            <Trash size={16} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
