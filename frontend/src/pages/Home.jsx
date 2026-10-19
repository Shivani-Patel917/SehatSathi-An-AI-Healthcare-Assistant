
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Bot,
  CalendarCheck,
  CheckCircle2,
  ClipboardList,
  HeartPulse,
  ShieldCheck,
  Stethoscope,
  Users,
  BookOpen,
  Clock3,
  RefreshCw,
} from "lucide-react";
import api from "../services/api";

const services = [
  {
    icon: Bot,
    title: "AI Health Assistant",
    description:
      "Explore general health information and get guidance on common health questions.",
    link: "/login",
  },
  {
    icon: Stethoscope,
    title: "Find Doctors",
    description:
      "Explore the doctor directory and find healthcare professionals.",
    link: "/doctors",
  },
  {
    icon: CalendarCheck,
    title: "Appointments",
    description:
      "Access appointment booking after signing in to your account.",
    link: "/login",
  },
  {
    icon: ClipboardList,
    title: "Health Tracking",
    description:
      "Keep your health information and records organized in one place.",
    link: "/login",
  },
];

const benefits = [
  "Simple access to healthcare information",
  "A convenient doctor directory",
  "Personal health records and tracking",
  "A user-friendly digital experience",
];

function formatArticleDate(dateValue) {
  if (!dateValue) return "";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getArticleImage(article) {
  if (!article.imageUrl) return null;

  try {
    const url = new URL(article.imageUrl, window.location.origin);

    if (["http:", "https:"].includes(url.protocol)) {
      return url.href;
    }
  } catch {
    return null;
  }

  return null;
}

export default function Home() {
  const [latestArticles, setLatestArticles] = useState([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [articlesError, setArticlesError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchLatestArticles() {
      try {
        setArticlesLoading(true);
        setArticlesError(false);

        const response = await api.get("/articles", {
          params: { limit: 3, page: 1 },
        });

        if (cancelled) return;

        const articles = response.data?.articles;

        setLatestArticles(
          Array.isArray(articles) ? articles.slice(0, 3) : []
        );
      } catch (error) {
        if (!cancelled) {
          console.error("Unable to load latest articles:", error);
          setArticlesError(true);
          setLatestArticles([]);
        }
      } finally {
        if (!cancelled) {
          setArticlesLoading(false);
        }
      }
    }

    fetchLatestArticles();

    return () => {
      cancelled = true;
    };
  }, []);

  async function retryArticles() {
    try {
      setArticlesLoading(true);
      setArticlesError(false);

      const response = await api.get("/articles", {
        params: { limit: 3, page: 1 },
      });

      const articles = response.data?.articles;

      setLatestArticles(
        Array.isArray(articles) ? articles.slice(0, 3) : []
      );
    } catch (error) {
      console.error("Unable to load latest articles:", error);
      setArticlesError(true);
      setLatestArticles([]);
    } finally {
      setArticlesLoading(false);
    }
  }

  return (
    <div className="overflow-hidden bg-white text-slate-800">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-teal-50 via-white to-blue-50">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:px-8 lg:py-28">
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-teal-100 bg-white px-4 py-2 text-sm font-medium text-teal-800 shadow-sm">
              <HeartPulse size={17} />
              AI-powered Healthcare Assistant
            </div>

            <h1 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Your health deserves{" "}
              <span className="text-teal-700">smarter care.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
              SehatSathi brings health information, doctor discovery,
              health tracking, and AI-assisted guidance together in
              one convenient healthcare platform.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-700 px-6 py-3.5 font-semibold text-white shadow-lg shadow-teal-700/20 transition hover:bg-teal-800"
              >
                Get Started <ArrowRight size={18} />
              </Link>

              <Link
                to="/doctors"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3.5 font-semibold text-slate-700 transition hover:border-teal-600 hover:text-teal-800"
              >
                Explore Doctors
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-sm text-slate-600">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={17} className="text-teal-700" />
                Easy to use
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 size={17} className="text-teal-700" />
                Convenient access
              </span>
              <span className="flex items-center gap-2">
                <CheckCircle2 size={17} className="text-teal-700" />
                Health information
              </span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -left-5 top-12 h-28 w-28 rounded-full bg-teal-200/50 blur-2xl" />
            <div className="absolute -right-3 bottom-5 h-36 w-36 rounded-full bg-blue-200/60 blur-2xl" />

            <div className="relative rounded-3xl border border-white bg-white p-5 shadow-2xl shadow-slate-300/50 sm:p-8">
              <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-teal-100 p-3 text-teal-800">
                    <HeartPulse size={25} />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900">
                      SehatSathi
                    </h2>
                    <p className="text-sm text-slate-500">
                      Your health companion
                    </p>
                  </div>
                </div>
                <span className="h-3 w-3 rounded-full bg-green-500 ring-4 ring-green-100" />
              </div>

              <div className="mt-6 rounded-2xl bg-gradient-to-r from-teal-700 to-cyan-700 p-5 text-white">
                <p className="text-sm text-teal-50">
                  Welcome to better care
                </p>
                <h3 className="mt-2 text-2xl font-bold">
                  Your health, in focus.
                </h3>
                <p className="mt-2 text-sm leading-6 text-teal-50">
                  Find information and manage your healthcare journey.
                </p>
                <Link
                  to="/user/dashboard"
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-teal-800 hover:bg-teal-50"
                >
                  Open dashboard <ArrowRight size={16} />
                </Link>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-slate-100 p-4">
                  <div className="mb-3 inline-flex rounded-lg bg-blue-50 p-2 text-blue-700">
                    <Activity size={20} />
                  </div>
                  <p className="font-semibold text-slate-900">
                    Health tracking
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Keep track of your health
                  </p>
                </div>

                <div className="rounded-xl border border-slate-100 p-4">
                  <div className="mb-3 inline-flex rounded-lg bg-violet-50 p-2 text-violet-700">
                    <Bot size={20} />
                  </div>
                  <p className="font-semibold text-slate-900">
                    SehatAI
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    General health guidance
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-3 rounded-xl bg-slate-50 p-4">
                <ShieldCheck size={22} className="shrink-0 text-teal-700" />
                <p className="text-xs leading-5 text-slate-600">
                  Designed to support your healthcare journey, not
                  replace professional medical advice.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-teal-700">
            What we offer
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Healthcare tools in one place
          </h2>
          <p className="mt-4 leading-7 text-slate-600">
            Explore tools designed to make everyday healthcare
            information and organization more convenient.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {services.map(({ icon: Icon, title, description, link }) => (
            <article
              key={title}
              className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-teal-200 hover:shadow-xl hover:shadow-teal-900/5"
            >
              <div className="inline-flex rounded-xl bg-teal-50 p-3 text-teal-800 transition group-hover:bg-teal-700 group-hover:text-white">
                <Icon size={25} />
              </div>
              <h3 className="mt-5 text-lg font-bold text-slate-900">
                {title}
              </h3>
              <p className="mt-3 min-h-20 text-sm leading-6 text-slate-600">
                {description}
              </p>
              <Link
                to={link}
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-teal-800 hover:text-teal-950"
              >
                Explore <ArrowRight size={16} />
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* About preview */}
      <section className="bg-slate-50">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:items-center lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-teal-700">
              Why SehatSathi?
            </p>
            <h2 className="mt-3 text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
              A helpful companion for your health journey
            </h2>
            <p className="mt-5 leading-7 text-slate-600">
              Our goal is to make useful healthcare information and
              digital health tools easier to access, while encouraging
              informed conversations with qualified healthcare
              professionals.
            </p>

            <ul className="mt-6 space-y-4">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3">
                  <CheckCircle2
                    size={20}
                    className="mt-0.5 shrink-0 text-teal-700"
                  />
                  <span className="text-slate-700">{benefit}</span>
                </li>
              ))}
            </ul>

            <Link
              to="/about"
              className="mt-8 inline-flex items-center gap-2 font-semibold text-teal-800 hover:text-teal-950"
            >
              Learn more about us <ArrowRight size={18} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
              <Users size={30} className="text-teal-700" />
              <h3 className="mt-5 font-bold text-slate-900">
                User focused
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Straightforward tools for everyday health management.
              </p>
            </div>

            <div className="mt-8 rounded-2xl bg-teal-700 p-6 text-white shadow-lg shadow-teal-900/10 sm:p-8">
              <HeartPulse size={30} />
              <h3 className="mt-5 font-bold">Health first</h3>
              <p className="mt-2 text-sm leading-6 text-teal-50">
                Helpful information with an emphasis on responsible care.
              </p>
            </div>

            <div className="rounded-2xl bg-blue-50 p-6 sm:p-8">
              <Bot size={30} className="text-blue-700" />
              <h3 className="mt-5 font-bold text-slate-900">
                AI assistance
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                A convenient way to explore general health questions.
              </p>
            </div>

            <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
              <ShieldCheck size={30} className="text-teal-700" />
              <h3 className="mt-5 font-bold text-slate-900">
                Responsible use
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Professional medical care remains essential when needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Latest Health Articles */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-sm font-bold uppercase tracking-widest text-teal-700">
              Health &amp; Wellness
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
              Latest Health Articles
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              Explore helpful health information and wellness articles
              published by the SehatSathi team.
            </p>
          </div>

          <Link
            to="/articles"
            className="inline-flex shrink-0 items-center gap-2 font-semibold text-teal-800 hover:text-teal-950"
          >
            View all articles <ArrowRight size={18} />
          </Link>
        </div>

        {articlesLoading && (
          <div
            className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
            aria-label="Loading latest articles"
          >
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="animate-pulse overflow-hidden rounded-2xl border border-slate-200"
              >
                <div className="h-48 bg-slate-100" />
                <div className="space-y-3 p-6">
                  <div className="h-4 w-1/3 rounded bg-slate-100" />
                  <div className="h-6 w-5/6 rounded bg-slate-100" />
                  <div className="h-4 rounded bg-slate-100" />
                  <div className="h-4 w-2/3 rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!articlesLoading && articlesError && (
          <div className="mt-10 rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
            <BookOpen size={32} className="mx-auto text-amber-700" />
            <h3 className="mt-4 text-lg font-bold text-slate-900">
              Articles are temporarily unavailable
            </h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              We couldn't load the latest health articles. Please try again.
            </p>
            <button
              type="button"
              onClick={retryArticles}
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-800"
            >
              <RefreshCw size={16} />
              Try again
            </button>
          </div>
        )}

        {!articlesLoading &&
          !articlesError &&
          latestArticles.length === 0 && (
            <div className="mt-10 rounded-2xl border border-slate-200 bg-slate-50 p-8 text-center">
              <BookOpen size={32} className="mx-auto text-teal-700" />
              <h3 className="mt-4 text-lg font-bold text-slate-900">
                No articles published yet
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                New health and wellness articles will appear here when
                they are published.
              </p>
            </div>
          )}

        {!articlesLoading &&
          !articlesError &&
          latestArticles.length > 0 && (
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {latestArticles.map((article) => {
                const imageUrl = getArticleImage(article);
                const articleDate = formatArticleDate(
                  article.publishedAt || article.createdAt
                );

                return (
                  <article
                    key={article._id || article.slug}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:border-teal-200 hover:shadow-xl hover:shadow-teal-900/5"
                  >
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={article.title || "Health article"}
                        loading="lazy"
                        className="h-48 w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                      />
                    ) : (
                      <div className="flex h-48 items-center justify-center bg-gradient-to-br from-teal-50 to-blue-50">
                        <HeartPulse
                          size={48}
                          className="text-teal-700"
                        />
                      </div>
                    )}

                    <div className="flex flex-1 flex-col p-6">
                      <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500">
                        {article.category && (
                          <span className="rounded-full bg-teal-50 px-3 py-1 text-teal-800">
                            {article.category}
                          </span>
                        )}

                        {articleDate && (
                          <span className="inline-flex items-center gap-1">
                            <Clock3 size={13} />
                            {articleDate}
                          </span>
                        )}
                      </div>

                      <h3 className="mt-4 text-xl font-bold leading-snug text-slate-900 transition group-hover:text-teal-800">
                        {article.title}
                      </h3>

                      <p className="mt-3 flex-1 text-sm leading-7 text-slate-600">
                        {article.summary ||
                          "Explore this health and wellness article from SehatSathi."}
                      </p>

                      {article.author && (
                        <p className="mt-4 text-xs text-slate-500">
                          By {article.author}
                        </p>
                      )}

                      <Link
                        to={
                          article.slug
                            ? `/articles/${encodeURIComponent(article.slug)}`
                            : "/articles"
                        }
                        className="mt-5 inline-flex items-center gap-2 font-semibold text-teal-800 hover:text-teal-950"
                      >
                        Read article <ArrowRight size={16} />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
      </section>

      {/* CTA */}
      <section className="px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-5xl rounded-3xl bg-gradient-to-r from-teal-800 to-cyan-800 px-6 py-12 text-center text-white sm:px-12 sm:py-16">
          <h2 className="text-3xl font-bold sm:text-4xl">
            Take the next step in your healthcare journey
          </h2>
          <p className="mx-auto mt-4 max-w-2xl leading-7 text-teal-50">
            Create an account to access your dashboard and the
            personalized tools available in SehatSathi.
          </p>
          <Link
            to="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3.5 font-semibold text-teal-900 transition hover:bg-teal-50"
          >
            Create your account <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </div>
  );
}
