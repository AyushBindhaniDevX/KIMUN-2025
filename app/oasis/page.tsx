'use client'

import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import {
  MessageSquare,
  Send,
  MoreVertical,
  BarChart3,
  PieChart as LucidePieChart,
  DollarSign,
  TrendingUp,
  Plus,
  Trash2,
  Download,
  RefreshCw,
  Sliders,
  QrCode,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Info,
  MapPin,
  Layers,
  Building,
  Users,
  BookOpen,
  Truck,
  Megaphone,
  ShieldCheck,
  FileSpreadsheet,
  Edit2,
  LayoutDashboard,
  ClipboardList,
  UserCheck,
  Package,
  FileText,
  LogOut,
  Mail,
  Search,
  Filter,
  Eye,
  Trash,
  PlusCircle,
  Award,
  CreditCard,
  Ticket,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Ban,
  User,
  UsersRound,
  Wallet,
  Activity,
  Globe,
  Settings,
  Calendar,
  Sparkles,
  Shield,
  XCircle,
  FileCheck,
  Bell,
  Edit,
  Check,
  Loader2,
  Menu,
  X,
  Star,
  Target,
  Clock,
  Zap,
  Crown,
  ChevronUp,
  ChevronDown
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, SidebarHeader as ShadcnSidebarHeader } from '@/components/ui/sidebar'
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { ref, onValue, update, push, remove, get, set } from 'firebase/database'
import { onAuthStateChanged, signInWithPopup, signOut, User as FirebaseUser } from 'firebase/auth'
import { firebaseAuth, firebaseDb, googleProvider } from '@/lib/firebase-client'
import { Scanner } from '@yudiel/react-qr-scanner'
import * as XLSX from 'xlsx'
import 'jspdf-autotable'

// ── Magic UI imports ──────────────────────────────────────────────────────────
import { Marquee } from '@/components/magicui/marquee'
import { AnimatedList } from '@/components/magicui/animated-list'
import { OrbitingCircles } from '@/components/magicui/orbiting-circles'
import { AvatarCircles } from '@/components/magicui/avatar-circles'
import { Terminal } from '@/components/magicui/terminal'
import { TweetCard } from '@/components/magicui/tweet-card'
import { Dock, DockIcon } from '@/components/magicui/dock'
import { IconCloud, DottedMap } from '@/components/magicui/misc'
import dynamic from 'next/dynamic'

const GlobeComponent = dynamic(
  () => import('@/components/magicui/globe').then(m => m.Globe),
  { ssr: false, loading: () => <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">Loading globe…</div> }
)

function GlobeWidget() {
  return (
    <div className="relative w-full h-full overflow-hidden">
      <GlobeComponent className="top-[-30px]" />
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent pointer-events-none" />
    </div>
  )
}

const playBeep = (type: 'success' | 'error') => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'success') {
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.1);
    } else {
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(150, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.3);
    }
  } catch (e) {
    console.log('Audio not supported', e);
  }
}


// Indian-context master expense list for KIMUN 2026 in INR (₹)
const INITIAL_EXPENSES = [
  { id: 'SEC-01', dept: 'Business Relations & Corporate Strategy', item: 'Accommodation for Chief Guest (5-Star)', qty: 3, unitCost: 12000, actualCost: 36000, status: 'Paid', isPerDelegate: false },
  { id: 'SEC-02', dept: 'Business Relations & Corporate Strategy', item: 'Secretariat Custom Merch (Blazers & Lapel Pins)', qty: 25, unitCost: 3200, actualCost: 80000, status: 'Paid', isPerDelegate: false },
  { id: 'SEC-03', dept: 'Business Relations & Corporate Strategy', item: 'Mementos & VIP Guest Gifts', qty: 15, unitCost: 1500, actualCost: 22000, status: 'Pending', isPerDelegate: false },
  { id: 'DEL-01', dept: 'Delegate Relations', item: 'Delegate Kits (Premium Bags, Notebooks, Pens)', qty: 300, unitCost: 450, actualCost: 135000, status: 'Paid', isPerDelegate: true },
  { id: 'DEL-02', dept: 'Delegate Relations', item: 'ID Cards, Lanyards & Badges Printing', qty: 300, unitCost: 120, actualCost: 36000, status: 'Paid', isPerDelegate: true },
  { id: 'DEL-03', dept: 'Delegate Relations', item: 'High-Gloss Country Placards Printing', qty: 150, unitCost: 150, actualCost: 22500, status: 'Paid', isPerDelegate: false },
  { id: 'ACA-01', dept: 'Academics', item: 'Background Study Guides Design & Print', qty: 12, unitCost: 1200, actualCost: 14400, status: 'Paid', isPerDelegate: false },
  { id: 'ACA-02', dept: 'Academics', item: 'Executive Board Travel & Flight Allowance', qty: 18, unitCost: 8000, actualCost: 144000, status: 'Pending', isPerDelegate: false },
  { id: 'ACA-03', dept: 'Academics', item: 'Executive Board Professional Honorarium', qty: 18, unitCost: 12000, actualCost: 216000, status: 'Pending', isPerDelegate: false },
  { id: 'ACA-04', dept: 'Academics', item: 'Trophies, Best Delegate Awards & Shields', qty: 30, unitCost: 1800, actualCost: 54000, status: 'Ordered', isPerDelegate: false },
  { id: 'LOG-01', dept: 'Logistics', item: 'Main Convention Center Venue Hire (3 Days)', qty: 3, unitCost: 150000, actualCost: 450000, status: 'Paid', isPerDelegate: false },
  { id: 'LOG-02', dept: 'Logistics', item: 'High-End Audio-Visual, Stage & Light Setup', qty: 3, unitCost: 65000, actualCost: 195000, status: 'Paid', isPerDelegate: false },
  { id: 'LOG-03', dept: 'Logistics', item: 'Catering - Delegate Buffet Lunch (Day 1)', qty: 300, unitCost: 650, actualCost: 195000, status: 'Paid', isPerDelegate: true },
  { id: 'LOG-04', dept: 'Logistics', item: 'Catering - Delegate Buffet Lunch (Day 2)', qty: 300, unitCost: 650, actualCost: 195000, status: 'Paid', isPerDelegate: true },
  { id: 'LOG-05', dept: 'Logistics', item: 'Catering - Delegate Buffet Lunch (Day 3)', qty: 300, unitCost: 650, actualCost: 195000, status: 'Paid', isPerDelegate: true },
  { id: 'LOG-06', dept: 'Logistics', item: 'Premium High Tea & Snacks for EB Room', qty: 50, unitCost: 250, actualCost: 12500, status: 'Paid', isPerDelegate: false },
  { id: 'PRM-01', dept: 'Marketing', item: 'KIMUN 2026 Website Domain & Web Hosting', qty: 1, unitCost: 8500, actualCost: 8500, status: 'Paid', isPerDelegate: false },
  { id: 'PRM-02', dept: 'Marketing', item: 'Digital Ads & Social Media PR Campaigns', qty: 1, unitCost: 15000, actualCost: 18000, status: 'Paid', isPerDelegate: false },
  { id: 'PRM-03', dept: 'Marketing', item: 'Prestige Flex Backdrops & Banners Printing', qty: 10, unitCost: 3500, actualCost: 35000, status: 'Paid', isPerDelegate: false },
  { id: 'PRM-04', dept: 'Marketing', item: 'Professional Aftermovie & Photography Crew', qty: 1, unitCost: 45000, actualCost: 45000, status: 'Pending', isPerDelegate: false },
  { id: 'ADM-01', dept: 'Administration', item: 'Office Print Station & Stationery Supplies', qty: 1, unitCost: 12000, actualCost: 10500, status: 'Paid', isPerDelegate: false },
  { id: 'ADM-02', dept: 'Administration', item: 'Emergency Medical Booth Setup', qty: 1, unitCost: 8000, actualCost: 8000, status: 'Paid', isPerDelegate: false },
  { id: 'ADM-03', dept: 'Administration', item: 'Administrative Contingency Fund', qty: 1, unitCost: 80000, actualCost: 40000, status: 'Partially Paid', isPerDelegate: false },
]

// Structural non-delegate inflows (sponsorships, grants, etc.)
const INITIAL_REVENUES = [
  { id: 'REV-01', category: 'Sponsorships', source: 'Title Corporate Sponsor (Lead Brand)', target: 500000, actual: 500000, status: 'Completed' },
  { id: 'REV-02', category: 'Sponsorships', source: 'Associate Ed-Tech Platform Sponsor', target: 250000, actual: 200000, status: 'Partially Received' },
  { id: 'REV-03', category: 'Sponsorships', source: 'Beverage & Snacks Co-Sponsor', target: 150000, actual: 150000, status: 'Completed' },
  { id: 'REV-04', category: 'Grants', source: 'Institutional & University Funding Board', target: 300000, actual: 300000, status: 'Completed' },
]

const DEPARTMENTS = [
  { name: 'All Departments', icon: Layers, color: 'bg-slate-400' },
  { name: 'Business Relations & Corporate Strategy', icon: Building, color: 'bg-indigo-600' },
  { name: 'Operations & Infrastructure Logistics', icon: Truck, color: 'bg-amber-500' },
  { name: 'Delegate Affairs & Global Relations', icon: Users, color: 'bg-sky-500' },
  { name: 'Design, Media & Digital Identity', icon: Megaphone, color: 'bg-rose-500' }
]

const ADMIN_ALLOWED_EMAILS = [
  'ayushbindhani001@gmail.com',
  'writetoanurup@gmail.com',
  'organizer@kimun.com'
]

const formatINR = (value: number) => {
  return `₹${Math.round(value).toLocaleString('en-IN')}`
}

// Animated card wrapper
const AnimatedCard = ({ children, className = "", delay = 0 }: { children: React.ReactNode, className?: string, delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay, ease: [0.25, 0.8, 0.25, 1] }}
    whileHover={{ y: -4, transition: { duration: 0.3 } }}
  >
    <Card className={`backdrop-blur-xl bg-white/70 shadow-sm border-slate-200/50 hover:shadow-md transition-all duration-300 ${className}`}>
      {children}
    </Card>
  </motion.div>
)

