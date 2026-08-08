import React, { useState, useEffect } from "react";
import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import {
    Settings2,
    Shield,
    Mail,
    Phone,
    MessageCircle,
    Save,
    Plus,
    Trash2,
    CheckCircle2,
    Globe,
    ToggleLeft,
    ToggleRight
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import Loader from "../Loader";

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const AdminSupportSettings = () => {
    const [settings, setSettings] = useState({
        portalEnabled: true,
        allowAnonymousTickets: false,
        supportEmail: "support@studenthub.com",
        whatsappNumber: "+91 00000 00000",
        telegramLink: "https://t.me/StudentHub",
        categories: ["Technical Support", "Academic Query", "Feedback", "Report a Bug"]
    });
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [newCategory, setNewCategory] = useState("");

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const docRef = doc(db, "settings", "support_portal");
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setSettings(prev => ({ ...prev, ...docSnap.data() }));
                }
            } catch (err) {
                console.error("Failed to fetch support settings:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const saveSettings = async () => {
        setIsSaving(true);
        try {
            await setDoc(doc(db, "settings", "support_portal"), {
                ...settings,
                updatedAt: serverTimestamp()
            }, { merge: true });
            alert("Support Portal settings saved successfully.");
        } catch (err) {
            console.error("Failed to save settings:", err);
            alert("Error saving settings: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const addCategory = () => {
        if (!newCategory.trim()) return;
        if (settings.categories.includes(newCategory.trim())) {
            alert("Category already exists.");
            return;
        }
        setSettings(prev => ({
            ...prev,
            categories: [...prev.categories, newCategory.trim()]
        }));
        setNewCategory("");
    };

    const removeCategory = (cat) => {
        setSettings(prev => ({
            ...prev,
            categories: prev.categories.filter(c => c !== cat)
        }));
    };

    if (loading) return <div className="h-[400px] flex items-center justify-center"><Loader /></div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-1 tracking-tight">Support Portal Settings</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Configure global support portal behavior and contact info.</p>
                </div>
                <button
                    onClick={saveSettings}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50"
                >
                    {isSaving ? <Loader inline size="sm" /> : <Save size={18} />}
                    <span>Save Changes</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* General Controls */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm space-y-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 rounded-xl flex items-center justify-center text-amber-600">
                            <Shield size={20} />
                        </div>
                        <h3 className="font-bold text-slate-800 dark:text-white">Portal Controls</h3>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                            <div>
                                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">Public Portal Access</p>
                                <p className="text-[11px] text-slate-500">Enable or disable the support portal globally.</p>
                            </div>
                            <button
                                onClick={() => setSettings(prev => ({ ...prev, portalEnabled: !prev.portalEnabled }))}
                                className="text-amber-500"
                            >
                                {settings.portalEnabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-slate-400" />}
                            </button>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                            <div>
                                <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">Allow Anonymous Tickets</p>
                                <p className="text-[11px] text-slate-500">Permit users to submit tickets without logging in.</p>
                            </div>
                            <button
                                onClick={() => setSettings(prev => ({ ...prev, allowAnonymousTickets: !prev.allowAnonymousTickets }))}
                                className="text-amber-500"
                            >
                                {settings.allowAnonymousTickets ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-slate-400" />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest pl-1">
                            <Mail size={14} /> Contact Information
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Support Email</label>
                                <input
                                    type="email"
                                    value={settings.supportEmail}
                                    onChange={(e) => setSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-amber-500/20 outline-none"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">WhatsApp Business</label>
                                <input
                                    type="text"
                                    value={settings.whatsappNumber}
                                    onChange={(e) => setSettings(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-amber-500/20 outline-none"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Telegram Handle</label>
                                <input
                                    type="text"
                                    value={settings.telegramLink}
                                    onChange={(e) => setSettings(prev => ({ ...prev, telegramLink: e.target.value }))}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-amber-500/20 outline-none"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Categories Manager */}
                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm flex flex-col h-full">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 rounded-xl flex items-center justify-center text-amber-600">
                                <Settings2 size={20} />
                            </div>
                            <h3 className="font-bold text-slate-800 dark:text-white">Ticket Categories</h3>
                        </div>
                        <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-2 py-1 rounded-md uppercase tracking-widest">
                            {settings.categories.length} Total
                        </span>
                    </div>

                    <div className="flex gap-2 mb-6">
                        <input
                            type="text"
                            placeholder="Add new category..."
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && addCategory()}
                            className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-2 text-sm font-medium focus:ring-2 focus:ring-amber-500/20 outline-none"
                        />
                        <button
                            onClick={addCategory}
                            className="p-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-all shadow-md shadow-amber-500/10"
                        >
                            <Plus size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-2">
                        {settings.categories.map((cat, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700 group hover:border-amber-200 transition-all">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-amber-400 group-hover:animate-pulse" />
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{cat}</span>
                                </div>
                                <button
                                    onClick={() => removeCategory(cat)}
                                    className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSupportSettings;
