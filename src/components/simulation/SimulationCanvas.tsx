import { useMemo, useState, useCallback } from 'react';
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

const DOMAIN_THEMES: Record<string, {
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
    intensityUnit: 'W/m²',
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
    stroke: 'hsl(140, 70%, 50%)',
    fill: 'hsl(140, 70%, 50%)',
    glow: 'hsl(140, 80%, 60%)',
    label: 'Propulsion',
    intensityName: 'Thrust Density',
    positionUnit: 'm',
    intensityUnit: 'N/m²',
  },
};

const CENTROID_COLOR = '#FBBF24';
const SIGMA_COLOR = 'hsl(280, 80%, 65%)';
const WEFF_COLOR = '#22D3EE';
const JORDAN_POS_COLOR = 'hsl(160, 70%, 50%)';
const JORDAN_NEG_COLOR = 'hsl(350, 70%, 55%)';

/* ---------- custom tooltip ---------- */
function CustomTooltip({
  active,
  payload,
  domain,
  moments,
  negMoments,
}: {
  active?: boolean;
  payload?: Array<{ payload: { x: number; I: number } }>;
  label?: number;
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
    <div className="rounded-lg border border-border bg-card/95 backdrop-blur-sm px-3 py-2.5 shadow-lg text-xs space-y-1.5 min-w-[170px]">
      <div className="flex items-center gap-2 text-foreground font-medium">
        <span
          className="w-2 h-2 rounded-full"
          style={{ background: theme.stroke }}
        />
        {theme.label}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-muted-foreground">
        <span>Position</span>
        <span className="text-foreground font-mono text-right">
          {x.toFixed(3)} {theme.positionUnit}
        </span>
        <span>{theme.intensityName}</span>
        <span className="text-foreground font-mono text-right">
          {I.toFixed(4)} {theme.intensityUnit}
        </span>
      </div>
      {(insideSigma || insideWeff) && (
        <div className="border-t border-border pt-1.5 space-y-0.5">
          {insideSigma && (
            <div className="flex items-center gap-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: SIGMA_COLOR }}
              />
              <span className="text-muted-foreground">
                Within ±σ dispersion region
              </span>
            </div>
          )}
          {insideWeff && (
            <div className="flex items-center gap-1.5">
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: WEFF_COLOR }}
              />
              <span className="text-muted-foreground">
                Within w<sub>eff</sub> localization zone
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- main component ---------- */
export function SimulationCanvas({
  field,
  moments,
  domain,
  showCentroid = true,
  showDispersion = true,
  showEffectiveWidth = false,
  negativeOrderMoments,
  jordan,
}: SimulationCanvasProps) {
  const theme = DOMAIN_THEMES[domain] ?? DOMAIN_THEMES.structures;

  const hasJordan = !!jordan;

  /* build chart data */
  const data = useMemo(() => {
    return field.positions.map((pos, i) => ({
      x: parseFloat(pos.toFixed(4)),
      I: field.values[i],
      ...(hasJordan ? {
        Splus: jordan!.positivePart.values[i],
        Sminus: -jordan!.negativePart.values[i], // negative for display below axis
      } : {}),
    }));
  }, [field, jordan, hasJordan]);

  const maxI = useMemo(() => Math.max(...field.values.map(Math.abs), 0.01), [field]);
  const minI = useMemo(() => Math.min(...field.values, 0), [field]);

  /* sigma bounds */
  const sigma = moments.standardDeviation;
  const sigmaLeft = moments.centroid - sigma;
  const sigmaRight = moments.centroid + sigma;

  /* weff bounds */
  const wEff = negativeOrderMoments?.effectiveWidth2;
  const wEffLeft =
    wEff != null && wEff < Infinity ? moments.centroid - wEff / 2 : undefined;
  const wEffRight =
    wEff != null && wEff < Infinity ? moments.centroid + wEff / 2 : undefined;

  /* gradient ids */
  const gradId = `intensity-grad-${domain}`;
  const gradPosId = `jordan-pos-${domain}`;
  const gradNegId = `jordan-neg-${domain}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="w-full h-full min-h-[400px] flex flex-col"
    >
      {/* Legend strip */}
      <div className="flex flex-wrap items-center gap-4 mb-2 px-1 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span
            className="w-3 h-[2px] rounded"
            style={{ background: theme.stroke }}
          />
          I(x) — {theme.intensityName}
        </span>
        {showCentroid && moments.zerothMoment > 0 && (
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-[2px] rounded" style={{ background: CENTROID_COLOR, borderTop: '1px dashed' }} />
            x̄ Centroid
          </span>
        )}
        {showDispersion && sigma > 0 && moments.zerothMoment > 0 && (
          <span className="flex items-center gap-1.5">
            <span
              className="w-3 h-2 rounded-sm opacity-40"
              style={{ background: SIGMA_COLOR }}
            />
            ±σ Spread (μ₂)
          </span>
        )}
        {showEffectiveWidth && wEffLeft != null && (
          <span className="flex items-center gap-1.5">
            <span
              className="w-3 h-2 rounded-sm opacity-40"
              style={{ background: WEFF_COLOR }}
            />
            w<sub>eff</sub> Localization (μ₋ₖ)
          </span>
        )}
        {hasJordan && (
          <>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-2 rounded-sm" style={{ background: JORDAN_POS_COLOR, opacity: 0.6 }} />
              S⁺ Positive
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-2 rounded-sm" style={{ background: JORDAN_NEG_COLOR, opacity: 0.6 }} />
              S⁻ Negative
            </span>
          </>
        )}
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 12, right: 16, bottom: 36, left: 12 }}
          >
            <defs>
              <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={theme.fill} stopOpacity={0.35} />
                <stop offset="95%" stopColor={theme.fill} stopOpacity={0.03} />
              </linearGradient>
              <linearGradient id={gradPosId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={JORDAN_POS_COLOR} stopOpacity={0.4} />
                <stop offset="95%" stopColor={JORDAN_POS_COLOR} stopOpacity={0.02} />
              </linearGradient>
              <linearGradient id={gradNegId} x1="0" y1="1" x2="0" y2="0">
                <stop offset="5%" stopColor={JORDAN_NEG_COLOR} stopOpacity={0.4} />
                <stop offset="95%" stopColor={JORDAN_NEG_COLOR} stopOpacity={0.02} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(220, 20%, 15%)"
              vertical={true}
            />

            {/* Dispersion band — render first so it's behind the curve */}
            {showDispersion && sigma > 0 && moments.zerothMoment > 0 && (
              <ReferenceArea
                x1={Math.max(field.domain[0], sigmaLeft)}
                x2={Math.min(field.domain[1], sigmaRight)}
                fill={SIGMA_COLOR}
                fillOpacity={0.1}
                stroke={SIGMA_COLOR}
                strokeOpacity={0.3}
                strokeDasharray="4 4"
              />
            )}

            {/* Effective width band */}
            {showEffectiveWidth && wEffLeft != null && wEffRight != null && (
              <ReferenceArea
                x1={Math.max(field.domain[0], wEffLeft)}
                x2={Math.min(field.domain[1], wEffRight)}
                fill={WEFF_COLOR}
                fillOpacity={0.08}
                stroke={WEFF_COLOR}
                strokeOpacity={0.35}
                strokeDasharray="6 3"
              />
            )}

            <XAxis
              dataKey="x"
              type="number"
              domain={[field.domain[0], field.domain[1]]}
              tickCount={8}
              tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 11 }}
              axisLine={{ stroke: 'hsl(210, 40%, 30%)' }}
              tickLine={{ stroke: 'hsl(210, 40%, 30%)' }}
              label={{
                value: `Position x  [${theme.positionUnit}]`,
                position: 'insideBottom',
                offset: -20,
                style: { fill: 'hsl(210, 40%, 70%)', fontSize: 12 },
              }}
            />
            <YAxis
              domain={hasJordan ? ['auto', 'auto'] : [0, (dMax: number) => Math.ceil(dMax * 1.15 * 100) / 100]}
              tickCount={6}
              tick={{ fill: 'hsl(215, 20%, 55%)', fontSize: 11 }}
              axisLine={{ stroke: 'hsl(210, 40%, 30%)' }}
              tickLine={{ stroke: 'hsl(210, 40%, 30%)' }}
              label={{
                value: `I(x)  [${theme.intensityUnit}]`,
                angle: -90,
                position: 'insideLeft',
                offset: 4,
                style: {
                  fill: 'hsl(210, 40%, 70%)',
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
                stroke: 'hsl(210, 40%, 40%)',
                strokeWidth: 1,
                strokeDasharray: '4 2',
              }}
            />

            {/* Main curve */}
            <Area
              type="monotone"
              dataKey="I"
              stroke={theme.stroke}
              strokeWidth={2.5}
              fill={`url(#${gradId})`}
              animationDuration={600}
              animationEasing="ease-in-out"
              dot={false}
              activeDot={{
                r: 4,
                stroke: theme.glow,
                strokeWidth: 2,
                fill: theme.stroke,
              }}
            />

            {/* Centroid reference line */}
            {showCentroid && moments.zerothMoment > 0 && (
              <ReferenceLine
                x={parseFloat(moments.centroid.toFixed(4))}
                stroke={CENTROID_COLOR}
                strokeWidth={2}
                strokeDasharray="8 4"
                label={{
                  value: `x̄ = ${moments.centroid.toFixed(3)}`,
                  position: 'top',
                  fill: CENTROID_COLOR,
                  fontSize: 11,
                  fontFamily: 'JetBrains Mono, monospace',
                }}
              />
            )}

            {/* σ boundary lines */}
            {showDispersion && sigma > 0 && moments.zerothMoment > 0 && (
              <>
                {sigmaLeft >= field.domain[0] && (
                  <ReferenceLine
                    x={parseFloat(sigmaLeft.toFixed(4))}
                    stroke={SIGMA_COLOR}
                    strokeWidth={1}
                    strokeDasharray="4 4"
                    label={{
                      value: '−σ',
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
                      value: '+σ',
                      position: 'top',
                      fill: SIGMA_COLOR,
                      fontSize: 10,
                    }}
                  />
                )}
              </>
            )}

            {/* w_eff boundary lines */}
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

            {/* Brush for zoom / pan */}
            <Brush
              dataKey="x"
              height={20}
              stroke="hsl(210, 40%, 30%)"
              fill="hsl(222, 47%, 9%)"
              travellerWidth={8}
              tickFormatter={(v: number) => v.toFixed(1)}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Moment summary bar */}
      {moments.zerothMoment > 0 && (
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 mt-2 px-1 text-[10px] font-mono text-muted-foreground">
          <span>
            I₀ = <span className="text-foreground">{moments.zerothMoment.toFixed(4)}</span>
          </span>
          <span>
            x̄ = <span className="text-foreground">{moments.centroid.toFixed(4)}</span>
          </span>
          <span>
            σ = <span className="text-foreground">{moments.standardDeviation.toFixed(4)}</span>
          </span>
          {negativeOrderMoments && wEff != null && wEff < Infinity && (
            <span>
              w<sub>eff</sub> ={' '}
              <span className="text-foreground">{wEff.toFixed(4)}</span>
            </span>
          )}
          <span>
            γ₁ = <span className="text-foreground">{moments.skewness.toFixed(3)}</span>
          </span>
          <span>
            κ = <span className="text-foreground">{moments.kurtosis.toFixed(3)}</span>
          </span>
        </div>
      )}
    </motion.div>
  );
}
