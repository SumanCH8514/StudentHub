import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
    HelpCircle,
    Search,
    MessageSquare,
    CheckCircle2,
    Clock,
    PlusCircle,
    Trash2,
    Sparkles,
    AlertCircle,
    Send,
    Filter,
    ArrowRight
} from "lucide-react";
import { db } from "../../firebaseConfig";
import {
    collection,
    getDocs,
    addDoc,
    deleteDoc,
    doc,
    serverTimestamp
} from "firebase/firestore";
import Loader from "../Loader.jsx";

const LOCAL_STORAGE_QUERIES_KEY = "studenthub_admin_unanswered_queries";

const AdminAssistantQueries = () => {
    const [queriesList, setQueriesList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [selectedQuery, setSelectedQuery] = useState(null);
    const [convertModalOpen, setConvertModalOpen] = useState(false);
    const [newAnswer, setNewAnswer] = useState("");
    const [category, setCategory] = useState("General");
    const [isSaving, setIsSaving] = useState(false);
    const [notification, setNotification] = useState(null);

    const showNotify = (msg, type = "success") => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const fetchQueries = async () => {
        setLoading(true);
        let localQueries = [];
        try {
            const stored = localStorage.getItem(LOCAL_STORAGE_QUERIES_KEY);
            if (stored) localQueries = JSON.parse(stored);
        } catch (_) {}

        let firestoreItems = [];
        try {
            const snap = await getDocs(collection(db, "ai_unanswered_queries"));
            snap.forEach((d) => {
                firestoreItems.push({ id: d.id, ...d.data() });
            });
        } catch (_) {}

        const finalItems = firestoreItems.length > 0 ? firestoreItems : (localQueries.length > 0 ? localQueries : [
            {
                id: "demo-1",
                question: "When is the next midterm exam schedule coming out?",
                userEmail: "student@example.com",
                timestamp: { seconds: Math.floor(Date.now() / 1000 - 3600) },
                status: "pending",
                frequency: 4
            },
            {
                id: "demo-2",
                question: "Where is the Physics Lab Room 302 located?",
                userEmail: "alex@example.com",
                timestamp: { seconds: Math.floor(Date.now() / 1000 - 7200) },
                status: "pending",
                frequency: 2
            }
        ]);

        finalItems.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
        setQueriesList(finalItems);
        setLoading(false);
    };

    useEffect(() => {
        fetchQueries();
    }, []);

    const handleConvertToQA = async (e) => {
        e.preventDefault();
        if (!selectedQuery || !newAnswer.trim()) return;
        setIsSaving(true);

        const newQa = {
            id: `custom-${Date.now()}`,
            question: selectedQuery.question,
            answer: newAnswer.trim(),
            category: category,
            isCustom: true,
            createdAt: new Date().toISOString()
        };

        // Save to LocalStorage custom QA list
        try {
            const stored = localStorage.getItem("studenthub_admin_custom_qa");
            const existing = stored ? JSON.parse(stored) : [];
            localStorage.setItem("studenthub_admin_custom_qa", JSON.stringify([newQa, ...existing]));
        } catch (_) {}

        // Remove from LocalStorage queries list
        try {
            const storedQ = localStorage.getItem(LOCAL_STORAGE_QUERIES_KEY);
            if (storedQ) {
                const existingQ = JSON.parse(storedQ);
                localStorage.setItem(LOCAL_STORAGE_QUERIES_KEY, JSON.stringify(existingQ.filter(q => q.id !== selectedQuery.id)));
            }
        } catch (_) {}

        // Silent Firestore write
        try {
            await addDoc(collection(db, "custom_qa"), {
                question: selectedQuery.question,
                answer: newAnswer.trim(),
                category: category,
                createdAt: serverTimestamp(),
                createdBy: "Admin"
            });
            if (!selectedQuery.id.startsWith("demo-")) {
                await deleteDoc(doc(db, "ai_unanswered_queries", selectedQuery.id));
            }
        } catch (_) {}

        setQueriesList((prev) => prev.filter((q) => q.id !== selectedQuery.id));
        setConvertModalOpen(false);
        setSelectedQuery(null);
        setNewAnswer("");
        setIsSaving(false);
        showNotify("Query successfully converted to Knowledge Base Q&A!");
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to dismiss this query?")) return;

        // Remove from LocalStorage
        try {
            const stored = localStorage.getItem(LOCAL_STORAGE_QUERIES_KEY);
            if (stored) {
                const existing = JSON.parse(stored);
                localStorage.setItem(LOCAL_STORAGE_QUERIES_KEY, JSON.stringify(existing.filter(q => q.id !== id)));
            }
        } catch (_) {}

        // Silent Firestore delete
        try {
            if (!id.startsWith("demo-")) {
                await deleteDoc(doc(db, "ai_unanswered_queries", id));
            }
        } catch (_) {}

        setQueriesList((prev) => prev.filter((q) => q.id !== id));
        showNotify("Query dismissed.");
    };

    const filtered = queriesList.filter((item) => {
        const qText = (item.question || "").toLowerCase();
        const emailText = (item.userEmail || "").toLowerCase();
        const matchesSearch = qText.includes(searchTerm.toLowerCase()) || emailText.includes(searchTerm.toLowerCase());
        if (filterStatus === "all") return matchesSearch;
        return matchesSearch && item.status === filterStatus;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <HelpCircle className="text-indigo-600 dark:text-indigo-400" size={24} />
                        Assistant Student Queries
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Monitor questions asked by students that needed additional answers or AI clarification.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-black">
                        {queriesList.length} Queries Pending
                    </span>
                </div>
            </div>

            {notification && (
                <div
                    className={`p-4 rounded-xl text-xs font-bold transition-all ${
                        notification.type === "error"
                            ? "bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                            : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                    }`}
                >
                    {notification.msg}
                </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search student queries..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setFilterStatus("all")}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                            filterStatus === "all"
                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                                : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                        }`}
                    >
                        All
                    </button>
                    <button
                        onClick={() => setFilterStatus("pending")}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                            filterStatus === "pending"
                                ? "bg-amber-500 text-white shadow-md shadow-amber-200"
                                : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                        }`}
                    >
                        Pending Review
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <Loader inline size="md" />
                    <p className="text-xs text-slate-400 mt-2 font-medium">Loading student queries...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <CheckCircle2 className="mx-auto text-emerald-500 mb-3" size={36} />
                    <h3 className="text-base font-bold text-slate-800 dark:text-white">All Queries Addressed!</h3>
                    <p className="text-xs text-slate-400 mt-1">No pending unanswered queries found matching your search.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filtered.map((q) => (
                        <div
                            key={q.id}
                            className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all"
                        >
                            <div className="space-y-1.5 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                        Student Query
                                    </span>
                                    {q.frequency && (
                                        <span className="px-2.5 py-0.5 bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-lg text-[10px] font-black">
                                            Asked {q.frequency}x
                                        </span>
                                    )}
                                </div>
                                <h4 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                                    "{q.question}"
                                </h4>
                                <p className="text-xs text-slate-400 flex items-center gap-2">
                                    <span>Asked by: {q.userEmail || "Anonymous Student"}</span>
                                    <span>•</span>
                                    <span>
                                        {q.timestamp?.seconds
                                            ? new Date(q.timestamp.seconds * 1000).toLocaleString()
                                            : "Recent"}
                                    </span>
                                </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                                <button
                                    onClick={() => {
                                        setSelectedQuery(q);
                                        setNewAnswer("");
                                        setConvertModalOpen(true);
                                    }}
                                    className="flex-1 sm:flex-initial px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-200 dark:shadow-none"
                                >
                                    <PlusCircle size={14} />
                                    <span>Add Answer to Q&A</span>
                                </button>
                                <button
                                    onClick={() => handleDelete(q.id)}
                                    className="p-2 bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all"
                                    title="Dismiss Query"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {convertModalOpen && selectedQuery && createPortal(
                <div className="fixed inset-0 xl:left-[260px] bg-slate-900/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <Sparkles className="text-indigo-600" size={20} />
                                Convert to Trained Q&A
                            </h3>
                            <button
                                onClick={() => setConvertModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleConvertToQA} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                                    Question Trigger
                                </label>
                                <input
                                    type="text"
                                    value={selectedQuery.question}
                                    readOnly
                                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                                    Category
                                </label>
                                <select
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="General">General Info</option>
                                    <option value="Schedule">Class Schedules</option>
                                    <option value="Holidays">Holidays & Calendar</option>
                                    <option value="Exams">Exams & Grades</option>
                                    <option value="Campus">Campus & Labs</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                                    Target Answer Response
                                </label>
                                <textarea
                                    rows={4}
                                    required
                                    placeholder="Write the official response that the AI assistant should speak and display..."
                                    value={newAnswer}
                                    onChange={(e) => setNewAnswer(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setConvertModalOpen(false)}
                                    className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-200 dark:shadow-none flex items-center gap-1.5"
                                >
                                    {isSaving ? <Loader inline size="sm" /> : <Send size={14} />}
                                    <span>Save Trained Q&A</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default AdminAssistantQueries;
