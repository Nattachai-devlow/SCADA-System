"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Factory,
  Lock,
  Pencil,
  RotateCcw,
  Search,
  Trash,
  Wrench,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/Toast";
import { useUserRole } from "@/hooks/useUserRole";

const MACHINE_STATUSES = [
  "Maintenance",
  "Running",
  "Stop",
  "Alarm",
] as const;

const STATUS_LABEL: Record<string, string> = {
  Maintenance: "กำลังซ่อมบำรุง",
  Running: "ทำงาน",
  Stop: "หยุดทำงาน",
  Alarm: "มีคำเตือน",
};

type MachineOption = {
  id: string;
  machine_id: string;
  machine_name: string;
  status: string;
};

type MaintenanceRecord = {
  id: string;
  machine_id: string;
  technician_id: string | null;
  /** snapshot ชื่อผู้ลงบันทึก ณ เวลาซ่อม (คอลัมน์จาก 06_maintenance_technician_name.sql) */
  technician_name: string | null;
  title: string;
  details: string | null;
  maintenance_date: string;
  created_at: string;
  machines?: {
    machine_id: string;
    machine_name: string;
  } | null;
};

export default function MaintenancePage() {
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [machinesList, setMachinesList] = useState<MachineOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  // ชื่อของผู้ใช้ที่ล็อกอินอยู่ ใช้เป็นค่าเริ่มต้นของช่อง "ผู้ลงบันทึก"
  const [myName, setMyName] = useState("");

  // --- Search & Filter States ---
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMachineFilter, setSelectedMachineFilter] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Form State สำหรับ Modal เพิ่ม/แก้ไข
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MaintenanceRecord | null>(
    null,
  );
  const [formData, setFormData] = useState({
    machine_id: "",
    machine_status: "Maintenance" as string,
    title: "",
    details: "",
    technician_name: "",
    maintenance_date: new Date().toISOString().split("T")[0],
  });

  const supabase = createClient();
  const { canManage, loading: roleLoading } = useUserRole();

  // ฟังก์ชันแปลงวันที่แสดงผลเป็น dd/mm/yyyy แบบปลอดภัยจาก Timezone Offset
  const formatDateDDMMYYYY = (dateString: string) => {
    if (!dateString) return "-";
    const cleanDateStr = dateString.split("T")[0];
    const parts = cleanDateStr.split("-");
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
    }
    return dateString;
  };

  // ดึงข้อมูลรีเฟรชตาราง
  const refreshRecords = async () => {
    const { data } = await supabase
      .from("maintenance_records")
      .select(
        `
        *,
        machines (
          machine_id,
          machine_name
        )
      `,
      )
      .order("maintenance_date", { ascending: false });

    if (data) setRecords(data as unknown as MaintenanceRecord[]);
  };

  // โหลดข้อมูลตั้งต้น
  useEffect(() => {
    let isMounted = true;

    async function initData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && isMounted) {
        setUserId(user.id);

        // ชื่อของตัวเอง ใช้เติมช่อง "ผู้ลงบันทึก" (ช่างแก้ไขไม่ได้)
        const { data: myProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("id", user.id)
          .maybeSingle();

        if (isMounted) {
          setMyName(myProfile?.full_name?.trim() || "");
        }
      }

      const { data: mData } = await supabase
        .from("machines")
        .select("id, machine_id, machine_name, status");

      if (mData && isMounted) {
        setMachinesList(mData);
        if (mData.length > 0) {
          setFormData((prev) => ({ ...prev, machine_id: mData[0].id }));
        }
      }

      const { data, error } = await supabase
        .from("maintenance_records")
        .select(
          `
          *,
          machines (
            machine_id,
            machine_name
          )
        `,
        )
        .order("maintenance_date", { ascending: false });

      if (isMounted) {
        if (!error && data) {
          setRecords(data as unknown as MaintenanceRecord[]);
        }
        setLoading(false);
      }
    }

    initData();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  // เครื่องจักรที่เลือกอยู่ในฟอร์ม (ใช้แสดงสถานะปัจจุบัน)
  const selectedMachine = useMemo(
    () => machinesList.find((m) => m.id === formData.machine_id),
    [machinesList, formData.machine_id],
  );

  // --- Logic การกรองข้อมูล (Filter Process) ---
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      // 1. ค้นหาข้อความ
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        rec.title?.toLowerCase().includes(q) ||
        rec.details?.toLowerCase().includes(q) ||
        rec.technician_name?.toLowerCase().includes(q) ||
        rec.machines?.machine_name?.toLowerCase().includes(q) ||
        rec.machines?.machine_id?.toLowerCase().includes(q);

      // 2. กรองตามเครื่องจักร
      const matchMachine =
        selectedMachineFilter === "ALL" ||
        rec.machine_id === selectedMachineFilter;

      // 3. กรองตามช่วงวันที่ (เปรียบเทียบ YYYY-MM-DD ตรงๆ)
      let matchStartDate = true;
      let matchEndDate = true;

      if (rec.maintenance_date) {
        const recDateStr = rec.maintenance_date.split("T")[0];

        if (startDate) {
          matchStartDate = recDateStr >= startDate;
        }

        if (endDate) {
          matchEndDate = recDateStr <= endDate;
        }
      }

      return matchSearch && matchMachine && matchStartDate && matchEndDate;
    });
  }, [records, searchQuery, selectedMachineFilter, startDate, endDate]);

  // ล้างตัวกรองทั้งหมด
  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedMachineFilter("ALL");
    setStartDate("");
    setEndDate("");
  };

  // เปิด Modal เพิ่ม หรือ แก้ไข
  const handleOpenModal = (record?: MaintenanceRecord) => {
    if (record) {
      setEditingRecord(record);
      setFormData({
        machine_id: record.machine_id,
        // แก้ไขรายการเดิม: เริ่มจากสถานะจริงของเครื่อง ไม่ใช่ค่าเริ่มต้น
        // บันทึกทับโดยไม่ตั้งใจจนกว่าผู้ใช้จะเลือกเอง
        machine_status:
          machinesList.find((m) => m.id === record.machine_id)?.status ||
          "Maintenance",
        title: record.title,
        details: record.details || "",
        technician_name: record.technician_name || myName,
        maintenance_date: record.maintenance_date
          ? record.maintenance_date.split("T")[0]
          : new Date().toISOString().split("T")[0],
      });
    } else {
      setEditingRecord(null);
      setFormData({
        machine_id: machinesList[0]?.id || "",
        // งานใหม่ = เครื่องกำลังซ่อม
        machine_status: "Maintenance",
        title: "",
        details: "",
        // เริ่มต้นเป็นชื่อผู้ใช้ปัจจุบัน แอดมินค่อยแก้ได้ถ้าบันทึกแทนคนอื่น
        technician_name: myName,
        maintenance_date: new Date().toISOString().split("T")[0],
      });
    }
    setIsModalOpen(true);
  };

  // เปลี่ยนสถานะเครื่องจักรให้ตรงกับผลของงานซ่อม
  const applyMachineStatus = async (
    machineId: string,
    status: string,
    machineLabel: string,
  ) => {
    // ช่างเปลี่ยนสถานะเครื่องไม่ได้ (RLS อนุญาตเฉพาะแอดมิน)
    // ข้ามไปเลยแทนที่จะยิงคิวรีที่ต้องล้มเหลวทุกครั้ง
    if (!canManage) return;
    if (!machineId || !status) return;

    const { error } = await supabase
      .from("machines")
      .update({ status })
      .eq("id", machineId);

    if (error) {
      toast.error(
        `บันทึกรายการซ่อมสำเร็จ แต่เปลี่ยนสถานะ ${machineLabel} เป็น "${STATUS_LABEL[status] ?? status}" ไม่สำเร็จ: ${error.message} (ต้องมีสิทธิ์ผู้ดูแลระบบ)`,
        8000,
      );
    } else {
      toast.success(
        `บันทึกรายการซ่อมและตั้งสถานะ ${machineLabel} เป็น "${STATUS_LABEL[status] ?? status}" เรียบร้อย`,
      );
    }
  };

  // บันทึกข้อมูล
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const machine = machinesList.find(
      (m) => m.id === formData.machine_id,
    );
    const machineLabel = machine
      ? `[${machine.machine_id}] ${machine.machine_name}`
      : "เครื่องจักร";

    if (editingRecord) {
      const payload = {
        machine_id: formData.machine_id,
        title: formData.title,
        details: formData.details,
        maintenance_date: formData.maintenance_date,
        // ช่างแก้ชื่อผู้ลงบันทึกไม่ได้ และฝั่ง DB ก็จะปฏิเสธอยู่แล้ว
        // จึงไม่ส่งคีย์นี้เลยเว้นแต่เป็นผู้ดูแลระบบ
        ...(canManage && {
          technician_name: formData.technician_name.trim() || myName,
        }),
      };

      const { error } = await supabase
        .from("maintenance_records")
        .update(payload)
        .eq("id", editingRecord.id);

      if (error) {
        toast.error(`เกิดข้อผิดพลาดในการแก้ไข: ${error.message}`);
        return;
      }

      await applyMachineStatus(
        formData.machine_id,
        formData.machine_status,
        machineLabel,
      );
    } else {
      const currentDate = new Date().toISOString().split("T")[0];
      const payload = {
        machine_id: formData.machine_id,
        technician_id: userId,
        technician_name: formData.technician_name.trim() || myName,
        title: formData.title,
        details: formData.details,
        maintenance_date: currentDate,
      };

      const { error } = await supabase
        .from("maintenance_records")
        .insert([payload]);

      if (error) {
        toast.error(`เกิดข้อผิดพลาดในการบันทึก: ${error.message}`);
        return;
      }

      await applyMachineStatus(
        formData.machine_id,
        formData.machine_status,
        machineLabel,
      );
    }

    setIsModalOpen(false);
    refreshRecords();
  };

  // ลบรายการ
  const handleDelete = async (id: string, title: string) => {
    if (confirm(`คุณต้องการลบประวัติการซ่อมบำรุง "${title}" ใช่หรือไม่?`)) {
      const { error } = await supabase
        .from("maintenance_records")
        .delete()
        .eq("id", id);

      if (error) {
        toast.error(`ไม่สามารถลบได้: ${error.message}`);
      } else {
        refreshRecords();
      }
    }
  };

  if (loading) {
    return (
      <div className="text-zinc-600 dark:text-zinc-400 p-6">
        กำลังโหลดข้อมูล Maintenance Records...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            Maintenance Records
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm">
            การวางแผน บันทึก ค้นหา และติดตามงานบำรุงรักษาเครื่องจักร
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-700 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white font-medium text-xs rounded-xl transition shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <Wrench className="h-4 w-4" strokeWidth={1.75} />
          <span>บันทึกการซ่อมบำรุงใหม่</span>
        </button>
      </div>

      {/* --- Search & Filter Bar --- */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* 1. ค้นหาคำค้นหลัก */}
          <div>
            <label className="mb-1 flex items-center gap-1.5 font-medium text-zinc-600 dark:text-zinc-400">
              <Search className="h-3.5 w-3.5" strokeWidth={1.75} />
              ค้นหา (Search)
            </label>
            <input
              type="text"
              placeholder="ค้นหาหัวข้อ, รายละเอียด, รหัสเครื่อง..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-zinc-900"
            />
          </div>

          {/* 2. เลือกเครื่องจักร */}
          <div>
            <label className="mb-1 flex items-center gap-1.5 font-medium text-zinc-600 dark:text-zinc-400">
              <Factory className="h-3.5 w-3.5" strokeWidth={1.75} />
              เลือกเครื่องจักร
            </label>
            <select
              value={selectedMachineFilter}
              onChange={(e) => setSelectedMachineFilter(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-zinc-900"
            >
              <option value="ALL">เครื่องจักรทั้งหมด (All Machines)</option>
              {machinesList.map((m) => (
                <option key={m.id} value={m.id}>
                  [{m.machine_id}] {m.machine_name}
                </option>
              ))}
            </select>
          </div>

          {/* 3. วันที่เริ่มต้น (พร้อม Placeholder dd/mm/yyyy) */}
          <div>
            <label className="mb-1 flex items-center gap-1.5 font-medium text-zinc-600 dark:text-zinc-400">
              <Calendar className="h-3.5 w-3.5" strokeWidth={1.75} />
              ตั้งแต่วันที่
            </label>
            <input
              type={startDate ? "date" : "text"}
              placeholder="mm/dd/yyyy"
              onFocus={(e) => (e.target.type = "date")}
              onBlur={(e) => {
                if (!e.target.value) e.target.type = "text";
              }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-zinc-900"
            />
          </div>

          {/* 4. วันที่สิ้นสุด (พร้อม Placeholder dd/mm/yyyy) */}
          <div>
            <label className="mb-1 flex items-center gap-1.5 font-medium text-zinc-600 dark:text-zinc-400">
              <Calendar className="h-3.5 w-3.5" strokeWidth={1.75} />
              ถึงวันที่
            </label>
            <input
              type={endDate ? "date" : "text"}
              placeholder="mm/dd/yyyy"
              onFocus={(e) => (e.target.type = "date")}
              onBlur={(e) => {
                if (!e.target.value) e.target.type = "text";
              }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-none focus:border-zinc-900"
            />
          </div>
        </div>

        {/* บาร์สรุปผลลัพธ์ & ปุ่ม Clear Filter */}
        <div className="flex justify-between items-center pt-2 border-t border-zinc-200 dark:border-zinc-800 text-xs">
          <span className="text-zinc-600 dark:text-zinc-400">
            พบรายการทั้งหมด{" "}
            <strong className="text-zinc-900 dark:text-zinc-100 font-semibold">
              {filteredRecords.length}
            </strong>{" "}
            รายการ
            {filteredRecords.length !== records.length && (
              <span className="text-zinc-500 dark:text-zinc-400 ml-1">
                (จากทั้งหมด {records.length} รายการ)
              </span>
            )}
          </span>

          {(searchQuery ||
            selectedMachineFilter !== "ALL" ||
            startDate ||
            endDate) && (
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

      {/* Maintenance Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/60 border-b border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 text-sm">
                <th className="p-4">วันที่ดำเนินการ</th>
                <th className="p-4">เครื่องจักร</th>
                <th className="p-4">หัวข้องาน</th>
                <th className="p-4">ผู้ลงบันทึก</th>
                <th className="p-4">รายละเอียด</th>
                <th className="p-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-zinc-500 dark:text-zinc-400">
                    ไม่พบข้อมูลการซ่อมบำรุงที่ตรงกับเงื่อนไขการค้นหา
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-zinc-100/40 dark:bg-zinc-800/40 transition">
                    <td className="p-4 text-zinc-600 dark:text-zinc-400 font-mono text-xs">
                      {formatDateDDMMYYYY(rec.maintenance_date)}
                    </td>
                    <td className="p-4 font-semibold text-zinc-800 dark:text-zinc-200">
                      {rec.machines?.machine_name || "-"}
                      <div className="text-[10px] text-zinc-600 dark:text-zinc-400 font-mono">
                        {rec.machines?.machine_id}
                      </div>
                    </td>
                    <td className="p-4 font-medium text-zinc-900 dark:text-zinc-100">
                      {rec.title}
                    </td>
                    <td className="p-4 text-zinc-700 dark:text-zinc-300">
                      {rec.technician_name || (
                        <span className="text-zinc-400 dark:text-zinc-500">
                          ไม่ระบุชื่อ
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-zinc-600 dark:text-zinc-400">{rec.details || "-"}</td>
                    <td className="p-4 text-right">
                      <span className="inline-flex items-center gap-2">
                        <button
                          onClick={() => handleOpenModal(rec)}
                          className="inline-flex items-center gap-1.5 rounded border border-zinc-300 bg-zinc-100 px-2.5 py-1 text-xs text-zinc-900 transition hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
                        >
                          <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} />
                          แก้ไข
                        </button>
                        <button
                          onClick={() => handleDelete(rec.id, rec.title)}
                          className="inline-flex items-center gap-1.5 rounded border border-red-200 bg-red-50 px-2.5 py-1 text-xs text-red-700 transition hover:bg-red-100 dark:border-red-900 dark:bg-red-950 dark:text-red-300"
                        >
                          <Trash className="h-3.5 w-3.5" strokeWidth={1.75} />
                          ลบ
                        </button>
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-sm">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {editingRecord
                ? "แก้ไขรายการซ่อมบำรุง"
                : "สร้างรายการซ่อมบำรุงใหม่"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  เครื่องจักร
                  {selectedMachine && (
                    <span className="ml-2 font-normal text-zinc-500 dark:text-zinc-400">
                      สถานะปัจจุบัน:{" "}
                      {STATUS_LABEL[selectedMachine.status] ??
                        selectedMachine.status}
                    </span>
                  )}
                </label>
                <select
                  value={formData.machine_id}
                  onChange={(e) => {
                    const next = machinesList.find(
                      (m) => m.id === e.target.value,
                    );
                    setFormData({
                      ...formData,
                      machine_id: e.target.value,
                      // เปลี่ยนเครื่องแล้วเริ่มจากสถานะจริงของเครื่องนั้น
                      machine_status:
                        next?.status ?? formData.machine_status,
                    });
                  }}
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-zinc-900"
                >
                  {machinesList.map((m) => (
                    <option key={m.id} value={m.id}>
                      [{m.machine_id}] {m.machine_name}
                    </option>
                  ))}
                </select>
              </div>

              {canManage ? (
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                    ตั้งสถานะเครื่องจักรหลังบันทึก
                  </label>
                  <select
                    value={formData.machine_status}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        machine_status: e.target.value,
                      })
                    }
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-zinc-900"
                  >
                    {MACHINE_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s]} ({s})
                      </option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                    เลือก &quot;ทำงาน (Running)&quot; เมื่อซ่อมเสร็จแล้ว
                    เครื่องจะกลับไปเดินเครื่องและไฟในหน้า SCADA
                    จะกลับมาเป็นสีเขียวโดยอัตโนมัติ
                  </p>
                </div>
              ) : (
                !roleLoading && (
                  <div className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 px-3 py-2.5">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                      <Lock className="h-3.5 w-3.5" strokeWidth={1.75} />
                      เปลี่ยนสถานะเครื่องจักรไม่ได้
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                      บันทึกงานซ่อมได้ตามปกติ
                      แต่การสลับเครื่องกลับไปทำงานต้องให้ผู้ดูแลระบบเป็นผู้กด
                    </p>
                  </div>
                )
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  หัวข้องาน (Title)
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น เปลี่ยนซีลยางปั๊ม / ล้างไส้กรอง"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  รายละเอียดการทำงาน (Details)
                </label>
                <textarea
                  rows={3}
                  placeholder="รายละเอียดขั้นตอนหรืออะไหล่ที่เปลี่ยน..."
                  value={formData.details}
                  onChange={(e) =>
                    setFormData({ ...formData, details: e.target.value })
                  }
                  className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  ผู้ลงบันทึก (ช่างผู้ซ่อม)
                </label>

                {canManage ? (
                  <>
                    <input
                      type="text"
                      placeholder={myName || "ระบุชื่อผู้ลงบันทึก"}
                      value={formData.technician_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          technician_name: e.target.value,
                        })
                      }
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-2.5 text-sm text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-zinc-900"
                    />
                    <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                      ผู้ดูแลระบบแก้ไขชื่อได้ เช่น กรณีบันทึกแทนช่าง
                      หรือทีมงานซ่อมร่วมกัน
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-full flex items-center gap-2 bg-zinc-50/60 border border-zinc-200/80 rounded-lg p-2.5 text-sm text-zinc-600 dark:bg-zinc-950/60 dark:border-zinc-800/80 dark:text-zinc-300">
                      <Wrench
                        className="h-3.5 w-3.5 shrink-0"
                        strokeWidth={1.75}
                      />
                      <span className="truncate">
                        {formData.technician_name || myName || "ไม่ระบุชื่อ"}
                      </span>
                      <Lock
                        className="h-3.5 w-3.5 shrink-0 ml-auto"
                        strokeWidth={1.75}
                      />
                    </div>
                    <p className="mt-1.5 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
                      ช่างลงบันทึกงานของตัวเองเท่านั้น
                      ชื่อผู้ลงบันทึกแก้ไขไม่ได้
                      (ผู้ดูแลระบบเป็นผู้แก้ไขได้)
                    </p>
                  </>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1">
                  วันที่ดำเนินการ (อัตโนมัติ)
                </label>
                <input
                  type="date"
                  readOnly
                  value={formData.maintenance_date}
                  className="w-full bg-zinc-50/60 border border-zinc-200/80 rounded-lg p-2.5 text-sm text-zinc-600 dark:text-zinc-400 cursor-not-allowed opacity-70 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-sm font-medium rounded-lg transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-700 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white text-sm font-medium rounded-lg transition"
                >
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
