"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import WaterTank3D from "@/components/WaterTank3D";

/* ความจุถังน้ำ (ลิตร) — ปรับตามขนาดถังจริงของหน้างาน */
const TANK_CAPACITY_L = 75000;

type Machine = {
  id: string;
  machine_id: string;
  machine_name: string;
  machine_type: string;
  status: string;
};

type TelemetryData = {
  id?: string;
  outdoor_temp: number;
  target_temp: number;
  pool_temp: number;
  water_level_liters: number;
};

export default function ScadaPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    outdoor_temp: 26.6,
    target_temp: 36.0,
    pool_temp: 35.9,
    water_level_liters: 55000,
  });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      // 1. ดึงข้อมูลเครื่องจักร
      const { data: machinesData, error: mError } = await supabase
        .from("machines")
        .select("*");

      // 2. ดึงข้อมูล Telemetry (อุณหภูมิ และ ระดับน้ำ)
      const { data: telemetryData, error: tError } = await supabase
        .from("system_telemetry")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (isMounted) {
        if (!mError && machinesData) setMachines(machinesData);
        if (!tError && telemetryData) setTelemetry(telemetryData);
        setLoading(false);
      }
    }

    loadData();

    // ตั้งค่า Realtime Listeners สำหรับการอัปเดตข้อมูลแบบเรียลไทม์
    const telemetryChannel = supabase
      .channel("system_telemetry_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "system_telemetry" },
        (payload) => {
          if (payload.new && isMounted) {
            setTelemetry(payload.new as TelemetryData);
          }
        },
      )
      .subscribe();

    const machinesChannel = supabase
      .channel("machines_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "machines" },
        (payload) => {
          if (payload.new && isMounted) {
            const updatedMachine = payload.new as Machine;
            setMachines((prev) =>
              prev.map((m) =>
                m.id === updatedMachine.id ? updatedMachine : m,
              ),
            );
          }
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(telemetryChannel);
      supabase.removeChannel(machinesChannel);
    };
  }, []);

  const toggleStatus = async (machine: Machine) => {
    setUpdatingId(machine.id);
    let newStatus = "Running";
    if (machine.status === "Running") newStatus = "Stop";
    else if (machine.status === "Stop") newStatus = "Running";
    else newStatus = "Running";

    const { data, error } = await supabase
      .from("machines")
      .update({ status: newStatus })
      .eq("id", machine.id)
      .select();

    if (!error && data) {
      setMachines((prev) =>
        prev.map((m) =>
          m.id === machine.id ? { ...m, status: newStatus } : m,
        ),
      );
    }
    setUpdatingId(null);
  };

  const pump01 = machines.find((m) => m.machine_id === "PUMP-01");
  const heat01 = machines.find((m) => m.machine_id === "HEAT-01");
  const flt01 = machines.find((m) => m.machine_id === "FLT-01");

  if (loading)
    return <div className="p-6 text-zinc-500">Loading SCADA Diagram...</div>;

  return (
    <div className="space-y-6">
      {/* Header Info Cards (ดึงข้อมูลแบบ Dynamic จาก Supabase) */}
      <div className="flex flex-wrap gap-4">
        <div className="bg-white border border-zinc-300 rounded shadow-sm p-3 min-w-[140px]">
          <div className="text-xs text-zinc-500 font-semibold">
            Outdoor Temp
          </div>
          <div className="text-lg font-bold text-zinc-800">
            {Number(telemetry.outdoor_temp).toFixed(1)} °C
          </div>
        </div>
        <div className="bg-white border border-zinc-300 rounded shadow-sm p-3 min-w-[140px]">
          <div className="text-xs text-zinc-500 font-semibold">
            Target Temp
          </div>
          <div className="text-lg font-bold text-emerald-600">
            {Number(telemetry.target_temp).toFixed(1)} °C
          </div>
        </div>
        <div className="bg-white border border-zinc-300 rounded shadow-sm p-3 min-w-[140px]">
          <div className="text-xs text-zinc-500 font-semibold">Pool Temp</div>
          <div className="text-lg font-bold text-sky-600">
            {Number(telemetry.pool_temp).toFixed(1)} °C
          </div>
        </div>
      </div>

      {/* Industrial P&ID Board */}
      <div className="bg-zinc-100 border border-zinc-300 rounded-xl p-8 relative overflow-x-auto min-h-[520px] shadow-inner">
        {/* Pool Tank (3D + animation) */}
        <div className="absolute top-5 left-1/4 w-1/2 min-w-[260px] max-w-[420px]">
          <WaterTank3D
            liters={Number(telemetry.water_level_liters)}
            capacity={TANK_CAPACITY_L}
            running={pump01?.status === "Running"}
            label="POOL"
          />
        </div>

        {/* Process Flow Diagram / Interactive Area */}
        <div className="relative pt-44 flex items-center justify-between gap-4 max-w-5xl mx-auto">
          {/* Water Inlet / Supply */}
          <div className="flex flex-col items-center">
            <span className="bg-white px-2 py-0.5 rounded border border-zinc-300 text-xs font-semibold text-zinc-500 mb-2">
              Water Supply
            </span>
            <div className="w-16 h-8 bg-gradient-to-r from-zinc-200 via-zinc-50 to-zinc-300 border border-zinc-400 rounded-sm flex items-center justify-center shadow">
              <span className="text-[10px] text-zinc-500 font-bold">
                INLET
              </span>
            </div>
          </div>

          {/* Pipe 1 */}
          <div className="flex-1 h-3 bg-gradient-to-b from-zinc-200 via-zinc-50 to-zinc-300 border-y border-zinc-400 relative">
            {pump01?.status === "Running" && (
              <div className="absolute inset-0 bg-sky-400/60 animate-pulse" />
            )}
          </div>

          {/* Machine 1: Industrial Water Pump */}
          <div className="flex flex-col items-center">
            <div
              className={`p-4 rounded-lg border-2 shadow-sm transition-all ${
                pump01?.status === "Running"
                  ? "bg-emerald-600 border-emerald-700 text-white"
                  : "bg-zinc-200 border-zinc-300 text-zinc-700"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`text-2xl ${
                    pump01?.status === "Running" ? "animate-spin" : ""
                  }`}
                >
                  ⚙️
                </span>
                <div>
                  <div className="text-xs font-bold font-mono">
                    {pump01?.machine_id || "PUMP-01"}
                  </div>
                  <div className="text-[10px]">
                    {pump01?.machine_name || "Main Pump"}
                  </div>
                </div>
              </div>
            </div>
            {pump01 && (
              <button
                onClick={() => toggleStatus(pump01)}
                disabled={updatingId === pump01.id}
                className={`mt-2 px-3 py-1 text-xs font-bold rounded shadow transition ${
                  pump01.status === "Running"
                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white"
                }`}
              >
                {pump01.status === "Running" ? "STOP PUMP" : "START PUMP"}
              </button>
            )}
          </div>

          {/* Pipe 2 */}
          <div className="flex-1 h-3 bg-gradient-to-b from-zinc-200 via-zinc-50 to-zinc-300 border-y border-zinc-400 relative">
            {pump01?.status === "Running" && (
              <div className="absolute inset-0 bg-sky-400/60 animate-pulse" />
            )}
          </div>

          {/* Machine 2: Sand Filter Tank */}
          <div className="flex flex-col items-center">
            <div className="w-24 h-28 bg-gradient-to-b from-zinc-100 via-zinc-50 to-zinc-200 border-2 border-zinc-400 rounded-b-2xl rounded-t-lg shadow-md flex flex-col items-center justify-between p-2">
              <div className="w-full bg-zinc-200 rounded text-[9px] text-center font-bold text-zinc-500 py-0.5">
                FILTER TANK
              </div>
              <span className="text-2xl">🛢️</span>
              <span className="text-[10px] font-mono font-bold text-zinc-700">
                {flt01?.machine_id || "FLT-01"}
              </span>
            </div>
          </div>

          {/* Pipe 3 */}
          <div className="flex-1 h-3 bg-gradient-to-b from-zinc-200 via-zinc-50 to-zinc-300 border-y border-zinc-400 relative">
            {pump01?.status === "Running" && (
              <div className="absolute inset-0 bg-sky-400/60 animate-pulse" />
            )}
          </div>

          {/* Machine 3: Heat Pump / Heater Unit */}
          <div className="flex flex-col items-center">
            <div
              className={`p-4 rounded-xl border-2 shadow-sm transition-all ${
                heat01?.status === "Running"
                  ? "bg-white border-orange-500 text-orange-600"
                  : "bg-white border-zinc-300 text-zinc-600"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full border-2 border-zinc-300 flex items-center justify-center ${
                    heat01?.status === "Running"
                      ? "bg-orange-100 animate-pulse"
                      : "bg-zinc-100"
                  }`}
                >
                  <span className="text-xl">🔥</span>
                </div>
                <div>
                  <div className="text-xs font-bold font-mono">
                    {heat01?.machine_id || "HEAT-01"}
                  </div>
                  <div className="text-[10px] font-semibold text-zinc-500">
                    {heat01?.machine_name || "Heat Exchanger"}
                  </div>
                </div>
              </div>
            </div>
            {heat01 && (
              <button
                onClick={() => toggleStatus(heat01)}
                disabled={updatingId === heat01.id}
                className={`mt-2 px-3 py-1 text-xs font-bold rounded shadow transition ${
                  heat01.status === "Running"
                    ? "bg-zinc-900 hover:bg-zinc-700 text-white"
                    : "bg-orange-500 hover:bg-orange-600 text-white"
                }`}
              >
                {heat01.status === "Running" ? "OFF HEATER" : "ON HEATER"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
