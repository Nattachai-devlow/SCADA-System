"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { logAuditEvent } from "@/lib/audit";

/** ชื่อหน้าแบบอ่านเข้าใจได้ สำหรับบันทึกใน metadata ของ PAGE_VIEW */
const PAGE_LABELS: Record<string, string> = {
  "/dashboard": "ภาพรวมระบบ (Overview)",
  "/dashboard/scada": "P&ID SCADA (Live Diagram)",
  "/dashboard/machines": "เครื่องจักร (Machine Master)",
  "/dashboard/alarms": "สถานะ Alarm",
  "/dashboard/maintenance": "บันทึกซ่อมบำรุง",
  "/dashboard/machine-history": "ประวัติเครื่องจักร",
  "/dashboard/users": "จัดการสิทธิ์ผู้ใช้",
  "/dashboard/audit-logs": "Audit Logs",
};

/**
 * บันทึกการเปิดหน้าในโซน /dashboard ทุกครั้งที่เปลี่ยนเส้นทาง
 *
 * แปะไว้ใน dashboard layout ตัวเดียว ก็เก็บครบทุกหน้า
 * ล้มเหลวแบบเงียบเสมอ เพื่อไม่ให้กระทบการใช้งาน
 */
export default function PageViewLogger() {
  const pathname = usePathname();
  const lastLogged = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || lastLogged.current === pathname) return;
    lastLogged.current = pathname;

    void logAuditEvent({
      code: "PAGE_VIEW",
      category: "app",
      message: `เปิดหน้า ${PAGE_LABELS[pathname] ?? pathname}`,
      metadata: {
        path: pathname,
        page: PAGE_LABELS[pathname] ?? null,
        referrer: typeof document !== "undefined" ? document.referrer || null : null,
      },
    });
  }, [pathname]);

  return null;
}
