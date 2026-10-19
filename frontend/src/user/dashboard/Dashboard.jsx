
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  CalendarDays,
  FileText,
  Pill,
  RefreshCw,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  BarChart,
  Bar,
} from "recharts";
import toast from "react-hot-toast";

import api from "../../services/api";

const initialData = {
  user: { name: "User" },
  appointments: {
    total: 0,
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
  },
  medicalRecords: 0,
  activeMedications: 0,
  medicationList: [],
  upcomingAppointments: [],
  monthlyTrend: [],
  reminders: [],
};

function formatDate(dateString) {
  if (!dateString) return "Date unavailable";

  const date = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function StatCard({ title, value, description, icon: Icon, href }) {
  return (
    <Link
      to={href}
      className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">
            {value}
          </p>
          <p className="mt-2 text-xs text-slate-500">{description}</p>
        </div>
        <div className="rounded-xl bg-teal-50 p-3 text-teal-700">
          <Icon size={22} />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1 text-sm font-medium text-teal-700">
        View details
        <ArrowRight
          size={15}
          className="transition group-hover:translate-x-1"
        />
      </div>
    </Link>
  );
}

export default function Dashboard() {
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async () => {
    setError("");

    try {
      const response = await api.get("/analytics/health");
      const analytics = response.data?.analytics;

      if (!response.data?.success || !analytics) {
        throw new Error("Unexpected analytics response.");
      }

      setData({
        ...initialData,
        ...analytics,
        appointments: {
          ...initialData.appointments,
          ...(analytics.appointments ?? {}),
        },
      });
    } catch (err) {
      console.error("Dashboard analytics error:", err);
      setError(
        err.response?.data?.message ||
          "Unable to load your dashboard. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-teal-100 border-t-teal-600" />
          <p className="mt-3 text-sm text-slate-500">
            Loading your health dashboard...
          </p>
        </div>
      </div>
    );
  }

  const appointmentStatuses = [
    { name: "Pending", value: data.appointments.pending },
    { name: "Confirmed", value: data.appointments.confirmed },
    { name: "Completed", value: data.appointments.completed },
    { name: "Cancelled", value: data.appointments.cancelled },
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-7">
        {/* Header */}
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-teal-700">
              SehatSathi · Health overview
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
              Welcome back, {data.user?.name || "User"}!
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Review your healthcare activity and upcoming tasks.
            </p>
          </div>

          <button
            type="button"
            onClick={loadAnalytics}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            <RefreshCw size={16} />
            Refresh data
          </button>
        </header>

        {error && (
          <div
            role="alert"
            className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center sm:justify-between"
          >
            <span>{error}</span>
            <button
              onClick={() => {
                setLoading(true);
                loadAnalytics();
              }}
              className="font-semibold underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Summary cards */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total appointments"
            value={data.appointments.total}
            description={`${data.appointments.pending} pending requests`}
            icon={CalendarDays}
            href="/user/appointments"
          />
          <StatCard
            title="Medical records"
            value={data.medicalRecords}
            description="Records saved in your account"
            icon={FileText}
            href="/user/reports"
          />
          <StatCard
            title="Active medications"
            value={data.activeMedications}
            description="Currently active schedules"
            icon={Pill}
            href="/user/medicine-reminders"
          />
          <StatCard
            title="Completed appointments"
            value={data.appointments.completed}
            description="Based on appointment status"
            icon={Activity}
            href="/user/appointments"
          />
        </section>

        {/* Charts */}
        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="font-bold text-slate-900">
                Appointment activity
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Appointments created over the last six calendar months
              </p>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={data.monthlyTrend}
                  margin={{ top: 8, right: 12, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="appointments"
                    name="Appointments"
                    stroke="#0D9488"
                    strokeWidth={3}
                    dot={{ r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="font-bold text-slate-900">
                Appointment status
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Distribution of your appointment requests
              </p>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={appointmentStatuses}
                  margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar
                    dataKey="value"
                    name="Appointments"
                    fill="#2563EB"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* Upcoming appointments and personalized reminders */}
        <section className="grid gap-6 xl:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-bold text-slate-900">
                  Upcoming appointments
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Your next scheduled visits
                </p>
              </div>
              <Link
                to="/user/appointments"
                className="text-sm font-semibold text-teal-700 hover:underline"
              >
                View all
              </Link>
            </div>

            <div className="mt-5 space-y-3">
              {data.upcomingAppointments.length === 0 ? (
                <div className="rounded-xl bg-slate-50 p-6 text-center">
                  <CalendarDays className="mx-auto text-slate-400" size={28} />
                  <p className="mt-2 font-medium text-slate-700">
                    No upcoming appointments
                  </p>
                  <Link
                    to="/user/appointments/book"
                    className="mt-3 inline-block text-sm font-semibold text-teal-700 hover:underline"
                  >
                    Book an appointment
                  </Link>
                </div>
              ) : (
                data.upcomingAppointments.map((appointment) => (
                  <div
                    key={appointment._id}
                    className="flex items-start gap-3 rounded-xl border border-slate-100 p-4"
                  >
                    <div className="rounded-lg bg-teal-50 p-2 text-teal-700">
                      <CalendarDays size={20} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800">
                        {appointment.doctor?.name || "Doctor"}
                      </p>
                      <p className="text-sm text-slate-500">
                        {appointment.doctor?.specialty || "Consultation"}
                      </p>
                      <p className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                        <Clock size={13} />
                        {formatDate(appointment.appointmentDate)} ·{" "}
                        {appointment.appointmentTime}
                      </p>
                    </div>
                    <span className="rounded-full bg-amber-50 px-2 py-1 text-xs font-medium capitalize text-amber-700">
                      {appointment.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-slate-900">
              Your health checklist
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Helpful actions based on your account activity
            </p>

            <div className="mt-5 space-y-3">
              {data.reminders.length === 0 && (
                <div className="rounded-xl bg-teal-50 p-4">
                  <CheckCircle2 className="text-teal-700" size={22} />
                  <p className="mt-2 font-medium text-slate-800">
                    You're all caught up!
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    There are no upcoming tasks from the available dashboard
                    data.
                  </p>
                </div>
              )}

              {data.reminders.map((reminder, index) => (
                <Link
                  key={`${reminder.type}-${index}`}
                  to={reminder.link}
                  className="flex items-start gap-3 rounded-xl border border-slate-100 p-4 transition hover:bg-slate-50"
                >
                  <AlertCircle className="mt-0.5 text-teal-700" size={20} />
                  <div className="flex-1">
                    <p className="text-sm text-slate-700">
                      {reminder.message}
                    </p>
                    <span className="mt-2 inline-block text-sm font-semibold text-teal-700">
                      Review now →
                    </span>
                  </div>
                </Link>
              ))}

              <Link
                to="/user/assistant"
                className="flex items-center justify-between rounded-xl bg-gradient-to-r from-teal-700 to-blue-700 p-4 text-white transition hover:opacity-95"
              >
                <div>
                  <p className="font-semibold">Need general health guidance?</p>
                  <p className="mt-1 text-sm text-teal-50">
                    Chat with SehatAI
                  </p>
                </div>
                <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </section>

        <p className="text-xs leading-5 text-slate-500">
          Dashboard insights summarize information saved in your account.
          They are not a diagnosis or a substitute for professional medical
          advice.
        </p>
      </div>
    </div>
  );
}
