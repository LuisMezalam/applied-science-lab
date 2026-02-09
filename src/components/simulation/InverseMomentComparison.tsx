import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Box, Cylinder, Info } from 'lucide-react';
import {
  Shape3D,
  Shape3DParams,
  generate3DField,
  calculate3DMoments,
  calculate3DNegativeOrderMoments,
  Moment3DNegativeOrder,
} from '@/lib/physics/moment3D';
import { formatValue } from '@/lib/physics/momentCalculus';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, ResponsiveContainer, Legend } from 'recharts';

interface ComparisonData {
  shape: Shape3D;
  label: string;
  icon: React.ReactNode;
  params: Shape3DParams;
  characteristicLength: number;
  negMoments: Moment3DNegativeOrder | null;
  centroid: { x: number; y: number; z: number };
  I0: number;
}

interface InverseMomentComparisonProps {
  loadingType: Shape3DParams['loadingType'];
  magnitude: number;
  epsilonPercent: number;
}

const shapeConfigs: { shape: Shape3D; label: string; icon: React.ReactNode; defaultParams: Partial<Shape3DParams> }[] = [
  { 
    shape: 'box', 
    label: 'Box', 
    icon: <Box className="h-4 w-4" />,
    defaultParams: { width: 2, height: 1.5, depth: 1 }
  },
  { 
    shape: 'sphere', 
    label: 'Sphere', 
    icon: <div className="h-4 w-4 rounded-full border-2 border-current" />,
    defaultParams: { radius: 1 }
  },
  { 
    shape: 'cylinder', 
    label: 'Cylinder', 
    icon: <Cylinder className="h-4 w-4" />,
    defaultParams: { radius: 1, height: 2 }
  },
];

function getCharacteristicLength(shape: Shape3D, params: Shape3DParams): number {
  switch (shape) {
    case 'box':
      return Math.max(params.width || 2, params.height || 1.5, params.depth || 1);
    case 'sphere':
      return (params.radius || 1) * 2;
    case 'cylinder':
      return Math.max((params.radius || 1) * 2, params.height || 2);
    default:
      return 2;
  }
}

