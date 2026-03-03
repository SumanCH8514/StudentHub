import React from "react";
import { Hammer, Settings, LogOut, ArrowLeft } from "lucide-react";
import favLogo from "../assets/fav.png";

const MaintenancePage = ({ onBackToLogin }) => {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors duration-500 overflow-hidden relative font-sans p-4 sm:p-8">

            {/* Animated Background Blobs */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-96 h-96 sm:w-[500px] sm:h-[500px] bg-indigo-500/20 dark:bg-indigo-600/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] animate-blob" />
                <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 sm:w-[500px] sm:h-[500px] bg-emerald-500/20 dark:bg-emerald-600/10 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-[100px] animate-blob animation-delay-4000" />
            </div>

            <div className="relative z-10 w-full max-w-[calc(100vw-2rem)] sm:max-w-2xl bg-white/70 dark:bg-slate-900/50 backdrop-blur-2xl rounded-[2rem] sm:rounded-[3rem] shadow-2xl shadow-indigo-500/5 border border-white dark:border-white/5 p-5 sm:p-16 text-center">

                {/* Brand Logo */}
                <div className="flex justify-center mb-6 sm:mb-10">
                    <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl sm:rounded-[1.5rem] bg-white dark:bg-slate-800 shadow-xl border border-slate-100 dark:border-slate-700 flex items-center justify-center overflow-hidden">
                        <img src={favLogo} alt="StudentHub Logo" className="w-[70%] h-[70%] object-contain" />
                    </div>
                </div>

                {/* Animated Icon */}
                <div className="relative inline-block mb-6 sm:mb-8 scale-[0.8] sm:scale-100">
                    <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full scale-150 animate-pulse" />
                    <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-600/40 transform -rotate-6">
                        <Hammer className="text-white animate-bounce" size={40} />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 sm:w-10 sm:h-10 bg-amber-400 rounded-2xl flex items-center justify-center shadow-lg transform rotate-12">
                        <Settings className="text-white animate-spin-slow" size={16} />
                    </div>
                </div>

                <h1 className="text-2xl sm:text-5xl font-black text-slate-900 dark:text-white tracking-tight mb-3 sm:mb-6 leading-tight">
                    Under <span className="text-indigo-600 dark:text-indigo-400">Maintenance</span>
                </h1>

                <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-xl font-medium leading-relaxed max-w-lg mx-auto mb-8 sm:mb-12 px-2">
                    StudentHub is currently undergoing a scheduled system upgrade to bring you even better features.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 max-w-md mx-auto">
                    <div className="p-3 sm:p-6 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Status</p>
                        <p className="text-amber-600 dark:text-amber-400 font-bold text-xs sm:text-base">Optimizing Brain</p>
                    </div>
                    <div className="p-3 sm:p-6 bg-slate-100/50 dark:bg-slate-800/50 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-0.5">ETA</p>
                        <p className="text-emerald-600 dark:text-emerald-400 font-bold text-xs sm:text-base">Coming Soon</p>
                    </div>
                </div>

                {onBackToLogin && (
                    <button
                        onClick={onBackToLogin}
                        className="mt-8 sm:mt-12 flex items-center justify-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold hover:underline group mx-auto text-sm sm:text-base"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Return to Sign In</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default MaintenancePage;
