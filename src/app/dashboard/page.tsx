"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

type Machine = {
  id: string;
  machine_id: string;
  machine_name: string;
  machine_type: string;
  location: string | null;
  status: string;
};

type TelemetryData = {
  id: string;
  outdoor_temp: number;
  target_temp: number;
  pool_temp: number;
  water_level_liters: number;
  pump_stop_rate?: number;
  updated_at: string;
  time?: string;
};

export default function DashboardOverviewPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [alarmCount, setAlarmCount] = useState<number>(0);
  const [telemetryLogs, setTelemetryLogs] = useState<TelemetryData[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;

    async function loadDashboardData() {
      // 1. ดึงข้อมูลเครื่องจักร
      const { data: machinesData } = await supabase
        .from("machines")
        .select("*");

      // 2. นับ Alarm ที่ยังไม่ปิด ให้ตรงกับแท็บ "รอดำเนินการ" ในหน้า Alarms
      //    กรองฝั่ง client แบบเดียวกันเป๊ะ เพราะถ้าใช้ .neq() ฝั่ง server
      //    แถวที่ status เป็น NULL จะถูกตัดทิ้ง ทำให้สองหน้าไม่ตรงกัน
      const { data: alarmsData } = await supabase
        .from("alarms")
        .select("*");
      const openAlarmCount = (alarmsData ?? []).filter(
        (a) => a.status !== "Closed",
      ).length;

      // 3. ดึงข้อมูลระบบย้อนหลังทั้งหมดจากตาราง system_telemetry
      const { data: telemetryData } = await supabase
        .from("system_telemetry")
        .select("*")
        .order("updated_at", { ascending: true })
        .limit(30);

      if (isMounted) {
        if (machinesData) setMachines(machinesData);
        setAlarmCount(openAlarmCount);
        if (telemetryData) {
          const formatted = telemetryData.map((item) => ({
            ...item,
            outdoor_temp: Number(item.outdoor_temp),
            target_temp: Number(item.target_temp),
            pool_temp: Number(item.pool_temp),
            water_level_liters: Number(item.water_level_liters),
            pump_stop_rate: Number(item.pump_stop_rate || 0),
            time: new Date(item.updated_at).toLocaleTimeString("th-TH", {
              hour: "2-digit",
              minute: "2-digit",
            }),
          }));
          setTelemetryLogs(formatted);
        }
        setLoading(false);
      }
    }

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const total = machines.length;
  const running = machines.filter((m) => m.status === "Running").length;
  const stop = machines.filter((m) => m.status === "Stop").length;
  const maintenance = machines.filter((m) => m.status === "Maintenance").length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Running":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Running
          </span>
        );
      case "Stop":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700 border border-zinc-300">
            <span className="w-2 h-2 rounded-full bg-zinc-400" />
            Stop
          </span>
        );
      case "Maintenance":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Maintenance
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-600 border border-zinc-300">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-zinc-600">กำลังโหลดข้อมูล Dashboard...</div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900">
        ภาพรวมระบบ (Dashboard Overview)
      </h1>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-zinc-200 p-5 rounded-xl">
          <p className="text-zinc-600 text-sm">เครื่องจักรทั้งหมด</p>
          <p className="text-3xl font-bold text-zinc-900 mt-2">{total}</p>
        </div>
        <div className="bg-white border border-zinc-200 p-5 rounded-xl border-l-4 border-l-emerald-500">
          <p className="text-zinc-600 text-sm">กำลังทำงาน (Running)</p>
          <p className="text-3xl font-bold text-emerald-700 mt-2">{running}</p>
        </div>
        <div className="bg-white border border-zinc-200 p-5 rounded-xl border-l-4 border-l-zinc-600">
          <p className="text-zinc-600 text-sm">หยุดทำงาน (Stop)</p>
          <p className="text-3xl font-bold text-zinc-700 mt-2">{stop}</p>
        </div>
        <div className="bg-white border border-zinc-200 p-5 rounded-xl border-l-4 border-l-amber-500">
          <p className="text-zinc-600 text-sm">ซ่อมบำรุง (Maintenance)</p>
          <p className="text-3xl font-bold text-zinc-900 mt-2">
            {maintenance}
          </p>
        </div>
        <div className="bg-white border border-zinc-200 p-5 rounded-xl border-l-4 border-l-rose-500">
          <p className="text-zinc-600 text-sm">
            Alarm ค้างแก้ไข (ยังไม่ปิด)
          </p>
          <p className="text-3xl font-bold text-rose-700 mt-2">{alarmCount}</p>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* กราฟที่ 1: แนวโน้มอุณหภูมิ */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm lg:col-span-2 min-h-[360px]">
          <h2 className="text-md font-bold text-zinc-800 mb-4">
            📈 แนวโน้มอุณหภูมิ (Temperature Trends)
          </h2>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={telemetryLogs}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis dataKey="time" stroke="#71717a" />
                <YAxis stroke="#71717a" unit="°C" domain={[15, 45]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    borderColor: "#e4e4e7",
                    color: "#fff",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="outdoor_temp"
                  name="Outdoor Temp"
                  stroke="#71717a"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="target_temp"
                  name="Target Temp"
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
                <Line
                  type="monotone"
                  dataKey="pool_temp"
                  name="Pool Temp"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* กราฟที่ 2: ปริมาณน้ำใน Tank */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm min-h-[320px]">
          <h2 className="text-md font-bold text-zinc-800 mb-4">
            💧 ปริมาณน้ำใน Tank (Water Level)
          </h2>
          <div className="w-full h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={telemetryLogs}>
                <defs>
                  <linearGradient id="waterColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis dataKey="time" stroke="#71717a" />
                <YAxis stroke="#71717a" unit="L" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    borderColor: "#e4e4e7",
                    color: "#fff",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="water_level_liters"
                  name="ปริมาณน้ำ (ลิตร)"
                  stroke="#0ea5e9"
                  fillOpacity={1}
                  fill="url(#waterColor)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* กราฟที่ 3: อัตราการหยุดทำงานของปั๊ม */}
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm min-h-[320px]">
          <h2 className="text-md font-bold text-zinc-800 mb-4">
            ⚠️ อัตราการที่ปั๊มหยุดทำงาน (Pump Downtime Rate)
          </h2>
          <div className="w-full h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={telemetryLogs}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis dataKey="time" stroke="#71717a" />
                <YAxis stroke="#71717a" unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#18181b",
                    borderColor: "#e4e4e7",
                    color: "#fff",
                  }}
                />
                <Bar
                  dataKey="pump_stop_rate"
                  name="อัตราการหยุด (%)"
                  fill="#f43f5e"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Machine Status Table */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-4 text-zinc-800">
          สถานะเครื่องจักรล่าสุด
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 text-zinc-600 text-sm">
                <th className="p-3">ID</th>
                <th className="p-3">ชื่อเครื่องจักร</th>
                <th className="p-3">ประเภท</th>
                <th className="p-3">สถานที่</th>
                <th className="p-3">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-sm">
              {machines.map((m) => (
                <tr key={m.id} className="hover:bg-zinc-100/50 transition">
                  <td className="p-3 font-mono text-zinc-800 font-medium">
                    {m.machine_id}
                  </td>
                  <td className="p-3 font-medium text-zinc-800">
                    {m.machine_name}
                  </td>
                  <td className="p-3 text-zinc-700">{m.machine_type}</td>
                  <td className="p-3 text-zinc-600">{m.location || "-"}</td>
                  <td className="p-3">{getStatusBadge(m.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
