
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  Stethoscope,
  UserRound,
  IndianRupee,
  LoaderCircle,
  CheckCircle2,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isSlotInFuture(date, time) {
  const now = new Date();
  const [hours, minutes] = time.split(":").map(Number);
  const appointmentDate = new Date(`${date}T12:00:00`);

  appointmentDate.setHours(hours, minutes, 0, 0);

  return appointmentDate > now;
}

export default function BookAppointment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const requestedDoctorId = searchParams.get("doctorId") || "";

  const [doctors, setDoctors] = useState([]);
  const [doctorId, setDoctorId] = useState(requestedDoctorId);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [reason, setReason] = useState("");

  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadDoctors() {
      setLoadingDoctors(true);
      setLoadError("");

      try {
        const { data } = await api.get("/doctors");

        if (!active) return;

        const availableDoctors = Array.isArray(data.doctors)
          ? data.doctors
          : [];

        setDoctors(availableDoctors);

        if (
          requestedDoctorId &&
          !availableDoctors.some(
            (doctor) => doctor._id === requestedDoctorId
          )
        ) {
          setLoadError(
            "The selected doctor is unavailable. Please choose another doctor."
          );
          setDoctorId("");
        } else if (requestedDoctorId) {
          setDoctorId(requestedDoctorId);
        }
      } catch (error) {
        if (active) {
          setLoadError(
            error.response?.data?.message ||
              "Unable to load doctors. Please try again."
          );
        }
      } finally {
        if (active) setLoadingDoctors(false);
      }
    }

    loadDoctors();

    return () => {
      active = false;
    };
  }, [requestedDoctorId]);

  const selectedDoctor = useMemo(
    () => doctors.find((doctor) => doctor._id === doctorId),
    [doctors, doctorId]
  );

  const availableDay = useMemo(() => {
    if (!appointmentDate) return "";

    // Use local noon to avoid midnight timezone boundary issues.
    return WEEKDAYS[new Date(`${appointmentDate}T12:00:00`).getDay()];
  }, [appointmentDate]);

  const isAvailableDay =
    selectedDoctor?.availableDays?.includes(availableDay) ?? false;

  const availableSlots = useMemo(() => {
    if (!selectedDoctor || !appointmentDate || !isAvailableDay) {
      return [];
    }

    const slots = selectedDoctor.availableSlots || [];

    return slots
      .filter((slot) => isSlotInFuture(appointmentDate, slot))
      .sort();
  }, [selectedDoctor, appointmentDate, isAvailableDay]);

  function handleDoctorChange(event) {
    setDoctorId(event.target.value);
    setAppointmentDate("");
    setAppointmentTime("");
  }

  function handleDateChange(event) {
    setAppointmentDate(event.target.value);
    setAppointmentTime("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!doctorId) {
      toast.error("Please select a doctor.");
      return;
    }

    if (!appointmentDate || !appointmentTime) {
      toast.error("Please select an appointment date and time.");
      return;
    }

    if (!isAvailableDay) {
      toast.error("The doctor is not available on the selected day.");
      return;
    }

    if (!availableSlots.includes(appointmentTime)) {
      toast.error("Please select an available future time slot.");
      return;
    }

    if (reason.trim().length < 3 || reason.trim().length > 500) {
      toast.error("Reason must contain between 3 and 500 characters.");
      return;
    }

    setSubmitting(true);

    try {
      await api.post("/appointments", {
        doctorId,
        appointmentDate,
        appointmentTime,
        reason: reason.trim(),
      });

      toast.success("Appointment booked successfully!");
      navigate("/user/appointments");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to book your appointment. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingDoctors) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center">
        <LoaderCircle
          size={36}
          className="animate-spin text-teal-700"
        />
        <p className="mt-4 text-sm text-slate-500">
          Loading available doctors...
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        to="/doctors"
        className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 hover:text-teal-900"
      >
        <ArrowLeft size={17} />
        Back to doctors
      </Link>

      <section className="rounded-2xl bg-gradient-to-r from-teal-700 to-blue-700 p-6 text-white sm:p-8">
        <div className="flex items-center gap-3">
          <CalendarDays size={32} />
          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">
              Book an Appointment
            </h1>
            <p className="mt-2 text-sm text-teal-50">
              Choose your doctor, date, and available time slot.
            </p>
          </div>
        </div>
      </section>

      {loadError && (
        <section className="card border border-red-200">
          <p className="text-sm text-red-700">{loadError}</p>
          <p className="mt-2 text-sm text-slate-600">
            Return to the doctor directory to select an available doctor.
          </p>
          <Link
            to="/doctors"
            className="btn-primary mt-4 inline-flex"
          >
            Browse doctors
          </Link>
        </section>
      )}

      {!loadError && doctors.length === 0 && (
        <section className="card py-10 text-center">
          <Stethoscope
            size={38}
            className="mx-auto text-slate-400"
          />
          <h2 className="mt-4 font-semibold text-slate-800">
            No doctors available
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Please check back later.
          </p>
        </section>
      )}

      {!loadError && doctors.length > 0 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Doctor selection */}
          <section className="card space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
              <UserRound size={21} className="text-teal-700" />
              Select a doctor
            </h2>

            <select
              value={doctorId}
              onChange={handleDoctorChange}
              className="input-field"
              required
              aria-label="Select doctor"
            >
              <option value="">Choose a doctor</option>
              {doctors.map((doctor) => (
                <option key={doctor._id} value={doctor._id}>
                  {doctor.name} — {doctor.specialty}
                </option>
              ))}
            </select>

            {selectedDoctor && (
              <div className="flex flex-col gap-4 rounded-xl bg-teal-50 p-4 sm:flex-row sm:items-center">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white text-teal-700">
                  <Stethoscope size={28} />
                </div>

                <div className="flex-1">
                  <p className="font-semibold text-slate-800">
                    {selectedDoctor.name}
                  </p>
                  <p className="mt-1 text-sm text-teal-800">
                    {selectedDoctor.specialty}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    {selectedDoctor.qualifications}
                  </p>
                </div>

                <div className="flex items-center gap-1 font-semibold text-slate-800">
                  <IndianRupee size={17} />
                  {Number(
                    selectedDoctor.consultationFee ?? 0
                  ).toLocaleString("en-IN")}
                </div>
              </div>
            )}
          </section>

          {/* Date selection */}
          <section className="card space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
              <CalendarDays size={21} className="text-teal-700" />
              Choose appointment date
            </h2>

            <label
              htmlFor="appointmentDate"
              className="block text-sm font-medium text-slate-700"
            >
              Appointment date
            </label>

            <input
              id="appointmentDate"
              type="date"
              value={appointmentDate}
              min={getLocalDateString()}
              onChange={handleDateChange}
              className="input-field"
              required
              disabled={!selectedDoctor}
            />

            {appointmentDate && selectedDoctor && (
              <p className="text-sm text-slate-600">
                Selected day:{" "}
                <span className="font-semibold">{availableDay}</span>
              </p>
            )}

            {appointmentDate && selectedDoctor && !isAvailableDay && (
              <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                This doctor is not available on {availableDay}. Choose one
                of the doctor's available days.
              </p>
            )}

            {selectedDoctor?.availableDays?.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium text-slate-500">
                  Doctor's available days
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedDoctor.availableDays.map((day) => (
                    <span
                      key={day}
                      className="rounded-full bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-800"
                    >
                      {day}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* Time slot selection */}
          <section className="card space-y-4">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800">
              <Clock size={21} className="text-teal-700" />
              Choose time slot
            </h2>

            {!appointmentDate ? (
              <p className="text-sm text-slate-500">
                Select a date first to view available slots.
              </p>
            ) : !isAvailableDay ? (
              <p className="text-sm text-slate-500">
                Select an available day to view time slots.
              </p>
            ) : availableSlots.length === 0 ? (
              <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                No future slots are available for this date. Please choose
                another date.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {availableSlots.map((slot) => {
                  const selected = appointmentTime === slot;

                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() => setAppointmentTime(slot)}
                      aria-pressed={selected}
                      className={`rounded-xl border px-4 py-3 text-sm font-medium transition ${
                        selected
                          ? "border-teal-700 bg-teal-700 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-teal-500 hover:bg-teal-50"
                      }`}
                    >
                      {slot}
                      {selected && (
                        <CheckCircle2
                          size={15}
                          className="ml-2 inline"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Reason */}
          <section className="card space-y-4">
            <h2 className="text-lg font-bold text-slate-800">
              Reason for appointment
            </h2>

            <label
              htmlFor="reason"
              className="block text-sm font-medium text-slate-700"
            >
              Briefly describe the purpose of your visit
            </label>

            <textarea
              id="reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="For example, routine consultation or a follow-up visit"
              rows={4}
              minLength={3}
              maxLength={500}
              required
              className="input-field resize-y"
            />

            <p className="text-right text-xs text-slate-500">
              {reason.length}/500 characters
            </p>
          </section>

          {/* Submit */}
          <section className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-slate-800">
                Ready to request your appointment?
              </p>
              <p className="mt-1 text-sm text-slate-500">
                The server will verify the selected slot before saving.
              </p>
            </div>

            <button
              type="submit"
              disabled={
                submitting ||
                !selectedDoctor ||
                !appointmentDate ||
                !appointmentTime ||
                !reason.trim()
              }
              className="btn-primary inline-flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" />
                  Booking...
                </>
              ) : (
                <>
                  <CalendarDays size={18} />
                  Confirm Appointment
                </>
              )}
            </button>
          </section>
        </form>
      )}
    </div>
  );
}
