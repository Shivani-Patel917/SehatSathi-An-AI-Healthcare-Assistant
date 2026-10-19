import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Stethoscope,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api.js";

const getPatientName = (appointment) =>
  appointment.patient?.name || "Patient";

const formatDate = (date) => {
  if (!date) return "Date unavailable";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "Invalid date";

  return parsed.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const statusStyles = {
  pending: "bg-amber-50 text-amber-700",
  confirmed: "bg-blue-50 text-blue-700",
  completed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-rose-50 text-rose-700",
};

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAppointments = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await api.get("/doctor/appointments");

      setAppointments(
        Array.isArray(response.data?.appointments)
          ? response.data.appointments
          : []
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to load your appointments."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const count = (status) =>
    appointments.filter((item) => item.status === status).length;

  const stats = [
    {
      label: "Total appointments",
      value: appointments.length,
      icon: CalendarDays,
      color: "bg-blue-50 text-blue-700",
    },
    {
      label: "Pending requests",
      value: count("pending"),
      icon: Clock3,
      color: "bg-amber-50 text-amber-700",
    },
    {
      label: "Confirmed",
      value: count("confirmed"),
      icon: CheckCircle2,
      color: "bg-teal-50 text-teal-700",
    },
    {
      label: "Completed",
      value: count("completed"),
      icon: Stethoscope,
      color: "bg-emerald-50 text-emerald-700",
    },
  ];

  const recentAppointments = [...appointments]
    .sort(
      (a, b) =>
        new Date(b.date || 0).getTime() -
        new Date(a.date || 0).getTime()
    )
    .slice(0, 5);

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-teal-700 to-blue-700 p-6 text-white sm:p-8">
        <div className="relative z-10 max-w-2xl">
          <p className="mb-2 text-sm font-medium text-teal-100">
            SEHATSATHI DOCTOR PORTAL
          </p>

          <h1 className="text-2xl font-bold sm:text-3xl">
            Welcome to your workspace
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-teal-50 sm:text-base">
            Review patient appointments, respond to pending
            requests, and manage your consultation schedule.
          </p>

          <Link
            to="/doctor/appointments"
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-teal-800 transition hover:bg-teal-50"
          >
            Manage appointments
            <ArrowRight size={17} />
          </Link>
        </div>

        <div className="pointer-events-none absolute -right-8 -top-12 h-56 w-56 rounded-full border-[30px] border-white/10" />
        <div className="pointer-events-none absolute -bottom-24 right-28 h-48 w-48 rounded-full bg-white/10" />
      </section>

      <section>
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Appointment overview
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              A summary of your appointment records.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadAppointments(true)}
            disabled={loading || refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-32 animate-pulse rounded-2xl bg-white shadow-sm"
              />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map(({ label, value, icon: Icon, color }) => (
              <article
                key={label}
                className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-500">{label}</p>
                    <p className="mt-3 text-3xl font-bold text-slate-900">
                      {value}
                    </p>
                  </div>

                  <div className={`rounded-xl p-3 ${color}`}>
                    <Icon size={22} />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5">
          <div>
            <h2 className="font-bold text-slate-900">
              Recent appointments
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              The latest appointments assigned to you.
            </p>
          </div>

          <Link
            to="/doctor/appointments"
            className="text-sm font-semibold text-teal-700 hover:text-teal-800"
          >
            View all
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Loading appointments...
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-10 text-center">
            <CalendarDays
              size={34}
              className="mx-auto text-slate-300"
            />
            <h3 className="mt-3 font-semibold text-slate-800">
              No appointments yet
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Appointments assigned to you will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentAppointments.map((appointment) => (
              <div
                key={appointment._id}
                className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-50 font-semibold text-teal-700">
                    {getPatientName(appointment)
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div>
                    <p className="font-semibold text-slate-800">
                      {getPatientName(appointment)}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {formatDate(appointment.date)}
                      {appointment.time
                        ? ` · ${appointment.time}`
                        : ""}
                    </p>
                  </div>
                </div>

                <span
                  className={`w-fit rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                    statusStyles[appointment.status] ||
                    "bg-slate-100 text-slate-600"
                  }`}
                >
                  {appointment.status || "Unknown"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {!loading && appointments.length > 0 && count("pending") > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <AlertCircle
            size={20}
            className="mt-0.5 shrink-0 text-amber-700"
          />
          <div>
            <p className="font-semibold text-amber-900">
              Pending appointment requests
            </p>
            <p className="mt-1 text-sm text-amber-800">
              You have {count("pending")} pending request(s) to review.
            </p>
            <Link
              to="/doctor/appointments"
              className="mt-2 inline-block text-sm font-semibold text-amber-900 underline"
            >
              Review requests
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}