import React from "react";
import {
    TrendingUp,
    Users,
    BookOpen,
    DollarSign,
    MoreVertical,
    Activity,
    ArrowUpRight,
    ArrowDownRight
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const AdminDashboardHome = ({ userName, usersCount, classesCount }) => {
    return (
        <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Top Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Welcome Card (spans 2 columns on large screens) */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 md:p-8 flex flex-col sm:flex-row justify-between relative overflow-hidden shadow-sm border border-slate-100">
                    <div className="z-10 bg-white/50 backdrop-blur-sm sm:bg-transparent p-4 sm:p-0 rounded-xl sm:rounded-none max-w-sm flex flex-col justify-center">
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">
                            Congratulations {userName || "Admin"}! <span className="inline-block animate-bounce">🎉</span>
                        </h2>
                        <p className="text-slate-500 text-[15px] leading-relaxed mb-6">
                            You have {usersCount || 0} active students in the hub today. Check your new performance badge in your profile.
                        </p>
                        <button className="self-start px-4 py-2 bg-indigo-50 text-indigo-600 font-semibold rounded-lg hover:bg-indigo-100 transition-colors text-sm">
                            View Profile
                        </button>
                    </div>

                    {/* Decorative shapes and character */}
                    <div className="absolute right-0 bottom-0 top-0 w-1/2 hidden sm:block pointer-events-none">
                        <div className="absolute inset-0 bg-gradient-to-l from-indigo-50/50 to-transparent" />
                        <div className="absolute right-10 bottom-0 w-48 h-56 bg-[url('https://ui-avatars.com/api/?name=Admin&background=random')] bg-contain bg-no-repeat bg-bottom opacity-10" />
                        <div className="absolute right-20 top-10 w-16 h-16 bg-purple-500 rounded-full blur-3xl opacity-20 animate-pulse" />
                        <div className="absolute right-40 bottom-20 w-24 h-24 bg-blue-500 rounded-full blur-3xl opacity-20 animate-pulse delay-75" />
                    </div>
                </div>

                {/* Small Stat Cards Column */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
                    {/* Revenue equivalent - Student Count */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col justify-between">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-500 flex items-center justify-center shrink-0">
                                <Users size={20} />
                            </div>
                            <button className="text-slate-400 hover:text-slate-600"><MoreVertical size={20} /></button>
                        </div>
                        <div>
                            <p className="text-slate-500 font-medium text-[15px] mb-1">Total Students</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl font-bold text-slate-800">{usersCount || 0}</h3>
                                <span className="text-emerald-500 text-sm font-semibold flex items-center">
                                    <ArrowUpRight size={16} /> +12%
                                </span>
                            </div>
                            <p className="text-slate-400 text-xs mt-1">Student Growth</p>
                        </div>
                    </div>

                    {/* Transactions equivalent - Classes Count */}
                    <div className="hidden lg:flex bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex-col justify-between">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-500 flex items-center justify-center shrink-0">
                                <BookOpen size={20} />
                            </div>
                            <button className="text-slate-400 hover:text-slate-600"><MoreVertical size={20} /></button>
                        </div>
                        <div>
                            <p className="text-slate-500 font-medium text-[15px] mb-1">Classes Synced</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl font-bold text-slate-800">{classesCount || "--"}</h3>
                                <span className="text-emerald-500 text-sm font-semibold flex items-center">
                                    <ArrowUpRight size={16} /> +38%
                                </span>
                            </div>
                            <p className="text-slate-400 text-xs mt-1">Daily Syncs</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Second Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Chart Card */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start mb-6">
                        <h3 className="text-lg font-bold text-slate-800">Engagement Overview</h3>
                        <button className="text-slate-400 hover:text-slate-600"><MoreVertical size={20} /></button>
                    </div>

                    <div className="flex flex-col md:flex-row gap-8">
                        {/* Chart Graphic representation */}
                        <div className="flex-1 min-h-[200px] flex items-end justify-between gap-2 border-b border-slate-100 pb-2 relative pb-8">
                            {/* Fake bars */}
                            {[40, 70, 45, 90, 60, 80, 50].map((height, i) => (
                                <div key={i} className="flex flex-col items-center gap-2 group w-full max-w-[40px]">
                                    <div className="w-full flex flex-col justify-end h-[160px] bg-slate-50 rounded-t-lg overflow-hidden group-hover:bg-slate-100 transition-colors">
                                        <div
                                            className={cn(
                                                "w-full rounded-t-lg transition-all duration-1000",
                                                i === 3 ? "bg-indigo-500 shadow-[0_-5px_15px_rgba(99,102,241,0.3)]" :
                                                    i % 2 === 0 ? "bg-blue-400" : "bg-emerald-400"
                                            )}
                                            style={{ height: `${height}%` }}
                                        />
                                    </div>
                                    <span className="text-[10px] sm:text-xs text-slate-400 dark:text-slate-500 font-medium absolute bottom-0">{2016 + i}</span>
                                </div>
                            ))}
                        </div>

                        {/* Sidebar Stats of Chart */}
                        <div className="flex flex-col justify-center gap-6 md:w-48">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-500 dark:text-emerald-400 flex items-center justify-center shadow-sm">
                                    <TrendingUp size={20} />
                                </div>
                                <div>
                                    <h4 className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Total Views</h4>
                                    <p className="font-bold text-slate-800 dark:text-slate-100 leading-none">48,568</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-500 dark:text-blue-400 flex items-center justify-center shadow-sm">
                                    <DollarSign size={20} />
                                </div>
                                <div>
                                    <h4 className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Avg Session</h4>
                                    <p className="font-bold text-slate-800 dark:text-slate-100 leading-none">38m</p>
                                </div>
                            </div>
                            <button className="w-full py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition-colors text-sm shadow-md shadow-blue-500/20">
                                View Report
                            </button>
                        </div>
                    </div>
                </div>

                {/* Total Sales / System Status */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="text-slate-600 dark:text-slate-300 font-medium text-[15px]">System Load</p>
                                <p className="text-slate-400 dark:text-slate-500 text-xs mt-0.5">Calculated in last 7 days</p>
                            </div>
                            <button className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-400"><MoreVertical size={20} /></button>
                        </div>
                        <div className="flex items-center justify-between mt-4">
                            <div className="flex flex-col">
                                <span className="text-emerald-500 text-sm font-semibold flex items-center mt-1">
                                    <ArrowUpRight size={16} /> Optimal
                                </span>
                            </div>

                            {/* Clean CSS Circular Progress */}
                            <div className="relative w-20 h-20">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="40" cy="40" r="32" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-100" />
                                    <circle cx="40" cy="40" r="32" stroke="currentColor" strokeWidth="6" fill="transparent"
                                        strokeDasharray={200} strokeDashoffset={200 - (200 * 28) / 100}
                                        className="text-blue-500 drop-shadow-md" />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Activity size={24} className="text-blue-500" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 lg:hidden flex-col justify-between">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-500 flex items-center justify-center shrink-0">
                                <BookOpen size={20} />
                            </div>
                            <button className="text-slate-400 hover:text-slate-600"><MoreVertical size={20} /></button>
                        </div>
                        <div>
                            <p className="text-slate-500 font-medium text-[15px] mb-1">Classes Synced</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl font-bold text-slate-800">{classesCount || "--"}</h3>
                                <span className="text-emerald-500 text-sm font-semibold flex items-center">
                                    <ArrowUpRight size={16} /> +38%
                                </span>
                            </div>
                            <p className="text-slate-400 text-xs mt-1">Daily Syncs</p>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default AdminDashboardHome;
