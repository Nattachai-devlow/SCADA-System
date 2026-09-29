"use client";

import { useState, useEffect, useMemo, useCallback, Fragment } from "react";
import {
  ChevronDown,
  History,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash,
  User,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";

type Action = "create" | "update" | "delete";

type MachineHistoryRow = {
  id: string;
  machine_uuid: string | null;
  machine_code: string;
  machine_name: string;
  action: Action;
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  performed_by: string | null;
  performed_by_name: string | null;
  performed_by_email: string | null;
  created_at: string;
};

const ACTION_META: Record<
  Action,
  {
    label: string;
    Icon: typeof Plus;
    chip: string;
    badge: string;
  }
> = {
  create: {
    label: "เพิ่มใหม่",
    Icon: Plus,
    chip: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400",
    badge: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900",
  },
  update: {
    label: "แก้ไข",
    Icon: Pencil,
    chip: "bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400",
    badge: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900",
  },
  delete: {
    label: "ลบ",
    Icon: Trash,
    chip: "bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400",
    badge: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-900",
  },
};

/* คีย์ใน JSONB มาจาก trigger จึงต้องแปลงเป็นข้อความที่อ่านเข้าใจได้
   ลำดับในอาร์เรย์คือลำดับที่จะแสดงผล */
const FIELD_LABEL: { key: string; label: string }[] = [
  { key: "machine_id", label: "Machine ID" },
  { key: "machine_name", label: "ชื่อเครื่องจักร" },
  { key: "machine_type", label: "ประเภท" },
  { key: "location", label: "สถานที่ติดตั้ง" },
  { key: "status", label: "สถานะ" },
];

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

export default function MachineHistoryPage() {
  const [logs, setLogs] = useState<MachineHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState<"ALL" | Action>("ALL");
  const [actorFilter, setActorFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);

  const supabase = createClient();
  const { isAdmin, loading: roleLoading } = useUserRole();

  useEffect(() => {
    let isMounted = true;

    async function loadHistory() {
      setLoading(true);
      setLoadError(null);

      const { data, error } = await supabase
        .from("machine_history")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (!isMounted) return;

      if (error) {
        /* แยกกรณี "ตารางยังไม่ถูกสร้าง" ออกจาก error อื่น
           เพราะยังไม่ได้รัน 05_machine_history.sql ใน Supabase */
        const missingTable =
          error.code === "42P01" ||
          error.message.includes("machine_history");
        setLoadError(
          missingTable
            ? "ยังไม่ได้สร้างตาราง machine_history — กรุณารัน src/supabase/05_machine_history.sql ใน Supabase SQL Editor"
            : error.message,
        );
        setLogs([]);
      } else {
        setLogs((data ?? []) as MachineHistoryRow[]);
      }

      setLoading(false);
    }

    loadHistory();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  /* รายชื่อผู้ใช้ที่มีประวัติ ใช้ทำตัวเลือกในช่องกรอง */
  const actorOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of logs) {
      if (!row.performed_by) continue;
      map.set(
        row.performed_by,
        row.performed_by_name || row.performed_by_email || row.performed_by,
      );
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], "th"));
  }, [logs]);

  const hasActiveFilter =
    search !== "" ||
    actionFilter !== "ALL" ||
    actorFilter !== "ALL" ||
    fromDate !== "" ||
    toDate !== "";

  const handleClearFilters = useCallback(() => {
    setSearch("");
    setActionFilter("ALL");
    setActorFilter("ALL");
    setFromDate("");
    setToDate("");
  }, []);

  const filteredLogs = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    /* ช่องวันที่ใช้ค่า "YYYY-MM-DD" ซึ่งเปรียบเทียบกับวันที่ได้ตรง ๆ แต่ created_at
       เป็น ISO string ที่มีเวลาติดมา จึงต้องตัดส่วนเวลาออกก่อนเทียบวันที่
       มิฉะนั้นรายการของวันนั้นจะถูกตัดออก */
    const from = fromDate || null;
    const to = toDate || null;

    return logs.filter((row) => {
      if (actionFilter !== "ALL" && row.action !== actionFilter) return false;
      if (actorFilter !== "ALL" && row.performed_by !== actorFilter) {
        return false;
      }

      if (from || to) {
        const day = row.created_at.slice(0, 10);
        if (from && day < from) return false;
        if (to && day > to) return false;
      }

      if (keyword) {
        const haystack = [
          row.machine_code,
          row.machine_name,
          row.performed_by_name,
          row.performed_by_email,
          ACTION_META[row.action].label,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(keyword)) return false;
      }

      return true;
    });
  }, [
    logs,
    search,
    actionFilter,
    actorFilter,
    fromDate,
    toDate,
  ]);

  const counts = useMemo(
    () => ({
      create: filteredLogs.filter((r) => r.action === "create").length,
      update: filteredLogs.filter((r) => r.action === "update").length,
      delete: filteredLogs.filter((r) => r.action === "delete").length,
    }),
    [filteredLogs],
  );

  if (!roleLoading && !isAdmin) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <History className="mx-auto h-8 w-8 text-zinc-400" strokeWidth={1.5} />
        <p className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          เฉพาะผู้ดูแลระบบเท่านั้นที่ดูประวัตินี้ได้
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          (Admin Only)
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          <History className="h-6 w-6" strokeWidth={1.75} />
          Machine History
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          ประวัติการเพิ่ม แก้ไข และลบเครื่องจักร บันทึกอัตโนมัติทุกครั้งที่ข้อมูลเปลี่ยน
          รวมถึงการเปลี่ยนสถานะจากหน้า Maintenance
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2 lg:grid-cols-5">
          <div className="sm:col-span-2 lg:col-span-2">
            <label className="mb-1 flex items-center gap-1.5 font-medium text-zinc-600 dark:text-zinc-400">
              <Search className="h-3.5 w-3.5" strokeWidth={1.75} />
              ค้นหา
            </label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="รหัสเครื่อง, ชื่อเครื่อง, หรือผู้ที่แก้ไข..."
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-800 placeholder-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
            />
          </div>

          <div>
            <label className="mb-1 block font-medium text-zinc-600 dark:text-zinc-400">
              ประเภทการเปลี่ยนแปลง
            </label>
            <select
              value={actionFilter}
              onChange={(e) =>
                setActionFilter(e.target.value as "ALL" | Action)
              }
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-800 focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
            >
              <option value="ALL">ทั้งหมด ({filteredLogs.length})</option>
              <option value="create">เพิ่มใหม่ ({counts.create})</option>
              <option value="update">แก้ไข ({counts.update})</option>
              <option value="delete">ลบ ({counts.delete})</option>
            </select>
          </div>

          <div>
            <label className="mb-1 flex items-center gap-1.5 font-medium text-zinc-600 dark:text-zinc-400">
              <User className="h-3.5 w-3.5" strokeWidth={1.75} />
              ผู้ที่แก้ไข
            </label>
            <select
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-800 focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
            >
              <option value="ALL">ทุกคน</option>
              {actorOptions.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block font-medium text-zinc-600 dark:text-zinc-400">
                ตั้งแต่
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-800 focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
              />
            </div>
            <div>
              <label className="mb-1 block font-medium text-zinc-600 dark:text-zinc-400">
                ถึง
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-zinc-800 focus:border-zinc-900 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-zinc-200 pt-3 text-xs dark:border-zinc-800">
          <span className="text-zinc-600 dark:text-zinc-400">
            พบ{" "}
            <strong className="font-semibold text-zinc-900 dark:text-zinc-100">
              {filteredLogs.length}
            </strong>{" "}
            รายการ
            {filteredLogs.length !== logs.length && (
              <span className="ml-1 text-zinc-500 dark:text-zinc-400">
                (จากทั้งหมด {logs.length} รายการ)
              </span>
            )}
          </span>

          {hasActiveFilter && (
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1.5 font-medium text-rose-700 underline transition hover:text-rose-800"
            >
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.75} />
              ล้างตัวกรองทั้งหมด
            </button>
          )}
        </div>
      </div>

      {loadError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
          {loadError}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        {loading ? (
          <p className="p-6 text-sm text-zinc-600 dark:text-zinc-400">
            กำลังโหลดประวัติ...
          </p>
        ) : filteredLogs.length === 0 ? (
          <p className="p-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
            {logs.length === 0
              ? "ยังไม่มีประวัติการเปลี่ยนแปลงเครื่องจักร"
              : "ไม่พบรายการที่ตรงกับเงื่อนไขการกรอง"}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/60 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950/60 dark:text-zinc-400">
                  <th className="p-4">วันและเวลา</th>
                  <th className="p-4">ประเภท</th>
                  <th className="p-4">เครื่องจักร</th>
                  <th className="p-4">ผู้ที่แก้ไข</th>
                  <th className="p-4 text-center">รายละเอียด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
                {filteredLogs.map((row) => {
                  const meta = ACTION_META[row.action];
                  const Icon = meta.Icon;
                  const isOpen = expanded === row.id;

                  return (
                    <Fragment key={row.id}>
                      <tr className="transition hover:bg-zinc-100/40 dark:hover:bg-zinc-800/40">
                        <td className="whitespace-nowrap p-4 font-mono text-xs text-zinc-600 dark:text-zinc-400">
                          {new Date(row.created_at).toLocaleString("th-TH", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </td>

                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.badge}`}
                          >
                            <Icon className="h-3 w-3" strokeWidth={2} />
                            {meta.label}
                          </span>
                        </td>

                        <td className="p-4">
                          <span className="block font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                            {row.machine_code}
                          </span>
                          <span className="block text-[10px] text-zinc-600 dark:text-zinc-400">
                            {row.machine_name}
                          </span>
                        </td>

                        <td className="p-4 text-zinc-600 dark:text-zinc-400">
                          {row.performed_by_name ||
                            row.performed_by_email || (
                              <span className="text-zinc-400 dark:text-zinc-500">
                                ระบบ (ไม่ระบุผู้ใช้)
                              </span>
                            )}
                        </td>

                        <td className="p-4 text-center">
                          <button
                            onClick={() =>
                              setExpanded(isOpen ? null : row.id)
                            }
                            aria-expanded={isOpen}
                            className="inline-flex items-center gap-1 rounded-md border border-zinc-300 px-2.5 py-1 text-xs text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                          >
                            {isOpen ? "ซ่อน" : "ดูรายละเอียด"}
                            <ChevronDown
                              className={`h-3.5 w-3.5 transition-transform ${
                                isOpen ? "rotate-180" : ""
                              }`}
                              strokeWidth={1.75}
                            />
                          </button>
                        </td>
                      </tr>

                      {isOpen && (
                        <tr className="bg-zinc-50/60 dark:bg-zinc-950/40">
                          <td colSpan={5} className="p-4">
                            {row.action === "update" ? (
                              <ChangeDiff
                                before={row.before_data}
                                after={row.after_data}
                              />
                            ) : (
                              <SnapshotTable
                                data={row.after_data ?? row.before_data}
                                caption={
                                  row.action === "create"
                                    ? "ข้อมูลหลังเพิ่ม"
                                    : "ข้อมูลก่อนถูกลบ"
                                }
                              />
                            )}
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/** เทียบค่าเดิมกับค่าใหม่ แสดงเฉพาะฟิลด์ที่เปลี่ยนจริง */
function ChangeDiff({
  before,
  after,
}: {
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
}) {
  const changes = FIELD_LABEL.filter(
    (field) => before?.[field.key] !== after?.[field.key],
  );

  if (changes.length === 0) {
    return (
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        ไม่พบฟิลด์ที่เปลี่ยนแปลง
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {changes.map((field) => (
        <li
          key={field.key}
          className="flex flex-wrap items-center gap-2 text-xs"
        >
          <span className="w-32 shrink-0 font-semibold text-zinc-700 dark:text-zinc-300">
            {field.label}
          </span>
          <span className="rounded bg-zinc-200/70 px-1.5 py-0.5 font-mono text-zinc-600 line-through dark:bg-zinc-800 dark:text-zinc-400">
            {formatValue(before?.[field.key])}
          </span>
          <span className="text-zinc-400">→</span>
          <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-mono font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            {formatValue(after?.[field.key])}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** แสดงข้อมูลทั้งชุด ใช้กับรายการที่เพิ่มใหม่หรือถูกลบ */
function SnapshotTable({
  data,
  caption,
}: {
  data: Record<string, unknown> | null;
  caption: string;
}) {
  if (!data) return null;

  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
        {caption}
      </p>
      <dl className="grid grid-cols-1 gap-x-6 gap-y-1.5 text-xs sm:grid-cols-2 lg:grid-cols-3">
        {FIELD_LABEL.map((field) => (
          <div key={field.key} className="flex gap-2">
            <dt className="w-28 shrink-0 text-zinc-500 dark:text-zinc-400">
              {field.label}
            </dt>
            <dd className="font-mono font-semibold text-zinc-800 dark:text-zinc-200">
              {formatValue(data[field.key])}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
