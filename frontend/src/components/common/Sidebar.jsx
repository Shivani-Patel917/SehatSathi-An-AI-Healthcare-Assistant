import { NavLink } from "react-router-dom";
import {
  Activity,
  CalendarDays,
  FileText,
  LayoutDashboard,
  MessageCircle,
  Pill,
  Settings,
  Users,
  Stethoscope,
  BarChart3,
  ShieldCheck,
  HeartPulse,
  X,
} from "lucide-react";

const userLinks = [
  { label: "Dashboard", to: "/user/dashboard", icon: LayoutDashboard },
  { label: "Appointments", to: "/user/appointments", icon: CalendarDays },
  { label: "AI Health Assistant", to: "/user/assistant", icon: MessageCircle },
  { label: "Medical Reports", to: "/user/reports", icon: FileText },
  { label: "Medicine Reminder", to: "/user/medicines", icon: Pill },
  { label: "Health Tracker", to: "/user/tracker", icon: Activity },
];

const adminLinks = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
  { label: "Users", to: "/admin/users", icon: Users },
  { label: "Doctors", to: "/admin/doctors", icon: Stethoscope },
  { label: "Appointments", to: "/admin/appointments", icon: CalendarDays },
  { label: "Articles", to: "/admin/manage-articles", icon: FileText },
  { label: "Contact", to: "/admin/contact-enquiry", icon: Settings },
  { label: "Analytics", to: "/admin/analytics", icon: BarChart3 },
  { label: "AI Activity", to: "/admin/ai-activity", icon: ShieldCheck }
];

export default function Sidebar({
  role = "user",
  open = true,
  onClose = () => {},
}) {
  const links = role === "admin" ? adminLinks : userLinks;

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/40 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:sticky lg:top-0 lg:z-10 lg:h-screen lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
          <div className="flex items-center gap-2">
            <HeartPulse className="text-teal-600" size={25} />
            <span className="text-lg font-bold text-slate-900">
              Sehat<span className="text-teal-600">Sathi</span>
            </span>
          </div>
          <button
            type="button"
            aria-label="Close sidebar"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-5 pb-3 pt-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            {role === "admin" ? "Administration" : "Health workspace"}
          </p>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-5">
          {links.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-teal-50 text-teal-700"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`
              }
            >
              <Icon size={19} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="m-4 rounded-2xl bg-gradient-to-br from-teal-50 to-blue-50 p-4">
          <p className="text-sm font-semibold text-slate-800">Your health matters</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Use SehatSathi to organize your health information and build healthier habits.
          </p>
        </div>
      </aside>
    </>
  );
}