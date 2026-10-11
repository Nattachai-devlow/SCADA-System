-- ============================================================================
-- 07_audit_logs.sql
--
-- Audit Log — บันทึก "ทุก event" ตั้งแต่มีคนเข้าใช้งานเว็บ
--
--   * เก็บทุก event ที่ฝั่งแอปส่งเข้ามา (เปิดหน้า, login/logout, สมัคร, export ฯลฯ)
--   * เก็บการเปลี่ยนแปลงข้อมูลอัตโนมัติผ่าน trigger (เครื่องจักร, alarm,
--     งานซ่อม, ผู้ใช้) จึงบันทึกไม่ได้ถูกเลี่ยงจากฝั่ง UI
--   * ทุก event มี "ระดับความเสี่ยง" (risk) กำหนดจากรหัส log ผ่าน audit_event_risk()
--   * เก็บย้อนหลังแค่ 7 วัน เกินกว่านั้นลบออกอัตโนมัติ
--       - ใช้ pg_cron ถ้าเปิดใช้งานไว้
--       - ถ้าไม่มี pg_cron จะลบแบบ lazy ตอนเปิดหน้า Audit Logs แทน
--
-- ความปลอดภัย:
--   - เขียนได้ทางเดียวคือเรียกฟังก์ชัน public.record_audit_event() เท่านั้น
--     (SECURITY DEFINER) จึงปลอม actor / IP ให้เป็นคนอื่นไม่ได้
--   - ตารางไม่มี policy INSERT/UPDATE/DELETE ให้ผู้ใช้เขียนเองโดยตรง
--   - อ่านได้เฉพาะผู้ดูแลระบบ (admin)
--
-- ไฟล์นี้ต้องรันใน Supabase Studio (SQL Editor) จึงจะมีผลกับฐานข้อมูลจริง
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) ตาราง audit_logs
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  /* รหัส event เช่น AUTH_LOGIN, PAGE_VIEW, USER_ROLE_CHANGED */
  event_code TEXT NOT NULL,

  /* ระดับความเสี่ยง: info | warning | critical (กำหนดจากรหัส log) */
  risk_level TEXT NOT NULL DEFAULT 'info'
    CHECK (risk_level IN ('info', 'warning', 'critical')),

  /* หมวดหมู่กว้าง ๆ เช่น auth | app | data */
  category TEXT NOT NULL DEFAULT 'app',

  /* ข้อความสรุปที่อ่านเข้าใจได้ */
  message TEXT,

  /* ใครทำ (snapshot ณ เวลานั้น — ไม่ join สดเพื่อให้ประวัติคงอยู่จริง) */
  actor_id UUID,
  actor_name TEXT,
  actor_email TEXT,
  actor_role TEXT,

  /* มาจาก request headers ของ Supabase (ผู้ใช้ปลอมไม่ได้) */
  ip_address INET,
  user_agent TEXT,

  /* รายละเอียดเพิ่มเติมเป็น JSON (path, changed columns, record id ฯลฯ) */
  metadata JSONB,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ตัวกรองที่หน้าเว็บใช้บ่อย: เรียงเวลา, กรองตามรหัส/ความเสี่ยง/ผู้ใช้
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
  ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_code
  ON public.audit_logs (event_code);
CREATE INDEX IF NOT EXISTS idx_audit_logs_risk_level
  ON public.audit_logs (risk_level);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor
  ON public.audit_logs (actor_id);

