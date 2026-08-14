import React, { useState, useEffect, useMemo } from "react";
import {
  BookOpen,
  Clock,
  User,
  MapPin,
  Sparkles,
  ClipboardCheck,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Award,
  Bell,
  MessagesSquare,
  FileText,
  Bookmark,
  Calendar,
  Layers,
  ChevronRight,
  ShieldCheck,
  Plus,
  Trash2,
  FileQuestion,
  BookMarked,
  Camera,
  Building2,
  GraduationCap,
  Hash,
  Users
} from "lucide-react";
import { db, auth } from "../firebaseConfig";
import { collection, query, where, onSnapshot, doc, setDoc } from "firebase/firestore";
import defaultProfileImg from "../assets/gojo-prof.jpg";

const StudentDashboard = ({ userProfile, classes = [], onNavigate, onOpenSettings }) => {
  const [attendanceData, setAttendanceData] = useState([]);
  const [quickNotes, setQuickNotes] = useState(() => {
    try {
      const saved = localStorage.getItem("studentHub_quickNotes");
      return saved ? JSON.parse(saved) : [
        { id: "1", text: "Review Compiler Design notes for upcoming quiz", done: false },
        { id: "2", text: "Prepare assignment presentation for Web Technology", done: true }
      ];
    } catch (e) {
      return [];
    }
  });
  const [noteInput, setNoteInput] = useState("");

  const name = userProfile?.fullName || "Student";
  const university = userProfile?.university || "University";
  const stream = userProfile?.stream || "Course";
  const semester = userProfile?.semester || "1";
  const section = userProfile?.section || "A";
  const rollNumber = userProfile?.rollNumber || "N/A";
  const photo = userProfile?.photoBase64 || userProfile?.photoURL || auth.currentUser?.photoURL || defaultProfileImg;
  const userId = userProfile?.uid || auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) return;
    const unsub = onSnapshot(doc(db, "users", userId), (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.quickNotes && Array.isArray(data.quickNotes)) {
          setQuickNotes(data.quickNotes);
        }
      }
    });
    return () => unsub();
  }, [userId]);

  useEffect(() => {
    if (!userProfile?.uid) return;
    const q = query(collection(db, "attendance"), where("userId", "==", userProfile.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setAttendanceData(docs);
    });
    return () => unsub();
  }, [userProfile?.uid]);

  const saveNotesToDb = async (notes) => {
    try {
      localStorage.setItem("studentHub_quickNotes", JSON.stringify(notes));
    } catch (e) {}

    if (userId) {
      try {
        await setDoc(doc(db, "users", userId), { quickNotes: notes }, { merge: true });
      } catch (err) {
        console.error("Failed to sync notes to database:", err);
      }
    }
  };

  const addNote = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!noteInput.trim()) return;
    const newNotes = [{ id: Date.now().toString(), text: noteInput.trim(), done: false }, ...quickNotes];
    setQuickNotes(newNotes);
    setNoteInput("");
    saveNotesToDb(newNotes);
  };

  const toggleNote = (id) => {
    const newNotes = quickNotes.map(n => n.id === id ? { ...n, done: !n.done } : n);
    setQuickNotes(newNotes);
    saveNotesToDb(newNotes);
  };

  const deleteNote = (id, e) => {
    if (e && e.stopPropagation) e.stopPropagation();
    const newNotes = quickNotes.filter(n => n.id !== id);
    setQuickNotes(newNotes);
    saveNotesToDb(newNotes);
  };

  const todayDayName = new Date().toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();
  
  const todayClasses = useMemo(() => {
    if (!classes || classes.length === 0) return [];
    const hasDayProp = classes.some(c => c.day);
    if (!hasDayProp) return classes;
    return classes.filter(c => c.day?.toLowerCase() === todayDayName);
  }, [classes, todayDayName]);

  const totalTodayClasses = todayClasses.length;
  const liveClass = todayClasses.find(c => c.status === "current" || c.status === "live");
  const upcomingClasses = todayClasses.filter(c => c.status === "upcoming" || c.status === "next");

  const totalPresent = attendanceData.filter(a => a.status === "present").length;
  const totalLogs = attendanceData.length;
  const attendancePercentage = totalLogs > 0 ? Math.round((totalPresent / totalLogs) * 100) : 85;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-10">

      <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-5 sm:p-7 shadow-sm transition-all">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="relative group/avatar shrink-0">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 font-black text-xl overflow-hidden shadow-inner">
                <img src={photo} alt={name} className="w-full h-full object-cover" />
              </div>
              <button
                onClick={() => onOpenSettings("profile")}
                className="absolute -bottom-1 -right-1 p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-md border-2 border-white dark:border-slate-800 transition-transform active:scale-95"
                title="Change Profile Picture"
              >
                <Camera size={12} />
              </button>
            </div>

            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {name}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                  <ShieldCheck size={12} /> Verified Student
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">
                <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                  <Building2 size={13} className="shrink-0" />
                  <span>{university}</span>
                </div>
                <span className="text-slate-300 dark:text-slate-600">•</span>
                <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                  <GraduationCap size={13} className="shrink-0 text-slate-400 dark:text-slate-500" />
                  <span>{stream}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                  <Layers size={11} className="text-indigo-500 shrink-0" />
                  <span>Semester {semester}</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700">
                  <Users size={11} className="text-cyan-500 shrink-0" />
                  <span>Section {section}</span>
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/70 dark:border-indigo-800/50">
                  <Hash size={11} className="text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <span>Roll: {rollNumber}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-700/60 w-full sm:w-auto">
            <button
              onClick={() => {
                if (onNavigate) {
                  onNavigate("assistant");
                } else {
                  window.history.pushState(null, "", "/routine/Assistant");
                  window.dispatchEvent(new PopStateEvent("popstate"));
                }
              }}
              className="h-11 sm:h-10 inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap transition-all shadow-sm active:scale-95"
            >
              <Sparkles size={15} className="shrink-0" />
              <span>AI <span className="hidden xs:inline">Study </span>Assistant</span>
            </button>
            <button
              onClick={() => onOpenSettings("attendance")}
              className="h-11 sm:h-10 inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-xs sm:text-sm whitespace-nowrap transition-all active:scale-95"
            >
              <ClipboardCheck size={15} className="shrink-0" />
              <span>Attendance</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800/90 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Today's Schedule</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{totalTodayClasses} Classes</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              {liveClass ? "1 Class currently live" : "Regular schedule active"}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Clock size={22} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Attendance Status</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{attendancePercentage}%</h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
              {attendancePercentage >= 75 ? "Compliant (≥75% Target)" : "Below 75% threshold"}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <TrendingUp size={22} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800/90 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Academic Term</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">Sem {semester}</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Section {section} enrolled</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <BookOpen size={22} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        <div className="lg:col-span-8 space-y-6">
          
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/60">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Clock size={17} className="text-indigo-600 dark:text-indigo-400" />
                Today's Class Schedule
              </h2>
              <button
                onClick={() => onNavigate("routine")}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                View Timetable <ChevronRight size={14} />
              </button>
            </div>

            {todayClasses.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                <Calendar size={28} className="mx-auto text-slate-400 mb-2" />
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">No classes scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayClasses.map((cls, i) => {
                  const isCurrent = cls.status === "current" || cls.status === "live";
                  return (
                    <div
                      key={i}
                      className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isCurrent
                          ? "bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60 shadow-sm"
                          : "bg-slate-50/60 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-700/50"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {isCurrent && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-500 text-white rounded-md uppercase tracking-wider animate-pulse">
                              Live Now
                            </span>
                          )}
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">{cls.subject}</h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
                          <span className="flex items-center gap-1"><Clock size={12} className="text-indigo-500" /> {cls.time || `${cls.startTime || ''} - ${cls.endTime || ''}`}</span>
                          <span className="flex items-center gap-1"><User size={12} className="text-purple-500" /> {cls.teacher || cls.instructor || "Faculty"}</span>
                          <span className="flex items-center gap-1"><MapPin size={12} className="text-rose-500" /> Room: {cls.room || cls.roomNo || "N/A"}</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[11px] font-semibold px-2.5 py-1 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                          {cls.type || "Theory"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/60">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCircle2 size={17} className="text-emerald-600 dark:text-emerald-400" />
                Personal Study Notes & Tasks
              </h2>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addNote(e)}
                placeholder="Add a new reminder or note..."
                className="flex-1 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 placeholder:text-slate-400 outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={addNote}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-xs sm:text-sm transition-colors flex items-center gap-1 shrink-0"
              >
                <Plus size={15} /> Add
              </button>
            </div>

            <div className="space-y-2 pt-1">
              {quickNotes.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">No personal notes added yet.</p>
              ) : (
                quickNotes.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => toggleNote(n.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                      n.done
                        ? "bg-slate-50 dark:bg-slate-900/30 border-slate-200/60 dark:border-slate-800 text-slate-400 line-through"
                        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-indigo-300"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${n.done ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-300 dark:border-slate-600"}`}>
                        {n.done && <CheckCircle2 size={11} />}
                      </div>
                      <span className="text-xs font-semibold truncate">{n.text}</span>
                    </div>

                    <button
                      onClick={(e) => deleteNote(n.id, e)}
                      className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                      title="Delete Note"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          
          <div className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              Quick Shortcuts
            </h3>

            <div className="space-y-2">
              <button
                onClick={() => onOpenSettings("materials")}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-indigo-50/60 dark:bg-slate-900/40 dark:hover:bg-indigo-950/30 border border-slate-200/60 dark:border-slate-700/60 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                    <BookMarked size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">Study Materials</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Access notes & e-books</p>
                  </div>
                </div>
                <ChevronRight size={15} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => onOpenSettings("papers")}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-purple-50/60 dark:bg-slate-900/40 dark:hover:bg-purple-950/30 border border-slate-200/60 dark:border-slate-700/60 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                    <FileQuestion size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400">Question Papers</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Previous year exam papers</p>
                  </div>
                </div>
                <ChevronRight size={15} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => onOpenSettings("exam")}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-amber-50/60 dark:bg-slate-900/40 dark:hover:bg-amber-950/30 border border-slate-200/60 dark:border-slate-700/60 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Calendar size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400">Exam Routines</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Semester exam dates</p>
                  </div>
                </div>
                <ChevronRight size={15} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => onOpenSettings("chat")}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-pink-50/60 dark:bg-slate-900/40 dark:hover:bg-pink-950/30 border border-slate-200/60 dark:border-slate-700/60 transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-pink-100 dark:bg-pink-950 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0">
                    <MessagesSquare size={16} />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-pink-600 dark:group-hover:text-pink-400">Community Chat</h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Connect with batchmates</p>
                  </div>
                </div>
                <ChevronRight size={15} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>

          <div className="bg-slate-900 dark:bg-slate-950 text-white p-5 rounded-2xl border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400">
              <Bell size={15} />
              <h4 className="text-xs font-bold uppercase tracking-wider">Academic Bulletin</h4>
            </div>
            <p className="text-xs text-slate-300 font-medium leading-relaxed">
              Timetables and classroom allocations are automatically synchronized with university server databases.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};

export default StudentDashboard;
