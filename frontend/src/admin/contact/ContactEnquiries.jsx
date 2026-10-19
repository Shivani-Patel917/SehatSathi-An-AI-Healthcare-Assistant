
import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, RefreshCw, Search, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const STATUSES = ["new", "in-progress", "resolved"];

function normalizeMessages(response) {
  const data = response?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.messages)) return data.messages;
  if (Array.isArray(data?.enquiries)) return data.enquiries;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      });
}

function StatusBadge({ status }) {
  const styles = {
    new: "bg-blue-50 text-blue-700",
    "in-progress": "bg-amber-50 text-amber-700",
    resolved: "bg-emerald-50 text-emerald-700",
  };

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
        styles[status] || "bg-slate-100 text-slate-700"
      }`}
    >
      {status || "Unknown"}
    </span>
  );
}

export default function ContactEnquiries() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      // Assumes GET /api/contact returns contact submissions for admins.
      const response = await api.get("/contact");
      setMessages(normalizeMessages(response));
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Could not load contact enquiries."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const filteredMessages = useMemo(() => {
    return messages.filter((message) => {
      const text = [
        message.name,
        message.email,
        message.subject,
        message.message,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = text.includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || message.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [messages, search, statusFilter]);

  const updateStatus = async (message, status) => {
    const id = message._id || message.id;
    setUpdatingId(id);

    try {
      // Assumes PATCH /api/contact/:id accepts { status }.
      await api.patch(`/contact/${id}`, { status });

      setMessages((current) =>
        current.map((item) =>
          (item._id || item.id) === id ? { ...item, status } : item
        )
      );

      setSelected((current) =>
        current && (current._id || current.id) === id
          ? { ...current, status }
          : current
      );

      toast.success("Enquiry status updated.");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Could not update enquiry status."
      );
    } finally {
      setUpdatingId(null);
    }
  };

  const counts = {
    total: messages.length,
    new: messages.filter((item) => item.status === "new").length,
    inProgress: messages.filter((item) => item.status === "in-progress").length,
    resolved: messages.filter((item) => item.status === "resolved").length,
  };

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100";

  return (
    <section className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-teal-700">
            Communication center
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Contact Enquiries
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Review user messages and track their resolution.
          </p>
        </div>

        <button
          onClick={loadMessages}
          className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total enquiries" value={counts.total} />
        <StatCard label="New" value={counts.new} />
        <StatCard label="In progress" value={counts.inProgress} />
        <StatCard label="Resolved" value={counts.resolved} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="grid gap-3 border-b border-slate-100 p-4 md:grid-cols-[1fr_220px]">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              className={`${inputClass} pl-10`}
              placeholder="Search name, email, subject, or message..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <select
            className={inputClass}
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter enquiries by status"
          >
            <option value="all">All statuses</option>
            <option value="new">New</option>
            <option value="in-progress">In progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">
            Loading enquiries...
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-semibold text-slate-700">
              No enquiries found
            </p>
            <p className="mt-1 text-sm text-slate-500">
              New contact form submissions will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4">Sender</th>
                  <th className="px-5 py-4">Subject</th>
                  <th className="px-5 py-4">Received</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMessages.map((message) => (
                  <tr
                    key={message._id || message.id}
                    className="align-top hover:bg-slate-50"
                  >
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">
                        {message.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {message.email}
                      </p>
                    </td>
                    <td className="max-w-xs px-5 py-4 text-slate-700">
                      <p className="font-medium">{message.subject}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                        {message.message}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                      {formatDate(message.createdAt)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={message.status} />
                    </td>
                    <td className="px-5 py-4">
                      <button
                        onClick={() => setSelected(message)}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        <Eye size={15} /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelected(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="enquiry-title"
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-teal-700">
                  Contact message
                </p>
                <h2
                  id="enquiry-title"
                  className="mt-1 text-xl font-bold text-slate-900"
                >
                  {selected.subject}
                </h2>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close message details"
              >
                <X size={20} />
              </button>
            </div>

            <div className="mt-6 grid gap-4 rounded-xl bg-slate-50 p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs text-slate-500">Name</p>
                <p className="mt-1 font-medium text-slate-900">
                  {selected.name || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Email</p>
                <p className="mt-1 break-all font-medium text-slate-900">
                  {selected.email || "—"}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Received</p>
                <p className="mt-1 font-medium text-slate-900">
                  {formatDate(selected.createdAt)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Current status</p>
                <div className="mt-2">
                  <StatusBadge status={selected.status} />
                </div>
              </div>
            </div>

            <div className="mt-5">
              <h3 className="text-sm font-semibold text-slate-800">
                Message
              </h3>
              <p className="mt-2 whitespace-pre-wrap break-words rounded-xl border border-slate-200 p-4 text-sm leading-6 text-slate-700">
                {selected.message || "No message content."}
              </p>
            </div>

            <div className="mt-6">
              <label
                htmlFor="enquiry-status"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Update status
              </label>
              <select
                id="enquiry-status"
                className={inputClass}
                value={selected.status || "new"}
                disabled={
                  updatingId === (selected._id || selected.id)
                }
                onChange={(event) =>
                  updateStatus(selected, event.target.value)
                }
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status === "in-progress"
                      ? "In progress"
                      : status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelected(null)}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
