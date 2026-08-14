import React from "react";
import {
  Settings2,
  ShieldCheck,
  Bell,
  Sparkles,
  RefreshCw,
  UserPlus,
  AlertOctagon,
  Database,
  Lock,
  Radio
} from "lucide-react";
import Loader from "../Loader.jsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const SettingSwitch = ({ checked, onChange, disabled }) => {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-blue-600" : "bg-slate-300 dark:bg-slate-600"
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
          checked ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
};

export const AdminSettings = ({
  isWiping = false,
  wipeGlobalClasses,
  settings = {},
  updateSetting
}) => {
  const {
    allowPublicRegistration = true,
    automatedScheduleSync = true,
    maintenanceMode = false,
    geminiAssistantEnabled = true,
    newUserAlerts = true,
  } = settings;

  const handleToggle = (key, val) => {
    if (updateSetting) {
      updateSetting(key, val);
    }
  };

  return (
    <div className="space-y-5 sm:space-y-6 w-full max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800/60 uppercase tracking-wider">
              <Settings2 size={12} /> System Control Plane
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            System Governance &amp; Security
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
            Configure access policies, background routine synchronization, AI assistant integration, and disaster recovery.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600/80 text-xs font-semibold text-slate-700 dark:text-slate-200">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>Operational Online</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        <div className="lg:col-span-2 space-y-5 sm:space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700/80 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <UserPlus size={18} />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                  Access &amp; Security Policies
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Manage student registration gateway and portal lock status
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-700/60 p-5 pt-0">
              <div className="py-4 flex items-center justify-between gap-4">
                <div className="space-y-0.5 max-w-lg">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Public Self-Registration
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Allow students to independently sign up and configure their stream and semester.
                  </p>
                </div>
                <SettingSwitch
                  checked={allowPublicRegistration}
                  onChange={(val) => handleToggle("allowPublicRegistration", val)}
                />
              </div>

              <div className="py-4 flex items-center justify-between gap-4">
                <div className="space-y-0.5 max-w-lg">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                      Maintenance Mode Lock
                    </h3>
                    {maintenanceMode && (
                      <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Temporarily restrict timetable and portal access exclusively to administrative accounts.
                  </p>
                </div>
                <SettingSwitch
                  checked={maintenanceMode}
                  onChange={(val) => handleToggle("maintenanceMode", val)}
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700/80 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Sparkles size={18} />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                  Automation &amp; AI Intelligence
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Background timetable sync cycles and assistant natural language processing
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-700/60 p-5 pt-0">
              <div className="py-4 flex items-center justify-between gap-4">
                <div className="space-y-0.5 max-w-lg">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Automated Midnight Routine Synchronization
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Periodically reconcile live routine cache and resolve conflicts at midnight.
                  </p>
                </div>
                <SettingSwitch
                  checked={automatedScheduleSync}
                  onChange={(val) => handleToggle("automatedScheduleSync", val)}
                />
              </div>

              <div className="py-4 flex items-center justify-between gap-4">
                <div className="space-y-0.5 max-w-lg">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    Smart AI Assistant Engine
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Enable generative natural language timetable answers and query parsing.
                  </p>
                </div>
                <SettingSwitch
                  checked={geminiAssistantEnabled}
                  onChange={(val) => handleToggle("geminiAssistantEnabled", val)}
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700/80 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Bell size={18} />
              </div>
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                  Notification Broadcasts
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Event alerts and administrative notifications
                </p>
              </div>
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="space-y-0.5 max-w-lg">
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                    New Student Registration Alerts
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Deliver dashboard notifications whenever a new student joins your institution.
                  </p>
                </div>
                <SettingSwitch
                  checked={newUserAlerts}
                  onChange={(val) => handleToggle("newUserAlerts", val)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5 sm:space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-blue-500" /> Security Environment
            </h3>
            <div className="space-y-2 text-xs font-medium">
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/60">
                <span className="text-slate-500 dark:text-slate-400">Auth Standard</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">Firebase Auth + RBAC</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/60">
                <span className="text-slate-500 dark:text-slate-400">Storage Encryption</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">AES-256 Cloud</span>
              </div>
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700/60">
                <span className="text-slate-500 dark:text-slate-400">Audit Trail</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">Continuous Logging</span>
              </div>
            </div>
          </div>

          <div className="bg-rose-50/80 dark:bg-rose-950/20 rounded-2xl border border-rose-200/90 dark:border-rose-900/50 p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5 text-rose-700 dark:text-rose-400">
                <div className="w-8 h-8 rounded-lg bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center shrink-0">
                  <AlertOctagon size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-rose-950 dark:text-rose-200">
                    Disaster Recovery &amp; Purge
                  </h3>
                  <p className="text-[11px] text-rose-700/80 dark:text-rose-400/80">Irreversible Action</p>
                </div>
              </div>

              <div className="p-3.5 bg-white/80 dark:bg-slate-900/60 rounded-xl border border-rose-200/80 dark:border-rose-900/60 space-y-1.5">
                <h4 className="text-xs font-bold text-rose-900 dark:text-rose-300">
                  Global Routine Data Purge
                </h4>
                <p className="text-[11px] text-rose-800/80 dark:text-rose-400 leading-relaxed font-medium">
                  Permanently wipe all scheduled timetable periods, subjects, and routine records across the global database.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={wipeGlobalClasses}
              disabled={isWiping}
              className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isWiping ? (
                <>
                  <Loader inline size="sm" />
                  <span>Purging Database...</span>
                </>
              ) : (
                <>
                  <Database size={14} />
                  <span>Initiate Routine Data Purge</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
