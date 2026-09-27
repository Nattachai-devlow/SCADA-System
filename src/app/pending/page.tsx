"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function PendingPage() {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  // ฟังก์ชันสำหรับกดปุ่มเช็คสถานะเอง (Manual Refresh)
  const handleCheckStatus = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.push("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .single();

    if (profile) {
      setUserName(profile.full_name || user.email || null);
      if (profile.role !== "pending") {
        router.push("/dashboard");
        return;
      }
    }
    setLoading(false);
  };

  // ตรวจสอบสถานะเมื่อโหลดหน้าครั้งแรก
  useEffect(() => {
    let isMounted = true;

    async function initCheck() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, full_name")
        .eq("id", user.id)
        .single();

      if (isMounted) {
        if (profile) {
          setUserName(profile.full_name || user.email || null);
          if (profile.role !== "pending") {
            router.push("/dashboard");
            return;
          }
        }
        setLoading(false);
      }
    }

    initCheck();

    return () => {
      isMounted = false;
    };
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-slate-400 font-mono text-sm">
        กำลังตรวจสอบสถานะการอนุมัติ...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-white">
      <div className="w-full max-w-md bg-slate-900 p-8 rounded-xl border border-amber-500/30 shadow-2xl text-center space-y-6">
        {/* Icon & Animation */}
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center bg-amber-500/10 rounded-full border border-amber-500/30">
          <span className="text-4xl animate-pulse">⏳</span>
        </div>

        {/* Status Header */}
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-amber-400">
            อยู่ระหว่างรอผู้ดูแลระบบอนุมัติสิทธิ์
          </h1>
          <p className="text-xs text-slate-400">
            สวัสดีคุณ{" "}
            <span className="text-slate-200 font-semibold">{userName}</span>
          </p>
        </div>

        {/* Detailed Message */}
        <div className="bg-slate-950/60 p-4 rounded-lg border border-slate-800 text-left text-xs text-slate-300 leading-relaxed space-y-2">
          <p>
            บัญชีของคุณลงทะเบียนเรียบร้อยแล้ว แต่ต้องได้รับการอนุมัติสิทธิ์จาก{" "}
            <span className="text-amber-400 font-medium">Admin</span>{" "}
            ก่อนจึงจะสามารถเข้าใช้งานระบบ SCADA ได้
          </p>
          <p className="text-slate-400">
            โปรดติดต่อผู้ดูแลระบบของท่านเพื่อขอเปิดสิทธิ์การใช้งาน
            เมื่อได้รับการอนุมัติแล้วกดปุ่มตรวจสอบสถานะอีกครั้ง
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleCheckStatus}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-lg transition text-xs shadow-lg shadow-amber-950/20"
          >
            🔄 ตรวจสอบสถานะการอนุมัติอีกครั้ง
          </button>

          <button
            onClick={handleLogout}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-2 rounded-lg transition text-xs border border-slate-700"
          >
            ออกจากระบบ
          </button>
        </div>
      </div>
    </div>
  );
}
