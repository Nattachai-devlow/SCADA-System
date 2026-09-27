/* รายการ alarm สำหรับการจำลองเหตุการณ์
 * ใช้ร่วมกันทั้งปุ่ม "จำลอง Alarm" ในหน้า Alarms และไฟล์ seed SQL
 *  status ต้องตรงกับ CHECK constraint ใน 01_init.sql:
 *  'Open' | 'In Progress' | 'Closed' */

export type AlarmSeverity = "critical" | "warning" | "info";

export type AlarmTemplate = {
  code: string;
  description: string;
  cause: string;
  severity: AlarmSeverity;
  /** ประเภทเครื่องจักรที่ควรเลือกมาผูก (ถ้าไม่มีจะใช้เครื่องแรกแทน) */
  targetType: string;
};

export const ALARM_TEMPLATES: AlarmTemplate[] = [
  {
    code: "PMP-LOW-PR",
    description: "แรงดันปั๊มต่ำกว่าค่าตั้ง (Pump pressure below setpoint)",
    cause: "ตะแกรงอุดตัน หรือปั๊มทำงานแบบไม่มีน้ำ (dry run)",
    severity: "critical",
    targetType: "pump",
  },
  {
    code: "PMP-VIB-HI",
    description: "การสั่นสะเทือนของปั๊มเกินค่าที่กำหนด",
    cause: "ตลับลูกปิ่นสึก หรืออากาศเข้าตัวปั๊ม",
    severity: "warning",
    targetType: "pump",
  },
  {
    code: "HTR-OT-HI",
    description: "อุณหภูมิฮีตเตอร์สูงเกินค่าตั้ง (Overtemperature)",
    cause: "สวิตช์ไหลน้ำทำงานผิดปกติ หรืออัตราการไหลต่ำเกินไป",
    severity: "critical",
    targetType: "heater",
  },
  {
    code: "HTR-CYC-TIME",
    description: "ระยะเวลาทำงานสะสมของฮีตเตอร์เกินกำหนด",
    cause: "ต้องเข้าตรวจสอบฮีตเตอร์ตามรอบการบำรุงรักษา",
    severity: "info",
    targetType: "heater",
  },
  {
    code: "FLT-DP-HI",
    description: "ความดันต่างของถังกรองสูงเกินไป (Filter differential pressure)",
    cause: "สื่อกรองอุดตัน ควรทำ backwash",
    severity: "warning",
    targetType: "filter",
  },
  {
    code: "TMP-SNS-RANGE",
    description: "ค่าจากเซ็นเซอร์อุณหภูมิอยู่นอกช่วงที่กำหนด",
    cause: "วงจรเปิดของเซ็นเซอร์ หรือหัววัดเสีย",
    severity: "critical",
    targetType: "sensor",
  },
  {
    code: "TMP-POOL-OVR",
    description: "อุณหภูมิสระสูงกว่าเป้าหมายมากกว่า 3 องศาเซลเซียส",
    cause: "วงจรแสงอาทิตย์ทำงานต่อเนื่อง ตรวจวาล์ว์ผสมน้ำ",
    severity: "warning",
    targetType: "sensor",
  },
  {
    code: "VLV-FB-MISMATCH",
    description: "สัญญาณยืนยันตำแหน่งวาล์ว์ไม่ตรงกับคำสั่งที่ส่ง",
    cause: "แอกทิวเอเตอร์วาล์ว์ติดขัด หรือเซ็นเซอร์ตำแหน่งเสีย",
    severity: "critical",
    targetType: "valve",
  },
  {
    code: "LVL-LOW",
    description: "ระดับน้ำในสระต่ำกว่าค่าขั้นต่ำ",
    cause: "ระบบดูดน้ำมีการรั่ว หรือน้ำระเหยมาก",
    severity: "warning",
    targetType: "sensor",
  },
  {
    code: "PMP-AMP-HI",
    description: "กระแสไฟฟ้าของมอเตอร์ปั๊มสูงเกินพิกัด",
    cause: "ใบพัดติดขัด หรือระยะห่างใบพัดไม่ถูกต้อง",
    severity: "critical",
    targetType: "pump",
  },
];

export const ALARM_STATUSES = ["Open", "In Progress", "Closed"] as const;
export type AlarmStatus = (typeof ALARM_STATUSES)[number];
