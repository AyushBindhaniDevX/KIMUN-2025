// app/social/page.tsx
'use client'
import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { initializeApp } from 'firebase/app'
import { getDatabase, ref, get, set, push, onValue, off } from 'firebase/database'
import { getAuth, signOut } from 'firebase/auth'
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
  MoreHorizontal,
  Image as ImageIcon,
  Award,
  Loader2,
  Calendar,
  MapPin,
  Mail,
  Phone,
  Link as LinkIcon,
  BarChart,
  LayoutDashboard
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

// Corrected Firebase App Initialization
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (e) {
  // Gracefully handle the error if the app is already initialized
  // This is a common issue with Next.js hot-reloading in development
  console.error("Firebase app already initialized", e);
}

// Types from the provided code
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

// Main component
export default function SocialPortal() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('profile')
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
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

  // Check authentication and fetch data
  useEffect(() => {
    // We now have to get auth after the app is initialized
    const auth = getAuth(app);
    const user = auth.currentUser;

    // Check if the user is authenticated
    if (!user) {
      router.push('/delegate')
      return
    }
    
    // Fetch user data
    fetchUserProfile(user.email!)
    fetchSocieties()
    fetchPayments()
    fetchEvents()
    setupChatListener()
  }, [router, app]) // app is now a dependency to ensure useEffect has access to it

  const fetchUserProfile = async (email: string) => {
    try {
      const db = getDatabase()
      const delegatesRef = ref(db, 'registrations')
      const snapshot = await get(delegatesRef)

      if (!snapshot.exists()) {
        throw new Error('No delegate data found')
      }

      const registrations = snapshot.val()
      let foundDelegate = null

      for (const key in registrations) {
        const registration = registrations[key]
        if (registration.delegateInfo?.delegate1?.email === email) {
          foundDelegate = {
            id: key,
            name: registration.delegateInfo.delegate1.name,
            email: email,
            institution: registration.delegateInfo.delegate1.institution || 'Unknown Institution',
            experience: registration.delegateInfo.delegate1.experience || 0,
            committee: registration.committeeId,
            country: registration.portfolioId,
            bio: 'Passionate MUN delegate with interest in international relations and diplomacy.',
            interests: ['International Relations', 'Diplomacy', 'Public Speaking', 'Research'],
            phone: registration.delegateInfo.delegate1.phone || '+1 (555) 123-4567',
            socialLinks: {
              linkedin: 'https://linkedin.com/in/example',
              twitter: 'https://twitter.com/example'
            }
          }
          break
        }
        if (registration.delegateInfo?.delegate2?.email === email) {
          foundDelegate = {
            id: key,
            name: registration.delegateInfo.delegate2.name,
            email: email,
            institution: registration.delegateInfo.delegate2.institution || 'Unknown Institution',
            experience: registration.delegateInfo.delegate2.experience || 0,
            committee: registration.committeeId,
            country: registration.portfolioId,
            bio: 'Passionate MUN delegate with interest in international relations and diplomacy.',
            interests: ['International Relations', 'Diplomacy', 'Public Speaking', 'Research'],
            phone: registration.delegateInfo.delegate2.phone || '+1 (555) 123-4567',
            socialLinks: {
              linkedin: 'https://linkedin.com/in/example',
              twitter: 'https://twitter.com/example'
            }
          }
          break
        }
      }

      if (!foundDelegate) {
        throw new Error('No delegate found with this email')
      }

      setUserProfile(foundDelegate)
    } catch (error) {
      console.error('Error fetching user profile:', error)
      toast.error('Failed to load profile data')
    } finally {
      setLoading(prev => ({ ...prev, profile: false }))
    }
  }

  const fetchSocieties = async () => {
    try {
      const db = getDatabase()
      const societiesRef = ref(db, 'societies')
      const snapshot = await get(societiesRef)
      
      if (snapshot.exists()) {
        const societiesData = snapshot.val()
        const societiesList = Object.keys(societiesData).map(key => ({
          id: key,
          ...societiesData[key]
        })) as Society[]
        
        setSocieties(societiesList)
      } else {
        // Fallback mock data
        setSocieties([
          {
            id: '1',
            name: 'Model UN Society',
            description: 'For enthusiasts of Model United Nations conferences',
            members: 120,
            isMember: true,
            image: '/society-mun.jpg',
            meetings: [
              {
                date: '2025-01-20',
                time: '18:00',
                location: 'Room 101, Main Building',
                topic: 'Resolution Writing Workshop'
              }
            ]
          },
          {
            id: '2',
            name: 'Debating Club',
            description: 'Sharpening argumentation and public speaking skills',
            members: 85,
            isMember: false,
            image: '/society-debate.jpg'
          }
        ])
      }
    } catch (error) {
      console.error('Error fetching societies:', error)
      toast.error('Failed to load societies')
    } finally {
      setLoading(prev => ({ ...prev, societies: false }))
    }
  }

  const fetchPayments = async () => {
    try {
      const delegateData = userProfile
      const db = getDatabase()
      const paymentsRef = ref(db, `payments/${delegateData?.id}`)
      const snapshot = await get(paymentsRef)
      
      if (snapshot.exists()) {
        const paymentsData = snapshot.val()
        const paymentsList = Object.keys(paymentsData).map(key => ({
          id: key,
          ...paymentsData[key]
        })) as Payment[]
        
        setPayments(paymentsList)
      } else {
        // Fallback mock data
        setPayments([
          {
            id: '1',
            amount: '$75.00',
            status: 'completed',
            date: '2025-01-15',
            description: 'KIMUN 2025 Registration Fee'
          },
          {
            id: '2',
            amount: '$25.00',
            status: 'completed',
            date: '2025-02-10',
            description: 'Social Events Package'
          }
        ])
      }
    } catch (error) {
      console.error('Error fetching payments:', error)
      toast.error('Failed to load payments')
    } finally {
      setLoading(prev => ({ ...prev, payments: false }))
    }
  }

  const fetchEvents = async () => {
    try {
      const db = getDatabase()
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
        // Fallback mock data
        setEvents([
          {
            id: '1',
            title: 'KIMUN Opening Ceremony',
            date: '2025-07-05',
            time: '09:00 AM',
            location: 'Grand Ballroom',
            description: 'Official opening of KIMUN 2025 with keynote speakers and cultural performances',
            attendees: 250,
            image: '/event-opening.jpg'
          },
          {
            id: '2',
            title: 'Delegate Social Mixer',
            date: '2025-07-05',
            time: '07:00 PM',
            location: 'Rooftop Garden',
            description: 'Networking event for all delegates with food and drinks',
            attendees: 180,
            image: '/event-mixer.jpg'
          }
        ])
      }
    } catch (error) {
      console.error('Error fetching events:', error)
      toast.error('Failed to load events')
    } finally {
      setLoading(prev => ({ ...prev, events: false }))
    }
  }

  const setupChatListener = () => {
    try {
      const db = getDatabase()
      const messagesRef = ref(db, 'communityChat/messages')
      
      const unsubscribe = onValue(messagesRef, (snapshot) => {
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

      return () => off(messagesRef)
    } catch (error) {
      console.error('Error setting up chat listener:', error)
      setLoading(prev => ({ ...prev, messages: false }))
    }
  }

  const handleJoinSociety = async (societyId: string) => {
    try {
      const db = getDatabase()
      
      const membershipRef = ref(db, `societyMembers/${societyId}/${userProfile?.id}`)
      await set(membershipRef, {
        joinedAt: new Date().toISOString(),
        name: userProfile?.name
      })
      
      setSocieties(prev => 
        prev.map(society => 
          society.id === societyId 
            ? { ...society, isMember: true, members: society.members + 1 } 
            : society
        )
      )
      toast.success('Joined society successfully!')
    } catch (error) {
      console.error('Error joining society:', error)
      toast.error('Failed to join society')
    }
  }

  const handleLeaveSociety = async (societyId: string) => {
    try {
      const db = getDatabase()
      
      const membershipRef = ref(db, `societyMembers/${societyId}/${userProfile?.id}`)
      await set(membershipRef, null)
      
      setSocieties(prev => 
        prev.map(society => 
          society.id === societyId 
            ? { ...society, isMember: false, members: society.members - 1 } 
            : society
        )
      )
      toast.success('Left society successfully!')
    } catch (error) {
      console.error('Error leaving society:', error)
      toast.error('Failed to leave society')
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !userProfile) return
    
    try {
      const db = getDatabase()
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
      const auth = getAuth()
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

  // Loading state
  if (loading.profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black to-amber-950/20 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  // Main social portal with sidebar navigation
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-amber-950/20 text-white flex">
      <Toaster position="top-right" richColors theme="dark" />
      
      {/* Sidebar Navigation */}
      <aside className="fixed top-0 left-0 bottom-0 w-64 bg-black/80 backdrop-blur-md border-r border-amber-800/30 flex flex-col justify-between p-4">
        <nav className="flex flex-col space-y-2">
          <div className="py-4 text-center">
            <Award className="h-10 w-10 text-amber-400 mx-auto" />
            <h2 className="text-xl font-bold mt-2 text-amber-300">KIMUN 2025</h2>
            <p className="text-sm text-amber-200/80">{userProfile?.name}</p>
          </div>
          
          <Button
            variant="ghost"
            onClick={() => setActiveTab('profile')}
            className={`w-full justify-start transition-colors ${activeTab === 'profile' ? 'bg-amber-900/40 text-amber-100' : 'text-amber-200 hover:bg-amber-900/30'}`}
          >
            <User className="h-5 w-5 mr-3" />
            Personal Information
          </Button>

          <Button
            variant="ghost"
            onClick={() => setActiveTab('mun-cv')}
            className={`w-full justify-start transition-colors ${activeTab === 'mun-cv' ? 'bg-amber-900/40 text-amber-100' : 'text-amber-200 hover:bg-amber-900/30'}`}
          >
            <FileText className="h-5 w-5 mr-3" />
            MUN CV
          </Button>

          <Button
            variant="ghost"
            onClick={() => setActiveTab('societies')}
            className={`w-full justify-start transition-colors ${activeTab === 'societies' ? 'bg-amber-900/40 text-amber-100' : 'text-amber-200 hover:bg-amber-900/30'}`}
          >
            <Users className="h-5 w-5 mr-3" />
            Societies
          </Button>
          
          <Button
            variant="ghost"
            onClick={() => setActiveTab('marksheet')}
            className={`w-full justify-start transition-colors ${activeTab === 'marksheet' ? 'bg-amber-900/40 text-amber-100' : 'text-amber-200 hover:bg-amber-900/30'}`}
          >
            <BarChart className="h-5 w-5 mr-3" />
            Marksheet
          </Button>

          <Button
            variant="ghost"
            onClick={() => setActiveTab('payments')}
            className={`w-full justify-start transition-colors ${activeTab === 'payments' ? 'bg-amber-900/40 text-amber-100' : 'text-amber-200 hover:bg-amber-900/30'}`}
          >
            <CreditCard className="h-5 w-5 mr-3" />
            Payments
          </Button>

          <Button
            variant="ghost"
            onClick={() => setActiveTab('events')}
            className={`w-full justify-start transition-colors ${activeTab === 'events' ? 'bg-amber-900/40 text-amber-100' : 'text-amber-200 hover:bg-amber-900/30'}`}
          >
            <Calendar className="h-5 w-5 mr-3" />
            Events
          </Button>

          <Button
            variant="ghost"
            onClick={() => setActiveTab('chat')}
            className={`w-full justify-start transition-colors ${activeTab === 'chat' ? 'bg-amber-900/40 text-amber-100' : 'text-amber-200 hover:bg-amber-900/30'}`}
          >
            <MessageCircle className="h-5 w-5 mr-3" />
            Virtual Chat
          </Button>
          <Link href="/delegate" passHref>
            <Button variant="ghost" className="w-full justify-start text-amber-200 hover:bg-amber-900/30 hover:text-amber-100 transition-colors">
              <LayoutDashboard className="h-5 w-5 mr-3" />
              Main Dashboard
            </Button>
          </Link>
        </nav>

        <div className="mt-auto">
          <Button 
            variant="outline" 
            onClick={handleLogout}
            className="w-full border-amber-500 text-amber-300 hover:bg-amber-900/30 h-9"
          >
            <LogOut className="h-4 w-4 mr-2" /> 
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 ml-64 p-8 pt-10">
        <h1 className="text-3xl font-bold mb-8 text-amber-300">
          {activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('-', ' ')}
        </h1>

        {/* --- Personal Information Tab --- */}
        {activeTab === 'profile' && userProfile && (
          <div className="bg-black/40 backdrop-blur-sm border border-amber-800/30 rounded-xl overflow-hidden shadow-lg shadow-amber-900/10 p-6">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              <div className="w-32 h-32 md:w-48 md:h-48 rounded-full bg-amber-900/50 flex items-center justify-center text-4xl font-bold text-amber-100">
                {userProfile.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-center md:text-left">
                <h2 className="text-2xl font-bold text-amber-300">{userProfile.name}</h2>
                <p className="text-amber-100/80 mb-4">{userProfile.institution}</p>
                <p className="text-amber-200/90 italic max-w-lg">{userProfile.bio}</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-amber-400" />
                    <span className="text-amber-100">Experience: {userProfile.experience} years</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-amber-400" />
                    <span className="text-amber-100">Committee: {userProfile.committee}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-amber-400" />
                    <span className="text-amber-100">Country: {userProfile.country}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-amber-400" />
                    <span className="text-amber-100">{userProfile.email}</span>
                  </div>
                </div>
                
                <div className="flex gap-4 mt-6 justify-center md:justify-start">
                  {userProfile.phone && (
                    <Link href={`tel:${userProfile.phone}`} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="icon" className="border-amber-500 text-amber-300 hover:bg-amber-900/30"><Phone className="h-4 w-4" /></Button>
                    </Link>
                  )}
                  {userProfile.socialLinks?.linkedin && (
                    <Link href={userProfile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="icon" className="border-amber-500 text-amber-300 hover:bg-amber-900/30">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.761s.784-1.76 1.75-1.761 1.75.79 1.75 1.761-.783 1.761-1.75 1.761zm13.5 12.268h-3v-5.604c0-3.368-4-3.535-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
                      </Button>
                    </Link>
                  )}
                  {userProfile.socialLinks?.twitter && (
                    <Link href={userProfile.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                      <Button variant="outline" size="icon" className="border-amber-500 text-amber-300 hover:bg-amber-900/30">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.414 0-6.185 2.771-6.185 6.185 0 .485.055.957.162 1.41-5.145-.258-9.71-2.72-12.76-6.467-.534.918-.84 1.986-.84 3.13 0 2.145 1.092 4.041 2.75 5.152-.962-.031-1.86-.296-2.652-.733v.077c0 3.007 2.136 5.503 4.972 6.07-.521.142-1.077.217-1.65.217-.404 0-.796-.04-1.18-.114.793 2.464 3.076 4.258 5.795 4.309-2.112 1.654-4.782 2.64-7.694 2.64-.503 0-.996-.03-1.48-.087 2.898 1.865 6.358 2.955 10.083 2.955 12.094 0 18.683-10.006 18.683-18.682 0-.285-.006-.568-.018-.85z"/></svg>
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- MUN CV Tab --- */}
        {activeTab === 'mun-cv' && (
          <div className="bg-black/40 backdrop-blur-sm border border-amber-800/30 rounded-xl shadow-lg shadow-amber-900/10 p-6">
            <h2 className="text-xl font-bold text-amber-300 mb-4">MUN CV</h2>
            <p className="text-amber-200/80 mb-4">
              A comprehensive list of your past Model UN conferences, awards, and portfolios.
            </p>
            <div className="space-y-4">
              <div className="bg-amber-900/20 p-4 rounded-lg border border-amber-800/30">
                <p className="font-semibold text-amber-100">Conference Name: KIMUN 2024</p>
                <p className="text-sm text-amber-200/80">Committee: UNGA-DISEC</p>
                <p className="text-sm text-amber-200/80">Portfolio: United Kingdom</p>
                <p className="text-sm text-amber-200/80">Awards: Best Delegate</p>
              </div>
              <div className="bg-amber-900/20 p-4 rounded-lg border border-amber-800/30">
                <p className="font-semibold text-amber-100">Conference Name: M.S. Ramaiah MUN 2023</p>
                <p className="text-sm text-amber-200/80">Committee: ECOSOC</p>
                <p className="text-sm text-amber-200/80">Portfolio: Japan</p>
                <p className="text-sm text-amber-200/80">Awards: Verbal Commendation</p>
              </div>
            </div>
            <p className="text-center text-amber-200/80 mt-6">
              This is a mock-up. You can update your MUN CV in your delegate registration portal.
            </p>
          </div>
        )}

        {/* --- Societies Tab --- */}
        {activeTab === 'societies' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading.societies ? (
              <div className="flex justify-center items-center py-10 md:col-span-2 lg:col-span-3">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
              </div>
            ) : filteredSocieties.length > 0 ? (
              filteredSocieties.map(society => (
                <div key={society.id} className="bg-black/40 backdrop-blur-sm border border-amber-800/30 rounded-xl overflow-hidden shadow-lg shadow-amber-900/10 transition-transform hover:scale-105">
                  <div className="relative h-40">
                    <Image 
                      src={society.image || '/default-society.jpg'} 
                      alt={society.name} 
                      layout="fill" 
                      objectFit="cover" 
                      className="rounded-t-xl"
                    />
                    <div className="absolute inset-0 bg-black/50 flex flex-col justify-end p-4">
                      <h2 className="text-xl font-bold text-amber-300">{society.name}</h2>
                      <p className="text-sm text-amber-200/80">{society.description}</p>
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-center text-sm text-amber-100">
                      <Users className="h-4 w-4 mr-2 text-amber-400" />
                      <span>{society.members} Members</span>
                    </div>
                    {society.isMember ? (
                      <Button onClick={() => handleLeaveSociety(society.id)} className="w-full bg-red-600 hover:bg-red-700 text-white">
                        Leave Society
                      </Button>
                    ) : (
                      <Button onClick={() => handleJoinSociety(society.id)} className="w-full bg-amber-600 hover:bg-amber-700 text-black">
                        Join Society
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="md:col-span-2 lg:col-span-3 text-center py-10">
                <p className="text-amber-200/80">No societies found matching your search.</p>
              </div>
            )}
          </div>
        )}

        {/* --- Marksheet Tab --- */}
        {activeTab === 'marksheet' && (
          <div className="bg-black/40 backdrop-blur-sm border border-amber-800/30 rounded-xl shadow-lg shadow-amber-900/10 p-6 text-center">
            <BarChart className="h-16 w-16 mx-auto mb-4 text-amber-400" />
            <h2 className="text-xl font-bold text-amber-300">Marksheet</h2>
            <p className="text-amber-200/80 mt-2">
              Your academic marks and scores for the conference sessions will appear here after the event.
            </p>
          </div>
        )}

        {/* --- Payments Tab --- */}
        {activeTab === 'payments' && (
          <div className="bg-black/40 backdrop-blur-sm border border-amber-800/30 rounded-xl shadow-lg shadow-amber-900/10 p-6">
            <h2 className="text-xl font-bold text-amber-300 mb-4">Payment History</h2>
            <div className="space-y-4">
              {loading.payments ? (
                <div className="flex justify-center items-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                </div>
              ) : payments.length > 0 ? (
                payments.map(payment => (
                  <div key={payment.id} className="bg-amber-900/20 p-4 rounded-lg border border-amber-800/30 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-amber-100">{payment.description}</p>
                      <p className="text-sm text-amber-200/80">{formatDate(payment.date)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-amber-300">{payment.amount}</p>
                      <p className={`text-xs font-medium ${payment.status === 'completed' ? 'text-green-400' : 'text-yellow-400'}`}>
                        {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-amber-200/80 py-6">No payments found.</p>
              )}
            </div>
          </div>
        )}

        {/* --- Events Tab --- */}
        {activeTab === 'events' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading.events ? (
              <div className="flex justify-center items-center py-10 md:col-span-2 lg:col-span-3">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
              </div>
            ) : filteredEvents.length > 0 ? (
              filteredEvents.map(event => (
                <div key={event.id} className="bg-black/40 backdrop-blur-sm border border-amber-800/30 rounded-xl overflow-hidden shadow-lg shadow-amber-900/10 transition-transform hover:scale-105">
                  <div className="relative h-48">
                    <Image 
                      src={event.image || '/default-event.jpg'} 
                      alt={event.title} 
                      layout="fill" 
                      objectFit="cover" 
                      className="rounded-t-xl"
                    />
                    <div className="absolute inset-0 bg-black/60 flex flex-col justify-end p-4">
                      <h2 className="text-xl font-bold text-amber-300">{event.title}</h2>
                      <p className="text-sm text-amber-200/80">{event.description}</p>
                    </div>
                  </div>
                  <div className="p-4 space-y-2">
                    <div className="flex items-center text-sm text-amber-100">
                      <Calendar className="h-4 w-4 mr-2 text-amber-400" />
                      <span>{event.date} at {event.time}</span>
                    </div>
                    <div className="flex items-center text-sm text-amber-100">
                      <MapPin className="h-4 w-4 mr-2 text-amber-400" />
                      <span>{event.location}</span>
                    </div>
                    <Button className="w-full bg-amber-600 hover:bg-amber-700 text-black">
                      View Details
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="md:col-span-2 lg:col-span-3 text-center py-10">
                <p className="text-amber-200/80">No events found matching your search.</p>
              </div>
            )}
          </div>
        )}

        {/* --- Chat Tab --- */}
        {activeTab === 'chat' && (
          <div className="bg-black/40 backdrop-blur-sm border border-amber-800/30 rounded-xl overflow-hidden shadow-lg shadow-amber-900/10 flex flex-col h-[70vh]">
            <div className="bg-gradient-to-r from-amber-900/40 to-amber-950/40 px-6 py-4 border-b border-amber-800/30">
              <h2 className="text-xl font-bold text-amber-300 flex items-center">
                <MessageCircle className="h-5 w-5 mr-2" />
                Community Chat
              </h2>
            </div>
            
            <div className="flex-1 p-6 space-y-4 overflow-y-auto">
              {loading.messages ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                </div>
              ) : messages.length > 0 ? (
                messages.map(msg => (
                  <div 
                    key={msg.id} 
                    className={`flex items-start gap-3 ${msg.userId === userProfile?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    {msg.userId !== userProfile?.id && (
                      <div className="w-8 h-8 rounded-full bg-amber-900/50 flex-shrink-0 flex items-center justify-center text-xs text-amber-100">
                        {msg.userName?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className={`flex flex-col max-w-xs ${msg.userId === userProfile?.id ? 'items-end' : 'items-start'}`}>
                      <span className={`text-xs mb-1 ${msg.userId === userProfile?.id ? 'text-amber-300/80' : 'text-amber-200/80'}`}>
                        {msg.userId === userProfile?.id ? 'You' : msg.userName}
                      </span>
                      <div className={`p-3 rounded-xl ${msg.userId === userProfile?.id ? 'bg-amber-600/50 text-white' : 'bg-amber-900/50 text-amber-100'}`}>
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-amber-200/60 mt-1">{formatTime(msg.timestamp)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-amber-200/80 py-6">
                  <p>No messages yet. Be the first to start the conversation!</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-amber-800/30 bg-black/50">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage() }}
                  className="flex-1 p-3 rounded-lg bg-black/50 border border-amber-800/30 focus:outline-none focus:ring-1 focus:ring-amber-500 text-white"
                />
                <Button onClick={handleSendMessage} className="bg-amber-600 hover:bg-amber-700 text-black font-bold">
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}