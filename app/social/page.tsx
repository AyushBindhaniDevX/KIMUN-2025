// app/social/page.tsx
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getDatabase, ref, get, set, push, onValue, off, query, orderByChild, equalTo } from 'firebase/database'
import { getAuth, signOut, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth'
import { initializeApp } from 'firebase/app'
import { Button } from '@/components/ui/button'
import {
  User,
  FileText,
  Users,
  CreditCard,
  LogOut,
  MessageCircle,
  Bell,
  Search,
  Send,
  Award,
  Loader2,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Link as LinkIcon
} from 'lucide-react'
import { Toaster, toast } from 'sonner'
import Link from 'next/link'
import Image from 'next/image'

// Reuse your existing Firebase config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
}

// Initialize Firebase App
const app = initializeApp(firebaseConfig)

type UserProfile = {
  id: string
  name: string
  email: string
  institution: string
  experience: number
  committee: string
  country: string
  bio?: string
  interests?: string[]
  avatar?: string
  phone?: string
  socialLinks?: {
    website?: string
    linkedin?: string
    twitter?: string
    instagram?: string
  }
}

type Society = {
  id: string
  name: string
  description: string
  members: number
  isMember: boolean
  image?: string
  meetings?: Array<{
    date: string
    time: string
    location: string
    topic: string
  }>
}

type Payment = {
  id: string
  amount: string
  status: 'completed' | 'pending' | 'failed'
  date: string
  description: string
}

type Message = {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  content: string
  timestamp: Date
  type: 'text' | 'image'
}

type Event = {
  id: string
  title: string
  date: string
  time: string
  location: string
  description: string
  image?: string
  attendees: number
}

type Marksheet = {
  gsl: number
  mod1: number
  mod2: number
  mod3: number
  mod4: number
  fp: number
  doc: number
  chits: number
  lobby: number
  total: number
}

