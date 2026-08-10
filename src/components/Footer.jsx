import React from "react";
import { Link } from "react-router-dom";
import { Cpu } from "lucide-react";

const Footer = () => {
    return (
        <footer className="mt-auto py-5 text-center space-y-2 opacity-90 hover:opacity-100 transition-opacity duration-300 w-full shrink-0">
            <p className="text-[10px] sm:text-xs font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
                &copy; 2023 - 2026 <b className="text-indigo-600 dark:text-indigo-400 font-bold">STUDENTHUB</b> | ALL RIGHTS RESERVED
            </p>
            <div className="flex items-center justify-center gap-2">
                <div className="w-4 h-px bg-slate-300 dark:bg-white/10" />
                <p className="text-[10px] sm:text-xs font-semibold tracking-wider flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                    <Cpu size={12} className="text-indigo-600 dark:text-indigo-500/70" />
                    <span>Maintained by <b className="text-slate-700 dark:text-slate-300 font-bold">SumanOnline.Com</b></span>
                </p>
                <div className="w-4 h-px bg-slate-300 dark:bg-white/10" />
            </div>

            <div className="flex items-center justify-center gap-3 mt-2">
                <Link to="/" className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium tracking-wide transition-colors">Home</Link>
                <div className="w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-700" />
                <Link to="/about-us" className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium tracking-wide transition-colors">About Us</Link>
                <div className="w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-700" />
                <Link to="/privacy-policy" className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium tracking-wide transition-colors">Privacy Policy</Link>
                <div className="w-1 h-1 rounded-full bg-slate-400 dark:bg-slate-700" />
                <Link to="/terms-of-service" className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium tracking-wide transition-colors">Terms of Service</Link>
            </div>
        </footer>
    );
};

export default Footer;
