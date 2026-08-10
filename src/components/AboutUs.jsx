import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles, Calendar, CheckCircle2, BookOpen, Zap, Users } from "lucide-react";
import Footer from "./Footer";

const AboutUs = () => {
    return (
        <div className="min-h-screen w-full flex flex-col bg-slate-50 dark:bg-[#0F172A] font-sans text-slate-800 dark:text-slate-200 py-6 px-4 sm:px-8 lg:px-16 relative overflow-x-hidden transition-colors duration-300">
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 dark:opacity-30">
                <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-200 via-transparent to-transparent dark:from-indigo-900/40" />
            </div>

            <div className="relative z-10 max-w-5xl mx-auto w-full flex-1 flex flex-col justify-between">
                <header className="flex flex-row items-center justify-between gap-3 mb-6 w-full shrink-0">
                    <Link to="/" className="flex items-center gap-2 px-3.5 py-2 bg-white/90 dark:bg-white/10 hover:bg-slate-100 dark:hover:bg-white/15 rounded-xl transition-all border border-slate-200 dark:border-white/10 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 shadow-sm shrink-0 active:scale-95">
                        <ArrowLeft size={16} />
                        <span>Back to Home</span>
                    </Link>

                    <Link to="/" className="cursor-pointer hover:opacity-90 transition-opacity shrink-0">
                        <img
                            src="https://cdn.photos.sumanonline.com/R29vZ2xl/AVvXsEhos0R2tOWxdN_BLuLURzfQuWfV7OGviJ2NCbpQIHYYGBEP8t8zMWc9ZOUEyz8KI2Cr_QX_qzaAGadXOiNoIFsH5P3VJ7I758LvbcutztjuDNI3FBw8_f2z1gkdB7fDmodQfVEPGXwUWR2slBjKcU4nHxyPX3ewLik7gCI-vfp0O9PtloDj2nPy0crvo1JX/s500/new-logo-removebg.png"
                            alt="StudentHub Logo"
                            className="h-10 sm:h-12 w-auto object-contain"
                        />
                    </Link>
                </header>

                <main className="space-y-6 flex-1">
                    <div className="bg-gradient-to-br from-white/95 via-indigo-50/40 to-purple-50/40 dark:from-slate-900/90 dark:via-indigo-950/40 dark:to-slate-900/90 backdrop-blur-xl border border-indigo-200/80 dark:border-indigo-500/20 rounded-3xl p-5 sm:p-8 lg:p-10 shadow-2xl transition-colors duration-300">
                        <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-indigo-500/10 dark:bg-indigo-500/20 backdrop-blur-md rounded-full border border-indigo-200/90 dark:border-indigo-500/30 mb-3 shadow-sm">
                            <Sparkles size={14} className="text-indigo-600 dark:text-indigo-400 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-300">About StudentHub Platform</span>
                        </div>

                        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight mb-3">
                            Empowering University Students with <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 dark:from-indigo-400 dark:via-purple-300 dark:to-pink-400">AI-Driven Academic Intelligence.</span>
                        </h1>

                        <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-base font-medium leading-relaxed max-w-3xl mb-6">
                            StudentHub is an all-in-one academic management app crafted specifically for university students to organize class timetables, monitor course attendance, access study resources, and receive AI-powered guidance.
                        </p>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-slate-200/80 dark:border-white/10">
                            {[
                                { number: "100%", label: "Free for Students", desc: "No subscription fees" },
                                { number: "24/7", label: "AI Academic Support", desc: "Powered by Gemini AI" },
                                { number: "Instant", label: "Schedule Sync", desc: "Real-time class alerts" },
                                { number: "Universal", label: "Web & Mobile PWA", desc: "Sync across devices" }
                            ].map((stat, i) => (
                                <div key={i} className="p-3.5 bg-white/80 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-sm hover:border-indigo-500/30 transition-all">
                                    <h3 className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 mb-0.5">{stat.number}</h3>
                                    <p className="text-slate-900 dark:text-white text-xs font-bold mb-0.5 truncate">{stat.label}</p>
                                    <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-[11px] font-medium leading-tight truncate">{stat.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                            <div className="w-10 h-10 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-3 border border-indigo-200 dark:border-indigo-500/30 shrink-0">
                                <Calendar size={20} />
                            </div>
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1.5">Smart Routine Engine</h2>
                            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed font-medium">
                                Never miss a class. StudentHub delivers personalized weekly class timetables with real-time room numbers, teacher details, break indicators, and period countdowns tailored to your stream and semester.
                            </p>
                        </div>

                        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                            <div className="w-10 h-10 bg-purple-500/10 dark:bg-purple-500/20 rounded-xl flex items-center justify-center text-purple-600 dark:text-purple-400 mb-3 border border-purple-200 dark:border-purple-500/30 shrink-0">
                                <CheckCircle2 size={20} />
                            </div>
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1.5">Attendance Tracker & Analytics</h2>
                            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed font-medium">
                                Stay above mandatory attendance thresholds with automated percentage tracking, target attendance goal calculators, present/absent logs, and instant course warnings.
                            </p>
                        </div>

                        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                            <div className="w-10 h-10 bg-cyan-500/10 dark:bg-cyan-500/20 rounded-xl flex items-center justify-center text-cyan-600 dark:text-cyan-400 mb-3 border border-cyan-200 dark:border-cyan-500/30 shrink-0">
                                <Zap size={20} />
                            </div>
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1.5">Gemini AI Study Companion</h2>
                            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed font-medium">
                                Integrated AI assistant tailored for university students. Receive instant subject explanations, exam preparation tips, assignment advice, and study schedule planning.
                            </p>
                        </div>

                        <div className="bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                            <div className="w-10 h-10 bg-amber-500/10 dark:bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400 mb-3 border border-amber-200 dark:border-amber-500/30 shrink-0">
                                <BookOpen size={20} />
                            </div>
                            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1.5">Study Resources & Exam Hub</h2>
                            <p className="text-slate-600 dark:text-slate-400 text-xs sm:text-sm leading-relaxed font-medium">
                                Access semester exam routines, university notices, holiday trackers, and specialized academic utilities including FrontPageMaker, PdfEditor, and learning resources.
                            </p>
                        </div>
                    </div>

                    <div className="bg-gradient-to-r from-white/95 to-indigo-50/30 dark:from-slate-900/90 dark:to-indigo-950/30 backdrop-blur-xl border border-slate-200/80 dark:border-white/10 rounded-2xl p-5 sm:p-7 shadow-xl">
                        <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                            <Users className="text-indigo-600 dark:text-indigo-400 shrink-0" size={22} />
                            <span>Our Vision & Leadership</span>
                        </h2>
                        <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed font-medium mb-3">
                            StudentHub was developed under the <b>SumanOnline.Com</b> initiative to streamline academic workflows and modernize university life. We believe every student deserves a clean, intuitive, and reliable digital workspace to excel in their studies.
                        </p>
                        <p className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm leading-relaxed font-medium">
                            Whether managing daily lectures, tracking lab sessions, checking exam schedules, or organizing study notes, StudentHub provides the intelligent tools you need to succeed.
                        </p>
                    </div>
                </main>

                <Footer />
            </div>
        </div>
    );
};

export default AboutUs;
