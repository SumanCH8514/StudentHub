import React from "react";
import {
    TrendingUp,
    Users,
    BookOpen,
    MoreVertical,
    Activity,
    ArrowUpRight,
    Search,
    UserPlus,
    Calendar,
    Shield,
    Sparkles,
    Smartphone,
    Mail,
    ChevronRight,
    UserCheck,
    Briefcase
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const AdminDashboardHome = ({ userName, usersCount, classesCount, users = [] }) => {
    // Get 4 most recent users
    const recentUsers = [...users]
        .sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
        .slice(0, 4);

    return (
        <div className="flex flex-col gap-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-1000 ease-out pb-12">

            {/* --- HERO SECTION --- */}
            <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-[2.5rem] blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
                <div className="relative bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700/50 p-8 md:p-12 overflow-hidden shadow-2xl shadow-indigo-500/5">
                    {/* Background Accents */}
                    <div className="absolute top-0 right-0 w-1/3 h-full bg-indigo-50/50 dark:bg-indigo-500/5 blur-[100px] pointer-events-none" />
                    <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-50 dark:bg-purple-500/5 rounded-full blur-[80px] pointer-events-none" />

                    <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
                        <div className="flex-1 text-center lg:text-left">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest mb-6 border border-indigo-100 dark:border-indigo-800/50">
                                <Sparkles size={12} /> System Administrator
                            </div>
                            <h2 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white mb-4 tracking-tight leading-tight">
                                Welcome back,<br />
                                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                                    {userName || "Admin"}
                                </span>
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg font-medium max-w-xl leading-relaxed mb-8">
                                StudentHub is running at peak performance. You have <span className="text-indigo-600 dark:text-indigo-400 font-bold">{usersCount || 0}</span> students synced across <span className="text-purple-600 dark:text-purple-400 font-bold">{classesCount || 0}</span> institutional routines.
                            </p>
                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
                                <button className="px-8 py-4 bg-indigo-600 hover:bg-white border-2 border-indigo-600 text-white hover:text-indigo-600 rounded-2xl font-black transition-all shadow-xl shadow-indigo-600/20 active:scale-95 flex items-center gap-2 group/btn">
                                    System Status
                                    <ArrowUpRight size={18} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                                </button>
                                <div className="flex -space-x-3 overflow-hidden">
                                    {recentUsers.map((user, i) => (
                                        <div key={i} className="inline-block h-10 w-10 rounded-full ring-4 ring-white dark:ring-slate-800 bg-slate-100 dark:bg-slate-700 overflow-hidden">
                                            {user.photoBase64 ? (
                                                <img src={user.photoBase64} alt="" className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="h-full w-full flex items-center justify-center text-[10px] font-black text-slate-400">
                                                    {(user.fullName || user.name || "U")[0]}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    <div className="flex items-center justify-center h-10 w-10 rounded-full ring-4 ring-white dark:ring-slate-800 bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-[10px] font-black">
                                        +{Math.max(0, usersCount - 4)}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Interactive Radar/Status Card */}
                        <div className="relative group/radar w-full max-w-sm">
                            <div className="bg-slate-900 dark:bg-slate-950 p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
                                <Activity className="absolute top-4 right-4 text-emerald-500 animate-pulse" size={24} />
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Network Load</p>
                                        <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                                            <div className="h-full bg-indigo-500 rounded-full w-[65%] animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Response</p>
                                            <p className="text-white font-bold tracking-tight">24ms</p>
                                        </div>
                                        <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Uptime</p>
                                            <p className="text-white font-bold tracking-tight">99.9%</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 text-emerald-500 bg-emerald-500/10 p-4 rounded-2xl border border-emerald-500/20">
                                        <Shield size={18} />
                                        <span className="text-xs font-black uppercase tracking-widest">Environment Secured</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- STAT CONDS --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Students", value: usersCount, icon: Users, color: "indigo", drift: "+8.4%" },
                    { label: "Routines", value: classesCount, icon: BookOpen, color: "purple", drift: "+3.1%" },
                    { label: "System Load", value: "24%", icon: Activity, color: "emerald", drift: "-1.2%" },
                    { label: "Uptime", value: "99.9%", icon: Shield, color: "amber", drift: "Stable" }
                ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                        <div className="flex items-center justify-between mb-4">
                            <div className={cn(
                                "w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110",
                                stat.color === "indigo" ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" :
                                    stat.color === "purple" ? "bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" :
                                        stat.color === "emerald" ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" :
                                            "bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
                            )}>
                                <stat.icon size={22} />
                            </div>
                            <span className={cn(
                                "text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter",
                                stat.drift.includes("+") ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400" :
                                    stat.drift === "Stable" ? "bg-slate-100 text-slate-700" :
                                        "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-400"
                            )}>
                                {stat.drift}
                            </span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest pl-1">{stat.label}</p>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1 pl-1 tracking-tight">{stat.value}</h3>
                    </div>
                ))}
            </div>

            {/* --- RECENT USERS FULL CARDS --- */}
            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/20">
                            <UserPlus size={20} />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight leading-none mb-1">Joined Students</h3>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest">Recent Portal Registrations</p>
                        </div>
                    </div>
                    <button className="hidden sm:flex items-center gap-2 group/all text-indigo-600 dark:text-indigo-400 font-black text-[10px] uppercase tracking-widest border border-indigo-100 dark:border-indigo-800/50 px-5 py-2 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                        View All Students
                        <ChevronRight size={14} className="group-hover/all:translate-x-1 transition-transform" />
                    </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {recentUsers.length > 0 ? (
                        recentUsers.map((user, i) => (
                            <div key={user.id} className="relative group/user">
                                <div className="absolute -inset-1 bg-gradient-to-b from-indigo-500/20 to-purple-500/0 rounded-[2rem] blur-xl opacity-0 group-hover/user:opacity-100 transition duration-500" />
                                <div className="relative bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col items-center p-8 text-center group-hover/user:border-indigo-500/50 transition-all duration-300">
                                    {/* Profile Image Section */}
                                    <div className="relative mb-6">
                                        <div className="absolute -inset-2 bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-full opacity-20 group-hover/user:opacity-100 group-hover/user:animate-spin-slow transition-all duration-700" />
                                        <div className="relative w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-900 border-4 border-white dark:border-slate-800 shadow-xl overflow-hidden">
                                            {user.photoBase64 ? (
                                                <img src={user.photoBase64} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-50 dark:bg-indigo-900/30">
                                                    <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400">
                                                        {(user.fullName || user.name || "?")[0].toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* User Details */}
                                    <h4 className="text-lg font-black text-slate-800 dark:text-white leading-tight mb-1 line-clamp-1">{user.fullName || user.name || "Anonymous User"}</h4>
                                    <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-1.5 justify-center">
                                        <Shield size={10} /> {user.role || 'student'}
                                    </p>

                                    <div className="w-full space-y-3 pt-4 border-t border-slate-50 dark:border-slate-700/50">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-slate-400">
                                                <Mail size={14} />
                                            </div>
                                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 truncate">{user.email}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-slate-400">
                                                <Briefcase size={14} />
                                            </div>
                                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">{user.stream || user.course || "General"}</span>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-slate-50 dark:bg-slate-900 rounded-lg text-slate-400">
                                                <Calendar size={14} />
                                            </div>
                                            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">Joined {user.createdAt?.toDate ? user.createdAt.toDate().toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'Recently'}</span>
                                        </div>
                                    </div>

                                    <div className="absolute top-4 right-4 opacity-0 group-hover/user:opacity-100 transition-opacity">
                                        <div className="p-2 bg-emerald-500 text-white rounded-lg shadow-lg shadow-emerald-500/20">
                                            <UserCheck size={14} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="col-span-full py-12 text-center bg-slate-50 dark:bg-slate-900/30 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">Waiting for new registrations...</p>
                        </div>
                    )}
                </div>
            </div>

            {/* --- SYSTEM ENGAGEMENT OVERVIEW --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-700 p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">Sync Activity</h3>
                            <p className="text-xs font-medium text-slate-400 uppercase tracking-widest mt-1">Real-time engine performance</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 shadow-inner">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400">Live</span>
                            </div>
                            <button className="p-2.5 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"><MoreVertical size={20} /></button>
                        </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-12 items-end">
                        <div className="flex-1 flex items-end justify-between h-[200px] gap-3">
                            {[45, 60, 40, 85, 55, 75, 50, 95, 65, 80].map((h, i) => (
                                <div key={i} className="flex-1 flex flex-col gap-3 group">
                                    <div className="relative w-full h-full bg-slate-50 dark:bg-slate-900/50 rounded-t-xl overflow-hidden">
                                        <div
                                            className={cn(
                                                "absolute bottom-0 w-full transition-all duration-1000 ease-out rounded-t-xl shadow-lg",
                                                i === 7 ? "bg-indigo-600 shadow-indigo-500/20" : "bg-slate-200 dark:bg-slate-700/50 group-hover:bg-indigo-400"
                                            )}
                                            style={{ height: `${h}%` }}
                                        />
                                    </div>
                                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter text-center">T-{10 - i}</span>
                                </div>
                            ))}
                        </div>
                        <div className="w-full md:w-56 space-y-6">
                            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border border-slate-100 dark:border-slate-700">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Queue Score</p>
                                <p className="text-2xl font-black text-slate-950 dark:text-white leading-none">A+</p>
                                <div className="mt-4 flex items-center justify-between text-[10px] font-bold text-emerald-500">
                                    <span>Optimal</span>
                                    <span>98%</span>
                                </div>
                            </div>
                            <button className="w-full py-4 bg-indigo-600 hover:bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-indigo-500/10 active:scale-95">
                                Export Logs
                            </button>
                        </div>
                    </div>
                </div>

                {/* Device Distribution (Visual Representation) */}
                <div className="bg-slate-900 dark:bg-slate-950 rounded-[2.5rem] p-10 text-white flex flex-col justify-between border border-white/5 relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-indigo-500/10 blur-[80px]" />

                    <div className="relative">
                        <h3 className="text-xl font-black tracking-tight mb-2">Access Grid</h3>
                        <p className="text-slate-400 text-xs font-medium leading-relaxed">Most students are accessing the routine hub via mobile devices today.</p>
                    </div>

                    <div className="relative space-y-5 my-8">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                                <span className="flex items-center gap-2"><Smartphone size={12} /> Mobile Web</span>
                                <span className="text-white">84%</span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 w-[84%]" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                                <span className="flex items-center gap-2"><BookOpen size={12} /> Desktop App</span>
                                <span className="text-white">16%</span>
                            </div>
                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-400 w-[16%]" />
                            </div>
                        </div>
                    </div>

                    <div className="relative pt-6 border-t border-white/5">
                        <div className="flex items-center gap-4 text-xs font-bold text-slate-500">
                            <div className="flex flex-col">
                                <span className="text-white font-black text-sm">2.4s</span>
                                <span className="uppercase tracking-widest">Load Speed</span>
                            </div>
                            <div className="w-px h-8 bg-white/10 mx-2" />
                            <div className="flex flex-col">
                                <span className="text-emerald-400 font-black text-sm">Global</span>
                                <span className="uppercase tracking-widest">CDN Status</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardHome;
