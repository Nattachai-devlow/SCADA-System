<div align="center">

# 🌊 SCADA Water Pump Automation & Monitoring System

[![Build Status](https://img.shields.io/github/actions/workflow/status/username/repository/main.yml?branch=main&style=for-the-badge&logo=github-actions&logoColor=white)](https://github.com/username/repository/actions)
[![Version](https://img.shields.io/badge/version-1.0.0--beta-blue?style=for-the-badge&logo=semver)](https://github.com/username/repository/releases)
[![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](LICENSE)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-emerald?style=for-the-badge&logo=supabase)](https://supabase.com)

**ระบบควบคุมและเฝ้าระวังการทำงานของปั๊มน้ำอุตสาหกรรมแบบเรียลไทม์ผ่านเว็บอินเทอร์เฟซ (Virtual SCADA System)**

[Explore Documentation](#5-manual--operating-guide) · [Report Bug](https://github.com/username/repository/issues) · [Request Feature](https://github.com/username/repository/issues)

</div>

---

## 📌 1. Header & System Overview

### 📖 บทนำ (Description)

**SCADA Water Pump Automation & Monitoring System** คือระบบจำลองการจัดการและควบคุมปั๊มน้ำอุตสาหกรรมด้วยสถาปัตยกรรมระดับโมเดิร์น ออกแบบขึ้นเพื่อจำลองการทำงานของระบบ SCADA (Supervisory Control and Data Acquisition) จริง โดยใช้ **Supabase Cloud** ทำหน้าที่เป็นโครงข่ายสัญญาณจำลองเสมือน **PLC (Programmable Logic Controller)** เพื่อส่งถ่ายข้อมูลสถานะของระบบแบบ Real-time เช่น แรงดันน้ำ, ระดับน้ำ และสถานะการทำงานของปั๊ม พร้อมระบบแจ้งเตือนเมื่อเกิดเหตุขัดข้อง

---

### 🖥️ System Screenshot

<div align="center">

#### 📊 Main Monitoring Dashboard

![Main Dashboard](/Shots_SCADA/Screenshot%202026-09-30%20010223.png)

<br/>

<table>
  <tr>
    <td align="center" width="50%">
      <b>🎛️ Pump Control Panel</b><br/><br/>
      <img src="/Shots_SCADA/control2.png" alt="Pump Control Panel" width="100%"/>
    </td>
    <td align="center" width="50%">
      <b>🚨 Alarms Management</b><br/><br/>
      <img src="/Shots_SCADA/alarm1.png" alt="Alarms" width="100%"/>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <b>🏭 Machines Master</b><br/><br/>
      <img src="/Shots_SCADA/master.png" alt="Machines Master" width="100%"/>
    </td>
    <td align="center" width="50%">
      <b>📜 Machine History</b><br/><br/>
      <img src="/Shots_SCADA/History.png" alt="Machine History" width="100%"/>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <b>👥 Users Access Control</b><br/><br/>
      <img src="/Shots_SCADA/role.png" alt="Users Access" width="100%"/>
    </td>
    <td align="center" width="50%">
      <b>🛠️ Maintenance Logs</b><br/><br/>
      <img src="/Shots_SCADA/maintenanece.png" alt="Maintenance" width="100%"/>
    </td>
  </tr>
</table>

</div>

---

## ✨ 2. Key Features

- ⚡ **Real-time Monitoring:**
  - ติดตามสถานะปั๊มน้ำได้ทันที: `RUN` (กำลังทำงาน), `STOP` (หยุดทำงาน), `FAULT` (เกิดข้อผิดพลาด)
  - แสดงค่าแรงดันน้ำ (Pressure - /L) และระดับน้ำในถัง (Water Level - Percent/%) แบบไดนามิก
- 🎛️ **Pump Control Modes:**
  - **Manual Mode:** ควบคุมเปิด-ปิดด้วยตนเองผ่าน UI หน้าตู้ควบคุมจำลอง
  - **Remote Control:** คำสั่งควบคุมทางไกลผ่านระบบ Cloud
- 🚨 **Alarm & Event Management:**
  - ระบบบันทึกและแจ้งเตือนเหตุการณ์ผิดปกติ (เช่น High Pressure, Low Water Level, Pump Uptime Rate)
  - รองรับการกดยืนยันการรับทราบคำเตือน (Acknowledge Alarms)
- 📈 **Data Logging & Trending:**
  - แสดงกราฟอนุกรมเวลา (Time-series Graph) สำหรับวิเคราะห์แนวโน้มอุณหภูมิ อัตราปั๊มหยุดทำงาน อัตราการแจ้งเตือนของแต่ละเครื่องจักร
  - บันทึกประวัติการทำงานของเครื่องจักรย้อนหลัง (Historical Data Logs) สำหรับนำไปวิเคราะห์ผลต่อ

---

## 🏗️ 3. Tech Stack & Architecture

```
+---------------------------------------------------------------+
|                      User Interface (UI)                      |
|             (React.js / Next.js + Tailwind CSS)               |
+------------------------------+--------------------------------+
                               | Realtime Websocket
                               v
+---------------------------------------------------------------+
|                 Supabase Cloud (Virtual PLC)                  |
|    +-------------------+             +-------------------+    |
|    |  Database (PgSQL) | <---------> |  Realtime Engine  |    |
|    +-------------------+             +-------------------+    |
+---------------------------------------------------------------+
                               | (Future Implementation)
                               v
+---------------------------------------------------------------+
|             Physical Devices / TCP/IP Protocol                |
|               (Modbus TCP / MQTT Gateway)                     |
+---------------------------------------------------------------+
```

- **Hardware / PLC:** จำลองประมวลผลสัญญาณ I/O และ State Logic ผ่าน **Supabase Cloud (Virtual PLC)**
- **Software:** React.js / Next.js, Tailwind CSS, Lucide Icons, Recharts (หรือ Chart.js)
- **Database:** PostgreSQL (Managed by Supabase)
- **Communication Protocol:**
  - _Current:_ WebSocket / REST API via Supabase Realtime Engine
  - _Future Plan:_ Industrial TCP/IP Protocols (Modbus TCP, MQTT Gateway)

---

## 🚀 4. Quick Start & Installation

### 📋 Prerequisites

- [Node.js](https://nodejs.org/) (v18.0.0 หรือใหม่กว่า)
- [npm](https://www.npmjs.com/) หรือ [yarn](https://yarnpkg.com/)
- บัญชีใช้งาน [Supabase Cloud](https://supabase.com/)

### 🛠 Step-by-Step Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/username/scada-water-pump-system.git
   cd scada-water-pump-system
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   สร้างไฟล์ `.env.local` ที่ Root Directory แล้วระบุค่าตั้งค่าดังนี้:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. **Run the Development Server**
   ```bash
   npm run dev
   ```
   เปิดเบราว์เซอร์ไปที่ `http://localhost:3000` เพื่อดูผลลัพธ์

---

## 📘 5. Manual & Operating Guide

### Schema Visualizer

## Table `profiles`

### Columns

| Name         | Type          | Constraints |
| ------------ | ------------- | ----------- |
| `id`         | `uuid`        | Primary     |
| `email`      | `text`        |             |
| `full_name`  | `text`        | Nullable    |
| `role`       | `text`        | Nullable    |
| `created_at` | `timestamptz` | Nullable    |

## Table `machines`

### Columns

| Name           | Type          | Constraints |
| -------------- | ------------- | ----------- |
| `id`           | `uuid`        | Primary     |
| `machine_id`   | `text`        | Unique      |
| `machine_name` | `text`        |             |
| `machine_type` | `text`        |             |
| `location`     | `text`        | Nullable    |
| `status`       | `text`        | Nullable    |
| `created_at`   | `timestamptz` | Nullable    |

## Table `alarms`

### Columns

| Name                | Type          | Constraints |
| ------------------- | ------------- | ----------- |
| `id`                | `uuid`        | Primary     |
| `machine_id`        | `uuid`        |             |
| `alarm_code`        | `text`        |             |
| `alarm_description` | `text`        |             |
| `cause`             | `text`        | Nullable    |
| `status`            | `text`        | Nullable    |
| `created_at`        | `timestamptz` | Nullable    |

## Table `maintenance_records`

### Columns

| Name               | Type          | Constraints |
| ------------------ | ------------- | ----------- |
| `id`               | `uuid`        | Primary     |
| `machine_id`       | `uuid`        |             |
| `technician_id`    | `uuid`        | Nullable    |
| `title`            | `text`        |             |
| `details`          | `text`        | Nullable    |
| `maintenance_date` | `timestamptz` | Nullable    |
| `created_at`       | `timestamptz` | Nullable    |

## Table `system_telemetry`

### Columns

| Name                 | Type          | Constraints |
| -------------------- | ------------- | ----------- |
| `id`                 | `uuid`        | Primary     |
| `outdoor_temp`       | `numeric`     | Nullable    |
| `target_temp`        | `numeric`     | Nullable    |
| `pool_temp`          | `numeric`     | Nullable    |
| `water_level_liters` | `numeric`     | Nullable    |
| `updated_at`         | `timestamptz` | Nullable    |
| `pump_stop_rate`     | `numeric`     | Nullable    |

## Table `machine_history`

### Columns

| Name                 | Type          | Constraints |
| -------------------- | ------------- | ----------- |
| `id`                 | `uuid`        | Primary     |
| `machine_uuid`       | `uuid`        | Nullable    |
| `machine_code`       | `text`        |             |
| `machine_name`       | `text`        |             |
| `action`             | `text`        |             |
| `before_data`        | `jsonb`       | Nullable    |
| `after_data`         | `jsonb`       | Nullable    |
| `performed_by`       | `uuid`        | Nullable    |
| `performed_by_name`  | `text`        | Nullable    |
| `performed_by_email` | `text`        | Nullable    |
| `created_at`         | `timestamptz` | Nullable    |

## RLS Policies

### `profiles`

| Policy                           | Command | Roles         | Action     | USING                               | WITH CHECK                          |
| -------------------------------- | ------- | ------------- | ---------- | ----------------------------------- | ----------------------------------- |
| `Only admin can delete profiles` | DELETE  | authenticated | PERMISSIVE | `is_admin()`                        | —                                   |
| `Only admin can update profiles` | UPDATE  | authenticated | PERMISSIVE | `is_admin()`                        | `is_admin()`                        |
| `Profiles - Delete Policy`       | DELETE  | authenticated | PERMISSIVE | `is_admin()`                        | —                                   |
| `Profiles - Insert Policy`       | INSERT  | authenticated | PERMISSIVE | —                                   | `((auth.uid() = id) OR is_admin())` |
| `Profiles - Select Policy`       | SELECT  | authenticated | PERMISSIVE | `true`                              | —                                   |
| `Profiles - Update Policy`       | UPDATE  | authenticated | PERMISSIVE | `((auth.uid() = id) OR is_admin())` | —                                   |
| `Users can create own profile`   | INSERT  | authenticated | PERMISSIVE | —                                   | `(id = auth.uid())`                 |
| `Users can read own profile`     | SELECT  | authenticated | PERMISSIVE | `((id = auth.uid()) OR is_admin())` | —                                   |

### `machines`

| Policy                                         | Command | Roles         | Action     | USING              | WITH CHECK   |
| ---------------------------------------------- | ------- | ------------- | ---------- | ------------------ | ------------ |
| `Active users can view machines`               | SELECT  | authenticated | PERMISSIVE | `is_active_user()` | —            |
| `Allow public read machines`                   | SELECT  | public        | PERMISSIVE | `true`             | —            |
| `Only admin can insert/update/delete machines` | ALL     | authenticated | PERMISSIVE | `is_admin()`       | `is_admin()` |

### `alarms`

| Policy                                       | Command | Roles         | Action     | USING              | WITH CHECK   |
| -------------------------------------------- | ------- | ------------- | ---------- | ------------------ | ------------ |
| `Active users can view alarms`               | SELECT  | authenticated | PERMISSIVE | `is_active_user()` | —            |
| `Allow public read alarms`                   | SELECT  | public        | PERMISSIVE | `true`             | —            |
| `Only admin can insert/update/delete alarms` | ALL     | authenticated | PERMISSIVE | `is_admin()`       | `is_admin()` |

### `maintenance_records`

| Policy                                | Command | Roles         | Action     | USING              | WITH CHECK         |
| ------------------------------------- | ------- | ------------- | ---------- | ------------------ | ------------------ |
| `Active users can manage maintenance` | ALL     | authenticated | PERMISSIVE | `is_active_user()` | `is_active_user()` |
| `Allow public read maintenance`       | SELECT  | public        | PERMISSIVE | `true`             | —                  |

### `system_telemetry`

| Policy                            | Command | Roles         | Action     | USING                                   | WITH CHECK                              |
| --------------------------------- | ------- | ------------- | ---------- | --------------------------------------- | --------------------------------------- |
| `Active users can view telemetry` | SELECT  | authenticated | PERMISSIVE | `is_active_user()`                      | —                                       |
| `Allow insert telemetry`          | INSERT  | public        | PERMISSIVE | —                                       | `(auth.role() = 'authenticated'::text)` |
| `Allow public read telemetry`     | SELECT  | public        | PERMISSIVE | `true`                                  | —                                       |
| `Allow update telemetry`          | UPDATE  | public        | PERMISSIVE | `(auth.role() = 'authenticated'::text)` | —                                       |

### `machine_history`

| Policy                                | Command | Roles         | Action     | USING                                                                                                                                   | WITH CHECK |
| ------------------------------------- | ------- | ------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| `Only admin can view machine history` | SELECT  | authenticated | PERMISSIVE | `(EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (lower(TRIM(BOTH FROM profiles.role)) = 'admin'::text))))` | —          |

### 🗄️ Supabase Schema (Virtualize PLC Engine)

[![Interactive ER Diagram](https://img.shields.io/badge/🔍_View_Interactive-ER_Diagram_(Eraser.io)-violet?style=for-the-badge&logo=eraser)](https://app.eraser.io/workspace/84DSDydt9pvNOBGLnGIK?origin=share&diagram=k-g_eflIWKocFujX0W9x)

[![Supabase Schema Diagram](./Shots_SCADA/Machine%20Maintenance%20Data%20Model.png)](https://app.eraser.io/workspace/84DSDydt9pvNOBGLnGIK?origin=share&diagram=k-g_eflIWKocFujX0W9x)

> 💡 **Tip:** คลิกที่ภาพหรือปุ่มด้านบน เพื่อเปิดหน้า **Eraser.io Interactive Canvas** ที่สามารถคลิกลาก ซูมย่อ-ขยาย และตรวจดูความสัมพันธ์ของตาราง Database ได้สมบูรณ์แบบ
เพื่อจำลองการทำงานของ PLC เราใช้ PostgreSQL Table บน Supabase เป็นตัวเก็บ State ของระบบ I/O สามารถนำ SQL Script ด้านล่างไปสร้างใน Supabase SQL Editor ได้ทันที:

```sql
-- 1. Table for Alarms
create table public.alarms (
  id uuid not null default extensions.uuid_generate_v4 (),
  machine_id uuid not null,
  alarm_code text not null,
  alarm_description text not null,
  cause text null,
  status text null default 'Open'::text,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  constraint alarms_pkey primary key (id),
  constraint alarms_machine_id_fkey foreign KEY (machine_id) references machines (id) on delete CASCADE,
  constraint alarms_status_check check (
    (
      status = any (
        array['Open'::text, 'In Progress'::text, 'Closed'::text]
      )
    )
  )
) TABLESPACE pg_default;

-- 2. Table for machine_history
create table public.machine_history (
  id uuid not null default extensions.uuid_generate_v4 (),
  machine_uuid uuid null,
  machine_code text not null,
  machine_name text not null,
  action text not null,
  before_data jsonb null,
  after_data jsonb null,
  performed_by uuid null,
  performed_by_name text null,
  performed_by_email text null,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  constraint machine_history_pkey primary key (id),
  constraint machine_history_performed_by_fkey foreign KEY (performed_by) references profiles (id) on delete set null,
  constraint machine_history_action_check check (
    (
      action = any (
        array['create'::text, 'update'::text, 'delete'::text]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_machine_history_created_at on public.machine_history using btree (created_at desc) TABLESPACE pg_default;

create index IF not exists idx_machine_history_action on public.machine_history using btree (action) TABLESPACE pg_default;

create index IF not exists idx_machine_history_machine on public.machine_history using btree (machine_uuid) TABLESPACE pg_default;

-- 3. Table for machines
create table public.machines (
  id uuid not null default extensions.uuid_generate_v4 (),
  machine_id text not null,
  machine_name text not null,
  machine_type text not null,
  location text null,
  status text null default 'Stop'::text,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  constraint machines_pkey primary key (id),
  constraint machines_machine_id_key unique (machine_id),
  constraint machines_status_check check (
    (
      status = any (
        array[
          'Running'::text,
          'Stop'::text,
          'Alarm'::text,
          'Maintenance'::text,
          'Waiting Part'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create trigger trg_machine_history
after INSERT
or DELETE
or
update on machines for EACH row
execute FUNCTION log_machine_change ();

-- 4. Table for maintenance_records
create table public.maintenance_records (
  id uuid not null default extensions.uuid_generate_v4 (),
  machine_id uuid not null,
  technician_id uuid null,
  title text not null,
  details text null,
  maintenance_date timestamp with time zone null default timezone ('utc'::text, now()),
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  constraint maintenance_records_pkey primary key (id),
  constraint maintenance_records_machine_id_fkey foreign KEY (machine_id) references machines (id) on delete CASCADE,
  constraint maintenance_records_technician_id_fkey foreign KEY (technician_id) references profiles (id) on delete set null
) TABLESPACE pg_default;

-- 5. Table for profile
create table public.profiles (
  id uuid not null,
  email text not null,
  full_name text null,
  role text null default 'pending'::text,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  constraint profiles_pkey primary key (id),
  constraint profiles_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE,
  constraint profiles_role_check check (
    (
      role = any (
        array[
          'admin'::text,
          'technician'::text,
          'pending'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

-- 6. Table for sysytem_telemetry
create table public.system_telemetry (
  id uuid not null default gen_random_uuid (),
  outdoor_temp numeric(5, 2) null default 26.6,
  target_temp numeric(5, 2) null default 36.0,
  pool_temp numeric(5, 2) null default 35.9,
  water_level_liters numeric(10, 2) null default 55000,
  updated_at timestamp with time zone null default now(),
  pump_stop_rate numeric(5, 2) null default 0,
  constraint system_telemetry_pkey primary key (id)
) TABLESPACE pg_default;
```

---

## 📊 6. Report & Project Summary

### 📅 Project Timeline & Plan

| Phase / Task                         |       Planned Date        |        Actual Date        |  Status   |
| :----------------------------------- | :-----------------------: | :-----------------------: | :-------: |
| Requirements & Architecture Design   | 01 Oct 2026 - 05 Oct 2026 | 01 Oct 2026 - 04 Oct 2026 | Completed |
| Supabase Virtual PLC Schema Setup    | 06 Oct 2026 - 10 Oct 2026 | 05 Oct 2026 - 09 Oct 2026 | Completed |
| Frontend SCADA Dashboard Development | 11 Oct 2026 - 20 Oct 2026 | 10 Oct 2026 - 22 Oct 2026 | Completed |
| Real-time Alarm & Trend Logging      | 21 Oct 2026 - 25 Oct 2026 | 23 Oct 2026 - 26 Oct 2026 | Completed |
| System Testing & Documentation       | 26 Oct 2026 - 30 Oct 2026 | 27 Oct 2026 - 30 Oct 2026 | Completed |

### 🔄 Development Cycle & Scope Limit

- **Development Methodology:** ใช้แนวคิด **Agile / Iterative Development** โดยแบ่งรอบ Sprint สั้นๆ เพื่อทดสอบระบบ Real-time Data Transfer และปรับปรุง UI ตาม Feedback
- **Scope Disclaimer:** โครงงานนี้จัดทำขึ้นเพื่อ **"จำลองการทำงาน (Simulation)"** สัญญาณและสถาปัตยกรรมของระบบ SCADA ผ่าน Cloud โดยใช้ Supabase เป็น Virtual PLC **ไม่ใช่การเชื่อมต่อกับอุปกรณ์ฮาร์ดแวร์ PLC หรือปั๊มน้ำจริงในอุตสาหกรรม**

### 🤖 AI Usage Report

ในการพัฒนาระบบนี้ มีการประยุกต์ใช้ AI ในขั้นตอนต่างๆ ดังนี้:

1. **Architecture & Schema Design:** ใช้ Generative AI ช่วยออกแบบโครงสร้าง Supabase Table (Virtual PLC) และปรับแต่ง RLS (Row Level Security)
2. **UI Component Optimization:** ใช้ AI ช่วยสร้าง Tailwinds CSS Layout สำหรับ Dashboard ให้มีความเป็น Industrial SCADA Style
3. **Logic Simulation Scripts:** ใช้ AI ช่วยเขียน ฟังก์ชันสำหรับสุ่ม/จำลองค่าแรงดันน้ำและระดับน้ำ (Mock Telemetry Generator) เพื่อทดสอบสตรีมข้อมูล Real-time

---

<div align="center">

Developed with ❤️ for SCADA Simulation & Learning Purposes

</div>
