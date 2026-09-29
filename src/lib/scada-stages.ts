import type { LucideIcon } from "lucide-react";
import { Boxes, Filter, Flame, SlidersHorizontal, Waves } from "lucide-react";

/** ขั้นตอนของกระบวนการ เรียงตามที่น้ำไหลผ่านจริง
 *  ตั้งแต่สูบเข้า → กรอง → ทำน้ำร้อน → วาล์ว/เซ็นเซอร์
 *
 *  machines.machine_type เป็นคอลัมน์ free-text ไม่มี CHECK constraint
 *  จึงต้องรองรับทั้งชื่อใหม่และชื่อเก่าที่อาจถูกบันทึกไว้ก่อนแล้ว */
export type StageKey = "intake" | "filtration" | "heating" | "control" | "other";

export type StageDef = {
  key: StageKey;
  label: string;
  sub: string;
  icon: LucideIcon;
  types: string[];
  /** สีประจำขั้นตอน ใช้กับจุดสถานะและเส้นท่อ */
  dot: string;
  pipe: string;
  text: string;
};

export const STAGES: StageDef[] = [
  {
    key: "intake",
    label: "สูบน้ำเข้าระบบ",
    sub: "Intake",
    icon: Waves,
    types: ["pump"],
    dot: "bg-sky-500",
    pipe: "bg-sky-500",
    text: "text-sky-600 dark:text-sky-400",
  },
  {
    key: "filtration",
    label: "กรองน้ำ",
    sub: "Filtration",
    icon: Filter,
    types: ["filter", "sand filter", "filter tank"],
    dot: "bg-teal-500",
    pipe: "bg-teal-500",
    text: "text-teal-600 dark:text-teal-400",
  },
  {
    key: "heating",
    label: "ทำน้ำอุ่น",
    sub: "Heating",
    icon: Flame,
    types: ["heater", "heat", "heat pump", "heat exchanger"],
    dot: "bg-orange-500",
    pipe: "bg-orange-500",
    text: "text-orange-600 dark:text-orange-400",
  },
  {
    key: "control",
    label: "วาล์วและเซ็นเซอร์",
    sub: "Control",
    icon: SlidersHorizontal,
    types: ["valve", "sensor"],
    dot: "bg-violet-500",
    pipe: "bg-violet-500",
    text: "text-violet-600 dark:text-violet-400",
  },
  {
    key: "other",
    label: "อื่น ๆ",
    sub: "Other",
    icon: Boxes,
    types: [],
    dot: "bg-zinc-500",
    pipe: "bg-zinc-500",
    text: "text-zinc-600 dark:text-zinc-400",
  },
];

function normalize(type: string) {
  return type.trim().toLowerCase().replace(/\s+/g, " ");
}

export function stageKeyFor(type: string): StageKey {
  const key = normalize(type);
  const found = STAGES.find((s) => s.types.includes(key));
  return found ? found.key : "other";
}

export type ScadaMachine = {
  id: string;
  machine_id: string;
  machine_name: string;
  machine_type: string;
  status: string;
};

export type StageBucket = {
  def: StageDef;
  machines: ScadaMachine[];
  running: number;
  /** มีเครื่องในขั้นตอนนี้กำลังทำงานอยู่ — ใช้ขับเส้นท่อไหล */
  flowing: boolean;
};

/** แยกเครื่องทั้งหมดเป็นขั้นตอนตามลำดับกระบวนการ
 *  ขั้นตอนที่ไม่มีเครื่องจะถูกตัดออกจากผลลัพธ์ */
export function buildStages(machines: ScadaMachine[]): StageBucket[] {
  const buckets = new Map<StageKey, ScadaMachine[]>();

  for (const machine of machines) {
    const key = stageKeyFor(machine.machine_type);
    const list = buckets.get(key);
    if (list) list.push(machine);
    else buckets.set(key, [machine]);
  }

  return STAGES.flatMap((def) => {
    const list = buckets.get(def.key);
    if (!list?.length) return [];

    const sorted = [...list].sort((a, b) =>
      a.machine_id.localeCompare(b.machine_id),
    );
    const running = sorted.filter((m) => m.status === "Running").length;

    return [{ def, machines: sorted, running, flowing: running > 0 }];
  });
}
