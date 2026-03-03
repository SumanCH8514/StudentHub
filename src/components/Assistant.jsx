import React, { useState, useEffect, useRef } from "react";
import {
    ArrowLeft,
    Mic,
    Send,
    Sparkles,
    User,
    Bot,
    X,
    Loader2,
    Settings,
    Volume2,
    Check
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { db, auth } from "../firebaseConfig";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { doc, getDoc } from "firebase/firestore";
import ReactMarkdown from "react-markdown";
import demoQuestions from "../assets/json/demoQuestions.json";
import favLogo from "../assets/fav.png";
import aiAssistantPic from "../assets/StudentHub-ai-assistant-pic.png";

const GEMINI_KEYS = [
    import.meta.env.VITE_GEMINI_API_KEY_1,
    import.meta.env.VITE_GEMINI_API_KEY_2,
    import.meta.env.VITE_GEMINI_API_KEY_3,
    import.meta.env.VITE_GEMINI_API_KEY_4,
    import.meta.env.VITE_GEMINI_API_KEY_5,
];

// Utility for cleaner conditional classes
function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const Assistant = ({ onBack, classes = [], holidays = [], userData = null, systemUpdates = [] }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [isListening, setIsListening] = useState(false);
    const [voices, setVoices] = useState([]);
    const [selectedVoiceIndex, setSelectedVoiceIndex] = useState(0);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [geminiConfig, setGeminiConfig] = useState({ enabled: false, keyIndex: 0 });
    const [messages, setMessages] = useState([
        { id: 1, role: "assistant", content: "Hello! I'm your StudentHub AI assistant. How can I help you with your classes or schedule today?", timestamp: new Date() }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const scrollRef = useRef(null);

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

        const loadVoices = () => {
            const availableVoices = window.speechSynthesis.getVoices();
            setVoices(availableVoices);

            // Try to find Microsoft Ravi, or fallback to a good default
            const raviIndex = availableVoices.findIndex(v => v.name.includes("Microsoft Ravi"));
            if (raviIndex !== -1) {
                setSelectedVoiceIndex(raviIndex);
            } else {
                const defaultIndex = availableVoices.findIndex(v => v.name.includes("Google US English") || v.name.includes("Female"));
                if (defaultIndex !== -1) setSelectedVoiceIndex(defaultIndex);
            }
        };

        fetchConfig();
        loadVoices();
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    }, []);

    // Auto-scroll to bottom of conversation
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isTyping]);

    const speak = (text) => {
        if (!window.speechSynthesis || voices.length === 0) return;
        // Stop any current speech
        window.speechSynthesis.cancel();

        // Strip markdown formatting before speaking so it doesn't say "asterisk"
        let cleanText = text
            .replace(/\*\*/g, '')      // Remove bold asterisks
            .replace(/\*/g, '')       // Remove italic/list asterisks
            .replace(/#/g, '')        // Remove headers
            .replace(/`/g, '')        // Remove code blocks
            .replace(/_ /g, '')       // Remove underscores
            .trim();

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.voice = voices[selectedVoiceIndex];
        utterance.lang = voices[selectedVoiceIndex].lang;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
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

            if (geminiConfig.enabled) {
                try {
                    const activeKey = GEMINI_KEYS[geminiConfig.keyIndex];
                    if (!activeKey) throw new Error("API Key missing");

                    const genAI = new GoogleGenerativeAI(activeKey);
                    const scheduleContext = classes && classes.length > 0
                        ? `Here is the user's class schedule routine:\n${classes.map(c => `- ${c.subject} on ${c.day} at ${c.time} taught by ${c.teacher}`).join('\n')}`
                        : "The user currently has no classes scheduled.";

                    const holidaysContext = holidays && holidays.length > 0
                        ? `Here is the university holiday list:\n${holidays.map(h => `- ${h.occasion} on ${h.date}${h.description ? ` (${h.description})` : ''}`).join('\n')}`
                        : "There are no upcoming holidays.";

                    const userContext = userData
                        ? `Here is the user's personal and academic profile:\nName: ${userData.fullName || userData.name || 'Unknown'}\nEmail: ${userData.email || 'Unknown'}\nUniversity: ${userData.university || 'Not set'}\nStream of Study: ${userData.stream || 'Not set'}\nSemester: ${userData.semester || 'Not set'}\nSection/Batch: ${userData.section || 'Not set'}`
                        : "User profile data is currently unavailable.";

                    const notificationsContext = systemUpdates && systemUpdates.length > 0
                        ? `Here are the latest system notifications and updates the user has received:\n${systemUpdates.map(u => `- [${u.type ? u.type.toUpperCase() : 'ALERT'}] ${u.title}: ${u.description || ''} (Dated: ${u.createdAt ? new Date(u.createdAt.seconds * 1000).toLocaleDateString() : 'Recent'})`).join('\n')}`
                        : "There are no recent system notifications.";

                    const today = new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
                    const timeNow = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

                    const systemInstruction = `You are a helpful AI assistant for StudentHub, a smart class scheduling and university management application. You help the user manage their academic life, understand their schedule, and answer questions about their classes, holidays, and notifications.
                    Identity Rule: If asked who created you, who you are, or your origin, you MUST answer exactly: "I am StudentHub's AI assistant. Created and designed by SumanOnline.Com"
                    Today is ${today}, and the current time is ${timeNow}. Format all schedule responses beautifully using Markdown lists and bold text.
                    
                    ${userContext}
                    
                    ${scheduleContext}
                    
                    ${holidaysContext}
                    
                    ${notificationsContext}`;

                    const model = genAI.getGenerativeModel({
                        model: "gemini-2.5-flash",
                        systemInstruction: systemInstruction
                    });

                    let chatHistory = messages.map(m => ({
                        role: m.role === "user" ? "user" : "model",
                        parts: [{ text: m.content }]
                    })).slice(-10); // Only last 10 messages for context

                    // Gemini API strictly requires history to begin with a 'user' role.
                    // If the slice made it start with 'model', remove that first 'model' message.
                    if (chatHistory.length > 0 && chatHistory[0].role === "model") {
                        chatHistory.shift();
                    }

                    const chat = model.startChat({
                        history: chatHistory
                    });

                    const result = await chat.sendMessage(query);
                    const response = await result.response;
                    responseText = response.text();
                } catch (err) {
                    console.error("Gemini API Error:", err);
                    responseText = "I'm having trouble connecting to my brain right now. Please try again later!";
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
                    responseText = "I am StudentHub's AI assistant. Created and designed by SumanOnline.Com";
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

            // Attempt to save the question and answer locally via Vite Dev API
            try {
                fetch("/api/save-question", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ question: query, answer: responseText })
                }).catch(e => console.warn("Failed to save question & answer:", e));
            } catch (e) {
                console.warn("Failed to save question to local JSON:", e);
            }

            // Respond with voice if user used voice input OR if it was a demo question
            // (Only if Gemini is offline, or it was voice input)
            const wasOffline = !geminiConfig.enabled;
            const mockMatch = wasOffline && demoQuestions.find(item => query.toLowerCase().includes(item.question.toLowerCase()));

            if (isVoiceInput || mockMatch) {
                speak(responseText);
            }
        }, 500);
    };

    const handleVoiceSearch = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Voice search is not supported in your browser.");
            return;
        }

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

                            {/* Voice Selection Dropdown */}
                            {isSettingsOpen && (
                                <div className="fixed inset-x-4 top-20 sm:absolute sm:inset-auto sm:right-0 sm:mt-3 w-auto sm:w-64 max-h-[60vh] sm:max-h-80 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-2xl p-2 z-[60] animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="px-3 py-2 mb-1">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select AI Voice</span>
                                    </div>
                                    <div className="space-y-1">
                                        {voices.length > 0 ? (
                                            voices.map((voice, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => {
                                                        setSelectedVoiceIndex(index);
                                                        setIsSettingsOpen(false);
                                                        // Play a sample
                                                        const sampleUtt = new SpeechSynthesisUtterance("Voice selected");
                                                        sampleUtt.voice = voice;
                                                        window.speechSynthesis.speak(sampleUtt);
                                                    }}
                                                    className={cn(
                                                        "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-colors",
                                                        selectedVoiceIndex === index
                                                            ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                                                            : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                                                    )}
                                                >
                                                    <span className="truncate pr-2">{voice.name}</span>
                                                    {selectedVoiceIndex === index && <Check size={14} />}
                                                </button>
                                            ))
                                        ) : (
                                            <div className="px-3 py-4 text-center text-xs text-slate-400">
                                                No voices found on this device.
                                            </div>
                                        )}
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

                {/* Search Bar / Input */}
                <div className="w-full max-w-2xl relative mb-6 sm:mb-8 group">
                    <div className="absolute inset-0 bg-indigo-500/5 dark:bg-indigo-400/5 rounded-[1.5rem] sm:rounded-[2rem] blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity"></div>
                    <div className="relative flex items-center bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[1.5rem] sm:rounded-[2rem] p-1.5 sm:p-2 shadow-xl shadow-slate-200/50 dark:shadow-none focus-within:border-indigo-500/30 transition-all">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                            placeholder="Ask me anything..."
                            className="flex-1 bg-transparent px-4 sm:px-6 py-2 sm:py-3 text-[14px] sm:text-base text-slate-800 dark:text-slate-100 font-bold placeholder-slate-400 focus:outline-none"
                        />
                        <div className="flex items-center gap-1 sm:gap-2 pr-1 sm:pr-2">
                            <button
                                onClick={handleVoiceSearch}
                                className={cn(
                                    "p-2 sm:p-3 rounded-xl sm:rounded-2xl transition-all active:scale-90",
                                    isListening ? "bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/40" : "text-slate-400 hover:text-indigo-600 hover:bg-slate-50 dark:hover:bg-slate-800"
                                )}
                            >
                                <Mic size={18} className="sm:w-5 sm:h-5" />
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

                {/* Live Conversation Box */}
                <div className="w-full max-w-2xl flex-1 min-h-[300px] sm:min-h-[400px] flex flex-col bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2rem] sm:rounded-[2.5rem] border border-white/60 dark:border-slate-800 overflow-hidden shadow-2xl shadow-slate-200/40 dark:shadow-none mb-6 sm:mb-10">
                    <div className="px-6 sm:px-8 py-4 sm:py-5 border-b border-white/60 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Live Conversation</span>
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
                                    <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Assistant;
