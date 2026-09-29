import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="h-screen flex">
      <div className="hidden md:block">
        <Sidebar />
      </div>

      {open && (
        <>
          <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setOpen(false)} />
          <div className="fixed left-0 top-0 bottom-0 z-40 md:hidden">
            <Sidebar onNavigate={() => setOpen(false)} />
          </div>
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onMenu={() => setOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}