import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { Plus, Search, Download, Edit, Trash2, ArrowLeftRight } from "lucide-react";
import toast from "react-hot-toast";
import api, { errMsg } from "../api/axios";
import {
  fetchProducts, createProduct, updateProduct, deleteProduct,
} from "../features/products/productSlice";
import { fetchCategories } from "../features/categories/categorySlice";
import { fetchSuppliers } from "../features/suppliers/supplierSlice";
import { createMovement } from "../features/stock/stockSlice";
import { setQuantity } from "../features/products/productSlice";

import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import Pagination from "../components/Pagination";
import StockBadge from "../components/StockBadge";
import EmptyState from "../components/EmptyState";
import { money, stockStatus } from "../utils/format";

export default function Products() {
  const dispatch = useDispatch();
  const [params] = useSearchParams();
  const { items, total, page, pages, loading, saving } = useSelector((s) => s.products);
  const categories = useSelector((s) => s.categories.items);
  const suppliers = useSelector((s) => s.suppliers.items);
  const { user } = useSelector((s) => s.auth);

  const [filters, setFilters] = useState({
    search: "", category: params.get("category") || "", supplier: "",
    stock: params.get("stock") || "", sort: "-createdAt", page: 1,
  });
  const [searchText, setSearchText] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [stockFor, setStockFor] = useState(null);

  useEffect(() => { document.title = "Products · StockDesk"; }, []);
  useEffect(() => {
    if (!categories.length) dispatch(fetchCategories());
    if (!suppliers.length) dispatch(fetchSuppliers());
  }, [dispatch, categories.length, suppliers.length]);

  useEffect(() => {
    dispatch(fetchProducts(filters));
  }, [dispatch, filters]);

  useEffect(() => {
    const t = setTimeout(() => {
      setFilters((f) => ({ ...f, search: searchText, page: 1 }));
    }, 400);
    return () => clearTimeout(t);
  }, [searchText]);

  const clearFilters = () =>
    setFilters({ search: "", category: "", supplier: "", stock: "", sort: "-createdAt", page: 1 }) ||
    setSearchText("");

  const exportCsv = async () => {
    try {
      const res = await api.get("/products/export", { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `products-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast.error(errMsg(err));
    }
  };

  const onDelete = async () => {
    const res = await dispatch(deleteProduct(deleting._id));
    if (deleteProduct.fulfilled.match(res)) {
      toast.success("Product deleted");
      setDeleting(null);
      if (items.length === 1 && page > 1) setFilters((f) => ({ ...f, page: f.page - 1 }));
    } else toast.error(res.payload);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Products</h2>
          <p className="text-sm text-slate-500">{total} products</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={exportCsv}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-slate-300 hover:bg-slate-50"
          >
            <Download className="w-4 h-4" /> Export CSV
          </button>
          {user?.role === "admin" && (
            <button
              onClick={() => { setEditing(null); setModalOpen(true); }}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4" /> Add Product
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            placeholder="Search by name or SKU"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-indigo-500 outline-none"
          />
        </div>
        <select
          value={filters.category}
          onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value, page: 1 }))}
          className="px-3 py-2 text-sm rounded-lg border border-slate-300"
        >
          <option value="">All categories</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </select>
        <select
          value={filters.supplier}
          onChange={(e) => setFilters((f) => ({ ...f, supplier: e.target.value, page: 1 }))}
          className="px-3 py-2 text-sm rounded-lg border border-slate-300"
        >
          <option value="">All suppliers</option>
          {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
        <select
          value={filters.stock}
          onChange={(e) => setFilters((f) => ({ ...f, stock: e.target.value, page: 1 }))}
          className="px-3 py-2 text-sm rounded-lg border border-slate-300"
        >
          <option value="">All stock</option>
          <option value="in">In stock</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
        </select>
        <select
          value={filters.sort}
          onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value, page: 1 }))}
          className="px-3 py-2 text-sm rounded-lg border border-slate-300"
        >
          <option value="-createdAt">Newest</option>
          <option value="name">Name A-Z</option>
          <option value="-name">Name Z-A</option>
          <option value="quantity">Qty low-high</option>
          <option value="-quantity">Qty high-low</option>
          <option value="sellingPrice">Price low-high</option>
          <option value="-sellingPrice">Price high-low</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
              <tr>
                <th className="text-left px-4 py-3">Product</th>
                <th className="text-left px-4 py-3">Category</th>
                <th className="text-left px-4 py-3">Supplier</th>
                <th className="text-right px-4 py-3">Qty</th>
                <th className="text-right px-4 py-3">Cost / Price</th>
                <th className="text-right px-4 py-3">Value</th>
                <th className="text-center px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}><td colSpan={8} className="px-4 py-3">
                    <div className="h-4 bg-slate-100 rounded animate-pulse" />
                  </td></tr>
                ))
              ) : items.length === 0 ? (
                <tr><td colSpan={8}>
                  <EmptyState title="No products found" subtitle="Try different filters or add a product" />
                </td></tr>
              ) : (
                items.map((p) => {
                  const status = stockStatus(p);
                  const bg = status === "low" ? "bg-orange-50/50" : status === "out" ? "bg-red-50/50" : "";
                  return (
                    <tr key={p._id} className={`hover:bg-slate-50 ${bg}`}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800">{p.name}</div>
                        <div className="text-xs text-slate-400">{p.sku}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{p.category?.name || "—"}</td>
                      <td className="px-4 py-3 text-slate-600">{p.supplier?.name || "—"}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{p.quantity} {p.unit}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="text-slate-700">{money(p.costPrice)}</div>
                        <div className="text-xs text-slate-400">{money(p.sellingPrice)}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-medium">{money(p.quantity * p.costPrice)}</td>
                      <td className="px-4 py-3 text-center"><StockBadge product={p} /></td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            onClick={() => setStockFor(p)}
                            title="Stock"
                            className="p-1.5 hover:bg-slate-100 rounded"
                          >
                            <ArrowLeftRight className="w-4 h-4 text-indigo-600" />
                          </button>
                          {user?.role === "admin" && (
                            <>
                              <button
                                onClick={() => { setEditing(p); setModalOpen(true); }}
                                className="p-1.5 hover:bg-slate-100 rounded"
                              >
                                <Edit className="w-4 h-4 text-slate-600" />
                              </button>
                              <button
                                onClick={() => setDeleting(p)}
                                className="p-1.5 hover:bg-slate-100 rounded"
                              >
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination page={page} pages={pages} total={total} onPage={(n) => setFilters((f) => ({ ...f, page: n }))} />

      <ProductForm
        open={modalOpen}
        product={editing}
        categories={categories}
        suppliers={suppliers}
        saving={saving}
        onClose={() => setModalOpen(false)}
        onSaved={() => dispatch(fetchProducts(filters))}
      />

      <StockModal
        product={stockFor}
        onClose={() => setStockFor(null)}
        onSaved={() => dispatch(fetchProducts(filters))}
      />

      <ConfirmDialog
        open={!!deleting}
        title={`Delete ${deleting?.name}?`}
        message="This can't be undone."
        onCancel={() => setDeleting(null)}
        onConfirm={onDelete}
        saving={saving}
      />
    </div>
  );
}

function ProductForm({ open, product, categories, suppliers, saving, onClose, onSaved }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState({});
  const isEdit = !!product;

  useEffect(() => {
    if (open) {
      setForm(
        product
          ? { ...product, category: product.category?._id, supplier: product.supplier?._id }
          : {
              name: "", sku: "", description: "", category: "", supplier: "",
              unit: "pcs", costPrice: 0, sellingPrice: 0, quantity: 0, reorderLevel: 10,
            }
      );
    }
  }, [open, product]);

  const submit = async (e) => {
    e.preventDefault();
    const body = { ...form };
    const res = isEdit
      ? await dispatch(updateProduct({ id: product._id, body }))
      : await dispatch(createProduct(body));
    if (createProduct.fulfilled.match(res) || updateProduct.fulfilled.match(res)) {
      toast.success(isEdit ? "Product updated" : "Product added");
      onClose();
      onSaved();
    } else toast.error(res.payload);
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  const num = (k) => (e) => setForm({ ...form, [k]: Number(e.target.value) });

  if (!open) return null;

  return (
    <Modal open={open} title={isEdit ? "Edit Product" : "Add Product"} onClose={onClose}>
      <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
        <Input label="Name" value={form.name || ""} onChange={set("name")} required />
        <Input
          label="SKU"
          value={form.sku || ""}
          onChange={(e) => setForm({ ...form, sku: e.target.value.toUpperCase() })}
          required
        />
        <Select label="Category" value={form.category || ""} onChange={set("category")} required>
          <option value="">Select category</option>
          {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
        </Select>
        <Select label="Supplier" value={form.supplier || ""} onChange={set("supplier")}>
          <option value="">None</option>
          {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
        </Select>
        <Select label="Unit" value={form.unit || "pcs"} onChange={set("unit")}>
          {["pcs", "box", "kg", "g", "litre", "ml", "pack", "dozen"].map((u) => (
            <option key={u}>{u}</option>
          ))}
        </Select>
        <Input label="Cost price" type="number" min="0" value={form.costPrice ?? 0} onChange={num("costPrice")} required />
        <Input label="Selling price" type="number" min="0" value={form.sellingPrice ?? 0} onChange={num("sellingPrice")} required />
        {!isEdit && (
          <Input label="Opening quantity" type="number" min="0" value={form.quantity ?? 0} onChange={num("quantity")} />
        )}
        <Input label="Reorder level" type="number" min="0" value={form.reorderLevel ?? 10} onChange={num("reorderLevel")} />
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
          <textarea
            value={form.description || ""}
            onChange={set("description")}
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none"
          />
        </div>
        {isEdit && (
          <p className="sm:col-span-2 text-xs text-slate-400">
            To change quantity, use Stock In / Out.
          </p>
        )}
        <div className="sm:col-span-2 flex justify-end gap-2 mt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-300 text-sm">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : isEdit ? "Save changes" : "Add Product"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function Input({ label, ...rest }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input
        {...rest}
        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none"
      />
    </div>
  );
}

function Select({ label, children, ...rest }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <select
        {...rest}
        className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none"
      >
        {children}
      </select>
    </div>
  );
}

function StockModal({ product, onClose, onSaved }) {
  const dispatch = useDispatch();
  const saving = useSelector((s) => s.stock.saving);
  const [type, setType] = useState("IN");
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");

  useEffect(() => {
    if (product) { setType("IN"); setQty(1); setNote(""); }
  }, [product]);

  if (!product) return null;

  const after = type === "IN" ? product.quantity + qty : type === "OUT" ? product.quantity - qty : qty;
  const invalid = type === "OUT" && after < 0;

  const submit = async (e) => {
    e.preventDefault();
    if (invalid) return toast.error(`Only ${product.quantity} available`);
    if (type === "ADJUST" && !note.trim()) return toast.error("Please give a reason");

    const res = await dispatch(
      createMovement({ productId: product._id, type, quantity: qty, note })
    );
    if (createMovement.fulfilled.match(res)) {
      dispatch(setQuantity(res.payload.product));
      toast.success(`Stock updated: ${product.name} now ${res.payload.product.quantity} ${product.unit}`);
      onClose();
      onSaved();
    } else toast.error(res.payload);
  };

  return (
    <Modal open={!!product} title={`Stock movement — ${product.name}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <div className="flex gap-2">
          {["IN", "OUT", "ADJUST"].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border ${
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

        <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600">
          Current stock: <span className="font-semibold text-slate-800">{product.quantity} {product.unit}</span> · Reorder at {product.reorderLevel}
        </div>

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
        </div>

        <div className={`text-sm ${invalid ? "text-red-600" : "text-slate-500"}`}>
          {invalid
            ? `Only ${product.quantity} available`
            : `${product.quantity} → ${after}${type === "ADJUST" ? ` (${after - product.quantity >= 0 ? "+" : ""}${after - product.quantity})` : ""}`}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Note {type === "ADJUST" && <span className="text-red-500">*</span>}
          </label>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={
              type === "IN" ? "Invoice no. / supplier" :
              type === "OUT" ? "Order no. / reason" :
              "Why is it different?"
            }
            className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none"
          />
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-slate-300 text-sm">
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