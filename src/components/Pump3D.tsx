"use client";

import { STEEL_H, STEEL_V, DARK_VOID } from "@/lib/scada-theme";

const BLADES = [0, 72, 144, 216, 288];

type Machine3DProps = {
  id: string;
  name: string;
  status: string;
};

export default function Pump3D({ id, name, status }: Machine3DProps) {
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
          className="absolute inset-x-0 bottom-0 h-3.5 rounded-sm border border-zinc-500"
          style={{ background: STEEL_V }}
        />

        {/* มอเตอร์: ทรงกระบอกนอน ต่อกับฝาครอบพัดลมด้านขวา */}
        <div
          className="absolute top-1 left-1 right-7 h-8 rounded-l-md rounded-r-sm border border-zinc-400"
          style={{ background: STEEL_H }}
        />
        <div
          className="absolute top-3 left-3 right-11 h-1.5 rounded-full bg-white/60"
          aria-hidden="true"
        />
        <div
          className="absolute top-1 right-2 w-12 h-12 rounded-full border-2 border-zinc-500 overflow-hidden"
          style={{ background: DARK_VOID }}
        >
          {/* ฝาครอบพัดลม หมุนเมื่อปั๊มทำงาน */}
          <div
            className={`absolute inset-1.5 rounded-full ${
              running ? "machine-spin-fast" : ""
            }`}
            style={{
              background:
                "conic-gradient(from 0deg,#a1a1aa 0deg,#52525b 40deg,#a1a1aa 80deg,#52525b 120deg,#a1a1aa 160deg,#52525b 200deg,#a1a1aa 240deg,#52525b 280deg,#a1a1aa 320deg,#52525b 360deg)",
            }}
          />
          <div className="absolute inset-0 rounded-full bg-zinc-900/25" />
        </div>

        {/* เต้องปั๊ม: วงกลมตรงหน้า */}
        <div
          className="absolute bottom-4 left-2 w-[4.75rem] h-[4.75rem] rounded-full border-2 border-zinc-400 shadow-sm"
          style={{ background: STEEL_H }}
        >
          <div
            className="absolute inset-[5px] rounded-full border border-zinc-300 overflow-hidden"
            style={{ background: DARK_VOID }}
          >
            {/* ใบพัดหมุน */}
            <svg
              className={`absolute inset-0 h-full w-full ${
                running ? "machine-spin" : ""
              }`}
              viewBox="0 0 40 40"
            >
              {BLADES.map((deg) => (
                <path
                  key={deg}
                  d="M20,20 C22.5,14 27,10 32,7.5 C30,14 25.5,18.5 20,20 Z"
                  fill="#d4d4d8"
                  transform={`rotate(${deg} 20 20)`}
                />
              ))}
              <circle cx="20" cy="20" r="5" fill="#a1a1aa" />
              <circle cx="20" cy="20" r="2" fill="#52525b" />
            </svg>
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-black/35 to-transparent" />
          </div>
        </div>

        {/* หัวเตา (ท่อดูด) ชี้ซ้าย + หัวระบายชี้บน */}
        <div
          className="absolute bottom-[3.1rem] left-0 h-3.5 w-4 rounded-l-sm border border-zinc-500"
          style={{ background: STEEL_H }}
        />
        <div
          className="absolute bottom-[5.75rem] left-[1.35rem] h-3.5 w-4 rounded-t-sm border border-zinc-500"
          style={{ background: STEEL_H }}
        />

        {/* ไฟสถานะ */}
        <span
          className={`absolute top-0 right-0 w-2 h-2 rounded-full ${
            running ? "bg-emerald-500 machine-blink" : "bg-zinc-400"
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
