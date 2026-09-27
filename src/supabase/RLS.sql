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
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy สำหรับ Machines
CREATE POLICY "Everyone authenticated can view machines" 
  ON public.machines FOR SELECT TO authenticated USING (true);

CREATE POLICY "Only admin can insert/update/delete machines" 
  ON public.machines FOR ALL TO authenticated USING (is_admin());

-- Policy สำหรับ Alarms & Maintenance Records
CREATE POLICY "Authenticated users can view alarms" 
  ON public.alarms FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage alarms" 
  ON public.alarms FOR ALL TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage maintenance" 
  ON public.maintenance_records FOR ALL TO authenticated USING (true);