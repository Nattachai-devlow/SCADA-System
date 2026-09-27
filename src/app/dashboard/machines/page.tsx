"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/components/Toast";
import { useUserRole } from "@/hooks/useUserRole";

type Machine = {
  id: string;
  machine_id: string;
  machine_name: string;
  machine_type: string;
  location: string | null;
  status: string;
};

export default function MachineMasterPage() {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State สำหรับ Modal เพิ่ม/แก้ไข
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [formData, setFormData] = useState({
    machine_id: "",
    machine_name: "",
    machine_type: "Pump",
    location: "",
    status: "Stop",
  });

  const supabase = createClient();
  const { canManage, loading: roleLoading } = useUserRole();

  // ฟังก์ชันดึงข้อมูลใหม่เพื่อรีเฟรชตาราง (เรียกใช้หลัง เพิ่ม/ลบ/แก้ไข)
  const refreshMachines = async () => {
    const { data, error } = await supabase
      .from("machines")
      .select("*")
      .order("created_at", { ascending: true });
    if (!error && data) {
      setMachines(data);
    }
  };

  // โหลดข้อมูลครั้งแรกเมื่อเปิดหน้าเว็บ (แก้ Warning Cascading Renders เรียบร้อย)
  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      const { data, error } = await supabase
        .from("machines")
        .select("*")
        .order("created_at", { ascending: true });

      if (isMounted) {
        if (!error && data) {
          setMachines(data);
        }
        setLoading(false);
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
  }, []);

  // เปิด Modal สำหรับ เพิ่ม หรือ แก้ไข
  const handleOpenModal = (machine?: Machine) => {
    if (!canManage) {
      toast.error("เฉพาะผู้ดูแลระบบเท่านั้นที่จัดการข้อมูลเครื่องจักรได้");
      return;
    }

    if (machine) {
      setEditingMachine(machine);
      setFormData({
        machine_id: machine.machine_id,
        machine_name: machine.machine_name,
        machine_type: machine.machine_type,
        location: machine.location || "",
        status: machine.status,
      });
    } else {
      setEditingMachine(null);
      setFormData({
        machine_id: "",
        machine_name: "",
        machine_type: "Pump",
        location: "",
        status: "Stop",
      });
    }
    setIsModalOpen(true);
  };

  // บันทึกการ เพิ่ม หรือ แก้ไข ข้อมูล
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canManage) {
      toast.error("เฉพาะผู้ดูแลระบบเท่านั้นที่จัดการข้อมูลเครื่องจักรได้");
      return;
    }

    if (editingMachine) {
      // Update ข้อมูลเดิม
      const { error } = await supabase
        .from("machines")
        .update(formData)
        .eq("id", editingMachine.id);

      if (error) {
        toast.error(`เกิดข้อผิดพลาดในการแก้ไข: ${error.message}`);
      } else {
        setIsModalOpen(false);
        refreshMachines();
      }
    } else {
      // Insert เพิ่มใหม่
      const { error } = await supabase.from("machines").insert([formData]);

      if (error) {
        toast.error(`เกิดข้อผิดพลาดในการเพิ่ม: ${error.message}`);
      } else {
        setIsModalOpen(false);
        refreshMachines();
      }
    }
  };

  // ลบรายการเครื่องจักร
  const handleDelete = async (id: string, machineId: string) => {
    if (!canManage) {
      toast.error("เฉพาะผู้ดูแลระบบเท่านั้นที่ลบเครื่องจักรได้");
      return;
    }

    if (confirm(`คุณต้องการลบเครื่องจักร ${machineId} ใช่หรือไม่?`)) {
      const { error } = await supabase.from("machines").delete().eq("id", id);
      if (error) {
        toast.error(`ไม่สามารถลบได้: ${error.message}`);
      } else {
        refreshMachines();
      }
    }
  };

  // อัปเดตสถานะด่วนจาก Dropdown บนตาราง
  const handleQuickStatusChange = async (
    machine: Machine,
    newStatus: string,
  ) => {
    if (!canManage) {
      toast.error("เฉพาะผู้ดูแลระบบเท่านั้นที่เปลี่ยนสถานะเครื่องจักรได้");
      return;
    }

    const { error } = await supabase
      .from("machines")
      .update({ status: newStatus })
      .eq("id", machine.id);

    if (error) {
      toast.error(`อัปเดตสถานะไม่สำเร็จ: ${error.message}`);
    } else {
      refreshMachines();
    }
  };

  if (loading) {
    return (
      <div className="text-zinc-600 p-6">
        กำลังโหลดข้อมูล Machine Master...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Machine Master</h1>
          <p className="text-zinc-600 text-sm">
            จัดการข้อมูลและลงทะเบียนเครื่องจักรในระบบ
          </p>
        </div>

        {canManage ? (
          <button
            onClick={() => handleOpenModal()}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-700 text-white font-medium text-sm rounded-lg transition shadow-sm flex items-center gap-2"
          >
            ➕ เพิ่มเครื่องจักรใหม่
          </button>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-500">
            🔒 โหมดดูอย่างเดียว
          </span>
        )}
      </div>

      {/* ตารางแสดงผลเครื่องจักร */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/60 border-b border-zinc-200 text-zinc-600 text-sm">
                <th className="p-4">Machine ID</th>
                <th className="p-4">ชื่อเครื่องจักร</th>
                <th className="p-4">ประเภท</th>
                <th className="p-4">สถานที่ติดตั้ง</th>
                <th className="p-4">สถานะ (Status)</th>
                {canManage && !roleLoading && (
                  <th className="p-4 text-right">การจัดการ</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-sm">
              {machines.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-zinc-500">
                    ยังไม่มีข้อมูลเครื่องจักรในระบบ
                  </td>
                </tr>
              ) : (
                machines.map((m) => (
                  <tr key={m.id} className="hover:bg-zinc-100/40 transition">
                    <td className="p-4 font-mono font-semibold text-zinc-800">
                      {m.machine_id}
                    </td>
                    <td className="p-4 text-zinc-800">{m.machine_name}</td>
                    <td className="p-4 text-zinc-600">{m.machine_type}</td>
                    <td className="p-4 text-zinc-600">{m.location || "-"}</td>

                    {/* เปลี่ยนสถานะด่วนจากตาราง — เฉพาะแอดมิน */}
                    <td className="p-4">
                      {roleLoading ? (
            <span className="w-28 h-9 rounded-lg bg-zinc-100 animate-pulse" />
          ) : canManage ? (
                      <select
                        value={m.status}
                        onChange={(e) =>
                          handleQuickStatusChange(m, e.target.value)
                        }
                        className={`px-2.5 py-1 text-xs rounded-full font-medium bg-zinc-50 border focus:outline-none cursor-pointer ${
                          m.status === "Running"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : m.status === "Stop"
                              ? "text-zinc-600 border-zinc-400/50"
                              : m.status === "Maintenance"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        <option
                          value="Stop"
                          className="bg-white text-zinc-700"
                        >
                          Stop
                        </option>
                        <option
                          value="Running"
                          className="bg-white text-emerald-700"
                        >
                          Running
                        </option>
                        <option
                          value="Maintenance"
                          className="bg-white text-zinc-900"
                        >
                          Maintenance
                        </option>
                        <option
                          value="Alarm"
                          className="bg-white text-red-700"
                        >
                          Alarm
                        </option>
                      </select>
                      ) : (
                        <span
                          className={`inline-block px-2.5 py-1 text-xs rounded-full font-medium border ${
                            m.status === "Running"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : m.status === "Stop"
                                ? "text-zinc-600 border-zinc-400/50 bg-zinc-50"
                                : m.status === "Maintenance"
                                  ? "bg-amber-50 text-amber-700 border-amber-200"
                                  : "bg-red-50 text-red-700 border-red-200"
                          }`}
                        >
                          {m.status}
                        </span>
                      )}
                    </td>

                    {/* ปุ่มจัดการ — เฉพาะแอดมิน */}
                    <td className="p-4 text-right space-x-2">
                      {canManage && !roleLoading && (
                        <>
                      <button
                        onClick={() => handleOpenModal(m)}
                        className="px-2.5 py-1 text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded border border-zinc-300 transition"
                      >
                        ✏️ แก้ไข
                      </button>
                      <button
                        onClick={() => handleDelete(m.id, m.machine_id)}
                        className="px-2.5 py-1 text-xs bg-red-50 hover:bg-red-100 text-red-700 rounded border border-red-200 transition"
                      >
                        🗑️ ลบ
                      </button>
                        </>
                      )}
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
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-sm">
            <h2 className="text-xl font-bold text-zinc-900">
              {editingMachine
                ? "แก้ไขข้อมูลเครื่องจักร"
                : "เพิ่มเครื่องจักรใหม่"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1">
                  Machine ID
                </label>
                <input
                  type="text"
                  required
                  value={formData.machine_id}
                  onChange={(e) =>
                    setFormData({ ...formData, machine_id: e.target.value })
                  }
                  placeholder="เช่น PUMP-01, HEAT-01"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-sm text-zinc-800 focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1">
                  ชื่อเครื่องจักร
                </label>
                <input
                  type="text"
                  required
                  value={formData.machine_name}
                  onChange={(e) =>
                    setFormData({ ...formData, machine_name: e.target.value })
                  }
                  placeholder="เช่น Water Filter Pump 1"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-sm text-zinc-800 focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1">
                  ประเภทเครื่องจักร
                </label>
                <select
                  value={formData.machine_type}
                  onChange={(e) =>
                    setFormData({ ...formData, machine_type: e.target.value })
                  }
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-sm text-zinc-800 focus:outline-none focus:border-zinc-900"
                >
                  <option value="Pump">Pump</option>
                  <option value="Filter">Filter</option>
                  <option value="Heater">Heater</option>
                  <option value="Sensor">Sensor</option>
                  <option value="Valve">Valve</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1">
                  สถานที่ติดตั้ง (Location)
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  placeholder="เช่น Pump Room A"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-sm text-zinc-800 focus:outline-none focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-600 mb-1">
                  สถานะ (Status)
                </label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({ ...formData, status: e.target.value })
                  }
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-sm text-zinc-800 focus:outline-none focus:border-zinc-900"
                >
                  <option value="Stop">Stop</option>
                  <option value="Running">Running</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Alarm">Alarm</option>
                </select>
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
