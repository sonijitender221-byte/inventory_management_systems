import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { Menu } from "lucide-react";

const titles = {
  "/": "Dashboard",
  "/products": "Products",
  "/stock": "Stock Movements",
  "/categories": "Categories",
  "/suppliers": "Suppliers",
  "/users": "Users",
};

export default function Topbar({ onMenu }) {
  const { user } = useSelector((s) => s.auth);
  const { pathname } = useLocation();
  const title = titles[pathname] || "StockDesk";

  return (
    <header className="h-14 bg-white border-b flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <button className="md:hidden p-1 hover:bg-slate-100 rounded" onClick={onMenu}>
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="font-semibold text-slate-800">{title}</h1>
      </div>
      {user && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-600 hidden sm:inline">{user.name}</span>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              user.role === "admin" ? "bg-purple-100 text-purple-700" : "bg-slate-100 text-slate-600"
            }`}
          >
            {user.role === "admin" ? "Admin" : "Staff"}
          </span>
        </div>
      )}
    </header>
  );
}