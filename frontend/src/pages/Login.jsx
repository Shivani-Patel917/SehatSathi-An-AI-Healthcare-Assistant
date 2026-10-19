
import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { HeartPulse, Eye, EyeOff } from "lucide-react";
import toast from "react-hot-toast";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleChange(event) {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!form.email.trim() || !form.password) {
      toast.error("Please enter your email and password.");
      return;
    }

    setSubmitting(true);

    try {
      // login() returns the authenticated user object.
      const user = await login({
        email: form.email.trim(),
        password: form.password,
      });

      toast.success("Welcome back!");

      // Send users to the correct zone based on their role.
      const roleDestination =
        user.role === "admin"
          ? "/admin"
          : user.role === "doctor"
            ? "/doctor/dashboard"
            : "/user/dashboard";

      // Respect the requested path only if it belongs to
      // the zone the authenticated user is allowed to access.
      const requestedPath = location.state?.from?.pathname;

      const allowedPrefix =
        user.role === "admin"
          ? "/admin"
          : user.role === "doctor"
            ? "/doctor"
            : "/user";

      const safeRequestedPath =
        typeof requestedPath === "string" &&
        requestedPath.startsWith(`${allowedPrefix}/`)
          ? requestedPath
          : null;

      navigate(safeRequestedPath || roleDestination, {
        replace: true,
      });
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Login failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-gradient-to-br from-teal-50 via-white to-blue-50 px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-7 shadow-xl shadow-slate-200/50 sm:p-9">
        <Link to="/" className="mb-7 flex items-center justify-center gap-2">
          <span className="rounded-xl bg-teal-600 p-2.5 text-white">
            <HeartPulse size={25} />
          </span>

          <span className="text-2xl font-bold text-slate-900">
            Sehat<span className="text-teal-600">Sathi</span>
          </span>
        </Link>

        <div className="mb-7 text-center">
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Log in to manage your health journey.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-slate-700"
            >
              Email address
            </label>

            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="input-field w-full"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-sm font-medium text-slate-700"
              >
                Password
              </label>

              <Link
                to="/forgot-password"
                className="text-sm font-semibold text-teal-700 hover:text-teal-800"
              >
                Forgot password?
              </Link>
            </div>

            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="input-field w-full pr-12"
              />

              <button
                type="button"
                aria-label={
                  showPassword ? "Hide password" : "Show password"
                }
                onClick={() => setShowPassword((previous) => !previous)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
              >
                {showPassword ? (
                  <EyeOff size={19} />
                ) : (
                  <Eye size={19} />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary flex w-full items-center justify-center disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Logging in..." : "Log in"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Don't have an account?{" "}
          <Link
            to="/register"
            className="font-semibold text-teal-700 hover:text-teal-800"
          >
            Create account
          </Link>
        </p>

        <p className="mt-6 text-center text-xs leading-5 text-slate-400">
          Your health information should always be handled securely.
        </p>
      </div>
    </div>
  );
}
