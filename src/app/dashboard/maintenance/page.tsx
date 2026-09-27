"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";

type MachineOption = {
  id: string;
  machine_id: string;
  machine_name: string;
};

type MaintenanceRecord = {
  id: string;
  machine_id: string;
  technician_id: string | null;
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
    title: "",
    details: "",
    maintenance_date: new Date().toISOString().split("T")[0],
  });

  const supabase = createClient();

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
      }

      const { data: mData } = await supabase
        .from("machines")
        .select("id, machine_id, machine_name");

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

  // --- Logic การกรองข้อมูล (Filter Process) ---
  const filteredRecords = useMemo(() => {
    return records.filter((rec) => {
      // 1. ค้นหาข้อความ
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        rec.title?.toLowerCase().includes(q) ||
        rec.details?.toLowerCase().includes(q) ||
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
        title: record.title,
        details: record.details || "",
        maintenance_date: record.maintenance_date
          ? record.maintenance_date.split("T")[0]
          : new Date().toISOString().split("T")[0],
      });
    } else {
      setEditingRecord(null);
      setFormData({
        machine_id: machinesList[0]?.id || "",
        title: "",
        details: "",
        maintenance_date: new Date().toISOString().split("T")[0],
      });
    }
    setIsModalOpen(true);
  };

  // บันทึกข้อมูล
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingRecord) {
      const payload = {
        machine_id: formData.machine_id,
        title: formData.title,
        details: formData.details,
        maintenance_date: formData.maintenance_date,
      };

      const { error } = await supabase
        .from("maintenance_records")
        .update(payload)
        .eq("id", editingRecord.id);

      if (error) {
        alert(`เกิดข้อผิดพลาดในการแก้ไข: ${error.message}`);
      } else {
        setIsModalOpen(false);
        refreshRecords();
      }
    } else {
      const currentDate = new Date().toISOString().split("T")[0];
      const payload = {
        machine_id: formData.machine_id,
        technician_id: userId,
        title: formData.title,
        details: formData.details,
        maintenance_date: currentDate,
      };

      const { error } = await supabase
        .from("maintenance_records")
        .insert([payload]);

      if (error) {
        alert(`เกิดข้อผิดพลาดในการบันทึก: ${error.message}`);
      } else {
        await supabase
          .from("machines")
          .update({ status: "Maintenance" })
          .eq("id", formData.machine_id);

        setIsModalOpen(false);
        refreshRecords();
      }
    }
  };

  // ลบรายการ
  const handleDelete = async (id: string, title: string) => {
    if (confirm(`คุณต้องการลบประวัติการซ่อมบำรุง "${title}" ใช่หรือไม่?`)) {
      const { error } = await supabase
        .from("maintenance_records")
        .delete()
        .eq("id", id);

      if (error) {
        alert(`ไม่สามารถลบได้: ${error.message}`);
      } else {
        refreshRecords();
      }
    }
  };

  if (loading) {
    return (
      <div className="text-zinc-600 p-6">
        กำลังโหลดข้อมูล Maintenance Records...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">
            Maintenance Records
          </h1>
          <p className="text-zinc-600 text-sm">
            การวางแผน บันทึก ค้นหา และติดตามงานบำรุงรักษาเครื่องจักร
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2.5 bg-zinc-900 hover:bg-zinc-700 text-white font-medium text-xs rounded-xl transition shadow-sm flex items-center gap-2 self-start sm:self-auto"
        >
          <span>🔧</span>
          <span>บันทึกการซ่อมบำรุงใหม่</span>
        </button>
      </div>

      {/* --- Search & Filter Bar --- */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* 1. ค้นหาคำค้นหลัก */}
          <div>
            <label className="block text-zinc-600 mb-1 font-medium">
              🔍 ค้นหา (Search)
            </label>
            <input
              type="text"
              placeholder="ค้นหาหัวข้อ, รายละเอียด, รหัสเครื่อง..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-900"
            />
          </div>

          {/* 2. เลือกเครื่องจักร */}
          <div>
            <label className="block text-zinc-600 mb-1 font-medium">
              🏭 เลือกเครื่องจักร
            </label>
            <select
              value={selectedMachineFilter}
              onChange={(e) => setSelectedMachineFilter(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-800 focus:outline-none focus:border-zinc-900"
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
            <label className="block text-zinc-600 mb-1 font-medium">
              📅 ตั้งแต่วันที่
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
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-900"
            />
          </div>

          {/* 4. วันที่สิ้นสุด (พร้อม Placeholder dd/mm/yyyy) */}
          <div>
            <label className="block text-zinc-600 mb-1 font-medium">
              📅 ถึงวันที่
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
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-zinc-900"
            />
          </div>
        </div>

        {/* บาร์สรุปผลลัพธ์ & ปุ่ม Clear Filter */}
        <div className="flex justify-between items-center pt-2 border-t border-zinc-200 text-xs">
          <span className="text-zinc-600">
            พบรายการทั้งหมด{" "}
            <strong className="text-zinc-900 font-semibold">
              {filteredRecords.length}
            </strong>{" "}
            รายการ
            {filteredRecords.length !== records.length && (
              <span className="text-zinc-500 ml-1">
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
              className="text-rose-700 hover:text-rose-800 font-medium underline transition"
            >
              🔄 ล้างตัวกรองทั้งหมด
            </button>
          )}
        </div>
      </div>

      {/* Maintenance Table */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/60 border-b border-zinc-200 text-zinc-600 text-sm">
                <th className="p-4">วันที่ดำเนินการ</th>
                <th className="p-4">เครื่องจักร</th>
                <th className="p-4">หัวข้องาน</th>
                <th className="p-4">รายละเอียด</th>
                <th className="p-4 text-right">การจัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-sm">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500">
                    ไม่พบข้อมูลการซ่อมบำรุงที่ตรงกับเงื่อนไขการค้นหา
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-zinc-100/40 transition">
                    <td className="p-4 text-zinc-600 font-mono text-xs">
                      {formatDateDDMMYYYY(rec.maintenance_date)}
                    </td>
                    <td className="p-4 font-semibold text-zinc-800">
                      {rec.machines?.machine_name || "-"}
                      <div className="text-[10px] text-zinc-600 font-mono">
                        {rec.machines?.machine_id}
                      </div>
                    </td>
                    <td className="p-4 font-medium text-zinc-900">
                      {rec.title}
                    </td>
                    <td className="p-4 text-zinc-600">{rec.details || "-"}</td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenModal(rec)}
                        className="px-2.5 py-1 text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded border border-zinc-300 transition"
                      >
                        ✏️ แก้ไข
                      </button>
                      <button
                        onClick={() => handleDelete(rec.id, rec.title)}
                        className="px-2.5 py-1 text-xs bg-red-50 hover:bg-red-100 text-red-700 rounded border border-red-200 transition"
                      >
                        🗑️ ลบ
                      </button>
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
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-sm">
            <h2 className="text-xl font-bold text-zinc-900">
              {editingRecord
                ? "แก้ไขรายการซ่อมบำรุง"
                : "สร้างรายการซ่อมบำรุงใหม่"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1">
                  เครื่องจักร
                </label>
                <select
                  value={formData.machine_id}
                  onChange={(e) =>
                    setFormData({ ...formData, machine_id: e.target.value })
                  }
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-sm text-zinc-800 focus:outline-none focus:border-zinc-900"
                >
                  {machinesList.map((m) => (
                    <option key={m.id} value={m.id}>
                      [{m.machine_id}] {m.machine_name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1">
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
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-sm text-zinc-800 focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1">
                  รายละเอียดการทำงาน (Details)
                </label>
                <textarea
                  rows={3}
                  placeholder="รายละเอียดขั้นตอนหรืออะไหล่ที่เปลี่ยน..."
                  value={formData.details}
                  onChange={(e) =>
                    setFormData({ ...formData, details: e.target.value })
                  }
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-sm text-zinc-800 focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1">
                  วันที่ดำเนินการ (อัตโนมัติ)
                </label>
                <input
                  type="date"
                  readOnly
                  value={formData.maintenance_date}
                  className="w-full bg-zinc-50/60 border border-zinc-200/80 rounded-lg p-2.5 text-sm text-zinc-600 cursor-not-allowed opacity-70 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-sm font-medium rounded-lg transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-700 text-white text-sm font-medium rounded-lg transition"
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
