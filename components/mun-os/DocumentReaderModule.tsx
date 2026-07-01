import React from 'react'
import { FileText, Download, ExternalLink } from 'lucide-react'

interface DocumentReaderModuleProps {
  role: 'eb' | 'delegate'
  sessionState: any
  setSessionState?: (state: any) => void
}

export default function DocumentReaderModule({ role, sessionState, setSessionState }: DocumentReaderModuleProps) {
  const activeDocument = sessionState?.activeDocument || ''

  const handlePushDocument = () => {
    if (role !== 'eb' || !setSessionState) return
    const docName = prompt("Enter document URL (e.g., Google Docs link) or name to push to delegates:")
    if (docName) {
      setSessionState({ activeDocument: docName })
    }
  }

  const isUrl = activeDocument.startsWith('http://') || activeDocument.startsWith('https://')

  return (
    <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200 h-[600px] flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Document Viewer</h2>
          <p className="text-sm text-slate-500 mt-1">Review active resolutions and working papers.</p>
        </div>
        
        <div className="flex gap-4">
          {isUrl && (
            <a 
              href={activeDocument}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold transition-colors"
            >
              <ExternalLink className="w-4 h-4" /> Open in New Tab
            </a>
          )}
          
          {role === 'eb' && (
            <button 
              onClick={handlePushDocument}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold text-sm shadow-sm transition-colors"
            >
              Push Document
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-slate-400 relative overflow-hidden group">
        {!activeDocument ? (
          <div className="text-center">
            <FileText className="w-16 h-16 mb-4 text-slate-300 mx-auto" />
            <h3 className="text-lg font-semibold text-slate-500">No Document Active</h3>
            <p className="text-sm mt-2">Waiting for the Executive Board to push a document.</p>
          </div>
        ) : isUrl ? (
          <iframe 
            src={activeDocument} 
            className="w-full h-full border-none rounded-xl"
            title="Document Viewer"
          />
        ) : (
          <div className="text-center z-10">
            <FileText className="w-24 h-24 mb-4 text-slate-300 group-hover:scale-110 transition-transform duration-500 mx-auto" />
            <h3 className="text-xl font-bold text-slate-600 mb-2">{activeDocument}</h3>
            <p className="text-sm max-w-sm px-4 text-slate-400">
              {role === 'eb' 
                ? 'This document title is currently visible to all delegates.'
                : 'This document has been pushed to your screen.'}
            </p>
          </div>
        )}
        
        {/* Decorative elements */}
        {!isUrl && (
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-indigo-400 to-transparent opacity-50" />
        )}
      </div>
    </div>
  )
}
