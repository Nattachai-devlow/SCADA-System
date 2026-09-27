"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type AlarmItem = {
  id: string;
  machine_id: string;
  alarm_code: string;
  alarm_description: string;
  cause: string | null;
  status: string; // 'ACTIVE', 'ACKNOWLEDGED', 'RESOLVED'
  created_at: string;
  machines?: {
    machine_id: string;
    machine_name: string;
  } | null;
};

export default function AlarmPage() {
  const [alarms, setAlarms] = useState<AlarmItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "ACTIVE">("ACTIVE");

  const supabase = createClient();

  // ฟังก์ชันรีเฟรชข้อมูล Alarms (แก้ไขชื่อตารางเป็น 'alarms' เรียบร้อย)
  const refreshAlarms = async () => {
    const { data } = await supabase
      .from("alarms")
      .select(
        `
        *,
        machines (
          machine_id,
          machine_name
        )
      `,
      )
      .order("created_at", { ascending: false });

    if (data) setAlarms(data as unknown as AlarmItem[]);
  };

  // โหลดข้อมูลครั้งแรกเมื่อเปิดหน้าเว็บ (แก้ Warning Cascading Renders)
  useEffect(() => {
    let isMounted = true;

    async function initData() {
      const { data, error } = await supabase
        .from("alarms")
        .select(
          `
          *,
          machines (
            machine_id,
            machine_name
          )
        `,
        )
        .order("created_at", { ascending: false });

      if (isMounted) {
        if (!error && data) {
          setAlarms(data as unknown as AlarmItem[]);
        }
        setLoading(false);
      }
    }

    initData();

    return () => {
      isMounted = false;
    };
  }, []);

  // ฟังก์ชันสำหรับเปลี่ยนสถานะเป็น ACKNOWLEDGED (แก้ไขชื่อตารางเป็น 'alarms' เรียบร้อย)
  const handleAcknowledge = async (alarmId: string) => {
    const { error } = await supabase
      .from("alarms")
      .update({ status: "ACKNOWLEDGED" })
      .eq("id", alarmId);

    if (error) {
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } else {
      refreshAlarms();
    }
  };

  const filteredAlarms = alarms.filter((a) => {
    if (filter === "ACTIVE") return a.status === "ACTIVE";
    return true;
  });

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

        {/* Filter Controls */}
        <div className="flex bg-white border border-zinc-200 rounded-lg p-1">
          <button
            onClick={() => setFilter("ACTIVE")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
              filter === "ACTIVE"
                ? "bg-zinc-900 text-white"
                : "text-zinc-600 hover:text-zinc-800"
            }`}
          >
            ⚠️ รอดำเนินการ ({alarms.filter((a) => a.status === "ACTIVE").length}
            )
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
                <th className="p-4 text-right">การรับทราบ</th>
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
                      {a.status === "ACTIVE" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 shadow-sm animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                          ACTIVE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border-emerald-200">
                          ✓ ACKNOWLEDGED
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {a.status === "ACTIVE" && (
                        <button
                          onClick={() => handleAcknowledge(a.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition shadow-sm active:scale-95"
                        >
                          Acknowledge
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
