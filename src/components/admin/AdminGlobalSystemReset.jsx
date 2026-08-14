import React, { useState } from "react";
import {
  AlertTriangle,
  Database,
  ShieldAlert,
  Trash2,
  Lock,
  CheckCircle2,
  Layers,
  Users,
  CalendarDays
} from "lucide-react";
import Loader from "../Loader.jsx";

export const AdminGlobalSystemReset = ({ initiateFullSystemReset, isWiping }) => {
  const [confirmInput, setConfirmInput] = useState("");
  const requiredPhrase = "RESET";
  const isConfirmed = confirmInput.trim().toUpperCase() === requiredPhrase;

  const handleReset = () => {
    if (!isConfirmed) return;
    if (initiateFullSystemReset) {
      initiateFullSystemReset();
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6 w-full max-w-4xl mx-auto pb-12 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-900/60 uppercase tracking-wider">
              <ShieldAlert size={12} /> Disaster Recovery
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Global System Reset
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Restore platform database to initial state and delete all registered collections.
          </p>
        </div>
      </div>

      <div className="bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/50 rounded-2xl p-5 sm:p-7 shadow-xs space-y-6">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 mt-0.5">
            <AlertTriangle size={20} />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm sm:text-base font-bold text-rose-950 dark:text-rose-200">
              High Impact Operation
            </h2>
            <p className="text-xs sm:text-sm text-rose-800/90 dark:text-rose-300/80 leading-relaxed">
              Performing a factory reset will permanently remove all institutional records. This process cannot be reversed or undone.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 bg-white/90 dark:bg-slate-900/60 rounded-xl border border-rose-200/70 dark:border-rose-900/40 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
              <Users size={16} />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">All User Accounts</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Profiles &amp; credentials</p>
            </div>
          </div>

          <div className="p-3.5 bg-white/90 dark:bg-slate-900/60 rounded-xl border border-rose-200/70 dark:border-rose-900/40 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
              <Layers size={16} />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">All Class Routines</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Timetables &amp; schedules</p>
            </div>
          </div>

          <div className="p-3.5 bg-white/90 dark:bg-slate-900/60 rounded-xl border border-rose-200/70 dark:border-rose-900/40 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
              <CalendarDays size={16} />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">Holiday Calendar</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">Academic closures</p>
            </div>
          </div>

          <div className="p-3.5 bg-white/90 dark:bg-slate-900/60 rounded-xl border border-rose-200/70 dark:border-rose-900/40 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
              <Database size={16} />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white">Audit System Logs</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">History &amp; statistics</p>
            </div>
          </div>
        </div>

        <div className="bg-white/95 dark:bg-slate-900/80 rounded-xl border border-rose-200/90 dark:border-rose-900/60 p-4 sm:p-5 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Lock size={13} className="text-rose-500" />
              <span>Safety Verification Confirmation</span>
            </label>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Type <strong className="text-rose-600 dark:text-rose-400 font-black">RESET</strong> in the field below to confirm authorization:
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <input
              type="text"
              placeholder="Type RESET"
              value={confirmInput}
              onChange={(e) => setConfirmInput(e.target.value)}
              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl px-3.5 py-2 text-xs font-bold uppercase tracking-wider outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />

            <button
              type="button"
              onClick={handleReset}
              disabled={!isConfirmed || isWiping}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 text-white disabled:text-slate-400 dark:disabled:text-slate-600 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed shrink-0"
            >
              {isWiping ? (
                <>
                  <Loader inline size="sm" />
                  <span>Purging Global System...</span>
                </>
              ) : (
                <>
                  <Trash2 size={14} />
                  <span>Execute Full Factory Reset</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminGlobalSystemReset;
