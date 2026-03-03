import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  doc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import {
  Trash2,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  Settings as SettingsIcon,
  Shield,
  Database,
  User,
  Mail,
  Phone,
  BookOpen,
  GraduationCap,
  Hash,
  Save,
  CheckCircle2,
  Camera,
  Search,
  Bell,
  Moon,
  Globe,
  LayoutDashboard,
  LogOut,
  X,
  AlignLeft,
  Activity,
  Users,
  FileSignature,
  Layers,
  Upload,
  ClipboardList,
  Film,
  Tv2,
  Gamepad2,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  BookMarked,
  FileQuestion,
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import defaultProfileImg from "../assets/gojo-prof.jpg";
import studentHubLogo from "../assets/StudentHub-logo.png";
import { onSnapshot, orderBy } from "firebase/firestore";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/* ─────────────────────────────────────────────────────────────────────────── */
/* Reusable input wrapper                                                       */
/* ─────────────────────────────────────────────────────────────────────────── */
const Field = ({ label, icon: Icon, children }) => (
  <div className="space-y-1.5">
    <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 ml-1">
      {label}
    </label>
    <div className="relative">
      {Icon && (
        <Icon
          size={16}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
      )}
      {children}
    </div>
  </div>
);

const inputCls = (hasIcon = true) =>
  cn(
    "w-full bg-[#f5f5f9] dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl py-3.5 pr-4 text-[14px] font-medium text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all",
    hasIcon ? "pl-11" : "pl-4",
  );

/* ─────────────────────────────────────────────────────────────────────────── */
/* Card wrapper identical to admin panel cards                                  */
/* ─────────────────────────────────────────────────────────────────────────── */
const Card = ({ children, className = "" }) => (
  <div
    className={cn(
      "bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden",
      className,
    )}
  >
    {children}
  </div>
);

const CardHeader = ({ icon: Icon, iconBg, iconColor, title, subtitle }) => (
  <div className="flex items-center gap-4 px-6 py-5 border-b border-slate-100 dark:border-slate-700">
    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", iconBg)}>
      <Icon size={20} className={iconColor} />
    </div>
    <div>
      <h3 className="font-semibold text-slate-800 dark:text-white text-[15px] leading-tight">{title}</h3>
      <p className="text-slate-500 dark:text-slate-400 text-[12px] mt-0.5">{subtitle}</p>
    </div>
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────── */
/* Main Component                                                               */
/* ─────────────────────────────────────────────────────────────────────────── */
const Settings = ({ onBack, onSync, initialTab = "profile", showMobileSidebar = false }) => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState("");
  const [saveStatus, setSaveStatus] = useState(null);
  const [hasSaved, setHasSaved] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(showMobileSidebar);
  const [activeNav, setActiveNav] = useState(initialTab);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [systemUpdates, setSystemUpdates] = useState([]);

  // Mark as Read Tracking
  const [readUpdates, setReadUpdates] = useState(() => {
    const saved = localStorage.getItem('studentHub_readUpdates');
    return saved ? JSON.parse(saved) : [];
  });

  const markUpdateAsRead = (id) => {
    const updated = [...readUpdates, id];
    setReadUpdates(updated);
    localStorage.setItem('studentHub_readUpdates', JSON.stringify(updated));
  };

  // Sycn state if props change (for deep linking from Dashboard)
  useEffect(() => {
    setActiveNav(initialTab);
    if (showMobileSidebar) setIsSidebarOpen(true);
  }, [initialTab, showMobileSidebar]);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phoneNumber: "",
    university: "SVU",
    customUniversity: "",
    stream: "B.Tech",
    customStream: "",
    semester: "1",
    section: "1",
    rollNumber: "",
    fetchShared: false,
    photoBase64: "",
    themePreference: "system",
  });

  const [holidays, setHolidays] = useState([]);
  const [loadingHolidays, setLoadingHolidays] = useState(false);
  const [showPassedHolidays, setShowPassedHolidays] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) { setFetching(false); return; }
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setFormData((prev) => ({
            ...prev,
            fullName: data.fullName || data.name || user.displayName || "",
            email: data.email || user.email || "",
            phoneNumber: data.phoneNumber || "",
            university: data.university || "SVU",
            customUniversity: data.customUniversity || "",
            stream: data.stream || "B.Tech",
            customStream: data.customStream || "",
            semester: data.semester || "1",
            section: data.section || "1",
            rollNumber: data.rollNumber || "",
            fetchShared: data.fetchShared ?? false,
            photoBase64: data.photoBase64 || "",
            themePreference: data.themePreference || "system",
          }));
          // Default the theme to 'system' logic if not set
          if (!data.themePreference) {
            setFormData(prev => ({ ...prev, themePreference: 'system' }));
          }
        } else {
          console.error("User profile not found in database."); // Using console.error as toast is not imported
        }
      } catch (err) {
        console.error("Failed to fetch profile: " + err.message); // Using console.error as toast is not imported
      } finally {
        setFetching(false); // Changed from setFetchingUser to setFetching
      }
    };

    fetchUserData();

    // Fetch System Updates
    const updatesRef = collection(db, "updates");
    const qUpdates = query(updatesRef, orderBy("createdAt", "desc"));
    const unsubscribeUpdates = onSnapshot(
      qUpdates,
      (snapshot) => {
        // Filter out read updates straight away
        const updates = snapshot.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .filter(update => !readUpdates.includes(update.id));
        setSystemUpdates(updates);
      },
      (error) => {
        if (error.code === "permission-denied") {
          console.warn("Settings updates fetch: Permission denied. Please check Firestore rules.");
        } else {
          console.error("Error fetching updates:", error);
        }
      }
    );

    return () => unsubscribeUpdates();

  }, []); // Removed user from dependency array as auth.currentUser is accessed directly

  useEffect(() => {
    const fetchHolidays = async () => {
      if (activeNav === "holidays" || activeNav === "all") {
        setLoadingHolidays(true);
        try {
          const snap = await getDocs(collection(db, "holidays"));
          const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          // Sort by date ideally
          list.sort((a, b) => new Date(a.date) - new Date(b.date));
          setHolidays(list);
        } catch (err) {
          console.error("Failed to fetch holidays", err);
        } finally {
          setLoadingHolidays(false);
        }
      }
    };
    fetchHolidays();
  }, [activeNav]);

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1024 * 1024) { alert("Image size exceeds 1 MB limit!"); return; }
    const reader = new FileReader();
    reader.onloadend = () => setFormData((prev) => ({ ...prev, photoBase64: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;
    setLoading(true); setSaveStatus(null); setMessage("");
    try {
      await setDoc(doc(db, "users", user.uid), { ...formData, updatedAt: new Date().toISOString() }, { merge: true });
      setSaveStatus("success"); setHasSaved(true); setMessage("Profile updated successfully!");
      setTimeout(() => setSaveStatus(null), 1000);
    } catch (err) {
      console.error("Save Error:", err);
      setSaveStatus("error"); setMessage("Failed to save changes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const deleteAllRoutines = async () => {
    const user = auth.currentUser;
    if (!user) return;
    if (!window.confirm("Are you sure? This will permanently delete ALL your uploaded routines.")) return;
    setLoading(true);
    try {
      const q = query(collection(db, "shared_routines"), where("userId", "==", user.uid));
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      setMessage("Your routine data has been cleared from the shared database.");
    } catch (err) {
      console.error("Delete Error:", err);
      setMessage("Failed to delete data.");
    } finally {
      setLoading(false);
    }
  };

  const accountItems = [
    { id: "profile", label: "My Profile", icon: User },
    { id: "academic", label: "Academic Info", icon: GraduationCap },
  ];

  const featureItems = [
    { id: "results", label: "Check Results", icon: ClipboardList },
    { id: "upload", label: "Upload Routine", icon: Upload },
    { id: "holidays", label: "Holiday List", icon: CalendarDays },
    { id: "materials", label: "Study Materials", icon: BookMarked },
    { id: "papers", label: "Question Papers", icon: FileQuestion },
  ];

  const settingsItems = [
    { id: "preferences", label: "Preferences", icon: Database },
    { id: "security", label: "Security & Data", icon: Shield },
  ];

  const serviceItems = [
    {
      id: "frontpage",
      label: "FrontPageMaker",
      desc: "Create beautiful assignment front pages",
      icon: FileSignature,
      color: "bg-violet-50 dark:bg-violet-900/20",
      iconColor: "text-violet-600",
      href: "https://plyr.0-0-0.click/FrontPageMaker",
    },
    {
      id: "movies",
      label: "Movie And Series Watch",
      desc: "Stream the latest movies and series online",
      icon: Film,
      color: "bg-rose-50 dark:bg-rose-900/20",
      iconColor: "text-rose-500",
      href: "https://movies.sumanonline.com/",
    },
    {
      id: "anime",
      label: "Anime Watch",
      desc: "Browse and stream anime series",
      icon: Tv2,
      color: "bg-amber-50 dark:bg-amber-900/20",
      iconColor: "text-amber-500",
      href: "https://movies.sumanonline.com/anime/index.html",
    },
    {
      id: "games",
      label: "Games",
      desc: "Play browser games during breaks",
      icon: Gamepad2,
      color: "bg-sky-50 dark:bg-sky-900/20",
      iconColor: "text-sky-500",
      href: "https://sumanonline.com/games",
    },
  ];

  /* ── Loading ── */
  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f5f9]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-blue-100 border-t-blue-500 animate-spin" />
          <p className="text-slate-400 font-semibold tracking-widest uppercase text-[11px]">Loading…</p>
        </div>
      </div>
    );
  }

  /* ── Main ── */
  return (
    <div className="min-h-screen flex bg-[#f5f5f9] dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans selection:bg-blue-100 selection:text-blue-700 transition-colors duration-300">

      {/* ── Mobile overlay ── */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 xl:hidden",
          isSidebarOpen ? "opacity-100 visible" : "opacity-0 invisible",
        )}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* ══════════════════════════════════════════════════════════════════════
          SIDEBAR — identical chrome to AdminLayout
      ══════════════════════════════════════════════════════════════════════ */}
      <aside
        className={cn(
          "fixed xl:sticky top-0 left-0 z-50 h-screen w-[260px] bg-[#282a42] dark:bg-[#1a1c2d] text-slate-300 flex flex-col transition-transform duration-300 shrink-0",
          isSidebarOpen ? "translate-x-0" : "-translate-x-full xl:translate-x-0",
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-6 py-5 h-[76px] shrink-0">
          <div className="flex-1 flex items-center h-full">
            <img
              src={studentHubLogo}
              alt="StudentHub Logo"
            />
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="xl:hidden p-2 -mr-2 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1 custom-scrollbar">
          <p className="px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Accounts & Profile Info
          </p>

          {accountItems.map(({ id, label, icon: Icon }) => {
            const isActive = activeNav === id;
            return (
              <button
                key={id}
                onClick={() => { setActiveNav(id); setIsSidebarOpen(false); }}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-[14px] w-full text-left",
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/20 font-medium"
                    : "text-slate-400 hover:text-white hover:bg-white/5",
                )}
              >
                <Icon size={19} className={cn("shrink-0", isActive ? "text-white" : "text-slate-400")} />
                {label}
              </button>
            );
          })}

          <div className="mt-6 px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
            StudentHub Features
          </div>
          {featureItems.map(({ id, label, icon: Icon }) => {
            const isActive = activeNav === id;
            return (
              <button
                key={id}
                onClick={() => { setActiveNav(id); setIsSidebarOpen(false); }}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-[14px] w-full text-left",
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/20 font-medium"
                    : "text-slate-400 hover:text-white hover:bg-white/5",
                )}
              >
                <Icon size={19} className={cn("shrink-0", isActive ? "text-white" : "text-slate-400")} />
                {label}
              </button>
            );
          })}

          <div className="mt-6 px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Settings
          </div>
          {settingsItems.map(({ id, label, icon: Icon }) => {
            const isActive = activeNav === id;
            return (
              <button
                key={id}
                onClick={() => { setActiveNav(id); setIsSidebarOpen(false); }}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-[14px] w-full text-left",
                  isActive
                    ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/20 font-medium"
                    : "text-slate-400 hover:text-white hover:bg-white/5",
                )}
              >
                <Icon size={19} className={cn("shrink-0", isActive ? "text-white" : "text-slate-400")} />
                {label}
              </button>
            );
          })}

          <div className="mt-6 px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Notifications
          </div>
          <button
            onClick={() => {
              setIsNotificationsOpen(true);
              setIsSidebarOpen(false);
            }}
            className="flex items-center justify-between px-4 py-2.5 rounded-lg transition-all duration-200 text-[14px] w-full text-left text-slate-400 hover:text-white hover:bg-white/5"
          >
            <div className="flex items-center gap-3">
              <Bell size={19} className="shrink-0 text-slate-400" />
              <span>Updates & Alerts</span>
            </div>
            {systemUpdates.length > 0 && (
              <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-black">
                {systemUpdates.length}
              </span>
            )}
          </button>

          <div className="mt-6 px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Other
          </div>
          <button
            onClick={() => { setActiveNav("services"); setIsSidebarOpen(false); }}
            className={cn(
              "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-[14px] w-full text-left",
              activeNav === "services"
                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md shadow-blue-500/20 font-medium"
                : "text-slate-400 hover:text-white hover:bg-white/5",
            )}
          >
            <Layers size={19} className={cn("shrink-0", activeNav === "services" ? "text-white" : "text-slate-400")} />
            Services
          </button>

          <div className="mt-6 px-4 text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Navigation
          </div>
          <button
            onClick={() => { if (hasSaved) { window.location.reload(); } else { onBack(); } }}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 text-[14px] w-full text-left transition-all"
          >
            <ArrowLeft size={19} className="shrink-0" />
            Back to Dashboard
          </button>
        </div>

        {/* Profile mini card at bottom */}
        <div className="px-4 py-4 border-t border-white/5 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 border border-white/10">
            <img
              src={formData.photoBase64 || defaultProfileImg}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="min-w-0">
            <p className="text-slate-300 text-[13px] font-semibold truncate">{formData.fullName || "User"}</p>
            <p className="text-slate-500 text-[11px] truncate">{formData.email}</p>
          </div>
        </div>
      </aside>

      {/* ══════════════════════════════════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════════════════════════════════ */}
      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">

        {/* Top navbar bar — same as admin panel */}
        <header className="px-4 sm:px-6 py-3 sm:py-4 xl:px-8 mt-2 sm:mt-4 z-30 relative shrink-0">
          <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 px-4 py-2 h-[62px]">
            {/* Left: mobile toggle + search */}
            <div className="flex items-center gap-3 flex-1">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="xl:hidden p-2 text-slate-500 hover:text-slate-800 transition-colors"
              >
                <AlignLeft size={22} />
              </button>
              <div className="flex items-center gap-2 text-slate-400 focus-within:text-slate-700 w-full max-w-sm">
                <Search size={18} className="shrink-0" />
                <input
                  type="text"
                  placeholder="Search settings…"
                  className="bg-transparent border-none outline-none w-full text-[14px] placeholder:text-slate-400 text-slate-700 dark:text-slate-200"
                />
              </div>
            </div>

            {/* Right: icons + profile */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-full transition-all"
                title="Toggle theme"
                onClick={() => document.documentElement.classList.toggle("dark")}
              >
                <Moon size={20} />
              </button>
              <div className="relative">
                <button
                  onClick={() => { setIsNotificationsOpen(!isNotificationsOpen); setIsProfileMenuOpen(false); }}
                  className="relative p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-full transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  <Bell size={20} />
                  {systemUpdates.length > 0 && (
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 border-2 border-white rounded-full animate-pulse" />
                  )}
                </button>

                {/* Notifications Dropdown */}
                {isNotificationsOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsNotificationsOpen(false)}
                    />
                    <div className="fixed left-4 right-4 sm:left-auto sm:right-4 top-[85px] sm:w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl shadow-slate-200/60 dark:shadow-slate-900/60 border border-slate-100 dark:border-slate-700 z-50 overflow-hidden animate-slide-in-down flex flex-col max-h-[400px]">
                      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                        <h3 className="font-bold text-slate-800 dark:text-white text-[14px]">Notifications</h3>
                        <span className="text-[10px] font-black bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded-full">{systemUpdates.length} New</span>
                      </div>
                      <div className="overflow-y-auto custom-scrollbar flex-1 p-2">
                        {systemUpdates.length > 0 ? (
                          <div className="space-y-1">
                            {systemUpdates.map((update) => (
                              <div key={update.id} className="p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex gap-3 items-start">
                                <div className={cn(
                                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                                  update.type === 'alert' ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-500' :
                                    update.type === 'statement' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-500' :
                                      'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500'
                                )}>
                                  <Bell size={14} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="text-[13px] font-bold text-slate-800 dark:text-white leading-tight mb-0.5">{update.title}</p>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation(); // prevent dropdown from closing if it has a click handler
                                        markUpdateAsRead(update.id);
                                        // Also filter it out from the current systemUpdates state immediately for snappy UI
                                        setSystemUpdates(prev => prev.filter(u => u.id !== update.id));
                                      }}
                                      className="p-1 -ml-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-md transition-colors shrink-0"
                                      title="Mark as Read"
                                    >
                                      <X size={14} />
                                    </button>
                                  </div>
                                  {update.description && (
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{update.description}</p>
                                  )}
                                  <p className="text-[10px] text-slate-400 font-medium mt-1">
                                    {update.createdAt ? new Date(update.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="py-8 text-center flex flex-col items-center">
                            <div className="w-10 h-10 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-2">
                              <CheckCircle2 size={16} className="text-slate-400" />
                            </div>
                            <p className="text-[12px] font-bold text-slate-600 dark:text-slate-400">All caught up!</p>
                            <p className="text-[11px] text-slate-500">No new notifications</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Profile avatar — clickable dropdown */}
              <div className="relative ml-1">
                <button
                  onClick={() => { setIsProfileMenuOpen(!isProfileMenuOpen); setIsNotificationsOpen(false); }}
                  className="w-9 h-9 rounded-full overflow-hidden border-2 border-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400"
                >
                  <img
                    src={formData.photoBase64 || defaultProfileImg}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </button>

                {isProfileMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsProfileMenuOpen(false)}
                    />
                    <div className="fixed left-4 right-4 sm:left-auto sm:right-4 sm:absolute sm:top-full sm:mt-2 top-[85px] sm:w-60 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl shadow-slate-200/60 dark:shadow-slate-900/60 border border-slate-100 dark:border-slate-700 z-50 overflow-hidden animate-slide-in-down">
                      {/* Header */}
                      <div className="flex items-center gap-3 px-4 py-4 border-b border-slate-100 dark:border-slate-700">
                        <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 border-2 border-slate-100 dark:border-slate-700">
                          <img src={formData.photoBase64 || defaultProfileImg} alt="Profile" className="w-full h-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 dark:text-white text-[14px] truncate">{formData.fullName || "User"}</p>
                          <p className="text-slate-500 dark:text-slate-400 text-[11px] truncate">{formData.email}</p>
                        </div>
                      </div>
                      {/* Links */}
                      <div className="p-2 flex flex-col">
                        <button
                          onClick={() => { setActiveNav("profile"); setIsProfileMenuOpen(false); }}
                          className="flex items-center gap-3 px-3 py-2.5 text-[13px] text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-colors text-left"
                        >
                          <User size={16} />
                          My Profile
                        </button>
                        <button
                          onClick={() => { setActiveNav("preferences"); setIsProfileMenuOpen(false); }}
                          className="flex items-center gap-3 px-3 py-2.5 text-[13px] text-slate-600 dark:text-slate-300 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-xl transition-colors text-left"
                        >
                          <SettingsIcon size={16} />
                          Settings
                        </button>
                      </div>
                      {/* Logout */}
                      <div className="p-2 border-t border-slate-100 dark:border-slate-700">
                        <button
                          onClick={() => { if (hasSaved) { window.location.reload(); } else { onBack(); } }}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 text-[13px] text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 rounded-xl transition-colors font-semibold"
                        >
                          <LogOut size={15} />
                          Back to Dashboard
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* ── Scrollable page content ── */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 xl:px-8 py-4 sm:py-6">

          {/* Page Title */}
          <div className="mb-6">
            {(() => {
              const headerMap = {
                profile: { title: "My", accent: "Profile", desc: "Your identity and contact details" },
                academic: { title: "Academic", accent: "Info", desc: "Manage your education and university details" },
                preferences: { title: "Application", accent: "Preferences", desc: "Personalize your dashboard experience" },
                security: { title: "Security &", accent: "Data", desc: "Manage sensitive account data and permissions" },
                results: { title: "Check", accent: "Results", desc: "View your semester exam results" },
                upload: { title: "Upload", accent: "Routine", desc: "Share your class schedule with the community" },
                holidays: { title: "Holiday", accent: "List", desc: "View upcoming university holiday schedules" },
                materials: { title: "Study", accent: "Materials", desc: "Access notes, e-books, and resources" },
                papers: { title: "Question", accent: "Papers", desc: "Browse previous year exam papers" },
                services: { title: "Other", accent: "Services", desc: "Quick access to SumanOnline tools and entertainment" },
                all: { title: "Account", accent: "Settings", desc: "Manage your academic profile and application preferences" }
              };
              const header = headerMap[activeNav] || headerMap.all;
              return (
                <>
                  <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
                    {header.title} <span className="text-blue-500">{header.accent}</span>
                  </h1>
                  <p className="text-slate-500 dark:text-slate-400 text-[13px] mt-1">
                    {header.desc}
                  </p>
                </>
              );
            })()}
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-5">

            {/* ── Personal Profile ── */}
            {(activeNav === "profile" || activeNav === "all") && (
              <Card>
                <CardHeader
                  icon={User}
                  iconBg="bg-blue-50 dark:bg-blue-900/30"
                  iconColor="text-blue-500"
                  title="Personal Profile"
                  subtitle="Your identity and contact details"
                />
                <div className="p-6 space-y-6">
                  {/* Avatar picker */}
                  <div className="flex items-center gap-5 p-5 bg-[#f5f5f9] dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700">
                    <div className="relative group shrink-0">
                      <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white dark:border-slate-700 shadow-md">
                        <img
                          src={formData.photoBase64 || defaultProfileImg}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <label className="absolute inset-0 flex items-center justify-center rounded-full bg-slate-900/50 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <Camera size={18} />
                        <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                      </label>
                    </div>
                    <div className="min-w-0 overflow-hidden">
                      <p className="font-semibold text-slate-800 dark:text-white text-[16px] truncate">{formData.fullName || "Your Name"}</p>
                      <p className="text-slate-500 dark:text-slate-400 text-[12px] mt-0.5 truncate">{formData.email}</p>
                      <p className="text-slate-400 text-[11px] uppercase tracking-wider mt-2 font-medium break-words">Hover avatar to change · 1MB max</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="Full Name" icon={User}>
                      <input type="text" name="fullName" value={formData.fullName} onChange={handleFieldChange} className={inputCls()} placeholder="Enter your full name" required />
                    </Field>
                    <Field label="Email Address" icon={Mail}>
                      <input type="email" name="email" value={formData.email} onChange={handleFieldChange} className={inputCls()} placeholder="name@university.edu" required />
                    </Field>
                    <Field label="Phone Number" icon={Phone}>
                      <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleFieldChange} className={inputCls()} placeholder="+91 XXXXX XXXXX" />
                    </Field>
                  </div>
                </div>
              </Card>
            )}

            {/* ── Academic Profile ── */}
            {(activeNav === "academic" || activeNav === "all") && (
              <Card>
                <CardHeader
                  icon={GraduationCap}
                  iconBg="bg-emerald-50 dark:bg-emerald-900/30"
                  iconColor="text-emerald-500"
                  title="Academic Profile"
                  subtitle="Your university and course details"
                />
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Field label="University / College" icon={BookOpen}>
                      <select name="university" value={formData.university} onChange={handleFieldChange} className={cn(inputCls(), "appearance-none")}>
                        <option value="SVU">SVU</option>
                        <option value="Regent">Regent</option>
                        <option value="Others">Others</option>
                      </select>
                    </Field>

                    {formData.university === "Others" && (
                      <Field label="Custom Institution">
                        <input type="text" name="customUniversity" value={formData.customUniversity} onChange={handleFieldChange} className={inputCls(false)} placeholder="Enter college name" required />
                      </Field>
                    )}

                    <Field label="Stream / Course" icon={GraduationCap}>
                      <select name="stream" value={formData.stream} onChange={handleFieldChange} className={cn(inputCls(), "appearance-none")}>
                        <option value="B.Tech">B.Tech</option>
                        <option value="BCA">BCA</option>
                        <option value="ANCS">ANCS</option>
                        <option value="DIPLOMA">DIPLOMA</option>
                        <option value="Other">Other</option>
                      </select>
                    </Field>

                    {formData.stream === "Other" && (
                      <Field label="Custom Stream">
                        <input type="text" name="customStream" value={formData.customStream} onChange={handleFieldChange} className={inputCls(false)} placeholder="Enter course name" required />
                      </Field>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Semester" icon={CalendarDays}>
                        <select name="semester" value={formData.semester} onChange={handleFieldChange} className={cn(inputCls(), "appearance-none text-center")}>
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => <option key={n} value={n}>Sem {n}</option>)}
                        </select>
                      </Field>
                      <Field label="Section" icon={Layers}>
                        <select name="section" value={formData.section} onChange={handleFieldChange} className={cn(inputCls(), "appearance-none text-center")}>
                          {(formData.stream === "B.Tech" ? [1, 2, 3, 4, 5, 6, 7, 8] : [1, 2, 3, 4]).map((n) => <option key={n} value={n}>Sec {n}</option>)}
                        </select>
                      </Field>
                    </div>

                    <Field label="Roll Number" icon={Hash}>
                      <input type="text" name="rollNumber" value={formData.rollNumber} onChange={handleFieldChange} className={inputCls()} placeholder="Registration / Roll No." />
                    </Field>
                  </div>
                </div>
              </Card>
            )}

            {/* ── App Preferences ── */}
            {(activeNav === "preferences" || activeNav === "all") && (
              <Card>
                <CardHeader
                  icon={Database}
                  iconBg="bg-indigo-50 dark:bg-indigo-900/30"
                  iconColor="text-indigo-500"
                  title="App Preferences"
                  subtitle="Customize how the app fetches data"
                />
                <div className="p-6">
                  <div className="flex items-center justify-between p-4 bg-[#f5f5f9] dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-blue-200 transition-colors">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-white text-[13px] uppercase tracking-wider">Fetch Routine Online</p>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 max-w-xs">Fetch schedule data from community-uploaded routines.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, fetchShared: !prev.fetchShared }))}
                      className={cn(
                        "relative inline-flex h-6 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 focus:outline-none",
                        formData.fetchShared ? "bg-blue-500" : "bg-slate-300 dark:bg-slate-600",
                      )}
                      style={{ width: "44px" }}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-300 ease-in-out",
                          formData.fetchShared ? "translate-x-[20px]" : "translate-x-0",
                        )}
                      />
                    </button>
                  </div>
                  <div className="flex items-center justify-between p-4 mt-3 bg-[#f5f5f9] dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-blue-200 transition-colors">
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-white text-[13px] uppercase tracking-wider">App Theme Default</p>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 max-w-xs">Always start the app in your preferred visual style.</p>
                    </div>
                    <select
                      name="themePreference"
                      value={formData.themePreference}
                      onChange={(e) => {
                        handleFieldChange(e);
                        const val = e.target.value;
                        const isDark = val === "dark" || (val === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
                        if (isDark) document.documentElement.classList.add("dark");
                        else document.documentElement.classList.remove("dark");
                      }}
                      className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium py-1.5 px-3 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none cursor-pointer min-w-[100px] text-center"
                    >
                      <option value="system">System</option>
                      <option value="light">Light mode</option>
                      <option value="dark">Dark mode</option>
                    </select>
                  </div>
                </div>
              </Card>
            )}
            {/* ── Check Results Placeholder ── */}
            {(activeNav === "results" || activeNav === "all") && (
              <Card>
                <CardHeader
                  icon={ClipboardList}
                  iconBg="bg-emerald-50 dark:bg-emerald-900/30"
                  iconColor="text-emerald-500"
                  title="Check Results"
                  subtitle="View and download your semester results"
                />
                <div className="w-full relative min-h-[75vh] md:min-h-[85vh] rounded-b-[2rem] overflow-hidden bg-slate-50 dark:bg-slate-900/50">
                  <iframe
                    src="https://sumanonline.com/studentHub/result/"
                    title="StudentHub Results Portal"
                    className="absolute top-0 left-0 w-full h-full border-0"
                    allowFullScreen
                  />
                </div>
              </Card>
            )}

            {/* ── Upload Routine Placeholder ── */}
            {(activeNav === "upload" || activeNav === "all") && (
              <Card>
                <CardHeader
                  icon={Upload}
                  iconBg="bg-blue-50 dark:bg-blue-900/30"
                  iconColor="text-blue-500"
                  title="Upload Routine"
                  subtitle="Contribute to the StudentHub community"
                />
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Upload size={32} className="text-blue-500" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Routine Sync Terminal</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto mb-6">You can upload your class routine directly from the Dashboard using the "Sync" button in the top bar.</p>
                  <button onClick={onSync} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm hover:bg-blue-700 transition-all">Start Routine Sync</button>
                </div>
              </Card>
            )}

            {/* ── Holiday List ── */}
            {(activeNav === "holidays" || activeNav === "all") && (
              <Card>
                <CardHeader
                  icon={CalendarDays}
                  iconBg="bg-rose-50 dark:bg-rose-900/30"
                  iconColor="text-rose-500"
                  title="Holiday List 2024-25"
                  subtitle="Official university holiday calendar"
                />

                <div className="p-6">
                  {loadingHolidays ? (
                    <div className="flex flex-col items-center justify-center py-10">
                      <Loader2 className="animate-spin text-rose-500 mb-4" size={32} />
                      <p className="text-slate-500 dark:text-slate-400 font-medium">Syncing calendar...</p>
                    </div>
                  ) : holidays.length > 0 ? (
                    (() => {
                      const todayStart = new Date();
                      todayStart.setHours(0, 0, 0, 0);

                      const upcomingHolidays = holidays.filter(h => new Date(h.date).setHours(0, 0, 0, 0) >= todayStart.getTime());
                      const passedHolidays = holidays.filter(h => new Date(h.date).setHours(0, 0, 0, 0) < todayStart.getTime());

                      const renderHoliday = (h, isPast) => {
                        const dateObj = new Date(h.date);
                        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                        const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });
                        const dateNum = dateObj.getDate();
                        const isToday = dateObj.setHours(0, 0, 0, 0) === todayStart.getTime();

                        return (
                          <div key={h.id} className={cn(
                            "flex items-center gap-4 p-4 rounded-2xl border transition-all relative overflow-hidden group",
                            isPast
                              ? "bg-slate-50 dark:bg-slate-800/20 border-slate-100 dark:border-slate-800/50 opacity-70 cursor-default"
                              : isToday
                                ? "bg-gradient-to-r from-rose-50/80 to-orange-50/80 dark:from-rose-900/10 dark:to-orange-900/10 border-rose-200/60 dark:border-rose-800/50 shadow-sm hover:shadow-md transition-all"
                                : "bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm hover:shadow-md transition-all"
                          )}>
                            {isToday && (
                              <div className="absolute top-0 right-0 w-16 h-16 pointer-events-none overflow-hidden z-0">
                                <div className="absolute top-[10px] right-[-30px] w-[100px] bg-gradient-to-r from-rose-500 to-orange-500 text-white text-[9px] font-bold py-1 text-center rotate-45 shadow-sm shadow-rose-500/30 tracking-widest uppercase">
                                  TODAY
                                </div>
                              </div>
                            )}
                            <div className={cn(
                              "w-14 h-14 rounded-xl flex flex-col items-center justify-center shrink-0 border relative z-10 transition-transform group-hover:scale-105",
                              isPast
                                ? "bg-slate-100 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-500"
                                : isToday
                                  ? "bg-gradient-to-br from-rose-500 to-orange-500 border-none text-white shadow-inner shadow-white/20"
                                  : "bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800/30 text-rose-600 dark:text-rose-400"
                            )}>
                              <span className={cn("text-[10px] font-bold uppercase tracking-widest", isToday ? "opacity-90" : "")}>{monthName}</span>
                              <span className="text-lg font-black leading-none mt-0.5">{dateNum}</span>
                            </div>
                            <div className="min-w-0 flex-1 relative z-10 pr-6">
                              <h4 className={cn(
                                "font-bold text-[15px] line-clamp-2 break-words leading-tight mb-1",
                                isPast ? "text-slate-500 dark:text-slate-400" : isToday ? "text-rose-900 dark:text-rose-100" : "text-slate-800 dark:text-slate-200"
                              )}>{h.occasion}</h4>
                              <p className={cn(
                                "text-[12px] font-medium",
                                isPast ? "text-slate-400 dark:text-slate-500" : isToday ? "text-rose-600/80 dark:text-rose-300/80" : "text-slate-500 dark:text-slate-400"
                              )}>{dayName}, {dateObj.getFullYear()}</p>
                            </div>
                          </div>
                        );
                      };

                      return (
                        <div className="space-y-6">
                          {/* Upcoming Holidays */}
                          {upcomingHolidays.length > 0 ? (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 px-1 mb-2">
                                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Upcoming Holidays</h3>
                              </div>
                              {upcomingHolidays.map(h => renderHoliday(h, false))}
                            </div>
                          ) : (
                            <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
                              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">No upcoming holidays scheduled.</p>
                            </div>
                          )}

                          {/* Passed Holidays logic */}
                          {passedHolidays.length > 0 && (
                            <div className="pt-2">
                              <button
                                type="button"
                                onClick={() => setShowPassedHolidays(!showPassedHolidays)}
                                className="flex items-center gap-3 w-full py-2 px-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors group"
                              >
                                <span className="text-xs font-bold uppercase tracking-widest whitespace-nowrap">Passed ({passedHolidays.length})</span>
                                <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700/50 group-hover:bg-slate-300 dark:group-hover:bg-slate-600 transition-colors" />
                                {showPassedHolidays ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>

                              {showPassedHolidays && (
                                <div className="space-y-3 mt-4 animate-in slide-in-from-top-2 duration-300 opacity-80">
                                  {passedHolidays.map(h => renderHoliday(h, true))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                      <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <CalendarDays size={32} className="text-rose-500" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">No Holidays Announced</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">The administration hasn't uploaded the holiday list yet.</p>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* ── Study Materials Placeholder ── */}
            {(activeNav === "materials" || activeNav === "all") && (
              <Card>
                <CardHeader
                  icon={BookMarked}
                  iconBg="bg-violet-50 dark:bg-violet-900/30"
                  iconColor="text-violet-500"
                  title="Study Materials"
                  subtitle="Collection of notes and academic resources"
                />
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-violet-50 dark:bg-violet-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <BookMarked size={32} className="text-violet-500" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Digital Library Hub</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">Access organized PDF notes, previous year solutions, and standard textbook references for your current semester.</p>
                </div>
              </Card>
            )}

            {/* ── Question Papers Placeholder ── */}
            {(activeNav === "papers" || activeNav === "all") && (
              <Card>
                <CardHeader
                  icon={FileQuestion}
                  iconBg="bg-amber-50 dark:bg-amber-900/30"
                  iconColor="text-amber-500"
                  title="Previous Year Papers"
                  subtitle="Exam preparation resource bank"
                />
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-amber-50 dark:bg-amber-900/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <FileQuestion size={32} className="text-amber-500" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Paper Bank Archive</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto">We are categorizing question papers by branch and semester. This section will be live shortly for your exam preparation.</p>
                </div>
              </Card>
            )}

            {/* ── Save Button ── */}
            {!["security", "services", "results", "upload", "holidays", "materials", "papers"].includes(activeNav) && (
              <div className="flex items-center justify-center sm:justify-start gap-4 pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2.5 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-7 py-3 rounded-xl font-semibold text-[14px] transition-all active:scale-95 disabled:opacity-50 shadow-md shadow-blue-500/20"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={17} />}
                  Save Changes
                </button>

                {saveStatus === "success" && (
                  <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-4 py-2.5 rounded-xl font-bold text-[13px] animate-in slide-in-from-bottom-2 zoom-in-95 fade-in duration-300 shadow-sm border border-emerald-200 dark:border-emerald-800/50">
                    <CheckCircle2 size={18} className="animate-bounce" />
                    Profile updated successfully!
                  </div>
                )}
              </div>
            )}
          </form>

          {/* ── Services ── */}
          {(activeNav === "services") && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {serviceItems.map(({ id, label, desc, icon: Icon, color, iconColor, href }) => (
                  <button
                    key={id}
                    onClick={() => {
                      if (href) window.open(href, "_blank", "noopener");
                      else if (id === "upload") onBack();
                      else if (id === "results") onBack();
                    }}
                    className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700 transition-all text-left group active:scale-[0.98]"
                  >
                    <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", color)}>
                      <Icon size={22} className={iconColor} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800 dark:text-white text-[14px] truncate">{label}</p>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 truncate">{desc}</p>
                    </div>
                    <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-400 shrink-0 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Danger Zone ── */}
          {(activeNav === "security" || activeNav === "all") && (
            <div className={cn("space-y-5", activeNav !== "security" && "mt-8")}>
              {activeNav !== "security" && (
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={16} className="text-rose-400" />
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Security &amp; Data Control</p>
                </div>
              )}

              <Card className="border-rose-100 dark:border-rose-900/30">
                <div className="p-6 flex flex-col sm:flex-row gap-6 items-start">
                  <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                    <AlertTriangle size={22} className="text-rose-500" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-rose-900 dark:text-rose-300 text-[15px] mb-1">Wipe All Routine Data</h3>
                    <p className="text-rose-700/60 dark:text-rose-400/60 text-[13px] mb-4 leading-relaxed max-w-lg">
                      This action is <strong>irreversible</strong>. All uploaded class schedules and routine mappings will be permanently erased from our system.
                    </p>
                    <button
                      onClick={deleteAllRoutines}
                      disabled={loading}
                      className="flex items-center gap-2 bg-slate-900 hover:bg-rose-600 text-white px-6 py-2.5 rounded-xl font-semibold text-[12px] uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 shadow-md"
                    >
                      {loading ? <Loader2 className="animate-spin" size={15} /> : <Trash2 size={15} />}
                      Clear Routine Data
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          )}

        </div>
      </main>

      {/* ── Toast ── */}
      {message && saveStatus === "error" && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-rose-600 text-white rounded-xl font-semibold text-[12px] uppercase tracking-wider shadow-2xl animate-in fade-in slide-in-from-bottom-6">
          {message}
        </div>
      )}
    </div>
  );
};

export default Settings;
