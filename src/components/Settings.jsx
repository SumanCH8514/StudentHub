import React, { useState } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { Trash2, AlertTriangle, ArrowLeft, Loader2 } from "lucide-react";

const Settings = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const deleteAllRoutines = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const confirmWipe = window.confirm(
      "Are you sure? This will permanently delete ALL your uploaded routines.",
    );
    if (!confirmWipe) return;

    setLoading(true);
    try {
      const q = query(
        collection(db, "classes"),
        where("userId", "==", user.uid),
      );
      const querySnapshot = await getDocs(q);

      // Use a Batch for efficiency (deletes up to 500 docs at once)
      const batch = writeBatch(db);
      querySnapshot.forEach((document) => {
        batch.delete(doc(db, "classes", document.id));
      });

      await batch.commit();
      setMessage("All routine data has been cleared successfully.");
    } catch (error) {
      console.error("Delete Error:", error);
      setMessage("Failed to delete data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white p-6 md:p-12 lg:p-20">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 font-bold mb-10 transition-colors"
      >
        <ArrowLeft size={20} /> Back to Dashboard
      </button>

      <div className="max-w-3xl">
        <h1 className="text-4xl font-black text-slate-900 mb-4">
          Data Management
        </h1>
        <p className="text-slate-500 text-lg mb-12">
          Control your privacy and clear old semester data here.
        </p>

        <div className="space-y-6">
          {/* Danger Zone Card */}
          <div className="bg-red-50 border border-red-100 rounded-[2.5rem] p-8 md:p-12">
            <div className="flex items-start gap-6">
              <div className="p-4 bg-red-100 text-red-600 rounded-2xl">
                <AlertTriangle size={32} />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-black text-red-900 mb-2">
                  Danger Zone
                </h3>
                <p className="text-red-700 font-medium mb-8 leading-relaxed">
                  Deleting your routine data is permanent. Once cleared, the AI
                  will need to re-scan your schedule from scratch.
                </p>

                <button
                  onClick={deleteAllRoutines}
                  disabled={loading}
                  className="flex items-center justify-center gap-3 bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-red-200 transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="animate-spin" size={20} />
                  ) : (
                    <Trash2 size={20} />
                  )}
                  Wipe All Routine Data
                </button>
              </div>
            </div>
          </div>

          {message && (
            <div className="p-4 bg-indigo-50 text-indigo-700 font-bold rounded-2xl text-center animate-in fade-in slide-in-from-bottom-2">
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