// KPI Metric Card Component — Premium Shadcn-inspired
const KPICard = ({ title, value, subtitle, icon: Icon, color, trend, trendValue }: any) => (
  <motion.div whileHover={{ y: -4, scale: 1.02, transition: { duration: 0.25 } }}>
    <Card className="backdrop-blur-xl bg-white/70 border-slate-200/50 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden relative">
      {/* Decorative gradient blob */}
      <div className={`absolute -right-4 -top-4 w-24 h-24 ${color} opacity-10 blur-2xl rounded-full pointer-events-none`} />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
        <CardTitle className="text-sm font-semibold text-slate-700">
          {title}
        </CardTitle>
        <div className={`${color} p-2 rounded-xl shadow-inner`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent className="relative z-10">
        <div className="text-2xl font-black tracking-tight text-slate-800">{value}</div>
        <p className="text-xs text-slate-500 mt-1.5 font-medium flex items-center">
          {subtitle}
          {trend && (
            <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${trend === 'up' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-rose-500/15 text-rose-600'}`}>
              {trend === 'up' ? '↑' : '↓'} {trendValue}
            </span>
          )}
        </p>
      </CardContent>
    </Card>
  </motion.div>
)

export default function OasisWorkplace() {
  // Authentication & Access Controls
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [role, setRole] = useState<'admin' | 'oc_member' | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [accessGranted, setAccessGranted] = useState(false)
  const [loginError, setLoginError] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Chat Feature States
  const [chatGroup, setChatGroup] = useState<'All (OC)' | 'Delegate' | 'EB' | 'Lobbying'>('All (OC)')
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [chatInput, setChatInput] = useState('')
  const chatEndRef = React.useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!accessGranted || !user) return;
    const chatsRef = ref(firebaseDb, `chats/${chatGroup}`)
    const unsubChats = onValue(chatsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val()
        const parsed = Object.keys(data)
          .map(k => ({ id: k, ...data[k] }))
          .sort((a: any, b: any) => a.timestamp - b.timestamp);
        setChatMessages(parsed)
      } else {
        setChatMessages([])
      }
    })
    return () => unsubChats()
  }, [chatGroup, accessGranted, user])



  // Workspace Navigation
  const [activeMenuTab, setActiveMenuTab] = useState<'dashboard' | 'finance_station' | 'live_allocations' | 'academic_vault' | 'recruitment' | 'task_board' | 'assets_ledger' | 'bulletin_board' | 'payouts' | 'coupons' | 'dept_boards' | 'registry_manager' | 'delegate_search' | 'schedule_builder' | 'transport_logistics' | 'help_docs' | 'site_settings' | 'logs' | 'chat'>('dashboard')
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('All Departments')
  const [recruitmentView, setRecruitmentView] = useState<'oc' | 'eb'>('oc')

  // Live Database Datasets
  const [dbCommittees, setDbCommittees] = useState<any[]>([])
  const [dbDelegates, setDbDelegates] = useState<any[]>([])
  const [dbResources, setDbResources] = useState<any[]>([])
  const [dbMarksheets, setDbMarksheets] = useState<any[]>([])
  const [dbApplications, setDbApplications] = useState<any[]>([])
  const [dbEbApplications, setDbEbApplications] = useState<any[]>([])
  const [dbTasks, setDbTasks] = useState<any[]>([])
  const [dbAssets, setDbAssets] = useState<any[]>([])
  const [dbAnnouncements, setDbAnnouncements] = useState<any[]>([])
  const [dbPayouts, setDbPayouts] = useState<any[]>([])
  const [dbPrizeTracking, setDbPrizeTracking] = useState<any[]>([])
  const [dbCoupons, setDbCoupons] = useState<any[]>([])
  const [dbSchedule, setDbSchedule] = useState<any[]>([])
  const [dbActivityLogs, setDbActivityLogs] = useState<any[]>([])
  const [dbBlacklisted, setDbBlacklisted] = useState<Record<string, any>>({})
  const [dbSiteSettings, setDbSiteSettings] = useState<any>({
    maintenanceEnabled: false,
    registrationMode: 'Auto',
    marksEntryLocked: false,
    eventDate: '2026',
    eventVenue: 'ASBMU, India',
    eventDuration: '2-Day Conference',
    attendanceTarget: '300+ Delegates',
    transport: {
      enabled: false,
      routes: []
    }
  })
  const [loadingData, setLoadingData] = useState(true)

  // Financial Workstation Local State
  const [globalRegFee, setGlobalRegFee] = useState(1200)
  const [workstationTab, setWorkstationTab] = useState('dashboard')
    const [workstationExpenses, setWorkstationExpenses] = useState<any[]>(INITIAL_EXPENSES)
  const [workstationRevenues, setWorkstationRevenues] = useState<any[]>(INITIAL_REVENUES)

  // What-if simulator factors
  const [attendanceRealizationRate, setAttendanceRealizationRate] = useState(100)
  const [sponsorRealizationRate, setSponsorRealizationRate] = useState(100)
  const [contingencyRate, setContingencyRate] = useState(10)
  const [excludeSponsors, setExcludeSponsors] = useState(false)
  const [tourStep, setTourStep] = useState(-1)
  const [searchQueryDele, setSearchQueryDele] = useState('')
  const [supabaseDelegates, setSupabaseDelegates] = useState<any[]>([])
  const [loadingSupabase, setLoadingSupabase] = useState(false)
  const [selectedDele, setSelectedDele] = useState<any>(null)

  // Fetch Supabase delegates reactively with debounce
  useEffect(() => {
    const query = searchQueryDele.trim()
    if (!query) {
      setSupabaseDelegates([])
      return
    }

    setLoadingSupabase(true)
    const delayDebounce = setTimeout(async () => {
      try {
        const response = await fetch(`/api/supabase-search?query=${encodeURIComponent(query)}`)
        const data = await response.json()
        if (data.delegates) {
          setSupabaseDelegates(data.delegates)
        } else {
          setSupabaseDelegates([])
        }
      } catch (error) {
        console.error('Failed to search Supabase:', error)
      } finally {
        setLoadingSupabase(false)
      }
    }, 400)

    return () => clearTimeout(delayDebounce)
  }, [searchQueryDele])

  const [docSubTab, setDocSubTab] = useState<'quickstart' | 'metrics' | 'finance' | 'faq'>('quickstart')

  // Custom Interactive Tour Steps definition
  const TOUR_STEPS = [
    {
      title: 'Welcome to Oasis Dashboard',
      content: 'This is the Overview tab where you can monitor live check-ins, attendance rates, and recent broadcast alerts from the Secretariat.',
      tab: 'dashboard',
      highlightId: 'dashboard-tab'
    },
    {
      title: 'Financial Workstation',
      content: 'Model registration prices, manage ledgers, sponsorships, and run break-even simulations. Try toggling "No Sponsors Mode" to view pure registration-funded forecasts.',
      tab: 'finance_station',
      highlightId: 'finance_station-tab'
    },
    {
      title: 'Registrations & Check-in Desk',
      content: 'Track physical check-ins, allocation status, and verify registration details in real time as delegates arrive at the venue.',
      tab: 'live_allocations',
      highlightId: 'live_allocations-tab'
    },
    {
      title: 'Academic Resources & Vault',
      content: 'Store background study guides, rules of procedure, and record or approve delegate marks and evaluation grades.',
      tab: 'academic_vault',
      highlightId: 'academic_vault-tab'
    },
    {
      title: 'Onboarding & Recruitment Hub',
      content: 'Exclusively for administrators. Track and review applications for organizing committee roles, accept applications, or send onboarding invites.',
      tab: 'recruitment',
      highlightId: 'recruitment-tab'
    },
    {
      title: 'Department Workspace',
      content: 'OC members can collaborate here. Track tasks, assets, and broadcast alerts specific to your department.',
      tab: 'dept_boards',
      highlightId: 'dept_boards-tab'
    },
    {
      title: 'DeleOs Search Engine',
      content: 'Search the delegate registration database. Contact details are automatically masked to comply with standard security policies.',
      tab: 'delegate_search',
      highlightId: 'delegate_search-tab'
    },
    {
      title: 'Help and Documentation',
      content: 'Need assistance? Read quick-start guides, metrics definitions, and system FAQs, or replay this tour anytime.',
      tab: 'help_docs',
      highlightId: 'help_docs-tab'
    }
  ]

  useEffect(() => {
    if (accessGranted && !authLoading) {
      const isCompleted = localStorage.getItem('oasis_tour_completed')
      if (isCompleted !== 'true') {
        setTourStep(-2)
      }
    }
  }, [accessGranted, authLoading])

  // Modal States
  const [showCommitteeModal, setShowCommitteeModal] = useState(false)
  const [editingCommittee, setEditingCommittee] = useState<any | null>(null)
  const [committeeForm, setCommitteeForm] = useState({ name: '', target: 40, fee: 1800, category: 'Specialized' })

  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState<any | null>(null)
  const [expenseForm, setExpenseForm] = useState({ dept: 'Business Relations & Corporate Strategy', item: '', qty: 1, unitCost: 0, actualCost: 0, status: 'Pending', isPerDelegate: false })

  const [showRevenueModal, setShowRevenueModal] = useState(false)
  const [editingRevenue, setEditingRevenue] = useState<any | null>(null)
  const [revenueForm, setRevenueForm] = useState({ category: 'Sponsorships', source: '', target: 0, actual: 0, status: 'In Progress' })

  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'committees' | 'expenses' | 'revenue' | 'tasks' | 'assets' | 'announcements' | 'db_committees' | 'db_portfolios' | 'db_eb', id: string, name: string, subId?: string } | null>(null)

  // Real Database Registry Manager States
  const [selectedRegistryCommitteeId, setSelectedRegistryCommitteeId] = useState<string | null>(null)
  const [registryTab, setRegistryTab] = useState<'portfolios' | 'eb'>('portfolios')

  // Db Committee Form States
  const [showDbCommitteeModal, setShowDbCommitteeModal] = useState(false)
  const [editingDbCommittee, setEditingDbCommittee] = useState<any | null>(null)
  const [dbCommitteeForm, setDbCommitteeForm] = useState({ id: '', name: '', description: '', category: '', topics: '', backgroundGuide: '', rules: '', studyGuide: '', image: '', target: 30, fee: 1000 })

  // Db Portfolio Form States
  const [showDbPortfolioModal, setShowDbPortfolioModal] = useState(false)
  const [editingDbPortfolio, setEditingDbPortfolio] = useState<any | null>(null)
  const [dbPortfolioForm, setDbPortfolioForm] = useState({ id: '', country: '', countryCode: '', isDoubleDelAllowed: false, isVacant: true, minExperience: 0, email: '' })

  // Db EB Member Form States
  const [showDbEbModal, setShowDbEbModal] = useState(false)
  const [editingDbEb, setEditingDbEb] = useState<any | null>(null)
  const [dbEbForm, setDbEbForm] = useState({ id: '', name: '', role: 'Chairperson', email: '', photourl: '', instagram: '', bio: '' })

  const [isUploadingFile, setIsUploadingFile] = useState(false)


  // Notifications
  const [notification, setNotification] = useState<{ show: boolean, message: string, type: 'success' | 'error' | 'info' }>({ show: false, message: '', type: 'success' })

  // General Search / Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [liveAllocationFilter, setLiveAllocationFilter] = useState<'all' | 'vacant' | 'allocated'>('all')

  // Live CRUD Modals & forms states
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [editingTask, setEditingTask] = useState<any | null>(null)
  const [taskForm, setTaskForm] = useState({ title: '', description: '', department: 'Business Relations & Corporate Strategy', priority: 'medium', dueDate: '', assignee: '', notes: '', remarks: '', attachments: '' })

  const [showAssetForm, setShowAssetForm] = useState(false)
  const [editingAsset, setEditingAsset] = useState<any | null>(null)
  const [assetForm, setAssetForm] = useState({ name: '', quantity: 1, cost: 0, status: 'pending', department: 'Business Relations & Corporate Strategy' })

  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<any | null>(null)
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '', department: 'Business Relations & Corporate Strategy', priority: 'medium', isPinned: false })
  const [selectedDeptWorkspace, setSelectedDeptWorkspace] = useState<string | null>(null)
  const [deptSubTab, setDeptSubTab] = useState<'tasks' | 'assets' | 'bulletins'>('tasks')
  const [showPayoutModal, setShowPayoutModal] = useState(false)
  const [showCouponModal, setShowCouponModal] = useState(false)

  // Award payouts states
  const [payoutDelegateId, setPayoutDelegateId] = useState('')
  const [payoutAward, setPayoutAward] = useState('Best Delegate')
  const [payoutAmount, setPayoutAmount] = useState(0)
  const [payoutBank, setPayoutBank] = useState({ accountNumber: '', ifscCode: '', name: '', bankName: '', phone: '' })
  const [payoutStatus, setPayoutStatus] = useState<'idle' | 'verifying' | 'processing' | 'success'>('idle')

  // Coupon states
  const [newCoupon, setNewCoupon] = useState({ code: '', title: '', description: '', discount: '', expiry: '', partner: '', terms: '' })

  // Prize tracking states
  const [showPrizeTrackingModal, setShowPrizeTrackingModal] = useState(false)
  const [newPrizeTracking, setNewPrizeTracking] = useState({ beneficiary: '', award: '', amount: 0, status: 'Processing', transactionRef: '' })

  // Applicant details modal and legacy profile states
  const [selectedApplicant, setSelectedApplicant] = useState<any | null>(null)
  const [showAppDetailsModal, setShowAppDetailsModal] = useState(false)
  const [legacyProfile, setLegacyProfile] = useState<any | null>(null)
  const [fetchingLegacyProfile, setFetchingLegacyProfile] = useState(false)
  const [legacyProfileError, setLegacyProfileError] = useState('')
  const [downloadingContract, setDownloadingContract] = useState(false)
  const [showQrScanner, setShowQrScanner] = useState(false)

  const triggerNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ show: true, message, type })
    setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 4000)
  }

  // Auth Status Checks
  const isAdminEmail = (emailAddress?: string | null) => {
    if (!emailAddress) return false
    return ADMIN_ALLOWED_EMAILS.includes(emailAddress.toLowerCase())
  }

  const checkAccessAndSetup = async (currentUser: FirebaseUser) => {
    setAuthLoading(true)
    if (isAdminEmail(currentUser.email)) {
      setUser(currentUser)
      setRole('admin')
      setAccessGranted(true)
      setLoginError('')
      setAuthLoading(false)
      return
    }

    try {
      const appRef = ref(firebaseDb, `oc_applications/${currentUser.uid}`)
      const snapshot = await get(appRef)
      if (snapshot.exists()) {
        const appVal = snapshot.val()
        if (appVal.status === 'welcomed') {
          setUser(currentUser)
          setRole('oc_member')
          setAccessGranted(true)
          setLoginError('')
          setAuthLoading(false)
          return
        }
      }
      setLoginError('Access Denied: You do not have permissions for the Oasis Workplace.')
      setUser(null)
      setRole(null)
      setAccessGranted(false)
      await signOut(firebaseAuth)
    } catch (err: any) {
      setLoginError('Authentication verification failed: ' + err.message)
      setUser(null)
      setRole(null)
      setAccessGranted(false)
    } finally {
      setAuthLoading(false)
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (currentUser) => {
      if (!currentUser) {
        setUser(null)
        setRole(null)
        setAccessGranted(false)
        setAuthLoading(false)
        return
      }
      checkAccessAndSetup(currentUser)
    })
    return () => unsubscribe()
  }, [])

  // Firebase Real-time listeners
  useEffect(() => {
    if (!accessGranted || !user) return

    setLoadingData(true)

    const wsRef = ref(firebaseDb, 'workstation_config')
    get(wsRef).then((snap) => {
      if (snap.exists()) {
        const val = snap.val()
                if (val.expenses) setWorkstationExpenses(val.expenses)
        if (val.revenues) setWorkstationRevenues(val.revenues)
      }
    })

    const commsRef = ref(firebaseDb, 'committees')
    const unsubComms = onValue(commsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val()
        const parsed = Object.keys(data).map(key => ({
          id: key,
          ...data[key],
          portfolios: data[key].portfolios ? Object.keys(data[key].portfolios).map(pkey => ({ id: pkey, ...data[key].portfolios[pkey] })) : []
        }))
        setDbCommittees(parsed)
      } else {
        setDbCommittees([])
      }
    })

    const regsRef = ref(firebaseDb, 'registrations')
    const unsubRegs = onValue(regsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val()
        const flatList: any[] = []
        Object.entries(data).forEach(([regId, reg]: [string, any]) => {
          if (reg.delegateInfo) {
            if (reg.delegateInfo.delegate1 || reg.delegateInfo.delegate2) {
              if (reg.delegateInfo.delegate1) {
                const del = reg.delegateInfo.delegate1
                flatList.push({
                  id: `${regId}_delegate1`,
                  regId,
                  delId: 'delegate1',
                  name: del.name || '',
                  email: del.email || '',
                  phone: del.phone || '',
                  institution: del.institution || '',
                  course: del.course || '',
                  year: del.year || '',
                  committeeId: reg.committeeId || '',
                  portfolioId: reg.portfolioId || '',
                  isCheckedIn: del.isCheckedIn || false,
                  checkInTime: del.checkInTime || '',
                  paymentId: reg.paymentId || '',
                  paymentStatus: reg.paymentStatus || 'pending',
                  paymentAmount: reg.paymentAmount || 0,
                })
              }
              if (reg.delegateInfo.delegate2) {
                const del = reg.delegateInfo.delegate2
                flatList.push({
                  id: `${regId}_delegate2`,
                  regId,
                  delId: 'delegate2',
                  name: del.name || '',
                  email: del.email || '',
                  phone: del.phone || '',
                  institution: del.institution || '',
                  course: del.course || '',
                  year: del.year || '',
                  committeeId: reg.committeeId || '',
                  portfolioId: reg.portfolioId || '',
                  isCheckedIn: del.isCheckedIn || false,
                  checkInTime: del.checkInTime || '',
                  paymentId: reg.paymentId || '',
                  paymentStatus: reg.paymentStatus || 'pending',
                  paymentAmount: reg.paymentAmount || 0,
                  transportOptIn: reg.transportOptIn || null,
                })
              }
            } else if (reg.delegateInfo.name) {
              const del = reg.delegateInfo
              flatList.push({
                id: `${regId}_single`,
                regId,
                delId: 'single',
                name: del.name || '',
                email: del.email || '',
                phone: del.phone || '',
                institution: del.institution || '',
                course: del.course || '',
                year: del.year || '',
                committeeId: reg.committeeId || '',
                portfolioId: reg.portfolioId || '',
                isCheckedIn: del.isCheckedIn || false,
                checkInTime: del.checkInTime || '',
                paymentId: reg.paymentId || '',
                paymentStatus: reg.paymentStatus || 'pending',
                paymentAmount: reg.paymentAmount || 0,
              })
            } else {
              Object.entries(reg.delegateInfo).forEach(([delId, del]: [string, any]) => {
                if (del && typeof del === 'object') {
                  flatList.push({
                    id: `${regId}_${delId}`,
                    regId,
                    delId,
                    name: del.name || '',
                    email: del.email || '',
                    phone: del.phone || '',
                    institution: del.institution || '',
                    course: del.course || '',
                    year: del.year || '',
                    committeeId: reg.committeeId || '',
                    portfolioId: reg.portfolioId || '',
                    isCheckedIn: del.isCheckedIn || false,
                    checkInTime: del.checkInTime || '',
                    paymentId: reg.paymentId || '',
                    paymentStatus: reg.paymentStatus || 'pending',
                    paymentAmount: reg.paymentAmount || 0,
                  })
                }
              })
            }
          }
        })
        setDbDelegates(flatList)
      } else {
        setDbDelegates([])
      }
    })

    const resourcesRef = ref(firebaseDb, 'resources')
    const unsubResources = onValue(resourcesRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val()
        setDbResources(Object.keys(data).map(k => ({ id: k, ...data[k] })))
      } else {
        setDbResources([])
      }
    })

    const marksRef = ref(firebaseDb, 'marksheets')
    const unsubMarks = onValue(marksRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val()
        const parsedMarks: any[] = []
        Object.keys(data).forEach(commId => {
          if (data[commId].marks) {
            Object.keys(data[commId].marks).forEach(mkey => {
              parsedMarks.push({ id: mkey, committeeId: commId, ...data[commId].marks[mkey] })
            })
          }
        })
        setDbMarksheets(parsedMarks)
      } else {
        setDbMarksheets([])
      }
    })

    const appsRef = ref(firebaseDb, 'oc_applications')
    const unsubApps = onValue(appsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val()
        setDbApplications(Object.keys(data).map(k => ({ uid: k, ...data[k] })))
      } else {
        setDbApplications([])
      }
    })

    const ebAppsRef = ref(firebaseDb, 'eb_applications')
    const unsubEbApps = onValue(ebAppsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val()
        setDbEbApplications(Object.keys(data).map(k => ({ uid: k, ...data[k] })))
      } else {
        setDbEbApplications([])
      }
    })

    const tasksRef = ref(firebaseDb, 'oc_tasks')
    const unsubTasks = onValue(tasksRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val()
        setDbTasks(Object.keys(data).map(k => ({ id: k, ...data[k] })))
      } else {
        setDbTasks([])
      }
    })

    const assetsRef = ref(firebaseDb, 'oc_assets')
    const unsubAssets = onValue(assetsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val()
        setDbAssets(Object.keys(data).map(k => ({ id: k, ...data[k] })))
      } else {
        setDbAssets([])
      }
    })

    const annRef = ref(firebaseDb, 'oc_announcements')
    const unsubAnn = onValue(annRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val()
        setDbAnnouncements(Object.keys(data).map(k => ({ id: k, ...data[k] })))
      } else {
        setDbAnnouncements([])
      }
    })

    const payoutsRef = ref(firebaseDb, 'payouts')
    const unsubPayouts = onValue(payoutsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val()
        setDbPayouts(Object.keys(data).map(k => ({ id: k, ...data[k] })))
      } else {
        setDbPayouts([])
      }
    })

    const prizeTrackingRef = ref(firebaseDb, 'prize_tracking')
    const unsubPrizeTracking = onValue(prizeTrackingRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val()
        setDbPrizeTracking(Object.keys(data).map(k => ({ id: k, ...data[k] })))
      } else {
        setDbPrizeTracking([])
      }
    })

    const couponsRef = ref(firebaseDb, 'coupons')
    const unsubCoupons = onValue(couponsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val()
        setDbCoupons(Object.keys(data).map(k => ({ id: k, ...data[k] })))
      } else {
        setDbCoupons([])
      }
    })

    const settingsRef = ref(firebaseDb, 'site_settings')
    const unsubSettings = onValue(settingsRef, (snap) => {
      if (snap.exists()) {
        setDbSiteSettings(snap.val())
      }
    })

    const logsRef = ref(firebaseDb, 'activity_logs')
    const unsubLogs = onValue(logsRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val()
        setDbActivityLogs(Object.keys(data).map(k => ({ id: k, ...data[k] })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()))
      } else {
        setDbActivityLogs([])
      }
      setLoadingData(false)
    })

    const scheduleRef = ref(firebaseDb, 'schedule')
    const unsubSchedule = onValue(scheduleRef, (snap) => {
      if (snap.exists()) {
        const data = snap.val()
        setDbSchedule(Object.keys(data).map(k => ({ id: k, ...data[k] })))
      } else {
        setDbSchedule([])
      }
    })

    

    const blacklistRef = ref(firebaseDb, 'blacklisted')
    const unsubBlacklist = onValue(blacklistRef, (snap) => {
      if (snap.exists()) {
        setDbBlacklisted(snap.val())
      } else {
        setDbBlacklisted({})
      }
    })

    return () => {
      unsubComms()
      unsubRegs()
      unsubResources()
      unsubMarks()
      unsubApps()
      unsubEbApps()
      unsubTasks()
      unsubAssets()
      unsubAnn()
      unsubPayouts()
      unsubPrizeTracking()
      unsubCoupons()
      unsubSchedule()
      unsubLogs()
      unsubSettings()
      unsubBlacklist()
    }
  }, [accessGranted, user])

  // Google Sign-In trigger
  const handleGoogleSignIn = async () => {
    setAuthLoading(true)
    setLoginError('')
    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider)
      await checkAccessAndSetup(result.user)
    } catch (err: any) {
      setLoginError(err.message || 'Google Sign-In failed. Please try again.')
      setAuthLoading(false)
    }
  }

  // Sign out trigger
  const handleSignOut = async () => {
    setAuthLoading(true)
    try {
      await signOut(firebaseAuth)
      setUser(null)
      setAccessGranted(false)
      setRole(null)
    } catch (err: any) {
      triggerNotification('Sign out failed!', 'error')
    } finally {
      setAuthLoading(false)
    }
  }

  // Workstation Live Sync to Cloud DB
  const saveWorkstationBaselineToCloud = async (comms: any[], exps: any[], revs: any[]) => {
    try {
      await set(ref(firebaseDb, 'workstation_config'), {
        expenses: exps,
        revenues: revs,
        lastUpdated: new Date().toISOString()
      })
      triggerNotification('Financial models synchronized with cloud.')
    } catch (error: any) {
      triggerNotification('Failed to sync financial baseline: ' + error.message, 'error')
    }
  }

  // Computations for Simulated Workspace Matrix Metrics
  const totals = useMemo(() => {
    const targetSeats = dbCommittees.reduce((sum, c) => sum + c.target, 0)
    const actualTurnout = Math.round(targetSeats * (attendanceRealizationRate / 100))

    const targetRegRevenue = dbCommittees.reduce((sum, c) => sum + (c.target * globalRegFee), 0)
    const actualRegRevenue = Math.round(targetRegRevenue * (attendanceRealizationRate / 100))

    let targetNonRegRevenue = 0
    let actualNonRegRevenue = 0
    workstationRevenues.forEach(r => {
      if (r.category === 'Sponsorships') {
        if (!excludeSponsors) {
          targetNonRegRevenue += r.target * (sponsorRealizationRate / 100)
          actualNonRegRevenue += r.actual * (sponsorRealizationRate / 100)
        }
      } else {
        targetNonRegRevenue += r.target
        actualNonRegRevenue += r.actual
      }
    })

    const totalTargetRevenue = targetRegRevenue + targetNonRegRevenue
    const totalActualRevenue = actualRegRevenue + actualNonRegRevenue

    let baseTargetExpenses = 0
    let baseActualExpenses = 0
    let totalVariableUnitCost = 0
    let totalFixedCosts = 0

    workstationExpenses.forEach(item => {
      if (item.isPerDelegate) {
        totalVariableUnitCost += item.unitCost
        baseTargetExpenses += targetSeats * item.unitCost
        baseActualExpenses += actualTurnout * (item.actualCost / item.qty)
      } else {
        totalFixedCosts += item.qty * item.unitCost
        baseTargetExpenses += item.qty * item.unitCost
        baseActualExpenses += item.actualCost
      }
    })

    const contingencyAllocated = baseTargetExpenses * (contingencyRate / 100)
    const finalTargetExpenses = baseTargetExpenses + contingencyAllocated
    const finalActualExpenses = baseActualExpenses + (baseActualExpenses * (contingencyRate / 100))

    const netProjectedProfit = totalTargetRevenue - finalTargetExpenses
    const netActualProfit = totalActualRevenue - finalActualExpenses

    const avgSeatFee = globalRegFee
    const breakEvenSeats = (avgSeatFee - totalVariableUnitCost) > 0
      ? Math.ceil(totalFixedCosts / (avgSeatFee - totalVariableUnitCost))
      : 'N/A'

    const deptBudgets: any = {}
    const deptActuals: any = {}
    DEPARTMENTS.slice(1).forEach(d => {
      deptBudgets[d.name] = 0
      deptActuals[d.name] = 0
    })

    workstationExpenses.forEach(item => {
      if (item.isPerDelegate) {
        deptBudgets[item.dept] = (deptBudgets[item.dept] || 0) + (targetSeats * item.unitCost)
        deptActuals[item.dept] = (deptActuals[item.dept] || 0) + (actualTurnout * (item.actualCost / item.qty))
      } else {
        deptBudgets[item.dept] = (deptBudgets[item.dept] || 0) + (item.qty * item.unitCost)
        deptActuals[item.dept] = (deptActuals[item.dept] || 0) + item.actualCost
      }
    })

    const committeeCashFlows: any = {}
    dbCommittees.forEach(c => {
      const inflow = c.target * globalRegFee
      const outflow = targetSeats > 0 ? finalTargetExpenses * (c.target / targetSeats) : 0
      committeeCashFlows[c.id] = { inflow, outflow, profit: inflow - outflow }
    })

    return {
      targetSeats,
      actualTurnout,
      targetRegRevenue,
      actualRegRevenue,
      totalTargetRevenue,
      totalActualRevenue,
      budgetedExpenses: Math.round(finalTargetExpenses),
      actualExpenses: Math.round(finalActualExpenses),
      projectedProfit: Math.round(netProjectedProfit),
      actualProfit: Math.round(netActualProfit),
      contingencyAllocated: Math.round(contingencyAllocated),
      totalFixedCosts,
      totalVariableUnitCost,
      avgSeatFee: Math.round(avgSeatFee),
      breakEvenSeats,
      deptBudgets,
      deptActuals,
      committeeCashFlows,
    }
  }, [dbCommittees, workstationExpenses, workstationRevenues, attendanceRealizationRate, sponsorRealizationRate, contingencyRate, excludeSponsors, globalRegFee])

  // Modal Handlers
  const openAddCommitteeModal = () => {
    setEditingCommittee(null)
    setCommitteeForm({ name: '', target: 40, fee: 1800, category: 'Specialized' })
    setShowCommitteeModal(true)
  }

  const openEditCommitteeModal = (c: any) => {
    setEditingCommittee(c)
    setCommitteeForm({ name: c.name, target: c.target, fee: c.fee, category: c.category })
    setShowCommitteeModal(true)
  }

  const handleSaveCommittee = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCommittee) return
    try {
      const commRef = ref(firebaseDb, `committees/${editingCommittee.id}`)
      await update(commRef, {
        target: Number(committeeForm.target) || 30,
        fee: Number(committeeForm.fee) || 1000
      })
      triggerNotification('Committee financial targets updated successfully.')
      setShowCommitteeModal(false)
      setEditingCommittee(null)
    } catch (err: any) {
      triggerNotification('Failed to update targets: ' + err.message, 'error')
    }
  }

  const openAddExpenseModal = () => {
    setEditingExpense(null)
    setExpenseForm({ dept: 'Business Relations & Corporate Strategy', item: '', qty: 1, unitCost: 0, actualCost: 0, status: 'Pending', isPerDelegate: false })
    setShowExpenseModal(true)
  }

  const openEditExpenseModal = (exp: any) => {
    setEditingExpense(exp)
    setExpenseForm({ dept: exp.dept, item: exp.item, qty: exp.qty, unitCost: exp.unitCost, actualCost: exp.actualCost, status: exp.status, isPerDelegate: exp.isPerDelegate })
    setShowExpenseModal(true)
  }

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault()
    if (!expenseForm.item.trim()) return
    let list: any[]
    if (editingExpense) {
      list = workstationExpenses.map(exp => exp.id === editingExpense.id ? { ...exp, ...expenseForm } : exp)
      triggerNotification('Ledger line item updated.')
    } else {
      const newId = `EXP-${Date.now().toString().slice(-5)}`
      list = [...workstationExpenses, { ...expenseForm, id: newId }]
      triggerNotification('New expenditure line appended to ledger.')
    }
    setWorkstationExpenses(list)
    setShowExpenseModal(false)
    setEditingExpense(null)
    if (role === 'admin' || role === 'oc_member') saveWorkstationBaselineToCloud(dbCommittees, list, workstationRevenues)
  }

  const openAddRevenueModal = () => {
    setEditingRevenue(null)
    setRevenueForm({ category: 'Sponsorships', source: '', target: 0, actual: 0, status: 'In Progress' })
    setShowRevenueModal(true)
  }

  const openEditRevenueModal = (rev: any) => {
    setEditingRevenue(rev)
    setRevenueForm({ category: rev.category, source: rev.source, target: rev.target, actual: rev.actual, status: rev.status })
    setShowRevenueModal(true)
  }

  const handleSaveRevenue = (e: React.FormEvent) => {
    e.preventDefault()
    if (!revenueForm.source.trim()) return
    let list: any[]
    if (editingRevenue) {
      list = workstationRevenues.map(r => r.id === editingRevenue.id ? { ...r, ...revenueForm } : r)
      triggerNotification('Partnership record updated.')
    } else {
      const newId = `REV-${Date.now().toString().slice(-5)}`
      list = [...workstationRevenues, { ...revenueForm, id: newId }]
      triggerNotification('New partnership inflow contract registered.')
    }
    setWorkstationRevenues(list)
    setShowRevenueModal(false)
    setEditingRevenue(null)
    if (role === 'admin' || role === 'oc_member') saveWorkstationBaselineToCloud(dbCommittees, workstationExpenses, list)
  }

  const handleConfirmDelete = () => {
    if (!deleteConfirm) return
    const { type, id } = deleteConfirm
    if (type === 'committees') {
      const nextCommittees = dbCommittees.filter(c => c.id !== id)
      setWorkstationCommittees(nextCommittees)
      triggerNotification('Record permanently removed from workstation.', 'error')
      if (role === 'admin' || role === 'oc_member') saveWorkstationBaselineToCloud(nextCommittees, workstationExpenses, workstationRevenues)
    } else if (type === 'expenses') {
      const nextExpenses = workstationExpenses.filter(e => e.id !== id)
      setWorkstationExpenses(nextExpenses)
      triggerNotification('Record permanently removed from workstation.', 'error')
      if (role === 'admin' || role === 'oc_member') saveWorkstationBaselineToCloud(dbCommittees, nextExpenses, workstationRevenues)
    } else if (type === 'revenue') {
      const nextRevenues = workstationRevenues.filter(r => r.id !== id)
      setWorkstationRevenues(nextRevenues)
      triggerNotification('Record permanently removed from workstation.', 'error')
      if (role === 'admin' || role === 'oc_member') saveWorkstationBaselineToCloud(dbCommittees, workstationExpenses, nextRevenues)
    } else if (type === 'tasks') {
      remove(ref(firebaseDb, `oc_tasks/${id}`))
        .then(() => {
          logActivity('DELETE_RECORD', `Deleted task ID: ${id}`)
          triggerNotification('Task removed from Board.', 'error')
        })
        .catch(err => triggerNotification('Delete failed: ' + err.message, 'error'))
    } else if (type === 'assets') {
      remove(ref(firebaseDb, `oc_assets/${id}`))
        .then(() => {
          logActivity('DELETE_RECORD', `Deleted asset ID: ${id}`)
          triggerNotification('Asset removed.', 'error')
        })
        .catch(err => triggerNotification('Delete failed: ' + err.message, 'error'))
    } else if (type === 'announcements') {
      remove(ref(firebaseDb, `oc_announcements/${id}`))
        .then(() => {
          logActivity('DELETE_RECORD', `Deleted announcement ID: ${id}`)
          triggerNotification('Broadcast removed.', 'error')
        })
        .catch(err => triggerNotification('Delete failed: ' + err.message, 'error'))
    } else if (type === 'db_committees') {
      remove(ref(firebaseDb, `committees/${id}`))
        .then(() => {
          triggerNotification('Committee removed from database.', 'error')
          if (selectedRegistryCommitteeId === id) {
            setSelectedRegistryCommitteeId(null)
          }
        })
        .catch(err => triggerNotification('Delete failed: ' + err.message, 'error'))
    } else if (type === 'db_portfolios') {
      const portfolioId = deleteConfirm.subId
      if (portfolioId) {
        remove(ref(firebaseDb, `committees/${id}/portfolios/${portfolioId}`))
          .then(() => triggerNotification('Portfolio slot removed.', 'error'))
          .catch(err => triggerNotification('Delete failed: ' + err.message, 'error'))
      }
    } else if (type === 'db_eb') {
      const memberId = deleteConfirm.subId
      if (memberId) {
        remove(ref(firebaseDb, `committees/${id}/eb/${memberId}`))
          .then(() => triggerNotification('EB Member removed.', 'error'))
          .catch(err => triggerNotification('Delete failed: ' + err.message, 'error'))
      }
    } else if (type === 'db_committees') {
      remove(ref(firebaseDb, `committees/${id}`))
        .then(() => {
          logActivity('DELETE_RECORD', `Deleted committee ID: ${id}`)
          triggerNotification('Committee removed from database.', 'error')
          if (selectedRegistryCommitteeId === id) {
            setSelectedRegistryCommitteeId(null)
          }
        })
        .catch(err => triggerNotification('Delete failed: ' + err.message, 'error'))
    } else if (type === 'db_portfolios') {
      const portfolioId = deleteConfirm.subId
      if (portfolioId) {
        remove(ref(firebaseDb, `committees/${id}/portfolios/${portfolioId}`))
          .then(() => {
            logActivity('DELETE_RECORD', `Deleted portfolio ID: ${portfolioId} from committee ${id}`)
            triggerNotification('Portfolio slot removed.', 'error')
          })
          .catch(err => triggerNotification('Delete failed: ' + err.message, 'error'))
      }
    } else if (type === 'db_eb') {
      const memberId = deleteConfirm.subId
      if (memberId) {
        remove(ref(firebaseDb, `committees/${id}/eb/${memberId}`))
          .then(() => {
            logActivity('DELETE_RECORD', `Deleted EB member ID: ${memberId} from committee ${id}`)
            triggerNotification('EB Member removed.', 'error')
          })
          .catch(err => triggerNotification('Delete failed: ' + err.message, 'error'))
      }
    }
    setDeleteConfirm(null)
  }
  const resetWorkstationToDefault = () => {
    if (confirm("Reset current metrics and config variables to KIMUN default baseline values?")) {
            setWorkstationExpenses(INITIAL_EXPENSES)
      setWorkstationRevenues(INITIAL_REVENUES)
      setAttendanceRealizationRate(100)
      setSponsorRealizationRate(100)
      setContingencyRate(10)
      logActivity('RESET_WORKSTATION_CONFIG', 'Reverted workstation to default baseline')
      triggerNotification('Reverted workstation configuration back to baseline defaults.')
      if (role === 'admin' || role === 'oc_member') saveWorkstationBaselineToCloud(dbCommittees, INITIAL_EXPENSES, INITIAL_REVENUES)
    }
  }

  const logActivity = async (actionType: string, details: string) => {
    try {
      if (!user) return;
      const logsRef = ref(firebaseDb, 'activity_logs');
      await push(logsRef, {
        actionType,
        details,
        userEmail: user.email || 'Unknown',
        timestamp: new Date().toISOString()
      });
    } catch (e) {
      console.error("Failed to log activity:", e);
    }
  }

  const handleExportCSV = async () => {
    let csv = "KIMUN 2026 - MODEL UNITED NATIONS FINANCIAL SYSTEM EXPORT\r\n"
    csv += `Compiled Date: ${new Date().toLocaleDateString()} - Multi-Tenant Oasis Workplace\r\n\r\n`
    csv += "--- CONSOLIDATED OVERVIEW METRICS ---\r\n"
    csv += `Seats Target,Turnout Rate (%),Calculated Turnout,Total Target Revenue (INR),Operating Expenditures (INR),Projected Operational Profit (INR)\r\n`
    csv += `${totals.targetSeats},${attendanceRealizationRate}%,${totals.actualTurnout},${totals.totalTargetRevenue},${totals.budgetedExpenses},${totals.projectedProfit}\r\n\r\n`

    csv += "--- REGISTERED TRACKS ---\r\n"
    csv += "ID,Committee Name,Classification,Target Seat Limit,Fee Per Delegate (INR),Calculated Capacity Revenue (INR)\r\n"
    dbCommittees.forEach(c => {
      csv += `${c.id},"${c.name}","${c.category}",${c.target},${c.fee},${c.target * c.fee}\r\n`
    })

    csv += "\r\n--- OUTLAYS & OPERATING EXPENSES ---\r\n"
    csv += "ID,Department,Description,Standard Quantity,Unit Price,Target Allocated Budget (INR),Actual Outflow Spend (INR),Cost Calculation\r\n"
    workstationExpenses.forEach(e => {
      const targetSpend = e.isPerDelegate ? (totals.targetSeats * e.unitCost) : (e.qty * e.unitCost)
      csv += `${e.id},"${e.dept}","${e.item}",${e.isPerDelegate ? totals.targetSeats : e.qty},${e.unitCost},${targetSpend},${e.actualCost},"${e.isPerDelegate ? 'Scaled Per Delegate' : 'Fixed Cost'}"\r\n`
    })

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.setAttribute("download", `Oasis_KIMUN_Matrix_Export.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    await logActivity('CSV_EXPORT', 'Oasis Financial System Export')
    triggerNotification('Spreadsheet CSV download initiated!')
  }

  const generateContractPDFBytes = async (appData: any): Promise<Uint8Array> => {
    const { jsPDF } = await import('jspdf')
    const { PDFDocument } = await import('pdf-lib')
    const doc = new jsPDF()

    // Page Frame
    doc.setDrawColor(60, 80, 224) // Brand Blue
    doc.setLineWidth(1.5)
    doc.rect(10, 10, 190, 277)

    // Header Banner
    doc.setFillColor(60, 80, 224)
    doc.rect(10, 10, 190, 28, 'F')

    // Title
    doc.setTextColor(255, 255, 255)
    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(14)
    doc.text("KIMUN 2026 EXECUTIVE CONTRACT", 105, 20, { align: 'center' })
    doc.setFontSize(8.5)
    doc.text("ORGANIZING COMMITTEE MEMBERSHIP & NON-DISCLOSURE AGREEMENT", 105, 28, { align: 'center' })

    // Details
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

    const candidateName = appData.name || 'Candidate'
    const candidateEmail = appData.email || 'N/A'

    drawField("CANDIDATE NAME:", (candidateName || '').toUpperCase(), true)
    drawField("ASSIGNED DEPT:", (appData.pref1 || 'Business Relations & Corporate Strategy').toUpperCase())
    drawField("EMAIL ADDRESS:", candidateEmail || 'N/A')
    drawField("CONTACT PHONE:", appData.phone || 'N/A')
    drawField("NDA SIGNED ON:", appData.contractSignedAt ? new Date(appData.contractSignedAt).toLocaleString() : 'PENDING SIGNATURE')
    drawField("SIGNATURE KEY:", (appData.signature || 'PENDING SIGNATURE').toUpperCase())

    // Divider
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.5)
    doc.line(20, y + 2, 190, y + 2)
    y += 10

    // Contract Title
    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(10)
    doc.text("TERMS & CONDITIONS AGREEMENT", 20, y)
    y += 6

    // NDA Terms paragraph layout
    doc.setFont('Helvetica', 'normal')
    doc.setFontSize(8)
    const terms = [
      "1. PURPOSE: The Disclosing Party (KIMUN Secretariat) is granting the Candidate access to operational frameworks, registration matrices, financial details, and delegate databases for the execution of KIMUN 2026.",
      "2. CONFIDENTIALITY PROTOCOLS: All materials, email lists, contact parameters, software integrations, and design files remain the exclusive property of KIMUN. The Candidate shall not reproduce, share, or disseminate any proprietary resources to third parties without prior written consent.",
      "3. CODE OF CONDUCT: Candidates must maintain a high standard of professional ethics. You are expected to deliver tasks on time as assigned under your respective department parameters. Misconduct or security leaks will result in termination of this appointment and potential legal enforcement.",
      "4. TERM: This agreement is active from the date of digital authorization until the completion of KIMUN 2026 post-event administrative clearance."
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

    // Signature block
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

        // Image drawing fallback
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
        const candidateName = appData.name || 'Candidate'
        link.download = `KIMUN_OC_Contract_${candidateName.replace(/\s+/g, '_')}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        await logActivity('PDF_DOWNLOAD', `Contract PDF for ${candidateName}`)
        triggerNotification('Contract PDF downloaded successfully!')
        setDownloadingContract(false)
        return
      }

      const pdfBytes = await generateContractPDFBytes(appData)
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const link = document.createElement('a')
      link.href = window.URL.createObjectURL(blob)
      const candidateName = appData.name || 'Candidate'
      link.download = `Signed_Contract_${(candidateName || 'OC').replace(/\s+/g, '_')}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      await logActivity('PDF_DOWNLOAD', `Contract PDF for ${candidateName}`)
      triggerNotification('Contract PDF generated and downloaded successfully!')
    } catch (e: any) {
      console.error(e)
      triggerNotification('Failed to generate contract PDF: ' + e.message, 'error')
    } finally {
      setDownloadingContract(false)
    }
  }

  const handleDownloadCitationPDF = async (delegate: any) => {
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF()

      // Page Frame
      doc.setDrawColor(60, 80, 224) // Brand Blue
      doc.setLineWidth(1.5)
      doc.rect(10, 10, 190, 277)

      // Header Banner
      doc.setFillColor(60, 80, 224)
      doc.rect(10, 10, 190, 28, 'F')

      // Title
      doc.setTextColor(255, 255, 255)
      doc.setFont('Helvetica', 'bold')
      doc.setFontSize(14)
      doc.text("KIMUN DELEGATE PROFILE RECORD", 105, 20, { align: 'center' })
      doc.setFontSize(8.5)
      doc.text("Kalinga International Model United Nations Delegate Directory", 105, 28, { align: 'center' })

      // Body Content
      doc.setTextColor(28, 36, 52)
      doc.setFontSize(10)

      // Fields
      let y = 55
      const drawField = (label: string, val: string, isHeader = false) => {
        doc.setFont('Helvetica', 'bold')
        doc.setFontSize(isHeader ? 12 : 10)
        doc.text(label, 20, y)
        doc.setFont('Helvetica', 'normal')
        doc.setFontSize(isHeader ? 12 : 10)
        doc.text(val, 75, y)
        y += isHeader ? 12 : 9
      }

      drawField("REGISTRATION CODE:", (delegate.displayId || '').toUpperCase())
      drawField("REGISTRY SOURCE:", delegate.sourceType === 'firebase' ? 'Active Registry' : 'Legacy Archives')
      y += 4 // space
      drawField("DELEGATE NAME:", (delegate.displayName || '').toUpperCase(), true)
      y += 2
      drawField("SCHOOL / COLLEGE:", delegate.displayInstitution || 'N/A')
      drawField("MUN EXPERIENCE:", delegate.displayExperience || 'N/A')
      drawField("PREV ALLOTMENT:", delegate.displayPreviousAllotments || 'N/A')
      drawField("CURRENT COMMITTEE:", delegate.displayCommittee || 'N/A')
      drawField("CURRENT PORTFOLIO:", delegate.displayPortfolio || 'N/A')

      const maskEmail = (email: string) => {
        if (!email || !email.includes('@')) return '***@***.***'
        const [local, domain] = email.split('@')
        if (local.length <= 2) return `${local[0]}***@${domain}`
        return `${local[0]}${'*'.repeat(Math.min(5, local.length - 2))}${local[local.length - 1]}@${domain}`
      }
      const maskPhone = (phone: string) => {
        if (!phone) return '**********'
        const clean = phone.trim()
        if (clean.length <= 4) return '******' + clean
        return clean.slice(0, -4).replace(/\d/g, '*') + clean.slice(-4)
      }

      drawField("EMAIL (MASKED):", maskEmail(delegate.displayEmail))
      drawField("PHONE (MASKED):", maskPhone(delegate.displayPhone))
      drawField("BLACKLIST / VETTING:", delegate.displayVettingStatus || 'N/A')

      // Divider
      doc.setDrawColor(226, 232, 240)
      doc.setLineWidth(0.5)
      doc.line(20, y + 5, 190, y + 5)
      y += 15

      // Status Alert Banner
      const isBanned = (delegate.displayStatus || '').toLowerCase().includes('ban') || (delegate.displayPayment || '').toLowerCase().includes('black')
      doc.setFillColor(isBanned ? 239 : 16, isBanned ? 68 : 185, isBanned ? 68 : 129) // Red or Green
      doc.rect(20, y, 170, 25, 'F')

      doc.setTextColor(255, 255, 255)
      doc.setFont('Helvetica', 'bold')
      doc.setFontSize(11)
      doc.text(isBanned ? "STATUS: BLACKLISTED" : "STATUS: VERIFIED & CLEARED", 105, y + 10, { align: 'center' })
      doc.setFontSize(8.5)
      doc.text(isBanned ? "DELEGATE HAS A PREVIOUS BAN HISTORY OR BLACKLIST RECORD" : "DELEGATE IS IN GOOD STANDING FOR KALINGA INTERNATIONAL MUN", 105, y + 17, { align: 'center' })

      // Footer
      doc.setTextColor(148, 163, 184)
      doc.setFontSize(7.5)
      doc.text("KIMUN DELEGATE DIRECTORY SERVICES", 105, 270, { align: 'center' })
      doc.save(`Delegate_Record_${delegate.displayName.replace(/\s+/g, '_')}.pdf`)
      logActivity('DOWNLOAD_CITATION_PDF', `Downloaded profile citation for ${delegate.displayName}`)
      triggerNotification('Delegate Profile PDF generated successfully!')
    } catch (e: any) {
      console.error(e)
      triggerNotification('Failed to generate profile PDF: ' + e.message, 'error')
    }
  }

  const handleCreatePrizeTracking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPrizeTracking.beneficiary || !newPrizeTracking.amount) return
    const trackingId = `KIMUN-PRZ-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    try {
      await set(ref(firebaseDb, `prize_tracking/${trackingId}`), {
        ...newPrizeTracking,
        createdAt: new Date().toISOString(),
      })
      await logActivity('CREATE_PRIZE_TRACKING', `Created tracking code ${trackingId} for ${newPrizeTracking.beneficiary}`)
      triggerNotification(`Generated Tracking Code: ${trackingId}`)
      setShowPrizeTrackingModal(false)
      setNewPrizeTracking({ beneficiary: '', award: '', amount: 0, status: 'Processing', transactionRef: '' })
    } catch (err: any) {
      triggerNotification('Failed to generate tracking code: ' + err.message, 'error')
    }
  }

  const handleGenerateIDCard = async (delegate: any) => {
    try {
      const { jsPDF } = await import('jspdf')
      // CR80 size: 53.98mm width, 85.6mm height (portrait ID card)
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [54, 86] })

      // Background Gradient/Brand Color
      doc.setFillColor(60, 80, 224) // Brand Blue
      doc.rect(0, 0, 54, 86, 'F')
      
      doc.setFillColor(255, 255, 255) // White bottom half
      doc.rect(0, 25, 54, 61, 'F')

      // Header Text
      doc.setTextColor(255, 255, 255)
      doc.setFont('Helvetica', 'bold')
      doc.setFontSize(10)
      doc.text("KIMUN 2026", 27, 10, { align: 'center' })
      doc.setFontSize(6)
      doc.text("KALINGA INTERNATIONAL MUN", 27, 15, { align: 'center' })

      // Delegate Name
      doc.setTextColor(28, 36, 52)
      doc.setFont('Helvetica', 'bold')
      doc.setFontSize(9)
      const name = (delegate.displayName || delegate.name || 'DELEGATE').toUpperCase()
      const splitName = doc.splitTextToSize(name, 48)
      doc.text(splitName, 27, 32, { align: 'center' })

      // Delegate Details
      doc.setFont('Helvetica', 'normal')
      doc.setFontSize(7)
      
      let currentY = 42
      
      if (delegate.role || delegate.department) {
        const typeLabel = delegate.department ? "DEPARTMENT" : "ROLE"
        const roleValue = (delegate.role || delegate.department || 'N/A').toUpperCase()
        
        doc.text(typeLabel + ":", 27, currentY, { align: 'center' })
        currentY += 4
        doc.setFont('Helvetica', 'bold')
        const splitRole = doc.splitTextToSize(roleValue, 48)
        doc.text(splitRole, 27, currentY, { align: 'center' })
      } else {
        const commObj = dbCommittees.find(c => c.id === delegate.committeeId)
        const committee = commObj ? commObj.name : (delegate.displayCommittee || delegate.committeeId || 'N/A')
        const portObj = commObj?.portfolios?.find((p: any) => p.id === delegate.portfolioId)
        const portfolio = portObj ? portObj.country : (delegate.displayPortfolio || delegate.portfolioId || 'N/A')
        
        doc.text("COMMITTEE:", 27, currentY, { align: 'center' })
        currentY += 4
        doc.setFont('Helvetica', 'bold')
        const splitCommittee = doc.splitTextToSize(committee, 48)
        doc.text(splitCommittee, 27, currentY, { align: 'center' })
        
        currentY += (splitCommittee.length * 3) + 4
        
        doc.setFont('Helvetica', 'normal')
        doc.text("PORTFOLIO:", 27, currentY, { align: 'center' })
        currentY += 4
        doc.setFont('Helvetica', 'bold')
        const splitPortfolio = doc.splitTextToSize(portfolio, 48)
        doc.text(splitPortfolio, 27, currentY, { align: 'center' })
      }

      // ID string and optional QR
      const idStr = (delegate.displayId || delegate.id || delegate.uid || 'N/A').toUpperCase()
      doc.setFont('Helvetica', 'normal')
      doc.setFontSize(6)
      doc.text(`ID: ${idStr}`, 27, 72, { align: 'center' })
      
      // Footer
      doc.setFillColor(28, 36, 52)
      doc.rect(0, 78, 54, 8, 'F')
      doc.setTextColor(255, 255, 255)
      doc.text("DELEGATE ACCESS PASS", 27, 83, { align: 'center' })

      doc.save(`ID_Card_${name.replace(/\s+/g, '_')}.pdf`)
      logActivity('GENERATE_ID_CARD', `Generated ID card for ${name}`)
      triggerNotification('ID Card generated successfully!')
    } catch (e: any) {
      console.error(e)
      triggerNotification('Failed to generate ID card: ' + e.message, 'error')
    }
  }

  const handleExportLiveAllocationsCSV = async () => {
    let csv = "ID,Name,Institution,Course,Year,Email,Phone,Check-in Status,Check-in Time\r\n"
    dbDelegates.forEach(d => {
      csv += `${d.id},"${d.name || ''}","${d.institution || ''}","${d.course || ''}","${d.year || ''}","${d.email || ''}","${d.phone || ''}",${d.isCheckedIn ? 'Checked-In' : 'Pending'},"${d.checkInTime || 'N/A'}"\r\n`
    })
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.setAttribute("download", `Oasis_Live_Allocations.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    await logActivity('CSV_EXPORT', 'Exported Live Allocations')
    triggerNotification('Live Allocations exported successfully!')
  }

  const handleExportMarksheetsCSV = async () => {
    let csv = "Marksheet ID,Committee ID,Details\r\n"
    dbMarksheets.forEach(m => {
      csv += `${m.id},"${m.committeeId}",${m.isApproved ? 'Approved' : 'Pending'}\r\n`
    })
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.setAttribute("download", `Oasis_Marksheets.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    await logActivity('CSV_EXPORT', 'Exported Marksheets')
    triggerNotification('Marksheets exported successfully!')
  }

  const handleExportApplicationsCSV = async () => {
    let csv = "ID,Name,Email,Phone,Role/Dept,Status\r\n"
    if (recruitmentView === 'oc') {
      dbApplications.forEach(app => {
        csv += `${app.uid},"${app.name || ''}","${app.email || ''}","${app.phone || ''}","${app.department || ''}","${app.status || 'pending'}"\r\n`
      })
    } else {
      dbEbApplications.forEach(app => {
        csv += `${app.uid},"${app.name || ''}","${app.email || ''}","${app.phone || ''}","${app.role || ''}","${app.status || 'pending'}"\r\n`
      })
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.setAttribute("download", `Oasis_${recruitmentView.toUpperCase()}_Applications.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    await logActivity('CSV_EXPORT', `Exported ${recruitmentView.toUpperCase()} Applications`)
    triggerNotification('Applications exported successfully!')
  }

  // Real-time CRUD Triggers
  const claimLiveTask = async (taskId: string, currentAssignee?: string) => {
    if (!user) return
    const me = user.displayName || user.email || 'Admin'
    const isClaimedByMe = currentAssignee === me
    try {
      await update(ref(firebaseDb, `oc_tasks/${taskId}`), { assignee: isClaimedByMe ? '' : me })
      await logActivity('CLAIM_TASK', `${isClaimedByMe ? 'Unclaimed' : 'Claimed'} live task ID: ${taskId}`)
      triggerNotification(isClaimedByMe ? 'Task unclaimed.' : 'Claimed task successfully.')
    } catch (err: any) {
      triggerNotification('Claim failed: ' + err.message, 'error')
    }
  }


  const handleUpdateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      await update(ref(firebaseDb, `oc_tasks/${taskId}`), {
        status: newStatus,
        updatedAt: new Date().toISOString()
      })
      await logActivity('UPDATE_TASK_STATUS', `Moved task ID: ${taskId} to ${newStatus}`)
      triggerNotification('Task status updated.')
    } catch (err: any) {
      triggerNotification('Failed to update task status: ' + err.message, 'error')
    }
  }

  const completeLiveTask = async (taskId: string) => {
    try {
      await update(ref(firebaseDb, `oc_tasks/${taskId}`), {
        status: 'completed',
        completedAt: new Date().toISOString()
      })
      await logActivity('COMPLETE_TASK', `Completed live task ID: ${taskId}`)
      triggerNotification('Task marked as completed.')
    } catch (err: any) {
      triggerNotification('Failed to complete task: ' + err.message, 'error')
    }
  }

  const openAddTaskModal = (defaultDept?: string) => {
    setEditingTask(null)
    setTaskForm({
      title: '',
      description: '',
      department: defaultDept || 'Business Relations & Corporate Strategy',
      priority: 'medium',
      dueDate: '',
      assignee: '',
      notes: '',
      remarks: '',
      attachments: ''
    })
    setShowTaskForm(true)
  }

  const openEditTaskModal = (task: any) => {
    setEditingTask(task)
    setTaskForm({
      title: task.title || '',
      description: task.description || '',
      department: task.department || 'Business Relations & Corporate Strategy',
      priority: task.priority || 'medium',
      dueDate: task.dueDate || '',
      assignee: task.assignee || '',
      notes: task.notes || '',
      remarks: task.remarks || '',
      attachments: task.attachments || ''
    })
    setShowTaskForm(true)
  }

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!taskForm.title.trim()) return
    try {
      let assigneeEmail = '';
      if (taskForm.assignee) {
        const matchedApp = dbApplications.find(a => a.name === taskForm.assignee);
        if (matchedApp) assigneeEmail = matchedApp.email;
      }

      if (editingTask) {
        await update(ref(firebaseDb, `oc_tasks/${editingTask.id}`), {
          ...taskForm,
          updatedAt: new Date().toISOString()
        })
        await logActivity('UPDATE_TASK', `Updated task: ${taskForm.title}`)
        triggerNotification('Task updated successfully.')

        if (assigneeEmail) {
          await fetch('/api/sendApplicationEmail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: assigneeEmail,
              name: taskForm.assignee,
              type: 'task_updated',
              taskTitle: taskForm.title,
              taskDescription: taskForm.description
            })
          }).catch(e => console.error("Email err", e))
        }
      } else {
        const tasksRef = ref(firebaseDb, 'oc_tasks')
        await push(tasksRef, {
          ...taskForm,
          status: 'todo',
          createdAt: new Date().toISOString(),
          createdBy: user?.email
        })
        await logActivity('CREATE_TASK', `Created task: ${taskForm.title}`)
        triggerNotification('Task added to Kanban Board.')

        if (assigneeEmail) {
          await fetch('/api/sendApplicationEmail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: assigneeEmail,
              name: taskForm.assignee,
              type: 'task_added',
              taskTitle: taskForm.title,
              taskDescription: taskForm.description
            })
          }).catch(e => console.error("Email err", e))
        }
      }
      setShowTaskForm(false)
      setEditingTask(null)
    } catch (err: any) {
      triggerNotification('Failed to save task: ' + err.message, 'error')
    }
  }

  const handleDeleteLiveTask = (taskId: string, name: string) => {
    setDeleteConfirm({ type: 'tasks', id: taskId, name })
  }
  const toggleDelegateCheckinStatus = async (flatDel: any) => {
    const isCheckingIn = !flatDel.isCheckedIn
    const path = `registrations/${flatDel.regId}/delegateInfo/${flatDel.delId}`
    try {
      await update(ref(firebaseDb, path), {
        isCheckedIn: isCheckingIn,
        checkInTime: isCheckingIn ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''
      })
      await logActivity('TOGGLE_CHECKIN', `Toggled checkin status for ${flatDel.name} to ${isCheckingIn}`)
      triggerNotification(`${flatDel.name} check-in status updated.`)
    } catch (err: any) {
      triggerNotification('Failed to toggle checkin: ' + err.message, 'error')
    }
  }

  const [barcodeInput, setBarcodeInput] = useState('')
  const handleCheckinViaBarcodeInput = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!barcodeInput.trim()) return
    const match = dbDelegates.find(d =>
      d.id.includes(barcodeInput) ||
      d.phone === barcodeInput ||
      d.email === barcodeInput
    )

    if (!match) {
      triggerNotification('No delegate entry matches search details.', 'error')
      return
    }

    if (match.isCheckedIn) {
      triggerNotification(`${match.name} is already checked in.`, 'info')
      setBarcodeInput('')
      return
    }

    const path = `registrations/${match.regId}/delegateInfo/${match.delId}`
    try {
      await update(ref(firebaseDb, path), {
        isCheckedIn: true,
        checkInTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      })
      await logActivity('BARCODE_CHECKIN', `Scanned barcode and checked in ${match.name}`)
      triggerNotification(`Verified & checked in ${match.name}!`)
      setBarcodeInput('')
    } catch (err: any) {
      triggerNotification('Check-in trigger failed: ' + err.message, 'error')
    }
  }

  const toggleResourceApprovalStatus = async (resId: string, current: boolean) => {
    if (role !== 'admin') return
    try {
      await update(ref(firebaseDb, `resources/${resId}`), { isApproved: !current })
      await logActivity('TOGGLE_RESOURCE_APPROVAL', `Toggled resource approval for ID: ${resId} to ${!current}`)
      triggerNotification('Resource approval log updated.')
    } catch (err: any) {
      triggerNotification('Update failed: ' + err.message, 'error')
    }
  }

  const handleBulkApproveMarksheets = async (committeeId: string) => {
    if (role !== 'admin') return
    try {
      const list = dbMarksheets.filter(m => m.committeeId === committeeId)
      if (list.length === 0) {
        triggerNotification('No marksheet records available to approve.', 'info')
        return
      }
      const updatesObj: any = {}
      list.forEach(item => {
        updatesObj[`marksheets/${committeeId}/marks/${item.id}/isApproved`] = true
      })
      await update(ref(firebaseDb), updatesObj)
      await logActivity('BULK_APPROVE_MARKSHEETS', `Approved marksheets for committee ID: ${committeeId}`)
      triggerNotification(`Approved all marksheets for this committee.`)
    } catch (err: any) {
      triggerNotification('Bulk approval failed: ' + err.message, 'error')
    }
  }

  const handleUpdateApplicationStatus = async (uid: string, nextStatus: string, email: string, name: string, isEb: boolean = false) => {
    if (role !== 'admin' && role !== 'oc_member') return
    try {
      const dbPath = isEb ? `eb_applications/${uid}` : `oc_applications/${uid}`
      await update(ref(firebaseDb, dbPath), { status: nextStatus })
      await logActivity('UPDATE_APP_STATUS', `Updated application status for ${name} to ${nextStatus}`)
      triggerNotification(`Applicant status updated to ${nextStatus}.`)

      // Dispatch Email Update
      await fetch('/api/sendApplicationEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          name: name,
          type: 'status_update',
          role: isEb ? 'Executive Board' : 'Organizing Committee',
          status: nextStatus
        })
      }).catch(err => console.error("Email dispatch error:", err))
      
    } catch (err: any) {
      triggerNotification('Failed to update: ' + err.message, 'error')
    }
  }

  const handleUpdateAssignment = async (uid: string, field: string, value: string) => {
    if (role !== 'admin' && role !== 'oc_member') return
    try {
      const isEb = recruitmentView === 'eb'
      const dbPath = isEb ? `eb_applications/${uid}` : `oc_applications/${uid}`
      
      const updatePayload: any = {}
      updatePayload[field] = value

      await update(ref(firebaseDb, dbPath), updatePayload)
      await logActivity('UPDATE_APP_ASSIGNMENT', `Updated assigned ${field} for UID ${uid} to ${value}`)
      
      setSelectedApplicant((prev: any) => prev ? { ...prev, [field]: value } : null)
      triggerNotification(`Applicant assignment updated.`)
    } catch (err: any) {
      triggerNotification('Failed to update assignment: ' + err.message, 'error')
    }
  }

  const handleOpenAppDetailsModal = async (app: any) => {
    setSelectedApplicant(app)
    setShowAppDetailsModal(true)
    setLegacyProfile(null)
    setLegacyProfileError('')
    setFetchingLegacyProfile(true)

    try {
      const email = app.email || ''
      const phone = app.phone || ''

      const queryParams = new URLSearchParams()
      if (email) queryParams.set('email', email)
      if (phone) queryParams.set('phone', phone)

      const response = await fetch(`/api/delegate-profile?${queryParams.toString()}`)
      if (!response.ok) {
        throw new Error(`Failed to fetch legacy profile (Status: ${response.status})`)
      }

      const data = await response.json()
      if (data.error) {
        setLegacyProfileError(data.error)
      } else {
        setLegacyProfile(data.profile || null)
      }
    } catch (err: any) {
      console.error('Error loading legacy profile:', err)
      setLegacyProfileError(err.message || 'An error occurred while fetching details.')
    } finally {
      setFetchingLegacyProfile(false)
    }
  }

  const openAddAssetModal = (defaultDept?: string) => {
    setEditingAsset(null)
    setAssetForm({
      name: '',
      quantity: 1,
      cost: 0,
      status: 'pending',
      department: defaultDept || 'Business Relations & Corporate Strategy'
    })
    setShowAssetForm(true)
  }

  const openEditAssetModal = (asset: any) => {
    setEditingAsset(asset)
    setAssetForm({
      name: asset.name || '',
      quantity: asset.quantity || 1,
      cost: asset.cost || 0,
      status: asset.status || 'pending',
      department: asset.department || 'Business Relations & Corporate Strategy'
    })
    setShowAssetForm(true)
  }

  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assetForm.name.trim()) return
    try {
      if (editingAsset) {
        await update(ref(firebaseDb, `oc_assets/${editingAsset.id}`), {
          ...assetForm,
          quantity: Number(assetForm.quantity),
          cost: Number(assetForm.cost),
          updatedAt: new Date().toISOString()
        })
        await logActivity('UPDATE_ASSET', `Updated asset: ${assetForm.name}`)
        triggerNotification('Asset record updated.')
      } else {
        const assetsRef = ref(firebaseDb, 'oc_assets')
        await push(assetsRef, {
          ...assetForm,
          quantity: Number(assetForm.quantity),
          cost: Number(assetForm.cost),
          updatedAt: new Date().toISOString()
        })
        await logActivity('CREATE_ASSET', `Created asset: ${assetForm.name}`)
        triggerNotification('Infrastructure asset added.')
      }
      setShowAssetForm(false)
      setEditingAsset(null)
    } catch (err: any) {
      triggerNotification('Failed to save asset: ' + err.message, 'error')
    }
  }

  const handleDeleteAsset = (assetId: string, name: string) => {
    setDeleteConfirm({ type: 'assets', id: assetId, name })
  }

  const openAddAnnouncementModal = (defaultDept?: string) => {
    setEditingAnnouncement(null)
    setAnnouncementForm({
      title: '',
      content: '',
      department: defaultDept || 'Business Relations & Corporate Strategy',
      priority: 'medium',
      isPinned: false
    })
    setShowAnnouncementForm(true)
  }

  const openEditAnnouncementModal = (ann: any) => {
    setEditingAnnouncement(ann)
    setAnnouncementForm({
      title: ann.title || '',
      content: ann.content || '',
      department: ann.department || 'Business Relations & Corporate Strategy',
      priority: ann.priority || 'medium',
      isPinned: ann.isPinned || false
    })
    setShowAnnouncementForm(true)
  }

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!announcementForm.title.trim()) return
    try {
      let targetEmails: string[] = [];
      if (announcementForm.department === 'All Departments') {
        targetEmails = dbApplications.filter(a => a.status === 'welcomed' || a.status === 'onboarding').map(a => a.email);
      } else {
        targetEmails = dbApplications.filter(a => (a.status === 'welcomed' || a.status === 'onboarding') && a.department === announcementForm.department).map(a => a.email);
      }
      // Remove duplicates and blanks
      targetEmails = Array.from(new Set(targetEmails.filter(e => e)));

      if (editingAnnouncement) {
        await update(ref(firebaseDb, `oc_announcements/${editingAnnouncement.id}`), {
          ...announcementForm,
          updatedAt: new Date().toISOString()
        })
        await logActivity('UPDATE_ANNOUNCEMENT', `Updated announcement: ${announcementForm.title}`)
        triggerNotification('Announcement updated.')
      } else {
        const annRef = ref(firebaseDb, 'oc_announcements')
        await push(annRef, {
          ...announcementForm,
          createdAt: new Date().toISOString(),
          createdBy: user?.email
        })
        await logActivity('CREATE_ANNOUNCEMENT', `Created announcement: ${announcementForm.title}`)
        triggerNotification('Announcement bulletin broadcasted.')

        if (targetEmails.length > 0) {
          await fetch('/api/sendApplicationEmail', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'broadcast',
              broadcastTitle: announcementForm.title,
              broadcastContent: announcementForm.content,
              emails: targetEmails
            })
          }).catch(e => console.error("Broadcast Email err", e))
        }
      }
      setShowAnnouncementForm(false)
      setEditingAnnouncement(null)
    } catch (err: any) {
      triggerNotification('Failed to save announcement: ' + err.message, 'error')
    }
  }

  const handleDeleteAnnouncement = (annId: string, name: string) => {
    setDeleteConfirm({ type: 'announcements', id: annId, name })
  }

  const handleInitiatePayoutSim = async () => {
    if (!payoutDelegateId || payoutAmount <= 0) return
    setPayoutStatus('verifying')

    setTimeout(() => {
      setPayoutStatus('processing')

      setTimeout(async () => {
        try {
          const payoutRef = ref(firebaseDb, 'payouts')
          await push(payoutRef, {
            delegateId: payoutDelegateId,
            award: payoutAward,
            amount: payoutAmount,
            status: 'SUCCESS',
            timestamp: Date.now(),
            accountNumber: payoutBank.accountNumber,
            ifscCode: payoutBank.ifscCode,
            name: payoutBank.name,
            bankName: payoutBank.bankName,
            phone: payoutBank.phone
          })
          await logActivity('INITIATE_PAYOUT', `Initiated payout of ${payoutAmount} for delegate ${payoutDelegateId}`)
          triggerNotification(`Transferred ${formatINR(payoutAmount)} payout to recipient bank account.`)
          setPayoutStatus('idle')
          setShowPayoutModal(false)
          setPayoutDelegateId('')
          setPayoutAmount(0)
          setPayoutBank({ accountNumber: '', ifscCode: '', name: '', bankName: '', phone: '' })
        } catch (err: any) {
          triggerNotification('Payout simulation database update failed: ' + err.message, 'error')
          setPayoutStatus('idle')
        }
      }, 1500)

    }, 1200)
  }

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCoupon.code.trim()) return
    try {
      const cRef = ref(firebaseDb, 'coupons')
      await push(cRef, {
        ...newCoupon,
        isUsed: false,
        usedBy: null,
        assignedAt: null
      })
      await logActivity('CREATE_COUPON', `Created coupon: ${newCoupon.code}`)
      setNewCoupon({ code: '', title: '', description: '', discount: '', expiry: '', partner: '', terms: '' })
      setShowCouponModal(false)
      triggerNotification('Created new partner promotional coupon.')
    } catch (err: any) {
      triggerNotification('Coupon save failed: ' + err.message, 'error')
    }
  }


  // Real Database Registry Manager Handlers
  const handleSaveDbCommittee = async (e: React.FormEvent) => {
    e.preventDefault()
    const commId = editingDbCommittee ? editingDbCommittee.id : dbCommitteeForm.id.trim().toUpperCase()
    if (!commId || !dbCommitteeForm.name.trim()) {
      triggerNotification('Committee ID and Name are required.', 'error')
      return
    }

    if (!editingDbCommittee && dbCommittees.some(c => c.id === commId)) {
      triggerNotification(`Committee with ID ${commId} already exists!`, 'error')
      return
    }

    try {
      const commRef = ref(firebaseDb, `committees/${commId}`)
      const payload: any = {
        name: dbCommitteeForm.name.trim(),
        description: dbCommitteeForm.description.trim(),
        category: dbCommitteeForm.category.trim(),
        topics: dbCommitteeForm.topics.split(',').map(t => t.trim()).filter(Boolean),
        backgroundGuide: dbCommitteeForm.backgroundGuide.trim(),
        rules: dbCommitteeForm.rules.trim(),
        studyGuide: dbCommitteeForm.studyGuide.trim(),
        image: dbCommitteeForm.image.trim(),
        target: Number(dbCommitteeForm.target) || 30,
        fee: Number(dbCommitteeForm.fee) || 1000,
        updatedAt: new Date().toISOString()
      }

      await update(commRef, payload)
      await logActivity('SAVE_COMMITTEE', `${editingDbCommittee ? 'Updated' : 'Created'} committee: ${commId}`)
      setShowDbCommitteeModal(false)
      setEditingDbCommittee(null)
      setDbCommitteeForm({ id: '', name: '', description: '', category: '', topics: '', backgroundGuide: '', rules: '', studyGuide: '', image: '', target: 30, fee: 1000 })
      triggerNotification(editingDbCommittee ? 'Committee updated successfully.' : 'New committee registered successfully.')
    } catch (err: any) {
      triggerNotification('Failed to save committee: ' + err.message, 'error')
    }
  }

  const handleSaveDbPortfolio = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRegistryCommitteeId) return
    const portId = dbPortfolioForm.id.trim().toLowerCase()
    if (!portId || !dbPortfolioForm.country.trim()) {
      triggerNotification('Portfolio ID and Country name are required.', 'error')
      return
    }

    const currentComm = dbCommittees.find(c => c.id === selectedRegistryCommitteeId)
    const portfolioExists = currentComm?.portfolios?.some((p: any) => p.id === portId)
    if (!editingDbPortfolio && portfolioExists) {
      triggerNotification(`Portfolio with ID ${portId} already exists!`, 'error')
      return
    }

    try {
      const portRef = ref(firebaseDb, `committees/${selectedRegistryCommitteeId}/portfolios/${portId}`)
      const payload = {
        country: dbPortfolioForm.country.trim(),
        countryCode: dbPortfolioForm.countryCode.trim().toUpperCase(),
        isDoubleDelAllowed: dbPortfolioForm.isDoubleDelAllowed,
        isVacant: dbPortfolioForm.isVacant,
        minExperience: Number(dbPortfolioForm.minExperience) || 0,
        email: dbPortfolioForm.email.trim()
      }
      await set(portRef, payload)
      await logActivity('SAVE_PORTFOLIO', `${editingDbPortfolio ? 'Updated' : 'Created'} portfolio: ${portId}`)
      setShowDbPortfolioModal(false)
      setEditingDbPortfolio(null)
      setDbPortfolioForm({ id: '', country: '', countryCode: '', isDoubleDelAllowed: false, isVacant: true, minExperience: 0, email: '' })
      triggerNotification(editingDbPortfolio ? 'Portfolio updated successfully.' : 'New portfolio added successfully.')
    } catch (err: any) {
      triggerNotification('Failed to save portfolio: ' + err.message, 'error')
    }
  }

  const handleSaveDbEbMember = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRegistryCommitteeId) return
    const mId = editingDbEb ? dbEbForm.id : `eb-${Date.now()}`

    if (!dbEbForm.name.trim() || !dbEbForm.role.trim() || !dbEbForm.email.trim()) {
      triggerNotification('Name, Role, and Email are required.', 'error')
      return
    }

    try {
      const ebRef = ref(firebaseDb, `committees/${selectedRegistryCommitteeId}/eb/${mId}`)
      const payload = {
        name: dbEbForm.name.trim(),
        role: dbEbForm.role.trim(),
        email: dbEbForm.email.trim().toLowerCase(),
        photourl: dbEbForm.photourl.trim(),
        instagram: dbEbForm.instagram.trim(),
        bio: dbEbForm.bio.trim()
      }
      await set(ebRef, payload)
      await logActivity('SAVE_EB_MEMBER', `${editingDbEb ? 'Updated' : 'Created'} EB member: ${dbEbForm.name}`)
      setShowDbEbModal(false)
      setEditingDbEb(null)
      setDbEbForm({ id: '', name: '', role: 'Chairperson', email: '', photourl: '', instagram: '', bio: '' })
      triggerNotification(editingDbEb ? 'EB member updated successfully.' : 'New EB member registered successfully.')
    } catch (err: any) {
      triggerNotification('Failed to save EB member: ' + err.message, 'error')
    }
  }

  const handleDbFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'eb_photo' | 'bg_guide' | 'rules' | 'study_guide' | 'comm_photo') => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingFile(true)
    try {
      const folder = selectedRegistryCommitteeId || 'general'

      const formData = new FormData()
      formData.append('file', file)
      formData.append('uid', folder)
      formData.append('field', type)
      formData.append('name', file.name)

      const response = await fetch('/api/upload-document', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()
      if (!data.success || !data.url) {
        throw new Error(data.error || 'Failed to upload document')
      }

      const downloadURL = data.url

      if (type === 'eb_photo') {
        setDbEbForm(prev => ({ ...prev, photourl: downloadURL }))
      } else if (type === 'bg_guide') {
        setDbCommitteeForm(prev => ({ ...prev, backgroundGuide: downloadURL }))
      } else if (type === 'rules') {
        setDbCommitteeForm(prev => ({ ...prev, rules: downloadURL }))
      } else if (type === 'study_guide') {
        setDbCommitteeForm(prev => ({ ...prev, studyGuide: downloadURL }))
      } else if (type === 'comm_photo') {
        setDbCommitteeForm(prev => ({ ...prev, image: downloadURL }))
      }

      triggerNotification('File uploaded successfully.')
    } catch (err: any) {
      triggerNotification('Upload failed: ' + err.message, 'error')
    } finally {
      setIsUploadingFile(false)
    }
  }

  const handleBlacklistDelegate = async (del: any) => {
    const delegateName = del.displayName || del.name
    const delegateEmail = del.displayEmail || del.email
    const reason = prompt(`Provide administrative reason to blacklist delegate: ${delegateName}`)
    if (!reason) return
    try {
      if (del.sourceType === 'supabase') {
        const id = del.uniqueId.replace('sb-', '')
        const response = await fetch('/api/supabase-blacklist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, isBlacklisted: true, reason })
        })
        if (!response.ok) throw new Error('Failed to update Supabase record')
      } else {
        const fbId = del.sourceType === 'firebase' ? del.uniqueId.replace('fb-', '') : del.id
        const blRef = ref(firebaseDb, `blacklisted/${fbId}`)
        await update(blRef, {
          name: delegateName,
          email: delegateEmail,
          reason,
          timestamp: Date.now()
        })
      }
      await logActivity('BLACKLIST_DELEGATE', `Blacklisted delegate: ${delegateName}`)
      triggerNotification(`${delegateName} added to security blacklist ledger.`, 'error')
    } catch (err: any) {
      triggerNotification('Blacklist failed: ' + err.message, 'error')
    }
  }

  const handleRemoveBlacklistDelegate = async (del: any) => {
    const delegateName = del.displayName || del.name
    if (!confirm(`Are you sure you want to remove the blacklist status for ${delegateName}?`)) return
    try {
      if (del.sourceType === 'supabase') {
        const id = del.uniqueId.replace('sb-', '')
        const response = await fetch('/api/supabase-blacklist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, isBlacklisted: false, reason: null })
        })
        if (!response.ok) throw new Error('Failed to update Supabase record')
      } else {
        const fbId = del.sourceType === 'firebase' ? del.uniqueId.replace('fb-', '') : del.id
        const blRef = ref(firebaseDb, `blacklisted/${fbId}`)
        await remove(blRef)
      }
      await logActivity('REMOVE_BLACKLIST_DELEGATE', `Removed blacklist for delegate: ${delegateName}`)
      triggerNotification(`Removed blacklist status for ${delegateName}.`, 'success')
    } catch (err: any) {
      triggerNotification('Remove blacklist failed: ' + err.message, 'error')
    }
  }

  // Filter lists
  const filteredLiveDelegates = useMemo(() => {
    return dbDelegates.filter(d => {
      const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.institution.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesFilter = liveAllocationFilter === 'all' ||
        (liveAllocationFilter === 'vacant' && !d.isCheckedIn) ||
        (liveAllocationFilter === 'allocated' && d.isCheckedIn)

      return matchesSearch && matchesFilter
    })
  }, [dbDelegates, searchQuery, liveAllocationFilter])

  const filteredTasks = useMemo(() => {
    return dbTasks.filter(t => {
      const matchesDept = selectedDeptFilter === 'All Departments' || t.department === selectedDeptFilter
      const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesDept && matchesSearch
    })
  }, [dbTasks, selectedDeptFilter, searchQuery])

  const filteredAssets = useMemo(() => {
    return dbAssets.filter(a => {
      const matchesDept = selectedDeptFilter === 'All Departments' || a.department === selectedDeptFilter
      const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesDept && matchesSearch
    })
  }, [dbAssets, selectedDeptFilter, searchQuery])

  // --- Rendering UI Layout ---

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex flex-col items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-12 h-12 text-indigo-600" />
        </motion.div>
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-xs uppercase font-extrabold tracking-widest text-slate-400 mt-4"
        >
          Loading Oasis Framework...
        </motion.span>
      </div>
    )
  }

  if (!accessGranted || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-slate-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white/80 backdrop-blur-sm border border-slate-200/80 rounded-2xl p-8 shadow-xl text-center space-y-6"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.1 }}
            className="mx-auto w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg"
          >
            <ShieldCheck className="w-8 h-8 text-white" />
          </motion.div>

          <div className="space-y-2">
            <span className="bg-indigo-50 text-indigo-700 text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-indigo-100/60 inline-block">
              OASIS PORTAL
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Executive Control Centre</h1>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Sign in with your authorized credentials to enter the autonomous operations cockpit.
            </p>
          </div>

          {loginError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-800 text-[11px] font-semibold text-left flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{loginError}</span>
            </motion.div>
          )}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGoogleSignIn}
            className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-bold text-sm py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-200"
          >
            <Mail className="w-4 h-4 text-indigo-200" />
            Enter Oasis via Google
          </motion.button>

          <footer className="text-[10px] text-slate-400 font-medium pt-2 border-t border-slate-100">
            © 2026 Kalinga International MUN Secretariat. All rights reserved.
          </footer>
        </motion.div>
      </div>
    )
  }
  const menuItems = [
    { section: 'Main', id: 'dashboard', label: 'Overview', icon: LayoutDashboard, color: 'text-indigo-600' },
    { section: 'Main', id: 'finance_station', label: 'Finance', icon: FileSpreadsheet, color: 'text-emerald-600' },
    { section: 'Main', id: 'live_allocations', label: 'Registrations', icon: UserCheck, color: 'text-sky-600' },
    { section: 'Main', id: 'academic_vault', label: 'Resources', icon: BookOpen, color: 'text-amber-600' },
    ...(role === 'admin' ? [{ section: 'Main', id: 'recruitment', label: 'Onboarding Hub', icon: Users, color: 'text-violet-600' }] : []),
    { section: 'Data Hub', id: 'dept_boards', label: 'Department Workspace', icon: Layers, color: 'text-purple-600' },
    { section: 'Data Hub', id: 'chat', label: 'OC Chat', icon: MessageSquare, color: 'text-green-500' },
    { section: 'Data Hub', id: 'delegate_search', label: 'DeleOs', icon: Search, color: 'text-indigo-600' },
    { section: 'Data Hub', id: 'help_docs', label: 'Help and Doc', icon: Info, color: 'text-blue-600' },
    ...(role === 'admin' ? [
      { section: 'Admin Settings', id: 'schedule_builder', label: 'Schedule Builder', icon: Calendar, color: 'text-sky-500' },
      { section: 'Admin Settings', id: 'transport_logistics', label: 'Transport Settings', icon: Truck, color: 'text-amber-500' },
      { section: 'Admin Settings', id: 'coupons', label: 'Coupons', icon: Ticket, color: 'text-pink-600' },
      { section: 'Admin Settings', id: 'registry_manager', label: 'Committee Management', icon: Sliders, color: 'text-teal-600' },
      { section: 'Admin Settings', id: 'site_settings', label: 'Global Config', icon: Settings, color: 'text-indigo-600' },
      { section: 'Admin Settings', id: 'logs', label: 'Activity Logs', icon: Activity, color: 'text-rose-600' }
    ] : [])
  ];

  const groupedMenuItems = Object.entries(
    menuItems.reduce((acc: any, item) => {
      if (!acc[item.section]) acc[item.section] = [];
      acc[item.section].push(item);
      return acc;
    }, {})
  );

  return (
    <div className="min-h-screen sm:p-4 md:p-6 lg:p-8 flex items-center justify-center relative overflow-hidden bg-slate-900">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] bg-blue-600/40 rounded-full blur-[120px]" />
        <div className="absolute top-[30%] -right-[10%] w-[60%] h-[60%] bg-indigo-600/30 rounded-full blur-[120px]" />
        <div className="absolute bottom-[0%] left-[20%] w-[40%] h-[40%] bg-violet-600/30 rounded-full blur-[120px]" />
      </div>

      <div className="w-full h-[100dvh] sm:h-[calc(100vh-2rem)] md:h-[calc(100vh-3rem)] lg:h-[calc(100vh-4rem)] max-w-[1600px] bg-white sm:rounded-[2rem] sm:shadow-2xl overflow-hidden relative z-10 flex sm:border border-white/20">
        <SidebarProvider className="h-full min-h-0">
          <Sidebar className="h-full border-r border-slate-100 bg-white sm:bg-slate-50 sm:rounded-l-[2rem] overflow-hidden">
            <ShadcnSidebarHeader className="h-16 flex items-center px-4 border-b border-slate-100/60 bg-transparent">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-indigo-600 flex items-center justify-center">
                  <Building className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold tracking-tight">OASIS</span>
              </div>
            </ShadcnSidebarHeader>
            <SidebarContent>
              {groupedMenuItems.map(([section, items]) => (
                <SidebarGroup key={section}>
                  <SidebarGroupLabel>{section}</SidebarGroupLabel>
                  <SidebarMenu>
                    {items.map(item => {
                      const Icon = item.icon;
                      return (
                        <SidebarMenuItem key={item.id}>
                          <SidebarMenuButton
                            isActive={activeMenuTab === item.id}
                            onClick={() => { setActiveMenuTab(item.id as 'dashboard'); setSearchQuery(''); setSidebarOpen(false); }}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{item.label}</span>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroup>
              ))}
            </SidebarContent>
          </Sidebar>


      <main className="flex-1 flex flex-col min-w-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/60 via-slate-50/40 to-slate-100/50 text-foreground transition-all duration-300 ease-in-out h-full overflow-hidden sm:rounded-r-[2rem]">
        <header className="flex h-16 shrink-0 items-center gap-2 border-b border-slate-200/50 px-4 bg-white/60 backdrop-blur-xl z-10">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>{menuItems.find(m => m.id === activeMenuTab)?.label || 'Overview'}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          <div className="ml-auto flex items-center gap-4">
             <div className="text-right hidden sm:block">
               <span className="text-sm font-semibold block leading-tight">{user.displayName?.split(' ')[0]}</span>
               <span className="text-xs text-muted-foreground">{role === 'admin' ? 'Administrator' : 'OC Member'}</span>
             </div>
             <Button variant="ghost" size="icon" onClick={handleSignOut}>
               <LogOut className="w-4 h-4" />
             </Button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative">
          <AnimatePresence mode="wait">

            {/* 1. OVERVIEW HUB — Magic UI + TailAdmin Redesign */}
            
            {activeMenuTab === 'chat' && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 flex flex-col h-[calc(100vh-140px)]">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-900">Communications</h2>
                    <p className="text-slate-500">Internal WhatsApp-style secure chat rooms.</p>
                  </div>
                </div>
                
                <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm flex overflow-hidden">
                  {/* Left Sidebar (Groups) */}
                  <div className="w-1/3 max-w-[280px] border-r border-slate-200 bg-slate-50 flex flex-col">
                    <div className="p-4 border-b border-slate-200">
                      <h3 className="font-semibold text-slate-700">Chat Groups</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {['All (OC)', 'Delegate', 'EB', 'Lobbying'].map(group => (
                        <div 
                          key={group}
                          onClick={() => setChatGroup(group as any)}
                          className={`p-4 border-b border-slate-100 cursor-pointer transition-colors ${chatGroup === group ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : 'hover:bg-slate-100 border-l-4 border-l-transparent'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${chatGroup === group ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                              {group.charAt(0)}
                            </div>
                            <div>
                              <p className={`font-semibold ${chatGroup === group ? 'text-indigo-900' : 'text-slate-700'}`}>{group} Group</p>
                              <p className="text-xs text-slate-500">Tap to view</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Main Chat Area */}
                  <div className="flex-1 flex flex-col bg-[#efeae2] relative">
                    {/* Chat Header */}
                    <div className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between shadow-sm z-10">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                           {chatGroup.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800">{chatGroup} Group</h3>
                          <p className="text-xs text-indigo-600 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Live</p>
                        </div>
                      </div>
                      <MoreVertical className="w-5 h-5 text-slate-400 cursor-pointer" />
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3 z-0 relative">
                      {chatMessages.length === 0 ? (
                         <div className="flex items-center justify-center h-full">
                           <div className="bg-white/60 text-slate-500 px-4 py-2 rounded-lg text-sm shadow-sm">
                             No messages yet. Say hi!
                           </div>
                         </div>
                      ) : (
                        chatMessages.map(msg => {
                          const isMe = msg.senderUid === user?.uid
                          return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[70%] rounded-xl px-4 py-2 shadow-sm ${isMe ? 'bg-[#dcf8c6] text-slate-800 rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none'}`}>
                                {!isMe && <p className="text-xs font-bold text-indigo-600 mb-0.5">{msg.senderName}</p>}
                                <p className="text-sm">{msg.text}</p>
                                <p className="text-[10px] text-slate-500 text-right mt-1">
                                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                          )
                        })
                      )}
                      <div ref={chatEndRef} />
                    </div>

                    {/* Chat Input */}
                    <div className="p-4 bg-[#f0f2f5] border-t border-slate-200 flex items-center gap-3 z-10 relative">
                      <input 
                        type="text" 
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            if (!chatInput.trim()) return;
                            const msgData = {
                              text: chatInput.trim(),
                              senderUid: user?.uid,
                              senderName: user?.displayName || user?.email || 'OC Member',
                              timestamp: Date.now()
                            };
                            push(ref(firebaseDb, `chats/${chatGroup}`), msgData);
                            setChatInput('');
                            setTimeout(() => {
                              chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                            }, 100);
                          }
                        }}
                        placeholder="Type a message..." 
                        className="flex-1 bg-white border-none rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                      />
                      <button 
                        onClick={() => {
                          if (!chatInput.trim()) return;
                          const msgData = {
                            text: chatInput.trim(),
                            senderUid: user?.uid,
                            senderName: user?.displayName || user?.email || 'OC Member',
                            timestamp: Date.now()
                          };
                          push(ref(firebaseDb, `chats/${chatGroup}`), msgData);
                          setChatInput('');
                          setTimeout(() => {
                            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                          }, 100);
                        }}
                        className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white hover:bg-indigo-700 transition-colors shadow-sm shrink-0"
                      >
                        <Send className="w-5 h-5 ml-1" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
    
            {activeMenuTab === 'dashboard' && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-5 pb-24"
              >

                {/* ── HERO BANNER ── */}
                <div className="relative overflow-hidden rounded-2xl p-6 sm:p-8" style={{ background: 'linear-gradient(135deg, #4338ca 0%, #7c3aed 60%, #9333ea 100%)' }}>
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
                  {/* Orbiting Circles decorative */}
                  <div className="absolute right-8 top-1/2 -translate-y-1/2 w-32 h-32 hidden lg:block opacity-60">
                    <div className="relative w-full h-full">
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                          <Building className="w-5 h-5 text-white" />
                        </div>
                      </div>
                      {[{ r: 48, d: 12, c: 'bg-violet-400/80', label: '🎓', delay: 0 }, { r: 60, d: 18, c: 'bg-sky-400/80', label: '🌐', delay: -5 }].map((o, i) => (
                        <OrbitingCircles key={i} radius={o.r} duration={o.d} delay={o.delay} path={false}>
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-white/20 text-xs border border-white/30">{o.label}</span>
                        </OrbitingCircles>
                      ))}
                    </div>
                  </div>
                  <div className="relative z-10 max-w-lg">
                    <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm text-white/90 text-[10px] px-3 py-1 rounded-full font-medium tracking-wide mb-4">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#30d158] animate-pulse" />
                      Live Session — KIMUN 2026
                    </span>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                      Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'}, {user.displayName?.split(' ')[0]}.
                    </h2>
                    <p className="text-white/70 text-sm mt-2 font-normal">
                      Here's your full operations summary for today.
                    </p>
                    <div className="flex flex-wrap gap-2 mt-4">
                      <AvatarCircles
                        avatarUrls={dbApplications.slice(0, 5).map((a: any) => ({ imageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(a.name || 'OC')}&background=818cf8&color=fff&size=40`, name: a.name }))}
                        numPeople={Math.max(0, dbApplications.length - 5)}
                      />
                    </div>
                  </div>
                </div>

                {/* ── KPI CARDS — TailAdmin Style ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { title: 'Delegates', value: dbDelegates.length, sub: `${dbDelegates.filter(d => d.isCheckedIn).length} checked in`, icon: UserCheck, grad: 'from-emerald-500 to-teal-600', bg: 'bg-emerald-50', tc: 'text-emerald-600' },
                    { title: 'OC Applicants', value: dbApplications.length, sub: `${dbApplications.filter((a: any) => a.status === 'accepted').length} accepted`, icon: Users, grad: 'from-indigo-500 to-violet-600', bg: 'bg-indigo-50', tc: 'text-indigo-600' },
                    { title: 'Tasks Done', value: `${dbTasks.filter(t => t.status === 'completed').length}/${dbTasks.length}`, sub: `${dbTasks.length > 0 ? Math.round(dbTasks.filter(t => t.status === 'completed').length / dbTasks.length * 100) : 0}% completion`, icon: ClipboardList, grad: 'from-amber-500 to-orange-600', bg: 'bg-amber-50', tc: 'text-amber-600' },
                    { title: 'Assets Value', value: formatINR(dbAssets.reduce((s, a) => s + a.quantity * a.cost, 0)), sub: `${dbAssets.length} items`, icon: Package, grad: 'from-rose-500 to-pink-600', bg: 'bg-rose-50', tc: 'text-rose-600' },
                  ].map((kpi, i) => (
                    <motion.div key={kpi.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                      className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-shadow group">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">{kpi.title}</p>
                          <p className="text-xl font-bold text-slate-800 mt-1 truncate">{kpi.value}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 truncate">{kpi.sub}</p>
                        </div>
                        <div className={`p-2.5 rounded-xl ${kpi.bg} shrink-0`}>
                          <kpi.icon className={`w-5 h-5 ${kpi.tc}`} />
                        </div>
                      </div>
                      <div className={`mt-3 h-1 rounded-full bg-gradient-to-r ${kpi.grad} opacity-0 group-hover:opacity-100 transition-opacity`} />
                    </motion.div>
                  ))}
                </div>

                {/* ── BENTO GRID — Main Widgets ── */}
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 auto-rows-auto">

                  {/* Globe Widget */}
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
                    className="md:col-span-2 lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
                    style={{ minHeight: 280 }}>
                    <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-indigo-500" />
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Delegate Distribution</span>
                    </div>
                    <div className="relative" style={{ height: 220 }}>
                      <GlobeWidget />
                    </div>
                  </motion.div>

                  {/* Animated Activity Feed */}
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.15 }}
                    className="md:col-span-1 lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col"
                    style={{ minHeight: 280 }}>
                    <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-indigo-500" />
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Live Feed</span>
                    </div>
                    <div className="flex-1 overflow-hidden p-3">
                      <AnimatedList delay={1500}>
                        {[...dbDelegates.slice(0, 6)].map((d, i) => (
                          <div key={i} className="flex items-center gap-2.5 bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                              {(d.name || '?')[0]}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold text-slate-700 truncate">{d.name}</p>
                              <p className="text-[10px] text-slate-400 truncate">{d.institution || 'Registered'}</p>
                            </div>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${d.isCheckedIn ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                              {d.isCheckedIn ? '✓ In' : 'Pending'}
                            </span>
                          </div>
                        ))}
                        {dbDelegates.length === 0 && (
                          <div className="text-center py-8 text-xs text-slate-400">No delegates yet</div>
                        )}
                      </AnimatedList>
                    </div>
                  </motion.div>



                  {/* Department Performance */}
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.25 }}
                    className="md:col-span-2 lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-indigo-500" />
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Department Performance</span>
                    </div>
                    <div className="p-4 space-y-3">
                      {DEPARTMENTS.slice(1, 5).map((d, idx) => {
                        const deptTasks = dbTasks.filter(t => t.department === d.name)
                        const rate = deptTasks.length > 0 ? Math.round(deptTasks.filter(t => t.status === 'completed').length / deptTasks.length * 100) : 0
                        return (
                          <div key={d.name} className="flex items-center gap-3">
                            <span className="text-[10px] font-bold text-slate-500 w-20 truncate shrink-0">{d.name}</span>
                            <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <motion.div initial={{ width: 0 }} animate={{ width: `${rate}%` }} transition={{ delay: idx * 0.06, duration: 0.6 }}
                                className={`h-full rounded-full ${d.color}`} />
                            </div>
                            <span className="text-[10px] font-bold text-slate-600 w-8 text-right">{rate}%</span>
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>

                  {/* Quick Actions */}
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}
                    className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Quick Actions</span>
                    </div>
                    <div className="p-3 grid grid-cols-2 gap-2">
                      {[
                        { label: 'Check-In', icon: UserCheck, action: () => setActiveMenuTab('live_allocations'), color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
                        { label: 'Add Task', icon: PlusCircle, action: () => setShowTaskForm(true), color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
                        { label: 'Export', icon: Download, action: handleExportCSV, color: 'bg-amber-50 text-amber-600 border-amber-100' },
                        { label: 'Sync DB', icon: RefreshCw, action: () => saveWorkstationBaselineToCloud(dbCommittees, workstationExpenses, workstationRevenues), color: 'bg-slate-100 text-slate-600 border-slate-200' },
                      ].map((a) => (
                        <motion.button key={a.label} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} onClick={a.action}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border ${a.color} transition-all`}>
                          <a.icon className="w-5 h-5" />
                          <span className="text-[10px] font-bold">{a.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>

                  {/* Icon Cloud — Departments */}
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.35 }}
                    className="md:col-span-2 lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-indigo-500" />
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Departments & Committees</span>
                    </div>
                    <IconCloud
                      iconSlugs={DEPARTMENTS.slice(1).map(d => d.name)}
                      className="p-3"
                    />
                  </motion.div>

                  {/* Dotted Map */}
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
                    className="md:col-span-1 lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-indigo-500" />
                      <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">Delegate Origins</span>
                    </div>
                    <div className="p-3">
                      <DottedMap
                        className="h-32 rounded-xl"
                        dots={[
                          { lat: 20.5937, lng: 78.9629, label: 'India' },
                          { lat: 28.6139, lng: 77.2090, label: 'Delhi' },
                          { lat: 19.0760, lng: 72.8777, label: 'Mumbai' },
                          { lat: 22.5726, lng: 88.3639, label: 'Kolkata' },
                          { lat: 17.6868, lng: 83.2185, label: 'Vizag' },
                        ]}
                      />
                    </div>
                  </motion.div>


                </div>

                {/* ── DOCK — Mobile Bottom Navigation ── */}
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 sm:hidden">
                  <Dock className="scale-90">
                    {[
                      { icon: LayoutDashboard, label: 'Home', id: 'dashboard' },
                      { icon: UserCheck, label: 'Check-In', id: 'live_allocations' },
                      { icon: Layers, label: 'Workspace', id: 'dept_boards' },
                      { icon: FileSpreadsheet, label: 'Finance', id: 'finance_station' },
                      { icon: Menu, label: 'More', id: 'help_docs' },
                    ].map((item) => (
                      <DockIcon
                        key={item.id}
                        label={item.label}
                        isActive={activeMenuTab === item.id}
                        onClick={() => setActiveMenuTab(item.id as any)}
                      >
                        <item.icon className="w-4 h-4" />
                      </DockIcon>
                    ))}
                  </Dock>
                </div>

              </motion.div>
            )}

            {/* 2. FINANCIAL WORKSTATION */}
            {activeMenuTab === 'finance_station' && (
              <motion.div
                key="finance"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Financial Operations Workstation</h2>
                    <p className="text-xs text-slate-500 mt-1">Simulate turnout models, review outlays, calculate break-evens, and commit baseline configurations.</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/40 border border-slate-800 rounded-xl mr-1">
                      <input
                        type="checkbox"
                        id="exclude-sponsors-header"
                        checked={excludeSponsors}
                        onChange={(e) => setExcludeSponsors(e.target.checked)}
                        className="w-4 h-4 accent-indigo-500 rounded cursor-pointer"
                      />
                      <label htmlFor="exclude-sponsors-header" className="text-xs font-bold text-slate-300 cursor-pointer select-none">
                        No Sponsors Mode
                      </label>
                    </div>
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                      {[
                        { id: 'dashboard', label: 'Models' },
                        { id: 'expenses', label: 'Outlays' },
                        { id: 'revenue', label: 'Inflows' }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setWorkstationTab(tab.id)}
                          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            workstationTab === tab.id 
                              ? 'bg-white shadow-sm text-indigo-600 border border-slate-200/50' 
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {workstationTab === 'dashboard' && (
                  <div className="space-y-6">
                    {/* Break-Even Hero & Fee Controls */}
                    <AnimatedCard>
                      <div className="bg-white rounded-2xl border border-slate-200/60 p-6 flex flex-col md:flex-row items-center justify-between gap-8 shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative overflow-hidden">
                        <div className="absolute -right-10 -top-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
                        <div className="flex-1 space-y-2 relative z-10">
                          <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Global Break-Even Analysis</h3>
                          <div className="flex items-baseline gap-3">
                            <span className="text-5xl font-black text-indigo-700 tracking-tighter">{totals.breakEvenSeats}</span>
                            <span className="text-sm font-bold text-slate-500">delegates required</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-2 max-w-lg leading-relaxed">
                            With current fixed costs of <span className="font-bold text-slate-700">{formatINR(totals.totalFixedCosts)}</span> and variable costs of <span className="font-bold text-slate-700">{formatINR(totals.totalVariableUnitCost)}/delegate</span>, you need {totals.breakEvenSeats} delegates to offset expenses at a {formatINR(globalRegFee)} fee.
                          </p>
                        </div>
                        
                        <div className="w-full md:w-80 space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200/60 relative z-10">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Global Delegate Fee</span>
                            <span className="text-lg font-black text-indigo-600">{formatINR(globalRegFee)}</span>
                          </div>
                          <input 
                            type="range" 
                            min="500" 
                            max="5000" 
                            step="100" 
                            value={globalRegFee} 
                            onChange={(e) => setGlobalRegFee(Number(e.target.value))}
                            className="w-full h-2.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-700 transition-all"
                          />
                          <div className="flex justify-between text-[10px] font-bold text-slate-400">
                            <span>₹500</span>
                            <span>₹5000</span>
                          </div>
                        </div>
                      </div>
                    </AnimatedCard>

                    {/* Financial Analytics Summary */}
                    <AnimatedCard>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all hover:shadow-md">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Total Target Inflow
                          </p>
                          <p className="text-2xl font-black text-slate-800">{formatINR(totals.totalTargetRevenue)}</p>
                          <p className="text-[10px] font-bold text-emerald-600 mt-1">Based on 100% capacity</p>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all hover:shadow-md">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                            Total Target Outflow
                          </p>
                          <p className="text-2xl font-black text-slate-800">{formatINR(totals.budgetedExpenses)}</p>
                          <p className="text-[10px] font-bold text-slate-400 mt-1">Includes contingencies</p>
                        </div>
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-[0_4px_20px_rgba(0,0,0,0.02)] transition-all hover:shadow-md relative overflow-hidden group">
                          <div className={`absolute top-0 right-0 w-1.5 h-full transition-all duration-500 ${totals.projectedProfit >= 0 ? 'bg-emerald-500 group-hover:w-2' : 'bg-rose-500 group-hover:w-2'}`}></div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Projected Net Profit</p>
                          <p className={`text-2xl font-black ${totals.projectedProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {formatINR(totals.projectedProfit)}
                          </p>
                          <p className="text-[10px] font-bold text-slate-400 mt-1">Best case scenario</p>
                        </div>
                        <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-5 rounded-2xl border border-indigo-500 shadow-lg text-white relative overflow-hidden hover:shadow-indigo-500/25 transition-all">
                          <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
                          <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                            Realized Profit
                          </p>
                          <p className="text-2xl font-black relative z-10">{formatINR(totals.actualProfit)}</p>
                          <p className="text-[10px] text-indigo-200 mt-1 font-bold">At {attendanceRealizationRate}% Turnout</p>
                        </div>
                      </div>
                    </AnimatedCard>

                    <AnimatedCard>
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {dbCommittees.map(c => (
                          <div key={c.id} className="group relative bg-white rounded-2xl overflow-hidden border border-slate-200/60 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col">
                            {/* Hero Image Section */}
                            <div className="h-48 w-full relative overflow-hidden bg-slate-100">
                              <img 
                                src={c.image || 'https://images.unsplash.com/photo-1575318625902-1262d19213bc?auto=format&fit=crop&q=80&w=800'} 
                                alt={c.name} 
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent"></div>
                              
                              {/* Category Badge */}
                              <div className="absolute top-4 left-4">
                                <span className="bg-white/95 backdrop-blur-sm text-slate-800 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shadow-sm">
                                  {c.category}
                                </span>
                              </div>

                              {/* Actions (Edit/Delete) */}
                              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-1 group-hover:translate-y-0 duration-200">
                                <button
                                  onClick={() => openEditCommitteeModal(c)}
                                  className="w-8 h-8 rounded-full bg-white/90 backdrop-blur text-slate-700 hover:text-indigo-600 flex items-center justify-center shadow-sm transition-colors"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setDeleteConfirm({ type: 'committees', id: c.id, name: c.name })}
                                  className="w-8 h-8 rounded-full bg-white/90 backdrop-blur text-slate-700 hover:text-rose-600 flex items-center justify-center shadow-sm transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Title overlay */}
                              <div className="absolute bottom-4 left-4 right-4">
                                <h3 className="text-white font-bold text-lg leading-tight line-clamp-2">{c.name}</h3>
                                <p className="text-slate-300 text-xs mt-1 font-mono">{c.id}</p>
                              </div>
                            </div>

                            {/* Content & Stats Section */}
                            <div className="p-5 flex-1 flex flex-col justify-between">
                              <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="space-y-1">
                                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Target Seats</p>
                                  <p className="text-lg font-black text-slate-800">{c.target}</p>
                                </div>
                                <div className="space-y-1">
                                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Global Fee</p>
                                  <p className="text-lg font-black text-indigo-600">{formatINR(globalRegFee)}</p>
                                </div>
                              </div>
                              
                              <div className="pt-3 border-t border-slate-100 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold uppercase text-slate-400">Proj. Inflow</span>
                                  <span className="text-xs font-black text-emerald-600">{formatINR(totals.committeeCashFlows?.[c.id]?.inflow || 0)}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold uppercase text-slate-400">Proj. Outflow (Allocated)</span>
                                  <span className="text-xs font-black text-rose-500">{formatINR(totals.committeeCashFlows?.[c.id]?.outflow || 0)}</span>
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                  <span className="text-[11px] font-bold text-slate-600">Net Profit</span>
                                  <span className={`text-sm font-black ${
                                    (totals.committeeCashFlows?.[c.id]?.profit || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                  }`}>
                                    {formatINR(totals.committeeCashFlows?.[c.id]?.profit || 0)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </AnimatedCard>
                  </div>
                )}

                {/* Expenses Tab */}
                {workstationTab === 'expenses' && (
                  <AnimatedCard>
                    <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-sm">
                      <div className="p-4 bg-slate-50/50 border-b border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Operational Expenditure Ledger</span>
                        <div className="flex flex-wrap gap-1.5">
                          {DEPARTMENTS.map(d => (
                            <button
                              key={d.name}
                              onClick={() => setSelectedDeptFilter(d.name)}
                              className={`px-3 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-all ${selectedDeptFilter === d.name
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                              {d.name.replace('Delegate Relations', 'Del Rel')}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="overflow-x-auto">
                        <Table className="w-full text-left border-collapse text-xs">
                          <TableHeader>
                            <TableRow className="bg-slate-50/30 border-b border-slate-200/60 text-slate-500 uppercase text-[9px] tracking-wider">
                              <TableHead className="py-3 px-4">Item</TableHead>
                              <TableHead className="py-3 px-4">Department</TableHead>
                              <TableHead className="py-3 px-4 text-right">Budgeted</TableHead>
                              <TableHead className="py-3 px-4 text-right">Actual</TableHead>
                              <TableHead className="py-3 px-4 text-center">Status</TableHead>
                              <TableHead className="py-3 px-4 text-center">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody className="divide-y divide-slate-100">
                            {workstationExpenses
                              .filter(e => selectedDeptFilter === 'All Departments' || e.dept === selectedDeptFilter)
                              .map(item => {
                                const budgetedVal = item.isPerDelegate ? (totals.targetSeats * item.unitCost) : (item.qty * item.unitCost)
                                const statusColors: any = {
                                  'Paid': 'bg-emerald-50 text-emerald-700',
                                  'Pending': 'bg-amber-50 text-amber-700',
                                  'Ordered': 'bg-sky-50 text-sky-700',
                                  'Partially Paid': 'bg-violet-50 text-violet-700',
                                }
                                return (
                                  <TableRow key={item.id} className="hover:bg-indigo-50/30 transition-all group">
                                    <TableCell className="py-3 px-4 font-medium text-slate-800">{item.item}</TableCell>
                                    <TableCell className="py-3 px-4 text-slate-600">{item.dept}</TableCell>
                                    <TableCell className="py-3 px-4 text-right font-bold text-indigo-600">{formatINR(budgetedVal)}</TableCell>
                                    <TableCell className="py-3 px-4 text-right font-bold text-slate-700">{formatINR(item.actualCost)}</TableCell>
                                    <TableCell className="py-3 px-4 text-center">
                                      <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${statusColors[item.status] || 'bg-slate-100 text-slate-600'}`}>
                                        {item.status}
                                      </span>
                                    </TableCell>
                                    <TableCell className="py-3 px-4">
                                      <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                          onClick={() => openEditExpenseModal(item)}
                                          className="p-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-indigo-50 rounded-lg transition-all"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => setDeleteConfirm({ type: 'expenses', id: item.id, name: item.item })}
                                          className="p-1.5 bg-white border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-all"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )
                              })}
                          </TableBody>
                        </Table>
                      </div>
                      <div className="p-4 bg-slate-50/50 border-t border-slate-200/60 flex justify-end">
                        <button
                          onClick={openAddExpenseModal}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-2 cursor-pointer transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Expense
                        </button>
                      </div>
                    </div>
                  </AnimatedCard>
                )}

                {/* Revenue Tab */}
                {workstationTab === 'revenue' && (
                  <AnimatedCard>
                    <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-sm">
                      <div className="p-4 bg-slate-50/50 border-b border-slate-200/60 flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Partnerships & Inflows</span>
                        <button
                          onClick={openAddRevenueModal}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add Partnership
                        </button>
                      </div>
                      <div className="overflow-x-auto">
                        <Table className="w-full text-left border-collapse text-xs">
                          <TableHeader>
                            <TableRow className="bg-slate-50/30 border-b border-slate-200/60 text-slate-500 uppercase text-[9px] tracking-wider">
                              <TableHead className="py-3 px-4">Source</TableHead>
                              <TableHead className="py-3 px-4">Category</TableHead>
                              <TableHead className="py-3 px-4 text-right">Target</TableHead>
                              <TableHead className="py-3 px-4 text-right">Actual</TableHead>
                              <TableHead className="py-3 px-4 text-center">Status</TableHead>
                              <TableHead className="py-3 px-4 text-center">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody className="divide-y divide-slate-100">
                            {workstationRevenues.map(r => (
                              <TableRow key={r.id} className="hover:bg-indigo-50/30 transition-all group">
                                <TableCell className="py-3 px-4 font-semibold text-slate-800">{r.source}</TableCell>
                                <TableCell className="py-3 px-4">
                                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[9px] font-bold">
                                    {r.category}
                                  </span>
                                </TableCell>
                                <TableCell className="py-3 px-4 text-right font-bold text-slate-700">{formatINR(r.target)}</TableCell>
                                <TableCell className="py-3 px-4 text-right font-bold text-emerald-600">{formatINR(r.actual)}</TableCell>
                                <TableCell className="py-3 px-4 text-center">
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${r.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' :
                                    r.status === 'Partially Received' ? 'bg-amber-50 text-amber-700' :
                                      'bg-sky-50 text-sky-700'
                                    }`}>
                                    {r.status}
                                  </span>
                                </TableCell>
                                <TableCell className="py-3 px-4">
                                  <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => openEditRevenueModal(r)}
                                      className="p-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-indigo-50 rounded-lg transition-all"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setDeleteConfirm({ type: 'revenue', id: r.id, name: r.source })}
                                      className="p-1.5 bg-white border border-slate-200 text-slate-500 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-all"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </AnimatedCard>
                )}

                {/* Scenario Tab */}
                {workstationTab === 'scenario' && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <AnimatedCard className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200/80 shadow-sm">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-6">
                        <Sliders className="w-4 h-4 text-indigo-500" />
                        Variable Controls
                      </h3>
                      <div className="space-y-6">
                        <div>
                          <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
                            <span>Attendance Realization</span>
                            <span className="text-indigo-600">{attendanceRealizationRate}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={attendanceRealizationRate}
                            onChange={(e) => setAttendanceRealizationRate(Number(e.target.value))}
                            className="w-full accent-indigo-600 cursor-pointer"
                          />
                          <p className="text-[10px] text-slate-400 mt-1">Affects seat-fill and registration revenue</p>
                        </div>
                        <div>
                          <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
                            <span>Sponsorship Realization</span>
                            <span className="text-indigo-600">{sponsorRealizationRate}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={sponsorRealizationRate}
                            onChange={(e) => setSponsorRealizationRate(Number(e.target.value))}
                            className="w-full accent-indigo-600 cursor-pointer"
                          />
                          <p className="text-[10px] text-slate-400 mt-1">Scales non-registration revenue</p>
                        </div>
                        <div className="p-4 bg-slate-950/40 border border-slate-800/80 rounded-xl flex items-center justify-between">
                          <div>
                            <span className="text-xs font-bold text-slate-200 block">No Sponsors Mode</span>
                            <span className="text-[9px] text-slate-400">Exclude all sponsorship inflows from operations budgets</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={excludeSponsors}
                            onChange={(e) => setExcludeSponsors(e.target.checked)}
                            className="w-5 h-5 accent-indigo-500 rounded cursor-pointer"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs font-bold text-slate-700 mb-2">
                            <span>Contingency Buffer</span>
                            <span className="text-indigo-600">{contingencyRate}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="50"
                            value={contingencyRate}
                            onChange={(e) => setContingencyRate(Number(e.target.value))}
                            className="w-full accent-indigo-600 cursor-pointer"
                          />
                          <p className="text-[10px] text-slate-400 mt-1">Emergency allocation on expenditures</p>
                        </div>
                      </div>
                    </AnimatedCard>

                    <AnimatedCard className="bg-gradient-to-br from-indigo-50 to-indigo-100/50 p-6 rounded-xl border border-indigo-100 shadow-sm" delay={0.1}>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-4">
                        <Target className="w-4 h-4 text-indigo-600" />
                        Break-Even Analysis
                      </h3>
                      <div className="space-y-3">
                        <div className="flex justify-between text-[11px] font-semibold">
                          <span className="text-slate-600">Fixed Expenses:</span>
                          <span className="font-bold">{formatINR(totals.totalFixedCosts)}</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-semibold">
                          <span className="text-slate-600">Avg Delegate Fee:</span>
                          <span className="font-bold">{formatINR(totals.avgSeatFee)}</span>
                        </div>
                        <div className="flex justify-between text-[11px] font-semibold">
                          <span className="text-slate-600">Variable Cost/Delegate:</span>
                          <span className="font-bold">{formatINR(totals.totalVariableUnitCost)}</span>
                        </div>
                        <div className="border-t border-indigo-200 pt-3 mt-2">
                          <div className="text-center">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Required Seats</span>
                            <div className="text-3xl font-black text-indigo-700">{totals.breakEvenSeats}</div>
                            <p className="text-[9px] text-slate-500 mt-1">to offset fixed costs</p>
                          </div>
                        </div>
                      </div>
                    </AnimatedCard>
                  </div>
                )}

              </motion.div>
            )}

            {/* 3. LIVE ALLOCATIONS */}
            {activeMenuTab === 'live_allocations' && (
              <motion.div
                key="allocations"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-center gap-3">
                  <form onSubmit={handleCheckinViaBarcodeInput} className="relative flex-1 w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by ID, email, or phone to check-in..."
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                    />
                  </form>
                  <div className="flex gap-2 shrink-0">
                    <select
                      value={liveAllocationFilter}
                      onChange={(e) => setLiveAllocationFilter(e.target.value as any)}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 cursor-pointer"
                    >
                      <option value="all">All Statuses</option>
                      <option value="vacant">Not Checked-In</option>
                      <option value="allocated">Checked-In Only</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowQrScanner(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                    >
                      <QrCode className="w-3.5 h-3.5" /> Scan QR
                    </button>
                    <button
                      onClick={handleExportLiveAllocationsCSV}
                      className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                    >
                      <Download className="w-3.5 h-3.5" /> Export
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-sm">
                  <div className="p-4 bg-slate-50/50 border-b border-slate-200/60">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Delegate Registry ({filteredLiveDelegates.length})</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <Table className="w-full text-left border-collapse text-sm">
                      <TableHeader>
                        <TableRow className="bg-slate-50/30 border-b border-slate-200/60 text-slate-500 uppercase text-[9px] tracking-wider">
                          <TableHead className="py-3 px-4">Name</TableHead>
                          <TableHead className="py-3 px-4">Allocation</TableHead>
                          <TableHead className="py-3 px-4">Institution</TableHead>
                          <TableHead className="py-3 px-4">Contact</TableHead>
                          <TableHead className="py-3 px-4 text-center">Status</TableHead>
                          <TableHead className="py-3 px-4 text-center">Check-in Time</TableHead>
                          <TableHead className="py-3 px-4 text-center">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-slate-100">
                        {filteredLiveDelegates.map(del => {
                          const isBlacklisted = !!dbBlacklisted[del.id] || !!dbBlacklisted[`${del.id}_delegate1`] || !!dbBlacklisted[`${del.id}_delegate2`]

                          return (
                            <TableRow key={del.id} className="hover:bg-slate-50/50 transition-all">
                              <TableCell className="py-3 px-4 font-semibold text-slate-800">{del.name}</TableCell>
                              <TableCell className="py-3 px-4">
                                {(() => {
                                  const comm = dbCommittees.find(c => c.id === del.committeeId)
                                  const commName = comm ? comm.name : 'Unallocated'
                                  const port = comm?.portfolios?.find((p: any) => p.id === del.portfolioId)
                                  const portName = port ? port.country : 'Unallocated'
                                  return (
                                    <>
                                      <span className="font-semibold text-slate-700 block text-xs">{commName}</span>
                                      <span className="text-[10px] text-slate-500">{portName}</span>
                                    </>
                                  )
                                })()}
                              </TableCell>
                              <TableCell className="py-3 px-4 text-slate-600">{del.institution}</TableCell>
                              <TableCell className="py-3 px-4">
                                <span className="text-slate-500 text-xs">{del.email}</span>
                                <span className="block text-[10px] text-slate-400">{del.phone}</span>
                              </TableCell>
                              <TableCell className="py-3 px-4 text-center">
                                {isBlacklisted ? (
                                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700">
                                    Banned
                                  </span>
                                ) : (
                                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${del.isCheckedIn ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                    {del.isCheckedIn ? 'Checked-In' : 'Pending'}
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="py-3 px-4 text-center text-slate-500 text-xs">{del.checkInTime || '-'}</TableCell>
                              <TableCell className="py-3 px-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    onClick={() => toggleDelegateCheckinStatus(del)}
                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${isBlacklisted ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400' : del.isCheckedIn
                                      ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                      : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                      }`}
                                    disabled={isBlacklisted}
                                  >
                                    {del.isCheckedIn ? 'Check-Out' : 'Check-In'}
                                  </button>
                                  {isBlacklisted ? (
                                    <button
                                      onClick={() => handleRemoveBlacklistDelegate(del)}
                                      className="p-1.5 text-slate-400 hover:text-emerald-600 transition-all"
                                      title="Remove Blacklist"
                                    >
                                      <ShieldCheck className="w-4 h-4" />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleBlacklistDelegate(del)}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 transition-all"
                                      title="Blacklist Delegate"
                                    >
                                      <Ban className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                <AnimatePresence>
                  {showQrScanner && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                      onClick={() => setShowQrScanner(false)}
                    >
                      <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-white p-6 rounded-3xl shadow-2xl flex flex-col items-center w-full max-w-md"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <h3 className="font-bold text-xl text-slate-800 mb-4">Scan Delegate QR</h3>
                        <div className="w-full aspect-square bg-black rounded-xl overflow-hidden relative">
                          <Scanner 
                            onScan={async (detectedCodes) => {
                              if (detectedCodes && detectedCodes.length > 0) {
                                const rawValue = detectedCodes[0].rawValue;
                                const delegate = filteredLiveDelegates.find(d => d.delId === rawValue || d.regId === rawValue || d.id === rawValue);
                                
                                if (delegate) {
                                  if (delegate.isCheckedIn) {
                                    toast.info('Delegate already checked in.');
                                    playBeep('success');
                                  } else {
                                    await toggleDelegateCheckinStatus(delegate);
                                    playBeep('success');
                                  }
                                  setShowQrScanner(false);
                                } else {
                                  playBeep('error');
                                  toast.error('Delegate not found!');
                                }
                              }
                            }}
                            components={{
                              audio: false,
                              finder: true,
                            }}
                          />
                        </div>
                        <p className="text-sm text-slate-500 mt-4 text-center">Center the QR code within the frame to scan.</p>
                        <Button 
                          onClick={() => setShowQrScanner(false)}
                          className="mt-6 w-full bg-slate-100 hover:bg-slate-200 text-slate-700"
                        >
                          Cancel
                        </Button>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* 4. ACADEMIC VAULT */}
            {activeMenuTab === 'academic_vault' && (
              <motion.div
                key="academic"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                <AnimatedCard className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 mb-4">
                    <BookOpen className="w-4 h-4 text-indigo-500" />
                    Study Guides & Resources
                  </h3>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {dbResources.length === 0 ? (
                      <p className="text-center text-slate-400 py-8 text-sm">No resources available</p>
                    ) : (
                      dbResources.map(res => (
                        <div key={res.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div>
                            <span className="font-semibold text-slate-800 text-sm">{res.title}</span>
                            <span className="block text-[10px] text-slate-400 mt-0.5">{res.type}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {role === 'admin' && (
                              <button
                                onClick={() => toggleResourceApprovalStatus(res.id, res.isApproved)}
                                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold ${res.isApproved ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                                  }`}
                              >
                                {res.isApproved ? 'Approved' : 'Approve'}
                              </button>
                            )}
                            <a href={res.url} target="_blank" rel="noopener noreferrer" className="p-2 bg-white border border-slate-200 rounded-lg hover:text-indigo-600 transition-all">
                              <Eye className="w-3.5 h-3.5" />
                            </a>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </AnimatedCard>

                <AnimatedCard className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6" delay={0.1}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-indigo-500" />
                      Marksheet Approvals
                    </h3>
                    <button 
                      onClick={handleExportMarksheetsCSV}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-2 py-1 rounded-md flex items-center gap-1 transition-all cursor-pointer">
                      <Download className="w-3 h-3" /> Export Excel
                    </button>
                  </div>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {dbCommittees.map(comm => {
                      const commMarks = dbMarksheets.filter(m => m.committeeId === comm.id)
                      const pendingMarks = commMarks.filter(m => !m.isApproved).length
                      return (
                        <div key={comm.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <div>
                            <span className="font-semibold text-slate-800 text-sm">{comm.name}</span>
                            <span className="block text-[10px] text-slate-400">{commMarks.length} records</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {pendingMarks > 0 && role === 'admin' && (
                              <button
                                onClick={() => handleBulkApproveMarksheets(comm.id)}
                                className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-all"
                              >
                                Approve All
                              </button>
                            )}
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${pendingMarks === 0 && commMarks.length > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                              {commMarks.length === 0 ? 'No Data' : (pendingMarks === 0 ? 'Verified' : `${pendingMarks} Pending`)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </AnimatedCard>
              </motion.div>
            )}

            {/* 5. RECRUITMENT (Admin only) */}
            {activeMenuTab === 'recruitment' && role === 'admin' && (
              <motion.div
                key="recruitment"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Application Vetting</h2>
                    <p className="text-xs text-slate-500 mt-1">Manage applications and staff onboarding</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-slate-100 p-1 rounded-lg flex gap-1">
                      <button
                        onClick={() => setRecruitmentView('oc')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${recruitmentView === 'oc' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        OC Applications
                      </button>
                      <button
                        onClick={() => setRecruitmentView('eb')}
                        className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${recruitmentView === 'eb' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                      >
                        EB Applications
                      </button>
                    </div>
                    <button 
                      onClick={handleExportApplicationsCSV}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer">
                      <Download className="w-3.5 h-3.5" /> Export Excel
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <Table className="w-full text-left border-collapse text-sm">
                      <TableHeader>
                        <TableRow className="bg-slate-50/30 border-b border-slate-200/60 text-slate-500 uppercase text-[9px] tracking-wider">
                          <TableHead className="py-3 px-4">Applicant</TableHead>
                          <TableHead className="py-3 px-4">College</TableHead>
                          <TableHead className="py-3 px-4">Preferences</TableHead>
                          <TableHead className="py-3 px-4 text-center">Status</TableHead>
                          <TableHead className="py-3 px-4 text-center">Details</TableHead>
                          <TableHead className="py-3 px-4 text-center">Details</TableHead>
                          <TableHead className="py-3 px-4 text-center">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-slate-100">
                        {(recruitmentView === 'oc' ? dbApplications : dbEbApplications).length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-12 text-slate-400">No applications found</TableCell>
                          </TableRow>
                        ) : (
                          (recruitmentView === 'oc' ? dbApplications : dbEbApplications).map(app => (
                            <TableRow key={app.uid} className="hover:bg-slate-50/50 transition-all">
                              <TableCell className="py-3 px-4">
                                <span className="font-semibold text-slate-800">{app.name}</span>
                                <span className="block text-[10px] text-slate-400">{app.email}</span>
                              </TableCell>
                              <TableCell className="py-3 px-4">
                                <span className="text-slate-600">{app.college}</span>
                                <span className="block text-[10px] text-slate-400">{app.course} (Year {app.year})</span>
                              </TableCell>
                              <TableCell className="py-3 px-4 text-sm text-slate-600">
                                {recruitmentView === 'eb' ? `${app.committeePref1} (${app.rolePref1})` : app.pref1}
                              </TableCell>
                              <TableCell className="py-3 px-4 text-center">
                                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${app.status === 'welcomed' ? 'bg-emerald-100 text-emerald-700' :
                                  app.status === 'rejected' ? 'bg-rose-100 text-rose-700' :
                                    app.status === 'interview' ? 'bg-sky-100 text-sky-700' :
                                      app.status === 'onboarding' ? 'bg-violet-100 text-violet-700' :
                                        'bg-amber-100 text-amber-700'
                                  }`}>
                                  {app.status}
                                </span>
                              </TableCell>
                              <TableCell className="py-3 px-4 text-center">
                                <button
                                  onClick={() => handleOpenAppDetailsModal(app)}
                                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-semibold text-xs px-3 py-1.5 rounded-lg inline-flex items-center gap-1.5 transition-all cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" /> View
                                </button>
                              </TableCell>
                              <TableCell className="py-3 px-4 text-center">
                                <select
                                  value={app.status}
                                  onChange={(e) => handleUpdateApplicationStatus(app.uid, e.target.value, app.email, app.name, recruitmentView === 'eb')}
                                  className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs text-slate-700 outline-none cursor-pointer"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="interview">Interview</option>
                                  <option value="onboarding">Onboarding</option>
                                  <option value="welcomed">Welcome</option>
                                  <option value="rejected">Reject</option>
                                </select>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </motion.div>
            )}
            {/* 5b. DEPARTMENT BOARDS */}
            {activeMenuTab === 'dept_boards' && (
              <motion.div
                key="dept-boards"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {!selectedDeptWorkspace ? (
                  <>
                    <div>
                      <h2 className="text-xl font-black text-slate-900 tracking-tight">Department Boards</h2>
                      <p className="text-xs text-slate-500 mt-1">Select an operational unit to access its dedicated Kanban board, asset ledger, and notices.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {DEPARTMENTS.slice(1).map((d) => {
                        const deptTasks = dbTasks.filter(t => t.department === d.name)
                        const completedTasks = deptTasks.filter(t => t.status === 'completed').length
                        const completionRate = deptTasks.length > 0 ? Math.round((completedTasks / deptTasks.length) * 100) : 0
                        const deptAssetCost = dbAssets.filter(a => a.department === d.name).reduce((sum, a) => sum + (a.quantity * a.cost), 0)
                        const annCount = dbAnnouncements.filter(a => a.department === d.name).length
                        const IconComponent = d.icon

                        return (
                          <motion.div
                            key={d.name}
                            whileHover={{ y: -4, scale: 1.01 }}
                            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-all duration-300"
                          >
                            <div className="p-6 space-y-4">
                              <div className="flex items-center gap-3">
                                <div className={`${d.color} p-2.5 rounded-xl text-white shadow-sm`}>
                                  <IconComponent className="w-5 h-5" />
                                </div>
                                <h3 className="font-extrabold text-slate-800 text-base">{d.name}</h3>
                              </div>

                              <div className="space-y-2">
                                <div className="flex justify-between text-[11px] font-bold text-slate-500">
                                  <span>Task Progress</span>
                                  <span>{completionRate}% ({completedTasks}/{deptTasks.length})</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                  <div className={`h-full ${d.color} rounded-full`} style={{ width: `${completionRate}%` }} />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4 pt-2 text-xs border-t border-slate-100">
                                <div>
                                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Assets</span>
                                  <span className="font-black text-slate-700">{formatINR(deptAssetCost)}</span>
                                </div>
                                <div>
                                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Notices</span>
                                  <span className="font-black text-slate-700">{annCount} broadcasts</span>
                                </div>
                              </div>
                            </div>

                            <div className="p-4 bg-slate-50 border-t border-slate-100 flex">
                              <button
                                onClick={() => { setSelectedDeptWorkspace(d.name); setDeptSubTab('tasks') }}
                                className={`w-full py-2.5 rounded-xl text-xs font-bold text-white shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${d.color} hover:brightness-95`}
                              >
                                Enter Workspace <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </motion.div>
                        )
                      })}
                    </div>
                  </>
                ) : (
                  // Department Workspace Cockpit
                  (() => {
                    const deptInfo = DEPARTMENTS.find(d => d.name === selectedDeptWorkspace)!
                    const IconComponent = deptInfo.icon
                    const deptTasks = dbTasks.filter(t => t.department === selectedDeptWorkspace)
                    const completedTasks = deptTasks.filter(t => t.status === 'completed').length
                    const todoTasks = deptTasks.filter(t => t.status === 'todo').length
                    const inProgressTasks = deptTasks.filter(t => t.status === 'in_progress').length
                    const completionRate = deptTasks.length > 0 ? Math.round((completedTasks / deptTasks.length) * 100) : 0
                    const deptAssetCost = dbAssets.filter(a => a.department === selectedDeptWorkspace).reduce((sum, a) => sum + (a.quantity * a.cost), 0)
                    const annCount = dbAnnouncements.filter(a => a.department === selectedDeptWorkspace).length

                    return (
                      <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <button
                            onClick={() => setSelectedDeptWorkspace(null)}
                            className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-sm max-w-max cursor-pointer"
                          >
                            <ChevronLeft className="w-4 h-4" /> Back to Boards
                          </button>

                          <div className="flex items-center gap-3">
                            <div className={`${deptInfo.color} p-2 rounded-xl text-white`}>
                              <IconComponent className="w-5 h-5" />
                            </div>
                            <div>
                              <h2 className="text-xl font-black text-slate-900 tracking-tight">{selectedDeptWorkspace} Workspace</h2>
                              <p className="text-xs text-slate-500">Autonomous department operations terminal</p>
                            </div>
                          </div>
                        </div>

                        {/* Mini Dashboard Metrics */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tasks Completed</span>
                              <span className="text-lg font-black text-slate-800 block mt-1">{completedTasks} / {deptTasks.length}</span>
                              <span className="text-[10px] text-slate-500 font-semibold block">{completionRate}% Completion Rate</span>
                            </div>
                            <div className={`p-2.5 rounded-xl ${deptInfo.color} bg-opacity-10 text-slate-700`}>
                              <CheckCircle2 className="w-6 h-6 text-indigo-600" />
                            </div>
                          </div>

                          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Capital Valuation</span>
                              <span className="text-lg font-black text-slate-800 block mt-1">{formatINR(deptAssetCost)}</span>
                              <span className="text-[10px] text-slate-500 font-semibold block">Infrastructural Value</span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-700">
                              <Package className="w-6 h-6" />
                            </div>
                          </div>

                          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Notices Feed</span>
                              <span className="text-lg font-black text-slate-800 block mt-1">{annCount} Broadcasts</span>
                              <span className="text-[10px] text-slate-500 font-semibold block">Team Communications</span>
                            </div>
                            <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600">
                              <Megaphone className="w-6 h-6" />
                            </div>
                          </div>
                        </div>

                        {/* Workspace Navigation Tabs */}
                        <div className="flex border-b border-slate-200 gap-1.5 pt-2">
                          {[
                            { id: 'tasks', label: 'Kanban Tasks', icon: ClipboardList },
                            { id: 'assets', label: 'Asset Ledger', icon: Package },
                            { id: 'bulletins', label: 'Broadcast Bulletins', icon: Megaphone }
                          ].map(tab => {
                            const TabIcon = tab.icon
                            const isTabActive = deptSubTab === tab.id
                            return (
                              <button
                                key={tab.id}
                                onClick={() => setDeptSubTab(tab.id as any)}
                                className={`px-4.5 py-3 border-b-2 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${isTabActive
                                  ? 'border-indigo-600 text-indigo-700 bg-indigo-50/10'
                                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50/50'
                                  }`}
                              >
                                <TabIcon className="w-4 h-4" />
                                {tab.label}
                              </button>
                            )
                          })}
                        </div>

                        {/* Tab Content */}
                        <div className="pt-2">
                          {/* TASKS TAB */}
                          {deptSubTab === 'tasks' && (
                            <div className="space-y-6">
                              <div className="flex justify-between items-center">
                                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Department Kanban</h3>
                                <button
                                  onClick={() => openAddTaskModal(selectedDeptWorkspace)}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-sm"
                                >
                                  <PlusCircle className="w-3.5 h-3.5" /> New Task
                                </button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {[
                                  { title: 'To Do', status: 'todo', color: 'bg-slate-100', textColor: 'text-slate-600', count: todoTasks },
                                  { title: 'In Progress', status: 'in_progress', color: 'bg-amber-100', textColor: 'text-amber-700', count: inProgressTasks },
                                  { title: 'Completed', status: 'completed', color: 'bg-emerald-100', textColor: 'text-emerald-700', count: completedTasks }
                                ].map(column => (
                                  <div key={column.status} className="space-y-4">
                                    <div className={`${column.color} rounded-xl px-4 py-2.5 flex justify-between items-center`}>
                                      <span className={`text-xs font-black uppercase tracking-wider ${column.textColor}`}>{column.title}</span>
                                      <span className="text-[10px] font-bold bg-white/50 px-2 py-0.5 rounded-full">
                                        {column.count}
                                      </span>
                                    </div>
                                    <div className="space-y-3">
                                      {deptTasks.filter(t => t.status === column.status).length === 0 ? (
                                        <div className="text-center py-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                                          No tasks in {column.title}
                                        </div>
                                      ) : (
                                        deptTasks.filter(t => t.status === column.status).map(task => (
                                          <motion.div
                                            key={task.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group"
                                          >
                                            <div className="flex justify-between items-start gap-2">
                                              <span className="font-bold text-slate-800 text-sm block truncate">{task.title}</span>
                                              <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded shrink-0 ${task.priority === 'high' ? 'bg-rose-100 text-rose-700' :
                                                task.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                                                }`}>
                                                {task.priority}
                                              </span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 mt-2 line-clamp-3">{task.description}</p>
                                            {(task.attachments || task.notes || task.remarks) && (
                                              <div className="mt-2.5 space-y-1.5 border-t border-slate-100 pt-2.5">
                                                {task.attachments && (
                                                  <div className="text-[10px]">
                                                    <span className="font-bold text-slate-500 block mb-0.5">Attachments:</span>
                                                    <a href={task.attachments.startsWith('http') ? task.attachments : `https://${task.attachments}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline break-all block max-w-full truncate">{task.attachments}</a>
                                                  </div>
                                                )}
                                                {task.notes && (
                                                  <div className="text-[10px]">
                                                    <span className="font-bold text-slate-500 block mb-0.5">Notes:</span>
                                                    <p className="text-slate-600 line-clamp-2">{task.notes}</p>
                                                  </div>
                                                )}
                                                {task.remarks && (
                                                  <div className="text-[10px]">
                                                    <span className="font-bold text-slate-500 block mb-0.5">Remarks:</span>
                                                    <p className="text-slate-600 italic">{task.remarks}</p>
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                            <div className="flex justify-between items-center text-[9px] text-slate-400 border-t border-slate-100 pt-2.5 mt-2.5">
                                              <span>Due: {task.dueDate}</span>
                                              <span>Assignee: <span className="font-semibold text-slate-600">{task.assignee || 'Unassigned'}</span></span>
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-slate-100/60">
                                              {column.status === 'todo' && (
                                                <button onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')} className="flex-1 min-w-[70px] px-2.5 py-1.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg text-[9px] font-bold hover:bg-amber-100 transition-all text-center">
                                                  Start Progress
                                                </button>
                                              )}
                                              {column.status === 'in_progress' && (
                                                <>
                                                  <button onClick={() => handleUpdateTaskStatus(task.id, 'todo')} className="flex-1 min-w-[70px] px-2.5 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-[9px] font-bold hover:bg-slate-100 transition-all text-center">
                                                    Revert to To Do
                                                  </button>
                                                  <button onClick={() => handleUpdateTaskStatus(task.id, 'completed')} className="flex-1 min-w-[70px] px-2.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-[9px] font-bold hover:bg-emerald-100 transition-all text-center">
                                                    Complete Task
                                                  </button>
                                                </>
                                              )}
                                              {column.status === 'completed' && (
                                                <button onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')} className="flex-1 min-w-[70px] px-2.5 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-[9px] font-bold hover:bg-slate-100 transition-all text-center">
                                                  Reopen Task
                                                </button>
                                              )}
                                              <div className="flex items-center justify-between gap-1 w-full mt-1">
                                                {column.status !== 'completed' && (
                                                  <button onClick={() => claimLiveTask(task.id, task.assignee)} className={`px-2.5 py-1 border rounded-lg text-[9px] font-bold transition-all ${task.assignee === (user?.displayName || user?.email || 'Admin') ? 'bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100'}`}>
                                                    {task.assignee === (user?.displayName || user?.email || 'Admin') ? 'Unclaim' : 'Claim Task'}
                                                  </button>
                                                )}
                                                <div className="flex items-center gap-1 ml-auto">
                                                  <button onClick={() => openEditTaskModal(task)} className="p-1 text-slate-400 hover:text-indigo-600 transition-all bg-slate-50 rounded" title="Edit Task">
                                                    <Edit2 className="w-3.5 h-3.5" />
                                                  </button>
                                                  <button onClick={() => handleDeleteLiveTask(task.id, task.title)} className="p-1 text-slate-400 hover:text-rose-500 transition-all bg-slate-50 rounded" title="Delete Task">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                  </button>
                                                </div>
                                              </div>
                                            </div>
                                          </motion.div>
                                        ))
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* ASSETS TAB */}
                          {deptSubTab === 'assets' && (
                            <div className="space-y-6">
                              <div className="flex justify-between items-center">
                                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Asset Registry</h3>
                                <button
                                  onClick={() => openAddAssetModal(selectedDeptWorkspace)}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-sm"
                                >
                                  <PlusCircle className="w-3.5 h-3.5" /> Add Asset
                                </button>
                              </div>

                              <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                  <Table className="w-full text-left border-collapse text-xs">
                                    <TableHeader>
                                      <TableRow className="bg-slate-50/30 border-b border-slate-200/60 text-slate-500 uppercase text-[9px] tracking-wider font-semibold">
                                        <TableHead className="py-3 px-4 font-bold">Asset Name</TableHead>
                                        <TableHead className="py-3 px-4 text-center font-bold">Qty</TableHead>
                                        <TableHead className="py-3 px-4 text-right font-bold">Unit Cost</TableHead>
                                        <TableHead className="py-3 px-4 text-right font-bold">Total Value</TableHead>
                                        <TableHead className="py-3 px-4 text-center font-bold">Status</TableHead>
                                        <TableHead className="py-3 px-4 text-center font-bold">Actions</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody className="divide-y divide-slate-100">
                                      {dbAssets.filter(a => a.department === selectedDeptWorkspace).length === 0 ? (
                                        <TableRow>
                                          <TableCell colSpan={6} className="text-center py-12 text-slate-400">No assets recorded in this department ledger.</TableCell>
                                        </TableRow>
                                      ) : (
                                        dbAssets.filter(a => a.department === selectedDeptWorkspace).map(asset => (
                                          <TableRow key={asset.id} className="hover:bg-indigo-50/30 transition-all group">
                                            <TableCell className="py-3 px-4 font-bold text-slate-800">{asset.name}</TableCell>
                                            <TableCell className="py-3 px-4 text-center font-bold">{asset.quantity}</TableCell>
                                            <TableCell className="py-3 px-4 text-right font-bold text-slate-700">{formatINR(asset.cost)}</TableCell>
                                            <TableCell className="py-3 px-4 text-right font-bold text-indigo-600">{formatINR(asset.quantity * asset.cost)}</TableCell>
                                            <TableCell className="py-3 px-4 text-center">
                                              <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${asset.status === 'acquired' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                                asset.status === 'ordered' ? 'bg-sky-50 text-sky-700 border border-sky-100' :
                                                  'bg-amber-50 text-amber-700 border border-amber-100'
                                                }`}>
                                                {asset.status}
                                              </span>
                                            </TableCell>
                                            <TableCell className="py-3 px-4">
                                              <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                  onClick={() => openEditAssetModal(asset)}
                                                  className="p-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:border-indigo-300 rounded-lg transition-all"
                                                >
                                                  <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                  onClick={() => handleDeleteAsset(asset.id, asset.name)}
                                                  className="p-1.5 bg-white border border-slate-200 text-slate-500 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 rounded-lg transition-all"
                                                >
                                                  <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                              </div>
                                            </TableCell>
                                          </TableRow>
                                        ))
                                      )}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* BULLETINS TAB */}
                          {deptSubTab === 'bulletins' && (
                            <div className="space-y-6">
                              <div className="flex justify-between items-center">
                                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Broadcast bulletins</h3>
                                <button
                                  onClick={() => openAddAnnouncementModal(selectedDeptWorkspace)}
                                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-sm"
                                >
                                  <PlusCircle className="w-3.5 h-3.5" /> New Broadcast
                                </button>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {dbAnnouncements.filter(a => a.department === selectedDeptWorkspace).length === 0 ? (
                                  <div className="col-span-2 bg-white rounded-xl border border-slate-200 py-12 text-center text-slate-400">
                                    <Bell className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                                    No broadcasts published in this department feed.
                                  </div>
                                ) : (
                                  dbAnnouncements.filter(a => a.department === selectedDeptWorkspace).map(ann => (
                                    <motion.div
                                      key={ann.id}
                                      initial={{ opacity: 0, scale: 0.95 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group animate-fade-in"
                                    >
                                      <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-2">
                                          {ann.isPinned && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                                          <h4 className="font-bold text-slate-800">{ann.title}</h4>
                                        </div>
                                      </div>
                                      <p className="text-xs text-slate-600 mt-3 leading-relaxed">{ann.content}</p>
                                      <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100">
                                        <span className="text-[9px] text-slate-400">by {ann.createdBy?.split('@')[0]}</span>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button
                                            onClick={() => openEditAnnouncementModal(ann)}
                                            className="text-slate-400 hover:text-indigo-650 text-xs font-semibold"
                                          >
                                            Edit
                                          </button>
                                          <button
                                            onClick={() => handleDeleteAnnouncement(ann.id, ann.title)}
                                            className="text-slate-400 hover:text-rose-500 text-xs font-semibold"
                                          >
                                            Delete
                                          </button>
                                        </div>
                                      </div>
                                    </motion.div>
                                  ))
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })()
                )}
              </motion.div>
            )}

            {/* 6. TASK BOARD */}
            {activeMenuTab === 'task_board' && (
              <motion.div
                key="tasks"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedDeptFilter}
                      onChange={(e) => setSelectedDeptFilter(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold cursor-pointer outline-none"
                    >
                      {DEPARTMENTS.map(d => (
                        <option key={d.name} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search tasks..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 w-48 font-medium"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => openAddTaskModal(selectedDeptFilter !== 'All Departments' ? selectedDeptFilter : 'Business Relations & Corporate Strategy')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-sm"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> New Task
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { title: 'To Do', status: 'todo', color: 'bg-slate-100', textColor: 'text-slate-600' },
                    { title: 'In Progress', status: 'in_progress', color: 'bg-amber-100', textColor: 'text-amber-700' },
                    { title: 'Completed', status: 'completed', color: 'bg-emerald-100', textColor: 'text-emerald-700' }
                  ].map(column => (
                    <div key={column.status} className="space-y-4">
                      <div className={`${column.color} rounded-xl px-4 py-2.5 flex justify-between items-center`}>
                        <span className={`text-xs font-black uppercase tracking-wider ${column.textColor}`}>{column.title}</span>
                        <span className="text-[10px] font-bold bg-white/50 px-2 py-0.5 rounded-full">
                          {filteredTasks.filter(t => t.status === column.status).length}
                        </span>
                      </div>
                      <div className="space-y-3 min-h-[100px] transition-colors rounded-xl">
                        {filteredTasks.filter(t => t.status === column.status).length === 0 ? (
                          <div className="text-center py-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                            No tasks
                          </div>
                        ) : (
                          filteredTasks.filter(t => t.status === column.status).map(task => (
                            <div
                              key={task.id}
                              className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group animate-in fade-in slide-in-from-bottom-2 duration-300 relative"
                            >
                              <div className="flex justify-between items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  <span className="font-bold text-slate-800 text-sm block truncate">{task.title}</span>
                                  <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold uppercase mt-1 inline-block">{task.department}</span>
                                </div>
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded shrink-0 ${task.priority === 'high' ? 'bg-rose-100 text-rose-700' :
                                  task.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                                  }`}>
                                  {task.priority}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 mt-2 line-clamp-3">{task.description}</p>
                              {(task.attachments || task.notes || task.remarks) && (
                                <div className="mt-2.5 space-y-1.5 border-t border-slate-100 pt-2.5">
                                  {task.attachments && (
                                    <div className="text-[10px]">
                                      <span className="font-bold text-slate-500 block mb-0.5">Attachments:</span>
                                      <a href={task.attachments.startsWith('http') ? task.attachments : `https://${task.attachments}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline break-all block max-w-full truncate">{task.attachments}</a>
                                    </div>
                                  )}
                                  {task.notes && (
                                    <div className="text-[10px]">
                                      <span className="font-bold text-slate-500 block mb-0.5">Notes:</span>
                                      <p className="text-slate-600 line-clamp-2">{task.notes}</p>
                                    </div>
                                  )}
                                  {task.remarks && (
                                    <div className="text-[10px]">
                                      <span className="font-bold text-slate-500 block mb-0.5">Remarks:</span>
                                      <p className="text-slate-600 italic">{task.remarks}</p>
                                    </div>
                                  )}
                                </div>
                              )}
                              <div className="flex justify-between items-center text-[9px] text-slate-400 border-t border-slate-100 pt-2.5 mt-2.5">
                                <span>Due: {task.dueDate}</span>
                                <span>Assignee: <span className="font-semibold text-slate-600">{task.assignee || 'Unassigned'}</span></span>
                              </div>
                              <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-slate-100/60">
                                {column.status === 'todo' && (
                                  <button onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')} className="flex-1 min-w-[70px] px-2.5 py-1.5 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg text-[9px] font-bold hover:bg-amber-100 transition-all text-center">
                                    Start Progress
                                  </button>
                                )}
                                {column.status === 'in_progress' && (
                                  <>
                                    <button onClick={() => handleUpdateTaskStatus(task.id, 'todo')} className="flex-1 min-w-[70px] px-2.5 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-[9px] font-bold hover:bg-slate-100 transition-all text-center">
                                      Revert to To Do
                                    </button>
                                    <button onClick={() => handleUpdateTaskStatus(task.id, 'completed')} className="flex-1 min-w-[70px] px-2.5 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-[9px] font-bold hover:bg-emerald-100 transition-all text-center">
                                      Complete Task
                                    </button>
                                  </>
                                )}
                                {column.status === 'completed' && (
                                  <button onClick={() => handleUpdateTaskStatus(task.id, 'in_progress')} className="flex-1 min-w-[70px] px-2.5 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-[9px] font-bold hover:bg-slate-100 transition-all text-center">
                                    Reopen Task
                                  </button>
                                )}
                                <div className="flex items-center justify-between gap-1 w-full mt-1">
                                  {column.status !== 'completed' && (
                                    <button onClick={() => claimLiveTask(task.id, task.assignee)} className={`px-2.5 py-1 border rounded-lg text-[9px] font-bold transition-all ${task.assignee === (user?.displayName || user?.email || 'Admin') ? 'bg-rose-50 text-rose-700 border-rose-100 hover:bg-rose-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100'}`}>
                                      {task.assignee === (user?.displayName || user?.email || 'Admin') ? 'Unclaim' : 'Claim Task'}
                                    </button>
                                  )}
                                  <div className="flex items-center gap-1 ml-auto">
                                    <button onClick={() => openEditTaskModal(task)} className="p-1 text-slate-400 hover:text-indigo-600 transition-all bg-slate-50 rounded" title="Edit Task">
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button onClick={() => handleDeleteLiveTask(task.id, task.title)} className="p-1 text-slate-400 hover:text-rose-500 transition-all bg-slate-50 rounded" title="Delete Task">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 7. ASSETS LEDGER */}
            {activeMenuTab === 'assets_ledger' && (
              <motion.div
                key="assets"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <select
                      value={selectedDeptFilter}
                      onChange={(e) => setSelectedDeptFilter(e.target.value)}
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold cursor-pointer outline-none"
                    >
                      {DEPARTMENTS.map(d => (
                        <option key={d.name} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search assets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500 w-48 font-medium"
                      />
                    </div>
                  </div>
                  <button
                    onClick={() => openAddAssetModal(selectedDeptFilter !== 'All Departments' ? selectedDeptFilter : 'Business Relations & Corporate Strategy')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-sm"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> Add Asset
                  </button>
                </div>

                <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <Table className="w-full text-left border-collapse text-xs">
                      <TableHeader>
                        <TableRow className="bg-slate-50/30 border-b border-slate-200/60 text-slate-500 uppercase text-[9px] tracking-wider font-semibold">
                          <TableHead className="py-3 px-4 font-bold">Asset Name</TableHead>
                          <TableHead className="py-3 px-4 font-bold">Department</TableHead>
                          <TableHead className="py-3 px-4 text-center font-bold">Qty</TableHead>
                          <TableHead className="py-3 px-4 text-right font-bold">Unit Cost</TableHead>
                          <TableHead className="py-3 px-4 text-right font-bold">Total Value</TableHead>
                          <TableHead className="py-3 px-4 text-center font-bold">Status</TableHead>
                          <TableHead className="py-3 px-4 text-center font-bold">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-slate-100">
                        {filteredAssets.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-12 text-slate-400">No assets found</TableCell>
                          </TableRow>
                        ) : (
                          filteredAssets.map(asset => (
                            <TableRow key={asset.id} className="hover:bg-indigo-50/30 transition-all group">
                              <TableCell className="py-3 px-4 font-bold text-slate-800">{asset.name}</TableCell>
                              <TableCell className="py-3 px-4 text-slate-600 font-semibold">{asset.department}</TableCell>
                              <TableCell className="py-3 px-4 text-center font-bold">{asset.quantity}</TableCell>
                              <TableCell className="py-3 px-4 text-right font-bold text-slate-700">{formatINR(asset.cost)}</TableCell>
                              <TableCell className="py-3 px-4 text-right font-bold text-indigo-600">{formatINR(asset.quantity * asset.cost)}</TableCell>
                              <TableCell className="py-3 px-4 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${asset.status === 'acquired' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                  asset.status === 'ordered' ? 'bg-sky-50 text-sky-700 border border-sky-100' :
                                    'bg-amber-50 text-amber-700 border border-amber-100'
                                  }`}>
                                  {asset.status}
                                </span>
                              </TableCell>
                              <TableCell className="py-3 px-4">
                                <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button
                                    onClick={() => openEditAssetModal(asset)}
                                    className="p-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:border-indigo-300 rounded-lg transition-all"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteAsset(asset.id, asset.name)}
                                    className="p-1.5 bg-white border border-slate-200 text-slate-500 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 rounded-lg transition-all"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </motion.div>
            )}            {activeMenuTab === 'bulletin_board' && (
              <motion.div
                key="bulletin"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Bulletin Board</h2>
                    <p className="text-xs text-slate-500 mt-1">Broadcast announcements to the team</p>
                  </div>
                  <button
                    onClick={() => openAddAnnouncementModal(selectedDeptFilter !== 'All Departments' ? selectedDeptFilter : 'Business Relations & Corporate Strategy')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-sm"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> New Broadcast
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {dbAnnouncements.length === 0 ? (
                    <div className="col-span-2 bg-white rounded-xl border border-slate-200 py-12 text-center text-slate-400">
                      <Bell className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                      No announcements yet
                    </div>
                  ) : (
                    dbAnnouncements.map(ann => (
                      <motion.div
                        key={ann.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            {ann.isPinned && <Star className="w-4 h-4 text-amber-500 fill-amber-500" />}
                            <h4 className="font-bold text-slate-800">{ann.title}</h4>
                          </div>
                          <span className="text-[9px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-bold">
                            {ann.department}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-3 leading-relaxed">{ann.content}</p>
                        <div className="flex justify-between items-center mt-4 pt-3 border-t border-slate-100">
                          <span className="text-[9px] text-slate-400">by {ann.createdBy?.split('@')[0]}</span>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => openEditAnnouncementModal(ann)}
                              className="text-slate-400 hover:text-indigo-600 text-xs font-semibold"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteAnnouncement(ann.id, ann.title)}
                              className="text-slate-400 hover:text-rose-500 text-xs font-semibold"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
            {/* 9. PAYOUTS (Admin only) */}
            {activeMenuTab === 'payouts' && role === 'admin' && (
              <motion.div
                key="payouts"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Prize Payouts</h2>
                    <p className="text-xs text-slate-500 mt-1">Process delegate awards and cash prizes</p>
                  </div>
                  <button
                    onClick={() => setShowPayoutModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all"
                  >
                    <Award className="w-3.5 h-3.5" /> New Payout
                  </button>
                </div>

                <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto">
                    <Table className="w-full text-left border-collapse text-sm">
                      <TableHeader>
                        <TableRow className="bg-slate-50/30 border-b border-slate-200/60 text-slate-500 uppercase text-[9px] tracking-wider">
                          <TableHead className="py-3 px-4">Recipient</TableHead>
                          <TableHead className="py-3 px-4">Award</TableHead>
                          <TableHead className="py-3 px-4 text-right">Amount</TableHead>
                          <TableHead className="py-3 px-4">Bank Account</TableHead>
                          <TableHead className="py-3 px-4 text-center">Status</TableHead>
                          <TableHead className="py-3 px-4 text-center">Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-slate-100">
                        {dbPayouts.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-12 text-slate-400">No payouts processed yet</TableCell>
                          </TableRow>
                        ) : (
                          dbPayouts.map(p => (
                            <TableRow key={p.id} className="hover:bg-slate-50/50 transition-all">
                              <TableCell className="py-3 px-4">
                                <span className="font-semibold text-slate-800">{p.name}</span>
                                <span className="block text-[10px] text-slate-400">{p.bankName}</span>
                              </TableCell>
                              <TableCell className="py-3 px-4 text-slate-600">{p.award}</TableCell>
                              <TableCell className="py-3 px-4 text-right font-bold text-emerald-600">{formatINR(p.amount)}</TableCell>
                              <TableCell className="py-3 px-4 font-mono text-xs text-slate-500">{p.accountNumber}</TableCell>
                              <TableCell className="py-3 px-4 text-center">
                                <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-700">
                                  {p.status}
                                </span>
                              </TableCell>
                              <TableCell className="py-3 px-4 text-center text-slate-500 text-xs">{new Date(p.timestamp).toLocaleDateString()}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Prize Tracking Section */}
                <div className="mt-12">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 tracking-tight">Cash Prize Tracking</h2>
                      <p className="text-xs text-slate-500 mt-1">Generate tracking codes for delegates to check their prize status</p>
                    </div>
                    <button
                      onClick={() => setShowPrizeTrackingModal(true)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" /> Generate Tracking Code
                    </button>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200/80 overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <Table className="w-full text-left border-collapse text-sm">
                        <TableHeader>
                          <TableRow className="bg-slate-50/30 border-b border-slate-200/60 text-slate-500 uppercase text-[9px] tracking-wider">
                            <TableHead className="py-3 px-4">Tracking ID</TableHead>
                            <TableHead className="py-3 px-4">Beneficiary</TableHead>
                            <TableHead className="py-3 px-4">Award</TableHead>
                            <TableHead className="py-3 px-4 text-right">Amount</TableHead>
                            <TableHead className="py-3 px-4 text-center">Status</TableHead>
                            <TableHead className="py-3 px-4 text-center">Generated Date</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-slate-100">
                          {dbPrizeTracking.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-12 text-slate-400">No tracking codes generated yet</TableCell>
                            </TableRow>
                          ) : (
                            dbPrizeTracking.map(t => (
                              <TableRow key={t.id} className="hover:bg-slate-50/50 transition-all">
                                <TableCell className="py-3 px-4 font-mono font-bold text-indigo-600">{t.id}</TableCell>
                                <TableCell className="py-3 px-4 font-semibold text-slate-800">{t.beneficiary}</TableCell>
                                <TableCell className="py-3 px-4 text-slate-600">{t.award}</TableCell>
                                <TableCell className="py-3 px-4 text-right font-bold text-emerald-600">{formatINR(t.amount)}</TableCell>
                                <TableCell className="py-3 px-4 text-center">
                                  <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${t.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' : t.status === 'Failed' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                                    {t.status}
                                  </span>
                                </TableCell>
                                <TableCell className="py-3 px-4 text-center text-slate-500 text-xs">{new Date(t.createdAt).toLocaleDateString()}</TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </div>

                {/* Payout Modal */}
                {showPayoutModal && (
                  <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
                    >
                      <div className="flex justify-between items-center pb-4 border-b">
                        <span className="text-sm font-bold text-slate-800">Initiate Payout</span>
                        <button onClick={() => setShowPayoutModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                      </div>
                      {payoutStatus !== 'idle' ? (
                        <div className="py-10 text-center">
                          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
                          <p className="text-xs font-semibold text-slate-600">
                            {payoutStatus === 'verifying' ? 'Verifying bank details...' : 'Processing payment...'}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4 mt-4">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Select Delegate</label>
                            <select
                              value={payoutDelegateId}
                              onChange={(e) => setPayoutDelegateId(e.target.value)}
                              className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm outline-none"
                              required
                            >
                              <option value="">-- Select Recipient --</option>
                              {dbDelegates.map(d => (
                                <option key={d.id} value={d.id}>{d.name} ({d.institution})</option>
                              ))}
                            </select>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Award</label>
                              <select
                                value={payoutAward}
                                onChange={(e) => setPayoutAward(e.target.value)}
                                className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm outline-none"
                              >
                                <option>Best Delegate</option>
                                <option>High Commendation</option>
                                <option>Special Mention</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Amount (INR)</label>
                              <input
                                type="number"
                                value={payoutAmount || ''}
                                onChange={(e) => setPayoutAmount(Number(e.target.value))}
                                className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm outline-none"
                                required
                              />
                            </div>
                          </div>
                          <div className="bg-slate-50 rounded-xl p-3 space-y-2">
                            <p className="text-[9px] font-bold text-slate-400 uppercase">Bank Details</p>
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="text"
                                placeholder="Bank Name"
                                value={payoutBank.bankName}
                                onChange={(e) => setPayoutBank(prev => ({ ...prev, bankName: e.target.value }))}
                                className="bg-white border rounded-lg px-2 py-1.5 text-xs outline-none"
                              />
                              <input
                                type="text"
                                placeholder="Account Holder"
                                value={payoutBank.name}
                                onChange={(e) => setPayoutBank(prev => ({ ...prev, name: e.target.value }))}
                                className="bg-white border rounded-lg px-2 py-1.5 text-xs outline-none"
                              />
                              <input
                                type="text"
                                placeholder="Account Number"
                                value={payoutBank.accountNumber}
                                onChange={(e) => setPayoutBank(prev => ({ ...prev, accountNumber: e.target.value }))}
                                className="bg-white border rounded-lg px-2 py-1.5 text-xs outline-none"
                              />
                              <input
                                type="text"
                                placeholder="IFSC Code"
                                value={payoutBank.ifscCode}
                                onChange={(e) => setPayoutBank(prev => ({ ...prev, ifscCode: e.target.value }))}
                                className="bg-white border rounded-lg px-2 py-1.5 text-xs outline-none"
                              />
                            </div>
                          </div>
                          <button
                            onClick={handleInitiatePayoutSim}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-all"
                          >
                            Process Payment
                          </button>
                        </div>
                      )}
                    </motion.div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Prize Tracking Modal */}
            {showPrizeTrackingModal && (
              <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
                >
                  <div className="flex justify-between items-center pb-4 border-b">
                    <span className="text-sm font-bold text-slate-800">Generate Prize Tracking Code</span>
                    <button onClick={() => setShowPrizeTrackingModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                  </div>
                  <form onSubmit={handleCreatePrizeTracking} className="space-y-4 mt-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Beneficiary Name</label>
                      <input
                        type="text"
                        value={newPrizeTracking.beneficiary}
                        onChange={(e) => setNewPrizeTracking(prev => ({ ...prev, beneficiary: e.target.value }))}
                        className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm outline-none"
                        required
                        placeholder="John Doe"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Award / Description</label>
                      <input
                        type="text"
                        value={newPrizeTracking.award}
                        onChange={(e) => setNewPrizeTracking(prev => ({ ...prev, award: e.target.value }))}
                        className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm outline-none"
                        required
                        placeholder="Best Delegate - UNGA"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Amount (INR)</label>
                        <input
                          type="number"
                          value={newPrizeTracking.amount || ''}
                          onChange={(e) => setNewPrizeTracking(prev => ({ ...prev, amount: Number(e.target.value) }))}
                          className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm outline-none"
                          required
                          placeholder="5000"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Status</label>
                        <select
                          value={newPrizeTracking.status}
                          onChange={(e) => setNewPrizeTracking(prev => ({ ...prev, status: e.target.value }))}
                          className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm outline-none"
                        >
                          <option value="Processing">Processing</option>
                          <option value="Completed">Completed</option>
                          <option value="Failed">Failed</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Transaction Ref / Remarks (Optional)</label>
                      <input
                        type="text"
                        value={newPrizeTracking.transactionRef}
                        onChange={(e) => setNewPrizeTracking(prev => ({ ...prev, transactionRef: e.target.value }))}
                        className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm outline-none"
                        placeholder="Txn ID or notes"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-all"
                    >
                      Generate Tracking Code
                    </button>
                  </form>
                </motion.div>
              </div>
            )}

            {/* 10. COUPONS (Admin only) */}
            {activeMenuTab === 'coupons' && role === 'admin' && (
              <motion.div
                key="coupons"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight">Coupon Engine</h2>
                    <p className="text-xs text-slate-500 mt-1">Manage discount campaigns and partner codes</p>
                  </div>
                  <button
                    onClick={() => setShowCouponModal(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all"
                  >
                    <Ticket className="w-3.5 h-3.5" /> Create Coupon
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {dbCoupons.map(coupon => (
                    <motion.div
                      key={coupon.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="font-mono bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-bold">
                          {coupon.code}
                        </span>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${coupon.isUsed ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                          {coupon.isUsed ? 'Used' : 'Active'}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm">{coupon.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-1">{coupon.description}</p>
                      <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
                        <span className="text-lg font-black text-indigo-600">{coupon.discount}</span>
                        <span className="text-[9px] text-slate-400">Expires: {coupon.expiry}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Coupon Modal */}
                {showCouponModal && (
                  <div className="fixed inset-0 bg-slate-900/40 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.9, opacity: 0 }}
                      className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl"
                    >
                      <div className="flex justify-between items-center pb-4 border-b">
                        <span className="text-sm font-bold text-slate-800">Create Coupon</span>
                        <button onClick={() => setShowCouponModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                      </div>
                      <form onSubmit={handleCreateCoupon} className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Code</label>
                            <input
                              type="text"
                              value={newCoupon.code}
                              onChange={(e) => setNewCoupon(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                              className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm outline-none font-mono"
                              placeholder="SAVE20"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Title</label>
                            <input
                              type="text"
                              value={newCoupon.title}
                              onChange={(e) => setNewCoupon(prev => ({ ...prev, title: e.target.value }))}
                              className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm outline-none"
                              placeholder="20% Off"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Description</label>
                          <input
                            type="text"
                            value={newCoupon.description}
                            onChange={(e) => setNewCoupon(prev => ({ ...prev, description: e.target.value }))}
                            className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm outline-none"
                            placeholder="Discount for campus ambassadors"
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Discount</label>
                            <input
                              type="text"
                              value={newCoupon.discount}
                              onChange={(e) => setNewCoupon(prev => ({ ...prev, discount: e.target.value }))}
                              className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm outline-none"
                              placeholder="20% off"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Expiry Date</label>
                            <input
                              type="date"
                              value={newCoupon.expiry}
                              onChange={(e) => setNewCoupon(prev => ({ ...prev, expiry: e.target.value }))}
                              className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm outline-none"
                              required
                            />
                          </div>
                        </div>
                        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-all">
                          Create Coupon
                        </button>
                      </form>
                    </motion.div>
                  </div>
                )}
              </motion.div>
            )}

            {/* 11. REGISTRY MANAGER (Admin only) */}
            {activeMenuTab === 'registry_manager' && role === 'admin' && (
              <motion.div
                key="registry_manager"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                      <Sliders className="w-5 h-5 text-indigo-600" />
                      Registry Manager
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">Manage database records for committees, country portfolios, and EB members</p>
                  </div>
                  <div className="flex gap-2">
                    {selectedRegistryCommitteeId && (
                      <button
                        onClick={() => setSelectedRegistryCommitteeId(null)}
                        className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer"
                      >
                        ← Back to Committees
                      </button>
                    )}
                    {!selectedRegistryCommitteeId ? (
                      <button
                        onClick={() => {
                          setEditingDbCommittee(null)
                          setDbCommitteeForm({ id: '', name: '', description: '', category: 'Premium Single', topics: '', backgroundGuide: '', rules: '', studyGuide: '', image: '', target: 30, fee: 1000 })
                          setShowDbCommitteeModal(true)
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Committee
                      </button>
                    ) : (
                      registryTab === 'portfolios' ? (
                        <button
                          onClick={() => {
                            setEditingDbPortfolio(null)
                            setDbPortfolioForm({ id: '', country: '', countryCode: '', isDoubleDelAllowed: false, isVacant: true, minExperience: 0, email: '' })
                            setShowDbPortfolioModal(true)
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Portfolio
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingDbEb(null)
                            setDbEbForm({ id: '', name: '', role: 'Chairperson', email: '', photourl: '', instagram: '', bio: '' })
                            setShowDbEbModal(true)
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-xs"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add EB Member
                        </button>
                      )
                    )}
                  </div>
                </div>

                {/* Sub-sections rendering */}
                {!selectedRegistryCommitteeId ? (
                  /* --- 1. COMMITTEES LISTING --- */
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                    <div className="p-4 bg-slate-50/50 border-b border-slate-200/60 flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Database Committees ({dbCommittees.length})</span>
                      <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search committees..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full bg-slate-50 border rounded-xl pl-9 pr-4 py-1.5 text-xs outline-none"
                        />
                      </div>
                    </div>
                    <div className="overflow-x-auto">
                      <Table className="w-full text-left border-collapse text-xs">
                        <TableHeader>
                          <TableRow className="bg-slate-50/30 border-b border-slate-200/60 text-slate-500 uppercase text-[9px] tracking-wider">
                            <TableHead className="py-3 px-4 font-bold">ID / Slug</TableHead>
                            <TableHead className="py-3 px-4 font-bold">Classification</TableHead>
                            <TableHead className="py-3 px-4 font-bold">Committee Name</TableHead>
                            <TableHead className="py-3 px-4 text-center">Portfolios</TableHead>
                            <TableHead className="py-3 px-4 text-center">EB Members</TableHead>
                            <TableHead className="py-3 px-4 text-center">Guides</TableHead>
                            <TableHead className="py-3 px-4 text-center">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-slate-100">
                          {dbCommittees
                            .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.id.toLowerCase().includes(searchQuery.toLowerCase()))
                            .map(c => {
                              const portfoliosCount = c.portfolios ? c.portfolios.length : 0
                              const ebCount = c.eb ? Object.keys(c.eb).length : 0
                              return (
                                <TableRow key={c.id} className="hover:bg-indigo-50/20 transition-all group">
                                  <TableCell className="py-3.5 px-4 text-slate-500 font-mono font-bold">{c.id}</TableCell>
                                  <TableCell className="py-3.5 px-4">
                                    <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 text-[9px] font-bold">
                                      {c.category}
                                    </span>
                                  </TableCell>
                                  <TableCell className="py-3.5 px-4 font-semibold text-slate-800 text-sm">{c.name}</TableCell>
                                  <TableCell className="py-3.5 px-4 text-center">
                                    <button
                                      onClick={() => {
                                        setSelectedRegistryCommitteeId(c.id)
                                        setRegistryTab('portfolios')
                                      }}
                                      className="font-bold text-indigo-600 hover:underline cursor-pointer"
                                    >
                                      {portfoliosCount} slots
                                    </button>
                                  </TableCell>
                                  <TableCell className="py-3.5 px-4 text-center">
                                    <button
                                      onClick={() => {
                                        setSelectedRegistryCommitteeId(c.id)
                                        setRegistryTab('eb')
                                      }}
                                      className="font-bold text-amber-600 hover:underline cursor-pointer"
                                    >
                                      {ebCount} members
                                    </button>
                                  </TableCell>
                                  <TableCell className="py-3.5 px-4">
                                    <div className="flex justify-center gap-1.5">
                                      {c.backgroundGuide ? (
                                        <a href={c.backgroundGuide} target="_blank" rel="noopener noreferrer" className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-medium hover:bg-slate-200">
                                          BG
                                        </a>
                                      ) : <span className="text-slate-300 text-[9px]">-</span>}
                                      {c.rules ? (
                                        <a href={c.rules} target="_blank" rel="noopener noreferrer" className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded text-[9px] font-medium hover:bg-slate-200">
                                          Rules
                                        </a>
                                      ) : null}
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-3.5 px-4">
                                    <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        onClick={() => {
                                          setEditingDbCommittee(c)
                                          setDbCommitteeForm({
                                            id: c.id,
                                            name: c.name,
                                            description: c.description || '',
                                            category: c.category || '',
                                            topics: c.topics ? (Array.isArray(c.topics) ? c.topics.join(', ') : Object.values(c.topics).join(', ')) : '',
                                            backgroundGuide: c.backgroundGuide || '',
                                            rules: c.rules || '',
                                            studyGuide: c.studyGuide || '',
                                            image: c.image || '',
                                            target: c.target || 30,
                                            fee: c.fee || 1000
                                          })
                                          setShowDbCommitteeModal(true)
                                        }}
                                        className="p-1.5 bg-white border border-slate-200 text-slate-650 hover:bg-indigo-50 hover:border-indigo-300 rounded-lg transition-all cursor-pointer"
                                        title="Edit Committee"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => setDeleteConfirm({ type: 'db_committees', id: c.id, name: c.name })}
                                        className="p-1.5 bg-white border border-slate-200 text-slate-500 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 rounded-lg transition-all cursor-pointer"
                                        title="Delete Committee"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  /* --- 2. DRILL-DOWN SUB-TAB (PORTFOLIOS & EB) --- */
                  <div className="space-y-4">
                    {/* Committee Summary Banner */}
                    {(() => {
                      const comm = dbCommittees.find(c => c.id === selectedRegistryCommitteeId)
                      if (!comm) return null
                      return (
                        <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-sm relative overflow-hidden">
                          <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
                          <div className="relative z-10 flex flex-col md:flex-row justify-between md:items-center gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="bg-indigo-600 text-indigo-100 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider">{comm.id}</span>
                                <span className="text-slate-450 text-xs font-semibold">{comm.category}</span>
                              </div>
                              <h3 className="text-xl font-bold mt-1 text-white">{comm.name}</h3>
                              {comm.description && <p className="text-slate-300 text-xs mt-1.5 max-w-2xl">{comm.description}</p>}
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <button
                                onClick={() => {
                                  setEditingDbCommittee(comm)
                                  setDbCommitteeForm({
                                    id: comm.id,
                                    name: comm.name,
                                    description: comm.description || '',
                                    category: comm.category || '',
                                    topics: comm.topics ? (Array.isArray(comm.topics) ? comm.topics.join(', ') : Object.values(comm.topics).join(', ')) : '',
                                    backgroundGuide: comm.backgroundGuide || '',
                                    rules: comm.rules || '',
                                    studyGuide: comm.studyGuide || '',
                                    image: comm.image || '',
                                    target: comm.target || 30,
                                    fee: comm.fee || 1000
                                  })
                                  setShowDbCommitteeModal(true)
                                }}
                                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-indigo-400" /> Edit Committee
                              </button>
                            </div>
                          </div>
                        </div>
                      )
                    })()}

                    {/* Sub-tab navigation */}
                    <div className="flex border-b border-slate-200">
                      <button
                        onClick={() => setRegistryTab('portfolios')}
                        className={`py-3 px-6 text-sm font-bold border-b-2 transition-all cursor-pointer ${registryTab === 'portfolios'
                          ? 'border-indigo-600 text-indigo-600'
                          : 'border-transparent text-slate-500 hover:text-slate-850'
                          }`}
                      >
                        Portfolios Registry
                      </button>
                      <button
                        onClick={() => setRegistryTab('eb')}
                        className={`py-3 px-6 text-sm font-bold border-b-2 transition-all cursor-pointer ${registryTab === 'eb'
                          ? 'border-indigo-600 text-indigo-600'
                          : 'border-transparent text-slate-500 hover:text-slate-850'
                          }`}
                      >
                        Executive Board (EB)
                      </button>
                    </div>

                    {/* --- PORTFOLIOS LIST --- */}
                    {registryTab === 'portfolios' && (
                      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                        {(() => {
                          const comm = dbCommittees.find(c => c.id === selectedRegistryCommitteeId)
                          const portfolios = comm?.portfolios || []
                          return (
                            <>
                              <div className="p-4 bg-slate-50/50 border-b border-slate-200/60 flex items-center justify-between">
                                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Portfolios ({portfolios.length})</span>
                                <div className="relative w-64">
                                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                                  <input
                                    type="text"
                                    placeholder="Search portfolios..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full bg-slate-50 border rounded-xl pl-9 pr-4 py-1.5 text-xs outline-none"
                                  />
                                </div>
                              </div>
                              <div className="overflow-x-auto">
                                <Table className="w-full text-left border-collapse text-xs">
                                  <TableHeader>
                                    <TableRow className="bg-slate-50/30 border-b border-slate-200/60 text-slate-500 uppercase text-[9px] tracking-wider">
                                      <TableHead className="py-3 px-4 font-bold">Portfolio ID / Slug</TableHead>
                                      <TableHead className="py-3 px-4 font-bold">Country / Position</TableHead>
                                      <TableHead className="py-3 px-4 text-center">Flag</TableHead>
                                      <TableHead className="py-3 px-4 text-center">Double Delegate</TableHead>
                                      <TableHead className="py-3 px-4 text-center">Vacancy</TableHead>
                                      <TableHead className="py-3 px-4 text-center">Min Experience</TableHead>
                                      <TableHead className="py-3 px-4">Assigned Email</TableHead>
                                      <TableHead className="py-3 px-4 text-center">Actions</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody className="divide-y divide-slate-100">
                                    {portfolios.length === 0 ? (
                                      <TableRow>
                                        <TableCell colSpan={8} className="py-8 text-center text-slate-400">No portfolios registered for this committee. Click "Add Portfolio" to create one.</TableCell>
                                      </TableRow>
                                    ) : (
                                      portfolios
                                        .filter((p: any) => p.country.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.toLowerCase().includes(searchQuery.toLowerCase()))
                                        .map((p: any) => (
                                          <TableRow key={p.id} className="hover:bg-slate-50/50 transition-all group">
                                            <TableCell className="py-3 px-4 text-slate-500 font-mono font-bold">{p.id}</TableCell>
                                            <TableCell className="py-3 px-4 font-semibold text-slate-800">{p.country}</TableCell>
                                            <TableCell className="py-3 px-4 text-center font-mono text-slate-650">{p.countryCode || '-'}</TableCell>
                                            <TableCell className="py-3 px-4 text-center">
                                              <span className={`inline-block w-2.5 h-2.5 rounded-full ${p.isDoubleDelAllowed ? 'bg-indigo-500' : 'bg-slate-200'}`} title={p.isDoubleDelAllowed ? 'Allowed' : 'Single Only'} />
                                            </TableCell>
                                            <TableCell className="py-3 px-4 text-center">
                                              <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold ${p.isVacant ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                                                {p.isVacant ? 'Vacant' : 'Allocated'}
                                              </span>
                                            </TableCell>
                                            <TableCell className="py-3 px-4 text-center font-bold">{p.minExperience || 0} MUNs</TableCell>
                                            <TableCell className="py-3 px-4 font-mono text-slate-600 text-[11px]">{p.email || <span className="text-slate-300 italic">none</span>}</TableCell>
                                            <TableCell className="py-3 px-4">
                                              <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                  onClick={() => {
                                                    setEditingDbPortfolio(p)
                                                    setDbPortfolioForm({
                                                      id: p.id,
                                                      country: p.country,
                                                      countryCode: p.countryCode || '',
                                                      isDoubleDelAllowed: p.isDoubleDelAllowed || false,
                                                      isVacant: p.isVacant !== undefined ? p.isVacant : true,
                                                      minExperience: p.minExperience || 0,
                                                      email: p.email || ''
                                                    })
                                                    setShowDbPortfolioModal(true)
                                                  }}
                                                  className="p-1.5 bg-white border border-slate-200 text-slate-650 hover:bg-indigo-50 hover:border-indigo-300 rounded-lg transition-all cursor-pointer"
                                                >
                                                  <Edit2 className="w-3.5 h-3.5" />
                                                </button>
                                                <button
                                                  onClick={() => setDeleteConfirm({ type: 'db_portfolios', id: selectedRegistryCommitteeId, name: p.country, subId: p.id })}
                                                  className="p-1.5 bg-white border border-slate-200 text-slate-500 hover:bg-rose-50 hover:border-rose-200 hover:text-rose-600 rounded-lg transition-all cursor-pointer"
                                                >
                                                  <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                              </div>
                                            </TableCell>
                                          </TableRow>
                                        ))
                                    )}
                                  </TableBody>
                                </Table>
                              </div>
                            </>
                          )
                        })()}
                      </div>
                    )}

                    {/* --- EB MEMBERS LIST --- */}
                    {registryTab === 'eb' && (
                      <div className="space-y-4">
                        {(() => {
                          const comm = dbCommittees.find(c => c.id === selectedRegistryCommitteeId)
                          const ebMembers = comm?.eb ? Object.keys(comm.eb).map(key => ({ id: key, ...comm.eb[key] })) : []

                          if (ebMembers.length === 0) {
                            return (
                              <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-slate-400">
                                No Executive Board members registered for this committee. Click "Add EB Member" to create one.
                              </div>
                            )
                          }

                          return (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                              {ebMembers.map(member => (
                                <motion.div
                                  key={member.id}
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex gap-4 relative group"
                                >
                                  {/* Profile Photo */}
                                  <div className="w-16 h-16 rounded-full border border-slate-200 overflow-hidden shrink-0 bg-slate-50 flex items-center justify-center">
                                    {member.photourl ? (
                                      <img src={member.photourl} alt={member.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <User className="w-8 h-8 text-slate-350" />
                                    )}
                                  </div>

                                  {/* Info */}
                                  <div className="space-y-1 min-w-0 flex-1">
                                    <h4 className="font-bold text-slate-800 text-sm truncate">{member.name}</h4>
                                    <p className="text-indigo-650 font-bold text-[10px] uppercase tracking-wider">{member.role}</p>
                                    <p className="text-[11px] text-slate-500 font-mono truncate">{member.email}</p>
                                    {member.instagram && (
                                      <p className="text-[10px] text-slate-450 flex items-center gap-1 font-medium mt-1">
                                        <Globe className="w-3 h-3 text-slate-400" /> @{member.instagram}
                                      </p>
                                    )}
                                    {member.bio && (
                                      <p className="text-[11px] text-slate-500 line-clamp-2 mt-2 italic border-t pt-1.5 border-slate-100">
                                        "{member.bio}"
                                      </p>
                                    )}
                                  </div>

                                  {/* Actions */}
                                  <div className="absolute right-3 top-3 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                      onClick={() => {
                                        setEditingDbEb(member)
                                        setDbEbForm({
                                          id: member.id,
                                          name: member.name,
                                          role: member.role || 'Chairperson',
                                          email: member.email || '',
                                          photourl: member.photourl || '',
                                          instagram: member.instagram || '',
                                          bio: member.bio || ''
                                        })
                                        setShowDbEbModal(true)
                                      }}
                                      className="p-1 bg-white border border-slate-200 text-slate-650 hover:bg-slate-50 hover:text-indigo-600 rounded-md transition-all cursor-pointer shadow-xs"
                                    >
                                      <Edit2 className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => setDeleteConfirm({ type: 'db_eb', id: selectedRegistryCommitteeId, name: member.name, subId: member.id })}
                                      className="p-1 bg-white border border-slate-200 text-slate-505 hover:bg-rose-50 hover:text-rose-600 rounded-md transition-all cursor-pointer shadow-xs"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                          )
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* DeleOs Tab */}
            {activeMenuTab === 'delegate_search' && (
              <motion.div
                key="delegate_search"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-[#1C2434] tracking-tight">DelOs Delegate Directory</h2>
                    <p className="text-xs text-[#64748B] mt-1">
                      Search active registrations and legacy conference database archives. Contact information is masked to respect privacy guidelines.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-white border border-[#E2E8F0] px-3 py-1.5 rounded-[4px] text-[#64748B] font-bold shadow-sm">
                      Total Session Records: <strong className="text-[#3C50E0]">{dbDelegates.length}</strong>
                    </span>
                    <span className="text-[10px] bg-white border border-[#E2E8F0] px-3 py-1.5 rounded-[4px] text-[#64748B] font-bold shadow-sm">
                      Checked-In Turnout: <strong className="text-[#10B981]">{dbDelegates.filter(d => d.isCheckedIn).length}</strong>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Search & Results List */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white border border-[#E2E8F0] p-5 rounded-md shadow-sm space-y-4">
                      <div>
                        <span className="text-[#64748B] text-[10px] font-bold uppercase tracking-wider block mb-2">Search by Name, Email, or Phone</span>
                        <div className="relative">
                          <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#8A99AD]" />
                          <input
                            type="text"
                            placeholder="Search delegates by name, email, or phone number..."
                            value={searchQueryDele}
                            onChange={(e) => { setSearchQueryDele(e.target.value); setSelectedDele(null); }}
                            className="w-full pl-10 pr-12 py-2.5 rounded-md border border-[#E2E8F0] bg-white text-[#1C2434] placeholder-[#8A99AD] text-xs focus:outline-none focus:ring-2 focus:ring-[#3C50E0]/10 focus:border-[#3C50E0]"
                          />
                          {loadingSupabase && (
                            <div className="absolute right-3.5 top-3 flex items-center justify-center">
                              <Loader2 className="w-4 h-4 text-[#3C50E0] animate-spin" />
                            </div>
                          )}
                        </div>
                      </div>

                      {(() => {
                        const maskEmail = (email: string) => {
                          if (!email || !email.includes('@')) return '***@***.***'
                          const [local, domain] = email.split('@')
                          if (local.length <= 2) return `${local[0]}***@${domain}`
                          return `${local[0]}${'*'.repeat(Math.min(5, local.length - 2))}${local[local.length - 1]}@${domain}`
                        }
                        const maskPhone = (phone: string) => {
                          if (!phone) return '**********'
                          const clean = phone.trim()
                          if (clean.length <= 4) return '******' + clean
                          return clean.slice(0, -4).replace(/\d/g, '*') + clean.slice(-4)
                        }

                        const localFiltered = dbDelegates.filter(d => {
                          const query = searchQueryDele.toLowerCase().trim()
                          if (!query) return true

                          const comm = dbCommittees.find(c => c.id === d.committeeId)
                          const commName = comm ? comm.name.toLowerCase() : ''
                          const port = comm?.portfolios?.find(p => p.id === d.portfolioId)
                          const portName = port ? port.country.toLowerCase() : ''

                          return (
                            d.name.toLowerCase().includes(query) ||
                            d.id.toLowerCase().includes(query) ||
                            d.institution.toLowerCase().includes(query) ||
                            d.course.toLowerCase().includes(query) ||
                            commName.includes(query) ||
                            portName.includes(query) ||
                            (d.email && d.email.toLowerCase().includes(query)) ||
                            (d.phone && d.phone.includes(query))
                          )
                        }).map(d => {
                          const comm = dbCommittees.find(c => c.id === d.committeeId)
                          const commName = comm ? comm.name : 'Unallocated'
                          const port = comm?.portfolios?.find(p => p.id === d.portfolioId)
                          const portName = port ? port.country : 'Unallocated'

                          const isBlacklisted = !!dbBlacklisted[d.id] || !!dbBlacklisted[`${d.id}_delegate1`] || !!dbBlacklisted[`${d.id}_delegate2`]

                          return {
                            uniqueId: `fb-${d.id}`,
                            sourceType: 'firebase',
                            displayId: d.id,
                            displayName: d.name,
                            displayInstitution: d.institution || 'N/A',
                            displayCommittee: commName,
                            displayPortfolio: portName,
                            displayEmail: d.email,
                            displayPhone: d.phone,
                            displayPayment: isBlacklisted ? 'Blacklisted' : (d.paymentStatus || 'pending'),
                            displayStatus: isBlacklisted ? 'Banned' : (d.isCheckedIn ? 'Checked-In' : 'Pending'),
                            displayExperience: d.experience || '0 (Active Session)',
                            displayVettingStatus: isBlacklisted ? 'BLACKLISTED - ACTIVE BAN' : 'Active Delegate - Cleared',
                            displayPreviousAllotments: 'No archive history (Current session only)'
                          }
                        })

                        const supabaseFiltered = supabaseDelegates.map(d => {
                          const isBlacklisted = d.is_blacklisted || (d.ban_status && d.ban_status.toLowerCase() !== 'none')
                          return {
                            uniqueId: `sb-${d.id}`,
                            sourceType: 'supabase',
                            displayId: d.booking_code || `LEG-${d.id}`,
                            displayName: d.full_name,
                            displayInstitution: d.institution || 'N/A',
                            displayCommittee: d.committee || 'N/A',
                            displayPortfolio: d.portfolio || 'N/A',
                            displayEmail: d.email,
                            displayPhone: d.phone,
                            displayPayment: isBlacklisted ? 'Blacklisted' : `Paid (KIMUN ${d.year})`,
                            displayStatus: isBlacklisted ? 'Banned' : 'Completed',
                            displayExperience: d.number_of_mun_attended !== null ? `${d.number_of_mun_attended} MUNs` : 'N/A',
                            displayVettingStatus: isBlacklisted ? `BLACKLISTED: ${d.ban_reason || 'No Reason'} (${d.ban_year || 'N/A'})` : 'Cleared (No Blacklist History)',
                            displayPreviousAllotments: `${d.committee || 'N/A'} / ${d.portfolio || 'N/A'} (KIMUN ${d.year})`
                          }
                        })

                        const combined = [...localFiltered, ...supabaseFiltered]

                        if (!searchQueryDele.trim()) {
                          return (
                            <div className="border border-[#E2E8F0] p-8 rounded-md text-center text-[#64748B] bg-[#F7F9FC]">
                              <Search className="w-7 h-7 text-[#AEB7C0] mx-auto mb-2 opacity-60" />
                              <p className="text-xs font-semibold">Search delegate registry above</p>
                              <p className="text-[10px] text-[#AEB7C0] mt-1 max-w-[240px] mx-auto">
                                Type a name, email or phone coordinates. Results will sync and map active registrations with our archives.
                              </p>
                            </div>
                          )
                        }

                        if (combined.length === 0) {
                          return (
                            <div className="border border-[#E2E8F0] p-8 rounded-md text-center text-[#64748B] bg-[#F7F9FC]">
                              No matching delegates found.
                            </div>
                          )
                        }

                        return (
                          <div className="overflow-x-auto rounded-md border border-[#E2E8F0]">
                            <Table className="w-full text-left border-collapse text-xs">
                              <TableHeader>
                                <TableRow className="bg-[#F7F9FC] border-b border-[#E2E8F0] text-[#64748B] uppercase text-[9px] tracking-wider font-bold">
                                  <TableHead className="py-2.5 px-3">Source</TableHead>
                                  <TableHead className="py-2.5 px-3">Name</TableHead>
                                  <TableHead className="py-2.5 px-3">School/College</TableHead>
                                  <TableHead className="py-2.5 px-3">Status</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody className="divide-y divide-[#E2E8F0]">
                                {combined.map(d => {
                                  const isBanned = d.displayStatus.toLowerCase().includes('ban') || d.displayPayment.toLowerCase().includes('black')
                                  const isSelected = selectedDele?.uniqueId === d.uniqueId
                                  return (
                                    <TableRow
                                      key={d.uniqueId}
                                      onClick={() => setSelectedDele(d)}
                                      className={`cursor-pointer transition-all border-b border-[#E2E8F0] ${isSelected
                                        ? 'bg-[#3C50E0]/5 font-semibold text-[#3C50E0]'
                                        : 'hover:bg-slate-50 text-[#1C2434]'
                                        }`}
                                    >
                                      <TableCell className="py-2.5 px-3">
                                        <span className={`inline-block px-1.5 py-0.5 rounded-[3px] text-[8px] font-bold ${d.sourceType === 'firebase'
                                          ? 'bg-[#3C50E0]/10 text-[#3C50E0]'
                                          : 'bg-[#bf5af2]/10 text-[#bf5af2]'
                                          }`}>
                                          {d.sourceType === 'firebase' ? 'Live' : 'Legacy'}
                                        </span>
                                      </TableCell>
                                      <TableCell className="py-2.5 px-3 truncate max-w-[120px] font-medium">{d.displayName}</TableCell>
                                      <TableCell className="py-2.5 px-3 truncate max-w-[150px] text-[#64748B]">{d.displayInstitution}</TableCell>
                                      <TableCell className="py-2.5 px-3">
                                        <span className={`inline-block w-2.5 h-2.5 rounded-full ${isBanned ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                                      </TableCell>
                                    </TableRow>
                                  )
                                })}
                              </TableBody>
                            </Table>
                          </div>
                        )
                      })()}
                    </div>
                  </div>

                  {/* Right Column: Delegate Detail Pane */}
                  <div>
                    <div className="bg-white border border-[#E2E8F0] p-5 rounded-md shadow-sm space-y-4">
                      {selectedDele ? (
                        (() => {
                          const maskEmail = (email: string) => {
                            if (!email || !email.includes('@')) return '***@***.***'
                            const [local, domain] = email.split('@')
                            if (local.length <= 2) return `${local[0]}***@${domain}`
                            return `${local[local.length - 1] ? local[0] + '*'.repeat(Math.min(5, local.length - 2)) + local[local.length - 1] : local[0] + '***'}@${domain}`
                          }
                          const maskPhone = (phone: string) => {
                            if (!phone) return '**********'
                            const clean = phone.trim()
                            if (clean.length <= 4) return '******' + clean
                            return clean.slice(0, -4).replace(/\d/g, '*') + clean.slice(-4)
                          }
                          const isBanned = selectedDele.displayStatus.toLowerCase().includes('ban') || selectedDele.displayPayment.toLowerCase().includes('black')

                          return (
                            <div className="space-y-4">
                              <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2.5">
                                <h3 className="font-bold text-[#1C2434] text-xs uppercase tracking-wider">Delegate Record Details</h3>
                                <button onClick={() => setSelectedDele(null)} className="p-1 rounded hover:bg-slate-100 text-[#64748B] hover:text-[#1C2434] cursor-pointer">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>

                              <div className="space-y-3.5 text-xs text-[#1C2434]">
                                <div>
                                  <span className="text-[#64748B] text-[10px] uppercase font-bold block">Delegate Name</span>
                                  <span className="font-extrabold text-sm text-[#1C2434]">{selectedDele.displayName.toUpperCase()}</span>
                                </div>
                                <div>
                                  <span className="text-[#64748B] text-[10px] uppercase font-bold block">Registration ID / Booking Code</span>
                                  <span className="font-mono text-[#64748B]">{selectedDele.displayId.toUpperCase()}</span>
                                </div>
                                <div>
                                  <span className="text-[#64748B] text-[10px] uppercase font-bold block">Registry Source</span>
                                  <span className={`inline-block px-2 py-0.5 rounded-[4px] text-[9px] font-bold ${selectedDele.sourceType === 'firebase'
                                    ? 'bg-[#3C50E0]/10 text-[#3C50E0] border border-[#3C50E0]/20'
                                    : 'bg-[#bf5af2]/10 text-[#bf5af2] border border-[#bf5af2]/20'
                                    }`}>
                                    {selectedDele.sourceType === 'firebase' ? 'Active Registry' : 'Legacy Archives'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-[#64748B] text-[10px] uppercase font-bold block">School / College</span>
                                  <span className="font-medium text-[#1C2434]">{selectedDele.displayInstitution}</span>
                                </div>
                                <div>
                                  <span className="text-[#64748B] text-[10px] uppercase font-bold block">MUN Experience</span>
                                  <span className="font-medium text-[#1C2434]">{selectedDele.displayExperience}</span>
                                </div>
                                <div>
                                  <span className="text-[#64748B] text-[10px] uppercase font-bold block">Previous Allotment</span>
                                  <span className="text-amber-600 font-semibold">{selectedDele.displayPreviousAllotments}</span>
                                </div>
                                <div>
                                  <span className="text-[#64748B] text-[10px] uppercase font-bold block">Current Allocation</span>
                                  <span className="font-semibold text-[#3C50E0]">{selectedDele.displayCommittee} / {selectedDele.displayPortfolio}</span>
                                </div>
                                <div>
                                  <span className="text-[#64748B] text-[10px] uppercase font-bold block">Phone Number (Masked)</span>
                                  <span className="font-mono text-[#64748B]">{maskPhone(selectedDele.displayPhone)}</span>
                                </div>
                                <div>
                                  <span className="text-[#64748B] text-[10px] uppercase font-bold block">Email Address (Masked)</span>
                                  <span className="font-mono text-[#64748B] block truncate" title={maskEmail(selectedDele.displayEmail)}>{maskEmail(selectedDele.displayEmail)}</span>
                                </div>
                                <div className="border-t border-[#E2E8F0] pt-3">
                                  <span className="text-[#64748B] text-[10px] uppercase font-bold block mb-1">Status / Vetting Check</span>
                                  <div className={`px-3 py-2 rounded-md font-semibold text-[11px] border ${isBanned
                                    ? 'bg-rose-50 text-rose-700 border-rose-100'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                    }`}>
                                    {selectedDele.displayVettingStatus}
                                  </div>
                                </div>
                              </div>

                              <div className="pt-2 space-y-2">
                                <button
                                  onClick={() => handleGenerateIDCard(selectedDele)}
                                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] rounded-[4px] transition-colors border-none uppercase font-bold cursor-pointer"
                                >
                                  <QrCode className="w-3.5 h-3.5" /> Generate ID Card
                                </button>
                                <button
                                  onClick={() => handleDownloadCitationPDF(selectedDele)}
                                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#3C50E0] hover:bg-[#2B3EB2] text-white text-[11px] rounded-[4px] transition-colors border-none uppercase font-bold cursor-pointer"
                                >
                                  <Download className="w-3.5 h-3.5" /> Download Delegate Record (PDF)
                                </button>
                                {isBanned ? (
                                  <button
                                    onClick={() => handleRemoveBlacklistDelegate(selectedDele)}
                                    className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 text-[#1C2434] text-[11px] rounded-[4px] transition-colors border border-slate-200 uppercase font-bold cursor-pointer"
                                  >
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Remove Blacklist
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleBlacklistDelegate(selectedDele)}
                                    className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-[11px] rounded-[4px] transition-colors border border-rose-200 uppercase font-bold cursor-pointer"
                                  >
                                    <Ban className="w-3.5 h-3.5" /> Blacklist Delegate
                                  </button>
                                )}
                              </div>
                            </div>
                          )
                        })()
                      ) : (
                        <div className="py-12 text-center text-[#64748B] space-y-2">
                          <Info className="w-8 h-8 text-[#AEB7C0] mx-auto opacity-70" />
                          <p className="text-xs font-semibold">No Delegate Selected</p>
                          <p className="text-[11px] text-[#AEB7C0] max-w-[200px] mx-auto">
                            Select a delegate from the search results to view their vetting sheet and MUN experience file.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Schedule Builder (Admin only) */}
            {activeMenuTab === 'schedule_builder' && role === 'admin' && (
              <motion.div
                key="schedule_builder"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6 max-w-5xl mx-auto pb-20"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-[#1C2434]">Conference Schedule Builder</h2>
                    <p className="text-[#64748B] text-sm mt-1">Design and manage the day-by-day event schedule that appears in the delegate portal.</p>
                  </div>
                  <Button
                    onClick={() => {
                      const newId = `day_${Date.now()}`;
                      const newSchedule = [...dbSchedule, { id: newId, day: `Day ${dbSchedule.length + 1}`, date: '', events: [] }];
                      set(ref(firebaseDb, 'schedule'), newSchedule);
                      triggerNotification('New day added to schedule.');
                    }}
                    className="bg-[#3C50E0] hover:bg-[#2B3EB2] text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" /> Add Day
                  </Button>
                </div>

                <div className="space-y-6">
                  {dbSchedule.map((day, dayIndex) => (
                    <div key={day.id} className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
                      <div className="p-4 border-b border-[#E2E8F0] bg-[#F8FAFC] flex justify-between items-center">
                        <div className="flex gap-4 items-center w-full max-w-2xl">
                          <input
                            type="text"
                            className="font-bold text-lg bg-transparent border-b border-transparent hover:border-[#E2E8F0] focus:border-[#3C50E0] focus:outline-none transition-colors px-1 py-0.5"
                            value={day.day}
                            onChange={(e) => {
                              const newSchedule = [...dbSchedule];
                              newSchedule[dayIndex].day = e.target.value;
                              set(ref(firebaseDb, 'schedule'), newSchedule);
                            }}
                            placeholder="e.g. Day 1"
                          />
                          <input
                            type="text"
                            className="text-sm text-[#64748B] bg-transparent border-b border-transparent hover:border-[#E2E8F0] focus:border-[#3C50E0] focus:outline-none transition-colors px-1 py-0.5 w-48"
                            value={day.date}
                            onChange={(e) => {
                              const newSchedule = [...dbSchedule];
                              newSchedule[dayIndex].date = e.target.value;
                              set(ref(firebaseDb, 'schedule'), newSchedule);
                            }}
                            placeholder="e.g. 10th July 2026"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newId = `event_${Date.now()}`;
                              const newSchedule = [...dbSchedule];
                              if (!newSchedule[dayIndex].events) newSchedule[dayIndex].events = [];
                              newSchedule[dayIndex].events.push({ id: newId, time: '', title: 'New Event', description: '', location: '' });
                              set(ref(firebaseDb, 'schedule'), newSchedule);
                            }}
                            className="text-[#3C50E0] hover:bg-indigo-50"
                          >
                            <PlusCircle className="w-4 h-4 mr-1" /> Event
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              const newSchedule = dbSchedule.filter((_, i) => i !== dayIndex);
                              set(ref(firebaseDb, 'schedule'), newSchedule);
                            }}
                            className="text-[#D34053] hover:bg-rose-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="p-4 space-y-3">
                        {(!day.events || day.events.length === 0) ? (
                          <div className="text-center py-6 text-[#64748B] text-sm italic bg-[#F1F5F9] rounded-lg">No events scheduled for this day.</div>
                        ) : (
                          day.events.map((event: any, eventIndex: number) => (
                            <div key={event.id} className="flex gap-3 items-start group p-3 hover:bg-[#F8FAFC] rounded-lg border border-transparent hover:border-[#E2E8F0] transition-all">
                              <div className="flex flex-col gap-1 w-32 shrink-0">
                                <input
                                  type="text"
                                  value={event.time}
                                  onChange={(e) => {
                                    const newSchedule = [...dbSchedule];
                                    newSchedule[dayIndex].events[eventIndex].time = e.target.value;
                                    set(ref(firebaseDb, 'schedule'), newSchedule);
                                  }}
                                  className="text-xs font-bold bg-white border border-[#E2E8F0] rounded px-2 py-1.5 focus:border-[#3C50E0] focus:outline-none"
                                  placeholder="09:00 AM"
                                />
                              </div>
                              <div className="flex-1 space-y-2">
                                <input
                                  type="text"
                                  value={event.title}
                                  onChange={(e) => {
                                    const newSchedule = [...dbSchedule];
                                    newSchedule[dayIndex].events[eventIndex].title = e.target.value;
                                    set(ref(firebaseDb, 'schedule'), newSchedule);
                                  }}
                                  className="w-full font-semibold text-sm bg-white border border-[#E2E8F0] rounded px-3 py-1.5 focus:border-[#3C50E0] focus:outline-none"
                                  placeholder="Event Title"
                                />
                                <input
                                  type="text"
                                  value={event.description}
                                  onChange={(e) => {
                                    const newSchedule = [...dbSchedule];
                                    newSchedule[dayIndex].events[eventIndex].description = e.target.value;
                                    set(ref(firebaseDb, 'schedule'), newSchedule);
                                  }}
                                  className="w-full text-xs text-[#64748B] bg-white border border-[#E2E8F0] rounded px-3 py-1.5 focus:border-[#3C50E0] focus:outline-none"
                                  placeholder="Short description (optional)"
                                />
                                <div className="flex items-center gap-2">
                                  <MapPin className="w-3 h-3 text-[#64748B]" />
                                  <input
                                    type="text"
                                    value={event.location}
                                    onChange={(e) => {
                                      const newSchedule = [...dbSchedule];
                                      newSchedule[dayIndex].events[eventIndex].location = e.target.value;
                                      set(ref(firebaseDb, 'schedule'), newSchedule);
                                    }}
                                    className="flex-1 text-xs text-[#64748B] bg-transparent border-b border-transparent hover:border-[#E2E8F0] focus:border-[#3C50E0] focus:outline-none px-1"
                                    placeholder="Location (e.g., Main Hall)"
                                  />
                                </div>
                              </div>
                              <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-[#64748B] hover:text-[#D34053] hover:bg-rose-50"
                                  onClick={() => {
                                    const newSchedule = [...dbSchedule];
                                    newSchedule[dayIndex].events = newSchedule[dayIndex].events.filter((_: any, i: number) => i !== eventIndex);
                                    set(ref(firebaseDb, 'schedule'), newSchedule);
                                  }}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-[#64748B] hover:text-[#3C50E0]"
                                  onClick={() => {
                                    if (eventIndex > 0) {
                                      const newSchedule = [...dbSchedule];
                                      const temp = newSchedule[dayIndex].events[eventIndex];
                                      newSchedule[dayIndex].events[eventIndex] = newSchedule[dayIndex].events[eventIndex - 1];
                                      newSchedule[dayIndex].events[eventIndex - 1] = temp;
                                      set(ref(firebaseDb, 'schedule'), newSchedule);
                                    }
                                  }}
                                  disabled={eventIndex === 0}
                                >
                                  <ChevronUp className="w-4 h-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-[#64748B] hover:text-[#3C50E0]"
                                  onClick={() => {
                                    if (eventIndex < day.events.length - 1) {
                                      const newSchedule = [...dbSchedule];
                                      const temp = newSchedule[dayIndex].events[eventIndex];
                                      newSchedule[dayIndex].events[eventIndex] = newSchedule[dayIndex].events[eventIndex + 1];
                                      newSchedule[dayIndex].events[eventIndex + 1] = temp;
                                      set(ref(firebaseDb, 'schedule'), newSchedule);
                                    }
                                  }}
                                  disabled={eventIndex === day.events.length - 1}
                                >
                                  <ChevronDown className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                  {dbSchedule.length === 0 && (
                    <div className="text-center py-16 bg-white rounded-xl border border-dashed border-[#E2E8F0]">
                      <Calendar className="w-12 h-12 text-[#AEB7C0] mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-[#1C2434]">No Schedule Found</h3>
                      <p className="text-[#64748B] text-sm mt-1 mb-4">Create your first conference day to get started.</p>
                      <Button onClick={() => {
                        const newId = `day_${Date.now()}`;
                        const newSchedule = [{ id: newId, day: 'Day 1', date: '', events: [] }];
                        set(ref(firebaseDb, 'schedule'), newSchedule);
                      }} className="bg-[#3C50E0] text-white hover:bg-[#2B3EB2]">
                        <Plus className="w-4 h-4 mr-2" /> Add Day 1
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Transport Logistics (Admin only) */}
            {activeMenuTab === 'transport_logistics' && role === 'admin' && (
              <motion.div
                key="transport_logistics"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6 max-w-5xl mx-auto pb-20"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold text-[#1C2434]">Transport & Logistics</h2>
                    <p className="text-[#64748B] text-sm mt-1">Manage transport routes and track delegate opt-ins.</p>
                  </div>
                  <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-lg border border-[#E2E8F0] shadow-sm">
                    <span className="text-sm font-semibold text-[#1C2434]">Enable Transport Module</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only peer"
                        checked={dbSiteSettings?.transport?.enabled || false}
                        onChange={(e) => {
                          const newSettings = { ...dbSiteSettings, transport: { ...(dbSiteSettings.transport || {}), enabled: e.target.checked } };
                          set(ref(firebaseDb, 'site_settings'), newSettings);
                          triggerNotification(`Transport module ${e.target.checked ? 'enabled' : 'disabled'}.`);
                        }}
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#10B981]"></div>
                    </label>
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
                  <div className="p-5 border-b border-[#E2E8F0] flex justify-between items-center">
                    <h3 className="font-bold text-[#1C2434] flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-[#3C50E0]" />
                      Transport Routes & Fees
                    </h3>
                    <Button
                      size="sm"
                      onClick={() => {
                        const newRoute = { id: `route_${Date.now()}`, name: 'New Route', fee: 500, description: 'Pickup details' };
                        const routes = dbSiteSettings?.transport?.routes || [];
                        const newSettings = { ...dbSiteSettings, transport: { ...(dbSiteSettings.transport || {}), routes: [...routes, newRoute] } };
                        set(ref(firebaseDb, 'site_settings'), newSettings);
                      }}
                      className="bg-[#3C50E0] hover:bg-[#2B3EB2] text-white"
                    >
                      <Plus className="w-4 h-4 mr-1" /> Add Route
                    </Button>
                  </div>
                  <div className="p-0">
                    <Table className="w-full text-left border-collapse">
                      <TableHeader>
                        <TableRow className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-bold text-[#64748B] uppercase tracking-wider">
                          <TableHead className="px-5 py-3">Route Name</TableHead>
                          <TableHead className="px-5 py-3">Description / Pickups</TableHead>
                          <TableHead className="px-5 py-3">Fee (INR)</TableHead>
                          <TableHead className="px-5 py-3 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(dbSiteSettings?.transport?.routes || []).map((route: any, index: number) => (
                          <TableRow key={route.id} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC]">
                            <TableCell className="px-5 py-3">
                              <input
                                type="text"
                                value={route.name}
                                onChange={(e) => {
                                  const routes = [...dbSiteSettings.transport.routes];
                                  routes[index].name = e.target.value;
                                  set(ref(firebaseDb, 'site_settings'), { ...dbSiteSettings, transport: { ...dbSiteSettings.transport, routes } });
                                }}
                                className="w-full bg-transparent border-b border-transparent hover:border-[#E2E8F0] focus:border-[#3C50E0] focus:outline-none font-medium"
                              />
                            </TableCell>
                            <TableCell className="px-5 py-3">
                              <input
                                type="text"
                                value={route.description}
                                onChange={(e) => {
                                  const routes = [...dbSiteSettings.transport.routes];
                                  routes[index].description = e.target.value;
                                  set(ref(firebaseDb, 'site_settings'), { ...dbSiteSettings, transport: { ...dbSiteSettings.transport, routes } });
                                }}
                                className="w-full bg-transparent border-b border-transparent hover:border-[#E2E8F0] focus:border-[#3C50E0] focus:outline-none text-sm text-[#64748B]"
                              />
                            </TableCell>
                            <TableCell className="px-5 py-3">
                              <div className="flex items-center gap-1">
                                <span className="text-[#64748B]">₹</span>
                                <input
                                  type="number"
                                  value={route.fee}
                                  onChange={(e) => {
                                    const routes = [...dbSiteSettings.transport.routes];
                                    routes[index].fee = Number(e.target.value);
                                    set(ref(firebaseDb, 'site_settings'), { ...dbSiteSettings, transport: { ...dbSiteSettings.transport, routes } });
                                  }}
                                  className="w-20 bg-transparent border-b border-transparent hover:border-[#E2E8F0] focus:border-[#3C50E0] focus:outline-none font-medium"
                                />
                              </div>
                            </TableCell>
                            <TableCell className="px-5 py-3 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  const routes = dbSiteSettings.transport.routes.filter((r: any) => r.id !== route.id);
                                  set(ref(firebaseDb, 'site_settings'), { ...dbSiteSettings, transport: { ...dbSiteSettings.transport, routes } });
                                }}
                                className="text-[#D34053] hover:bg-rose-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                        {(!dbSiteSettings?.transport?.routes || dbSiteSettings.transport.routes.length === 0) && (
                          <TableRow>
                            <TableCell colSpan={4} className="px-5 py-8 text-center text-[#64748B] italic text-sm">
                              No routes configured yet. Add a route to start offering transport to delegates.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>

                {/* Transport Opt-ins Table */}
                <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden mt-6">
                  <div className="p-5 border-b border-[#E2E8F0]">
                    <h3 className="font-bold text-[#1C2434] flex items-center gap-2">
                      <Users className="w-5 h-5 text-[#3C50E0]" />
                      Delegate Transport Roster
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <Table className="w-full text-left border-collapse">
                      <TableHeader>
                        <TableRow className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-xs font-bold text-[#64748B] uppercase tracking-wider">
                          <TableHead className="px-5 py-3">Delegate</TableHead>
                          <TableHead className="px-5 py-3">Route</TableHead>
                          <TableHead className="px-5 py-3">Fee</TableHead>
                          <TableHead className="px-5 py-3">Payment Status</TableHead>
                          <TableHead className="px-5 py-3 text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {dbDelegates.filter(d => d.transportOptIn).length > 0 ? (
                          dbDelegates.filter(d => d.transportOptIn).map((delegate, idx) => {
                            const routeInfo = dbSiteSettings?.transport?.routes?.find((r: any) => r.id === delegate.transportOptIn.routeId);
                            return (
                              <TableRow key={idx} className="border-b border-[#E2E8F0] hover:bg-[#F8FAFC]">
                                <TableCell className="px-5 py-3">
                                  <div className="font-semibold text-sm text-[#1C2434]">{delegate.name}</div>
                                  <div className="text-xs text-[#64748B]">{delegate.id.split('_')[0].substring(0, 8)}</div>
                                </TableCell>
                                <TableCell className="px-5 py-3 text-sm text-[#64748B]">{routeInfo?.name || 'Unknown Route'}</TableCell>
                                <TableCell className="px-5 py-3 text-sm font-medium">₹{delegate.transportOptIn.fee}</TableCell>
                                <TableCell className="px-5 py-3">
                                  <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-md ${delegate.transportOptIn.status === 'paid' ? 'bg-[#10B981]/10 text-[#10B981]' : 'bg-[#F2994A]/10 text-[#F2994A]'}`}>
                                    {delegate.transportOptIn.status || 'Pending'}
                                  </span>
                                </TableCell>
                                <TableCell className="px-5 py-3 text-right">
                                  {delegate.transportOptIn.status !== 'paid' && (
                                    <Button
                                      size="sm"
                                      onClick={() => {
                                        const updatePath = `registrations/${delegate.regId}/transportOptIn/status`;
                                        update(ref(firebaseDb), { [updatePath]: 'paid' }).then(() => {
                                          triggerNotification('Transport fee marked as paid.');
                                        });
                                      }}
                                      className="bg-[#10B981] hover:bg-[#059669] text-white text-xs h-8"
                                    >
                                      Mark Paid
                                    </Button>
                                  )}
                                  {delegate.transportOptIn.status === 'paid' && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const updatePath = `registrations/${delegate.regId}/transportOptIn/status`;
                                        update(ref(firebaseDb), { [updatePath]: 'pending' }).then(() => {
                                          triggerNotification('Transport fee reverted to pending.');
                                        });
                                      }}
                                      className="text-[#64748B] hover:text-[#D34053] text-xs h-8"
                                    >
                                      Revert
                                    </Button>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={5} className="px-5 py-8 text-center text-[#64748B] italic text-sm">
                              No delegates have opted for transport yet.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Activity Logs (Admin only) */}
            {activeMenuTab === 'site_settings' && role === 'admin' && (
              <motion.div
                key="site_settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="space-y-6 max-w-4xl mx-auto pb-20"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-[#1C2434] tracking-tight">Global Site Configuration</h1>
                    <p className="text-sm text-[#AEB7C0] mt-1">Manage maintenance mode, registration phases, and event details.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Maintenance & Security */}
                  <div className="bg-white rounded-[10px] shadow-sm border border-[#E2E8F0] overflow-hidden">
                    <div className="px-6 py-4 border-b border-[#E2E8F0] bg-slate-50 flex items-center gap-3">
                      <Shield className="w-5 h-5 text-indigo-600" />
                      <h3 className="text-md font-bold text-slate-800">Security & Access</h3>
                    </div>
                    <div className="p-6 space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-800">Maintenance Mode</h4>
                          <p className="text-xs text-slate-500">Brings down the landing page with a maintenance message.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={dbSiteSettings?.maintenanceEnabled || false} onChange={(e) => {
                            update(ref(firebaseDb, 'site_settings'), { maintenanceEnabled: e.target.checked })
                            triggerNotification('Maintenance mode updated')
                          }} />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm font-semibold text-slate-800">Lock Marks Entry</h4>
                          <p className="text-xs text-slate-500">Prevents EBs from adding or editing marks.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={dbSiteSettings?.marksEntryLocked || false} onChange={(e) => {
                            update(ref(firebaseDb, 'site_settings'), { marksEntryLocked: e.target.checked })
                            triggerNotification('Marks entry lock updated')
                          }} />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                      </div>

                      <div>
                        <h4 className="text-sm font-semibold text-slate-800 mb-2">Registration Mode</h4>
                        <select
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          value={dbSiteSettings?.registrationMode || 'Auto'}
                          onChange={(e) => {
                            update(ref(firebaseDb, 'site_settings'), { registrationMode: e.target.value })
                            triggerNotification('Registration mode updated')
                          }}
                        >
                          <option value="Auto">Auto (Date-based)</option>
                          <option value="Phase 1">Force: Phase 1</option>
                          <option value="Phase 2">Force: Phase 2</option>
                          <option value="Final Phase">Force: Final Phase</option>
                          <option value="Closed">Force: Closed</option>
                        </select>
                        <p className="text-xs text-slate-500 mt-2">Override the automatic date-based phase logic.</p>
                      </div>
                    </div>
                  </div>

                  {/* Site Info */}
                  <div className="bg-white rounded-[10px] shadow-sm border border-[#E2E8F0] overflow-hidden">
                    <div className="px-6 py-4 border-b border-[#E2E8F0] bg-slate-50 flex items-center gap-3">
                      <Globe className="w-5 h-5 text-indigo-600" />
                      <h3 className="text-md font-bold text-slate-800">Event Information</h3>
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Event Date</label>
                        <input type="text" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm" value={dbSiteSettings?.eventDate || ''} onChange={(e) => update(ref(firebaseDb, 'site_settings'), { eventDate: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Event Duration</label>
                        <input type="text" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm" value={dbSiteSettings?.eventDuration || ''} onChange={(e) => update(ref(firebaseDb, 'site_settings'), { eventDuration: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Event Venue</label>
                        <input type="text" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm" value={dbSiteSettings?.eventVenue || ''} onChange={(e) => update(ref(firebaseDb, 'site_settings'), { eventVenue: e.target.value })} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">Attendance Target</label>
                        <input type="text" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-md text-sm" value={dbSiteSettings?.attendanceTarget || ''} onChange={(e) => update(ref(firebaseDb, 'site_settings'), { attendanceTarget: e.target.value })} />
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
            {activeMenuTab === 'logs' && role === 'admin' && (
              <motion.div
                key="logs"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">System Activity Logs</h2>
                    <p className="text-xs text-slate-505 mt-1">Audit trail for all administrative actions.</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                  <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                    <Table className="w-full text-left border-collapse text-xs relative">
                      <TableHeader className="sticky top-0 bg-slate-50 z-10 shadow-sm border-b border-slate-200 text-slate-500 uppercase text-[9px] tracking-wider font-semibold">
                        <TableRow>
                          <TableHead className="py-3 px-4">Timestamp</TableHead>
                          <TableHead className="py-3 px-4">User</TableHead>
                          <TableHead className="py-3 px-4">Action Type</TableHead>
                          <TableHead className="py-3 px-4">Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody className="divide-y divide-slate-100">
                        {dbActivityLogs.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center py-12 text-slate-400">No activity logs found.</TableCell>
                          </TableRow>
                        ) : (
                          dbActivityLogs.map(log => (
                            <TableRow key={log.id} className="hover:bg-slate-50 transition-all">
                              <TableCell className="py-3 px-4 text-slate-500 font-mono whitespace-nowrap">
                                {new Date(log.timestamp).toLocaleString()}
                              </TableCell>
                              <TableCell className="py-3 px-4 font-semibold text-slate-800">{log.userEmail}</TableCell>
                              <TableCell className="py-3 px-4">
                                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[9px] font-bold uppercase border border-slate-200">
                                  {log.actionType}
                                </span>
                              </TableCell>
                              <TableCell className="py-3 px-4 text-slate-600">{log.details}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Help & Documentation Tab */}
            {activeMenuTab === 'help_docs' && (
              <motion.div
                key="help_docs"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 tracking-tight">Oasis Help & Documentation</h2>
                    <p className="text-xs text-slate-505 mt-1">
                      Quickstart reference material, glossary details, and FAQs for operations and finance management.
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setTourStep(0); setActiveMenuTab('dashboard'); }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4.5 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-lg shadow-indigo-500/20 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Replay Guided Tour
                  </motion.button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Doc sidebar */}
                  <div className="lg:col-span-1 space-y-1">
                    {[
                      { id: 'quickstart', label: 'Quick Start Checklist', icon: ClipboardList },
                      { id: 'metrics', label: 'Metrics Glossary', icon: Activity },
                      { id: 'finance', label: 'Finance Simulator', icon: FileSpreadsheet },
                      { id: 'faq', label: 'Registry & Operations FAQ', icon: Shield },
                    ].map(tab => {
                      const Icon = tab.icon
                      const isSelected = docSubTab === tab.id
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setDocSubTab(tab.id as any)}
                          className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 cursor-pointer ${isSelected
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-100/60 shadow-xs'
                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                            }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{tab.label}</span>
                        </button>
                      )
                    })}
                  </div>

                  {/* Doc content */}
                  <div className="lg:col-span-3 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-4 min-h-[400px]">
                    {docSubTab === 'quickstart' && (
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                          <ClipboardList className="w-4 h-4 text-indigo-600" />
                          Operations Quickstart Roadmap
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Follow these standard operating steps to execute and audit conference data during the sessions:
                        </p>
                        <div className="space-y-3.5 pt-2">
                          {[
                            { step: '1', title: 'Onboard OC Members', text: 'Navigate to Onboarding Hub (admin only). Review registrations, approve candidates, and assign permissions.' },
                            { step: '2', title: 'Setup Committee Matrix', text: 'Go to Committee Management. Verify target quotas and configure country portfolios or Executive Board structures.' },
                            { step: '3', title: 'Perform Physical Check-ins', text: 'As delegates arrive at the venue, open the Registrations ledger, search their profile, and click Check-In to update check-in stats.' },
                            { step: '4', title: 'Grade Committee Evaluations', text: 'Executive Board members utilize the Resources tab to access marksheets and submit scorecards for evaluation grades.' },
                            { step: '5', title: 'Disburse Prizes & Payouts', text: 'Administrators process payouts in the Coupons & Payouts tabs to distribute merit awards and cash rebates.' }
                          ].map(item => (
                            <div key={item.step} className="flex gap-3 items-start">
                              <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                                {item.step}
                              </span>
                              <div>
                                <h4 className="text-xs font-bold text-slate-800">{item.title}</h4>
                                <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">{item.text}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {docSubTab === 'metrics' && (
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-indigo-600" />
                          Dashboard Metrics Glossary
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Understanding key performance indicator ratios inside the Oasis Workplace cockpit:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          {[
                            { name: 'Attendance Realization Rate', desc: 'The percentage of allocated targets that actually materialize at the check-in desk. Essential for modeling food and package logistics.' },
                            { name: 'Sponsorship Realization Rate', desc: 'Models corporate inflows. Scales down non-delegate sponsorship targets in the What-If simulation by the specified rate.' },
                            { name: 'Contingency Buffer', desc: 'An automatic markup (between 0% and 50%) applied to budgeted expenditures to account for emergency or unforeseen operational expenses.' },
                            { name: 'Break-Even Seats', desc: 'The number of paid registrations required to offset the event\'s total fixed overhead liabilities (convention hall, conventional light setups, EB allowances).' }
                          ].map((item, index) => (
                            <div key={index} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                              <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">{item.name}</span>
                              <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {docSubTab === 'finance' && (
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                          <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
                          Financial Forecasting Framework
                        </h3>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          The Financial Operations Workstation helps plan event finances. Here are the core formulas and toggles:
                        </p>
                        <div className="space-y-4 pt-2">
                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                            <span className="text-[10px] font-black uppercase text-slate-500">Break-Even Model Formula</span>
                            <div className="font-mono text-xs text-indigo-700 py-1.5">
                              Required Seats = Fixed Costs / (Average Seat Fee - Variable Cost per Delegate)
                            </div>
                            <p className="text-[10px] text-slate-500 leading-relaxed">
                              Variable costs represent kits, badges, and catering fees. Fixed costs represent venue hire and convention production.
                            </p>
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              No Sponsors Mode (Pure Delegate Funded Model)
                            </h4>
                            <p className="text-xs text-slate-500 leading-relaxed">
                              Enabling "No Sponsors Mode" dynamically filters out all corporate sponsorship agreements. This generates a conservative cashflow model verifying whether delegate registration fees alone are sufficient to cover operations.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {docSubTab === 'faq' && (
                      <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                          <Shield className="w-4 h-4 text-indigo-600" />
                          Oasis Operations FAQs
                        </h3>
                        <div className="space-y-3.5 divide-y divide-slate-100">
                          {[
                            { q: 'Who has privileges to synchronize Matrix metrics to the database?', a: 'Only administrators whose emails are registered under ADMIN_ALLOWED_EMAILS have permissions to sync configuration profiles to the cloud. OC members can edit workstation values locally to simulate models.' },
                            { q: 'How is physical delegate check-in logged?', a: 'Go to the Registrations ledger (live allocations), find the delegate name, and click the Check-In button. This stamps their profile as checked-in and marks their local check-in time.' },
                            { q: 'Why are contact email and phone details masked in DeleOs search?', a: 'To protect student delegate privacy, general operating committee members cannot view exact emails and phone numbers. This complies with security rules while allowing search validation.' },
                            { q: 'Can we configure new discount coupons?', a: 'Yes. Administrators can open the Coupons engine tab, set custom discount values, partner programs, and codes, and sync them immediately.' }
                          ].map((item, index) => (
                            <div key={index} className={`${index > 0 ? 'pt-3.5' : ''} space-y-1`}>
                              <h4 className="text-xs font-extrabold text-slate-800 flex items-start gap-1">
                                <span className="text-indigo-600 font-black">Q:</span>
                                <span>{item.q}</span>
                              </h4>
                              <p className="text-xs text-slate-500 leading-relaxed pl-3.5">{item.a}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Existing closing brace */}

          </AnimatePresence>
        </div>

        {/* Mobile Bottom Navigation Bar */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-md border-t border-slate-200 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <div className="flex justify-around items-center px-2 py-3">
            {[
              { id: 'dashboard', label: 'Home', icon: Activity },
              { id: 'live_allocations', label: 'Check-in', icon: UserCheck },
              { id: 'task_board', label: 'Tasks', icon: Layers },
              { id: 'settings', label: 'Menu', icon: Menu }
            ].map((item) => {
              const isSelected = activeMenuTab === item.id || (item.id === 'settings' && sidebarOpen);
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'settings') {
                      setSidebarOpen(true);
                    } else {
                      setActiveMenuTab(item.id as any);
                      setSidebarOpen(false);
                    }
                  }}
                  className={`flex flex-col items-center justify-center w-16 gap-1 transition-all ${isSelected ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <item.icon className={`w-5 h-5 ${isSelected ? 'stroke-[2.5px]' : 'stroke-2'}`} />
                  <span className={`text-[10px] font-medium ${isSelected ? 'font-bold' : ''}`}>{item.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </main>

      {/* Modals */}
      {/* 1. Real Database Committee Modal */}
      {showDbCommitteeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden my-8"
          >
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-white font-bold text-sm">{editingDbCommittee ? 'Edit Database Committee' : 'Add Database Committee'}</h2>
                <p className="text-indigo-200 text-xs mt-0.5">{editingDbCommittee ? `Editing slug: ${editingDbCommittee.id}` : 'Create a new committee track in Firebase'}</p>
              </div>
              <button onClick={() => setShowDbCommitteeModal(false)} className="text-indigo-200 hover:text-white transition-colors cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleSaveDbCommittee} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Committee ID / Slug</label>
                  <input
                    type="text"
                    value={dbCommitteeForm.id}
                    onChange={e => setDbCommitteeForm(p => ({ ...p, id: e.target.value }))}
                    placeholder="e.g. UNSC"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500 disabled:opacity-50 disabled:bg-slate-100 uppercase"
                    disabled={!!editingDbCommittee}
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Classification / Category</label>
                  <select
                    value={dbCommitteeForm.category}
                    onChange={e => setDbCommitteeForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500 cursor-pointer"
                    required
                  >
                    <option value="" disabled>Select Type</option>
                    <option value="General Assembly">General Assembly</option>
                    <option value="Specialized">Specialized</option>
                    <option value="Crisis">Crisis</option>
                    <option value="Premium Single">Premium Single</option>
                    <option value="Double Delegation">Double Delegation</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Committee Name</label>
                <input
                  type="text"
                  value={dbCommitteeForm.name}
                  onChange={e => setDbCommitteeForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. United Nations Security Council"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Agenda Topics (Comma-separated)</label>
                <textarea
                  value={dbCommitteeForm.topics}
                  onChange={e => setDbCommitteeForm(p => ({ ...p, topics: e.target.value }))}
                  placeholder="e.g. Cyber Warfare threats, Militarization of Outer Space"
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {/* PDF Files and uploads */}
              <div className="space-y-3 pt-2 border-t border-slate-150">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Background Guide URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={dbCommitteeForm.backgroundGuide}
                      onChange={e => setDbCommitteeForm(p => ({ ...p, backgroundGuide: e.target.value }))}
                      placeholder="https://..."
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500"
                    />
                    <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold border border-slate-250 cursor-pointer flex items-center justify-center shrink-0">
                      Upload
                      <input type="file" accept="application/pdf" className="hidden" onChange={(e) => handleDbFileUpload(e, 'bg_guide')} disabled={isUploadingFile} />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Rules of Procedure URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={dbCommitteeForm.rules}
                      onChange={e => setDbCommitteeForm(p => ({ ...p, rules: e.target.value }))}
                      placeholder="https://..."
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500"
                    />
                    <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold border border-slate-250 cursor-pointer flex items-center justify-center shrink-0">
                      Upload
                      <input type="file" accept="application/pdf" className="hidden" onChange={(e) => handleDbFileUpload(e, 'rules')} disabled={isUploadingFile} />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Study Guide URL</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={dbCommitteeForm.studyGuide}
                      onChange={e => setDbCommitteeForm(p => ({ ...p, studyGuide: e.target.value }))}
                      placeholder="https://..."
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500"
                    />
                    <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold border border-slate-250 cursor-pointer flex items-center justify-center shrink-0">
                      Upload
                      <input type="file" accept="application/pdf" className="hidden" onChange={(e) => handleDbFileUpload(e, 'study_guide')} disabled={isUploadingFile} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Target Seats</label>
                  <input
                    type="number"
                    value={dbCommitteeForm.target}
                    onChange={e => setDbCommitteeForm(p => ({ ...p, target: Number(e.target.value) }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Delegate Fee (₹)</label>
                  <input
                    type="number"
                    value={dbCommitteeForm.fee}
                    onChange={e => setDbCommitteeForm(p => ({ ...p, fee: Number(e.target.value) }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Committee Cover Image</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={dbCommitteeForm.image}
                    onChange={e => setDbCommitteeForm(p => ({ ...p, image: e.target.value }))}
                    placeholder="https://..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                  />
                  <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold border border-slate-250 cursor-pointer flex items-center justify-center shrink-0">
                    Upload Photo
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleDbFileUpload(e, 'comm_photo')} disabled={isUploadingFile} />
                  </label>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Description / Bio</label>
                <textarea
                  value={dbCommitteeForm.description}
                  onChange={e => setDbCommitteeForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Provide a brief introductory description..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {isUploadingFile && (
                <div className="text-xs text-indigo-650 font-bold flex items-center gap-1.5 animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" /> Uploading document to Firebase Storage...
                </div>
              )}

              <button
                type="submit"
                disabled={isUploadingFile}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {editingDbCommittee ? 'Save Changes' : 'Create Committee'}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* 2. Real Database Portfolio Modal */}
      {showDbPortfolioModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-white font-bold text-sm">{editingDbPortfolio ? 'Edit Portfolio Slot' : 'Add Portfolio Slot'}</h2>
                <p className="text-indigo-200 text-xs mt-0.5">Register a country slot under committee {selectedRegistryCommitteeId}</p>
              </div>
              <button onClick={() => setShowDbPortfolioModal(false)} className="text-indigo-200 hover:text-white transition-colors cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleSaveDbPortfolio} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Portfolio ID / Slug</label>
                  <input
                    type="text"
                    value={dbPortfolioForm.id}
                    onChange={e => setDbPortfolioForm(p => ({ ...p, id: e.target.value }))}
                    placeholder="e.g. usa"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500 disabled:opacity-50 disabled:bg-slate-100"
                    disabled={!!editingDbPortfolio}
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Country Code (2-char flag)</label>
                  <input
                    type="text"
                    value={dbPortfolioForm.countryCode}
                    onChange={e => setDbPortfolioForm(p => ({ ...p, countryCode: e.target.value }))}
                    placeholder="e.g. US"
                    maxLength={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500 uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Country / Position Name</label>
                <input
                  type="text"
                  value={dbPortfolioForm.country}
                  onChange={e => setDbPortfolioForm(p => ({ ...p, country: e.target.value }))}
                  placeholder="e.g. United States of America"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Min Experience (MUNs)</label>
                  <input
                    type="number"
                    value={dbPortfolioForm.minExperience}
                    onChange={e => setDbPortfolioForm(p => ({ ...p, minExperience: Number(e.target.value) }))}
                    placeholder="e.g. 0"
                    min={0}
                    className="w-full bg-slate-50 border border-slate-250 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Assigned Delegate Email</label>
                  <input
                    type="email"
                    value={dbPortfolioForm.email}
                    onChange={e => setDbPortfolioForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="deleg@email.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 py-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-650 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dbPortfolioForm.isDoubleDelAllowed}
                    onChange={e => setDbPortfolioForm(p => ({ ...p, isDoubleDelAllowed: e.target.checked }))}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  Double Delegate Allowed
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-slate-650 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={dbPortfolioForm.isVacant}
                    onChange={e => setDbPortfolioForm(p => ({ ...p, isVacant: e.target.checked }))}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  Vacant Slot
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all cursor-pointer shadow-xs"
              >
                {editingDbPortfolio ? 'Save Changes' : 'Create Portfolio'}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* 3. Real Database EB Member Modal */}
      {showDbEbModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden my-8"
          >
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-white font-bold text-sm">{editingDbEb ? 'Edit EB Member' : 'Add EB Member'}</h2>
                <p className="text-indigo-200 text-xs mt-0.5">Configure Executive Board role under {selectedRegistryCommitteeId}</p>
              </div>
              <button onClick={() => setShowDbEbModal(false)} className="text-indigo-200 hover:text-white transition-colors cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleSaveDbEbMember} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">EB Member Name</label>
                  <input
                    type="text"
                    value={dbEbForm.name}
                    onChange={e => setDbEbForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. John Doe"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">EB Role / Designation</label>
                  <input
                    type="text"
                    value={dbEbForm.role}
                    onChange={e => setDbEbForm(p => ({ ...p, role: e.target.value }))}
                    placeholder="e.g. Chairperson"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Login Email (assigned)</label>
                  <input
                    type="email"
                    value={dbEbForm.email}
                    onChange={e => setDbEbForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="eb.member@kimun.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Instagram Handle</label>
                  <input
                    type="text"
                    value={dbEbForm.instagram}
                    onChange={e => setDbEbForm(p => ({ ...p, instagram: e.target.value }))}
                    placeholder="e.g. johndoe_mun"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Profile Photo URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={dbEbForm.photourl}
                    onChange={e => setDbEbForm(p => ({ ...p, photourl: e.target.value }))}
                    placeholder="https://..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500"
                  />
                  <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold border border-slate-250 cursor-pointer flex items-center justify-center shrink-0">
                    Upload
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleDbFileUpload(e, 'eb_photo')} disabled={isUploadingFile} />
                  </label>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Short Biography</label>
                <textarea
                  value={dbEbForm.bio}
                  onChange={e => setDbEbForm(p => ({ ...p, bio: e.target.value }))}
                  placeholder="Enter short bio describing their MUN credentials..."
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              {isUploadingFile && (
                <div className="text-xs text-indigo-650 font-bold flex items-center gap-1.5 animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-650" /> Uploading image to Firebase Storage...
                </div>
              )}

              <button
                type="submit"
                disabled={isUploadingFile}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all cursor-pointer shadow-xs disabled:opacity-50"
              >
                {editingDbEb ? 'Save Changes' : 'Create EB Member'}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Applicant Details Modal */}
      {showAppDetailsModal && selectedApplicant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col my-8 max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-700 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-white font-bold text-base">OC Application Vetting & Verification</h2>
                <p className="text-indigo-200 text-xs mt-0.5 font-medium">
                  Vetting: <span className="font-bold text-white">{selectedApplicant.name}</span> ({selectedApplicant.email})
                </p>
              </div>
              <button
                onClick={() => {
                  setShowAppDetailsModal(false)
                  setSelectedApplicant(null)
                }}
                className="text-indigo-200 hover:text-white transition-colors text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Left Column: OC Application Data */}
                <div className="space-y-6 border-r border-slate-100 pr-0 md:pr-6 text-left">
                  <div>
                    <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <User className="w-4 h-4" /> Application Details
                    </h3>
                    <div className="bg-slate-50 rounded-xl p-4 space-y-3 border border-slate-100">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-slate-400 block font-medium">Contact Phone</span>
                          <span className="font-bold text-slate-800">{selectedApplicant.phone || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Application Status</span>
                          <span className="font-bold text-slate-800 capitalize">{selectedApplicant.status}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-400 block font-medium">College/Institution</span>
                          <span className="font-bold text-slate-800">{selectedApplicant.college || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Course/Degree</span>
                          <span className="font-bold text-slate-800">{selectedApplicant.course || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Year of Study</span>
                          <span className="font-bold text-slate-800">{selectedApplicant.year || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">First Preference</span>
                          <span className="font-bold text-violet-700 bg-violet-50 px-2 py-0.5 rounded-md border border-violet-100">
                            {recruitmentView === 'eb' ? `${selectedApplicant.committeePref1} (${selectedApplicant.rolePref1})` : selectedApplicant.pref1 || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block font-medium">Second Preference</span>
                          <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                            {recruitmentView === 'eb' ? `${selectedApplicant.committeePref2} (${selectedApplicant.rolePref2})` : selectedApplicant.pref2 || 'N/A'}
                          </span>
                        </div>
                        <div className="col-span-2 pt-2 border-t border-slate-100">
                          <span className="text-slate-400 block font-medium mb-1">Assigned Unit (Overwrite)</span>
                          {recruitmentView === 'eb' ? (
                            <div className="flex gap-2">
                              <select
                                value={selectedApplicant.assignedCommittee || ''}
                                onChange={(e) => handleUpdateAssignment(selectedApplicant.uid, 'assignedCommittee', e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 outline-none"
                              >
                                <option value="">No Committee Assigned</option>
                                <option value="UNHRC">UNHRC</option>
                                <option value="UNSC">UNSC</option>
                                <option value="UNGA">UNGA</option>
                                <option value="AIPPM">AIPPM</option>
                                <option value="IPC">IPC</option>
                              </select>
                              <select
                                value={selectedApplicant.assignedRole || ''}
                                onChange={(e) => handleUpdateAssignment(selectedApplicant.uid, 'assignedRole', e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 outline-none"
                              >
                                <option value="">No Role Assigned</option>
                                <option value="Chairperson">Chairperson</option>
                                <option value="Vice Chairperson">Vice Chairperson</option>
                                <option value="Director">Director</option>
                                <option value="Rapporteur">Rapporteur</option>
                              </select>
                            </div>
                          ) : (
                            <select
                              value={selectedApplicant.pref1 || ''}
                              onChange={(e) => handleUpdateAssignment(selectedApplicant.uid, 'pref1', e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-700 outline-none"
                            >
                              <option value="" disabled>Select Primary Preference</option>
                              {DEPARTMENTS.slice(1).map(d => (
                                <option key={d.name} value={d.name}>{d.name}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AI Interview Results */}
                  {selectedApplicant.interviewCompleted && (
                    <div>
                      <h4 className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> AI Interview Evaluation
                      </h4>
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3.5 text-xs text-emerald-900 leading-relaxed space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold">AI Score:</span>
                          <span className="bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-md font-bold">{selectedApplicant.interviewScore}/10</span>
                        </div>
                        <div>
                          <span className="font-bold block mb-1">Feedback Summary:</span>
                          <p className="italic">"{selectedApplicant.interviewFeedback}"</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Prior Experience */}
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Prior Experience</h4>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-xs text-slate-700 max-h-32 overflow-y-auto leading-relaxed">
                      {selectedApplicant.experience ? (
                        <p className="whitespace-pre-line">{selectedApplicant.experience}</p>
                      ) : (
                        <span className="text-slate-400 italic">No prior experience listed.</span>
                      )}
                    </div>
                  </div>

                  {/* SOP */}
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Statement of Purpose</h4>
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 text-xs text-slate-700 max-h-32 overflow-y-auto leading-relaxed italic">
                      {selectedApplicant.statement ? (
                        <p className="whitespace-pre-line">"{selectedApplicant.statement}"</p>
                      ) : (
                        <span className="text-slate-400 italic">No statement of purpose submitted.</span>
                      )}
                    </div>
                  </div>

                  {/* Resume Link */}
                  {selectedApplicant.resume && (
                    <div className="flex items-center justify-between bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-indigo-600" />
                        <div>
                          <span className="text-xs font-bold text-slate-800">Resume/CV URL</span>
                          <span className="text-[10px] text-slate-500 block truncate max-w-[200px]">{selectedApplicant.resume}</span>
                        </div>
                      </div>
                      <a
                        href={selectedApplicant.resume}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] px-3.5 py-1.5 rounded-lg transition-all"
                      >
                        Open Link
                      </a>
                    </div>
                  )}

                  {/* Onboarding Documents & NDA Signed */}
                  <div>
                    <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" /> Onboarding & Verification Status
                    </h3>
                    <div className="bg-slate-50 rounded-xl p-4 space-y-3.5 border border-slate-100">
                      {/* Documents */}
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1.5">Submitted Documents</span>
                        {selectedApplicant.documents ? (
                          <div className="grid grid-cols-3 gap-2">
                            {selectedApplicant.documents.collegeId && (
                              <a
                                href={selectedApplicant.documents.collegeId}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-white border border-slate-200 hover:border-indigo-400 rounded-lg p-2 text-center text-[10px] font-bold text-indigo-600 truncate block transition-all"
                                title="College ID"
                              >
                                🆔 College ID
                              </a>
                            )}
                            {selectedApplicant.documents.aadhar && (
                              <a
                                href={selectedApplicant.documents.aadhar}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-white border border-slate-200 hover:border-indigo-400 rounded-lg p-2 text-center text-[10px] font-bold text-indigo-600 truncate block transition-all"
                                title="Aadhar Card"
                              >
                                💳 Aadhar Card
                              </a>
                            )}
                            {selectedApplicant.documents.photo && (
                              <a
                                href={selectedApplicant.documents.photo}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-white border border-slate-200 hover:border-indigo-400 rounded-lg p-2 text-center text-[10px] font-bold text-indigo-600 truncate block transition-all"
                                title="Passport Photo"
                              >
                                📷 Photo Image
                              </a>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 italic">No onboarding documents uploaded yet.</span>
                        )}
                        {selectedApplicant.documentsSubmittedAt && (
                          <span className="text-[9px] text-slate-400 block mt-1">Uploaded at: {new Date(selectedApplicant.documentsSubmittedAt).toLocaleString()}</span>
                        )}
                      </div>

                      {/* NDA Sign */}
                      <div className="border-t border-slate-200/60 pt-3 flex items-center justify-between text-xs">
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase block">NDA Contract</span>
                          <span className="font-semibold text-slate-700">
                            {selectedApplicant.signature ? 'Signed NDA' : 'Pending Signature'}
                          </span>
                        </div>
                        {selectedApplicant.signature && (
                          <div className="text-right">
                            <span className="text-[10px] font-bold text-slate-400 uppercase block">Signature Key</span>
                            <span className="font-mono text-[10px] bg-slate-200/60 px-1.5 py-0.5 rounded text-slate-600">{selectedApplicant.signature}</span>
                          </div>
                        )}
                      </div>
                      {selectedApplicant.contractSignedAt && (
                        <span className="text-[9px] text-slate-400 block">Signed at: {new Date(selectedApplicant.contractSignedAt).toLocaleString()}</span>
                      )}
                      {(selectedApplicant.status !== 'pending' && selectedApplicant.status !== 'rejected') && (
                        <button
                          type="button"
                          onClick={() => handleDownloadContractPDF(selectedApplicant)}
                          disabled={downloadingContract}
                          className="w-full mt-3 flex items-center justify-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] rounded-[4px] transition-colors border-none uppercase font-bold cursor-pointer disabled:opacity-50"
                        >
                          {downloadingContract ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Merging Proofs...
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" /> Download Contract PDF
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: Supabase Legacy Delegate Database Lookup */}
                <div className="space-y-6 text-left">
                  <div>
                    <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                      <Globe className="w-4 h-4" /> Supabase Legacy Check
                    </h3>

                    {fetchingLegacyProfile ? (
                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
                        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mb-2" />
                        <span className="text-xs font-semibold text-slate-500">Retrieving legacy delegate profile...</span>
                      </div>
                    ) : legacyProfileError ? (
                      <div className="bg-rose-50 border border-rose-100 text-rose-800 rounded-xl p-4 text-xs space-y-1">
                        <div className="font-bold flex items-center gap-1.5">
                          <AlertCircle className="w-4 h-4 text-rose-600" /> Error Loading Legacy Profile
                        </div>
                        <p>{legacyProfileError}</p>
                      </div>
                    ) : legacyProfile ? (
                      (() => {
                        const isPrimary = (legacyProfile.email?.toLowerCase() === selectedApplicant.email?.toLowerCase()) || (legacyProfile.phone === selectedApplicant.phone);
                        const isJoint = (legacyProfile.joint_delegate_email?.toLowerCase() === selectedApplicant.email?.toLowerCase()) || (legacyProfile.joint_delegate_phone === selectedApplicant.phone);

                        const isBlacklisted = legacyProfile.is_blacklisted || (legacyProfile.ban_status && legacyProfile.ban_status.toLowerCase() !== 'none');

                        return (
                          <div className="space-y-4">
                            {/* Success badge */}
                            <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl p-3.5 flex items-center gap-2.5">
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                              <div className="text-xs">
                                <span className="font-extrabold block">Legacy Delegate Found</span>
                                <span className="text-[10px] text-emerald-600/90 font-medium">
                                  Matched as {isPrimary ? 'Primary Delegate' : (isJoint ? 'Joint Delegate' : 'Delegate')}
                                </span>
                              </div>
                            </div>

                            {/* Blacklist banner */}
                            {isBlacklisted ? (
                              <div className="bg-rose-50 border border-rose-200 text-rose-900 rounded-xl p-4 space-y-2">
                                <div className="font-bold flex items-center gap-1.5 text-xs text-rose-700 uppercase tracking-wide">
                                  <Ban className="w-4 h-4 text-rose-600" /> Security Alert: Blacklisted / Banned
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-[11px] leading-snug">
                                  <div>
                                    <span className="text-rose-500 font-medium block">Ban Status</span>
                                    <span className="font-black text-rose-800 uppercase">{legacyProfile.ban_status || 'Banned'}</span>
                                  </div>
                                  <div>
                                    <span className="text-rose-500 font-medium block">Ban Year</span>
                                    <span className="font-black text-rose-800">{legacyProfile.ban_year || 'N/A'}</span>
                                  </div>
                                  <div className="col-span-2">
                                    <span className="text-rose-500 font-medium block">Reason for Ban</span>
                                    <span className="font-bold text-rose-900">{legacyProfile.ban_reason || 'No reason provided.'}</span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-emerald-50/50 border border-emerald-100 text-emerald-900 rounded-xl p-3 flex items-center gap-2 text-xs">
                                <Shield className="w-4 h-4 text-emerald-600" />
                                <span className="font-bold text-emerald-800">Security Pass: No legacy blacklist or ban record detected.</span>
                              </div>
                            )}

                            {/* Delegate particulars */}
                            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-3 text-xs">
                              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Legacy Registration Details</span>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <span className="text-slate-400 block font-medium">Primary Delegate Name</span>
                                  <span className="font-bold text-slate-800">{legacyProfile.full_name || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block font-medium">Primary Email</span>
                                  <span className="font-bold text-slate-800 truncate block max-w-[150px]" title={legacyProfile.email}>{legacyProfile.email || 'N/A'}</span>
                                </div>
                                {legacyProfile.joint_delegate_name && (
                                  <>
                                    <div>
                                      <span className="text-slate-400 block font-medium">Joint Delegate Name</span>
                                      <span className="font-bold text-slate-800">{legacyProfile.joint_delegate_name}</span>
                                    </div>
                                    <div>
                                      <span className="text-slate-400 block font-medium">Joint Email</span>
                                      <span className="font-bold text-slate-800 truncate block max-w-[150px]" title={legacyProfile.joint_delegate_email}>{legacyProfile.joint_delegate_email || 'N/A'}</span>
                                    </div>
                                  </>
                                )}
                                <div>
                                  <span className="text-slate-400 block font-medium">Institution</span>
                                  <span className="font-bold text-slate-800">{legacyProfile.institution || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block font-medium">Location</span>
                                  <span className="font-bold text-slate-800">{legacyProfile.city ? `${legacyProfile.city}, ` : ''}{legacyProfile.country || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block font-medium">Conference</span>
                                  <span className="font-bold text-slate-800">{legacyProfile.conference_name || 'KIMUN'} ({legacyProfile.year})</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block font-medium">Allocated Committee</span>
                                  <span className="font-bold text-slate-800">{legacyProfile.committee || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block font-medium">Allocated Portfolio</span>
                                  <span className="font-bold text-slate-800">{legacyProfile.portfolio || 'N/A'}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 block font-medium">MUNs Attended</span>
                                  <span className="font-bold text-slate-800">{legacyProfile.number_of_mun_attended ?? 'N/A'}</span>
                                </div>
                                <div className="col-span-2">
                                  <span className="text-slate-400 block font-medium">Awards Received</span>
                                  <span className="font-bold text-indigo-700 bg-indigo-50/70 border border-indigo-100 rounded-md px-2 py-0.5 inline-block mt-0.5">
                                    {legacyProfile.awards || 'None'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })()
                    ) : (
                      <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-8 text-center text-xs text-slate-400">
                        <Info className="w-5 h-5 text-slate-300 mx-auto mb-1.5" />
                        <span>No legacy delegate record found in Supabase for this applicant's credentials (email or phone). First-time attendee.</span>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-200/80 px-6 py-4 flex items-center justify-between gap-3">
              <div className="text-[10px] text-slate-400 font-bold uppercase">
                Submitted: {selectedApplicant.submittedAt ? new Date(selectedApplicant.submittedAt).toLocaleDateString() : 'N/A'}
              </div>
              <div className="flex gap-2.5">
                  {(selectedApplicant.status === 'welcomed') && (
                    <button
                      onClick={() => handleGenerateIDCard(selectedApplicant)}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white border border-transparent font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <QrCode className="w-3.5 h-3.5" /> Generate ID Card
                    </button>
                  )}
                {selectedApplicant.status !== 'rejected' && (
                  <button
                    onClick={() => {
                      handleUpdateApplicationStatus(selectedApplicant.uid, 'rejected', selectedApplicant.email, selectedApplicant.name)
                      setSelectedApplicant(prev => prev ? { ...prev, status: 'rejected' } : null)
                    }}
                    className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
                  >
                    Reject Applicant
                  </button>
                )}
                {selectedApplicant.status !== 'welcomed' && (
                  <button
                    onClick={() => {
                      handleUpdateApplicationStatus(selectedApplicant.uid, 'welcomed', selectedApplicant.email, selectedApplicant.name)
                      setSelectedApplicant(prev => prev ? { ...prev, status: 'welcomed' } : null)
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer shadow-sm shadow-emerald-600/10"
                  >
                    Approve & Welcome
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowAppDetailsModal(false)
                    setSelectedApplicant(null)
                  }}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs px-4 py-2 rounded-xl transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Committee Modal */}
      {showCommitteeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
          >
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-white font-bold text-sm">{editingCommittee ? 'Edit Committee' : 'New Committee'}</h2>
                <p className="text-indigo-200 text-xs mt-0.5">{editingCommittee ? `Modifying: ${editingCommittee.id}` : 'Add a new committee track'}</p>
              </div>
              <button onClick={() => setShowCommitteeModal(false)} className="text-indigo-200 hover:text-white transition-colors">✕</button>
            </div>
            <form onSubmit={handleSaveCommittee} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Committee Name</label>
                <input
                  type="text"
                  value={committeeForm.name}
                  onChange={e => setCommitteeForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Target Seats</label>
                  <input
                    type="number"
                    value={committeeForm.target}
                    onChange={e => setCommitteeForm(p => ({ ...p, target: parseInt(e.target.value) || 1 }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Fee (INR)</label>
                  <input
                    type="number"
                    value={committeeForm.fee || ''}
                    onChange={e => setCommitteeForm(p => ({ ...p, fee: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Category</label>
                <select
                  value={committeeForm.category}
                  onChange={e => setCommitteeForm(p => ({ ...p, category: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none"
                >
                  <option>Premium Single</option>
                  <option>Double/Single</option>
                  <option>Regional National</option>
                  <option>Specialized</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCommitteeModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition-all">Cancel</button>
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-all">
                  {editingCommittee ? 'Save' : 'Add'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Expense Modal */}
      {showExpenseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
          >
            <div className="bg-gradient-to-r from-rose-600 to-rose-700 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-white font-bold text-sm">{editingExpense ? 'Edit Expense' : 'New Expense'}</h2>
                <p className="text-rose-200 text-xs mt-0.5">Add to operational ledger</p>
              </div>
              <button onClick={() => setShowExpenseModal(false)} className="text-rose-200 hover:text-white transition-colors">✕</button>
            </div>
            <form onSubmit={handleSaveExpense} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Department</label>
                  <select
                    value={expenseForm.dept}
                    onChange={e => setExpenseForm(p => ({ ...p, dept: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none"
                  >
                    {DEPARTMENTS.slice(1).map(d => <option key={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Status</label>
                  <select
                    value={expenseForm.status}
                    onChange={e => setExpenseForm(p => ({ ...p, status: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none"
                  >
                    <option>Pending</option><option>Paid</option><option>Ordered</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Item Description</label>
                <input
                  type="text"
                  value={expenseForm.item}
                  onChange={e => setExpenseForm(p => ({ ...p, item: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Qty</label>
                  <input type="number"
                    value={expenseForm.qty}
                    onChange={e => setExpenseForm(p => ({ ...p, qty: parseInt(e.target.value) || 1 }))}
                    disabled={expenseForm.isPerDelegate}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-center disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Unit Cost</label>
                  <input type="number"
                    value={expenseForm.unitCost || ''}
                    onChange={e => setExpenseForm(p => ({ ...p, unitCost: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-right"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Actual Cost</label>
                  <input type="number"
                    value={expenseForm.actualCost || ''}
                    onChange={e => setExpenseForm(p => ({ ...p, actualCost: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-right"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={expenseForm.isPerDelegate} onChange={e => setExpenseForm(p => ({ ...p, isPerDelegate: e.target.checked }))} className="rounded" />
                <span className="text-xs font-semibold text-slate-600">Per-delegate scaling</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowExpenseModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition-all">Cancel</button>
                <button type="submit" className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-xl transition-all">
                  {editingExpense ? 'Save' : 'Add'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Revenue Modal */}
      {showRevenueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
          >
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-white font-bold text-sm">{editingRevenue ? 'Edit Partnership' : 'New Partnership'}</h2>
                <p className="text-emerald-200 text-xs mt-0.5">Add sponsorship or grant</p>
              </div>
              <button onClick={() => setShowRevenueModal(false)} className="text-emerald-200 hover:text-white transition-colors">✕</button>
            </div>
            <form onSubmit={handleSaveRevenue} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Category</label>
                  <select
                    value={revenueForm.category}
                    onChange={e => setRevenueForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none"
                  >
                    <option>Sponsorships</option><option>Grants</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Status</label>
                  <select
                    value={revenueForm.status}
                    onChange={e => setRevenueForm(p => ({ ...p, status: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none"
                  >
                    <option>In Progress</option><option>Partially Received</option><option>Completed</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Source Name</label>
                <input
                  type="text"
                  value={revenueForm.source}
                  onChange={e => setRevenueForm(p => ({ ...p, source: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Target (INR)</label>
                  <input type="number"
                    value={revenueForm.target || ''}
                    onChange={e => setRevenueForm(p => ({ ...p, target: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-right"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Actual (INR)</label>
                  <input type="number"
                    value={revenueForm.actual || ''}
                    onChange={e => setRevenueForm(p => ({ ...p, actual: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-right"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowRevenueModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition-all">Cancel</button>
                <button type="submit" className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl transition-all">
                  {editingRevenue ? 'Save' : 'Add'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
      {/* SAP MODAL: Task Board Form */}
      {showTaskForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
          >
            <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-white font-bold text-sm">{editingTask ? 'Edit Task' : 'New Kanban Task'}</h2>
                <p className="text-indigo-200 text-xs mt-0.5">{editingTask ? `Updating task assigned to ${taskForm.assignee || 'unassigned'}` : 'Publish operational task to board'}</p>
              </div>
              <button onClick={() => setShowTaskForm(false)} className="text-indigo-200 hover:text-white transition-colors">✕</button>
            </div>
            <form onSubmit={handleSaveTask} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Title</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Description</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500 h-20 resize-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Notes</label>
                  <textarea
                    value={taskForm.notes}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Internal notes..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500 h-16 resize-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Remarks</label>
                  <textarea
                    value={taskForm.remarks}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, remarks: e.target.value }))}
                    placeholder="Final remarks..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500 h-16 resize-none"
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Attachments (Link)</label>
                <input
                  type="text"
                  value={taskForm.attachments}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, attachments: e.target.value }))}
                  placeholder="https://drive.google.com/..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Department</label>
                  <select
                    value={taskForm.department}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none"
                  >
                    {DEPARTMENTS.slice(1).map(d => (
                      <option key={d.name} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Due Date</label>
                  <input
                    type="date"
                    value={taskForm.dueDate}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Priority</label>
                  <select
                    value={taskForm.priority}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Assignee</label>
                  {role === 'admin' ? (
                    <select
                      value={taskForm.assignee}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, assignee: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none"
                    >
                      <option value="">-- Unassigned --</option>
                      {dbApplications.filter(a => a.status === 'welcomed').map(app => (
                        <option key={app.uid} value={app.name}>{app.name} ({app.department})</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={taskForm.assignee}
                      onChange={(e) => setTaskForm(prev => ({ ...prev, assignee: e.target.value }))}
                      placeholder="Optional Name"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none"
                    />
                  )}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowTaskForm(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition-all">Cancel</button>
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl transition-all">
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* SAP MODAL: Infrastructure Asset Form */}
      {showAssetForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
          >
            <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-white font-bold text-sm">{editingAsset ? 'Edit Infrastructure Asset' : 'New Infrastructure Asset'}</h2>
                <p className="text-teal-200 text-xs mt-0.5">{editingAsset ? 'Modify asset details in ledger' : 'Add capital asset item for tracking'}</p>
              </div>
              <button onClick={() => setShowAssetForm(false)} className="text-teal-200 hover:text-white transition-colors">✕</button>
            </div>
            <form onSubmit={handleSaveAsset} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Asset Name</label>
                <input
                  type="text"
                  value={assetForm.name}
                  onChange={(e) => setAssetForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-teal-500"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={assetForm.quantity}
                    onChange={(e) => setAssetForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Unit Cost (INR)</label>
                  <input
                    type="number"
                    min="0"
                    value={assetForm.cost || ''}
                    onChange={(e) => setAssetForm(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Department</label>
                  <select
                    value={assetForm.department}
                    onChange={(e) => setAssetForm(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none"
                  >
                    {DEPARTMENTS.slice(1).map(d => (
                      <option key={d.name} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Status</label>
                  <select
                    value={assetForm.status}
                    onChange={(e) => setAssetForm(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none"
                  >
                    <option value="acquired">Acquired</option>
                    <option value="pending">Pending</option>
                    <option value="ordered">Ordered</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAssetForm(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition-all">Cancel</button>
                <button type="submit" className="flex-1 bg-teal-600 hover:bg-teal-700 text-white font-bold py-2.5 rounded-xl transition-all">
                  {editingAsset ? 'Save Asset' : 'Add Asset'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* SAP MODAL: Announcement Bulletin Form */}
      {showAnnouncementForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
          >
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-white font-bold text-sm">{editingAnnouncement ? 'Edit Announcement' : 'New Broadcast Announcement'}</h2>
                <p className="text-orange-100 text-xs mt-0.5">{editingAnnouncement ? 'Modify announcement parameters' : 'Broadcast a pin-able banner notice'}</p>
              </div>
              <button onClick={() => setShowAnnouncementForm(false)} className="text-orange-100 hover:text-white transition-colors">✕</button>
            </div>
            <form onSubmit={handleSaveAnnouncement} className="p-6 space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Title</label>
                <input
                  type="text"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-orange-500"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Content</label>
                <textarea
                  value={announcementForm.content}
                  onChange={(e) => setAnnouncementForm(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-orange-500 h-24 resize-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Department</label>
                  <select
                    value={announcementForm.department}
                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none"
                  >
                    {DEPARTMENTS.slice(1).map(d => (
                      <option key={d.name} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="pinAnnouncementForm"
                    checked={announcementForm.isPinned}
                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, isPinned: e.target.checked }))}
                    className="rounded text-orange-500 focus:ring-orange-500 bg-slate-50"
                  />
                  <label htmlFor="pinAnnouncementForm" className="text-xs font-semibold text-slate-600 cursor-pointer">Pin to top</label>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAnnouncementForm(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition-all">Cancel</button>
                <button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2.5 rounded-xl transition-all">
                  {editingAnnouncement ? 'Save Changes' : 'Broadcast'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
          >
            <div className="bg-rose-50 px-6 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h2 className="font-bold text-slate-800 text-sm">Confirm Delete</h2>
                <p className="text-slate-500 text-xs">This action cannot be undone</p>
              </div>
            </div>
            <div className="p-6">
              <p className="text-slate-600 text-sm">Remove <span className="font-bold text-slate-800">{deleteConfirm.name}</span> permanently?</p>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl transition-all">Cancel</button>
                <button onClick={handleConfirmDelete} className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded-xl transition-all">Delete</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Tour Invitation Modal */}
      {tourStep === -2 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white border border-slate-200 p-6 rounded-2xl shadow-2xl max-w-sm w-full text-center space-y-4"
          >
            <div className="mx-auto w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-900">Welcome to Oasis Command Center</h3>
              <p className="text-xs text-slate-500 leading-relaxed">Would you like a quick 2-minute guided tour of the dashboard features and settings?</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  localStorage.setItem('oasis_tour_completed', 'true')
                  setTourStep(-1)
                }}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-650 font-bold text-xs rounded-xl transition-all cursor-pointer border border-slate-200"
              >
                Skip
              </button>
              <button
                onClick={() => {
                  setTourStep(0)
                  setActiveMenuTab('dashboard')
                }}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-150"
              >
                Start Tour
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Floating Stepper Tour Card */}
      {tourStep >= 0 && (
        <div className="fixed bottom-6 left-6 right-6 md:left-auto md:w-96 z-50">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white border border-indigo-500 p-5 rounded-2xl shadow-2xl space-y-4"
          >
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">
                Step {tourStep + 1} of {TOUR_STEPS.length}
              </span>
              <button
                onClick={() => {
                  localStorage.setItem('oasis_tour_completed', 'true')
                  setTourStep(-1)
                }}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-slate-900">{TOUR_STEPS[tourStep]?.title}</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">{TOUR_STEPS[tourStep]?.content}</p>
            </div>
            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => {
                  localStorage.setItem('oasis_tour_completed', 'true')
                  setTourStep(-1)
                }}
                className="text-[10px] font-bold text-slate-400 hover:text-slate-650 transition-colors cursor-pointer"
              >
                Skip Tour
              </button>
              <div className="flex gap-2">
                {tourStep > 0 && (
                  <button
                    onClick={() => {
                      const prev = tourStep - 1
                      setTourStep(prev)
                      setActiveMenuTab(TOUR_STEPS[prev].tab as any)
                    }}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg transition-all cursor-pointer border border-slate-200"
                  >
                    Back
                  </button>
                )}
                <button
                  onClick={() => {
                    const next = tourStep + 1
                    if (next < TOUR_STEPS.length) {
                      setTourStep(next)
                      setActiveMenuTab(TOUR_STEPS[next].tab as any)
                    } else {
                      localStorage.setItem('oasis_tour_completed', 'true')
                      setTourStep(-1)
                      triggerNotification('Tour completed! Welcome to Oasis.', 'success')
                    }
                  }}
                  className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer shadow-md shadow-indigo-150"
                >
                  {tourStep === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

        </SidebarProvider>
      </div>
    </div>
  )
}
