"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "@/components/Toast";

type UserProfile = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: string;
  created_at: string;
};

export default function UserManagementPage() {
  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentRole, setCurrentRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // States สำหรับ Modal เพิ่ม/แก้ไข
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<UserProfile | null>(
    null,
  );

  // Form States
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "pending",
  });
  const [actionLoading, setActionLoading] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  // ฟังก์ชันดึงข้อมูลใหม่สำหรับปุ่มต่างๆ
  const fetchProfilesData = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    setCurrentUserId(user.id);

    const { data: myProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!myProfile || myProfile.role !== "admin") {
      router.push("/dashboard");
      return;
    }

    setCurrentRole(myProfile.role);

    const { data: allProfiles } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (allProfiles) {
      setProfiles(allProfiles);
    }
    setLoading(false);
  };

  // โหลดข้อมูลเมื่อเปิดหน้าเว็บครั้งแรก
  useEffect(() => {
    let isMounted = true;

    async function initData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: myProfile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!myProfile || myProfile.role !== "admin") {
        router.push("/dashboard");
        return;
      }

      const { data: allProfiles } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (isMounted) {
        setCurrentUserId(user.id);
        setCurrentRole(myProfile.role);
        if (allProfiles) {
          setProfiles(allProfiles);
        }
        setLoading(false);
      }
    }

    initData();

    return () => {
      isMounted = false;
    };
  }, [router, supabase]);

  // --- 1. ฟังก์ชันอนุมัติสิทธิ์รวดเร็ว (Activate Pending User) ---
  const handleApproveUser = async (
    profile: UserProfile,
    targetRole: string,
  ) => {
    setActionLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ role: targetRole })
      .eq("id", profile.id);

    if (error) {
      toast.error("เกิดข้อผิดพลาดในการอนุมัติสิทธิ์: " + error.message);
    } else {
      toast.success(
        `อนุมัติสิทธิ์ให้ "${profile.full_name || profile.email}" เป็น ${targetRole} เรียบร้อยแล้ว`,
      );
      await fetchProfilesData();
    }
    setActionLoading(false);
  };

  // --- 2. ฟังก์ชันเพิ่มผู้ใช้งานใหม่ (Add User) ---
  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        data: {
          full_name: formData.full_name,
        },
      },
    });

    if (signUpError) {
      toast.error("เกิดข้อผิดพลาดในการสร้างบัญชี: " + signUpError.message);
      setActionLoading(false);
      return;
    }

    if (authData.user) {
      const { error: profileError } = await supabase.from("profiles").upsert({
        id: authData.user.id,
        email: formData.email,
        full_name: formData.full_name,
        role: formData.role,
      });

      if (profileError) {
        toast.error("เกิดข้อผิดพลาดในการบันทึกโปรไฟล์: " + profileError.message);
      } else {
        toast.success("เพิ่มผู้ใช้งานเรียบร้อยแล้ว");
        setIsAddModalOpen(false);
        setFormData({
          email: "",
          password: "",
          full_name: "",
          role: "pending",
        });
        await fetchProfilesData();
      }
    }
    setActionLoading(false);
  };

  // --- 3. ฟังก์ชันแก้ไขผู้ใช้งาน (Edit Profile) ---
  const handleOpenEditModal = (profile: UserProfile) => {
    setEditingProfile(profile);
    setFormData({
      email: profile.email || "",
      password: "",
      full_name: profile.full_name || "",
      role: profile.role,
    });
    setIsEditModalOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProfile) return;
    setActionLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: formData.full_name,
        role: formData.role,
      })
      .eq("id", editingProfile.id);

    if (error) {
      toast.error("เกิดข้อผิดพลาดในการอัปเดต: " + error.message);
    } else {
      toast.success("อัปเดตข้อมูลผู้ใช้งานเรียบร้อยแล้ว");
      setIsEditModalOpen(false);
      setEditingProfile(null);
      await fetchProfilesData();
    }
    setActionLoading(false);
  };

  // --- 4. ฟังก์ชันลบผู้ใช้งาน (Delete User) ---
  const handleDeleteUser = async (profile: UserProfile) => {
    if (profile.id === currentUserId) {
      toast.error("คุณไม่สามารถลบบัญชีของตนเองขณะใช้งานอยู่ได้");
      return;
    }

    if (
      !confirm(
        `คุณแน่ใจหรือไม่ว่าต้องการลบผู้ใช้งาน "${
          profile.full_name || profile.email
        }"?`,
      )
    ) {
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", profile.id);

    if (error) {
      toast.error("เกิดข้อผิดพลาดในการลบผู้ใช้งาน: " + error.message);
    } else {
      toast.success("ลบผู้ใช้งานเรียบร้อยแล้ว");
      setProfiles((prev) => prev.filter((p) => p.id !== profile.id));
    }
  };

  const renderRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            👑 Admin
          </span>
        );
      case "technician":
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-cyan-50 text-cyan-700 border border-cyan-200">
            🔧 Technician
          </span>
        );
      case "pending":
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
            ⏳ รออนุมัติ (Pending)
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-zinc-600 font-mono text-sm">
        กำลังตรวจสอบสิทธิ์และโหลดข้อมูลผู้ใช้งาน...
      </div>
    );
  }

  if (currentRole !== "admin") {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">
            👑 จัดการสิทธิ์ผู้ใช้งาน (User Roles)
          </h1>
          <p className="text-zinc-600 text-xs mt-1">
            ส่วนเฉพาะผู้ดูแลระบบ (Admin Only) สำหรับจัดการ เพิ่ม แก้ไข
            อนุมัติสิทธิ์ และลบบัญชีผู้ใช้
          </p>
        </div>

        <button
          onClick={() => {
            setFormData({
              email: "",
              password: "",
              full_name: "",
              role: "pending",
            });
            setIsAddModalOpen(true);
          }}
          className="inline-flex items-center gap-2 bg-zinc-900 hover:bg-zinc-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition shadow-sm"
        >
          <span>➕</span>
          <span>เพิ่มผู้ใช้งานใหม่</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 text-zinc-600 text-xs font-semibold uppercase tracking-wider">
                <th className="p-3">ชื่อ - นามสกุล</th>
                <th className="p-3">อีเมล</th>
                <th className="p-3">สิทธิ์ปัจจุบัน</th>
                <th className="p-3 text-center">จัดการ / อนุมัติสิทธิ์</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 text-xs">
              {profiles.map((profile) => (
                <tr
                  key={profile.id}
                  className="hover:bg-zinc-100/50 transition"
                >
                  <td className="p-3 font-medium text-zinc-800">
                    {profile.full_name || "ไม่ระบุชื่อ"}
                  </td>
                  <td className="p-3 font-mono text-zinc-600">
                    {profile.email || "-"}
                  </td>
                  <td className="p-3">{renderRoleBadge(profile.role)}</td>
                  <td className="p-3 text-center space-x-2">
                    {profile.role === "pending" && (
                      <button
                        onClick={() => handleApproveUser(profile, "technician")}
                        disabled={actionLoading}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 transition font-medium"
                      >
                        ✅ อนุมัติสิทธิ์ (Technician)
                      </button>
                    )}

                    <button
                      onClick={() => handleOpenEditModal(profile)}
                      className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border border-zinc-300 transition"
                    >
                      ✏️ แก้ไข
                    </button>

                    <button
                      onClick={() => handleDeleteUser(profile)}
                      disabled={profile.id === currentUserId}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      🗑️ ลบ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: เพิ่มผู้ใช้งานใหม่ */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-zinc-50/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-zinc-200 rounded-xl p-6 w-full max-w-md shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-zinc-900">
              ➕ เพิ่มผู้ใช้งานใหม่
            </h2>
            <form onSubmit={handleAddUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-600 mb-1">
                  ชื่อ - นามสกุล
                </label>
                <input
                  type="text"
                  required
                  placeholder="สมชาย ใจดี"
                  className="w-full p-2.5 rounded-lg bg-white border border-zinc-300 text-zinc-900 focus:outline-none focus:border-zinc-900"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-zinc-600 mb-1">อีเมล</label>
                <input
                  type="email"
                  required
                  placeholder="user@example.com"
                  className="w-full p-2.5 rounded-lg bg-white border border-zinc-300 text-zinc-900 focus:outline-none focus:border-zinc-900 font-mono"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-zinc-600 mb-1">รหัสผ่าน</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="w-full p-2.5 rounded-lg bg-white border border-zinc-300 text-zinc-900 focus:outline-none focus:border-zinc-900"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-zinc-600 mb-1">
                  สิทธิ์การใช้งาน (Role)
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full p-2.5 rounded-lg bg-white border border-zinc-300 text-zinc-900 focus:outline-none focus:border-zinc-900"
                >
                  <option value="pending">⏳ รอการอนุมัติ (Pending)</option>
                  <option value="technician">
                    🔧 Technician (ช่างผู้เชี่ยวชาญ)
                  </option>
                  <option value="admin">👑 Admin (ผู้ดูแลระบบ)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-700 text-white font-bold disabled:opacity-50"
                >
                  {actionLoading ? "กำลังบันทึก..." : "ยืนยันเพิ่มผู้ใช้"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: แก้ไขผู้ใช้งาน */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-zinc-50/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-zinc-200 rounded-xl p-6 w-full max-w-md shadow-sm space-y-4">
            <h2 className="text-lg font-bold text-zinc-900">
              ✏️ แก้ไขข้อมูลผู้ใช้งาน
            </h2>
            <form onSubmit={handleUpdateUser} className="space-y-3 text-xs">
              <div>
                <label className="block text-zinc-600 mb-1">
                  อีเมล (ไม่สามารถเปลี่ยนได้)
                </label>
                <input
                  type="email"
                  disabled
                  className="w-full p-2.5 rounded-lg bg-zinc-50 border border-zinc-200 text-zinc-500 font-mono cursor-not-allowed"
                  value={formData.email}
                />
              </div>

              <div>
                <label className="block text-zinc-600 mb-1">
                  ชื่อ - นามสกุล
                </label>
                <input
                  type="text"
                  required
                  className="w-full p-2.5 rounded-lg bg-white border border-zinc-300 text-zinc-900 focus:outline-none focus:border-zinc-900"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-zinc-600 mb-1">
                  สิทธิ์การใช้งาน (Role)
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full p-2.5 rounded-lg bg-white border border-zinc-300 text-zinc-900 focus:outline-none focus:border-zinc-900"
                >
                  <option value="pending">⏳ รอการอนุมัติ (Pending)</option>
                  <option value="technician">
                    🔧 Technician (ช่างผู้เชี่ยวชาญ)
                  </option>
                  <option value="admin">👑 Admin (ผู้ดูแลระบบ)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-700 text-white font-bold disabled:opacity-50"
                >
                  {actionLoading ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
