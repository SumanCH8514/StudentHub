import React, { useState, useEffect } from "react";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import {
  GraduationCap,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  Users as UsersIcon,
  CalendarDays,
  Layers,
  Sparkles,
  RefreshCw,
  Edit3,
  ChevronDown,
  ChevronUp,
  Building2,
  School,
  X
} from "lucide-react";
import Loader from "../Loader.jsx";
import { DEFAULT_ACADEMIC_CONFIG, saveLocalAcademicConfig } from "../../utils/academicConfig";

const AdminAcademicConfig = () => {
  const [config, setConfig] = useState(DEFAULT_ACADEMIC_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddUniModal, setShowAddUniModal] = useState(false);
  const [toast, setToast] = useState({ show: false, title: "", message: "", type: "success" });
  const [collapsedStreams, setCollapsedStreams] = useState({});

  const [newUniName, setNewUniName] = useState("");

  const toggleCollapse = (streamId) => {
    setCollapsedStreams((prev) => {
      const currentState = prev[streamId] !== false;
      return {
        ...prev,
        [streamId]: !currentState
      };
    });
  };

  const toggleAllCollapse = () => {
    const allCollapsed = config.streams.every((st) => collapsedStreams[st.id] !== false);
    const newState = {};
    config.streams.forEach((st) => {
      newState[st.id] = !allCollapsed;
    });
    setCollapsedStreams(newState);
  };

  const handleAddUniversity = (e) => {
    e.preventDefault();
    if (!newUniName.trim()) return;

    const trimmed = newUniName.trim();
    const currentUnis = config.universities || ["SVU", "Regent", "Others"];

    if (currentUnis.some((u) => u.toLowerCase() === trimmed.toLowerCase())) {
      showNotification("Duplicate Error", `"${trimmed}" is already in the university list.`, "error");
      return;
    }

    setConfig((prev) => ({
      ...prev,
      universities: [...(prev.universities || ["SVU", "Regent", "Others"]), trimmed]
    }));

    setNewUniName("");
    setShowAddUniModal(false);
    showNotification("University Added", `Added "${trimmed}" to academic configuration.`);
  };

  const handleDeleteUniversity = (uniName) => {
    if (!window.confirm(`Are you sure you want to remove "${uniName}"?`)) return;

    setConfig((prev) => ({
      ...prev,
      universities: (prev.universities || ["SVU", "Regent", "Others"]).filter((u) => u !== uniName)
    }));
  };

  const [newStreamName, setNewStreamName] = useState("");
  const [newSemestersCount, setNewSemestersCount] = useState(8);
  const [newDefaultSections, setNewDefaultSections] = useState(4);

  const showNotification = (title, message, type = "success") => {
    setToast({ show: true, title, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4500);
  };

  useEffect(() => {
    const docRef = doc(db, "settings", "academic_structure");
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists() && docSnap.data().streams) {
          setConfig(docSnap.data());
        } else {
          setConfig(DEFAULT_ACADEMIC_CONFIG);
        }
        setLoading(false);
      },
      () => {
        setConfig(DEFAULT_ACADEMIC_CONFIG);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const handleStreamSemestersChange = (streamId, newCount) => {
    const parsedCount = Math.max(1, Math.min(12, parseInt(newCount) || 1));
    
    setConfig((prev) => {
      const updatedStreams = prev.streams.map((st) => {
        if (st.id !== streamId) return st;

        const updatedSections = { ...st.sectionsPerSemester };
        for (let i = 1; i <= parsedCount; i++) {
          if (!updatedSections[i.toString()]) {
            updatedSections[i.toString()] = 4;
          }
        }
        
        Object.keys(updatedSections).forEach((semKey) => {
          if (parseInt(semKey) > parsedCount) {
            delete updatedSections[semKey];
          }
        });

        return {
          ...st,
          semestersCount: parsedCount,
          sectionsPerSemester: updatedSections
        };
      });

      return { ...prev, streams: updatedStreams };
    });
  };

  const handleSectionCountChange = (streamId, semesterNum, newSecCount) => {
    const parsedSec = Math.max(1, Math.min(10, parseInt(newSecCount) || 1));

    setConfig((prev) => {
      const updatedStreams = prev.streams.map((st) => {
        if (st.id !== streamId) return st;
        return {
          ...st,
          sectionsPerSemester: {
            ...st.sectionsPerSemester,
            [semesterNum.toString()]: parsedSec
          }
        };
      });

      return { ...prev, streams: updatedStreams };
    });
  };

  const handleAddStream = (e) => {
    e.preventDefault();
    if (!newStreamName.trim()) return;

    const streamId = newStreamName.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
    const semCount = Math.max(1, Math.min(12, parseInt(newSemestersCount) || 1));
    const secCount = Math.max(1, Math.min(10, parseInt(newDefaultSections) || 1));

    const initialSections = {};
    for (let i = 1; i <= semCount; i++) {
      initialSections[i.toString()] = secCount;
    }

    const newStreamObj = {
      id: streamId,
      name: newStreamName.trim(),
      semestersCount: semCount,
      sectionsPerSemester: initialSections
    };

    setConfig((prev) => ({
      ...prev,
      streams: [...prev.streams.filter((s) => s.id !== streamId), newStreamObj]
    }));

    setNewStreamName("");
    setNewSemestersCount(8);
    setNewDefaultSections(4);
    setShowAddModal(false);
  };

  const handleDeleteStream = (streamId) => {
    if (!window.confirm("Are you sure you want to remove this stream configuration?")) return;

    setConfig((prev) => ({
      ...prev,
      streams: prev.streams.filter((st) => st.id !== streamId)
    }));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setSaveSuccess(false);

    saveLocalAcademicConfig(config);

    try {
      await setDoc(doc(db, "settings", "academic_structure"), config);
    } catch (err) {
      console.warn("Firestore save note (saved locally):", err?.message || err);
    } finally {
      setSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    }
  };

  const totalStreamsCount = config.streams.length;
  const totalSemestersCount = config.streams.reduce((acc, st) => acc + (st.semestersCount || 0), 0);
  const totalSectionsCount = config.streams.reduce((acc, st) => {
    const secObj = st.sectionsPerSemester || {};
    return acc + Object.values(secObj).reduce((sAcc, sVal) => sAcc + Number(sVal || 0), 0);
  }, 0);

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center">
        <Loader size="lg" message="Loading academic configurations..." />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto px-1 sm:px-4 relative">
      {/* Toast Notification */}
      {toast.show && (
        <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 z-50 animate-in fade-in slide-in-from-top-5 duration-300 max-w-md ml-auto">
          <div className="bg-slate-900/95 dark:bg-slate-900/95 text-white p-4 rounded-2xl shadow-2xl border border-emerald-500/40 flex items-start gap-3 backdrop-blur-xl ring-1 ring-emerald-500/20">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <div className="flex-1 min-w-0 pr-1">
              <h4 className="font-bold text-xs sm:text-sm text-white">{toast.title}</h4>
              <p className="text-[11px] sm:text-xs text-slate-300 mt-0.5 font-medium leading-snug">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => setToast((prev) => ({ ...prev, show: false }))}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-3.5 sm:gap-4">
          <div className="w-11 h-11 sm:w-14 sm:h-14 bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 shrink-0">
            <Layers size={24} className="sm:w-7 sm:h-7" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Academic Configurator
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium mt-0.5">
              Manage Streams, Semesters, and Section counts live.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setShowAddUniModal(true)}
            className="flex-1 md:flex-initial h-11 sm:h-12 px-3.5 sm:px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-all active:scale-95 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <Building2 size={16} />
            <span>Add University</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex-1 md:flex-initial h-11 sm:h-12 px-3.5 sm:px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-all active:scale-95 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <Plus size={16} />
            <span>Add Stream</span>
          </button>

          <button
            onClick={handleSaveAll}
            disabled={saving}
            className="flex-1 md:flex-initial h-11 sm:h-12 px-4 sm:px-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm transition-all shadow-lg shadow-indigo-500/25 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            {saving ? <Loader inline size="sm" /> : <Save size={16} />}
            <span>{saving ? "Saving..." : "Save All Config"}</span>
          </button>
        </div>
      </div>

      {/* Summary Bento Stats */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-3 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-2.5 sm:gap-4 text-center sm:text-left">
          <div className="w-9 h-9 sm:w-12 sm:h-12 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center shrink-0 border border-indigo-100 dark:border-indigo-900/40">
            <GraduationCap size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-slate-400 dark:text-slate-500 text-[9px] sm:text-[11px] font-black uppercase tracking-wider">Streams</p>
            <p className="text-lg sm:text-2xl font-black text-slate-800 dark:text-white mt-0.5">{totalStreamsCount}</p>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-3 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-2.5 sm:gap-4 text-center sm:text-left">
          <div className="w-9 h-9 sm:w-12 sm:h-12 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center shrink-0 border border-purple-100 dark:border-purple-900/40">
            <CalendarDays size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-slate-400 dark:text-slate-500 text-[9px] sm:text-[11px] font-black uppercase tracking-wider">Semesters</p>
            <p className="text-lg sm:text-2xl font-black text-slate-800 dark:text-white mt-0.5">{totalSemestersCount}</p>
          </div>
        </div>

        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl p-3 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center sm:items-start gap-2.5 sm:gap-4 text-center sm:text-left">
          <div className="w-9 h-9 sm:w-12 sm:h-12 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center shrink-0 border border-emerald-100 dark:border-emerald-900/40">
            <UsersIcon size={20} className="sm:w-6 sm:h-6" />
          </div>
          <div>
            <p className="text-slate-400 dark:text-slate-500 text-[9px] sm:text-[11px] font-black uppercase tracking-wider">Sections</p>
            <p className="text-lg sm:text-2xl font-black text-slate-800 dark:text-white mt-0.5">{totalSectionsCount}</p>
          </div>
        </div>
      </div>

      {/* Universities / Colleges Section */}
      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-900/50">
              <Building2 size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm sm:text-base">
                Universities & Colleges
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 font-medium">
                Configured institutions available across all routine upload forms.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowAddUniModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-xl font-bold text-xs border border-blue-200/60 dark:border-blue-800/40 transition-all active:scale-95 shrink-0"
          >
            <Plus size={14} />
            <span>Add New</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {(config.universities || ["SVU", "Regent", "Others"]).map((uni) => (
            <div
              key={uni}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 rounded-xl font-bold text-xs border border-slate-200/80 dark:border-slate-700/80 shadow-2xs group hover:border-indigo-300 dark:hover:border-indigo-700 transition-all"
            >
              <School size={14} className="text-indigo-500" />
              <span>{uni}</span>
              {(config.universities || []).length > 1 && (
                <button
                  type="button"
                  onClick={() => handleDeleteUniversity(uni)}
                  className="text-slate-400 hover:text-rose-500 p-0.5 rounded transition-colors ml-0.5"
                  title={`Remove ${uni}`}
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Stream Configurations List Header */}
      <div className="flex items-center justify-between pt-2">
        <h3 className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Configured Stream Branches ({config.streams.length})
        </h3>
        <button
          onClick={toggleAllCollapse}
          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
        >
          {config.streams.every((st) => collapsedStreams[st.id] !== false) ? "Expand All" : "Collapse All"}
        </button>
      </div>

      {/* Stream Configurations List */}
      <div className="space-y-4 sm:space-y-6">
        {config.streams.map((stream) => {
          const isCollapsed = collapsedStreams[stream.id] !== false;
          const semList = Array.from({ length: stream.semestersCount || 1 }, (_, i) => (i + 1).toString());
          const totalSecsForStream = Object.values(stream.sectionsPerSemester || {}).reduce(
            (acc, val) => acc + Number(val || 0),
            0
          );

          return (
            <div
              key={stream.id}
              className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-lg relative overflow-hidden transition-all hover:border-slate-300 dark:hover:border-slate-700"
            >
              {/* Top Stream Bar */}
              <div
                onClick={() => toggleCollapse(stream.id)}
                className="flex items-center justify-between gap-2 p-3 sm:p-4.5 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0 shrink">
                  <span className="px-2.5 py-1 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 text-indigo-600 dark:text-indigo-300 rounded-xl font-black text-xs sm:text-sm border border-indigo-200/50 dark:border-indigo-800/40 shadow-xs shrink-0 whitespace-nowrap">
                    {stream.name}
                  </span>
                  <span className="text-[11px] text-slate-400 font-bold hidden md:inline-block truncate">
                    ID: <code className="text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">{stream.id}</code>
                  </span>
                  {isCollapsed && (
                    <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 truncate hidden sm:inline-block">
                      ({stream.semestersCount} Sems • {totalSecsForStream} Secs)
                    </span>
                  )}
                </div>

                <div
                  className="flex items-center gap-1.5 sm:gap-2.5 shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center gap-1">
                    <label className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-wider hidden sm:inline-block whitespace-nowrap">Semesters:</label>
                    <select
                      value={stream.semestersCount}
                      onChange={(e) => handleStreamSemestersChange(stream.id, e.target.value)}
                      className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2 py-1 sm:px-2.5 sm:py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/30 cursor-pointer outline-none whitespace-nowrap"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                        <option key={n} value={n}>
                          {n} Sems
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteStream(stream.id)}
                    className="p-1.5 sm:p-2 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-all border border-transparent hover:border-rose-200 dark:hover:border-rose-900/50"
                    title="Remove Stream"
                  >
                    <Trash2 size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleCollapse(stream.id)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
                    title={isCollapsed ? "Expand" : "Collapse"}
                  >
                    {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                  </button>
                </div>
              </div>

              {/* Sections Breakdown Grid */}
              {!isCollapsed && (
                <div className="p-4 sm:p-6 pt-0 sm:pt-0 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5 animate-in fade-in duration-200 mt-3 sm:mt-4">
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-[10px] sm:text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Section Counts per Semester
                    </p>
                    <span className="text-[10px] font-bold text-slate-400">({stream.semestersCount} Semesters)</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3">
                    {semList.map((semNum) => {
                      const secVal = stream.sectionsPerSemester?.[semNum] || 4;

                      return (
                        <div
                          key={semNum}
                          className="bg-slate-50/80 dark:bg-slate-800/40 p-2.5 rounded-xl sm:rounded-2xl border border-slate-200/70 dark:border-slate-800 flex flex-col items-center justify-center gap-1.5 text-center transition-all hover:bg-slate-100/80 dark:hover:bg-slate-800/60"
                        >
                          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                            Sem {semNum}
                          </span>

                          <select
                            value={secVal}
                            onChange={(e) => handleSectionCountChange(stream.id, semNum, e.target.value)}
                            className="w-full text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-1 px-1.5 text-xs font-black text-indigo-600 dark:text-indigo-400 focus:ring-2 focus:ring-indigo-500/30 cursor-pointer shadow-2xs outline-none"
                          >
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((secCount) => (
                              <option key={secCount} value={secCount}>
                                {secCount} Secs
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add New Stream Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[2.2rem] p-6 sm:p-8 max-w-lg sm:max-w-xl w-full border border-slate-200/80 dark:border-slate-800 shadow-2xl shadow-indigo-500/10 space-y-6 relative overflow-hidden">
            <div className="absolute -top-16 -right-16 w-36 h-36 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-full blur-2xl pointer-events-none" />

            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 shrink-0">
                <Plus size={24} className="sm:w-7 sm:h-7" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-xl sm:text-2xl tracking-tight">Add New Stream</h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">Define a new academic course structure.</p>
              </div>
            </div>

            <form onSubmit={handleAddStream} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider ml-0.5">Stream Name</label>
                <input
                  type="text"
                  placeholder="e.g. M.Tech, MCA, B.Sc"
                  value={newStreamName}
                  onChange={(e) => setNewStreamName(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl py-3 px-4 text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider ml-0.5">Total Semesters</label>
                  <select
                    value={newSemestersCount}
                    onChange={(e) => setNewSemestersCount(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl py-3 px-3.5 text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/30 cursor-pointer outline-none transition-all"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                      <option key={n} value={n}>
                        {n} Semesters
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider ml-0.5">Default Sections</label>
                  <select
                    value={newDefaultSections}
                    onChange={(e) => setNewDefaultSections(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl py-3 px-3.5 text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/30 cursor-pointer outline-none transition-all"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <option key={n} value={n}>
                        {n} Sections
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 px-5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl font-black text-sm shadow-lg shadow-indigo-500/30 transition-all active:scale-95"
                >
                  Create Stream
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New University Modal */}
      {showAddUniModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[2.2rem] p-6 sm:p-8 max-w-lg sm:max-w-xl w-full border border-slate-200/80 dark:border-slate-800 shadow-2xl shadow-blue-500/10 space-y-6 relative overflow-hidden">
            <div className="absolute -top-16 -right-16 w-36 h-36 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 rounded-full blur-2xl pointer-events-none" />

            <button
              onClick={() => setShowAddUniModal(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-tr from-blue-600 via-indigo-600 to-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30 shrink-0">
                <Building2 size={24} className="sm:w-7 sm:h-7" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-xl sm:text-2xl tracking-tight">Add University / College</h3>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">Add a new educational institution.</p>
              </div>
            </div>

            <form onSubmit={handleAddUniversity} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider ml-0.5">University / College Name</label>
                <input
                  type="text"
                  placeholder="e.g. MAKAUT, Techno India, Brainware University"
                  value={newUniName}
                  onChange={(e) => setNewUniName(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 rounded-xl py-3 px-4 text-sm font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div className="pt-3 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddUniModal(false)}
                  className="flex-1 py-3 px-5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-black text-sm shadow-lg shadow-blue-500/30 transition-all active:scale-95"
                >
                  Add Institution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAcademicConfig;
