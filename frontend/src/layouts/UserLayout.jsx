import { useState } from "react";
import {
  NavLink,
  Outlet,
  useNavigate,
  useLocation,
} from "react-router-dom";
import {
  Activity,
  CalendarDays,
  ChevronLeft,
  ClipboardList,
  HeartPulse,
  LayoutDashboard,
  LogOut,
  Menu,
  Pill,
  Stethoscope,
  UserRound,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import toast from "react-hot-toast";
import NotificationCenter from "../components/common/NotificationCenter.jsx";

const links = [
  {
    to: "/user/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    end: true,
  },
  {
    to: "/user/profile",
    label: "Profile",
    icon: UserRound,
  },
  {
    to: "/user/appointments",
    label: "My Appointments",
    icon: CalendarDays,
    end: true,
  },
  {
    to: "/doctors",
    label: "Book Appointment",
    icon: Stethoscope,
  },
  {
    to: "/user/assistant",
    label: "Health Assistant",
    icon: HeartPulse,
  },
  {
    to: "/user/medical-records",
    label: "My Reports",
    icon: ClipboardList,
    end: true,
  },
  {
    to: "/user/upload-report",
    label: "Upload Report",
    icon: ClipboardList,
  },
  {
    to: "/user/medications",
    label: "Medication Tracker",
    icon: Pill,
  },
  {
    to: "/user/health-tracker",
    label: "Health Tracker",
    icon: Activity,
  },
  {
    to: "/user/notifications",
    label: "Notifications",
    icon: HeartPulse,
  },
];

export default function UserLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function handleLogout() {
    logout();
    toast.success("Logged out successfully.");
    navigate("/login", { replace: true });
  }

  function renderLinks() {
    return links.map(({ to, label, icon: Icon, end }) => (
      <NavLink
        key={to}
        to={to}
        end={Boolean(end)}
        onClick={() => setMobileMenuOpen(false)}
        className={({ isActive }) =>
          `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
            isActive
              ? "bg-teal-50 font-semibold text-teal-700"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          }`
        }
      >
        <Icon size={18} />
        <span>{label}</span>
      </NavLink>
    ));
  }

  return (
    <div className="min-h-screen bg-slate-50 md:flex">
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="fixed inset-0 z-40 bg-slate-950/40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
          <button
            type="button"
            onClick={() => navigate("/user/dashboard")}
            className="flex items-center gap-2 font-bold text-teal-700"
          >
            <HeartPulse size={23} />
            <span className="text-lg">SehatSathi</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden"
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="border-b border-slate-100 px-5 py-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Signed in as
          </p>
          <p className="mt-1 truncate font-semibold text-slate-800">
            {user?.name || user?.email || "User"}
          </p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {renderLinks()}
        </nav>

        <button
          type="button"
          onClick={handleLogout}
          className="m-3 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-600"
        >
          <LogOut size={18} />
          Logout
        </button>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 md:hidden"
              aria-label="Open navigation"
            >
              <Menu size={21} />
            </button>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">
                Welcome, {user?.name || "User"}
              </p>
              <p className="hidden truncate text-xs text-slate-500 sm:block">
                Your personal healthcare space
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <NotificationCenter />

            <button
              type="button"
              onClick={() => navigate("/user/profile")}
              title="Open profile"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-50 font-semibold text-teal-700"
            >
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </button>
          </div>
        </header>

        <main key={location.pathname} className="min-w-0 p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}