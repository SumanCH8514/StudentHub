import React, { useState, useEffect } from "react";
import { collection, getDocs, deleteDoc, doc, updateDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import {
    CalendarDays,
    UploadCloud,
    Edit3,
    Trash2,
    Save,
    X,
    Eye
} from "lucide-react";
import { clsx } from "clsx";
import Loader from "../Loader.jsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
    return twMerge(clsx(inputs));
}
import AdminHolidayUploader from "./AdminHolidayUploader.jsx";

const AdminHolidaysManager = () => {
    const [activeTab, setActiveTab] = useState("view"); // 'view', 'upload', 'edit'
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({ date: "", occasion: "" });

    const fetchHolidays = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "holidays"));
            const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            list.sort((a, b) => new Date(a.date) - new Date(b.date));
            setHolidays(list);
        } catch (err) {
            console.error("Failed to fetch holidays", err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch on mount and when swapping to view or edit tabs
    useEffect(() => {
        if (activeTab === "view" || activeTab === "edit") {
            fetchHolidays();
        }
    }, [activeTab]);

    const handleDelete = async (id) => {
        if (window.confirm("Delete this holiday?")) {
            try {
                await deleteDoc(doc(db, "holidays", id));
                setHolidays(prev => prev.filter(h => h.id !== id));
            } catch (err) {
                console.error("Failed to delete", err);
                alert("Failed to delete holiday");
            }
        }
    };

    const startEditing = (h) => {
        setEditingId(h.id);
        setEditForm({ date: h.date, occasion: h.occasion });
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditForm({ date: "", occasion: "" });
    };

    const saveEdit = async (id) => {
        if (!editForm.date || !editForm.occasion) return;
        try {
            await updateDoc(doc(db, "holidays", id), {
                date: editForm.date,
                occasion: editForm.occasion
            });
            setHolidays(prev => prev.map(h => h.id === id ? { ...h, ...editForm } : h));
            setEditingId(null);
        } catch (err) {
            console.error("Failed to update", err);
            alert("Failed to update holiday");
        }
    };

    const tabs = [
        { id: "view", label: "View Holidays", icon: Eye },
        { id: "upload", label: "Upload AI Sync", icon: UploadCloud },
        { id: "edit", label: "Edit Calendar", icon: Edit3 },
    ];

    return (
        <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 xl:p-10 border border-slate-200 dark:border-slate-700 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header & Navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-slate-100 dark:border-slate-700 pb-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center shrink-0">
                        <CalendarDays size={28} className="text-rose-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">Holiday Manager</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Manage the global holiday calendar</p>
                    </div>
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-xl self-start md:self-auto overflow-x-auto max-w-full scrollbar-hide">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    "flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all whitespace-nowrap",
                                    isActive
                                        ? "bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-sm"
                                        : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50"
                                )}
                            >
                                <Icon size={16} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">
                {/* ── VIEW TAB ── */}
                {activeTab === "view" && (
                    <div className="space-y-4">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Loader inline size="md" message="Loading calendar..." />
                            </div>
                        ) : holidays.length > 0 ? (
                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                {holidays.map((h) => {
                                    const dateObj = new Date(h.date);
                                    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                                    const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });
                                    const dateNum = dateObj.getDate();
                                    const isPast = dateObj < new Date(new Date().setHours(0, 0, 0, 0));

                                    return (
                                        <div key={h.id} className={cn(
                                            "flex items-center gap-4 p-4 rounded-xl border transition-all",
                                            isPast
                                                ? "bg-slate-50 dark:bg-slate-800/30 border-slate-100 dark:border-slate-800 opacity-60"
                                                : "bg-slate-50/50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 hover:border-rose-200 hover:shadow-sm"
                                        )}>
                                            <div className={cn(
                                                "w-12 h-12 rounded-xl flex flex-col items-center justify-center shrink-0 border",
                                                isPast
                                                    ? "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500"
                                                    : "bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800/30 text-rose-600 dark:text-rose-400"
                                            )}>
                                                <span className="text-[9px] font-bold uppercase tracking-widest">{monthName}</span>
                                                <span className="text-[15px] font-black leading-none">{dateNum}</span>
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h4 className={cn(
                                                    "font-bold text-sm line-clamp-2 break-words",
                                                    isPast ? "text-slate-600 dark:text-slate-400" : "text-slate-800 dark:text-slate-200"
                                                )} title={h.occasion}>{h.occasion}</h4>
                                                <p className="text-slate-500 text-xs font-medium mt-0.5">{dayName}, {dateObj.getFullYear()}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="py-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl">
                                <CalendarDays className="mx-auto text-slate-300 dark:text-slate-600 mb-4" size={48} />
                                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">Calendar is Empty</h3>
                                <p className="text-slate-500 max-w-sm mx-auto">No holidays have been synced yet. Use the Upload tab to add new holidays via AI.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ── UPLOAD TAB ── */}
                {activeTab === "upload" && (
                    <div className="max-w-2xl mx-auto py-4">
                        <div className="text-center mb-8">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-2">AI-Powered Sync</h3>
                            <p className="text-slate-500 dark:text-slate-400">Upload a picture, PDF, or CSV of the official holiday list and Gemini will instantly parse and save it.</p>
                        </div>
                        <AdminHolidayUploader onSuccess={() => setActiveTab("view")} />
                    </div>
                )}

                {/* ── EDIT TAB ── */}
                {activeTab === "edit" && (
                    <div className="space-y-4 max-w-4xl mx-auto">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-20">
                                <Loader inline size="md" message="Loading calendar..." />
                            </div>
                        ) : holidays.length > 0 ? (
                            <div className="bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-x-auto scrollbar-hide">
                                <div className="min-w-[640px]">
                                    <div className="grid grid-cols-12 gap-4 p-4 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 font-bold text-slate-600 dark:text-slate-400 text-sm">
                                        <div className="col-span-3">Date</div>
                                        <div className="col-span-6">Occasion</div>
                                        <div className="col-span-3 text-right">Actions</div>
                                    </div>
                                    <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                        {holidays.map((h) => (
                                            <div key={h.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white dark:hover:bg-slate-800 transition-colors">
                                                {editingId === h.id ? (
                                                    <>
                                                        <div className="col-span-3">
                                                            <input
                                                                type="date"
                                                                value={editForm.date}
                                                                onChange={(e) => setEditForm(prev => ({ ...prev, date: e.target.value }))}
                                                                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                                                            />
                                                        </div>
                                                        <div className="col-span-6">
                                                            <input
                                                                type="text"
                                                                value={editForm.occasion}
                                                                onChange={(e) => setEditForm(prev => ({ ...prev, occasion: e.target.value }))}
                                                                placeholder="Occasion Name"
                                                                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-rose-500"
                                                            />
                                                        </div>
                                                        <div className="col-span-3 flex justify-end gap-2">
                                                            <button
                                                                onClick={cancelEditing}
                                                                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                                                title="Cancel"
                                                            >
                                                                <X size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => saveEdit(h.id)}
                                                                className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 rounded-lg transition-colors"
                                                                title="Save Changes"
                                                            >
                                                                <Save size={18} />
                                                            </button>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="col-span-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                                            {h.date}
                                                        </div>
                                                        <div className="col-span-6 text-sm text-slate-600 dark:text-slate-400 font-medium truncate" title={h.occasion}>
                                                            {h.occasion}
                                                        </div>
                                                        <div className="col-span-3 flex justify-end gap-2">
                                                            <button
                                                                onClick={() => startEditing(h)}
                                                                className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 rounded-lg transition-colors"
                                                                title="Edit"
                                                            >
                                                                <Edit3 size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(h.id)}
                                                                className="p-2 text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 rounded-lg transition-colors"
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="py-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl">
                                <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">Nothing to edit</h3>
                                <p className="text-slate-500 max-w-sm mx-auto">Upload a holiday list first.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminHolidaysManager;
