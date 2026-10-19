
import { useEffect, useState } from "react";
import { Pencil, Plus, UserRoundX, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const initialForm = {
  name: "",
  specialty: "",
  qualifications: "",
  experienceYears: 0,
  consultationFee: 500,
  about: "",
  availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
  availableSlots: ["09:00", "10:00", "11:00", "14:00", "15:00"],
};

const weekdays = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
];

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  async function loadDoctors() {
    setLoading(true);
    try {
      const { data } = await api.get("/admin/doctors");
      setDoctors(data.doctors ?? []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load doctors.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDoctors();
  }, []);

  function startCreate() {
    setEditingId(null);
    setForm({ ...initialForm });
    setShowForm(true);
  }

  function startEdit(doctor) {
    setEditingId(doctor._id);
    setForm({
      name: doctor.name ?? "",
      specialty: doctor.specialty ?? "",
      qualifications: doctor.qualifications ?? "",
      experienceYears: doctor.experienceYears ?? 0,
      consultationFee: doctor.consultationFee ?? 0,
      about: doctor.about ?? "",
      availableDays: doctor.availableDays ?? [],
      availableSlots: doctor.availableSlots ?? [],
    });
    setShowForm(true);
  }

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function toggleDay(day) {
    setForm((current) => ({
      ...current,
      availableDays: current.availableDays.includes(day)
        ? current.availableDays.filter((item) => item !== day)
        : [...current.availableDays, day],
    }));
  }

  function updateSlots(value) {
    setForm((current) => ({
      ...current,
      availableSlots: value
        .split(",")
        .map((slot) => slot.trim())
        .filter(Boolean),
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);

    const payload = {
      ...form,
      experienceYears: Number(form.experienceYears),
      consultationFee: Number(form.consultationFee),
    };

    try {
      if (editingId) {
        await api.patch(`/admin/doctors/${editingId}`, payload);
        toast.success("Doctor updated successfully.");
      } else {
        await api.post("/admin/doctors", payload);
        toast.success("Doctor added successfully.");
      }

      setShowForm(false);
      setEditingId(null);
      await loadDoctors();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to save doctor.");
    } finally {
      setSaving(false);
    }
  }

  async function deactivateDoctor(id) {
    if (!window.confirm("Deactivate this doctor's listing?")) return;

    try {
      await api.patch(`/admin/doctors/${id}/deactivate`);
      toast.success("Doctor deactivated.");
      await loadDoctors();
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to deactivate doctor.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-teal-700">ADMINISTRATION</p>
            <h1 className="mt-1 text-3xl font-bold text-slate-900">
              Doctor Management
            </h1>
            <p className="mt-2 text-slate-500">
              Manage doctor profiles and clinic availability.
            </p>
          </div>
          <button
            onClick={startCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-3 font-semibold text-white hover:bg-teal-700"
          >
            <Plus size={18} /> Add doctor
          </button>
        </header>

        {showForm && (
          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">
                {editingId ? "Edit doctor" : "Add a doctor"}
              </h2>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                aria-label="Close form"
                className="rounded-lg p-2 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["name", "Doctor name", "text"],
                ["specialty", "Specialty", "text"],
                ["qualifications", "Qualifications", "text"],
                ["experienceYears", "Experience (years)", "number"],
                ["consultationFee", "Consultation fee (₹)", "number"],
              ].map(([name, label, type]) => (
                <label key={name} className="space-y-1 text-sm font-medium text-slate-700">
                  {label}
                  <input
                    required
                    name={name}
                    type={type}
                    min={type === "number" ? 0 : undefined}
                    value={form[name]}
                    onChange={updateField}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-teal-500"
                  />
                </label>
              ))}
            </div>

            <label className="block space-y-1 text-sm font-medium text-slate-700">
              About the doctor
              <textarea
                name="about"
                value={form.about}
                onChange={updateField}
                rows={3}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
              />
            </label>

            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-slate-700">
                Available days
              </legend>
              <div className="flex flex-wrap gap-2">
                {weekdays.map((day) => (
                  <label
                    key={day}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={form.availableDays.includes(day)}
                      onChange={() => toggleDay(day)}
                    />
                    {day}
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="block space-y-1 text-sm font-medium text-slate-700">
              Available slots (24-hour HH:mm, comma-separated)
              <input
                value={form.availableSlots.join(", ")}
                onChange={(event) => updateSlots(event.target.value)}
                placeholder="09:00, 10:00, 14:00"
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
              />
            </label>

            <button
              disabled={saving}
              className="rounded-xl bg-teal-600 px-5 py-3 font-semibold text-white disabled:opacity-60"
            >
              {saving ? "Saving..." : editingId ? "Save changes" : "Create doctor"}
            </button>
          </form>
        )}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          {loading ? (
            <p className="p-8 text-slate-500">Loading doctors...</p>
          ) : doctors.length === 0 ? (
            <p className="p-8 text-slate-500">No doctor records found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-slate-100 text-slate-600">
                  <tr>
                    <th className="p-4">Doctor</th>
                    <th className="p-4">Specialty</th>
                    <th className="p-4">Fee</th>
                    <th className="p-4">Availability</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {doctors.map((doctor) => (
                    <tr key={doctor._id}>
                      <td className="p-4">
                        <p className="font-semibold text-slate-900">{doctor.name}</p>
                        <p className="text-slate-500">{doctor.qualifications}</p>
                      </td>
                      <td className="p-4">{doctor.specialty}</td>
                      <td className="p-4">₹{doctor.consultationFee}</td>
                      <td className="p-4">
                        <span className={doctor.isActive
                          ? "rounded-full bg-emerald-50 px-3 py-1 text-emerald-700"
                          : "rounded-full bg-slate-100 px-3 py-1 text-slate-500"}
                        >
                          {doctor.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(doctor)}
                            className="rounded-lg border p-2 hover:bg-slate-50"
                            title="Edit doctor"
                            aria-label={`Edit ${doctor.name}`}
                          >
                            <Pencil size={17} />
                          </button>
                          {doctor.isActive && (
                            <button
                              onClick={() => deactivateDoctor(doctor._id)}
                              className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                              title="Deactivate doctor"
                              aria-label={`Deactivate ${doctor.name}`}
                            >
                              <UserRoundX size={17} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
