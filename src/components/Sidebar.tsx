"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUserRole } from "@/hooks/useUserRole";

export default function Sidebar() {
  const pathname = usePathname();
  const { isAdmin, role, loading: roleLoading } = useUserRole();

  // เมนูพื้นฐานสำหรับทุกคน
  const baseMenuItems = [
    { name: "ภาพรวมระบบ (Overview)", path: "/dashboard", icon: "📊" },
    { name: "P&ID SCADA Diagram", path: "/dashboard/scada", icon: "🗺️" },
    { name: "Machine Master", path: "/dashboard/machines", icon: "⚙️" },
    { name: "จัดการสถานะ Alarm", path: "/dashboard/alarms", icon: "🚨" },
    { name: "บันทึกการซ่อมบำรุง", path: "/dashboard/maintenance", icon: "🔧" },
  ];

  const menuItems = isAdmin
    ? [
        ...baseMenuItems,
        {
          name: "จัดการสิทธิ์ผู้ใช้งาน",
          path: "/dashboard/users",
          icon: "👑",
        },
      ]
    : baseMenuItems;

  return (
    <aside className="w-64 bg-white border-r border-zinc-200 min-h-screen p-4 flex flex-col justify-between">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="px-2 py-3 border-b border-zinc-200">
          <h1 className="text-lg font-bold text-zinc-900 tracking-wider">
            SCADA System
          </h1>
          <p className="text-[10px] text-zinc-600 font-mono">
            Water Circulation Control
          </p>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                  isActive
                    ? "bg-zinc-900 text-white border border-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-100/60 hover:text-zinc-800"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer System Status */}
      <div className="p-3 bg-zinc-50/60 border border-zinc-200/80 rounded-xl text-[11px] text-zinc-600">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-zinc-700">System Online</span>
        </div>
        <p className="text-[10px] font-mono text-zinc-600">
          Role: {roleLoading ? "Loading..." : (role ?? "unknown")}
        </p>
      </div>
    </aside>
  );
}
