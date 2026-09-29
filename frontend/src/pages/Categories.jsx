import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Plus, Edit, Trash2, Tags } from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchCategories, createCategory, updateCategory, deleteCategory,
} from "../features/categories/categorySlice";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";

export default function Categories() {
  const dispatch = useDispatch();
  const nav = useNavigate();
  const { items, loading, saving } = useSelector((s) => s.categories);
  const { user } = useSelector((s) => s.auth);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });

  useEffect(() => { dispatch(fetchCategories()); document.title = "Categories · StockDesk"; }, [dispatch]);

  const openAdd = () => { setEditing(null); setForm({ name: "", description: "" }); setOpen(true); };
  const openEdit = (c) => { setEditing(c); setForm({ name: c.name, description: c.description }); setOpen(true); };

  const submit = async (e) => {
    e.preventDefault();
    const res = editing
      ? await dispatch(updateCategory({ id: editing._id, body: form }))
      : await dispatch(createCategory(form));
    if (createCategory.fulfilled.match(res) || updateCategory.fulfilled.match(res)) {
      toast.success(editing ? "Category updated" : "Category added");
      setOpen(false);
      dispatch(fetchCategories());
    } else toast.error(res.payload);
  };

  const onDelete = async () => {
    const res = await dispatch(deleteCategory(deleting._id));
    if (deleteCategory.fulfilled.match(res)) {
      toast.success("Category deleted");
      setDeleting(null);
    } else {
      toast.error(res.payload);
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Categories</h2>
          <p className="text-sm text-slate-500">{items.length} categories</p>
        </div>
        {user?.role === "admin" && (
          <button onClick={openAdd} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700">
            <Plus className="w-4 h-4" /> Add Category
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-10 text-slate-400">Loading...</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200">
          <EmptyState icon={Tags} title="No categories yet" subtitle="Add your first category to organize products" />
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((c) => (
            <div
              key={c._id}
              onClick={() => nav(`/products?category=${c._id}`)}
              className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md cursor-pointer transition group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-800">{c.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{c.description || "No description"}</p>
                  <p className="text-xs text-slate-400 mt-2">{c.productCount} products</p>
                </div>
                {user?.role === "admin" && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={(e) => { e.stopPropagation(); openEdit(c); }}
                      className="p-1.5 hover:bg-slate-100 rounded"
                    >
                      <Edit className="w-4 h-4 text-slate-600" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleting(c); }}
                      className="p-1.5 hover:bg-slate-100 rounded"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={open} title={editing ? "Edit Category" : "Add Category"} onClose={() => setOpen(false)}>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setOpen(false)} className="px-4 py-2 rounded-lg border border-slate-300 text-sm">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium disabled:opacity-50">
              {saving ? "Saving..." : editing ? "Save" : "Add"}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title={`Delete ${deleting?.name}?`}
        message="This can't be undone. Categories with products cannot be deleted."
        onCancel={() => setDeleting(null)}
        onConfirm={onDelete}
        saving={saving}
      />
    </div>
  );
}