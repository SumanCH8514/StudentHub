import React, { useState, useEffect } from "react";
import {
  collection,
  query,
  onSnapshot,
  doc,
  deleteDoc,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebaseConfig";
import {
  Users,
  ShieldAlert,
  ArrowLeft,
  Database,
  Search,
  UserMinus,
  Loader2,
  LayoutDashboard,
  Mail,
  MoreVertical,
  Activity,
  AlertTriangle,
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import Footer from "./Footer.jsx";

// Utility for cleaner conditional classes
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const AdminPanel = ({ onBack }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isWiping, setIsWiping] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const q = query(collection(db, "users"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUsers(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const deleteUser = async (userId) => {
    if (
      window.confirm(
        "Are you sure? This will delete the user profile. (Note: Auth account must be deleted manually in Firebase Console)",
      )
    ) {
      await deleteDoc(doc(db, "users", userId));
    }
  };

  const wipeGlobalClasses = async () => {
    if (
      !window.confirm(
        "🚨 CRITICAL ACTION: This will delete EVERY CLASS from EVERY USER in the database. Proceed?",
      )
    )
      return;
    setIsWiping(true);
    try {
      const snapshot = await getDocs(collection(db, "classes"));
      const batch = writeBatch(db);
      snapshot.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      alert("Database wiped successfully.");
    } catch (e) {
      alert(e.message);
    }
    setIsWiping(false);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] text-slate-900 overflow-x-hidden selection:bg-indigo-100 selection:text-indigo-700">
      {/* --- PREMIUM HEADER --- */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 sm:px-12 sm:py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="group flex items-center gap-3 text-slate-500 hover:text-slate-900 font-bold transition-all active:scale-95"
          >
            <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-slate-100 transition-colors">
              <ArrowLeft size={18} />
            </div>
            <span className="hidden sm:inline">Dashboard</span>
          </button>

          <div className="flex items-center gap-3 bg-rose-50 px-4 py-2 rounded-2xl border border-rose-100 shadow-sm">
            <ShieldAlert size={16} className="text-rose-600" />
            <span className="text-xs font-black uppercase tracking-widest text-rose-700">Admin Console</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10 sm:py-16 animate-in slide-in-from-bottom-6 fade-in duration-700">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">

          {/* STATS - Left Sidebar Top Area */}
          <div className="xl:col-span-3 order-1 xl:order-1">
            {/* Minimal Stats Card */}
            <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-10 text-indigo-600 group-hover:scale-110 transition-transform">
                <Users size={60} />
              </div>
              <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] mb-3 relative z-10">
                Total Hub Members
              </p>
              <div className="flex items-baseline gap-2 relative z-10">
                <h3 className="text-5xl font-black text-slate-950 tracking-tighter">
                  {users.length}
                </h3>
              </div>
              <div className="mt-8 flex items-center gap-3 relative z-10">
                <div className="flex -space-x-2">
                  {users.slice(0, 4).map((u, i) => (
                    <div key={i} className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] font-black uppercase text-indigo-600 shadow-sm">
                      {u.name?.charAt(0)}
                    </div>
                  ))}
                </div>
                <p className="text-xs font-bold text-slate-400">Hub Active</p>
              </div>
            </div>
          </div>

          {/* USER MANAGEMENT - Main Area / Middle in Mobile */}
          <div className="xl:col-span-9 xl:row-span-2 order-2 xl:order-2 space-y-8">
            {/* Controls Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-4">
              <div className="flex flex-col gap-1">
                <h2 className="text-3xl font-black text-slate-950 tracking-tight">User Directory</h2>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">Active Hub Registry</p>
                </div>
              </div>
              <div className="relative w-full md:w-[450px] group">
                <Search
                  className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors"
                  size={20}
                />
                <input
                  type="text"
                  placeholder="Filter by name or identity..."
                  className="w-full pl-16 pr-8 py-5 bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/20 focus:shadow-indigo-500/10 focus:border-indigo-200 outline-none transition-all font-bold text-sm tracking-tight placeholder:text-slate-300"
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Directory List */}
            <div className="bg-white/50 rounded-[2.5rem] p-2 border border-slate-100/50">
              <div className="grid grid-cols-1 gap-1">
                {loading ? (
                  <div className="py-24 flex flex-col items-center gap-4 bg-white rounded-[2.2rem]">
                    <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                    <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.3em]">Authorized Access Only</p>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="py-24 text-center bg-white rounded-[2.2rem]">
                    <Search className="mx-auto text-slate-100 mb-6" size={60} />
                    <p className="text-slate-400 font-black text-sm uppercase tracking-widest">No Matches Located</p>
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="group flex flex-row items-center justify-between p-3 sm:p-6 sm:px-10 bg-white border border-slate-50 rounded-2xl sm:rounded-[2rem] hover:border-indigo-100 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-300 gap-3"
                    >
                      <div className="flex items-center gap-3 sm:gap-6 min-w-0 flex-1">
                        <div className={cn(
                          "w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center text-white font-black text-sm sm:text-lg shadow-xl shrink-0 transition-transform group-hover:scale-105 group-hover:rotate-2",
                          user.role === "admin" ? "bg-slate-950 border border-slate-800" : "bg-indigo-600 ring-4 ring-indigo-50"
                        )}>
                          {user.name?.charAt(0) || <User size={20} />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-3">
                            <h4 className="font-black text-slate-900 truncate tracking-tight text-sm sm:text-lg">
                              {user.name || "Hub Member"}
                            </h4>
                            <span
                              className={cn(
                                "text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] px-2 sm:px-3 py-0.5 sm:py-1 rounded-full border leading-none shadow-sm",
                                user.role === "admin"
                                  ? "bg-rose-50 text-rose-600 border-rose-100"
                                  : "bg-emerald-50 text-emerald-600 border-emerald-100"
                              )}
                            >
                              {user.role}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-slate-400 mt-0.5 sm:mt-1">
                            <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                              <Mail size={12} className="opacity-40 shrink-0 sm:w-3.5 sm:h-3.5" />
                              <p className="text-[10px] sm:text-xs font-bold truncate tracking-tight opacity-70">
                                {user.email}
                              </p>
                            </div>
                            <span className="hidden sm:inline w-1 h-1 bg-slate-200 rounded-full" />
                            <p className="hidden md:block text-[9px] font-black uppercase tracking-widest opacity-40">
                              ID: {user.id.slice(0, 8)}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end shrink-0">
                        <button
                          onClick={() => deleteUser(user.id)}
                          disabled={user.role === "admin"}
                          className="flex items-center gap-2 p-3 sm:px-6 sm:py-4 text-slate-400 hover:text-white hover:bg-rose-500 rounded-xl sm:rounded-2xl transition-all disabled:opacity-0 active:scale-95 group/btn border border-transparent hover:border-rose-400 hover:shadow-xl hover:shadow-rose-500/20"
                          title="Revoke Access"
                        >
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] hidden md:group-hover/btn:block">Terminate Account</span>
                          <UserMinus size={16} className="sm:w-[18px]" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* CRITICAL ACTIONS - Mobile Bottom / Sidebar Bottom */}
          <div className="xl:col-span-3 order-3 xl:order-3">
            {/* Refined Danger Card */}
            <div className="bg-slate-950 rounded-[2.5rem] p-8 sm:p-10 text-white shadow-2xl shadow-slate-300 relative overflow-hidden group">
              {/* Glossy overlay effect */}
              <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-rose-500/10 to-transparent pointer-events-none" />

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-rose-500/20 text-rose-500 rounded-2xl border border-rose-500/10">
                    <AlertTriangle size={20} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-rose-400">Critical Control</span>
                </div>
                <h4 className="text-2xl font-black tracking-tight leading-tight">Global System Reset</h4>
                <p className="text-slate-400 text-xs mt-4 font-bold leading-relaxed uppercase tracking-widest opacity-70">
                  Wipe all routine data across the entire platform. This action is final.
                </p>
                <button
                  onClick={wipeGlobalClasses}
                  disabled={isWiping}
                  className="w-full mt-8 py-5 bg-white text-slate-950 hover:bg-rose-600 hover:text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-[0.98] disabled:opacity-50 shadow-xl shadow-white/5"
                >
                  {isWiping ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin" size={14} />
                      <span>Wiping Hub...</span>
                    </div>
                  ) : "Initialize Wipe"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminPanel;
