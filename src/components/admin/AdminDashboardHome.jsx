import React, { useMemo } from "react";
import {
  Users,
  BookOpen,
  CalendarDays,
  LifeBuoy,
  Upload,
  Layers,
  FileText,
  ChevronRight,
  GraduationCap,
  Clock,
  CheckCircle2,
  Calendar,
  ArrowRight,
  Database
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const AdminDashboardHome = ({
  userName = "Administrator",
  usersCount = 0,
  classesCount = 0,
  users = [],
  setActiveTab
}) => {
  const recentUsers = useMemo(() => {
    return [...users]
      .sort((a, b) => {
        const timeB = b.createdAt?.toMillis ? b.createdAt.toMillis() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        const timeA = a.createdAt?.toMillis ? a.createdAt.toMillis() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        return timeB - timeA;
      })
      .slice(0, 5);
  }, [users]);

  const streamBreakdown = useMemo(() => {
    const counts = {};
    users.forEach((u) => {
      const stream = u.stream || u.course || "General";
      counts[stream] = (counts[stream] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [users]);

  const adminActions = [
    {
      id: "upload-routine",
      title: "Upload Timetable",
      desc: "Scan and publish semester class routines",
      icon: Upload,
      iconBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200/50 dark:border-blue-800/50",
      accent: "hover:border-blue-400 dark:hover:border-blue-500",
    },
    {
      id: "upload-holidays",
      title: "Holiday Calendar",
      desc: "Publish university closures & festival dates",
      icon: CalendarDays,
      iconBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200/50 dark:border-rose-800/50",
      accent: "hover:border-rose-400 dark:hover:border-rose-500",
    },
    {
      id: "academic-config",
      title: "Academic Structure",
      desc: "Manage streams, semesters & catalog",
      icon: Layers,
      iconBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-800/50",
      accent: "hover:border-amber-400 dark:hover:border-amber-500",
    },
    {
      id: "support-tickets",
      title: "Support Desk",
      desc: "Answer student inquiries & resolve tickets",
      icon: LifeBuoy,
      iconBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200/50 dark:border-emerald-800/50",
      accent: "hover:border-emerald-400 dark:hover:border-emerald-500",
    },
    {
      id: "upload-forms",
      title: "College Forms",
      desc: "Configure registration & exam form links",
      icon: FileText,
      iconBg: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200/50 dark:border-violet-800/50",
      accent: "hover:border-violet-400 dark:hover:border-violet-500",
    },
    {
      id: "students",
      title: "Student Records",
      desc: "Browse student directories & roll numbers",
      icon: Users,
      iconBg: "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
      accent: "hover:border-slate-400 dark:hover:border-slate-500",
    },
  ];

  const currentDateFormatted = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-5 sm:space-y-6 w-full pb-10 max-w-7xl mx-auto">
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-7 md:p-8 shadow-lg shadow-indigo-950/20 border border-slate-800">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Portal
              </span>
              <span className="text-[11px] font-medium text-slate-300/80 bg-white/5 px-2.5 py-0.5 rounded-full border border-white/10">
                {currentDateFormatted}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-snug">
              Welcome back, <span className="text-indigo-300">{userName}</span>
            </h1>

            <p className="text-xs sm:text-sm text-slate-300/90 leading-relaxed font-normal">
              Manage semester routines, upload holiday circulars, and monitor real-time student registrations.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:flex md:items-center gap-2.5 sm:gap-3 shrink-0 pt-1 md:pt-0 w-full md:w-auto">
            {setActiveTab && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveTab("upload-routine")}
                  className="h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all active:scale-95 cursor-pointer inline-flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <Upload size={14} className="shrink-0" />
                  <span>Upload Timetable</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("upload-holidays")}
                  className="h-10 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 text-xs font-bold transition-all active:scale-95 cursor-pointer backdrop-blur-xs inline-flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <CalendarDays size={14} className="shrink-0" />
                  <span>Add Holiday</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between transition-all hover:border-blue-300 dark:hover:border-blue-600">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Enrolled Students
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {usersCount}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1 font-medium truncate">
              <CheckCircle2 size={12} className="text-emerald-500 shrink-0" /> Active Student Logins
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between transition-all hover:border-purple-300 dark:hover:border-purple-600">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Class Routines
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <BookOpen size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {classesCount}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1 font-medium truncate">
              <GraduationCap size={12} className="text-purple-500 shrink-0" /> Active Timetables
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between transition-all hover:border-amber-300 dark:hover:border-amber-600">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Departments
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Layers size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {streamBreakdown.length || 4}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium truncate">
              Catalog Streams
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between transition-all hover:border-emerald-300 dark:hover:border-emerald-600">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              System Health
            </span>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Database size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
              Operational
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium truncate">
              Cloud Sync Online
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            Administrative Management
          </h2>
          <span className="text-xs text-slate-400 font-medium">Quick Access</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {adminActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => setActiveTab && setActiveTab(action.id)}
                className={cn(
                  "bg-white dark:bg-slate-800/90 hover:bg-slate-50 dark:hover:bg-slate-700/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-left transition-all duration-200 flex items-center justify-between gap-3 group shadow-xs cursor-pointer",
                  action.accent
                )}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border", action.iconBg)}>
                    <Icon size={19} />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <h3 className="font-bold text-slate-800 dark:text-white text-xs sm:text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                      {action.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight truncate">
                      {action.desc}
                    </p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all shrink-0" />
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Users size={16} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Recent Registrations</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">Newly registered student accounts</p>
              </div>
            </div>
            {setActiveTab && (
              <button
                type="button"
                onClick={() => setActiveTab("students")}
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                View All ({usersCount}) <ArrowRight size={13} />
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {recentUsers.length > 0 ? (
              recentUsers.map((user) => {
                const dateStr = user.createdAt?.toDate
                  ? user.createdAt.toDate().toLocaleDateString("en-US", { month: "short", day: "numeric" })
                  : "Recent";

                const initial = (user.fullName || user.name || user.email || "S")[0].toUpperCase();

                return (
                  <div
                    key={user.id || user.uid}
                    className="p-3.5 sm:p-4 hover:bg-slate-50/60 dark:hover:bg-slate-700/50 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {user.photoBase64 ? (
                        <img
                          src={user.photoBase64}
                          alt=""
                          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                        />
                      ) : (
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold flex items-center justify-center shrink-0 text-sm">
                          {initial}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                            {user.fullName || user.name || "Student"}
                          </h4>
                          <span className={cn(
                            "px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider shrink-0",
                            user.role === "admin"
                              ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300"
                              : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                          )}>
                            {user.role || "student"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate font-medium">
                          <span className="truncate">{user.email}</span>
                          {user.stream && (
                            <span className="text-slate-400 shrink-0 hidden sm:inline">• {user.stream} (Sem {user.semester || "1"})</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Calendar size={12} className="text-slate-400" /> {dateStr}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs font-medium">
                No students registered yet.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700/80 pb-3">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-amber-500" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Stream Distribution</h3>
              </div>
              <span className="text-[11px] font-bold text-slate-400">Total: {usersCount}</span>
            </div>

            <div className="space-y-3">
              {streamBreakdown.length > 0 ? (
                streamBreakdown.map((item) => {
                  const pct = usersCount > 0 ? Math.round((item.count / usersCount) * 100) : 0;
                  return (
                    <div key={item.name} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-700 dark:text-slate-300 truncate">{item.name}</span>
                        <span className="text-slate-500 dark:text-slate-400 font-bold">{item.count} ({pct}%)</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 dark:bg-blue-500 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-slate-400">No enrollment data available yet.</p>
              )}
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-slate-200/70 dark:border-slate-700/80 text-xs space-y-1">
            <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Clock size={13} className="text-blue-500" /> Auto-Sync Active
            </p>
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium text-[11px]">
              Timetables update dynamically when students switch their stream or semester.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardHome;
