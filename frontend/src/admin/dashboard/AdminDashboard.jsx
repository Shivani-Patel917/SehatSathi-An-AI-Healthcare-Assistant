
import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  Clock3,
  RefreshCw,
  Users,
  XCircle,
  Bot,
  AlertTriangle,
} from "lucide-react";
import {
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import toast from "react-hot-toast";
import api from "../../services/api";

const statusColors = {
  Pending: "#D97706",
  Confirmed: "#2563EB",
  Completed: "#0D9488",
  Cancelled: "#DC2626",
};

function StatCard({ title, value, subtitle, icon: Icon, color }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="mt-2 text-2xl font-bold text-slate-900">
            {value ?? 0}
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            {subtitle || "Overview"}
          </p>
        </div>

        <div className={`rounded-xl p-3 ${color}`}>
          <Icon size={22} />
        </div>
      </div>
    </article>
  );
}

function SectionCard({ title, subtitle, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {subtitle && (
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex min-h-36 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center">
      <Activity size={25} className="text-slate-400" />
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}

function normalizeAnalytics(response) {
  const result =
    response?.analytics ??
    response?.data?.analytics ??
    response?.data ??
    response;

  if (!result || typeof result !== "object" || Array.isArray(result)) {
    throw new Error("The server returned an invalid analytics response.");
  }

  const stats = result.stats ?? {};

  return {
    stats: {
      totalUsers: Number(stats.totalUsers ?? 0),
      newUsers: Number(stats.newUsers ?? 0),
      totalAppointments: Number(stats.totalAppointments ?? 0),
      completedAppointments: Number(stats.completedAppointments ?? 0),
      pendingAppointments: Number(stats.pendingAppointments ?? 0),
      aiRequests: Number(stats.aiRequests ?? 0),
      aiErrors: Number(stats.aiErrors ?? 0),
    },

    registrations: Array.isArray(result.registrations)
      ? result.registrations
      : [],

    appointments: Array.isArray(result.appointments)
      ? result.appointments
      : [],

    appointmentBreakdown: Array.isArray(result.appointmentBreakdown)
      ? result.appointmentBreakdown
      : [],

    aiActivity: Array.isArray(result.aiActivity)
      ? result.aiActivity
      : [],
  };
}

function formatDate(dateString) {
  if (!dateString) return "";

  const date = new Date(`${dateString}T00:00:00Z`);

  if (Number.isNaN(date.getTime())) return String(dateString);

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadAnalytics = useCallback(async () => {
    setLoading(true);

    try {
      // Uses the same existing endpoint as the Analytics page.
      const { data } = await api.get("/admin/analytics");

      if (data?.success === false) {
        throw new Error(data.message || "Unable to load dashboard.");
      }

      const normalized = normalizeAnalytics(data);

      setAnalytics(normalized);
      setLastUpdated(new Date());
    } catch (error) {
      console.error(
        "Failed to load admin dashboard:",
        error.response?.data ?? error
      );

      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Unable to load dashboard data."
      );

      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const stats = analytics?.stats;

  // Match registrations and appointments by date for the activity chart.
  const activityMap = new Map();

  (analytics?.registrations ?? []).forEach((item) => {
    activityMap.set(item.date, {
      date: item.date,
      users: Number(item.count ?? 0),
      appointments: 0,
    });
  });

  (analytics?.appointments ?? []).forEach((item) => {
    const existing = activityMap.get(item.date) ?? {
      date: item.date,
      users: 0,
      appointments: 0,
    };

    existing.appointments = Number(item.count ?? 0);
    activityMap.set(item.date, existing);
  });

  const activityData = Array.from(activityMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  const appointmentData = (analytics?.appointmentBreakdown ?? []).map(
    (item) => ({
      name: item.name,
      value: Number(item.value ?? 0),
    })
  );

  const aiActivity = (analytics?.aiActivity ?? []).map((item) => ({
    date: item.date,
    requests: Number(item.requests ?? 0),
    errors: Number(item.errors ?? 0),
  }));

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Admin Dashboard
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Monitor users, appointments, and AI activity.
            </p>

            {lastUpdated && (
              <p className="mt-1 text-xs text-slate-400">
                Last updated:{" "}
                {lastUpdated.toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={loadAnalytics}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </header>

        {/* Loading state */}
        {loading && !analytics && (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white">
            <RefreshCw
              size={30}
              className="animate-spin text-teal-600"
            />
            <p className="text-sm text-slate-500">
              Loading dashboard data...
            </p>
          </div>
        )}

        {/* Error state */}
        {!loading && !analytics && (
          <section className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-sm">
            <Activity size={28} className="mx-auto text-red-600" />

            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              Unable to load dashboard
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Check the backend connection and admin permissions, then try
              again.
            </p>

            <button
              type="button"
              onClick={loadAnalytics}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
            >
              <RefreshCw size={16} />
              Try again
            </button>
          </section>
        )}

        {/* Dashboard data */}
        {analytics && stats && (
          <>
            {/* Statistics */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Registered Users"
                value={stats.totalUsers}
                subtitle={`${stats.newUsers} registered in selected period`}
                icon={Users}
                color="bg-blue-50 text-blue-600"
              />

              <StatCard
                title="Total Appointments"
                value={stats.totalAppointments}
                subtitle="Created in selected period"
                icon={CalendarDays}
                color="bg-violet-50 text-violet-600"
              />

              <StatCard
                title="Pending Appointments"
                value={stats.pendingAppointments}
                subtitle="Awaiting appointment action"
                icon={Clock3}
                color="bg-amber-50 text-amber-600"
              />

              <StatCard
                title="AI Requests"
                value={stats.aiRequests}
                subtitle={`${stats.aiErrors} failed request(s)`}
                icon={Bot}
                color="bg-teal-50 text-teal-600"
              />
            </section>

            {/* Activity charts */}
            <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <SectionCard
                title="Appointment Status"
                subtitle="Distribution of appointments by status"
              >
                {appointmentData.length === 0 ||
                appointmentData.every((item) => item.value === 0) ? (
                  <EmptyState message="No appointment status data is available yet." />
                ) : (
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={appointmentData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="45%"
                          outerRadius={90}
                          innerRadius={48}
                          paddingAngle={3}
                        >
                          {appointmentData.map((entry) => (
                            <Cell
                              key={entry.name}
                              fill={
                                statusColors[entry.name] ?? "#64748B"
                              }
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </SectionCard>

              <SectionCard
                title="Daily Activity"
                subtitle="User registrations and appointments in the selected period"
              >
                {activityData.length === 0 ? (
                  <EmptyState message="No activity data is available yet." />
                ) : (
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={activityData}
                        margin={{
                          top: 10,
                          right: 10,
                          left: 0,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                        />

                        <XAxis
                          dataKey="date"
                          tickFormatter={formatDate}
                          tick={{ fontSize: 11 }}
                          minTickGap={20}
                        />

                        <YAxis
                          allowDecimals={false}
                          tick={{ fontSize: 12 }}
                        />

                        <Tooltip
                          labelFormatter={(label) => formatDate(label)}
                        />
                        <Legend />

                        <Line
                          type="monotone"
                          dataKey="users"
                          name="Registrations"
                          stroke="#2563EB"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 5 }}
                        />

                        <Line
                          type="monotone"
                          dataKey="appointments"
                          name="Appointments"
                          stroke="#0D9488"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </SectionCard>
            </section>

            {/* Appointment summary */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  title: "Pending",
                  value:
                    appointmentData.find((item) => item.name === "Pending")
                      ?.value ?? 0,
                  icon: Clock3,
                  color: "text-amber-600 bg-amber-50",
                },
                {
                  title: "Confirmed",
                  value:
                    appointmentData.find((item) => item.name === "Confirmed")
                      ?.value ?? 0,
                  icon: CheckCircle2,
                  color: "text-blue-600 bg-blue-50",
                },
                {
                  title: "Completed",
                  value: stats.completedAppointments,
                  icon: CheckCircle2,
                  color: "text-teal-600 bg-teal-50",
                },
                {
                  title: "AI Errors",
                  value: stats.aiErrors,
                  icon: AlertTriangle,
                  color: "text-red-600 bg-red-50",
                },
              ].map((item) => {
                const Icon = item.icon;

                return (
                  <article
                    key={item.title}
                    className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className={`rounded-xl p-3 ${item.color}`}>
                      <Icon size={21} />
                    </div>

                    <div>
                      <p className="text-sm text-slate-500">{item.title}</p>
                      <p className="mt-1 text-xl font-bold text-slate-900">
                        {item.value}
                      </p>
                    </div>
                  </article>
                );
              })}
            </section>

            {/* AI activity */}
            <SectionCard
              title="AI Assistant Activity"
              subtitle="AI requests and failed requests by day"
            >
              {aiActivity.length === 0 ? (
                <EmptyState message="No AI activity has been recorded for this period." />
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={aiActivity}
                      margin={{
                        top: 10,
                        right: 10,
                        left: 0,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                      />

                      <XAxis
                        dataKey="date"
                        tickFormatter={formatDate}
                        tick={{ fontSize: 11 }}
                        minTickGap={20}
                      />

                      <YAxis
                        allowDecimals={false}
                        tick={{ fontSize: 12 }}
                      />

                      <Tooltip
                        labelFormatter={(label) => formatDate(label)}
                      />
                      <Legend />

                      <Line
                        type="monotone"
                        dataKey="requests"
                        name="AI Requests"
                        stroke="#2563EB"
                        strokeWidth={2}
                        dot={false}
                      />

                      <Line
                        type="monotone"
                        dataKey="errors"
                        name="Failed Requests"
                        stroke="#DC2626"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </SectionCard>
          </>
        )}
      </div>
    </main>
  );
}
