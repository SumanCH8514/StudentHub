import React, { useState, useEffect } from "react";
import {
    Settings,
    Cpu,
    Volume2,
    Key,
    Sparkles,
    Check,
    Save,
    Shield,
    Sliders,
    MessageSquare,
    Zap
} from "lucide-react";
import { db } from "../../firebaseConfig";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import Loader from "../Loader.jsx";

const AdminAssistantSettings = () => {
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [notification, setNotification] = useState(null);

    // Form state
    const [geminiEnabled, setGeminiEnabled] = useState(true);
    const [activeKeyId, setActiveKeyId] = useState(1);
    const [primaryModel, setPrimaryModel] = useState("gemini-2.0-flash");
    const [defaultVoice, setDefaultVoice] = useState("Aoede");
    const [systemPrompt, setSystemPrompt] = useState(
        "You are StudentHub AI Assistant, an intelligent academic companion for university students. Provide helpful, friendly answers about class schedules, rooms, labs, teachers, and college updates."
    );
    const [autoSpeakReplies, setAutoSpeakReplies] = useState(false);
    const [offlineFallbackEnabled, setOfflineFallbackEnabled] = useState(true);
    const [maxTokens, setMaxTokens] = useState(800);

    const showNotify = (msg, type = "success") => {
        setNotification({ msg, type });
        setTimeout(() => setNotification(null), 3500);
    };

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const systemDoc = await getDoc(doc(db, "settings", "system"));
            if (systemDoc.exists()) {
                const data = systemDoc.data();
                if (data.geminiAssistantEnabled !== undefined) setGeminiEnabled(data.geminiAssistantEnabled);
                if (data.activeGeminiKeyId !== undefined) setActiveKeyId(data.activeGeminiKeyId);
                if (data.primaryAiModel) setPrimaryModel(data.primaryAiModel);
                if (data.defaultVoice) setDefaultVoice(data.defaultVoice);
                if (data.systemPrompt) setSystemPrompt(data.systemPrompt);
                if (data.autoSpeakReplies !== undefined) setAutoSpeakReplies(data.autoSpeakReplies);
                if (data.offlineFallbackEnabled !== undefined) setOfflineFallbackEnabled(data.offlineFallbackEnabled);
                if (data.maxTokens) setMaxTokens(data.maxTokens);
            }
        } catch (err) {
            console.error("Failed to fetch assistant settings:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleSaveSettings = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await setDoc(
                doc(db, "settings", "system"),
                {
                    geminiAssistantEnabled: geminiEnabled,
                    activeGeminiKeyId: activeKeyId,
                    primaryAiModel: primaryModel,
                    defaultVoice: defaultVoice,
                    systemPrompt: systemPrompt,
                    autoSpeakReplies: autoSpeakReplies,
                    offlineFallbackEnabled: offlineFallbackEnabled,
                    maxTokens: parseInt(maxTokens) || 800,
                    updatedAt: new Date().toISOString()
                },
                { merge: true }
            );

            showNotify("AI Assistant settings saved successfully!");
        } catch (err) {
            console.error("Error saving settings:", err);
            showNotify("Failed to save settings to database.", "error");
        } finally {
            setIsSaving(false);
        }
    };

    const voicesList = [
        { name: "Aoede", desc: "Warm Female" },
        { name: "Puck", desc: "Energetic Male" },
        { name: "Charon", desc: "Calm Male" },
        { name: "Kore", desc: "Soft Female" },
        { name: "Fenrir", desc: "Deep Male" },
        { name: "Leda", desc: "Clear Female" },
        { name: "Orus", desc: "Rich Male" },
        { name: "Zephyr", desc: "Bright Female" }
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                        <Settings className="text-indigo-600 dark:text-indigo-400" size={24} />
                        Assistant Global Settings & Configuration
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Configure AI model behavior, system prompts, voices, API keys, and fallback preferences.
                    </p>
                </div>
                <button
                    onClick={handleSaveSettings}
                    disabled={isSaving}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-md shadow-indigo-200 dark:shadow-none shrink-0"
                >
                    {isSaving ? <Loader inline size="sm" /> : <Save size={16} />}
                    <span>Save All Settings</span>
                </button>
            </div>

            {notification && (
                <div
                    className={`p-4 rounded-xl text-xs font-bold transition-all ${
                        notification.type === "error"
                            ? "bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800"
                            : "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                    }`}
                >
                    {notification.msg}
                </div>
            )}

            {loading ? (
                <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <Loader inline size="md" />
                    <p className="text-xs text-slate-400 mt-2 font-medium">Loading configuration parameters...</p>
                </div>
            ) : (
                <form onSubmit={handleSaveSettings} className="space-y-6">
                    {/* Master Switch & Engine Status */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <Sparkles className="text-indigo-600" size={18} />
                                    Master AI Assistant Toggle
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Enable or disable the AI Assistant for all platform users globally.
                                </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={geminiEnabled}
                                    onChange={(e) => setGeminiEnabled(e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>
                    </div>

                    {/* AI Engine & Models */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Cpu className="text-indigo-600" size={18} />
                                Primary AI Model Selection
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Select the default generative AI model used for student responses.
                            </p>
                            <select
                                value={primaryModel}
                                onChange={(e) => setPrimaryModel(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="gemini-2.0-flash">Gemini 2.0 Flash (Recommended - Ultra Fast)</option>
                                <option value="gemini-2.5-flash">Gemini 2.5 Flash (High Quality Audio & Text)</option>
                                <option value="gemini-1.5-flash">Gemini 1.5 Flash (Legacy Standard)</option>
                                <option value="llama-3.3-70b">Groq Llama 3.3 70B (High Reasoning)</option>
                                <option value="llama-3.1-8b">Groq Llama 3.1 8B (Fast Text Only)</option>
                            </select>
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
                            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Key className="text-indigo-600" size={18} />
                                Active API Key Rotation Slot
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Select active primary API Key ID in rotation pool.
                            </p>
                            <div className="flex items-center gap-2">
                                {[1, 2, 3, 4, 5].map((keyNum) => (
                                    <button
                                        key={keyNum}
                                        type="button"
                                        onClick={() => setActiveKeyId(keyNum)}
                                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                            activeKeyId === keyNum
                                                ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                                                : "bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                                        }`}
                                    >
                                        Key #{keyNum}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Default Voice Selection */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Volume2 className="text-indigo-600" size={18} />
                            Default Prebuilt AI Human Voice
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Select default natural voice sample used for native audio TTS synthesis.
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {voicesList.map((v) => (
                                <button
                                    key={v.name}
                                    type="button"
                                    onClick={() => setDefaultVoice(v.name)}
                                    className={`p-3 rounded-xl border text-left transition-all ${
                                        defaultVoice === v.name
                                            ? "bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 text-indigo-700 dark:text-indigo-300 shadow-sm"
                                            : "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-200"
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold">{v.name}</span>
                                        {defaultVoice === v.name && <Check size={14} className="text-indigo-600" />}
                                    </div>
                                    <span className="text-[10px] text-slate-400 font-medium">{v.desc}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* System Prompt & Personality */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Sliders className="text-indigo-600" size={18} />
                            System Persona & Behavior Prompt
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Global guidelines provided to the LLM core for framing responses.
                        </p>
                        <textarea
                            rows={4}
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Additional Safety & Fallback Controls */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                        Offline Q&A Fallback
                                    </h4>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                        Automatically answer common queries when offline or network drops.
                                    </p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={offlineFallbackEnabled}
                                    onChange={(e) => setOfflineFallbackEnabled(e.target.checked)}
                                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                />
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                                        Auto-Speak Responses
                                    </h4>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                        Automatically read out AI replies with human voice without manual click.
                                    </p>
                                </div>
                                <input
                                    type="checkbox"
                                    checked={autoSpeakReplies}
                                    onChange={(e) => setAutoSpeakReplies(e.target.checked)}
                                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none"
                        >
                            {isSaving ? <Loader inline size="sm" /> : <Save size={16} />}
                            <span>Save Configuration</span>
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default AdminAssistantSettings;
