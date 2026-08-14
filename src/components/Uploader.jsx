import React, { useState, useEffect } from "react";
import { collection, doc, setDoc, getDoc, writeBatch } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { v4 as uuidv4 } from "uuid";
import { UploadCloud, FileImage, FileText, X, AlertCircle, Sparkles, CheckCircle2 } from "lucide-react";
import Loader from "./Loader.jsx";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://api.backend.studenthub.sumanonline.com";

const Uploader = ({ onUploadSuccess, hideHeader = false }) => {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);

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
      setImage(e.dataTransfer.files[0]);
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
            setImage(pastedFile);
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  const handleUploadAndParse = async () => {
    if (!image || !auth.currentUser)
      return setError("Authentication required. Please log in.");

    setLoading(true);
    setError("");

    try {
      const base64Data = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.readAsDataURL(image);
      });

      const userProfileDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (!userProfileDoc.exists()) {
        throw new Error("Please update your profile in Settings before syncing routines.");
      }
      const profileData = userProfileDoc.data();
      const { university, stream, semester, section } = profileData;

      if (!university || !stream || !semester || !section) {
        throw new Error("Incomplete profile. Please update University, Stream, Semester, and Section in Settings.");
      }

      const res = await fetch(`${BACKEND_URL}/api/parse-routine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: image.type,
          section,
          stream,
          semester
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to parse routine using backend worker.");
      }

      let schedule = data.routine;

      if (schedule && !Array.isArray(schedule) && typeof schedule === "object") {
        const firstArray = Object.values(schedule).find(val => Array.isArray(val));
        if (firstArray) {
          schedule = firstArray;
        } else if (schedule.schedule || schedule.classes || schedule.routine) {
          schedule = schedule.schedule || schedule.classes || schedule.routine;
        }
      }

      if (!schedule || !Array.isArray(schedule) || schedule.length === 0) {
        throw new Error("AI could not detect valid class schedule entries. Ensure image is clear.");
      }

      const targetPath = `routines/${university}/${stream}/${semester}/${section}/classes`;
      const targetColRef = collection(db, targetPath);

      const batch = writeBatch(db);

      schedule.forEach((cls) => {
        if (!cls.day || !cls.subject) return;

        const cleanClass = {
          day: cls.day,
          subject: cls.subject,
          room: cls.room || "TBA",
          teacher: cls.teacher || cls.faculty || "TBA",
          startTime: cls.startTime || cls.time?.split("-")[0]?.trim() || "09:00 AM",
          endTime: cls.endTime || cls.time?.split("-")[1]?.trim() || "10:00 AM",
          type: cls.type || (cls.subject?.toLowerCase().includes("lab") ? "Lab" : "Lecture"),
          syncedAt: new Date().toISOString(),
          uploadedBy: auth.currentUser.uid,
          university,
          stream,
          semester,
          section
        };

        const docRef = doc(targetColRef, uuidv4());
        batch.set(docRef, cleanClass);
      });

      await batch.commit();

      if (onUploadSuccess) onUploadSuccess();
    } catch (err) {
      console.error(err);
      let errorMsg = "Something went wrong while parsing the image. Please try again.";
      const rawMsg = err.message || "";

      if (rawMsg.includes("400") || rawMsg.includes("Vision")) {
        errorMsg = "AI failed to parse text from image. Make sure image is clear and high resolution.";
      } else if (rawMsg.includes("Incomplete profile") || rawMsg.includes("Authentication required") || rawMsg.includes("Please update your profile")) {
        errorMsg = rawMsg;
      } else if (rawMsg) {
        errorMsg = `${rawMsg}. Please contact administrator for further assistance.`;
      }

      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`w-full relative transition-colors ${!hideHeader ? "p-5 sm:p-8 bg-white dark:bg-slate-900" : ""}`}>
      {!hideHeader && (
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center mb-3">
            <UploadCloud size={24} />
          </div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Upload Routine
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1">
            Upload your class schedule timetable to sync
          </p>
        </div>
      )}

      {!image ? (
        <label
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 group mb-5 ${
            isDragging
              ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30"
              : "border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800/60"
          }`}
        >
          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3.5 shadow-xs group-hover:scale-105 transition-transform">
            <UploadCloud size={28} />
          </div>
          <p className="font-bold text-slate-800 dark:text-slate-200 text-sm sm:text-base text-center">
            {isDragging ? "Drop your file here" : "Click to browse, drag & drop, or paste (Ctrl+V)"}
          </p>
          <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 text-center font-medium">
            Supports PNG, JPG, WEBP, or official PDF timetables
          </p>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setImage(e.target.files[0])}
            className="hidden"
          />
        </label>
      ) : (
        <div className="bg-indigo-50/60 dark:bg-slate-800/60 border border-indigo-100 dark:border-slate-700 rounded-[2rem] p-4 sm:p-5 flex items-center justify-between mb-6 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-center gap-3.5 overflow-hidden">
            <div className="bg-white dark:bg-slate-700 p-3.5 rounded-2xl shadow-md shrink-0">
              {image.type === "application/pdf" ? (
                <FileText size={26} className="text-rose-500" />
              ) : (
                <FileImage size={26} className="text-indigo-600 dark:text-indigo-400" />
              )}
            </div>
            <div className="flex flex-col overflow-hidden min-w-0">
              <span className="font-bold text-slate-800 dark:text-white text-base truncate">
                {image.name}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                  {(image.size / 1024 / 1024).toFixed(2)} MB
                </span>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <span className="text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <CheckCircle2 size={12} /> Ready to parse
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => setImage(null)}
            className="p-2.5 bg-white dark:bg-slate-700 rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all shadow-sm shrink-0 active:scale-90"
            title="Remove image"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 p-4 rounded-2xl mb-6 border border-rose-100 dark:border-rose-900/40 animate-in fade-in slide-in-from-bottom-2">
          <AlertCircle size={22} className="shrink-0" />
          <p className="text-xs sm:text-sm font-bold leading-tight">{error}</p>
        </div>
      )}

      <button
        onClick={handleUploadAndParse}
        disabled={loading || !image}
        className={`w-full font-black text-base sm:text-lg py-4 sm:py-4.5 rounded-2xl flex items-center justify-center gap-3 transition-all duration-300 ${loading || !image
          ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-200 dark:border-slate-700"
          : "bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white shadow-xl shadow-indigo-500/25 hover:shadow-2xl hover:shadow-indigo-500/40 hover:scale-[1.01] active:scale-[0.98]"
          }`}
      >
        {loading ? (
          <>
            <Loader inline size="sm" />
            <span>AI Scanning & Saving...</span>
          </>
        ) : (
          <span>
            {image ? "Scan & Sync Schedule" : "Select an image first"}
          </span>
        )}
      </button>
    </div>
  );
};

export default Uploader;
