import React from "react";
import {
    ArrowLeft,
    LifeBuoy,
    MessageCircle,
    ShieldCheck,
    HelpCircle,
    ExternalLink,
    ChevronRight,
    Mail,
    Smartphone
} from "lucide-react";
import Footer from "./Footer.jsx";

const Support = ({ onBack }) => {
    const supportCategories = [
        {
            title: "Technical Support",
            description: "Issues with AI scans, data sync, or platform performance.",
            icon: LifeBuoy,
            color: "bg-indigo-50 text-indigo-600 border-indigo-100",
        },
        {
            title: "Account & Privacy",
            description: "Managing your profile, data deletion, and secure login.",
            icon: ShieldCheck,
            color: "bg-emerald-50 text-emerald-600 border-emerald-100",
        },
        {
            title: "General Inquiries",
            description: "Questions about features, usage, or upcoming updates.",
            icon: HelpCircle,
            color: "bg-blue-50 text-blue-600 border-blue-100",
        },
    ];

    return (
        <div className="min-h-screen flex flex-col bg-[#F8FAFC] font-sans antialiased">
            {/* --- PREMIUM HEADER --- */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100 px-6 py-4 sm:px-12 sm:py-6">
                <div className="max-w-5xl mx-auto flex items-center justify-between">
                    <button
                        onClick={onBack}
                        className="group flex items-center gap-3 text-slate-500 hover:text-slate-900 font-bold transition-all active:scale-95"
                    >
                        <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-slate-100 transition-colors">
                            <ArrowLeft size={18} />
                        </div>
                        <span className="hidden sm:inline">Dashboard</span>
                    </button>

                    <div className="flex items-center gap-3 bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100 shadow-sm">
                        <LifeBuoy size={16} className="text-indigo-600" />
                        <span className="text-xs font-black uppercase tracking-widest text-indigo-700">Support Portal</span>
                    </div>
                </div>
            </header>

            <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10 sm:py-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex flex-col mb-12">
                    <h1 className="text-4xl sm:text-6xl font-black text-slate-950 tracking-tighter mb-4">
                        How can we <span className="text-indigo-600">help you?</span>
                    </h1>
                    <p className="text-slate-500 font-bold text-sm sm:text-lg max-w-2xl leading-relaxed">
                        Get expert assistance with your StudentHub experience. From technical glitches to feature requests, our support engine is here for you.
                    </p>
                </div>

                {/* Support Categories */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                    {supportCategories.map((cat, i) => (
                        <div
                            key={i}
                            className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 hover:shadow-2xl hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all group flex flex-col items-center text-center cursor-pointer"
                        >
                            <div className={`p-6 rounded-[2rem] mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform ${cat.color} border`}>
                                <cat.icon size={32} />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-2 truncate w-full">{cat.title}</h3>
                            <p className="text-slate-500 text-xs font-bold leading-relaxed mb-6">{cat.description}</p>
                            <div className="mt-auto flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest">
                                Browse Articles <ChevronRight size={14} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Contact Strip */}
                <div className="bg-slate-950 rounded-[3rem] p-8 sm:p-12 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-indigo-500/10 blur-[100px]" />

                    <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-10">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-white/10 rounded-2xl border border-white/10">
                                    <MessageCircle size={24} className="text-indigo-400" />
                                </div>
                                <span className="text-xs font-black uppercase tracking-[0.3em] text-indigo-400">Direct Contact</span>
                            </div>
                            <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">Still need answers?</h2>
                            <p className="text-slate-400 font-medium text-sm sm:text-lg max-w-lg mb-8">
                                Our team usually responds within 24 hours. Connect with us via email or official channels.
                            </p>

                            <div className="flex flex-wrap gap-4">
                                <a
                                    href="mailto:support@sumanonline.com"
                                    className="flex items-center gap-3 bg-white text-slate-950 px-8 py-4 rounded-2xl font-black transition-all hover:bg-indigo-500 hover:text-white active:scale-95 shadow-xl shadow-white/5"
                                >
                                    <Mail size={18} />
                                    Email Support
                                </a>
                                <a
                                    href="tel:+91"
                                    className="flex items-center gap-3 bg-white/5 border border-white/10 px-8 py-4 rounded-2xl font-black transition-all hover:bg-white/10 active:scale-95"
                                >
                                    <Smartphone size={18} />
                                    Call Us
                                </a>
                            </div>
                        </div>

                        <div className="hidden lg:flex flex-col items-center gap-4 bg-white/5 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 min-w-[300px]">
                            <div className="text-center mb-6">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Developer Hub</p>
                                <p className="text-xs font-bold text-white">Suman Chakraborty</p>
                            </div>
                            <div className="w-full h-px bg-white/10" />
                            <div className="flex items-center gap-3 text-emerald-400 mt-4">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Engineering Status: OK</span>
                            </div>
                            <a
                                href="https://SumanOnline.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mt-6 flex items-center gap-2 text-indigo-400 font-black text-xs hover:text-white transition-colors"
                            >
                                Visit SumanOnline <ExternalLink size={14} />
                            </a>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Support;
