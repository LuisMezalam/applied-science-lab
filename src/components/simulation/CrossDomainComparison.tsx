import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Atom, ArrowLeftRight } from 'lucide-react';
import { DomainType, LoadingParams, LoadingProfile, MomentResults, NegativeOrderMoments } from '@/types/physics';
import { profilesByDomain } from '@/lib/physics/loadingProfiles';
import { generateField, calculateMoments, calculateNegativeOrderMoments, formatValue } from '@/lib/physics/momentCalculus';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
} from 'recharts';
import { readNumberParam, writeQueryParams } from '@/lib/urlState';

const DOMAINS: DomainType[] = ['structures', 'heat', 'fluids', 'dynamics', 'circuits', 'propulsion'];

const DOMAIN_META: Record<DomainType, { label: string; intensityName: string; unit: string; posUnit: string; colorVar: string }> = {
  structures: { label: 'Structures', intensityName: 'Force Density', unit: 'N/m', posUnit: 'm', colorVar: 'hsl(var(--structures))' },
  heat:       { label: 'Heat Transfer', intensityName: 'Heat Flux', unit: 'W/m²', posUnit: 'm', colorVar: 'hsl(var(--heat))' },
  fluids:     { label: 'Fluids', intensityName: 'Pressure', unit: 'Pa', posUnit: 'm', colorVar: 'hsl(var(--fluids))' },
  dynamics:   { label: 'Dynamics', intensityName: 'Force', unit: 'N', posUnit: 's', colorVar: 'hsl(var(--dynamics))' },
  circuits:   { label: 'Circuits', intensityName: 'Power', unit: 'W', posUnit: 'node', colorVar: 'hsl(var(--circuits))' },
  propulsion: { label: 'Propulsion', intensityName: 'Thrust Density', unit: 'N/m²', posUnit: 'm', colorVar: 'hsl(var(--propulsion))' },
};

type MomentMetricKey = 'zerothMoment' | 'centroid' | 'standardDeviation' | 'skewness' | 'kurtosis';
type DomainResult = {
  domain: DomainType;
  profile: LoadingProfile;
  params: LoadingParams;
  moments: MomentResults;
  negMoments: NegativeOrderMoments;
  meta: (typeof DOMAIN_META)[DomainType];
};
type MomentChartRow = { moment: string } & Partial<Record<DomainType, number>>;
type RadarChartRow = { metric: string } & Partial<Record<DomainType, number>>;

const MOMENT_LABELS: Array<{ key: MomentMetricKey; label: string; short: string }> = [
  { key: 'zerothMoment', label: 'I₀ (Resultant)', short: 'I₀' },
  { key: 'centroid', label: 'x̄ (Centroid)', short: 'x̄' },
  { key: 'standardDeviation', label: 'σ (Spread)', short: 'σ' },
  { key: 'skewness', label: 'γ₁ (Skewness)', short: 'γ₁' },
  { key: 'kurtosis', label: 'κ (Kurtosis)', short: 'κ' },
];

// Map domains to interpretive names for each moment
const INTERPRETATIONS: Record<string, Record<DomainType, string>> = {
  zerothMoment: {
    structures: 'Total Force', heat: 'Total Heat', fluids: 'Pressure Resultant',
    dynamics: 'Impulse', circuits: 'Total Power', propulsion: 'Total Thrust',
  },
  centroid: {
    structures: 'Load Center', heat: 'Heat Center', fluids: 'Pressure Center',
    dynamics: 'Time Center', circuits: 'Power Center', propulsion: 'Thrust Center',
  },
  standardDeviation: {
    structures: 'Load Spread', heat: 'Thermal Spread', fluids: 'Pressure Spread',
    dynamics: 'Duration', circuits: 'Distribution', propulsion: 'Thrust Spread',
  },
  skewness: {
    structures: 'Asymmetry', heat: 'Gradient Bias', fluids: 'Flow Bias',
    dynamics: 'Rise/Fall Bias', circuits: 'Node Bias', propulsion: 'Profile Skew',
  },
  kurtosis: {
    structures: 'Peakedness', heat: 'Hotspot Focus', fluids: 'Concentration',
    dynamics: 'Impact Sharpness', circuits: 'Spike Factor', propulsion: 'Jet Focus',
  },
};

