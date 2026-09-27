"use client";

import { STEEL_H, STEEL_V, STEEL_DOME } from "@/lib/scada-theme";

type Machine3DProps = {
  id: string;
  name: string;
  status: string;
};

/** Probe-style sensor: domed head with a lens, a readout window and
 *  two immersion prongs. The lens pulses and ripples when it is live. */
export default function Sensor3D({ id, name, status }: Machine3DProps) {
  const running = status === "Running";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="relative w-24 h-28"
        role="img"
        aria-label={`${name} ${id}, sensor ${running ? "online" : "offline"}`}
      >
        {/* สัญญาณที่กระจายออกจากหัวเซ็นเซอร์ */}
        {running && (
          <>
            <span className="absolute left-1/2 top-1 w-8 h-8 -ml-4 -mt-1 rounded-full border border-cyan-400 machine-ping" />
            <span className="absolute left-1/2 top-1 w-12 h-12 -ml-6 -mt-3 rounded-full border border-cyan-300 machine-ping machine-ping-late" />
          </>
        )}

        {/* หัวเซ็นเซอร์โค้ง */}
        <div
          className="absolute inset-x-2 top-3 h-6 rounded-[50%] border border-zinc-400"
          style={{ background: STEEL_DOME }}
        />
        {/* เลนส์ด้านหน้า */}
        <div
          className="absolute left-1/2 top-5 w-7 h-4 -translate-x-1/2 rounded-sm border border-zinc-500"
          style={{
            background: running
              ? "linear-gradient(180deg,#0e7490,#164e63)"
              : "linear-gradient(180deg,#3f3f46,#18181b)",
          }}
        />
        {/* ตัวชุดวัด */}
        <div
          className="absolute inset-x-2 top-8 bottom-5 border-x border-zinc-400"
          style={{ background: STEEL_H }}
        />
        {/* หน้าต่างแสดงค่า */}
        <div className="absolute left-1/2 top-11 w-9 h-4 -translate-x-1/2 rounded-[2px] border border-zinc-400 bg-zinc-100">
          <div className="flex items-end gap-[2px] h-full px-[3px] py-[2px]">
            {[3, 5, 2, 4, 6].map((h, i) => (
              <span
                key={i}
                className={`flex-1 rounded-[1px] ${
                  running ? "bg-cyan-500" : "bg-zinc-400"
                }`}
                style={{ height: `${h}px` }}
              />
            ))}
          </div>
        </div>
        {/* แถบไฮไลต์ */}
        <div
          className="absolute top-10 bottom-7 left-[30%] w-1.5 rounded-full bg-white/50"
          aria-hidden="true"
        />
        {/* ขายั่งลงน้ำ */}
        <div
          className="absolute bottom-1.5 left-[38%] w-1.5 h-4 rounded-b-sm border border-zinc-500"
          style={{ background: STEEL_V }}
        />
        <div
          className="absolute bottom-1.5 right-[38%] w-1.5 h-4 rounded-b-sm border border-zinc-500"
          style={{ background: STEEL_V }}
        />
        {/* ไฟสถานะ */}
        <span
          className={`absolute top-9 right-2.5 w-1.5 h-1.5 rounded-full ${
            running ? "bg-cyan-500 machine-blink" : "bg-zinc-400"
          }`}
        />
      </div>

      <div className="text-center leading-tight">
        <div className="font-mono text-[11px] font-bold text-zinc-800 dark:text-zinc-200">{id}</div>
        <div className="text-[10px] text-zinc-500 dark:text-zinc-400">{name}</div>
      </div>
    </div>
  );
}
