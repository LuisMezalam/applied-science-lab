import { useMemo } from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { ComparisonData } from './types';

const chartConfig: ChartConfig = {
  rEff: { label: 'r_eff', color: 'hsl(var(--accent))' },
  rEffX: { label: 'r_eff,x', color: 'hsl(var(--primary))' },
  rEffY: { label: 'r_eff,y', color: 'hsl(var(--warning))' },
  rEffZ: { label: 'r_eff,z', color: 'hsl(var(--math))' },
};

const COLORS = {
  rEff: 'hsl(var(--accent))',
  rEffX: 'hsl(var(--primary))',
  rEffY: 'hsl(var(--warning))',
  rEffZ: 'hsl(var(--math))',
};

export function EffectiveRadiiChart({ comparisonData }: { comparisonData: ComparisonData[] }) {
  const chartData = useMemo(() => {
    return comparisonData.map(data => ({
      name: data.label,
      rEff: data.negMoments?.effectiveRadius ?? 0,
      rEffX: data.negMoments?.effectiveRadiusX ?? 0,
      rEffY: data.negMoments?.effectiveRadiusY ?? 0,
      rEffZ: data.negMoments?.effectiveRadiusZ ?? 0,
    }));
  }, [comparisonData]);

  return (
    <div className="mt-6 pt-4 border-t border-border/30">
      <h4 className="text-sm font-medium text-foreground/80 mb-3 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-accent" />
        Effective Radii Comparison
      </h4>
      <ChartContainer config={chartConfig} className="h-[220px] w-full">
        <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/30" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={{ className: 'stroke-border/50' }} />
          <YAxis
            tick={{ fontSize: 10 }} tickLine={false} axisLine={{ className: 'stroke-border/50' }}
            label={{ value: 'r_eff (m)', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' } }}
          />
          <ChartTooltip content={<ChartTooltipContent />} cursor={{ fill: 'hsl(var(--muted)/0.3)' }} />
          <Legend
            wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
            formatter={(value) => {
              const labels: Record<string, string> = { rEff: 'r_eff (scalar)', rEffX: 'r_eff,x', rEffY: 'r_eff,y', rEffZ: 'r_eff,z' };
              return labels[value] || value;
            }}
          />
          <Bar dataKey="rEff" fill={COLORS.rEff} radius={[4, 4, 0, 0]} name="rEff" />
          <Bar dataKey="rEffX" fill={COLORS.rEffX} radius={[4, 4, 0, 0]} name="rEffX" />
          <Bar dataKey="rEffY" fill={COLORS.rEffY} radius={[4, 4, 0, 0]} name="rEffY" />
          <Bar dataKey="rEffZ" fill={COLORS.rEffZ} radius={[4, 4, 0, 0]} name="rEffZ" />
        </BarChart>
      </ChartContainer>
    </div>
  );
}
