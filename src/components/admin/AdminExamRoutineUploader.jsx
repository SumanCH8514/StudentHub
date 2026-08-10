import React, { useState, useEffect } from "react";
import {
    collection,
    addDoc,
    serverTimestamp,
    doc,
    getDoc,
    query,
    where,
    onSnapshot,
    deleteDoc,
    writeBatch,
    setDoc,
    updateDoc
} from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import {
    Upload,
    CheckCircle2,
    AlertCircle,
    FileText,
    GraduationCap,
    BookOpen,
    Users as UsersIcon,
    CalendarDays,
    CalendarRange,
    Sparkles,
    Search,
    Check,
    Trash2,
    History,
    Pencil,
    X
} from "lucide-react";
import { clsx } from "clsx";
import Loader from "../Loader.jsx";
import { twMerge } from "tailwind-merge";
import { useAcademicConfig } from "../../utils/academicConfig";

const cn = (...inputs) => {
    return twMerge(clsx(inputs));
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://api.backend.studenthub.sumanonline.com";


const AdminExamRoutineUploader = () => {
    const { config: academicConfig } = useAcademicConfig();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("idle"); // idle, processing, success, error, preview
    const [error, setError] = useState("");
    const [previewData, setPreviewData] = useState(null);
    const [existingRoutines, setExistingRoutines] = useState([]);
    const [loadingExisting, setLoadingExisting] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [editingData, setEditingData] = useState(null);

    const [selection, setSelection] = useState({
        university: "SVU",
        stream: "B.Tech",
        semester: "1",
        section: "1",
        examType: "Internal Exam"
    });

    const [file, setFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);

    // Fetch existing routines for the selection
    useEffect(() => {
        setLoadingExisting(true);
        const q = query(
            collection(db, "exam_routines"),
            where("university", "==", selection.university),
            where("stream", "==", selection.stream),
            where("semester", "==", selection.semester),
            where("section", "==", selection.section),
            where("examType", "==", selection.examType)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const routines = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setExistingRoutines(routines);
            setLoadingExisting(false);
        }, (err) => {
            console.error("Failed to fetch existing exam routines:", err);
            setLoadingExisting(false);
        });

        return () => unsubscribe();
    }, [selection]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            setFile(selectedFile);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(selectedFile);
            setPreviewData(null);
            setStatus("idle");
        }
    };

    const handleUploadAndParse = async () => {
        if (!file) return;
        setLoading(true);
        setStatus("processing");
        setError("");

        try {
            const base64Data = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result.split(",")[1]);
                reader.readAsDataURL(file);
            });

            const res = await fetch(`${BACKEND_URL}/api/parse-exam`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    imageBase64: base64Data,
                    mimeType: file.type
                })
            });

            const data = await res.json();

            if (res.ok && data.success && Array.isArray(data.exams)) {
                setPreviewData(data.exams);
                setStatus("preview");
            } else {
                throw new Error(data.error || "Failed to parse exam routine using Cloudflare backend.");
            }
        } catch (err) {
            console.error("Exam routine parsing failed:", err);
            setError(err.message || "Failed to parse exam routine. Please try a clearer image.");
            setStatus("error");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveToDb = async () => {
        if (!previewData || previewData.length === 0) return;
        setLoading(true);

        try {
            const adminUser = auth.currentUser;
            const batch = writeBatch(db);
            const routinesRef = collection(db, "exam_routines");

            previewData.forEach(item => {
                const newDocRef = doc(routinesRef);
                const docData = {
                    ...item,
                    ...selection,
                    userId: adminUser?.uid || "admin",
                    userEmail: adminUser?.email || "admin@studenthub.com",
                    publishedBy: adminUser?.displayName || "Administrator",
                    createdAt: new Date().toISOString(),
                };
                batch.set(newDocRef, docData);
            });

            await batch.commit();

            setStatus("success");
            setPreviewData(null);
            setFile(null);
            setImagePreview(null);
            alert("Exam routine published successfully!");
        } catch (err) {
            console.error("Save failed:", err);
            setError("Failed to save: " + (err.message || "Database error"));
            setStatus("error");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteExisting = async (id) => {
        if (!window.confirm("Are you sure you want to delete this exam entry?")) return;
        try {
            await deleteDoc(doc(db, "exam_routines", id));
        } catch (err) {
            alert("Failed to delete exam entry: " + err.message);
        }
    };

    const handleUpdateExisting = async (id) => {
        setLoading(true);
        try {
            await setDoc(doc(db, "exam_routines", id), {
                ...editingData,
                updatedAt: new Date().toISOString()
            }, { merge: true });
            setEditingId(null);
            setEditingData(null);
        } catch (err) {
            alert("Failed to update exam entry: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out space-y-6 px-4 sm:px-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-2">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1 tracking-tight flex items-center gap-2">
                        <CalendarRange className="text-indigo-500" />
                        Exam Routine Manager
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                        Publish exam schedules for students. AI scans and extracts dates automatically.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                <Search size={20} />
                            </div>
                            <h3 className="font-bold text-slate-800 dark:text-white text-lg">Target Audience</h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                                    University / College
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <BookOpen size={16} className="text-slate-400" />
                                    </div>
                                    <select
                                        value={selection.university}
                                        onChange={(e) => setSelection({ ...selection, university: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-11 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 dark:text-slate-200 appearance-none cursor-pointer"
                                    >
                                        {(academicConfig.universities || ["SVU", "Regent", "Others"]).map((uni) => (
                                            <option key={uni} value={uni}>
                                                {uni}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                                    Stream / Course
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <GraduationCap size={16} className="text-slate-400" />
                                    </div>
                                    <select
                                        value={selection.stream}
                                        onChange={(e) => setSelection({ ...selection, stream: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-11 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 dark:text-slate-200 appearance-none cursor-pointer"
                                    >
                                        <option value="B.Tech">B.Tech</option>
                                        <option value="BCA">BCA</option>
                                        <option value="ANCS">ANCS</option>
                                        <option value="DIPLOMA">DIPLOMA</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                                        Semester
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <CalendarDays size={16} className="text-slate-400" />
                                        </div>
                                        <select
                                            value={selection.semester}
                                            onChange={(e) => setSelection({ ...selection, semester: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-11 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 dark:text-slate-200 appearance-none cursor-pointer"
                                        >
                                            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n.toString()}>Sem {n}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                                        Section
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <UsersIcon size={16} className="text-slate-400" />
                                        </div>
                                        <select
                                            value={selection.section}
                                            onChange={(e) => setSelection({ ...selection, section: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-11 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 dark:text-slate-200 appearance-none cursor-pointer"
                                        >
                                            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => <option key={n} value={n.toString()}>Sec {n}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">
                                    Exam Type
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <FileText size={16} className="text-slate-400" />
                                    </div>
                                    <select
                                        value={selection.examType}
                                        onChange={(e) => setSelection({ ...selection, examType: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-11 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-700 dark:text-slate-200 appearance-none cursor-pointer"
                                    >
                                        <option value="Internal Exam">Internal Exam</option>
                                        <option value="EndTerm Exam">EndTerm Exam</option>
                                        <option value="Practical Exam">Practical Exam</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                <Upload size={20} />
                            </div>
                            <h3 className="font-bold text-slate-800 dark:text-white text-lg">Upload Exam Image</h3>
                        </div>

                        <div className="space-y-4">
                            <div
                                className={cn(
                                    "border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer relative overflow-hidden",
                                    file ? "border-emerald-300 bg-emerald-50/10" : "border-slate-200 dark:border-slate-700 hover:border-indigo-400 hover:bg-slate-50/50"
                                )}
                                onClick={() => document.getElementById('exam-upload').click()}
                            >
                                <input
                                    type="file"
                                    id="exam-upload"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />

                                {imagePreview ? (
                                    <img src={imagePreview} alt="Preview" className="max-h-48 rounded-xl shadow-md border border-white" />
                                ) : (
                                    <>
                                        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-900 rounded-2xl flex items-center justify-center mb-4 text-slate-400 group-hover:text-indigo-500 transition-colors">
                                            <Upload size={32} />
                                        </div>
                                        <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Click to upload exam routine</p>
                                        <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-black">PNG, JPG up to 5MB</p>
                                    </>
                                )}
                            </div>

                            {!previewData ? (
                                <button
                                    disabled={!file || loading}
                                    onClick={handleUploadAndParse}
                                    className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black transition-all shadow-lg shadow-indigo-500/20 active:scale-95 disabled:opacity-70 disabled:grayscale"
                                >
                                    {loading ? (
                                        <Loader inline size="sm" />
                                    ) : (
                                        <Sparkles size={20} className="text-indigo-200" />
                                    )}
                                    <span>{loading ? "AI is Scanning..." : "Scan with Gemini"}</span>
                                </button>
                            ) : (
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button
                                        onClick={() => {
                                            setFile(null);
                                            setPreviewData(null);
                                            setImagePreview(null);
                                            setStatus("idle");
                                        }}
                                        className="w-full sm:flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-bold hover:bg-slate-200 transition-all active:scale-95"
                                    >
                                        Reset
                                    </button>
                                    <button
                                        onClick={handleSaveToDb}
                                        disabled={loading}
                                        className="w-full sm:flex-[2] flex items-center justify-center gap-3 px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black transition-all shadow-lg shadow-emerald-500/20 active:scale-95 disabled:opacity-70"
                                    >
                                        {loading ? <Loader inline size="sm" /> : <Check size={20} />}
                                        <span>Publish Exam</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col max-h-[800px]">
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <History size={18} className="text-indigo-500" />
                                <h3 className="font-bold text-slate-800 dark:text-white">Review & Existing</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                {loadingExisting && <Loader inline size="sm" />}
                                <span className="text-[10px] bg-slate-100 dark:bg-slate-900 text-slate-500 px-3 py-1 rounded-full font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                                    {existingRoutines.length} Live
                                </span>
                                {status === "preview" && (
                                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full font-black uppercase tracking-widest flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800/50 animate-pulse">
                                        <Sparkles size={12} /> AI Preview
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 bg-slate-50/30 dark:bg-slate-900/10">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 px-1">
                                    <History size={14} className="text-slate-400" />
                                    <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Current Exam Schedule</h4>
                                </div>

                                {existingRoutines.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-3">
                                        {existingRoutines.map((routine) => (
                                            <div key={routine.id} className="group relative flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm hover:border-indigo-300 dark:hover:border-indigo-900 transition-all gap-4 mb-2 last:mb-0">
                                                {editingId === routine.id ? (
                                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4 flex-1 items-center">
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-bold text-slate-400 uppercase sm:hidden px-1">Date</label>
                                                            <input
                                                                type="text"
                                                                value={editingData.date}
                                                                onChange={(e) => setEditingData({ ...editingData, date: e.target.value })}
                                                                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 sm:py-1 sm:px-2 text-sm font-bold w-full"
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-bold text-slate-400 uppercase sm:hidden px-1">Subject</label>
                                                            <input
                                                                type="text"
                                                                value={editingData.subject}
                                                                onChange={(e) => setEditingData({ ...editingData, subject: e.target.value })}
                                                                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 sm:py-1 sm:px-2 text-sm font-medium w-full"
                                                            />
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-bold text-slate-400 uppercase sm:hidden px-1">Type</label>
                                                            <select
                                                                value={editingData.examType || ""}
                                                                onChange={(e) => setEditingData({ ...editingData, examType: e.target.value })}
                                                                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 sm:py-1 sm:px-2 text-[10px] font-black uppercase w-full appearance-none cursor-pointer"
                                                            >
                                                                <option value="Internal Exam">Internal Exam</option>
                                                                <option value="EndTerm Exam">EndTerm Exam</option>
                                                                <option value="Practical Exam">Practical Exam</option>
                                                            </select>
                                                        </div>
                                                        <div className="space-y-1">
                                                            <label className="text-[10px] font-bold text-slate-400 uppercase sm:hidden px-1">Time</label>
                                                            <input
                                                                type="text"
                                                                value={editingData.time}
                                                                onChange={(e) => setEditingData({ ...editingData, time: e.target.value })}
                                                                className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 sm:py-1 sm:px-2 text-xs font-black w-full"
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4 flex-1 items-start sm:items-center">
                                                        <div className="flex items-center gap-3 sm:block">
                                                            <div className="w-8 h-8 sm:hidden rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-500 shrink-0">
                                                                <CalendarDays size={14} />
                                                            </div>
                                                            <div className="text-sm font-bold text-slate-800 dark:text-white truncate">{routine.date}</div>
                                                        </div>
                                                        <div className="flex items-center gap-3 sm:block">
                                                            <div className="w-8 h-8 sm:hidden rounded-lg bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center text-slate-400 shrink-0">
                                                                <BookOpen size={14} />
                                                            </div>
                                                            <div className="text-sm font-medium text-slate-600 dark:text-slate-300 truncate">{routine.subject}</div>
                                                        </div>
                                                        <div className="flex items-center gap-3 sm:block">
                                                            <div className="w-8 h-8 sm:hidden rounded-lg bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center text-slate-400 shrink-0">
                                                                <FileText size={14} />
                                                            </div>
                                                            <div className="text-[10px] font-black text-slate-400 truncate bg-slate-50 dark:bg-slate-900/40 px-2.5 py-1.5 sm:px-2 sm:py-1 rounded-lg sm:rounded-md text-center w-fit uppercase border border-slate-100/50 dark:border-slate-800/50">
                                                                {routine.examType || "N/A"}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 sm:block">
                                                            <div className="w-8 h-8 sm:hidden rounded-lg bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-500 shrink-0">
                                                                <CalendarRange size={14} />
                                                            </div>
                                                            <div className="text-xs font-black text-indigo-600 dark:text-indigo-400 truncate bg-indigo-50 dark:bg-indigo-900/30 px-3 py-2 sm:px-2.5 sm:py-1.5 rounded-xl sm:rounded-lg text-center w-fit border border-indigo-100 dark:border-indigo-900/50">{routine.time}</div>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex items-center gap-1 ml-2">
                                                    {editingId === routine.id ? (
                                                        <>
                                                            <button
                                                                onClick={() => handleUpdateExisting(routine.id)}
                                                                className="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all"
                                                                title="Save Changes"
                                                                disabled={loading}
                                                            >
                                                                <Check size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => { setEditingId(null); setEditingData(null); }}
                                                                className="p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/20 rounded-xl transition-all"
                                                                title="Cancel"
                                                            >
                                                                <X size={16} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => { setEditingId(routine.id); setEditingData({ ...routine }); }}
                                                                className="opacity-0 group-hover:opacity-100 p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
                                                                title="Edit Entry"
                                                            >
                                                                <Pencil size={16} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteExisting(routine.id)}
                                                                className="opacity-0 group-hover:opacity-100 p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                                                                title="Delete Entry"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No exam routines found for this criteria</p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                                <div className="flex items-center gap-2 px-1">
                                    <Sparkles size={14} className="text-amber-500" />
                                    <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">AI Extraction Preview</h4>
                                </div>

                                {status === "idle" && !previewData && (
                                    <div className="py-12 flex flex-col items-center justify-center text-center">
                                        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-4 text-slate-300 border border-slate-100 dark:border-slate-700 shadow-sm">
                                            <CalendarRange size={32} />
                                        </div>
                                        <h4 className="text-slate-400 font-bold">Waiting for Scan</h4>
                                        <p className="text-slate-500 text-sm max-w-[240px] mt-1">AI will extract dates, subjects and times.</p>
                                    </div>
                                )}

                                {status === "processing" && (
                                    <div className="py-12 flex flex-col items-center justify-center text-center">
                                        <div className="relative">
                                            <Loader inline size="lg" fullScreen={false} />
                                        </div>
                                        <p className="text-slate-600 dark:text-slate-300 font-bold mt-6 tracking-tight">AI is parsing image...</p>
                                    </div>
                                )}

                                {status === "error" && (
                                    <div className="py-12 flex flex-col items-center justify-center text-center">
                                        <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center mb-4 text-rose-500">
                                            <AlertCircle size={32} />
                                        </div>
                                        <h4 className="text-rose-600 font-bold">Operation Failed</h4>
                                        <p className="text-slate-500 text-sm mt-1">{error}</p>
                                    </div>
                                )}

                                {status === "preview" && previewData && (
                                    <div className="space-y-3">
                                        {previewData.map((item, idx) => (
                                            <div
                                                key={idx}
                                                className="flex flex-col sm:grid sm:grid-cols-4 gap-3 sm:gap-4 p-4 bg-white dark:bg-slate-800 border-2 border-emerald-100 dark:border-emerald-900/30 rounded-2xl shadow-sm hover:border-emerald-300 transition-all animate-in fade-in slide-in-from-top-2 duration-300"
                                                style={{ animationDelay: `${idx * 50}ms` }}
                                            >
                                                <div className="flex items-center gap-3 sm:block">
                                                    <div className="w-8 h-8 sm:hidden rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-500 shrink-0">
                                                        <CalendarDays size={14} />
                                                    </div>
                                                    <div className="text-sm font-bold text-slate-800 dark:text-white truncate">{item.date}</div>
                                                </div>
                                                <div className="flex items-center gap-3 sm:block">
                                                    <div className="w-8 h-8 sm:hidden rounded-lg bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center text-slate-400 shrink-0">
                                                        <BookOpen size={14} />
                                                    </div>
                                                    <div className="text-sm font-medium text-slate-600 dark:text-slate-300 truncate">{item.subject}</div>
                                                </div>
                                                <div className="flex items-center gap-3 sm:block">
                                                    <div className="w-8 h-8 sm:hidden rounded-lg bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center text-slate-400 shrink-0">
                                                        <FileText size={14} />
                                                    </div>
                                                    <div className="text-[10px] font-black text-slate-400 truncate bg-slate-50 dark:bg-slate-900/40 px-2.5 py-1.5 sm:px-2 sm:py-1 rounded-lg sm:rounded-md text-center w-fit uppercase border border-slate-100/50 dark:border-slate-800/50">{selection.examType}</div>
                                                </div>
                                                <div className="flex items-center gap-3 sm:block">
                                                    <div className="w-8 h-8 sm:hidden rounded-lg bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-500 shrink-0">
                                                        <CalendarRange size={14} />
                                                    </div>
                                                    <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 truncate bg-emerald-50 dark:bg-emerald-900/30 px-3 py-2 sm:px-2.5 sm:py-1.5 rounded-xl sm:rounded-lg text-center w-fit border border-emerald-100 dark:border-emerald-900/50">{item.time}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {status === "success" && (
                                    <div className="py-12 flex flex-col items-center justify-center text-center animate-in zoom-in duration-500">
                                        <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-6 shadow-sm ring-4 ring-white dark:ring-slate-800">
                                            <CheckCircle2 size={40} className="text-emerald-500" />
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Exam Routine Published!</h3>
                                        <button
                                            onClick={() => setStatus("idle")}
                                            className="px-8 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-all shadow-sm"
                                        >
                                            Done
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminExamRoutineUploader;
