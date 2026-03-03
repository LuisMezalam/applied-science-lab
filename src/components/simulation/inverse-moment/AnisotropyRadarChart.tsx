import { useMemo } from 'react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartConfig } from '@/components/ui/chart';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend } from 'recharts';
import { ComparisonData } from './types';

const radarChartConfig: ChartConfig = {
  box: { label: 'Box', color: 'hsl(var(--primary))' },
  sphere: { label: 'Sphere', color: 'hsl(var(--accent))' },
  cylinder: { label: 'Cylinder', color: 'hsl(var(--warning))' },
};

const SHAPE_COLORS = {
  box: 'hsl(var(--primary))',
  sphere: 'hsl(var(--accent))',
  cylinder: 'hsl(var(--warning))',
};

export function AnisotropyRadarChart({ comparisonData }: { comparisonData: ComparisonData[] }) {
  const radarData = useMemo(() => {
    return ['X', 'Y', 'Z'].map(dir => {
      const point: Record<string, string | number> = { direction: dir };
      comparisonData.forEach(data => {
        if (data.negMoments) {
          point[data.shape] = dir === 'X'
            ? data.negMoments.effectiveRadiusX
            : dir === 'Y'
              ? data.negMoments.effectiveRadiusY
              : data.negMoments.effectiveRadiusZ;
        }
      });
      return point;
    });
  }, [comparisonData]);

  const maxValue = useMemo(() => {
    let max = 0;
    comparisonData.forEach(data => {
      if (data.negMoments) {
        max = Math.max(max, data.negMoments.effectiveRadiusX, data.negMoments.effectiveRadiusY, data.negMoments.effectiveRadiusZ);
      }
    });
    return max * 1.1;
  }, [comparisonData]);

  return (
    <div className="mt-6 pt-4 border-t border-border/30">
      <h4 className="text-sm font-medium text-foreground/80 mb-3 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-math" />
        Directional Anisotropy (r_eff by axis)
      </h4>
      <div className="flex flex-col lg:flex-row gap-4 items-center">
        <ChartContainer config={radarChartConfig} className="h-[280px] w-full max-w-[400px]">
          <RadarChart data={radarData} margin={{ top: 20, right: 30, bottom: 20, left: 30 }}>
            <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.5} />
            <PolarAngleAxis dataKey="direction" tick={{ fontSize: 12, fill: 'hsl(var(--foreground))', fontWeight: 500 }} />
            <PolarRadiusAxis angle={90} domain={[0, maxValue]} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickCount={4} />
            <Radar name="Box" dataKey="box" stroke={SHAPE_COLORS.box} fill={SHAPE_COLORS.box} fillOpacity={0.3} strokeWidth={2} />
            <Radar name="Sphere" dataKey="sphere" stroke={SHAPE_COLORS.sphere} fill={SHAPE_COLORS.sphere} fillOpacity={0.3} strokeWidth={2} />
            <Radar name="Cylinder" dataKey="cylinder" stroke={SHAPE_COLORS.cylinder} fill={SHAPE_COLORS.cylinder} fillOpacity={0.3} strokeWidth={2} />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 12 }} />
            <ChartTooltip content={<ChartTooltipContent />} />
          </RadarChart>
        </ChartContainer>

        <div className="flex-1 space-y-3 text-xs">
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: SHAPE_COLORS.box }} />
              <span className="font-medium text-primary">Box</span>
            </div>
            <p className="text-muted-foreground">Anisotropic shape with distinct X, Y, Z dimensions creates directional variation in effective radii.</p>
          </div>
          <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: SHAPE_COLORS.sphere }} />
              <span className="font-medium text-accent">Sphere</span>
            </div>
            <p className="text-muted-foreground">Isotropic shape shows near-equal r_eff in all directions (triangle appears equilateral).</p>
          </div>
          <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: SHAPE_COLORS.cylinder }} />
              <span className="font-medium text-warning">Cylinder</span>
            </div>
            <p className="text-muted-foreground">Axisymmetric shape: X and Y similar (radial), Z different (axial height).</p>
          </div>
        </div>
      </div>
    </div>
  );
}
