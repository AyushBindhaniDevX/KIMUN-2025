'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  PieChart, Pie, Cell, ResponsiveContainer, Legend 
} from 'recharts';
import { 
  Edit, Plus, X, Trash, ChartBar, Users, CheckCircle, 
  Download, UserCheck, QrCode, Cog, CreditCard, 
  User as UserIcon, UserPlus, Briefcase, Coins, 
  BookOpen, Printer, FileText, Award, Settings, 
  LogOut, Ban, RefreshCw, Send, Loader2, Ticket, 
  ShieldCheck, Landmark, Globe, Search, Info, 
  CheckCircle2, ChevronRight, Scale, Mail, ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, push, update, remove, onValue } from 'firebase/database';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import Select from 'react-select';
import { jsPDF } from 'jspdf';
import { Toaster, toast } from 'sonner';

// --- Types ---
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

type Portfolio = {
  id: string;
  country: string;
  countryCode: string;
  isDoubleDelAllowed: boolean;
  isVacant: boolean;
  minExperience: number;
};

type Delegate = {
  id: string;
  name: string;
  email: string;
  phone: string;
  experience: number;
  institution?: string;
  committeeId: string;
  portfolioId: string;
  isCheckedIn: boolean;
  checkInTime?: string;
  regKey: string; 
  delType: 'delegate1' | 'delegate2';
};

type EBMember = {
  id: string;
  name: string;
  role: string;
  email: string;
};

type Resource = {
  id: string;
  title: string;
  type: string;
  url: string;
  committeeId?: string;
};

// --- Firebase Configuration ---
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
const auth = getAuth(app);

