import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  ResponsiveContainer,
  Brush,
} from 'recharts';
import { IntensityField, MomentResults, DomainType, NegativeOrderMoments, JordanDecomposition } from '@/types/physics';

interface SimulationCanvasProps {
  field: IntensityField;
  moments: MomentResults;
  domain: DomainType;
  showCentroid?: boolean;
  showDispersion?: boolean;
  showEffectiveWidth?: boolean;
  negativeOrderMoments?: NegativeOrderMoments;
  animated?: boolean;
  jordan?: JordanDecomposition;
}

const DOMAIN_THEMES: Record<DomainType, {
  stroke: string;
  fill: string;
  glow: string;
  label: string;
  intensityName: string;
  positionUnit: string;
  intensityUnit: string;
}> = {
  structures: {
    stroke: 'hsl(210, 100%, 60%)',
    fill: 'hsl(210, 100%, 60%)',
    glow: 'hsl(210, 100%, 70%)',
    label: 'Structures',
    intensityName: 'Force Density',
    positionUnit: 'm',
    intensityUnit: 'N/m',
  },
  heat: {
    stroke: 'hsl(20, 95%, 55%)',
    fill: 'hsl(20, 95%, 55%)',
    glow: 'hsl(20, 100%, 65%)',
    label: 'Heat Transfer',
    intensityName: 'Heat Flux',
    positionUnit: 'm',
    intensityUnit: 'W/m^2',
  },
  fluids: {
    stroke: 'hsl(180, 70%, 50%)',
    fill: 'hsl(180, 70%, 50%)',
    glow: 'hsl(180, 80%, 60%)',
    label: 'Fluids',
    intensityName: 'Pressure',
    positionUnit: 'm',
    intensityUnit: 'Pa',
  },
  dynamics: {
    stroke: 'hsl(265, 80%, 60%)',
    fill: 'hsl(265, 80%, 60%)',
    glow: 'hsl(265, 90%, 70%)',
    label: 'Dynamics',
    intensityName: 'Force / Dissipation',
    positionUnit: 's',
    intensityUnit: 'N or J/s',
  },
  circuits: {
    stroke: 'hsl(45, 95%, 55%)',
    fill: 'hsl(45, 95%, 55%)',
    glow: 'hsl(45, 100%, 65%)',
    label: 'Circuits',
    intensityName: 'Power Dissipation',
    positionUnit: 'node',
    intensityUnit: 'W',
  },
  propulsion: {
    stroke: 'hsl(340, 80%, 58%)',
    fill: 'hsl(340, 80%, 58%)',
    glow: 'hsl(340, 90%, 70%)',
    label: 'Propulsion',
    intensityName: 'Thrust Density',
    positionUnit: 'm',
    intensityUnit: 'N/m^2',
  },
};

const CENTROID_COLOR = 'hsl(var(--accent))';
const SIGMA_COLOR = 'hsl(var(--math))';
const WEFF_COLOR = 'hsl(var(--fluids))';
const JORDAN_POS_COLOR = 'hsl(var(--success))';
const JORDAN_NEG_COLOR = 'hsl(var(--destructive))';

