"use client";

import { STEEL_H, STEEL_V } from "@/lib/scada-theme";

type Machine3DProps = {
  id: string;
  name: string;
  status: string;
};

export default function HeatExchanger3D({ id, name, status }: Machine3DProps) {
  const running = status === "Running";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="relative w-28 h-28"
        role="img"
        aria-label={`${name} ${id}, status ${status}`}
      >
        {/* ฐานเหล็ก */}
        <div
          className="absolute inset-x-0 bottom-0 h-3 rounded-sm border border-zinc-500"
          style={{ background: STEEL_V }}
        />

        {/* ชุดแผ่นเรียง: gradient ซ้ำทำให้เห็นรอยต่อของแต่ละแผ่น */}
        <div
          className="absolute bottom-3 left-4 right-4 top-5 rounded-sm border border-zinc-400"
          style={{
            background:
              "repeating-linear-gradient(90deg,#e4e4e7 0px,#e4e4e7 2px,#a1a1aa 2px,#a1a1aa 4px)",
          }}
        />
        {/* แสงเฉียงบนชุดแผ่น */}
        <div
          className="absolute bottom-3 left-4 right-4 top-5 rounded-sm"
          style={{
            background:
              "linear-gradient(180deg,rgba(255,255,255,0.75) 0%,rgba(255,255,255,0.15) 40%,rgba(0,0,0,0.18) 100%)",
          }}
          aria-hidden="true"
        />
        {/* ปลายแผ่นด้านซ้ายหนา */}
        <div
          className="absolute bottom-3 left-1 top-5 w-3.5 rounded-l-sm border border-zinc-500"
          style={{ background: STEEL_H }}
        />
        {/* แถบยืดแผ่นบน/ล่าง */}
        <div
          className="absolute left-1 right-1 top-3.5 h-1.5 rounded-sm bg-zinc-400"
          aria-hidden="true"
        />
        <div
          className="absolute left-1 right-1 bottom-4 h-1.5 rounded-sm bg-zinc-400"
          aria-hidden="true"
        />
        {/* หัวต่อท่อด้านบนและล่าง */}
        <div
          className="absolute top-1.5 left-1/2 h-2.5 w-4 -translate-x-1/2 rounded-t-sm border border-zinc-500"
          style={{ background: STEEL_H }}
        />
        <div
          className="absolute bottom-4.5 left-1/2 h-2.5 w-4 -translate-x-1/2 rounded-b-sm border border-zinc-500"
          style={{ background: STEEL_H }}
        />

        {/* ปลายท่อสีร้อน: opacity เท่านั้น ไม่ repaint */}
        {running && (
          <div
            className="absolute bottom-3 left-4 right-4 top-5 rounded-sm machine-glow"
            aria-hidden="true"
          />
        )}

        {/* ไฟสถานะ */}
        <span
          className={`absolute top-0 right-0 w-2 h-2 rounded-full ${
            running ? "bg-orange-500 machine-blink" : "bg-zinc-400"
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
