"use client";

import { useId } from "react";
import type { LucideIcon } from "lucide-react";

/* มุมเริ่ม/สิ้นสุดของหน้าปัด วัดจาก +x แล้วหมุนตามเข็มนาฬิกา
   150° = ซ้ายล่าง, 390° = ขวาล่าง → sweep 240° เปิดด้านล่าง */
const START_ANGLE = 150;
const SWEEP = 240;

const CENTER = 100;
const RADIUS = 76;
const END_ANGLE = START_ANGLE + SWEEP;
const ARC_LEN = RADIUS * ((SWEEP * Math.PI) / 180);

const TONES = {
  amber: { from: "#fbbf24", to: "#f97316", glow: "rgba(249,115,22,0.5)" },
  emerald: { from: "#6ee7b7", to: "#10b981", glow: "rgba(16,185,129,0.5)" },
  sky: { from: "#7dd3fc", to: "#0284c7", glow: "rgba(2,132,199,0.5)" },
} as const;

export type GaugeTone = keyof typeof TONES;

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(r: number, fromDeg: number, toDeg: number) {
  const start = polar(CENTER, CENTER, r, fromDeg);
  const end = polar(CENTER, CENTER, r, toDeg);
  const largeArc = Math.abs(toDeg - fromDeg) > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

type TempGaugeProps = {
  label: string;
  icon: LucideIcon;
  value: number;
  tone: GaugeTone;
  /** ค่าที่ "ถูกต้อง" — ใช้วาดหมุดเป้าหมายและคำนวณค่าต่าง */
  target?: number;
  min?: number;
  max?: number;
  unit?: string;
};

export default function TempGauge({
  label,
  icon: Icon,
  value,
  tone,
  target,
  min = 0,
  max = 60,
  unit = "°C",
}: TempGaugeProps) {
  const rawId = useId();
  /* useId คืนค่าอย่าง ":r0:" — ตัดเฉพาะตัวอักษรที่ใช้เป็น id/url ไม่ได้
     ต้องเก็บตัวเลขไว้ด้วย ไม่งั้นเกจหลายตัวจะได้ id เดียวกันแล้ว gradient ซ้อนกัน */
  const uid = `g${rawId.replace(/[^a-zA-Z0-9]/g, "")}`;

  const safe = Number.isFinite(value) ? value : 0;
  const span = max - min || 1;
  const ratio = Math.min(1, Math.max(0, (safe - min) / span));

  const color = TONES[tone];
  const gradientId = `${uid}-bar`;
  const glowId = `${uid}-glow`;

  const targetRatio =
    target !== undefined && Number.isFinite(target)
      ? Math.min(1, Math.max(0, (target - min) / span))
      : null;

  const headAngle = START_ANGLE + SWEEP * ratio;
  const head = polar(CENTER, CENTER, RADIUS, headAngle);

  const delta = target !== undefined ? safe - target : null;
  const onTarget = delta !== null && Math.abs(delta) < 0.5;

  const ticks = Array.from({ length: 11 }, (_, i) => {
    const deg = START_ANGLE + (SWEEP / 10) * i;
    const major = i % 5 === 0;
    const outer = polar(CENTER, CENTER, RADIUS - 22, deg);
    const inner = polar(
      CENTER,
      CENTER,
      RADIUS - (major ? 31 : 27),
      deg,
    );
    return { deg, major, outer, inner };
  });

  return (
    <div className="flex flex-col items-center rounded-2xl border border-zinc-200 bg-white/85 px-4 pb-3 pt-3.5 shadow-sm backdrop-blur-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/85">
      <div className="mb-1 flex w-full items-center justify-center gap-1.5">
        <Icon
          className="h-3.5 w-3.5 text-zinc-400 dark:text-zinc-500"
          aria-hidden="true"
        />
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
          {label}
        </span>
      </div>

      <svg
        viewBox="0 0 200 168"
        className="w-full max-w-[190px]"
        role="img"
        aria-label={`${label} ${safe.toFixed(1)} ${unit}${
          target !== undefined ? ` เป้าหมาย ${target.toFixed(1)}` : ""
        }`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor={color.from} />
            <stop offset="100%" stopColor={color.to} />
          </linearGradient>
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* รางพื้นหลังของหน้าปัด */}
        <path
          d={arcPath(RADIUS, START_ANGLE, END_ANGLE)}
          fill="none"
          stroke="currentColor"
          strokeWidth={13}
          className="text-zinc-200 dark:text-zinc-800"
        />

        {/* ค่าที่อ่านได้ — เลื่อนด้วย dashoffset จึงไม่กระพริบภาพ */}
        <path
          d={arcPath(RADIUS, START_ANGLE, END_ANGLE)}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={13}
          strokeLinecap="round"
          strokeDasharray={ARC_LEN}
          strokeDashoffset={ARC_LEN * (1 - ratio)}
          filter={`url(#${glowId})`}
          className="gauge-value"
        />

        {/* หมุดเป้าหมาย */}
        {targetRatio !== null && (
          <line
            x1={polar(CENTER, CENTER, RADIUS + 2, START_ANGLE + SWEEP * targetRatio).x}
            y1={polar(CENTER, CENTER, RADIUS + 2, START_ANGLE + SWEEP * targetRatio).y}
            x2={polar(CENTER, CENTER, RADIUS - 17, START_ANGLE + SWEEP * targetRatio).x}
            y2={polar(CENTER, CENTER, RADIUS - 17, START_ANGLE + SWEEP * targetRatio).y}
            stroke="#18181b"
            strokeWidth={2.5}
            strokeLinecap="round"
            opacity={0.5}
            className="dark:opacity-90"
          />
        )}

        {/* ขีดบอกสเกล */}
        <g>
          {ticks.map((t) => (
            <line
              key={t.deg}
              x1={t.inner.x}
              y1={t.inner.y}
              x2={t.outer.x}
              y2={t.outer.y}
              strokeWidth={t.major ? 2 : 1}
              strokeLinecap="round"
              className={
                t.major
                  ? "stroke-zinc-400 dark:stroke-zinc-600"
                  : "stroke-zinc-300 dark:stroke-zinc-700"
              }
            />
          ))}
        </g>

        {/* หัวเกจตอนปลายหน้าปัด */}
        <circle
          cx={head.x}
          cy={head.y}
          r={5}
          fill="#fff"
          className="dark:fill-zinc-100"
          filter={`url(#${glowId})`}
        />

        {/* ตัวเลขกลางหน้าปัด */}
        <text
          x={CENTER}
          y={CENTER + 6}
          textAnchor="middle"
          className="fill-zinc-900 font-mono text-[38px] font-bold dark:fill-zinc-50"
        >
          {safe.toFixed(1)}
        </text>
        <text
          x={CENTER}
          y={CENTER + 26}
          textAnchor="middle"
          className="fill-zinc-500 font-mono text-[13px] font-semibold dark:fill-zinc-400"
        >
          {unit}
        </text>

        {/* ป้ายปลายสเกล */}
        <text
          x={polar(CENTER, CENTER, RADIUS + 16, START_ANGLE).x}
          y={polar(CENTER, CENTER, RADIUS + 16, START_ANGLE).y + 4}
          textAnchor="middle"
          className="fill-zinc-400 font-mono text-[10px] dark:fill-zinc-500"
        >
          {min}
        </text>
        <text
          x={polar(CENTER, CENTER, RADIUS + 16, START_ANGLE + SWEEP).x}
          y={polar(CENTER, CENTER, RADIUS + 16, START_ANGLE + SWEEP).y + 4}
          textAnchor="middle"
          className="fill-zinc-400 font-mono text-[10px] dark:fill-zinc-500"
        >
          {max}
        </text>
      </svg>

      <div className="mt-0.5 flex h-5 items-center">
        {delta !== null && (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold tabular-nums ${
              onTarget
                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                : delta > 0
                  ? "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
                  : "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300"
            }`}
          >
            {onTarget
              ? "ON TARGET"
              : `${delta > 0 ? "+" : ""}${delta.toFixed(1)}`}
            {onTarget ? null : (
              <span className="font-semibold opacity-70">vs target</span>
            )}
          </span>
        )}
      </div>
    </div>
  );
}
