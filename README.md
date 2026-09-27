# automation-web-app

Web application สำหรับระบบ SCADA / Factory Automation — หน้า Dashboard, Machines,
Alarms, Maintenance และหน้า SCADA Diagram

Built with [Next.js](https://nextjs.org) (App Router) + [Supabase](https://supabase.com)
+ Tailwind CSS

## Features

- **Authentication** — ลงทะเบียน / เข้าสู่ระบบด้วย Supabase Auth (อีเมล + รหัสผ่าน)
- **Role-based access** — ผู้ใช้ใหม่เข้าสถานะ `pending` และรอ Admin อนุมัติก่อนเข้าใช้งานได้
- **Dashboard** — ภาพรวมสถานะเครื่องจักร, Alarm, Maintenance
- **Machines** — CRUD ข้อมูลเครื่องจักร
- **Alarms** — บันทึกและติดตามสถานะ Alarm
- **Maintenance** — บันทึกประวัติการบำรุงรักษา
- **SCADA Diagram** — แผนผังกระบวนการแบบ interactive
- **User management** — Admin จัดการสิทธิ์ผู้ใช้
- **Charts** — กราฟสถิติด้วย Recharts

## Tech Stack

| Layer     | Technology                          |
| --------- | ----------------------------------- |
| Framework | Next.js 16 (App Router)             |
| UI        | React 19, Tailwind CSS 4            |
| Backend   | Supabase (PostgreSQL + Auth + RLS)  |
| Charts    | Recharts                            |
| Icons     | lucide-react                        |

## Getting Started

### 1. ติดตั้ง dependencies

```bash
npm install
```

### 2. ตั้งค่า environment variables

คัดลอกไฟล์ตัวอย่างแล้วกรอกค่าจาก Supabase Dashboard (Project Settings → API)

```bash
cp .env.example .env.local
```

ตัวแปรที่จำเป็น:

| Variable                       | คำอธิบาย                        |
| ------------------------------ | ------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`     | Supabase project URL            |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon / publishable key |

> `.env.local` ถูก exclude ออกจาก git แล้ว — **อย่า commit ไฟล์นี้**

### 3. สร้างตารางในฐานข้อมูล

รันไฟล์ SQL ตามลำดับใน Supabase SQL Editor:

1. `src/supabase/01_init.sql` — สร้างตาราง (profiles, machines, alarms, maintenance_records)
2. `src/supabase/RLS.sql` — เปิด Row Level Security และนิยาม policy
3. `src/supabase/02_seed_alarms.sql` — (ไม่บังคับ) ข้อมูล alarm ตัวอย่าง 10 รายการ รันซ้ำได้ไม่เกิดข้อมูลซ้ำ ต้องมีเครื่องจักรอยู่แล้ว

### 4. เริ่ม dev server

```bash
npm run dev
```

เปิด [http://localhost:3000](http://localhost:3000)

## Scripts

```bash
npm run dev     # เริ่ม dev server
npm run build   # build สำหรับ production
npm run start   # รัน production server
npm run lint    # eslint
```

## Project Structure

```
src/
├── app/
│   ├── auth/signout/    # route handler สำหรับออกจากระบบ
│   ├── dashboard/       # หน้าหลักของระบบ
│   │   ├── machines/     # จัดการเครื่องจักร
│   │   ├── alarms/       # จัดการ Alarm
│   │   ├── maintenance/  # บันทึกการบำรุงรักษา
│   │   ├── scada/        # แผนผัง SCADA
│   │   └── users/        # จัดการผู้ใช้ (Admin)
│   ├── login/            # หน้าเข้าสู่ระบบ / ลงทะเบียน
│   ├── pending/          # หน้ารอผู้ดูแลอนุมัติสิทธิ์
│   └── layout.tsx
├── components/           # Navbar, Sidebar, ScadaDiagram
├── lib/supabase/        # Supabase client (browser + server)
└── supabase/            # SQL scripts (schema + RLS)
```

## Roles

| Role        | คำอธิบาย                                  |
| ----------- | ----------------------------------------- |
| `pending`   | ลงทะเบียนแล้ว รอ Admin อนุมัติ             |
| `technician`| เข้าใช้งานระบบได้ตามปกติ                  |
| `admin`     | มีสิทธิ์จัดการผู้ใช้และข้อมูลทั้งหมด      |

## Docker

มี `Dockerfile` (multi-stage, ใช้ `output: "standalone"`) และ `docker-compose.yaml`
สำหรับรัน Postgres ในเครื่องควบคู่กับแอป

```bash
docker compose up --build
```

> **หมายเหตุ:** ค่า Supabase ใน `docker-compose.yaml` เป็นค่าจำลองสำหรับ local
> เท่านั้น — ต้องเปลี่ยนเป็นค่าจริงก่อนนำไปใช้งาน

## License

Private — all rights reserved
