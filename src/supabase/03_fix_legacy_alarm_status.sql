-- ============================================================================
-- แปลงสถานะ Alarm จากระบบเก่าเป็นระบบใหม่
--
-- ข้อมูลที่มีอยู่ในฐานข้อมูลจริงยังมีค่าเก่าปนอยู่ เพราะตอนสร้างตารางไม่ได้
-- บังคับด้วย CHECK constraint ที่แคบพอ (หรือถูกแก้ทีหลัง)
--
--   ACTIVE        -> Open          (ยังไม่ได้รับการรับทราบ)
--   ACKNOWLEDGED  -> In Progress   (รับทราบแล้ว กำลังจัดการ)
--
-- รันซ้ำได้หลายครั้งโดยไม่กระทบข้อมูลที่แปลงไปแล้ว
-- ============================================================================

-- 1) แปลงค่าที่ยังเป็นของเก่า
UPDATE public.alarms
SET status = 'Open'
WHERE upper(trim(status)) = 'ACTIVE';

UPDATE public.alarms
SET status = 'In Progress'
WHERE upper(status) = 'ACKNOWLEDGED';

-- 2) บังคับค่าให้เป็น 3 ค่าเท่านั้นจากนี้เป็นต้นไป
--    ค่าที่หลุดจาก 3 ค่านี้จะทำให้ UPDATE/INSERT ล้มเหลว แทนที่จะ
--    แทรกค่าแปลกปลอมที่หน้าจอแสดงผิด
ALTER TABLE public.alarms DROP CONSTRAINT IF EXISTS alarms_status_check;
ALTER TABLE public.alarms
  ADD CONSTRAINT alarms_status_check
  CHECK (status IN ('Open', 'In Progress', 'Closed'));

-- 3) บังคับ role ของ profiles ให้รองรับ 'pending'
--    (ถ้าตารางถูกสร้างมาก่อนแก้ 01_init.sql ค่า default จะยังเป็น 'technician'
--     ซึ่งทำให้ผู้สมัครใหม่ข้ามขั้นตอนรออนุมัติได้)
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('admin', 'technician', 'pending'));

-- ผู้สมัครใหม่ทุกคนต้องเริ่มที่ pending เสมอ
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'pending';

-- 4) ตรวจสอบผลลัพธ์
DO $$
DECLARE
  leftover TEXT;
BEGIN
  SELECT string_agg(DISTINCT status, ', ') INTO leftover
  FROM public.alarms
  WHERE status NOT IN ('Open', 'In Progress', 'Closed');

  IF leftover IS NOT NULL THEN
    RAISE EXCEPTION 'ยังมีสถานะ Alarm ที่ไม่รู้จัก: %', leftover;
  END IF;

  RAISE NOTICE 'แปลงสถานะ Alarm เรียบร้อย ไม่มีค่าค้างที่ไม่รู้จัก';
END;
$$;
