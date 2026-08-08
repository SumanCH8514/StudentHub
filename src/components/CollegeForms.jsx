import React, { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebaseConfig";
import {
    FileText,
    Download,
    ClipboardCheck,
    ClipboardList,
    Paperclip,
    ArrowLeft,
    Search,
    Files,
    Info,
    ExternalLink,
    CheckCircle2,
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility for cleaner conditional classes
function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const CollegeForms = ({ onBack, showBack = true, hideSpacing = false }) => {
    const [searchQuery, setSearchQuery] = useState("");
    const [formLinks, setFormLinks] = useState({});

    useEffect(() => {
        const fetchFormLinks = async () => {
            try {
                const formsDoc = await getDoc(doc(db, "settings", "forms"));
                if (formsDoc.exists()) {
                    setFormLinks(formsDoc.data());
                }
            } catch (err) {
                console.error("Error fetching form links:", err);
            }
        };
        fetchFormLinks();
    }, []);

    const formCategories = [
        { id: "all", label: "All Forms", color: "text-indigo-600", bg: "bg-indigo-50" },
        { id: "academic", label: "Academic", color: "text-emerald-600", bg: "bg-emerald-50" },
        { id: "admission", label: "Admission", color: "text-purple-600", bg: "bg-purple-50" },
        { id: "library", label: "Library", color: "text-sky-600", bg: "bg-sky-50" },
    ];
    const [activeCategory, setActiveCategory] = useState("all");

    const formsData = [
        {
            id: 1,
            title: "Bonafide Certificate",
            category: "academic",
            theme: "emerald",
            description: "Student identity verification certificate for various purposes",
            instructions: "Fill this form to request a bonafide certificate. Processing time: 3-5 working days.",
            requiredDocs: "Student ID card, Fee receipt",
            fileSize: "1.2 MB",
            lastUpdated: "15 Jan 2025",
            type: "PDF",
            linkId: "bonafide",
            defaultUrl: "https://sumanonline.com/studentHub/forms/",
        },
        {
            id: 2,
            title: "Admission Application Form",
            category: "admission",
            theme: "purple",
            description: "New student admission application form",
            instructions: "Complete admission form for new academic session. Submit with all required documents.",
            requiredDocs: "Academic certificates, ID proof, Photographs, Category certificate (if applicable)",
            fileSize: "2.5 MB",
            lastUpdated: "10 Jan 2025",
            type: "PDF",
            linkId: "admission",
            defaultUrl: "https://sumanonline.com/studentHub/forms/",
        },
        {
            id: 3,
            title: "Library Membership Form",
            category: "library",
            theme: "sky",
            description: "Register for library membership and book borrowing facility",
            instructions: "Submit this form to get library membership. Requires security deposit.",
            requiredDocs: "Student ID card, Fee receipt, Passport size photo",
            fileSize: "1.8 MB",
            lastUpdated: "08 Jan 2025",
            type: "PDF",
            linkId: "library",
            defaultUrl: "https://sumanonline.com/studentHub/forms/",
        },
        {
            id: 4,
            title: "Scholarship Application",
            category: "academic",
            theme: "rose",
            description: "Apply for merit-cum-means scholarships",
            instructions: "Submit before the semester deadline. Late applications will not be processed.",
            requiredDocs: "Income certificate, Previous marksheet, Bank details",
            fileSize: "1.5 MB",
            lastUpdated: "20 Jan 2025",
            type: "PDF",
            linkId: "scholarship",
            defaultUrl: "https://sumanonline.com/studentHub/forms/",
        },
        {
            id: 5,
            title: "Hostel Accommodation Form",
            category: "admission",
            theme: "emerald",
            description: "Request for on-campus hostel facility",
            instructions: "Allocation is subject to availability and distance from hometown.",
            requiredDocs: "Address proof, Medical fitness certificate",
            fileSize: "2.1 MB",
            lastUpdated: "05 Jan 2025",
            type: "PDF",
            linkId: "hostel",
            defaultUrl: "https://sumanonline.com/studentHub/forms/",
        },
        {
            id: 6,
            title: "ID Card Replacement",
            category: "admission",
            theme: "purple",
            description: "Apply for a new ID card if lost or damaged",
            instructions: "A nominal fee of ₹200 applies for replacement cards.",
            requiredDocs: "Police complaint copy (if lost), Fee payment receipt",
            fileSize: "0.9 MB",
            lastUpdated: "12 Jan 2025",
            type: "PDF",
            linkId: "id-replacement",
            defaultUrl: "https://sumanonline.com/studentHub/forms/",
        },
        {
            id: 7,
            title: "No Due Form",
            category: "admission",
            theme: "emerald",
            description: "Clearance certificate from all departments before leaving the college and You have paid on a certain Semester.",
            instructions: "Print this form and submit to the Accounts department with your final semester fee receipt or payment Screenshots.",
            requiredDocs: "Printed form, Semester fee receipt, Payment Screenshots",
            fileSize: "1.1 MB",
            lastUpdated: "01 Mar 2025",
            type: "PDF",
            linkId: "no-due",
            defaultUrl: "https://sumanonline.com/studentHub/forms/",
        },
    ];

    const themeConfig = {
        indigo: { bg: "bg-indigo-600", light: "bg-indigo-50", text: "text-indigo-600", border: "border-indigo-100", hover: "hover:bg-indigo-700", shadow: "shadow-indigo-700/10" },
        emerald: { bg: "bg-emerald-600", light: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-100", hover: "hover:bg-emerald-700", shadow: "shadow-emerald-700/10" },
        purple: { bg: "bg-purple-600", light: "bg-purple-50", text: "text-purple-600", border: "border-purple-100", hover: "hover:bg-purple-700", shadow: "shadow-purple-700/10" },
        rose: { bg: "bg-rose-600", light: "bg-rose-50", text: "text-rose-600", border: "border-rose-100", hover: "hover:bg-rose-700", shadow: "shadow-rose-700/10" },
        sky: { bg: "bg-sky-600", light: "bg-sky-50", text: "text-sky-600", border: "border-sky-100", hover: "hover:bg-sky-700", shadow: "shadow-sky-700/10" },
        amber: { bg: "bg-amber-600", light: "bg-amber-50", text: "text-amber-600", border: "border-amber-100", hover: "hover:bg-amber-700", shadow: "shadow-amber-700/10" },
    };

    const filteredForms = formsData.filter((form) => {
        const matchesSearch = form.title.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = activeCategory === "all" || form.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className={cn("min-h-screen bg-[#f4f7fc] dark:bg-slate-900 pb-12 animate-in fade-in duration-500", hideSpacing && "min-h-0 bg-transparent")}>
            {/* Header Container */}
            <div className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8", hideSpacing ? "pt-0" : "pt-6")}>
                {/* Centered Navigation & Title */}
                <div className="flex flex-col items-center mb-10 animate-in fade-in slide-in-from-top-6 duration-700">
                    {showBack && (
                        <div className="w-full flex justify-start mb-4">
                            <button
                                type="button"
                                onClick={onBack}
                                className="p-2 bg-white dark:bg-slate-800 rounded-xl shadow-sm text-slate-500 hover:text-indigo-600 transition-all active:scale-95 border border-slate-100 dark:border-slate-700"
                            >
                                <ArrowLeft size={20} />
                            </button>
                        </div>
                    )}

                    <div className="flex flex-col items-center text-center">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center shadow-inner shadow-indigo-200/50 dark:shadow-none animate-bounce">
                                <ClipboardCheck size={20} className="text-indigo-600" />
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                                College Forms
                            </h1>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-bold text-sm max-w-md">
                            Comprehensive view of your college forms
                        </p>
                    </div>
                </div>

                {/* Note Box */}
                <div className="mt-4 bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-4 flex items-start gap-4 shadow-sm">
                    <div className="bg-indigo-100 dark:bg-indigo-900/40 rounded-lg p-2 shrink-0 shadow-inner">
                        <Info size={20} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1">
                        <p className="text-slate-600 dark:text-slate-300 font-bold text-sm leading-relaxed">
                            <span className="text-indigo-600 dark:text-indigo-400 font-black underline decoration-2 underline-offset-4 mr-2">Note:</span>
                            These forms need to be filled completely and submitted to the respective department along with required documents. Processing time varies for each form type.
                        </p>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
                {/* Actions Bar */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10 pb-6 border-b border-slate-200 dark:border-slate-800">
                    {/* Category Filter */}
                    <div className="flex items-center p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto no-scrollbar w-full md:w-auto shadow-sm">
                        {formCategories.map((cat) => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => setActiveCategory(cat.id)}
                                className={cn(
                                    "px-5 py-2 rounded-lg text-sm font-black whitespace-nowrap transition-all duration-300",
                                    activeCategory === cat.id
                                        ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                                )}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Search */}
                    <div className="relative w-full md:w-80 group">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search size={18} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search documents..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl py-3 pl-11 pr-4 text-sm font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-500/30 focus:ring-4 focus:ring-indigo-500/10 transition-all shadow-sm"
                        />
                    </div>
                </div>

                {/* Forms Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                    {filteredForms.map((form) => {
                        const theme = themeConfig[form.theme] || themeConfig.indigo;
                        return (
                            <div
                                key={form.id}
                                className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden group hover:shadow-2xl hover:border-indigo-500/20 transition-all duration-500 hover:-translate-y-2 flex flex-col h-full"
                            >
                                {/* Card Header (Matches Theme) */}
                                <div className={cn("p-5 flex items-center justify-between", theme.bg)}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-9 h-9 bg-white/10 rounded-lg flex items-center justify-center">
                                            <FileText size={18} className="text-white" />
                                        </div>
                                        <h3 className="text-white font-black text-lg tracking-tight">
                                            {form.title}
                                        </h3>
                                    </div>
                                    <div className="bg-white/20 px-2.5 py-1 rounded-md text-[10px] font-black text-white uppercase tracking-wider">
                                        {form.type}
                                    </div>
                                </div>

                                {/* Card Body */}
                                <div className="p-6 flex flex-col flex-1 space-y-5">
                                    <p className="text-slate-500 dark:text-slate-400 font-bold text-sm text-center">
                                        {form.description}
                                    </p>

                                    {/* Instructions Box */}
                                    <div className={cn("border rounded-2xl p-4", theme.light, theme.border)}>
                                        <div className="flex items-center gap-2 mb-2 justify-center">
                                            <ClipboardList size={14} className={theme.text} />
                                            <span className={cn("text-[11px] font-black uppercase tracking-widest", theme.text)}>Instructions:</span>
                                        </div>
                                        <p className="text-slate-600 dark:text-slate-300 text-[13px] font-bold text-center leading-relaxed">
                                            {form.instructions}
                                        </p>
                                    </div>

                                    {/* Required Documents Box (Stays Amber/Yellow for attention) */}
                                    <div className="bg-[#fefce8] dark:bg-amber-900/10 border border-[#fef08a] dark:border-amber-900/30 rounded-2xl p-4">
                                        <div className="flex items-center gap-2 mb-2 justify-center">
                                            <Paperclip size={14} className="text-amber-600" />
                                            <span className="text-[11px] font-black text-amber-600 uppercase tracking-widest">Required Documents:</span>
                                        </div>
                                        <p className="text-amber-800 dark:text-amber-400 text-[13px] font-bold text-center">
                                            {form.requiredDocs}
                                        </p>
                                    </div>

                                    {/* Stats Row */}
                                    <div className="flex items-center justify-between pt-2">
                                        <div className="text-center">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">File Size</p>
                                            <p className="text-slate-800 dark:text-slate-200 font-black text-sm">{form.fileSize}</p>
                                        </div>
                                        <div className="h-8 w-px bg-slate-100 dark:bg-slate-800" />
                                        <div className="text-center">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Last Updated</p>
                                            <p className={cn("font-black text-sm", theme.text)}>{form.lastUpdated}</p>
                                        </div>
                                    </div>

                                    {/* Download Button */}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const toast = document.createElement('div');
                                            toast.className = 'fixed top-8 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700/50 text-white px-6 sm:px-8 py-3.5 rounded-full font-black text-sm shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] z-[100] flex items-center gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-10 zoom-in-95 duration-500 ease-out whitespace-nowrap w-max max-w-[calc(100vw-2rem)]';
                                            toast.innerHTML = `
                                                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-check-circle-2 text-indigo-400 shrink-0"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>
                                                <span class="tracking-tight overflow-hidden text-ellipsis">Preparing Form Download...</span>
                                            `;
                                            document.body.appendChild(toast);
                                            setTimeout(() => {
                                                toast.classList.add('animate-out', 'fade-out', 'slide-out-to-top-10', 'zoom-out-95', 'duration-500');
                                                setTimeout(() => toast.remove(), 500);
                                                const downloadUrl = formLinks[form.linkId] || form.defaultUrl;
                                                window.open(downloadUrl, "_blank");
                                            }, 1800);
                                        }}
                                        className={cn("w-full text-white font-black py-4 rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-3 group mt-auto", theme.bg, theme.hover, theme.shadow)}
                                    >
                                        <Download size={20} className="group-hover:translate-y-0.5 transition-transform" />
                                        Download Form
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filteredForms.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                        <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800/50 rounded-3xl flex items-center justify-center mb-6">
                            <Search size={40} className="text-slate-300" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">No Forms Found</h3>
                        <p className="text-slate-500 dark:text-slate-400 font-bold max-w-xs text-center">
                            We couldn't find any forms matching "{searchQuery}". Try a different term or clear your filters.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CollegeForms;
