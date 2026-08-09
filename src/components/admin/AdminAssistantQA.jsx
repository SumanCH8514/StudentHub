import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
    MessageSquare,
    Search,
    Plus,
    Edit2,
    Trash2,
    Check,
    Tag,
    BookOpen,
    Sparkles,
    Send
} from "lucide-react";
import { db } from "../../firebaseConfig";
import {
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp
} from "firebase/firestore";
import demoQuestions from "../../assets/json/demoQuestions.json";
import Loader from "../Loader.jsx";

const LOCAL_STORAGE_QA_KEY = "studenthub_admin_custom_qa";

const AdminAssistantQA = () => {
    const [qaList, setQaList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [modalOpen, setModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [question, setQuestion] = useState("");
    const [answer, setAnswer] = useState("");
    const [category, setCategory] = useState("General");
    const [isSaving, setIsSaving] = useState(false);
    const [notification, setNotification] = useState(null);

    const showNotify = (msg, type = "success") => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const fetchQA = async () => {
        setLoading(true);
        let localCustom = [];
        try {
            const stored = localStorage.getItem(LOCAL_STORAGE_QA_KEY);
            if (stored) localCustom = JSON.parse(stored);
        } catch (_) {}

        let firestoreItems = [];
        try {
            const snap = await getDocs(collection(db, "custom_qa"));
            snap.forEach((d) => {
                firestoreItems.push({ id: d.id, ...d.data(), isCustom: true });
            });
        } catch (_) {}

        // Combine custom items (prefer Firestore if available, otherwise local)
        const customItems = firestoreItems.length > 0 ? firestoreItems : localCustom;

        const defaultItems = demoQuestions.map((q, idx) => ({
            id: `default-${idx}`,
            question: q.question,
            answer: q.answer,
            category: "System Default",
            isCustom: false
        }));

        setQaList([...customItems, ...defaultItems]);
        setLoading(false);
    };

    useEffect(() => {
        fetchQA();
    }, []);

    const handleSave = async (e) => {
        e.preventDefault();
        if (!question.trim() || !answer.trim()) return;
        setIsSaving(true);

        const newItem = {
            id: editingItem?.id || `custom-${Date.now()}`,
            question: question.trim(),
            answer: answer.trim(),
            category: category,
            isCustom: true,
            updatedAt: new Date().toISOString()
        };

        // Save to LocalStorage immediately
        try {
            const stored = localStorage.getItem(LOCAL_STORAGE_QA_KEY);
            const existing = stored ? JSON.parse(stored) : [];
            let updatedList;
            if (editingItem && editingItem.isCustom) {
                updatedList = existing.map(i => i.id === editingItem.id ? newItem : i);
            } else {
                updatedList = [newItem, ...existing.filter(i => i.id !== newItem.id)];
            }
            localStorage.setItem(LOCAL_STORAGE_QA_KEY, JSON.stringify(updatedList));
        } catch (_) {}

        // Attempt Firestore sync silently
        try {
            if (editingItem && editingItem.isCustom && !editingItem.id.startsWith("custom-")) {
                await updateDoc(doc(db, "custom_qa", editingItem.id), {
                    question: question.trim(),
                    answer: answer.trim(),
                    category: category,
                    updatedAt: serverTimestamp()
                });
            } else {
                await addDoc(collection(db, "custom_qa"), {
                    question: question.trim(),
                    answer: answer.trim(),
                    category: category,
                    createdAt: serverTimestamp()
                });
            }
        } catch (_) {}

        showNotify(editingItem ? "Q&A updated successfully!" : "New Q&A pair added to Knowledge Base!");
        setModalOpen(false);
        setEditingItem(null);
        setQuestion("");
        setAnswer("");
        setIsSaving(false);
        fetchQA();
    };

    const handleDelete = async (item) => {
        if (!item.isCustom) {
            alert("System default Q&As cannot be deleted directly.");
            return;
        }
        if (!window.confirm("Are you sure you want to delete this Q&A entry?")) return;

        // Delete from LocalStorage
        try {
            const stored = localStorage.getItem(LOCAL_STORAGE_QA_KEY);
            if (stored) {
                const existing = JSON.parse(stored);
                const filtered = existing.filter(i => i.id !== item.id);
                localStorage.setItem(LOCAL_STORAGE_QA_KEY, JSON.stringify(filtered));
            }
        } catch (_) {}

        // Delete from Firestore silently
        try {
            if (!item.id.startsWith("custom-")) {
                await deleteDoc(doc(db, "custom_qa", item.id));
            }
        } catch (_) {}

        setQaList((prev) => prev.filter((i) => i.id !== item.id));
        showNotify("Q&A pair deleted.");
    };

    const categories = ["all", "General", "Schedule", "Holidays", "Exams", "Campus", "System Default"];

    const filtered = qaList.filter((item) => {
        const qMatch = item.question.toLowerCase().includes(searchTerm.toLowerCase());
        const aMatch = item.answer.toLowerCase().includes(searchTerm.toLowerCase());
        const categoryMatch = selectedCategory === "all" || item.category === selectedCategory;
        return (qMatch || aMatch) && categoryMatch;
    });

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <MessageSquare className="text-indigo-600 dark:text-indigo-400" size={24} />
                        Assistant Q&A Knowledge Base
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Train and manage custom Question and Answer patterns for student queries.
                    </p>
                </div>
                <button
                    onClick={() => {
                        setEditingItem(null);
                        setQuestion("");
                        setAnswer("");
                        setCategory("General");
                        setModalOpen(true);
                    }}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md shadow-indigo-200 dark:shadow-none shrink-0"
                >
                    <Plus size={16} />
                    <span>Add New Q&A</span>
                </button>
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
                        placeholder="Search questions or answers..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
                    {categories.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                                selectedCategory === cat
                                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                                    : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                            }`}
                        >
                            {cat === "all" ? "All Categories" : cat}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <Loader inline size="md" />
                    <p className="text-xs text-slate-400 mt-2 font-medium">Loading Knowledge Base...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <BookOpen className="mx-auto text-slate-300 mb-3" size={36} />
                    <h3 className="text-base font-bold text-slate-800 dark:text-white">No Q&As Found</h3>
                    <p className="text-xs text-slate-400 mt-1">Try adjusting your search query or add a new Q&A pair.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filtered.map((item) => (
                        <div
                            key={item.id}
                            className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-4 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all"
                        >
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-wider">
                                        {item.category || "General"}
                                    </span>
                                    {item.isCustom ? (
                                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-md">
                                            Custom Trained
                                        </span>
                                    ) : (
                                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md">
                                            Built-in
                                        </span>
                                    )}
                                </div>
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                    Q: "{item.question}"
                                </h4>
                                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                                    {item.answer}
                                </p>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-700/50">
                                {item.isCustom && (
                                    <>
                                        <button
                                            onClick={() => {
                                                setEditingItem(item);
                                                setQuestion(item.question);
                                                setAnswer(item.answer);
                                                setCategory(item.category || "General");
                                                setModalOpen(true);
                                            }}
                                            className="px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-200 flex items-center gap-1"
                                        >
                                            <Edit2 size={12} />
                                            <span>Edit</span>
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item)}
                                            className="p-1.5 bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all"
                                            title="Delete Q&A"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {modalOpen && createPortal(
                <div className="fixed inset-0 xl:left-[260px] bg-slate-900/60 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                            <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <Sparkles className="text-indigo-600" size={20} />
                                {editingItem ? "Edit Q&A Entry" : "Create New Q&A"}
                            </h3>
                            <button
                                onClick={() => setModalOpen(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                                    Question Trigger Pattern
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. what is the library timing"
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                                    Category Tag
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
                                    placeholder="Write the clear, accurate response the AI should give..."
                                    value={answer}
                                    onChange={(e) => setAnswer(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setModalOpen(false)}
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
                                    <span>{editingItem ? "Save Changes" : "Create Q&A"}</span>
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

export default AdminAssistantQA;
