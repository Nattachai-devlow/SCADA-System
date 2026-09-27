-- =====================================================================
-- Seed: ข้อมูล Alarm จำลองสำหรับทดสอบระบบ
-- =====================================================================
-- วิธีใช้:
--   1. เปิด Supabase Dashboard -> SQL Editor -> New query
--   2. วางไฟล์นี้ทั้งไฟล์แล้วกด Run
--   3. กลับไปหน้า Alarms จะเห็นรายการทันที
--
-- รันซ้ำได้ไม่เกิดรายการซ้ำ เพราะ script ลบของเดิมก่อนเสมอ
--
-- หมายเหตุ:
--   - status ต้องเป็น 'Open' | 'In Progress' | 'Closed' เท่านั้น
--     ตาม CHECK constraint ใน 01_init.sql
--   - alarms.machine_id เป็น UUID จึงอ้างอิงผ่าน machine_id แบบข้อความ
--     ถ้าไม่พบเครื่องที่ระบุ จะ fallback ไปใช้เครื่องแรกที่มีอยู่
-- =====================================================================

BEGIN;

-- เครื่องจักรต้องมีอยู่ก่อน ไม่งั้น foreign key จะไม่ผ่าน
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.machines) THEN
    RAISE EXCEPTION 'ยังไม่มีเครื่องจักรในระบบ กรุณาเพิ่มเครื่องจักรก่อนแล้วค่อยรันสคริปต์นี้';
  END IF;
END $$;

-- ลบข้อมูลจำลองชุดเดิม (เฉพาะรหัสที่อยู่ในสคริปต์นี้) เพื่อให้รันซ้ำได้
DELETE FROM public.alarms
WHERE alarm_code IN (
  'PMP-LOW-PR', 'PMP-VIB-HI', 'PMP-AMP-HI',
  'HTR-OT-HI', 'HTR-CYC-TIME',
  'FLT-DP-HI',
  'TMP-SNS-RANGE', 'TMP-POOL-OVR', 'LVL-LOW',
  'VLV-FB-MISMATCH'
);

WITH seeds AS (
  SELECT * FROM (VALUES
    -- ปั๊ม ---------------------------------------------------------------
    ('PMP-LOW-PR',
     'แรงดันปั๊มต่ำกว่าค่าตั้ง (Pump pressure below setpoint)',
     'ตะแกรงอุดตัน หรือปั๊มทำงานแบบไม่มีน้ำ (dry run)',
     'Open', 4, 'PUMP-01'),

    ('PMP-VIB-HI',
     'การสั่นสะเทือนของปั๊มเกินค่าที่กำหนด',
     'ตลับลูกปิ่นสึก หรืออากาศเข้าตัวปั๊ม',
     'In Progress', 52, 'PUMP-01'),

    ('PMP-AMP-HI',
     'กระแสไฟฟ้าของมอเตอร์ปั๊มสูงเกินพิกัด',
     'ใบพัดติดขัด หรือระยะห่างใบพัดไม่ถูกต้อง',
     'Closed', 2880, 'PUMP-01'),

    -- ฮีตเตอร์ ----------------------------------------------------------
    ('HTR-OT-HI',
     'อุณหภูมิฮีตเตอร์สูงเกินค่าตั้ง (Overtemperature)',
     'สวิตช์ไหลน้ำทำงานผิดปกติ หรืออัตราการไหลต่ำเกินไป',
     'Open', 11, 'HEAT-01'),

    ('HTR-CYC-TIME',
     'ระยะเวลาทำงานสะสมของฮีตเตอร์เกินกำหนด',
     'ต้องเข้าตรวจสอบฮีตเตอร์ตามรอบการบำรุงรักษา',
     'In Progress', 360, 'HEAT-01'),

    -- ถังกรอง -----------------------------------------------------------
    ('FLT-DP-HI',
     'ความดันต่างของถังกรองสูงเกินไป (Filter differential pressure)',
     'สื่อกรองอุดตัน ควรทำ backwash',
     'Open', 23, 'FLT-01'),

    -- เซ็นเซอร์ ----------------------------------------------------------
    ('TMP-SNS-RANGE',
     'ค่าจากเซ็นเซอร์อุณหภูมิอยู่นอกช่วงที่กำหนด',
     'วงจรเปิดของเซ็นเซอร์ หรือหัววัดเสีย',
     'Open', 38, 'PUMP-01'),

    ('TMP-POOL-OVR',
     'อุณหภูมิสระสูงกว่าเป้าหมายมากกว่า 3 องศาเซลเซียส',
     'วงจรแสงอาทิตย์ทำงานต่อเนื่อง ตรวจวาล์ว์ผสมน้ำ',
     'Closed', 4320, 'PUMP-01'),

    ('LVL-LOW',
     'ระดับน้ำในสระต่ำกว่าค่าขั้นต่ำ',
     'ระบบดูดน้ำมีการรั่ว หรือน้ำระเหยมาก',
     'In Progress', 1440, 'PUMP-01'),

    -- วาล์ว์ -------------------------------------------------------------
    ('VLV-FB-MISMATCH',
     'สัญญาณยืนยันตำแหน่งวาล์ว์ไม่ตรงกับคำสั่งที่ส่ง',
     'แอกทิวเอเตอร์วาล์ว์ติดขัด หรือเซ็นเซอร์ตำแหน่งเสีย',
     'Open', 90, 'PUMP-01')
  ) AS v(alarm_code, alarm_description, cause, status, mins_ago, prefer)
)
INSERT INTO public.alarms
  (machine_id, alarm_code, alarm_description, cause, status, created_at)
SELECT
  COALESCE(
    (SELECT m.id FROM public.machines m WHERE m.machine_id = v.prefer LIMIT 1),
    (SELECT m.id FROM public.machines m ORDER BY m.created_at LIMIT 1)
  ),
  v.alarm_code,
  v.alarm_description,
  v.cause,
  v.status,
  NOW() - (v.mins_ago * INTERVAL '1 minute')
FROM seeds v;

COMMIT;

-- สรุปผลหลังรัน
SELECT
  status,
  COUNT(*) AS total
FROM public.alarms
WHERE alarm_code IN (
  'PMP-LOW-PR', 'PMP-VIB-HI', 'PMP-AMP-HI',
  'HTR-OT-HI', 'HTR-CYC-TIME',
  'FLT-DP-HI',
  'TMP-SNS-RANGE', 'TMP-POOL-OVR', 'LVL-LOW',
  'VLV-FB-MISMATCH'
)
GROUP BY status
ORDER BY status;
