import React, { useState } from "react";
import { collection, doc, setDoc, getDoc, writeBatch } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { v4 as uuidv4 } from "uuid";
import { UploadCloud, FileImage, FileText, X, Loader2, AlertCircle } from "lucide-react"; // Added FileText

const GEMINI_KEYS = [
  import.meta.env.VITE_GEMINI_API_KEY_1,
  import.meta.env.VITE_GEMINI_API_KEY_2,
  import.meta.env.VITE_GEMINI_API_KEY_3,
  import.meta.env.VITE_GEMINI_API_KEY_4,
  import.meta.env.VITE_GEMINI_API_KEY_5,
];

const Uploader = ({ onUploadSuccess }) => {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUploadAndParse = async () => {
    if (!image || !auth.currentUser)
      return setError("Authentication required. Please log in.");

    setLoading(true);
    setError("");

    try {
      // Fetch system settings to determine which Gemini Key to use globally
      const systemDoc = await getDoc(doc(db, "settings", "system"));
      let activeKeyIndex = 0; // Default to Key 1
      if (systemDoc.exists() && systemDoc.data().activeGeminiKeyId !== undefined) {
        // The db stores 1, 2, 3 so convert to 0-based array index:
        activeKeyIndex = Math.max(0, Math.min(4, parseInt(systemDoc.data().activeGeminiKeyId) - 1));
      }

      const activeGeminiKey = GEMINI_KEYS[activeKeyIndex];
      if (!activeGeminiKey) {
        throw new Error("Active Gemini API Key is missing or invalid in server configuration.");
      }

      const genAI = new GoogleGenerativeAI(activeGeminiKey);
      const reader = new FileReader();

      const base64Data = await new Promise((resolve) => {
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.readAsDataURL(image);
      });

      // Fetch user profile to get university, stream, semester, section
      const userProfileDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
      if (!userProfileDoc.exists()) {
        throw new Error("Please update your profile in Settings before syncing routines.");
      }
      const profileData = userProfileDoc.data();
      const { university, stream, semester, section } = profileData;

      if (!university || !stream || !semester || !section) {
        throw new Error("Incomplete profile. Please update University, Stream, Semester, and Section in Settings.");
      }

      const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

      const response = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: "Extract routine: JSON array of objects {day, subject, teacher, time}. Return ONLY the JSON array, no markdown formatting or extra text.",
              },
              { inlineData: { data: base64Data, mimeType: image.type } },
            ],
          },
        ],
      });

      const responseData = await response.response;
      let text = responseData.text();

      if (!text) {
        throw new Error("AI returned an empty response. Please try a clearer image.");
      }

      // Clean up markdown formatting if present
      text = text.replace(/```json/g, "").replace(/```/g, "").trim();

      const schedule = JSON.parse(text);

      if (Array.isArray(schedule)) {
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
      let errorMsg = "Failed to parse and save the routine.";
      if (e.message?.includes("400")) {
        errorMsg = "AI could not process this image. Is it too blurry or too small?";
      } else if (e.message) {
        errorMsg = e.message;
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 md:p-10 w-full relative">
      {/* Header section */}
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-black text-slate-950 tracking-tight leading-tight">
          Sync <span className="text-indigo-600">Schedule</span>
        </h2>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2 opacity-60">
          Intelligent AI Extraction
        </p>
      </div>

      {/* Upload Zone */}
      {!image ? (
        <label className="border-2 border-dashed border-slate-300 rounded-[2.5rem] p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-indigo-50/50 hover:border-indigo-400 transition-all group mb-8">
          <div className="bg-slate-100 p-5 rounded-[1.5rem] mb-4 group-hover:bg-indigo-100 transition-colors group-hover:scale-110 duration-300">
            <UploadCloud
              size={36}
              className="text-slate-400 group-hover:text-indigo-600 transition-colors"
            />
          </div>
          <span className="font-black text-slate-700 text-xl text-center">
            Click to browse
          </span>
          <span className="text-slate-400 font-medium mt-2 text-center">
            Supports JPG, PNG, WEBP, PDF
          </span>
          <input
            type="file"
            accept="image/*,application/pdf"
            onChange={(e) => setImage(e.target.files[0])}
            className="hidden" // Hides the ugly default input
          />
        </label>
      ) : (
        /* Selected File Card */
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-[2rem] p-4 md:p-6 flex items-center justify-between mb-8 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-center gap-4 overflow-hidden">
            <div className="bg-white p-4 rounded-2xl shadow-sm shrink-0">
              {image.type === "application/pdf" ? (
                <FileText size={28} className="text-rose-500" />
              ) : (
                <FileImage size={28} className="text-indigo-600" />
              )}
            </div>
            <div className="flex flex-col overflow-hidden min-w-0">
              <span className="font-bold text-slate-800 text-lg truncate">
                {image.name}
              </span>
              <span className="text-indigo-400 text-sm font-bold">
                {(image.size / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
          </div>
          <button
            onClick={() => setImage(null)}
            className="p-3 bg-white rounded-full text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all shadow-sm shrink-0 active:scale-90"
            title="Remove image"
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* Error Message UI */}
      {error && (
        <div className="flex items-center gap-3 bg-red-50 text-red-600 p-5 rounded-2xl mb-8 border border-red-100 animate-in fade-in slide-in-from-bottom-2">
          <AlertCircle size={24} className="shrink-0" />
          <p className="text-sm font-bold leading-tight">{error}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleUploadAndParse}
        disabled={loading || !image}
        className={`w-full font-black text-lg py-5 rounded-[2rem] flex items-center justify-center gap-3 transition-all duration-300 ${loading || !image
          ? "bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200"
          : "bg-slate-900 text-white hover:shadow-2xl hover:bg-indigo-600 active:scale-[0.98]"
          }`}
      >
        {loading ? (
          <>
            <Loader2 size={24} className="animate-spin text-indigo-400" />
            <span>AI Scanning...</span>
          </>
        ) : (
          <span>
            {image ? "Scan & Save Privately" : "Select an image first"}
          </span>
        )}
      </button>
    </div>
  );
};

export default Uploader;
