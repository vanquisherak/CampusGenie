"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  Send,
  Radio,
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
  onresult: ((event: { results: Array<Array<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

export function VoiceTutorModal({ isOpen, onClose, activeTopic }: VoiceTutorModalProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [muted, setMuted] = useState(false);
  const [inputQuery, setInputQuery] = useState("");
  const [history, setHistory] = useState<VoiceMessage[]>([
    {
      id: "init",
      role: "assistant",
      text: "Hello! I am your CampusGenie Voice Tutor. Ask me any question aloud or type below, and I'll explain it clearly step by step.",
      time: "Just now",
    },
  ]);

  const recognitionRef = useRef<ISpeechRecognitionInstance | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, isThinking]);

  const speakText = useCallback((text: string) => {
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
  }, [muted]);

  const handleSendSpokenQuery = useCallback(async (queryText: string) => {
    if (!queryText.trim()) return;

    const userMsg: VoiceMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text: queryText,
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
          transcript: queryText,
          history: history.slice(-4),
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
    }
  }, [activeTopic, history, speakText]);

  // Initialize SpeechRecognition if available in browser
  useEffect(() => {
    if (typeof window !== "undefined") {
      const win = window as unknown as IWindowSpeech;
      const SpeechRecognitionClass = win.SpeechRecognition || win.webkitSpeechRecognition;
      if (SpeechRecognitionClass) {
        const recognition = new SpeechRecognitionClass();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onresult = (event) => {
          const transcript = event.results[0]?.[0]?.transcript;
          if (transcript) {
            void handleSendSpokenQuery(transcript);
          }
          setIsListening(false);
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [handleSendSpokenQuery]);

  function toggleListening() {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsSpeaking(false);
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
                  Gemini Live
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Bidirectional conversational tutor with real-time speech
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
                onClose();
              }}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Visual Audio Waveform Status */}
        <div className="bg-slate-950 px-6 py-5 flex flex-col items-center justify-center border-b border-slate-800">
          <div className="h-10 flex items-center justify-center gap-1.5">
            {[40, 75, 100, 60, 90, 45, 80, 65, 95, 50, 85].map((height, i) => (
              <span
                key={i}
                style={{
                  height: isSpeaking
                    ? `${height}%`
                    : isListening
                    ? `${Math.max(20, (i % 3) * 35)}%`
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
          <div className="text-xs font-mono mt-3 text-slate-300 flex items-center gap-2">
            {isSpeaking && <span className="text-teal-400 font-semibold">Tutor is speaking...</span>}
            {isListening && <span className="text-rose-400 font-semibold animate-pulse">Listening to your voice... Speak now!</span>}
            {isThinking && <span className="text-amber-400 font-semibold">Gemini is synthesizing response...</span>}
            {!isSpeaking && !isListening && !isThinking && (
              <span className="text-slate-400">Press the microphone to speak or type below</span>
            )}
          </div>
        </div>

        {/* Conversation Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFC]">
          {history.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                  msg.role === "user"
                    ? "bg-slate-900 text-white rounded-br-xs"
                    : "bg-white text-slate-800 border border-slate-200 rounded-bl-xs"
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-1">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${msg.role === "user" ? "text-slate-400" : "text-teal-600"}`}>
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
          <span className="text-slate-500 font-semibold shrink-0 py-1">Quick prompts:</span>
          {[
            "Explain Bayesian priors vs likelihood",
            "What causes overfitting in neural networks?",
            "How does AlphaFold predict 3D structures?",
            "Quiz me verbally on regularization",
          ].map((prompt, i) => (
            <button
              key={i}
              onClick={() => void handleSendSpokenQuery(prompt)}
              className="px-2.5 py-1 bg-white hover:bg-teal-50 hover:text-teal-800 hover:border-teal-300 border border-slate-200 rounded-full text-slate-700 shrink-0 transition"
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
                ? "bg-rose-500 hover:bg-rose-600 text-white animate-bounce"
                : "bg-teal-600 hover:bg-teal-700 text-white"
            }`}
            title={isListening ? "Stop listening" : "Start speaking"}
          >
            {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
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
              placeholder="Or type a concept to hear verbal explanation..."
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
