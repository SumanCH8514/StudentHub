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
} from "lucide-react";
import Uploader from "./Uploader.jsx";
import AdminPanel from "./AdminPanel.jsx";

// Helper: Converts a time string like "02:50 P.M" into a real Date object for comparison
const parseTimeStr = (timeStr, baseDate) => {
  if (!timeStr) return null;
  const match = timeStr.match(/(\d+):(\d+)\s*(a\.?m\.?|p\.?m\.?)?/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const modifier = match[3] ? match[3].replace(/\./g, "").toUpperCase() : null;

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

  const [currentTime, setCurrentTime] = useState(new Date());

  const todayName = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
  }).format(new Date());

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

    const fetchRole = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role || "user");
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    };
    fetchRole();

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

  // Process today's classes and categorize them (past, current, future)
  const todaysClasses = classes
    .filter((c) => c.day?.toLowerCase() === todayName.toLowerCase())
    .map((c) => {
      const parts = c.time.split("-");
      const startTimeStr = parts[0].trim();
      const endTimeStr = parts.length > 1 ? parts[1].trim() : startTimeStr;

      const startTime = parseTimeStr(startTimeStr, currentTime);
      const endTime = parseTimeStr(endTimeStr, currentTime);

      let status = "future";
      if (endTime && currentTime > endTime) {
        status = "past";
      } else if (
        startTime &&
        endTime &&
        currentTime >= startTime &&
        currentTime <= endTime
      ) {
        status = "current";
      }

      return { ...c, status };
    });

  const currentClass = todaysClasses.find((c) => c.status === "current");
  const upcomingClasses = todaysClasses.filter((c) => c.status === "future");
  const nextClass = upcomingClasses[0];

  if (view === "admin" && userRole === "admin") {
    return <AdminPanel onBack={() => setView("dashboard")} />;
  }

  if (view === "settings") {
    return (
      <div className="min-h-screen w-full bg-white p-6 md:p-12 animate-in fade-in duration-500">
        <button
          onClick={() => setView("dashboard")}
          className="flex items-center gap-2 font-bold text-slate-500 mb-10"
        >
          <ArrowRight className="rotate-180" /> Back
        </button>
        <div className="max-w-md mx-auto bg-red-50 p-10 rounded-[3rem] text-center border border-red-100">
          <h2 className="text-2xl font-black text-red-900 mb-4">
            Wipe All Data
          </h2>
          <p className="text-red-700 mb-8">
            This deletes your personal routine entries permanently.
          </p>
          <button
            onClick={clearAllRoutineData}
            disabled={loading}
            className="bg-red-600 text-white px-8 py-4 rounded-2xl font-bold active:scale-95 transition-transform disabled:opacity-50"
          >
            {loading ? "Wiping Data..." : "Clear My Routine"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] text-slate-900 overflow-x-hidden">
      <div className="relative z-10 w-full px-4 py-6 md:px-10 lg:px-20">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="p-3 md:p-4 bg-indigo-600 rounded-2xl md:rounded-[2rem] text-white shadow-xl ring-4 ring-white">
              <LayoutDashboard size={28} />
            </div>
            <div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tighter leading-none">
                Student <span className="text-indigo-600">Hub</span>
              </h1>

              {/* 🔥 MOVED: Role is now right next to the Welcome text */}
              <div className="flex items-center gap-2 mt-1.5">
                <p className="text-slate-400 font-bold text-sm md:text-lg leading-none">
                  Welcome,{" "}
                  {auth.currentUser?.displayName?.split(" ")[0] || "Student"}
                </p>
                <span
                  className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-widest leading-none border ${
                    userRole === "admin"
                      ? "bg-rose-100 text-rose-600 border-rose-200"
                      : "bg-indigo-100 text-indigo-600 border-indigo-200"
                  }`}
                >
                  {userRole}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
            {userRole === "admin" && (
              <button
                onClick={() => setView("admin")}
                className="p-4 md:p-5 bg-red-50 text-red-600 border border-red-100 rounded-2xl md:rounded-[2.2rem] hover:bg-red-100 transition-all shadow-sm"
              >
                <ShieldAlert size={24} />
              </button>
            )}
            <button
              onClick={() => setShowUploader(!showUploader)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-4 md:py-5 md:px-8 rounded-2xl md:rounded-[2.2rem] font-bold text-base md:text-lg active:scale-95 transition-all shadow-lg"
            >
              {showUploader ? <X size={20} /> : <PlusCircle size={20} />}
              <span>{showUploader ? "Close" : "Update"}</span>
            </button>
            <button
              onClick={() => setView("settings")}
              className="p-4 md:p-5 bg-white border border-slate-200 text-slate-400 rounded-2xl md:rounded-[2.2rem] active:bg-slate-50"
            >
              <SettingsIcon size={24} />
            </button>
            <button
              onClick={() => signOut(auth)}
              className="p-4 md:p-5 bg-white border border-slate-200 text-red-500 rounded-2xl md:rounded-[2.2rem] active:bg-red-50"
            >
              <LogOut size={24} />
            </button>
          </div>
        </header>

        {showUploader && (
          <div className="mb-10 animate-in slide-in-from-top-4 fade-in duration-300">
            <Uploader onUploadSuccess={() => setShowUploader(false)} />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 md:gap-8">
          <div className="md:col-span-12 lg:col-span-9 bg-slate-900 rounded-[2.5rem] md:rounded-[3.5rem] p-8 md:p-14 text-white shadow-2xl relative overflow-hidden">
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="flex flex-col gap-10">
                {/* --- HAPPENING NOW SECTION --- */}
                {currentClass && (
                  <div className="border-b border-white/10 pb-10">
                    <h2 className="text-emerald-400 font-bold text-base md:text-xl mb-4 flex items-center gap-3">
                      <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                      </span>
                      Happening Now
                    </h2>
                    <h3 className="text-4xl md:text-6xl font-black mb-6 leading-tight tracking-tighter text-white">
                      {currentClass.subject}
                    </h3>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3 px-5 py-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                        <Clock className="text-emerald-400" size={20} />
                        <span className="text-lg font-bold text-emerald-50">
                          {currentClass.time}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 px-5 py-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                        <User className="text-emerald-400" size={20} />
                        <span className="text-lg font-bold line-clamp-1 text-emerald-50">
                          {currentClass.teacher}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* --- UP NEXT TODAY SECTION --- */}
                <div>
                  <h2 className="text-slate-400 font-bold text-base md:text-xl mb-4 italic flex items-center gap-2">
                    {currentClass && (
                      <ArrowRight size={18} className="text-indigo-400" />
                    )}
                    {currentClass ? "Up Next" : "Up Next Today"}
                  </h2>

                  {nextClass ? (
                    <>
                      <h3
                        className={`font-black mb-6 leading-tight tracking-tighter ${currentClass ? "text-2xl md:text-4xl text-slate-300" : "text-4xl md:text-7xl lg:text-8xl text-white"}`}
                      >
                        {nextClass.subject}
                      </h3>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3 px-5 py-4 bg-white/5 rounded-2xl border border-white/10">
                          <Clock className="text-indigo-400" size={20} />
                          <span className="text-lg font-bold">
                            {nextClass.time}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 px-5 py-4 bg-white/5 rounded-2xl border border-white/10">
                          <User className="text-indigo-400" size={20} />
                          <span className="text-lg font-bold line-clamp-1">
                            {nextClass.teacher}
                          </span>
                        </div>
                      </div>
                    </>
                  ) : todaysClasses.length > 0 ? (
                    <h3
                      className={`font-black tracking-tighter ${currentClass ? "text-2xl text-slate-500" : "text-3xl md:text-5xl text-emerald-400 mb-8"}`}
                    >
                      All upcoming classes completed! 🎉
                    </h3>
                  ) : (
                    <h3 className="text-3xl md:text-5xl font-black mb-8 text-slate-600 tracking-tighter">
                      No classes today! 🎉
                    </h3>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-6 lg:col-span-3 bg-white rounded-[2.5rem] md:rounded-[3.5rem] p-8 border border-slate-100 shadow-xl flex flex-col items-center justify-center text-center">
            <div className="bg-indigo-50 p-5 rounded-[2rem] text-indigo-600 mb-4">
              <BookOpen size={40} />
            </div>
            <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">
              Saved Classes
            </p>
            <p className="text-7xl font-black text-slate-900 tracking-tighter leading-none mt-2">
              {classes.length}
            </p>
          </div>

          <div className="md:col-span-12 lg:col-span-9 bg-white/70 backdrop-blur-2xl rounded-[2.5rem] md:rounded-[3.5rem] p-6 md:p-14 border border-white shadow-xl">
            <div className="flex items-center justify-between mb-8 md:mb-12">
              <h2 className="text-2xl md:text-3xl font-black tracking-tight leading-none">
                Today's Timeline
              </h2>
              <div className="bg-slate-100 px-4 py-1.5 rounded-xl flex items-center gap-1.5">
                <Hash size={16} className="text-slate-400" />
                <span className="font-bold text-slate-600 text-sm">
                  {todaysClasses.length} Lectures
                </span>
              </div>
            </div>

            <div className="space-y-3 md:space-y-4">
              {loading ? (
                <p className="text-center py-10 text-slate-400 font-bold animate-pulse">
                  Syncing schedule...
                </p>
              ) : todaysClasses.length > 0 ? (
                todaysClasses.map((item) => {
                  const isPast = item.status === "past";
                  const isCurrent = item.status === "current";

                  return (
                    <div
                      key={item.id}
                      className={`group flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8 p-5 md:p-8 rounded-[2rem] border transition-all duration-500 relative ${
                        isPast
                          ? "bg-slate-50/50 opacity-50 grayscale border-transparent"
                          : isCurrent
                            ? "bg-emerald-50/50 border-emerald-200 shadow-lg shadow-emerald-100/50"
                            : "bg-white/50 border-transparent hover:border-slate-100 hover:shadow-2xl"
                      }`}
                    >
                      <div
                        className={`hidden sm:block text-center border-r pr-6 min-w-[100px] ${isPast ? "border-slate-200" : isCurrent ? "border-emerald-200" : "border-slate-100"}`}
                      >
                        <p
                          className={`text-[10px] font-black uppercase leading-none ${isCurrent ? "text-emerald-500" : "text-slate-400"}`}
                        >
                          Time
                        </p>
                        <p
                          className={`text-xl font-black leading-none mt-1 ${isPast ? "text-slate-400" : isCurrent ? "text-emerald-600" : "text-indigo-600"}`}
                        >
                          {item.time.split("-")[0]}
                        </p>
                      </div>

                      <div className="flex-1 w-full flex justify-between items-center">
                        <div>
                          <h4
                            className={`text-lg md:text-2xl font-black leading-tight transition-colors ${
                              isPast
                                ? "text-slate-500 line-through decoration-slate-300"
                                : isCurrent
                                  ? "text-emerald-800"
                                  : "text-slate-800 group-hover:text-indigo-600"
                            }`}
                          >
                            {item.subject}
                          </h4>
                          <p
                            className={`text-sm md:text-lg font-medium mt-1 md:mt-0 ${isPast ? "text-slate-400" : isCurrent ? "text-emerald-600" : "text-slate-500"}`}
                          >
                            {item.teacher}
                            <span
                              className={`sm:hidden block font-bold mt-1 ${isPast ? "text-slate-400" : isCurrent ? "text-emerald-600" : "text-indigo-600"}`}
                            >
                              {item.time}
                            </span>
                          </p>
                        </div>

                        {isPast && (
                          <div className="hidden md:block text-emerald-500/50 mr-4">
                            <CheckCircle2 size={32} />
                          </div>
                        )}
                        {isCurrent && (
                          <div className="hidden md:block text-emerald-500 mr-4 animate-pulse">
                            <span className="text-xs font-black uppercase tracking-widest bg-emerald-100 px-3 py-1 rounded-full">
                              Active
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-slate-400 font-bold">
                  No lectures found for {todayName}.
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-6 lg:col-span-3 bg-indigo-600 rounded-[2.5rem] p-8 md:p-10 text-white shadow-2xl overflow-hidden relative group">
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div>
                <h3 className="font-black text-xl mb-2">Portal Stats</h3>
                <p className="text-indigo-100 text-xs font-bold leading-relaxed opacity-80">
                  BCA Semester VI • Sec IV. AI Powered Routine Scraper active.
                </p>
              </div>
              <div className="mt-8 space-y-2">
                <div className="w-full p-4 bg-white/10 rounded-2xl text-xs font-black uppercase flex justify-between">
                  <span>Sync</span>
                  <span className="text-green-300">Active</span>
                </div>
              </div>
            </div>
            <BookOpen
              size={140}
              className="absolute -bottom-10 -right-10 text-white/5 group-hover:rotate-12 transition-transform duration-700"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