export default function SocialPortal() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [userMarksheet, setUserMarksheet] = useState<Marksheet | null>(null)
  const [societies, setSocieties] = useState<Society[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [events, setEvents] = useState<Event[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState({
    profile: true,
    societies: true,
    payments: true,
    messages: true,
    events: true
  })
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Check authentication and fetch initial data
  useEffect(() => {
    const auth = getAuth(app)
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in, fetch data
        fetchUserProfile(user.email!);
        fetchSocieties();
        fetchPayments(user.uid);
        fetchEvents();
        setupChatListener();
      } else {
        // User is signed out, redirect
        router.push('/delegate');
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  // Fetch marksheet data when userProfile is available
  useEffect(() => {
    if (userProfile?.committee && userProfile?.country) {
      fetchMarksheet(userProfile.committee, userProfile.country);
    }
  }, [userProfile]);

  const fetchUserProfile = async (email: string) => {
    setLoading(prev => ({ ...prev, profile: true }));
    try {
      const db = getDatabase(app);
      const registrationsRef = ref(db, 'registrations');
      const snapshot = await get(registrationsRef);

      if (!snapshot.exists()) {
        throw new Error('No delegate data found');
      }

      const registrations = snapshot.val();
      let foundDelegate = null;
      let registrationKey = '';

      for (const key in registrations) {
        const registration = registrations[key];
        const delegate1 = registration.delegateInfo?.delegate1;
        const delegate2 = registration.delegateInfo?.delegate2;

        if (delegate1?.email === email) {
          foundDelegate = delegate1;
          registrationKey = key;
          break;
        }
        if (delegate2?.email === email) {
          foundDelegate = delegate2;
          registrationKey = key;
          break;
        }
      }

      if (!foundDelegate) {
        throw new Error('No delegate found with this email');
      }

      setUserProfile({
        id: registrationKey,
        name: foundDelegate.name,
        email: foundDelegate.email,
        institution: foundDelegate.institution || 'Unknown Institution',
        experience: Number(foundDelegate.experience) || 0,
        committee: registrations[registrationKey].committeeId,
        country: registrations[registrationKey].portfolioId,
        bio: 'Passionate MUN delegate with interest in international relations and diplomacy.',
        interests: ['International Relations', 'Diplomacy', 'Public Speaking', 'Research'],
        phone: foundDelegate.phone || 'N/A',
        socialLinks: {
          linkedin: 'https://linkedin.com/in/example',
          twitter: 'https://twitter.com/example'
        }
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error('Failed to load profile data');
    } finally {
      setLoading(prev => ({ ...prev, profile: false }));
    }
  };

  const fetchMarksheet = async (committeeId: string, portfolioId: string) => {
    try {
      const db = getDatabase(app);
      const marksheetRef = ref(db, `marksheets/${committeeId}/marks`);
      // Correcting the query to filter by portfolio ID
      const q = query(marksheetRef, orderByChild('portfolioId'), equalTo(portfolioId));
      const snapshot = await get(q);

      if (snapshot.exists()) {
        const marksData = snapshot.val();
        const markEntryKey = Object.keys(marksData)[0];
        const markEntry = marksData[markEntryKey];

        setUserMarksheet({
          gsl: markEntry.gsl || 0,
          mod1: markEntry.mod1 || 0,
          mod2: markEntry.mod2 || 0,
          mod3: markEntry.mod3 || 0,
          mod4: markEntry.mod4 || 0,
          fp: markEntry.fp || 0,
          doc: markEntry.doc || 0,
          chits: markEntry.chits || 0,
          lobby: markEntry.lobby || 0,
          total: markEntry.total || 0,
        });
      } else {
        setUserMarksheet(null);
      }
    } catch (error) {
      console.error('Error fetching marksheet:', error);
      toast.error('Failed to load marksheet data');
    }
  };


  const fetchSocieties = async () => {
    setLoading(prev => ({ ...prev, societies: true }))
    try {
      const db = getDatabase(app)
      const societiesRef = ref(db, 'societies')
      const snapshot = await get(societiesRef)

      if (snapshot.exists()) {
        const societiesData = snapshot.val()
        const societiesList = Object.keys(societiesData).map(key => ({
          id: key,
          ...societiesData[key],
          isMember: false // This needs a separate check in the future
        })) as Society[]
        setSocieties(societiesList)
      } else {
        setSocieties([])
      }
    } catch (error) {
      console.error('Error fetching societies:', error)
      toast.error('Failed to load societies')
    } finally {
      setLoading(prev => ({ ...prev, societies: false }))
    }
  }
  
  const fetchPayments = async (uid: string) => {
    setLoading(prev => ({ ...prev, payments: true }));
    try {
      const db = getDatabase(app);
      // This assumes payment data is nested under the registration key or UID
      const paymentsRef = ref(db, `payments/${userProfile?.id}`);
      const snapshot = await get(paymentsRef);

      if (snapshot.exists()) {
        const paymentsData = snapshot.val();
        const paymentsList = Object.keys(paymentsData).map(key => ({
          id: key,
          ...paymentsData[key]
        })) as Payment[]
        setPayments(paymentsList);
      } else {
        setPayments([]);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load payments');
    } finally {
      setLoading(prev => ({ ...prev, payments: false }));
    }
  };

  const fetchEvents = async () => {
    setLoading(prev => ({ ...prev, events: true }))
    try {
      const db = getDatabase(app)
      const eventsRef = ref(db, 'events')
      const snapshot = await get(eventsRef)

      if (snapshot.exists()) {
        const eventsData = snapshot.val()
        const eventsList = Object.keys(eventsData).map(key => ({
          id: key,
          ...eventsData[key]
        })) as Event[]
        setEvents(eventsList)
      } else {
        setEvents([])
      }
    } catch (error) {
      console.error('Error fetching events:', error)
      toast.error('Failed to load events')
    } finally {
      setLoading(prev => ({ ...prev, events: false }))
    }
  }

  const setupChatListener = () => {
    setLoading(prev => ({ ...prev, messages: true }))
    try {
      const db = getDatabase(app)
      const messagesRef = ref(db, 'communityChat/messages')
      const messagesListener = onValue(messagesRef, (snapshot) => {
        if (snapshot.exists()) {
          const messagesData = snapshot.val()
          const messagesList = Object.keys(messagesData).map(key => ({
            id: key,
            ...messagesData[key],
            timestamp: new Date(messagesData[key].timestamp)
          })) as Message[]
          messagesList.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
          setMessages(messagesList)
        }
        setLoading(prev => ({ ...prev, messages: false }))
      }, (error) => {
        console.error('Error setting up chat listener:', error)
        setLoading(prev => ({ ...prev, messages: false }))
      })

      return () => off(messagesRef, 'value', messagesListener);
    } catch (error) {
      console.error('Error setting up chat listener:', error)
      setLoading(prev => ({ ...prev, messages: false }))
      return () => {};
    }
  }

  const handleJoinSociety = async (societyId: string) => {
    toast.info("Joining society functionality is not yet implemented.");
  }

  const handleLeaveSociety = async (societyId: string) => {
    toast.info("Leaving society functionality is not yet implemented.");
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !userProfile) return

    try {
      const db = getDatabase(app)
      const messagesRef = ref(db, 'communityChat/messages')
      const newMessageRef = push(messagesRef)

      await set(newMessageRef, {
        userId: userProfile.id,
        userName: userProfile.name,
        content: newMessage.trim(),
        timestamp: new Date().toISOString(),
        type: 'text'
      })
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    }
  }

  const handleLogout = async () => {
    try {
      const auth = getAuth(app)
      await signOut(auth)
      router.push('/delegate')
      toast.info('Logged out successfully')
    } catch (error) {
      console.error('Error logging out:', error)
      toast.error('Failed to logout')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Filter functions
  const filteredSocieties = societies.filter(society =>
    society.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    society.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.location.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black to-amber-950/20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-amber-950/20 text-white">
      <Toaster position="top-right" richColors theme="dark" />

      {/* Header */}
      <header className="bg-black/80 backdrop-blur-md border-b border-amber-800/30 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Link href="/delegate" className="flex items-center gap-2 group">
            <Button variant="ghost" className="p-2 rounded-full group-hover:bg-amber-900/30 transition-colors">
              <span className="text-amber-300">Back to Dashboard</span>
            </Button>
          </Link>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-amber-200/60" />
              <input
                type="text"
                placeholder="Search societies, events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-black/50 border border-amber-800/30 rounded-lg text-white placeholder-amber-200/60 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
            </div>

            <Button variant="outline" size="icon" className="border-amber-500 text-amber-300 hover:bg-amber-900/30">
              <Bell className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-2">
              <div className="h-8 w-8 bg-amber-900/50 rounded-full flex items-center justify-center">
                <span className="text-xs">{userProfile?.name?.charAt(0) || 'U'}</span>
              </div>
              <span className="text-sm text-amber-200 hidden sm:inline">{userProfile?.name}</span>
            </div>

            <Button
              variant="outline"
              onClick={handleLogout}
              className="border-amber-500 text-amber-300 hover:bg-amber-900/30 h-9"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <aside className="lg:w-1/4">
            <div className="bg-black/40 backdrop-blur-sm border border-amber-800/30 rounded-xl p-6 mb-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-16 w-16 bg-amber-900/50 rounded-full flex items-center justify-center">
                  <span className="text-xl">{userProfile?.name?.charAt(0) || 'U'}</span>
                </div>
                <div>
                  <h2 className="font-bold text-amber-300">{userProfile?.name}</h2>
                  <p className="text-sm text-amber-200/80">{userProfile?.committee}</p>
                  <p className="text-xs text-amber-200/60">{userProfile?.country}</p>
                </div>
              </div>

              <nav className="space-y-2">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                    activeTab === 'dashboard'
                      ? 'bg-amber-900/40 text-amber-300'
                      : 'text-amber-200 hover:bg-amber-900/20'
                  }`}
                >
                  <User className="h-5 w-5" />
                  <span>Personal Information</span>
                </button>

                <button
                  onClick={() => setActiveTab('cv')}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                    activeTab === 'cv'
                      ? 'bg-amber-900/40 text-amber-300'
                      : 'text-amber-200 hover:bg-amber-900/20'
                  }`}
                >
                  <FileText className="h-5 w-5" />
                  <span>MUN CV</span>
                </button>

                <button
                  onClick={() => setActiveTab('societies')}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                    activeTab === 'societies'
                      ? 'bg-amber-900/40 text-amber-300'
                      : 'text-amber-200 hover:bg-amber-900/20'
                  }`}
                >
                  <Users className="h-5 w-5" />
                  <span>Societies</span>
                </button>

                <button
                  onClick={() => setActiveTab('marksheet')}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                    activeTab === 'marksheet'
                      ? 'bg-amber-900/40 text-amber-300'
                      : 'text-amber-200 hover:bg-amber-900/20'
                  }`}
                >
                  <Award className="h-5 w-5" />
                  <span>Marksheet</span>
                </button>

                <button
                  onClick={() => setActiveTab('payments')}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                    activeTab === 'payments'
                      ? 'bg-amber-900/40 text-amber-300'
                      : 'text-amber-200 hover:bg-amber-900/20'
                  }`}
                >
                  <CreditCard className="h-5 w-5" />
                  <span>Payments</span>
                </button>

                <button
                  onClick={() => setActiveTab('community')}
                  className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${
                    activeTab === 'community'
                      ? 'bg-amber-900/40 text-amber-300'
                      : 'text-amber-200 hover:bg-amber-900/20'
                  }`}
                >
                  <MessageCircle className="h-5 w-5" />
                  <span>Community Chat</span>
                </button>
              </nav>
            </div>

            {/* Online Members */}
            <div className="bg-black/40 backdrop-blur-sm border border-amber-800/30 rounded-xl p-6">
              <h3 className="font-bold text-amber-300 mb-4 flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                Online Now (24)
              </h3>
              <div className="space-y-3">
                {[
                  { name: 'Sarah J.', committee: 'UNSC' },
                  { name: 'Michael C.', committee: 'WHO' },
                  { name: 'Priya S.', committee: 'UNHRC' },
                  { name: 'David K.', committee: 'UNEP' }
                ].map((user, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="relative">
                      <div className="h-8 w-8 bg-amber-900/50 rounded-full flex items-center justify-center">
                        <span className="text-xs">{user.name.charAt(0)}</span>
                      </div>
                      <div className="absolute bottom-0 right-0 h-2 w-2 bg-green-500 rounded-full border border-black"></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-amber-200/60">{user.committee}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="lg:w-3/4">
            {/* Dashboard/Personal Information */}
            {activeTab === 'dashboard' && (
              <div className="bg-black/40 backdrop-blur-sm border border-amber-800/30 rounded-xl p-6">
                <h2 className="text-xl font-bold text-amber-300 mb-6">Personal Information</h2>

                {loading.profile ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                  </div>
                ) : userProfile ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-amber-200/80 mb-1">Full Name</label>
                        <p className="font-medium">{userProfile.name}</p>
                      </div>

                      <div>
                        <label className="block text-sm text-amber-200/80 mb-1">Email</label>
                        <p className="font-medium">{userProfile.email}</p>
                      </div>

                      <div>
                        <label className="block text-sm text-amber-200/80 mb-1">Institution</label>
                        <p className="font-medium">{userProfile.institution}</p>
                      </div>

                      <div>
                        <label className="block text-sm text-amber-200/80 mb-1">MUN Experience</label>
                        <p className="font-medium">
                          {userProfile.experience === 0 ? 'Beginner' :
                           userProfile.experience === 1 ? 'Intermediate' :
                           userProfile.experience >= 2 ? 'Advanced' : 'Not specified'}
                          {userProfile.experience > 0 && ` (${userProfile.experience} conference${userProfile.experience > 1 ? 's' : ''})`}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-amber-200/80 mb-1">Committee</label>
                        <p className="font-medium">{userProfile.committee}</p>
                      </div>

                      <div>
                        <label className="block text-sm text-amber-200/80 mb-1">Country</label>
                        <p className="font-medium">{userProfile.country}</p>
                      </div>

                      <div>
                        <label className="block text-sm text-amber-200/80 mb-1">Bio</label>
                        <p className="font-medium">{userProfile.bio}</p>
                      </div>

                      <div>
                        <label className="block text-sm text-amber-200/80 mb-1">Interests</label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {userProfile.interests?.map((interest, index) => (
                            <span key={index} className="bg-amber-900/30 px-3 py-1 rounded-full text-xs text-amber-300">
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-amber-200/80">No profile information available</p>
                )}
              </div>
            )}

            {/* MUN CV */}
            {activeTab === 'cv' && (
              <div className="bg-black/40 backdrop-blur-sm border border-amber-800/30 rounded-xl p-6">
                <h2 className="text-xl font-bold text-amber-300 mb-6">MUN CV</h2>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-amber-200 mb-3">Conference Experience</h3>
                    <div className="bg-amber-900/20 p-4 rounded-lg border border-amber-800/30">
                      <p className="text-amber-200/80">Your MUN conference history will appear here after KIMUN 2025 concludes. So far, you've attended KIMUN 2025 as a delegate for {userProfile?.country}.</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-amber-200 mb-3">Skills & Awards</h3>
                    <div className="bg-amber-900/20 p-4 rounded-lg border border-amber-800/30">
                      <p className="text-amber-200/80">Your skills and awards will be updated based on your performance during the conference.</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-amber-200 mb-3">Resolutions</h3>
                    <div className="bg-amber-900/20 p-4 rounded-lg border border-amber-800/30">
                      <p className="text-amber-200/80">Resolutions you've contributed to will be listed here after the conference.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Societies */}
            {activeTab === 'societies' && (
              <div className="bg-black/40 backdrop-blur-sm border border-amber-800/30 rounded-xl p-6">
                <h2 className="text-xl font-bold text-amber-300 mb-6">Societies & Clubs</h2>

                {loading.societies ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                  </div>
                ) : filteredSocieties.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredSocieties.map((society) => (
                      <div key={society.id} className="bg-black/50 p-6 rounded-lg border border-amber-800/30">
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="text-lg font-bold text-amber-300">{society.name}</h3>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            society.isMember
                              ? 'bg-green-900/30 text-green-400'
                              : 'bg-amber-900/30 text-amber-400'
                          }`}>
                            {society.isMember ? 'Member' : 'Not a member'}
                          </span>
                        </div>

                        <p className="text-amber-200/80 mb-4">{society.description}</p>

                        <div className="flex justify-between items-center mb-4">
                          <span className="text-sm text-amber-200/60">{society.members} members</span>
                        </div>

                        {society.isMember ? (
                          <Button
                            onClick={() => handleLeaveSociety(society.id)}
                            className="w-full bg-red-600 hover:bg-red-700"
                          >
                            Leave Society
                          </Button>
                        ) : (
                          <Button
                            onClick={() => handleJoinSociety(society.id)}
                            className="w-full bg-amber-600 hover:bg-amber-700 text-black"
                          >
                            Join Society
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-amber-200/80">No societies available at the moment</p>
                )}
              </div>
            )}

            {/* Marksheet */}
            {activeTab === 'marksheet' && (
              <div className="bg-black/40 backdrop-blur-sm border border-amber-800/30 rounded-xl p-6">
                <h2 className="text-xl font-bold text-amber-300 mb-6">Marksheet</h2>

                {loading.profile ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                  </div>
                ) : userMarksheet ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-black/50 p-4 rounded-lg border border-amber-800/30 text-center">
                        <p className="text-sm text-amber-200/80 mb-1">GSL</p>
                        <p className="text-xl font-bold text-amber-300">{userMarksheet.gsl}</p>
                      </div>
                      <div className="bg-black/50 p-4 rounded-lg border border-amber-800/30 text-center">
                        <p className="text-sm text-amber-200/80 mb-1">Moderated Caucus</p>
                        <p className="text-xl font-bold text-amber-300">{userMarksheet.mod1 + userMarksheet.mod2 + userMarksheet.mod3 + userMarksheet.mod4}</p>
                      </div>
                      <div className="bg-black/50 p-4 rounded-lg border border-amber-800/30 text-center">
                        <p className="text-sm text-amber-200/80 mb-1">Chits</p>
                        <p className="text-xl font-bold text-amber-300">{userMarksheet.chits}</p>
                      </div>
                      <div className="bg-black/50 p-4 rounded-lg border border-amber-800/30 text-center">
                        <p className="text-sm text-amber-200/80 mb-1">Resolutions</p>
                        <p className="text-xl font-bold text-amber-300">{userMarksheet.doc}</p>
                      </div>
                      <div className="bg-black/50 p-4 rounded-lg border border-amber-800/30 text-center">
                        <p className="text-sm text-amber-200/80 mb-1">Lobbying</p>
                        <p className="text-xl font-bold text-amber-300">{userMarksheet.lobby}</p>
                      </div>
                      <div className="bg-black/50 p-4 rounded-lg border border-amber-800/30 text-center">
                        <p className="text-sm text-amber-200/80 mb-1">Final Paper</p>
                        <p className="text-xl font-bold text-amber-300">{userMarksheet.fp}</p>
                      </div>
                      <div className="bg-black/50 p-4 rounded-lg border border-amber-800/30 text-center md:col-span-2">
                        <p className="text-sm text-amber-200/80 mb-1">Total Score</p>
                        <p className="text-4xl font-bold text-amber-300">{userMarksheet.total}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-900/20 p-4 rounded-lg border border-amber-800/30">
                    <p className="text-amber-200/80">Your marks will be available here after committee sessions have concluded for KIMUN 2025.</p>
                  </div>
                )}
              </div>
            )}

            {/* Payments */}
            {activeTab === 'payments' && (
              <div className="bg-black/40 backdrop-blur-sm border border-amber-800/30 rounded-xl p-6">
                <h2 className="text-xl font-bold text-amber-300 mb-6">Payment History</h2>

                {loading.payments ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                  </div>
                ) : payments.length > 0 ? (
                  <div className="space-y-4">
                    {payments.map((payment) => (
                      <div key={payment.id} className="bg-black/50 p-4 rounded-lg border border-amber-800/30 flex justify-between items-center">
                        <div>
                          <h3 className="font-medium text-amber-300">{payment.description}</h3>
                          <p className="text-sm text-amber-200/60">{formatDate(payment.date)}</p>
                        </div>

                        <div className="text-right">
                          <p className="font-bold text-amber-300">{payment.amount}</p>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            payment.status === 'completed'
                              ? 'bg-green-900/30 text-green-400'
                              : payment.status === 'pending'
                              ? 'bg-yellow-900/30 text-yellow-400'
                              : 'bg-red-900/30 text-red-400'
                          }`}>
                            {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-amber-200/80">No payment history available</p>
                )}
              </div>
            )}

            {/* Community Chat */}
            {activeTab === 'community' && (
              <div className="bg-black/40 backdrop-blur-sm border border-amber-800/30 rounded-xl overflow-hidden flex flex-col h-[600px]">
                <div className="bg-gradient-to-r from-amber-900/40 to-amber-950/40 px-6 py-4 border-b border-amber-800/30">
                  <h2 className="text-xl font-bold text-amber-300">Community Chat</h2>
                  <p className="text-sm text-amber-200/80">Connect with other KIMUN 2025 delegates</p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {loading.messages ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                    </div>
                  ) : messages.length > 0 ? (
                    messages.map((message) => (
                      <div key={message.id} className={`flex ${message.userId === userProfile?.id ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md p-3 rounded-lg ${
                          message.userId === userProfile?.id
                            ? 'bg-amber-600 text-black'
                            : 'bg-amber-900/30 text-amber-100'
                        }`}>
                          <div className="flex items-center gap-2 mb-1">
                            <div className="h-6 w-6 bg-amber-800/50 rounded-full flex items-center justify-center text-xs">
                              {message.userName.charAt(0)}
                            </div>
                            <span className="text-sm font-medium">{message.userName}</span>
                          </div>
                          <p>{message.content}</p>
                          <p className="text-xs opacity-70 mt-1 text-right">
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-amber-200/80">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No messages yet. Be the first to start the conversation!</p>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-amber-800/30">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-2 bg-black/50 border border-amber-800/30 rounded-lg text-white placeholder-amber-200/60 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                    <Button
                      onClick={handleSendMessage}
                      className="bg-amber-600 hover:bg-amber-700 text-black"
                      disabled={!newMessage.trim()}
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Events Section */}
        <div className="mt-8 bg-black/40 backdrop-blur-sm border border-amber-800/30 rounded-xl p-6">
          <h2 className="text-xl font-bold text-amber-300 mb-6">Upcoming Events</h2>

          {loading.events ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredEvents.map((event) => (
                <div key={event.id} className="bg-black/50 p-6 rounded-lg border border-amber-800/30">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-bold text-amber-300">{event.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-amber-200/60">
                      <MapPin className="h-4 w-4" />
                      <span>{event.attendees} attending</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-amber-400" />
                      <span className="text-sm">{formatDate(event.date)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-amber-200/60">{event.time}</span>
                    </div>
                  </div>

                  <p className="text-amber-200/80 mb-4">{event.description}</p>

                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-amber-400" />
                    <span className="text-sm">{event.location}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-amber-200/80">No upcoming events</p>
          )}
        </div>
      </main>
    </div>
  )
}