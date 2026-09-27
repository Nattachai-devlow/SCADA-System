"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/components/ThemeProvider";
import {
  LineChart,
  Line,
  BarChart,
  Cell,
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

/* สีให้ตรงกับ badge ในหน้า Alarms */
const ALARM_STATUS_COLOR: Record<string, string> = {
  Open: "#f43f5e",
  "In Progress": "#f59e0b",
  Closed: "#10b981",
  "อื่น ๆ": "#71717a",
};

export default function DashboardOverviewPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [alarmCount, setAlarmCount] = useState<number>(0);
  const [alarmByStatus, setAlarmByStatus] = useState<
    { status: string; count: number }[]
  >([]);
  const [alarmsByMachine, setAlarmsByMachine] = useState<
    { machine: string; count: number }[]
  >([]);
  const [telemetryLogs, setTelemetryLogs] = useState<TelemetryData[]>([]);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();
  const { theme } = useTheme();
  const isDark = theme === "dark";

  /* recharts ไม่รับ class ของ Tailwind จึงต้องส่งสีเป็นค่า hex ตามธีม */
  const chartGrid = isDark ? "#27272a" : "#e4e4e7";
  const chartAxis = isDark ? "#a1a1aa" : "#71717a";
  const chartTooltipBg = isDark ? "#18181b" : "#ffffff";
  const chartTooltipBorder = isDark ? "#3f3f46" : "#e4e4e7";
  const chartTooltipText = isDark ? "#fafafa" : "#18181b";

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
      const alarms = alarmsData ?? [];
      const openAlarmCount = alarms.filter(
        (a) => a.status !== "Closed",
      ).length;

      /* แยกตามสถานะ เพื่อวาดกราฟแท่ง — คีย์ต้องตรงกับค่าใน DB
         ถ้ามีค่าใหม่ที่ไม่รู้จักจะถูกรวมเข้าหมวด "อื่น ๆ" แทนที่จะหายไป */
      const STATUS_ORDER = ["Open", "In Progress", "Closed"];
      const known = STATUS_ORDER.map((status) => ({
        status,
        count: alarms.filter((a) => a.status === status).length,
      }));
      const otherCount = alarms.length - known.reduce((s, k) => s + k.count, 0);
      if (otherCount > 0) known.push({ status: "อื่น ๆ", count: otherCount });

      /* นับต่อเครื่อง เพื่อดูว่าเครื่องไหนสร้าง Alarm มากที่สุด
         alarms.machine_id เก็บ UUID ของ machines.id ไม่ใช่รหัสอย่าง PUMP-01
         จึงต้องแปลงกลับเป็นรหัสที่คนอ่านเข้าใจก่อนนำไปพล็อต */
      const machineLabel = new Map<string, string>(
        (machinesData ?? []).map((m) => [m.id as string, m.machine_id as string]),
      );
      const perMachine = new Map<string, number>();
      for (const a of alarms) {
        const uuid = (a.machine_id as string) ?? "";
        const key = machineLabel.get(uuid) ?? "ไม่ระบุเครื่อง";
        perMachine.set(key, (perMachine.get(key) ?? 0) + 1);
      }

      // 3. ดึงข้อมูลระบบย้อนหลังทั้งหมดจากตาราง system_telemetry
      const { data: telemetryData } = await supabase
        .from("system_telemetry")
        .select("*")
        .order("updated_at", { ascending: true })
        .limit(30);

      if (isMounted) {
        if (machinesData) setMachines(machinesData);
        setAlarmCount(openAlarmCount);
        setAlarmByStatus(known);
        setAlarmsByMachine(
          [...perMachine.entries()]
            .map(([machine, count]) => ({ machine, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6),
        );
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
  const waitingPart = machines.filter((m) => m.status === "Waiting Part").length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Running":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Running
          </span>
        );
      case "Stop":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700">
            <span className="w-2 h-2 rounded-full bg-zinc-400" />
            Stop
          </span>
        );
      case "Maintenance":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Maintenance
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-700">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-zinc-600 dark:text-zinc-400">กำลังโหลดข้อมูล Dashboard...</div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 dark:text-zinc-50">
        ภาพรวมระบบ (Dashboard Overview)
      </h1>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl">
          <p className="text-zinc-600 dark:text-zinc-400 text-sm">เครื่องจักรทั้งหมด</p>
          <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">{total}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl border-l-4 border-l-emerald-500">
          <p className="text-zinc-600 dark:text-zinc-400 text-sm">กำลังทำงาน (Running)</p>
          <p className="text-3xl font-bold text-emerald-700 mt-2 dark:text-emerald-400">{running}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl border-l-4 border-l-zinc-600">
          <p className="text-zinc-600 dark:text-zinc-400 text-sm">หยุดทำงาน (Stop)</p>
          <p className="text-3xl font-bold text-zinc-700 dark:text-zinc-300 mt-2">{stop}</p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl border-l-4 border-l-amber-500">
          <p className="text-zinc-600 dark:text-zinc-400 text-sm">ซ่อมบำรุง (Maintenance)</p>
          <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mt-2">
            {maintenance}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl border-l-4 border-l-violet-500">
          <p className="text-zinc-600 dark:text-zinc-400 text-sm">รออะไหล่ (Waiting Part)</p>
          <p className="text-3xl font-bold text-violet-700 mt-2 dark:text-violet-400">
            {waitingPart}
          </p>
        </div>
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl border-l-4 border-l-rose-500">
          <p className="text-zinc-600 dark:text-zinc-400 text-sm">
            Alarm ค้างแก้ไข (ยังไม่ปิด)
          </p>
          <p className="text-3xl font-bold text-rose-700 mt-2 dark:text-rose-400">{alarmCount}</p>
        </div>
      </div>

      {/* Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* กราฟที่ 1: แนวโน้มอุณหภูมิ */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm lg:col-span-2 min-h-[360px]">
          <h2 className="text-md font-bold text-zinc-800 dark:text-zinc-200 mb-4 dark:text-zinc-100">
            📈 แนวโน้มอุณหภูมิ (Temperature Trends)
          </h2>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={telemetryLogs}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                <XAxis dataKey="time" stroke={chartAxis} />
                <YAxis stroke={chartAxis} unit="°C" domain={[15, 45]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartTooltipBg,
                    borderColor: chartTooltipBorder,
                    color: chartTooltipText,
                    borderRadius: 10,
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
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm min-h-[320px]">
          <h2 className="text-md font-bold text-zinc-800 dark:text-zinc-200 mb-4 dark:text-zinc-100">
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
                <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                <XAxis dataKey="time" stroke={chartAxis} />
                <YAxis stroke={chartAxis} unit="L" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartTooltipBg,
                    borderColor: chartTooltipBorder,
                    color: chartTooltipText,
                    borderRadius: 10,
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
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm min-h-[320px]">
          <h2 className="text-md font-bold text-zinc-800 dark:text-zinc-200 mb-4 dark:text-zinc-100">
            ⚠️ อัตราการที่ปั๊มหยุดทำงาน (Pump Downtime Rate)
          </h2>
          <div className="w-full h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={telemetryLogs}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                <XAxis dataKey="time" stroke={chartAxis} />
                <YAxis stroke={chartAxis} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: chartTooltipBg,
                    borderColor: chartTooltipBorder,
                    color: chartTooltipText,
                    borderRadius: 10,
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

        {/* กราฟที่ 4: จำนวน Alarm แยกตามสถานะ */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm min-h-[320px]">
          <h2 className="text-md font-bold text-zinc-800 dark:text-zinc-200 mb-4 dark:text-zinc-100">
            🚨 จำนวน Alarm แยกตามสถานะ (Alarm by Status)
          </h2>
          <div className="w-full h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={alarmByStatus}>
                <CartesianGrid strokeDasharray="3 3" stroke={chartGrid} />
                <XAxis
                  dataKey="status"
                  stroke={chartAxis}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  stroke={chartAxis}
                  allowDecimals={false}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: isDark ? "#27272a" : "#f4f4f5" }}
                  contentStyle={{
                    backgroundColor: chartTooltipBg,
                    borderColor: chartTooltipBorder,
                    color: chartTooltipText,
                    borderRadius: 10,
                  }}
                />
                <Bar dataKey="count" name="จำนวน" radius={[4, 4, 0, 0]}>
                  {alarmByStatus.map((entry) => (
                    <Cell
                      key={entry.status}
                      fill={ALARM_STATUS_COLOR[entry.status] ?? "#71717a"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* กราฟที่ 5: เครื่องจักรที่สร้าง Alarm มากที่สุด */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-sm min-h-[320px]">
          <h2 className="text-md font-bold text-zinc-800 dark:text-zinc-200 mb-4 dark:text-zinc-100">
            🔧 เครื่องจักรที่สร้าง Alarm มากที่สุด (Top Alarm Sources)
          </h2>
          <div className="w-full h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={alarmsByMachine}
                layout="vertical"
                margin={{ left: 8 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={chartGrid}
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  stroke={chartAxis}
                  allowDecimals={false}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  type="category"
                  dataKey="machine"
                  stroke={chartAxis}
                  width={90}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip
                  cursor={{ fill: isDark ? "#27272a" : "#f4f4f5" }}
                  contentStyle={{
                    backgroundColor: chartTooltipBg,
                    borderColor: chartTooltipBorder,
                    color: chartTooltipText,
                    borderRadius: 10,
                  }}
                />
                <Bar
                  dataKey="count"
                  name="จำนวน"
                  fill="#f59e0b"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Machine Status Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-bold mb-4 text-zinc-800 dark:text-zinc-200 dark:text-zinc-100">
          สถานะเครื่องจักรล่าสุด
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-sm">
                <th className="p-3">ID</th>
                <th className="p-3">ชื่อเครื่องจักร</th>
                <th className="p-3">ประเภท</th>
                <th className="p-3">สถานที่</th>
                <th className="p-3">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
              {machines.map((m) => (
                <tr key={m.id} className="hover:bg-zinc-100/50 transition dark:hover:bg-zinc-800/50">
                  <td className="p-3 font-mono text-zinc-800 dark:text-zinc-200 font-medium">
                    {m.machine_id}
                  </td>
                  <td className="p-3 font-medium text-zinc-800 dark:text-zinc-200">
                    {m.machine_name}
                  </td>
                  <td className="p-3 text-zinc-700 dark:text-zinc-300">{m.machine_type}</td>
                  <td className="p-3 text-zinc-600 dark:text-zinc-400">{m.location || "-"}</td>
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