export function InverseMomentComparison({ loadingType, magnitude, epsilonPercent }: InverseMomentComparisonProps) {
  const comparisonData = useMemo<ComparisonData[]>(() => {
    return shapeConfigs.map(config => {
      const params: Shape3DParams = {
        shape: config.shape,
        ...config.defaultParams,
        magnitude,
        loadingType,
      };
      
      const charLength = getCharacteristicLength(config.shape, params);
      const epsilon = (epsilonPercent / 100) * charLength;
      
      const points = generate3DField(params, 12);
      const moments = calculate3DMoments(points, config.shape, params);
      const centroid = { x: moments.centroidX, y: moments.centroidY, z: moments.centroidZ };
      const negMoments = calculate3DNegativeOrderMoments(points, config.shape, params, epsilon, centroid);
      
      return {
        shape: config.shape,
        label: config.label,
        icon: config.icon,
        params,
        characteristicLength: charLength,
        negMoments,
        centroid,
        I0: moments.I0,
      };
    });
  }, [loadingType, magnitude, epsilonPercent]);

  const loadingLabels: Record<string, string> = {
    'uniform': 'Uniform',
    'linear-z': 'Linear (Z)',
    'radial': 'Radial',
    'parabolic': 'Parabolic',
    'exponential': 'Exponential',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-border/50 bg-card/60 backdrop-blur">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-math" />
              Shape Comparison: 3D Inverse Moments
            </CardTitle>
            <Badge variant="outline" className="bg-math/10 text-math border-math/30">
              {loadingLabels[loadingType]} Loading
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            ε = {epsilonPercent}% of characteristic length for each shape
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border/30">
                  <TableHead className="w-28">Shape</TableHead>
                  <TableHead className="text-right">
                    <span className="flex items-center justify-end gap-1">
                      I₀
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-muted-foreground/60" />
                        </TooltipTrigger>
                        <TooltipContent>Total load (zeroth moment)</TooltipContent>
                      </Tooltip>
                    </span>
                  </TableHead>
                  <TableHead className="text-right">
                    <span className="flex items-center justify-end gap-1">
                      μ₋₂,ε
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-muted-foreground/60" />
                        </TooltipTrigger>
                        <TooltipContent>Scalar inverse moment</TooltipContent>
                      </Tooltip>
                    </span>
                  </TableHead>
                  <TableHead className="text-right">
                    <span className="flex items-center justify-end gap-1">
                      r_eff
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-muted-foreground/60" />
                        </TooltipTrigger>
                        <TooltipContent>Effective radius (m)</TooltipContent>
                      </Tooltip>
                    </span>
                  </TableHead>
                  <TableHead className="text-right">M_xx</TableHead>
                  <TableHead className="text-right">M_yy</TableHead>
                  <TableHead className="text-right">M_zz</TableHead>
                  <TableHead className="text-right">
                    <span className="flex items-center justify-end gap-1">
                      r_eff,x
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="h-3 w-3 text-muted-foreground/60" />
                        </TooltipTrigger>
                        <TooltipContent>Directional effective radius X</TooltipContent>
                      </Tooltip>
                    </span>
                  </TableHead>
                  <TableHead className="text-right">r_eff,y</TableHead>
                  <TableHead className="text-right">r_eff,z</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparisonData.map((data, idx) => (
                  <TableRow 
                    key={data.shape}
                    className={idx % 2 === 0 ? 'bg-muted/20' : ''}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {data.icon}
                        {data.label}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {formatValue(data.I0)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-warning">
                      {data.negMoments ? formatValue(data.negMoments.scalarInverseMoment) : '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-accent-foreground">
                      {data.negMoments ? formatValue(data.negMoments.effectiveRadius) : '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                      {data.negMoments ? formatValue(data.negMoments.inverseTensorXX) : '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                      {data.negMoments ? formatValue(data.negMoments.inverseTensorYY) : '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs text-muted-foreground">
                      {data.negMoments ? formatValue(data.negMoments.inverseTensorZZ) : '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {data.negMoments ? formatValue(data.negMoments.effectiveRadiusX) : '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {data.negMoments ? formatValue(data.negMoments.effectiveRadiusY) : '—'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs">
                      {data.negMoments ? formatValue(data.negMoments.effectiveRadiusZ) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Effective Radii Bar Chart */}
          <EffectiveRadiiChart comparisonData={comparisonData} />
          
          {/* Principal Moments Comparison */}
          <div className="mt-6 pt-4 border-t border-border/30">
            <h4 className="text-sm font-medium text-foreground/80 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              Principal Inverse Moments
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {comparisonData.map(data => (
                <div 
                  key={data.shape}
                  className="rounded-lg border border-border/50 bg-card/50 p-3"
                >
                  <div className="flex items-center gap-2 mb-2">
                    {data.icon}
                    <span className="text-sm font-medium">{data.label}</span>
                  </div>
                  {data.negMoments && (
                    <div className="space-y-1 font-mono text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">λ₁:</span>
                        <span className="text-primary">{formatValue(data.negMoments.inversePrincipal1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">λ₂:</span>
                        <span>{formatValue(data.negMoments.inversePrincipal2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">λ₃:</span>
                        <span>{formatValue(data.negMoments.inversePrincipal3)}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {/* Interpretation */}
          <div className="mt-4 p-3 rounded-lg bg-muted/30 text-xs text-muted-foreground">
            <p>
              <strong>Interpretation:</strong> Higher μ₋₂,ε indicates more concentrated loading. 
              Smaller r_eff means tighter spatial localization. Anisotropic shapes (box, cylinder) 
              show directional variation in M_xx, M_yy, M_zz, while the sphere shows near-isotropy 
              with uniform loading.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Separate chart component for effective radii visualization
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

function EffectiveRadiiChart({ comparisonData }: { comparisonData: ComparisonData[] }) {
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
          <XAxis 
            dataKey="name" 
            tick={{ fontSize: 11 }} 
            tickLine={false}
            axisLine={{ className: 'stroke-border/50' }}
          />
          <YAxis 
            tick={{ fontSize: 10 }} 
            tickLine={false}
            axisLine={{ className: 'stroke-border/50' }}
            label={{ 
              value: 'r_eff (m)', 
              angle: -90, 
              position: 'insideLeft',
              style: { fontSize: 10, fill: 'hsl(var(--muted-foreground))' }
            }}
          />
          <ChartTooltip 
            content={<ChartTooltipContent />} 
            cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
          />
          <Legend 
            wrapperStyle={{ fontSize: 10, paddingTop: 8 }}
            formatter={(value) => {
              const labels: Record<string, string> = {
                rEff: 'r_eff (scalar)',
                rEffX: 'r_eff,x',
                rEffY: 'r_eff,y',
                rEffZ: 'r_eff,z',
              };
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