// --- Institutional UI Components ---
const Button = React.forwardRef<HTMLButtonElement, any>(({ className, variant = "default", size = "default", ...props }, ref) => {
  const variants = {
    default: "bg-[#003366] text-white hover:bg-[#002244] shadow-sm font-bold uppercase tracking-widest",
    primary: "bg-[#009EDB] text-white hover:bg-[#0077B3] shadow-md font-bold uppercase tracking-widest",
    outline: "border-2 border-[#009EDB] text-[#009EDB] hover:bg-[#F0F8FF] font-bold uppercase tracking-widest",
    secondary: "bg-[#4D4D4D] text-white hover:bg-[#333333] uppercase tracking-widest",
    danger: "bg-red-600 text-white hover:bg-red-700 font-bold uppercase tracking-widest"
  }
  const sizes = {
    default: "h-11 px-6 py-2 text-xs",
    lg: "h-14 px-10 text-sm font-black",
    sm: "h-8 px-4 text-[10px]"
  }
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center rounded-sm transition-all active:scale-95 disabled:opacity-50 ${variants[variant as keyof typeof variants] || variants.default} ${sizes[size as keyof typeof sizes] || sizes.default} ${className}`}
      {...props}
    />
  )
})
Button.displayName = "Button"

const DiplomaticFlag = ({ countryCode, className = "" }: { countryCode: string, className?: string }) => (
  <img 
    src={`https://flagcdn.com/w80/${countryCode?.toLowerCase() || 'un'}.png`}
    alt="Flag"
    className={`object-contain ${className}`}
    onError={(e) => { (e.target as HTMLImageElement).src = 'https://flagcdn.com/w80/un.png' }}
  />
);

export default function AdminDashboard() {
  const [accessGranted, setAccessGranted] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [delegates, setDelegates] = useState<Delegate[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedCommittee, setSelectedCommittee] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'committee' | 'delegate' | 'resource'>('committee');
  const [editingItem, setEditingItem] = useState<any>(null);

  // 1. Authentication Check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) setAccessGranted(true);
      else setAccessGranted(false);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Real-time Secretariat Data Stream
  useEffect(() => {
    if (!accessGranted) return;

    const committeesRef = ref(db, 'committees');
    const unsubscribeCommittees = onValue(committeesRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        setCommittees(Object.keys(data).map(id => ({
          id, ...data[id],
          eb: data[id].eb ? Object.keys(data[id].eb).map(eid => ({ id: eid, ...data[id].eb[eid] })) : [],
          portfolios: data[id].portfolios ? Object.keys(data[id].portfolios).map(pid => ({ id: pid, ...data[id].portfolios[pid] })) : []
        })));
      }
    });

    const regRef = ref(db, 'registrations');
    const unsubscribeReg = onValue(regRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val();
        const list: Delegate[] = [];
        Object.keys(data).forEach(regKey => {
          const reg = data[regKey];
          if (reg.delegateInfo) {
            Object.keys(reg.delegateInfo).forEach(delType => {
              const d = reg.delegateInfo[delType];
              if (d.name) list.push({
                id: `${regKey}_${delType}`,
                regKey: regKey,
                delType: delType as any,
                ...d,
                committeeId: reg.committeeId,
                portfolioId: reg.portfolioId
              });
            });
          }
        });
        setDelegates(list);
      }
    });

    return () => {
      unsubscribeCommittees();
      unsubscribeReg();
    };
  }, [accessGranted]);

  // --- Handlers ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setLoginError('Secretariat Authorization Denied.');
    }
  };

  const handleLogout = () => signOut(auth);

  const handleCheckIn = async (delegateId: string) => {
    const delegate = delegates.find(d => d.id === delegateId);
    if (!delegate) return;

    try {
      const path = `registrations/${delegate.regKey}/delegateInfo/${delegate.delType}`;
      await update(ref(db, path), {
        isCheckedIn: true,
        checkInTime: new Date().toISOString()
      });
      toast.success(`${delegate.name} has been credentialed.`);
    } catch (err) {
      toast.error('Registry Update Failed.');
    }
  };

  const deleteCommittee = async (id: string) => {
    if (confirm('Protocol: Permanently delete this committee organ?')) {
      await remove(ref(db, `committees/${id}`));
      toast.success('Organ purged from registry.');
    }
  };

  // --- NATIVE REPLACEMENTS FOR FAILED LIBRARIES ---
  const exportToCSV = () => {
    const headers = ['Registry ID', 'Name', 'Email', 'Committee', 'Status'];
    const rows = delegates.map(d => [
      d.id, d.name, d.email, d.committeeId, d.isCheckedIn ? 'Checked-In' : 'Pending'
    ]);

    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `KIMUN_Registry_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generateIDCardsPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("Kalinga International MUN 2026", 20, 20);
    doc.setFontSize(12);
    doc.text("Official Registry Summary", 20, 30);
    
    let y = 50;
    delegates.slice(0, 20).forEach((d, i) => {
      doc.text(`${i+1}. ${d.name} [${d.id.substring(0,8)}] - ${d.isCheckedIn ? 'Verified' : 'Pending'}`, 20, y);
      y += 10;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    doc.save(`KIMUN_Summary_${new Date().toISOString().slice(0,10)}.pdf`);
    toast.success("Summary PDF Generated via Native Protocol");
  };

  if (loading) return <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center"><Loader2 className="animate-spin text-[#009EDB]" size={40} /></div>;

  if (!accessGranted) {
    return (
      <div className="min-h-screen bg-[#003366] flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white shadow-2xl p-12 rounded-sm border-t-8 border-t-[#009EDB] text-center">
          <Landmark size={64} className="text-[#003366] mx-auto mb-8" />
          <h1 className="text-2xl font-black text-[#003366] uppercase tracking-tighter mb-2">Secretariat Login</h1>
          <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-10">Bureau Access Only</p>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="text-left">
              <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1 block">Diplomatic Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full border-b-2 border-zinc-100 py-3 focus:border-[#009EDB] outline-none text-zinc-900 font-bold" required />
            </div>
            <div className="text-left">
              <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest mb-1 block">Security Key</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full border-b-2 border-zinc-100 py-3 focus:border-[#009EDB] outline-none text-zinc-900 font-bold" required />
            </div>
            {loginError && <p className="text-red-600 text-[10px] font-black uppercase italic">{loginError}</p>}
            <Button type="submit" variant="primary" className="w-full h-14">Authorize Session</Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[#1A1A1A] font-sans flex">
      <Toaster position="top-right" richColors />
      
      <aside className="w-72 bg-[#003366] text-white fixed h-full flex flex-col border-r-4 border-r-[#009EDB]">
        <div className="p-8 border-b border-white/10 text-center">
           <img src="https://kimun497636615.wordpress.com/wp-content/uploads/2025/03/kimun_logo_color.png" className="h-16 mx-auto mb-4" />
           <h1 className="text-xl font-black uppercase tracking-tighter">Secretariat</h1>
           <p className="text-[9px] font-bold text-[#009EDB] uppercase tracking-[0.3em] mt-1">Institutional Control</p>
        </div>
        <nav className="p-4 flex-1 space-y-1">
           {[
             { id: 'dashboard', icon: ChartBar, label: 'Session Pulse' },
             { id: 'delegates', icon: UserCheck, label: 'Registry Index' },
             { id: 'committees', icon: Landmark, label: 'Organs & Matrix' }
           ].map(item => (
             <button 
               key={item.id} 
               onClick={() => setActiveTab(item.id)}
               className={`w-full flex items-center gap-4 px-6 py-4 rounded-sm text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === item.id ? 'bg-white text-[#003366] shadow-xl' : 'text-zinc-400 hover:text-white hover:bg-white/5'}`}
             >
                <item.icon size={16} /> {item.label}
             </button>
           ))}
        </nav>
        <div className="p-8 border-t border-white/10">
           <button onClick={handleLogout} className="flex items-center gap-3 text-[10px] font-black uppercase text-red-400 hover:text-red-300 transition-colors w-full">
              <LogOut size={16} /> Terminate
           </button>
        </div>
      </aside>

      <div className="flex-1 ml-72">
        <header className="bg-white border-b border-zinc-200 py-4 px-10 sticky top-0 z-50 flex justify-between items-center shadow-sm">
           <div className="flex items-center gap-4 text-zinc-400">
              <Clock size={16} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Plenary Data Stream Active</span>
           </div>
           <div className="flex gap-4">
              <Button size="sm" variant="outline" onClick={exportToCSV}>CSV Export</Button>
              <Button size="sm" variant="primary" onClick={generateIDCardsPDF}>Summary PDF</Button>
           </div>
        </header>

        <main className="p-10 max-w-7xl mx-auto">
          
          {activeTab === 'dashboard' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <StatCard label="Dossiers" value={delegates.length} icon={Users} color="#003366" />
                <StatCard label="Credentialed" value={delegates.filter(d => d.isCheckedIn).length} icon={CheckCircle} color="#10b981" />
                <StatCard label="Vacant" value={committees.reduce((acc, c) => acc + c.portfolios.filter(p => p.isVacant).length, 0)} icon={Globe} color="#009EDB" />
                <StatCard label="Organs" value={committees.length} icon={Landmark} color="#4D4D4D" />
              </div>

              <div className="grid lg:grid-cols-2 gap-8">
                 <div className="bg-white border border-zinc-200 p-8 shadow-sm rounded-sm">
                    <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest mb-8">Registry Activity</h3>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={committees.map(c => ({ name: c.name, val: delegates.filter(d => d.committeeId === c.id).length }))}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 10, fontWeight: 'bold' }} />
                          <YAxis hide />
                          <Tooltip cursor={{ fill: '#F9FAFB' }} />
                          <Bar dataKey="val" fill="#003366" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                 </div>
                 <div className="bg-white border border-zinc-200 p-8 shadow-sm rounded-sm">
                    <h3 className="text-xs font-black uppercase text-zinc-400 tracking-widest mb-8">Dossier Accuracy</h3>
                    <div className="h-[300px] flex items-center justify-center">
                       <PieChart width={300} height={300}>
                          <Pie 
                            data={[
                              { name: 'Checked-In', value: delegates.filter(d => d.isCheckedIn).length },
                              { name: 'Pending', value: delegates.filter(d => !d.isCheckedIn).length }
                            ]} 
                            innerRadius={60} 
                            outerRadius={80} 
                            dataKey="value"
                          >
                             <Cell fill="#10b981" />
                             <Cell fill="#003366" />
                          </Pie>
                          <Tooltip />
                       </PieChart>
                    </div>
                 </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'delegates' && (
            <div className="bg-white border border-zinc-200 shadow-sm overflow-hidden">
               <div className="p-8 border-b border-zinc-100 flex justify-between items-center">
                  <h2 className="text-xl font-black uppercase tracking-tighter text-[#003366]">Delegate Registry</h2>
                  <div className="relative w-72">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-300" size={16} />
                     <input type="text" placeholder="Search ID or Name..." className="w-full pl-10 pr-4 py-2 border border-zinc-200 text-xs outline-none" onChange={e => setBarcodeInput(e.target.value)} />
                  </div>
               </div>
               <table className="w-full text-left">
                  <thead className="bg-zinc-50 border-b border-zinc-100 text-[10px] font-black uppercase text-zinc-400 tracking-widest">
                     <tr>
                        <th className="p-6">Representative</th>
                        <th className="p-6">Registry ID</th>
                        <th className="p-6">Status</th>
                        <th className="p-6 text-right">Bureau Action</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-50">
                     {delegates.filter(d => d.name.toLowerCase().includes(barcodeInput.toLowerCase()) || d.id.includes(barcodeInput.toUpperCase())).map(d => (
                       <tr key={d.id} className="hover:bg-zinc-50/50 transition-colors">
                          <td className="p-6">
                             <div className="flex items-center gap-4">
                                <div className="h-10 w-10 bg-zinc-100 rounded-full flex items-center justify-center font-black text-zinc-400">{d.name[0]}</div>
                                <div>
                                   <p className="text-sm font-bold text-[#003366] uppercase">{d.name}</p>
                                   <p className="text-[10px] text-zinc-400 font-bold">{d.email}</p>
                                </div>
                             </div>
                          </td>
                          <td className="p-6 font-mono text-xs text-zinc-500 uppercase tracking-tighter">{d.id.substring(0, 12)}</td>
                          <td className="p-6">
                             <span className={`inline-block px-3 py-1 rounded-sm text-[9px] font-black uppercase tracking-widest ${d.isCheckedIn ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                {d.isCheckedIn ? 'Credentialed' : 'Liaison Pending'}
                             </span>
                          </td>
                          <td className="p-6 text-right">
                             {!d.isCheckedIn ? (
                               <Button size="sm" onClick={() => handleCheckIn(d.id)}>Accredit</Button>
                             ) : (
                               <span className="text-[9px] font-bold text-zinc-300 uppercase tracking-widest">Registry Logged</span>
                             )}
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          )}

          {activeTab === 'committees' && (
             <div className="space-y-8">
                <div className="flex justify-between items-center">
                   <h2 className="text-3xl font-black text-[#003366] uppercase tracking-tighter">Plenary Organs</h2>
                   <Button variant="primary"><Plus size={16} className="mr-2" /> Initialize Organ</Button>
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                   {committees.map(c => (
                      <div key={c.id} className="bg-white border border-zinc-200 p-8 shadow-sm flex flex-col group hover:border-[#009EDB] transition-all">
                         <div className="flex items-center gap-4 mb-6">
                            <span className="text-3xl">{c.emoji}</span>
                            <div>
                               <h3 className="text-lg font-black text-[#003366] uppercase tracking-tight">{c.name}</h3>
                               <span className="text-[9px] font-bold text-[#009EDB] uppercase tracking-widest">{c.type} Body // {c.portfolios.length} Seats</span>
                            </div>
                         </div>
                         <div className="space-y-4 flex-1">
                            <p className="text-xs text-zinc-500 italic leading-relaxed">{c.description}</p>
                            <div className="grid grid-cols-6 gap-2">
                               {c.portfolios.map(p => (
                                 <div key={p.id} className={`h-8 border flex items-center justify-center rounded-sm ${p.isVacant ? 'opacity-20 border-zinc-100' : 'border-[#009EDB] bg-[#F0F8FF]'}`} title={p.country}>
                                    <DiplomaticFlag countryCode={p.countryCode} className="w-5 h-3" />
                                 </div>
                               ))}
                            </div>
                         </div>
                         <div className="mt-8 pt-6 border-t border-zinc-50 flex gap-4">
                            <button onClick={() => deleteCommittee(c.id)} className="text-red-400 hover:text-red-600 transition-colors"><Trash size={16} /></button>
                            <Button size="sm" variant="outline" className="flex-1">Manage Matrix</Button>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          )}

        </main>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: any) {
  return (
    <div className="bg-white p-8 border border-zinc-200 shadow-sm relative overflow-hidden group">
      <div className="absolute -right-2 -bottom-2 opacity-5 text-zinc-900 group-hover:scale-110 transition-transform duration-500"><Icon size={80} /></div>
      <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest block mb-4">{label}</label>
      <div className="flex items-end gap-2 relative z-10">
         <p className="text-4xl font-black italic tracking-tighter" style={{ color }}>{value}</p>
         <span className="text-[10px] font-bold text-zinc-300 uppercase mb-2">Registry</span>
      </div>
    </div>
  )
}
