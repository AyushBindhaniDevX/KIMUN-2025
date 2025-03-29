'use client'
import React, { useState, useEffect } from 'react'
import { initializeApp } from 'firebase/app'
import { getDatabase, ref, get } from 'firebase/database'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Globe, Users, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'

// Reuse your firebase config
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
  portfolios: Portfolio[]
}

type Portfolio = {
  id: string
  country: string
  countryCode: string
  isDoubleDelAllowed: boolean
  isVacant: boolean
  minExperience: number
}

export default function MatrixPage() {
  const [committees, setCommittees] = useState<Committee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchCommittees = async () => {
      try {
        const committeesRef = ref(db, 'committees')
        const snapshot = await get(committeesRef)
        
        if (snapshot.exists()) {
          const committeesData = snapshot.val()
          const committeesArray = Object.keys(committeesData).map(key => ({
            id: key,
            ...committeesData[key],
            portfolios: Object.keys(committeesData[key].portfolios || {}).map(portfolioKey => ({
              id: portfolioKey,
              ...committeesData[key].portfolios[portfolioKey]
            }))
          }))
          setCommittees(committeesArray)
        }
        setLoading(false)
      } catch (err) {
        setError('Failed to load committees data')
        setLoading(false)
      }
    }

    fetchCommittees()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 text-amber-500 animate-spin" />
          <p className="text-amber-300">Loading allocation matrix...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 text-center">
        <XCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-semibold text-amber-300 mb-2">Error</h2>
        <p className="text-gray-300 max-w-md mb-4">{error}</p>
        <Button 
          onClick={() => window.location.reload()} 
          className="mt-4 bg-amber-600 hover:bg-amber-700 text-black"
        >
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="bg-black/50 backdrop-blur-md border-b border-amber-800/20">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="flex items-center gap-2">
              <Image 
                src="https://media.discordapp.net/attachments/1268556254448455713/1355478819359817789/KIMUN_Logo_Color.png?ex=67e91386&is=67e7c206&hm=069060e64b9b750db76fd94f7b58e95940e6bb791a6c78f672b8361f802b7084&=&format=webp&quality=lossless&width=900&height=900" 
                alt="KIMUN Logo" 
                width={40} 
                height={40} 
                className="mr-2" 
              />
              <span className="text-lg font-bold text-amber-300 hidden sm:inline-block">
                Kalinga International MUN
              </span>
            </Link>
          </div>
          <Link href="/">
            <Button variant="ghost" className="text-amber-300 hover:bg-amber-900/30">
              <ChevronLeft className="mr-2 h-4 w-4" /> Back to Home
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-amber-300 mb-4 flex items-center justify-center gap-3">
            <Globe className="text-amber-400" /> Allocation Matrix
          </h1>
          <p className="text-xl text-amber-100/80 max-w-3xl mx-auto">
            View the current status of committee allocations and portfolio vacancies
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {committees.map(committee => {
            const vacantPortfolios = committee.portfolios.filter(p => p.isVacant).length
            const allocatedPortfolios = committee.portfolios.length - vacantPortfolios

            return (
              <motion.div
                key={committee.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                whileHover={{ scale: 1.02 }}
                className="bg-black/50 backdrop-blur-sm border border-amber-800/30 rounded-xl overflow-hidden hover:border-amber-500 transition-colors"
              >
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-2xl font-bold text-white">{committee.name}</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-amber-900/20 p-4 rounded-lg">
                      <p className="text-gray-400">Total Portfolios</p>
                      <p className="text-2xl font-bold text-amber-300">{committee.portfolios.length}</p>
                    </div>
                    <div className="bg-amber-900/20 p-4 rounded-lg">
                      <p className="text-gray-400">Available</p>
                      <p className="text-2xl font-bold text-amber-300">{vacantPortfolios}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-medium text-amber-300 flex items-center gap-2">
                      <Users className="h-5 w-5" /> Portfolios
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {committee.portfolios.slice(0, 4).map(portfolio => (
                        <div 
                          key={portfolio.id} 
                          className={`p-2 rounded-md text-sm flex items-center gap-2 ${
                            portfolio.isVacant 
                              ? 'bg-green-900/20 text-green-400' 
                              : 'bg-amber-900/20 text-amber-400'
                          }`}
                        >
                          {portfolio.isVacant ? (
                            <span className="text-xs">✓</span>
                          ) : (
                            <span className="text-xs">✗</span>
                          )}
                          {portfolio.country}
                        </div>
                      ))}
                      {committee.portfolios.length > 4 && (
                        <div className="p-2 rounded-md text-sm bg-black/30 text-gray-400">
                          +{committee.portfolios.length - 4} more
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Detailed Table View */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-amber-300 mb-6 flex items-center gap-2">
            Detailed Portfolio Status
          </h2>
          
          <div className="border border-amber-800/30 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-amber-900/10">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-amber-300 uppercase tracking-wider">Committee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-amber-300 uppercase tracking-wider">Country</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-amber-300 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-amber-300 uppercase tracking-wider">Double Del</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-800/30">
                  {committees.map(committee => (
                    committee.portfolios.map(portfolio => (
                      <tr key={`${committee.id}-${portfolio.id}`} className="hover:bg-amber-900/10">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">
                          {committee.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {portfolio.country}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {portfolio.isVacant ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900 text-green-300">
                              Available
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-900 text-amber-300">
                              Allocated
                            </span>
                          )}
                        </td>
                       
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                          {portfolio.isDoubleDelAllowed ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </td>
                      </tr>
                    ))
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}