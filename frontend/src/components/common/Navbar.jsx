
import { Link, NavLink } from "react-router-dom";
import { HeartPulse, Menu, X } from "lucide-react";
import { useState } from "react";
import NotificationCenter from "./NotificationCenter";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const linkClass = ({ isActive }) =>
    `text-sm font-medium transition ${
      isActive
        ? "text-teal-700"
        : "text-slate-600 hover:text-teal-700"
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white">
            <HeartPulse size={23} />
          </span>

          <span className="text-xl font-bold tracking-tight text-slate-900">
            Sehat<span className="text-teal-600">Sathi</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-7 md:flex">
          <NavLink to="/" end className={linkClass}>
            Home
          </NavLink>
          <NavLink to="/about" className={linkClass}>
            About
          </NavLink>
          <NavLink to="/articles" className={linkClass}>
            Articles
          </NavLink>
          <NavLink to="/doctors" className={linkClass}>
            Doctors
          </NavLink>
          <NavLink to="/contact" className={linkClass}>
            Contact
          </NavLink>
        </nav>

        {/* Actions */}
        <div className="hidden items-center gap-3 md:flex">
          <NotificationCenter />

          <Link
            to="/login"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
          >
            Log in
          </Link>

          <Link
            to="/register"
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((prev) => !prev)}
          className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:hidden"
        >
          {menuOpen ? <X size={23} /> : <Menu size={23} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {menuOpen && (
        <nav className="space-y-1 border-t border-slate-100 px-4 py-3 md:hidden">
          {[
            ["Home", "/"],
            ["About", "/about"],
            ["Articles", "/articles"],
            ["Doctors", "/doctors"],
            ["Contact", "/contact"],
            ["Log in", "/login"],
            ["Register", "/register"],
          ].map(([label, path]) => (
            <Link
              key={path}
              to={path}
              onClick={() => setMenuOpen(false)}
              className="block rounded-lg px-3 py-2.5 text-sm font-medium text-slate-700 hover:bg-teal-50 hover:text-teal-700"
            >
              {label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
