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
  updateDoc,
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
  CheckCircle2
} from "lucide-react";
import Footer from "./Footer.jsx";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const Settings = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [message, setMessage] = useState("");
  const [saveStatus, setSaveStatus] = useState(null); // 'success' | 'error'

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
  });

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) {
        setFetching(false);
        return;
      }

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
          }));
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setFetching(false);
      }
    };

    fetchUserData();
  }, []);

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    setSaveStatus(null);
    setMessage("");

    try {
      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        ...formData,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      setSaveStatus("success");
      setMessage("Profile updated successfully!");
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      console.error("Save Error:", error);
      setSaveStatus("error");
      setMessage("Failed to save changes. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const deleteAllRoutines = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const confirmWipe = window.confirm(
      "Are you sure? This will permanently delete ALL your uploaded routines.",
    );
    if (!confirmWipe) return;

    setLoading(true);
    try {
      const classesRef = collection(db, "users", user.uid, "user_classes");
      const querySnapshot = await getDocs(classesRef);

      const batch = writeBatch(db);
      querySnapshot.forEach((document) => {
        batch.delete(document.ref);
      });

      await batch.commit();
      setMessage("All routine data has been cleared successfully.");
    } catch (error) {
      console.error("Delete Error:", error);
      setMessage("Failed to delete data.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-indigo-600" size={48} />
          <p className="text-slate-500 font-black tracking-widest uppercase text-xs">Loading Preferences...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] font-sans antialiased pb-20">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 sm:px-12 sm:py-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <button
            onClick={onBack}
            className="group flex items-center gap-3 text-slate-500 hover:text-slate-900 font-bold transition-all active:scale-95"
          >
            <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-slate-100 transition-colors">
              <ArrowLeft size={18} />
            </div>
            <span className="hidden sm:inline text-sm uppercase tracking-widest">Dashboard</span>
          </button>

          <div className="flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-2xl">
            <SettingsIcon size={16} className="text-slate-500" />
            <span className="text-xs font-black uppercase tracking-widest text-slate-700">Settings</span>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10 sm:py-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col mb-12">
          <h1 className="text-4xl sm:text-6xl font-black text-slate-950 tracking-tighter mb-4">
            Account <span className="text-indigo-600">Settings</span>
          </h1>
          <p className="text-slate-500 font-bold text-sm sm:text-lg max-w-2xl leading-relaxed">
            Manage your academic profile and application preferences. Keep your data updated for accurate routine scanning and AI insights.
          </p>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-8">
          {/* Profile Section */}
          <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-[100px] -mr-20 -mt-20 opacity-30 group-hover:opacity-50 transition-opacity" />

            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-10">
                <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/20">
                  <User size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 leading-none">Personal Profile</h3>
                  <p className="text-slate-400 font-bold text-sm mt-1">Your basic identification details</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Full Name</label>
                  <div className="relative group/input">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-indigo-600 transition-colors" size={18} />
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleFieldChange}
                      className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-14 pr-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all outline-none"
                      placeholder="Enter your name"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Email Address</label>
                  <div className="relative group/input">
                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-indigo-600 transition-colors" size={18} />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleFieldChange}
                      className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-14 pr-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all outline-none"
                      placeholder="name@university.edu"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Phone Number</label>
                  <div className="relative group/input">
                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-indigo-600 transition-colors" size={18} />
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleFieldChange}
                      className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-14 pr-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all outline-none"
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Academic Section */}
          <div className="bg-white rounded-[2.5rem] p-8 sm:p-12 border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group">
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-50 rounded-full blur-[100px] -ml-20 -mb-20 opacity-30 group-hover:opacity-50 transition-opacity" />

            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-10">
                <div className="p-4 bg-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/20">
                  <GraduationCap size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 leading-none">Academic Profile</h3>
                  <p className="text-slate-400 font-bold text-sm mt-1">Your university and course details</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">University / College</label>
                  <div className="relative group/input">
                    <BookOpen className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-indigo-600 transition-colors" size={18} />
                    <select
                      name="university"
                      value={formData.university}
                      onChange={handleFieldChange}
                      className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-14 pr-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all outline-none appearance-none"
                    >
                      <option value="SVU">SVU</option>
                      <option value="Regent">Regent</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>
                </div>

                {formData.university === "Others" && (
                  <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Custom Institution Name</label>
                    <input
                      type="text"
                      name="customUniversity"
                      value={formData.customUniversity}
                      onChange={handleFieldChange}
                      className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all outline-none"
                      placeholder="Enter your college/university name"
                      required
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Stream / Course</label>
                  <div className="relative group/input">
                    <GraduationCap className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-indigo-600 transition-colors" size={18} />
                    <select
                      name="stream"
                      value={formData.stream}
                      onChange={handleFieldChange}
                      className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-14 pr-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all outline-none appearance-none"
                    >
                      <option value="B.Tech">B.Tech</option>
                      <option value="BCA">BCA</option>
                      <option value="ANCS">ANCS</option>
                      <option value="DIPLOMA">DIPLOMA</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {formData.stream === "Other" && (
                  <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Custom Stream Name</label>
                    <input
                      type="text"
                      name="customStream"
                      value={formData.customStream}
                      onChange={handleFieldChange}
                      className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all outline-none"
                      placeholder="Enter your course name"
                      required
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Semester</label>
                    <select
                      name="semester"
                      value={formData.semester}
                      onChange={handleFieldChange}
                      className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all outline-none appearance-none text-center"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                        <option key={num} value={num}>Semester {num}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Section</label>
                    <select
                      name="section"
                      value={formData.section}
                      onChange={handleFieldChange}
                      className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all outline-none appearance-none text-center"
                    >
                      {[1, 2, 3, 4].map(num => (
                        <option key={num} value={num}>Section {num}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">University Roll Number</label>
                  <div className="relative group/input">
                    <Hash className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within/input:text-indigo-600 transition-colors" size={18} />
                    <input
                      type="text"
                      name="rollNumber"
                      value={formData.rollNumber}
                      onChange={handleFieldChange}
                      className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-14 pr-6 font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/20 focus:bg-white transition-all outline-none"
                      placeholder="Registration / Roll No."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto min-w-[200px] flex items-center justify-center gap-3 bg-indigo-600 hover:bg-slate-950 text-white px-10 py-5 rounded-[1.5rem] font-black text-lg transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-indigo-200"
            >
              {loading ? <Loader2 className="animate-spin" size={24} /> : <Save size={22} />}
              Save All Changes
            </button>

            {saveStatus === "success" && (
              <div className="flex items-center gap-3 text-emerald-600 font-black uppercase tracking-widest text-xs animate-in fade-in slide-in-from-left-4">
                <CheckCircle2 size={18} />
                Profile Synchronized
              </div>
            )}
          </div>
        </form>

        {/* Danger Zone Section */}
        <div className="mt-24">
          <div className="flex items-center gap-4 mb-8 ml-4">
            <Shield size={20} className="text-rose-500" />
            <h2 className="text-lg font-black uppercase tracking-[0.2em] text-slate-400">Security & Data Control</h2>
          </div>

          <div className="bg-white border border-rose-100 rounded-[2.5rem] p-8 sm:p-12 relative overflow-hidden group shadow-2xl shadow-rose-900/5">
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-50 rounded-full blur-[100px] -mr-20 -mt-20 opacity-50 group-hover:opacity-100 transition-opacity" />

            <div className="relative z-10">
              <div className="flex flex-col sm:flex-row gap-8 items-start">
                <div className="p-6 bg-rose-50 text-rose-500 rounded-[2rem] border border-rose-100">
                  <AlertTriangle size={32} />
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-black text-rose-950 mb-3">Wipe All Routine Data</h3>
                  <p className="text-rose-700/70 font-bold mb-8 leading-relaxed max-w-xl">
                    This action is irreversible. Once confirmed, all your uploaded class schedules and routine mappings will be permanently erased from our system.
                  </p>

                  <button
                    onClick={deleteAllRoutines}
                    disabled={loading}
                    className="w-full sm:w-auto flex items-center justify-center gap-3 bg-slate-900 hover:bg-rose-600 text-white px-10 py-4 rounded-[1.25rem] font-black text-sm uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 shadow-xl shadow-slate-900/10 hover:shadow-rose-500/20"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <Trash2 size={18} />
                    )}
                    Clear Routine Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {message && saveStatus !== "success" && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl animate-in fade-in slide-in-from-bottom-8">
            {message}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Settings;
