import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3">
      <h1 className="text-5xl font-bold">404</h1>
      <p className="text-slate-600">Page not found.</p>
      <Link to="/" className="btn">Go home</Link>
    </div>
  );
}
