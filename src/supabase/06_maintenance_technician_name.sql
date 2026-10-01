-- ============================================================================
-- 06_maintenance_technician_name.sql
--
-- เพิ่ม "ชื่อผู้ลงบันทึกการซ่อม" ให้ maintenance_records
--
-- เหตุผลที่ต้องเก็บเป็นคอลัมน์ซ้ำ (denormalize) แทนที่จะ join profiles:
--
--   1. เพราะเป็น audit snapshot ชื่อที่บันทึกไว้คือชื่อ "ตอนซ่อม"
--      ถ้าช่างเปลี่ยนชื่อทีหลัง ประวัติงานเก่าต้องยังแสดงชื่อที่ใช้จริงตอนนั้น
--      การ join สด ๆ จะกลายเป็นชื่อปัจจุบันของคนนั้น ซึ่งไม่ใช่ประวัติจริง
--
--   2. เพราะต้องให้ผู้ดูแลระบบแก้ "ชื่อที่บันทึกไว้" ได้ เช่น กรณีบันทึกแทนช่าง
--      หรือทีมงานซ่อมร่วมกัน ถ้าเก็บชื่อไว้ใน profiles การแก้ชื่อที่นั่น
--      จะไปกระทบทุกรายการของคนนั้นในอดีตด้วย
--
--   หมายเหตุ: ไม่ได้ join profiles เพราะหวังว่าจะพึ่ง RLS ของ profiles
--   ตอนตรวจจริงพบว่า policy ปัจจุบันเปิดให้ผู้ใช้ที่ล็อกอินแล้วอ่าน profiles
--   ได้ทุกแถว (รวมอีเมลและ role) ซึ่งกว้างเกินที่ตั้งใจไว้ใน RLS.sql
--   คอลัมน์นี้จึงไม่ควรผูกกับสิทธิ์การอ่าน profiles เด็ดขาด
--   (ดูหมายเหตุเรื่อง RLS ท้ายไฟล์)
--
-- ไฟล์นี้ต้องรันใน Supabase Studio (SQL Editor) จึงจะมีผลกับฐานข้อมูลจริง
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. คอลัมน์ใหม่
-- ---------------------------------------------------------------------------
ALTER TABLE public.maintenance_records
  ADD COLUMN IF NOT EXISTS technician_name TEXT;

COMMENT ON COLUMN public.maintenance_records.technician_name IS
  'ชื่อผู้ลงบันทึกการซ่อม (snapshot ณ เวลาซ่อม) แก้ไขได้เฉพาะผู้ดูแลระบบเท่านั้น';

-- ---------------------------------------------------------------------------
-- 2. เติมชื่อให้รายการเก่าที่มี technician_id แต่ยังไม่มีชื่อ
--    (รายการที่ technician_id IS NULL จะคงเป็น NULL และหน้าเว็บจะแสดง "ไม่ระบุชื่อ")
-- ---------------------------------------------------------------------------
UPDATE public.maintenance_records AS mr
SET technician_name = p.full_name
FROM public.profiles AS p
WHERE p.id = mr.technician_id
  AND NULLIF(btrim(mr.technician_name), '') IS NULL;

-- ---------------------------------------------------------------------------
-- 3. บังคับสิทธิ์ฝั่งฐานข้อมูล
--
--    ฝั่ง UI ซ่อนช่องแก้ไขจากช่างอยู่แล้ว แต่ UI กันไม่ได้ทุกกรณี
--    (เรียก API ตรง, แก้โค้ด, เปิด PostgREST ในเบราว์เซอร์) จึงต้องล็อกที่ DB
--
--    - INSERT โดยช่าง  : บังคับ technician_id และชื่อให้เป็นผู้บันทึกจริงเสมอ
--                          (กันการลงชื่อคนอื่น)
--    - INSERT โดย admin : เลือกชื่อเองได้ ถ้าเว้นว่างใช้ชื่อ admin ผู้บันทึก
--    - UPDATE โดย admin : แก้ชื่อ/ผู้ลงบันทึกได้
--    - UPDATE โดยช่าง  : แตะชื่อหรือผู้ลงบันทึกไม่ได้ (error 42501)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.enforce_maintenance_attribution()
RETURNS TRIGGER AS $$
DECLARE
  actor_name TEXT;
  actor_is_admin BOOLEAN;
