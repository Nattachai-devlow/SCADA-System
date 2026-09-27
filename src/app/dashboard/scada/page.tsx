"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import WaterTank3D from "@/components/WaterTank3D";
import { getMachineVisual } from "@/components/machine-visuals";

/* ความจุถังน้ำ (ลิตร) — ปรับตามขนาดถังจริงของหน้างาน */
const TANK_CAPACITY_L = 75000;

/* ลำดับการแสดงผลตามกระบวนการ น้ำไหลจากปั๊ม → กรอง → ทำน้ำร้อน */
const TYPE_ORDER = ["pump", "filter", "heater", "sensor", "valve"];

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
          if (!isMounted) return;

          if (payload.eventType === "INSERT" && payload.new) {
            const added = payload.new as Machine;
            setMachines((prev) =>
              prev.some((m) => m.id === added.id) ? prev : [...prev, added],
            );
          } else if (payload.eventType === "UPDATE" && payload.new) {
            const updated = payload.new as Machine;
            setMachines((prev) =>
              prev.map((m) => (m.id === updated.id ? updated : m)),
            );
          } else if (payload.eventType === "DELETE") {
            const removedId = (payload.old as { id?: string } | undefined)?.id;
            if (removedId) {
              setMachines((prev) => prev.filter((m) => m.id !== removedId));
            }
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

  /* เรียงตามลำดับกระบวนการ เครื่องที่เพิ่มเข้ามาใหม่จะต่อท้ายตามประเภท */
  const orderedMachines = [...machines].sort((a, b) => {
    const ia = TYPE_ORDER.indexOf(a.machine_type.trim().toLowerCase());
    const ib = TYPE_ORDER.indexOf(b.machine_type.trim().toLowerCase());
    if (ia !== ib) return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    return a.machine_id.localeCompare(b.machine_id);
  });

  /* ปั๊มตัวไหนก็ได้ที่กำลังทำงาน ถือว่ามีการสูบน้ำเข้าระบบ */
  const anyPumpRunning = machines.some(
    (m) =>
      m.machine_type.trim().toLowerCase() === "pump" &&
      m.status === "Running",
  );

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
      <div className="bg-zinc-100 border border-zinc-300 rounded-xl p-6 sm:p-8 shadow-inner">
        {/* Pool Tank (3D + animation) */}
        <div className="mx-auto w-full max-w-[420px] min-w-[260px]">
          <WaterTank3D
            liters={Number(telemetry.water_level_liters)}
            capacity={TANK_CAPACITY_L}
            running={anyPumpRunning}
            label="POOL"
          />
        </div>

        {/* Supply header — doubles as the main header rail */}
        <div className="mt-8 max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="bg-white px-2 py-0.5 rounded border border-zinc-300 text-xs font-semibold text-zinc-500 whitespace-nowrap">
              Water Supply
            </span>
            <div className="flex-1 h-3 bg-gradient-to-b from-zinc-200 via-zinc-50 to-zinc-300 border-y border-zinc-400 relative rounded-sm">
              {anyPumpRunning && (
                <div className="absolute inset-0 bg-sky-400/60 animate-pulse" />
              )}
            </div>
            <span className="bg-white px-2 py-0.5 rounded border border-zinc-300 text-xs font-semibold text-zinc-500 whitespace-nowrap">
              {machines.length} unit{machines.length === 1 ? "" : "s"}
            </span>
          </div>

          {/* Machine grid — grows to fit every machine in the table */}
          {orderedMachines.length === 0 ? (
            <div className="mt-8 rounded-lg border border-dashed border-zinc-300 bg-white/60 py-12 text-center">
              <p className="text-sm font-semibold text-zinc-600">
                No machines yet
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Add one under Machines and it will appear here.
              </p>
            </div>
          ) : (
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
              {orderedMachines.map((machine) => {
                const Visual = getMachineVisual(machine.machine_type);
                const running = machine.status === "Running";
                const isHeater =
                  machine.machine_type.trim().toLowerCase() === "heater";

                return (
                  <div
                    key={machine.id}
                    className="flex flex-col items-center"
                  >
                    {/* Drop leg connecting the unit to the rail above */}
                    <div className="h-4 w-2 bg-gradient-to-r from-zinc-200 via-zinc-50 to-zinc-300 border-x border-zinc-400 rounded-b-sm" />

                    <Visual
                      id={machine.machine_id}
                      name={machine.machine_name}
                      status={machine.status}
                    />

                    {/* Maintenance / Alarm ยังกดสตาร์ท-หยุดได้เหมือนเดิม
                        แต่ต้องมีป้ายบอกสถานะให้ operator เห็นชัด */}
                    {machine.status === "Maintenance" ||
                    machine.status === "Alarm" ? (
                      <span
                        className={`mt-2 px-2.5 py-0.5 text-[10px] font-bold rounded border ${
                          machine.status === "Alarm"
                            ? "bg-rose-50 border-rose-300 text-rose-700"
                            : "bg-amber-50 border-amber-300 text-amber-700"
                        }`}
                      >
                        {machine.status === "Alarm" ? "ALARM" : "MAINTENANCE"}
                      </span>
                    ) : null}

                    <button
                      onClick={() => toggleStatus(machine)}
                      disabled={updatingId === machine.id}
                      className={`mt-2 px-3 py-1 text-[11px] font-bold rounded shadow transition ${
                        running
                          ? isHeater
                            ? "bg-zinc-900 hover:bg-zinc-700 text-white"
                            : "bg-rose-600 hover:bg-rose-700 text-white"
                          : isHeater
                            ? "bg-orange-500 hover:bg-orange-600 text-white"
                            : "bg-emerald-600 hover:bg-emerald-700 text-white"
                      }`}
                    >
                      {running ? (isHeater ? "OFF" : "STOP") : isHeater ? "ON" : "START"}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
