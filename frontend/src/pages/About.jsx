
import { Link } from "react-router-dom";
import {
  HeartPulse,
  Target,
  Eye,
  ShieldCheck,
  Users,
  Bot,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const values = [
  {
    icon: HeartPulse,
    title: "Health comes first",
    description:
      "We aim to make health information and digital healthcare tools easier to access.",
  },
  {
    icon: ShieldCheck,
    title: "Responsible guidance",
    description:
      "We encourage informed decisions and consultation with qualified healthcare professionals.",
  },
  {
    icon: Users,
    title: "Designed for people",
    description:
      "We focus on a clear, approachable experience for people navigating everyday healthcare needs.",
  },
  {
    icon: Bot,
    title: "Technology with purpose",
    description:
      "AI-assisted features can help people explore general health questions and information.",
  },
];

export default function About() {
  return (
    <div className="bg-white text-slate-800">
      <section className="bg-gradient-to-br from-teal-50 via-white to-blue-50 px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-700 text-white shadow-lg shadow-teal-700/20">
            <HeartPulse size={32} />
          </div>

          <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-teal-800">
            About SehatSathi
          </p>

          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
            Technology that supports your health journey
          </h1>

          <p className="mx-auto mt-6 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
            SehatSathi is an AI-powered healthcare assistant project designed
            to bring general health information, doctor discovery, digital
            health tools, and AI-assisted guidance together in one platform.
          </p>

          <Link
            to="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-teal-700 px-6 py-3.5 font-semibold text-white hover:bg-teal-800"
          >
            Get started <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-20">
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-teal-700">
            Who we are
          </p>
          <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
            Making digital healthcare easier to navigate
          </h2>
          <p className="mt-5 leading-8 text-slate-600">
            Managing healthcare information can sometimes feel complicated.
            SehatSathi aims to provide a convenient digital experience where
            users can explore health articles, discover doctors, and use
            available health-management features.
          </p>
          <p className="mt-4 leading-8 text-slate-600">
            Our platform combines accessible design with AI-assisted features
            to support health awareness. It is intended to complement—not
            replace—professional medical advice, diagnosis, or treatment.
          </p>
        </div>

        <div className="rounded-3xl bg-slate-50 p-6 sm:p-9">
          <div className="flex gap-4 rounded-2xl bg-white p-5 shadow-sm">
            <div className="h-fit rounded-xl bg-teal-50 p-3 text-teal-800">
              <Target size={25} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Our mission</h3>
              <p className="mt-2 leading-7 text-slate-600">
                To make healthcare information and useful digital health tools
                more accessible through a simple, user-friendly platform.
              </p>
            </div>
          </div>

          <div className="mt-4 flex gap-4 rounded-2xl bg-white p-5 shadow-sm">
            <div className="h-fit rounded-xl bg-blue-50 p-3 text-blue-800">
              <Eye size={25} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Our vision</h3>
              <p className="mt-2 leading-7 text-slate-600">
                To support a more informed and convenient healthcare
                experience through responsible use of digital technology.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-widest text-teal-700">
              What guides us
            </p>
            <h2 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">
              Our core values
            </h2>
            <p className="mt-4 leading-7 text-slate-600">
              The principles behind the SehatSathi experience.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="inline-flex rounded-xl bg-teal-50 p-3 text-teal-800">
                  <Icon size={25} />
                </div>
                <h3 className="mt-5 font-bold text-slate-900">{title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 sm:py-20">
        <CheckCircle2 size={36} className="mx-auto text-teal-700" />
        <h2 className="mt-4 text-3xl font-bold text-slate-900">
          Explore SehatSathi
        </h2>
        <p className="mx-auto mt-4 max-w-2xl leading-7 text-slate-600">
          Discover health information, browse doctors, or create an account to
          access the available user features.
        </p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link
            to="/articles"
            className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:border-teal-700 hover:text-teal-800"
          >
            Read health articles
          </Link>
          <Link
            to="/doctors"
            className="rounded-xl bg-teal-700 px-5 py-3 font-semibold text-white hover:bg-teal-800"
          >
            Explore doctors
          </Link>
        </div>
      </section>
    </div>
  );
}
