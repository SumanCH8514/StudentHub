import React, { useState, useEffect, useMemo } from "react";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import {
  GraduationCap,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  CalendarDays,
  Layers,
  ChevronDown,
  ChevronUp,
  Building2,
  School,
  X,
  Users
} from "lucide-react";
import Loader from "../Loader.jsx";
import { DEFAULT_ACADEMIC_CONFIG, saveLocalAcademicConfig } from "../../utils/academicConfig";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export const AdminAcademicConfig = () => {
  const [config, setConfig] = useState(DEFAULT_ACADEMIC_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddUniModal, setShowAddUniModal] = useState(false);
  const [toast, setToast] = useState({ show: false, title: "", message: "", type: "success" });
  const [collapsedStreams, setCollapsedStreams] = useState({});

  const [newUniName, setNewUniName] = useState("");
  const [newStreamName, setNewStreamName] = useState("");
  const [newSemestersCount, setNewSemestersCount] = useState(8);
  const [newDefaultSections, setNewDefaultSections] = useState(4);

  const showNotification = (title, message, type = "success") => {
    setToast({ show: true, title, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
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

  const toggleCollapse = (streamId) => {
    setCollapsedStreams((prev) => ({
      ...prev,
      [streamId]: !prev[streamId]
    }));
  };

  const toggleAllCollapse = () => {
    const allCollapsed = config.streams.every((st) => collapsedStreams[st.id]);
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
      showNotification("Duplicate", `"${trimmed}" is already present in the institution list.`, "error");
      return;
    }

    setConfig((prev) => ({
      ...prev,
      universities: [...currentUnis, trimmed]
    }));

    setNewUniName("");
    setShowAddUniModal(false);
    showNotification("Institution Added", `Added "${trimmed}" to academic configuration.`);
  };

  const handleDeleteUniversity = (uniName) => {
    if (!window.confirm(`Are you sure you want to remove "${uniName}" from the institution directory?`)) return;

    setConfig((prev) => ({
      ...prev,
      universities: (prev.universities || ["SVU", "Regent", "Others"]).filter((u) => u !== uniName)
    }));
  };

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
    showNotification("Stream Created", `Configured new course "${newStreamObj.name}".`);
  };

  const handleDeleteStream = (streamId, streamName) => {
    if (!window.confirm(`Are you sure you want to delete the stream "${streamName}"?`)) return;

    setConfig((prev) => ({
      ...prev,
      streams: prev.streams.filter((st) => st.id !== streamId)
    }));
    showNotification("Stream Removed", `Removed "${streamName}".`);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    setSaveSuccess(false);

    saveLocalAcademicConfig(config);

    try {
      await setDoc(doc(db, "settings", "academic_structure"), config);
      showNotification("Saved Successfully", "Academic configuration published to cloud database.");
    } catch (err) {
      console.warn("Saved locally:", err?.message || err);
      showNotification("Saved Locally", "Saved changes to local browser memory.");
    } finally {
      setSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    }
  };

  const totalStreamsCount = config.streams.length;
  const totalSemestersCount = useMemo(
    () => config.streams.reduce((acc, st) => acc + (st.semestersCount || 0), 0),
    [config.streams]
  );
  const totalSectionsCount = useMemo(
    () =>
      config.streams.reduce((acc, st) => {
        const secObj = st.sectionsPerSemester || {};
        return acc + Object.values(secObj).reduce((sAcc, sVal) => sAcc + Number(sVal || 0), 0);
      }, 0),
    [config.streams]
  );

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center text-center">
        <Loader size="lg" message="Loading academic configurations..." />
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6 w-full max-w-7xl mx-auto pb-12">
      {toast.show && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-3 duration-300 max-w-sm w-full">
          <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl border border-slate-700 flex items-start gap-3">
            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0 mt-0.5">
              <CheckCircle2 size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-xs text-white">{toast.title}</h4>
              <p className="text-[11px] text-slate-300 mt-0.5 font-medium leading-relaxed">
                {toast.message}
              </p>
            </div>
            <button
              onClick={() => setToast((prev) => ({ ...prev, show: false }))}
              className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800/60 uppercase tracking-wider">
              <Layers size={12} /> Academic Catalog
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Academic Structure &amp; Courses
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl">
            Configure institutional universities, degree streams, semester duration, and section capacity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0 pt-2 md:pt-0">
          <button
            type="button"
            onClick={() => setShowAddUniModal(true)}
            className="flex-1 sm:flex-none h-10 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Building2 size={15} />
            <span>Add University</span>
          </button>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex-1 sm:flex-none h-10 px-3.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Plus size={15} />
            <span>Add Stream</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            disabled={saving}
            className="flex-1 sm:flex-none h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
          >
            {saving ? <Loader inline size="sm" /> : <Save size={15} />}
            <span>{saving ? "Saving..." : "Save Configuration"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Active Streams
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <GraduationCap size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {totalStreamsCount}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium truncate">
              Degree Programs
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Semesters
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <CalendarDays size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {totalSemestersCount}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium truncate">
              Academic Cycles
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total Sections
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {totalSectionsCount}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium truncate">
              Class Divisions
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Building2 size={16} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                Configured Universities &amp; Colleges
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Institutions available in timetable search and student registration.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowAddUniModal(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            <Plus size={13} />
            <span>Add New</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {(config.universities || ["SVU", "Regent", "Others"]).map((uni) => (
            <div
              key={uni}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700/80 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-600/80 shadow-2xs"
            >
              <School size={13} className="text-blue-500 dark:text-blue-400" />
              <span>{uni}</span>
              {(config.universities || []).length > 1 && (
                <button
                  type="button"
                  onClick={() => handleDeleteUniversity(uni)}
                  className="text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 p-0.5 rounded transition-colors ml-0.5 cursor-pointer"
                  title={`Remove ${uni}`}
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between gap-3 px-0.5">
          <div className="min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Course Streams</span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 border border-blue-100 dark:border-blue-800/40">
                {config.streams.length}
              </span>
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
              Manage duration and sections per semester
            </p>
          </div>

          <button
            type="button"
            onClick={toggleAllCollapse}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-all border border-slate-200/80 dark:border-slate-600/80 shrink-0 cursor-pointer whitespace-nowrap active:scale-95 shadow-2xs"
          >
            {config.streams.every((st) => collapsedStreams[st.id]) ? (
              <>
                <span>Expand All</span>
                <ChevronDown size={14} className="text-slate-400 dark:text-slate-300" />
              </>
            ) : (
              <>
                <span>Collapse All</span>
                <ChevronUp size={14} className="text-slate-400 dark:text-slate-300" />
              </>
            )}
          </button>
        </div>

        <div className="space-y-3">
          {config.streams.map((stream) => {
            const isCollapsed = Boolean(collapsedStreams[stream.id]);
            const semList = Array.from({ length: stream.semestersCount || 1 }, (_, i) => (i + 1).toString());
            const totalSecsForStream = Object.values(stream.sectionsPerSemester || {}).reduce(
              (acc, val) => acc + Number(val || 0),
              0
            );

            return (
              <div
                key={stream.id}
                className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs overflow-hidden transition-colors"
              >
                <div
                  onClick={() => toggleCollapse(stream.id)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 cursor-pointer hover:bg-slate-50/70 dark:hover:bg-slate-700/40 transition-colors"
                >
                  <div className="flex items-center justify-between sm:justify-start gap-3 min-w-0 w-full sm:w-auto">
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-xs shrink-0">
                        {stream.name.slice(0, 3).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate">
                            {stream.name}
                          </h3>
                          <span className="px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 uppercase tracking-wider shrink-0">
                            {stream.id}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          {stream.semestersCount} Semesters • {totalSecsForStream} Total Sections
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCollapse(stream.id);
                      }}
                      className="sm:hidden p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer shrink-0"
                    >
                      {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                    </button>
                  </div>

                  <div
                    className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t border-slate-100 dark:border-slate-700/60 sm:border-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center gap-1.5">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Duration:
                      </label>
                      <select
                        value={stream.semestersCount}
                        onChange={(e) => handleStreamSemestersChange(stream.id, e.target.value)}
                        className="bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-blue-500/20 cursor-pointer outline-none"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                          <option key={n} value={n}>
                            {n} Semesters
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleDeleteStream(stream.id, stream.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                        title={`Delete ${stream.name}`}
                      >
                        <Trash2 size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleCollapse(stream.id)}
                        className="hidden sm:inline-flex p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
                      >
                        {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                {!isCollapsed && (
                  <div className="p-4 sm:p-5 pt-0 sm:pt-0 border-t border-slate-100 dark:border-slate-700/80 space-y-3 mt-1">
                    <div className="flex items-center justify-between pt-3">
                      <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Section Distribution per Semester
                      </p>
                      <span className="text-[11px] text-slate-400 font-medium">Select max sections (A, B, C...)</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
                      {semList.map((semNum) => {
                        const secVal = stream.sectionsPerSemester?.[semNum] || 4;

                        return (
                          <div
                            key={semNum}
                            className="bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-700/80 flex flex-col items-center justify-center gap-1.5 text-center"
                          >
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                              Sem {semNum}
                            </span>

                            <select
                              value={secVal}
                              onChange={(e) => handleSectionCountChange(stream.id, semNum, e.target.value)}
                              className="w-full text-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md py-1 px-1 text-xs font-bold text-blue-600 dark:text-blue-400 focus:ring-2 focus:ring-blue-500/20 cursor-pointer outline-none shadow-2xs"
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
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-xl space-y-5 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shrink-0">
                <Plus size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Add New Course Stream</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Define a degree branch in the curriculum</p>
              </div>
            </div>

            <form onSubmit={handleAddStream} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Stream / Course Name</label>
                <input
                  type="text"
                  placeholder="e.g. B.Tech CSE, MCA, B.Sc"
                  value={newStreamName}
                  onChange={(e) => setNewStreamName(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl py-2.5 px-3.5 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Semesters</label>
                  <select
                    value={newSemestersCount}
                    onChange={(e) => setNewSemestersCount(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl py-2.5 px-3 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 cursor-pointer outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((n) => (
                      <option key={n} value={n}>
                        {n} Semesters
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Default Sections</label>
                  <select
                    value={newDefaultSections}
                    onChange={(e) => setNewDefaultSections(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl py-2.5 px-3 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 cursor-pointer outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <option key={n} value={n}>
                        {n} Sections
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
                >
                  Create Stream
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddUniModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-700 shadow-xl space-y-5 relative">
            <button
              onClick={() => setShowAddUniModal(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shrink-0">
                <Building2 size={20} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Add University / College</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Add an educational institution to the catalog</p>
              </div>
            </div>

            <form onSubmit={handleAddUniversity} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">University / College Name</label>
                <input
                  type="text"
                  placeholder="e.g. MAKAUT, Techno India, Brainware University"
                  value={newUniName}
                  onChange={(e) => setNewUniName(e.target.value)}
                  required
                  className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl py-2.5 px-3.5 text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddUniModal(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
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
