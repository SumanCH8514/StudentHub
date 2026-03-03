import React from "react";
import {
    Settings as SettingsIcon,
    Shield,
    Bell,
    Globe,
    Database,
    AlertTriangle,
    Loader2,
    ToggleLeft,
    ToggleRight
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const AdminSettings = ({ isWiping, wipeGlobalClasses }) => {
    return (
        <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">

            {/* Title */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">System Settings</h2>
                    <p className="text-slate-500 text-sm mt-1">Configure global application parameters and security</p>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Left Column: Toggles and preferences */}
                <div className="xl:col-span-2 flex flex-col gap-6">

                    {/* General Settings Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><SettingsIcon size={20} /></div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 leading-tight">General Configuration</h3>
                                <p className="text-slate-500 text-xs">Manage workspace rules</p>
                            </div>
                        </div>

                        <div className="p-6 flex flex-col gap-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-semibold text-slate-800 text-sm">Allow Public Registration</h4>
                                    <p className="text-slate-500 text-xs mt-1">New students can create accounts without invites</p>
                                </div>
                                <ToggleRight size={36} className="text-emerald-500 shrink-0 cursor-pointer" />
                            </div>
                            <hr className="border-slate-100" />

                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-semibold text-slate-800 text-sm">Automated Schedule Sync</h4>
                                    <p className="text-slate-500 text-xs mt-1">Fetch new timetables daily at midnight</p>
                                </div>
                                <ToggleRight size={36} className="text-emerald-500 shrink-0 cursor-pointer" />
                            </div>
                            <hr className="border-slate-100" />

                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-semibold text-slate-800 text-sm">Maintenance Mode</h4>
                                    <p className="text-slate-500 text-xs mt-1">Restrict access to admins only</p>
                                </div>
                                <ToggleLeft size={36} className="text-slate-300 shrink-0 cursor-pointer" />
                            </div>
                        </div>
                    </div>

                    {/* Notifications Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Bell size={20} /></div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 leading-tight">Notification Alerts</h3>
                                <p className="text-slate-500 text-xs">Email delivery settings</p>
                            </div>
                        </div>

                        <div className="p-6 flex flex-col gap-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-semibold text-slate-800 text-sm">New User Alerts</h4>
                                    <p className="text-slate-500 text-xs mt-1">Notify admins on new registrations</p>
                                </div>
                                <ToggleRight size={36} className="text-emerald-500 shrink-0 cursor-pointer" />
                            </div>
                        </div>
                    </div>

                </div>

                {/* Right Column: Danger Zone */}
                <div className="xl:col-span-1 flex flex-col gap-6">

                    <div className="bg-rose-50/50 rounded-2xl p-6 md:p-8 text-rose-900 border border-rose-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-5 text-rose-600 group-hover:scale-110 group-hover:rotate-12 transition-transform duration-500 pointer-events-none">
                            <AlertTriangle size={120} />
                        </div>

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-500/30">
                                    <Database size={20} />
                                </div>
                                <h3 className="text-xl font-bold tracking-tight text-rose-700">Danger Zone</h3>
                            </div>

                            <div className="bg-white/60 p-5 rounded-xl border border-rose-100 mb-6 backdrop-blur-sm">
                                <h4 className="font-bold text-rose-800 mb-2 leading-tight">Global System Reset</h4>
                                <p className="text-rose-600/80 text-sm leading-relaxed mb-4 font-medium">
                                    This action cannot be undone. It will permanently wipe all uploaded classes and routine data from the global database for all users.
                                </p>
                                <div className="flex items-center gap-2 text-rose-500 bg-rose-100/50 px-3 py-2 rounded-md font-semibold text-xs border border-rose-200">
                                    <Shield size={14} /> Authentication Required
                                </div>
                            </div>

                            <button
                                onClick={wipeGlobalClasses}
                                disabled={isWiping}
                                className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-sm shadow-xl shadow-rose-600/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center mt-auto"
                            >
                                {isWiping ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <Loader2 className="animate-spin" size={18} />
                                        <span>Purging Data...</span>
                                    </div>
                                ) : (
                                    <span>Initiate Full Wipe</span>
                                )}
                            </button>
                        </div>
                    </div>

                </div>
            </div>

        </div>
    );
};

export default AdminSettings;
