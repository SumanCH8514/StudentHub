import React, { useState } from "react";
import {
    ClipboardCheck,
    Search,
    LayoutGrid,
    Calendar,
    AlertCircle,
    TrendingUp,
    BookOpen,
    ArrowLeft,
    ChevronRight,
    TrendingDown,
} from "lucide-react";
import { twMerge } from "tailwind-merge";
import { clsx } from "clsx";

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const Attendance = ({ onBack, showBack = true, hideSpacing = false, classes = [] }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState("subject-wise");
    const [selectedMonth, setSelectedMonth] = useState("All Months");
    const [selectedSubject, setSelectedSubject] = useState("All Subjects");

    // Extract unique subjects from class routine
    const liveSubjects = Array.from(new Set(classes.map(c => c.subject))).filter(Boolean);

    // Mock Data for Attendance Stats (Placeholder until actual attendance logic is added)
    const attendanceStats = {
        overall: liveSubjects.length > 0 ? 76 : 0,
        presentDays: liveSubjects.length > 0 ? 32 : 0,
        absentDays: liveSubjects.length > 0 ? 10 : 0,
        totalClasses: liveSubjects.length > 0 ? 42 : 0,
    };

    // Construct subjectAttendance from live data
    const subjectAttendance = liveSubjects.map((name, idx) => {
        // Predictable mock percentages/stats based on subject name length for stability
        const seed = name.length;
        const percentage = 60 + (seed % 35);
        const total = 10 + (seed % 10);
        const present = Math.floor((percentage / 100) * total);
        const absent = total - present;

        return {
            id: idx + 1,
            name,
            percentage,
            present,
            absent,
            total
        };
    });

    // Generate dateRecords using live subjects if available
    const dateRecords = liveSubjects.length > 0
        ? [
            { date: "27 Feb 2026", subject: liveSubjects[0], day: "Friday", status: "Present" },
            { date: "27 Feb 2026", subject: liveSubjects[1 % liveSubjects.length], day: "Friday", status: "Present" },
            { date: "27 Feb 2026", subject: liveSubjects[2 % liveSubjects.length], day: "Friday", status: "Absent" },
            { date: "26 Feb 2026", subject: liveSubjects[2 % liveSubjects.length], day: "Thursday", status: "Present" },
            { date: "26 Feb 2026", subject: liveSubjects[3 % liveSubjects.length], day: "Thursday", status: "Present" },
            { date: "26 Feb 2026", subject: liveSubjects[0], day: "Thursday", status: "Present" },
            { date: "25 Feb 2026", subject: liveSubjects[1 % liveSubjects.length], day: "Wednesday", status: "Present" },
        ]
        : [];

    const filteredSubjects = subjectAttendance.filter((s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredRecords = dateRecords.filter((record) => {
        const matchesQuery = record.subject.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesMonth = selectedMonth === "All Months" || record.date.includes(selectedMonth);
        const matchesSubject = selectedSubject === "All Subjects" || record.subject === selectedSubject;
        return matchesQuery && matchesMonth && matchesSubject;
    });

    const getProgressColor = (percent) => {
        if (percent < 40) return "bg-rose-500";
        if (percent < 75) return "bg-amber-500";
        return "bg-emerald-500";
    };

    const getPercentTextColor = (percent) => {
        if (percent < 40) return "text-rose-600";
        if (percent < 75) return "text-amber-600";
        return "text-emerald-600";
    };

    return (
        <div className={cn("min-h-screen bg-[#f4f7fc] dark:bg-slate-900 pb-12 animate-in fade-in duration-500", hideSpacing && "min-h-0 bg-transparent")}>
            {/* Header Container */}
            <div className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", hideSpacing ? "pt-0" : "pt-6")}>
                {/* Centered Navigation & Title */}
                <div className="flex flex-col items-center mb-10 animate-in fade-in slide-in-from-top-6 duration-700">
                    {showBack && (
                        <div className="w-full flex justify-start mb-4">
                            <button
                                type="button"
                                onClick={onBack}
                                className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-slate-500 hover:text-indigo-600 transition-all active:scale-95 border border-slate-100 dark:border-slate-700"
                            >
                                <ArrowLeft size={20} />
                            </button>
                        </div>
                    )}

                    <div className="flex flex-col items-center text-center">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center shadow-inner shadow-indigo-200/50 dark:shadow-none animate-bounce">
                                <ClipboardCheck size={20} className="text-indigo-600" />
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                Attendance Details
                            </h1>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-bold text-sm max-w-md">
                            Comprehensive view of your attendance records
                        </p>
                    </div>
                </div>

                {/* Overview Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-150 fill-mode-both">
                    {/* Overall Attendance */}
                    <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30 rounded-3xl p-6 flex flex-col items-center text-center shadow-sm">
                        <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mb-1">
                            {attendanceStats.overall}%
                        </span>
                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-emerald-500 opacity-80">
                            Overall Attendance
                        </span>
                    </div>

                    {/* Present Days */}
                    <div className="bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/30 rounded-3xl p-6 flex flex-col items-center text-center shadow-sm">
                        <span className="text-3xl font-black text-purple-600 dark:text-purple-400 mb-1">
                            {attendanceStats.presentDays}
                        </span>
                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-purple-500 opacity-80">
                            Present Days
                        </span>
                    </div>

                    {/* Absent Days */}
                    <div className="bg-rose-50/50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 rounded-3xl p-6 flex flex-col items-center text-center shadow-sm">
                        <span className="text-3xl font-black text-rose-600 dark:text-rose-400 mb-1">
                            {attendanceStats.absentDays}
                        </span>
                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-rose-500 opacity-80">
                            Absent Days
                        </span>
                    </div>

                    {/* Total Classes */}
                    <div className="bg-sky-50/50 dark:bg-sky-900/10 border border-sky-100 dark:border-sky-900/30 rounded-3xl p-6 flex flex-col items-center text-center shadow-sm">
                        <span className="text-3xl font-black text-sky-600 dark:text-sky-400 mb-1">
                            {attendanceStats.totalClasses}
                        </span>
                        <span className="text-[10px] sm:text-xs font-black uppercase tracking-widest text-sky-500 opacity-80">
                            Total Classes
                        </span>
                    </div>
                </div>

                {/* Main Content Card */}
                <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-white dark:border-slate-700 overflow-hidden mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both">
                    {/* Tabs - Exact Reference Style */}
                    <div className="flex border-b border-slate-200 dark:border-slate-700 h-14 sm:h-16">
                        <button
                            type="button"
                            onClick={() => setActiveTab("subject-wise")}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 font-bold text-[13px] sm:text-[14px] transition-all duration-300 border-r border-slate-200 dark:border-slate-700",
                                activeTab === "subject-wise"
                                    ? "bg-emerald-700 text-white"
                                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700"
                            )}
                        >
                            <LayoutGrid size={18} className={activeTab === "subject-wise" ? "text-emerald-100" : "text-emerald-500"} />
                            <span>Subject-wise</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("date-wise")}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 font-bold text-[13px] sm:text-[14px] transition-all duration-300",
                                activeTab === "date-wise"
                                    ? "bg-emerald-700 text-white shadow-inner"
                                    : "bg-white dark:bg-slate-800 text-slate-700 dark:text-white"
                            )}
                        >
                            <Calendar size={18} className={activeTab === "date-wise" ? "text-emerald-100" : "text-emerald-500"} />
                            <span>Date-wise</span>
                        </button>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6 sm:p-10">
                        {activeTab === "subject-wise" ? (
                            <div className="space-y-12">
                                {/* Header Controls Row */}
                                <div className="flex flex-col sm:flex-row items-center justify-between gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                                    {/* Search Bar - Reduced Size */}
                                    <div className="relative group w-full sm:max-w-[280px] order-2 sm:order-1">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <Search
                                                size={16}
                                                className="text-slate-400 group-focus-within:text-emerald-500 transition-colors"
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search subjects..."
                                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 transition-all font-medium text-xs dark:text-white shadow-sm"
                                        />
                                    </div>

                                    {/* Title Section - Aligned Right on Desktop */}
                                    <div className="flex flex-col items-center sm:items-end text-center sm:text-right order-1 sm:order-2">
                                        <div className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 rounded-full border border-indigo-100 dark:border-indigo-800/50 mb-2 shadow-sm shadow-indigo-100/50 dark:shadow-none">
                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-400">Live Statistics</p>
                                        </div>
                                        <h3 className="text-xl font-black text-slate-800 dark:text-white tracking-tight">
                                            Subject-wise Attendance
                                        </h3>
                                        <div className="w-12 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent sm:from-indigo-400/50 sm:via-transparent sm:to-transparent mt-1.5 opacity-50" />
                                    </div>
                                </div>

                                {/* Subject Cards Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredSubjects.length > 0 ? (
                                        filteredSubjects.map((subject, idx) => (
                                            <div
                                                key={subject.id}
                                                className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 p-6 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1.5 transition-all duration-500 animate-in fade-in slide-in-from-bottom-4 group"
                                                style={{ animationDelay: `${idx * 50}ms`, transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)" }}
                                            >
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="min-w-0 flex-1 pr-2">
                                                        <h4 className="text-[14px] font-black text-slate-800 dark:text-white leading-tight mb-1 truncate group-hover:text-indigo-600 transition-colors">
                                                            {subject.name}
                                                        </h4>
                                                        <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                            <BookOpen size={10} className="group-hover:text-indigo-400" />
                                                            Code: {subject.id}
                                                        </div>
                                                    </div>
                                                    <span
                                                        className={cn(
                                                            "text-lg font-black tracking-tight",
                                                            getPercentTextColor(subject.percentage)
                                                        )}
                                                    >
                                                        {subject.percentage}%
                                                    </span>
                                                </div>

                                                {/* Progress Bar */}
                                                <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-6 shadow-inner">
                                                    <div
                                                        className={cn(
                                                            "h-full rounded-full transition-all duration-1000 ease-out",
                                                            getProgressColor(subject.percentage)
                                                        )}
                                                        style={{ width: `${subject.percentage}%` }}
                                                    />
                                                </div>

                                                {/* Stats Row */}
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div className="flex flex-col items-center p-2.5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100/50 dark:border-slate-800 rounded-2xl group-hover:bg-emerald-50/20 transition-colors">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Present</span>
                                                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">{subject.present}</span>
                                                    </div>
                                                    <div className="flex flex-col items-center p-2.5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100/50 dark:border-slate-800 rounded-2xl group-hover:bg-rose-50/20 transition-colors">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Absent</span>
                                                        <span className="text-sm font-black text-rose-600 dark:text-rose-400">{subject.absent}</span>
                                                    </div>
                                                    <div className="flex flex-col items-center p-2.5 bg-slate-50/50 dark:bg-slate-900/50 border border-slate-100/50 dark:border-slate-800 rounded-2xl group-hover:bg-indigo-50/20 transition-colors">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter mb-0.5">Total</span>
                                                        <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{subject.total}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-span-full py-20 flex flex-col items-center justify-center bg-white/50 dark:bg-slate-800/50 rounded-[3rem] border border-dashed border-slate-300 dark:border-slate-700 animate-in fade-in zoom-in-95 duration-500">
                                            <BookOpen size={48} className="text-slate-300 dark:text-slate-700 mb-4" />
                                            <p className="text-slate-500 dark:text-slate-400 font-bold">No subjects found in your routine</p>
                                            <p className="text-slate-400 dark:text-slate-500 text-xs mt-1">Upload a routine to start tracking attendance</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8 animate-in fade-in duration-700">
                                {/* Filters Row - Single Row Layout */}
                                <div className="flex flex-col sm:flex-row items-center gap-3">
                                    {/* Search Bar */}
                                    <div className="relative group flex-[2] w-full">
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Search subjects..."
                                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 transition-all font-medium text-xs dark:text-white shadow-sm"
                                        />
                                    </div>

                                    {/* Month Filter */}
                                    <div className="flex-1 w-full">
                                        <select
                                            value={selectedMonth}
                                            onChange={(e) => setSelectedMonth(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 transition-all font-medium text-xs dark:text-white appearance-none cursor-pointer shadow-sm"
                                        >
                                            <option>All Months</option>
                                            <option>January</option>
                                            <option>February</option>
                                            <option>March</option>
                                        </select>
                                    </div>

                                    {/* Subject Filter */}
                                    <div className="flex-1 w-full">
                                        <select
                                            value={selectedSubject}
                                            onChange={(e) => setSelectedSubject(e.target.value)}
                                            className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:border-emerald-500 transition-all font-medium text-xs dark:text-white appearance-none cursor-pointer shadow-sm"
                                        >
                                            <option>All Subjects</option>
                                            {subjectAttendance.map(s => (
                                                <option key={s.id} value={s.name}>{s.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center text-center">
                                    <h3 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">
                                        Date-wise Attendance Records
                                    </h3>
                                </div>

                                {/* Records Table */}
                                <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                                    <div className="max-h-[500px] overflow-y-auto overflow-x-auto scrollbar-thin">
                                        <table className="w-full text-left border-collapse">
                                            <thead className="sticky top-0 z-10">
                                                <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                                                    <th className="w-[30%] px-2 sm:px-4 py-4 text-[11px] font-bold text-slate-500 uppercase text-center">Date</th>
                                                    <th className="w-[45%] px-2 sm:px-4 py-4 text-[11px] font-bold text-slate-500 uppercase text-center">Subject</th>
                                                    <th className="w-[25%] px-2 sm:px-4 py-4 text-[11px] font-bold text-slate-500 uppercase text-center">Status</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                                {filteredRecords.map((record, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                                                        <td className="px-2 sm:px-4 py-5 text-[11px] sm:text-[13px] font-bold text-slate-600 dark:text-slate-300 text-center whitespace-nowrap">{record.date}</td>
                                                        <td className="px-2 sm:px-4 py-5 text-[11px] sm:text-[13px] font-bold text-slate-800 dark:text-white text-center leading-tight">{record.subject}</td>
                                                        <td className="px-2 sm:px-4 py-5 text-center">
                                                            <span className={cn(
                                                                "px-2 sm:px-4 py-1.5 rounded-full text-[10px] sm:text-[11px] font-black tracking-tighter inline-block",
                                                                record.status === "Present"
                                                                    ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30"
                                                                    : "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30"
                                                            )}>
                                                                {record.status}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Insights Section */}
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-500 fill-mode-both">
                    <div className="flex items-center gap-3 px-2">
                        <TrendingUp size={18} className="text-indigo-500" />
                        <h2 className="text-slate-800 dark:text-white font-black text-sm uppercase tracking-widest">
                            Quick Insights
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Attendance Status */}
                        <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 p-8 flex flex-col items-center text-center group transition-all">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                                Attendance Status
                            </span>
                            <div className="flex items-center gap-2 text-rose-500 bg-rose-50 dark:bg-rose-900/20 px-4 py-2 rounded-full border border-rose-100 dark:border-rose-900/30">
                                <AlertCircle size={16} />
                                <span className="text-[11px] font-black uppercase tracking-tight">
                                    Below minimum requirement
                                </span>
                            </div>
                        </div>

                        {/* Best Subject */}
                        <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 p-8 flex flex-col items-center text-center group transition-all">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                                Best Subject
                            </span>
                            <span className="text-[13px] font-black text-emerald-600 dark:text-emerald-400 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-full border border-emerald-100 dark:border-emerald-900/30 uppercase tracking-tight truncate max-w-full">
                                {subjectAttendance.length > 0 ? subjectAttendance.reduce((a, b) => a.percentage > b.percentage ? a : b).name : "N/A"}
                            </span>
                        </div>

                        {/* Total Subjects */}
                        <div className="bg-white dark:bg-slate-800 rounded-[2rem] border border-slate-100 dark:border-slate-700 p-8 flex flex-col items-center text-center group transition-all">
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                                Total Subjects
                            </span>
                            <div className="flex flex-col">
                                <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                                    {liveSubjects.length} subjects
                                </span>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Tracked in system
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Attendance;
