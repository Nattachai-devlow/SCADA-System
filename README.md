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

#### 🎛️ Control Panel & Alarm Center

|             Pump Control Panel              |         Alarms Management          |
| :-----------------------------------------: | :--------------------------------: |
| ![Control Panel](/Shots_SCADA/control2.png) | ![Alarms](/Shots_SCADA/alarm1.png) |

#### 🎛️ Machines Master & History

| :-----------------------------------------: | :-------------------------: |
|             Machines Master                 |         Machine History     |
| ![Machines Master](/Shots_SCADA/master.png) | ![History](/Shots_SCADA/History.png) |

#### 🎛️ Users Access & Maintenance

| :-----------------------------------------: | :-------------------------: |
|             Users Access                    |         Maintenance         |
| ![Users Access](/Shots_SCADA/role.png) | ![Maintenance](/Shots_SCADA/maintenanece.png) |

</div>

---

## ✨ 2. Key Features

- ⚡ **Real-time Monitoring:**
  - ติดตามสถานะปั๊มน้ำได้ทันที: `RUN` (กำลังทำงาน), `STOP` (หยุดทำงาน), `FAULT` (เกิดข้อผิดพลาด)
  - แสดงค่าแรงดันน้ำ (Pressure - BAR) และระดับน้ำในถัง (Water Level - Meters/%) แบบไดนามิก
- 🎛️ **Pump Control Modes:**
  - **Auto Mode:** ควบคุมการเปิด-ปิดปั๊มน้ำอัตโนมัติตาม Threshold ของแรงดันและระดับน้ำ
  - **Manual Mode:** ควบคุมเปิด-ปิดด้วยตนเองผ่าน UI หน้าตู้ควบคุมจำลอง
  - **Remote Control:** คำสั่งควบคุมทางไกลผ่านระบบ Cloud
- 🚨 **Alarm & Event Management:**
  - ระบบบันทึกและแจ้งเตือนเหตุการณ์ผิดปกติ (เช่น High Pressure, Low Water Level, Pump Overload)
  - รองรับการกดยืนยันการรับทราบคำเตือน (Acknowledge Alarms)
- 📈 **Data Logging & Trending:**
  - แสดงกราฟอนุกรมเวลา (Time-series Graph) สำหรับวิเคราะห์แนวโน้มแรงดันและระดับน้ำ
  - บันทึกประวัติการทำงานย้อนหลัง (Historical Data Logs) สำหรับนำไปวิเคราะห์ผลต่อ

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

### 🛠️️ Step-by-Step Installation

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

### 🗄️ Supabase Schema (Virtualize PLC Engine)

เพื่อจำลองการทำงานของ PLC เราใช้ PostgreSQL Table บน Supabase เป็นตัวเก็บ State ของระบบ I/O สามารถนำ SQL Script ด้านล่างไปสร้างใน Supabase SQL Editor ได้ทันที:

```sql
-- 1. Table for Real-time Sensors & Pump Status (Virtual I/O)
CREATE TABLE pump_telemetry (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    pump_id VARCHAR(50) NOT NULL DEFAULT 'PUMP-01',
    status VARCHAR(20) CHECK (status IN ('RUN', 'STOP', 'FAULT')) DEFAULT 'STOP',
    mode VARCHAR(20) CHECK (mode IN ('AUTO', 'MANUAL', 'REMOTE')) DEFAULT 'MANUAL',
    pressure_bar NUMERIC(5,2) DEFAULT 0.00,
    water_level_m NUMERIC(5,2) DEFAULT 0.00,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Table for Alarm & Event Logs
CREATE TABLE alarm_logs (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    alarm_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')),
    message TEXT NOT NULL,
    is_acknowledged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Enable Realtime for Telemetry Table
ALTER PUBLICATION supabase_realtime ADD TABLE pump_telemetry;
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