export function CrossDomainComparison() {
  const [magnitude, setMagnitude] = useState(() => readNumberParam('compareMagnitude', 15));
  const [domainLength, setDomainLength] = useState(() => readNumberParam('compareLength', 10));
  const epsilonPercent = 5;

  // Compute moments for the first profile in each domain
  const domainResults = useMemo(() => {
    return DOMAINS.map(domain => {
      const profile = profilesByDomain[domain]?.[0];
      if (!profile) return null;
      const params = { ...profile.defaultParams, magnitude, length: domainLength };
      const field = generateField(profile.generator, params, 300);
      const moments = calculateMoments(field);
      const scaledEps = (epsilonPercent / 100) * domainLength;
      const negMoments = calculateNegativeOrderMoments(field, moments.centroid, moments.zerothMoment, scaledEps);
      return { domain, profile, params, moments, negMoments, meta: DOMAIN_META[domain] };
    }).filter((result): result is DomainResult => result !== null);
  }, [magnitude, domainLength]);

  // Bar chart data: normalized moments for comparison
  const barData = useMemo(() => {
    return MOMENT_LABELS.map(({ key, short }) => {
      const row: MomentChartRow = { moment: short };
      domainResults.forEach(r => {
        // Normalize: centroid → fraction of L, σ → fraction of L, others raw
        let val = r.moments[key];
        if (key === 'centroid' || key === 'standardDeviation') {
          val = val / domainLength; // normalize to [0,1]
        }
        row[r.domain] = parseFloat(val.toFixed(4));
      });
      return row;
    });
  }, [domainResults, domainLength]);

  // Radar data: shape signature (normalized σ, skewness, kurtosis, w_eff)
  const radarData = useMemo(() => {
    const metrics = [
      { key: 'centroidNorm', label: 'Centroid/L' },
      { key: 'spreadNorm', label: 'σ/L' },
      { key: 'skewnessAbs', label: '|γ₁|' },
      { key: 'kurtosisNorm', label: 'κ/3' },
      { key: 'localization', label: 'Localization' },
    ];
    return metrics.map(({ key, label }) => {
      const row: RadarChartRow = { metric: label };
      domainResults.forEach(r => {
        let val = 0;
        switch (key) {
          case 'centroidNorm': val = r.moments.centroid / domainLength; break;
          case 'spreadNorm': val = r.moments.standardDeviation / domainLength; break;
          case 'skewnessAbs': val = Math.abs(r.moments.skewness); break;
          case 'kurtosisNorm': val = r.moments.kurtosis / 3; break; // 1.0 = mesokurtic
          case 'localization': val = r.negMoments.effectiveWidth1 > 0 && isFinite(r.negMoments.effectiveWidth1)
            ? domainLength / r.negMoments.effectiveWidth1
            : 0; break;
        }
        row[r.domain] = parseFloat(Math.min(val, 5).toFixed(3)); // cap for display
      });
      return row;
    });
  }, [domainResults, domainLength]);

  const domainColors = DOMAINS.map(d => DOMAIN_META[d].colorVar);

  useEffect(() => {
    writeQueryParams({
      compareMagnitude: magnitude,
      compareLength: domainLength,
    });
  }, [magnitude, domainLength]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="border-primary/30 bg-card/80 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl flex items-center gap-3">
              <ArrowLeftRight className="h-5 w-5 text-primary" />
              Cross-Domain Unification
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
                6 Domains
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              The same moment ladder — I₀, x̄, σ, γ₁, κ — computed on one representative profile
              per domain, proving that structures, heat, fluids, dynamics, circuits, and propulsion
              share identical mathematical anatomy.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm">Common Magnitude</Label>
                  <span className="text-xs font-mono text-muted-foreground">{magnitude}</span>
                </div>
                <Slider value={[magnitude]} onValueChange={([v]) => setMagnitude(v)} min={1} max={50} step={1} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-sm">Domain Length</Label>
                  <span className="text-xs font-mono text-muted-foreground">{domainLength}</span>
                </div>
                <Slider value={[domainLength]} onValueChange={([v]) => setDomainLength(v)} min={2} max={20} step={1} />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Moment Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="border-border/50 bg-card/80 backdrop-blur overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Atom className="h-4 w-4 text-primary" />
              Moment Ladder — Side by Side
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/30">
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">Moment</th>
                    {domainResults.map(r => (
                      <th key={r.domain} className="px-3 py-3 text-center font-medium" style={{ color: r.meta.colorVar }}>
                        {r.meta.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MOMENT_LABELS.map(({ key, label }, i) => (
                    <tr key={key} className={`border-b border-border/30 ${i % 2 === 0 ? 'bg-muted/10' : ''}`}>
                      <td className="px-4 py-2.5 font-mono text-xs text-foreground">{label}</td>
                      {domainResults.map(r => (
                        <td key={r.domain} className="px-3 py-2.5 text-center">
                          <div className="font-mono text-xs text-foreground">{formatValue(r.moments[key])}</div>
                          <div className="text-[10px] text-muted-foreground">{INTERPRETATIONS[key]?.[r.domain]}</div>
                        </td>
                      ))}
                    </tr>
                  ))}
                  {/* Negative-order rows */}
                  <tr className="border-b border-border/30 bg-muted/10">
                    <td className="px-4 py-2.5 font-mono text-xs text-foreground">w_eff (Localization)</td>
                    {domainResults.map(r => (
                      <td key={r.domain} className="px-3 py-2.5 text-center font-mono text-xs text-foreground">
                        {formatValue(r.negMoments.effectiveWidth1)}
                      </td>
                    ))}
                  </tr>
                  <tr className="border-b border-border/30">
                    <td className="px-4 py-2.5 font-mono text-xs text-foreground">μ₋₂,ε (Concentration)</td>
                    {domainResults.map(r => (
                      <td key={r.domain} className="px-3 py-2.5 text-center font-mono text-xs text-foreground">
                        {formatValue(r.negMoments.centralInverseMoment2)}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart: Normalized Moments */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-border/50 bg-card/80 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Normalized Moment Comparison</CardTitle>
              <p className="text-xs text-muted-foreground">Centroid and σ normalized by domain length L</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="moment" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                  <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  {DOMAINS.map((d, i) => (
                    <Bar key={d} dataKey={d} name={DOMAIN_META[d].label} fill={domainColors[i]} opacity={0.85} radius={[2, 2, 0, 0]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Radar Chart: Shape Signature */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-border/50 bg-card/80 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Shape Signature Radar</CardTitle>
              <p className="text-xs text-muted-foreground">Geometric fingerprint: centroid, spread, skewness, kurtosis, localization</p>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="metric" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                  <PolarRadiusAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 9 }} />
                  {DOMAINS.map((d, i) => (
                    <Radar
                      key={d}
                      name={DOMAIN_META[d].label}
                      dataKey={d}
                      stroke={domainColors[i]}
                      fill={domainColors[i]}
                      fillOpacity={0.1}
                      strokeWidth={2}
                    />
                  ))}
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Domain Cards */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
        <Card className="border-border/50 bg-card/80 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Domain Equivalence Map</CardTitle>
            <p className="text-xs text-muted-foreground">
              Each domain's intensity field maps to the same abstract measure — only the physical labels change
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {domainResults.map(r => (
                <div
                  key={r.domain}
                  className="p-4 rounded-lg border bg-muted/20 space-y-2"
                  style={{ borderColor: `${r.meta.colorVar.replace(')', ' / 0.4)')}` }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: r.meta.colorVar }} />
                    <span className="font-medium text-sm text-foreground">{r.meta.label}</span>
                    {r.profile.dictionaryRef && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border/50">
                        {r.profile.dictionaryRef}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{r.profile.name}: {r.profile.description}</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 border-t border-border/30">
                    <div className="text-[10px] text-muted-foreground">I(x) → {r.meta.intensityName}</div>
                    <div className="text-[10px] text-muted-foreground">x → {r.meta.posUnit}</div>
                    <div className="text-[10px] font-mono text-foreground">I₀ = {formatValue(r.moments.zerothMoment, 3)} {r.meta.unit}·{r.meta.posUnit}</div>
                    <div className="text-[10px] font-mono text-foreground">x̄ = {formatValue(r.moments.centroid, 3)} {r.meta.posUnit}</div>
                    <div className="text-[10px] font-mono text-foreground">σ = {formatValue(r.moments.standardDeviation, 3)} {r.meta.posUnit}</div>
                    <div className="text-[10px] font-mono text-foreground">w_eff = {formatValue(r.negMoments.effectiveWidth1, 3)}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Unification Statement */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-1">The Unification Thesis</p>
          <p>
            Every engineering load — whether force on a beam, heat flux on a surface, pressure in a pipe,
            impulse over time, power across a circuit, or thrust on a nozzle — is a <strong className="text-foreground">nonnegative
            intensity field I(x) on a measure space</strong>. The moment ladder (I₀, x̄, σ, γ₁, κ) and
            inverse-moment localization (w_eff, μ₋₂,ε) are domain-invariant descriptors.
            The table above proves this computationally: identical mathematics, different physical labels.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
