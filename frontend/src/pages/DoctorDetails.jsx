
import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  UserRound,
  Stethoscope,
  BriefcaseMedical,
  IndianRupee,
  CalendarDays,
  Clock,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";

export default function DoctorDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadDoctor() {
      setLoading(true);
      setError("");

      try {
        const { data } = await api.get(
          `/doctors/${encodeURIComponent(id)}`
        );

        if (active) {
          setDoctor(data.doctor);
        }
      } catch (err) {
        if (active) {
          const message =
            err.response?.data?.message ||
            "Unable to load doctor details.";

          setError(message);
          setDoctor(null);
          toast.error(message);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    if (id) {
      loadDoctor();
    } else {
      setError("Doctor ID is missing.");
      setLoading(false);
    }

    return () => {
      active = false;
    };
  }, [id, retryCount]);

  if (loading) {
    return (
      <div
        className="flex min-h-[50vh] flex-col items-center justify-center"
        role="status"
      >
        <LoaderCircle
          size={36}
          className="animate-spin text-teal-700"
        />
        <p className="mt-4 text-sm text-slate-500">
          Loading doctor profile...
        </p>
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <section className="card mx-auto max-w-2xl py-12 text-center">
        <Stethoscope
          size={42}
          className="mx-auto text-slate-400"
        />
        <h1 className="mt-4 text-xl font-bold text-slate-800">
          Doctor unavailable
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          {error || "This doctor could not be found."}
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => setRetryCount((count) => count + 1)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Try again
          </button>

          <Link to="/doctors" className="btn-secondary">
            Browse doctors
          </Link>
        </div>
      </section>
    );
  }

  const bookAppointment = () => {
  navigate(
    `/user/appointments/book?doctorId=${encodeURIComponent(doctor._id)}`
  );
};

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link
        to="/doctors"
        className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 hover:text-teal-900"
      >
        <ArrowLeft size={17} />
        Back to doctors
      </Link>

      {/* Profile header */}
      <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-teal-700 to-blue-700 p-6 text-white sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-white/15">
            <UserRound size={52} />
          </div>

          <div className="flex-1">
            <p className="text-sm font-medium text-teal-100">
              Doctor Profile
            </p>
            <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
              {doctor.name}
            </h1>
            <p className="mt-2 flex items-center gap-2 text-teal-50">
              <Stethoscope size={17} />
              {doctor.specialty}
            </p>
            <p className="mt-2 text-sm text-teal-100">
              {doctor.qualifications}
            </p>
          </div>

          <div className="rounded-xl bg-white/10 p-4 sm:min-w-40">
            <p className="text-sm text-teal-100">
              Consultation fee
            </p>
            <p className="mt-1 flex items-center text-2xl font-bold">
              <IndianRupee size={21} />
              {Number(doctor.consultationFee ?? 0).toLocaleString("en-IN")}
            </p>
          </div>
        </div>
      </section>

      {/* Professional information */}
      <div className="grid gap-6 md:grid-cols-2">
        <section className="card">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
            <BriefcaseMedical className="text-teal-700" size={21} />
            Professional information
          </h2>

          <div className="mt-5 space-y-4">
            <div>
              <p className="text-sm text-slate-500">Specialty</p>
              <p className="mt-1 font-medium text-slate-800">
                {doctor.specialty}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Qualifications</p>
              <p className="mt-1 font-medium text-slate-800">
                {doctor.qualifications}
              </p>
            </div>

            <div>
              <p className="text-sm text-slate-500">Experience</p>
              <p className="mt-1 font-medium text-slate-800">
                {doctor.experienceYears ?? 0} years
              </p>
            </div>
          </div>
        </section>

        <section className="card">
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
            <CalendarDays className="text-teal-700" size={21} />
            Availability
          </h2>

          <p className="mt-5 text-sm text-slate-500">
            Available days
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {doctor.availableDays?.length ? (
              doctor.availableDays.map((day) => (
                <span
                  key={day}
                  className="rounded-full bg-teal-50 px-3 py-1.5 text-sm font-medium text-teal-800"
                >
                  {day}
                </span>
              ))
            ) : (
              <p className="text-sm text-slate-600">
                Please contact the clinic for availability.
              </p>
            )}
          </div>

          <div className="mt-6">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Clock size={17} />
              Appointment time slots
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {doctor.availableSlots?.length ? (
                doctor.availableSlots.map((slot) => (
                  <span
                    key={slot}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700"
                  >
                    {slot}
                  </span>
                ))
              ) : (
                <p className="text-sm text-slate-500">
                  Contact the clinic for available time slots.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* About */}
      <section className="card">
        <h2 className="text-lg font-bold text-slate-800">
          About the doctor
        </h2>

        <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-600">
          {doctor.about || "No additional profile information is available."}
        </p>
      </section>

      {/* Booking action */}
      <section className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-bold text-slate-800">
            Ready to book an appointment?
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Review your appointment details before confirming.
          </p>
        </div>

        <button
          type="button"
          onClick={bookAppointment}
          className="btn-primary inline-flex shrink-0 items-center justify-center gap-2"
        >
          <CalendarDays size={18} />
          Book Appointment
        </button>
      </section>
    </div>
  );
}
