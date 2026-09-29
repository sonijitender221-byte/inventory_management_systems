export default function Pagination({ page, pages, total, limit = 10, onPage }) {
  if (pages <= 1) return null;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 text-sm">
      <span className="text-slate-500">
        Showing {from}-{to} of {total}
      </span>
      <div className="flex gap-1">
        <button
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="px-3 py-1.5 rounded border disabled:opacity-40 hover:bg-slate-50"
        >
          Prev
        </button>
        {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            onClick={() => onPage(n)}
            className={`px-3 py-1.5 rounded border ${
              n === page ? "bg-indigo-600 text-white border-indigo-600" : "hover:bg-slate-50"
            }`}
          >
            {n}
          </button>
        ))}
        <button
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          className="px-3 py-1.5 rounded border disabled:opacity-40 hover:bg-slate-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}