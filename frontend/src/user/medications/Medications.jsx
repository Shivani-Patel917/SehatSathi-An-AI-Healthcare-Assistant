
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  BellRing,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Edit3,
  LoaderCircle,
  Pill,
  Plus,
  Search,
  SkipForward,
  Trash2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

function getLocalDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const emptyForm = () => ({
  name: "",
  dosage: "",
  frequency: "Once daily",
  instructions: "",
  startDate: getLocalDate(),
  endDate: "",
  reminderTimes: [],
  isActive: true,
});

const frequencies = [
  "Once daily",
  "Twice daily",
  "Three times daily",
  "Four times daily",
  "As needed",
  "As directed",
  "Other",
];

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100";

function getErrorMessage(error, fallback) {
  const data = error?.response?.data;

  if (typeof data?.message === "string") return data.message;
  if (typeof data?.error === "string") return data.error;
  if (typeof data?.detail === "string") return data.detail;

  if (Array.isArray(data?.detail)) {
    return data.detail
      .map((item) => item.msg || item.message || "Validation error")
      .join(", ");
  }

  return fallback;
}

function isCurrentlyScheduled(medication, today) {
  if (!medication) return false;

  const startDate = String(medication.startDate || "").slice(0, 10);
  const endDate = String(medication.endDate || "").slice(0, 10);

  return (
    medication.isActive === true &&
    startDate <= today &&
    (!endDate || endDate >= today)
  );
}

function formatDate(date) {
  if (!date) return "";

  const value = String(date).slice(0, 10);
  const [year, month, day] = value.split("-");

  if (!year || !month || !day) return value;

  return `${day}/${month}/${year}`;
}

function getDoseStatusClass(status) {
  if (status === "taken") return "bg-emerald-50 text-emerald-700";
  if (status === "skipped") return "bg-amber-50 text-amber-700";
  return "bg-slate-100 text-slate-600";
}

function normalizeList(data, key) {
  if (Array.isArray(data?.[key])) return data[key];
  if (Array.isArray(data)) return data;
  return [];
}

