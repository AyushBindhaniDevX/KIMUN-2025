import { useState, useEffect } from 'react'
import { firebaseDb as database } from '@/lib/firebase-client'
import { ref, onValue, set, update } from 'firebase/database'

export interface SessionState {
  committeeType?: 'un' | 'aippm' | 'ip'
  rollCall: Record<string, string>
  speakersList: {
    currentSpeaker: string | null
    queue: string[]
    isTimerRunning: boolean
    timerStart: number
    timeLimit: number
  }
  motions: any[]
  activeDocument: string | null
  // UN-specific
  agenda: {
    topics: string[]
    activeTopicIndex: number | null
    isSet: boolean
  }
  gsl: {
    currentSpeaker: string | null
    queue: string[]
    isTimerRunning: boolean
    timerStart: number
    timeLimit: number
  }
  voting: {
    isOpen: boolean
    resolutionTitle: string
    votes: Record<string, 'yes' | 'no' | 'abstain'>
  }
  drafts: Record<string, {
    id: string
    title: string
    sponsors: string[]
    signatories: string[]
    preamblatory: string[]
    operative: string[]
    status: 'submitted' | 'approved' | 'rejected'
    submittedAt: number
    submittedBy: string
  }>
  // AIPPM-specific
  openingStatements: {
    currentParty: string | null
    queue: string[]
    isTimerRunning: boolean
    timerStart: number
    timeLimit: number
    completed: string[]
  }
  points: Array<{
    id: string
    type: 'information' | 'order' | 'reply'
    raisedBy: string
    status: 'pending' | 'granted' | 'denied'
    timestamp: number
  }>
  // IP-specific
  broadcasts: Record<string, {
    id: string
    headline: string
    body: string
    author: string
    beat: string
    publishedAt: number
    type: 'news' | 'opinion' | 'bulletin' | 'breaking'
  }>
  beatAssignments: Record<string, string>
}

const defaultState: SessionState = {
  rollCall: {},
  speakersList: { currentSpeaker: null, queue: [], isTimerRunning: false, timerStart: 0, timeLimit: 90 },
  motions: [],
  activeDocument: null,
  agenda: { topics: [], activeTopicIndex: null, isSet: false },
  gsl: { currentSpeaker: null, queue: [], isTimerRunning: false, timerStart: 0, timeLimit: 90 },
  voting: { isOpen: false, resolutionTitle: '', votes: {} },
  drafts: {},
  openingStatements: { currentParty: null, queue: [], isTimerRunning: false, timerStart: 0, timeLimit: 120, completed: [] },
  points: [],
  broadcasts: {},
  beatAssignments: {}
}

export const useCommitteeSession = (committeeId: string | null) => {
  const [sessionState, setSessionState] = useState<SessionState>(defaultState)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!committeeId) { setLoading(false); return }

    const sessionRef = ref(database, `committeeSessions/${committeeId}`)
    const unsubscribe = onValue(sessionRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        setSessionState({
          ...defaultState,
          ...data,
          rollCall: data.rollCall || {},
          speakersList: { ...defaultState.speakersList, ...data.speakersList },
          motions: data.motions || [],
          agenda: { ...defaultState.agenda, ...data.agenda },
          gsl: { ...defaultState.gsl, ...data.gsl },
          voting: { ...defaultState.voting, ...data.voting },
          drafts: data.drafts || {},
          openingStatements: { ...defaultState.openingStatements, ...data.openingStatements },
          points: data.points || [],
          broadcasts: data.broadcasts || {},
          beatAssignments: data.beatAssignments || {}
        })
      } else {
        set(sessionRef, defaultState)
        setSessionState(defaultState)
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [committeeId])

  const updateSession = async (updates: Partial<SessionState>) => {
    if (!committeeId) return
    const sessionRef = ref(database, `committeeSessions/${committeeId}`)
    await update(sessionRef, updates)
  }

  return { sessionState, loading, updateSession }
}
