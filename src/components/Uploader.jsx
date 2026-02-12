import React, { useState } from "react";
import { collection, doc, setDoc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { GoogleGenAI } from "@google/genai";
import { v4 as uuidv4 } from "uuid";
import { UploadCloud, FileImage, X, Loader2, AlertCircle } from "lucide-react"; // Make sure to import these!

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

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
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      const reader = new FileReader();

      const base64Data = await new Promise((resolve) => {
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.readAsDataURL(image);
      });

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          {
            role: "user",
            parts: [
              {
                text: "Extract routine: JSON array of objects {day, subject, teacher, time}.",
              },
              { inlineData: { data: base64Data, mimeType: image.type } },
            ],
          },
        ],
        config: { responseMimeType: "application/json" },
      });

      const schedule = JSON.parse(response.text);

      if (Array.isArray(schedule)) {
        for (const item of schedule) {
          // 🔥 SECURITY FIX APPLIED: Saving to the secure user subcollection
          const userDocRef = doc(
            db,
            "users",
            auth.currentUser.uid,
            "user_classes",
            uuidv4(),
          );

          await setDoc(userDocRef, {
            ...item,
            userId: auth.currentUser.uid,
            createdAt: new Date().toISOString(),
          });
        }
      } else {
        throw new Error("AI did not return a valid schedule format.");
      }

      if (onUploadSuccess) onUploadSuccess();
    } catch (e) {
      console.error("Upload error:", e);
      setError(e.message || "Failed to parse and save the routine.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-xl border border-slate-100 max-w-2xl mx-auto w-full relative overflow-hidden">
      {/* Header section */}
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">
          Upload Routine
        </h2>
        <p className="text-slate-500 font-medium mt-2">
          Upload an image of your class schedule to scan it.
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
            Supports JPG, PNG, WEBP
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImage(e.target.files[0])}
            className="hidden" // Hides the ugly default input
          />
        </label>
      ) : (
        /* Selected File Card */
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-[2rem] p-4 md:p-6 flex items-center justify-between mb-8 animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-center gap-4 overflow-hidden">
            <div className="bg-white p-4 rounded-2xl shadow-sm shrink-0">
              <FileImage size={28} className="text-indigo-600" />
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
        className={`w-full font-black text-lg py-5 rounded-[2rem] flex items-center justify-center gap-3 transition-all duration-300 ${
          loading || !image
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
