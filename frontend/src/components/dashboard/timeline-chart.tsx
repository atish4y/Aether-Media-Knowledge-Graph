"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { useRouter } from "next/navigation";

interface TimelineChartProps {
  data: { year: number; count: number }[];
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

export function TimelineChart({ data, loading }: TimelineChartProps) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="shimmer h-48 rounded-lg" />
    );
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart 
        data={data} 
        margin={{ top: 4, right: 4, left: -20, bottom: 0 }}
        onClick={(state) => {
          if (state && state.activeLabel) {
            router.push(`/movies?year=${state.activeLabel}`);
          }
        }}
        className="cursor-pointer"
      >
        <defs>
          <linearGradient id="colorMovies" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-primary)" stopOpacity={0.3} />
            <stop offset="95%" stopColor="var(--chart-primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
        <XAxis
          dataKey="year"
          tick={{ fill: "var(--chart-axis)", fontSize: 10, fontFamily: "var(--font-geist-mono)" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "var(--chart-axis)", fontSize: 10, fontFamily: "var(--font-geist-mono)" }}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="count"
          stroke="var(--chart-primary)"
          strokeWidth={2}
          fill="url(#colorMovies)"
          dot={{ fill: "var(--chart-primary)", r: 3 }}
          activeDot={{ r: 5, fill: "var(--chart-primary)" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
