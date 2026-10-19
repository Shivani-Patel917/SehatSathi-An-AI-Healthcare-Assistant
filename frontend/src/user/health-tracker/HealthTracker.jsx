
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  HeartPulse,
  Scale,
  Droplets,
  Trash2,
  RefreshCw,
  Plus,
  CalendarDays,
} from "lucide-react";
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  Legend,
} from "recharts";
import toast from "react-hot-toast";

import api from "../../services/api";

const TYPES = [
  { value: "weight", label: "Weight", unit: "kg" },
  {
    value: "blood-pressure",
    label: "Blood pressure",
    unit: "mmHg",
  },
  {
    value: "blood-glucose",
    label: "Blood glucose",
    unit: "mg/dL",
  },
];

function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function displayMeasurement(metric) {
  if (metric.type === "blood-pressure") {
    return `${metric.systolic}/${metric.diastolic} mmHg`;
  }

  return `${metric.value} ${metric.unit}`;
}

function MetricCard({ title, value, unit, icon: Icon, subtitle }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-3 text-2xl font-bold text-slate-900">
            {value}
            {unit && (
              <span className="ml-1 text-sm font-medium text-slate-500">
                {unit}
              </span>
            )}
          </p>
          <p className="mt-2 text-xs text-slate-500">{subtitle}</p>
        </div>
        <div className="rounded-xl bg-teal-50 p-3 text-teal-700">
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

export default function HealthTracker() {
  const [metrics, setMetrics] = useState([]);
  const [type, setType] = useState("weight");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    value: "",
    systolic: "",
    diastolic: "",
    recordedAt: getToday(),
    notes: "",
  });

  const loadMetrics = useCallback(async () => {
    setError("");

    try {
      const response = await api.get("/health-tracker");
      setMetrics(response.data?.metrics ?? []);
    } catch (err) {
      console.error("Load health metrics error:", err);

      const message =
        err.response?.data?.message ||
        "Unable to load your health measurements.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  const filteredMetrics = useMemo(() => {
    return metrics
      .filter((metric) => filter === "all" || metric.type === filter)
      .sort(
        (a, b) =>
          new Date(a.recordedAt).getTime() -
          new Date(b.recordedAt).getTime()
      );
  }, [metrics, filter]);

  const latest = useMemo(() => {
    const findLatest = (metricType) =>
      [...metrics]
        .filter((metric) => metric.type === metricType)
        .sort(
          (a, b) =>
            new Date(b.recordedAt).getTime() -
            new Date(a.recordedAt).getTime()
        )[0];

    return {
      weight: findLatest("weight"),
      pressure: findLatest("blood-pressure"),
      glucose: findLatest("blood-glucose"),
    };
  }, [metrics]);

  const chartData = useMemo(() => {
    const grouped = new Map();

    for (const metric of filteredMetrics) {
      const date = new Date(metric.recordedAt);
      const key = date.toISOString().slice(0, 10);
      const existing = grouped.get(key) ?? {
        date: key,
        weight: null,
        glucose: null,
        systolic: null,
        diastolic: null,
      };

      if (metric.type === "weight") {
        existing.weight = metric.value;
      } else if (metric.type === "blood-glucose") {
        existing.glucose = metric.value;
      } else if (metric.type === "blood-pressure") {
        existing.systolic = metric.systolic;
        existing.diastolic = metric.diastolic;
      }

      grouped.set(key, existing);
    }

    return [...grouped.values()].map((item) => ({
      ...item,
      date: formatDate(item.date),
    }));
  }, [filteredMetrics]);

  function updateForm(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = {
        type,
        recordedAt: form.recordedAt,
        notes: form.notes.trim(),
      };

      if (type === "blood-pressure") {
        payload.systolic = Number(form.systolic);
        payload.diastolic = Number(form.diastolic);
      } else {
        payload.value = Number(form.value);
      }

      const response = await api.post("/health-tracker", payload);

      setMetrics((current) => [
        response.data.metric,
        ...current,
      ]);

      setForm({
        value: "",
        systolic: "",
        diastolic: "",
        recordedAt: getToday(),
        notes: "",
      });

      toast.success("Health measurement saved.");
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Unable to save the measurement."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Delete this health measurement? This action cannot be undone."
    );

    if (!confirmed) return;

    setDeletingId(id);

    try {
      await api.delete(`/health-tracker/${id}`);

      setMetrics((current) =>
        current.filter((metric) => metric._id !== id)
      );

      toast.success("Measurement deleted.");
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Unable to delete the measurement."
      );
    } finally {
      setDeletingId("");
    }
  }

  const selectedType = TYPES.find((item) => item.value === type);

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-7">
        <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-teal-700">
              SehatSathi · Personal wellness
            </p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
              Health Tracker
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Record measurements and review your history over time.
            </p>
          </div>

          <button
            type="button"
            onClick={loadMetrics}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </header>

        {error && (
          <div
            role="alert"
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <span>{error}</span>
            <button
              onClick={loadMetrics}
              className="font-semibold underline"
            >
              Retry
            </button>
          </div>
        )}

        {/* Latest saved readings */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <MetricCard
            title="Latest weight"
            value={latest.weight?.value ?? "—"}
            unit={latest.weight ? "kg" : ""}
            icon={Scale}
            subtitle={
              latest.weight
                ? formatDate(latest.weight.recordedAt)
                : "No weight recorded yet"
            }
          />
          <MetricCard
            title="Latest blood pressure"
            value={
              latest.pressure
                ? `${latest.pressure.systolic}/${latest.pressure.diastolic}`
                : "—"
            }
            unit={latest.pressure ? "mmHg" : ""}
            icon={HeartPulse}
            subtitle={
              latest.pressure
                ? formatDate(latest.pressure.recordedAt)
                : "No reading recorded yet"
            }
          />
          <MetricCard
            title="Latest blood glucose"
            value={latest.glucose?.value ?? "—"}
            unit={latest.glucose ? "mg/dL" : ""}
            icon={Droplets}
            subtitle={
              latest.glucose
                ? formatDate(latest.glucose.recordedAt)
                : "No reading recorded yet"
            }
          />
        </section>

        {/* Add measurement */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="rounded-xl bg-teal-50 p-3 text-teal-700">
              <Plus size={22} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">
                Add a measurement
              </h2>
              <p className="text-sm text-slate-500">
                Enter the value shown by your measuring device.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="metricType"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Measurement type
                </label>
                <select
                  id="metricType"
                  value={type}
                  onChange={(event) => {
                    setType(event.target.value);
                    setForm((current) => ({
                      ...current,
                      value: "",
                      systolic: "",
                      diastolic: "",
                    }));
                  }}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                >
                  {TYPES.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="recordedAt"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Measurement date
                </label>
                <input
                  id="recordedAt"
                  type="date"
                  name="recordedAt"
                  max={getToday()}
                  required
                  value={form.recordedAt}
                  onChange={updateForm}
                  className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                />
              </div>
            </div>

            {type === "blood-pressure" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="systolic"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Systolic (mmHg)
                  </label>
                  <input
                    id="systolic"
                    type="number"
                    min="1"
                    max="350"
                    step="1"
                    required
                    name="systolic"
                    value={form.systolic}
                    onChange={updateForm}
                    placeholder="e.g. 120"
                    className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  />
                </div>
                <div>
                  <label
                    htmlFor="diastolic"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Diastolic (mmHg)
                  </label>
                  <input
                    id="diastolic"
                    type="number"
                    min="1"
                    max="250"
                    step="1"
                    required
                    name="diastolic"
                    value={form.diastolic}
                    onChange={updateForm}
                    placeholder="e.g. 80"
                    className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label
                  htmlFor="value"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Value ({selectedType.unit})
                </label>
                <input
                  id="value"
                  type="number"
                  min="0.1"
                  max={type === "weight" ? "500" : "2000"}
                  step="any"
                  required
                  name="value"
                  value={form.value}
                  onChange={updateForm}
                  placeholder={
                    type === "weight"
                      ? "e.g. 62.5"
                      : "e.g. 95"
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="notes"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Notes (optional)
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={3}
                maxLength={500}
                value={form.notes}
                onChange={updateForm}
                placeholder="For example: measurement taken in the morning."
                className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Plus size={17} />
              {saving ? "Saving..." : "Save measurement"}
            </button>
          </form>
        </section>

        {/* Trend chart */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-bold text-slate-900">
                Measurement trends
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Compare your saved readings by date.
              </p>
            </div>

            <select
              aria-label="Filter measurement history"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm"
            >
              <option value="all">All measurements</option>
              {TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-5 h-72">
            {loading ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                Loading measurements...
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <Activity size={32} className="text-slate-300" />
                <p className="mt-3 font-medium text-slate-700">
                  No measurements to chart
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Save your first reading to start tracking trends.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 12, left: -15, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis
                    allowDecimals
                    tick={{ fontSize: 12 }}
                    domain={["auto", "auto"]}
                  />
                  <Tooltip />
                  <Legend />
                  {(filter === "all" || filter === "weight") && (
                    <Line
                      type="monotone"
                      dataKey="weight"
                      name="Weight (kg)"
                      stroke="#0D9488"
                      connectNulls={false}
                      dot={{ r: 3 }}
                    />
                  )}
                  {(filter === "all" || filter === "blood-glucose") && (
                    <Line
                      type="monotone"
                      dataKey="glucose"
                      name="Blood glucose (mg/dL)"
                      stroke="#2563EB"
                      connectNulls={false}
                      dot={{ r: 3 }}
                    />
                  )}
                  {(filter === "all" || filter === "blood-pressure") && (
                    <>
                      <Line
                        type="monotone"
                        dataKey="systolic"
                        name="Systolic (mmHg)"
                        stroke="#9333EA"
                        connectNulls={false}
                        dot={{ r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="diastolic"
                        name="Diastolic (mmHg)"
                        stroke="#EA580C"
                        connectNulls={false}
                        dot={{ r: 3 }}
                      />
                    </>
                  )}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Different measurement types use different units. When viewing all
            types together, compare each line only with readings of the same
            type.
          </p>
        </section>

        {/* History */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-5">
            <h2 className="font-bold text-slate-900">
              Measurement history
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Your most recent saved measurements.
            </p>
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Loading history...
            </div>
          ) : filteredMetrics.length === 0 ? (
            <div className="p-8 text-center">
              <CalendarDays
                className="mx-auto text-slate-300"
                size={32}
              />
              <p className="mt-3 font-medium text-slate-700">
                No measurements found
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Your saved measurements will appear here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Date</th>
                    <th className="px-5 py-3 font-semibold">Type</th>
                    <th className="px-5 py-3 font-semibold">Reading</th>
                    <th className="px-5 py-3 font-semibold">Notes</th>
                    <th className="px-5 py-3 text-right font-semibold">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[...filteredMetrics]
                    .reverse()
                    .map((metric) => (
                      <tr key={metric._id} className="hover:bg-slate-50">
                        <td className="px-5 py-4 text-slate-600">
                          {formatDate(metric.recordedAt)}
                        </td>
                        <td className="px-5 py-4 font-medium text-slate-800">
                          {TYPES.find(
                            (item) => item.value === metric.type
                          )?.label ?? metric.type}
                        </td>
                        <td className="px-5 py-4 font-semibold text-slate-800">
                          {displayMeasurement(metric)}
                        </td>
                        <td className="max-w-xs truncate px-5 py-4 text-slate-500">
                          {metric.notes || "—"}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            disabled={deletingId === metric._id}
                            onClick={() => handleDelete(metric._id)}
                            aria-label="Delete measurement"
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            <Trash2 size={17} />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="text-xs leading-5 text-slate-500">
          This tracker stores measurements you enter manually. It does not
          diagnose medical conditions or replace professional medical advice.
          Seek urgent medical help for severe or concerning symptoms.
        </p>
      </div>
    </div>
  );
}
