import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FileText, ArrowLeft } from "lucide-react";
import StudentHubLogo from "../assets/StudentHub-logo1.png";

const TermsOfService = () => {
    const [isDarkMode, setIsDarkMode] = useState(() => {
        return document.documentElement.classList.contains("dark");
    });

    useEffect(() => {
        const handleThemeChange = () => {
            setIsDarkMode(document.documentElement.classList.contains("dark"));
        };

        const observer = new MutationObserver(handleThemeChange);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

        return () => observer.disconnect();
    }, []);

    return (
        <div className="min-h-screen w-full flex bg-slate-50 dark:bg-[#0F172A] font-sans text-slate-800 dark:text-slate-200 py-12 px-6 sm:px-10 lg:px-20 relative overflow-hidden transition-colors duration-300">
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30 dark:opacity-20">
                <div className="absolute top-[-10%] left-[20%] w-[120%] h-[120%] bg-gradient-to-br from-indigo-200 via-slate-50 to-purple-200 dark:from-indigo-900 dark:via-[#0F172A] dark:to-purple-900 animate-mesh filter blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto w-full">
                <div className="flex flex-row items-center justify-between gap-3 sm:gap-6 mb-6 sm:mb-8 w-full">
                    <a href="/" className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-colors border border-slate-300 dark:border-white/10 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 shadow-sm shrink-0">
                        <ArrowLeft size={16} />
                        <span>Back to Home</span>
                    </a>

                    <a href="/" className="cursor-pointer hover:opacity-100 transition-opacity shrink-0">
                        <img
                            src={StudentHubLogo}
                            alt="StudentHub Logo"
                            className="w-28 sm:w-32 h-auto object-contain opacity-90 hover:scale-105 transition-transform duration-300"
                        />
                    </a>
                </div>

                <div className="bg-white/90 dark:bg-[#0F172A]/80 backdrop-blur-3xl border border-slate-200 dark:border-white/10 rounded-3xl p-8 sm:p-12 shadow-xl transition-colors duration-300">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30">
                            <FileText size={24} />
                        </div>
                        <div>
                            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">Terms of Service</h1>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">Last updated: {new Date().toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div className="space-y-8 text-slate-700 dark:text-slate-300 leading-relaxed text-sm sm:text-base font-medium">
                        <section>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">1. Agreement to Terms</h2>
                            <p>
                                By accessing or using StudentHub, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any part of these terms, you are prohibited from using or accessing this site.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">2. Description of Service</h2>
                            <p>
                                StudentHub provides an educational management platform connecting students, coordinators, and administrators. The service includes schedule management, AI assistance, resource sharing, and communication tools.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">3. User Accounts</h2>
                            <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-400">
                                <li>You must provide accurate and complete information when creating an account.</li>
                                <li>You are responsible for safeguarding the password that you use to access the service.</li>
                                <li>You agree not to disclose your password to any third party.</li>
                                <li>You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">4. Acceptable Use Policy</h2>
                            <p className="mb-2">You agree not to use the Service in any way that causes, or may cause, damage to the Service or impairment of the availability or accessibility of the Service. Specifically, you must not:</p>
                            <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-400">
                                <li>Use the service in any way that is unlawful, illegal, fraudulent or harmful.</li>
                                <li>Use the service to copy, store, host, transmit, send, use, publish or distribute any malicious computer software.</li>
                                <li>Conduct any systematic or automated data collection activities.</li>
                                <li>Impersonate administrators or coordinators or misrepresent your affiliation with the institution.</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">5. Content Liability</h2>
                            <p>
                                We shall not be hold responsible for any content that appears on the platform that is user-generated or provided by third parties. You agree to protect and defend us against all claims that is rising on your account.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-3">6. Termination</h2>
                            <p>
                                We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease.
                            </p>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TermsOfService;
