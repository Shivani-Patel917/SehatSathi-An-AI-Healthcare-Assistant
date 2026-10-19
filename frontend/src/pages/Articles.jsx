
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  HeartPulse,
  BookOpen,
  ArrowRight,
  CalendarDays,
  ShieldCheck,
  LoaderCircle,
  RefreshCw,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";

const categories = [
  "All",
  "Healthy Living",
  "Nutrition",
  "Mental Wellness",
  "Preventive Care",
];

const categoryStyles = {
  "Healthy Living": "bg-teal-50 text-teal-800",
  Nutrition: "bg-amber-50 text-amber-800",
  "Mental Wellness": "bg-violet-50 text-violet-800",
  "Preventive Care": "bg-blue-50 text-blue-800",
};

function getCategoryIcon(category) {
  return category === "Preventive Care" ? ShieldCheck : HeartPulse;
}


function formatArticleDate(article) {
  const value =
    article.publishedAt ||
    article.date ||
    article.createdAt;

  if (!value) {
    return "Health guide";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Health guide";
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}


function normalizeArticle(article, index) {
  const category =
  typeof article.category === "string" &&
  article.category.trim() &&
  article.category !== "All"
    ? article.category.trim()
    : "Healthy Living";

  return {
    ...article,
    id: article._id || article.id || index,
    category,
    title: article.title || article.name || "Health Article",
    excerpt:
      article.excerpt ||
      article.summary ||
      article.content ||
      "Read this health resource to learn more about general wellbeing.",
    readTime: article.readTime || "5 min read",
    date: formatArticleDate(article),
  };
}

export default function Articles() {
  const [articles, setArticles] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchArticles = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/articles");
      const data = response.data;

      const articleList = Array.isArray(data)
        ? data
        : Array.isArray(data?.articles)
          ? data.articles
          : Array.isArray(data?.data)
            ? data.data
            : [];

      setArticles(articleList.map(normalizeArticle));
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Unable to load health articles. Please try again.";

      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles();
  }, [fetchArticles]);

  const filteredArticles = useMemo(() => {
    const query = search.trim().toLowerCase();

    return articles.filter((article) => {
      const matchesCategory =
        category === "All" || article.category === category;

      const searchableText = [
        article.title,
        article.excerpt,
        article.category,
        article.content,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchableText.includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [articles, search, category]);

  return (
    <div className="min-h-screen bg-white text-slate-800">
      <section className="bg-gradient-to-br from-teal-50 via-white to-blue-50 px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-teal-800 shadow-sm">
              <BookOpen size={17} />
              SehatSathi Health Library
            </div>

            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Health knowledge for everyday life
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Explore educational resources on healthy living,
              nutrition, mental wellbeing, and preventive care.
            </p>
          </div>

          <div className="mt-8 max-w-2xl">
            <label htmlFor="article-search" className="sr-only">
              Search health articles
            </label>

            <div className="relative">
              <Search
                size={20}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                id="article-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search topics or articles..."
                className="w-full rounded-xl border border-slate-200 bg-white py-4 pl-12 pr-4 shadow-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-wrap gap-2">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCategory(item)}
              className={`rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                category === item
                  ? "bg-teal-700 text-white"
                  : "border border-slate-200 bg-white text-slate-600 hover:border-teal-600 hover:text-teal-800"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-slate-900">
            Explore articles
          </h2>

          {!loading && !error && (
            <p className="text-sm text-slate-500">
              {filteredArticles.length}{" "}
              {filteredArticles.length === 1
                ? "article"
                : "articles"}{" "}
              found
            </p>
          )}

          <button
            type="button"
            onClick={fetchArticles}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={loading ? "animate-spin" : ""}
            />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <LoaderCircle
              size={34}
              className="animate-spin text-teal-700"
            />
            <p className="mt-4 font-medium">
              Loading health articles...
            </p>
          </div>
        ) : error ? (
          <div
            role="alert"
            className="mt-8 rounded-2xl border border-red-200 bg-red-50 px-5 py-12 text-center"
          >
            <h3 className="font-semibold text-red-800">
              Unable to load articles
            </h3>

            <p className="mt-2 text-sm text-red-700">{error}</p>

            <button
              type="button"
              onClick={fetchArticles}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 font-semibold text-white hover:bg-teal-800"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 px-5 py-14 text-center">
            <Search size={32} className="mx-auto text-slate-400" />

            <h3 className="mt-4 font-semibold text-slate-900">
              {articles.length === 0
                ? "No published health articles yet"
                : "No matching articles"}
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              {articles.length === 0
                ? "Health articles will appear here when they are available from the server."
                : "Try another search term or select a different category."}
            </p>

            {articles.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategory("All");
                }}
                className="mt-4 font-semibold text-teal-800 hover:text-teal-950"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredArticles.map((article) => {
              const Icon = getCategoryIcon(article.category);
              const color =
                categoryStyles[article.category] ||
                "bg-teal-50 text-teal-800";

              return (
                <article
                  key={article.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-900/5"
                >
                  <div className="flex h-40 items-center justify-center bg-gradient-to-br from-slate-50 to-teal-50">
                    <div className={`rounded-2xl p-5 ${color}`}>
                      <Icon size={38} />
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-6">
                    <span className="w-fit rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-800">
                      {article.category}
                    </span>

                    <h3 className="mt-4 text-xl font-bold leading-snug text-slate-900">
                      {article.title}
                    </h3>

                    <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">
                      {article.excerpt}
                    </p>

                    <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <CalendarDays size={14} />
                        {article.date}
                      </span>

                      <span>{article.readTime}</span>
                    </div>

                    <Link
                      to="/contact"
                      className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-teal-800 hover:text-teal-950"
                    >
                      Ask us a question
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="mt-10 rounded-2xl border border-blue-100 bg-blue-50 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck
              size={23}
              className="mt-0.5 shrink-0 text-blue-800"
            />

            <div>
              <h3 className="font-bold text-slate-900">
                An important health reminder
              </h3>

              <p className="mt-2 text-sm leading-7 text-slate-700">
                These resources are for general educational purposes,
                not personalized medical advice. Consult a qualified
                healthcare professional about symptoms, diagnoses,
                medicines, or treatment decisions.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
