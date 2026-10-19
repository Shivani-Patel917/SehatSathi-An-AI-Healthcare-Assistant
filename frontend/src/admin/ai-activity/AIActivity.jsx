import { useEffect, useState } from "react";
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock3,
  RefreshCw,
  Bot,
  AlertTriangle,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";
import toast from "react-hot-toast";
import api from "../../services/api";

const formatDate = (value) =>
  new Date(value).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const formatDuration = (value) =>
  value == null ? "—" : `${value.toLocaleString()} ms`;

function StatCard({ title, value, subtitle, icon: Icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {value}
          </p>
          <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
        </div>
        <div className="rounded-xl bg-teal-50 p-3 text-teal-700">
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

export default function AIActivity() {
  const [range, setRange] = useState("30d");
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchActivity = async (showRefresh = false) => {
    showRefresh ? setRefreshing(true) : setLoading(true);

    try {
      const { data } = await api.get("/admin/ai-activity", {
        params: { range },
      });

      if (!data.success) {
        throw new Error(data.message || "Unable to load AI activity");
      }

      setActivity(data.activity);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Unable to load AI activity"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, [range]);

  const stats = activity?.stats;
  const filteredActivities = (activity?.recentActivities || []).filter(
    (item) => statusFilter === "all" || item.status === statusFilter
  );

  if (loading && !activity) {
    return (
      <div className="flex min-h-64 items-center justify-center text-slate-500">
        <RefreshCw className="mr-2 animate-spin" size={20} />
        Loading AI activity...
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-teal-100 p-3 text-teal-700">
              <Bot size={25} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                AI Activity
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Monitor SehatSathi AI requests and service reliability.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <select
            value={range}
            onChange={(event) => setRange(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500"
            aria-label="Activity date range"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
          </select>

          <button
            type="button"
            onClick={() => fetchActivity(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={refreshing ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>
      </div>

      {activity && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total AI Requests"
              value={stats.totalRequests.toLocaleString()}
              subtitle={`During the last ${range}`}
              icon={Activity}
            />
            <StatCard
              title="Successful Requests"
              value={stats.successfulRequests.toLocaleString()}
              subtitle="Completed without a logged error"
              icon={CheckCircle2}
            />
            <StatCard
              title="Failed Requests"
              value={stats.failedRequests.toLocaleString()}
              subtitle="Requests recorded as failed"
              icon={XCircle}
            />
            <StatCard
              title="Average Response Time"
              value={formatDuration(stats.averageDurationMs)}
              subtitle={`${stats.successRate}% success rate`}
              icon={Clock3}
            />
          </div>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5">
              <h2 className="font-semibold text-slate-900">
                Request activity
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Daily request volume and failed requests.
              </p>
            </div>

            {activity.dailyActivity.length === 0 ? (
              <div className="flex min-h-64 flex-col items-center justify-center text-center">
                <Bot size={36} className="mb-3 text-slate-300" />
                <p className="font-medium text-slate-700">
                  No AI activity recorded yet
                </p>
                <p className="mt-1 max-w-md text-sm text-slate-500">
                  Once the backend records AI requests, your activity chart
                  will appear here.
                </p>
              </div>
            ) : (
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activity.dailyActivity}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) =>
                        value.slice(5).replace("-", "/")
                      }
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="requests"
                      name="Requests"
                      stroke="#0d9488"
                      fill="#99f6e4"
                      fillOpacity={0.45}
                    />
                    <Area
                      type="monotone"
                      dataKey="errors"
                      name="Errors"
                      stroke="#e11d48"
                      fill="#fecdd3"
                      fillOpacity={0.4}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">
              <div>
                <h2 className="font-semibold text-slate-900">
                  Recent AI requests
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Latest recorded activity, up to 50 entries.
                </p>
              </div>

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm"
                aria-label="Filter activity by status"
              >
                <option value="all">All statuses</option>
                <option value="success">Successful</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[760px] w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-4">User</th>
                    <th className="px-5 py-4">Action</th>
                    <th className="px-5 py-4">Provider / Model</th>
                    <th className="px-5 py-4">Duration</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4">Date</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredActivities.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-5 py-4">
                        <p className="font-medium text-slate-800">
                          {item.user?.name || "Unknown / Guest"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.user?.email || "No account linked"}
                        </p>
                      </td>
                      <td className="px-5 py-4 capitalize text-slate-700">
                        {item.action.replaceAll("_", " ")}
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        <p>{item.provider}</p>
                        <p className="text-xs text-slate-400">{item.model}</p>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {formatDuration(item.durationMs)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
                            item.status === "success"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-rose-50 text-rose-700"
                          }`}
                        >
                          {item.status === "success" ? (
                            <CheckCircle2 size={13} />
                          ) : (
                            <AlertTriangle size={13} />
                          )}
                          {item.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-slate-600">
                        {formatDate(item.createdAt)}
                      </td>
                    </tr>
                  ))}

                  {filteredActivities.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-12 text-center text-slate-500"
                      >
                        No activity matches this filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}