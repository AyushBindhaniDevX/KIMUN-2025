'use client'
import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { initializeApp } from 'firebase/app'
import { getDatabase, ref, get, set, remove, update } from 'firebase/database'
import { AlertCircle, Lock, Users, Globe, Settings, Trash, PlusCircle, Edit2 } from 'lucide-react'

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

const app = initializeApp(firebaseConfig)
const db = getDatabase(app)

type Committee = {
  id: string
  name: string
  emoji: string
  portfolios: {
    [key: string]: {
      country: string
      countryCode: string
      isDoubleDelAllowed: boolean
      isVacant: boolean
      minExperience: number
    }
  }
}

type Delegate = {
  id: string
  delegateInfo: {
    name: string
    email: string
    phone: string
    institution: string
    year: string
    course: string
    experience: number
    barcode: string // Added barcode field for delegate identification
  }
  committeeId: string
  portfolioId: string
  paymentId: string
  timestamp: number
}

export default function AdminPage() {
  const router = useRouter()
  const [committees, setCommittees] = useState<Committee[]>([])
  const [delegates, setDelegates] = useState<Delegate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [newCommitteeName, setNewCommitteeName] = useState('')
  const [newPortfolio, setNewPortfolio] = useState({
    country: '',
    countryCode: '',
    isDoubleDelAllowed: false,
    isVacant: false,
    minExperience: 0
  })
  const [editingCommitteeId, setEditingCommitteeId] = useState<string | null>(null)
  const [editingPortfolioId, setEditingPortfolioId] = useState<string | null>(null)
  const [barcodeInput, setBarcodeInput] = useState('')

  // Fetch committees and delegates
  useEffect(() => {
    const fetchData = async () => {
      try {
        const committeesRef = ref(db, 'committees')
        const committeesSnapshot = await get(committeesRef)
        
        if (committeesSnapshot.exists()) {
          const committeesData = committeesSnapshot.val()
          const committeesArray = Object.keys(committeesData).map(key => ({
            id: key,
            ...committeesData[key]
          }))
          setCommittees(committeesArray)
        }

        const delegatesRef = ref(db, 'registrations')
        const delegatesSnapshot = await get(delegatesRef)
        
        if (delegatesSnapshot.exists()) {
          const delegatesData = delegatesSnapshot.val()
          const delegatesArray = Object.keys(delegatesData).map(key => ({
            id: key,
            ...delegatesData[key]
          }))
          setDelegates(delegatesArray)
        }

        setLoading(false)
      } catch (err) {
        setError('Failed to load data')
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Add a new committee
  const addCommittee = async () => {
    if (!newCommitteeName.trim()) {
      setError('Committee name cannot be empty')
      return
    }
    const committeeId = new Date().getTime().toString() // Unique ID for the new committee
    try {
      const committeeRef = ref(db, `committees/${committeeId}`)
      await set(committeeRef, {
        name: newCommitteeName,
        emoji: '🌍', // Default emoji, change as needed
        portfolios: {}
      })
      setCommittees(prev => [...prev, { id: committeeId, name: newCommitteeName, emoji: '🌍', portfolios: {} }])
      setNewCommitteeName('') // Clear input
    } catch (err) {
      setError('Failed to add committee')
    }
  }

  // Add or update a portfolio
  const addOrUpdatePortfolio = async (committeeId: string) => {
    if (!newPortfolio.country || !newPortfolio.countryCode) {
      setError('Country and Country Code are required')
      return
    }
    const portfolioId = new Date().getTime().toString() // Unique ID for the new portfolio
    try {
      const portfolioRef = ref(db, `committees/${committeeId}/portfolios/${portfolioId}`)
      await set(portfolioRef, newPortfolio)
      setCommittees(prev => prev.map(committee => 
        committee.id === committeeId ? {
          ...committee,
          portfolios: {
            ...committee.portfolios,
            [portfolioId]: newPortfolio
          }
        } : committee
      ))
      setNewPortfolio({ country: '', countryCode: '', isDoubleDelAllowed: false, isVacant: false, minExperience: 0 })
    } catch (err) {
      setError('Failed to add/update portfolio')
    }
  }

  // Edit a committee
  const editCommittee = async (committeeId: string, name: string) => {
    if (!name.trim()) {
      setError('Committee name cannot be empty')
      return
    }
    try {
      const committeeRef = ref(db, `committees/${committeeId}`)
      await update(committeeRef, { name })
      setCommittees(prev => prev.map(committee => 
        committee.id === committeeId ? { ...committee, name } : committee
      ))
      setEditingCommitteeId(null) // Exit edit mode
    } catch (err) {
      setError('Failed to edit committee')
    }
  }

  // Edit a portfolio
  const editPortfolio = async (committeeId: string, portfolioId: string) => {
    if (!newPortfolio.country || !newPortfolio.countryCode) {
      setError('Country and Country Code are required')
      return
    }
    try {
      const portfolioRef = ref(db, `committees/${committeeId}/portfolios/${portfolioId}`)
      await update(portfolioRef, newPortfolio)
      setCommittees(prev => prev.map(committee => 
        committee.id === committeeId ? {
          ...committee,
          portfolios: {
            ...committee.portfolios,
            [portfolioId]: newPortfolio
          }
        } : committee
      ))
      setEditingPortfolioId(null) // Exit edit mode
    } catch (err) {
      setError('Failed to edit portfolio')
    }
  }

  // Delete a committee
  const deleteCommittee = async (committeeId: string) => {
    try {
      const committeeRef = ref(db, `committees/${committeeId}`)
      await remove(committeeRef)
      setCommittees(prev => prev.filter(c => c.id !== committeeId))
    } catch (err) {
      setError('Failed to delete committee')
    }
  }

  // Delete a portfolio
  const deletePortfolio = async (committeeId: string, portfolioId: string) => {
    try {
      const portfolioRef = ref(db, `committees/${committeeId}/portfolios/${portfolioId}`)
      await remove(portfolioRef)
      setCommittees(prev =>
        prev.map(committee =>
          committee.id === committeeId
            ? {
                ...committee,
                portfolios: Object.fromEntries(
                  Object.entries(committee.portfolios).filter(([id]) => id !== portfolioId)
                ),
              }
            : committee
        )
      )
    } catch (err) {
      setError('Failed to delete portfolio')
    }
  }
  

  // Delete a delegate
  const deleteDelegate = async (delegateId: string) => {
    try {
      const delegateRef = ref(db, `registrations/${delegateId}`)
      await remove(delegateRef)
      setDelegates(prev => prev.filter(d => d.id !== delegateId))
    } catch (err) {
      setError('Failed to delete delegate')
    }
  }

  // Check delegate by barcode
  const checkBarcode = async () => {
    try {
      const delegateRef = ref(db, 'registrations')
      const snapshot = await get(delegateRef)
      const delegateData = snapshot.val()

      const delegateFound = Object.values(delegateData).find((delegate: Delegate) => delegate.delegateInfo.barcode === barcodeInput)

      if (delegateFound) {
        alert('Delegate found: ' + delegateFound.delegateInfo.name)
      } else {
        alert('Delegate not found')
      }
    } catch (err) {
      setError('Failed to check barcode')
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <span className="text-gray-600">Loading data...</span>
    </div>
  )

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <AlertCircle className="w-12 h-12 text-red-600 mb-4" />
      <h2 className="text-xl font-semibold text-gray-800 mb-2">Error</h2>
      <p className="text-gray-600 max-w-md mb-4">{error}</p>
      <button
        onClick={() => window.location.reload()}
        className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
      >
        Try Again
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center gap-2">
          <Settings className="w-8 h-8" />
          Admin Dashboard
        </h1>

        {/* Committees Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Users className="w-8 h-8" />
            Committees
          </h2>

          <div className="space-y-4">
            {committees.map(committee => (
              <div key={committee.id} className="bg-white p-6 rounded-lg shadow-lg">
                {editingCommitteeId === committee.id ? (
                  <div className="flex items-center gap-4">
                    <input
                      type="text"
                      value={committee.name}
                      onChange={(e) => setCommittees(prev => prev.map(c => c.id === committee.id ? { ...c, name: e.target.value } : c))}
                      className="w-full px-4 py-2 border rounded-lg"
                    />
                    <button
                      onClick={() => editCommittee(committee.id, committee.name)}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingCommitteeId(null)}
                      className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <h3 className="text-xl font-semibold text-gray-800 flex justify-between">
                    <span>{committee.name}</span>
                    <div className="flex gap-4">
                      <button onClick={() => setEditingCommitteeId(committee.id)} className="text-blue-600 hover:underline">
                        Edit
                      </button>
                      <button onClick={() => deleteCommittee(committee.id)} className="text-red-600 hover:underline">
                        Delete
                      </button>
                    </div>
                  </h3>
                )}
                <p className="text-gray-600">{committee.emoji}</p>
                <div className="mt-4">
                  <h4 className="text-lg font-medium text-gray-700">Portfolios</h4>
                  <div className="mt-2">
                    {Object.entries(committee.portfolios).map(([portfolioId, portfolio]) => (
                      <div key={portfolioId} className="flex justify-between items-center">
                        <span>{portfolio.country}</span>
                        <div className="flex gap-4">
                          <button onClick={() => setEditingPortfolioId(portfolioId)} className="text-blue-600 hover:underline">
                            Edit Portfolio
                          </button>
                          <button onClick={() => deletePortfolio(committee.id, portfolioId)} className="text-red-600 hover:underline">
                            Delete Portfolio
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <h3 className="text-xl font-semibold text-gray-800">Add New Committee</h3>
            <div className="flex gap-4 mt-4">
              <input
                type="text"
                value={newCommitteeName}
                onChange={(e) => setNewCommitteeName(e.target.value)}
                placeholder="Committee Name"
                className="w-full px-4 py-2 border rounded-lg"
              />
              <button
                onClick={addCommittee}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
              >
                Add Committee
              </button>
            </div>
          </div>
        </div>

        {/* Delegate Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Globe className="w-8 h-8" />
            Delegates
          </h2>

          <div className="space-y-4">
            {delegates.map(delegate => (
              <div key={delegate.id} className="bg-white p-6 rounded-lg shadow-lg">
                <h3 className="text-xl font-semibold text-gray-800">{delegate.delegateInfo.name}</h3>
                <p className="text-gray-600">{delegate.delegateInfo.institution}</p>
                <p className="text-gray-600">{delegate.delegateInfo.course}</p>
                <p className="text-gray-600">Portfolio: {delegate.portfolioId}</p>
                <button
                  onClick={() => deleteDelegate(delegate.id)}
                  className="text-red-600 hover:underline mt-4"
                >
                  Delete Delegate
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Barcode Input Section */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Lock className="w-8 h-8" />
            Check Barcode
          </h2>

          <div className="flex gap-4">
            <input
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Enter Delegate Barcode"
              className="w-full px-4 py-2 border rounded-lg"
            />
            <button
              onClick={checkBarcode}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
            >
              Check
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}