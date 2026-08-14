import React, { useState } from "react";
import {
  CalendarDays,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  ShieldCheck
} from "lucide-react";
import { db } from "../../firebaseConfig";
import { collection, getDocs, writeBatch } from "firebase/firestore";
import Loader from "../Loader.jsx";

export const AdminHolidaysDelete = () => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleDeleteAllHolidays = async () => {
    if (!window.confirm("Are you sure you want to permanently delete all holiday events from the database?")) {
      return;
    }

    setIsDeleting(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const snapshot = await getDocs(collection(db, "holidays"));
      if (snapshot.empty) {
        setSuccessMsg("The holiday calendar is already empty.");
        setIsDeleting(false);
        return;
      }

      const batch = writeBatch(db);
      snapshot.docs.forEach((docSnap) => batch.delete(docSnap.ref));
      await batch.commit();

      setSuccessMsg(`Successfully removed ${snapshot.size} holiday entries from the database.`);
    } catch (err) {
      setErrorMsg("Failed to delete holidays: " + (err?.message || "Unknown error"));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6 w-full max-w-4xl mx-auto pb-12 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-800/60 uppercase tracking-wider">
              <CalendarDays size={12} /> Calendar Maintenance
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Delete Holiday Calendar
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Purge registered holiday lists, closure schedules, and event notices from the global catalog.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2.5">
          <CheckCircle2 size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-2.5">
          <AlertTriangle size={16} className="shrink-0 text-rose-600 dark:text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-5 sm:p-7 shadow-xs space-y-6">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
            <Calendar size={20} />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Permanent Holiday Records Deletion
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
              This operation purges all active university holiday circulars. After completion, students will see an empty calendar until a revised circular is uploaded.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-700/80 space-y-2 text-xs font-medium">
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
            <span>Target Collection</span>
            <span className="font-mono font-bold text-slate-900 dark:text-white">firestore://holidays</span>
          </div>
          <div className="flex items-center justify-between text-slate-700 dark:text-slate-300">
            <span>Scope</span>
            <span className="font-bold text-slate-900 dark:text-white">Global (All Streams &amp; Semesters)</span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-700/80">
          <div className="text-[11px] text-slate-400 dark:text-slate-500">
            Requires admin privileges. Action is logged in system audit.
          </div>

          <button
            type="button"
            onClick={handleDeleteAllHolidays}
            disabled={isDeleting}
            className="w-full sm:w-auto px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <Loader inline size="sm" />
                <span>Deleting Calendar...</span>
              </>
            ) : (
              <>
                <Trash2 size={14} />
                <span>Delete All Holidays</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminHolidaysDelete;
