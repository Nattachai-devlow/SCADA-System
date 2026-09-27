'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';

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
    <header className="h-16 border-b border-zinc-200 dark:border-zinc-800 bg-white/80 backdrop-blur-md pl-16 pr-4 sm:pr-6 lg:pl-6 flex items-center justify-between sticky top-0 z-40 dark:bg-zinc-950/80">
      {/* Title / Search */}
      <div className="flex items-center gap-3">
        <span className="hidden sm:inline text-zinc-800 text-sm font-semibold dark:text-zinc-100">SCADA System Control Panel</span>
        <span className="sm:hidden text-zinc-800 text-sm font-semibold dark:text-zinc-100">SCADA Control</span>
      </div>

      {/* User Info & Actions */}
      <div className="flex items-center gap-3">
        <ThemeToggle />

        {userEmail && (
          <div className="text-right hidden sm:block">
            <p className="text-xs text-zinc-600 dark:text-zinc-400">เข้าสู่ระบบโดย</p>
            <p className="text-xs font-mono font-medium text-zinc-900 dark:text-zinc-100">{userEmail}</p>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs rounded-lg transition border border-zinc-300 dark:border-zinc-700 dark:text-zinc-200"
        >
          ออกจากระบบ
        </button>
      </div>
    </header>
  );
}