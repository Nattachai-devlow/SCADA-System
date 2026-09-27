"use client";

import { STEEL_H, STEEL_V, STEEL_DOME } from "@/lib/scada-theme";

type Machine3DProps = {
  id: string;
  name: string;
  running: boolean;
};

export default function FilterTank3D({ id, name, running }: Machine3DProps) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="relative w-24 h-28"
        role="img"
        aria-label={`${name} ${id}, ${running ? "running" : "stopped"}`}
      >
        {/* ฝาบนโค้ง */}
        <div
          className="absolute inset-x-0 top-0 h-5 rounded-[50%] border-b border-zinc-400"
          style={{ background: STEEL_DOME }}
        />
        {/* ตัวถัง: ไล่แสงแนวนอนให้เหมือนทรงกระบอก */}
        <div
          className="absolute inset-x-0 top-4 bottom-4 border-x border-zinc-400"
          style={{ background: STEEL_H }}
        />
        {/* ฝาล่างโค้ง */}
        <div
          className="absolute inset-x-0 bottom-0 h-5 rounded-[50%] border-t border-zinc-400"
          style={{ background: STEEL_DOME }}
        />
        {/* แถบไฮไลต์ให้ดูเป็นโลหะมันวาว */}
        <div
          className="absolute top-7 bottom-7 left-[26%] w-2.5 rounded-full bg-white/50"
          aria-hidden="true"
        />
        {/* หัวต่อท่อด้านบนและด้านข้าง */}
        <div
          className="absolute -top-1.5 left-1/2 h-3 w-3.5 -translate-x-1/2 rounded-t-sm border border-zinc-500"
          style={{ background: STEEL_H }}
        />
        <div
          className="absolute top-1/2 -right-1.5 h-3.5 w-3 rounded-r-sm border border-zinc-500"
          style={{ background: STEEL_H }}
        />
        {/* ขาตั้ง */}
        <div
          className="absolute inset-x-2 -bottom-0.5 h-2.5 rounded-sm border border-zinc-500"
          style={{ background: STEEL_V }}
        />
        {/* ไฟสถานะ */}
        <span
          className={`absolute top-6 right-2 w-2 h-2 rounded-full ${
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