BEGIN
  actor_is_admin := public.is_admin();

  IF TG_OP = 'INSERT' THEN
    IF actor_is_admin THEN
      IF NULLIF(btrim(NEW.technician_name), '') IS NULL THEN
        SELECT full_name INTO actor_name
        FROM public.profiles WHERE id = auth.uid();
        NEW.technician_name := actor_name;
      END IF;
    ELSE
      -- ช่างบันทึกงานของตัวเองเท่านั้น
      NEW.technician_id := auth.uid();
      SELECT full_name INTO actor_name
      FROM public.profiles WHERE id = auth.uid();
      NEW.technician_name := actor_name;
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE
  IF actor_is_admin THEN
    IF NULLIF(btrim(NEW.technician_name), '') IS NULL THEN
      SELECT full_name INTO actor_name
      FROM public.profiles WHERE id = auth.uid();
      NEW.technician_name := actor_name;
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.technician_id IS DISTINCT FROM OLD.technician_id
     OR NEW.technician_name IS DISTINCT FROM OLD.technician_name THEN
    RAISE EXCEPTION
      'เฉพาะผู้ดูแลระบบเท่านั้นที่แก้ไขชื่อผู้ลงบันทึกการซ่อมได้'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS trg_maintenance_attribution ON public.maintenance_records;
CREATE TRIGGER trg_maintenance_attribution
  BEFORE INSERT OR UPDATE ON public.maintenance_records
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_maintenance_attribution();

-- ---------------------------------------------------------------------------
-- 4. Index
--    technician_id เป็น FK อยู่แล้ว แต่ Postgres ไม่สร้าง index ให้ FK อัตโนมัติ
--    คอลัมน์นี้ใช้ตอน backfill ข้างบน และจะได้ใช้ต่อเมื่อมีการกรองตามช่างในอนาคต
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_maintenance_records_technician_id
  ON public.maintenance_records (technician_id);

-- ============================================================================
-- หมายเหตุเรื่อง RLS (ตรวจจริงกับฐานข้อมูล ไม่ใช่แค่อ่านจาก RLS.sql)
--
-- ไฟล์นี้แก้เฉพาะเรื่อง "ใครแก้ชื่อผู้ลงบันทึกได้" เท่านั้น
-- แต่ตอนตรวจพบปัญหาที่เกี่ยวข้องกันอีก 3 จุด ซึ่งยังไม่ได้แก้ในไฟล์นี้
-- เพราะอยู่นอกขอบเขตของฟีเจอร์นี้ และอาจกระทบหน้าจออื่น ต้องทดสอบก่อน
--
--   1. คีย์ anon (อยู่ในไฟล์ .env และดูได้จาก public key บนเบราว์เซอร์)
--      ยัง "อ่าน" ได้โดยไม่ต้องล็อกอิน:
--        machines 9 แถว, alarms 33 แถว,
--        maintenance_records 3 แถว, system_telemetry 33 แถว
--      (เขียนถูกบล็อกปกติ ทดสอบด้วย error 42501)
--      แปลว่าตารางเหล่านี้น่าจะมี policy ชื่อเก่าที่เปิด USING (true)
--      ค้างอยู่ เพราะ policy ใน Postgres ถูก OR กัน ไม่ใช่การทับ
--      และ RLS.sql ใช้ DROP POLICY IF EXISTS ผูกกับ "ชื่อ" จึงลบไม่หมด
--
--   2. policy "Users can read own profile" ตั้งใจให้ช่างอ่านได้แค่แถวตัวเอง
--      แต่ผลทดสอบจริง: ช่างอ่าน profiles ได้ทุกแถว (รวมอีเมลและ role ของทุกคน)
--      ต่างจากนิยามใน RLS.sql
--
--   3. ช่างแก้ไข maintenance_records ได้ทุกแถว ไม่ใช่เฉพาะของตัวเอง
--      (ทดสอบแล้ว PATCH แถวของคนอื่นได้ สำเร็จ)
--      trigger ในไฟล์นี้ปิดเฉพาะช่อง technician_id / technician_name
--      แต่ยังแก้ machine_id, title, details ของแถวคนอื่นได้
--
-- แนะนำให้เขียน migration แยกต่างหากเพื่อแก้ทั้ง 3 ข้อ โดยลบ policy เก่าทั้งหมด
-- ของตารางที่เกี่ยวข้องก่อนสร้างใหม่ (วนลบ policy จาก pg_policies)
-- ============================================================================
