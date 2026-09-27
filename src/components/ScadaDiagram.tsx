"use client";

type Machine = {
  id: string;
  machine_id: string;
  machine_name: string;
  machine_type: string;
  location: string;
  status: string;
};

type Props = {
  machines: Machine[];
  onToggleStatus?: (machine: Machine) => void;
  updatingId?: string | null;
};

export default function ScadaDiagram({
  machines,
  onToggleStatus,
  updatingId,
}: Props) {
  // ฟังก์ชันคืนค่า Style และ Badge ตามสถานะ
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Normal":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      case "Running":
        return "bg-blue-500/10 text-blue-400 border-blue-500/30 animate-pulse";
      case "Stop":
        return "bg-slate-500/10 text-slate-400 border-slate-500/30";
      case "Maintenance":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "Alarm":
        return "bg-red-500/10 text-red-400 border-red-500/30 animate-ping";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/30";
    }
  };

  const getStatusDot = (status: string) => {
    switch (status) {
      case "Normal":
        return "bg-emerald-500 shadow-emerald-500/50";
      case "Running":
        return "bg-blue-500 shadow-blue-500/50 animate-ping";
      case "Stop":
        return "bg-slate-500";
      case "Maintenance":
        return "bg-amber-500 shadow-amber-500/50";
      case "Alarm":
        return "bg-red-500 shadow-red-500/50 animate-bounce";
      default:
        return "bg-slate-500";
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            🖥️ P&ID SCADA Diagram (Water Circulation)
          </h2>
          <p className="text-slate-400 text-xs">
            คลิกที่การ์ดอุปกรณ์เพื่อจำลองการเปลี่ยนสถานะการทำงาน
          </p>
        </div>

        {/* Legend แสดงความหมายของสถานะ */}
        <div className="flex flex-wrap gap-2 text-[11px]">
          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            🟢 Normal
          </span>
          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
            🔵 Running
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-500/10 text-slate-400 border border-slate-500/20">
            ⚪ Stop
          </span>
          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            🟠 Maintenance
          </span>
          <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 border border-red-500/20">
            🔴 Alarm
          </span>
        </div>
      </div>

      {/* Interactive Process Flow Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {machines.map((m) => {
          const isUpdating = updatingId === m.id;
          return (
            <div
              key={m.id}
              onClick={() => onToggleStatus && onToggleStatus(m)}
              className={`relative bg-slate-950 border rounded-xl p-5 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-2xl ${
                m.status === "Alarm"
                  ? "border-red-500/50 shadow-red-950/40"
                  : m.status === "Normal"
                    ? "border-emerald-500/30"
                    : "border-slate-800 hover:border-slate-700"
              }`}
            >
              {/* Header Card */}
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-mono font-bold text-slate-400 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                  {m.machine_id}
                </span>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${getStatusBadge(m.status)}`}
                >
                  {isUpdating ? "Updating..." : m.status}
                </span>
              </div>

              {/* Body Card */}
              <div className="space-y-1">
                <h3 className="font-semibold text-slate-200 text-sm">
                  {m.machine_name}
                </h3>
                <p className="text-slate-400 text-xs">ชนิด: {m.machine_type}</p>
                <p className="text-slate-400 text-xs">ตำแหน่ง: {m.location}</p>
              </div>

              {/* Status Indicator Bar */}
              <div className="mt-4 pt-3 border-t border-slate-900 flex justify-between items-center text-[11px] text-slate-400">
                <span>Signal Status</span>
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 py-2 rounded-full shadow-md ${getStatusDot(m.status)}`}
                  />
                  <span className="font-mono text-slate-300">{m.status}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
