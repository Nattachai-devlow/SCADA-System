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
    return <div className="text-slate-400 p-6">กำลังโหลดข้อมูล Alarms...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-rose-400">Alarm Management</h1>
          <p className="text-slate-400 text-sm">
            บันทึกและจัดการรายการแจ้งเตือนขัดข้องของระบบ
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-1">
          <button
            onClick={() => setFilter("ACTIVE")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
              filter === "ACTIVE"
                ? "bg-rose-600 text-white shadow shadow-rose-950"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            ⚠️ รอดำเนินการ ({alarms.filter((a) => a.status === "ACTIVE").length}
            )
          </button>
          <button
            onClick={() => setFilter("ALL")}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
              filter === "ALL"
                ? "bg-slate-800 text-slate-200 shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            📋 ทั้งหมด ({alarms.length})
          </button>
        </div>
      </div>

      {/* Alarm Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/60 border-b border-slate-800 text-slate-400 text-sm">
                <th className="p-4">เวลาเกิดเหตุ</th>
                <th className="p-4">เครื่องจักร</th>
                <th className="p-4">รหัสข้อผิดพลาด</th>
                <th className="p-4">รายละเอียด</th>
                <th className="p-4">สาเหตุสันนิษฐาน</th>
                <th className="p-4">สถานะ</th>
                <th className="p-4 text-right">การรับทราบ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-sm">
              {filteredAlarms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    ไม่มีรายการแจ้งเตือนในขณะนี้
                  </td>
                </tr>
              ) : (
                filteredAlarms.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 text-slate-400 font-mono text-xs">
                      {new Date(a.created_at).toLocaleString("th-TH")}
                    </td>
                    <td className="p-4 font-semibold text-slate-200">
                      {a.machines?.machine_name || "-"}
                      <div className="text-[10px] text-slate-400 font-mono">
                        {a.machines?.machine_id}
                      </div>
                    </td>
                    <td className="p-4 font-mono text-rose-400 font-semibold">
                      {a.alarm_code}
                    </td>
                    <td className="p-4 text-slate-200">
                      {a.alarm_description}
                    </td>
                    <td className="p-4 text-slate-400 text-xs">
                      {a.cause || "-"}
                    </td>
                    <td className="p-4">
                      {a.status === "ACTIVE" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-sm shadow-rose-950 animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                          ACTIVE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          ✓ ACKNOWLEDGED
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {a.status === "ACTIVE" && (
                        <button
                          onClick={() => handleAcknowledge(a.id)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition shadow-md shadow-emerald-950 active:scale-95"
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
