"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const supabase = createClient();
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    if (isSignUp) {
      // 1. สมัครสมาชิกผ่าน Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp(
        {
          email,
          password,
          options: {
            data: {
              full_name: fullName,
            },
          },
        },
      );

      if (signUpError) {
        setErrorMsg(signUpError.message);
        setLoading(false);
        return;
      }

      // 2. กำหนด Role เริ่มต้นเป็น 'pending' เพื่อรอ Admin อนุมัติสิทธิ์
      if (authData.user) {
        const { error: profileError } = await supabase.from("profiles").upsert(
          {
            id: authData.user.id,
            email: email,
            full_name: fullName,
            role: "pending",
          },
          { onConflict: "id", ignoreDuplicates: true },
        );

        if (profileError) {
          console.error("Profile creation notice:", profileError.message);
        }
      }

      // 3. เมื่อสมัครสำเร็จ ส่งไปยังหน้า /pending ทันที
      router.push("/pending");
      router.refresh();
    } else {
      // 1. เข้าสู่ระบบด้วย Supabase Auth
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      // 2. ตรวจสอบ Role ของผู้ใช้จากตาราง profiles
      if (authData.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", authData.user.id)
          .single();

        // 3. หากเป็น 'pending' ให้ส่งไปยังหน้า /pending
        if (!profile || profile.role === "pending") {
          router.push("/pending");
          router.refresh();
          return;
        }
      }

      // 4. หากผ่านการอนุมัติสิทธิ์แล้ว ให้เข้าสู่ระบบไปยัง Dashboard
      router.push("/dashboard");
      router.refresh();
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4 text-zinc-900 dark:text-zinc-100">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md bg-white dark:bg-zinc-900 p-8 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        {/* Header Branding */}
        <div className="text-center mb-6">
          {/* next/image ไม่รองรับไฟล์ .ico จึงต้องใช้ img ตรง ๆ */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/favicon.ico"
            alt="SCADA System"
            className="mx-auto mb-3 h-12 w-12 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 object-contain p-1"
          />
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-wider">
            SCADA System
          </h1>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 font-mono mt-1">
            Water Circulation Control
          </p>
        </div>

        <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200 mb-4 text-center">
          {isSignUp ? "สมัครสมาชิกผู้ใช้งาน" : "เข้าสู่ระบบ (System Login)"}
        </h2>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4 text-xs font-mono leading-relaxed">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                ชื่อ-นามสกุล
              </label>
              <input
                type="text"
                required
                placeholder="สมชาย ใจดี"
                className="w-full p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:border-zinc-900"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="block text-xs text-zinc-600 dark:text-zinc-400 mb-1">อีเมล</label>
            <input
              type="email"
              required
              placeholder="user@example.com"
              className="w-full p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:border-zinc-900 font-mono"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-600 dark:text-zinc-400 mb-1">
              รหัสผ่าน
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              className="w-full p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 text-sm focus:outline-none focus:border-zinc-900"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-zinc-900 hover:bg-zinc-700 text-white dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white font-bold py-2.5 rounded-lg transition duration-200 mt-2 text-sm disabled:opacity-50"
          >
            {loading
              ? "กำลังประมวลผล..."
              : isSignUp
                ? "ยืนยันการสมัคร"
                : "เข้าสู่ระบบ"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-zinc-600 dark:text-zinc-400">
          {isSignUp ? "มีบัญชีผู้ใช้แล้ว?" : "ยังไม่มีบัญชีผู้ใช้?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg("");
            }}
            className="text-zinc-900 dark:text-zinc-100 underline hover:text-zinc-600 dark:hover:text-zinc-400 font-medium ml-1"
          >
            {isSignUp ? "เข้าสู่ระบบ" : "สมัครสมาชิกใหม่"}
          </button>
        </div>
      </div>
    </div>
  );
}
