import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, Video, Loader2, CheckCircle2, Volume2, AlertCircle, RefreshCw, Briefcase, GraduationCap, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface AIInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: any;
  onComplete: (score: number, feedback: string) => void;
}

export default function AIInterviewModal({ isOpen, onClose, application, onComplete }: AIInterviewModalProps) {
  const [step, setStep] = useState<'intro' | 'interview' | 'evaluating' | 'done'>('intro');
  const [isRecording, setIsRecording] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [hasPermissions, setHasPermissions] = useState(false);
  
  const [history, setHistory] = useState<{role: 'user' | 'model', text: string}[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef(false);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load from localStorage if available
  useEffect(() => {
    if (isOpen && application?.name) {
      const savedStateStr = localStorage.getItem(`ai_interview_${application.name}`);
      if (savedStateStr) {
        try {
          const savedState = JSON.parse(savedStateStr);
          if (savedState.step !== 'done' && savedState.step !== 'evaluating') {
             setHistory(savedState.history || []);
             if (savedState.step === 'interview') {
               setStep('interview');
             }
          }
        } catch (e) {
          console.error("Failed to parse saved interview state", e);
        }
      }
    }
  }, [isOpen, application]);

  // Save to localStorage when history or step changes
  useEffect(() => {
    if (isOpen && application?.name && (history.length > 0 || step !== 'intro')) {
       localStorage.setItem(`ai_interview_${application.name}`, JSON.stringify({
         step,
         history
       }));
    }
  }, [history, step, isOpen, application]);

  useEffect(() => {
    if (!isOpen) {
      stopMedia();
      setStep('intro');
      setHistory([]);
      setCurrentTranscript('');
      setIsRecording(false);
      setIsAiSpeaking(false);
      setConnectionError(null);
      isRecordingRef.current = false;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    } else {
      initMedia();
    }
    return () => stopMedia();
  }, [isOpen]);

  const initMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setHasPermissions(true);
      initSpeechRecognition();
    } catch (err) {
      console.error('Error accessing media devices:', err);
      alert('Please allow camera and microphone access to continue.');
      onClose();
    }
  };

  const stopMedia = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
  };

  const initSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-IN';

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            setCurrentTranscript(prev => prev + event.results[i][0].transcript + ' ');
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        
        const fullText = (currentTranscript + interim).trim();
        if (fullText.length > 0) {
          silenceTimerRef.current = setTimeout(() => {
            handleUserFinishedSpeaking();
          }, 3500);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'no-speech') {
          console.error('Speech recognition error', event.error);
        }
      };

      recognition.onend = () => {
        if (isRecordingRef.current) {
          try { recognition.start(); } catch (e) {}
        }
      };

      recognitionRef.current = recognition;
    }
  };

  const playElevenLabsAudio = async (text: string) => {
    try {
      setIsAiSpeaking(true);
      const res = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      if (!res.ok) throw new Error('TTS failed');
      
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      
      await new Promise<void>((resolve) => {
        audio.onended = () => resolve();
        audio.play().catch(e => {
          console.error('Audio play blocked:', e);
          resolve();
        });
      });
    } catch (err) {
      console.error('TTS Error:', err);
      await new Promise<void>((resolve) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onend = () => resolve();
        window.speechSynthesis.speak(utterance);
      });
    } finally {
      setIsAiSpeaking(false);
    }
  };

  const getNextAIResponse = async (currentHistory: {role: 'model' | 'user', text: string}[]) => {
    try {
      setIsAiSpeaking(true);
      setConnectionError(null);
      const res = await fetch('/api/interview-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: currentHistory,
          department: application?.pref1,
          statement: application?.statement,
          experience: application?.experience
        })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      const aiReply = data.reply;
      const isFinished = data.isFinished;

      const updatedHistory = [...currentHistory, { role: 'model', text: aiReply }] as {role: 'model'|'user', text: string}[];
      setHistory(updatedHistory);

      await playElevenLabsAudio(aiReply);

      if (isFinished) {
        setStep('evaluating');
        evaluateFinal(updatedHistory);
      } else {
        startRecording();
      }
    } catch (err: any) {
      console.error(err);
      setIsAiSpeaking(false);
      setConnectionError(err.message || 'Error connecting to AI recruiter.');
    }
  };

  const startInterview = async () => {
    setStep('interview');
    if (history.length === 0) {
      await getNextAIResponse([]);
    } else if (history[history.length - 1].role === 'model') {
      startRecording();
    } else {
      await getNextAIResponse(history);
    }
  };

  const handleUserFinishedSpeaking = () => {
    if (!isRecordingRef.current) return;
    
    setIsRecording(false);
    isRecordingRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    const userText = currentTranscript.trim() || '(Nodded/Silence)';
    
    const newHistory = [...history, { role: 'user', text: userText }] as {role: 'user'|'model', text: string}[];
    setHistory(newHistory);
    setCurrentTranscript('');
    
    getNextAIResponse(newHistory);
  };

  const startRecording = () => {
    setCurrentTranscript('');
    setIsRecording(true);
    isRecordingRef.current = true;
    if (recognitionRef.current) {
      try { recognitionRef.current.start(); } catch (e) {}
    }
  };

  const evaluateFinal = async (finalHistory: {role: 'model' | 'user', text: string}[]) => {
    stopMedia();
    const combinedTranscript = finalHistory.map(h => `${h.role === 'model' ? 'Recruiter' : 'Applicant'}: ${h.text}`).join('\n\n');

    try {
      const res = await fetch('/api/evaluate-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: combinedTranscript,
          department: application?.pref1 || 'Secretariat'
        })
      });

      const data = await res.json();
      if (data.success) {
        localStorage.removeItem(`ai_interview_${application?.name}`);
        onComplete(data.score, data.feedback);
        setStep('done');
      } else {
        setConnectionError('Failed to evaluate interview: ' + data.error);
        setIsAiSpeaking(false);
      }
    } catch (err: any) {
      console.error(err);
      setConnectionError('Error evaluating interview.');
      setIsAiSpeaking(false);
    }
  };

  const retryLastAction = () => {
    if (step === 'evaluating') {
      evaluateFinal(history);
    } else {
      getNextAIResponse(history);
    }
  };

  const displayModelText = history.length > 0 && history[history.length - 1].role === 'model' 
    ? history[history.length - 1].text 
    : "Listening...";

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/90 backdrop-blur-md p-2 md:p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden w-full h-full max-h-[900px] max-w-7xl flex flex-col md:flex-row relative border border-zinc-800"
        >
          {/* Close button for intro step */}
          {step === 'intro' && (
            <button onClick={onClose} className="absolute top-4 right-4 z-20 p-2.5 bg-zinc-800/80 hover:bg-zinc-700 rounded-full text-zinc-300 transition-colors backdrop-blur-sm">
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Left Side: Video Feed / Google Meet Style */}
          <div className="w-full md:w-2/3 bg-black relative flex flex-col items-center justify-center overflow-hidden">
            
            {/* Recruiter Video (Main) */}
            <video 
              src="/images/recruitervideo.mp4"
              autoPlay 
              loop
              playsInline 
              muted 
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${(step === 'evaluating' || step === 'done' || step === 'intro') ? 'opacity-0' : 'opacity-100'}`}
            />
            
            {/* Intro / Done State Overlay */}
            {(step === 'intro' || step === 'evaluating' || step === 'done') && (
               <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 to-black/80 flex flex-col items-center justify-center z-10 p-8">
                 {step === 'intro' && (
                    <div className="text-center max-w-lg">
                      <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Video className="w-10 h-10 text-indigo-400" />
                      </div>
                      <h2 className="text-3xl font-bold text-white mb-4">AI Video Interview</h2>
                      <p className="text-zinc-300 text-lg mb-8 leading-relaxed">
                        You're about to join a Google Meet style conversational interview. Our AI recruiter will review your application and ask situational questions dynamically.
                      </p>
                      {!hasPermissions ? (
                        <div className="flex items-center justify-center gap-3 text-zinc-400 bg-zinc-800/50 py-4 px-6 rounded-2xl">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Requesting camera access...</span>
                        </div>
                      ) : (
                        <Button 
                          onClick={startInterview} 
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-6 px-10 rounded-2xl text-lg shadow-xl shadow-indigo-900/50 transition-all hover:scale-105"
                        >
                          {history.length > 0 ? "Resume Interview" : "Join Interview"}
                        </Button>
                      )}
                    </div>
                 )}
                 {step === 'evaluating' && (
                    <div className="text-center">
                      <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mx-auto mb-6" />
                      <h3 className="text-2xl font-bold text-white">Evaluating your responses...</h3>
                      <p className="text-zinc-400 mt-3 max-w-md mx-auto text-lg">
                        Our AI is analyzing your interview transcript to generate a final score.
                      </p>
                    </div>
                 )}
                 {step === 'done' && (
                    <div className="text-center">
                      <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-12 h-12 text-emerald-400" />
                      </div>
                      <h3 className="text-3xl font-bold text-white mb-4">Interview Complete!</h3>
                      <p className="text-zinc-300 text-lg mb-8 max-w-md mx-auto">
                        Your interview has been successfully evaluated. The recruitment team will review the results.
                      </p>
                      <Button 
                        onClick={onClose} 
                        className="bg-white hover:bg-zinc-200 text-black font-bold py-6 px-10 rounded-2xl text-lg transition-all hover:scale-105"
                      >
                        Return to Dashboard
                      </Button>
                    </div>
                 )}
               </div>
            )}

            {/* Applicant PiP (Picture in Picture) */}
            {step === 'interview' && (
              <div className="absolute bottom-6 right-6 w-48 aspect-video bg-zinc-800 rounded-2xl overflow-hidden shadow-2xl border-2 border-zinc-700/50 z-20">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  muted 
                  className="w-full h-full object-cover transform -scale-x-100" // Mirror effect
                />
                <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-xs text-white font-medium flex items-center gap-1.5">
                  <UserIcon className="w-3 h-3" /> You
                </div>
                {isRecording && (
                   <div className="absolute top-2 right-2 flex items-center justify-center w-6 h-6 bg-red-500/20 rounded-full animate-pulse">
                     <div className="w-2.5 h-2.5 bg-red-500 rounded-full"></div>
                   </div>
                )}
              </div>
            )}

            {/* Speaking Status Overlays */}
            {step === 'interview' && (
              <div className="absolute top-6 left-6 flex flex-col gap-3 z-20">
                <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl text-sm text-white font-medium border border-white/10 flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  AI Recruiter (Oasis)
                </div>
                {isAiSpeaking && (
                  <div className="bg-indigo-600/90 backdrop-blur-md text-white text-sm font-bold px-4 py-2.5 rounded-xl flex items-center gap-2.5 shadow-lg border border-indigo-500/50 animate-pulse">
                    <Volume2 className="w-4 h-4" />
                    Speaking...
                  </div>
                )}
              </div>
            )}

            {/* Bottom Controls Bar (Google Meet style) */}
            {step === 'interview' && (
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-4 z-20">
                <button 
                  className={`w-14 h-14 rounded-full flex items-center justify-center backdrop-blur-md transition-all ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300'}`}
                  onClick={isRecording ? handleUserFinishedSpeaking : undefined}
                >
                  <Mic className={`w-6 h-6 ${isRecording ? 'text-white' : 'text-zinc-300'}`} />
                </button>
                <button 
                  className="w-14 h-14 rounded-full bg-zinc-800/80 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 backdrop-blur-md transition-all"
                >
                  <Video className="w-6 h-6" />
                </button>
                <button 
                  onClick={onClose}
                  className="w-16 h-12 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center text-white shadow-lg transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            )}
          </div>

          {/* Right Side: Details & Chat Panel */}
          {step === 'interview' && (
            <div className="w-full md:w-1/3 bg-zinc-900 border-l border-zinc-800 flex flex-col h-full z-30">
              
              {/* Applicant Details Header */}
              <div className="p-6 border-b border-zinc-800 bg-zinc-900/50">
                <h3 className="text-white font-bold text-lg mb-1">{application?.name || 'Applicant'}</h3>
                <div className="flex items-center gap-2 text-zinc-400 text-sm mb-3">
                  <Briefcase className="w-4 h-4" />
                  <span>{application?.pref1 || 'Secretariat'}</span>
                </div>
                <div className="flex gap-2">
                  <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs px-2.5 py-1 rounded-full font-medium">Fast-track Interview</span>
                </div>
              </div>

              {/* Chat Transcript Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-zinc-700">
                {history.map((msg, idx) => (
                  <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <span className="text-xs text-zinc-500 mb-1.5 font-medium ml-1">
                      {msg.role === 'model' ? 'Recruiter' : 'You'}
                    </span>
                    <div className={`p-4 rounded-2xl max-w-[85%] text-sm leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-indigo-600 text-white rounded-tr-sm' 
                        : 'bg-zinc-800 text-zinc-200 border border-zinc-700 rounded-tl-sm'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}

                {/* Live Transcript Bubble */}
                {isRecording && (
                   <div className="flex flex-col items-end">
                     <span className="text-xs text-zinc-500 mb-1.5 font-medium mr-1">You</span>
                     <div className="p-4 rounded-2xl max-w-[85%] text-sm leading-relaxed bg-indigo-600/50 border border-indigo-500/30 text-indigo-100 rounded-tr-sm italic">
                       {currentTranscript || "Listening..."}
                     </div>
                   </div>
                )}
                
                {/* AI Thinking Bubble */}
                {isAiSpeaking && !isRecording && (
                   <div className="flex flex-col items-start">
                     <span className="text-xs text-zinc-500 mb-1.5 font-medium ml-1">Recruiter</span>
                     <div className="p-4 rounded-2xl bg-zinc-800 text-zinc-400 border border-zinc-700 rounded-tl-sm flex items-center gap-2">
                       <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce"></div>
                       <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                       <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                     </div>
                   </div>
                )}
              </div>

              {/* Connection Error Banner */}
              {connectionError && (
                <div className="p-4 m-4 bg-red-500/10 border border-red-500/20 rounded-xl flex flex-col gap-3">
                  <div className="flex items-start gap-3 text-red-400">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <p className="text-sm leading-relaxed">{connectionError}</p>
                  </div>
                  <Button 
                    onClick={retryLastAction} 
                    className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-300 font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" /> Retry Connection
                  </Button>
                </div>
              )}

              {/* Manual Submission Button (Fallback) */}
              {isRecording && !connectionError && (
                <div className="p-4 bg-zinc-900 border-t border-zinc-800">
                  <Button 
                    onClick={handleUserFinishedSpeaking}
                    className="w-full bg-white hover:bg-zinc-200 text-black font-bold py-5 rounded-xl shadow-lg transition-transform active:scale-95"
                  >
                    Send Reply
                  </Button>
                </div>
              )}
            </div>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
