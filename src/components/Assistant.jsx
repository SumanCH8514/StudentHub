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
    WifiOff,
    Trash2,
    AlertCircle
} from "lucide-react";
import { clsx } from "clsx";
import Loader from "./Loader.jsx";
import { twMerge } from "tailwind-merge";
import { db, auth } from "../firebaseConfig";
import { doc, getDoc, getDocs, collection, addDoc } from "firebase/firestore";
import ReactMarkdown from "react-markdown";
import demoQuestions from "../assets/json/demoQuestions.json";
import favLogo from "../assets/fav.png";
import aiAssistantPic from "../assets/StudentHub-ai-assistant-pic.png";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://api.backend.studenthub.sumanonline.com";


function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const SpeakingMarkdown = ({ content }) => {
    return <ReactMarkdown>{content}</ReactMarkdown>;
};

const Assistant = ({ onBack, classes = [], holidays = [], userData = null, systemUpdates = [] }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [voices, setVoices] = useState([]);
    const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(0);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [geminiConfig, setGeminiConfig] = useState({ enabled: false, keyIndex: 0 });
    const [messages, setMessages] = useState(() => {
        try {
            const saved = localStorage.getItem("studenthub_ai_chat_history");
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) return parsed;
            }
        } catch (_) { }
        return [
            { id: 1, role: "assistant", content: "Hello! I'm your StudentHub AI assistant. How can I help you with your classes or schedule today?", timestamp: new Date() }
        ];
    });

    useEffect(() => {
        try {
            localStorage.setItem("studenthub_ai_chat_history", JSON.stringify(messages));
        } catch (_) { }
    }, [messages]);
    const [isTyping, setIsTyping] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [speakingMsgId, setSpeakingMsgId] = useState(null);
    const [speechProgress, setSpeechProgress] = useState(0);
    const [voiceError, setVoiceError] = useState("");
    const [customGeminiKey, setCustomGeminiKey] = useState(() => {
        try {
            return localStorage.getItem("studenthub_custom_gemini_key") || "";
        } catch (_) {
            return "";
        }
    });

    const handleKeySave = (val) => {
        setCustomGeminiKey(val);
        try {
            localStorage.setItem("studenthub_custom_gemini_key", val.trim());
        } catch (_) { }
    };

    const scrollRef = useRef(null);
    const messagesEndRef = useRef(null);
    const syncTimerRef = useRef(null);
    const utteranceRef = useRef(null);

    const stopSpeaking = () => {
        if (syncTimerRef.current) {
            clearInterval(syncTimerRef.current);
            syncTimerRef.current = null;
        }
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        utteranceRef.current = null;
        setIsSpeaking(false);
        setSpeakingMsgId(null);
        setSpeechProgress(0);
    };

    useEffect(() => {
        return () => stopSpeaking();
    }, []);

    const [customQA, setCustomQA] = useState([]);

    // Load configuration, voices, and custom Q&As from LocalStorage + Firestore
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

            let firestoreItems = [];
            try {
                const qaSnap = await getDocs(collection(db, "custom_qa"));
                qaSnap.forEach(d => firestoreItems.push({ id: d.id, ...d.data() }));
            } catch (_) { }

            const mergedMap = new Map();
            firestoreItems.forEach(item => {
                if (item && item.question && item.answer) {
                    const key = item.question.trim().toLowerCase();
                    mergedMap.set(key, item);
                }
            });

            setCustomQA(Array.from(mergedMap.values()));
        };

        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            if (availableVoices.length === 0) return;
            setVoices(availableVoices);

            const naturalVoiceIdx = availableVoices.findIndex(v =>
                v.lang.toLowerCase().startsWith("en") &&
                (v.name.toLowerCase().includes("natural") ||
                    v.name.toLowerCase().includes("online") ||
                    v.name.toLowerCase().includes("enhanced") ||
                    v.name.toLowerCase().includes("neural"))
            );

            if (naturalVoiceIdx !== -1) {
                setSelectedVoiceIndex(naturalVoiceIdx);
                return;
            }

            const googleVoiceIdx = availableVoices.findIndex(v =>
                v.lang.toLowerCase().startsWith("en") &&
                (v.name.includes("Google UK English Female") ||
                    v.name.includes("Google US English") ||
                    v.name.includes("Google UK English Male"))
            );

            if (googleVoiceIdx !== -1) {
                setSelectedVoiceIndex(googleVoiceIdx);
                return;
            }

            const appleVoiceIdx = availableVoices.findIndex(v =>
                v.lang.toLowerCase().startsWith("en") &&
                (v.name.includes("Samantha") ||
                    v.name.includes("Karen") ||
                    v.name.includes("Daniel") ||
                    v.name.includes("Siri"))
            );

            if (appleVoiceIdx !== -1) {
                setSelectedVoiceIndex(appleVoiceIdx);
                return;
            }

            const anyEnIdx = availableVoices.findIndex(v => v.lang.toLowerCase().startsWith("en"));
            if (anyEnIdx !== -1) {
                setSelectedVoiceIndex(anyEnIdx);
            } else {
                setSelectedVoiceIndex(0);
            }
        };

        fetchConfig();
        loadVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (messagesEndRef.current) {
                messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
            }
        }, 100);
        return () => clearTimeout(timer);
    }, [messages, isTyping]);

    const cleanMarkdown = (text) => text
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`[^`]*`/g, '')
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/#{1,6}\s*/g, '')
        .replace(/_+/g, '')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/^[-•>\s]+/gm, '')
        .replace(/---+/g, '')
        .replace(/\|/g, '')
        .replace(/=/g, ' ')
        .replace(/^\s*[-*+]\s+/gm, '')
        .replace(/\n{2,}/g, '. ')
        .replace(/\n/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .trim();

    const speakWithWebSpeech = (cleanText, msgId) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
        }

        const availableVoices = voices.length > 0 ? voices : window.speechSynthesis.getVoices();
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utteranceRef.current = utterance;

        if (availableVoices.length > 0) {
            utterance.voice = availableVoices[selectedVoiceIndex] || availableVoices[0];
            utterance.lang = utterance.voice?.lang || "en-US";
        }
        utterance.rate = 0.98;
        utterance.pitch = 1.0;
        let startTime = 0;
        const totalDurationMs = Math.max(1000, (cleanText.length / 15) * 1000);

        utterance.onstart = () => {
            setIsSpeaking(true);
            setSpeakingMsgId(msgId);
            startTime = performance.now();
            if (syncTimerRef.current) clearInterval(syncTimerRef.current);
            syncTimerRef.current = setInterval(() => {
                const elapsed = performance.now() - startTime;
                setSpeechProgress(Math.min(98, Math.round((elapsed / totalDurationMs) * 100)));
            }, 50);
        };
        utterance.onend = () => {
            setSpeechProgress(100);
            utteranceRef.current = null;
            setTimeout(() => stopSpeaking(), 200);
        };
        utterance.onerror = () => {
            utteranceRef.current = null;
            stopSpeaking();
        };
        utterance.onboundary = (e) => {
            if (e.charIndex !== undefined && cleanText.length > 0) {
                const pct = Math.min(100, Math.round((e.charIndex / cleanText.length) * 100));
                setSpeechProgress(pct);
                startTime = performance.now() - (pct / 100) * totalDurationMs;
            }
        };
        window.speechSynthesis.speak(utterance);
        if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
        }
    };

    const speak = (text, msgId = null) => {
        const cleanText = cleanMarkdown(text);
        if (!cleanText) return;
        stopSpeaking();
        setSpeakingMsgId(msgId);
        setSpeechProgress(0);
        speakWithWebSpeech(cleanText, msgId);
    };

    const findKnowledgeBaseMatch = (queryStr) => {
        if (!queryStr) return null;
        const cleanQuery = queryStr.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
        if (!cleanQuery) return null;

        const stopWords = new Set(["a", "an", "the", "is", "are", "was", "were", "am", "be", "in", "on", "at", "to", "for", "of", "with", "you", "me", "my", "it", "do", "does", "did", "can", "could", "what", "how", "why", "when", "where", "tell", "about", "please", "i", "we", "us"]);
        const queryTokens = cleanQuery.split(' ').filter(w => w.length >= 2 && !stopWords.has(w));

        const allPairs = [...customQA, ...demoQuestions];

        for (const item of allPairs) {
            if (!item || !item.question || !item.answer) continue;
            const itemQ = item.question.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
            if (cleanQuery === itemQ) {
                return item.answer;
            }
        }

        for (const item of allPairs) {
            if (!item || !item.question || !item.answer) continue;
            const itemQ = item.question.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
            if (itemQ.length >= 4 && itemQ.includes(' ')) {
                const regex = new RegExp(`\\b${itemQ.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
                if (regex.test(cleanQuery)) {
                    return item.answer;
                }
            }
        }

        for (const item of allPairs) {
            if (!item || !item.question || !item.answer) continue;
            const itemQ = item.question.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
            if (cleanQuery.includes(itemQ) || itemQ.includes(cleanQuery)) {
                return item.answer;
            }
        }

        if (queryTokens.length > 0) {
            let bestMatch = null;
            let bestScore = 0;

            for (const item of allPairs) {
                if (!item || !item.question || !item.answer) continue;
                const itemQ = item.question.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
                const itemTokens = itemQ.split(' ').filter(w => w.length >= 2 && !stopWords.has(w));

                if (itemTokens.length === 0) continue;

                const matchedFromItem = itemTokens.filter(w => queryTokens.includes(w) || queryTokens.some(q => q.startsWith(w) || w.startsWith(q))).length;
                const matchedFromQuery = queryTokens.filter(w => itemTokens.includes(w) || itemTokens.some(t => t.startsWith(w) || w.startsWith(t))).length;

                const scoreFromItem = matchedFromItem / itemTokens.length;
                const scoreFromQuery = queryTokens.length > 0 ? matchedFromQuery / queryTokens.length : 0;
                const score = Math.max(scoreFromItem, scoreFromQuery);

                if (score >= 0.6 && matchedFromItem >= 1 && score > bestScore) {
                    bestScore = score;
                    bestMatch = item.answer;
                }
            }

            if (bestMatch) return bestMatch;
        }

        return null;
    };

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

            const qLower = query.toLowerCase().trim();
            const isIdentityQuery = qLower === "who are you" || qLower === "who created you" || qLower === "what is your name" || qLower === "tell me about yourself" || qLower === "who r u";
            const isDateDayQuery = qLower.includes("what day") || qLower.includes("what date") || qLower.includes("today's date") || qLower.includes("current date") || qLower.includes("today date") || qLower.includes("what is today");

            const kbMatch = findKnowledgeBaseMatch(query);

            if (isIdentityQuery) {
                responseText = kbMatch || "I am StudentHub's AI assistant. Created and designed by SumanOnline";
            } else if (isDateDayQuery) {
                const dayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
                const fullDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
                const timeStr = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

                const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
                const todayHoliday = holidays?.find(h => h.date === todayStr);

                if (todayHoliday) {
                    responseText = `Today is **${dayName}, ${fullDate}** (Time: ${timeStr}).\n\nPlease note that today is marked as a holiday for **${todayHoliday.occasion}**. There are no scheduled classes today.`;
                } else {
                    responseText = `Today is **${dayName}, ${fullDate}** (Time: ${timeStr}).`;
                }
            } else if (kbMatch) {
                responseText = kbMatch;
            } else if (geminiConfig.enabled) {
                try {
                    const currentContextStr = `[CURRENT TIME & DATE: Today is ${new Date().toLocaleDateString("en-US", { weekday: "long" })}, ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} (${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}).]`;
                    const res = await fetch(`${BACKEND_URL}/api/chat`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            message: `${currentContextStr}\n\n${query}`,
                            history: messages.map(m => ({ role: m.role, content: m.content })),
                            studentContext: {
                                name: userData?.fullName || userData?.name,
                                email: userData?.email,
                                collegeName: userData?.university,
                                stream: userData?.stream,
                                semester: userData?.semester,
                                section: userData?.section,
                                rollNo: userData?.rollNo,
                                classes: classes || [],
                                todayDay: new Date().toLocaleDateString("en-US", { weekday: "long" }),
                                todayDate: new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }),
                                currentTime: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }),
                                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                                currentDateContext: `Today is ${new Date().toLocaleDateString("en-US", { weekday: "long" })}, ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}. Current local time is ${new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })} (${Intl.DateTimeFormat().resolvedOptions().timeZone}).`
                            },
                            holidays: holidays || [],
                            updates: systemUpdates || []
                        })
                    });

                    const data = await res.json();
                    if (res.ok && data.success) {
                        responseText = data.reply;
                    } else {
                        throw new Error(data.error || "Failed to get response from backend");
                    }
                } catch (err) {
                    console.error("Cloudflare Worker Backend Error:", err);
                    responseText = "I'm having trouble connecting to my backend right now. Please try again later!";
                }
            } else {
                // Offline fallback logic
                const q = query.toLowerCase();
                if (q.includes("what day") || q.includes("what date") || q.includes("today's date") || q.includes("current date") || q.includes("today date")) {
                    const dayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
                    const fullDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
                    const timeStr = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
                    responseText = `Today is **${dayName}, ${fullDate}** (Local time: ${timeStr}).`;
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
                            const todayStr = new Date().toLocaleDateString("en-CA");
                            const todayHoliday = holidays.find(h => h.date === todayStr);
                            if (todayHoliday) {
                                responseText = `Yes! Today is a holiday: **${todayHoliday.occasion}**. Enjoy your day off!`;
                            } else {
                                responseText = `No, today is not a holiday. Your next holiday is coming up, though!\n\nHere are some upcoming holidays:\n${holidays.slice(0, 5).map(h => `- **${h.occasion}** on ${h.date}`).join('\n')}`;
                            }
                        } else {
                            responseText = `Here are your upcoming university holidays:\n${holidays.map(h => `- **${h.occasion}** on ${h.date}`).join('\n')}`;
                        }
                    } else {
                        responseText = "I'm offline, but I don't see any upcoming holidays in your local data.";
                    }
                } else {
                    responseText = `I've received your query: "${query}". I don't have an exact answer in my Knowledge Base right now, but I've saved it for our university admins to review and add!`;

                    // Log unanswered query for Admin review
                    try {
                        const storedUn = JSON.parse(localStorage.getItem("studenthub_admin_unanswered_queries") || "[]");
                        const newUn = {
                            id: `un-${Date.now()}`,
                            question: query,
                            userEmail: userData?.email || "Student",
                            timestamp: { seconds: Math.floor(Date.now() / 1000) },
                            status: "pending"
                        };
                        localStorage.setItem("studenthub_admin_unanswered_queries", JSON.stringify([newUn, ...storedUn]));
                    } catch (_) { }

                    try {
                        addDoc(collection(db, "ai_unanswered_queries"), {
                            question: query,
                            userEmail: userData?.email || "Student",
                            timestamp: new Date(),
                            status: "pending"
                        }).catch(() => { });
                    } catch (_) { }
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

            // Log conversation to Firebase user subcollection if authenticated
            if (auth.currentUser) {
                try {
                    addDoc(collection(db, "users", auth.currentUser.uid, "ai_conversations"), {
                        question: query,
                        answer: responseText,
                        timestamp: new Date(),
                        geminiOnline: geminiConfig.enabled
                    }).catch(() => { });
                } catch (_) { }
            }

            // Speak response automatically if voice input was used, or if Gemini TTS is active
            if (isVoiceInput) {
                speak(responseText, aiMsg.id);
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
            <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800/80 px-3 sm:px-8 py-2.5 sm:py-3.5">
                <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
                    {/* Left: Back Button & Desktop Brand */}
                    <div className="flex items-center gap-2 sm:gap-4">
                        <button
                            onClick={onBack}
                            className="p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-200 rounded-2xl transition-all active:scale-95 flex items-center justify-center shrink-0"
                            title="Back to Routine"
                        >
                            <ArrowLeft size={18} />
                        </button>

                        <div className="hidden sm:flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl overflow-hidden shadow-sm shrink-0">
                                <img src={favLogo} alt="StudentHub Logo" className="w-full h-full object-cover" />
                            </div>
                            <span className="text-lg font-black tracking-tighter text-[#1e1b4b] dark:text-white">
                                Student<span className="text-indigo-600 dark:text-indigo-400">Hub</span>
                            </span>
                        </div>
                    </div>

                    {/* Center: Assistant Badge */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/40 dark:to-purple-950/40 rounded-full border border-indigo-100 dark:border-indigo-800/50 shadow-sm shrink-0">
                        <Sparkles size={14} className="text-indigo-600 dark:text-indigo-400" />
                        <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                            StudentHub AI
                        </span>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-1.5 sm:gap-2">
                        <button
                            onClick={() => {
                                localStorage.removeItem("studenthub_ai_chat_history");
                                setMessages([
                                    { id: Date.now(), role: "assistant", content: "Hello! I'm your StudentHub AI assistant. How can I help you with your classes or schedule today?", timestamp: new Date() }
                                ]);
                            }}
                            className="p-2.5 rounded-2xl transition-all active:scale-95 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 dark:hover:bg-rose-900/30 text-slate-500 hover:text-rose-600 dark:text-slate-300 dark:hover:text-rose-400"
                            title="Clear Chat History"
                        >
                            <Trash2 size={18} />
                        </button>

                        <div className="relative">
                            <button
                                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                                className={cn(
                                    "p-2.5 rounded-2xl transition-all active:scale-95 border",
                                    isSettingsOpen
                                        ? "bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-500/20"
                                        : "bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-900/30 border-transparent text-slate-600 dark:text-slate-300 hover:text-indigo-600"
                                )}
                                title="Voice Settings"
                            >
                                <Volume2 size={18} />
                            </button>

                            {/* Voice Selection Dropdown */}
                            {isSettingsOpen && (
                                <div className="fixed inset-x-4 top-20 sm:absolute sm:inset-auto sm:right-0 sm:mt-3 w-auto sm:w-72 max-h-[60vh] sm:max-h-96 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-[60] animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="px-3 py-2 mb-1 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                            Voice Selection
                                        </span>
                                        <span className="text-[9px] font-bold text-slate-400">
                                            {voices.length} Available
                                        </span>
                                    </div>
                                    <div className="space-y-1 mt-1">
                                        {voices.length > 0 ? (
                                            voices.map((voice, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => { setSelectedVoiceIndex(index); setIsSettingsOpen(false); }}
                                                    className={cn(
                                                        "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors text-left",
                                                        selectedVoiceIndex === index
                                                            ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                                                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                                                    )}
                                                >
                                                    <span className="truncate pr-2">{voice.name}</span>
                                                    {selectedVoiceIndex === index && <Check size={14} className="shrink-0" />}
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-3 py-4 text-center text-xs text-slate-400">No system voices found.</div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-4 sm:py-8 flex flex-col items-center">
                {/* AI Assistant Avatar Area */}
                <div className="flex flex-col items-center mb-5 sm:mb-8 animate-in fade-in zoom-in duration-700">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full blur-[35px] sm:blur-[60px] opacity-25 animate-pulse"></div>
                        <img
                            src={aiAssistantPic}
                            alt="AI Assistant"
                            className="w-24 h-24 sm:w-44 sm:h-44 object-contain relative z-10 drop-shadow-xl"
                        />
                    </div>
                    <h1 className="text-xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tighter mt-3 text-center leading-tight">
                        How can I <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 bg-clip-text text-transparent">help you?</span>
                    </h1>
                </div>

                {/* Live Conversation Box */}
                <div className="w-full flex-1 min-h-[320px] sm:min-h-[420px] flex flex-col bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl rounded-3xl sm:rounded-[2.5rem] border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xl dark:shadow-none mb-24 sm:mb-28">
                    <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 px-3 py-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-full border border-slate-200/60 dark:border-slate-700">
                            <div className={cn(
                                "w-2 h-2 rounded-full animate-pulse shrink-0",
                                geminiConfig.enabled ? "bg-emerald-500" : "bg-amber-500"
                            )}></div>
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">Live Conversation</span>
                        </div>

                        {/* Status Indicator */}
                        <div className={cn(
                            "flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shrink-0",
                            geminiConfig.enabled
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/50"
                                : "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/50"
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
                        className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3.5 sm:space-y-5 custom-scrollbar"
                    >
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={cn(
                                    "flex items-start gap-2.5 sm:gap-3.5 animate-in fade-in slide-in-from-bottom-2 duration-500",
                                    msg.role === "user" ? "flex-row-reverse" : "flex-row"
                                )}
                            >
                                <div className={cn(
                                    "w-8 h-8 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border mt-0.5",
                                    msg.role === "user" ? "bg-indigo-600 border-indigo-500 text-white" : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400"
                                )}>
                                    {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
                                </div>

                                <div className={cn(
                                    "relative max-w-[85%] sm:max-w-[78%] p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed shadow-sm transition-all duration-300",
                                    msg.role === "user"
                                        ? "bg-indigo-600 text-white rounded-tr-xs"
                                        : "bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-tl-xs prose prose-sm dark:prose-invert prose-p:leading-relaxed",
                                    speakingMsgId === msg.id && "ring-2 ring-indigo-400/60 shadow-lg shadow-indigo-200/50 dark:shadow-indigo-900/40"
                                )}>
                                    {msg.role === "assistant" ? (
                                        <>
                                            <SpeakingMarkdown content={msg.content} />
                                            <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 dark:border-slate-700/60 text-[10px] text-slate-400">
                                                <span>Assistant</span>
                                                <button
                                                    onClick={() => {
                                                        if (speakingMsgId === msg.id && isSpeaking) {
                                                            stopSpeaking();
                                                        } else {
                                                            speak(msg.content, msg.id);
                                                        }
                                                    }}
                                                    className={cn(
                                                        "flex items-center gap-1 px-2 py-0.5 rounded-lg font-bold transition-all active:scale-95 border",
                                                        speakingMsgId === msg.id && isSpeaking
                                                            ? "bg-indigo-600 border-indigo-500 text-white shadow-sm"
                                                            : "bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 hover:text-indigo-600"
                                                    )}
                                                    title={speakingMsgId === msg.id && isSpeaking ? "Stop Speaking" : "Listen to Voice"}
                                                >
                                                    <Volume2 size={12} />
                                                    <span>{speakingMsgId === msg.id && isSpeaking ? "Speaking..." : "Listen"}</span>
                                                </button>
                                            </div>
                                        </>
                                    ) : msg.content}
                                    {speakingMsgId === msg.id && (
                                        <div className="absolute bottom-0 left-0 right-0 h-1.5 rounded-b-2xl overflow-hidden bg-indigo-100 dark:bg-indigo-900/30">
                                            <div
                                                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 transition-all duration-100 ease-out shadow-sm"
                                                style={{ width: `${Math.min(100, Math.max(0, speechProgress))}%` }}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {isTyping && (
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center shrink-0">
                                    <Bot size={16} className="text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 p-3.5 rounded-2xl rounded-tl-xs">
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
                <div className="fixed bottom-3 sm:bottom-6 left-0 right-0 z-40 px-3 sm:px-4 pointer-events-none flex flex-col items-center">
                    {/* Voice Error Toaster */}
                    {voiceError && (
                        <div className="mb-2 px-3.5 py-1.5 bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-500/30 flex items-center gap-2 animate-in slide-in-from-bottom-2 fade-in duration-300 pointer-events-auto">
                            <AlertCircle size={14} />
                            {voiceError}
                        </div>
                    )}

                    <div className="w-full max-w-2xl relative group pointer-events-auto">
                        <div className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-400/10 rounded-full blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                        <div className="relative flex items-center bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-slate-200/90 dark:border-slate-700/90 rounded-full p-1.5 shadow-xl dark:shadow-none focus-within:border-indigo-500/60 transition-all">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                                placeholder="Ask AI anything class or study related..."
                                className="flex-1 bg-transparent pl-4 sm:pl-6 pr-2 py-2 sm:py-2.5 text-xs sm:text-sm text-slate-800 dark:text-slate-100 font-semibold placeholder-slate-400 focus:outline-none"
                            />
                            <div className="flex items-center gap-1.5 pr-1">
                                <button
                                    onClick={() => {
                                        if (isSpeaking) {
                                            stopSpeaking();
                                        } else {
                                            handleVoiceSearch();
                                        }
                                    }}
                                    className={cn(
                                        "p-2.5 rounded-full transition-all active:scale-90",
                                        isListening ? "bg-rose-500 text-white animate-pulse shadow-md shadow-rose-500/40"
                                            : isSpeaking ? "bg-amber-500 text-white shadow-md shadow-amber-500/40 hover:bg-amber-600"
                                                : "text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                                    )}
                                    title={isSpeaking ? "Stop speaking" : "Voice search"}
                                >
                                    {isSpeaking && !isListening ? (
                                        <Square size={16} className="fill-current" />
                                    ) : (
                                        <Mic size={16} />
                                    )}
                                </button>
                                <button
                                    onClick={() => handleSendMessage()}
                                    disabled={!searchQuery.trim()}
                                    className="p-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-full shadow-md shadow-indigo-600/30 transition-all active:scale-95 disabled:opacity-40 disabled:scale-100 disabled:shadow-none"
                                >
                                    <Send size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Assistant;
