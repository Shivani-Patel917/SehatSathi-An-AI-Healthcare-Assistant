
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  Clock,
  Stethoscope,
  IndianRupee,
  LoaderCircle,
  RefreshCw,
  ClipboardList,
  ArrowRight,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const FILTERS = [
  { label: "All", value: "all" },
  { label: "Upcoming", value: "upcoming" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
];

function getStatus(appointment) {
  return String(
    appointment.status || appointment.appointmentStatus || "pending"
  ).toLowerCase();
}

function getAppointmentDate(appointment) {
  const value = appointment.appointmentDate || appointment.date;

  if (!value) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    const [year, month, day] = String(value).split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isUpcoming(appointment) {
  const status = getStatus(appointment);

  if (
    ["cancelled", "canceled", "rejected", "completed"].includes(status)
  ) {
    return false;
  }

  const date = getAppointmentDate(appointment);
  if (!date) return false;

  const time = appointment.appointmentTime || appointment.time || "23:59";
  const [hours, minutes] = time.split(":").map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return date >= new Date(new Date().setHours(0, 0, 0, 0));
  }

  date.setHours(hours, minutes, 0, 0);
  return date >= new Date();
}

function formatDate(appointment) {
  const date = getAppointmentDate(appointment);

  if (!date) return "Date not available";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(time) {
  if (!time) return "Time not available";

  const match = String(time).match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return time;

  const date = new Date();
  date.setHours(Number(match[1]), Number(match[2]), 0, 0);

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getDoctor(appointment) {
  return appointment.doctor || appointment.doctorId || {};
}

function getStatusStyle(status) {
  if (["confirmed", "approved"].includes(status)) {
    return "bg-green-50 text-green-700";
  }

  if (status === "completed") {
    return "bg-blue-50 text-blue-700";
  }

  if (["cancelled", "canceled", "rejected"].includes(status)) {
    return "bg-red-50 text-red-700";
  }

  return "bg-amber-50 text-amber-800";
}

export default function MyAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  // Cancellation state belongs inside the component.
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelError, setCancelError] = useState("");

  const loadAppointments = useCallback(async (signal) => {
    setLoading(true);
    setError("");

    try {
      const { data } = await api.get("/appointments", { signal });

      const list = Array.isArray(data)
        ? data
        : data.appointments || data.data || [];

      setAppointments(Array.isArray(list) ? list : []);
    } catch (err) {
      if (err.code === "ERR_CANCELED") return;

      const message =
        err.response?.data?.message ||
        "Unable to load your appointments.";

      setError(message);
      toast.error(message);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    loadAppointments(controller.signal);

    return () => controller.abort();
  }, [loadAppointments, retryCount]);

  const handleCancelAppointment = async (appointmentId) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this appointment?"
    );

    if (!confirmed) return;

    setCancellingId(appointmentId);
    setCancelError("");

    try {
      await api.patch(`/appointments/${appointmentId}/cancel`);

      toast.success("Appointment cancelled successfully.");

      // Update the list after successful cancellation.
      await loadAppointments();
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Unable to cancel appointment. Please try again.";

      setCancelError(message);
      toast.error(message);
    } finally {
      setCancellingId(null);
    }
  };

  const filteredAppointments = useMemo(() => {
    return appointments
      .filter((appointment) => {
        const status = getStatus(appointment);

        if (filter === "upcoming") {
          return isUpcoming(appointment);
        }

        if (filter === "completed") {
          return status === "completed";
        }

        if (filter === "cancelled") {
          return ["cancelled", "canceled", "rejected"].includes(status);
        }

        return true;
      })
      .sort((a, b) => {
        const dateA = getAppointmentDate(a)?.getTime() || 0;
        const dateB = getAppointmentDate(b)?.getTime() || 0;

        return filter === "upcoming"
          ? dateA - dateB
          : dateB - dateA;
      });
  }, [appointments, filter]);

  const counts = useMemo(
    () => ({
      all: appointments.length,
      upcoming: appointments.filter(isUpcoming).length,
      completed: appointments.filter(
        (item) => getStatus(item) === "completed"
      ).length,
      cancelled: appointments.filter((item) =>
        ["cancelled", "canceled", "rejected"].includes(getStatus(item))
      ).length,
    }),
    [appointments]
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-2xl bg-gradient-to-r from-teal-700 to-blue-700 p-6 text-white sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white/15 p-3">
              <CalendarDays size={30} />
            </div>

            <div>
              <h1 className="text-2xl font-bold sm:text-3xl">
                My Appointments
              </h1>
              <p className="mt-2 text-sm text-teal-50">
                Manage your consultations and appointment history.
              </p>
            </div>
          </div>

          <Link
            to="/doctors"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-teal-800 hover:bg-teal-50"
          >
            <Stethoscope size={17} />
            Find a Doctor
          </Link>
        </div>
      </section>

      {/* Summary filters */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setFilter(item.value)}
            className={`rounded-2xl border p-5 text-left transition ${
              filter === item.value
                ? "border-teal-600 bg-teal-50 ring-1 ring-teal-600"
                : "border-slate-200 bg-white hover:border-teal-300"
            }`}
          >
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="mt-2 text-2xl font-bold text-slate-800">
              {counts[item.value]}
            </p>
          </button>
        ))}
      </section>

      {/* Appointment list */}
      <section className="card">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              {filter === "all"
                ? "Appointment history"
                : `${
                    FILTERS.find((item) => item.value === filter)?.label
                  } appointments`}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Your appointment information and current status.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setRetryCount((count) => count + 1)}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>

        {cancelError && (
          <div
            role="alert"
            className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            {cancelError}
          </div>
        )}

        {loading && (
          <div className="flex flex-col items-center py-16" role="status">
            <LoaderCircle
              size={34}
              className="animate-spin text-teal-700"
            />
            <p className="mt-3 text-sm text-slate-500">
              Loading appointments...
            </p>
          </div>
        )}

        {!loading && error && (
          <div className="py-12 text-center">
            <ClipboardList
              size={40}
              className="mx-auto text-slate-400"
            />
            <h3 className="mt-4 font-semibold text-slate-800">
              Couldn't load appointments
            </h3>
            <p className="mt-2 text-sm text-slate-500">{error}</p>
            <button
              type="button"
              onClick={() => setRetryCount((count) => count + 1)}
              className="btn-primary mt-5"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && filteredAppointments.length === 0 && (
          <div className="py-12 text-center">
            <CalendarDays
              size={42}
              className="mx-auto text-slate-400"
            />
            <h3 className="mt-4 font-semibold text-slate-800">
              No appointments found
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              {filter === "all"
                ? "You haven't booked an appointment yet."
                : `You don't have any ${filter} appointments.`}
            </p>
            <Link
              to="/doctors"
              className="btn-primary mt-5 inline-flex items-center gap-2"
            >
              Browse doctors
              <ArrowRight size={16} />
            </Link>
          </div>
        )}

        {!loading && !error && filteredAppointments.length > 0 && (
          <div className="mt-6 space-y-4">
            {filteredAppointments.map((appointment) => {
              const doctor = getDoctor(appointment);
              const status = getStatus(appointment);
              const doctorName =
                doctor.name || appointment.doctorName || "Doctor";

              const canCancel = ["pending", "confirmed"].includes(status);

              return (
                <article
                  key={appointment._id}
                  className="rounded-2xl border border-slate-200 p-4 transition hover:border-teal-300 sm:p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                      <Stethoscope size={27} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-800">
                          {doctorName}
                        </h3>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusStyle(status)}`}
                        >
                          {status}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-teal-700">
                        {doctor.specialty ||
                          appointment.specialty ||
                          "Medical consultation"}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3 text-sm text-slate-600">
                        <span className="inline-flex items-center gap-2">
                          <CalendarDays
                            size={16}
                            className="text-slate-400"
                          />
                          {formatDate(appointment)}
                        </span>

                        <span className="inline-flex items-center gap-2">
                          <Clock size={16} className="text-slate-400" />
                          {formatTime(
                            appointment.appointmentTime || appointment.time
                          )}
                        </span>

                        {(appointment.consultationFee ??
                          doctor.consultationFee) != null && (
                          <span className="inline-flex items-center gap-1">
                            <IndianRupee
                              size={15}
                              className="text-slate-400"
                            />
                            {Number(
                              appointment.consultationFee ??
                                doctor.consultationFee
                            ).toLocaleString("en-IN")}
                          </span>
                        )}
                      </div>

                      {appointment.reason && (
                        <p className="mt-4 text-sm leading-6 text-slate-500">
                          <span className="font-medium text-slate-700">
                            Reason:
                          </span>{" "}
                          {appointment.reason}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {appointment._id && (
                        <Link
                          to={`/user/appointments/${appointment._id}`}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-teal-200 px-4 py-2.5 text-sm font-semibold text-teal-800 hover:bg-teal-50"
                        >
                          View Details
                          <ArrowRight size={16} />
                        </Link>
                      )}

                      {canCancel && appointment._id && (
                        <button
                          type="button"
                          onClick={() =>
                            handleCancelAppointment(appointment._id)
                          }
                          disabled={cancellingId === appointment._id}
                          className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {cancellingId === appointment._id ? (
                            <LoaderCircle
                              size={16}
                              className="animate-spin"
                            />
                          ) : (
                            <XCircle size={16} />
                          )}
                          {cancellingId === appointment._id
                            ? "Cancelling..."
                            : "Cancel"}
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
