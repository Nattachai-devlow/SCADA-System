-- ============================================================================
-- Row Level Security
--
-- ระบบมี 3 สิทธิ์:
--   admin      จัดการได้ทุกอย่าง
--   technician ดูเครื่องจักร/Alarm/Telemetry ได้ และบันทึกงานซ่อมได้
--               แต่แก้เครื่องจักรหรือจัดการสถานะ Alarm ไม่ได้
--   pending    ผู้สมัครใหม่ที่ยังรออนุมัติ ไม่มีสิทธิ์เข้าถึงข้อมูลใด ๆ
--
-- ไฟล์นี้ต้องรันใน Supabase Studio (SQL Editor) จึงจะมีผลกับฐานข้อมูลจริง
-- ============================================================================

-- เปิดใช้งาน RLS ทุกตารางที่แอปแตะ
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alarms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_telemetry ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Helper Functions
-- ---------------------------------------------------------------------------

-- เป็นผู้ดูแลระบบหรือไม่
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND lower(trim(role)) = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ผ่านการอนุมัติแล้วหรือยัง (admin หรือ technician)
-- 'pending' จะได้ false จึงไม่ผ่าน policy ใด ๆ ที่ใช้ฟังก์ชันนี้
CREATE OR REPLACE FUNCTION is_active_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND lower(trim(role)) IN ('admin', 'technician')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

-- ผู้ใช้อ่านได้เฉพาะแถวของตัวเอง ส่วนผู้ดูแลอ่านได้ทั้งหมด
-- (เคยไม่มี policy ตารางนี้เลย ทำให้ทุกคนอ่าน role ตัวเองไม่ได้
--  ทำให้ระบบสิทธิ์ทั้งหมดตกเป็นโหมดดูอย่างเดียว)
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR is_admin());

-- สมัครสมาชิกใหม่ต้องสร้าง profile ของตัวเองได้
-- (หน้า login ใช้ upsert แบบ ignoreDuplicates จึงเป็น INSERT ที่ชนกับแถวเดิม
--  แล้วไม่ทำอะไร ไม่ต้องการสิทธิ์ UPDATE)
DROP POLICY IF EXISTS "Users can create own profile" ON public.profiles;
CREATE POLICY "Users can create own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (id = auth.uid());

-- แก้ไข profile ได้เฉพาะผู้ดูแลเท่านั้น
-- สำคัญมาก: ถ้าเปิดให้ผู้ใช้แก้แถวตัวเองได้ เขาจะเปลี่ยน role ตัวเองเป็น
-- 'admin' ได้ เพราะคอลัมน์ role อยู่ในสิทธิ์ UPDATE ปกติ
DROP POLICY IF EXISTS "Only admin can update profiles" ON public.profiles;
CREATE POLICY "Only admin can update profiles"
  ON public.profiles FOR UPDATE TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- ลบผู้ใช้ได้เฉพาะผู้ดูแล (หน้า /dashboard/users เป็นแอดมินอยู่แล้ว)
DROP POLICY IF EXISTS "Only admin can delete profiles" ON public.profiles;
CREATE POLICY "Only admin can delete profiles"
  ON public.profiles FOR DELETE TO authenticated
  USING (is_admin());

-- ---------------------------------------------------------------------------
-- Machines — ช่างดูได้ แต่แก้ได้เฉพาะผู้ดูแล
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Everyone authenticated can view machines" ON public.machines;
CREATE POLICY "Active users can view machines"
  ON public.machines FOR SELECT TO authenticated
  USING (is_active_user());

DROP POLICY IF EXISTS "Only admin can insert/update/delete machines" ON public.machines;
CREATE POLICY "Only admin can insert/update/delete machines"
  ON public.machines FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- ---------------------------------------------------------------------------
-- Alarms — ช่างดูได้ แต่ acknowledge/close ได้เฉพาะผู้ดูแล
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can view alarms" ON public.alarms;
CREATE POLICY "Active users can view alarms"
  ON public.alarms FOR SELECT TO authenticated
  USING (is_active_user());

-- policy เดิมใช้ USING (true) ทำให้ช่างเขียน alarm ได้
DROP POLICY IF EXISTS "Authenticated users can manage alarms" ON public.alarms;
DROP POLICY IF EXISTS "Only admin can insert/update/delete alarms" ON public.alarms;
CREATE POLICY "Only admin can insert/update/delete alarms"
  ON public.alarms FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- ---------------------------------------------------------------------------
-- Maintenance Records — บันทึกงานซ่อมคือหน้าที่ของช่าง จึงเปิดให้ทุกคนที่ผ่านการอนุมัติ
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can manage maintenance" ON public.maintenance_records;
CREATE POLICY "Active users can manage maintenance"
  ON public.maintenance_records FOR ALL TO authenticated
  USING (is_active_user()) WITH CHECK (is_active_user());

-- ---------------------------------------------------------------------------
-- System Telemetry — อ่านอย่างเดียว ไม่มีใครแก้ได้จากฝั่งแอป
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Active users can view telemetry" ON public.system_telemetry;
CREATE POLICY "Active users can view telemetry"
  ON public.system_telemetry FOR SELECT TO authenticated
  USING (is_active_user());
