
import { useEffect, useState } from "react";
import { UserRound, LockKeyhole, Save, LoaderCircle } from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const initialProfile = { name: "", email: "" };
const initialPassword = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export default function Profile() {
  const { updateUser } = useAuth();

  const [profile, setProfile] = useState(initialProfile);
  const [passwords, setPasswords] = useState(initialPassword);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      try {
        const { data } = await api.get("/profile");

        if (active) {
          setProfile({
            name: data.user.name || "",
            email: data.user.email || "",
          });
        }
      } catch (error) {
        if (active) {
          toast.error(
            error.response?.data?.message ||
              "Unable to load your profile."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, []);

  function handleProfileChange(event) {
    setProfile({
      ...profile,
      [event.target.name]: event.target.value,
    });
  }

  function handlePasswordChange(event) {
    setPasswords({
      ...passwords,
      [event.target.name]: event.target.value,
    });
  }

  async function handleProfileSubmit(event) {
    event.preventDefault();

    if (profile.name.trim().length < 2) {
      toast.error("Name must contain at least 2 characters.");
      return;
    }

    setSavingProfile(true);

    try {
      const { data } = await api.patch("/profile", {
        name: profile.name.trim(),
        email: profile.email.trim(),
      });

      setProfile({
        name: data.user.name,
        email: data.user.email,
      });

      updateUser(data.user);
      toast.success(data.message || "Profile updated.");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to update your profile."
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(event) {
    event.preventDefault();

    if (passwords.newPassword.length < 8) {
      toast.error("New password must contain at least 8 characters.");
      return;
    }

    if (passwords.newPassword.length > 72) {
      toast.error("New password cannot exceed 72 characters.");
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }

    if (passwords.currentPassword === passwords.newPassword) {
      toast.error("Choose a different new password.");
      return;
    }

    setSavingPassword(true);

    try {
      const { data } = await api.patch(
        "/profile/change-password",
        {
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        }
      );

      toast.success(data.message || "Password changed.");

      setPasswords(initialPassword);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Unable to change your password."
      );
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-64 items-center justify-center">
        <LoaderCircle className="animate-spin text-teal-700" size={32} />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">
          My Profile
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Manage your account details and security.
        </p>
      </div>

      <section className="card">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-teal-50 p-3 text-teal-700">
            <UserRound size={24} />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800">
              Personal Information
            </h2>
            <p className="text-sm text-slate-500">
              Update your registered details.
            </p>
          </div>
        </div>

        <form onSubmit={handleProfileSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700">
              Full Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              value={profile.name}
              onChange={handleProfileChange}
              className="input-field"
              minLength={2}
              maxLength={80}
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={profile.email}
              onChange={handleProfileChange}
              className="input-field"
              maxLength={254}
              required
            />
          </div>

          <button
            type="submit"
            disabled={savingProfile}
            className="btn-primary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingProfile ? (
              <LoaderCircle size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {savingProfile ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </section>

      <section className="card">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-blue-50 p-3 text-blue-700">
            <LockKeyhole size={24} />
          </div>
          <div>
            <h2 className="font-semibold text-slate-800">
              Change Password
            </h2>
            <p className="text-sm text-slate-500">
              Confirm your current password before changing it.
            </p>
          </div>
        </div>

        <form onSubmit={handlePasswordSubmit} className="space-y-5">
          <div>
            <label htmlFor="currentPassword" className="mb-2 block text-sm font-medium text-slate-700">
              Current Password
            </label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              value={passwords.currentPassword}
              onChange={handlePasswordChange}
              className="input-field"
              required
            />
          </div>

          <div>
            <label htmlFor="newPassword" className="mb-2 block text-sm font-medium text-slate-700">
              New Password
            </label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              autoComplete="new-password"
              value={passwords.newPassword}
              onChange={handlePasswordChange}
              className="input-field"
              minLength={8}
              maxLength={72}
              required
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-slate-700">
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              value={passwords.confirmPassword}
              onChange={handlePasswordChange}
              className="input-field"
              minLength={8}
              maxLength={72}
              required
            />
          </div>

          <button
            type="submit"
            disabled={savingPassword}
            className="btn-secondary inline-flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingPassword && (
              <LoaderCircle size={18} className="animate-spin" />
            )}
            {savingPassword ? "Updating..." : "Update Password"}
          </button>
        </form>
      </section>
    </div>
  );
}
