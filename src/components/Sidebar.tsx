"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function Sidebar() {
  const pathname = usePathname();
  const [userRole, setUserRole] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    async function getUserRole() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .maybeSingle();

        if (error) {
          console.error("Error fetching user role:", error.message);
        }

        if (data && data.role) {
          // แปลงเป็นตัวพิมพ์เล็กทั้งหมดเพื่อป้องกันปัญหา Admin vs admin
          setUserRole(data.role.trim().toLowerCase());
        }
      }
    }

    getUserRole();
  }, [supabase]);

  // เมนูพื้นฐานสำหรับทุกคน
  const baseMenuItems = [
    { name: "ภาพรวมระบบ (Overview)", path: "/dashboard", icon: "📊" },
    { name: "P&ID SCADA Diagram", path: "/dashboard/scada", icon: "🗺️" },
    { name: "Machine Master", path: "/dashboard/machines", icon: "⚙️" },
    { name: "จัดการสถานะ Alarm", path: "/dashboard/alarms", icon: "🚨" },
    { name: "บันทึกการซ่อมบำรุง", path: "/dashboard/maintenance", icon: "🔧" },
  ];

  // เช็คว่าเป็น admin หรือไม่ (รองรับพิมพ์เล็ก/พิมพ์ใหญ่)
  const isAdmin = userRole === "admin";

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
    <aside className="w-64 bg-slate-900 border-r border-slate-800 min-h-screen p-4 flex flex-col justify-between">
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="px-2 py-3 border-b border-slate-800">
          <h1 className="text-lg font-bold text-amber-400 tracking-wider">
            SCADA System
          </h1>
          <p className="text-[10px] text-slate-400 font-mono">
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
                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
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
      <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-[11px] text-slate-400">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold text-slate-300">System Online</span>
        </div>
        <p className="text-[10px] font-mono text-slate-400">
          Role: {userRole ? userRole : "Loading..."}
        </p>
      </div>
    </aside>
  );
}