-- ---------------------------------------------------------------------------
-- 2) ตัวกำหนดระดับความเสี่ยงจากรหัส log
--    เป็นแหล่งความจริงเดียวของ risk — หน้าเว็บแค่แสดงค่าที่ได้จากตรงนี้
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.audit_event_risk(p_event_code TEXT)
RETURNS TEXT AS $$
BEGIN
  IF p_event_code IS NULL THEN
    RETURN 'info';
  END IF;

  -- ผู้ใช้ไม่ผ่านการตรวจสอบ, เข้าถึงข้อมูลไม่ได้, กระทำที่ย้อนกลับยาก
  IF p_event_code IN (
    'AUTH_LOGIN_FAILED', 'AUTH_LOCKOUT', 'AUTH_MFA_FAILED',
    'PERMISSION_DENIED', 'UNAUTHORIZED_ACCESS', 'SECURITY_ALERT',
    'CONFIG_CHANGED', 'RETENTION_CLEANUP',
    'USER_DELETED', 'USER_ROLE_CHANGED',
    'MACHINE_DELETED', 'ALARM_DELETED', 'MAINTENANCE_DELETED'
  ) THEN
    RETURN 'critical';
  END IF;

  -- การลบทุกอย่างถือว่ามีความเสี่ยงสูง เป็นค่าเริ่มต้นที่ปลอดภัยไว้ก่อน
  IF p_event_code LIKE '%\_DELETED' ESCAPE '\'
     OR p_event_code LIKE 'SECURITY\_%' ESCAPE '\' THEN
    RETURN 'critical';
  END IF;

  -- เหตุการณ์สำคัญแต่ยังย้อนกลับได้ / ต้องจับตา
  IF p_event_code IN (
    'AUTH_LOGIN', 'AUTH_LOGOUT', 'AUTH_SIGNUP', 'AUTH_SIGNUP_FAILED',
    'AUTH_SESSION_REFRESH',
    'AUTH_PASSWORD_RESET', 'AUTH_PASSWORD_CHANGED',
    'USER_CREATED', 'USER_UPDATED', 'USER_APPROVED',
    'MACHINE_CREATED', 'MACHINE_UPDATED', 'MACHINE_STATUS_CHANGED',
    'ALARM_CREATED', 'ALARM_UPDATED', 'ALARM_ACKNOWLEDGED', 'ALARM_CLOSED',
    'MAINTENANCE_CREATED', 'MAINTENANCE_UPDATED',
    'EXPORT_DATA'
  ) THEN
    RETURN 'warning';
  END IF;

  -- ค่าเริ่มต้น: ข้อมูลทั่วไป
  RETURN 'info';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ---------------------------------------------------------------------------
