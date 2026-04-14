"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useRouter } from "next/navigation";

interface GenreChartProps {
  data: { genre: string; count: number }[];
  loading?: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-strong px-3 py-2 text-xs border border-border shadow-xl">
        <p className="text-muted-foreground mb-0.5">{label}</p>
        <p className="text-foreground font-semibold">{payload[0].value} movies</p>
      </div>
    );
  }
  return null;
};

export function GenreChart({ data, loading }: GenreChartProps) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex items-end gap-2 h-48 px-4 pt-4">
        {[60, 90, 45, 75, 55, 80, 40, 65].map((h, i) => (
          <div key={i} className="shimmer flex-1 rounded-t" style={{ height: `${h}%` }} />
        ))}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart 
        data={data} 
        margin={{ top: 4, right: 4, left: -20, bottom: 40 }}
        onClick={(state) => {
          if (state && state.activeLabel) {
            router.push(`/movies?genre=${encodeURIComponent(state.activeLabel)}`);
          }
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
        <XAxis
          dataKey="genre"
          interval={0}
          tick={{ 
            fill: "var(--chart-axis)", 
            fontSize: 9, 
            fontFamily: "var(--font-geist-sans)",
            angle: -35,
            textAnchor: "end"
          }}
          axisLine={false}
          tickLine={false}
          height={60}
        />
        <YAxis
          tick={{ fill: "var(--chart-axis)", fontSize: 10, fontFamily: "var(--font-geist-mono)" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--sidebar-hover)" }} />
        <Bar dataKey="count" radius={[3, 3, 0, 0]} className="cursor-pointer" fill="var(--chart-primary)">
          {data.map((_, index) => (
            <Cell key={index} fillOpacity={Math.max(0.2, 0.8 - (index * 0.06))} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
