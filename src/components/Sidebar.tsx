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
        className="lg:hidden fixed top-4 left-4 z-50 flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm transition hover:bg-zinc-50 active:scale-95 dark:border-zinc-700 dark:hover:bg-zinc-800"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" stroke="currentColor" strokeWidth={1.75}>
          <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      {/* ฉากพื้นหลังเข้ม กดเพื่อปิดเมนู */}
      <div
        onClick={() => setMobileOpen(false)}
        className={`fixed inset-0 z-40 bg-zinc-900/20 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col justify-between overflow-y-auto border-r border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-6 transition-transform duration-300 ease-out lg:translate-x-0 dark:border-zinc-800 dark:bg-zinc-950 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          {/* Brand */}
          <div className="nav-brand mb-8 flex items-center gap-3 rounded-xl px-2 py-2">
            <div className="nav-logo flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
              {/* next/image ไม่รองรับไฟล์ .ico จึงต้องใช้ img ตรง ๆ */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/favicon.ico"
                alt="SCADA System"
                className="h-7 w-7 object-contain"
              />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-[15px] font-bold tracking-wide text-zinc-900 dark:text-zinc-100 dark:text-zinc-50">
                SCADA System
              </h1>
              <p className="truncate font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
                Water Circulation Control
              </p>
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
                  className={`nav-item-in nav-item group relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 transition-colors duration-200 ${
                    isActive
                      ? "nav-item-active bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  }`}
                >
                  {/* แถบเน้นด้านซ้าย ยืดขึ้นเมื่อเมนูถูกเลือก */}
                  <span
                    className={`nav-accent absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full ${
                      isActive ? "bg-white dark:bg-zinc-900" : "bg-zinc-900 dark:bg-zinc-300"
                    }`}
                  />

                  <span
                    className={`nav-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base ${
                      isActive
                        ? "bg-white/10 dark:bg-zinc-900/10"
                        : "bg-zinc-100 group-hover:bg-zinc-200 dark:bg-zinc-800 dark:group-hover:bg-zinc-700"
                    }`}
                  >
                    {item.icon}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px] font-semibold leading-tight">
                      {item.name}
                    </span>
                    <span className="block truncate font-mono text-[10px] leading-tight text-zinc-400 dark:text-zinc-500">
                      {item.sub}
                    </span>
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* สถานะระบบ */}
        <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center gap-2.5">
            <span className="nav-status-ping h-2 w-2 rounded-full bg-zinc-900 text-zinc-900 dark:text-zinc-100" />
            <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
              System Online
            </span>
          </div>
          <p className="mt-2 font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
            Role: {roleLabel}
          </p>
        </div>
      </aside>
    </>
  );
}
