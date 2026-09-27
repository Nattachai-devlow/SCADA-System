"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-white">
      <div className="w-full max-w-md bg-slate-900 p-8 rounded-xl border border-slate-800 shadow-2xl">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <h1 className="text-xl font-bold text-amber-400 tracking-wider">
            SCADA System
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Water Circulation Control
          </p>
        </div>

        <h2 className="text-lg font-semibold text-slate-200 mb-4 text-center">
          {isSignUp ? "สมัครสมาชิกผู้ใช้งาน" : "เข้าสู่ระบบ (System Login)"}
        </h2>

        {errorMsg && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg mb-4 text-xs font-mono leading-relaxed">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div>
              <label className="block text-xs text-slate-400 mb-1">
                ชื่อ-นามสกุล
              </label>
              <input
                type="text"
                required
                placeholder="สมชาย ใจดี"
                className="w-full p-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
          )}

          <div>
            <label className="block text-xs text-slate-400 mb-1">อีเมล</label>
            <input
              type="email"
              required
              placeholder="user@example.com"
              className="w-full p-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500 font-mono"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1">
              รหัสผ่าน
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              className="w-full p-2.5 rounded-lg bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:border-amber-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-lg transition duration-200 mt-2 text-sm disabled:opacity-50"
          >
            {loading
              ? "กำลังประมวลผล..."
              : isSignUp
                ? "ยืนยันการสมัคร"
                : "เข้าสู่ระบบ"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-400">
          {isSignUp ? "มีบัญชีผู้ใช้แล้ว?" : "ยังไม่มีบัญชีผู้ใช้?"}{" "}
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg("");
            }}
            className="text-amber-400 underline hover:text-amber-300 font-medium ml-1"
          >
            {isSignUp ? "เข้าสู่ระบบ" : "สมัครสมาชิกใหม่"}
          </button>
        </div>
      </div>
    </div>
  );
}
