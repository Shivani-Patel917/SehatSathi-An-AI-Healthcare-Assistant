
import { useEffect, useState } from "react";
import { LoaderCircle, Save, UserRound } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const weekdays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const defaultSlots = [
  "09:00",
  "10:00",
  "11:00",
  "14:00",
  "15:00",
];

const initialForm = {
  name: "",
  specialty: "",
  qualifications: "",
  experienceYears: 0,
  consultationFee: 0,
  about: "",
  availableDays: [],
  availableSlots: [],
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100";

export default function DoctorProfile() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const { data } = await api.get("/doctor/profile");
        const doctor = data.doctor;

        if (active) {
          setForm({
            ...initialForm,
            ...doctor,
            availableDays: doctor.availableDays || [],
            availableSlots: doctor.availableSlots || [],
          });
        }
      } catch (error) {
        if (active) {
          const message = error.response?.data?.message;

          toast.error(
            message || "Unable to load doctor profile."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function toggleItem(field, value) {
    setForm((current) => ({
      ...current,
      [field]: current[field].includes(value)
        ? current[field].filter((item) => item !== value)
        : [...current[field], value],
    }));
  }

  function addSlot(event) {
    const slot = event.target.value;

    if (!slot) return;

    setForm((current) => ({
      ...current,
      availableSlots: [...new Set([...current.availableSlots, slot])].sort(),
    }));

    event.target.value = "";
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        specialty: form.specialty.trim(),
        qualifications: form.qualifications.trim(),
        experienceYears: Number(form.experienceYears),
        consultationFee: Number(form.consultationFee),
        about: form.about,
        availableDays: form.availableDays,
        availableSlots: form.availableSlots,
      };

      const { data } = await api.patch(
        "/doctor/profile",
        payload
      );

      setForm((current) => ({
        ...current,
        ...data.doctor,
        availableDays: data.doctor.availableDays || [],
        availableSlots: data.doctor.availableSlots || [],
      }));

      toast.success(
        data.message || "Profile updated successfully."
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to save your profile."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <LoaderCircle
          size={30}
          className="animate-spin text-teal-600"
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-600">
          Doctor Portal
        </p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">
          Professional Profile
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Manage the information patients see about you.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-xl bg-teal-50 p-3 text-teal-700">
              <UserRound size={22} />
            </div>
            <div>
              <h2 className="font-semibold text-slate-900">
                Professional Information
              </h2>
              <p className="text-sm text-slate-500">
                Keep your details accurate and up to date.
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Doctor Name *
              <input
                className={inputClass}
                name="name"
                value={form.name}
                onChange={handleChange}
                maxLength={100}
                required
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              Specialization *
              <input
                className={inputClass}
                name="specialty"
                value={form.specialty}
                onChange={handleChange}
                maxLength={100}
                required
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              Qualifications *
              <input
                className={inputClass}
                name="qualifications"
                value={form.qualifications}
                onChange={handleChange}
                maxLength={200}
                required
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              Experience (years) *
              <input
                className={inputClass}
                type="number"
                name="experienceYears"
                value={form.experienceYears}
                onChange={handleChange}
                min="0"
                max="80"
                required
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700 sm:col-span-2">
              Consultation Fee (₹) *
              <input
                className={inputClass}
                type="number"
                name="consultationFee"
                value={form.consultationFee}
                onChange={handleChange}
                min="0"
                required
              />
            </label>
          </div>

          <label className="mt-5 block space-y-2 text-sm font-medium text-slate-700">
            About
            <textarea
              className={inputClass}
              name="about"
              value={form.about || ""}
              onChange={handleChange}
              rows={4}
              maxLength={1000}
              placeholder="Describe your professional experience and approach to patient care."
            />
          </label>
        </section>

        <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
          <h2 className="font-semibold text-slate-900">
            Available Days
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Select the days you normally accept appointments.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {weekdays.map((day) => {
              const selected = form.availableDays.includes(day);

              return (
                <button
                  key={day}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleItem("availableDays", day)}
                  className={`rounded-full border px-4 py-2 text-sm font-medium ${
                    selected
                      ? "border-teal-600 bg-teal-600 text-white"
                      : "border-slate-200 text-slate-600 hover:border-teal-400"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="mt-7">
            <label className="block text-sm font-medium text-slate-700">
              Add consultation time
            </label>
            <input
              className={`${inputClass} mt-2 max-w-xs`}
              type="time"
              onChange={addSlot}
              aria-label="Add consultation time"
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {form.availableSlots.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => toggleItem("availableSlots", slot)}
                title="Click to remove this slot"
                className="rounded-full border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800"
              >
                {slot} ×
              </button>
            ))}
          </div>

          <p className="mt-2 text-xs text-slate-500">
            Click a time slot to remove it. These are profile availability
            slots; appointment booking must also validate availability.
          </p>

          {form.availableSlots.length === 0 && (
            <button
              type="button"
              className="mt-3 text-sm font-medium text-teal-700 underline"
              onClick={() =>
                setForm((current) => ({
                  ...current,
                  availableSlots: defaultSlots,
                }))
              }
            >
              Restore default time slots
            </button>
          )}
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {saving ? (
              <LoaderCircle size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {saving ? "Saving..." : "Save Profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
