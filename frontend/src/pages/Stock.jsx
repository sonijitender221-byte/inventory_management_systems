import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ArrowDownToLine, ArrowUpFromLine, Sliders } from "lucide-react";
import toast from "react-hot-toast";
import { fetchMovements, createMovement } from "../features/stock/stockSlice";
import { setQuantity } from "../features/products/productSlice";
import api from "../api/axios";
import Modal from "../components/Modal";
import Pagination from "../components/Pagination";
import { date } from "../utils/format";

export default function Stock() {
  const dispatch = useDispatch();
  const { items, total, page, pages, loading } = useSelector((s) => s.stock);
  const [filters, setFilters] = useState({ type: "", from: "", to: "", page: 1 });
  const [modal, setModal] = useState(null); // { type }

  useEffect(() => {
    document.title = "Stock · StockDesk";
  }, []);

  useEffect(() => {
    dispatch(fetchMovements(filters));
  }, [dispatch, filters]);

  return (
    <div className="space-y-4">
      {/* Top action buttons */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { type: "IN", label: "Stock In", icon: ArrowDownToLine, cls: "bg-green-600 hover:bg-green-700" },
          { type: "OUT", label: "Stock Out", icon: ArrowUpFromLine, cls: "bg-red-600 hover:bg-red-700" },
          { type: "ADJUST", label: "Adjust", icon: Sliders, cls: "bg-blue-600 hover:bg-blue-700" },
        ].map((b) => (
          <button
            key={b.type}
            onClick={() => setModal({ type: b.type })}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl text-white font-medium ${b.cls}`}
          >
            <b.icon className="w-5 h-5" />
            <span className="hidden sm:inline">{b.label}</span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-wrap gap-2">
        <select
          value={filters.type}
          onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value, page: 1 }))}
          className="px-3 py-2 text-sm rounded-lg border border-slate-300 outline-none"
        >
          <option value="">All types</option>
          <option value="IN">IN</option>
          <option value="OUT">OUT</option>
          <option value="ADJUST">ADJUST</option>
        </select>
        <input
          type="date"
          value={filters.from}
          onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value, page: 1 }))}
          className="px-3 py-2 text-sm rounded-lg border border-slate-300 outline-none"
        />
        <input
          type="date"
          value={filters.to}
          onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value, page: 1 }))}
          className="px-3 py-2 text-sm rounded-lg border border-slate-300 outline-none"
        />
      </div>

      {/* History table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Date</th>
              <th className="text-left px-4 py-3">Product</th>
              <th className="text-center px-4 py-3">Type</th>
              <th className="text-right px-4 py-3">Change</th>
              <th className="text-center px-4 py-3">Before → After</th>
              <th className="text-left px-4 py-3">Note</th>
              <th className="text-left px-4 py-3">By</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-slate-400">
                  Loading...
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-slate-400">
                  No stock movements yet. Record your first delivery with Stock In.
                </td>
              </tr>
            ) : (
              items.map((m) => (
                <tr key={m._id} className="hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-600 text-xs whitespace-nowrap">
                    {date(m.createdAt)}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">{m.productName}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        m.type === "IN"
                          ? "bg-green-100 text-green-700"
                          : m.type === "OUT"
                          ? "bg-red-100 text-red-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {m.type}
                    </span>
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-medium ${
                      m.change >= 0 ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {m.change >= 0 ? "+" : ""}
                    {m.change}
                  </td>
                  <td className="px-4 py-3 text-center text-slate-600 text-xs whitespace-nowrap">
                    {m.before} → {m.after}
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{m.note || "—"}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{m.user?.name || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        pages={pages}
        total={total}
        limit={15}
        onPage={(n) => setFilters((f) => ({ ...f, page: n }))}
      />

      <StockModal
        initialType={modal?.type}
        onClose={() => setModal(null)}
        onSaved={() => dispatch(fetchMovements(filters))}
      />
    </div>
  );
}

/* ---------------------------------------------------------------- */
/* Stock Movement Modal — search product, pick type, live preview    */
/* ---------------------------------------------------------------- */
function StockModal({ initialType, onClose, onSaved }) {
  const dispatch = useDispatch();
  const [type, setType] = useState(initialType || "IN");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  // Sync type when modal opens with a preset
  useEffect(() => {
    if (initialType) setType(initialType);
  }, [initialType]);

  // Reset the form when modal is opened fresh
  useEffect(() => {
    if (initialType) {
      setSearch("");
      setResults([]);
      setProduct(null);
      setQty(1);
      setNote("");
    }
  }, [initialType]);

  // Search products as user types (debounced 300ms)
  useEffect(() => {
    if (!search || product) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const { data } = await api.get("/products", {
          params: { search, limit: 8 },
        });
        setResults(data.items);
      } catch {
        setResults([]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [search, product]);

  if (!initialType) return null;

  const after = product
    ? type === "IN"
      ? product.quantity + qty
      : type === "OUT"
      ? product.quantity - qty
      : qty
    : 0;

  const invalid = product && type === "OUT" && after < 0;

  const submit = async (e) => {
    e.preventDefault();
    if (!product) return toast.error("Pick a product");
    if (invalid) return toast.error(`Only ${product.quantity} available`);
    if (type === "ADJUST" && !note.trim())
      return toast.error("Please give a reason for the adjustment");

    setSaving(true);
    const res = await dispatch(
      createMovement({
        productId: product._id,
        type,
        quantity: qty,
        note,
      })
    );
    setSaving(false);

    if (createMovement.fulfilled.match(res)) {
      dispatch(setQuantity(res.payload.product));
      toast.success(
        `Stock updated: ${product.name} now ${res.payload.product.quantity} ${product.unit}`
      );
      onClose();
      onSaved();
    } else {
      toast.error(res.payload || "Failed to save");
    }
  };

  return (
    <Modal open={!!initialType} title="Record stock movement" onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        {/* Type toggle */}
        <div className="flex gap-2">
          {["IN", "OUT", "ADJUST"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${
                type === t
                  ? t === "IN"
                    ? "bg-green-600 text-white border-green-600"
                    : t === "OUT"
                    ? "bg-red-600 text-white border-red-600"
                    : "bg-blue-600 text-white border-blue-600"
                  : "border-slate-300 hover:bg-slate-50"
              }`}
            >
              {t === "IN" ? "Stock In" : t === "OUT" ? "Stock Out" : "Adjust"}
            </button>
          ))}
        </div>

        {/* Product picker */}
        {!product ? (
          <div className="relative">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Product
            </label>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or SKU..."
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none"
            />
            {results.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {results.map((r) => (
                  <button
                    key={r._id}
                    type="button"
                    onClick={() => {
                      setProduct(r);
                      setSearch(r.name);
                      setResults([]);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 border-b border-slate-100 last:border-0"
                  >
                    <div className="text-sm font-medium text-slate-800">{r.name}</div>
                    <div className="text-xs text-slate-500">
                      {r.sku} · {r.quantity} {r.unit} in stock
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-50 rounded-lg p-3 flex items-center justify-between">
            <div>
              <div className="font-medium text-slate-800">{product.name}</div>
              <div className="text-xs text-slate-500">
                Current stock:{" "}
                <b>
                  {product.quantity} {product.unit}
                </b>{" "}
                · Reorder at {product.reorderLevel}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setProduct(null);
                setSearch("");
              }}
              className="text-xs text-indigo-600 hover:underline"
            >
              Change
            </button>
          </div>
        )}

        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {type === "ADJUST" ? "Actual counted quantity" : "Quantity"}
          </label>
          <input
            type="number"
            min="0"
            value={qty}
            onChange={(e) => setQty(Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none"
          />
          {product && (
            <div
              className={`text-sm mt-1 ${
                invalid ? "text-red-600" : "text-slate-500"
              }`}
            >
              {invalid
                ? `Only ${product.quantity} available`
                : `${product.quantity} → ${after}${
                    type === "ADJUST"
                      ? ` (${after - product.quantity >= 0 ? "+" : ""}${
                          after - product.quantity
                        })`
                      : ""
                  }`}
            </div>
          )}
        </div>

        {/* Note */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Note {type === "ADJUST" && <span className="text-red-500">*</span>}
          </label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={
              type === "IN"
                ? "Invoice no. / supplier"
                : type === "OUT"
                ? "Order no. / reason"
                : "Why is it different?"
            }
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none"
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-medium hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || invalid}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </form>
    </Modal>
  );
}