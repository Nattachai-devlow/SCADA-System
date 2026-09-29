
-- ---------------------------------------------------------------------------
-- 1) ตารางประวัติ
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.machine_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  /* machine_uuid จงใจไม่ทำ Foreign Key ไปที่ machines
     เพราะแถวประวัติของเครื่องที่ถูกลบต้องยังอยู่
     ถ้าผูก FK ด้วย CASCADE ประวัติจะหายไปพร้อมเครื่อง ซึ่งสิ้นความหมาย */
  machine_uuid UUID,

  /* snapshot ค่าสำคัญไว้เป็นข้อความ เผื่อแสดงผลตอนอ่านประวัติ
     โดยไม่ต้อง join กลับไปที่ตาราง machines (ซึ่งอาจไม่มีแถวนั้นแล้ว) */
  machine_code TEXT NOT NULL,
  machine_name TEXT NOT NULL,

  action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete')),

  /* ภาพข้อมูลก่อน/หลัง ใช้แสดงว่าฟิลด์ไหนเปลี่ยนจากอะไรเป็นอะไร
     create -> before_data = NULL, delete -> after_data = NULL */
  before_data JSONB,
  after_data JSONB,

  performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  performed_by_name TEXT,
  performed_by_email TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- ค้นกรองตามเวลา/ประเภท/เครื่อง ต้องมี index ไม่งั้นตารางโตแล้วช้ามาก
CREATE INDEX IF NOT EXISTS idx_machine_history_created_at
  ON public.machine_history (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_machine_history_action
  ON public.machine_history (action);
CREATE INDEX IF NOT EXISTS idx_machine_history_machine
  ON public.machine_history (machine_uuid);

-- ---------------------------------------------------------------------------
-- 2) ฟังก์ชัน trigger
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_machine_change()
RETURNS TRIGGER AS $$
DECLARE
  actor_id UUID;
  actor_name TEXT;
  actor_email TEXT;
  target_uuid UUID;
  row_code TEXT;
  row_name TEXT;
  row_before JSONB;
  row_after JSONB;
  log_action TEXT;
BEGIN
  /* ผู้ที่กดมาจาก session ปัจจุบัน
     เป็น NULL เมื่อรันสคริปต์นี้เองผ่าน SQL Editor หรือผ่าน service key
     ซึ่งถือว่าไม่มีผู้ใช้ที่ระบุได้ ไม่ใช่ข้อผิดพลาด */
  actor_id := auth.uid();

  IF actor_id IS NOT NULL THEN
    SELECT full_name, email
      INTO actor_name, actor_email
      FROM public.profiles
     WHERE id = actor_id;
  END IF;

  /* แยกตามประเภทการกระทำให้ชัดเจน
     เพราะ NEW ไม่มีค่าใน trigger แบบ DELETE และ OLD ไม่มีค่าในแบบ INSERT
     การอ้างถึงคีย์ของ record ที่ยังไม่ถูก assign จะทำให้เกิด error */
  IF TG_OP = 'INSERT' THEN
    target_uuid := NEW.id;
    row_code := NEW.machine_id;
    row_name := NEW.machine_name;
    row_before := NULL;
    row_after := to_jsonb(NEW) - 'id' - 'created_at';
    log_action := 'create';

  ELSIF TG_OP = 'UPDATE' THEN
    /* ถ้าค่าไม่ได้เปลี่ยนจริง (เช่น UPDATE ที่ใส่ค่าเดิม) ไม่ต้องบันทึก
       ไม่งั้นตารางจะมีแถวซ้ำที่ไม่มีความหมาย */
    IF (to_jsonb(NEW) - 'id' - 'created_at') = (to_jsonb(OLD) - 'id' - 'created_at') THEN
      RETURN NEW;
    END IF;

    target_uuid := NEW.id;
    -- เผื่อกรณีแก้ machine_id เป็นค่าว่าง ให้ยึดรหัสเดิมแทน
    row_code := COALESCE(NEW.machine_id, OLD.machine_id);
    row_name := COALESCE(NEW.machine_name, OLD.machine_name);
    row_before := to_jsonb(OLD) - 'id' - 'created_at';
    row_after := to_jsonb(NEW) - 'id' - 'created_at';
    log_action := 'update';

  ELSE
    target_uuid := OLD.id;
    row_code := OLD.machine_id;
    row_name := OLD.machine_name;
    row_before := to_jsonb(OLD) - 'id' - 'created_at';
    row_after := NULL;
    log_action := 'delete';
  END IF;

  INSERT INTO public.machine_history (
    machine_uuid,
    machine_code,
    machine_name,
    action,
    before_data,
    after_data,
    performed_by,
    performed_by_name,
    performed_by_email
  )
  VALUES (
    target_uuid,
    row_code,
    row_name,
    log_action,
    row_before,
    row_after,
    actor_id,
    actor_name,
    actor_email
  );

  /* AFTER trigger ค่าที่คืนถูกละเลย แต่ต้องคืนคีย์หลักเพื่อความถูกต้องตามรูปแบบ */
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- SECURITY DEFINER จึงทำงานด้วยสิทธิ์เจ้าของฟังก์ชัน
-- จึงเขียนลงตารางที่เปิด RLS ได้โดยไม่ต้องเปิดสิทธิ์ INSERT ให้ผู้ใช้

-- ---------------------------------------------------------------------------
-- 3) ติดตั้ง trigger
-- ---------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_machine_history ON public.machines;
CREATE TRIGGER trg_machine_history
AFTER INSERT OR UPDATE OR DELETE ON public.machines
FOR EACH ROW EXECUTE FUNCTION public.log_machine_change();

-- ---------------------------------------------------------------------------
-- 4) RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.machine_history ENABLE ROW LEVEL SECURITY;

-- ดูประวัติได้เฉพาะผู้ดูแลระบบ
-- เขียนเงื่อนไขซ้ำแทนเรียก is_admin() เพื่อให้ไฟล์นี้รันได้ลำพังโดยไม่ต้องพึ่ง RLS.sql
DROP POLICY IF EXISTS "Only admin can view machine history" ON public.machine_history;
CREATE POLICY "Only admin can view machine history"
  ON public.machine_history FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
        FROM public.profiles
       WHERE id = auth.uid()
         AND lower(trim(role)) = 'admin'
    )
  );

-- ไม่เปิด policy สำหรับ INSERT/UPDATE/DELETE โดยตั้งใจ
-- เพราะข้อมูลนี้ต้องมาจาก trigger เท่านั้น
-- ถ้าเปิดให้ผู้ใช้เขียนเอง ใครก็สร้างประวัติปลอมได้
