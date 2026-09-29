import { NavLink } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Package, ArrowLeftRight, Tags, Truck, Users, LogOut, Box,
} from "lucide-react";
import { logout } from "../features/auth/authSlice";

const linkCls = ({ isActive }) =>
  `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${
    isActive ? "bg-indigo-600 text-white" : "text-slate-300 hover:bg-slate-800 hover:text-white"
  }`;

export default function Sidebar({ onNavigate }) {
  const { user } = useSelector((s) => s.auth);
  const dispatch = useDispatch();
  const nav = useNavigate();

  const handleLogout = () => {
    dispatch(logout());
    nav("/login");
  };

  const links = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/products", label: "Products", icon: Package },
    { to: "/stock", label: "Stock", icon: ArrowLeftRight },
    { to: "/categories", label: "Categories", icon: Tags },
    { to: "/suppliers", label: "Suppliers", icon: Truck },
  ];
  if (user?.role === "admin") links.push({ to: "/users", label: "Users", icon: Users });

  return (
    <aside className="w-60 bg-slate-900 text-white flex flex-col h-full">
      <div className="flex items-center gap-2 px-5 py-5 border-b border-slate-800">
        <Box className="w-6 h-6 text-indigo-400" />
        <span className="font-bold text-lg">StockDesk</span>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.to === "/"} className={linkCls} onClick={onNavigate}>
            <l.icon className="w-5 h-5" />
            {l.label}
          </NavLink>
        ))}
      </nav>
      <button
        onClick={handleLogout}
        className="flex items-center gap-3 m-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-red-600 hover:text-white"
      >
        <LogOut className="w-5 h-5" />
        Logout
      </button>
    </aside>
  );
}