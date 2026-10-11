"use client";

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import {
  FileDown,
  Loader2,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  Terminal,
  User,
} from "lucide-react";
import writeXlsxFile from "write-excel-file/browser";
import { createClient } from "@/lib/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { toast } from "@/components/Toast";
import { cleanupAuditLogs, logAuditEvent, type AuditRisk } from "@/lib/audit";

/* --------------------------------------------------------------------------
   Types
   -------------------------------------------------------------------------- */
type AuditLog = {
  id: string;
  event_code: string;
  risk_level: AuditRisk;
  category: string;
  message: string | null;
  actor_id: string | null;
  actor_name: string | null;
  actor_email: string | null;
  actor_role: string | null;
  ip_address: string | null;
  user_agent: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

type RiskFilter = "ALL" | AuditRisk;

/* --------------------------------------------------------------------------
   Risk styling — โทนสีเดียวกับ terminal (พื้นดำ)
   -------------------------------------------------------------------------- */
const RISK_META: Record<
  AuditRisk,
  { label: string; badge: string; text: string; dot: string }
> = {
  critical: {
    label: "CRIT",
    badge: "border-rose-500/40 bg-rose-500/15 text-rose-300",
    text: "text-rose-400",
    dot: "bg-rose-500",
  },
  warning: {
    label: "WARN",
    badge: "border-amber-500/40 bg-amber-500/15 text-amber-300",
    text: "text-amber-400",
    dot: "bg-amber-500",
  },
  info: {
    label: "INFO",
    badge: "border-sky-500/40 bg-sky-500/15 text-sky-300",
    text: "text-sky-400",
    dot: "bg-sky-400",
  },
};

function riskMeta(risk: string) {
  return RISK_META[(risk as AuditRisk) in RISK_META ? (risk as AuditRisk) : "info"];
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** แสดงเวลาแบบ CLI: YYYY-MM-DD HH:MM:SS (ตามเวลาท้องถิ่น) */
function formatTs(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
    `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

function actorLabel(row: AuditLog) {
  return (
    row.actor_name || row.actor_email || (row.actor_id ? row.actor_id : "system")
  );
}

/* --------------------------------------------------------------------------
   Page
   -------------------------------------------------------------------------- */
export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("ALL");
  const [codeFilter, setCodeFilter] = useState("ALL");
  const [actorFilter, setActorFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // UI
  const [expanded, setExpanded] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [exporting, setExporting] = useState(false);

  const supabase = createClient();
  const { isAdmin, loading: roleLoading } = useUserRole();

  const fetchLogs = useCallback(
    async (mode: "initial" | "refresh") => {
      if (mode === "initial") setLoading(true);
      else setRefreshing(true);
      setLoadError(null);

      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (error) {
        /* แยกกรณี "ยังไม่ได้สร้างตาราง" ออกจาก error อื่น */
        const missingTable =
          error.code === "42P01" || error.message.includes("audit_logs");
        setLoadError(
          missingTable
            ? "ยังไม่ได้สร้างตาราง audit_logs — กรุณารัน src/supabase/07_audit_logs.sql ใน Supabase SQL Editor"
            : error.message,
        );
        setLogs([]);
      } else {
        setLogs((data ?? []) as AuditLog[]);
        setLastUpdated(new Date());
      }

      setLoading(false);
      setRefreshing(false);
    },
    [supabase],
  );

  // โหลดครั้งแรก: ล้าง log เกินอายุเก็บรักษาก่อน แล้วค่อยดึงข้อมูล
  const didInit = useRef(false);
  useEffect(() => {
    if (roleLoading || !isAdmin || didInit.current) return;
    didInit.current = true;

    (async () => {
      await cleanupAuditLogs();
      await fetchLogs("initial");
    })();
  }, [roleLoading, isAdmin, fetchLogs]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !isAdmin) return;
    const id = setInterval(() => {
      void fetchLogs("refresh");
    }, 8000);
    return () => clearInterval(id);
  }, [autoRefresh, isAdmin, fetchLogs]);

  /* ---------- derived options / counts ---------- */
  const codeOptions = useMemo(() => {
    const set = new Set<string>();
    logs.forEach((r) => set.add(r.event_code));
    return [...set].sort();
  }, [logs]);

  const actorOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of logs) {
      if (!row.actor_id && !row.actor_email) continue;
      const key = row.actor_id ?? row.actor_email ?? "";
      map.set(key, actorLabel(row));
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], "th"));
  }, [logs]);

  const hasActiveFilter =
    search !== "" ||
    riskFilter !== "ALL" ||
    codeFilter !== "ALL" ||
    actorFilter !== "ALL" ||
    fromDate !== "" ||
    toDate !== "";

  const handleClearFilters = useCallback(() => {
    setSearch("");
    setRiskFilter("ALL");
    setCodeFilter("ALL");
    setActorFilter("ALL");
    setFromDate("");
    setToDate("");
  }, []);

  const filteredLogs = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    const from = fromDate || null;
    const to = toDate || null;

    return logs.filter((row) => {
      if (riskFilter !== "ALL" && row.risk_level !== riskFilter) return false;
      if (codeFilter !== "ALL" && row.event_code !== codeFilter) return false;

      if (actorFilter !== "ALL") {
        const key = row.actor_id ?? row.actor_email ?? "";
        if (key !== actorFilter) return false;
      }

      if (from || to) {
        const day = row.created_at.slice(0, 10);
        if (from && day < from) return false;
        if (to && day > to) return false;
      }

      if (keyword) {
        const haystack = [
          row.event_code,
          row.message,
          row.actor_name,
          row.actor_email,
          row.actor_role,
          row.ip_address,
          row.category,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(keyword)) return false;
      }

      return true;
    });
  }, [logs, search, riskFilter, codeFilter, actorFilter, fromDate, toDate]);

  const counts = useMemo(
    () => ({
      critical: filteredLogs.filter((r) => r.risk_level === "critical").length,
      warning: filteredLogs.filter((r) => r.risk_level === "warning").length,
      info: filteredLogs.filter((r) => r.risk_level === "info").length,
    }),
    [filteredLogs],
  );

  /* ---------- export to Excel ---------- */
  const handleExport = useCallback(async () => {
    if (exporting) return;
    setExporting(true);
    try {
      const head = (text: string) => ({
        value: text,
        fontWeight: "bold" as const,
        backgroundColor: "#18181b",
        color: "#fafafa",
      });

      const data = [
        [
          head("วันและเวลา"),
          head("ระดับความเสี่ยง"),
          head("รหัส Event"),
          head("หมวดหมู่"),
          head("ผู้ใช้"),
          head("อีเมล"),
          head("บทบาท"),
          head("IP Address"),
          head("ข้อความ"),
          head("Metadata (JSON)"),
          head("User Agent"),
        ],
        ...filteredLogs.map((row) => [
          formatTs(row.created_at),
          row.risk_level.toUpperCase(),
          row.event_code,
          row.category,
          row.actor_name || "-",
          row.actor_email || "-",
          row.actor_role || "-",
          row.ip_address || "-",
          row.message || "-",
          row.metadata ? JSON.stringify(row.metadata) : "-",
          row.user_agent || "-",
        ]),
      ];

      const stamp = new Date()
        .toISOString()
        .slice(0, 19)
        .replace(/[:T]/g, "-");

      await writeXlsxFile([
        {
          sheet: "Audit Logs",
          data,
          columns: [
            { width: 20 },
            { width: 16 },
            { width: 22 },
            { width: 12 },
            { width: 22 },
            { width: 26 },
            { width: 12 },
            { width: 18 },
            { width: 44 },
            { width: 50 },
            { width: 40 },
          ],
        },
      ]).toFile(`audit-logs-${stamp}.xlsx`);

      void logAuditEvent({
        code: "EXPORT_DATA",
        category: "app",
        message: `ส่งออก Audit Logs (${filteredLogs.length} รายการ)`,
        metadata: { module: "audit-logs", rows: filteredLogs.length },
      });

      toast.success(`ส่งออก ${filteredLogs.length} รายการเป็นไฟล์ Excel แล้ว`);
    } catch (err) {
      console.error("ส่งออกไฟล์ Excel ไม่สำเร็จ:", err);
      toast.error("ส่งออกไฟล์ Excel ไม่สำเร็จ");
    } finally {
      setExporting(false);
    }
  }, [exporting, filteredLogs]);

  /* ---------- access guard ---------- */
  if (!roleLoading && !isAdmin) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
        <Terminal className="mx-auto h-8 w-8 text-zinc-400" strokeWidth={1.5} />
        <p className="mt-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          เฉพาะผู้ดูแลระบบเท่านั้นที่ดู Audit Logs ได้
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            <Terminal className="h-6 w-6" strokeWidth={1.75} />
            Audit Logs
          </h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            บันทึกทุกเหตุการณ์ตั้งแต่มีคนเข้าใช้งานเว็บ (เปิดหน้า, เข้า/ออกระบบ,
            แก้ไขข้อมูล) · เก็บย้อนหลัง 7 วัน · มีระดับความเสี่ยงกำกับ
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh((v) => !v)}
            className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
              autoRefresh
                ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
                : "border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                autoRefresh ? "animate-pulse bg-emerald-500" : "bg-zinc-400"
              }`}
            />
            {autoRefresh ? "Live: ON" : "Live: OFF"}
          </button>

          <button
            onClick={() => void fetchLogs("refresh")}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
              strokeWidth={1.75}
            />
            รีเฟรช
          </button>

          <button
            onClick={() => void handleExport()}
            disabled={exporting || filteredLogs.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2 text-xs font-bold text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.75} />
            ) : (
              <FileDown className="h-4 w-4" strokeWidth={1.75} />
            )}
            Export Excel
          </button>
        </div>
      </div>

      {loadError && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
          {loadError}
        </div>
      )}

      {/* CLI Terminal */}
      <section className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl shadow-zinc-950/30">
        {/* Title bar */}
        <div className="flex items-center gap-3 border-b border-zinc-800 bg-zinc-900/80 px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full bg-rose-500" />
            <span className="h-3 w-3 rounded-full bg-amber-500" />
            <span className="h-3 w-3 rounded-full bg-emerald-500" />
          </div>
          <p className="flex-1 truncate font-mono text-xs text-zinc-400">
            audit@scada: ~/var/log/audit — {filteredLogs.length} events
          </p>
          <span className="hidden items-center gap-1.5 font-mono text-[10px] text-zinc-500 sm:flex">
            <ShieldAlert className="h-3.5 w-3.5" strokeWidth={1.75} />
            RETENTION: 7d
          </span>
        </div>

        {/* Toolbar */}
        <div className="border-b border-zinc-800 bg-zinc-900/40 p-4">
          <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2 lg:grid-cols-6">
            <div className="lg:col-span-2">
              <label className="mb-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                <Search className="h-3.5 w-3.5" strokeWidth={1.75} />
                grep
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="code, message, user, ip..."
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-zinc-200 placeholder-zinc-600 focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                risk
              </label>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value as RiskFilter)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-zinc-200 focus:border-emerald-500 focus:outline-none"
              >
                <option value="ALL">ALL ({filteredLogs.length})</option>
                <option value="critical">CRITICAL ({counts.critical})</option>
                <option value="warning">WARNING ({counts.warning})</option>
                <option value="info">INFO ({counts.info})</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                event code
              </label>
              <select
                value={codeFilter}
                onChange={(e) => setCodeFilter(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-zinc-200 focus:border-emerald-500 focus:outline-none"
              >
                <option value="ALL">ทั้งหมด</option>
                {codeOptions.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                <User className="h-3.5 w-3.5" strokeWidth={1.75} />
                actor
              </label>
              <select
                value={actorFilter}
                onChange={(e) => setActorFilter(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 font-mono text-zinc-200 focus:border-emerald-500 focus:outline-none"
              >
                <option value="ALL">ทุกคน</option>
                {actorOptions.map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                  from
                </label>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-2 font-mono text-zinc-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-zinc-500">
                  to
                </label>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-2 py-2 font-mono text-zinc-200 focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800 pt-3 font-mono text-[10px] text-zinc-500">
            <span className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                critical {counts.critical}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" />
                warning {counts.warning}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-sky-400" />
                info {counts.info}
              </span>
            </span>

            {hasActiveFilter && (
              <button
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1.5 font-semibold text-rose-400 underline transition hover:text-rose-300"
              >
                <RotateCcw className="h-3 w-3" strokeWidth={1.75} />
                ล้างตัวกรอง
              </button>
            )}
          </div>
        </div>

        {/* Log output */}
        <div className="max-h-[60vh] overflow-y-auto font-mono text-xs">
          {/* prompt */}
          <div className="border-b border-zinc-900 bg-zinc-950 px-4 py-2 text-emerald-400">
            <span className="text-zinc-500">audit@scada</span>
            <span className="text-zinc-600">:</span>
            <span className="text-sky-400">~</span>
            <span className="text-zinc-500">$</span> tail -n 1000 audit.log
          </div>

          {loading ? (
            <p className="p-6 text-zinc-500">
              กำลังโหลด... <span className="animate-pulse">▋</span>
            </p>
          ) : filteredLogs.length === 0 ? (
            <p className="p-6 text-zinc-500">
              {logs.length === 0
                ? "// ยังไม่มีเหตุการณ์ที่บันทึกไว้"
                : "// ไม่พบรายการที่ตรงกับเงื่อนไขการกรอง"}
            </p>
          ) : (
            <div>
              {filteredLogs.map((row) => {
                const meta = riskMeta(row.risk_level);
                const isOpen = expanded === row.id;

                return (
                  <div
                    key={row.id}
                    className="border-b border-zinc-900/70 last:border-0 hover:bg-zinc-900/50"
                  >
                    <button
                      onClick={() => setExpanded(isOpen ? null : row.id)}
                      className="flex w-full flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-1.5 text-left"
                    >
                      <span className="text-zinc-600">
                        {formatTs(row.created_at)}
                      </span>

                      <span
                        className={`rounded border px-1.5 py-0.5 text-[10px] font-bold ${meta.badge}`}
                      >
                        {meta.label}
                      </span>

                      <span className={`font-semibold ${meta.text}`}>
                        {row.event_code}
                      </span>

                      <span className="text-zinc-500">
                        {actorLabel(row)}
                        {row.actor_role ? `(${row.actor_role})` : ""}
                      </span>

                      <span className="min-w-0 flex-1 truncate text-zinc-300">
                        {row.message || "—"}
                      </span>

                      {row.ip_address && (
                        <span className="hidden text-zinc-600 md:inline">
                          {row.ip_address}
                        </span>
                      )}
                    </button>

                    {isOpen && (
                      <div className="space-y-2 border-t border-zinc-900/70 bg-zinc-950 px-4 py-3 text-[11px] text-zinc-400">
                        <div className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2 lg:grid-cols-3">
                          <Detail label="เวลา" value={formatTs(row.created_at)} />
                          <Detail label="หมวดหมู่" value={row.category} />
                          <Detail
                            label="ความเสี่ยง"
                            value={row.risk_level.toUpperCase()}
                          />
                          <Detail
                            label="ผู้ใช้"
                            value={row.actor_name || "—"}
                          />
                          <Detail label="อีเมล" value={row.actor_email || "—"} />
                          <Detail label="บทบาท" value={row.actor_role || "—"} />
                          <Detail label="IP" value={row.ip_address || "—"} />
                          <Detail
                            label="Actor ID"
                            value={row.actor_id || "—"}
                          />
                          <Detail label="Log ID" value={row.id} />
                        </div>
                        {row.user_agent && (
                          <Detail label="User Agent" value={row.user_agent} />
                        )}
                        {row.metadata && (
                          <div>
                            <p className="mb-1 text-[10px] uppercase tracking-wider text-zinc-600">
                              metadata
                            </p>
                            <pre className="overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 text-[11px] text-emerald-300">
                              {JSON.stringify(row.metadata, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-800 bg-zinc-900/80 px-4 py-2 font-mono text-[10px] text-zinc-500">
          <span>
            {filteredLogs.length} / {logs.length} events
            {hasActiveFilter ? " (filtered)" : ""}
          </span>
          <span>
            {lastUpdated
              ? `last sync ${lastUpdated.toLocaleTimeString("th-TH")}`
              : "—"}
          </span>
        </div>
      </section>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="w-24 shrink-0 text-zinc-600">{label}</span>
      <span className="min-w-0 break-all text-zinc-300">{value}</span>
    </div>
  );
}
