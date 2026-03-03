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
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import defaultProfileImg from "../../assets/gojo-prof.jpg";

import studentHubLogo from "../../assets/StudentHub-logo.png";

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
    onBack
}) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
    const [showTranslate, setShowTranslate] = useState(false);

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
    ];

    const dbItems = [
        { id: "db-reset", label: "Global System Reset", icon: Activity },
        { id: "db-del-holidays", label: "Delete Holiday List", icon: Trash2 },
        { id: "db-del-classes", label: "Delete Classes", icon: Trash2 },
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
                <header className="px-4 sm:px-6 py-3 sm:py-4 xl:px-8 mt-2 sm:mt-4 z-30 relative">
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
                            <div className="hidden sm:flex items-center gap-1">
                                <button
                                    onClick={handleTranslate}
                                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 active:scale-95 rounded-full transition-all"
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
                                    className={cn("p-2 hover:bg-slate-50 active:scale-95 rounded-full transition-all", activeTab === 'dashboard' ? "text-indigo-600 bg-indigo-50" : "text-slate-500 hover:text-indigo-600")}
                                    title="Quick Dashboard"
                                >
                                    <LayoutDashboard size={22} />
                                </button>
                                <button
                                    onClick={() => alert("No new system notifications.")}
                                    className="relative p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 active:scale-95 rounded-full transition-all"
                                    title="Notifications"
                                >
                                    <Bell size={22} />
                                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 border-2 border-white rounded-full animate-pulse"></span>
                                </button>
                            </div>

                            {/* Profile Dropdown Toggle */}
                            <div className="relative ml-1 sm:ml-2">
                                <button
                                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                                    className="flex items-center focus:outline-none"
                                >
                                    <div className="w-10 h-10 rounded-full border-2 border-white flex items-center justify-center text-indigo-600 shadow-sm relative overflow-hidden bg-slate-100">
                                        <img
                                            src={userPhoto || defaultProfileImg}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                                    </div>
                                </button>

                                {/* Profile Popup */}
                                {isProfileMenuOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 border flex items-center justify-center shrink-0 overflow-hidden">
                                                <img
                                                    src={userPhoto || defaultProfileImg}
                                                    alt="Profile"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-semibold text-slate-800 text-sm truncate">{userName || "Admin User"}</p>
                                                <p className="text-slate-500 text-xs truncate">{userEmail || "admin@studenthub.com"}</p>
                                            </div>
                                        </div>

                                        <div className="p-2 flex flex-col">
                                            <button
                                                onClick={() => {
                                                    setActiveTab('profile');
                                                    setIsProfileMenuOpen(false);
                                                }}
                                                className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors text-left"
                                            >
                                                <User size={16} /> My Profile
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setActiveTab('settings');
                                                    setIsProfileMenuOpen(false);
                                                }}
                                                className="flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors text-left"
                                            >
                                                <SettingsIcon size={16} /> Settings
                                            </button>
                                        </div>

                                        <div className="p-2 border-t border-slate-100">
                                            <button
                                                onClick={onLogout}
                                                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors font-medium"
                                            >
                                                <LogOut size={16} />
                                                Logout
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Profile menu background overlay */}
                                {isProfileMenuOpen && (
                                    <div
                                        className="fixed inset-0 z-40 hidden sm:block"
                                        onClick={() => setIsProfileMenuOpen(false)}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
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
