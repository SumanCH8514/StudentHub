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
  Trash2,
  ShieldAlert,
  ArrowLeft,
  Database,
  Search,
  UserMinus,
  Loader2,
} from "lucide-react";

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
    <div className="min-h-screen bg-[#F1F5F9] p-4 md:p-10 lg:p-16 animate-in fade-in duration-500">
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-indigo-600 font-bold mb-4 hover:translate-x-[-4px] transition-transform"
          >
            <ArrowLeft size={20} /> Dashboard
          </button>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <ShieldAlert className="text-red-500" size={36} /> Admin Panel
          </h1>
        </div>

        <button
          onClick={wipeGlobalClasses}
          disabled={isWiping}
          className="w-full md:w-auto bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-red-100 active:scale-95 transition-all"
        >
          {isWiping ? (
            <Loader2 className="animate-spin" />
          ) : (
            <Database size={20} />
          )}
          Wipe Global Classes
        </button>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Stats Card */}
        <div className="lg:col-span-1 bg-white rounded-[2.5rem] p-8 shadow-xl border border-slate-100">
          <div className="bg-indigo-50 w-16 h-16 rounded-2xl flex items-center justify-center text-indigo-600 mb-6">
            <Users size={32} />
          </div>
          <h3 className="text-slate-500 font-bold uppercase tracking-widest text-sm">
            Total Registered
          </h3>
          <p className="text-7xl font-black text-slate-900 mt-2">
            {users.length}
          </p>
        </div>

        {/* User Management List */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-6 md:p-10 shadow-xl border border-slate-100">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <h2 className="text-2xl font-black">User Directory</h2>
            <div className="relative w-full md:w-64">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Search name/email..."
                className="w-full pl-11 pr-4 py-3 bg-slate-50 rounded-xl border-none focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <p className="text-center py-10 animate-pulse font-bold">
                Loading users...
              </p>
            ) : (
              filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col sm:flex-row items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 group"
                >
                  <div className="flex items-center gap-4 mb-4 sm:mb-0 w-full">
                    <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg capitalize">
                      {user.name?.charAt(0)}
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="font-black text-slate-800 leading-none truncate">
                        {user.name}
                      </h4>
                      <p className="text-sm text-slate-500 font-medium truncate">
                        {user.email}
                      </p>
                      <span
                        className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${user.role === "admin" ? "bg-red-100 text-red-600" : "bg-slate-200 text-slate-600"}`}
                      >
                        {user.role}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => deleteUser(user.id)}
                    disabled={user.role === "admin"}
                    className="w-full sm:w-auto p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-0"
                  >
                    <UserMinus size={22} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
