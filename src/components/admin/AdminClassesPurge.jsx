import React from "react";
import {
  Trash2,
  AlertTriangle,
  BookOpen,
  GraduationCap,
  CalendarDays,
  Users as UsersIcon,
  Layers,
  Database
} from "lucide-react";
import Loader from "../Loader.jsx";

export const AdminClassesPurge = ({
  deleteFilter = { university: "SVU", stream: "B.Tech", semester: "1", section: "1" },
  setDeleteFilter,
  deleteFilteredClasses,
  wipeGlobalClasses,
  isWiping = false
}) => {
  return (
    <div className="space-y-5 sm:space-y-6 w-full max-w-4xl mx-auto pb-12 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800/60 uppercase tracking-wider">
              <Layers size={12} /> Routine Purge &amp; Maintenance
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Delete Class Routines
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Selectively remove routine schedules for specific cohorts or initiate an end-of-semester global wipe.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-5 sm:p-6 shadow-xs space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Trash2 size={18} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
              Targeted Cohort Routine Purge
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Filter by university, department, semester, and section to purge specific schedule records
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              University
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <BookOpen size={14} />
              </div>
              <select
                value={deleteFilter.university}
                onChange={(e) => setDeleteFilter && setDeleteFilter({ ...deleteFilter, university: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl py-2 pl-9 pr-3 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                <option value="SVU">SVU</option>
                <option value="Regent">Regent</option>
                <option value="Brainware University">Brainware University</option>
                <option value="Techno India">Techno India</option>
                <option value="Others">Others</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Stream / Course
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <GraduationCap size={14} />
              </div>
              <select
                value={deleteFilter.stream}
                onChange={(e) => setDeleteFilter && setDeleteFilter({ ...deleteFilter, stream: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl py-2 pl-9 pr-3 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                <option value="B.Tech">B.Tech</option>
                <option value="BCA">BCA</option>
                <option value="MCA">MCA</option>
                <option value="B.Sc">B.Sc</option>
                <option value="ANCS">ANCS</option>
                <option value="DIPLOMA">DIPLOMA</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Semester
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <CalendarDays size={14} />
              </div>
              <select
                value={deleteFilter.semester}
                onChange={(e) => setDeleteFilter && setDeleteFilter({ ...deleteFilter, semester: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl py-2 pl-9 pr-3 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                  <option key={n} value={n.toString()}>
                    Semester {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Section
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <UsersIcon size={14} />
              </div>
              <select
                value={deleteFilter.section}
                onChange={(e) => setDeleteFilter && setDeleteFilter({ ...deleteFilter, section: e.target.value })}
                className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl py-2 pl-9 pr-3 text-xs font-bold text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                  <option key={n} value={n.toString()}>
                    Section {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={deleteFilteredClasses}
            disabled={isWiping}
            className="w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isWiping ? (
              <>
                <Loader inline size="sm" />
                <span>Purging Classes...</span>
              </>
            ) : (
              <>
                <Trash2 size={14} />
                <span>Purge Selected Cohort</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="bg-rose-50/70 dark:bg-rose-950/20 rounded-2xl border border-rose-200/80 dark:border-rose-900/50 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400">
            <AlertTriangle size={16} />
            <h3 className="font-bold text-sm text-rose-950 dark:text-rose-200">
              End-of-Semester Global Purge
            </h3>
          </div>
          <p className="text-xs text-rose-800/80 dark:text-rose-400 max-w-xl leading-relaxed">
            Permanently delete all class routine schedules across all universities, streams, and semesters.
          </p>
        </div>

        <button
          type="button"
          onClick={wipeGlobalClasses}
          disabled={isWiping}
          className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
        >
          <Database size={14} />
          <span>Wipe All Routines</span>
        </button>
      </div>
    </div>
  );
};

export default AdminClassesPurge;
