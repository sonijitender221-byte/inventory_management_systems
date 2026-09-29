export default function Spinner({ full = false }) {
  const s = (
    <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
  );
  if (full) return <div className="min-h-screen flex items-center justify-center">{s}</div>;
  return <div className="flex justify-center py-6">{s}</div>;
}