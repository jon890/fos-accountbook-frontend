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
          formatter={(value) => [`₩${formatAmount(Number(value))}`, ""]}
          contentStyle={{
            fontSize: 12,
            borderRadius: 8,
            border: "1px solid #f3f4f6",
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
