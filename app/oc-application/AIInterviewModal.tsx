import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, Video, Loader2, CheckCircle2, Volume2 } from 'lucide-react';
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
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const isRecordingRef = useRef(false);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopMedia();
      setStep('intro');
      setHistory([]);
      setCurrentTranscript('');
      setIsRecording(false);
      setIsAiSpeaking(false);
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
      recognition.lang = 'en-IN'; // Using Indian English profile for better detection

      recognition.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            setCurrentTranscript(prev => prev + event.results[i][0].transcript + ' ');
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        
        // Reset silence timer on every new word
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        
        // If we have some transcript, start a silence timer to detect when they stop speaking
        const fullText = (currentTranscript + interim).trim();
        if (fullText.length > 0) {
          silenceTimerRef.current = setTimeout(() => {
            handleUserFinishedSpeaking();
          }, 3500); // 3.5 seconds of silence means they are done
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech') {
          // just ignore, wait for speech
        } else {
          console.error('Speech recognition error', event.error);
        }
      };

      recognition.onend = () => {
        if (isRecordingRef.current) {
          try {
            recognition.start();
          } catch (e) {}
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
          resolve(); // If browser blocks autoplay, we just move on
        });
      });
    } catch (err) {
      console.error('TTS Error:', err);
      // Fallback to browser TTS if ElevenLabs fails or runs out of credits
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
      setIsAiSpeaking(true); // show thinking state
      const res = await fetch('/api/interview-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: currentHistory,
          department: application.pref1,
          statement: application.statement,
          experience: application.experience
        })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      const aiReply = data.reply;
      const isFinished = data.isFinished;

      // Update history
      const updatedHistory = [...currentHistory, { role: 'model', text: aiReply }] as {role: 'model'|'user', text: string}[];
      setHistory(updatedHistory);

      // Play audio
      await playElevenLabsAudio(aiReply);

      if (isFinished) {
        setStep('evaluating');
        evaluateFinal(updatedHistory);
      } else {
        startRecording();
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to AI recruiter.');
      onClose();
    }
  };

  const startInterview = async () => {
    setStep('interview');
    // Start the chat with empty history, which triggers the AI's first greeting & question
    await getNextAIResponse([]);
  };

  const handleUserFinishedSpeaking = () => {
    if (!isRecordingRef.current) return;
    
    // Stop recording
    setIsRecording(false);
    isRecordingRef.current = false;
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (e) {}
    }
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    // Save their transcript and send to AI
    setHistory(prev => {
      const newHistory = [...prev, { role: 'user', text: currentTranscript.trim() || '(Nodded/Silence)' }] as {role: 'user'|'model', text: string}[];
      // Immediately fetch next response using the new state
      getNextAIResponse(newHistory);
      return newHistory;
    });
    
    setCurrentTranscript('');
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
    
    // Combine history into a readable format for the evaluator
    const combinedTranscript = finalHistory.map(h => `${h.role === 'model' ? 'Recruiter' : 'Applicant'}: ${h.text}`).join('\n\n');

    try {
      const res = await fetch('/api/evaluate-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript: combinedTranscript,
          department: application.pref1 || 'Secretariat'
        })
      });

      const data = await res.json();
      if (data.success) {
        onComplete(data.score, data.feedback);
        setStep('done');
      } else {
        alert('Failed to evaluate interview: ' + data.error);
        onClose();
      }
    } catch (err) {
      console.error(err);
      alert('Error evaluating interview.');
      onClose();
    }
  };

  // Get the last spoken text for display
  const displayModelText = history.length > 0 && history[history.length - 1].role === 'model' 
    ? history[history.length - 1].text 
    : "Listening...";

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-4xl flex flex-col md:flex-row relative"
        >
          {/* Close button for intro step */}
          {step === 'intro' && (
            <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 bg-black/10 hover:bg-black/20 rounded-full text-slate-600 transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Left Side: Video Feed */}
          <div className="w-full md:w-1/2 bg-slate-900 relative aspect-video md:aspect-auto min-h-[300px]">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className={`w-full h-full object-cover ${(step === 'evaluating' || step === 'done') ? 'opacity-0' : 'opacity-100'}`}
            />
            {step === 'interview' && (
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {isRecording && (
                  <div className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-2 animate-pulse shadow-lg">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                    Recording (Speak Now)
                  </div>
                )}
                {isAiSpeaking && (
                  <div className="bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-2 shadow-lg">
                    <Volume2 className="w-3 h-3 animate-pulse" />
                    AI Recruiter Speaking...
                  </div>
                )}
              </div>
            )}
            {!hasPermissions && step === 'intro' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/70">
                <Loader2 className="w-8 h-8 animate-spin mb-2" />
                <p className="text-sm">Requesting camera access...</p>
              </div>
            )}
          </div>

          {/* Right Side: Content */}
          <div className="w-full md:w-1/2 p-8 flex flex-col justify-center bg-slate-50/50">
            
            {step === 'intro' && (
              <div className="space-y-6">
                <div>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-full uppercase tracking-wider mb-3">
                    <Volume2 className="w-3 h-3" /> Conversational AI
                  </span>
                  <h2 className="text-2xl font-bold text-slate-900">AI Video Interview</h2>
                  <p className="text-slate-600 mt-2 text-sm leading-relaxed">
                    This interview is fully conversational. Our AI recruiter will review your application and ask situational questions dynamically.
                  </p>
                </div>
                
                <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">How it works:</h4>
                  <ul className="space-y-2.5 text-xs text-slate-600">
                    <li className="flex items-start gap-2.5"><Volume2 className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" /> <span>The AI will speak first using a realistic human voice.</span></li>
                    <li className="flex items-start gap-2.5"><Mic className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" /> <span>Once it finishes, speak naturally to answer.</span></li>
                    <li className="flex items-start gap-2.5"><CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" /> <span><b>No buttons needed.</b> Just pause when you're done speaking, and the AI will automatically reply.</span></li>
                  </ul>
                </div>

                <Button 
                  onClick={startInterview} 
                  disabled={!hasPermissions}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-6 rounded-xl text-base shadow-lg shadow-indigo-600/20"
                >
                  {hasPermissions ? "I understand, Start Interview" : "Waiting for camera..."}
                </Button>
              </div>
            )}

            {step === 'interview' && (
              <div className="space-y-6 flex flex-col h-full justify-center">
                
                {/* AI Recruiter's latest message */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 relative">
                  <div className="absolute -top-3 left-4 bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Volume2 className="w-3 h-3" /> Recruiter
                  </div>
                  <p className="text-sm text-slate-800 leading-relaxed mt-2 font-medium">
                    {displayModelText}
                  </p>
                </div>

              </div>
            )}

            {step === 'evaluating' && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                <h3 className="text-xl font-bold text-slate-900">Evaluating your responses...</h3>
                <p className="text-sm text-slate-500 max-w-xs mx-auto">
                  Our AI is analyzing your entire interview transcript to generate a final score.
                </p>
              </div>
            )}

            {step === 'done' && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Interview Complete!</h3>
                <p className="text-sm text-slate-600 max-w-xs mx-auto">
                  Your dynamic conversational interview has been successfully evaluated and saved to your application file. The recruitment team will review the results.
                </p>
                <Button 
                  onClick={onClose} 
                  className="mt-6 bg-slate-900 hover:bg-slate-800 text-white w-full py-6 rounded-xl"
                >
                  Return to Dashboard
                </Button>
              </div>
            )}

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
