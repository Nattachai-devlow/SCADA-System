"use client";

import { useSyncExternalStore } from "react";

export type ToastKind = "success" | "error" | "info";

type ToastItem = {
  id: number;
  kind: ToastKind;
  message: string;
};

const MAX_VISIBLE = 4;
const DEFAULT_DURATION = 4500;

let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();
const timers = new Map<number, ReturnType<typeof setTimeout>>();

const emit = () => {
  listeners.forEach((fn) => fn());
};

const dismiss = (id: number) => {
  const timer = timers.get(id);
  if (timer) {
    clearTimeout(timer);
    timers.delete(id);
  }
  items = items.filter((t) => t.id !== id);
  emit();
};

const push = (kind: ToastKind, message: string, duration?: number) => {
  // เกินที่แสดงพร้อมกันได้ ตัดของเก่าสุดออกก่อน
  if (items.length >= MAX_VISIBLE) {
    const oldest = items[0];
    const timer = timers.get(oldest.id);
    if (timer) clearTimeout(timer);
    timers.delete(oldest.id);
    items = items.slice(1);
  }

  const id = nextId++;
  items = [...items, { id, kind, message }];
  emit();

  if (duration !== 0) {
    timers.set(
      id,
      setTimeout(() => dismiss(id), duration ?? DEFAULT_DURATION),
    );
  }

  return id;
};

/**
 * แสดง popup แจ้งเตือนชั่วคราวที่มุมขวาบนของหน้าจอ
 * เรียกจากที่ไหนก็ได้ แล้วลบกลับเองอัตโนมัติ
 */
export const toast = {
  success: (message: string, duration?: number) =>
    push("success", message, duration),
  error: (message: string, duration?: number) =>
    push("error", message, duration),
  info: (message: string, duration?: number) =>
    push("info", message, duration),
  dismiss,
};

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

// คืนค่า reference เดิมเสมอถ้าไม่มีอะไรเปลี่ยน เพื่อให้ useSyncExternalStore
// ตรวจได้ว่าข้อมูลเปลี่ยนจริงหรือเปล่า
const getSnapshot = () => items;

const STYLES: Record<ToastKind, { wrap: string; icon: string; mark: string }> = {
  success: {
    wrap: "border-green-200",
    icon: "text-green-600",
    mark: "bg-green-500",
  },
  error: {
    wrap: "border-red-200",
    icon: "text-red-600",
    mark: "bg-red-500",
  },
  info: {
    wrap: "border-zinc-200",
    icon: "text-zinc-600",
    mark: "bg-zinc-400",
  },
};

const ICONS: Record<ToastKind, string> = {
  success: "M20 6 9 17l-5-5",
  error: "M18 6 6 18M6 6l12 12",
  info: "M12 16v-4M12 8h.01",
};

export default function ToastHost() {
  const visible = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  if (visible.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="ข้อความแจ้งเตือน"
      className="pointer-events-none fixed inset-x-0 top-0 z-100 flex justify-center px-4 pt-4 sm:justify-end sm:pr-6 sm:pt-6"
    >
      <div className="flex w-full max-w-sm flex-col gap-2.5">
        {visible.map((t) => {
          const s = STYLES[t.kind];
          return (
            <div
              key={t.id}
              role="status"
              aria-live="polite"
              className={`toast-enter pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-xl border bg-white py-3 pl-4 pr-3 shadow-lg shadow-zinc-900/8 ring-1 ring-zinc-900/5 ${s.wrap}`}
            >
              <span aria-hidden="true" className={`mt-0.5 shrink-0 ${s.icon}`}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4.5 w-4.5"
                >
                  <path d={ICONS[t.kind]} />
                </svg>
              </span>

              <p className="flex-1 text-sm leading-relaxed text-zinc-800">
                {t.message}
              </p>

              <button
                onClick={() => dismiss(t.id)}
                aria-label="ปิดข้อความแจ้งเตือน"
                className="shrink-0 rounded-md p-0.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  className="h-3.5 w-3.5"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>

              <span
                aria-hidden="true"
                className={`absolute inset-x-0 bottom-0 h-0.5 ${s.mark}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
