import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  Activity,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Menu,
  Stethoscope,
  X,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

const navigation = [
  {
    label: "Dashboard",
    path: "/doctor/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Appointments",
    path: "/doctor/appointments",
    icon: CalendarDays,
  },
];

export default function DoctorLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  const navLinkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
      isActive
        ? "bg-teal-600 text-white shadow-sm"
        : "text-slate-600 hover:bg-teal-50 hover:text-teal-700"
    }`;

  return (
    <div className="min-h-screen bg-slate-50">
      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center gap-3 border-b border-slate-100 px-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-600 text-white">
            <Stethoscope size={24} />
          </div>

          <div>
            <h1 className="text-xl font-bold text-slate-900">
              SehatSathi
            </h1>
            <p className="text-xs text-slate-500">
              Doctor Portal
            </p>
          </div>

          <button
            type="button"
            aria-label="Close menu"
            className="ml-auto rounded-lg p-2 text-slate-500 lg:hidden"
            onClick={() => setMobileOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="border-b border-slate-100 p-5">
          <div className="flex items-center gap-3 rounded-2xl bg-teal-50 p-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-700">
              <Stethoscope size={21} />
            </div>

            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-800">
                {user?.name || "Doctor"}
              </p>
              <p className="truncate text-xs text-slate-500">
                {user?.email || "Doctor account"}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-2 p-4">
          <p className="mb-3 px-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Workspace
          </p>

          {navigation.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              className={navLinkClass}
              onClick={() => setMobileOpen(false)}
            >
              <Icon size={19} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-4">
          <div className="mb-4 flex items-center gap-2 px-3 text-xs text-slate-500">
            <Activity size={16} className="text-teal-600" />
            Healthcare workspace
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-rose-600 transition hover:bg-rose-50"
          >
            <LogOut size={19} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="min-w-0 lg:pl-72">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button
            type="button"
            aria-label="Open navigation"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu size={22} />
          </button>

          <div className="ml-auto flex items-center gap-2 text-sm text-slate-600">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Doctor workspace
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}