
import { useEffect, useState } from "react";
import { CalendarDays, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const filters = ["all", "pending", "confirmed", "completed", "cancelled"];

const badgeClasses = {
  pending: "bg-amber-50 text-amber-700",
  confirmed: "bg-blue-50 text-blue-700",
  completed: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-red-50 text-red-700",
};

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  async function loadAppointments() {
    setLoading(true);
    try {
      const params = statusFilter === "all" ? {} : { status: statusFilter };
      const { data } = await api.get("/admin/appointments", { params });
      setAppointments(data.appointments ?? []);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to load appointments."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAppointments();
  }, [statusFilter]);

  async function updateStatus(id, status) {
    setUpdatingId(id);
    try {
      await api.patch(`/admin/appointments/${id}/status`, { status });
      toast.success(`Appointment ${status} successfully.`);
      await loadAppointments();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Unable to update appointment."
      );
    } finally {
      setUpdatingId(null);
    }
  }

  function formatDate(dateString) {
    if (!dateString) return "—";
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function formatTime(timeString) {
    if (!timeString) return "—";
    const [hour, minute] = timeString.split(":").map(Number);
    const date = new Date();
    date.setHours(hour, minute, 0, 0);
    return date.toLocaleTimeString("en-IN", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-teal-700">ADMINISTRATION</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Appointment Management
            </h1>
            <p className="mt-2 text-slate-500">
              Review requests and manage appointment status.
            </p>
          </div>
          <button
            onClick={loadAppointments}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 font-medium hover:bg-slate-100 disabled:opacity-60"
          >
            <RefreshCw size={17} /> Refresh
          </button>
        </header>

        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`rounded-full px-4 py-2 text-sm font-semibold capitalize ${
                statusFilter === filter
                  ? "bg-teal-600 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {loading ? (
            <p className="p-8 text-slate-500">Loading appointments...</p>
          ) : appointments.length === 0 ? (
            <div className="p-10 text-center">
              <CalendarDays className="mx-auto text-slate-400" size={36} />
              <p className="mt-3 font-semibold text-slate-800">
                No appointments found
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Try another status filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px] text-left text-sm">
                <thead className="bg-slate-100 text-slate-600">
                  <tr>
                    <th className="p-4">Patient</th>
                    <th className="p-4">Doctor</th>
                    <th className="p-4">Date & time</th>
                    <th className="p-4">Reason</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {appointments.map((appointment) => {
                    const status = appointment.status;
                    const canConfirm = status === "pending";
                    const canComplete = status === "confirmed";
                    const canCancel = ["pending", "confirmed"].includes(status);
                    const busy = updatingId === appointment._id;

                    return (
                      <tr key={appointment._id} className="align-top">
                        <td className="p-4">
                          <p className="font-semibold text-slate-900">
                            {appointment.patient?.name || "Unknown patient"}
                          </p>
                          <p className="mt-1 text-slate-500">
                            {appointment.patient?.email || "—"}
                          </p>
                        </td>
                        <td className="p-4">
                          <p className="font-semibold">
                            {appointment.doctor?.name || "Doctor unavailable"}
                          </p>
                          <p className="mt-1 text-slate-500">
                            {appointment.doctor?.specialty || "—"}
                          </p>
                        </td>
                        <td className="whitespace-nowrap p-4">
                          <p>{formatDate(appointment.appointmentDate)}</p>
                          <p className="mt-1 text-slate-500">
                            {formatTime(appointment.appointmentTime)}
                          </p>
                        </td>
                        <td className="max-w-52 whitespace-normal p-4">
                          {appointment.reason}
                        </td>
                        <td className="p-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                              badgeClasses[status] || "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-2">
                            {canConfirm && (
                              <button
                                disabled={busy}
                                onClick={() =>
                                  updateStatus(appointment._id, "confirmed")
                                }
                                className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                              >
                                Confirm
                              </button>
                            )}
                            {canComplete && (
                              <button
                                disabled={busy}
                                onClick={() =>
                                  updateStatus(appointment._id, "completed")
                                }
                                className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                              >
                                Complete
                              </button>
                            )}
                            {canCancel && (
                              <button
                                disabled={busy}
                                onClick={() => {
                                  if (window.confirm("Cancel this appointment?")) {
                                    updateStatus(appointment._id, "cancelled");
                                  }
                                }}
                                className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
