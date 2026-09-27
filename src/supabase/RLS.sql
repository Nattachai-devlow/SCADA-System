-- เปิดใช้งาน RLS ทุกตาราง
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.machines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alarms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;

-- Helper Function เช็คว่าเป็น Admin หรือไม่
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND lower(trim(role)) = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy สำหรับ Machines
-- ทุกคนที่ล็อกอินอ่านได้ เพราะหน้า SCADA ต้องรู้สถานะเครื่อง
CREATE POLICY "Everyone authenticated can view machines" 
  ON public.machines FOR SELECT TO authenticated USING (true);

-- แก้ไข/เพิ่ม/ลบ เฉพาะแอดมินเท่านั้น
-- (technician ดูได้ แต่แก้ไขไม่ได้)
CREATE POLICY "Only admin can insert/update/delete machines" 
  ON public.machines FOR ALL TO authenticated USING (is_admin());

-- Policy สำหรับ Alarms
CREATE POLICY "Authenticated users can view alarms" 
  ON public.alarms FOR SELECT TO authenticated USING (true);

-- เดิมใช้ USING (true) ทำให้ทุกคนรวมถึง technician เขียน alarm ได้
-- จึงเปลี่ยนเป็นแอดมินเท่านั้น ตรงกับหน้าจอที่ซ่อนปุ่ม Acknowledge/Close
DROP POLICY IF EXISTS "Authenticated users can manage alarms" ON public.alarms;

CREATE POLICY "Only admin can insert/update/delete alarms" 
  ON public.alarms FOR ALL TO authenticated USING (is_admin());

-- Policy สำหรับ Maintenance Records
-- ปล่อยให้ทุกคนที่ล็อกอินเขียนได้ เพราะการบันทึกงานซ่อมคือหน้าที่
-- ของช่างโดยตรง
CREATE POLICY "Authenticated users can manage maintenance" 
  ON public.maintenance_records FOR ALL TO authenticated USING (true);
