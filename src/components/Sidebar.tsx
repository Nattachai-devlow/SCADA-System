"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUserRole } from "@/hooks/useUserRole";

const BASE_MENU_ITEMS = [
  { name: "ภาพรวมระบบ", sub: "Overview", path: "/dashboard", icon: "📊" },
  { name: "P&ID SCADA", sub: "Live Diagram", path: "/dashboard/scada", icon: "🗺️" },
  { name: "เครื่องจักร", sub: "Machine Master", path: "/dashboard/machines", icon: "⚙️" },
  { name: "สถานะ Alarm", sub: "Alarms", path: "/dashboard/alarms", icon: "🚨" },
  { name: "บันทึกซ่อมบำรุง", sub: "Maintenance", path: "/dashboard/maintenance", icon: "🔧" },
];

const ADMIN_MENU_ITEM = {
  name: "จัดการสิทธิ์ผู้ใช้",
  sub: "User Access",
  path: "/dashboard/users",
  icon: "👑",
};

export default function Sidebar() {
  const pathname = usePathname();
  const { isAdmin, role, loading: roleLoading } = useUserRole();
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = isAdmin
    ? [...BASE_MENU_ITEMS, ADMIN_MENU_ITEM]
    : BASE_MENU_ITEMS;

  const roleLabel = roleLoading
    ? "กำลังโหลด..."
    : role === "admin"
      ? "ผู้ดูแลระบบ"
      : role === "technician"
        ? "ช่างเทคนิค"
        : "ยังไม่อนุมัติ";

  return (
    <>
      {/* ปุ่มเปิดเมนูสำหรับมือถือ */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="เปิดเมนู"
        className="lg:hidden fixed top-4 left-4 z-50 h-10 w-10 flex items-center justify-center rounded-xl bg-zinc-900/90 text-white shadow-lg shadow-zinc-900/20 backdrop-blur transition active:scale-95"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      {/* ฉากพื้นหลังเข้ม กดเพื่อปิดเมนู */}
      <div
        onClick={() => setMobileOpen(false)}
        className={`lg:hidden fixed inset-0 z-40 bg-zinc-950/60 backdrop-blur-sm transition-opacity duration-300 ${
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 flex flex-col justify-between overflow-y-auto bg-gradient-to-b from-zinc-950 via-slate-900 to-zinc-950 px-4 py-6 transition-transform duration-300 ease-out lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* แสงฟ้าจาง ๆ ที่มุมบน ทำให้พื้นที่มีมิติ */}
        <div className="pointer-events-none absolute -top-24 -right-16 h-64 w-64 rounded-full bg-sky-500/20 blur-3xl" />

        <div className="relative">
          {/* Brand */}
          <div className="nav-brand mb-8 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 text-lg shadow-lg shadow-sky-500/25">
                ⚙️
              </div>
              <div className="min-w-0">
                <h1 className="truncate bg-gradient-to-r from-white to-sky-200 bg-clip-text text-base font-bold tracking-wide text-transparent">
                  SCADA System
                </h1>
                <p className="truncate font-mono text-[10px] text-slate-400">
                  Water Circulation Control
                </p>
              </div>
            </div>
          </div>

          {/* เมนู */}
          <nav className="space-y-1.5">
            {menuItems.map((item, index) => {
              const isActive = pathname === item.path;

              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setMobileOpen(false)}
                  style={{ animationDelay: `${index * 55}ms` }}
                  className={`nav-item-in nav-item group relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-3 transition-colors duration-200 ${
                    isActive
                      ? "nav-item-active bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-lg shadow-sky-500/25"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                  }`}
                >
                  {/* แถบเน้นด้านซ้าย ยืดขึ้นเมื่อเมนูถูกเลือก */}
                  <span
                    className="nav-accent absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-white/90"
                  />

                  <span
                    className={`nav-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base ${
                      isActive
                        ? "bg-white/20"
                        : "bg-white/5 group-hover:bg-white/10"
                    }`}
                  >
                    {item.icon}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold leading-tight">
                      {item.name}
                    </span>
                    <span
                      className={`block truncate text-[10px] leading-tight ${
                        isActive ? "text-white/75" : "text-slate-500"
                      }`}
                    >
                      {item.sub}
                    </span>
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* สถานะระบบ */}
        <div className="relative mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-2.5">
            <span className="nav-status-ping h-2 w-2 rounded-full bg-emerald-400 text-emerald-400" />
            <span className="text-xs font-semibold text-slate-100">
              System Online
            </span>
          </div>
          <p className="mt-2 font-mono text-[10px] text-slate-400">
            Role: {roleLabel}
          </p>
        </div>
      </aside>
    </>
  );
}
