import { HeartPulse } from "lucide-react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-7 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <Link to="/" className="flex items-center gap-2">
          <HeartPulse className="text-teal-600" size={22} />
          <span className="font-bold text-slate-900">
            Sehat<span className="text-teal-600">Sathi</span>
          </span>
        </Link>

        <p className="text-sm text-slate-500">
          © {new Date().getFullYear()} SehatSathi. Built for better health awareness.
        </p>

        <p className="max-w-md text-xs text-slate-500 md:text-right">
          Health information is educational and does not replace professional medical advice.
        </p>
      </div>
    </footer>
  );
}