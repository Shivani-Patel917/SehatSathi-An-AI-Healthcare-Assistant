
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Menu, Bell, ShieldCheck } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/common/Sidebar";

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    toast.success("Logged out successfully.");
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-slate-50 lg:flex">
      <Sidebar
        role="admin"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Open admin navigation"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            >
              <Menu size={21} />
            </button>

            <div className="flex items-center gap-2">
              <ShieldCheck size={21} className="shrink-0 text-teal-700" />
              <span className="truncate text-sm font-semibold text-slate-800 sm:text-base">
                Admin Control Center
              </span>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <button
              type="button"
              aria-label="Notifications"
              onClick={() => navigate("/admin/notifications")}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <Bell size={20} />
            </button>

            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-800">
                {user?.name || "Administrator"}
              </p>
              <p className="text-xs text-slate-500">Admin</p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Logout
            </button>
          </div>
        </header>

        <main
          key={location.pathname}
          className="mx-auto w-full max-w-[1600px] flex-1 p-4 sm:p-6 lg:p-8"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
