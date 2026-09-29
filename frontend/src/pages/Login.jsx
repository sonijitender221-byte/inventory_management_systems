import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Box } from "lucide-react";
import toast from "react-hot-toast";
import { login, checkSetup } from "../features/auth/authSlice";

export default function Login() {
  const dispatch = useDispatch();
  const nav = useNavigate();
  const { user, loading, error, needsSetup } = useSelector((s) => s.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);

  useEffect(() => {
    dispatch(checkSetup());
  }, [dispatch]);

  useEffect(() => {
    if (user) nav("/", { replace: true });
  }, [user, nav]);

  useEffect(() => {
    if (needsSetup) nav("/setup", { replace: true });
  }, [needsSetup, nav]);

  useEffect(() => {
    document.title = "Login · StockDesk";
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    const res = await dispatch(login({ email, password }));
    if (login.fulfilled.match(res)) {
      toast.success("Welcome back!");
      nav("/");
    } else {
      toast.error(res.payload || "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center mb-3">
            <Box className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">StockDesk</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to manage your inventory</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm px-3 py-2 rounded-lg mb-4">{error}</div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
              placeholder="you@shop.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <div className="relative">
              <input
                type={show ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 rounded-lg border border-slate-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShow(!show)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              >
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-sm text-center text-slate-500 mt-6">
  Don't have an account?{" "}
  <Link to="/register" className="text-indigo-600 font-medium hover:underline">
    Register
  </Link>
</p>
      </div>
    </div>
  );
}