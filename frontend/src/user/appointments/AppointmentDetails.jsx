
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, CalendarDays, Clock, UserRound, IndianRupee, FileText } from "lucide-react";
import api from "../../services/api";

export default function AppointmentDetails() {
  const { id } = useParams();
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchAppointment() {
      try {
        setLoading(true);
        setError("");

        const { data } = await api.get(`/appointments/${id}`, {
          signal: controller.signal,
        });

        setAppointment(data.appointment ?? data.data ?? data);
      } catch (err) {
        if (err.name !== "CanceledError" && err.name !== "AbortError") {
          setError(
            err.response?.data?.message ||
            "Unable to load appointment details."
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }

    fetchAppointment();
    return () => controller.abort();
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center">Loading appointment...</div>;
  }

  if (error || !appointment) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <p className="mb-4 text-red-600">{error || "Appointment not found."}</p>
        <Link to="/user/appointments" className="text-teal-700 hover:underline">
          Back to My Appointments
        </Link>
      </div>
    );
  }

  const doctor = appointment.doctorId ?? appointment.doctor ?? {};
  const date = appointment.appointmentDate
    ? new Date(appointment.appointmentDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Not specified";

  const status = appointment.status || "pending";

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
      <Link
        to="/user/appointments"
        className="inline-flex items-center gap-2 text-sm text-teal-700 hover:underline"
      >
        <ArrowLeft size={17} /> Back to My Appointments
      </Link>

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-sm text-slate-500">Appointment details</p>
            <h1 className="mt-1 text-2xl font-bold text-slate-900">
              Dr. {doctor.name || appointment.doctorName || "Assigned Doctor"}
            </h1>
            <p className="mt-1 text-slate-600">
              {doctor.specialty || appointment.specialty || "Medical consultation"}
            </p>
          </div>

          <span className="rounded-full bg-teal-50 px-3 py-1 text-sm font-medium capitalize text-teal-700">
            {String(status).replaceAll("_", " ")}
          </span>
        </div>

        <div className="my-6 grid gap-4 sm:grid-cols-2">
          <Info icon={<CalendarDays size={19} />} label="Appointment Date" value={date} />
          <Info
            icon={<Clock size={19} />}
            label="Appointment Time"
            value={appointment.appointmentTime || appointment.time || "Not specified"}
          />
          <Info
            icon={<UserRound size={19} />}
            label="Doctor"
            value={doctor.name || appointment.doctorName || "Not specified"}
          />
          <Info
            icon={<IndianRupee size={19} />}
            label="Consultation Fee"
            value={
              appointment.consultationFee != null
                ? `₹${appointment.consultationFee}`
                : doctor.consultationFee != null
                  ? `₹${doctor.consultationFee}`
                  : "Not specified"
            }
          />
        </div>

        <div className="border-t border-slate-100 pt-5">
          <h2 className="mb-2 flex items-center gap-2 font-semibold text-slate-900">
            <FileText size={18} /> Reason for Visit
          </h2>
          <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">
            {appointment.reason || "No reason provided."}
          </p>
        </div>
      </section>
    </main>
  );
}

function Info({ icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-4">
      <span className="mt-0.5 text-teal-700">{icon}</span>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="mt-1 font-medium text-slate-800">{value}</p>
      </div>
    </div>
  );
}
