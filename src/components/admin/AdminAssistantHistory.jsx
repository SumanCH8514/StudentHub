import React, { useState, useEffect } from "react";
import {
    History,
    Search,
    User,
    Bot,
    Clock,
    Wifi,
    WifiOff,
    Trash2,
    Filter,
    MessageCircle,
    Calendar
} from "lucide-react";
import { db } from "../../firebaseConfig";
import {
    collection,
    getDocs,
    collectionGroup,
    deleteDoc,
    doc
} from "firebase/firestore";
import Loader from "../Loader.jsx";

const AdminAssistantHistory = () => {
    const [historyList, setHistoryList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterEngine, setFilterEngine] = useState("all");

    const fetchHistory = async () => {
        setLoading(true);
        let localHistory = [];
        try {
            const stored = localStorage.getItem("studenthub_ai_chat_history");
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    localHistory = parsed.map(m => ({
                        id: m.id,
                        question: m.role === "user" ? m.content : "User inquiry",
                        answer: m.role === "assistant" ? m.content : "AI Response",
                        timestamp: m.timestamp,
                        geminiOnline: true
                    }));
                }
            }
        } catch (_) {}

        let firestoreItems = [];
        try {
            const groupSnap = await getDocs(collectionGroup(db, "ai_conversations"));
            groupSnap.forEach((d) => {
                firestoreItems.push({ id: d.id, ...d.data() });
            });
        } catch (_) {
            try {
                const topSnap = await getDocs(collection(db, "ai_conversations"));
                topSnap.forEach((d) => {
                    firestoreItems.push({ id: d.id, ...d.data() });
                });
            } catch (_) {}
        }

        const items = firestoreItems.length > 0 ? firestoreItems : localHistory;

        items.sort((a, b) => {
            const aTime = a.timestamp?.seconds || (a.timestamp ? new Date(a.timestamp).getTime() / 1000 : 0);
            const bTime = b.timestamp?.seconds || (b.timestamp ? new Date(b.timestamp).getTime() / 1000 : 0);
            return bTime - aTime;
        });

        setHistoryList(items);
        setLoading(false);
    };

    useEffect(() => {
        fetchHistory();
    }, []);

    const filtered = historyList.filter((item) => {
        const qText = (item.question || "").toLowerCase();
        const aText = (item.answer || "").toLowerCase();
        const uText = (item.userEmail || item.userId || "").toLowerCase();
        const matchesSearch = qText.includes(searchTerm.toLowerCase()) || aText.includes(searchTerm.toLowerCase()) || uText.includes(searchTerm.toLowerCase());
        
        if (filterEngine === "online") return matchesSearch && item.geminiOnline === true;
        if (filterEngine === "offline") return matchesSearch && item.geminiOnline === false;
        return matchesSearch;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <History className="text-indigo-600 dark:text-indigo-400" size={24} />
                        Assistant Chat History Logs
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        View live conversation transcripts and AI interactions across all platform users.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="px-3.5 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-black">
                        {historyList.length} Conversations Recorded
                    </span>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search student questions, AI answers, or user IDs..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setFilterEngine("all")}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                            filterEngine === "all"
                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                                : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                        }`}
                    >
                        All Logs
                    </button>
                    <button
                        onClick={() => setFilterEngine("online")}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                            filterEngine === "online"
                                ? "bg-emerald-600 text-white shadow-md shadow-emerald-200"
                                : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                        }`}
                    >
                        Gemini AI Online
                    </button>
                    <button
                        onClick={() => setFilterEngine("offline")}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                            filterEngine === "offline"
                                ? "bg-amber-500 text-white shadow-md shadow-amber-200"
                                : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                        }`}
                    >
                        Offline Fallback
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <Loader inline size="md" />
                    <p className="text-xs text-slate-400 mt-2 font-medium">Fetching conversation logs...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <MessageCircle className="mx-auto text-slate-300 mb-3" size={36} />
                    <h3 className="text-base font-bold text-slate-800 dark:text-white">No Conversation Logs Found</h3>
                    <p className="text-xs text-slate-400 mt-1">No AI chat transcripts recorded yet or matching your search filter.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filtered.map((item, idx) => (
                        <div
                            key={item.id || idx}
                            className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-3 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xs">
                                        <User size={14} />
                                    </div>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                        {item.userEmail || item.userId || "Anonymous Student"}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    {item.geminiOnline ? (
                                        <span className="flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-md text-[10px] font-bold">
                                            <Wifi size={10} /> Gemini AI
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-md text-[10px] font-bold">
                                            <WifiOff size={10} /> Offline Q&A
                                        </span>
                                    )}
                                    <span className="text-[11px] text-slate-400 font-medium">
                                        {item.timestamp?.seconds
                                            ? new Date(item.timestamp.seconds * 1000).toLocaleString()
                                            : "Recent"}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2 pl-9">
                                <div className="bg-indigo-50/60 dark:bg-indigo-900/20 p-3 rounded-xl border border-indigo-100/80 dark:border-indigo-800/40">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-1">
                                        Student Query
                                    </span>
                                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                        "{item.question}"
                                    </p>
                                </div>

                                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1">
                                        AI Response
                                    </span>
                                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                                        {item.answer}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminAssistantHistory;
