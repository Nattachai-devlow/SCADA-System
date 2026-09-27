// src/app/dashboard/layout.tsx
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900">
      {/* 1. Sidebar ด้านข้าง */}
      <Sidebar />

      {/* 2. พื้นที่ฝั่งขวา (Navbar + Content ของแต่ละหน้า) */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />

        {/* ส่วนที่จะเปลี่ยนไปตามแต่ละ Page เช่น /dashboard/scada */}
        <main className="p-6 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
