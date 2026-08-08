import React, { useState } from "react";
import { collection, doc, setDoc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { v4 as uuidv4 } from "uuid";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "https://api.backend.studenthub.sumanonline.com";


const Uploader = ({ onUploadSuccess }) => {
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleUploadAndParse = async () => {
    if (!image || !auth.currentUser)
      return setError("Authentication required.");

    setLoading(true);
    setError("");

    try {
      const base64Data = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(",")[1]);
        reader.readAsDataURL(image);
      });

      const res = await fetch(`${BACKEND_URL}/api/parse-routine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64Data,
          mimeType: image.type
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to parse routine.");
      }

      const schedule = data.routine;

      // Ensure the AI returned an array before we try to loop over it
      if (Array.isArray(schedule)) {
        for (const item of schedule) {
          // 🔥 THE FIX: Saving to the secure user subcollection path instead of the global "classes"
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

      // Close the uploader and refresh the dashboard
      if (onUploadSuccess) onUploadSuccess();
    } catch (e) {
      console.error("Upload error:", e);
      setError(e.message || "Failed to parse and save the routine.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 max-w-2xl mx-auto">
      <input
        type="file"
        onChange={(e) => setImage(e.target.files[0])}
        className="mb-4 block w-full text-sm font-medium"
      />
      <button
        onClick={handleUploadAndParse}
        disabled={loading}
        className="w-full bg-slate-900 text-white font-bold py-4 rounded-2xl active:scale-95 disabled:opacity-50 transition-all"
      >
        {loading ? "AI Analysis in Progress..." : "Scan & Save Privately"}
      </button>
      {error && <p className="text-red-500 mt-2 text-xs font-bold">{error}</p>}
    </div>
  );
};

export default Uploader;
