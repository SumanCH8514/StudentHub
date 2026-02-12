import React from "react";
import { Heart } from "lucide-react";

const Footer = () => {
    return (
        <footer className="w-full py-12 px-6 mt-12 bg-white border-t border-slate-100">
            <div className="max-w-5xl mx-auto flex flex-col items-center text-center gap-6">
                <div className="flex flex-col gap-2">
                    <p className="text-sm font-black text-slate-900 tracking-tight">
                        © 2018-2026 Student<span className="text-indigo-600">Hub</span> | All Rights Reserved.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        <span>Designed And Maintained by</span>
                        <a
                            href="https://SumanOnline.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-700 transition-colors"
                        >
                            SumanOnline.com
                        </a>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="h-px w-8 bg-slate-100" />
                    <Heart size={14} className="text-rose-500 animate-pulse" />
                    <div className="h-px w-8 bg-slate-100" />
                </div>
            </div>
        </footer>
    );
};

export default Footer;
