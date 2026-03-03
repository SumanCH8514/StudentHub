import React from "react";
import {
    FileSignature,
    Search,
    Filter,
    Download,
    AlertCircle
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const AdminResults = () => {
    return (
        <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">

            {/* Title & Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Exam Results</h2>
                    <p className="text-slate-500 text-sm mt-1">Manage and publish student academic performance</p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-lg transition-colors shadow-sm text-sm flex items-center gap-2">
                        <Download size={16} /> Export
                    </button>
                    <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors shadow-md shadow-indigo-500/20 text-sm font-medium flex items-center gap-2">
                        <FileSignature size={16} /> Update Results
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col min-h-[400px]">

                {/* Toolbar */}
                <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by student name or ID..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button className="bg-white border border-slate-200 text-slate-600 px-4 py-2.5 rounded-lg flex items-center gap-2 text-sm hover:bg-slate-50 transition-colors w-full sm:w-auto justify-center">
                            <Filter size={16} /> Filter by Semester
                        </button>
                    </div>
                </div>

                {/* Empty State / Coming Soon */}
                <div className="flex-1 p-8 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 bg-indigo-50 text-indigo-400 rounded-full flex items-center justify-center mb-6 shadow-inner">
                        <AlertCircle size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">No Results Database Connected</h3>
                    <p className="text-slate-500 max-w-md text-[15px] mb-8">
                        The external gradebook API is currently not linked to this dashboard. Contact the technical team to synchronize the latest semester results.
                    </p>
                    <button className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 px-6 py-2.5 rounded-lg font-medium transition-colors">
                        Configure Integrations
                    </button>
                </div>

            </div>
        </div>
    );
};

export default AdminResults;