export default function Medications() {
  const navigate = useNavigate();

  const [medications, setMedications] = useState([]);
  const [doses, setDoses] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [doseLoading, setDoseLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingDoseId, setUpdatingDoseId] = useState(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [today, setToday] = useState(getLocalDate());

  const loadMedications = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get("/medications");
      setMedications(normalizeList(response.data, "medications"));
    } catch (error) {
      console.error(
        "Failed to load medications:",
        error.response?.data || error
      );
      toast.error(getErrorMessage(error, "Could not load medications."));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDailyDoses = useCallback(async (date = getLocalDate()) => {
    setDoseLoading(true);

    try {
      try {
        await api.post("/medication-doses/generate", null, {
          params: { date },
        });
      } catch (generationError) {
        console.error("Dose generation failed:", {
          status: generationError.response?.status,
          response: generationError.response?.data,
          date,
        });
      }

      const response = await api.get("/medication-doses", {
        params: { date },
      });

      setDoses(normalizeList(response.data, "doses"));
    } catch (error) {
      console.error("Failed to load medication doses:", {
        status: error.response?.status,
        response: error.response?.data,
        date,
      });

      setDoses([]);
      toast.error(
        getErrorMessage(error, "Could not load today's dose schedule.")
      );
    } finally {
      setDoseLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMedications();
  }, [loadMedications]);

  useEffect(() => {
    loadDailyDoses(today);
  }, [loadDailyDoses, today]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const currentDate = getLocalDate();

      setToday((previousDate) =>
        previousDate === currentDate ? previousDate : currentDate
      );
    }, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  const scheduledToday = useMemo(
    () =>
      medications.filter((medication) =>
        isCurrentlyScheduled(medication, today)
      ),
    [medications, today]
  );

  const doseStats = useMemo(() => {
  const taken = doses.filter((dose) => dose.status === "taken").length;
  const skipped = doses.filter((dose) => dose.status === "skipped").length;
  const pending = doses.filter(
    (dose) => !dose.status || dose.status === "pending"
  ).length;

  const total = doses.length;
  const decided = taken + skipped;

  return {
    taken,
    skipped,
    pending,
    total,
    adherence: decided > 0 ? Math.round((taken / decided) * 100) : 0,
  };
}, [doses]);

  const nextPendingDose = useMemo(() => {
    const currentTime = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(new Date());

    return doses.find(
      (dose) =>
        (dose.status === "pending" || !dose.status) &&
        String(dose.scheduledTime || "") >= currentTime
    );
  }, [doses]);

  const filteredMedications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return medications.filter((medication) => {
      const matchesSearch =
        String(medication.name || "").toLowerCase().includes(query) ||
        String(medication.dosage || "").toLowerCase().includes(query);

      const scheduled = isCurrentlyScheduled(medication, today);

      const matchesFilter =
        filter === "all" ||
        (filter === "active" && scheduled) ||
        (filter === "inactive" && !scheduled);

      return matchesSearch && matchesFilter;
    });
  }, [medications, search, filter, today]);

  function openAddForm() {
    setEditingId(null);
    setForm(emptyForm());
    setShowForm(true);
  }

  function openEditForm(medication) {
    setEditingId(medication._id);

    setForm({
      name: medication.name || "",
      dosage: medication.dosage || "",
      frequency: medication.frequency || "Once daily",
      instructions: medication.instructions || "",
      startDate: String(medication.startDate || "").slice(0, 10),
      endDate: String(medication.endDate || "").slice(0, 10),
      reminderTimes: Array.isArray(medication.reminderTimes)
        ? medication.reminderTimes
        : [],
      isActive: medication.isActive !== false,
    });

    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm());
  }

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function updateReminderTime(index, value) {
    setForm((current) => ({
      ...current,
      reminderTimes: current.reminderTimes.map((time, i) =>
        i === index ? value : time
      ),
    }));
  }

  function addReminderTime() {
    if (form.reminderTimes.length >= 8) {
      toast.error("You can add up to 8 reminder times.");
      return;
    }

    setForm((current) => ({
      ...current,
      reminderTimes: [...current.reminderTimes, ""],
    }));
  }

  function removeReminderTime(index) {
    setForm((current) => ({
      ...current,
      reminderTimes: current.reminderTimes.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const reminderTimes = form.reminderTimes.filter(Boolean);

    if (new Set(reminderTimes).size !== reminderTimes.length) {
      toast.error("Please remove duplicate reminder times.");
      return;
    }

    if (form.endDate && form.endDate < form.startDate) {
      toast.error("End date cannot be before the start date.");
      return;
    }

    const payload = { ...form, reminderTimes };

    try {
      setSaving(true);

      if (editingId) {
        await api.patch(`/medications/${editingId}`, payload);
        toast.success("Medication updated.");
      } else {
        await api.post("/medications", payload);
        toast.success("Medication added.");
      }

      closeForm();
      await loadMedications();
      await loadDailyDoses(today);
    } catch (error) {
      console.error(
        "Failed to save medication:",
        error.response?.data || error
      );
      toast.error(getErrorMessage(error, "Could not save medication."));
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(medication) {
    try {
      await api.patch(`/medications/${medication._id}`, {
        isActive: !medication.isActive,
      });

      toast.success(
        medication.isActive
          ? "Medication tracking paused."
          : "Medication tracking activated."
      );

      await loadMedications();
      await loadDailyDoses(today);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not update medication."));
    }
  }

  async function deleteMedication(medication) {
    const confirmed = window.confirm(
      `Delete "${medication.name}" from your medication list?`
    );

    if (!confirmed) return;

    try {
      await api.delete(`/medications/${medication._id}`);

      setMedications((current) =>
        current.filter((item) => item._id !== medication._id)
      );

      toast.success("Medication deleted.");
      await loadDailyDoses(today);
    } catch (error) {
      toast.error(getErrorMessage(error, "Could not delete medication."));
    }
  }

  async function updateDoseStatus(dose, status) {
  if (updatingDoseId) return;

  try {
    setUpdatingDoseId(dose._id);

    const response = await api.patch(`/medication-doses/${dose._id}`, {
      status,
    });

    const updatedDose =
      response.data?.dose ??
      (response.data?._id ? response.data : null);

    if (updatedDose) {
      setDoses((current) =>
        current.map((item) =>
          item._id === dose._id ? { ...item, ...updatedDose } : item
        )
      );
    } else {
      await loadDailyDoses(today);
    }

    toast.success(
      status === "taken"
        ? "Dose marked as taken."
        : status === "skipped"
          ? "Dose marked as skipped."
          : "Dose reset to pending."
    );
  } catch (error) {
    toast.error(
      getErrorMessage(error, "Could not update dose status.")
    );
  } finally {
    setUpdatingDoseId(null);
  }
}

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-teal-700">
              <Pill size={17} />
              SehatSathi Health Tracker
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Medication Tracker
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
              Organize medication details, track scheduled doses, and review
              your daily progress.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => navigate("/user/medication-adherence")}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-teal-200 bg-white px-4 py-2.5 text-sm font-semibold text-teal-700 transition hover:bg-teal-50"
            >
              <Activity size={18} />
              Adherence Report
            </button>

            <button
              type="button"
              onClick={openAddForm}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
            >
              <Plus size={18} />
              Add medication
            </button>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={<Pill size={20} />}
            label="Total medications"
            value={medications.length}
          />
          <StatCard
            icon={<CalendarDays size={20} />}
            label="Scheduled today"
            value={scheduledToday.length}
          />
          <StatCard
            icon={<CheckCircle2 size={20} />}
            label="Doses taken"
            value={doseStats.taken}
          />
          <StatCard
            icon={<Clock3 size={20} />}
            label="Doses remaining"
            value={doseStats.pending}
          />
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CalendarDays className="text-teal-700" size={21} />
                <h2 className="text-lg font-bold text-slate-900">
                  Today's dose schedule
                </h2>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {formatDate(today)} · {doseStats.total} scheduled dose
                {doseStats.total === 1 ? "" : "s"}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => navigate("/user/medication-history")}
                className="rounded-xl border border-teal-200 px-4 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50"
              >
                View dose history
              </button>

              <button
                type="button"
                onClick={() => loadDailyDoses(today)}
                disabled={doseLoading}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                <LoaderCircle
                  size={16}
                  className={doseLoading ? "animate-spin" : "hidden"}
                />
                Refresh schedule
              </button>
            </div>
          </div>

          <div className="p-5">
            {doseLoading ? (
              <div className="flex justify-center py-10 text-teal-700">
                <LoaderCircle className="animate-spin" size={28} />
              </div>
            ) : doses.length === 0 ? (
              <div className="py-8 text-center">
                <BellRing className="mx-auto mb-3 text-slate-400" size={32} />
                <h3 className="font-semibold text-slate-800">
                  No scheduled doses for today
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Add medication details and reminder times to build your daily
                  dose schedule. If you already have doses, check the backend
                  response in your browser console.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-5">
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">
                      Daily adherence
                    </span>
                    <span className="font-bold text-teal-700">
                      {doseStats.adherence}%
                    </span>
                  </div>
                  <div
                    className="h-2.5 overflow-hidden rounded-full bg-slate-100"
                    role="progressbar"
                    aria-label="Daily dose adherence"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={doseStats.adherence}
                  >
                    <div
                      className="h-full rounded-full bg-teal-600 transition-all"
                      style={{ width: `${doseStats.adherence}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    {doseStats.taken} taken · {doseStats.skipped} skipped ·{" "}
                    {doseStats.pending} pending
                  </p>
                </div>

                <div className="space-y-3">
                  {doses.map((dose) => {
                    const medication =
                      typeof dose.medication === "object"
                        ? dose.medication
                        : medications.find(
                            (item) =>
                              item._id ===
                              (dose.medication?._id || dose.medication)
                          );

                    const isUpdating = updatingDoseId === dose._id;

                    return (
                      <article
                        key={dose._id}
                        className="rounded-xl border border-slate-200 p-4"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="flex min-w-0 items-start gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                              <Pill size={21} />
                            </div>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className="break-words font-semibold text-slate-900">
                                  {medication?.name ||
                                    "Medication unavailable"}
                                </h3>
                                <span
                                  className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${getDoseStatusClass(dose.status)}`}
                                >
                                  {dose.status || "pending"}
                                </span>
                              </div>

                              <p className="mt-1 text-sm text-slate-600">
                                {medication?.dosage || "Dosage unavailable"}
                              </p>

                              <p className="mt-2 flex items-center gap-1.5 text-sm text-slate-500">
                                <Clock3 size={15} />
                                Scheduled at{" "}
                                {dose.scheduledTime || "Time unavailable"}
                              </p>

                              {dose.status === "taken" && dose.takenAt && (
                                <p className="mt-1 text-xs text-emerald-700">
                                  Marked taken at{" "}
                                  {new Date(dose.takenAt).toLocaleTimeString(
                                    "en-IN",
                                    {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 lg:justify-end">
                            {dose.status !== "taken" && (
                              <button
                                type="button"
                                onClick={() =>
                                  updateDoseStatus(dose, "taken")
                                }
                                disabled={
                                  isUpdating || Boolean(updatingDoseId)
                                }
                                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                              >
                                {isUpdating ? (
                                  <LoaderCircle
                                    size={15}
                                    className="animate-spin"
                                  />
                                ) : (
                                  <Check size={15} />
                                )}
                                Taken
                              </button>
                            )}

                            {dose.status !== "skipped" && (
                              <button
                                type="button"
                                onClick={() =>
                                  updateDoseStatus(dose, "skipped")
                                }
                                disabled={
                                  isUpdating || Boolean(updatingDoseId)
                                }
                                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                              >
                                <SkipForward size={15} />
                                Skip
                              </button>
                            )}

                            {dose.status && dose.status !== "pending" && (
                              <button
                                type="button"
                                onClick={() =>
                                  updateDoseStatus(dose, "pending")
                                }
                                disabled={
                                  isUpdating || Boolean(updatingDoseId)
                                }
                                className="rounded-lg px-3 py-2 text-sm font-medium text-teal-700 hover:bg-teal-50 disabled:opacity-50"
                              >
                                Reset
                              </button>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </>
            )}

            {nextPendingDose && (
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-teal-100 bg-teal-50 p-4">
                <BellRing className="mt-0.5 text-teal-700" size={20} />
                <div>
                  <p className="font-semibold text-teal-900">
                    Next pending scheduled dose
                  </p>
                  <p className="mt-1 text-sm text-teal-800">
                    {nextPendingDose.medication?.name ||
                      medications.find(
                        (item) =>
                          item._id ===
                          (nextPendingDose.medication?._id ||
                            nextPendingDose.medication)
                      )?.name ||
                      "Medication"}{" "}
                    at {nextPendingDose.scheduledTime}
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search medications..."
              className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-teal-500"
            aria-label="Filter medications"
          >
            <option value="all">All medications</option>
            <option value="active">Scheduled today</option>
            <option value="inactive">Inactive or outside dates</option>
          </select>
        </section>

        {loading ? (
          <div className="flex justify-center py-16 text-teal-700">
            <LoaderCircle className="animate-spin" size={30} />
          </div>
        ) : filteredMedications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
            <Pill className="mx-auto mb-3 text-slate-400" size={36} />
            <h2 className="text-lg font-semibold text-slate-800">
              {search || filter !== "all"
                ? "No matching medications"
                : "No medications added yet"}
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Add medication details and instructions provided by your
              clinician to organize your schedule.
            </p>
            {!search && filter === "all" && (
              <button
                type="button"
                onClick={openAddForm}
                className="mt-5 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-700"
              >
                Add your first medication
              </button>
            )}
          </div>
        ) : (
          <section className="grid gap-4 lg:grid-cols-2">
            {filteredMedications.map((medication) => {
              const scheduled = isCurrentlyScheduled(medication, today);

              return (
                <article
                  key={medication._id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                      <Pill size={23} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="break-words text-lg font-semibold text-slate-900">
                          {medication.name}
                        </h2>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${scheduled ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
                        >
                          {scheduled ? "Scheduled today" : "Not scheduled"}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-slate-600">
                        {medication.dosage}
                      </p>
                      <p className="mt-1 text-sm font-medium text-teal-700">
                        {medication.frequency}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
                    <InfoLine
                      icon={<CalendarDays size={16} />}
                      label="Start"
                      value={formatDate(medication.startDate)}
                    />
                    <InfoLine
                      icon={<CalendarDays size={16} />}
                      label="End"
                      value={
                        medication.endDate
                          ? formatDate(medication.endDate)
                          : "Not specified"
                      }
                    />
                    <div className="sm:col-span-2">
                      <InfoLine
                        icon={<Clock3 size={16} />}
                        label="Reminder times"
                        value={
                          medication.reminderTimes?.length
                            ? medication.reminderTimes.join(", ")
                            : "No reminders configured"
                        }
                      />
                    </div>
                  </div>

                  {medication.instructions && (
                    <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                      <span className="font-semibold text-slate-800">
                        Notes:{" "}
                      </span>
                      {medication.instructions}
                    </p>
                  )}

                  <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={() => openEditForm(medication)}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Edit3 size={16} />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleActive(medication)}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      {medication.isActive ? "Pause tracking" : "Activate"}
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteMedication(medication)}
                      className="ml-auto inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <p className="text-xs leading-5 text-slate-500">
          Dose statuses reflect what you record in this tracker. They do not
          independently verify that medication was taken. Follow the
          instructions provided by your healthcare professional.
        </p>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/50 p-4">
          <div className="flex min-h-full items-center justify-center py-6">
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="medication-form-title"
              className="w-full max-w-2xl rounded-2xl bg-white p-5 shadow-xl sm:p-7"
            >
              <div className="mb-6 flex items-start justify-between gap-3">
                <div>
                  <h2
                    id="medication-form-title"
                    className="text-xl font-bold text-slate-900"
                  >
                    {editingId ? "Edit medication" : "Add medication"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Enter information from your clinician's instructions.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                  aria-label="Close medication form"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Medication name">
                    <input
                      name="name"
                      value={form.name}
                      onChange={updateField}
                      required
                      minLength={2}
                      maxLength={120}
                      placeholder="Enter medication name"
                      className={inputClass}
                    />
                  </Field>

                  <Field label="Frequency">
                    <select
                      name="frequency"
                      value={form.frequency}
                      onChange={updateField}
                      required
                      className={inputClass}
                    >
                      {frequencies.map((frequency) => (
                        <option key={frequency} value={frequency}>
                          {frequency}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <div className="sm:col-span-2">
                    <Field label="Dosage instructions">
                      <input
                        name="dosage"
                        value={form.dosage}
                        onChange={updateField}
                        required
                        maxLength={250}
                        placeholder="Enter instructions exactly as provided"
                        className={inputClass}
                      />
                    </Field>
                  </div>

                  <Field label="Start date">
                    <input
                      type="date"
                      name="startDate"
                      value={form.startDate}
                      onChange={updateField}
                      required
                      className={inputClass}
                    />
                  </Field>

                  <Field label="End date (optional)">
                    <input
                      type="date"
                      name="endDate"
                      value={form.endDate}
                      min={form.startDate}
                      onChange={updateField}
                      className={inputClass}
                    />
                  </Field>

                  <div className="sm:col-span-2">
                    <Field label="Additional instructions or notes">
                      <textarea
                        name="instructions"
                        value={form.instructions}
                        onChange={updateField}
                        maxLength={1000}
                        rows={3}
                        placeholder="Optional notes provided by your clinician"
                        className={inputClass}
                      />
                    </Field>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        Reminder times
                      </h3>
                      <p className="mt-1 text-xs text-slate-500">
                        Use the schedule provided by your clinician.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={addReminderTime}
                      className="inline-flex items-center gap-1 rounded-lg border border-teal-200 px-3 py-2 text-sm font-medium text-teal-700 hover:bg-teal-50"
                    >
                      <Plus size={16} />
                      Add time
                    </button>
                  </div>

                  {form.reminderTimes.length === 0 ? (
                    <p className="mt-3 text-sm text-slate-500">
                      No reminder times added.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {form.reminderTimes.map((time, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2"
                        >
                          <input
                            type="time"
                            value={time}
                            onChange={(event) =>
                              updateReminderTime(index, event.target.value)
                            }
                            aria-label={`Reminder time ${index + 1}`}
                            required
                            className={inputClass}
                          />

                          <button
                            type="button"
                            onClick={() => removeReminderTime(index)}
                            className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                            aria-label={`Remove reminder time ${index + 1}`}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {editingId && (
                  <label className="flex items-center gap-3 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          isActive: event.target.checked,
                        }))
                      }
                      className="h-4 w-4 accent-teal-600"
                    />
                    Keep medication tracking active
                  </label>
                )}

                <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeForm}
                    disabled={saving}
                    className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
                  >
                    {saving && (
                      <LoaderCircle
                        className="animate-spin"
                        size={17}
                      />
                    )}
                    {editingId ? "Save changes" : "Save medication"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>
      )}
    </main>
  );
}

function Field({ label, children }) {
  return (
    <label className="block space-y-2 text-sm font-medium text-slate-700">
      <span>{label}</span>
      {children}
    </label>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
        {icon}
      </div>
      <div>
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      </div>
    </div>
  );
}

function InfoLine({ icon, label, value }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="mt-0.5 text-slate-400">{icon}</span>
      <div className="min-w-0">
        <span className="text-slate-500">{label}: </span>
        <span className="break-words font-medium text-slate-800">
          {value}
        </span>
      </div>
    </div>
  );
}
