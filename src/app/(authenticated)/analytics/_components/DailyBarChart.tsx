"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export interface DailyBarChartData {
  day: number;
  지출: number;
  수입: number;
}

interface TooltipPayload {
  dataKey: string;
  color: string;
  name: string;
  value: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: number;
}

function formatAmount(amount: number) {
  return amount.toLocaleString("ko-KR");
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 px-3 py-2 text-xs">
      <p className="text-gray-500 mb-1">{label}일</p>
      {payload.map((entry) => (
        <p key={entry.dataKey} style={{ color: entry.color }} className="font-semibold">
          {entry.name}: ₩{formatAmount(entry.value)}
        </p>
      ))}
    </div>
  );
}

interface DailyBarChartProps {
  data: DailyBarChartData[];
}

export function DailyBarChart({ data }: DailyBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={data} barGap={1} barCategoryGap="20%">
        <XAxis
          dataKey="day"
          tick={{ fontSize: 10, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
          interval={4}
        />
        <YAxis hide />
        <Tooltip
          content={<CustomTooltip />}
          cursor={{ fill: "rgba(0,0,0,0.04)", radius: 4 }}
        />
        <Bar dataKey="지출" fill="var(--chart-expense)" radius={[3, 3, 0, 0]} maxBarSize={12} />
        <Bar dataKey="수입" fill="var(--chart-income)" radius={[3, 3, 0, 0]} maxBarSize={12} />
      </BarChart>
    </ResponsiveContainer>
  );
}
