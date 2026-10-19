
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  Stethoscope,
  CalendarDays,
  LoaderCircle,
  UserRound,
  RefreshCw,
  X,
  IndianRupee,
  BriefcaseMedical,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";

const DEFAULT_SPECIALTIES = [
  "General Physician",
  "Cardiology",
  "Dermatology",
  "Pediatrics",
  "Orthopedics",
  "Gynecology",
];

export default function Doctors() {
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  // Debounce search input to avoid sending a request for every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // Load doctors from the backend.
  useEffect(() => {
    let active = true;

    async function loadDoctors() {
      setLoading(true);
      setError("");

      try {
        const params = {};

        if (debouncedSearch) {
          params.search = debouncedSearch;
        }

        if (specialty) {
          params.specialty = specialty;
        }

        const { data } = await api.get("/doctors", { params });

        if (active) {
          setDoctors(
            Array.isArray(data.doctors) ? data.doctors : []
          );
        }
      } catch (err) {
        if (active) {
          const message =
            err.response?.data?.message ||
            "Unable to load doctors. Please try again.";

          setError(message);
          setDoctors([]);
          toast.error(message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadDoctors();

    return () => {
      active = false;
    };
  }, [debouncedSearch, specialty, retryCount]);

  // Include specialties returned by the database.
  const specialties = [
    ...new Set([
      ...DEFAULT_SPECIALTIES,
      ...doctors
        .map((doctor) => doctor.specialty?.trim())
        .filter(Boolean),
    ]),
  ].sort((a, b) => a.localeCompare(b));

  const clearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setSpecialty("");
  };

  const hasFilters = search.trim() !== "" || specialty !== "";

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-teal-700 to-blue-700 p-6 text-white shadow-lg sm:p-8">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-white/15 p-3">
            <Stethoscope size={32} />
          </div>

          <div>
            <h1 className="text-2xl font-bold sm:text-3xl">
              Find a Doctor
            </h1>
            <p className="mt-2 text-sm text-teal-50">
              Find the right specialist and book your appointment.
            </p>
          </div>
        </div>

        {!loading && !error && (
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm">
            <UserRound size={16} />
            {doctors.length} {doctors.length === 1 ? "doctor" : "doctors"} found
          </div>
        )}
      </section>

      {/* Search and filters */}
      <section className="card">
        <div className="grid gap-4 md:grid-cols-[1.5fr_1fr]">
          <div className="relative">
            <Search
              size={19}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by doctor or qualification..."
              className="input-field pl-10"
              aria-label="Search doctors"
            />
          </div>

          <select
            value={specialty}
            onChange={(event) => setSpecialty(event.target.value)}
            className="input-field"
            aria-label="Filter doctors by specialty"
          >
            <option value="">All specialties</option>

            {specialties.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>

        {hasFilters && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              Showing filtered results
            </p>

            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:text-teal-900"
            >
              <X size={16} />
              Clear filters
            </button>
          </div>
        )}
      </section>

      {/* Loading state */}
      {loading && (
        <div
          className="flex flex-col items-center justify-center py-16"
          role="status"
          aria-live="polite"
        >
          <LoaderCircle
            size={36}
            className="animate-spin text-teal-700"
          />
          <p className="mt-4 text-sm text-slate-500">
            Finding available doctors...
          </p>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <section className="card py-12 text-center">
          <Stethoscope
            size={36}
            className="mx-auto text-red-400"
          />

          <h2 className="mt-4 font-semibold text-slate-800">
            Unable to load doctors
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
            {error}
          </p>

          <button
            type="button"
            onClick={() => setRetryCount((count) => count + 1)}
            className="btn-primary mx-auto mt-5 inline-flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} />
            Try again
          </button>
        </section>
      )}

      {/* Empty state */}
      {!loading && !error && doctors.length === 0 && (
        <section className="card py-12 text-center">
          <Stethoscope
            size={40}
            className="mx-auto text-slate-400"
          />

          <h2 className="mt-4 font-semibold text-slate-800">
            No doctors found
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            {hasFilters
              ? "Try changing your search or specialty filter."
              : "There are currently no active doctors available."}
          </p>

          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="btn-primary mt-5"
            >
              Clear filters
            </button>
          )}
        </section>
      )}

      {/* Doctor cards */}
      {!loading && !error && doctors.length > 0 && (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {doctors.map((doctor) => (
            <article
              key={doctor._id}
              className="card flex flex-col transition duration-200 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-start gap-4">
                <div className="shrink-0 rounded-2xl bg-teal-50 p-4 text-teal-700">
                  <UserRound size={30} />
                </div>

                <div className="min-w-0 flex-1">
                  <h2 className="break-words font-bold text-slate-800">
                    {doctor.name || "Doctor"}
                  </h2>

                  <p className="mt-1 text-sm font-medium text-teal-700">
                    {doctor.specialty || "General Physician"}
                  </p>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    {doctor.qualifications || "Qualifications not provided"}
                  </p>
                </div>
              </div>

              <div className="my-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <BriefcaseMedical size={14} />
                    Experience
                  </div>

                  <p className="mt-2 font-semibold text-slate-800">
                    {doctor.experienceYears ?? 0} years
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-3">
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <IndianRupee size={14} />
                    Consultation
                  </div>

                  <p className="mt-2 font-semibold text-slate-800">
                    ₹{Number(doctor.consultationFee ?? 0).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              {doctor.about && (
                <p className="mb-4 text-sm leading-6 text-slate-600">
                  {doctor.about}
                </p>
              )}

              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Available days
                </p>

                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {doctor.availableDays?.length
                    ? doctor.availableDays.join(", ")
                    : "Please contact the clinic"}
                </p>
              </div>

              <div className="mt-auto border-t border-slate-100 pt-4">
                <Link
                  to={`/user/appointments/book?doctorId=${doctor._id}`}
                  className="btn-primary flex items-center justify-center gap-2"
                >
                  <CalendarDays size={17} />
                  Book Appointment
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}