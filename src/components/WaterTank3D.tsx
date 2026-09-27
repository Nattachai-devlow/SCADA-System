"use client";

const WAVE_PATH =
  "M0,6 C12.5,0 37.5,0 50,6 C62.5,12 87.5,12 100,6 " +
  "C112.5,0 137.5,0 150,6 C162.5,12 187.5,12 200,6 L200,10 L0,10 Z";
const SURFACE_H = 13;
const CAP_H = 15;

const SHELL =
  "linear-gradient(90deg,#a1a1aa 0%,#e4e4e7 14%,#fafafa 32%,#ffffff 44%,#e4e4e7 68%,#a1a1aa 88%,#71717a 100%)";
const WATER =
  "linear-gradient(90deg,#075985 0%,#0284c7 16%,#38bdf8 40%,#7dd3fc 50%,#38bdf8 62%,#0284c7 84%,#075985 100%)";

type WaterTank3DProps = {
  liters: number;
  capacity: number;
  running?: boolean;
  label?: string;
};

export default function WaterTank3D({
  liters,
  capacity,
  running = false,
  label = "POOL",
}: WaterTank3DProps) {
  const safeLiters = Number.isFinite(liters) ? liters : 0;
  const pct =
    capacity > 0
      ? Math.min(100, Math.max(0, (safeLiters / capacity) * 100))
      : 0;
  const duration = running ? "2.4s" : "6.5s";

  return (
    <div
      className="relative w-full h-36 select-none"
      role="img"
      aria-label={`${label} ${Math.round(pct)}% full, ${safeLiters.toLocaleString()} litres`}
    >
      {/* น้ำ: ยึดก้นถัง ไล่ระดับตาม telemetry */}
      <div
        className="absolute inset-x-0 bottom-0 z-10 overflow-hidden"
        style={{ height: `${pct}%`, background: WATER }}
      />

      {/* ผิวน้ำ: วงรี + คลื่นเคลื่อนด้วย transform */}
      <div
        className="tank-bob absolute inset-x-0 z-20 overflow-hidden rounded-[50%]"
        style={{
          bottom: `calc(${pct}% - ${SURFACE_H / 2}px)`,
          height: SURFACE_H,
          background: WATER,
        }}
      >
        <svg
          className="tank-wave absolute inset-y-0 left-0 w-[200%]"
          viewBox="0 0 200 10"
          preserveAspectRatio="none"
          style={{ animationDuration: duration }}
        >
          <path d={WAVE_PATH} fill="#e0f2fe" opacity="0.5" />
        </svg>
      </div>

      {/* ฐานถัง */}
      <div
        className="absolute inset-x-0 bottom-0 z-30 rounded-[50%]"
        style={{
          height: CAP_H,
          background: "linear-gradient(90deg,#71717a,#d4d4d8 40%,#a1a1aa 100%)",
        }}
      />

      {/* ขอบบนเปิดเข้าไปข้างใน */}
      <div
        className="absolute inset-x-0 top-0 z-30 rounded-[50%]"
        style={{
          height: CAP_H,
          background: "linear-gradient(90deg,#52525b,#e4e4e7 40%,#71717a 100%)",
        }}
      />
      <div
        className="absolute inset-x-0 top-0 z-30 rounded-[50%]"
        style={{
          height: CAP_H - 6,
          marginTop: 3,
          marginLeft: 4,
          marginRight: 4,
          background: "linear-gradient(90deg,#18181b,#3f3f46 45%,#18181b 100%)",
        }}
      />

      {/* เปลือกถัง: ไล่แสงแนวนอนให้เหมือนทรงกระบอก */}
      <div
        className="pointer-events-none absolute inset-0 z-30"
        style={{ background: SHELL, opacity: 0.14 }}
      />
      <div className="pointer-events-none absolute inset-0 z-30 rounded border-2 border-zinc-400" />

      {/* แสงเลื่อนผ่านกระจก */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-40 w-1/3 overflow-hidden">
        <div
          className="tank-sheen h-full w-full"
          style={{ animationDuration: running ? "3.2s" : "6s" }}
        />
      </div>

      {/* ป้ายกำกับ */}
      <div className="pointer-events-none absolute inset-x-0 top-1/2 z-50 -translate-y-1/2 text-center">
        <div className="inline-block rounded-md border border-zinc-300 bg-white/90 px-3 py-1 shadow-sm dark:border-zinc-700 dark:bg-zinc-900/90">
          <div className="font-mono text-sm font-bold text-zinc-800 dark:text-zinc-200">
            {safeLiters.toLocaleString()} L
          </div>
          <div className="font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
            {label} · {pct.toFixed(0)}%
          </div>
        </div>
      </div>
    </div>
  );
}