function CustomTooltip({
  active,
  payload,
  domain,
  moments,
  negMoments,
}: {
  active?: boolean;
  payload?: Array<{ payload: { x: number; I: number } }>;
  domain: DomainType;
  moments: MomentResults;
  negMoments?: NegativeOrderMoments;
}) {
  if (!active || !payload?.length) return null;

  const { x, I } = payload[0].payload;
  const theme = DOMAIN_THEMES[domain];
  const sigma = moments.standardDeviation;
  const insideSigma =
    moments.zerothMoment > 0 &&
    x >= moments.centroid - sigma &&
    x <= moments.centroid + sigma;
  const wEff = negMoments?.effectiveWidth2;
  const insideWeff =
    wEff != null &&
    wEff < Infinity &&
    moments.zerothMoment > 0 &&
    x >= moments.centroid - wEff / 2 &&
    x <= moments.centroid + wEff / 2;

  return (
    <div className="min-w-[180px] space-y-1.5 rounded-md border border-border bg-card/95 px-3 py-2.5 text-xs shadow-xl backdrop-blur">
      <div className="flex items-center gap-2 font-medium text-foreground">
        <span className="h-2 w-2 rounded-full" style={{ background: theme.stroke }} />
        {theme.label}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-muted-foreground">
        <span>Position</span>
        <span className="text-right font-mono text-foreground">
          {x.toFixed(3)} {theme.positionUnit}
        </span>
        <span>{theme.intensityName}</span>
        <span className="text-right font-mono text-foreground">
          {I.toFixed(4)} {theme.intensityUnit}
        </span>
      </div>
      {(insideSigma || insideWeff) && (
        <div className="space-y-0.5 border-t border-border pt-1.5">
          {insideSigma && (
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: SIGMA_COLOR }} />
              <span className="text-muted-foreground">Inside +/- sigma spread band</span>
            </div>
          )}
          {insideWeff && (
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: WEFF_COLOR }} />
              <span className="text-muted-foreground">
                Inside w<sub>eff</sub> localization band
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function SimulationCanvas({
  field,
  moments,
  domain,
  showCentroid = true,
  showDispersion = true,
  showEffectiveWidth = false,
  negativeOrderMoments,
  animated = true,
  jordan,
}: SimulationCanvasProps) {
  const theme = DOMAIN_THEMES[domain] ?? DOMAIN_THEMES.structures;
  const hasJordan = !!jordan;

  const data = useMemo(() => {
    return field.positions.map((pos, i) => ({
      x: parseFloat(pos.toFixed(4)),
      I: field.values[i],
      ...(hasJordan ? {
        Splus: jordan!.positivePart.values[i],
        Sminus: -jordan!.negativePart.values[i],
      } : {}),
    }));
  }, [field, jordan, hasJordan]);

  const minI = useMemo(() => Math.min(...field.values, 0), [field]);
  const sigma = moments.standardDeviation;
  const sigmaLeft = moments.centroid - sigma;
  const sigmaRight = moments.centroid + sigma;
  const wEff = negativeOrderMoments?.effectiveWidth2;
  const wEffLeft =
    wEff != null && wEff < Infinity ? moments.centroid - wEff / 2 : undefined;
  const wEffRight =
    wEff != null && wEff < Infinity ? moments.centroid + wEff / 2 : undefined;

  const gradId = `intensity-grad-${domain}`;
  const glowId = `intensity-glow-${domain}`;
  const gradPosId = `jordan-pos-${domain}`;
  const gradNegId = `jordan-neg-${domain}`;
  const signedDomain = hasJordan || minI < 0;
  const accessibleSummary = `${theme.label} one-dimensional ${theme.intensityName} chart. Resultant ${moments.zerothMoment.toFixed(4)}, centroid ${moments.centroid.toFixed(4)} ${theme.positionUnit}, spread ${moments.standardDeviation.toFixed(4)} ${theme.positionUnit}.`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      role="region"
      aria-label={`${theme.label} 1D intensity field chart`}
      className="relative flex h-full min-h-[430px] w-full flex-col overflow-hidden rounded-lg border border-border/45 bg-[radial-gradient(circle_at_20%_10%,hsl(var(--primary)/0.13),transparent_30%),linear-gradient(180deg,hsl(var(--card)/0.95),hsl(var(--background)/0.88))] p-3"
    >
      <p className="sr-only">{accessibleSummary}</p>
      <div className="mb-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <LayerKey color={theme.stroke} label={`I(x) - ${theme.intensityName}`} />
        {showCentroid && moments.zerothMoment > 0 && (
          <LayerKey color={CENTROID_COLOR} label="xbar centroid" dashed />
        )}
        {showDispersion && sigma > 0 && moments.zerothMoment > 0 && (
          <LayerKey color={SIGMA_COLOR} label="+/- sigma spread" filled />
        )}
        {showEffectiveWidth && wEffLeft != null && (
          <LayerKey color={WEFF_COLOR} label="w_eff localization" filled />
        )}
        {hasJordan && (
          <>
            <LayerKey color={JORDAN_POS_COLOR} label="S+ positive" filled />
            <LayerKey color={JORDAN_NEG_COLOR} label="S- negative" filled />
          </>
        )}
      </div>

      {moments.zerothMoment > 0 && (
        <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-4">
          <ChartStat label="I0" value={moments.zerothMoment.toFixed(4)} />
          <ChartStat label="xbar" value={moments.centroid.toFixed(4)} unit={theme.positionUnit} />
          <ChartStat label="sigma" value={moments.standardDeviation.toFixed(4)} unit={theme.positionUnit} />
          <ChartStat
            label="w_eff"
            value={wEff != null && wEff < Infinity ? wEff.toFixed(4) : 'off'}
            unit={wEff != null && wEff < Infinity ? theme.positionUnit : undefined}
          />
        </div>
      )}

      <div className="relative min-h-[290px] flex-1 overflow-hidden rounded-md border border-border/35 bg-background/55 shadow-inner">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(90deg,hsl(var(--border)/0.25)_1px,transparent_1px),linear-gradient(0deg,hsl(var(--border)/0.2)_1px,transparent_1px)] bg-[size:48px_48px]" />
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 24, right: 22, bottom: 36, left: 12 }}
          >
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={theme.fill} stopOpacity={0.45} />
                <stop offset="60%" stopColor={theme.fill} stopOpacity={0.16} />
                <stop offset="100%" stopColor={theme.fill} stopOpacity={0.03} />
              </linearGradient>
              <linearGradient id={gradPosId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={JORDAN_POS_COLOR} stopOpacity={0.45} />
                <stop offset="95%" stopColor={JORDAN_POS_COLOR} stopOpacity={0.03} />
              </linearGradient>
              <linearGradient id={gradNegId} x1="0" y1="1" x2="0" y2="0">
                <stop offset="5%" stopColor={JORDAN_NEG_COLOR} stopOpacity={0.45} />
                <stop offset="95%" stopColor={JORDAN_NEG_COLOR} stopOpacity={0.03} />
              </linearGradient>
              <filter id={glowId} x="-25%" y="-25%" width="150%" height="150%">
                <feGaussianBlur stdDeviation="2.2" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <CartesianGrid
              strokeDasharray="3 8"
              stroke="hsl(var(--border))"
              strokeOpacity={0.35}
              vertical
            />

            {showDispersion && sigma > 0 && moments.zerothMoment > 0 && (
              <ReferenceArea
                x1={Math.max(field.domain[0], sigmaLeft)}
                x2={Math.min(field.domain[1], sigmaRight)}
                fill={SIGMA_COLOR}
                fillOpacity={0.12}
                stroke={SIGMA_COLOR}
                strokeOpacity={0.38}
                strokeDasharray="4 4"
              />
            )}

            {showEffectiveWidth && wEffLeft != null && wEffRight != null && (
              <ReferenceArea
                x1={Math.max(field.domain[0], wEffLeft)}
                x2={Math.min(field.domain[1], wEffRight)}
                fill={WEFF_COLOR}
                fillOpacity={0.1}
                stroke={WEFF_COLOR}
                strokeOpacity={0.45}
                strokeDasharray="6 3"
              />
            )}

            <XAxis
              dataKey="x"
              type="number"
              domain={[field.domain[0], field.domain[1]]}
              tickCount={8}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
              label={{
                value: `Position x [${theme.positionUnit}]`,
                position: 'insideBottom',
                offset: -22,
                style: { fill: 'hsl(var(--muted-foreground))', fontSize: 12 },
              }}
            />
            <YAxis
              domain={signedDomain
                ? [
                    (dataMin: number) => Math.floor(dataMin * 1.15 * 100) / 100,
                    (dataMax: number) => Math.ceil(dataMax * 1.15 * 100) / 100,
                  ]
                : [0, (dataMax: number) => Math.ceil(dataMax * 1.15 * 100) / 100]}
              tickCount={6}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              tickLine={{ stroke: 'hsl(var(--border))' }}
              label={{
                value: `I(x) [${theme.intensityUnit}]`,
                angle: -90,
                position: 'insideLeft',
                offset: 4,
                style: {
                  fill: 'hsl(var(--muted-foreground))',
                  fontSize: 12,
                  textAnchor: 'middle',
                },
              }}
            />

            <Tooltip
              content={
                <CustomTooltip
                  domain={domain}
                  moments={moments}
                  negMoments={negativeOrderMoments}
                />
              }
              cursor={{
                stroke: theme.glow,
                strokeWidth: 1,
                strokeDasharray: '4 3',
              }}
            />

            {signedDomain && (
              <ReferenceLine
                y={0}
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={1}
                strokeDasharray="4 4"
              />
            )}

            {hasJordan && (
              <Area
                type="monotone"
                dataKey="Splus"
                stroke={JORDAN_POS_COLOR}
                strokeWidth={1.75}
                fill={`url(#${gradPosId})`}
                isAnimationActive={animated}
                animationDuration={animated ? 650 : 0}
                dot={false}
                activeDot={false}
              />
            )}

            {hasJordan && (
              <Area
                type="monotone"
                dataKey="Sminus"
                stroke={JORDAN_NEG_COLOR}
                strokeWidth={1.75}
                fill={`url(#${gradNegId})`}
                isAnimationActive={animated}
                animationDuration={animated ? 650 : 0}
                dot={false}
                activeDot={false}
              />
            )}

            <Area
              type="monotone"
              dataKey="I"
              stroke={hasJordan ? 'hsl(var(--muted-foreground))' : theme.stroke}
              strokeWidth={hasJordan ? 1.5 : 2.75}
              strokeDasharray={hasJordan ? '7 4' : undefined}
              fill={hasJordan ? 'none' : `url(#${gradId})`}
              filter={!hasJordan && animated ? `url(#${glowId})` : undefined}
              isAnimationActive={animated}
              animationDuration={animated ? 700 : 0}
              animationEasing="ease-in-out"
              dot={false}
              activeDot={{
                r: 5,
                stroke: theme.glow,
                strokeWidth: 2,
                fill: theme.stroke,
              }}
            />

            {showCentroid && moments.zerothMoment > 0 && (
              <ReferenceLine
                x={parseFloat(moments.centroid.toFixed(4))}
                stroke={CENTROID_COLOR}
                strokeWidth={2}
                strokeDasharray="8 4"
                label={{
                  value: `xbar = ${moments.centroid.toFixed(3)}`,
                  position: 'top',
                  fill: CENTROID_COLOR,
                  fontSize: 11,
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              />
            )}

            {hasJordan && jordan!.positiveMoments.zerothMoment > 0 && (
              <ReferenceLine
                x={parseFloat(jordan!.positiveMoments.centroid.toFixed(4))}
                stroke={JORDAN_POS_COLOR}
                strokeWidth={1.5}
                strokeDasharray="4 4"
                label={{ value: 'xbar+', position: 'top', fill: JORDAN_POS_COLOR, fontSize: 10 }}
              />
            )}
            {hasJordan && jordan!.negativeMoments.zerothMoment > 0 && (
              <ReferenceLine
                x={parseFloat(jordan!.negativeMoments.centroid.toFixed(4))}
                stroke={JORDAN_NEG_COLOR}
                strokeWidth={1.5}
                strokeDasharray="4 4"
                label={{ value: 'xbar-', position: 'top', fill: JORDAN_NEG_COLOR, fontSize: 10 }}
              />
            )}

            {showDispersion && sigma > 0 && moments.zerothMoment > 0 && (
              <>
                {sigmaLeft >= field.domain[0] && (
                  <ReferenceLine
                    x={parseFloat(sigmaLeft.toFixed(4))}
                    stroke={SIGMA_COLOR}
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    label={{
                      value: '-sigma',
                      position: 'top',
                      fill: SIGMA_COLOR,
                      fontSize: 10,
                    }}
                  />
                )}
                {sigmaRight <= field.domain[1] && (
                  <ReferenceLine
                    x={parseFloat(sigmaRight.toFixed(4))}
                    stroke={SIGMA_COLOR}
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    label={{
                      value: '+sigma',
                      position: 'top',
                      fill: SIGMA_COLOR,
                      fontSize: 10,
                    }}
                  />
                )}
              </>
            )}

            {showEffectiveWidth && wEffLeft != null && wEffRight != null && (
              <>
                {wEffLeft >= field.domain[0] && (
                  <ReferenceLine
                    x={parseFloat(wEffLeft.toFixed(4))}
                    stroke={WEFF_COLOR}
                    strokeWidth={1}
                    strokeDasharray="6 3"
                  />
                )}
                {wEffRight <= field.domain[1] && (
                  <ReferenceLine
                    x={parseFloat(wEffRight.toFixed(4))}
                    stroke={WEFF_COLOR}
                    strokeWidth={1}
                    strokeDasharray="6 3"
                  />
                )}
              </>
            )}

            <Brush
              dataKey="x"
              height={22}
              stroke="hsl(var(--primary))"
              fill="hsl(var(--muted))"
              travellerWidth={8}
              tickFormatter={(v: number) => v.toFixed(1)}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {moments.zerothMoment > 0 && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 rounded-md border border-border/30 bg-background/35 px-2 py-2 font-mono text-[10px] text-muted-foreground">
          <span>I0 <span className="text-foreground">{moments.zerothMoment.toFixed(4)}</span></span>
          <span>xbar <span className="text-foreground">{moments.centroid.toFixed(4)}</span></span>
          <span>sigma <span className="text-foreground">{moments.standardDeviation.toFixed(4)}</span></span>
          {negativeOrderMoments && wEff != null && wEff < Infinity && (
            <span>w_eff <span className="text-foreground">{wEff.toFixed(4)}</span></span>
          )}
          <span>gamma1 <span className="text-foreground">{moments.skewness.toFixed(3)}</span></span>
          <span>kappa <span className="text-foreground">{moments.kurtosis.toFixed(3)}</span></span>
        </div>
      )}
    </motion.div>
  );
}

function LayerKey({
  color,
  label,
  filled,
  dashed,
}: {
  color: string;
  label: string;
  filled?: boolean;
  dashed?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border/35 bg-background/35 px-2 py-1">
      <span
        className={filled ? 'h-2 w-3 rounded-sm opacity-70' : 'h-[2px] w-4 rounded'}
        style={{
          background: color,
          borderTop: dashed ? `1px dashed ${color}` : undefined,
        }}
      />
      {label}
    </span>
  );
}

function ChartStat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="rounded-md border border-border/35 bg-background/35 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="truncate font-mono text-sm font-semibold text-foreground">
        {value}
        {unit && <span className="ml-1 text-[10px] font-normal text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}
