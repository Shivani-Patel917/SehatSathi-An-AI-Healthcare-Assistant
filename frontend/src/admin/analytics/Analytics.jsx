
import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  Users,
  CalendarDays,
  Bot,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  UserPlus,
  Stethoscope,
  MessageSquare,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import api from "../../services/api";

const ranges = [
  { label: "7 days", value: "7d" },
  { label: "30 days", value: "30d" },
  { label: "90 days", value: "90d" },
  { label: "12 months", value: "12m" },
];

const formatNumber = (value) =>
  Number(value || 0).toLocaleString("en-IN");

const chartColors = ["#0f766e", "#2563eb", "#f59e0b", "#8b5cf6"];

function EmptyChart({ message = "No data available for this period." }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-xl bg-slate-50 px-4 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

function StatCard({ title, value, subtitle, icon: Icon, color }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {formatNumber(value)}
          </p>
          <p className="mt-2 text-xs text-slate-500">{subtitle}</p>
        </div>
        <div className={`rounded-xl p-3 ${color}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function ChartCard({ title, description, children }) {
  return (
    <section className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="mb-5">
        <h2 className="font-bold text-slate-800">{title}</h2>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      {children}
    </section>
  );
}

export default function Analytics() {
  const [range, setRange] = useState("30d");
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/admin/analytics", {
        params: { range },
      });

      const payload = response.data?.analytics ?? response.data;

      if (!payload || typeof payload !== "object") {
        throw new Error("The analytics API returned an invalid response.");
      }

      setAnalytics(payload);
    } catch (err) {
      setAnalytics(null);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to load analytics. Check your admin analytics API."
      );
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const stats = analytics?.stats ?? {};
  const registrations = Array.isArray(analytics?.registrations)
    ? analytics.registrations
    : [];
  const appointments = Array.isArray(analytics?.appointments)
    ? analytics.appointments
    : [];
  const aiActivity = Array.isArray(analytics?.aiActivity)
    ? analytics.aiActivity
    : [];
  const appointmentBreakdown = Array.isArray(
    analytics?.appointmentBreakdown
  )
    ? analytics.appointmentBreakdown
    : [];

  const hasRegistrationData = registrations.length > 0;
  const hasAppointmentData = appointments.length > 0;
  const hasAiData = aiActivity.length > 0;
  const hasBreakdown = appointmentBreakdown.some(
    (item) => Number(item.value) > 0
  );

  return (
    <main className="min-h-screen space-y-6 bg-slate-50 p-4 text-slate-800 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-teal-700">
            Admin Console / Analytics
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Analytics Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Monitor registrations, appointments, and SehatAI activity.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={range}
            onChange={(event) => setRange(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            aria-label="Analytics date range"
          >
            {ranges.map((item) => (
              <option key={item.value} value={item.value}>
                Last {item.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={loadAnalytics}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm hover:bg-slate-100 disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 sm:flex-row sm:items-center">
          <AlertCircle size={20} className="shrink-0" />
          <p className="flex-1">{error}</p>
          <button
            type="button"
            onClick={loadAnalytics}
            className="font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          subtitle="All registered accounts"
          icon={Users}
          color="bg-blue-50 text-blue-700"
        />
        <StatCard
          title="New Registrations"
          value={stats.newUsers}
          subtitle="During selected period"
          icon={UserPlus}
          color="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          title="Appointments"
          value={stats.totalAppointments}
          subtitle="During selected period"
          icon={CalendarDays}
          color="bg-violet-50 text-violet-700"
        />
        <StatCard
          title="AI Requests"
          value={stats.aiRequests}
          subtitle="SehatAI requests in selected period"
          icon={Bot}
          color="bg-amber-50 text-amber-700"
        />
      </div>

      {loading && !analytics ? (
        <div className="flex min-h-64 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-500">
          <RefreshCw size={20} className="animate-spin" />
          Loading analytics...
        </div>
      ) : (
        <>
          {/* Registration and appointment trends */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ChartCard
              title="User Registration Trend"
              description="New accounts created over time."
            >
              {hasRegistrationData ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={registrations}>
                    <defs>
                      <linearGradient
                        id="registrationGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#0f766e"
                          stopOpacity={0.25}
                        />
                        <stop
                          offset="95%"
                          stopColor="#0f766e"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="count"
                      name="Registrations"
                      stroke="#0f766e"
                      strokeWidth={2.5}
                      fill="url(#registrationGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </ChartCard>

            <ChartCard
              title="Appointment Trend"
              description="Appointments created over time."
            >
              {hasAppointmentData ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={appointments}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="count"
                      name="Appointments"
                      fill="#2563eb"
                      radius={[5, 5, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </ChartCard>
          </div>

          {/* Appointment breakdown and AI activity */}
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <ChartCard
              title="Appointment Breakdown"
              description="Distribution by appointment status."
            >
              {hasBreakdown ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={appointmentBreakdown}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      outerRadius={90}
                      innerRadius={52}
                      paddingAngle={3}
                    >
                      {appointmentBreakdown.map((entry, index) => (
                        <Cell
                          key={`${entry.name}-${index}`}
                          fill={chartColors[index % chartColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </ChartCard>

            <ChartCard
              title="SehatAI Activity"
              description="AI requests and errors over time."
            >
              {hasAiData ? (
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={aiActivity}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="requests"
                      name="AI Requests"
                      stroke="#8b5cf6"
                      fill="#8b5cf6"
                      fillOpacity={0.12}
                    />
                    <Area
                      type="monotone"
                      dataKey="errors"
                      name="Errors"
                      stroke="#dc2626"
                      fill="#dc2626"
                      fillOpacity={0.08}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyChart />
              )}
            </ChartCard>
          </div>

          {/* Summary strip */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              {
                label: "Completed Appointments",
                value: stats.completedAppointments,
                icon: Stethoscope,
              },
              {
                label: "Pending Appointments",
                value: stats.pendingAppointments,
                icon: CalendarDays,
              },
              {
                label: "AI Requests Failed",
                value: stats.aiErrors,
                icon: MessageSquare,
              },
            ].map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.label}
                  className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="rounded-xl bg-slate-100 p-3 text-slate-700">
                    <Icon size={21} />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">{item.label}</p>
                    <p className="mt-1 text-2xl font-bold">
                      {formatNumber(item.value)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <p className="flex items-center gap-2 text-xs text-slate-400">
            <Activity size={14} />
            Statistics reflect the data returned by the backend for the selected period.
          </p>
        </>
      )}
    </main>
  );
}