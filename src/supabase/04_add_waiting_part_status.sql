-- ============================================================================
-- เพิ่มสถานะเครื่องจักร 'Waiting Part'
--
-- 'Waiting Part' = เครื่องจักรที่หยุดทำงานเพราะรอชิ้นส่วนหรืออะไหล่มาติดตั้ง
-- จึงแยกออกจาก 'Maintenance' (ซึ่งหมายถึงกำลังซ่อมบำรุงอยู่)
--
-- รันซ้ำได้หลายครั้งโดยไม่มีผลกระทบ
-- ============================================================================

-- 1) บังคับให้คอลัมน์รับค่าใหม่ก่อน
ALTER TABLE public.machines DROP CONSTRAINT IF EXISTS machines_status_check;
ALTER TABLE public.machines
  ADD CONSTRAINT machines_status_check
  CHECK (status IN ('Running', 'Stop', 'Alarm', 'Maintenance', 'Waiting Part'));

-- 2) ตรวจสอบว่าไม่มีค่าที่นอกเหนือจากที่กำหนด (เคยมีค่าเก่าปนอยู่เหมือน alarms)
DO $$
DECLARE
  bad_status TEXT;
BEGIN
  SELECT string_agg(DISTINCT status, ', ') INTO bad_status
  FROM public.machines
  WHERE status NOT IN ('Running', 'Stop', 'Alarm', 'Maintenance', 'Waiting Part');

  IF bad_status IS NOT NULL THEN
    RAISE EXCEPTION
      'พบสถานะเครื่องจักรที่ไม่รู้จัก: %. กรุณาแก้ข้อมูลก่อนบังคับ constraint', bad_status;
  END IF;

  RAISE NOTICE 'อัปเดตสถานะเครื่องจักรเรียบร้อย รองรับ Waiting Part แล้ว';
END;
$$;
