import React from "react";
import {
  FileSignature,
  Search,
  Filter,
  Download,
  Database
} from "lucide-react";

export const AdminResults = () => {
  return (
    <div className="flex flex-col gap-5 sm:gap-6 w-full max-w-7xl mx-auto pb-10 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Academic Gradebook &amp; Results
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Manage, publish, and audit semester examinations and marks
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            className="flex-1 sm:flex-none h-10 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Download size={14} /> <span>Export Report</span>
          </button>
          <button
            type="button"
            className="flex-1 sm:flex-none h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <FileSignature size={14} /> <span>Publish Results</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xs border border-slate-200/80 dark:border-slate-700/80 overflow-hidden flex flex-col min-h-[400px]">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/80 flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by student name or roll..."
              className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-xs font-medium outline-none"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors w-full sm:w-auto cursor-pointer"
            >
              <Filter size={14} /> <span>Filter by Semester</span>
            </button>
          </div>
        </div>

        <div className="flex-1 p-8 sm:p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-4">
            <Database size={30} />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1.5">
            Gradebook Integration Standby
          </h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-md text-xs sm:text-sm leading-relaxed mb-6">
            Institutional result database synchronization is enabled on university publication schedules.
          </p>
          <button
            type="button"
            className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Configure External API
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminResults;
