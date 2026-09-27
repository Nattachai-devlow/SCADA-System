"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/Toast";
import { useUserRole } from "@/hooks/useUserRole";
import {
  ALARM_TEMPLATES,
  type AlarmTemplate,
} from "@/lib/alarm-templates";

type AlarmItem = {
  id: string;
  machine_id: string;
  alarm_code: string;
  alarm_description: string;
  cause: string | null;
  /* ต้องตรงกับ CHECK constraint ใน 01_init.sql: Open | In Progress | Closed */
  status: "Open" | "In Progress" | "Closed";
  created_at: string;
  machines?: {
    machine_id: string;
    machine_name: string;
  } | null;
};

type Machine = {
  id: string;
  machine_id: string;
  machine_name: string;
  machine_type: string;
};

const ALARM_QUERY = `
  *,
  machines (
    machine_id,
    machine_name
  )
`;

export default function AlarmPage() {
  const [alarms, setAlarms] = useState<AlarmItem[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "OPEN">("OPEN");
  const [simulating, setSimulating] = useState(false);

  const supabase = createClient();
  const { canManage, loading: roleLoading } = useUserRole();

  // ฟังก์ชันรีเฟรชข้อมูล Alarms
  const refreshAlarms = async () => {
    const { data } = await supabase
      .from("alarms")
      .select(ALARM_QUERY)
      .order("created_at", { ascending: false });

    if (data) setAlarms(data as unknown as AlarmItem[]);
  };

  // โหลดข้อมูลครั้งแรกเมื่อเปิดหน้าเว็บ
  useEffect(() => {
    let isMounted = true;

    async function initData() {
      const [{ data, error }, { data: machineRows }] = await Promise.all([
        supabase.from("alarms").select(ALARM_QUERY),
        supabase.from("machines").select("id, machine_id, machine_name, machine_type"),
      ]);

      if (isMounted) {
        if (!error && data) {
          setAlarms(data as unknown as AlarmItem[]);
        }
        if (machineRows) setMachines(machineRows as Machine[]);
        setLoading(false);
      }
    }

    initData();

    return () => {
      isMounted = false;
    };
  }, []);

  // รับทราบเหตุการณ์: Open -> In Progress
  const handleAcknowledge = async (alarmId: string) => {
    if (!canManage) {
      toast.error("เฉพาะผู้ดูแลระบบเท่านั้นที่จัดการสถานะ Alarm ได้");
      return;
    }

    const { error } = await supabase
      .from("alarms")
      .update({ status: "In Progress" })
      .eq("id", alarmId);

    if (error) {
      toast.error(`แก้ไขไม่สำเร็จ: ${error.message}`);
    } else {
      refreshAlarms();
    }
  };

  // ปิดเหตุการณ์: In Progress -> Closed
  const handleClose = async (alarmId: string) => {
    if (!canManage) {
      toast.error("เฉพาะผู้ดูแลระบบเท่านั้นที่จัดการสถานะ Alarm ได้");
      return;
    }

    const { error } = await supabase
      .from("alarms")
      .update({ status: "Closed" })
      .eq("id", alarmId);

    if (error) {
      toast.error(`ปิดไม่สำเร็จ: ${error.message}`);
    } else {
      refreshAlarms();
    }
  };

  /* เลือกเครื่องจักรเป้าหมาย: หาจากประเภทที่แม่แบบระบุไว้ก่อน
     ถ้าไม่มีเครื่องประเภทนั้น ใช้เครื่องแรกแทน */
  const pickMachine = (template: AlarmTemplate): Machine | null => {
    if (machines.length === 0) return null;
    const wanted = template.targetType.toLowerCase();
    return (
      machines.find(
        (m) => m.machine_type.trim().toLowerCase() === wanted,
      ) ?? machines[0]
    );
  };

  const handleSimulate = async () => {
    if (!canManage) {
      toast.error("เฉพาะผู้ดูแลระบบเท่านั้นที่จำลอง Alarm ได้");
      return;
    }

    if (machines.length === 0) {
      toast.error("ยังไม่มีเครื่องจักรในระบบ กรุณาเพิ่มเครื่องก่อน");
      return;
    }

    setSimulating(true);

    // สุ่มแม่แบบ แล้วสร้าง 3 รายการ เพื่อให้เห็นการกระจายตัวของเหตุการณ์
    const picks = Array.from({ length: 3 }, () => {
      const template =
        ALARM_TEMPLATES[
          Math.floor(Math.random() * ALARM_TEMPLATES.length)
        ];
      const machine = pickMachine(template);
      return machine
        ? {
            machine_id: machine.id,
            alarm_code: template.code,
            alarm_description: template.description,
            cause: template.cause,
            status: "Open",
          }
        : null;
    });

    const rows = picks.filter((r) => r !== null);
    const { error } = await supabase.from("alarms").insert(rows);

    if (error) {
      toast.error(`เพิ่มข้อมูลไม่สำเร็จ: ${error.message}`);
    } else {
      toast.success(`เพิ่ม alarm จำลอง ${rows.length} รายการแล้ว`);
      refreshAlarms();
    }
    setSimulating(false);
  };

  const filteredAlarms = alarms.filter((a) => {
    if (filter === "OPEN") return a.status !== "Closed";
    return true;
  });

  const openCount = alarms.filter((a) => a.status !== "Closed").length;

  if (loading) {
    return <div className="text-zinc-600 p-6">กำลังโหลดข้อมูล Alarms...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Alarm Management</h1>
          <p className="text-zinc-600 text-sm">
            บันทึกและจัดการรายการแจ้งเตือนขัดข้องของระบบ
          </p>
        </div>

        {/* Filter Controls + Simulate */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {!roleLoading && canManage && (
            <button
              onClick={handleSimulate}
              disabled={simulating}
              className="px-3 py-1.5 text-xs font-bold rounded-md bg-zinc-900 text-white hover:bg-zinc-700 disabled:opacity-50 transition shadow-sm active:scale-95"
            >
              {simulating ? "กำลังเพิ่ม..." : "จำลอง 3 Alarm"}
            </button>
          )}
          <div className="flex bg-white border border-zinc-200 rounded-lg p-1">
            <button
              onClick={() => setFilter("OPEN")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                filter === "OPEN"
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:text-zinc-800"
              }`}
            >
              ⚠️ รอดำเนินการ ({openCount})
            </button>
            <button
              onClick={() => setFilter("ALL")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                filter === "ALL"
                  ? "bg-zinc-100 text-zinc-800 shadow"
                  : "text-zinc-600 hover:text-zinc-800"
              }`}
            >
              📋 ทั้งหมด ({alarms.length})
            </button>
          </div>
        </div>
      </div>

      {/* Alarm Table */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/60 border-b border-zinc-200 text-zinc-600 text-sm">
                <th className="p-4">เวลาเกิดเหตุ</th>
                <th className="p-4">เครื่องจักร</th>
                <th className="p-4">รหัสข้อผิดพลาด</th>
                <th className="p-4">รายละเอียด</th>
                <th className="p-4">สาเหตุสันนิษฐาน</th>
                <th className="p-4">สถานะ</th>
                {canManage && (
                  <th className="p-4 text-right">การรับทราบ</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-sm">
              {filteredAlarms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-zinc-500">
                    ไม่มีรายการแจ้งเตือนในขณะนี้
                  </td>
                </tr>
              ) : (
                filteredAlarms.map((a) => (
                  <tr key={a.id} className="hover:bg-zinc-100/40 transition">
                    <td className="p-4 text-zinc-600 font-mono text-xs">
                      {new Date(a.created_at).toLocaleString("th-TH")}
                    </td>
                    <td className="p-4 font-semibold text-zinc-800">
                      {a.machines?.machine_name || "-"}
                      <div className="text-[10px] text-zinc-600 font-mono">
                        {a.machines?.machine_id}
                      </div>
                    </td>
                    <td className="p-4 font-mono text-rose-700 font-semibold">
                      {a.alarm_code}
                    </td>
                    <td className="p-4 text-zinc-800">
                      {a.alarm_description}
                    </td>
                    <td className="p-4 text-zinc-600 text-xs">
                      {a.cause || "-"}
                    </td>
                    <td className="p-4">
                      {a.status === "Open" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 shadow-sm animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                          OPEN
                        </span>
                      ) : a.status === "In Progress" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          IN PROGRESS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ✓ CLOSED
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {canManage && a.status === "Open" && (
                        <button
                          onClick={() => handleAcknowledge(a.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition shadow-sm active:scale-95"
                        >
                          Acknowledge
                        </button>
                      )}
                      {canManage && a.status === "In Progress" && (
                        <button
                          onClick={() => handleClose(a.id)}
                          className="px-3 py-1 bg-zinc-800 hover:bg-zinc-900 text-white text-xs font-semibold rounded-lg transition shadow-sm active:scale-95"
                        >
                          Close
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
