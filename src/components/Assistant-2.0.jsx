import React, { useState, useEffect, useRef } from "react";
import {
    ArrowLeft,
    Mic,
    Send,
    Sparkles,
    User,
    Bot,
    X,
    Settings,
    Volume2,
    Check,
    Square,
    Wifi,
    WifiOff
} from "lucide-react";
import { clsx } from "clsx";
import Loader from "./Loader.jsx";
import { twMerge } from "tailwind-merge";
import { db, auth } from "../firebaseConfig";
import { doc, getDoc, collection, addDoc } from "firebase/firestore";
import ReactMarkdown from "react-markdown";
import demoQuestions from "../assets/json/demoQuestions.json";
import favLogo from "../assets/fav.png";
import aiAssistantPic from "../assets/StudentHub-ai-assistant-pic.png";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://api.backend.studenthub.sumanonline.com";


// Utility for cleaner conditional classes
function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const Assistant2 = ({ onBack, classes = [], holidays = [], userData = null, systemUpdates = [] }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [isListening, setIsListening] = useState(false);
    // Google Cloud TTS config
    const [selectedVoice, setSelectedVoice] = useState({ name: 'Aoede', label: 'Aoede (Female)' });
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [geminiConfig, setGeminiConfig] = useState({ enabled: false, keyIndex: 0 });
    const [messages, setMessages] = useState([
        { id: 1, role: "assistant", content: "Hello! I'm your StudentHub AI assistant. How can I help you with your classes or schedule today?", timestamp: new Date() }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const audioRef = useRef(null);
    const [voiceError, setVoiceError] = useState("");
    const scrollRef = useRef(null);
    const messagesEndRef = useRef(null);

    // Load configuration and voices
    useEffect(() => {
        const fetchConfig = async () => {
            try {
                const systemDoc = await getDoc(doc(db, "settings", "system"));
                if (systemDoc.exists()) {
                    const data = systemDoc.data();
                    let activeKeyIndex = 0;
                    if (data.activeGeminiKeyId !== undefined) {
                        activeKeyIndex = Math.max(0, Math.min(4, parseInt(data.activeGeminiKeyId) - 1));
                    }
                    setGeminiConfig({
                        enabled: data.geminiAssistantEnabled || false,
                        keyIndex: activeKeyIndex
                    });
                }
            } catch (err) {
                console.error("Failed to fetch Gemini config:", err);
            }
        };

        fetchConfig();
    }, []);

    // Auto-scroll to bottom of conversation
    useEffect(() => {
        const timer = setTimeout(() => {
            if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [messages, isTyping]);

    // Deprecated: We now rely on Gemini's native API audio buffer returned with the chat response.

    const handleSendMessage = (text, isVoiceInput = false) => {
        const query = text || searchQuery;
        if (!query.trim()) return;

        // Add user message
        const userMsg = { id: Date.now(), role: "user", content: query, timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setSearchQuery("");

        // Simulate AI response
        setIsTyping(true);
        setTimeout(async () => {
            let responseText = "";

            if (geminiConfig.enabled) {
                try {
                    const res = await fetch(`${BACKEND_URL}/api/chat`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            message: query,
                            history: messages.map(m => ({ role: m.role, content: m.content })),
                            studentContext: {
                                name: userData?.fullName || userData?.name,
                                email: userData?.email,
                                collegeName: userData?.university,
                                stream: userData?.stream,
                                semester: userData?.semester,
                                section: userData?.section,
                                rollNo: userData?.rollNo,
                                classes: classes || []
                            },
                            holidays: holidays || [],
                            updates: systemUpdates || []
                        })
                    });

                    const data = await res.json();
                    if (res.ok && data.success) {
                        responseText = data.reply;
                    } else {
                        throw new Error(data.error || "Failed to get AI response");
                    }
                } catch (err) {
                    console.error("Cloudflare Worker Backend Error:", err);
                    responseText = "I'm having trouble connecting to my backend right now. Please try again later!";
                }
            } else {
                // Offline fallback logic
                const q = query.toLowerCase();
                let isMockQuestion = false;

                // Check demo database first
                const mockMatch = demoQuestions.find(item => q.includes(item.question.toLowerCase()));

                if (mockMatch) {
                    responseText = mockMatch.answer;
                    isMockQuestion = true;
                } else if (q.includes("who created you") || q.includes("who are you") || q.includes("your origin")) {
                    responseText = "I am StudentHub's AI assistant. Created and designed by SumanOnline";
                } else if (q.includes("class") || q.includes("schedule") || q.includes("routine")) {
                    if (classes && classes.length > 0) {
                        responseText = `Here is your offline schedule summary:\n${classes.map(c => `- **${c.subject}** on ${c.day} at ${c.time} taught by ${c.teacher}`).join('\n')}`;
                    } else {
                        responseText = "I'm currently offline, but looking at my basic data, you don't seem to have any classes scheduled.";
                    }
                } else if (q.includes("holiday") || q.includes("vacation") || q.includes("off")) {
                    if (holidays && holidays.length > 0) {
                        if (q.includes("today")) {
                            // Check if today is a holiday
                            const todayStr = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
                            const todayHoliday = holidays.find(h => h.date === todayStr);
                            if (todayHoliday) {
                                responseText = `Yes! Today is a holiday: **${todayHoliday.occasion}**. Enjoy your day off!`;
                            } else {
                                responseText = `No, today is not a holiday. Your next holiday is coming up, though!\n\nHere are some upcoming holidays:\n${holidays.slice(0, 5).map(h => `- **${h.occasion}** on ${h.date}`).join('\n')}`;
                            }
                        } else {
                            // Just list upcoming holidays if "today" wasn't asked
                            responseText = `Here are your upcoming university holidays:\n${holidays.map(h => `- **${h.occasion}** on ${h.date}`).join('\n')}`;
                        }
                    } else {
                        responseText = "I'm offline, but I don't see any upcoming holidays in your local data.";
                    }
                } else {
                    responseText = `I've received your query about "${query}". My advanced Gemini AI mind is currently turned off in Settings, so I can only answer basic queries about your schedule, holidays, or identity right now!`;
                }
            }

            const aiMsg = {
                id: Date.now() + 1,
                role: "assistant",
                content: responseText,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, aiMsg]);
            setIsTyping(false);

            // Try to log the conversation directly into Firebase as a long-term storage solution
            try {
                if (auth.currentUser) {
                    await addDoc(collection(db, "ai_conversations"), {
                        userId: auth.currentUser.uid,
                        userEmail: auth.currentUser.email,
                        question: query,
                        answer: responseText,
                        timestamp: new Date(),
                        geminiOnline: geminiConfig.enabled
                    });
                }
            } catch (fbErr) {
                console.warn("Failed to save conversation to Firebase:", fbErr);
            }

            // Attempt to save the question and answer locally via Vite Dev API
            // Only if we are running in development mode
            if (import.meta.env.DEV) {
                try {
                    // Determine base URL, works for both local dev and production
                    const baseUrl = import.meta.env.BASE_URL || "/";
                    const saveQuestionUrl = baseUrl.endsWith('/')
                        ? `${baseUrl}api/save-question`
                        : `${baseUrl}/api/save-question`;

                    fetch(saveQuestionUrl, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ question: query, answer: responseText })
                    }).catch(e => console.warn("Failed to save question & answer:", e));
                } catch (e) {
                    console.warn("Failed to save question to local JSON:", e);
                }
            }

            // Respond with voice if user used voice input OR if it was a demo question
            // (Only if Gemini is offline, or it was voice input)
            const wasOffline = !geminiConfig.enabled;
            const mockMatch = wasOffline && demoQuestions.find(item => query.toLowerCase().includes(item.question.toLowerCase()));

            if (isVoiceInput && wasOffline) {
                // Not supported offline without standard browser TTS
                console.warn("Audio playback requires Gemini to be online.");
            }
        }, 500);
    };

    const handleVoiceSearch = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setVoiceError("Voice input is not supported by your browser. Please use Chrome or Edge.");
            setTimeout(() => setVoiceError(""), 4000);
            return;
        }

        setVoiceError("");
        const recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setSearchQuery(transcript);
            handleSendMessage(transcript, true);
        };
        recognition.start();
    };

    return (
        <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-slate-950 font-sans antialiased transition-colors duration-500">
            {/* --- HEADER --- */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 sm:px-12 py-3 sm:py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4 sm:gap-8">
                        {/* Desktop Logo/Brand */}
                        <div className="hidden lg:flex items-center gap-3">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-[1rem] overflow-hidden shadow-md shrink-0">
                                <img src={favLogo} alt="StudentHub Logo" className="w-full h-full object-cover" />
                            </div>
                            <div className="text-[28px] font-black tracking-tighter text-[#1e1b4b] dark:text-white leading-none flex items-baseline">
                                Student
                                <span className="text-indigo-600 dark:text-indigo-400">Hub</span>
                            </div>
                        </div>

                        <button
                            onClick={onBack}
                            className="group flex items-center gap-2 sm:gap-3 text-slate-500 hover:text-slate-900 dark:hover:text-white font-bold transition-all active:scale-95"
                        >
                            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg sm:rounded-xl group-hover:bg-slate-100 dark:group-hover:bg-slate-700 transition-colors">
                                <ArrowLeft size={16} className="sm:w-[18px] sm:h-[18px]" />
                            </div>
                            <span className="text-xs sm:text-sm">Back</span>
                        </button>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <div className="relative">
                            <button
                                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                                className={cn(
                                    "p-2 rounded-xl transition-all active:scale-95 border",
                                    isSettingsOpen
                                        ? "bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-200"
                                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:text-indigo-600 hover:border-indigo-200"
                                )}
                                title="Voice Settings"
                            >
                                <Volume2 size={16} className="sm:w-[18px] sm:h-[18px]" />
                            </button>

                            {/* Voice Selection Dropdown (GCP Voices) */}
                            {isSettingsOpen && (
                                <div className="fixed inset-x-4 top-20 sm:absolute sm:inset-auto sm:right-0 sm:mt-3 w-auto sm:w-64 max-h-[60vh] sm:max-h-80 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-[60] animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="px-3 py-2 mb-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Gemini Voice</span>
                                    </div>
                                    <div className="space-y-1">
                                        {[
                                            { name: "Aoede", label: "Aoede (Female)" },
                                            { name: "Puck", label: "Puck (Male)" },
                                            { name: "Charon", label: "Charon (Male)" },
                                            { name: "Kore", label: "Kore (Female)" },
                                            { name: "Fenrir", label: "Fenrir (Male)" }
                                        ].map((voice, index) => (
                                            <button
                                                key={index}
                                                onClick={() => {
                                                    setSelectedVoice(voice);
                                                    setIsSettingsOpen(false);
                                                }}
                                                className={cn(
                                                    "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors",
                                                    selectedVoice.name === voice.name
                                                        ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                                                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                                                )}
                                            >
                                                <span className="truncate pr-2">{voice.label}</span>
                                                {selectedVoice.name === voice.name && <Check size={14} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 bg-indigo-50 dark:bg-indigo-900/30 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl border border-indigo-100 dark:border-indigo-800 shadow-sm">
                            <Sparkles size={14} className="text-indigo-600 dark:text-indigo-400 sm:w-4 sm:h-4" />
                            <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-300">StudentHub Assistant</span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-8 flex flex-col items-center">
                {/* AI Assistant Avatar Area */}
                <div className="flex flex-col items-center mb-6 sm:mb-10 animate-in fade-in zoom-in duration-700">
                    <div className="relative">
                        <div className="absolute inset-0 bg-indigo-500 rounded-full blur-[40px] sm:blur-[60px] opacity-20 animate-pulse"></div>
                        <img
                            src={aiAssistantPic}
                            alt="AI Assistant"
                            className="w-32 h-32 sm:w-64 sm:h-64 object-contain relative z-10"
                        />
                    </div>
                    <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tighter mt-4 text-center leading-tight px-4">
                        How can I <span className="text-indigo-600 dark:text-indigo-400">help you?</span>
                    </h1>
                </div>



                {/* Live Conversation Box */}
                <div className="w-full max-w-2xl flex-1 min-h-[300px] sm:min-h-[400px] flex flex-col bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2rem] sm:rounded-[2.5rem] border border-white/60 dark:border-slate-800 overflow-hidden shadow-2xl shadow-slate-200/40 dark:shadow-none mb-24 sm:mb-28">
                    <div className="px-4 sm:px-8 py-4 sm:py-5 border-b border-white/60 dark:border-slate-800 flex items-center justify-center sm:justify-between gap-3 overflow-x-auto hide-scrollbar">
                        <div className="flex items-center gap-2 sm:gap-3 px-3 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-full border border-slate-100 dark:border-slate-700 shrink-0">
                            <div className={cn(
                                "w-2 h-2 rounded-full animate-pulse shrink-0",
                                geminiConfig.enabled ? "bg-emerald-500" : "bg-amber-500"
                            )}></div>
                            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 whitespace-nowrap">Live Conversation</span>
                        </div>

                        {/* Status Indicator */}
                        <div className={cn(
                            "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wider border shrink-0 whitespace-nowrap",
                            geminiConfig.enabled
                                ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800/50"
                                : "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-800/50"
                        )}>
                            {geminiConfig.enabled ? (
                                <>
                                    <Wifi size={12} strokeWidth={3} className="shrink-0" />
                                    <span>AI Online</span>
                                </>
                            ) : (
                                <>
                                    <WifiOff size={12} strokeWidth={3} className="shrink-0" />
                                    <span>AI Offline</span>
                                </>
                            )}
                        </div>
                    </div>

                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-4 sm:space-y-6 custom-scrollbar"
                    >
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500",
                                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                                )}
                            >
                                <div className={cn(
                                    "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border",
                                    msg.role === "user" ? "bg-indigo-600 border-indigo-500 text-white" : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-indigo-600 dark:text-indigo-400"
                                )}>
                                    {msg.role === "user" ? <User size={18} /> : <Bot size={18} />}
                                </div>
                                <div className={cn(
                                    "max-w-[80%] p-4 sm:p-5 rounded-[1.5rem] text-sm sm:text-base font-medium leading-relaxed shadow-sm overflow-x-auto",
                                    msg.role === "user"
                                        ? "bg-indigo-600 text-white rounded-tr-none"
                                        : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-none prose prose-sm dark:prose-invert prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:text-slate-100"
                                )}>
                                    {msg.role === "assistant" ? <ReactMarkdown>{msg.content}</ReactMarkdown> : msg.content}
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center shrink-0">
                                    <Bot size={18} className="text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-4 rounded-[1.5rem] rounded-tl-none">
                                    <div className="flex gap-1.5 p-1">
                                        {[0, 1, 2].map((i) => (
                                            <div
                                                key={i}
                                                className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce"
                                                style={{ animationDelay: `${i * 0.15}s` }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </div>

                {/* Search Bar / Input */}
                <div className="fixed bottom-4 sm:bottom-6 left-0 right-0 z-40 px-4 pointer-events-none flex flex-col items-center">
                    {/* Voice Error Toaster */}
                    {voiceError && (
                        <div className="mb-3 px-4 py-2 bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-500/30 flex items-center gap-2 animate-in slide-in-from-bottom-2 fade-in duration-300 pointer-events-auto">
                            <AlertCircle size={14} />
                            {voiceError}
                        </div>
                    )}

                    <div className="w-full max-w-2xl relative group pointer-events-auto">
                        <div className="absolute inset-0 bg-indigo-500/5 dark:bg-indigo-400/5 rounded-[1.5rem] sm:rounded-[2rem] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                        <div className="relative flex items-center bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-[1.5rem] sm:rounded-[2rem] p-1.5 sm:p-2 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.5)] focus-within:border-indigo-500/50 transition-all">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                                placeholder="Ask me anything class or Study related..."
                                className="flex-1 bg-transparent px-4 sm:px-6 py-2 sm:py-3 text-[14px] sm:text-base text-slate-800 dark:text-slate-100 font-bold placeholder-slate-400 focus:outline-none"
                            />
                            <div className="flex items-center gap-1 sm:gap-2 pr-1 sm:pr-2">
                                <button
                                    onClick={() => {
                                        if (isSpeaking && audioRef.current) {
                                            audioRef.current.pause();
                                            setIsSpeaking(false);
                                        } else {
                                            handleVoiceSearch();
                                        }
                                    }}
                                    className={cn(
                                        "p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all active:scale-90",
                                        isListening ? "bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/40"
                                            : isSpeaking ? "bg-amber-500 text-white shadow-lg shadow-amber-500/40 hover:bg-amber-600"
                                                : "text-slate-400 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                                    )}
                                    title={isSpeaking ? "Stop speaking" : "Voice search"}
                                >
                                    {isSpeaking && !isListening ? (
                                        <Square size={18} className="sm:w-5 sm:h-5 fill-current" />
                                    ) : (
                                        <Mic size={18} className="sm:w-5 sm:h-5" />
                                    )}
                                </button>
                                <button
                                    onClick={() => handleSendMessage()}
                                    disabled={!searchQuery.trim()}
                                    className="p-2 sm:p-3 bg-indigo-600 text-white rounded-xl sm:rounded-2xl shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
                                >
                                    <Send size={18} className="sm:w-5 sm:h-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Assistant2;
