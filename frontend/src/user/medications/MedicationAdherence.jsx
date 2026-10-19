import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Pill,
  RefreshCw,
  TrendingUp,
  XCircle,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

const initialData = {
  period: { startDate: "", endDate: "" },
  totals: {
    scheduled: 0,
    taken: 0,
    skipped: 0,
    pending: 0,
    adherence: 0,
  },
  dailyStats: [],
};

function formatDate(dateString) {
  if (!dateString) return "—";

  // Parse date-only values in UTC to prevent a one-day timezone shift.
  const date = new Date(`${dateString}T00:00:00Z`);

  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(date);
}

function formatDay(dateString) {
  if (!dateString) return "";

  const date = new Date(`${dateString}T00:00:00Z`);

  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    timeZone: "UTC",
  }).format(date);
}

function StatCard({ title, value, description, icon: Icon, color }) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-emerald-50 text-emerald-600",
    red: "bg-rose-50 text-rose-600",
    amber: "bg-amber-50 text-amber-600",
    teal: "bg-teal-50 text-teal-700",
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
          <p className="mt-2 text-xs text-slate-500">{description}</p>
        </div>

        <div className={`rounded-xl p-3 ${colors[color] || colors.blue}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

export default function MedicationAdherence() {
  const navigate = useNavigate();

  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAdherence = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/medication-analytics/adherence");
      const result = response.data;

      if (!result?.success) {
        throw new Error("Unable to load medication adherence.");
      }

      setData({
        period: result.period ?? initialData.period,
        totals: { ...initialData.totals, ...(result.totals ?? {}) },
        dailyStats: Array.isArray(result.dailyStats)
          ? result.dailyStats
          : [],
      });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Could not load medication adherence.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAdherence();
  }, [fetchAdherence]);

  const totals = data.totals;
  const hasDoseRecords = totals.scheduled > 0;

  const chartData = data.dailyStats.map((day) => ({
    ...day,
    dayLabel: formatDay(day.date),
    dateLabel: formatDate(day.date),
    adherence: Number(day.adherence) || 0,
  }));

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <button
              type="button"
              onClick={() => navigate("/user/medications")}
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-teal-700"
            >
              <ArrowLeft size={17} />
              Back to medications
            </button>

            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-teal-100 p-3 text-teal-700">
                <Activity size={28} />
              </div>

              <div>
                <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
                  Medication Adherence
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  Track your medication routine over the last seven days.
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchAdherence}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <RefreshCw
              size={30}
              className="mx-auto animate-spin text-teal-600"
            />
            <p className="mt-4 font-medium text-slate-700">
              Loading your adherence report...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-2xl border border-rose-200 bg-white p-8 text-center">
            <XCircle size={36} className="mx-auto text-rose-500" />
            <h2 className="mt-4 text-lg font-semibold text-slate-900">
              Unable to load your report
            </h2>
            <p className="mx-auto mt-2 max-w-lg text-sm text-slate-600">
              {error}
            </p>
            <button
              type="button"
              onClick={fetchAdherence}
              className="mt-5 rounded-xl bg-teal-600 px-5 py-2.5 font-semibold text-white hover:bg-teal-700"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Report period */}
            <div className="mb-6 flex flex-wrap items-center gap-2 text-sm text-slate-500">
              <CalendarDays size={17} className="text-teal-600" />
              <span>Report period:</span>
              <span className="font-semibold text-slate-700">
                {formatDate(data.period.startDate)} –{" "}
                {formatDate(data.period.endDate)}
              </span>
            </div>

            {/* Adherence summary */}
            <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Overall adherence"
                value={`${totals.adherence}%`}
                description="Of doses marked taken or skipped"
                icon={TrendingUp}
                color="teal"
              />

              <StatCard
                title="Doses scheduled"
                value={totals.scheduled}
                description="Dose records created for this period"
                icon={Pill}
                color="blue"
              />

              <StatCard
                title="Doses taken"
                value={totals.taken}
                description="Marked as taken"
                icon={CheckCircle2}
                color="green"
              />

              <StatCard
                title="Doses skipped"
                value={totals.skipped}
                description="Marked as skipped"
                icon={XCircle}
                color="red"
              />
            </section>

            {/* Pending summary */}
            <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-white p-3 text-amber-600">
                  <Clock3 size={22} />
                </div>

                <div>
                  <h2 className="font-semibold text-slate-900">
                    Pending doses: {totals.pending}
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    These doses have not been marked as taken or skipped.
                    Pending doses are excluded from the adherence percentage.
                  </p>
                </div>
              </div>
            </section>

            {/* Chart */}
            <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-6">
                <h2 className="text-lg font-bold text-slate-900">
                  Seven-day adherence trend
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Daily percentage based on doses marked taken or skipped.
                </p>
              </div>

              {!hasDoseRecords ? (
                <div className="flex min-h-64 flex-col items-center justify-center text-center">
                  <Pill size={38} className="text-slate-300" />
                  <h3 className="mt-4 font-semibold text-slate-800">
                    No dose records yet
                  </h3>
                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                    Add medications with reminder times and generate daily dose
                    records to start tracking adherence.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate("/user/medications")}
                    className="mt-5 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
                  >
                    View medications
                  </button>
                </div>
              ) : (
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 10, right: 12, left: -16, bottom: 4 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="dayLabel"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis
                        domain={[0, 100]}
                        ticks={[0, 25, 50, 75, 100]}
                        tickFormatter={(value) => `${value}%`}
                        tickLine={false}
                        axisLine={false}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip
                        formatter={(value) => [`${value}%`, "Adherence"]}
                        labelFormatter={(_, payload) =>
                          payload?.[0]?.payload?.dateLabel || ""
                        }
                      />
                      <Line
                        type="monotone"
                        dataKey="adherence"
                        name="Adherence"
                        stroke="#0d9488"
                        strokeWidth={3}
                        dot={{ r: 4, fill: "#0d9488" }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </section>

            {/* Daily breakdown */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 p-5 sm:p-6">
                <h2 className="text-lg font-bold text-slate-900">
                  Daily breakdown
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Review dose records for each day of the reporting period.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-4 font-semibold">Date</th>
                      <th className="px-5 py-4 font-semibold">Scheduled</th>
                      <th className="px-5 py-4 font-semibold">Taken</th>
                      <th className="px-5 py-4 font-semibold">Skipped</th>
                      <th className="px-5 py-4 font-semibold">Pending</th>
                      <th className="px-5 py-4 font-semibold">Adherence</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {chartData.map((day) => (
                      <tr
                        key={day.date}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="whitespace-nowrap px-5 py-4 font-medium text-slate-800">
                          {formatDate(day.date)}
                        </td>
                        <td className="px-5 py-4 text-slate-600">
                          {day.scheduled}
                        </td>
                        <td className="px-5 py-4 font-medium text-emerald-700">
                          {day.taken}
                        </td>
                        <td className="px-5 py-4 font-medium text-rose-600">
                          {day.skipped}
                        </td>
                        <td className="px-5 py-4 font-medium text-amber-600">
                          {day.pending}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-20 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className="h-full rounded-full bg-teal-500"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    Math.max(0, day.adherence)
                                  )}%`,
                                }}
                              />
                            </div>
                            <span className="font-semibold text-slate-700">
                              {day.adherence}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}

                    {chartData.length === 0 && (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-5 py-10 text-center text-slate-500"
                        >
                          No daily statistics are available.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <p className="mt-5 text-xs leading-5 text-slate-500">
              This report reflects recorded dose statuses, not a confirmation
              that medication was physically taken. Follow your clinician’s
              instructions for your medication routine.
            </p>
          </>
        )}
      </div>
    </main>
  );
}