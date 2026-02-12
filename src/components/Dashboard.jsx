import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  doc,
  getDoc,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { db, auth } from "../firebaseConfig";
import { signOut } from "firebase/auth";
import {
  LayoutDashboard,
  LogOut,
  PlusCircle,
  BookOpen,
  Clock,
  User,
  ArrowRight,
  Hash,
  Settings as SettingsIcon,
  X,
  ShieldAlert,
  CheckCircle2,
  Loader2,
  Menu,
} from "lucide-react";
import Uploader from "./Uploader.jsx";
import AdminPanel from "./AdminPanel.jsx";
import Settings from "./Settings.jsx";
import Support from "./Support.jsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility for cleaner conditional classes
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Helper: Converts a time string like "02:50 P.M" into a real Date object for comparison
const parseTimeStr = (timeStr, baseDate) => {
  if (!timeStr) return null;
  // Regex handles variations like "02:50 PM", "02:50 P.M", "02:50 p.m.", "02:50 A.M."
  const match = timeStr.match(/(\d+):(\d+)\s*([ap]\.?\s*m\.?)/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const modifier = match[3] ? match[3].replace(/[\s.]/g, "").toUpperCase() : null;

  if (modifier === "PM" && hours < 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;

  const date = new Date(baseDate);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const Dashboard = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploader, setShowUploader] = useState(false);
  const [view, setView] = useState("dashboard");
  const [userRole, setUserRole] = useState("user");
  const [userName, setUserName] = useState("Student");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const getDayName = (date) => new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(date);
  const getFormattedDate = (date) => new Intl.DateTimeFormat("en-US", { day: "numeric", month: "short" }).format(date);

  const handlePrevDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const handleNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const isSelectedToday = selectedDate.toDateString() === new Date().toDateString();
  const selectedDayName = getDayName(selectedDate);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    const classesRef = collection(db, "users", user.uid, "user_classes");
    const q = query(classesRef, orderBy("time", "asc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        setClasses(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching classes:", error);
        setLoading(false);
      },
    );

    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserRole(data.role || "user");
          setUserName(data.fullName || data.name || user.displayName || "Student");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUserData();

    // Refresh current time every 30 seconds for higher accuracy
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);

    return () => {
      unsubscribe();
      clearInterval(timer);
    };
  }, []);

  const clearAllRoutineData = async () => {
    const user = auth.currentUser;
    if (!user) return;

    if (
      !window.confirm(
        "Are you ABSOLUTELY sure? This will permanently delete your entire routine.",
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      const classesRef = collection(db, "users", user.uid, "user_classes");
      const snapshot = await getDocs(classesRef);

      if (snapshot.empty) {
        alert("Your routine is already empty!");
        setLoading(false);
        return;
      }

      const batch = writeBatch(db);
      snapshot.docs.forEach((document) => {
        batch.delete(document.ref);
      });

      await batch.commit();
      alert("Routine wiped successfully!");
      setView("dashboard");
    } catch (error) {
      console.error("Error clearing routine:", error);
      alert("Failed to clear routine. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Process selected day's classes and categorize them (past, current, future)
  const filteredClasses = classes
    .filter((c) => c.day?.toLowerCase() === selectedDayName.toLowerCase())
    .map((c) => {
      const parts = c.time.split("-");
      const startTimeStr = parts[0].trim();
      const endTimeStr = parts.length > 1 ? parts[1].trim() : startTimeStr;

      const startTime = parseTimeStr(startTimeStr, currentTime);
      const endTime = parseTimeStr(endTimeStr, currentTime);

      let status = "future";
      if (!isSelectedToday) {
        status = "future"; // Or "scheduled"
      } else if (endTime && currentTime > endTime) {
        status = "past";
      } else if (
        startTime &&
        endTime &&
        currentTime >= startTime &&
        currentTime <= endTime
      ) {
        status = "current";
      }

      return { ...c, status, startTime };
    })
    .sort((a, b) => {
      if (!a.startTime || !b.startTime) return 0;
      return a.startTime - b.startTime;
    });

  const currentClass = isSelectedToday ? filteredClasses.find((c) => c.status === "current") : null;
  const upcomingClasses = isSelectedToday ? filteredClasses.filter((c) => c.status === "future") : filteredClasses;
  const nextClass = upcomingClasses[0];

  if (view === "admin" && userRole === "admin") {
    return <AdminPanel onBack={() => setView("dashboard")} />;
  }

  if (view === "settings") {
    return <Settings onBack={() => setView("dashboard")} />;
  }

  if (view === "support") {
    return <Support onBack={() => setView("dashboard")} />;
  }

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] text-slate-900 overflow-x-hidden">
      {/* --- MOBILE SIDEBAR --- */}
      <div
        className={cn(
          "fixed inset-0 z-[100] transition-all duration-500",
          isSidebarOpen ? "visible" : "invisible"
        )}
      >
        {/* Overlay */}
        <div
          className={cn(
            "absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-500",
            isSidebarOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setIsSidebarOpen(false)}
        />

        {/* Sidebar Content */}
        <aside
          className={cn(
            "absolute top-0 right-0 w-80 h-full bg-white shadow-2xl transition-transform duration-500 flex flex-col transform",
            isSidebarOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          {/* Sidebar Header */}
          <div className="p-10 flex items-center justify-between">
            <h2 className="text-2xl font-black tracking-tighter text-slate-900">
              Student<span className="text-indigo-600"> Hub</span>
            </h2>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-3 bg-slate-900 text-white rounded-xl hover:bg-rose-500 transition-all shadow-xl active:scale-90"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4">
            {/* My Account Section */}
            <div className="mb-12">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6 pl-2">My Account</p>
              <div className="flex items-center gap-3 p-3 bg-slate-50/50 rounded-[1.5rem] border border-slate-100 shadow-sm">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-xl ring-4 ring-white shrink-0">
                  <User size={32} />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-black text-slate-900 truncate tracking-tight">
                    {userName}
                  </p>
                  <p className="text-xs font-bold text-slate-400 truncate opacity-70">
                    {auth.currentUser?.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="space-y-3 px-3">
              <p className="pl-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-6">Navigation</p>

              {userRole === "admin" && (
                <button
                  onClick={() => { setView("admin"); setIsSidebarOpen(false); }}
                  className="w-full flex items-center gap-5 px-6 py-5 rounded-[1.5rem] bg-slate-950 text-rose-500 font-black tracking-tight hover:bg-slate-900 transition-all shadow-xl group active:scale-[0.98] border border-slate-900"
                >
                  <ShieldAlert size={22} className="shrink-0" />
                  <span className="text-lg">Admin Panel</span>
                </button>
              )}

              <button
                onClick={() => { setShowUploader(true); setIsSidebarOpen(false); }}
                className="w-full flex items-center gap-5 px-6 py-5 rounded-[1.5rem] bg-slate-950 text-blue-500 font-black tracking-tight hover:bg-slate-900 transition-all shadow-xl group active:scale-[0.98] border border-slate-900"
              >
                <PlusCircle size={22} className="shrink-0" />
                <span className="text-lg">Sync Schedule</span>
              </button>

              <button
                onClick={() => { setView("settings"); setIsSidebarOpen(false); }}
                className="w-full flex items-center gap-5 px-6 py-5 rounded-[1.5rem] bg-slate-950 text-slate-400 font-black tracking-tight hover:bg-slate-900 transition-all shadow-xl group active:scale-[0.98] border border-slate-900"
              >
                <SettingsIcon size={22} className="shrink-0" />
                <span className="text-lg">Settings</span>
              </button>

              <button
                onClick={() => signOut(auth)}
                className="w-full flex items-center gap-5 px-6 py-5 rounded-[1.5rem] bg-slate-950 text-rose-500 font-black tracking-tight hover:bg-slate-900 transition-all shadow-xl group active:scale-[0.98] border border-slate-900"
              >
                <LogOut size={22} className="shrink-0" />
                <span className="text-lg">Logout</span>
              </button>
              <div className="my-10 border-t border-slate-50 mx-4" />


            </nav>
          </div>

          <div className="p-10 text-center">
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]"><span className="text-indigo-600">a SumanOnline Website</span><br /><span className="font-semibold">AI Routine System v4.0</span>

            </p>
          </div>
        </aside>
      </div>

      <div className="relative z-10 w-full px-4 py-6 sm:px-6 md:px-10 lg:px-16 xl:px-24">
        <header className="flex items-center justify-between gap-2 sm:gap-4 mb-8 sm:mb-10">
          {/* Left: Branding & Greeting */}
          <div className="flex items-center flex-1 gap-2 sm:gap-4 min-w-0">
            {/* Desktop Only Icon */}
            <div className="hidden sm:flex p-2 sm:p-4 bg-indigo-600 rounded-xl sm:rounded-[2rem] text-white shadow-xl ring-2 sm:ring-4 ring-white shrink-0">
              <LayoutDashboard size={20} className="sm:w-7 sm:h-7" />
            </div>

            <div className="min-w-0 flex-1 flex flex-col">
              <div className="flex items-center gap-3">
                <h1 className="text-base sm:text-3xl md:text-4xl font-black tracking-tight leading-none text-slate-900">
                  Student<span className="text-indigo-600">Hub</span>
                </h1>
                {/* Desktop Status Badge */}
                <span
                  className={cn(
                    "hidden sm:inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm",
                    userRole === "admin"
                      ? "bg-rose-50 text-rose-600 border-rose-100"
                      : "bg-indigo-50 text-indigo-600 border-indigo-100"
                  )}
                >
                  {userRole}
                </span>
              </div>

              {/* Greeting Line with Mobile Badge */}
              <div className="flex items-center gap-2 mt-1 sm:mt-2 min-w-0">
                <p className="text-slate-400 font-bold text-[10px] sm:text-base leading-none truncate max-w-[150px] sm:max-w-none shrink-0">
                  Welcome, <span className="text-slate-600 font-black">{userName}</span>
                </p>
                {/* Mobile-Only Status Badge */}
                <span
                  className={cn(
                    "sm:hidden px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border leading-none shrink-0",
                    userRole === "admin"
                      ? "bg-rose-50 text-rose-600 border-rose-100"
                      : "bg-indigo-50 text-indigo-600 border-indigo-100"
                  )}
                >
                  {userRole}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Actions & Menu */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Desktop Actions */}
            <div className="hidden sm:flex items-center gap-2 md:gap-3">
              {userRole === "admin" && (
                <button
                  onClick={() => setView("admin")}
                  className="flex items-center gap-3 bg-rose-50/50 text-rose-600 border border-rose-100 px-6 py-5 rounded-[2.2rem] hover:bg-rose-100 transition-all shadow-sm active:scale-95 font-black uppercase tracking-widest text-xs"
                >
                  <ShieldAlert size={22} />
                  <span>Admin Panel</span>
                </button>
              )}
              <button
                onClick={() => setShowUploader(true)}
                className="flex items-center justify-center gap-3 bg-slate-900 hover:bg-indigo-600 text-white py-5 px-10 rounded-[2.2rem] font-black text-lg active:scale-95 transition-all shadow-lg shadow-slate-200"
              >
                <PlusCircle size={22} />
                <span>Sync</span>
              </button>
              <button
                onClick={() => setView("settings")}
                className="p-5 bg-white border border-slate-200 text-slate-400 rounded-[2.2rem] hover:bg-slate-50 hover:text-indigo-600 transition-all active:scale-95 flex items-center justify-center"
              >
                <SettingsIcon size={24} />
              </button>
              <button
                onClick={() => signOut(auth)}
                className="p-5 bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-[2.2rem] transition-all active:scale-95 flex items-center justify-center"
              >
                <LogOut size={24} />
              </button>
            </div>

            {/* Mobile Menu Toggle - Black Background with Blue bars (via icon color) */}
            <div className="sm:hidden">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-3 bg-slate-900 border border-slate-800 text-indigo-400 rounded-xl shadow-xl active:scale-90 transition-all"
              >
                <Menu size={22} />
              </button>
            </div>
          </div>
        </header>

        {/* --- SYNC MODAL --- */}
        {showUploader && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 md:p-10 overflow-hidden">
            {/* Backdrop with premium blur */}
            <div
              className="absolute inset-0 bg-slate-950/40 backdrop-blur-md animate-in fade-in duration-500"
              onClick={() => setShowUploader(false)}
            />

            {/* Modal Content container */}
            <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl shadow-indigo-500/10 border border-slate-100/50 animate-in zoom-in-95 fade-in duration-500 overflow-hidden max-h-[90vh] flex flex-col">
              {/* Close Button Inside Modal */}
              <button
                onClick={() => setShowUploader(false)}
                className="absolute top-6 right-6 p-3 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all active:scale-95 z-20"
              >
                <X size={20} />
              </button>

              <div className="overflow-y-auto w-full">
                <Uploader onUploadSuccess={() => setShowUploader(false)} />
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 md:gap-10">
          <div className="md:col-span-12 lg:col-span-8 xl:col-span-9 bg-slate-950 rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-10 md:p-16 text-white shadow-2xl relative overflow-hidden group order-1 lg:order-1">
            {/* Glossy overlay effect */}
            <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />

            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="flex flex-col gap-12">
                {/* --- HAPPENING NOW SECTION --- */}
                {currentClass && (
                  <div className="border-b border-indigo-500/20 pb-8 sm:pb-12">
                    <h2 className="text-emerald-400 font-black text-[10px] sm:text-base mb-4 sm:mb-6 flex items-center gap-2 sm:gap-3 uppercase tracking-widest">
                      <span className="relative flex h-2 w-2 sm:h-3 sm:w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 sm:h-3 sm:w-3 bg-emerald-500"></span>
                      </span>
                      Live Now
                    </h2>
                    <h3 className="text-2xl sm:text-4xl md:text-5xl font-extrabold mb-6 sm:mb-8 leading-tight tracking-tighter text-white group-hover:text-indigo-50 transition-colors truncate">
                      {currentClass.subject}
                    </h3>
                    <div className="flex flex-row gap-2 sm:gap-4">
                      <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-6 py-2 sm:py-4 bg-emerald-500/10 rounded-xl sm:rounded-2xl border border-emerald-500/20 backdrop-blur-md shrink-0">
                        <Clock className="text-emerald-400 w-4 h-4 sm:w-6 sm:h-6" />
                        <span className="text-[10px] sm:text-xl font-black text-emerald-5 tracking-tight">
                          {currentClass.time}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-6 py-2 sm:py-4 bg-white/5 rounded-xl sm:rounded-2xl border border-white/10 backdrop-blur-md min-w-0">
                        <User className="text-indigo-400 w-4 h-4 sm:w-6 sm:h-6 shrink-0" />
                        <span className="text-[10px] sm:text-xl font-black truncate text-slate-200 tracking-tight">
                          {currentClass.teacher}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- UP NEXT TODAY SECTION --- */}
                <div className={cn(!currentClass && "py-2 sm:py-4")}>
                  <h2 className="text-slate-500 font-black text-[10px] sm:text-base mb-4 sm:mb-6 flex items-center gap-2 uppercase tracking-widest">
                    {currentClass && (
                      <ArrowRight size={14} className="text-indigo-500/50 sm:w-[18px]" />
                    )}
                    {currentClass ? "Up Next" : "Upcoming Next"}
                  </h2>

                  {nextClass ? (
                    <>
                      <h3
                        className={cn(
                          "font-extrabold mb-6 sm:mb-8 leading-tight tracking-tighter transition-all duration-500 truncate",
                          currentClass
                            ? "text-xl sm:text-3xl text-slate-400 group-hover:text-slate-300"
                            : "text-2xl sm:text-5xl md:text-6xl text-white"
                        )}
                      >
                        {nextClass.subject}
                      </h3>
                      <div className="flex flex-row gap-2 sm:gap-4">
                        <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-6 py-2 sm:py-4 bg-white/5 rounded-xl sm:rounded-2xl border border-white/10 hover:bg-white/10 transition-colors shrink-0">
                          <Clock className="text-indigo-400 w-4 h-4 sm:w-6 sm:h-6" />
                          <span className="text-[10px] sm:text-xl font-black tracking-tight text-white">
                            {nextClass.time}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-4 px-3 sm:px-6 py-2 sm:py-4 bg-white/5 rounded-xl sm:rounded-2xl border border-white/10 hover:bg-white/10 transition-colors min-w-0">
                          <User className="text-indigo-400 w-4 h-4 sm:w-6 sm:h-6 shrink-0" />
                          <span className="text-[10px] sm:text-xl font-black truncate tracking-tight text-white">
                            {nextClass.teacher}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : filteredClasses.length > 0 ? (
                    <div className="flex flex-col gap-2">
                      <h3 className="text-2xl sm:text-6xl font-black tracking-tighter text-emerald-400 group-hover:scale-[1.02] transition-transform origin-left">
                        Mission complete! 🎉
                      </h3>
                      <p className="text-slate-500 font-bold text-sm sm:text-lg">No more classes today.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      <h3 className="text-2xl sm:text-6xl font-black text-slate-700 tracking-tighter">
                        Day off! ✨
                      </h3>
                      <p className="text-slate-500 font-bold text-sm sm:text-lg">No classes found.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Background decoration */}
              <BookOpen
                size={180}
                className="absolute -bottom-16 -right-16 text-white/5 group-hover:rotate-12 group-hover:scale-110 transition-all duration-1000"
              />
            </div>
          </div>

          <div className="md:col-span-12 lg:col-span-4 xl:col-span-3 order-3 lg:order-2">
            <div className="bg-white rounded-[2.5rem] sm:rounded-[3rem] p-8 sm:p-10 border border-slate-100 shadow-xl flex flex-col items-center justify-center text-center group hover:shadow-2xl transition-all duration-500 h-fit">
              <div className="bg-indigo-50 p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] text-indigo-600 mb-4 sm:mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                <BookOpen size={36} className="sm:w-12 sm:h-12" />
              </div>
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-1 sm:mb-2">
                Total Classes / Week
              </p>
              <p className="text-6xl sm:text-7xl font-black text-slate-900 tracking-tighter leading-none">
                {classes.length}
              </p>
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest mt-2">
                classes / 1Week
              </p>
              <div className="mt-8 flex items-center gap-1.5 px-4 py-2 bg-slate-50 rounded-full border border-slate-100">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Database Active</span>
              </div>
            </div>
          </div>

          <div className="md:col-span-12 lg:col-span-8 xl:col-span-9 bg-white/80 backdrop-blur-3xl rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-10 md:p-16 border border-white shadow-2xl order-2 lg:order-3">
            <div className="flex flex-col mb-8 sm:mb-14 gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                <div className="flex flex-col gap-1 text-center sm:text-left">
                  <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-none text-slate-900">
                    Daily Timeline
                  </h2>
                  <p className="text-slate-500 font-bold text-sm sm:text-lg">
                    {selectedDayName}, {getFormattedDate(selectedDate)}
                  </p>
                </div>

                <div className="flex flex-row items-center justify-center sm:justify-between gap-2 self-center sm:self-auto">
                  <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-sm">
                    <button
                      onClick={handlePrevDay}
                      className="p-2 sm:p-3 hover:bg-white hover:text-indigo-600 rounded-xl transition-all hover:shadow-md active:scale-95 text-slate-500"
                      title="Previous Day"
                    >
                      <ArrowRight className="rotate-180" size={20} />
                    </button>

                    {!isSelectedToday && (
                      <button
                        onClick={handleToday}
                        className="px-4 py-2 text-xs sm:text-sm font-black text-indigo-600 hover:bg-white rounded-xl transition-all hover:shadow-md active:scale-95 mx-1"
                      >
                        Today
                      </button>
                    )}

                    <button
                      onClick={handleNextDay}
                      className="p-2 sm:p-3 hover:bg-white hover:text-indigo-600 rounded-xl transition-all hover:shadow-md active:scale-95 text-slate-500"
                      title="Next Day"
                    >
                      <ArrowRight size={20} />
                    </button>
                  </div>

                  <div className="bg-indigo-50 px-4 sm:px-6 py-3 rounded-2xl flex items-center gap-2 sm:gap-3 border border-indigo-100 shadow-sm shrink-0">
                    <Hash size={18} className="text-indigo-400 sm:w-[20px]" />
                    <span className="font-black text-indigo-600 text-sm sm:text-lg">
                      {filteredClasses.length} Scheduled
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 md:space-y-6">
              {loading ? (
                <div className="py-20 flex flex-col items-center gap-4">
                  <Loader2 className="animate-spin text-indigo-500" size={40} />
                  <p className="text-slate-400 font-black tracking-widest uppercase text-xs">
                    Accessing Secure Data...
                  </p>
                </div>
              ) : filteredClasses.length > 0 ? (
                filteredClasses.map((item) => {
                  const isPast = item.status === "past";
                  const isCurrent = item.status === "current";

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "group flex flex-row items-center gap-4 sm:gap-10 p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border transition-all duration-500 relative",
                        isPast
                          ? "bg-slate-50/50 border-slate-100 opacity-60 grayscale hover:opacity-100 hover:grayscale-0"
                          : isCurrent
                            ? "bg-emerald-50/50 border-emerald-200 shadow-xl shadow-emerald-500/10 ring-1 sm:ring-2 ring-emerald-500/20"
                            : "bg-white border-slate-100 hover:border-indigo-200 hover:shadow-2xl hover:shadow-indigo-500/5 hover:-translate-y-1"
                      )}
                    >
                      {/* Time and Status Icons */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 min-w-[60px] sm:min-w-[120px]">
                        <div className="relative self-center">
                          {isCurrent && (
                            <div className="absolute -top-1.5 -right-1.5 z-10">
                              <span className="relative flex h-3 w-3 sm:h-4 sm:w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 sm:h-4 sm:w-4 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                              </span>
                            </div>
                          )}
                          <div className={cn(
                            "w-12 h-12 sm:w-16 sm:h-16 rounded-[1rem] sm:rounded-[1.25rem] flex items-center justify-center transition-all duration-500",
                            isCurrent
                              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 rotate-3"
                              : isPast
                                ? "bg-slate-100 text-slate-400 border border-slate-200"
                                : "bg-white text-indigo-600 border border-slate-100 group-hover:border-indigo-200 group-hover:shadow-lg group-hover:shadow-indigo-500/10 group-hover:-rotate-3"
                          )}>
                            {isPast ? <CheckCircle2 size={24} className="sm:w-8 sm:h-8" /> : <Clock size={24} className="sm:w-8 sm:h-8" />}
                          </div>
                        </div>
                        <div className="flex flex-col justify-center gap-0.5 sm:gap-1">
                          <div className="flex flex-col">
                            <p className={cn(
                              "text-xs sm:text-lg font-black leading-none tracking-tight",
                              isPast ? "text-slate-400" : isCurrent ? "text-emerald-700" : "text-slate-900"
                            )}>
                              {item.time.split("-")[0].trim()}
                            </p>
                          </div>
                          <div className="w-full h-[1px] bg-slate-100 my-0.5 sm:my-1"></div>
                          <div className="flex flex-col">
                            <p className={cn(
                              "text-xs sm:text-lg font-black leading-none tracking-tight",
                              isPast ? "text-slate-300" : "text-slate-500"
                            )}>
                              {item.time.split("-")[1]?.trim() || "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="hidden sm:block h-12 w-[2px] bg-slate-100"></div>

                      {/* Subject and Teacher */}
                      <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-2 sm:gap-4 min-w-0">
                        <div className="min-w-0">
                          <h4
                            className={cn(
                              "text-[15px] sm:text-2xl font-black leading-tight transition-all truncate sm:whitespace-normal",
                              isPast ? "text-slate-400" : isCurrent ? "text-slate-900" : "text-slate-800"
                            )}
                          >
                            {item.subject}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-0.5 sm:mt-1">
                            <User size={12} className={cn("shrink-0", isCurrent ? "text-emerald-500" : "text-indigo-400")} />
                            <p className={cn(
                              "text-xs sm:text-base font-bold truncate",
                              isPast ? "text-slate-400" : isCurrent ? "text-emerald-600" : "text-slate-500"
                            )}>
                              {item.teacher}
                            </p>
                          </div>
                        </div>
                        {isSelectedToday && (
                          <div className={cn(
                            "px-3 sm:px-5 py-1 sm:py-2.5 rounded-full border text-[9px] sm:text-[11px] font-black uppercase tracking-[0.1em] transition-all self-start sm:self-auto shadow-sm",
                            isCurrent
                              ? "bg-emerald-500 text-white border-emerald-400 shadow-emerald-500/20"
                              : isPast
                                ? "bg-slate-100 text-slate-400 border-slate-200"
                                : "bg-white text-indigo-600 border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600"
                          )}>
                            {isCurrent ? "Live Now" : isPast ? "Completed" : "Next Up"}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-24 text-center bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200">
                  <ShieldAlert className="mx-auto text-slate-300 mb-4" size={48} />
                  <p className="text-slate-400 font-black text-xl tracking-tight">
                    No lectures found for {selectedDayName}.
                  </p>
                  <p className="text-slate-400 font-bold mt-1 text-sm uppercase tracking-widest">Update your routine to see contents here</p>
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-12 lg:col-span-4 xl:col-span-3 order-4 lg:order-4">
            {/* System Status Card - Standardized to match Integrated Modules */}
            <div className="bg-white rounded-[2.5rem] sm:rounded-[3rem] p-8 sm:p-10 border border-slate-100 shadow-xl flex flex-col items-center justify-center text-center group hover:shadow-2xl transition-all duration-500 h-fit">
              <div className="bg-rose-50 p-4 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] text-rose-600 mb-4 sm:mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                <ShieldAlert size={36} className="sm:w-12 sm:h-12" />
              </div>
              <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-1 sm:mb-2">
                System Status
              </p>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none mb-4">
                AI <span className="text-emerald-500">Online</span>
              </h3>
              <div className="flex flex-col gap-2 w-full">
                <div className="flex items-center justify-between px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Server</span>
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
                </div>
                <button
                  onClick={() => setView("support")}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg mt-2 active:scale-95"
                >
                  Support Portal
                </button>
              </div>
            </div>
          </div>
        </div>
      </div >
    </div >
  );
};

export default Dashboard;
