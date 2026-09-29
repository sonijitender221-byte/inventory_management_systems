import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Box } from "lucide-react";
import toast from "react-hot-toast";
import { setupAdmin, checkSetup } from "../features/auth/authSlice";

export default function Setup() {
  const dispatch = useDispatch();
  const nav = useNavigate();
  const { needsSetup } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => { dispatch(checkSetup()); document.title = "Setup · StockDesk"; }, [dispatch]);
  useEffect(() => {
    if (needsSetup === false) nav("/login", { replace: true });
  }, [needsSetup, nav]);

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error("Passwords do not match");
    if (form.password.length < 6) return toast.error("Password must be at least 6 characters");
    setSaving(true);
    const res = await dispatch(
      setupAdmin({ name: form.name, email: form.email, password: form.password })
    );
    setSaving(false);
    if (setupAdmin.fulfilled.match(res)) {
      toast.success("Admin account created!");
      nav("/");
    } else {
      toast.error(res.payload || "Setup failed");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center mb-3">
            <Box className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Create your admin account</h1>
          <p className="text-sm text-slate-500 mt-1 text-center">
            This is a fresh install. The account you create here will be the admin.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {["name", "email", "password", "confirm"].map((f) => (
            <div key={f}>
              <label className="block text-sm font-medium text-slate-700 mb-1 capitalize">
                {f === "confirm" ? "Confirm password" : f}
              </label>
              <input
                type={f.includes("password") || f === "confirm" ? "password" : f === "email" ? "email" : "text"}
                required
                value={form[f]}
                onChange={(e) => setForm({ ...form, [f]: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
              />
            </div>
          ))}
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create admin account"}
          </button>
        </form>
      </div>
    </div>
  );
}