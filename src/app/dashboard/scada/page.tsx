"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowDown,
  Droplets,
  Factory,
  Loader2,
  Power,
  Sun,
  Target,
  Thermometer,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import WaterTank3D from "@/components/WaterTank3D";
import TempGauge from "@/components/TempGauge";
import { getMachineVisual } from "@/components/machine-visuals";
import { buildStages, type ScadaMachine } from "@/lib/scada-stages";
import { useUserRole } from "@/hooks/useUserRole";

/* ความจุถังน้ำ (ลิตร) — ปรับตามขนาดถังจริงของหน้างาน */
const TANK_CAPACITY_L = 75000;

/* ช่วงอุณหภูมิบนหน้าปัดเกจ 0–50°C ครอบคลุมทั้งน้ำอุ่นและน้ำแก้ไข */
const GAUGE_MIN = 0;
const GAUGE_MAX = 50;

type TelemetryData = {
  id?: string;
  outdoor_temp: number;
  target_temp: number;
  pool_temp: number;
  water_level_liters: number;
  updated_at?: string;
};

/* สไตล์ของแต่ละสถานะ ใช้ซ้ำทั้งการ์ดเครื่อง ป้าย และจุดสถานะ
   ค่าที่ไม่รู้จักจะตกไปใช้รูปแบบของ Stop แทน */
const STATUS_STYLE: Record<
  string,
  { card: string; chip: string; dot: string }
