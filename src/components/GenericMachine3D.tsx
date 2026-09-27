"use client";

import { STEEL_H } from "@/lib/scada-theme";

type Machine3DProps = {
  id: string;
  name: string;
  status: string;
};

/** Fallback for any machine_type we do not have artwork for, so a new
 *  type added in the machines page still shows up instead of breaking
 *  the diagram. */
export default function GenericMachine3D({ id, name, status }: Machine3DProps) {
  const running = status === "Running";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="relative w-24 h-28"
        role="img"
        aria-label={`${name} ${id}, status ${status}`}
      >
        <div
          className="absolute inset-x-1 bottom-4 top-6 rounded-md border-2 border-zinc-400 shadow-sm"
          style={{ background: STEEL_H }}
        />
        <div className="absolute left-1/2 top-11 w-10 h-5 -translate-x-1/2 rounded-sm border border-zinc-400 bg-zinc-100">
          <div className="flex h-full items-center justify-center gap-[3px] px-1">
            {[2, 4, 3].map((h, i) => (
              <span
                key={i}
                className={`w-[3px] rounded-[1px] ${
                  running ? "bg-zinc-700" : "bg-zinc-300"
                }`}
                style={{ height: `${h * 2}px` }}
              />
            ))}
          </div>
        </div>
        <div
          className="absolute inset-x-1 bottom-0 h-4 rounded-sm border border-zinc-500"
          style={{ background: STEEL_H }}
        />
        <span
          className={`absolute top-3 right-2 w-2 h-2 rounded-full ${
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
