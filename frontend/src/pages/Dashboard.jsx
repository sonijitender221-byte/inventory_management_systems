import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  Package, Layers, IndianRupee, AlertTriangle, XCircle, TrendingUp,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";
import { fetchDashboard } from "../features/dashboard/dashboardSlice";
import Spinner from "../components/Spinner";
import { money, date } from "../utils/format";

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#06b6d4", "#a855f7"];

export default function Dashboard() {
  const dispatch = useDispatch();
  const { data, loading } = useSelector((s) => s.dashboard);

  useEffect(() => { dispatch(fetchDashboard()); document.title = "Dashboard · StockDesk"; }, [dispatch]);

  if (loading || !data) return <Spinner full />;

  const s = data.summary;
  const stats = [
    { label: "Total Products", value: s.totalProducts, icon: Package, color: "bg-blue-100 text-blue-600", to: "/products" },
    { label: "Units in Stock", value: s.totalUnits, icon: Layers, color: "bg-indigo-100 text-indigo-600", to: "/products" },
    { label: "Stock Value", value: money(s.stockValue), icon: IndianRupee, color: "bg-green-100 text-green-600", to: "/products" },
    { label: "Low Stock", value: s.lowStock, icon: AlertTriangle, color: "bg-orange-100 text-orange-600", to: "/products?stock=low" },
    { label: "Out of Stock", value: s.outOfStock, icon: XCircle, color: "bg-red-100 text-red-600", to: "/products?stock=out" },
  ];

  const days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const key = d.toLocaleDateString("en-CA");
    const find = (type) => data.last7Days.find((x) => x._id.day === key && x._id.type === type)?.qty || 0;
    return { day: d.toLocaleDateString("en-IN", { weekday: "short" }), In: find("IN"), Out: find("OUT") };
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {stats.map((c) => (
          <Link
            key={c.label}
            to={c.to}
            className="bg-white rounded-xl border border-slate-200 p-4 hover:shadow-md transition"
          >
            <div className={`w-9 h-9 rounded-lg ${c.color} flex items-center justify-center mb-3`}>
              <c.icon className="w-5 h-5" />
            </div>
            <div className="text-xl font-bold text-slate-800">{c.value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{c.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Stock In vs Out (last 7 days)
          </h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={days}>
              <XAxis dataKey="day" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar dataKey="In" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Out" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-4">Stock value by category</h3>
          {data.byCategory.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-16">No data yet</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={data.byCategory} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100}>
                  {data.byCategory.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => money(v)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-3">Running low</h3>
          {data.lowStockItems.length === 0 ? (
            <p className="text-sm text-green-600 py-4">✓ All stocked up</p>
          ) : (
            <ul className="divide-y">
              {data.lowStockItems.map((p) => (
                <li key={p._id} className="py-2.5 flex justify-between items-center text-sm">
                  <div>
                    <div className="font-medium text-slate-800">{p.name}</div>
                    <div className="text-xs text-slate-500">{p.sku}</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-semibold ${p.quantity === 0 ? "text-red-600" : "text-orange-600"}`}>
                      {p.quantity} {p.unit}
                    </div>
                    <div className="text-xs text-slate-400">reorder at {p.reorderLevel}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-800">Recent activity</h3>
            <Link to="/stock" className="text-xs text-indigo-600 hover:underline">View all</Link>
          </div>
          {data.recent.length === 0 ? (
            <p className="text-sm text-slate-400 py-4">No activity yet</p>
          ) : (
            <ul className="divide-y">
              {data.recent.map((m) => (
                <li key={m._id} className="py-2.5 flex items-start gap-3 text-sm">
                  <span
                    className={`mt-1 w-2 h-2 rounded-full shrink-0 ${
                      m.type === "IN" ? "bg-green-500" : m.type === "OUT" ? "bg-red-500" : "bg-blue-500"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-slate-800 truncate">
                      <span className="font-medium">{m.user?.name || "?"}</span>{" "}
                      {m.type === "IN" ? "added" : m.type === "OUT" ? "removed" : "adjusted"}{" "}
                      <span className="font-medium">{m.quantity}</span> × {m.productName}
                    </div>
                    <div className="text-xs text-slate-400">{date(m.createdAt)}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}