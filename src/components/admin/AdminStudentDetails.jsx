import React, { useState } from "react";
import {
    Users,
    Search,
    UserMinus,
    Mail,
    User,
    MoreVertical,
    ShieldAlert,
    ChevronLeft,
    ChevronRight
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const AdminStudentDetails = ({ users, loading, deleteUser }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 8;

    const filteredUsers = users.filter(
        (u) =>
            u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email?.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
    const currentUsers = filteredUsers.slice(
        (currentPage - 1) * usersPerPage,
        currentPage * usersPerPage
    );

    return (
        <div className="flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">

            {/* Title & Stats */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Student Details</h2>
                    <p className="text-slate-500 text-sm mt-1">Manage all registered users in the hub</p>
                </div>

                <div className="flex items-center gap-4">
                    {/* Total Users Pill */}
                    <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-slate-600 font-semibold text-sm">Total: {users.length}</span>
                    </div>

                    <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors shadow-md shadow-indigo-500/20 text-sm font-medium flex items-center gap-2">
                        <Users size={16} /> Add New Server
                    </button>
                </div>
            </div>

            {/* Main Table / Directory Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">

                {/* Toolbar */}
                <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
                    <div className="relative w-full max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search students..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1); // Reset pagination on search
                            }}
                        />
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <select className="bg-white border border-slate-200 text-slate-600 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 outline-none">
                            <option>All Roles</option>
                            <option value="admin">Admin</option>
                            <option value="user">User</option>
                        </select>
                    </div>
                </div>

                {/* Directory List Container */}
                <div className="w-full overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-600">
                        <thead className="text-[11px] text-slate-500 uppercase bg-slate-50 border-b border-slate-100 tracking-wider font-semibold">
                            <tr>
                                <th scope="col" className="px-6 py-4 rounded-tl-xl">User</th>
                                <th scope="col" className="px-6 py-4">Role</th>
                                <th scope="col" className="px-6 py-4">Status</th>
                                <th scope="col" className="px-6 py-4 text-center rounded-tr-xl">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="w-8 h-8 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                                            <span className="text-slate-400 text-sm font-medium">Loading records...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : currentUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-slate-400">
                                        No matching records found.
                                    </td>
                                </tr>
                            ) : (
                                currentUsers.map((user) => (
                                    <tr key={user.id} className="bg-white border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-6 py-4 font-medium text-slate-900 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className={cn(
                                                    "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0",
                                                    user.role === "admin" ? "bg-rose-500" : "bg-indigo-500"
                                                )}>
                                                    {user.name?.charAt(0) || <User size={16} />}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-semibold text-slate-800 text-[15px]">{user.name || "Hub Member"}</span>
                                                    <span className="text-slate-400 font-normal flex items-center gap-1.5 mt-0.5 text-xs">
                                                        <Mail size={12} /> {user.email}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 inline-flex",
                                                user.role === "admin" ? "bg-rose-100/50 text-rose-600" : "bg-indigo-50 text-indigo-600"
                                            )}>
                                                {user.role === "admin" && <ShieldAlert size={12} className="shrink-0" />}
                                                <span className="capitalize">{user.role}</span>
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="bg-emerald-50 text-emerald-600 text-xs font-semibold px-2.5 py-1 rounded-md border border-emerald-100">
                                                Active
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center items-center gap-2">
                                                <button
                                                    className="p-2 text-slate-400 hover:text-indigo-600 transition-colors rounded-lg hover:bg-indigo-50"
                                                    title="Edit User"
                                                >
                                                    <MoreVertical size={18} />
                                                </button>
                                                <button
                                                    onClick={() => deleteUser(user.id)}
                                                    disabled={user.role === "admin"}
                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors rounded-lg disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-400"
                                                    title="Delete User"
                                                >
                                                    <UserMinus size={18} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Details */}
                <div className="flex items-center justify-between p-4 sm:px-6 border-t border-slate-100 bg-white">
                    <span className="text-sm text-slate-500">
                        Showing <span className="font-semibold text-slate-700">{filteredUsers.length === 0 ? 0 : (currentPage - 1) * usersPerPage + 1}</span> to <span className="font-semibold text-slate-700">{Math.min(currentPage * usersPerPage, filteredUsers.length)}</span> of <span className="font-semibold text-slate-700">{filteredUsers.length}</span> entries
                    </span>
                    <div className="inline-flex items-center gap-1">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50 transition-colors border border-transparent shadow-sm hover:border-slate-200"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <div className="px-3 py-1 flex items-center justify-center text-sm font-medium bg-indigo-50 text-indigo-600 rounded-lg">
                            {currentPage}
                        </div>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50 transition-colors border border-transparent shadow-sm hover:border-slate-200"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AdminStudentDetails;
