'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ref, get } from 'firebase/database'
import { firebaseDb as database } from '@/lib/firebase-client'
import OasisCMLayout, { type CommitteeType } from '@/components/mun-os/OasisCMLayout'
import RollCallModule from '@/components/mun-os/RollCallModule'
import MotionsModule from '@/components/mun-os/MotionsModule'
import SpeakersModule from '@/components/mun-os/SpeakersModule'
import DocumentReaderModule from '@/components/mun-os/DocumentReaderModule'
import LiveChatModule from '@/components/mun-os/LiveChatModule'
import ArchivesModule from '@/components/mun-os/ArchivesModule'
import AgendaModule from '@/components/mun-os/AgendaModule'
import GSLModule from '@/components/mun-os/GSLModule'
import VotingGridModule from '@/components/mun-os/VotingGridModule'
import DraftResolutionModule from '@/components/mun-os/DraftResolutionModule'
import OpeningStatementsModule from '@/components/mun-os/OpeningStatementsModule'
import DebateFloorModule from '@/components/mun-os/DebateFloorModule'
import BroadcastModule from '@/components/mun-os/BroadcastModule'
import { useCommitteeSession } from '@/hooks/useCommitteeSession'

export interface SessionDelegate {
  id: string
  name: string
  country: string
  countryCode?: string
  portfolioId: string
  isDoubleDel?: boolean
  coDelegate?: { name: string }
}

function EBSessionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const committeeId = searchParams.get('committee')
  
  const [activeModule, setActiveModule] = useState('roll_call')
  const [delegates, setDelegates] = useState<SessionDelegate[]>([])
  const [committeeName, setCommitteeName] = useState<string>('')
  const [committeeType, setCommitteeType] = useState<CommitteeType>('un')
  const [dataLoading, setDataLoading] = useState(true)

  const { sessionState, loading: sessionLoading, updateSession } = useCommitteeSession(committeeId)

  useEffect(() => {
    if (!committeeId) { setDataLoading(false); return }

    const fetchData = async () => {
      setDataLoading(true)
      try {
        const cRef = ref(database, `committees/${committeeId}`)
        const cSnap = await get(cRef)
        let portfolios: Record<string, any> = {}
        if (cSnap.exists()) {
          const cData = cSnap.val()
          setCommitteeName(cData.name || '')
          setCommitteeType((cData.type as CommitteeType) || 'un')
          portfolios = cData.portfolios || {}
        }

        const rRef = ref(database, 'registrations')
        const rSnap = await get(rRef)
        const delegatesList: SessionDelegate[] = []
        
        if (rSnap.exists()) {
          const regs = rSnap.val()
          for (const regId in regs) {
            const reg = regs[regId]
            if (reg.committeeId !== committeeId) continue
            const portfolio = portfolios[reg.portfolioId] || {}
            const del1 = reg.delegateInfo?.delegate1
            if (del1) {
              delegatesList.push({
                id: regId,
                name: del1.name || 'Delegate',
                country: portfolio.country || reg.country || 'Unknown',
                countryCode: portfolio.countryCode || reg.countryCode || '',
                portfolioId: reg.portfolioId || regId,
                isDoubleDel: reg.isDoubleDel || false,
                coDelegate: reg.isDoubleDel && reg.delegateInfo?.delegate2 ? { name: reg.delegateInfo.delegate2.name } : undefined
              })
            }
          }
        }
        delegatesList.sort((a, b) => a.country.localeCompare(b.country))
        setDelegates(delegatesList)
      } catch (e) { console.error('Failed to fetch session data:', e) }
      setDataLoading(false)
    }
    fetchData()
  }, [committeeId])

  if (!committeeId) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center">
        <h2 className="text-xl font-bold text-slate-800 mb-2">No Committee Selected</h2>
        <button onClick={() => router.push('/eb-portal')} className="text-indigo-600 hover:underline">Return to Dashboard</button>
      </div>
    </div>
  )

  if (dataLoading || sessionLoading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 gap-4">
      <span className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-slate-500 text-sm font-medium">Loading Oasis CM...</p>
    </div>
  )

  const renderModule = () => {
    const commonProps = { role: 'eb' as const, delegates, sessionState, setSessionState: updateSession }
    switch(activeModule) {
      // Common
      case 'roll_call': return <RollCallModule {...commonProps} />
      case 'motions': return <MotionsModule {...commonProps} committeeId={committeeId} />
      case 'speakers': return <SpeakersModule {...commonProps} />
      case 'document': return <DocumentReaderModule {...commonProps} />
      case 'chat': return <LiveChatModule role="eb" committeeId={committeeId} />
      case 'archives': return <ArchivesModule committeeId={committeeId} sessionState={sessionState} />
      // UN
      case 'agenda': return <AgendaModule role="eb" sessionState={sessionState} setSessionState={updateSession} committeeName={committeeName} />
      case 'gsl': return <GSLModule {...commonProps} />
      case 'voting': return <VotingGridModule {...commonProps} />
      case 'draft': return <DraftResolutionModule role="eb" sessionState={sessionState} setSessionState={updateSession} committeeId={committeeId} />
      case 'directive': return <DraftResolutionModule role="eb" sessionState={sessionState} setSessionState={updateSession} committeeId={committeeId} />
      // AIPPM
      case 'opening': return <OpeningStatementsModule {...commonProps} />
      case 'debate': return <DebateFloorModule {...commonProps} />
      case 'points': return <DebateFloorModule {...commonProps} />
      // IP
      case 'coverage': return <LiveChatModule role="eb" committeeId={committeeId} />
      case 'interviews': return <LiveChatModule role="eb" committeeId={committeeId} />
      case 'broadcast': return <BroadcastModule role="eb" committeeId={committeeId} sessionState={sessionState} setSessionState={updateSession} />
      default: return <div className="text-center text-slate-400 py-20">Module under construction.</div>
    }
  }

  return (
    <OasisCMLayout 
      activeModule={activeModule} 
      setActiveModule={setActiveModule}
      role="eb"
      committeeName={committeeName}
      committeeType={committeeType}
    >
      {renderModule()}
    </OasisCMLayout>
  )
}

export default function EBSessionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <span className="w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
      </div>
    }>
      <EBSessionContent />
    </Suspense>
  )
}
