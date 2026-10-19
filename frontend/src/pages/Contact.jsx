
import { useState } from "react";
import {
  Mail,
  MessageCircle,
  MapPin,
  Send,
  HeartPulse,
  Clock,
  CheckCircle2,
  LoaderCircle,
} from "lucide-react";
import api from "../services/api";
import toast from "react-hot-toast";

const initialForm = {
  name: "",
  email: "",
  subject: "",
  message: "",
};

export default function Contact() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));

    setSubmitted(false);
  }

  function validateForm() {
    const nextErrors = {};

    if (!form.name.trim()) {
      nextErrors.name = "Please enter your name.";
    } else if (form.name.trim().length > 100) {
      nextErrors.name = "Name must not exceed 100 characters.";
    }

    if (!form.email.trim()) {
      nextErrors.email = "Please enter your email address.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())
    ) {
      nextErrors.email = "Please enter a valid email address.";
    } else if (form.email.trim().length > 254) {
      nextErrors.email = "Email must not exceed 254 characters.";
    }

    if (!form.subject.trim()) {
      nextErrors.subject = "Please enter a subject.";
    } else if (form.subject.trim().length > 150) {
      nextErrors.subject =
        "Subject must not exceed 150 characters.";
    }

    if (form.message.trim().length < 10) {
      nextErrors.message =
        "Please enter at least 10 characters.";
    } else if (form.message.trim().length > 5000) {
      nextErrors.message =
        "Message must not exceed 5000 characters.";
    }

    return nextErrors;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextErrors = validateForm();
    setErrors(nextErrors);
    setSubmitted(false);

    if (Object.keys(nextErrors).length > 0) {
      toast.error("Please correct the highlighted fields.");
      return;
    }

    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      subject: form.subject.trim(),
      message: form.message.trim(),
    };

    try {
      setSubmitting(true);

      const response = await api.post("/contact", payload);

      toast.success(
        response.data?.message ||
          "Your message has been submitted successfully."
      );

      setForm(initialForm);
      setErrors({});
      setSubmitted(true);
    } catch (err) {
      toast.error(
        err.response?.data?.message ||
          "Unable to send your message. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100 disabled:cursor-not-allowed disabled:bg-slate-50";

  const errorClass = "mt-1.5 text-sm text-red-600";

  return (
    <div className="bg-white text-slate-800">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-teal-50 via-white to-blue-50 px-4 py-14 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-teal-800 shadow-sm">
              <MessageCircle size={17} />
              We're here to help
            </span>

            <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              Contact SehatSathi
            </h1>

            <p className="mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              Have a question about the platform or need help
              navigating its features? Send us a message and our
              team will receive your enquiry.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Content */}
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-5 lg:px-8 lg:py-16">
        {/* Contact Information */}
        <div className="space-y-6 lg:col-span-2">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-teal-700">
              Get in touch
            </p>

            <h2 className="mt-3 text-2xl font-bold text-slate-900">
              How can we help?
            </h2>

            <p className="mt-3 leading-7 text-slate-600">
              Contact us about general platform questions,
              technical issues, or suggestions for improving
              your experience.
            </p>
          </div>

          <div className="flex gap-4 rounded-2xl border border-slate-200 p-5">
            <div className="h-fit rounded-xl bg-teal-50 p-3 text-teal-800">
              <Mail size={22} />
            </div>

            <div>
              <h3 className="font-semibold text-slate-900">
                Email support
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Submit your enquiry through the contact form.
                Our configured support process can handle your
                message.
              </p>
            </div>
          </div>

          <div className="flex gap-4 rounded-2xl border border-slate-200 p-5">
            <div className="h-fit rounded-xl bg-blue-50 p-3 text-blue-800">
              <Clock size={22} />
            </div>

            <div>
              <h3 className="font-semibold text-slate-900">
                Response time
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                Our response time depends on the support process
                configured for the platform.
              </p>
            </div>
          </div>

          <div className="flex gap-4 rounded-2xl border border-slate-200 p-5">
            <div className="h-fit rounded-xl bg-violet-50 p-3 text-violet-800">
              <MapPin size={22} />
            </div>

            <div>
              <h3 className="font-semibold text-slate-900">
                Our platform
              </h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                SehatSathi — an AI-powered healthcare assistant
                project.
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-teal-800 p-6 text-white">
            <HeartPulse size={28} />

            <h3 className="mt-4 text-lg font-bold">
              Your health matters
            </h3>

            <p className="mt-2 text-sm leading-6 text-teal-50">
              This contact form is for platform-related enquiries.
              It is not an emergency service or a substitute for
              medical care.
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-3">
          <form
            onSubmit={handleSubmit}
            noValidate
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8"
          >
            <h2 className="text-2xl font-bold text-slate-900">
              Send us a message
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Complete the fields below. Fields marked with *
              are required.
            </p>

            {submitted && (
              <div
                role="status"
                className="mt-6 flex items-start gap-3 rounded-xl border border-teal-200 bg-teal-50 p-4"
              >
                <CheckCircle2
                  size={21}
                  className="mt-0.5 shrink-0 text-teal-700"
                />

                <div>
                  <p className="font-semibold text-teal-900">
                    Message submitted successfully
                  </p>
                  <p className="mt-1 text-sm leading-6 text-teal-800">
                    Your message was accepted by the contact API.
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              {/* Name */}
              <div>
                <label
                  htmlFor="contact-name"
                  className="text-sm font-semibold text-slate-700"
                >
                  Full name *
                </label>

                <input
                  id="contact-name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  autoComplete="name"
                  maxLength={100}
                  required
                  disabled={submitting}
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={
                    errors.name ? "contact-name-error" : undefined
                  }
                  className={inputClass}
                />

                {errors.name && (
                  <p id="contact-name-error" className={errorClass}>
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="contact-email"
                  className="text-sm font-semibold text-slate-700"
                >
                  Email address *
                </label>

                <input
                  id="contact-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  autoComplete="email"
                  maxLength={254}
                  required
                  disabled={submitting}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={
                    errors.email ? "contact-email-error" : undefined
                  }
                  className={inputClass}
                />

                {errors.email && (
                  <p id="contact-email-error" className={errorClass}>
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Subject */}
              <div className="sm:col-span-2">
                <label
                  htmlFor="contact-subject"
                  className="text-sm font-semibold text-slate-700"
                >
                  Subject *
                </label>

                <input
                  id="contact-subject"
                  name="subject"
                  type="text"
                  value={form.subject}
                  onChange={handleChange}
                  placeholder="What is your enquiry about?"
                  maxLength={150}
                  required
                  disabled={submitting}
                  aria-invalid={Boolean(errors.subject)}
                  aria-describedby={
                    errors.subject
                      ? "contact-subject-error"
                      : undefined
                  }
                  className={inputClass}
                />

                {errors.subject && (
                  <p id="contact-subject-error" className={errorClass}>
                    {errors.subject}
                  </p>
                )}
              </div>

              {/* Message */}
              <div className="sm:col-span-2">
                <label
                  htmlFor="contact-message"
                  className="text-sm font-semibold text-slate-700"
                >
                  Message *
                </label>

                <textarea
                  id="contact-message"
                  name="message"
                  rows={6}
                  value={form.message}
                  onChange={handleChange}
                  placeholder="Tell us how we can help..."
                  minLength={10}
                  maxLength={5000}
                  required
                  disabled={submitting}
                  aria-invalid={Boolean(errors.message)}
                  aria-describedby={
                    errors.message
                      ? "contact-message-error"
                      : undefined
                  }
                  className={`${inputClass} resize-y`}
                />

                {errors.message && (
                  <p id="contact-message-error" className={errorClass}>
                    {errors.message}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-6 py-3.5 font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {submitting ? (
                <>
                  <LoaderCircle size={17} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  Send Message
                  <Send size={17} />
                </>
              )}
            </button>

            <p className="mt-4 text-xs leading-5 text-slate-500">
              Please do not include passwords, sensitive personal
              details, or confidential medical records in this form.
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}
