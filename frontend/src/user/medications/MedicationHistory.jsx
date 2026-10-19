
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock,
  History,
  LoaderCircle,
  Pill,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import api from "../../services/api";

const statusStyles = {
  taken: "bg-emerald-50 text-emerald-700",
  skipped: "bg-rose-50 text-rose-700",
  pending: "bg-amber-50 text-amber-700",
};

function getToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(date) {
  if (!date) return "—";

  return new Date(`${date}T00:00:00`).toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );
}

function formatTime(time) {
  if (!time) return "—";

  const [hour, minute] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hour, minute, 0, 0);

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function MedicationHistory() {
  const navigate = useNavigate();

  const [date, setDate] = useState(getToday);
  const [doses, setDoses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("/medication-doses", {
          params: { date },
        });

        if (!cancelled) {
          setDoses(response.data.doses ?? []);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err.response?.data?.message ||
            "Unable to load medication history.";

          setError(message);
          toast.error(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [date]);

  const taken = doses.filter(
    (dose) => dose.status === "taken"
  ).length;

  const skipped = doses.filter(
    (dose) => dose.status === "skipped"
  ).length;

  const pending = doses.filter(
    (dose) => dose.status === "pending"
  ).length;

  const adherence = doses.length
    ? Math.round((taken / doses.length) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <button
          type="button"
          onClick={() => navigate("/user/medications")}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-teal-700"
        >
          <ArrowLeft size={18} />
          Back to medications
        </button>

        <header className="rounded-3xl bg-gradient-to-r from-teal-700 to-cyan-700 p-6 text-white sm:p-8">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-white/15 p-3">
              <History size={28} />
            </div>

            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">
                Medication History
              </h1>
              <p className="mt-1 text-sm text-teal-50">
                Review your recorded medication doses.
              </p>
            </div>
          </div>

          <div className="mt-6 max-w-xs">
            <label
              htmlFor="history-date"
              className="mb-2 block text-sm font-medium"
            >
              Select date
            </label>

            <input
              id="history-date"
              type="date"
              value={date}
              max={getToday()}
              onChange={(event) => setDate(event.target.value)}
              className="w-full rounded-xl border border-white/30 bg-white px-4 py-3 text-slate-800 outline-none focus:ring-2 focus:ring-cyan-200"
            />
          </div>
        </header>

        <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard
            label="Scheduled"
            value={doses.length}
            icon={<Pill size={20} />}
          />
          <StatCard
            label="Taken"
            value={taken}
            icon={<CheckCircle2 size={20} />}
          />
          <StatCard
            label="Skipped"
            value={skipped}
            icon={<XCircle size={20} />}
          />
          <StatCard
            label="Pending"
            value={pending}
            icon={<Clock size={20} />}
          />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-slate-900">
                Daily adherence
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Percentage of recorded doses marked taken.
              </p>
            </div>

            <span className="text-2xl font-bold text-teal-700">
              {adherence}%
            </span>
          </div>

          <div
            className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-100"
            role="progressbar"
            aria-label="Daily medication adherence"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={adherence}
          >
            <div
              className="h-full rounded-full bg-teal-600 transition-all"
              style={{ width: `${adherence}%` }}
            />
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Dose records
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {formatDate(date)}
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white p-10 text-slate-600">
              <LoaderCircle className="animate-spin" size={22} />
              Loading dose history...
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-rose-700">
              {error}
            </div>
          ) : doses.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <CalendarDays
                size={34}
                className="mx-auto text-slate-400"
              />
              <h3 className="mt-3 font-semibold text-slate-900">
                No recorded doses
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                No dose records were found for this date.
              </p>
              <button
                type="button"
                onClick={() => navigate("/user/medications")}
                className="mt-5 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800"
              >
                View medications
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {doses.map((dose) => (
                <article
                  key={dose._id}
                  className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-teal-50 p-3 text-teal-700">
                      <Pill size={22} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h3 className="font-semibold text-slate-900">
                          {dose.medication?.name ||
                            "Medication unavailable"}
                        </h3>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                            statusStyles[dose.status] ||
                            "bg-slate-100 text-slate-600"
                          }`}
                        >
                          {dose.status}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-slate-600">
                        {dose.medication?.dosage ||
                          "Dosage unavailable"}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-slate-500">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock size={15} />
                          {formatTime(dose.scheduledTime)}
                        </span>

                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays size={15} />
                          {formatDate(dose.scheduledDate)}
                        </span>
                      </div>

                      {dose.status === "taken" && dose.takenAt && (
                        <p className="mt-2 text-xs text-emerald-700">
                          Marked taken at{" "}
                          {new Date(dose.takenAt).toLocaleTimeString(
                            "en-IN",
                            {
                              hour: "numeric",
                              minute: "2-digit",
                            }
                          )}
                        </p>
                      )}

                      {dose.notes && (
                        <p className="mt-2 text-sm text-slate-500">
                          Note: {dose.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-2 text-slate-500">
        <span className="text-sm">{label}</span>
        {icon}
      </div>
      <p className="mt-3 text-2xl font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}
