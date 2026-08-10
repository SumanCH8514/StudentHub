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
    deleteDoc
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
    Sparkles,
    Search,
    Check,
    Trash2,
    History,
    RotateCcw
} from "lucide-react";
import { clsx } from "clsx";
import Loader from "../Loader.jsx";
import { twMerge } from "tailwind-merge";
import { useAcademicConfig } from "../../utils/academicConfig";

const cn = (...inputs) => {
    return twMerge(clsx(inputs));
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://api.backend.studenthub.sumanonline.com";


const AdminRoutineUploader = () => {
    const { config: academicConfig } = useAcademicConfig();
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState("idle");
    const [error, setError] = useState("");
    const [previewData, setPreviewData] = useState(null);
    const [existingRoutines, setExistingRoutines] = useState([]);
    const [loadingExisting, setLoadingExisting] = useState(false);

    const [selection, setSelection] = useState({
        university: "SVU",
        stream: "B.Tech",
        semester: "1",
        section: "1"
    });

    const activeStreamObj = academicConfig.streams.find(
        (st) => st.name.toLowerCase() === selection.stream.toLowerCase() || st.id === selection.stream.toLowerCase()
    ) || academicConfig.streams[0] || { semestersCount: 8, sectionsPerSemester: {} };

    const maxSemesters = activeStreamObj.semestersCount || 8;
    const maxSections = activeStreamObj.sectionsPerSemester?.[selection.semester] || 4;

    const availableSemesters = Array.from({ length: maxSemesters }, (_, i) => (i + 1).toString());
    const availableSections = Array.from({ length: maxSections }, (_, i) => (i + 1).toString());

    const [file, setFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
        setLoadingExisting(true);
        const q = query(
            collection(db, "shared_routines"),
            where("university", "==", selection.university),
            where("stream", "==", selection.stream)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const routines = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(item => {
                    const itemSem = String(item.semester || "").replace(/sem\s*/i, "").trim();
                    const targetSem = String(selection.semester || "").replace(/sem\s*/i, "").trim();
                    const itemSec = String(item.section || "").replace(/sec\s*/i, "").trim();
                    const targetSec = String(selection.section || "").replace(/sec\s*/i, "").trim();
                    
                    const semMatch = !itemSem || !targetSem || itemSem === targetSem;
                    const secMatch = !itemSec || !targetSec || itemSec === targetSec;
                    return semMatch && secMatch;
                });
            setExistingRoutines(routines);
            setLoadingExisting(false);
        }, (err) => {
            console.error("Failed to fetch existing routines:", err);
            setLoadingExisting(false);
        });

        return () => unsubscribe();
    }, [selection]);

    const processSelectedFile = (selectedFile) => {
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

    useEffect(() => {
        const handlePaste = (e) => {
            const items = e.clipboardData?.items;
            if (!items) return;
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                if (item.type.startsWith("image/") || item.type === "application/pdf") {
                    const pastedFile = item.getAsFile();
                    if (pastedFile) {
                        e.preventDefault();
                        processSelectedFile(pastedFile);
                        break;
                    }
                }
            }
        };

        window.addEventListener("paste", handlePaste);
        return () => window.removeEventListener("paste", handlePaste);
    }, []);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            processSelectedFile(e.target.files[0]);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processSelectedFile(e.dataTransfer.files[0]);
        }
    };

    const handleUploadAndParse = async () => {
        if (!file) return;
        setLoading(true);
        setStatus("processing");
        setError("");

        try {
            // Convert file to base64
            const base64Data = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result.split(",")[1]);
                reader.readAsDataURL(file);
            });

            const res = await fetch(`${BACKEND_URL}/api/parse-routine`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    imageBase64: base64Data,
                    mimeType: file.type,
                    section: selection.section,
                    stream: selection.stream,
                    semester: selection.semester
                })
            });

            const data = await res.json();

            if (res.ok && data.success && Array.isArray(data.routine)) {
                setPreviewData(data.routine);
                setStatus("preview");
            } else {
                throw new Error(data.error || "Failed to parse routine using Cloudflare backend.");
            }
        } catch (err) {
            console.error("Routine parsing failed:", err);
            let rawMsg = err.message || "";
            let errorMsg = "Failed to parse routine. Please contact administrator for further assistance.";
            if (rawMsg.includes("429") || rawMsg.toLowerCase().includes("quota")) {
                errorMsg = "Gemini Quota Exceeded (429). Please contact administrator for further assistance.";
            } else if (rawMsg.includes("403") || rawMsg.toLowerCase().includes("suspended")) {
                errorMsg = "Gemini Access Denied (403). Please contact administrator for further assistance.";
            } else if (rawMsg) {
                errorMsg = `${rawMsg.split(":")[0]}. Please contact administrator for further assistance.`;
            }
            setError(errorMsg);
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

            const promises = previewData.map(item =>
                addDoc(collection(db, "shared_routines"), {
                    ...item,
                    ...selection,
                    userId: adminUser?.uid || "admin",
                    userEmail: adminUser?.email || "admin@studenthub.com",
                    isAdminPublished: true,
                    publishedBy: adminUser?.displayName || "Administrator",
                    createdAt: serverTimestamp(),
                    isPublic: true,
                    type: 'shared'
                })
            );

            await Promise.all(promises);

            setStatus("success");
            setPreviewData(null);
            setFile(null);
            setImagePreview(null);
            alert("Routine published successfully for students!");
        } catch (err) {
            console.error("Save failed:", err);
            setError("Failed to save routine to database.");
            setStatus("error");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteExisting = async (id) => {
        if (!window.confirm("Are you sure you want to delete this routine entry?")) return;
        try {
            await deleteDoc(doc(db, "shared_routines", id));
        } catch (err) {
            alert("Failed to delete routine entry: " + err.message);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1 tracking-tight">
                        Class Routine Manager
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                        Publish global routines targeted by University, Stream, and Section.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Target Selection & Upload */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
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
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-11 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 dark:text-slate-200 appearance-none cursor-pointer"
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
                                        onChange={(e) => setSelection({ ...selection, stream: e.target.value, semester: "1", section: "1" })}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-11 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 dark:text-slate-200 appearance-none cursor-pointer"
                                    >
                                        {academicConfig.streams.map((st) => (
                                            <option key={st.id} value={st.name}>
                                                {st.name}
                                            </option>
                                        ))}
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
                                            onChange={(e) => setSelection({ ...selection, semester: e.target.value, section: "1" })}
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-11 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 dark:text-slate-200 appearance-none cursor-pointer"
                                        >
                                            {availableSemesters.map(n => <option key={n} value={n}>Sem {n}</option>)}
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
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3 pl-11 pr-4 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-700 dark:text-slate-200 appearance-none cursor-pointer"
                                        >
                                            {availableSections.map(n => <option key={n} value={n}>Sec {n}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-[2rem] p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-11 h-11 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl flex items-center justify-center text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 shadow-sm shrink-0">
                                <Upload size={22} />
                            </div>
                            <div>
                                <h3 className="font-extrabold text-slate-900 dark:text-white text-lg tracking-tight">Upload Routine Image</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Select clear class timetable image for AI extraction.</p>
                            </div>
                        </div>

                        <div className="space-y-5">
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => document.getElementById('routine-upload').click()}
                                className={cn(
                                    "border-2 border-dashed rounded-[1.75rem] p-6 flex flex-col items-center justify-center transition-all cursor-pointer relative overflow-hidden group",
                                    isDragging
                                        ? "border-emerald-500 bg-emerald-100/60 dark:bg-emerald-950/60 ring-4 ring-emerald-500/20 scale-[1.02]"
                                        : file 
                                            ? "border-emerald-400/80 bg-emerald-50/30 dark:bg-emerald-950/20" 
                                            : "border-slate-200 dark:border-slate-700 hover:border-emerald-400 hover:bg-emerald-50/20 dark:hover:bg-slate-900/40"
                                )}
                            >
                                <input
                                    type="file"
                                    id="routine-upload"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleFileChange}
                                />

                                {imagePreview ? (
                                    <div className="relative group/img w-full flex items-center justify-center">
                                        <img src={imagePreview} alt="Preview" className="max-h-56 sm:max-h-64 object-contain rounded-2xl shadow-lg border border-white dark:border-slate-700" />
                                    </div>
                                ) : (
                                    <>
                                        <div className={cn(
                                            "w-14 h-14 rounded-2xl flex items-center justify-center mb-3 transition-all shadow-sm",
                                            isDragging 
                                                ? "bg-emerald-500 text-white scale-110 animate-bounce" 
                                                : "bg-emerald-50 dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 group-hover:scale-110"
                                        )}>
                                            <Upload size={28} />
                                        </div>
                                        <p className="text-sm font-extrabold text-slate-700 dark:text-slate-200 text-center">
                                            {isDragging ? "Drop your image file here!" : "Drag & Drop, Paste (Ctrl+V) or Click to upload"}
                                        </p>
                                        <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-widest font-black">PNG, JPG up to 5MB</p>
                                    </>
                                )}
                            </div>

                            {!previewData ? (
                                <button
                                    disabled={!file || loading}
                                    onClick={handleUploadAndParse}
                                    className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-black text-sm transition-all shadow-lg shadow-blue-500/25 active:scale-95 disabled:opacity-50 disabled:grayscale"
                                >
                                    {loading ? (
                                        <Loader inline size="sm" />
                                    ) : (
                                        <Sparkles size={18} className="text-blue-200" />
                                    )}
                                    <span>{loading ? "AI Vision Scanning..." : "Scan Schedule with AI"}</span>
                                </button>
                            ) : (
                                <div className="flex items-center gap-3 w-full pt-1">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFile(null);
                                            setPreviewData(null);
                                            setImagePreview(null);
                                            setStatus("idle");
                                        }}
                                        className="flex-1 h-12 px-4 bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-2xl font-bold text-xs sm:text-sm transition-all active:scale-95 border border-slate-200/80 dark:border-slate-600/80 flex items-center justify-center gap-1.5 whitespace-nowrap shadow-sm"
                                    >
                                        <RotateCcw size={15} />
                                        <span>Reset</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSaveToDb}
                                        disabled={loading}
                                        className="flex-[2] h-12 px-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-black text-xs sm:text-sm tracking-wide transition-all shadow-lg shadow-emerald-600/25 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
                                    >
                                        {loading ? <Loader inline size="sm" /> : <Check size={18} />}
                                        <span>Publish Routine</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: AI Extraction & Existing Preview */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col max-h-[800px]">
                        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between shrink-0">
                            <div className="flex items-center gap-3">
                                <History size={18} className="text-indigo-500" />
                                <h3 className="font-bold text-slate-800 dark:text-white">Review & Preview</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                {loadingExisting && <Loader inline size="xs" />}
                                <span className="text-[10px] bg-slate-100 dark:bg-slate-900 text-slate-500 px-3 py-1 rounded-full font-black uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                                    {existingRoutines.length} Existing
                                </span>
                                {status === "preview" && (
                                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full font-black uppercase tracking-widest flex items-center gap-1.5 border border-emerald-200 dark:border-emerald-800/50 animate-pulse">
                                        <Sparkles size={12} /> AI Ready
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 bg-slate-50/30 dark:bg-slate-900/10">

                            {/* Section 1: Existing Routines in DB */}
                            <div className="space-y-4">
                                <div className="flex items-center gap-2 px-1">
                                    <History size={14} className="text-slate-400" />
                                    <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">Live in Database</h4>
                                </div>

                                {existingRoutines.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-3">
                                        {existingRoutines.map((routine) => (
                                            <div key={routine.id} className="group relative flex items-center justify-between p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-sm hover:border-blue-300 dark:hover:border-blue-900 transition-all">
                                                <div className="grid grid-cols-4 gap-4 flex-1 items-center">
                                                    <div className="text-sm font-bold text-slate-800 dark:text-white truncate">{routine.day}</div>
                                                    <div className="text-sm font-medium text-slate-600 dark:text-slate-300 truncate">{routine.subject}</div>
                                                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">{routine.teacher || "N/A"}</div>
                                                    <div className="text-xs font-black text-blue-600 dark:text-blue-400 truncate bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1.5 rounded-lg text-center w-fit border border-blue-100 dark:border-blue-900/50">{routine.time}</div>
                                                </div>
                                                <button
                                                    onClick={() => handleDeleteExisting(routine.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all ml-2"
                                                    title="Delete Entry"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="py-6 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No routines published for this group</p>
                                    </div>
                                )}
                            </div>

                            {/* Section 2: AI Extraction Preview */}
                            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                                <div className="flex items-center gap-2 px-1">
                                    <Sparkles size={14} className="text-amber-500" />
                                    <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-400">AI Extraction Result</h4>
                                </div>

                                {status === "idle" && !previewData && (
                                    <div className="py-12 flex flex-col items-center justify-center text-center">
                                        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-4 text-slate-300 border border-slate-100 dark:border-slate-700 shadow-sm">
                                            <FileText size={32} />
                                        </div>
                                        <h4 className="text-slate-400 font-bold">Waiting for Scan</h4>
                                        <p className="text-slate-500 text-sm max-w-[240px] mt-1">Ready to parse your routine image.</p>
                                    </div>
                                )}

                                {status === "processing" && (
                                    <div className="py-12 flex flex-col items-center justify-center text-center">
                                        <div className="relative">
                                            <Loader size="lg" message="AI is parsing..." />
                                        </div>
                                        <p className="text-slate-600 dark:text-slate-300 font-bold mt-6 tracking-tight">Gemini is parsing...</p>
                                    </div>
                                )}

                                {status === "error" && (
                                    <div className="py-12 flex flex-col items-center justify-center text-center">
                                        <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-3xl flex items-center justify-center mb-4 text-rose-500">
                                            <AlertCircle size={32} />
                                        </div>
                                        <h4 className="text-rose-600 font-bold">Extraction Error</h4>
                                        <p className="text-slate-500 text-sm mt-1">{error}</p>
                                    </div>
                                )}

                                {status === "preview" && previewData && (
                                    <div className="space-y-3">
                                        {previewData.map((item, idx) => (
                                            <div
                                                key={idx}
                                                className="grid grid-cols-4 gap-4 p-4 bg-white dark:bg-slate-800 border-2 border-emerald-100 dark:border-emerald-900/30 rounded-2xl shadow-sm hover:border-emerald-300 transition-all animate-in fade-in slide-in-from-top-2 duration-300"
                                                style={{ animationDelay: `${idx * 50}ms` }}
                                            >
                                                <div className="text-sm font-bold text-slate-800 dark:text-white truncate">{item.day}</div>
                                                <div className="text-sm font-medium text-slate-600 dark:text-slate-300 truncate">{item.subject}</div>
                                                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">{item.teacher || "N/A"}</div>
                                                <div className="text-xs font-black text-emerald-600 dark:text-emerald-400 truncate bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1.5 rounded-lg text-center w-fit border border-emerald-100 dark:border-emerald-900/50">{item.time}</div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {status === "success" && (
                                    <div className="py-12 flex flex-col items-center justify-center text-center animate-in zoom-in duration-500">
                                        <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mb-6 shadow-sm ring-4 ring-white dark:ring-slate-800">
                                            <CheckCircle2 size={40} className="text-emerald-500" />
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-800 dark:text-white mb-2">Publish Successful!</h3>
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

export default AdminRoutineUploader;
