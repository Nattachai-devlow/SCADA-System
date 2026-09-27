"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";

/**
 * ประตูกันไม่ให้เข้าถึง /dashboard โดยไม่ผ่านการอนุมัติ
 *
 * - ไม่ได้ล็อกอิน        -> ส่งไป /login
 * - role เป็น pending   -> ส่งไป /pending (รอผู้ดูแลอนุมัติ)
 * - ไม่มี profile ตอนแรก -> ส่งไป /pending เช่นกัน (ปิดช่องโหว่แบบ fail-closed)
 * - admin / technician -> ผ่าน
 */
export default function DashboardGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const supabase = createClient();
  const { role, loading: roleLoading } = useUserRole();

  const [authLoading, setAuthLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setHasSession(Boolean(data.session));
      setAuthLoading(false);
    });

    return () => {
      active = false;
    };
  }, [supabase]);

  // เปลี่ยนเส้นทางหลังรู้ผลแล้วเท่านั้น ไม่ตัดสินตอน role ยังเป็น null
  useEffect(() => {
    if (authLoading || roleLoading) return;

    if (!hasSession) {
      router.replace("/login");
      return;
    }

    if (role === null || role === "pending") {
      router.replace("/pending");
    }
  }, [authLoading, roleLoading, hasSession, role, router]);

  if (authLoading || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">กำลังตรวจสอบสิทธิ์การเข้าใช้งาน...</p>
        </div>
      </div>
    );
  }

  // ยัง redirect ไม่เสร็จ หรือไม่มีสิทธิ์เข้า ไม่ต้อง render เนื้อหาออกไป
  if (!hasSession || role === null || role === "pending") {
    return null;
  }

  return <>{children}</>;
}
