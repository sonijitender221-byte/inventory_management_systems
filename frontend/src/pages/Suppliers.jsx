import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus, Edit, Trash2, Search } from "lucide-react";
import toast from "react-hot-toast";
import {
  fetchSuppliers, createSupplier, updateSupplier, deleteSupplier,
} from "../features/suppliers/supplierSlice";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";

export default function Suppliers() {
  const dispatch = useDispatch();
  const { items, loading, saving } = useSelector((s) => s.suppliers);
  const { user } = useSelector((s) => s.auth);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [form, setForm] = useState({ name: "", contactPerson: "", phone: "", email: "", address: "" });
  const [search, setSearch] = useState("");

  useEffect(() => { dispatch(fetchSuppliers()); document.title = "Suppliers · StockDesk"; }, [dispatch]);

  const openAdd = () => { setEditing(null); setForm({ name: "", contactPerson: "", phone: "", email: "", address: "" }); setOpen(true); };
  const openEdit = (s) => { setEditing(s); setForm(s); setOpen(true); };

  const submit = async (e) => {
    e.preventDefault();
    const res = editing
      ? await dispatch(updateSupplier({ id: editing._id, body: form }))
      : await dispatch(createSupplier(form));
    if (createSupplier.fulfilled.match(res) || updateSupplier.fulfilled.match(res)) {
      toast.success(editing ? "Supplier updated" : "Supplier added");
      setOpen(false);
    } else toast.error(res.payload);
  };

  const onDelete = async () => {
    const res = await dispatch(deleteSupplier(deleting._id));
    if (deleteSupplier.fulfilled.match(res)) {
      toast.success("Supplier deleted");
      setDeleting(null);
    } else { toast.error(res.payload); setDeleting(null); }
  };

  const filtered = items.filter((s) =>
    [s.name, s.contactPerson, s.email, s.phone].join(" ").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Suppliers</h2>
          <p className="text-sm text-slate-500">{items.length} suppliers</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search suppliers"
              className="pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300"
            />
          </div>
          {user?.role === "admin" && (
            <button onClick={openAdd} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700">
              <Plus className="w-4 h-4" /> Add Supplier
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-3">Name</th>
              <th className="text-left px-4 py-3">Contact</th>
              <th className="text-left px-4 py-3">Phone</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Address</th>
              {user?.role === "admin" && <th className="text-right px-4 py-3">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y">
            {loading ? (
              <tr><td colSpan={6} className="text-center py-10 text-slate-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-10 text-slate-400">No suppliers</td></tr>
            ) : filtered.map((s) => (
              <tr key={s._id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium text-slate-800">{s.name}</td>
                <td className="px-4 py-3 text-slate-600">{s.contactPerson || "—"}</td>
                <td className="px-4 py-3">
                  {s.phone ? <a href={`tel:${s.phone}`} className="text-indigo-600 hover:underline">{s.phone}</a> : "—"}
                </td>
                <td className="px-4 py-3">
                  {s.email ? <a href={`mailto:${s.email}`} className="text-indigo-600 hover:underline">{s.email}</a> : "—"}
                </td>
                <td className="px-4 py-3 text-slate-600">{s.address || "—"}</td>
                {user?.role === "admin" && (
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(s)} className="p-1.5 hover:bg-slate-100 rounded">
                        <Edit className="w-4 h-4 text-slate-600" />
                      </button>
                      <button onClick={() => setDeleting(s)} className="p-1.5 hover:bg-slate-100 rounded">
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={open} title={editing ? "Edit Supplier" : "Add Supplier"} onClose={() => setOpen(false)}>
        <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4">
          {[
            ["name", "Name", true],
            ["contactPerson", "Contact person"],
            ["phone", "Phone"],
            ["email", "Email"],
          ].map(([k, l, req]) => (
            <div key={k}>
              <label className="block text-sm font-medium text-slate-700 mb-1">{l}</label>
              <input
                value={form[k] || ""}
                onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                required={!!req}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none"
              />
            </div>
          ))}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Address</label>
            <textarea
              value={form.address || ""}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 outline-none"
            />
          </div>
          <div className="sm:col-span-2 flex justify-end gap-2">
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
        message="This can't be undone."
        onCancel={() => setDeleting(null)}
        onConfirm={onDelete}
        saving={saving}
      />
    </div>
  );
}