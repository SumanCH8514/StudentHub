import React, { useState, useEffect } from "react";
import {
    collection,
    query,
    onSnapshot,
    getDocs,
    addDoc,
    deleteDoc,
    updateDoc,
    doc,
    orderBy,
    serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { PlusCircle, Trash2, Bell, BookOpen, GraduationCap, CalendarDays, Search, Users, Edit2, X } from "lucide-react";
import Loader from "../Loader.jsx";

const AdminUpdates = () => {
    const [updates, setUpdates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [newUpdate, setNewUpdate] = useState({
        title: "",
        description: "",
        type: "notification", // can be notification, statement, alert
        targetUniversity: "All",
        targetStream: "All",
        targetSemester: "All",
        targetSection: "All"
    });

    const hasRunCleanup = React.useRef(false);

    useEffect(() => {
        // Cleanup old notifications function
        const cleanupOldUpdates = async () => {
            try {
                // Get updates older than 3 days
                const threeDaysAgo = new Date();
                threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

                // We can't query by timestamp easily without composite index, so we fetch all and filter in JS.
                // Since admins visit this, the amount of docs shouldn't be massive due to continuous cleanup.
                const updatesSnapshot = await getDocs(collection(db, "updates"));
                
                const deletePromises = [];
                updatesSnapshot.forEach(docSnap => {
                    const data = docSnap.data();
                    if (data.createdAt && data.createdAt.toDate) {
                        const createdAtDate = data.createdAt.toDate();
                        if (createdAtDate < threeDaysAgo) {
                            deletePromises.push(deleteDoc(doc(db, "updates", docSnap.id)));
                        }
                    }
                });

                if (deletePromises.length > 0) {
                    await Promise.all(deletePromises);
                    console.log(`Cleaned up ${deletePromises.length} old notifications.`);
                }
            } catch (error) {
                console.error("Error during old updates cleanup:", error);
            }
        };

        // Run cleanup on mount, but only once in Strict Mode
        if (!hasRunCleanup.current) {
            cleanupOldUpdates();
            hasRunCleanup.current = true;
        }

        const q = query(collection(db, "updates"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                setUpdates(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
                setLoading(false);
            },
            (error) => {
                console.error("Error fetching updates:", error);
                setLoading(false);
            }
        );

        return () => unsubscribe();
    }, []);

    const handleSaveUpdate = async (e) => {
        e.preventDefault();
        if (!newUpdate.title.trim()) {
            alert("Please provide an update title.");
            return;
        }

        try {
            setIsSubmitting(true);
            if (editingId) {
                // Update existing
                await updateDoc(doc(db, "updates", editingId), {
                    ...newUpdate,
                    updatedAt: serverTimestamp(),
                });
                setEditingId(null);
            } else {
                // Create new
                await addDoc(collection(db, "updates"), {
                    ...newUpdate,
                    createdAt: serverTimestamp(),
                });
            }

            setNewUpdate({
                title: "",
                description: "",
                type: "notification",
                targetUniversity: "All",
                targetStream: "All",
                targetSemester: "All",
                targetSection: "All"
            });
        } catch (error) {
            console.error("Error saving update:", error);
            alert("Failed to save update.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (update) => {
        setEditingId(update.id);
        setNewUpdate({
            title: update.title,
            description: update.description || "",
            type: update.type,
            targetUniversity: update.targetUniversity || "All",
            targetStream: update.targetStream || "All",
            targetSemester: update.targetSemester || "All",
            targetSection: update.targetSection || "All"
        });
        // Scroll to top of form
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setNewUpdate({
            title: "",
            description: "",
            type: "notification",
            targetUniversity: "All",
            targetStream: "All",
            targetSemester: "All",
            targetSection: "All"
        });
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this update?")) return;
        try {
            await deleteDoc(doc(db, "updates", id));
        } catch (error) {
            console.error("Error deleting update:", error);
            alert("Failed to delete update.");
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1 tracking-tight">
                        Dashboard Updates
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                        Manage notifications and statements shown to students.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Create Update Form */}
                <div className="lg:col-span-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm h-fit">
                    <div className="flex items-center gap-3 mb-6">
                        <div className={`w-10 h-10 ${editingId ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'} rounded-xl flex items-center justify-center transition-colors`}>
                            {editingId ? <Edit2 size={20} /> : <PlusCircle size={20} />}
                        </div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-lg">
                            {editingId ? "Edit Update" : "New Update"}
                        </h3>
                    </div>

                    <form onSubmit={handleSaveUpdate} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                                    Update Type
                                </label>
                                <select
                                    value={newUpdate.type}
                                    onChange={(e) => setNewUpdate({ ...newUpdate, type: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 dark:text-slate-200"
                                >
                                    <option value="notification">Notification</option>
                                    <option value="statement">Statement</option>
                                    <option value="alert">Alert</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                                    Semester
                                </label>
                                <select
                                    value={newUpdate.targetSemester}
                                    onChange={(e) => setNewUpdate({ ...newUpdate, targetSemester: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 dark:text-slate-200 font-bold"
                                >
                                    <option value="All">All Semesters</option>
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n.toString()}>Sem {n}</option>)}
                                </select>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                                    Target College
                                </label>
                                <select
                                    value={newUpdate.targetUniversity}
                                    onChange={(e) => setNewUpdate({ ...newUpdate, targetUniversity: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 dark:text-slate-200 font-bold"
                                >
                                    <option value="All">All Colleges</option>
                                    <option value="SVU">SVU</option>
                                    <option value="Regent">Regent</option>
                                    <option value="Others">Others</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                                    Target Stream
                                </label>
                                <select
                                    value={newUpdate.targetStream}
                                    onChange={(e) => setNewUpdate({ ...newUpdate, targetStream: e.target.value })}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 dark:text-slate-200 font-bold"
                                >
                                    <option value="All">All Streams</option>
                                    <option value="B.Tech">B.Tech</option>
                                    <option value="BCA">BCA</option>
                                    <option value="ANCS">ANCS</option>
                                    <option value="DIPLOMA">DIPLOMA</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                                Target Section
                            </label>
                            <select
                                value={newUpdate.targetSection || "All"}
                                onChange={(e) => setNewUpdate({ ...newUpdate, targetSection: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 dark:text-slate-200 font-bold"
                            >
                                <option value="All">All Sections (1, 2, 3, 4)</option>
                                <option value="1">Section 1 (A)</option>
                                <option value="2">Section 2 (B)</option>
                                <option value="3">Section 3 (C)</option>
                                <option value="4">Section 4 (D)</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                                Title Context
                            </label>
                            <input
                                type="text"
                                placeholder="Ex: Exam Rescheduled"
                                required
                                value={newUpdate.title}
                                onChange={(e) => setNewUpdate({ ...newUpdate, title: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 dark:text-slate-200"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                                Detailed Description (Optional)
                            </label>
                            <textarea
                                placeholder="Additional details here..."
                                rows="3"
                                value={newUpdate.description}
                                onChange={(e) => setNewUpdate({ ...newUpdate, description: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none custom-scrollbar text-slate-700 dark:text-slate-200"
                            />
                        </div>

                        <div className="flex gap-3">
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold transition-all active:scale-95"
                                >
                                    <X size={18} />
                                    Cancel
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`${editingId ? 'flex-[2]' : 'w-full'} flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-70`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader inline size="sm" />
                                        {editingId ? "Saving..." : "Publishing..."}
                                    </>
                                ) : (
                                    <>
                                        {editingId ? <Edit2 size={18} /> : <Bell size={18} />}
                                        {editingId ? "Save Changes" : "Publish Update"}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Existing Updates List */}
                <div className="lg:col-span-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-3xl overflow-hidden shadow-sm flex flex-col">
                    <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                        <h3 className="font-bold text-slate-800 dark:text-white">Active Updates</h3>
                    </div>

                    <div className="p-6 flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30 dark:bg-slate-900/20">
                        {loading ? (
                            <div className="flex justify-center items-center h-40">
                                <Loader inline size="md" />
                            </div>
                        ) : updates.length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-center py-20">
                                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400">
                                    <Bell size={32} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-300 mb-2">No Active Updates</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                                    Updates you publish here will be visible to all students on their dashboard.
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {updates.map((update) => (
                                    <div
                                        key={update.id}
                                        onClick={() => handleEdit(update)}
                                        className={`group flex items-start justify-between gap-4 p-5 bg-white dark:bg-slate-800 border ${editingId === update.id ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md transform scale-[1.01]' : 'border-slate-200 dark:border-slate-700'} rounded-2xl hover:border-indigo-300 dark:hover:border-indigo-600/50 transition-all hover:shadow-md cursor-pointer relative overflow-hidden`}
                                    >
                                        {/* Edit Badge for active editing */}
                                        {editingId === update.id && (
                                            <div className="absolute top-0 right-0 bg-indigo-500 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl shadow-sm animate-in slide-in-from-top-2">
                                                EDITING
                                            </div>
                                        )}
                                        <div className="flex items-start gap-4">
                                            {/* Icon Indicator based on type */}
                                            <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 relative ${update.type === 'alert' ? 'bg-rose-500' :
                                                update.type === 'statement' ? 'bg-amber-500' :
                                                    'bg-indigo-500'
                                                }`}>
                                                <div className={`absolute inset-0 rounded-full animate-ping opacity-75 ${update.type === 'alert' ? 'bg-rose-500' :
                                                    update.type === 'statement' ? 'bg-amber-500' :
                                                        'bg-indigo-500'
                                                    }`}></div>
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${update.type === 'alert' ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400' :
                                                        update.type === 'statement' ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' :
                                                            'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400'
                                                        }`}>
                                                        {update.type}
                                                    </span>
                                                    {/* Format Timestamp logic */}
                                                    <span className="text-[11px] font-medium text-slate-400">
                                                        {update.createdAt ? new Date(update.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                                                    </span>
                                                </div>
                                                <h4 className="font-bold text-slate-800 dark:text-white text-[15px] mb-1.5 leading-tight">
                                                    {update.title}
                                                </h4>

                                                {/* Target Audience Display */}
                                                <div className="flex flex-wrap items-center gap-2 mb-3">
                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-md text-[10px] font-black uppercase tracking-tight text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600">
                                                        <BookOpen size={10} />
                                                        {update.targetUniversity === 'All' ? 'All Colleges' : update.targetUniversity}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-md text-[10px] font-black uppercase tracking-tight text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600">
                                                        <GraduationCap size={10} />
                                                        {update.targetStream === 'All' ? 'All Streams' : update.targetStream}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-md text-[10px] font-black uppercase tracking-tight text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600">
                                                        <CalendarDays size={10} />
                                                        {update.targetSemester === 'All' ? 'All Semesters' : `Sem ${update.targetSemester}`}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-md text-[10px] font-black uppercase tracking-tight text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600">
                                                        <Users size={10} />
                                                        {update.targetSection === 'All' || !update.targetSection ? 'All Sections' : `Sec ${update.targetSection}`}
                                                    </div>
                                                </div>

                                                {update.description && (
                                                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed max-w-2xl">
                                                        {update.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(update.id);
                                            }}
                                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all opacity-0 group-hover:opacity-100 flex-shrink-0 border border-transparent hover:border-rose-100 dark:hover:border-rose-900/30 z-10"
                                            title="Delete Update"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminUpdates;
