export default function Loader({ fullScreen = false }) {
  const spinner = (
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-100 border-t-brand-600" />
  );
  return fullScreen ? (
    <div className="flex min-h-screen items-center justify-center">{spinner}</div>
  ) : (
    <div className="flex justify-center py-8">{spinner}</div>
  );
}
