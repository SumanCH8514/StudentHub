import React, { useState } from "react";
import { collection, doc, setDoc, getDoc, writeBatch } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { v4 as uuidv4 } from "uuid";
import { UploadCloud, FileImage, FileText, X, AlertCircle, Sparkles, CheckCircle2 } from "lucide-react";
import Loader from "./Loader.jsx";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://api.backend.studenthub.sumanonline.com";

const Uploader = ({ onUploadSuccess }) => {
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

      if (!Array.isArray(schedule)) {
        if (schedule && typeof schedule === "object") {
          const possibleArray = schedule.routine || schedule.schedule || schedule.data || schedule.classes || Object.values(schedule).find(v => Array.isArray(v));
          if (Array.isArray(possibleArray)) {
            schedule = possibleArray;
          } else if (schedule.subject || schedule.day) {
            schedule = [schedule];
          }
        }
      }

      if (Array.isArray(schedule) && schedule.length > 0) {
        const batch = writeBatch(db);
        const sharedRoutinesRef = collection(db, "shared_routines");

        for (const item of schedule) {
          const routineDocRef = doc(sharedRoutinesRef, uuidv4());
          batch.set(routineDocRef, {
            ...item,
            userId: auth.currentUser.uid,
            university,
            stream,
            semester,
            section,
            createdAt: new Date().toISOString(),
          });
        }
        await batch.commit();
      } else {
        throw new Error("AI did not return a valid schedule format.");
      }
      if (onUploadSuccess) onUploadSuccess();
    } catch (e) {
      console.error("Upload error details:", e);
      let rawMsg = e.message || "";
      let errorMsg = "Failed to parse and save the routine. Please contact administrator for further assistance.";
      
      if (rawMsg.includes("valid schedule format") || rawMsg.includes("unable to parse images")) {
        errorMsg = "Could not extract class schedule from image. Please ensure the routine image is clear and readable.";
      } else if (rawMsg.includes("429") || rawMsg.toLowerCase().includes("quota") || rawMsg.toLowerCase().includes("rate limit")) {
        errorMsg = "AI Rate Limit Exceeded (429). Please try again in a minute or contact administrator.";
      } else if (rawMsg.includes("401") || rawMsg.toLowerCase().includes("invalid api key")) {
        errorMsg = "Groq API Key Invalid (401). Please check GROQ_API_KEY in Cloudflare backend.";
      } else if (rawMsg.includes("403") || rawMsg.toLowerCase().includes("forbidden") || rawMsg.toLowerCase().includes("permission")) {
        errorMsg = "AI Access Denied (403). Please contact administrator for further assistance.";
      } else if (rawMsg.includes("404")) {
        errorMsg = "AI Model Service Unavailable (404). Please contact administrator for further assistance.";
      } else if (rawMsg.includes("400")) {
        errorMsg = "AI Vision could not process this image format. Is it corrupt or unreadable?";
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
    <div className="p-5 sm:p-8 md:p-10 w-full relative bg-white dark:bg-slate-900 transition-colors">
      <div className="flex flex-col items-center text-center mb-6 sm:mb-8">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-600 shadow-xl shadow-indigo-500/25 text-white flex items-center justify-center mb-4 transition-transform hover:scale-110 duration-300">
          <Sparkles size={28} className="animate-pulse" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-none text-slate-900 dark:text-white">
          Sync <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 dark:from-indigo-400 dark:to-purple-400">Schedule</span>
        </h2>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-[11px] font-bold rounded-full border border-indigo-100 dark:border-indigo-900/40 mt-3">
          <span>✨ Powered by StudentHub Vision AI</span>
        </div>
      </div>

      {!image ? (
        <label
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-[2.25rem] p-6 sm:p-10 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group mb-6 shadow-inner relative overflow-hidden ${
            isDragging
              ? "border-indigo-500 bg-indigo-100/60 dark:bg-indigo-950/60 ring-4 ring-indigo-500/20 scale-[1.02]"
              : "border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/20 dark:bg-slate-800/40 hover:bg-indigo-50/60 dark:hover:bg-slate-800/80 hover:border-indigo-500 dark:hover:border-indigo-400"
          }`}
        >
          <div className={`p-4 sm:p-5 rounded-2xl mb-4 shadow-xl transition-all duration-300 shrink-0 ${
            isDragging ? "bg-indigo-600 text-white scale-110 animate-bounce" : "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 group-hover:rotate-3"
          }`}>
            <UploadCloud
              size={36}
            />
          </div>
          <span className="font-black text-slate-800 dark:text-white text-lg sm:text-xl text-center leading-tight">
            {isDragging ? "Drop your image file here!" : "Drag & Drop, Paste (Ctrl+V) or Click to browse"}
          </span>
          <p className="text-slate-400 dark:text-slate-500 text-xs sm:text-sm font-medium mt-2 text-center">
            Upload your official class schedule or exam timetable
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
            {["JPG", "PNG", "WEBP", "PDF"].map((fmt) => (
              <span key={fmt} className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-bold rounded-md uppercase tracking-wider border border-slate-200/60 dark:border-slate-700">
                {fmt}
              </span>
            ))}
          </div>
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
