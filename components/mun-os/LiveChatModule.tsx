'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Send, Users, MessageCircle } from 'lucide-react'
import { firebaseDb as database } from '@/lib/firebase-client'
import { ref, onValue, push, set } from 'firebase/database'

interface LiveChatModuleProps {
  role: 'eb' | 'delegate'
  committeeId?: string | null
}

interface ChatMessage {
  id: string
  text: string
  senderRole: string
  senderId: string
  timestamp: number
}

export default function LiveChatModule({ role, committeeId }: LiveChatModuleProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const chatRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!committeeId) return

    const messagesRef = ref(database, `committeeSessions/${committeeId}/chat`)
    const unsubscribe = onValue(messagesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val()
        const msgs = Object.keys(data).map(key => ({
          id: key,
          ...data[key]
        }))
        msgs.sort((a, b) => a.timestamp - b.timestamp)
        setMessages(msgs)
      } else {
        setMessages([])
      }
    })

    return () => unsubscribe()
  }, [committeeId])

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight
    }
  }, [messages])

  const handleSendMessage = () => {
    if (!inputText.trim() || !committeeId) return

    const messagesRef = ref(database, `committeeSessions/${committeeId}/chat`)
    const newMessageRef = push(messagesRef)
    
    set(newMessageRef, {
      text: inputText.trim(),
      senderRole: role,
      senderId: role === 'eb' ? 'Executive Board' : 'Delegate', // Need actual name if possible
      timestamp: Date.now()
    })
    
    setInputText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage()
    }
  }

  const formatTime = (ts: number) => {
    const d = new Date(ts)
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex overflow-hidden h-[600px]">
      
      {/* Channels Sidebar */}
      <div className="w-1/3 bg-slate-50 border-r border-slate-200 flex flex-col hidden md:flex">
        <div className="p-6 bg-white border-b border-slate-200 font-bold text-slate-800 flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-indigo-600" />
          Committee Chat
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 bg-indigo-50 border-l-4 border-indigo-600 cursor-pointer">
            <h3 className="font-bold text-sm text-indigo-900">Everyone</h3>
            <p className="text-xs text-indigo-600/70 truncate">
              {messages.length > 0 ? messages[messages.length - 1].text : 'No messages yet'}
            </p>
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white flex flex-col">
        <div className="p-6 border-b border-slate-200 bg-white flex justify-between items-center">
          <div>
            <h2 className="font-bold text-slate-800 text-lg">Everyone</h2>
            <p className="text-xs text-slate-500 font-medium">Synced to {committeeId || 'Committee'}</p>
          </div>
          <div className="flex gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mt-1" />
            <span className="text-xs font-semibold text-green-600">Live</span>
          </div>
        </div>

        <div 
          ref={chatRef}
          className="flex-1 p-6 overflow-y-auto space-y-6 bg-slate-50/50 scroll-smooth"
        >
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm font-medium">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderRole === role
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-4 rounded-2xl shadow-sm max-w-[80%] text-sm font-medium ${
                    isMe 
                      ? 'bg-indigo-600 text-white rounded-tr-sm' 
                      : msg.senderRole === 'eb'
                        ? 'bg-amber-100 text-amber-900 border border-amber-200 rounded-tl-sm'
                        : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm'
                  }`}>
                    {!isMe && (
                      <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
                        msg.senderRole === 'eb' ? 'text-amber-600' : 'text-slate-400'
                      }`}>
                        {msg.senderRole === 'eb' ? 'Executive Board' : 'Delegate'}
                      </p>
                    )}
                    {msg.text}
                    <p className={`text-[10px] text-right mt-1 ${
                      isMe ? 'text-indigo-200' : 'text-slate-400'
                    }`}>
                      {formatTime(msg.timestamp)}
                    </p>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="p-4 bg-white border-t border-slate-200 flex items-center gap-3">
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..." 
            className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
          <button 
            onClick={handleSendMessage}
            disabled={!inputText.trim()}
            className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-white hover:bg-indigo-700 shadow-sm transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>

    </div>
  )
}
