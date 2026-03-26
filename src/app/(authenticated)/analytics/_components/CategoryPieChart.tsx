"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

export interface CategoryPieChartData {
  uuid: string;
  name: string;
  color: string;
  total: number;
}

function formatAmount(amount: number) {
  return amount.toLocaleString("ko-KR");
}

interface CategoryPieChartProps {
  data: CategoryPieChartData[];
}

export function CategoryPieChart({ data }: CategoryPieChartProps) {
  return (
    <ResponsiveContainer width={160} height={160}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={45}
          outerRadius={70}
          dataKey="total"
          nameKey="name"
          paddingAngle={2}
        >
          {data.map((cat) => (
            <Cell key={cat.uuid} fill={cat.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number | string | ReadonlyArray<number | string> | undefined) => {
            const num = Array.isArray(value) ? Number(value[0] ?? 0) : Number(value ?? 0);
            return [`₩${formatAmount(num)}`, ""];
          }}
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: "1px solid var(--border)",
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