-- 3) ฟังก์ชันบันทึก event (ทางเข้าเดียวของการเขียน log)
--    - actor / ip / user-agent ถูกดึงจาก session + request headers จริง
--      ผู้เรียกส่งค่าเหล่านี้เข้ามาเองไม่ได้
--    - ถ้าไม่ระบุ risk จะอนุมานจากรหัสผ่าน audit_event_risk()
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_audit_event(
  p_event_code TEXT,
  p_risk_level TEXT DEFAULT NULL,
  p_category TEXT DEFAULT 'app',
  p_message TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
  v_actor UUID := auth.uid();
  v_name TEXT;
  v_email TEXT;
  v_role TEXT;
  v_headers JSON;
  v_ip INET;
  v_ua TEXT;
  v_risk TEXT;
BEGIN
  IF p_event_code IS NULL OR btrim(p_event_code) = '' THEN
    RETURN NULL;
  END IF;

  v_risk := COALESCE(
    NULLIF(btrim(p_risk_level), ''),
    public.audit_event_risk(upper(btrim(p_event_code)))
  );

  IF v_actor IS NOT NULL THEN
    SELECT full_name, email, role
      INTO v_name, v_email, v_role
      FROM public.profiles
     WHERE id = v_actor;
  END IF;

  /* Supabase วาง request headers ไว้ใน GUC นี้ ถ้ารันจากที่อื่นจะไม่มีค่า */
  BEGIN
    v_headers := current_setting('request.headers', true)::json;
  EXCEPTION WHEN OTHERS THEN
    v_headers := NULL;
  END;

  IF v_headers IS NOT NULL THEN
    BEGIN
      v_ip := NULLIF(
        btrim(split_part(
          COALESCE(v_headers ->> 'x-forwarded-for', v_headers ->> 'x-real-ip'),
          ',', 1
        )),
        ''
      )::inet;
    EXCEPTION WHEN OTHERS THEN
      v_ip := NULL;
    END;

    v_ua := left(NULLIF(v_headers ->> 'user-agent', ''), 500);
  END IF;

  INSERT INTO public.audit_logs (
    event_code, risk_level, category, message,
    actor_id, actor_name, actor_email, actor_role,
    ip_address, user_agent, metadata
  )
  VALUES (
    upper(btrim(p_event_code)), v_risk,
    COALESCE(NULLIF(btrim(p_category), ''), 'app'), p_message,
    v_actor, v_name, v_email, v_role,
    v_ip, v_ua, p_metadata
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ให้ผู้ใช้ที่ล็อกอินแล้วและผู้ที่ยังไม่ล็อกอิน (กรณี login ล้มเหลว) บันทึกได้
GRANT EXECUTE ON FUNCTION public.record_audit_event(TEXT, TEXT, TEXT, TEXT, JSONB)
  TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4) บันทึกการเปลี่ยนแปลงข้อมูลอัตโนมัติ (trigger)
--    ทำงานเป็น SECURITY DEFINER และกลืนข้อผิดพลาดไว้
--    เพื่อไม่ให้การทำ audit ทำให้ operation จริงของผู้ใช้ล้มเหลว
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.audit_table_change()
RETURNS TRIGGER AS $$
DECLARE
  v_prefix TEXT;
  v_action TEXT;
  v_code TEXT;
  v_before JSONB;
  v_after JSONB;
  v_label TEXT;
  v_changed JSONB;
  v_meta JSONB;
  v_msg TEXT;
BEGIN
  BEGIN
    IF TG_OP = 'INSERT' THEN
      v_action := 'CREATED';
      v_before := NULL;
      v_after := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
      /* ค่าไม่เปลี่ยนจริง (UPDATE ใส่ค่าเดิม) ไม่ต้องบันทึก */
      IF to_jsonb(NEW) = to_jsonb(OLD) THEN
        RETURN NEW;
      END IF;
      v_action := 'UPDATED';
      v_before := to_jsonb(OLD);
      v_after := to_jsonb(NEW);
    ELSE
      v_action := 'DELETED';
      v_before := to_jsonb(OLD);
      v_after := NULL;
    END IF;

    v_prefix := CASE TG_TABLE_NAME
      WHEN 'machines' THEN 'MACHINE'
      WHEN 'alarms' THEN 'ALARM'
      WHEN 'maintenance_records' THEN 'MAINTENANCE'
      WHEN 'profiles' THEN 'USER'
      ELSE upper(TG_TABLE_NAME)
    END;

    v_code := v_prefix || '_' || v_action;

    /* เปลี่ยน role ถือเป็นเรื่องความปลอดภัย ใช้รหัสเฉพาะ */
    IF TG_TABLE_NAME = 'profiles'
       AND TG_OP = 'UPDATE'
       AND OLD.role IS DISTINCT FROM NEW.role THEN
      v_code := 'USER_ROLE_CHANGED';
    END IF;

    v_label := CASE TG_TABLE_NAME
      WHEN 'machines' THEN
        COALESCE(v_after ->> 'machine_id', v_before ->> 'machine_id')
        || ' ' || COALESCE(v_after ->> 'machine_name', v_before ->> 'machine_name')
      WHEN 'alarms' THEN
        COALESCE(v_after ->> 'alarm_code', v_before ->> 'alarm_code')
      WHEN 'maintenance_records' THEN
        COALESCE(v_after ->> 'title', v_before ->> 'title')
      WHEN 'profiles' THEN
        COALESCE(v_after ->> 'email', v_before ->> 'email')
      ELSE
        COALESCE(v_after ->> 'id', v_before ->> 'id')
    END;

    IF TG_OP = 'UPDATE' THEN
      SELECT jsonb_agg(n.key ORDER BY n.key)
        INTO v_changed
        FROM jsonb_each(v_after) n
        JOIN jsonb_each(v_before) o ON o.key = n.key
       WHERE n.value IS DISTINCT FROM o.value;
    END IF;

    v_meta := jsonb_build_object(
      'table', TG_TABLE_NAME,
      'action', lower(v_action),
      'record_id', COALESCE(v_after ->> 'id', v_before ->> 'id'),
      'changed', COALESCE(v_changed, '[]'::jsonb)
    );

    v_msg := v_code || COALESCE(' · ' || NULLIF(btrim(v_label), ''), '');

    PERFORM public.record_audit_event(v_code, NULL, 'data', v_msg, v_meta);
  EXCEPTION WHEN OTHERS THEN
    -- การทำ audit ต้องไม่ทำให้ operation จริงของผู้ใช้ล้มเหลว
    NULL;
  END;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- ติด trigger กับตารางที่ต้องการเก็บประวัติ
DROP TRIGGER IF EXISTS trg_audit_machines ON public.machines;
CREATE TRIGGER trg_audit_machines
  AFTER INSERT OR UPDATE OR DELETE ON public.machines
  FOR EACH ROW EXECUTE FUNCTION public.audit_table_change();

DROP TRIGGER IF EXISTS trg_audit_alarms ON public.alarms;
CREATE TRIGGER trg_audit_alarms
  AFTER INSERT OR UPDATE OR DELETE ON public.alarms
  FOR EACH ROW EXECUTE FUNCTION public.audit_table_change();

DROP TRIGGER IF EXISTS trg_audit_maintenance ON public.maintenance_records;
CREATE TRIGGER trg_audit_maintenance
  AFTER INSERT OR UPDATE OR DELETE ON public.maintenance_records
  FOR EACH ROW EXECUTE FUNCTION public.audit_table_change();

DROP TRIGGER IF EXISTS trg_audit_profiles ON public.profiles;
CREATE TRIGGER trg_audit_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_table_change();

-- ---------------------------------------------------------------------------
-- 5) ลบข้อมูลที่เกิน 7 วัน
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_audit_logs(p_retention_days INTEGER DEFAULT 7)
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM public.audit_logs
   WHERE created_at < TIMEZONE('utc'::text, NOW()) - make_interval(days => p_retention_days);

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

