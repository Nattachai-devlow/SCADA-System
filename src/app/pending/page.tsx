"use client";

import { useEffect, useState } from "react";
import { Hourglass, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

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
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4 text-zinc-600 dark:text-zinc-400 font-mono text-sm">
        กำลังตรวจสอบสถานะการอนุมัติ...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4 text-zinc-900 dark:text-zinc-100">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 p-8 rounded-xl border border-amber-200 shadow-sm text-center space-y-6">
        {/* Icon & Animation */}
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center bg-amber-50 rounded-full border border-amber-200">
          <Hourglass className="h-9 w-9 animate-pulse text-amber-600" strokeWidth={1.5} />
        </div>

        {/* Status Header */}
        <div className="space-y-2">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            อยู่ระหว่างรอผู้ดูแลระบบอนุมัติสิทธิ์
          </h1>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            สวัสดีคุณ{" "}
            <span className="text-zinc-800 dark:text-zinc-200 font-semibold">{userName}</span>
          </p>
        </div>

        {/* Detailed Message */}
        <div className="bg-zinc-50/60 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800 text-left text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed space-y-2">
          <p>
            บัญชีของคุณลงทะเบียนเรียบร้อยแล้ว แต่ต้องได้รับการอนุมัติสิทธิ์จาก{" "}
            <span className="text-zinc-900 dark:text-zinc-100 font-medium">Admin</span>{" "}
            ก่อนจึงจะสามารถเข้าใช้งานระบบ SCADA ได้
          </p>
          <p className="text-zinc-600 dark:text-zinc-400">
            โปรดติดต่อผู้ดูแลระบบของท่านเพื่อขอเปิดสิทธิ์การใช้งาน
            เมื่อได้รับการอนุมัติแล้วกดปุ่มตรวจสอบสถานะอีกครั้ง
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleCheckStatus}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
          >
            <RefreshCw className="h-3.5 w-3.5" strokeWidth={2} />
            ตรวจสอบสถานะการอนุมัติอีกครั้ง
          </button>

          <button
            onClick={handleLogout}
            className="w-full bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-medium py-2 rounded-lg transition text-xs border border-zinc-300 dark:border-zinc-700"
          >
            ออกจากระบบ
          </button>
        </div>
      </div>
    </div>
  );
}
