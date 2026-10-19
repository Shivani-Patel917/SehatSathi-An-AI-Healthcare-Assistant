
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Upload,
  FileText,
  Eye,
  Download,
  Trash2,
  Pencil,
  X,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const initialForm = {
  title: "",
  recordType: "Medical Report",
  recordDate: new Date().toISOString().slice(0, 10),
  provider: "",
  notes: "",
};

const recordTypes = [
  "Blood Test",
  "Prescription",
  "Medical Report",
  "X-Ray",
  "MRI",
  "CT Scan",
  "Discharge Summary",
  "Vaccination",
  "Other",
];

const MAX_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

function getId(record) {
  return record?._id || record?.id;
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString();
}

function formatSize(bytes = 0) {
  if (!bytes) return "—";
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function getErrorMessage(error) {
  const data = error?.response?.data;

  if (data instanceof Blob) return "The request failed. Please try again.";

  return data?.message || error?.message || "Something went wrong.";
}

export default function UploadReport() {
  const fileInputRef = useRef(null);

  const [records, setRecords] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [selectedFile, setSelectedFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeFileId, setActiveFileId] = useState(null);

  const loadRecords = useCallback(async () => {
    setLoading(true);

    try {
      const response = await api.get("/medical-records");
      const data = response.data;

      setRecords(Array.isArray(data) ? data : data.records || []);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function chooseFile(event) {
    const file = event.target.files?.[0];

    // Permit clearing the file input.
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Choose a PDF, JPG, PNG, or WEBP file.");
      event.target.value = "";
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_SIZE) {
      toast.error("The maximum file size is 10 MB.");
      event.target.value = "";
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  }

  function resetForm() {
    setForm(initialForm);
    setSelectedFile(null);
    setEditingId(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function submitForm(event) {
    event.preventDefault();

    if (!form.title.trim()) {
      toast.error("Enter a report title.");
      return;
    }

    if (!editingId && !selectedFile) {
      toast.error("Choose a report file before uploading.");
      return;
    }

    setSaving(true);

    try {
      if (editingId) {
        // Editing updates metadata only. Use a new upload to replace a file.
        await api.patch(`/medical-records/${editingId}`, form);
        toast.success("Report details updated.");
      } else {
        const payload = new FormData();
        payload.append("title", form.title.trim());
        payload.append("recordType", form.recordType);
        payload.append("recordDate", form.recordDate);
        payload.append("provider", form.provider.trim());
        payload.append("notes", form.notes.trim());
        payload.append("file", selectedFile);

        await api.post("/medical-records", payload);
        toast.success("Medical report uploaded successfully.");
      }

      resetForm();
      await loadRecords();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  function startEdit(record) {
    const dateValue = record.recordDate || record.reportDate;

    setEditingId(getId(record));
    setForm({
      title: record.title || "",
      recordType: record.recordType || record.category || "Medical Report",
      recordDate: dateValue
        ? new Date(dateValue).toISOString().slice(0, 10)
        : initialForm.recordDate,
      provider: record.provider || "",
      notes: record.notes || "",
    });

    setSelectedFile(null);

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function openReport(record, download = false) {
    const id = getId(record);

    if (!id) {
      toast.error("This report has no valid ID.");
      return;
    }

    setActiveFileId(id);

    try {
      const response = await api.get(
        `/medical-records/${id}/download`,
        { responseType: "blob" }
      );

      const blob = new Blob([response.data], {
        type: response.headers["content-type"] || record.mimeType || "application/octet-stream",
      });

      const objectUrl = URL.createObjectURL(blob);

      if (download) {
        const link = document.createElement("a");
        link.href = objectUrl;
        link.download = record.originalName || record.fileName || record.title || "medical-report";
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        const openedWindow = window.open(objectUrl, "_blank", "noopener,noreferrer");

        if (!openedWindow) {
          // Popup blockers may block the new tab. Download instead.
          const link = document.createElement("a");
          link.href = objectUrl;
          link.download = record.originalName || record.fileName || "medical-report";
          document.body.appendChild(link);
          link.click();
          link.remove();
        }
      }

      // Keep the URL alive briefly for the browser to open/download it.
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (error) {
      // Axios may return an error message as a Blob.
      let message = getErrorMessage(error);
      const responseData = error?.response?.data;

      if (responseData instanceof Blob) {
        try {
          const parsed = JSON.parse(await responseData.text());
          message = parsed.message || message;
        } catch {
          // Keep the fallback message.
        }
      }

      toast.error(message);
    } finally {
      setActiveFileId(null);
    }
  }

  async function deleteReport(record) {
    const id = getId(record);

    if (!id) {
      toast.error("This report has no valid ID.");
      return;
    }

    const confirmed = window.confirm(
      `Delete "${record.title || "this report"}"? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      await api.delete(`/medical-records/${id}`);
      setRecords((current) =>
        current.filter((item) => getId(item) !== id)
      );

      if (editingId === id) resetForm();

      toast.success("Report deleted.");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 p-4 sm:p-6 lg:p-8">
      <header>
        <p className="text-sm font-semibold uppercase tracking-wider text-teal-700">
          SehatSathi · Personal health
        </p>
        <h1 className="mt-2 text-3xl font-bold text-slate-900">
          Medical Reports
        </h1>
        <p className="mt-2 text-slate-600">
          Securely upload, view, and manage your medical documents.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-teal-50 p-3 text-teal-700">
            {editingId ? <Pencil size={22} /> : <Upload size={22} />}
          </div>

          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              {editingId ? "Edit report details" : "Upload a report"}
            </h2>
            <p className="text-sm text-slate-500">
              PDF, JPG, PNG, or WEBP · Maximum 10 MB
            </p>
          </div>
        </div>

        <form onSubmit={submitForm} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Report title *
              </span>
              <input
                name="title"
                value={form.title}
                onChange={updateField}
                required
                maxLength={150}
                placeholder="e.g. Complete Blood Count"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Report type *
              </span>
              <select
                name="recordType"
                value={form.recordType}
                onChange={updateField}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              >
                {recordTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Report date *
              </span>
              <input
                type="date"
                name="recordDate"
                value={form.recordDate}
                onChange={updateField}
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-slate-700">
                Hospital / provider
              </span>
              <input
                name="provider"
                value={form.provider}
                onChange={updateField}
                maxLength={150}
                placeholder="Optional"
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Notes
            </span>
            <textarea
              name="notes"
              value={form.notes}
              onChange={updateField}
              maxLength={2000}
              rows={3}
              placeholder="Optional notes about this report"
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            />
          </label>

          {!editingId && (
            <div>
              <label className="flex cursor-pointer flex-col items-center rounded-xl border-2 border-dashed border-teal-200 bg-teal-50/50 p-6 text-center transition hover:border-teal-500">
                <Upload size={28} className="mb-2 text-teal-700" />
                <span className="font-medium text-slate-800">
                  {selectedFile ? selectedFile.name : "Choose your report file"}
                </span>
                <span className="mt-1 text-sm text-slate-500">
                  {selectedFile
                    ? formatSize(selectedFile.size)
                    : "Click here to browse your device"}
                </span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                  onChange={chooseFile}
                  className="sr-only"
                />
              </label>

              {selectedFile && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="mt-2 inline-flex items-center gap-1 text-sm text-red-600 hover:underline"
                >
                  <X size={15} /> Remove selected file
                </button>
              )}
            </div>
          )}

          {editingId && (
            <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
              Editing changes report details only. To replace the document,
              cancel and upload the replacement as a new report.
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving && <RefreshCw size={17} className="animate-spin" />}
              {saving
                ? "Saving..."
                : editingId
                  ? "Save changes"
                  : "Upload report"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-300 px-5 py-3 font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              Your uploaded reports
            </h2>
            <p className="text-sm text-slate-500">
              {records.length} {records.length === 1 ? "report" : "reports"}
            </p>
          </div>

          <button
            type="button"
            onClick={loadRecords}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium hover:bg-white disabled:opacity-50"
          >
            <RefreshCw size={16} /> Refresh
          </button>
        </div>

        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">
            Loading your reports...
          </div>
        ) : records.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <FileText size={38} className="mx-auto mb-3 text-slate-400" />
            <h3 className="font-semibold text-slate-800">No reports yet</h3>
            <p className="mt-1 text-sm text-slate-500">
              Upload your first medical report using the form above.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {records.map((record) => {
              const id = getId(record);
              const isBusy = activeFileId === id;

              return (
                <article
                  key={id}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
                      <FileText size={23} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="break-words font-semibold text-slate-900">
                        {record.title || record.fileName || "Medical report"}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {record.recordType || record.category || "Medical Report"}
                      </p>
                    </div>
                  </div>

                  <dl className="mt-4 space-y-2 text-sm">
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">Report date</dt>
                      <dd className="text-right text-slate-800">
                        {formatDate(record.recordDate || record.reportDate)}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">Provider</dt>
                      <dd className="text-right text-slate-800">
                        {record.provider || "Not specified"}
                      </dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">File</dt>
                      <dd className="max-w-[65%] break-words text-right text-slate-800">
                        {record.originalName || record.fileName || "No file attached"}
                      </dd>
                    </div>
                  </dl>

                  {!record.hasFile && (
                    <p className="mt-3 rounded-lg bg-amber-50 p-2 text-xs text-amber-800">
                      No stored file is attached. Upload this report again to enable viewing and downloading.
                    </p>
                  )}

                  <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={() => openReport(record, false)}
                      disabled={!record.hasFile || isBusy}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-teal-50 px-3 py-2 text-sm font-medium text-teal-800 hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Eye size={16} /> View
                    </button>

                    <button
                      type="button"
                      onClick={() => openReport(record, true)}
                      disabled={!record.hasFile || isBusy}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-2 text-sm font-medium text-blue-800 hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <Download size={16} /> Download
                    </button>

                    <button
                      type="button"
                      onClick={() => startEdit(record)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <Pencil size={15} /> Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteReport(record)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
                    >
                      <Trash2 size={15} /> Delete
                    </button>
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
