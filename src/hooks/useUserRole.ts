"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type UserRole = "admin" | "technician" | "pending";

/**
 * ดึง role ของผู้ใช้ที่ล็อกอินอยู่
 *
 * คืน null ระหว่างที่ยังไม่ทราบ หน้าจอที่ต้องการกันสิทธิ์ควรรอให้โหลดเสร็จ
 * แล้วค่อยตัดสิน ไม่ควรตัดสินตอน role ยังเป็น null
 */
export function useUserRole() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    let active = true;

    async function loadRole() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;

      if (!user) {
        setRole(null);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (!active) return;

      if (data?.role) {
        // ทำให้ตัวพิมพ์เล็ก/ใหญ่ไม่มีผล ป้องกัน "Admin" ที่ตั้งใจเขียนต่างจาก "admin"
        setRole(data.role.trim().toLowerCase() as UserRole);
      }
      setLoading(false);
    }

    loadRole();

    return () => {
      active = false;
    };
  }, [supabase]);

  return {
    role,
    loading,
    isAdmin: role === "admin",
    isTechnician: role === "technician",
    /** true เมื่อโหลดเสร็จแล้วและไม่ใช่ admin — ใช้กันการเขียนข้อมูล */
    canManage: role === "admin",
  };
}
