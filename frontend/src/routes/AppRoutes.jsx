
import { Navigate, Route, Routes } from "react-router-dom";

import GeneralLayout from "../layouts/GeneralLayout";
import UserLayout from "../layouts/UserLayout";
import AdminLayout from "../layouts/AdminLayout";
import DoctorLayout from "../layouts/DoctorLayout";

import Home from "../pages/Home";
import About from "../pages/About";
import Articles from "../pages/Articles";
import Contact from "../pages/Contact";
import Login from "../pages/Login";
import Register from "../pages/Register";
import ForgotPassword from "../pages/ForgotPassword";
import DoctorDetails from "../pages/DoctorDetails";
import Doctors from "../pages/Doctors";
import Notifications from "../pages/Notifications";

import Dashboard from "../user/dashboard/Dashboard";
import Profile from "../user/profile/Profile";
import Assistant from "../user/assistant/Assistant";
import BookAppointment from "../user/appointments/BookAppointment";
import MyAppointments from "../user/appointments/MyAppointments";
import AppointmentDetails from "../user/appointments/AppointmentDetails";
import MedicalRecords from "../user/medical-records/MedicalRecords";
import Medications from "../user/medications/Medications";
import NotificationsPage from "../user/notifications/Notifications.jsx";
import HealthTracker from "../user/health-tracker/HealthTracker.jsx";
import MedicationHistory from "../user/medications/MedicationHistory";
import MedicationAdherence from "../user/medications/MedicationAdherence";
import UploadReport from "../user/medical-records/UploadReport";

import AdminDashboard from "../admin/dashboard/AdminDashboard";
import AdminDoctors from "../admin/doctors/AdminDoctors";
import AdminAppointments from "../admin/appointments/AdminAppointments";
import ManageArticles from "../admin/articles/ManageArticles.jsx";
import ContactEnquiries from "../admin/contact/ContactEnquiries.jsx";
import UserList from "../admin/users/UserList";
import Analytics from "../admin/analytics/Analytics";
import AIActivity from "../admin/ai-activity/AIActivity";

import DoctorDashboard from "../doctor/dashboard/DoctorDashboard.jsx";
import DoctorAppointments from "../doctor/appointments/DoctorAppointments.jsx";
import DoctorProfile from "../doctor/profile/DoctorProfile.jsx";

import ProtectedRoute from "./ProtectedRoute";
import AdminRoute from "./AdminRoute";
import DoctorRoute from "./DoctorRoute.jsx";

function PlaceholderPage({ title }) {
  return (
    <section className="px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold text-slate-900">{title}</h1>
      <p className="mt-2 text-slate-500">
        This page will be implemented in a later phase.
      </p>
    </section>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public / General zone */}
      <Route element={<GeneralLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/articles" element={<Articles />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/notifications" element={<Notifications />} />

        <Route path="/doctors" element={<Doctors />} />
        <Route path="/doctors/:id" element={<DoctorDetails />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<PlaceholderPage title="Reset Password" />}/>
        
      </Route>

      {/* Authenticated user zone */}
      <Route element={<ProtectedRoute />}>
        <Route path="/user" element={<UserLayout />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="appointments" element={<MyAppointments />} />
          <Route path="appointments/book" element={<BookAppointment />} />
          <Route path="appointments/:id" element={<AppointmentDetails />} />
          <Route path="assistant" element={<Assistant />} />
          <Route path="medical-records" element={<MedicalRecords />} />
          <Route path="medications" element={<Medications />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="health-tracker" element={<HealthTracker />} />
          <Route path="medication-history" element={<MedicationHistory />}/>
          <Route path="reports" element={<PlaceholderPage title="Medical Reports" />}/>
          <Route path="medication-adherence" element={<MedicationAdherence />}/>
          <Route path="upload-report" element={<UploadReport />} />
          <Route path="medicines" element={<PlaceholderPage title="Medicine Reminder" />}
          />
        </Route>
      </Route>

      {/* Admin zone */}
      <Route element={<AdminRoute />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UserList />} />
          <Route path="doctors" element={<AdminDoctors />} />
          <Route path="appointments" element={<AdminAppointments />} />
          <Route path="manage-articles" element={<ManageArticles />} />
          <Route path="contact-enquiry" element={<ContactEnquiries />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="/admin/ai-activity" element={<AIActivity />} />
        </Route>
      </Route>

      {/* Doctor zone */}
      <Route element={<DoctorRoute />}>
        <Route path="/doctor" element={<DoctorLayout />}>
          <Route
            index
            element={<Navigate to="/doctor/dashboard" replace />}
          />
          <Route path="dashboard" element={<DoctorDashboard />} />
          <Route path="appointments" element={<DoctorAppointments />} />
          <Route path="profile" element={<DoctorProfile />} />
        </Route>
      </Route>

      {/* Unknown routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
