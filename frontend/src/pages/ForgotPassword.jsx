
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, HeartPulse } from "lucide-react";
import toast from "react-hot-toast";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (!email.trim()) {
      toast.error("Please enter your email address.");
      return;
    }

    setSubmitting(true);

    try {
      // Password recovery is not implemented on the backend yet.
      toast.error(
        "Password recovery is not available yet. Please contact the administrator."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-gradient-to-br from-teal-50 via-white to-blue-50 px-4 py-12">
      <div className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-8 shadow-xl shadow-slate-200/50">
        <Link
          to="/"
          className="mb-8 flex items-center justify-center gap-2"
        >
          <HeartPulse className="text-teal-600" size={29} />

          <span className="text-2xl font-bold text-slate-900">
            Sehat<span className="text-teal-600">Sathi</span>
          </span>
        </Link>

        <h1 className="text-2xl font-bold text-slate-900">
          Forgot password?
        </h1>

        {submitted ? (
          <p className="mt-4 text-sm leading-6 text-slate-600">
            If password recovery is configured and the address is
            registered, instructions will be sent to that email.
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Enter your email address to request password-reset
              instructions.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Email address
                </label>

                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  className="input-field w-full"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Request reset link"}
              </button>
            </form>
          </>
        )}

        <Link
          to="/login"
          className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-teal-700 hover:text-teal-800"
        >
          <ArrowLeft size={17} />
          Back to login
        </Link>
      </div>
    </div>
  );
}
