"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic,
  Volume2,
  VolumeX,
  X,
  Send,
  Radio,
  Check,
  Sparkles,
} from "lucide-react";

type VoiceMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  time: string;
};

interface VoiceTutorModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTopic?: string;
}

interface IWindowSpeech {
  SpeechRecognition?: new () => ISpeechRecognitionInstance;
  webkitSpeechRecognition?: new () => ISpeechRecognitionInstance;
}

interface ISpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      length: number;
      [index: number]: { transcript: string };
    };
  };
}

export function VoiceTutorModal({ isOpen, onClose, activeTopic }: VoiceTutorModalProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [muted, setMuted] = useState(false);
  const [inputQuery, setInputQuery] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [history, setHistory] = useState<VoiceMessage[]>([
    {
      id: "init",
      role: "assistant",
      text: "Hello! I am your CampusGenie Voice Tutor. Speak your question aloud and I'll wait until you finish your complete thought before answering.",
      time: "Just now",
    },
  ]);

  const recognitionRef = useRef<ISpeechRecognitionInstance | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Buffer and timer refs to prevent chunked, instantaneous prompts
  const speechBufferRef = useRef<string>("");
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isFinalizingRef = useRef<boolean>(false);
  const historyRef = useRef<VoiceMessage[]>(history);

  // Keep historyRef up to date for API calls without re-triggering speech setup
  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, isThinking, liveTranscript]);

  const speakText = useCallback(
    (text: string) => {
      if (muted || typeof window === "undefined" || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();

      const cleanSpeech = text.replace(/[*_#`[\]()]/g, " ").replace(/\s+/g, " ").trim();
      const utterance = new SpeechSynthesisUtterance(cleanSpeech);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    },
    [muted]
  );

  // Core submission function that sends the SINGLE COMPLETE SENTENCE
  const handleSendSpokenQuery = useCallback(
    async (queryText: string) => {
      const trimmed = queryText.trim();
      if (!trimmed) return;

      // Cancel any pending speech recognition listening while answering
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      setLiveTranscript("");
      speechBufferRef.current = "";

      const userMsg: VoiceMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        text: trimmed,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setHistory((prev) => [...prev, userMsg]);
      setInputQuery("");
      setIsThinking(true);

      try {
        const res = await fetch("/api/voice-tutor", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transcript: trimmed,
            history: historyRef.current.slice(-4),
            topic: activeTopic || "Curriculum & Scientific Principles",
          }),
        });

        const data = await res.json();
        const reply = data.spokenResponse || "I heard your question. Let's explore that topic.";

        const assistantMsg: VoiceMessage = {
          id: `a-${Date.now()}`,
          role: "assistant",
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };

        setHistory((prev) => [...prev, assistantMsg]);
        setIsThinking(false);
        speakText(reply);
      } catch {
        setIsThinking(false);
        const fallback = "I had trouble connecting to the voice tutor. Please try again.";
        setHistory((prev) => [
          ...prev,
          {
            id: `err-${Date.now()}`,
            role: "assistant",
            text: fallback,
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      } finally {
        isFinalizingRef.current = false;
      }
    },
    [activeTopic, speakText]
  );

  // Commit the complete utterance once speech has concluded
  const commitSpeechUtterance = useCallback(() => {
    if (isFinalizingRef.current) return;
    const textToSend = speechBufferRef.current.trim();
    if (!textToSend) return;

    isFinalizingRef.current = true;
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    void handleSendSpokenQuery(textToSend);
  }, [handleSendSpokenQuery]);

  // Setup Web Speech API with VAD (Voice Activity Detection) debounce
  useEffect(() => {
    if (typeof window === "undefined") return;

    const win = window as unknown as IWindowSpeech;
    const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (SpeechRecognitionClass) {
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let accumulated = "";

        // Collect all results into one full sentence
        for (let i = 0; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item && item[0]) {
            accumulated += item[0].transcript + " ";
          }
        }

        const trimmed = accumulated.trim();
        if (!trimmed) return;

        // Store full sentence in buffer and update live visual display
        speechBufferRef.current = trimmed;
        setLiveTranscript(trimmed);

        // Reset silence timer on every new word detected
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }

        // Wait 1300ms after user stops speaking before submitting full sentence
        silenceTimerRef.current = setTimeout(() => {
          commitSpeechUtterance();
        }, 1350);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        // If recognition ends and there is speech that hasn't been submitted yet, commit it now
        if (speechBufferRef.current.trim() && !isFinalizingRef.current) {
          commitSpeechUtterance();
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [commitSpeechUtterance]);

  function toggleListening() {
    if (isListening) {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
      }
      if (speechBufferRef.current.trim()) {
        commitSpeechUtterance();
      } else {
        recognitionRef.current?.stop();
        setIsListening(false);
        setLiveTranscript("");
      }
    } else {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
      setLiveTranscript("");
      speechBufferRef.current = "";
      isFinalizingRef.current = false;

      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
          setIsListening(true);
        } catch {
          setIsListening(false);
        }
      } else {
        alert("Speech recognition is not supported in this browser. You can type below.");
      }
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Top Bar */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
              <Radio className={`w-5 h-5 ${isSpeaking || isListening ? "animate-pulse" : ""}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm tracking-wide">CampusGenie Live Voice Tutor</h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-teal-500/20 text-teal-300 rounded border border-teal-500/30">
                  Gemini Voice
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Waits for your full speech before responding
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (isSpeaking && typeof window !== "undefined") {
                  window.speechSynthesis.cancel();
                  setIsSpeaking(false);
                }
                setMuted(!muted);
              }}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
              title={muted ? "Unmute tutor voice" : "Mute tutor voice"}
            >
              {muted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.speechSynthesis.cancel();
                }
                if (silenceTimerRef.current) {
                  clearTimeout(silenceTimerRef.current);
                }
                recognitionRef.current?.abort();
                onClose();
              }}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Visual Audio Waveform Status */}
        <div className="bg-slate-950 px-6 py-4 flex flex-col items-center justify-center border-b border-slate-800">
          <div className="h-9 flex items-center justify-center gap-1.5">
            {[40, 75, 100, 60, 90, 45, 80, 65, 95, 50, 85].map((height, i) => (
              <span
                key={i}
                style={{
                  height: isSpeaking
                    ? `${height}%`
                    : isListening
                    ? `${Math.max(25, (i % 3) * 35)}%`
                    : "15%",
                }}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isSpeaking
                    ? "bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.6)]"
                    : isListening
                    ? "bg-rose-400 animate-pulse"
                    : "bg-slate-700"
                }`}
              />
            ))}
          </div>
          <div className="text-xs font-mono mt-2.5 text-slate-300 flex items-center gap-2">
            {isSpeaking && <span className="text-teal-400 font-semibold">Tutor is speaking...</span>}
            {isListening && (
              <span className="text-rose-400 font-semibold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                Listening... (prompts after you finish speaking)
              </span>
            )}
            {isThinking && <span className="text-amber-400 font-semibold">Gemini is synthesizing answer...</span>}
            {!isSpeaking && !isListening && !isThinking && (
              <span className="text-slate-400">Click microphone to speak or type below</span>
            )}
          </div>
        </div>

        {/* Live Speech Buffer Banner (Fixes Chunking: Shows speech as it forms without sending yet) */}
        {isListening && liveTranscript && (
          <div className="bg-rose-50 border-b border-rose-200 px-5 py-2.5 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="font-mono text-[10px] uppercase font-bold text-rose-700 shrink-0">
                You are saying:
              </span>
              <p className="font-medium text-slate-900 truncate italic">
                &ldquo;{liveTranscript}&rdquo;
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={commitSpeechUtterance}
                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs"
              >
                <span>Send Now</span>
                <Send size={11} />
              </button>
            </div>
          </div>
        )}

        {/* Conversation Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFC]">
          {history.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-xs ${
                  msg.role === "user"
                    ? "bg-slate-900 text-white rounded-br-xs"
                    : "bg-white text-slate-800 border border-slate-200 rounded-bl-xs"
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-1">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      msg.role === "user" ? "text-slate-400" : "text-teal-600"
                    }`}
                  >
                    {msg.role === "user" ? "You" : "CampusGenie"}
                  </span>
                  <span className="text-[10px] opacity-60 font-mono">{msg.time}</span>
                </div>
                <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
          ))}
          <div ref={chatBottomRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex gap-2 overflow-x-auto text-[11px]">
          <span className="text-slate-500 font-semibold shrink-0 py-1 flex items-center gap-1">
            <Sparkles size={11} className="text-teal-600" /> Prompts:
          </span>
          {[
            "Explain Bayesian priors vs likelihood",
            "What causes overfitting in neural networks?",
            "How does AlphaFold predict 3D structures?",
            "Quiz me verbally on regularization",
          ].map((prompt, i) => (
            <button
              key={i}
              onClick={() => void handleSendSpokenQuery(prompt)}
              className="px-2.5 py-1 bg-white hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300 border border-slate-200 rounded-full text-slate-700 shrink-0 transition font-medium"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Bottom Input & Voice Controls */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center gap-3">
          <button
            onClick={toggleListening}
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition shadow-md shrink-0 ${
              isListening
                ? "bg-rose-500 hover:bg-rose-600 text-white ring-4 ring-rose-200 animate-pulse"
                : "bg-teal-600 hover:bg-teal-700 text-white"
            }`}
            title={isListening ? "Click to finish speaking now" : "Start speaking"}
          >
            {isListening ? <Check className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSendSpokenQuery(inputQuery);
            }}
            className="flex-1 flex gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Or type a question to hear spoken explanation..."
              className="flex-1 px-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-slate-800 placeholder-slate-400"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isThinking}
              className="px-4 py-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition disabled:opacity-50 flex items-center justify-center shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
