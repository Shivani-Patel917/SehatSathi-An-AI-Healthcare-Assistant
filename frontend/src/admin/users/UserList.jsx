
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Search,
  Users,
  UserCheck,
  UserX,
  RefreshCw,
  Eye,
  ShieldCheck,
  AlertCircle,
  X,
} from "lucide-react";
import api from "../../services/api";

const formatDate = (date) => {
  if (!date) return "—";

  const parsed = new Date(date);

  return Number.isNaN(parsed.getTime())
    ? "—"
    : parsed.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
};

const getUserName = (user) =>
  user?.name ||
  [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
  "Unnamed user";

export default function UserList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedUser, setSelectedUser] = useState(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      // Expected backend response: { success: true, users: [...] }
      const response = await api.get("/admin/users");
      const data = response.data;

      setUsers(
        Array.isArray(data)
          ? data
          : Array.isArray(data?.users)
            ? data.users
            : []
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load users. Check your admin API and permissions."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();

    return users.filter((user) => {
      const name = getUserName(user).toLowerCase();
      const email = (user.email || "").toLowerCase();
      const role = (user.role || "user").toLowerCase();

      const matchesSearch =
        !term ||
        name.includes(term) ||
        email.includes(term) ||
        String(user._id || "").toLowerCase().includes(term);

      const matchesRole =
        roleFilter === "all" || role === roleFilter;

      const isActive = user.isActive !== false && user.status !== "inactive";
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && isActive) ||
        (statusFilter === "inactive" && !isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  const stats = useMemo(() => {
    const active = users.filter(
      (user) => user.isActive !== false && user.status !== "inactive"
    ).length;

    return {
      total: users.length,
      active,
      inactive: users.length - active,
      admins: users.filter(
        (user) => (user.role || "").toLowerCase() === "admin"
      ).length,
    };
  }, [users]);

  const initials = (name) =>
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join("") || "U";

  return (
    <div className="min-h-screen space-y-6 bg-slate-50 p-4 text-slate-800 sm:p-6 lg:p-8">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-teal-700">
            Admin Console / Users
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Users Management
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            View and manage registered SehatSathi accounts.
          </p>
        </div>

        <button
          type="button"
          onClick={loadUsers}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:bg-slate-100 disabled:opacity-60"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total Users",
            value: stats.total,
            icon: Users,
            color: "bg-blue-50 text-blue-700",
          },
          {
            label: "Active Accounts",
            value: stats.active,
            icon: UserCheck,
            color: "bg-emerald-50 text-emerald-700",
          },
          {
            label: "Inactive Accounts",
            value: stats.inactive,
            icon: UserX,
            color: "bg-amber-50 text-amber-700",
          },
          {
            label: "Administrators",
            value: stats.admins,
            icon: ShieldCheck,
            color: "bg-violet-50 text-violet-700",
          },
        ].map((item) => {
          const Icon = item.icon;

          return (
            <div
              key={item.label}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">{item.label}</p>
                  <p className="mt-2 text-3xl font-bold">{item.value}</p>
                </div>
                <div className={`rounded-xl p-3 ${item.color}`}>
                  <Icon size={22} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search and filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[1fr_180px_180px]">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, email or ID..."
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(event) => setRoleFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-teal-500"
            aria-label="Filter by role"
          >
            <option value="all">All roles</option>
            <option value="user">Users</option>
            <option value="doctor">Doctors</option>
            <option value="admin">Administrators</option>
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-teal-500"
            aria-label="Filter by account status"
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Errors */}
      {error && (
        <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center">
          <AlertCircle size={19} className="shrink-0" />
          <p className="flex-1">{error}</p>
          <button
            type="button"
            onClick={loadUsers}
            className="font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Users table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-2 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-bold">Registered Accounts</h2>
            <p className="mt-1 text-sm text-slate-500">
              {filteredUsers.length} matching account
              {filteredUsers.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-56 items-center justify-center gap-3 text-sm text-slate-500">
            <RefreshCw className="animate-spin" size={20} />
            Loading users...
          </div>
        ) : !error && filteredUsers.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center px-4 text-center">
            <Users size={35} className="text-slate-300" />
            <p className="mt-3 font-semibold">No users found</p>
            <p className="mt-1 text-sm text-slate-500">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4 font-semibold">User</th>
                  <th className="px-5 py-4 font-semibold">Role</th>
                  <th className="px-5 py-4 font-semibold">Joined</th>
                  <th className="px-5 py-4 font-semibold">Status</th>
                  <th className="px-5 py-4 text-right font-semibold">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((user) => {
                  const name = getUserName(user);
                  const isActive =
                    user.isActive !== false && user.status !== "inactive";

                  return (
                    <tr key={user._id} className="transition hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-50 font-bold text-teal-700">
                            {initials(name)}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">
                              {name}
                            </p>
                            <p className="mt-1 text-slate-500">
                              {user.email || "No email"}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
                          {user.role || "user"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-slate-500">
                        {formatDate(user.createdAt)}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                            isActive
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-red-50 text-red-700"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isActive ? "bg-emerald-500" : "bg-red-500"
                            }`}
                          />
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <button
                          type="button"
                          onClick={() => setSelectedUser(user)}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700"
                        >
                          <Eye size={15} />
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User details modal */}
      {selectedUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedUser(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-details-title"
            className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-teal-700">
                  Account details
                </p>
                <h2 id="user-details-title" className="mt-1 text-xl font-bold">
                  {getUserName(selectedUser)}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="rounded-lg p-2 hover:bg-slate-100"
                aria-label="Close user details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {[
                ["Email", selectedUser.email || "—"],
                ["Role", selectedUser.role || "user"],
                ["Phone", selectedUser.phone || "—"],
                ["Joined", formatDate(selectedUser.createdAt)],
                ["Account ID", selectedUser._id || "—"],
                [
                  "Status",
                  selectedUser.isActive === false ||
                  selectedUser.status === "inactive"
                    ? "Inactive"
                    : "Active",
                ],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex flex-col gap-1 border-b border-slate-100 pb-3 sm:flex-row sm:justify-between"
                >
                  <span className="text-sm text-slate-500">{label}</span>
                  <span className="break-all text-sm font-medium sm:max-w-[65%] sm:text-right">
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setSelectedUser(null)}
              className="mt-6 w-full rounded-xl bg-teal-700 px-4 py-3 font-semibold text-white transition hover:bg-teal-800"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
