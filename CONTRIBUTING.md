# Contributing to SCADA-System

ขอขอบคุณที่คุณสนใจเข้ามามีส่วนร่วมในการพัฒนาโปรเจกต์ **SCADA-System** 

เอกสารนี้จัดทำขึ้นเพื่อกำหนดแนวทางปฏิบัติ ตัวอย่างโค้ด และมาตรฐานในการร่วมพัฒนาโปรเจกต์ ให้ทุกฝ่ายทำงานร่วมกันได้อย่างราบรื่นและเป็นระเบียบครับ

---

##  การตั้งค่าสภาพแวดล้อมเพื่อพัฒนา (Development Setup)

### 1. Prerequisites
- **Node.js**: เวอร์ชัน 18.x ขึ้นไป (หรือตามที่โปรเจกต์กำหนด)
- **Supabase Account**: สำหรับเชื่อมต่อ Database & Telemetry[cite: 3]
- **Git**: สำหรับจัดการ Version Control

### 2. Environment Variables
คัดลอกไฟล์ `.env.example` เป็น `.env` และกรอกค่าคอนฟิกให้ถูกต้องก่อนเริ่มงาน:
```bash
cp .env.example .env
