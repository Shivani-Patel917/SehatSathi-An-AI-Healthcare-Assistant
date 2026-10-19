
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FileText,
  Plus,
  Search,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const categories = [
  { label: "All Categories", value: "All" },
  { label: "Consultation", value: "consultation" },
  { label: "Lab Report / Blood Test", value: "lab-report" },
  { label: "Prescription", value: "prescription" },
  { label: "Allergy", value: "allergy" },
  { label: "Diagnosis", value: "diagnosis" },
  { label: "Vaccination", value: "vaccination" },
  { label: "Other", value: "other" },
];

function getTodayDate() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(date) {
  if (!date) return "Date not provided";

  const parsedDate = new Date(`${date}T00:00:00`);

  return Number.isNaN(parsedDate.getTime())
    ? date
    : parsedDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

function getCategoryLabel(value) {
  return (
    categories.find((item) => item.value === value)?.label ||
    "Other"
  );
}

export default function MedicalRecords() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [title, setTitle] = useState("");
  const [recordType, setRecordType] = useState("lab-report");
  const [recordDate, setRecordDate] = useState(getTodayDate());
  const [provider, setProvider] = useState("");
  const [notes, setNotes] = useState("");

  const fetchRecords = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const { data } = await api.get("/medical-records");

      setRecords(
        Array.isArray(data)
          ? data
          : Array.isArray(data.records)
            ? data.records
            : Array.isArray(data.data)
              ? data.data
              : []
      );
    } catch (error) {
      const message =
        error.response?.data?.message ||
        "Unable to load medical records.";

      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  async function handleSubmit(event) {
    event.preventDefault();

    if (title.trim().length < 2) {
      toast.error("Enter a title containing at least 2 characters.");
      return;
    }

    if (!recordDate) {
      toast.error("Select the medical record date.");
      return;
    }

    const payload = {
      title: title.trim(),
      recordType,
      recordDate,
      provider: provider.trim(),
      notes: notes.trim(),
    };

    try {
      setSaving(true);

      const { data } = await api.post("/medical-records", payload);

      if (data.record) {
        setRecords((previous) => [
          data.record,
          ...previous.filter(
            (item) => item._id !== data.record._id
          ),
        ]);
      } else {
        await fetchRecords();
      }

      toast.success(
        data.message || "Medical record added successfully."
      );

      setTitle("");
      setRecordType("lab-report");
      setRecordDate(getTodayDate());
      setProvider("");
      setNotes("");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to save the medical record."
      );
    } finally {
      setSaving(false);
    }
  }

  const filteredRecords = useMemo(() => {
    const query = search.trim().toLowerCase();

    return records.filter((record) => {
      const searchableText = [
        record.title,
        record.recordType,
        getCategoryLabel(record.recordType),
        record.provider,
        record.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchableText.includes(query);
      const matchesCategory =
        category === "All" || record.recordType === category;

      return matchesSearch && matchesCategory;
    });
  }, [records, search, category]);

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 sm:p-6">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-semibold tracking-wide text-teal-700">
            YOUR HEALTH DOCUMENTS
          </p>

          <h1 className="mt-1 text-3xl font-bold text-slate-900">
            Medical Records
          </h1>

          <p className="mt-2 text-slate-600">
            Organize your consultations, test reports, prescriptions,
            and other health information.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start rounded-xl bg-teal-50 px-4 py-3 text-teal-800">
          <FileText size={21} />
          <span className="font-semibold">
            {records.length} {records.length === 1 ? "Record" : "Records"}
          </span>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-slate-900">
          <Plus size={21} className="text-teal-700" />
          Add a Medical Record
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              Record Title *
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Complete Blood Count"
                minLength={2}
                maxLength={120}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Record Type *
              <select
                value={recordType}
                onChange={(event) => setRecordType(event.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 outline-none focus:border-teal-600"
              >
                {categories
                  .filter((item) => item.value !== "All")
                  .map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
              </select>
            </label>

            <label className="text-sm font-medium text-slate-700">
              Record Date *
              <input
                type="date"
                value={recordDate}
                max={getTodayDate()}
                onChange={(event) => setRecordDate(event.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-teal-600"
              />
            </label>

            <label className="text-sm font-medium text-slate-700">
              Hospital / Doctor / Lab
              <input
                type="text"
                value={provider}
                onChange={(event) => setProvider(event.target.value)}
                placeholder="e.g. City Diagnostic Centre"
                maxLength={120}
                className="mt-1 w-full rounded-lg border border-slate-300 p-3 outline-none focus:border-teal-600"
              />
            </label>
          </div>

          <label className="block text-sm font-medium text-slate-700">
            Notes
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Add relevant details about this record..."
              maxLength={3000}
              rows={3}
              className="mt-1 w-full resize-y rounded-lg border border-slate-300 p-3 outline-none focus:border-teal-600"
            />
            <span className="mt-1 block text-right text-xs text-slate-400">
              {notes.length}/3000
            </span>
          </label>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-5 py-3 font-medium text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <LoaderCircle size={18} className="animate-spin" />
            ) : (
              <Plus size={18} />
            )}
            {saving ? "Saving..." : "Add Record"}
          </button>

          <p className="text-xs text-slate-500">
            This form saves record details. Uploading actual PDF or image
            files requires a separate backend file-storage feature.
          </p>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-3 top-3.5 text-slate-400"
            />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search title, provider, notes..."
              className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-3 outline-none focus:border-teal-600"
            />
          </div>

          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            aria-label="Filter medical records by category"
            className="rounded-lg border border-slate-300 bg-white p-3 outline-none focus:border-teal-600"
          >
            {categories.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={fetchRecords}
            disabled={loading}
            aria-label="Refresh medical records"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 px-4 py-3 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={17}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-slate-500">
            <LoaderCircle size={20} className="animate-spin" />
            Loading medical records...
          </div>
        ) : errorMessage && records.length === 0 ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="font-medium text-red-700">{errorMessage}</p>
            <button
              type="button"
              onClick={fetchRecords}
              className="mt-4 rounded-lg bg-red-700 px-4 py-2 text-white hover:bg-red-800"
            >
              Try Again
            </button>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 p-10 text-center">
            <FileText size={40} className="mx-auto text-slate-400" />

            <h3 className="mt-3 font-semibold text-slate-800">
              No medical records found
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {records.length === 0
                ? "Add your first medical record using the form above."
                : "Try changing your search or category filter."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filteredRecords.map((record) => (
              <article
                key={record._id}
                className="flex items-start gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-teal-200"
              >
                <div className="rounded-xl bg-teal-50 p-3 text-teal-700">
                  <FileText size={25} />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="break-words font-semibold text-slate-900">
                    {record.title || "Medical Record"}
                  </h3>

                  <span className="mt-2 inline-block rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-800">
                    {getCategoryLabel(record.recordType)}
                  </span>

                  <p className="mt-2 text-sm text-slate-500">
                    Record date: {formatDate(record.recordDate)}
                  </p>

                  {record.provider && (
                    <p className="mt-1 text-sm text-slate-600">
                      Provider: {record.provider}
                    </p>
                  )}

                  {record.notes && (
                    <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-600">
                      {record.notes}
                    </p>
                  )}

                  {record.createdAt && (
                    <p className="mt-3 text-xs text-slate-400">
                      Added{" "}
                      {new Date(record.createdAt).toLocaleDateString("en-IN")}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