-- เรียกจากฝั่งแอป (หน้า Audit Logs) ได้เพื่อเป็น fallback เมื่อไม่มี pg_cron
REVOKE ALL ON FUNCTION public.cleanup_audit_logs(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_audit_logs(INTEGER) TO authenticated;

/* ตั้งเวลาให้ลบเองทุกวันเวลา 03:15 UTC ถ้าโปรเจกต์เปิด pg_cron ไว้
   ถ้าไม่เปิด จะข้ามไปและหน้าเว็บจะลบให้ตอนเปิดแทน */
DO $do$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'audit-logs-retention') THEN
      PERFORM cron.unschedule('audit-logs-retention');
    END IF;
    PERFORM cron.schedule(
      'audit-logs-retention',
      '15 3 * * *',
      'SELECT public.cleanup_audit_logs();'
    );
  ELSE
    RAISE NOTICE 'pg_cron ไม่พร้อมใช้งาน — จะลบ audit log แบบ lazy ตอนเปิดหน้า Audit Logs';
  END IF;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'ตั้งเวลา pg_cron ไม่สำเร็จ (%). จะลบแบบ lazy แทน', SQLERRM;
END;
$do$;

-- ---------------------------------------------------------------------------
-- 6) RLS — อ่านได้เฉพาะผู้ดูแลระบบ, เขียนได้ทาง record_audit_event() เท่านั้น
-- ---------------------------------------------------------------------------
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only admin can view audit logs" ON public.audit_logs;
CREATE POLICY "Only admin can view audit logs"
  ON public.audit_logs FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
        FROM public.profiles
       WHERE id = auth.uid()
         AND lower(trim(role)) = 'admin'
    )
  );

-- ไม่เปิด policy INSERT/UPDATE/DELETE โดยตั้งใจ
-- เพราะข้อมูลนี้ต้องมาจาก record_audit_event() เท่านั้น
-- ถ้าเปิดให้เขียนเอง ใครก็สร้าง log ปลอมหรือลบร่องรอยได้

COMMENT ON TABLE public.audit_logs IS
  'บันทึกทุก event การใช้งานระบบ เก็บย้อนหลัง 7 วัน ความเสี่ยงกำหนดจากรหัส log';
