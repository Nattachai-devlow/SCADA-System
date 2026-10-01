# Security Policy (นโยบายความปลอดภัย)

ความปลอดภัยของระบบ **SCADA-System** และข้อมูลการควบคุมทางอุตสาหกรรม/Telemetry เป็นสิ่งที่เราให้ความสำคัญสูงสุด[cite: 3] หากคุณพบช่องโหว่ทางความปลอดภัย กรุณาแจ้งให้เราทราบตามขั้นตอนด้านล่างนี้ครับ

---

## เวอร์ชันที่ได้รับการสนับสนุน (Supported Versions)

เฉพาะเวอร์ชันที่ระบุว่าได้รับการสนับสนุนเท่านั้นที่จะได้รับการอัปเดตความปลอดภัย (Security Patches)

| Version | Supported | Notes |
| :--- | :---: | :--- |
| **1.0.x** | :white_check_mark: | เวอร์ชันหลักปัจจุบัน (Production) |
| **main / master** | :white_check_mark: | โค้ดล่าสุดในพัฒนา |
| **< 1.0.0** | :x: | เวอร์ชันทดสอบเก่า ไม่ได้รับการสนับสนุน |

---

## การแจ้งช่องโหว่ความปลอดภัย (Reporting a Vulnerability)

**ข้อควรระวัง:** ห้ามแจ้งปัญหาเกี่ยวกับช่องโหว่ด้านความปลอดภัยผ่าน **GitHub Public Issues** โดยเด็ดขาด เพื่อป้องกันไม่ให้ผู้ไม่หวังดีนำช่องโหว่ไปใช้โจมตีระบบก่อนได้รับการแก้ไข

### ขั้นตอนการแจ้งปัญหา:
1. ส่งอีเมลรายละเอียดช่องโหว่มาที่ **your-security-email@domain.com** (หรือแจ้งตรงผ่านช่องทาง Private ในทีม)
2. ระบุข้อมูลสำคัญดังนี้:
   - ประเภทของช่องโหว่ (เช่น Supabase RLS Leak, API Key Exposure, Authentication Bypass, Injection)
   - ขั้นตอนการทำให้เกิดช่องโหว่ (Steps to Reproduce / Proof of Concept)
   - ระดับความรุนแรงและผลกระทบต่อระบบ SCADA
3. ทีมพัฒนาจะตอบกลับเพื่อยืนยันการรับเรื่องภายใน **24–48 ชั่วโมง**

---

## ข้อปฏิบัติด้านความปลอดภัยสำหรับนักพัฒนา (Security Best Practices)

1. **Environment & API Keys:**
   - **ห้าม** Commit ไฟล์ `.env` หรือ Supabase `service_role` key ขึ้น Repository เด็ดขาด
   - ใช้งานเฉพาะ `anon` (Public) key ฝั่ง Client เท่านั้น
2. **Database Security (Supabase):**
   - ตารางข้อมูลทุกตาราง (เช่น `system_telemetry`, `profiles`) ต้องเปิดใช้งาน **Row Level Security (RLS)** เสมอ[cite: 3]
   - ห้ามปิด RLS บน Production
3. **Data Integrity & Telemetry:**
   - ตรวจสอบ Input Validation สำหรับข้อมูล Telemetry ที่ส่งเข้ามาทุกครั้ง เพื่อป้องกัน SQL Injection หรือการส่งค่าปลอมเข้าสู่ระบบ[cite: 3]
