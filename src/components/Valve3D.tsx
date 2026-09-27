"use client";

import { STEEL_H, STEEL_V } from "@/lib/scada-theme";

type Machine3DProps = {
  id: string;
  name: string;
  running: boolean;
};

/** Butterfly valve seen from the side. The disc sits across the bore
 *  when stopped and turns parallel to it when running, so the open or
 *  closed state is readable at a glance. */
export default function Valve3D({ id, name, running }: Machine3DProps) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="relative w-28 h-28"
        role="img"
        aria-label={`${name} ${id}, ${running ? "open" : "closed"}`}
      >
        {/* ท่อผ่านตัววาล์ว์ */}
        <div
          className="absolute left-0 right-0 top-1/2 h-4 -translate-y-1/2 rounded-sm border-y border-zinc-400"
          style={{ background: STEEL_H }}
        />
        {/* ลูกศรแสดงทิศทางการไหล */}
        {running && (
          <div className="absolute left-1 right-1 top-1/2 h-4 -translate-y-1/2 overflow-hidden rounded-sm">
            <div
              className="absolute inset-y-0 w-1/3 rounded-sm bg-sky-400/70 machine-flow"
              aria-hidden="true"
            />
          </div>
        )}
        {/* ปีกน็อต / หน้าแปลน */}
        <div
          className="absolute left-1 top-1/2 h-7 w-1.5 -translate-y-1/2 border border-zinc-500 rounded-[1px]"
          style={{ background: STEEL_V }}
        />
        <div
          className="absolute right-1 top-1/2 h-7 w-1.5 -translate-y-1/2 border border-zinc-500 rounded-[1px]"
          style={{ background: STEEL_V }}
        />

        {/* ตัววาล์ว์ */}
        <div
          className="absolute left-1/2 top-1/2 h-10 w-12 -translate-x-1/2 -translate-y-1/2 rounded-md border-2 border-zinc-500 shadow-sm"
          style={{ background: STEEL_H }}
        >
          {/* แผ่นวาล์ว์: ตั้งขวางเมื่อปิด หมุนไปตามแกนเมื่อเปิด */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className="valve-disc h-[1.15rem] w-[2.4rem] rounded-[50%] border border-zinc-500"
              style={{
                background: "linear-gradient(180deg,#e4e4e7,#a1a1aa)",
                transform: `rotate(${running ? 0 : 90}deg)`,
              }}
            />
          </div>
        </div>

        {/* สายโยกด้านบน */}
        <div
          className="absolute left-1/2 top-[1.05rem] h-4 w-2 -translate-x-1/2 rounded-sm border border-zinc-500"
          style={{ background: STEEL_V }}
        />
        <div
          className="absolute left-1/2 top-3 h-6 w-9 -translate-x-1/2 rounded-md border border-zinc-500"
          style={{ background: STEEL_H }}
        />
        {/* ไฟสถานะบนตัว actuator */}
        <span
          className={`absolute top-5 right-3 w-1.5 h-1.5 rounded-full ${
            running ? "bg-emerald-500 machine-blink" : "bg-zinc-400"
          }`}
        />
      </div>

      <div className="text-center leading-tight">
        <div className="font-mono text-[11px] font-bold text-zinc-800">{id}</div>
        <div className="text-[10px] text-zinc-500">{name}</div>
      </div>
    </div>
  );
}
