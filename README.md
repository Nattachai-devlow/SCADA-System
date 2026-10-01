<div align="center">

# SCADA Water Pump Automation & Monitoring System

[![CI](https://img.shields.io/github/actions/workflow/status/Nattachai-devlow/automation-web-app/ci.yml?branch=main&style=for-the-badge&logo=github-actions&logoColor=white)](https://github.com/Nattachai-devlow/automation-web-app/actions/workflows/ci.yml)
[![CodeQL](https://img.shields.io/github/actions/workflow/status/Nattachai-devlow/automation-web-app/codeql.yml?branch=main&style=for-the-badge&logo=github&logoColor=white)](https://github.com/Nattachai-devlow/automation-web-app/actions/workflows/codeql.yml)
[![Docker](https://img.shields.io/github/actions/workflow/status/Nattachai-devlow/automation-web-app/docker.yml?branch=main&style=for-the-badge&logo=docker&logoColor=white)](https://github.com/Nattachai-devlow/automation-web-app/actions/workflows/docker.yml)
[![Version](https://img.shields.io/badge/version-1.0.0--beta-blue?style=for-the-badge&logo=semver)](https://github.com/Nattachai-devlow/automation-web-app/releases)
[![License](https://img.shields.io/badge/license-MIT-green?style=for-the-badge)](LICENSE)
[![Supabase](https://img.shields.io/badge/Backend-Supabase-emerald?style=for-the-badge&logo=supabase)](https://supabase.com)

**ระบบควบคุมและเฝ้าระวังการทำงานของปั๊มน้ำอุตสาหกรรมแบบเรียลไทม์ผ่านเว็บอินเทอร์เฟซ (Virtual SCADA System)**

[คู่มือการใช้งาน](#5-manual--operating-guide) · [GitHub Actions CI](#6-continuous-integration-cicd) · [Report Bug](https://github.com/Nattachai-devlow/automation-web-app/issues) · [Request Feature](https://github.com/Nattachai-devlow/automation-web-app/issues)

</div>

---

## 1. Header & System Overview

### บทนำ (Description)

**SCADA Water Pump Automation & Monitoring System** คือระบบจำลองการจัดการและควบคุมปั๊มน้ำอุตสาหกรรมด้วยสถาปัตยกรรมระดับโมเดิร์น ออกแบบขึ้นเพื่อจำลองการทำงานของระบบ SCADA (Supervisory Control and Data Acquisition) จริง โดยใช้ **Supabase Cloud** ทำหน้าที่เป็นโครงข่ายสัญญาณจำลองเสมือน **PLC (Programmable Logic Controller)** เพื่อส่งถ่ายข้อมูลสถานะของระบบแบบ Real-time เช่น แรงดันน้ำ ระดับน้ำ และสถานะการทำงานของปั๊ม พร้อมระบบแจ้งเตือนเมื่อเกิดเหตุขัดข้อง

ระบบรองรับผู้ใช้ 3 ระดับสิทธิ์ (ผู้ดูแลระบบ, ช่างเทคนิค, ผู้สมัครที่รออนุมัติ) บันทึกประวัติการเปลี่ยนแปลงเครื่องจักรด้วย Trigger ในฐานข้อมูล และมีระบบ CI ตรวจสอบคุณภาพโค้ดอัตโนมัติทุกครั้งที่มีการ push หรือเปิด Pull Request

---

### System Screenshot

<div align="center">

#### Main Monitoring Dashboard

![Main Dashboard](/Shots_SCADA/Screenshot%202026-09-30%20010223.png)

<br/>

<table>
  <tr>
    <td align="center" width="50%">
      <b>Pump Control Panel</b><br/><br/>
      <img src="/Shots_SCADA/control2.png" alt="Pump Control Panel" width="100%"/>
    </td>
    <td align="center" width="50%">
      <b>Alarms Management</b><br/><br/>
      <img src="/Shots_SCADA/alarm1.png" alt="Alarms" width="100%"/>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <b>Machines Master</b><br/><br/>
      <img src="/Shots_SCADA/master.png" alt="Machines Master" width="100%"/>
    </td>
    <td align="center" width="50%">
      <b>Machine History</b><br/><br/>
      <img src="/Shots_SCADA/History.png" alt="Machine History" width="100%"/>
    </td>
  </tr>
  <tr>
    <td align="center" width="50%">
      <b>Users Access Control</b><br/><br/>
      <img src="/Shots_SCADA/role.png" alt="Users Access" width="100%"/>
    </td>
    <td align="center" width="50%">
      <b>Maintenance Logs</b><br/><br/>
      <img src="/Shots_SCADA/maintenanece.png" alt="Maintenance" width="100%"/>
    </td>
  </tr>
</table>

</div>

---

## 2. Key Features

### Real-time Monitoring

- ติดตามสถานะปั๊มน้ำได้ทันที: `Running` (กำลังทำงาน), `Stop` (หยุดทำงาน), `Alarm` (มีคำเตือน), `Maintenance` (กำลังซ่อมบำรุง), `Waiting Part` (รออะไหล่)
- แสดงค่าแรงดันน้ำ (Pressure), ระดับน้ำในถัง (Water Level - ลิตร) และอุณหภูมิ 3 จุด (นอก / เป้าหมาย / สระ) แบบไดนามิก
- หน้า P&ID SCADA รับข้อมูลผ่าน Supabase Realtime (WebSocket) ไม่ต้องรีเฟรชหน้าเว็บ
- แผนผังแสดงลำดับกระบวนการจริง: สูบน้ำเข้า -> กรองน้ำ -> ทำน้ำอุ่น -> วาล์วและเซ็นเซอร์

### Pump Control Modes

- **Manual Mode:** ควบคุมเปิด-ปิดด้วยตนเองผ่าน UI หน้าตู้ควบคุมจำลอง (คลิกการ์ดเครื่องจักรบน P&ID เพื่อสลับ `Running` / `Stop`)
- **Remote Control:** คำสั่งควบคุมทางไกลผ่านระบบ Cloud โดยบันทึกลงตาราง `machines` แล้วสะท้อนกลับทุกเบราว์เซอร์ที่เปิดหน้านั้นอยู่

### Alarm & Event Management

- ระบบบันทึกและแจ้งเตือนเหตุการณ์ผิดปกติ เช่น High Pressure, Low Water Level, Pump Uptime Rate
- รองรับการกดยืนยันการรับทราบคำเตือน (Acknowledge Alarms) เปลี่ยนสถานะ `Open` -> `In Progress`
- ปิดเหตุการณ์ได้เมื่อแก้ไขเสร็จ `In Progress` -> `Closed`
- ปุ่ม "จำลอง 3 Alarm" สร้างเหตุการณ์จำลองจากแม่แบบมาตรฐาน 10 แบบ เพื่อทดสอบระบบแจ้งเตือน
- สถานะ Alarm ถูกบังคับด้วย `CHECK` constraint ที่ฐานข้อมูล ป้องกันการเขียนค่านอกชุด

### Data Logging & Trending

- แสดงกราฟอนุกรมเวลา (Time-series Graph) สำหรับวิเคราะห์แนวโน้มอุณหภูมิ ปริมาณน้ำ และอัตราการหยุดทำงานของปั๊ม
- กราฟจำนวน Alarm แยกตามสถานะ และกราฟ 6 เครื่องที่สร้าง Alarm มากที่สุด
- บันทึกประวัติการทำงานของเครื่องจักรย้อนหลัง (Audit Log) ผ่าน PostgreSQL Trigger เก็บค่าก่อน/หลังเป็น `JSONB` พร้อมชื่อผู้ปฏิบัติการ
- บันทึกงานซ่อมบำรุง (Maintenance Log) เชื่อมกับเครื่องจักรและช่างเทคนิค

### Access Control & Audit

- ระบบสิทธิ์ 3 ระดับบังคับด้วย Row Level Security (RLS) ที่ฝั่งฐานข้อมูล ไม่ใช่แค่ซ่อนปุ่มใน UI
- ผู้สมัครใหม่เริ่มต้นเป็นสถานะ `pending` และเข้าถึงข้อมูลไม่ได้จนกว่าผู้ดูแลจะอนุมัติ
- ประวัติการเปลี่ยนแปลงเครื่องจักร (create / update / delete) ถูกบันทึกอัตโนมัติและอ่านได้เฉพาะผู้ดูแลระบบ

### Reporting

- ส่งออกรายงานภาพรวมเป็นไฟล์ Excel (`.xlsx`) 5 ชีต ตรงกับลำดับข้อมูลบนหน้าจอ ได้จากปุ่ม "ส่งออกเป็น Excel" บนหน้า Dashboard
- หน้าประวัติเครื่องจักรมีตัวกรองค้นหา, ประเภทการกระทำ, ผู้ปฏิบัติการ และช่วงวันที่ พร้อมขยายดูรายละเอียดค่าที่เปลี่ยนทีละฟิลด์

### Quality Assurance

- GitHub Actions ตรวจ Lint, TypeScript, Build, Smoke Test และการรั่วไหลของ Secret ทุกครั้งที่ push หรือเปิด PR
- CodeQL สแกนช่องโหว่ด้านความปลอดภัยของโค้ด JavaScript/TypeScript ทุกสัปดาห์
- Dependabot ติดตามและเปิด PR อัปเดต dependency กลุ่ม Next.js, React, Supabase, TypeScript และ Tailwind

---

## 3. Tech Stack & Architecture

```
+---------------------------------------------------------------+
|                      User Interface (UI)                      |
|          Next.js 16 (App Router) + React 19 + Tailwind 4     |
+------------------------------+--------------------------------+
                               | Realtime Websocket
                               v
+---------------------------------------------------------------+
|                 Supabase Cloud (Virtual PLC)                  |
|    +-------------------+             +-------------------+    |
|    |  Database (PgSQL) | <---------> |  Realtime Engine  |    |
|    +-------------------+             +-------------------+    |
|    |  Auth (GoTrue)    |             |  RLS (3 roles)    |    |
|    +-------------------+             +-------------------+    |
+---------------------------------------------------------------+
                               | (Future Implementation)
                               v
+---------------------------------------------------------------+
|             Physical Devices / TCP/IP Protocol                |
|               (Modbus TCP / MQTT Gateway)                     |
+---------------------------------------------------------------+
```

### Runtime & Framework

| ชั้น | เทคโนโลยี | หน้าที่ |
| --- | --- | --- |
| Framework | Next.js 16.3.6 (App Router, `output: "standalone"`) | SSR / Static rendering, Route Handler |
| UI | React 19.2 | ส่วนประกอบทั้งหมดเป็น Client Component ยกเว้น `layout.tsx` |
| Styling | Tailwind CSS 4 | ธีมสว่าง/มืด, อินเทอร์เฟซอุตสาหกรรม |
| Icons | Lucide React | ไอคอนแถบด้านข้างและการ์ด |
| Charts | Recharts 3 | กราฟเส้น, พื้นที่ และแท่ง |
| Export | write-excel-file | ส่งออกรายงาน `.xlsx` ฝั่งเบราว์เซอร์ |
| Backend | Supabase (PostgreSQL + Auth + Realtime + RLS) | Virtual PLC, ฐานข้อมูล, สิทธิ์ |
| Container | Docker + docker compose | Multi-stage build, เปิดบริการที่ port 3000 |

### Data Flow

1. ผู้ใช้เปลี่ยนสถานะเครื่องจักรผ่าน UI -> `UPDATE machines`
2. Supabase Realtime ดันเหตุการณ์ `postgres_changes` ไปยังทุก client ที่ subscribe อยู่
3. หน้า P&ID อัปเดตการ์ดเครื่องจักรและเส้นท่อไหลทันทีโดยไม่ต้องรีเฟรช
4. PostgreSQL Trigger `trg_machine_history` จับการเปลี่ยนแปลงแล้วเขียนลง `machine_history` พร้อมชื่อผู้ปฏิบัติการ
5. Dashboard ดึงข้อมูลล่าสุด 30 แถวจาก `system_telemetry` เพื่อวาดกราฟอนุกรมเวลา

### Communication Protocol

- **ปัจจุบัน:** WebSocket / REST API ผ่าน Supabase Realtime Engine
- **แผนอนาคต:** Industrial TCP/IP Protocols (Modbus TCP, MQTT Gateway)

---

## 4. Quick Start & Installation

### Prerequisites

- [Node.js](https://nodejs.org/) **v20.9.0 หรือใหม่กว่า** (Next.js 16 บังคับใช้ Node 20.9+)
- [npm](https://www.npmjs.com/) 10 ขึ้นไป หรือ [yarn](https://yarnpkg.com/)
- บัญชีใช้งาน [Supabase Cloud](https://supabase.com/) (แผน Free ก็เพียงพอสำหรับโปรเจกต์นี้)
- เครื่องมือสำหรับรัน SQL: Supabase SQL Editor หรือ `psql` / Docker (ถ้าจะรันในเครื่อง)

### Step-by-Step Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/Nattachai-devlow/automation-web-app.git
   cd automation-web-app
   ```

2. **Install dependencies**

   ```bash
   npm ci
   ```

   ใช้ `npm ci` เมื่อทำงานกับ CI เพราะจะติดตั้งตาม `package-lock.json` ให้ตรงกันทุกครั้ง ถ้าต้องการเพิ่ม package ใหม่ให้ใช้ `npm install` แล้ว commit lockfile ไปพร้อมกัน

3. **Configure Environment Variables**

   คัดลอกไฟล์ตัวอย่างแล้วกรอกค่า:

   ```bash
   cp .env.example .env.local
   ```

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

   ดูรายละเอียดของทุกตัวแปรใน [หัวข้อ 5.2](#52-ตัวแปรสภาพแวดล้อม-environment-variables)

4. **Prepare the database**

   รันไฟล์ SQL ใน `src/supabase/` ตามลำดับเลข ใน Supabase SQL Editor
   คำสั่งทั้งหมดและวิธีสร้างผู้ดูแลระบบคนแรกอยู่ใน [หัวข้อ 5.3](#53-เตรียมฐานข้อมูล) และ [หัวข้อ 5.4](#54-สร้างผู้ดูแลระบบคนแรก)

5. **Run the Development Server**

   ```bash
   npm run dev
   ```

   เปิดเบราว์เซอร์ไปที่ `http://localhost:3000`

6. **Run in Production Mode**

   ```bash
   npm run build
   npm run start
   ```

### npm Scripts

| คำสั่ง | รายละเอียด |
| --- | --- |
| `npm run dev` | เปิด Dev Server ที่ port 3000 พร้อม Fast Refresh |
| `npm run build` | สร้าง production build (โหมด `standalone` สำหรับ Docker) |
| `npm run start` | เปิดเซิร์ฟเวอร์จากผลของ `npm run build` |
| `npm run lint` | ตรวจด้วย ESLint (next/core-web-vitals + next/typescript) |
| `npm run lint:fix` | ตรวจและแก้ไขอัตโนมัติเท่าที่ทำได้ |
| `npm run typecheck` | ตรวจชนิดข้อมูลด้วย `tsc --noEmit` ตาม `strict: true` |

---

## 5. Manual & Operating Guide

### 5.1 สถาปัตยกรรมการทำงานแบบย่อ

ระบบแบ่งเป็น 3 ชั้นที่สื่อสารกันผ่าน Supabase

| ชั้น | ทำหน้าที่ | เทียบเท่ากับ |
| --- | --- | --- |
| Presentation | Next.js App Router ทำ SSR และส่งหน้า UI | หน้าจอ HMI ในห้องควบคุม |
| Application | Supabase Client (`@supabase/ssr`) จัดการ session และ query | Logic ใน PLC |
| Data / Virtual PLC | PostgreSQL เก็บ State, Trigger บันทึกประวัติ, RLS คุมสิทธิ์ | I/O Module และหน่วยควบคุม |

### 5.2 ตัวแปรสภาพแวดล้อม (Environment Variables)

| ตัวแปร | จำเป็น | รายละเอียด |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | บังคับ | URL ของโปรเจกต์ Supabase (Settings -> API -> Project URL) ใช้ทั้งฝั่งเซิร์ฟเวอร์และเบราว์เซอร์ จึงถูกฝังลง bundle ตอน build |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | บังคับ | Anon / Publishable key ใช้ยืนยันตัวตนและทำคิวรีฝั่งผู้ใช้ ปลอดภัยที่จะเผยแพร่ เพราะ RLS เป็นตัวคุมสิทธิ์จริง |
| `SUPABASE_URL` | ไม่บังคับ | ใช้สำหรับงานฝั่งเซิร์ฟเวอร์ที่ต้องการ URL เต็ม |
| `SUPABASE_PUBLISHABLE_KEY` | ไม่บังคับ | Publishable key ฝั่งเซิร์ฟเวอร์สำหรับงาน admin ที่ปลอดภัยพอ |
| `SUPABASE_SECRET_KEY` | ไม่บังคับ | Secret key ฝั่งเซิร์ฟเวอร์เท่านั้น **ห้าม** อยู่ใน `NEXT_PUBLIC_*` และห้าม commit |
| `SUPABASE_JWKS_URL` | ไม่บังคับ | จุดสิ้นสุด JWKS สำหรับตรวจสอบ JWT ฝั่งเซิร์ฟเวอร์ |
| `POSTGRES_PASSWORD` | เฉพาะ Docker | `docker compose` อ่านจากไฟล์ `.env` (ไม่ใช่ `.env.local`) ใช้กับบริการ `postgres-db` |

**ข้อควรระวัง**

- ไฟล์ `.env*` ถูก ignore ใน `.gitignore` ยกเว้น `.env.example` ดังนั้นห้าม force-add ไฟล์เหล่านี้
- ค่า `NEXT_PUBLIC_*` ถูกฝังตอน `npm run build` การเปลี่ยนค่าจึงต้อง build ใหม่เสมอ
- หน้า CI ใช้ค่าจำลองตอน build เพราะการ compile ไม่ได้ติดต่อ Supabase จริง

### 5.3 เตรียมฐานข้อมูล

ไฟล์ทั้งหมดอยู่ที่ `src/supabase/` ให้รันตามลำดับเลขนามก็ตาม **ครั้งเดียวต่อหนึ่งไฟล์** ใน Supabase SQL Editor

| ลำดับ | ไฟล์ | สิ่งที่ทำ | รันซ้ำได้ |
| --- | --- | --- | --- |
| 1 | `01_init.sql` | สร้าง extension `uuid-ossp` และตาราง `profiles`, `machines`, `alarms`, `maintenance_records` พร้อม seed เครื่องจักร 3 เครื่อง | ได้ (`IF NOT EXISTS` + `ON CONFLICT DO NOTHING`) |
| 2 | `02_seed_alarms.sql` | ใส่ข้อมูล Alarm ตัวอย่างพร้อมสถานะครบทุกแบบ | ต้องระวัง อาจซ้ำถ้ารันบ่อย |
| 3 | `03_fix_legacy_alarm_status.sql` | แปลงสถานะ Alarm รุ่นเก่า (เช่น `Unacknowledged`, `Resolved`) ให้อยู่ในชุด `Open` / `In Progress` / `Closed` ก่อนบังคับ constraint | ได้ |
| 4 | `04_add_waiting_part_status.sql` | เพิ่มสถานะ `Waiting Part` ให้ `machines` โดยตรวจสอบว่าไม่มีค่าเก่าหลงเหลือ | ได้ |
| 5 | `05_machine_history.sql` | สร้างตาราง `machine_history`, ฟังก์ชัน `log_machine_change()`, trigger `trg_machine_history`, index และ RLS | ได้ |
| 6 | `RLS.sql` | เปิด Row Level Security ทุกตาราง พร้อมฟังก์ชันช่วย `is_admin()` และ `is_active_user()` | ได้ |

**หลังรัน `RLS.sql` เสร็จ ต้องเปิด Realtime** ไม่เช่นนั้นหน้า P&ID จะไม่อัปเดตอัตโนมัติ (ค่าเริ่มต้นยังโหลดได้จากการ refresh ปกติ)

```sql
-- เพิ่มตารางเข้า publication เพื่อให้ Supabase Realtime ส่งเหตุการณ์มายัง client
ALTER PUBLICATION supabase_realtime ADD TABLE public.machines;
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_telemetry;
```

ตรวจสอบผลหลังรันเสร็จ

```sql
-- ตารางทั้งหมดที่มีอยู่
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- ตารางที่เปิด RLS แล้ว
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- trigger ประวัติเครื่องจักร
SELECT tgname, tgenabled FROM pg_trigger WHERE tgname = 'trg_machine_history';

-- ตารางที่เข้า Realtime แล้ว
SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
```

### 5.4 สร้างผู้ดูแลระบบคนแรก

ระบบใช้โมเดล "อนุมัติโดยผู้ดูแล" ทำให้ผู้สมัครใหม่ทุกคนเริ่มต้นเป็น `pending` และเข้าถึงข้อมูลไม่ได้ ดังนั้นผู้ดูแลคนแรกต้องถูกเลื่อนสิทธิ์ด้วย SQL Editor โดยตรง

1. เปิดหน้า `/login` แล้วกดสมัครสมาชิก (Sign Up) ด้วยอีเมลและรหัสผ่าน
   - ถ้า Supabase เปิด "Confirm email" ให้กดลิงก์ยืนยันในอีเมลก่อน หรือปิดตัวเลือกนี้ใน Settings -> Authentication -> Sign In / Providers
2. ตรวจสอบว่ามีแถวในตาราง `profiles` แล้ว

   ```sql
   SELECT id, email, full_name, role FROM public.profiles ORDER BY created_at;
   ```

3. เลื่อนสิทธิ์เป็นผู้ดูแลระบบ

   ```sql
   UPDATE public.profiles
      SET role = 'admin'
    WHERE email = 'you@example.com';
   ```

4. โหลดหน้าเว็บใหม่ (Refresh) แล้วเข้าสู่ระบบอีกครั้ง เมนู "ประวัติเครื่องจักร" และ "จัดการสิทธิ์ผู้ใช้" จะปรากฏในแถบด้านข้าง

> หน้าเว็บอ่าน role ครั้งเดียวตอน mount หากเปลี่ยน role ของบัญชีที่กำลังล็อกอินอยู่ ต้อง refresh หรือล็อกอินใหม่เสมอ

### 5.5 ระบบสิทธิ์ (Role-Based Access Control)

| ความสามารถ | `admin` | `technician` | `pending` |
| --- | --- | --- | --- |
| เข้าสู่ระบบผ่านหน้า Login | ได้ | ได้ | ได้ |
| เข้าถึงหน้า Dashboard | ได้ | ได้ | ไม่ได้ (ถูกส่งไป `/pending`) |
| ดูภาพรวม, P&ID, เครื่องจักร, Alarm, ซ่อมบำรุง | ได้ | ได้ | ไม่ได้ |
| เพิ่ม / แก้ไข / ลบเครื่องจักร | ได้ | ไม่ได้ | ไม่ได้ |
| เปลี่ยนสถานะเครื่องจักร (P&ID และตาราง) | ได้ | ไม่ได้ | ไม่ได้ |
| รับทราบ / ปิด Alarm | ได้ | ไม่ได้ | ไม่ได้ |
| จำลอง Alarm | ได้ | ไม่ได้ | ไม่ได้ |
| บันทึกงานซ่อมบำรุง | ได้ | ได้ | ไม่ได้ |
| เปลี่ยนสถานะเครื่องจักรจากฟอร์มซ่อม | ได้ | ไม่ได้ (บันทึกงานได้ แต่ข้ามการเปลี่ยนสถานะ) | ไม่ได้ |
| ดูประวัติเครื่องจักร | ได้ | ไม่ได้ (เมนูไม่แสดง) | ไม่ได้ |
| อนุมัติ / เพิ่ม / แก้ไข / ลบผู้ใช้ | ได้ | ไม่ได้ | ไม่ได้ |

**หลักการทำงานของระบบสิทธิ์**

- `DashboardGuard` ทำหน้าที่ตรวจ session และ role ก่อน render เนื้อหาใน `src/app/dashboard/layout.tsx`
  - ไม่ได้ล็อกอิน -> ไป `/login`
  - role เป็น `pending` หรือไม่มี profile -> ไป `/pending` (fail-closed)
  - รอ role โหลดเสร็จก่อนตัดสินใจ เพื่อไม่ให้หน้าจอกระพริบผิดสถานะ
- UI ซ่อนปุ่มที่ไม่มีสิทธิ์ แต่ **การบังคับจริงอยู่ที่ RLS** ฝั่งฐานข้อมูล
- ฟังก์ชัน `is_admin()` และ `is_active_user()` ใช้ `lower(trim(role))` จึงยังทำงานถูกต้องแม้มีช่องว่างหรือตัวพิมพ์ใหญ่ในข้อมูล

### 5.6 คู่มือใช้งานทีละหน้า

#### 5.6.1 หน้า Login (`/login`)

| ส่วน | การทำงาน |
| --- | --- |
| Sign In | ยืนยันตัวตนด้วยอีเมลและรหัสผ่าน จากนั้นอ่าน role จาก `profiles` เพื่อตัดสินเส้นทาง |
| Sign Up | สร้างบัญชีใหม่ แล้วเขียน `profiles` ด้วย `role = 'pending'` ทันที แล้วส่งไปหน้า `/pending` |
| Theme Toggle | สลับธีมสว่าง/มืดที่มุมขวาบน ค่าถูกจำไว้ในเบราว์เซอร์ |

**ผลลัพธ์หลังเข้าสู่ระบบ**

- `admin` / `technician` -> `/dashboard`
- `pending` หรือไม่มี profile -> `/pending`

#### 5.6.2 หน้า Pending (`/pending`)

หน้ารอการอนุมัติ แสดงสถานะบัญชีและให้ผู้ใช้ออกจากระบบได้ ผู้ใช้จะยังเข้า Dashboard ไม่ได้จนกว่าผู้ดูแลจะเปลี่ยน role ผ่านหน้า "จัดการสิทธิ์ผู้ใช้" หรือผ่าน SQL

#### 5.6.3 ภาพรวมระบบ (`/dashboard`)

| ส่วน | รายละเอียด |
| --- | --- |
| All Machinery | จำนวนเครื่องทั้งหมด พร้อมแถบสัดส่วนตามสถานะ (`Running`, `Stop`, `Maintenance`, `Waiting Part`, อื่น ๆ) |
| Metric Cards | การ์ดรายสถานะพร้อมเปอร์เซ็นต์ของทั้งหมด และการ์ด Alarms Remaining ที่นับเฉพาะรายการที่ยังไม่ `Closed` |
| Temperature Trends | กราฟเส้น 3 เส้น: `Outdoor Temp`, `Target Temp`, `Pool Temp` (หน่วย องศาเซลเซียส) |
| Water Tank Level | กราฟพื้นที่แสดงปริมาณน้ำในถัง (ลิตร) |
| Pump Downtime Rate | กราฟแท่งแสดงอัตราการหยุดทำงานของปั๊ม (เปอร์เซ็นต์) |
| Alarm by Status | กราฟแท่งแยกตาม `Open` / `In Progress` / `Closed` ค่าที่ไม่รู้จักจะถูกรวมในหมวด "อื่น ๆ" |
| Top Alarm Sources | 6 เครื่องที่สร้าง Alarm มากที่สุด |
| Latest Machine Status | ตารางสรุปสถานะล่าสุดของทุกเครื่อง |
| ส่งออกเป็น Excel | ดาวน์โหลด `.xlsx` 5 ชีต: ภาพรวม, Telemetry, Alarm by Status, Top Alarm Sources, สถานะเครื่องจักร |

กราฟใช้ข้อมูล `system_telemetry` 30 แถวล่าสุดเรียงตาม `updated_at` จากเก่าไปใหม่

#### 5.6.4 P&ID SCADA (`/dashboard/scada`)

หน้าแผนผังกระบวนการแบบเรียลไทม์

| ส่วน | รายละเอียด |
| --- | --- |
| แถบหัวบอร์ด | ชื่อระบบ, สถานะการไหล, คีย์สถานะสี |
| เส้นทางน้ำ | ไหลจากถัง -> ปั๊ม -> กรอง -> ทำน้ำอุ่น -> วาล์ว/เซ็นเซอร์ -> กลับเข้าถัง |
| ถังน้ำ | แสดงระดับน้ำเป็นเปอร์เซ็นต์เทียบความจุ `75,000 L` (ป้องกันค่าที่อยู่นอกช่วง 0-100%) |
| เกจอุณหภูมิ | 3 ตัว (นอก / เป้าหมาย / สระ) พร้อมเทียบค่าเป้าหมายทันที |
| การ์ดเครื่องจักร | แสดงสถานะสี ชื่อ และรหัส คลิกเพื่อสลับ `Running` / `Stop` (เฉพาะผู้ดูแล) |
| Realtime | ฟังเหตุการณ์ `INSERT` / `UPDATE` / `DELETE` ของ `machines` และ `system_telemetry` ผ่าน WebSocket |

**การจัดกลุ่มเครื่องจักรตามขั้นตอน** เกิดจากค่า `machine_type` (ไม่บังคับด้วย CHECK จึงรองรับชื่อเก่าได้)

| ขั้นตอน | ค่า `machine_type` ที่รองรับ |
| --- | --- |
| สูบน้ำเข้าระบบ (Intake) | `pump` |
| กรองน้ำ (Filtration) | `filter`, `sand filter`, `filter tank` |
| ทำน้ำอุ่น (Heating) | `heater`, `heat`, `heat pump`, `heat exchanger` |
| วาล์วและเซ็นเซอร์ (Control) | `valve`, `sensor` |
| อื่น ๆ (Other) | ทุกค่าที่ไม่ตรงข้างบน |

เครื่องที่มี `status = 'Running'` ในขั้นตอนใดจะทำให้เส้นท่อในขั้นตอนนั้นแสดงสถานะไหล และถ้ามีปั๊มกำลังทำงานอย่างน้อย 1 เครื่องระบบจะถือว่ามีการสูบน้ำเข้าระบบ

#### 5.6.5 เครื่องจักร (`/dashboard/machines`)

| การทำงาน | สิทธิ์ที่ต้องใช้ |
| --- | --- |
| ดูตารางเครื่องจักร | ทุกคนที่ผ่านการอนุมัติ |
| เพิ่มเครื่องจักร (Modal) | ผู้ดูแลระบบ |
| แก้ไข / ลบเครื่องจักร | ผู้ดูแลระบบ |
| เปลี่ยนสถานะด่วนจาก Dropdown ในตาราง | ผู้ดูแลระบบ |

**ฟิลด์ของเครื่องจักร**

| ฟิลด์ | ความหมาย | ข้อบังคับ |
| --- | --- | --- |
| `machine_id` | รหัสเครื่อง เช่น `PUMP-01` | บังคับ และต้องไม่ซ้ำ (UNIQUE) |
| `machine_name` | ชื่อเครื่องจักร | บังคับ |
| `machine_type` | ประเภท ใช้จัดกลุ่มบน P&ID | บังคับ |
| `location` | สถานที่ติดตั้ง | ไม่บังคับ |
| `status` | สถานะปัจจุบัน | ค่าเริ่มต้น `Stop` |

#### 5.6.6 สถานะ Alarm (`/dashboard/alarms`)

| ส่วน | รายละเอียด |
| --- | --- |
| แท็บ "รอดำเนินการ" | แสดงเฉพาะ Alarm ที่ `status <> 'Closed'` (ค่าเริ่มต้นของหน้า) |
| แท็บ "ทั้งหมด" | แสดงทุกรายการรวมที่ปิดแล้ว |
| จำลอง 3 Alarm | สุ่มแม่แบบ 3 รายการแล้ว insert ลงฐานข้อมูล (เฉพาะผู้ดูแล) ถ้ายังไม่มีเครื่องจักรจะแจ้งให้เพิ่มเครื่องก่อน |
| รับทราบ | เปลี่ยน `Open` -> `In Progress` (เฉพาะผู้ดูแล) |
| ปิด | เปลี่ยน `In Progress` -> `Closed` (เฉพาะผู้ดูแล) |
| ตาราง | เวลาเกิดเหตุ, เครื่องจักร, รหัสข้อผิดพลาด, รายละเอียด, สาเหตุสันนิษฐาน, สถานะ |

**แม่แบบ Alarm ที่ใช้จำลองเหตุการณ์ (10 แบบ)**

| รหัส | รายละเอียด | ระดับ | เครื่องเป้าหมาย |
| --- | --- | --- | --- |
| `PMP-LOW-PR` | แรงดันปั๊มต่ำกว่าค่าตั้ง | critical | pump |
| `PMP-VIB-HI` | การสั่นสะเทือนของปั๊มเกินค่าที่กำหนด | warning | pump |
| `PMP-AMP-HI` | กระแสไฟฟ้าของมอเตอร์ปั๊มสูงเกินพิกัด | critical | pump |
| `HTR-OT-HI` | อุณหภูมิฮีตเตอร์สูงเกินค่าตั้ง | critical | heater |
| `HTR-CYC-TIME` | ระยะเวลาทำงานสะสมของฮีตเตอร์เกินกำหนด | info | heater |
| `FLT-DP-HI` | ความดันต่างของถังกรองสูงเกินไป | warning | filter |
| `TMP-SNS-RANGE` | ค่าจากเซ็นเซอร์อุณหภูมิอยู่นอกช่วงที่กำหนด | critical | sensor |
| `TMP-POOL-OVR` | อุณหภูมิสระสูงกว่าเป้าหมายมากกว่า 3 องศาเซลเซียส | warning | sensor |
| `VLV-FB-MISMATCH` | สัญญาณยืนยันตำแหน่งวาล์วไม่ตรงกับคำสั่งที่ส่ง | critical | valve |
| `LVL-LOW` | ระดับน้ำในสระต่ำกว่าค่าขั้นต่ำ | warning | sensor |

ระบบเลือกเครื่องเป้าหมายจาก `machine_type` ที่ตรงกับแม่แบบก่อน ถ้าไม่มีเครื่องประเภทนั้นจะใช้เครื่องแรกในระบบแทน

#### 5.6.7 บันทึกซ่อมบำรุง (`/dashboard/maintenance`)

| ส่วน | รายละเอียด |
| --- | --- |
| ค้นหา | ค้นจากชื่องาน รายละเอียด รหัสเครื่อง หรือชื่อเครื่อง |
| กรอง | เลือกเครื่องจักร และช่วงวันที่ (เทียบ `YYYY-MM-DD` โดยตรง) |
| ล้างตัวกรอง | คืนค่าตัวกรองทั้งหมดเป็นค่าเริ่มต้น |
| เพิ่ม / แก้ไข | เลือกเครื่องจักร, ชื่องาน, รายละเอียด, วันที่ และสถานะหลังซ่อม |
| ลบ | ลบรายการ (ปุ่มจะแสดงเฉพาะผู้ดูแล) |
| ผู้บันทึก | `technician_id` ถูกเติมอัตโนมัติจากผู้ใช้ที่ล็อกอินอยู่ |

**พฤติกรรมการเปลี่ยนสถานะเครื่องจักร**

- เมื่อผู้ดูแลบันทึกงานซ่อม ระบบจะตั้งสถานะเครื่องจักรตามที่เลือกในฟอร์ม (`Maintenance`, `Running`, `Stop`, `Alarm`)
- เมื่อช่างเทคนิคบันทึกงานซ่อม รายการจะถูกบันทึกสำเร็จ แต่ระบบจะข้ามการเปลี่ยนสถานะเครื่องจักร เพราะ RLS อนุญาตเฉพาะผู้ดูแล
- เปิดฟอร์มแก้ไข ค่าเริ่มต้นของสถานะจะเป็นสถานะจริงของเครื่อง เพื่อไม่ให้บันทึกทับโดยไม่ตั้งใจ
- ลบเครื่องจักรจะลบ Alarm และบันทึกซ่อมบำรุงของเครื่องนั้นด้วย (`ON DELETE CASCADE`) แต่ประวัติใน `machine_history` จะยังอยู่

#### 5.6.8 ประวัติเครื่องจักร (`/dashboard/machine-history`)

หน้านี้เปิดเฉพาะผู้ดูแลระบบ (ทั้งเมนูและ RLS)

| ส่วน | รายละเอียด |
| --- | --- |
| ค้นหา | ค้นจากรหัสเครื่อง ชื่อเครื่อง ชื่อผู้ปฏิบัติการ หรืออีเมล |
| กรองประเภท | `create` / `update` / `delete` |
| กรองผู้ปฏิบัติการ | เลือกจากรายชื่อที่มีประวัติจริงในข้อมูล |
| กรองช่วงวันที่ | ตัดส่วนเวลาออกจาก `created_at` ก่อนเทียบกับ `YYYY-MM-DD` |
| ขยายแถว | แสดงค่าก่อน/หลังของแต่ละฟิลด์ (Machine ID, ชื่อเครื่องจักร, ประเภท, สถานที่ติดตั้ง, สถานะ) |
| จำนวนแถว | ดึงล่าสุด 500 รายการ |

**ที่มาของข้อมูล**

- ข้อมูลทั้งหมดถูกสร้างโดย trigger `trg_machine_history` แบบ `SECURITY DEFINER` จึงเขียนได้แม้ไม่เปิดสิทธิ์ INSERT ให้ผู้ใช้
- `UPDATE` ที่ค่าไม่เปลี่ยนจริงจะไม่ถูกบันทึก
- เมื่อรันสคริปต์ผ่าน SQL Editor หรือ service key ค่า `auth.uid()` จะเป็น NULL จึงไม่มีชื่อผู้ปฏิบัติการ แต่ไม่ถือเป็นข้อผิดพลาด
- ไม่มี policy สำหรับ INSERT/UPDATE/DELETE โดยตั้งใจ เพื่อไม่ให้สร้างประวัติปลอมได้

#### 5.6.9 จัดการสิทธิ์ผู้ใช้ (`/dashboard/users`)

หน้านี้เปิดเฉพาะผู้ดูแลระบบ

| การทำงาน | รายละเอียด |
| --- | --- |
| อนุมัติผู้สมัคร | เปลี่ยน role จาก `pending` เป็น `technician` ได้ในคลิกเดียว |
| เพิ่มผู้ใช้ | สร้าง `profiles` ใหม่ (ผู้ใช้ต้องมีบัญชีใน Supabase Auth ก่อน) |
| แก้ไขผู้ใช้ | เปลี่ยนชื่อ, อีเมล และ role |
| ลบผู้ใช้ | ลบแถวใน `profiles` (บัญชีใน Supabase Auth ไม่ถูกลบ) |

### 5.7 ชุดค่าคงที่ของระบบ

| ค่า | ตำแหน่ง | ความหมาย |
| --- | --- | --- |
| `TANK_CAPACITY_L = 75000` | `src/app/dashboard/scada/page.tsx` | ความจุถังน้ำ (ลิตร) ใช้คำนวณระดับน้ำเป็นเปอร์เซ็นต์ |
| ความจุ 30 แถว | `src/app/dashboard/page.tsx` | จำนวนจุดข้อมูลที่ใช้วาดกราฟบน Dashboard |
| จำนวน 500 แถว | `src/app/dashboard/machine-history/page.tsx` | จำนวนรายการประวัติที่โหลดมาแสดง |
| 3 รายการ | `src/app/dashboard/alarms/page.tsx` | จำนวน Alarm ที่สร้างต่อครั้งเมื่อกด "จำลอง 3 Alarm" |
| `Waiting Part` | `src/supabase/04_add_waiting_part_status.sql` | สถานะเครื่องจักรที่ต้องเพิ่ม constraint ก่อนใช้งาน |
| ค่าเริ่มต้น telemetry | `src/supabase/01_init.sql` | `outdoor_temp 26.6`, `target_temp 36.0`, `pool_temp 35.9`, `water_level_liters 55000`, `pump_stop_rate 0` |

### 5.8 การจำลองข้อมูล Telemetry

ระบบอ่าน `system_telemetry` แบบอ่านอย่างเดียวจากฝั่งแอป (RLS ไม่เปิดสิทธิ์ INSERT/UPDATE ให้ผู้ใช้) ดังนั้นการเคลื่อนไหวของกราฟและค่าบน P&ID ต้องมาจากการเขียนข้อมูลจากภายนอก เช่น SQL Editor, Edge Function หรืออุปกรณ์จำลอง

ตารางนี้เก็บเป็น **Time-series** แต่ละครั้งที่เขียนจะได้แถวใหม่ (ไม่ใช่การอัปเดตทับ) ดังนั้นควรล้างข้อมูลเก่าเป็นระยะเพื่อไม่ให้ตารางโตไม่จำกัด

```sql
-- เขียนจุดข้อมูลใหม่ 1 จุด
INSERT INTO public.system_telemetry
  (outdoor_temp, target_temp, pool_temp, water_level_liters, pump_stop_rate, updated_at)
VALUES
  (27.40, 36.00, 35.20, 58000, 3.50, now());
```

```sql
-- ดูข้อมูลล่าสุด 10 จุด
SELECT updated_at, outdoor_temp, target_temp, pool_temp, water_level_liters, pump_stop_rate
  FROM public.system_telemetry
 ORDER BY updated_at DESC
 LIMIT 10;
```

```sql
-- ล้างข้อมูลเก่า เก็บเฉพาะ 30 จุดล่าสุด (สำหรับการสาธิต)
DELETE FROM public.system_telemetry
 WHERE id NOT IN (
   SELECT id FROM public.system_telemetry
    ORDER BY updated_at DESC
    LIMIT 30
 );
```

ถ้าต้องการให้กราฟขยับเองในเวลาจริง ให้รันคำสั่ง INSERT ข้างต้นซ้ำทุก 3-5 วินาทีจาก SQL Editor, cron job หรือ Supabase Edge Function

### 5.9 การทำงานแบบ Docker

ไฟล์ `Dockerfile` ใช้ multi-stage build (base -> deps -> builder -> runner) และ `next.config.ts` ตั้ง `output: "standalone"` ทำให้ได้อิมเมจขนาดเล็ก

```bash
# 1) เตรียมค่า POSTGRES_PASSWORD ในไฟล์ .env (docker compose อ่านจาก .env ไม่ใช่ .env.local)
cp .env.example .env

# 2) build และเปิดบริการ
docker compose up --build

# 3) เปิด http://localhost:3000

# 4) ดู log / หยุดบริการ
docker compose logs -f
docker compose down
```

**ข้อควรรู้**

- `docker-compose.yaml` ประกอบด้วยบริการ `postgres-db` (PostgreSQL 15) และ `web-app`
- บริการ `postgres-db` mount โฟลเดอร์ `./supabase/migrations` เข้า `/docker-entrypoint-initdb.d` แต่โฟลเดอร์นี้ **ยังไม่มีอยู่ใน repository** (สคริปต์ทั้งหมดอยู่ที่ `src/supabase/`) หากต้องการใช้ PostgreSQL ในเครื่อง ให้คัดลอกไฟล์ SQL ไปไว้ใน `supabase/migrations/` ก่อนสร้าง volume ครั้งแรก
- ค่า `NEXT_PUBLIC_SUPABASE_URL` และ `NEXT_PUBLIC_SUPABASE_ANON_KEY` ถูกส่งเข้าเป็น build argument จึงต้องรีบิลด์ภาพเมื่อเปลี่ยนค่า
- คอนเทนเนอร์ทำงานด้วยผู้ใช้ `nextjs` (uid 1001) แบบ non-root และฟังที่ `0.0.0.0:3000`

### 5.10 การแก้ปัญหาที่พบบ่อย (Troubleshooting)

| อาการ | สาเหตุที่เป็นไปได้ | วิธีแก้ |
| --- | --- | --- |
| หน้าแสดง "Missing Supabase URL or key" | ไม่ได้สร้างไฟล์ `.env.local` หรือชื่อตัวแปรผิด | คัดลอก `.env.example` เป็น `.env.local` แล้ว restart `npm run dev` |
| เข้าสู่ระบบแล้วถูกส่งไป `/pending` | role ใน `profiles` เป็น `pending` หรือไม่มีแถว | รัน `UPDATE public.profiles SET role = 'technician' WHERE email = '...'` |
| ผู้ใช้สมัครแล้วไม่มีแถวใน `profiles` | สร้าง Auth สำเร็จแต่ upsert profile ล้มเหลว | ตรวจ console แล้วรัน `INSERT INTO public.profiles (id, email, role) VALUES ('<uuid>', '<email>', 'pending')` |
| หน้า P&ID ไม่อัปเดตเอง | ตารางยังไม่ได้เข้า `supabase_realtime` | รัน `ALTER PUBLICATION supabase_realtime ADD TABLE public.machines;` |
| กราฟบน Dashboard ไม่มีข้อมูล | ยังไม่มีแถวใน `system_telemetry` | ใช้คำสั่ง INSERT ตามหัวข้อ 5.8 |
| หน้าประวัติเครื่องจักรขึ้น "ยังไม่ได้สร้างตาราง machine_history" | ยังไม่ได้รัน `05_machine_history.sql` | รันไฟล์ดังกล่าวใน SQL Editor แล้ว refresh |
| กดบันทึกงานซ่อมแล้วสถานะเครื่องไม่เปลี่ยน | ผู้ใช้เป็น `technician` ซึ่ง RLS ไม่อนุญาต | ให้ผู้ดูแลเปลี่ยนสถานะจากหน้าเครื่องจักรหรือ P&ID |
| แจ้งว่า role ค้างเป็น "ยังไม่อนุมัติ" | อ่าน role ครั้งเดียวตอน mount | Refresh หน้าเว็บหรือล็อกอินใหม่ |
| Realtime หลุดเป็นระยะ | การเชื่อมต่อ WebSocket ถูกตัดเมื่อไม่มี activity | โหลดหน้าใหม่ ระบบ subscribe ใหม่ใน `useEffect` |
| `npm ci` ล้มเหลวว่า lock file ไม่ตรงกับ `package.json` | เพิ่ม package โดยไม่ commit lockfile | รัน `npm install` แล้ว commit `package-lock.json` |

### 5.11 Schema Visualizer

#### Supabase Schema Diagram (Virtual PLC Engine)

[![Interactive ER Diagram](https://img.shields.io/badge/View_Interactive-ER_Diagram_(Eraser.io)-violet?style=for-the-badge&logo=eraser)](https://app.eraser.io/workspace/84DSDydt9pvNOBGLnGIK?origin=share&diagram=k-g_eflIWKocFujX0W9x)

[![Supabase Schema Diagram](/Shots_SCADA/Machine%20Maintenance%20Data%20Model.png)](https://app.eraser.io/workspace/84DSDydt9pvNOBGLnGIK?origin=share&diagram=k-g_eflIWKocFujX0W9x)

> คลิกที่ภาพหรือปุ่มด้านบน เพื่อเปิดหน้า **Eraser.io Interactive Canvas** ที่สามารถคลิกลาก ซูมย่อ-ขยาย และตรวจดูความสัมพันธ์ของตาราง Database ได้สมบูรณ์แบบ
>
> เพื่อจำลองการทำงานของ PLC เราใช้ PostgreSQL Table บน Supabase เป็นตัวเก็บ State ของระบบ I/O สามารถนำ SQL Script ใน `src/supabase/` ไปรันใน Supabase SQL Editor ได้ทันที

#### Table `profiles`

| Name         | Type          | Constraints |
| ------------ | ------------- | ----------- |
| `id`         | `uuid`        | Primary     |
| `email`      | `text`        |             |
| `full_name`  | `text`        | Nullable    |
| `role`       | `text`        | Nullable    |
| `created_at` | `timestamptz` | Nullable    |

#### Table `machines`

| Name           | Type          | Constraints |
| -------------- | ------------- | ----------- |
| `id`           | `uuid`        | Primary     |
| `machine_id`   | `text`        | Unique      |
| `machine_name` | `text`        |             |
| `machine_type` | `text`        |             |
| `location`     | `text`        | Nullable    |
| `status`       | `text`        | Nullable    |
| `created_at`   | `timestamptz` | Nullable    |

#### Table `alarms`

| Name                | Type          | Constraints |
| ------------------- | ------------- | ----------- |
| `id`                | `uuid`        | Primary     |
| `machine_id`        | `uuid`        |             |
| `alarm_code`        | `text`        |             |
| `alarm_description` | `text`        |             |
| `cause`             | `text`        | Nullable    |
| `status`            | `text`        | Nullable    |
| `created_at`        | `timestamptz` | Nullable    |

#### Table `maintenance_records`

| Name               | Type          | Constraints |
| ------------------ | ------------- | ----------- |
| `id`               | `uuid`        | Primary     |
| `machine_id`       | `uuid`        |             |
| `technician_id`    | `uuid`        | Nullable    |
| `title`            | `text`        |             |
| `details`          | `text`        | Nullable    |
| `maintenance_date` | `timestamptz` | Nullable    |
| `created_at`       | `timestamptz` | Nullable    |

#### Table `system_telemetry`

| Name                 | Type          | Constraints |
| -------------------- | ------------- | ----------- |
| `id`                 | `uuid`        | Primary     |
| `outdoor_temp`       | `numeric`     | Nullable    |
| `target_temp`        | `numeric`     | Nullable    |
| `pool_temp`          | `numeric`     | Nullable    |
| `water_level_liters` | `numeric`     | Nullable    |
| `updated_at`         | `timestamptz` | Nullable    |
| `pump_stop_rate`     | `numeric`     | Nullable    |

#### Table `machine_history`

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

#### RLS Policies: `profiles`

| Policy                           | Command | Roles         | Action     | USING                               | WITH CHECK                          |
| -------------------------------- | ------- | ------------- | ---------- | ----------------------------------- | ----------------------------------- |
| `Only admin can delete profiles` | DELETE  | authenticated | PERMISSIVE | `is_admin()`                        | -                                   |
| `Only admin can update profiles` | UPDATE  | authenticated | PERMISSIVE | `is_admin()`                        | `is_admin()`                        |
| `Profiles - Delete Policy`       | DELETE  | authenticated | PERMISSIVE | `is_admin()`                        | -                                   |
| `Profiles - Insert Policy`       | INSERT  | authenticated | PERMISSIVE | -                                   | `((auth.uid() = id) OR is_admin())` |
| `Profiles - Select Policy`       | SELECT  | authenticated | PERMISSIVE | `true`                              | -                                   |
| `Profiles - Update Policy`       | UPDATE  | authenticated | PERMISSIVE | `((auth.uid() = id) OR is_admin())` | -                                   |
| `Users can create own profile`   | INSERT  | authenticated | PERMISSIVE | -                                   | `(id = auth.uid())`                 |
| `Users can read own profile`     | SELECT  | authenticated | PERMISSIVE | `((id = auth.uid()) OR is_admin())` | -                                   |

#### RLS Policies: `machines`

| Policy                                         | Command | Roles         | Action     | USING              | WITH CHECK   |
| ---------------------------------------------- | ------- | ------------- | ---------- | ------------------ | ------------ |
| `Active users can view machines`               | SELECT  | authenticated | PERMISSIVE | `is_active_user()` | -            |
| `Allow public read machines`                   | SELECT  | public        | PERMISSIVE | `true`             | -            |
| `Only admin can insert/update/delete machines` | ALL     | authenticated | PERMISSIVE | `is_admin()`       | `is_admin()` |

#### RLS Policies: `alarms`

| Policy                                       | Command | Roles         | Action     | USING              | WITH CHECK   |
| -------------------------------------------- | ------- | ------------- | ---------- | ------------------ | ------------ |
| `Active users can view alarms`               | SELECT  | authenticated | PERMISSIVE | `is_active_user()` | -            |
| `Allow public read alarms`                   | SELECT  | public        | PERMISSIVE | `true`             | -            |
| `Only admin can insert/update/delete alarms` | ALL     | authenticated | PERMISSIVE | `is_admin()`       | `is_admin()` |

#### RLS Policies: `maintenance_records`

| Policy                                | Command | Roles         | Action     | USING              | WITH CHECK         |
| ------------------------------------- | ------- | ------------- | ---------- | ------------------ | ------------------ |
| `Active users can manage maintenance` | ALL     | authenticated | PERMISSIVE | `is_active_user()` | `is_active_user()` |
| `Allow public read maintenance`       | SELECT  | public        | PERMISSIVE | `true`             | -                  |

#### RLS Policies: `system_telemetry`

| Policy                            | Command | Roles         | Action     | USING                                   | WITH CHECK                              |
| --------------------------------- | ------- | ------------- | ---------- | --------------------------------------- | --------------------------------------- |
| `Active users can view telemetry` | SELECT  | authenticated | PERMISSIVE | `is_active_user()`                      | -                                       |
| `Allow insert telemetry`          | INSERT  | public        | PERMISSIVE | -                                       | `(auth.role() = 'authenticated'::text)` |
| `Allow public read telemetry`     | SELECT  | public        | PERMISSIVE | `true`                                  | -                                       |
| `Allow update telemetry`          | UPDATE  | public        | PERMISSIVE | `(auth.role() = 'authenticated'::text)` | -                                       |

#### RLS Policies: `machine_history`

| Policy                                | Command | Roles         | Action     | USING                                                                                                                                   | WITH CHECK |
| ------------------------------------- | ------- | ------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| `Only admin can view machine history` | SELECT  | authenticated | PERMISSIVE | `(EXISTS ( SELECT 1    FROM profiles   WHERE ((profiles.id = auth.uid()) AND (lower(TRIM(BOTH FROM profiles.role)) = 'admin'::text))))` | -          |

#### DDL อ้างอิง (คัดลอกจาก `src/supabase/`)

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

## 6. Continuous Integration (CI/CD)

ระบบมีระบบอัตโนมัติทั้งหมด 4 workflow และการตั้งค่า Dependabot อยู่ใน `.github/`

### 6.1 สรุป Workflow ทั้งหมด

| Workflow | ไฟล์ | เมื่อไหร่ทำงาน | หน้าที่ |
| --- | --- | --- | --- |
| CI | `.github/workflows/ci.yml` | push และ PR เข้า `main` / `develop` | Lint, Type Check, Build, Smoke Test, Secret Scan |
| CodeQL | `.github/workflows/codeql.yml` | push, PR และทุกวันจันทร์ 02:17 UTC | สแกนช่องโหว่ด้านความปลอดภัยของ JavaScript/TypeScript |
| Dependency Review | `.github/workflows/dependency-review.yml` | ทุก PR เข้า `main` / `develop` | ตรวจ dependency ที่เพิ่มเข้ามาว่ามีช่องโหว่ระดับ moderate ขึ้นไปหรือไม่ |
| Docker | `.github/workflows/docker.yml` | push เข้า `main`, push tag `v*.*.*`, PR เข้า `main` | Build อิมเมจ Docker และ push เข้า GitHub Container Registry |

### 6.2 รายละเอียด Job ใน Workflow `CI`

| Job | คำสั่งที่รัน | หมายเหตุ |
| --- | --- | --- |
| `lint` | `npm ci` + `npm run lint` | ใช้ ESLint ตาม `eslint-config-next` (core-web-vitals + typescript) |
| `typecheck` | `npm ci` + `npm run typecheck` | `tsc --noEmit` ภายใต้ `strict: true` |
| `build` | `npm ci` + `npm run build` | ทำเป็น matrix ทั้ง Node 20 และ 22 (`fail-fast: false`) ใช้ค่า Supabase จำลองตอน build |
| `smoke-test` | `npm run build` + `npm run start` + `curl` | รอเซิร์ฟเวอร์ด้วย `wait-on` แล้วตรวจว่า `/`, `/login`, `/pending`, `/dashboard` ตอบกลับมา ไม่เก็บ log ไว้ล้มเหลว |
| `secret-scan` | `git ls-files` + gitleaks | ยืนยันว่าไม่มีไฟล์ `.env` ถูก track และสแกนหา secret ทั้งประวัติ git |
| `ci-summary` | เขียน `$GITHUB_STEP_SUMMARY` | รวมผลทุก job ไว้ในหน้า Run ของ GitHub |

ทุก job ใช้ `actions/setup-node@v5` พร้อม `cache: npm` และตั้ง `NEXT_TELEMETRY_DISABLED=1`
มี `concurrency` กลุ่มต่อ branch เพื่อยกเลิกรอบเก่าที่ยังค้างอยู่ และ `timeout-minutes` กำกับทุก job เพื่อไม่ให้ runner ค้าง

### 6.3 การทำงานของ Workflow `Docker`

- ทุก PR จะได้ **build แบบไม่ push** พร้อม cache จาก GitHub Actions เพื่อกันพังตอน merge
- เมื่อ push เข้า `main` หรือ tag `v*.*.*` ระบบจะ **push อิมเมจเข้า `ghcr.io`** พร้อม tag หลายแบบ:
  - `main` (branch)
  - `1.2.3` และ `1.2` (จาก semver tag)
  - `a1b2c3d` (short SHA)
- การเขียนสิทธิ์ package ใช้สิทธิ์ `packages: write` ของ `GITHUB_TOKEN` โดยไม่ต้องตั้ง PAT

### 6.4 ตัวแปรและ Secret ที่ต้องตั้งค่าใน GitHub

| ชื่อ | ประเภท | จำเป็น | ใช้ทำอะไร |
| --- | --- | --- | --- |
| `GITHUB_TOKEN` | อัตโนมัติ | - | ใช้ checkout, รายงานผล CodeQL และ push อิมเมจขึ้น GHCR |
| `NEXT_PUBLIC_SUPABASE_URL` | Repository secret | เมื่อ push อิมเมจ | build argument ตอนสร้างอิมเมจ Docker เวอร์ชันจริง |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Repository secret | เมื่อ push อิมเมจ | build argument ตอนสร้างอิมเมจ Docker เวอร์ชันจริง |
| `NEXT_PUBLIC_SUPABASE_URL` | Repository variable | ไม่บังคับ | ใช้ตอน build ลองใน PR เพื่อไม่ต้องเปิดเผย secret |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Repository variable | ไม่บังคับ | เช่นเดียวกัน |
| `GITLEAKS_LICENSE` | Repository secret | ไม่บังคับ | ต้องมีเฉพาะกรณีใช้ gitleaks เวอร์ชันที่ต้องมี license (องค์กร) |

ตั้งค่าได้ที่ `Settings` -> `Secrets and variables` -> `Actions`

### 6.5 Branch Protection ที่แนะนำ

เพื่อให้ CI มีผลจริง ให้เปิด Branch Protection บน `main` และ `develop`

1. ไปที่ `Settings` -> `Branches` -> `Add rule`
2. Branch name pattern: `main` (ทำซ้ำสำหรับ `develop`)
3. เปิด **Require status checks to pass before merging**
4. เลือก status checks: `Lint`, `Type Check`, `Build (Node 22)`, `Smoke Test`, `Secret Scan`
5. เปิด **Require branches to be up to date before merging**
6. เปิด **Require pull request before merging** (ตั้งจำนวนผู้อนุมัติอย่างน้อย 1)

### 6.6 Dependabot

`.github/dependabot.yml` ตั้งค่าไว้สำหรับ `npm` และ `github-actions` ทุกวันจันทร์ เวลา 07:00 น. (เขตเวลา Asia/Bangkok) และแยก dependency เป็นกลุ่มเพื่อให้ PR ไม่ใหญ่เกินไป

| กลุ่ม | ครอบคลุม |
| --- | --- |
| `next` | `next`, `eslint-config-next`, `@types/react`, `@types/react-dom` |
| `react` | `react`, `react-dom` |
| `supabase` | `@supabase/*` |
| `typescript` | `typescript`, `@types/node` |
| `tailwind` | `tailwindcss`, `@tailwindcss/*` |

### 6.7 ผลลัพธ์ที่ได้จากระบบ CI

| เกณฑ์ | ผลลัพธ์ |
| --- | --- |
| โค้ดมีข้อผิดพลาดด้าน TypeScript | `Type Check` ล้มเหลว พร้อมระบุไฟล์และบรรทัด |
| มี React Hook dependency ผิดหรือใช้ `<img>` โดยไม่จำเป็น | `Lint` เตือนหรือล้มเหลวตามระดับ |
| โค้ดพังเฉพาะบางรุ่น Node | `Build (Node 20)` หรือ `Build (Node 22)` ล้มเหลว |
| Route หลักตอบกลับไม่ได้หลัง build | `Smoke Test` ล้มเหลว พร้อม log ของเซิร์ฟเวอร์ |
| มีคีย์ Supabase หรือรหัสผ่านหลุดเข้าโค้ด | `Secret Scan` ล้มเหลว |
| เพิ่ม dependency ที่มีช่องโหว่ | `Dependency Review` เตือนใน PR |
| รวบรวมผลทั้งหมด | ตารางสรุปในหน้า Run ของ GitHub Actions |

### 6.8 การรันตรวจสอบด้วยตนเองก่อน push

```bash
npm run lint
npm run typecheck
npm run build
```

หรือรันทั้งหมดในครั้งเดียว (PowerShell)

```powershell
npm run lint; if ($?) { npm run typecheck }; if ($?) { npm run build }
```

---

## 7. Report & Project Summary

### Project Timeline & Plan

| Phase / Task                         |       Planned Date        |        Actual Date        |  Status   |
| :----------------------------------- | :-----------------------: | :-----------------------: | :-------: |
| Requirements & Architecture Design   | 14 Sep 2026 - 16 Sep 2026 | 17 Sep 2026 - 17 Sep 2026 | Completed |
| Supabase Virtual PLC Schema Setup    | 20 Sep 2026 - 23 Sep 2026 | 19 Sep 2026 - 20 Sep 2026 | Completed |
| Frontend SCADA Dashboard Development | 23 Sep 2026 - 26 Sep 2026 | 21 Sep 2026 - 24 Sep 2026 | Completed |
| Real-time Alarm & Trend Logging      | 26 Sep 2026 - 27 Sep 2026 | 27 Sep 2026 - 29 Sep 2026 | Completed |
| System Testing & Documentation       | 29 Sep 2026 - 30 Sep 2026 | 29 Sep 2026 - 30 Sep 2026 | Completed |
| CI/CD & Security Hardening          | 01 Oct 2026 - 02 Oct 2026 | 01 Oct 2026 - 02 Oct 2026 | Completed |

### Development Cycle & Scope Limit

- **Development Methodology:** ใช้แนวคิด **Agile / Iterative Development** โดยแบ่งรอบ Sprint สั้นๆ เพื่อทดสอบระบบ Real-time Data Transfer และปรับปรุง UI ตาม Feedback
- **Scope Disclaimer:** โครงงานนี้จัดทำขึ้นเพื่อ **"จำลองการทำงาน (Simulation)"** สัญญาณและสถาปัตยกรรมของระบบ SCADA ผ่าน Cloud โดยใช้ Supabase เป็น Virtual PLC **ไม่ใช่การเชื่อมต่อกับอุปกรณ์ฮาร์ดแวร์ PLC หรือปั๊มน้ำจริงในอุตสาหกรรม**

### AI Usage Report

ในการพัฒนาระบบนี้ มีการประยุกต์ใช้ AI ในขั้นตอนต่างๆ ดังนี้:

1. **Architecture & Schema Design:** ใช้ Generative AI ช่วยออกแบบโครงสร้าง Supabase Table (Virtual PLC) และปรับแต่ง RLS (Row Level Security)
2. **UI Component Optimization:** ใช้ AI ช่วยสร้าง Tailwind CSS Layout สำหรับ Dashboard ให้มีความเป็น Industrial SCADA Style
3. **Logic Simulation Scripts:** ใช้ AI ช่วยเขียน ฟังก์ชันสำหรับสุ่ม/จำลองค่าแรงดันน้ำและระดับน้ำ (Mock Telemetry Generator) เพื่อทดสอบสตรีมข้อมูล Real-time
4. **Documentation & CI:** ใช้ AI ช่วยเรียบเรียงคู่มือการใช้งานและออกแบบ GitHub Actions workflow สำหรับตรวจคุณภาพโค้ดและสแกนความปลอดภัย

---

## License

โปรเจกต์นี้ใช้สัญญาอนุญาต MIT ดูรายละเอียดในไฟล์ `LICENSE`

---

<div align="center">

Developed for SCADA Simulation & Learning Purposes

</div>
