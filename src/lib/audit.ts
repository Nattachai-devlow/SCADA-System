import { createClient } from "@/lib/supabase/client";

export type AuditRisk = "info" | "warning" | "critical";

export type AuditEventInput = {
  /** รหัส event เช่น PAGE_VIEW, AUTH_LOGIN, USER_ROLE_CHANGED */
  code: string;
  /** ข้อความสรุปที่อ่านเข้าใจได้ */
  message?: string;
  /** หมวดหมู่กว้าง ๆ: auth | app | data | security */
  category?: string;
  /** รายละเอียดเพิ่มเติม (path, record id, changed columns ฯลฯ) */
  metadata?: Record<string, unknown>;
  /**
   * กำหนดความเสี่ยงเองได้ แต่โดยปกติไม่ต้องส่ง
   * ฐานข้อมูลจะอนุมานจากรหัสผ่าน audit_event_risk() ให้เอง
   */
  risk?: AuditRisk;
};

/**
 * ตารางอ้างอิงความเสี่ยงของรหัส log ฝั่ง UI (ต้องตรงกับ audit_event_risk() ใน SQL)
 *
 * ใช้สำหรับ legend และแสดงผลเชิงคาดหมายก่อนที่ฐานข้อมูลจะตอบกลับ
 * ค่าจริงที่บันทึกยังคงมาจากฐานข้อมูลเสมอ
 */
export const AUDIT_RISK_BY_CODE: Record<string, AuditRisk> = {
  AUTH_LOGIN_FAILED: "critical",
  AUTH_LOCKOUT: "critical",
  AUTH_MFA_FAILED: "critical",
  PERMISSION_DENIED: "critical",
  UNAUTHORIZED_ACCESS: "critical",
  SECURITY_ALERT: "critical",
  CONFIG_CHANGED: "critical",
  RETENTION_CLEANUP: "critical",
  USER_DELETED: "critical",
  USER_ROLE_CHANGED: "critical",
  MACHINE_DELETED: "critical",
  ALARM_DELETED: "critical",
  MAINTENANCE_DELETED: "critical",

  AUTH_LOGIN: "warning",
  AUTH_LOGOUT: "warning",
  AUTH_SIGNUP: "warning",
  AUTH_SIGNUP_FAILED: "warning",
  AUTH_SESSION_REFRESH: "warning",
  AUTH_PASSWORD_RESET: "warning",
  AUTH_PASSWORD_CHANGED: "warning",
  USER_CREATED: "warning",
  USER_UPDATED: "warning",
  USER_APPROVED: "warning",
  MACHINE_CREATED: "warning",
  MACHINE_UPDATED: "warning",
  MACHINE_STATUS_CHANGED: "warning",
  ALARM_CREATED: "warning",
  ALARM_UPDATED: "warning",
  ALARM_ACKNOWLEDGED: "warning",
  ALARM_CLOSED: "warning",
  MAINTENANCE_CREATED: "warning",
  MAINTENANCE_UPDATED: "warning",
  EXPORT_DATA: "warning",

  PAGE_VIEW: "info",
  DATA_VIEW: "info",
  SYSTEM_START: "info",
  SYSTEM_HEARTBEAT: "info",
};

/** อนุมานความเสี่ยงจากรหัส log แบบฝั่ง client (ค่าเริ่มต้นคือ info) */
export function riskForCode(code: string): AuditRisk {
  if (AUDIT_RISK_BY_CODE[code]) return AUDIT_RISK_BY_CODE[code];
  if (code.endsWith("_DELETED") || code.startsWith("SECURITY_")) {
    return "critical";
  }
  return "info";
}

/**
 * บันทึก audit event ลงฐานข้อมูล ผ่าน RPC record_audit_event()
 *
 * ตัวตนผู้ใช้, IP และ user-agent ถูกกำหนดฝั่งฐานข้อมูลจาก session ของคำขอ
 * จึงปลอมแปลงไม่ได้ — ฟังก์ชันนี้ส่งได้แค่รหัส/ข้อความ/รายละเอียดเท่านั้น
 *
 * ล้มเหลวแบบเงียบ (แค่ log ไว้ใน console) เพื่อไม่ให้กระทบการใช้งานจริง
 * เช่นกรณีที่ยังไม่ได้รัน migration 07_audit_logs.sql
 */
export async function logAuditEvent(input: AuditEventInput): Promise<void> {
  if (!input.code) return;

  try {
    const supabase = createClient();
    const { error } = await supabase.rpc("record_audit_event", {
      p_event_code: input.code,
      p_risk_level: input.risk ?? null,
      p_category: input.category ?? "app",
      p_message: input.message ?? null,
      p_metadata: input.metadata ?? null,
    });

    if (error) {
      console.warn("[audit] บันทึก event ไม่สำเร็จ:", error.message);
    }
  } catch (err) {
    console.warn("[audit] เรียก record_audit_event ไม่สำเร็จ:", err);
  }
}

/** ลบ audit log ที่เกินอายุเก็บรักษา (ต้องล็อกอินเป็นผู้ดูแลระบบ) */
export async function cleanupAuditLogs(): Promise<number> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("cleanup_audit_logs", {
      p_retention_days: 7,
    });
    if (error) return 0;
    return typeof data === "number" ? data : 0;
  } catch {
    return 0;
  }
}