> = {
  Running: {
    card: "border-emerald-300/80 bg-emerald-50/50 dark:border-emerald-800/80 dark:bg-emerald-950/20",
    chip: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  Stop: {
    card: "border-zinc-200 bg-white/80 dark:border-zinc-800 dark:bg-zinc-950/40",
    chip: "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
    dot: "bg-zinc-400",
  },
  Alarm: {
    card: "border-rose-300/80 bg-rose-50/60 dark:border-rose-900 dark:bg-rose-950/25",
    chip: "bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300",
    dot: "bg-rose-500",
  },
  "Waiting Part": {
    card: "border-violet-300/80 bg-violet-50/60 dark:border-violet-900 dark:bg-violet-950/25",
    chip: "bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-300",
    dot: "bg-violet-500",
  },
  Maintenance: {
    card: "border-amber-300/80 bg-amber-50/60 dark:border-amber-900 dark:bg-amber-950/25",
    chip: "bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300",
    dot: "bg-amber-500",
  },
};

const UNKNOWN_STATUS = STATUS_STYLE.Stop;

function statusStyle(status: string) {
  return STATUS_STYLE[status] ?? UNKNOWN_STATUS;
}

export default function ScadaPage() {
  const [machines, setMachines] = useState<ScadaMachine[]>([]);
  const [telemetry, setTelemetry] = useState<TelemetryData>({
    outdoor_temp: 0,
    target_temp: 0,
    pool_temp: 0,
    water_level_liters: 0,
  });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const supabase = createClient();
  const { canManage, loading: roleLoading } = useUserRole();

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      // 1. ดึงข้อมูลเครื่องจักร
      const { data: machinesData, error: mError } = await supabase
        .from("machines")
        .select("*");

      // 2. ดึงข้อมูล Telemetry ล่าสุดจากตาราง system_telemetry (ดึงแถวล่าสุดตาม updated_at)
      const { data: telemetryData, error: tError } = await supabase
        .from("system_telemetry")
        .select("*")
        .order("updated_at", { ascending: false })
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
            const added = payload.new as ScadaMachine;
            setMachines((prev) =>
              prev.some((m) => m.id === added.id) ? prev : [...prev, added],
            );
          } else if (payload.eventType === "UPDATE" && payload.new) {
            const updated = payload.new as ScadaMachine;
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

  const toggleStatus = useCallback(
    async (machine: ScadaMachine) => {
      setUpdatingId(machine.id);
      const newStatus = machine.status === "Running" ? "Stop" : "Running";

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
    },
    [supabase],
  );

  /* เรียงเครื่องเป็นขั้นตอนตามกระบวนการ: ปั๊ม → กรอง → ทำน้ำร้อน → วาล์ว/เซ็นเซอร์ */
  const stages = useMemo(() => buildStages(machines), [machines]);

  /* ปั๊มตัวไหนก็ได้ที่กำลังทำงาน ถือว่ามีการสูบน้ำเข้าระบบ */
  const anyPumpRunning = useMemo(
    () =>
      machines.some(
        (m) =>
          m.machine_type.trim().toLowerCase() === "pump" &&
          m.status === "Running",
      ),
    [machines],
  );

  /* ทั้งลูปมีการไหลหรือไม่ — ใช้บอกสถานะระบบและเส้นทางน้ำกลับ */
  const loopActive = stages.some((s) => s.flowing);

  /* ปริมาตรน้ำคิดเป็น % ของความจุถัง กันค่าที่มาจากเซ็นเซอร์ออกนอกช่วง */
  const levelLiters = Number(telemetry.water_level_liters);
  const levelPct =
    !Number.isFinite(levelLiters) || TANK_CAPACITY_L <= 0
      ? 0
      : Math.min(100, Math.max(0, (levelLiters / TANK_CAPACITY_L) * 100));

  const outdoorTemp = Number(telemetry.outdoor_temp);
  const targetTemp = Number(telemetry.target_temp);
  const poolTemp = Number(telemetry.pool_temp);

  if (loading)
    return (
      <div className="p-6 text-zinc-500 dark:text-zinc-400">
        Loading SCADA Diagram...
      </div>
    );

  return (
    <div className="space-y-5">
      {/* เกจอุณหภูมิ 3 ตัว — อ่านค่าแล้วเทียบกับเป้าหมายได้ทันที */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <TempGauge
          label="Outdoor Temp"
          icon={Sun}
          value={outdoorTemp}
          tone="amber"
          min={GAUGE_MIN}
          max={GAUGE_MAX}
        />
        <TempGauge
          label="Target Temp"
          icon={Target}
          value={targetTemp}
          tone="emerald"
          min={GAUGE_MIN}
          max={GAUGE_MAX}
        />
        <TempGauge
          label="Pool Temp"
          icon={Thermometer}
          value={poolTemp}
          tone="sky"
          target={targetTemp}
          min={GAUGE_MIN}
          max={GAUGE_MAX}
        />
      </div>

      {/* Industrial P&ID Board */}
      <div className="overflow-hidden rounded-2xl border border-zinc-300 shadow-sm dark:border-zinc-700">
        {/* แถบหัวบอร์ด: ชื่อระบบ + สถานะการไหล + คีย์สถานะ */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-300/80 bg-white/70 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900/60 sm:px-5">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-zinc-900 text-white shadow-sm dark:bg-zinc-100 dark:text-zinc-900">
              <Factory className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Water Treatment Loop
              </h2>
              <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                น้ำไหล: ถัง → ปั๊ม → กรอง → ทำน้ำร้อน → กลับเข้าถัง
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                loopActive
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300"
                  : "bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  loopActive ? "bg-emerald-500 machine-blink" : "bg-zinc-400"
                }`}
              />
              {loopActive ? "System Running" : "System Idle"}
            </span>

            {/* คีย์สถานะ ให้ operator อ่านป้ายบนการ์ดเครื่องได้เร็ว */}
            <div className="flex items-center gap-2.5 text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
              {(
                [
                  "Running",
                  "Stop",
                  "Maintenance",
                  "Waiting Part",
                  "Alarm",
                ] as const
              ).map((s) => (
                <span key={s} className="inline-flex items-center gap-1">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${statusStyle(s).dot}`}
                  />
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ถังน้ำ + สรุประดับน้ำ */}
        <div className="border-b border-zinc-300/80 bg-zinc-100/70 px-4 py-5 dark:border-zinc-700 dark:bg-zinc-950/30 sm:px-6">
          <div className="mx-auto grid max-w-4xl items-center gap-5 sm:grid-cols-[minmax(0,1fr)_minmax(0,260px)]">
            <WaterTank3D
              liters={levelLiters}
              capacity={TANK_CAPACITY_L}
              running={anyPumpRunning}
              label="POOL"
            />

            <div className="rounded-xl border border-zinc-200 bg-white/80 p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900/70">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
                <Droplets
                  className="h-3.5 w-3.5 text-sky-500"
                  aria-hidden="true"
                />
                Pool Level
              </div>

              <div className="mt-2.5 flex items-baseline gap-1.5">
                <span className="font-mono text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-50">
                  {levelPct.toFixed(0)}%
                </span>
                <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                  / {TANK_CAPACITY_L.toLocaleString()} L
                </span>
              </div>

              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-500 to-cyan-400 transition-[width] duration-700 ease-out"
                  style={{ width: `${levelPct}%` }}
                />
              </div>

              <dl className="mt-3.5 space-y-1.5 border-t border-zinc-200 pt-3 text-[11px] dark:border-zinc-800">
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-zinc-500 dark:text-zinc-400">ปริมาตร</dt>
                  <dd className="font-mono font-semibold tabular-nums text-zinc-800 dark:text-zinc-200">
                    {Number.isFinite(levelLiters)
                      ? `${Math.round(levelLiters).toLocaleString()} L`
                      : "—"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-zinc-500 dark:text-zinc-400">
                    การหมุนเวียน
                  </dt>
                  <dd
                    className={`font-mono font-semibold ${
                      anyPumpRunning
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-zinc-500 dark:text-zinc-400"
                    }`}
                  >
                    {anyPumpRunning ? "FILLING / RECIRC" : "IDLE"}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <dt className="text-zinc-500 dark:text-zinc-400">
                    เครื่องทำงาน
                  </dt>
                  <dd className="font-mono font-semibold tabular-nums text-zinc-800 dark:text-zinc-200">
                    {machines.filter((m) => m.status === "Running").length} /{" "}
                    {machines.length}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* ท่อแรงดันจากถังลงสู่ขั้นตอนแรก */}
          <FlowConnector
            flowing={stages[0]?.flowing ?? false}
            textClass={stages[0]?.def.text ?? "text-zinc-400"}
            fromLabel="POOL"
            toLabel={stages[0]?.def.sub ?? "PROCESS"}
          />
        </div>

        {/* ขั้นตอนการทำงาน */}
        <div className="px-4 py-5 dark:bg-zinc-800/30 sm:px-6">
          {stages.length === 0 ? (
            <div className="rounded-xl border border-dashed border-zinc-300 bg-white/60 py-12 text-center dark:border-zinc-700 dark:bg-zinc-900/40">
              <p className="text-sm font-semibold text-zinc-600 dark:text-zinc-300">
                No machines yet
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                Add one under Machines and it will appear here.
              </p>
            </div>
          ) : (
            <div>
              {stages.map((stage, i) => {
                const Icon = stage.def.icon;
                const prev = i > 0 ? stages[i - 1] : null;

                return (
                  <Fragment key={stage.def.key}>
                    {prev ? (
                      <FlowConnector
                        flowing={prev.flowing}
                        textClass={prev.def.text}
                        fromLabel={prev.def.sub}
                        toLabel={stage.def.sub}
                      />
                    ) : null}

                    <section
                      className="rounded-xl border border-zinc-200 bg-white/70 p-3 shadow-sm dark:border-zinc-700/80 dark:bg-zinc-900/50 sm:p-4"
                      aria-label={stage.def.label}
                    >
                      {/* หัวขั้นตอน: ลำดับ ไอคอน ชื่อ และจำนวนเครื่องที่รันอยู่ */}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-dashed border-zinc-200 pb-3 dark:border-zinc-700/70">
                        <span
                          className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-white ${stage.def.pipe}`}
                        >
                          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                        </span>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold text-zinc-400 dark:text-zinc-500">
                              {String(i + 1).padStart(2, "0")}
                            </span>
                            <h3 className="truncate text-xs font-bold text-zinc-800 dark:text-zinc-100">
                              {stage.def.label}
                            </h3>
                            <span className="truncate text-[10px] uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                              {stage.def.sub}
                            </span>
                          </div>
                          <div className="mt-1.5 h-1 w-full max-w-[180px] overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                            <div
                              className={`h-full rounded-full ${stage.def.pipe} transition-[width] duration-500 ease-out`}
                              style={{
                                width: `${
                                  (stage.running / stage.machines.length) * 100
                                }%`,
                              }}
                            />
                          </div>
                        </div>

                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-[10px] font-bold tabular-nums ${
                            stage.flowing
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300"
                              : "bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                          }`}
                        >
                          {stage.running}/{stage.machines.length} RUN
                        </span>
                      </div>

                      {/* เครื่องในขั้นตอนนี้ */}
                      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                        {stage.machines.map((machine) => {
                          const Visual = getMachineVisual(machine.machine_type);
                          const running = machine.status === "Running";
                          const isHeater =
                            machine.machine_type.trim().toLowerCase() ===
                            "heater";
                          const style = statusStyle(machine.status);
                          const busy = updatingId === machine.id;
                          /* เครื่องที่รออะไหล่ยังสตาร์ทไม่ได้
                             ช่างเทคนิคดูได้แต่กดสั่งเครื่องไม่ได้ */
                          const blocked = machine.status === "Waiting Part";
                          const showChip =
                            machine.status !== "Running" &&
                            machine.status !== "Stop";

                          return (
                            <div
                              key={machine.id}
                              className={`relative flex flex-col items-center rounded-xl border p-3 transition hover:shadow-md ${style.card}`}
                            >
                              <span
                                className={`absolute right-2.5 top-2.5 h-2 w-2 rounded-full ${
                                  running
                                    ? `${style.dot} machine-blink`
                                    : style.dot
                                }`}
                                aria-hidden="true"
                              />

                              <Visual
                                id={machine.machine_id}
                                name={machine.machine_name}
                                status={machine.status}
                              />

                              {/* เครื่องที่ไม่ได้ทำงานปกติต้องมีป้ายบอก operator เห็นชัด
                                  Waiting Part แยกจาก Maintenance ตรงที่ยังไม่ได้ซ่อม
                                  แต่ยังไม่มีอะไหล่มาติดตั้ง */}
                              {showChip ? (
                                <span
                                  className={`mt-2 rounded border px-2 py-0.5 text-[10px] font-bold ${style.chip}`}
                                >
                                  {machine.status.toUpperCase()}
                                </span>
                              ) : null}

                              {canManage && !roleLoading ? (
                                <button
                                  onClick={() => toggleStatus(machine)}
                                  disabled={busy || blocked}
                                  aria-label={`${running ? "หยุด" : "สตาร์ท"} ${machine.machine_name}`}
                                  className={`mt-2 inline-flex w-full items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-bold tracking-wide transition disabled:cursor-not-allowed disabled:opacity-40 ${
                                    running
                                      ? isHeater
                                        ? "bg-zinc-800 text-white hover:bg-zinc-700 dark:bg-zinc-200 dark:text-zinc-900 dark:hover:bg-white"
                                        : "bg-rose-600 text-white hover:bg-rose-700"
                                      : isHeater
                                        ? "bg-orange-500 text-white hover:bg-orange-600"
                                        : "bg-emerald-600 text-white hover:bg-emerald-700"
                                  }`}
                                >
                                  {busy ? (
                                    <Loader2
                                      className="h-3 w-3 animate-spin"
                                      aria-hidden="true"
                                    />
                                  ) : running ? (
                                    <>
                                      {isHeater ? (
                                        <Power
                                          className="h-3 w-3"
                                          aria-hidden="true"
                                        />
                                      ) : null}
                                      {isHeater ? "OFF" : "STOP"}
                                    </>
                                  ) : (
                                    <>
                                      <Activity
                                        className="h-3 w-3"
                                        aria-hidden="true"
                                      />
                                      {isHeater ? "ON" : "START"}
                                    </>
                                  )}
                                </button>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  </Fragment>
                );
              })}

              {/* เส้นทางน้ำกลับเข้าถัง — ปิดลูปให้เห็นว่าเป็นระบบหมุนเวียน */}
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-dashed border-sky-300/80 bg-sky-50/50 px-3 py-2.5 dark:border-sky-900/70 dark:bg-sky-950/20">
                <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-300">
                  <ArrowDown className="h-3 w-3 rotate-90" aria-hidden="true" />
                  Return
                </span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-sky-100 dark:bg-sky-900/40">
                  <span
                    className={`block h-full w-full ${
                      loopActive ? "pid-flow-x text-sky-500" : "opacity-0"
                    }`}
                  />
                </span>
                <span className="shrink-0 font-mono text-[10px] font-semibold text-sky-700 dark:text-sky-300">
                  TO POOL
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** ท่อแนวตั้งระหว่างขั้นตอน — ไหลเฉพาะเมื่อขั้นตอนต้นทางยังมีเครื่องรันอยู่ */
function FlowConnector({
  flowing,
  textClass,
  fromLabel,
  toLabel,
}: {
  flowing: boolean;
  textClass: string;
  fromLabel: string;
  toLabel: string;
}) {
  return (
    <div className="flex items-center gap-3 py-1.5 pl-1 sm:pl-2">
      <span className="relative h-9 w-1.5 overflow-hidden rounded-full bg-zinc-300/80 dark:bg-zinc-600/50">
        <span
          className={`absolute inset-0 ${
            flowing ? `pid-flow-y ${textClass}` : ""
          }`}
        />
      </span>
      <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
        {fromLabel}
      </span>
      <ArrowDown
        className={`h-3 w-3 shrink-0 transition ${
          flowing ? textClass : "text-zinc-300 dark:text-zinc-600"
        }`}
        aria-hidden="true"
      />
      <span
        className={`font-mono text-[10px] font-semibold uppercase tracking-wider ${
          flowing ? textClass : "text-zinc-400 dark:text-zinc-500"
        }`}
      >
        {toLabel}
      </span>
    </div>
  );
}
