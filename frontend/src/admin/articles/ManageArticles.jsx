
import { useCallback, useEffect, useState } from "react";
import { Edit2, Plus, RefreshCw, Search, Trash2, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const emptyForm = {
  title: "",
  slug: "",
  summary: "",
  content: "",
  category: "Healthy Living",
  imageUrl: "",
  author: "SehatSathi Health Team",
  published: false,
};

function normalizeArticles(response) {
  const data = response?.data;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.articles)) return data.articles;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function createSlug(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export default function ManageArticles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const loadArticles = useCallback(async () => {
    setLoading(true);
    try {
      // Assumes GET /api/articles returns all articles for the admin.
      const response = await api.get("/articles");
      setArticles(normalizeArticles(response));
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Could not load articles."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  const openCreateForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEditForm = (article) => {
    setEditingId(article._id || article.id);
    setForm({
      ...emptyForm,
      ...article,
      published: Boolean(article.published),
    });
    setShowForm(true);
  };

  const updateField = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
      ...(name === "title" && !editingId
        ? { slug: createSlug(value) }
        : {}),
    }));
  };

  const saveArticle = async (event) => {
    event.preventDefault();

    if (!form.title.trim() || !form.summary.trim() || !form.content.trim()) {
      toast.error("Title, summary, and content are required.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        title: form.title.trim(),
        slug: createSlug(form.slug || form.title),
        summary: form.summary.trim(),
        content: form.content.trim(),
      };

      if (editingId) {
        // Assumes PATCH /api/articles/:id updates an article.
        await api.patch(`/articles/${editingId}`, payload);
        toast.success("Article updated.");
      } else {
        // Assumes POST /api/articles creates an article.
        await api.post("/articles", payload);
        toast.success("Article created.");
      }

      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      await loadArticles();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Could not save the article."
      );
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = async (article) => {
    const id = article._id || article.id;
    const nextPublished = !article.published;

    try {
      // Assumes PATCH /api/articles/:id accepts { published }.
      await api.patch(`/articles/${id}`, { published: nextPublished });
      toast.success(nextPublished ? "Article published." : "Article unpublished.");
      await loadArticles();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Could not change publication status."
      );
    }
  };

  const deleteArticle = async (article) => {
    const id = article._id || article.id;
    if (!window.confirm(`Delete "${article.title}"? This cannot be undone.`)) {
      return;
    }

    try {
      // Assumes DELETE /api/articles/:id deletes an article.
      await api.delete(`/articles/${id}`);
      toast.success("Article deleted.");
      await loadArticles();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Could not delete the article."
      );
    }
  };

  const filteredArticles = articles.filter((article) =>
    `${article.title || ""} ${article.category || ""} ${article.author || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100";

  return (
    <section className="space-y-6 p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="text-sm font-medium text-teal-700">Content management</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
            Manage Articles
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Create, update, and publish health articles for SehatSathi.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={loadArticles}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw size={16} /> Refresh
          </button>
          <button
            onClick={openCreateForm}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 text-sm font-semibold text-white hover:bg-teal-700"
          >
            <Plus size={17} /> New article
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total articles" value={articles.length} />
        <StatCard
          label="Published"
          value={articles.filter((item) => item.published).length}
        />
        <StatCard
          label="Drafts"
          value={articles.filter((item) => !item.published).length}
        />
      </div>

      {showForm && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <div className="mb-5 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900">
              {editingId ? "Edit article" : "Create article"}
            </h2>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
              aria-label="Close form"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={saveArticle} className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              Title *
              <input
                className={inputClass}
                name="title"
                value={form.title}
                onChange={updateField}
                required
                maxLength={180}
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              Slug
              <input
                className={inputClass}
                name="slug"
                value={form.slug}
                onChange={updateField}
                required
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              Category
              <select
                className={inputClass}
                name="category"
                value={form.category}
                onChange={updateField}
              >
                {[
                  "Healthy Living",
                  "Nutrition",
                  "Mental Wellness",
                  "Preventive Care",
                ].map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700">
              Author
              <input
                className={inputClass}
                name="author"
                value={form.author}
                onChange={updateField}
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
              Image URL
              <input
                className={inputClass}
                name="imageUrl"
                type="url"
                value={form.imageUrl}
                onChange={updateField}
                placeholder="https://example.com/image.jpg"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
              Summary *
              <textarea
                className={inputClass}
                name="summary"
                value={form.summary}
                onChange={updateField}
                rows={2}
                required
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-slate-700 md:col-span-2">
              Article content *
              <textarea
                className={inputClass}
                name="content"
                value={form.content}
                onChange={updateField}
                rows={8}
                required
              />
            </label>

            <label className="flex items-center gap-3 text-sm font-medium text-slate-700 md:col-span-2">
              <input
                type="checkbox"
                name="published"
                checked={form.published}
                onChange={updateField}
                className="h-4 w-4 accent-teal-600"
              />
              Publish this article
            </label>

            <div className="flex flex-wrap gap-3 md:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
              >
                {saving ? "Saving..." : editingId ? "Save changes" : "Create article"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 p-4">
          <div className="relative max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              className={`${inputClass} pl-10`}
              placeholder="Search by title, category, or author..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-slate-500">
            Loading articles...
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-semibold text-slate-700">No articles found</p>
            <p className="mt-1 text-sm text-slate-500">
              Create an article or try a different search.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-5 py-4">Article</th>
                  <th className="px-5 py-4">Category</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredArticles.map((article) => (
                  <tr key={article._id || article.id} className="hover:bg-slate-50">
                    <td className="max-w-sm px-5 py-4">
                      <p className="font-semibold text-slate-900">
                        {article.title}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                        {article.summary}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-slate-600">
                      {article.category || "Uncategorized"}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          article.published
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {article.published ? "Published" : "Draft"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditForm(article)}
                          title="Edit article"
                          className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-100"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => togglePublished(article)}
                          className="rounded-lg border border-teal-100 px-3 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-50"
                        >
                          {article.published ? "Unpublish" : "Publish"}
                        </button>
                        <button
                          onClick={() => deleteArticle(article)}
                          title="Delete article"
                          className="rounded-lg border border-red-100 p-2 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
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
