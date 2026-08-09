import React, { useState } from "react";
import {
    Search,
    Menu,
    Bell,
    User,
    Settings as SettingsIcon,
    LogOut,
    X,
    LayoutDashboard,
    Users,
    FileSignature,
    AlignLeft,
    Moon,
    Sun,
    Globe,
    Activity,
    Upload,
    CalendarDays,
    ClipboardList,
    Trash2,
    MessageSquareText,
    MessageCircleQuestion,
    History,
    Settings as Settings2,
    CheckCircle2,
    Files,
    CalendarRange,
    FileText,
    BookOpen
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import defaultProfileImg from "../../assets/gojo-prof.jpg";

import studentHubLogo from "../../assets/StudentHub-logo1.png";

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const AdminLayout = ({
    children,
    activeTab,
    setActiveTab,
    userName,
    userEmail,
    userPhoto,
    onLogout,
    onBack,
    notifications = [],
    onMarkNotificationRead,
    currentUserId
}) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [isNotificationsMenuOpen, setIsNotificationsMenuOpen] = useState(false);
    const [showTranslate, setShowTranslate] = useState(false);

    // Calculate unread
    const unreadCount = notifications.filter(n => !n.readBy?.includes(currentUserId)).length;

    const handleDarkMode = () => {
        document.documentElement.classList.toggle('dark');
    };

    const handleTranslate = () => {
        setShowTranslate(!showTranslate);
        if (!document.getElementById('google-translate-script')) {
            const addScript = document.createElement('script');
            addScript.id = 'google-translate-script';
            addScript.setAttribute('src', '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit');
            document.body.appendChild(addScript);

            window.googleTranslateElementInit = () => {
                new window.google.translate.TranslateElement({
                    pageLanguage: 'en',
                    includedLanguages: 'en,bn,hi',
                    layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE
                }, 'google_translate_element');
            };
        }
    };

    const navItems = [
        { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
        { id: "students", label: "Student Details", icon: Users },
        { id: "results", label: "Results", icon: FileSignature },
        { id: "settings", label: "Settings", icon: SettingsIcon },
        { id: "system-status", label: "System Status", icon: Activity },
        { id: "updates", label: "Updates", icon: Bell },
    ];

    const uploadItems = [
        { id: "upload-holidays", label: "Upload Holiday List", icon: CalendarDays },
        { id: "upload-routine", label: "Class Routine", icon: ClipboardList },
        { id: "upload-exam", label: "Exam Time Routine", icon: CalendarRange },
        { id: "upload-forms", label: "Forms Link", icon: Files },
        { id: "upload-question-papers", label: "QuestionPapers Link", icon: FileText },
        { id: "upload-study-materials", label: "Study Materials Link", icon: BookOpen },
    ];

    const aiItems = [
        { id: "ai-queries", label: "Assistant Queries", icon: MessageCircleQuestion },
        { id: "ai-qa", label: "Assistant Q&A", icon: MessageSquareText },
        { id: "ai-history", label: "Assistant Chat History", icon: History },
        { id: "ai-settings", label: "Assistant Settings", icon: Settings2 },
    ];

    const dbItems = [
        { id: "db-reset", label: "Global System Reset", icon: Activity },
        { id: "db-del-holidays", label: "Delete Holiday List", icon: Trash2 },
        { id: "db-del-classes", label: "Delete Classes", icon: Trash2 },
    ];

    const supportItems = [
        { id: "support-tickets", label: "View Tickets", icon: MessageSquareText },
        { id: "support-settings", label: "Portal Settings", icon: Settings2 },
    ];

    return (
        <div className="min-h-screen flex bg-[#f5f5f9] dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans selection:bg-indigo-100 selection:text-indigo-700 transition-colors duration-300">
            {/* --- OVERLAY FOR MOBILE --- */}
            <div
                className={cn(
                    "fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 xl:hidden",
                    isSidebarOpen ? "opacity-100 visible" : "opacity-0 invisible"
                )}
                onClick={() => setIsSidebarOpen(false)}
            />

            {/* --- SIDEBAR --- */}
            <aside
                className={cn(
                    "fixed xl:sticky top-0 left-0 z-50 h-screen w-[260px] bg-[#282a42] dark:bg-[#1a1c2d] text-slate-300 flex flex-col transition-transform duration-300 shrink-0",
                    isSidebarOpen ? "translate-x-0" : "-translate-x-full xl:translate-x-0"
                )}
            >
                {/* LOGO AREA */}
                <div className="flex items-center justify-between px-6 py-5 h-[76px] shrink-0 w-full relative">
                    <div className="flex-1 flex items-center h-full">
                        <img
                            src={studentHubLogo}
                            alt="StudentHub Logo"
                            className="h-10 w-auto object-contain filter drop-shadow-[0_2px_8px_rgba(255,255,255,0.15)] transition-all hover:scale-105"
                        />
                    </div>
                    {/* Mobile close button */}
                    <button
                        onClick={() => setIsSidebarOpen(false)}
                        className="xl:hidden p-2 -mr-2 text-slate-400 hover:text-white transition-colors shrink-0"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* NAVIGATION LIST */}
                <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1 custom-scrollbar">
                    <p className="px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2 mt-2">
                        Apps & Pages
                    </p>

                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;

                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setActiveTab(item.id);
                                    setIsSidebarOpen(false);
                                }}
                                className={cn(
                                    "flex items-center justify-between px-4 py-2.5 rounded-lg transition-all duration-200 group text-[15px]",
                                    isActive
                                        ? "bg-gradient-to-r from-blue-500 to-blue-600 dark:from-indigo-600 dark:to-blue-600 text-white shadow-md shadow-blue-500/20 font-medium"
                                        : "text-slate-400 hover:text-white hover:bg-white/5 dark:hover:bg-white/10"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon size={20} className={cn("shrink-0", isActive ? "text-white" : "text-slate-400 group-hover:text-slate-300")} />
                                    <span>{item.label}</span>
                                </div>
                                {item.id === "dashboard" && (
                                    <span className={cn(
                                        "text-[11px] font-bold px-2 py-0.5 rounded-full",
                                        isActive ? "bg-white/20 text-white" : "bg-rose-500/20 text-rose-500"
                                    )}>
                                        5
                                    </span>
                                )}
                            </button>
                        )
                    })}

                    <div className="mt-8 px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                        Upload
                    </div>
                    {uploadItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;

                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setActiveTab(item.id);
                                    setIsSidebarOpen(false);
                                }}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-[15px] w-full text-left",
                                    isActive
                                        ? "bg-gradient-to-r from-blue-500 to-blue-600 dark:from-indigo-600 dark:to-blue-600 text-white shadow-md shadow-blue-500/20 font-medium"
                                        : "text-slate-400 hover:text-white hover:bg-white/5 dark:hover:bg-white/10"
                                )}
                            >
                                <Icon size={20} className={cn("shrink-0", isActive ? "text-white" : "text-slate-400")} />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}

                    <div className="mt-8 px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                        AI Assistant
                    </div>
                    {aiItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;

                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setActiveTab(item.id);
                                    setIsSidebarOpen(false);
                                }}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-[15px] w-full text-left group",
                                    isActive
                                        ? "bg-gradient-to-r from-emerald-500 to-emerald-600 dark:from-emerald-600 dark:to-emerald-600 text-white shadow-md shadow-emerald-500/20 font-medium"
                                        : "text-slate-400 hover:text-white hover:bg-white/5 dark:hover:bg-white/10"
                                )}
                            >
                                <Icon size={20} className={cn("shrink-0", isActive ? "text-white" : "text-emerald-400 group-hover:text-emerald-300")} />
                                <span className={isActive ? "text-white" : "group-hover:text-emerald-300"}>{item.label}</span>
                            </button>
                        );
                    })}

                    <div className="mt-8 px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                        Database
                    </div>
                    {dbItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;

                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setActiveTab(item.id);
                                    setIsSidebarOpen(false);
                                }}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-[15px] w-full text-left",
                                    isActive
                                        ? "bg-gradient-to-r from-rose-500 to-rose-600 dark:from-rose-600 dark:to-rose-600 text-white shadow-md shadow-rose-500/20 font-medium"
                                        : "text-slate-400 hover:text-white hover:bg-white/5 dark:hover:bg-white/10"
                                )}
                            >
                                <Icon size={20} className={cn("shrink-0", isActive ? "text-white" : "text-rose-400")} />
                                <span className={isActive ? "text-white" : "group-hover:text-rose-400"}>{item.label}</span>
                            </button>
                        );
                    })}

                    <div className="mt-8 px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                        Support Portal
                    </div>
                    {supportItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeTab === item.id;

                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    setActiveTab(item.id);
                                    setIsSidebarOpen(false);
                                }}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-[15px] w-full text-left group",
                                    isActive
                                        ? "bg-gradient-to-r from-amber-500 to-orange-600 dark:from-amber-600 dark:to-orange-600 text-white shadow-md shadow-amber-500/20 font-medium"
                                        : "text-slate-400 hover:text-white hover:bg-white/5 dark:hover:bg-white/10"
                                )}
                            >
                                <Icon size={20} className={cn("shrink-0", isActive ? "text-white" : "text-amber-400 group-hover:text-amber-300")} />
                                <span className={isActive ? "text-white" : "group-hover:text-amber-300"}>{item.label}</span>
                            </button>
                        );
                    })}

                    <div className="mt-8 px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
                        Main App
                    </div>
                    <button
                        onClick={onBack}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-slate-400 hover:text-white hover:bg-white/5 dark:hover:bg-white/10 text-[15px]"
                    >
                        <LogOut size={20} className="shrink-0" />
                        <span>Exit Admin</span>
                    </button>
                </div>
            </aside>

            {/* --- MAIN CONTENT AREA --- */}
            <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
                {/* TOP NAVBAR */}
                <header className="px-4 sm:px-6 py-3 sm:py-4 xl:px-8 mt-2 sm:mt-4 z-10 relative">
                    {/* Translate Dropdown Container */}
                    <div
                        id="google_translate_element"
                        className={cn(
                            "absolute top-[70px] right-8 bg-white p-2 rounded-xl shadow-lg border border-slate-200 z-50 transition-all",
                            showTranslate ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-2"
                        )}
                        style={{ minHeight: '40px', minWidth: '150px' }}
                    ></div>

                    <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 px-4 py-2 h-[62px] transition-colors duration-300">
                        {/* Left: Mobile Toggle & Search */}
                        <div className="flex items-center gap-3 flex-1">
                            <button
                                onClick={() => setIsSidebarOpen(true)}
                                className="xl:hidden p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition-colors"
                            >
                                <AlignLeft size={22} />
                            </button>

                            <div className="flex items-center gap-2 text-slate-400 focus-within:text-slate-700 w-full max-w-sm">
                                <Search size={20} className="shrink-0" />
                                <input
                                    type="text"
                                    placeholder="Search (Ctrl+/)"
                                    className="bg-transparent border-none outline-none w-full text-[15px] placeholder:text-slate-400 text-slate-700 dark:text-slate-200"
                                />
                            </div>
                        </div>

                        {/* Right: Actions & User Info */}
                        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
                            <div className="flex items-center gap-0.5 sm:gap-1">
                                <button
                                    onClick={handleTranslate}
                                    className="hidden sm:flex p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 active:scale-95 rounded-full transition-all"
                                    title="Language"
                                >
                                    <Globe size={22} />
                                </button>
                                <button
                                    onClick={handleDarkMode}
                                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 active:scale-95 rounded-full transition-all"
                                    title="Toggle Theme"
                                >
                                    <Moon size={22} />
                                </button>
                                <button
                                    onClick={() => setActiveTab('dashboard')}
                                    className={cn("hidden sm:flex p-2 hover:bg-slate-50 active:scale-95 rounded-full transition-all", activeTab === 'dashboard' ? "text-indigo-600 bg-indigo-50" : "text-slate-500 hover:text-indigo-600")}
                                    title="Quick Dashboard"
                                >
                                    <LayoutDashboard size={22} />
                                </button>
                                <button
                                    onClick={() => {
                                        setIsNotificationsMenuOpen(!isNotificationsMenuOpen);
                                        setIsProfileMenuOpen(false);
                                    }}
                                    className="relative p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 active:scale-95 rounded-full transition-all"
                                    title="Notifications"
                                >
                                    <Bell size={22} />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 border-2 border-white rounded-full animate-pulse"></span>
                                    )}
                                </button>

                                {/* Profile Dropdown Toggle */}
                                <button
                                    onClick={() => {
                                        setIsProfileMenuOpen(!isProfileMenuOpen);
                                        setIsNotificationsMenuOpen(false);
                                    }}
                                    className="flex items-center focus:outline-none relative"
                                >
                                    <div className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-indigo-600 shadow-sm overflow-hidden bg-slate-100">
                                        <img
                                            src={userPhoto || defaultProfileImg}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full z-10"></span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Global Notifications Dropdown */}
                    {isNotificationsMenuOpen && (
                        <div className="absolute right-4 sm:right-6 xl:right-8 top-[calc(100%+12px)] w-80 sm:w-96 max-h-[70vh] flex flex-col bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                    <Bell size={16} className="text-indigo-500" />
                                    Notifications
                                </h3>
                                {unreadCount > 0 && (
                                    <span className="text-xs font-bold text-white bg-indigo-500 px-2 py-0.5 rounded-full">
                                        {unreadCount} New
                                    </span>
                                )}
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                                {notifications.length === 0 ? (
                                    <div className="text-center p-6 text-slate-500 text-sm">
                                        No notifications yet.
                                    </div>
                                ) : (
                                    notifications.map(notif => {
                                        const isUnread = !notif.readBy?.includes(currentUserId);
                                        return (
                                            <div key={notif.id} className={cn("p-3 rounded-lg flex gap-3 mb-1", isUnread ? "bg-indigo-50/50" : "hover:bg-slate-50 transition-colors")}>
                                                <div className={cn("w-2 h-2 rounded-full mt-2 shrink-0", isUnread ? "bg-indigo-500 animate-pulse" : "bg-slate-300")} />
                                                <div className="flex-1 min-w-0">
                                                    <p className={cn("text-sm", isUnread ? "font-bold text-slate-800" : "font-medium text-slate-700")}>{notif.title}</p>
                                                    <p className="text-xs text-slate-500 mt-0.5">{notif.message}</p>
                                                    <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                                                        {notif.timestamp?.toDate ? notif.timestamp.toDate().toLocaleString() : "Just now"}
                                                    </p>
                                                </div>
                                                {isUnread && (
                                                    <button
                                                        onClick={() => onMarkNotificationRead?.(notif.id)}
                                                        className="shrink-0 p-1.5 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-md transition-all self-center"
                                                        title="Mark as Read"
                                                    >
                                                        <CheckCircle2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                    )}

                    {/* Global Profile Dropdown (Anchored to Header Right) */}
                    {isProfileMenuOpen && (
                        <div className="absolute right-4 sm:right-6 xl:right-8 top-[calc(100%+12px)] w-64 sm:w-72 bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                                <div className="w-12 h-12 rounded-full bg-white border-2 border-indigo-100 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                                    <img
                                        src={userPhoto || defaultProfileImg}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="min-w-0">
                                    <p className="font-bold text-slate-800 text-[15px] truncate">{userName || "Admin User"}</p>
                                    <p className="text-slate-500 text-xs truncate">{userEmail || "admin@studenthub.com"}</p>
                                </div>
                            </div>

                            <div className="p-2 flex flex-col">
                                <button
                                    onClick={() => {
                                        setActiveTab('profile');
                                        setIsProfileMenuOpen(false);
                                    }}
                                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/80 rounded-lg transition-all text-left group"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
                                        <User size={18} className="group-hover:text-indigo-600" />
                                    </div>
                                    My Profile
                                </button>
                                <button
                                    onClick={() => {
                                        setActiveTab('settings');
                                        setIsProfileMenuOpen(false);
                                    }}
                                    className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50/80 rounded-lg transition-all text-left group"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center transition-colors">
                                        <SettingsIcon size={18} className="group-hover:text-indigo-600" />
                                    </div>
                                    Settings
                                </button>
                            </div>

                            <div className="p-3 border-t border-slate-100 bg-slate-50/30">
                                <button
                                    onClick={onLogout}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-all font-bold shadow-sm shadow-rose-100 border border-rose-100 active:scale-95"
                                >
                                    <LogOut size={16} />
                                    Logout Account
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Global Overlays */}
                    {isProfileMenuOpen && (
                        <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsProfileMenuOpen(false)} />
                    )}
                    {isNotificationsMenuOpen && (
                        <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsNotificationsMenuOpen(false)} />
                    )}
                </header>

                {/* PAGE CONTENT */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-6 xl:px-8 py-4 sm:py-6 relative z-0">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default AdminLayout;
