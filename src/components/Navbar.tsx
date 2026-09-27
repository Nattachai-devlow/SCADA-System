'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email ?? null);
      }
    }
    getUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return (
    <header className="h-16 border-b border-zinc-200 bg-white/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Title / Search */}
      <div className="flex items-center gap-3">
        <span className="text-zinc-800 text-sm font-semibold">SCADA System Control Panel</span>
      </div>

      {/* User Info & Actions */}
      <div className="flex items-center gap-4">
        {userEmail && (
          <div className="text-right hidden sm:block">
            <p className="text-xs text-zinc-600">เข้าสู่ระบบโดย</p>
            <p className="text-xs font-mono font-medium text-zinc-900">{userEmail}</p>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 text-xs rounded-lg transition border border-zinc-300"
        >
          ออกจากระบบ
        </button>
      </div>
    </header>
  );
}