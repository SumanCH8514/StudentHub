import React, { useState, useMemo } from "react";
import {
    Users,
    Search,
    UserMinus,
    Mail,
    User,
    MoreVertical,
    ShieldAlert,
    ChevronLeft,
    ChevronRight,
    ArrowUpDown,
    ArrowUp,
    ArrowDown,
    X,
    Plus,
    Save
} from "lucide-react";
import Loader from "../Loader";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const AdminStudentDetails = ({ users, loading, deleteUser, addStudent, updateUser }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("All Roles");
    const [currentPage, setCurrentPage] = useState(1);
    const [sortConfig, setSortConfig] = useState({ key: "createdAt", direction: "desc" });
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newStudent, setNewStudent] = useState({ name: "", email: "", role: "user" });
    const [editingUser, setEditingUser] = useState(null);
    const usersPerPage = 8;

    const filteredAndSortedUsers = useMemo(() => {
        let result = users.filter((u) => {
            const matchesSearch =
                u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.email?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesRole =
                roleFilter === "All Roles" ||
                u.role?.toLowerCase() === roleFilter.toLowerCase();

            return matchesSearch && matchesRole;
        });

        if (sortConfig.key) {
            result.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                // Handle timestamps or dates
                if (sortConfig.key === "createdAt" && aValue?.seconds) {
                    aValue = aValue.seconds;
                    bValue = bValue?.seconds || 0;
                } else if (typeof aValue === "string") {
                    aValue = aValue.toLowerCase();
                    bValue = bValue?.toString().toLowerCase() || "";
                }

                if (aValue < bValue) {
                    return sortConfig.direction === "asc" ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === "asc" ? 1 : -1;
                }
                return 0;
            });
        }

        return result;
    }, [users, searchTerm, roleFilter, sortConfig]);

    const totalPages = Math.ceil(filteredAndSortedUsers.length / usersPerPage);
    const currentUsers = filteredAndSortedUsers.slice(
        (currentPage - 1) * usersPerPage,
        currentPage * usersPerPage
    );

    const handleSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const result = await addStudent(newStudent);
        setIsSubmitting(false);
        if (result.success) {
            setIsAddModalOpen(false);
            setNewStudent({ name: "", email: "", role: "user" });
        } else {
            alert("Error: " + result.error);
        }
    };

    const handleEditClick = (user) => {
        setEditingUser({ ...user });
        setIsEditModalOpen(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const result = await updateUser(editingUser.id, {
            name: editingUser.name,
            role: editingUser.role
        });
        setIsSubmitting(false);
        if (result.success) {
            setIsEditModalOpen(false);
            setEditingUser(null);
        } else {
            alert("Error: " + result.error);
        }
    };

    const SortIcon = ({ columnKey }) => {
        if (sortConfig.key !== columnKey) return <ArrowUpDown size={12} className="ml-1 opacity-50" />;
        return sortConfig.direction === "asc" ?
            <ArrowUp size={12} className="ml-1 text-indigo-600" /> :
            <ArrowDown size={12} className="ml-1 text-indigo-600" />;
    };

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

                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors shadow-md shadow-indigo-500/20 text-sm font-medium flex items-center gap-2"
                    >
                        <Users size={16} /> Add New Student
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
                        <select
                            className="bg-white border border-slate-200 text-slate-600 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 outline-none"
                            value={roleFilter}
                            onChange={(e) => {
                                setRoleFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="All Roles">All Roles</option>
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
                                <th
                                    scope="col"
                                    className="px-6 py-4 rounded-tl-xl cursor-pointer hover:bg-slate-100 transition-colors"
                                    onClick={() => handleSort("name")}
                                >
                                    <div className="flex items-center">
                                        User <SortIcon columnKey="name" />
                                    </div>
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors"
                                    onClick={() => handleSort("role")}
                                >
                                    <div className="flex items-center">
                                        Role <SortIcon columnKey="role" />
                                    </div>
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors"
                                    onClick={() => handleSort("createdAt")}
                                >
                                    <div className="flex items-center">
                                        Joined <SortIcon columnKey="createdAt" />
                                    </div>
                                </th>
                                <th scope="col" className="px-6 py-4 text-center rounded-tr-xl">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center">
                                        <Loader inline size="md" message="Loading records..." />
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
                                            <span className="text-slate-500 text-xs">
                                                {user.createdAt?.seconds
                                                    ? new Date(user.createdAt.seconds * 1000).toLocaleDateString()
                                                    : "N/A"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex justify-center items-center gap-2">
                                                <button
                                                    onClick={() => handleEditClick(user)}
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
                        Showing <span className="font-semibold text-slate-700">{filteredAndSortedUsers.length === 0 ? 0 : (currentPage - 1) * usersPerPage + 1}</span> to <span className="font-semibold text-slate-700">{Math.min(currentPage * usersPerPage, filteredAndSortedUsers.length)}</span> of <span className="font-semibold text-slate-700">{filteredAndSortedUsers.length}</span> entries
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

            {/* Add Student Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-300">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                                    <Plus size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 lg:text-lg">Add New Student</h3>
                                    <p className="text-slate-400 text-xs font-medium">Create a new academic record</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Student Name</label>
                                <div className="relative group">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                                    <input
                                        type="text"
                                        required
                                        placeholder="Full Name"
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-all text-sm font-medium"
                                        value={newStudent.name}
                                        onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                                    <input
                                        type="email"
                                        required
                                        placeholder="email@university.edu"
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-all text-sm font-medium"
                                        value={newStudent.email}
                                        onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Assigned Role</label>
                                <select
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-all text-sm font-medium"
                                    value={newStudent.role}
                                    onChange={(e) => setNewStudent({ ...newStudent, role: e.target.value })}
                                >
                                    <option value="user">Standard User</option>
                                    <option value="admin">Administrator</option>
                                </select>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? <Loader inline size="sm" /> : <Plus size={16} />}
                                    {isSubmitting ? "Adding..." : "Add Student"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Edit Student Modal */}
            {isEditModalOpen && editingUser && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-300">
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                                    <MoreVertical size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 lg:text-lg">Edit Student Details</h3>
                                    <p className="text-slate-400 text-xs font-medium">Update profile for {editingUser.email}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setIsEditModalOpen(false);
                                    setEditingUser(null);
                                }}
                                className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Student Name</label>
                                <div className="relative group">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={16} />
                                    <input
                                        type="text"
                                        required
                                        placeholder="Full Name"
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-all text-sm font-medium"
                                        value={editingUser.name}
                                        onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5 opacity-60">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address (Read-only)</label>
                                <div className="relative group">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input
                                        type="email"
                                        disabled
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-medium cursor-not-allowed"
                                        value={editingUser.email}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest ml-1">Assigned Role</label>
                                <select
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-all text-sm font-medium"
                                    value={editingUser.role}
                                    onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                                >
                                    <option value="user">Standard User</option>
                                    <option value="admin">Administrator</option>
                                </select>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setIsEditModalOpen(false);
                                        setEditingUser(null);
                                    }}
                                    className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? <Loader inline size="sm" /> : <Save size={16} />}
                                    {isSubmitting ? "Saving..." : "Save Changes"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminStudentDetails;
