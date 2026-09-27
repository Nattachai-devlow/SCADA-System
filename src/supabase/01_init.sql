-- supabase/migrations/01_init.sql

-- 1. สร้าง Extension สำหรับสุ่ม UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ตาราง Profiles (เก็บสิทธิ์ Admin / Technician)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  -- 'pending' คือผู้สมัครใหม่ที่ยังรอผู้ดูแลระบบอนุมัติสิทธิ์ จึงยังไม่มีสิทธิ์ใช้งาน
  role TEXT CHECK (role IN ('admin', 'technician', 'pending')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 3. ตาราง Machines ( Machine Master )
CREATE TABLE IF NOT EXISTS public.machines (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  machine_id TEXT UNIQUE NOT NULL,
  machine_name TEXT NOT NULL,
  machine_type TEXT NOT NULL,
  location TEXT,
  -- 'Waiting Part' = เรือมซ้องใหม่ของอะไหล่ จญุดและวไม่สามายเมื่อตัวเด์มีชื้นอีก
  status TEXT CHECK (status IN ('Running', 'Stop', 'Alarm', 'Maintenance', 'Waiting Part')) DEFAULT 'Stop',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 4. ตาราง Alarms
CREATE TABLE IF NOT EXISTS public.alarms (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  machine_id UUID REFERENCES public.machines(id) ON DELETE CASCADE NOT NULL,
  alarm_code TEXT NOT NULL,
  alarm_description TEXT NOT NULL,
  cause TEXT,
  status TEXT CHECK (status IN ('Open', 'In Progress', 'Closed')) DEFAULT 'Open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 5. ตาราง Maintenance Records
CREATE TABLE IF NOT EXISTS public.maintenance_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  machine_id UUID REFERENCES public.machines(id) ON DELETE CASCADE NOT NULL,
  technician_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  details TEXT,
  maintenance_date TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Mock Data สำหรับทดสอบ
INSERT INTO public.machines (machine_id, machine_name, machine_type, location, status)
VALUES 
  ('PUMP-01', 'Main Circulation Pump', 'Pump', 'Pool Plant Room', 'Running'),
  ('HEAT-01', 'Heat Exchanger Unit', 'Heater', 'Pool Plant Room', 'Stop'),
  ('FLT-01', 'Sand Filter Tank', 'Filter', 'Outdoor Yard', 'Maintenance')
ON CONFLICT (machine_id) DO NOTHING;