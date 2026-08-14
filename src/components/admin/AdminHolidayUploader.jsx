import React, { useState } from "react";
import { collection, doc, writeBatch, getDoc, getDocs } from "firebase/firestore";
import { db, auth } from "../../firebaseConfig";
import { v4 as uuidv4 } from "uuid";
import { UploadCloud, FileImage, FileText, X, AlertCircle, CheckCircle2, CalendarDays } from "lucide-react";
import Loader from "../Loader.jsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://api.backend.studenthub.sumanonline.com";


const AdminHolidayUploader = ({ onSuccess }) => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [parsedHolidays, setParsedHolidays] = useState([]);

    const handleUploadAndParse = async () => {
        if (!file || !auth.currentUser) return setError("Authentication required.");

        setLoading(true);
        setError("");
        setSuccess(false);
        setParsedHolidays([]);

        try {
            const base64Data = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result.split(",")[1]);
                reader.readAsDataURL(file);
            });

            const res = await fetch(`${BACKEND_URL}/api/parse-holiday`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    imageBase64: base64Data,
                    mimeType: file.type
                })
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.error || "Failed to parse holiday list.");
            }

            const holidays = data.holidays;

            if (Array.isArray(holidays)) {
                const batch = writeBatch(db);
                const holidaysRef = collection(db, "holidays");

                const existingDocs = await getDocs(holidaysRef);
                existingDocs.forEach((d) => batch.delete(d.ref));

                for (const item of holidays) {
                    const occasion = item.occasion || item.title || item.name || item.description || "";
                    const date = item.date || item.startDate || "";
                    if (!date || !occasion) continue;

                    const holidayDocRef = doc(holidaysRef, uuidv4());
                    batch.set(holidayDocRef, {
                        ...item,
                        occasion,
                        title: occasion,
                        date,
                        uploadedBy: auth.currentUser?.uid || "admin",
                        createdAt: new Date().toISOString(),
                    });
                }
                await batch.commit();

                const sortedHolidays = [...holidays]
                    .map(item => ({
                        ...item,
                        occasion: item.occasion || item.title || item.name || item.description || "",
                        date: item.date || item.startDate || ""
                    }))
                    .filter(item => item.date && item.occasion)
                    .sort((a, b) => new Date(a.date) - new Date(b.date));

                setParsedHolidays(sortedHolidays);
                setSuccess(true);
                if (onSuccess) onSuccess();
            } else {
                throw new Error("AI did not return a valid list format.");
            }
        } catch (e) {
            console.error("Upload error details:", e);
            let errorMsg = "Failed to parse and save the holiday list.";
            if (e.message?.includes("400")) {
                errorMsg = "AI could not process this image/pdf. Ensure it is clear.";
            } else if (e.message) {
                errorMsg = e.message;
            }
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            {!file ? (
                <label className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-3xl p-10 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all group mb-6">
                    <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-2xl mb-4 group-hover:scale-110 transition-transform duration-300">
                        <UploadCloud size={32} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <span className="font-bold text-slate-700 dark:text-slate-300 text-lg text-center">
                        Click to browse files
                    </span>
                    <span className="text-slate-400 dark:text-slate-500 font-medium mt-1 text-center text-sm">
                        Supports JPG, PNG, WEBP, PDF
                    </span>
                    <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={(e) => setFile(e.target.files[0])}
                        className="hidden"
                    />
                </label>
            ) : (
                <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4 overflow-hidden">
                        <div className="bg-white dark:bg-slate-700 p-3 rounded-xl shadow-sm shrink-0">
                            {file.type === "application/pdf" ? (
                                <FileText size={24} className="text-rose-500" />
                            ) : (
                                <FileImage size={24} className="text-indigo-600 dark:text-indigo-400" />
                            )}
                        </div>
                        <div className="flex flex-col overflow-hidden min-w-0">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 text-[15px] truncate">
                                {file.name}
                            </span>
                            <span className="text-slate-500 dark:text-slate-400 text-xs font-medium">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                            </span>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            setFile(null);
                            setSuccess(false);
                            setError("");
                        }}
                        className="p-2.5 bg-white dark:bg-slate-700 rounded-full text-slate-400 hover:text-rose-500 transition-all shadow-sm shrink-0"
                        title="Remove file"
                    >
                        <X size={18} />
                    </button>
                </div>
            )}

            {error && (
                <div className="flex items-center gap-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 p-4 rounded-xl mb-6 border border-rose-100 dark:border-rose-800/30">
                    <AlertCircle size={20} className="shrink-0" />
                    <p className="text-sm font-semibold">{error}</p>
                </div>
            )}

            {success && (
                <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl mb-6 border border-emerald-100 dark:border-emerald-800/30">
                    <CheckCircle2 size={20} className="shrink-0" />
                    <p className="text-sm font-semibold">Holiday list processed and saved successfully!</p>
                </div>
            )}

            <button
                onClick={handleUploadAndParse}
                disabled={loading || !file}
                className={cn(
                    "w-full font-bold text-[15px] py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 md:w-auto md:px-8 mx-auto",
                    loading || !file
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700"
                        : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-600/20 active:scale-95"
                )}
            >
                {loading ? (
                    <>
                        <Loader inline size="sm" />
                        <span>AI Processing...</span>
                    </>
                ) : (
                    <span>Upload & Parse via AI</span>
                )}
            </button>

            {/* Parsed Holidays Preview */}
            {success && parsedHolidays.length > 0 && (
                <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                        <CalendarDays className="text-indigo-500" size={20} />
                        Successfully Synced Holidays
                    </h3>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {parsedHolidays.map((h, i) => {
                            const dateObj = new Date(h.date);
                            const dayName = dateObj.toLocaleDateString("en-US", { weekday: "short" });
                            const monthName = dateObj.toLocaleDateString("en-US", { month: "short" });
                            const dateNum = dateObj.getDate();

                            return (
                                <div key={i} className="flex items-center gap-4 p-4 rounded-xl border bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 shadow-sm">
                                    <div className="w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 border bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-800/30 text-indigo-600 dark:text-indigo-400">
                                        <span className="text-[10px] font-bold uppercase tracking-widest">{monthName}</span>
                                        <span className="text-lg font-black leading-none">{dateNum}</span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h4 className="font-bold text-[15px] truncate text-slate-800 dark:text-slate-200">
                                            {h.occasion}
                                        </h4>
                                        <p className="text-slate-500 dark:text-slate-500 text-[12px] font-medium mt-0.5">
                                            {dayName}, {dateObj.getFullYear()}
                                        </p>
                                    </div>
                                    <div className="shrink-0 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 px-2.5 py-1 rounded-md text-xs font-bold border border-emerald-100 dark:border-emerald-800/30">
                                        Synced
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminHolidayUploader;
