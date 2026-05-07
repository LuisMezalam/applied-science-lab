import { useEffect, useMemo, useState, type ElementType, type ReactNode } from 'react';
import {
  Activity,
  Crosshair,
  Flame,
  Gauge,
  Layers,
  Rocket,
  Ruler,
  Sigma,
  Target,
  Waves,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EquationRenderer } from '@/components/knowledge/EquationRenderer';
import { readEnumParam, writeQueryParams } from '@/lib/urlState';

type RoadmapLabId = 'section' | 'beam' | 'frequency' | 'heat' | 'propulsion' | 'stress';

interface RoadmapLab {
  id: RoadmapLabId;
  name: string;
  shortName: string;
  icon: ElementType;
  atlasRefs: string[];
  description: string;
}

interface Sample1D {
  x: number;
  intensity: number;
}

interface Moment1D {
  resultant: number;
  centroid: number;
  spread: number;
  inverseMoment: number;
  effectiveRadius: number;
  peak: number;
}

interface GridPoint {
  x: number;
  y: number;
  intensity: number;
  value?: number;
}

interface Moment2D {
  resultant: number;
  centroidX: number;
  centroidY: number;
  spread: number;
  peak: number;
}

interface ChartSeries {
  label: string;
  samples: Sample1D[];
  color: string;
}

const ROADMAP_LABS: RoadmapLab[] = [
  {
    id: 'section',
    name: 'Section Properties Lab',
    shortName: 'Section',
    icon: Ruler,
    atlasRefs: ['M-041', 'M-042'],
    description: 'Composite area, voids, centroid shift, second moments, radius of gyration, and principal axes.',
  },
  {
    id: 'beam',
    name: 'Beam Energy Ladder',
    shortName: 'Beam',
    icon: Activity,
    atlasRefs: ['M-001', 'M-020', 'M-023', 'M-065', 'M-066', 'M-067'],
    description: 'Load becomes shear, moment, and a nonnegative strain-energy intensity over the beam domain.',
  },
  {
    id: 'frequency',
    name: 'Frequency-Domain Moment Lab',
    shortName: 'Frequency',
    icon: Waves,
    atlasRefs: ['M-036', 'M-059', 'M-078', 'M-079'],
    description: 'Spectral peaks, bandwidth, and noise floor become centroid frequency, spread, and localization.',
  },
  {
    id: 'heat',
    name: 'Heat Boundary And Fin Lab',
    shortName: 'Heat',
    icon: Flame,
    atlasRefs: ['M-035', 'M-050', 'M-051', 'M-070'],
    description: 'Boundary heat transfer and fin loss density as a one-dimensional heat-rate intensity field.',
  },
  {
    id: 'propulsion',
    name: 'Propulsion Burn And Map Lab',
    shortName: 'Propulsion',
    icon: Rocket,
    atlasRefs: ['M-012', 'M-013', 'M-060', 'M-061', 'M-063', 'M-080'],
    description: 'Impulse history, propellant use, and performance-map robustness in the same parameter ladder.',
  },
  {
    id: 'stress',
    name: 'Stress Hotspot And FEA Lab',
    shortName: 'Stress',
    icon: Crosshair,
    atlasRefs: ['M-044', 'M-045', 'M-046', 'M-083'],
    description: 'Toy equivalent stress, strain, plastic-work proxy, and threshold violation intensity over a plate.',
  },
];

const ROADMAP_LAB_IDS = ROADMAP_LABS.map(lab => lab.id);

function getInitialRoadmapLab(): RoadmapLabId {
  return readEnumParam('lab', ROADMAP_LAB_IDS, 'section');
}

const CHART_WIDTH = 720;
const CHART_HEIGHT = 260;
const CHART_PADDING = 34;

function formatNumber(value: number, digits = 3) {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

function formatCompact(value: number, digits = 2) {
  return value.toLocaleString(undefined, {
    maximumFractionDigits: digits,
  });
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function makeSamples(count: number, start: number, end: number, getIntensity: (x: number) => number): Sample1D[] {
  return Array.from({ length: count }, (_, index) => {
    const t = count === 1 ? 0 : index / (count - 1);
    const x = start + (end - start) * t;
    return { x, intensity: Math.max(0, getIntensity(x)) };
  });
}

function integrationWeights(samples: Sample1D[]) {
  return samples.map((sample, index) => {
    if (samples.length < 2) return 1;
    if (index === 0) return (samples[1].x - sample.x) / 2;
    if (index === samples.length - 1) return (sample.x - samples[index - 1].x) / 2;
    return (samples[index + 1].x - samples[index - 1].x) / 2;
  });
}

function calculateLineMoments(samples: Sample1D[], epsilonFraction = 0.04): Moment1D {
  const weights = integrationWeights(samples);
  const masses = samples.map((sample, index) => sample.intensity * weights[index]);
  const resultant = masses.reduce((sum, mass) => sum + mass, 0);
  const peak = samples.reduce((max, sample) => Math.max(max, sample.intensity), 0);
  const minX = Math.min(...samples.map(sample => sample.x));
  const maxX = Math.max(...samples.map(sample => sample.x));
  const span = Math.max(1e-9, maxX - minX);

  if (resultant <= 1e-12) {
    return { resultant: 0, centroid: minX, spread: 0, inverseMoment: 0, effectiveRadius: 0, peak };
  }

  const centroid = samples.reduce((sum, sample, index) => sum + sample.x * masses[index], 0) / resultant;
  const variance = samples.reduce((sum, sample, index) => sum + (sample.x - centroid) ** 2 * masses[index], 0) / resultant;
  const epsilon = epsilonFraction * span;
  const inverseMoment = samples.reduce((sum, sample, index) => {
    const probability = masses[index] / resultant;
    return sum + probability / Math.sqrt((sample.x - centroid) ** 2 + epsilon * epsilon);
  }, 0);

  return {
    resultant,
    centroid,
    spread: Math.sqrt(Math.max(0, variance)),
    inverseMoment,
    effectiveRadius: inverseMoment > 0 ? 1 / inverseMoment : 0,
    peak,
  };
}

function calculateGridMoments(points: GridPoint[]): Moment2D {
  const resultant = points.reduce((sum, point) => sum + point.intensity, 0);
  const peak = points.reduce((max, point) => Math.max(max, point.value ?? point.intensity), 0);

  if (resultant <= 1e-12) {
    return { resultant: 0, centroidX: 0, centroidY: 0, spread: 0, peak };
  }

  const centroidX = points.reduce((sum, point) => sum + point.x * point.intensity, 0) / resultant;
  const centroidY = points.reduce((sum, point) => sum + point.y * point.intensity, 0) / resultant;
  const variance = points.reduce(
    (sum, point) => sum + ((point.x - centroidX) ** 2 + (point.y - centroidY) ** 2) * point.intensity,
    0,
  ) / resultant;

  return {
    resultant,
    centroidX,
    centroidY,
    spread: Math.sqrt(Math.max(0, variance)),
    peak,
  };
}

function gaussian(x: number, center: number, width: number) {
  return Math.exp(-0.5 * ((x - center) / Math.max(width, 1e-6)) ** 2);
}

export function RoadmapLabs() {
  const [activeLabId, setActiveLabId] = useState<RoadmapLabId>(getInitialRoadmapLab);
  const activeLab = ROADMAP_LABS.find(lab => lab.id === activeLabId) ?? ROADMAP_LABS[0];
  const ActiveIcon = activeLab.icon;

  useEffect(() => {
    writeQueryParams({ lab: activeLabId });
  }, [activeLabId]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="mb-2 flex items-center gap-2 text-primary">
            <Layers className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Roadmap Labs</span>
          </div>
          <h2 className="text-2xl font-bold text-foreground">Engineering Intensity Modules</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            The remaining simulator concepts are grouped into focused labs. Each one exposes an engineering field as a
            nonnegative intensity over its domain, then computes the same resultant, centroid, spread, localization, and
            sign-policy ladder.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="gap-2">
            <ActiveIcon className="h-3.5 w-3.5" />
            {activeLab.name}
          </Badge>
          {activeLab.atlasRefs.map(ref => (
            <Badge key={ref} variant="outline" className="border-primary/30 bg-primary/10 text-primary">
              {ref}
            </Badge>
          ))}
        </div>
      </div>

      <Tabs value={activeLabId} onValueChange={value => setActiveLabId(value as RoadmapLabId)}>
        <TabsList className="flex h-auto flex-wrap justify-start gap-1 bg-muted/50">
          {ROADMAP_LABS.map(lab => {
            const Icon = lab.icon;
            return (
              <TabsTrigger key={lab.id} value={lab.id} className="gap-2">
                <Icon className="h-4 w-4" />
                {lab.shortName}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </Tabs>

      <p className="max-w-4xl text-sm leading-relaxed text-muted-foreground">{activeLab.description}</p>

      {activeLabId === 'section' && <SectionPropertiesLab />}
      {activeLabId === 'beam' && <BeamEnergyLab />}
      {activeLabId === 'frequency' && <FrequencyMomentLab />}
      {activeLabId === 'heat' && <HeatFinLab />}
      {activeLabId === 'propulsion' && <PropulsionBurnMapLab />}
      {activeLabId === 'stress' && <StressHotspotLab />}
    </div>
  );
}

function SectionPropertiesLab() {
  const [flangeWidth, setFlangeWidth] = useState(150);
  const [webWidth, setWebWidth] = useState(34);
  const [flangeThickness, setFlangeThickness] = useState(20);
  const [topOffset, setTopOffset] = useState(22);
  const [holeRadius, setHoleRadius] = useState(12);

  const section = useMemo(() => {
    const height = 140;
    const webHeight = height - 2 * flangeThickness;
    const holeX = -topOffset / 2;
    const holeY = 0;
    const components = [
      { kind: 'rect' as const, sign: 1, cx: 0, cy: 0, w: webWidth, h: webHeight },
      { kind: 'rect' as const, sign: 1, cx: topOffset, cy: height / 2 - flangeThickness / 2, w: flangeWidth, h: flangeThickness },
      { kind: 'rect' as const, sign: 1, cx: 0, cy: -height / 2 + flangeThickness / 2, w: flangeWidth * 0.88, h: flangeThickness },
      { kind: 'circle' as const, sign: -1, cx: holeX, cy: holeY, r: holeRadius },
    ];

    const withProperties = components.map(component => {
      if (component.kind === 'rect') {
        const area = component.w * component.h;
        return {
          ...component,
          area,
          ix: (component.w * component.h ** 3) / 12,
          iy: (component.h * component.w ** 3) / 12,
        };
      }
      const area = Math.PI * component.r ** 2;
      return {
        ...component,
        area,
        ix: (Math.PI * component.r ** 4) / 4,
        iy: (Math.PI * component.r ** 4) / 4,
      };
    });

    const area = withProperties.reduce((sum, component) => sum + component.sign * component.area, 0);
    const centroidX = withProperties.reduce((sum, component) => sum + component.sign * component.area * component.cx, 0) / area;
    const centroidY = withProperties.reduce((sum, component) => sum + component.sign * component.area * component.cy, 0) / area;
    const ix = withProperties.reduce(
      (sum, component) => sum + component.sign * (component.ix + component.area * (component.cy - centroidY) ** 2),
      0,
    );
    const iy = withProperties.reduce(
      (sum, component) => sum + component.sign * (component.iy + component.area * (component.cx - centroidX) ** 2),
      0,
    );
    const ixy = withProperties.reduce(
      (sum, component) => sum + component.sign * component.area * (component.cx - centroidX) * (component.cy - centroidY),
      0,
    );
    const average = (ix + iy) / 2;
    const radius = Math.sqrt(((ix - iy) / 2) ** 2 + ixy ** 2);
    const i1 = average + radius;
    const i2 = average - radius;
    const principalAngle = 0.5 * Math.atan2(-2 * ixy, iy - ix);

    return {
      components: withProperties,
      area,
      centroidX,
      centroidY,
      ix,
      iy,
      ixy,
      i1,
      i2,
      principalAngle,
      kx: Math.sqrt(Math.max(0, ix / area)),
      ky: Math.sqrt(Math.max(0, iy / area)),
    };
  }, [flangeThickness, flangeWidth, holeRadius, topOffset, webWidth]);

  return (
    <LabFrame
      controls={
        <>
          <SliderControl label="Flange width" value={flangeWidth} min={100} max={190} step={2} unit="mm" onChange={setFlangeWidth} />
          <SliderControl label="Web width" value={webWidth} min={18} max={64} step={1} unit="mm" onChange={setWebWidth} />
          <SliderControl label="Flange thickness" value={flangeThickness} min={12} max={32} step={1} unit="mm" onChange={setFlangeThickness} />
          <SliderControl label="Top flange offset" value={topOffset} min={-35} max={35} step={1} unit="mm" onChange={setTopOffset} />
          <SliderControl label="Void radius" value={holeRadius} min={0} max={24} step={1} unit="mm" onChange={setHoleRadius} />
          <EquationPanel
            title="Area as intensity"
            equations={[
              '$I(x,y)=1\\;\\text{on material}\\;\\Omega$',
              '$A=\\int_\\Omega dA$',
              '$\\bar{x}=A^{-1}\\int_\\Omega x\\,dA$',
              '$I_x=\\int_\\Omega (y-\\bar{y})^2\\,dA$',
            ]}
          />
        </>
      }
      visual={
        <Card className="border-border/50 bg-card/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Composite Section Domain</CardTitle>
          </CardHeader>
          <CardContent>
            <SectionCanvas section={section} />
          </CardContent>
        </Card>
      }
      metrics={
        <>
          <MetricTile title="Area Resultant" icon={Gauge} value={`${formatCompact(section.area, 0)} mm^2`} detail={'$A=\\int_\\Omega dA$'} />
          <MetricTile title="Centroid" icon={Target} value={`(${formatNumber(section.centroidX, 1)}, ${formatNumber(section.centroidY, 1)})`} detail={'$\\bar{r}=A^{-1}\\int r\\,dA$'} />
          <MetricTile title="Spread Radii" icon={Sigma} value={`kx ${formatNumber(section.kx, 1)}, ky ${formatNumber(section.ky, 1)}`} detail={'$k=\\sqrt{I/A}$'} />
          <MetricTile title="Principal Ratio" icon={Crosshair} value={formatNumber(section.i1 / Math.max(section.i2, 1), 2)} detail={'$I_1/I_2$'} />
        </>
      }
      signPolicy="Section properties use a nonnegative material intensity over the material domain. Holes are removed from the domain; composite algebra may subtract their geometric contribution, but the material field itself is never negative."
    />
  );
}

function BeamEnergyLab() {
  const [uniformLoad, setUniformLoad] = useState(12);
  const [pointLoad, setPointLoad] = useState(28);
  const [pointPosition, setPointPosition] = useState(62);
  const [stiffness, setStiffness] = useState(80);
  const length = 10;

  const beam = useMemo(() => {
    const pointX = (pointPosition / 100) * length;
    const reactionB = (uniformLoad * length * (length / 2) + pointLoad * pointX) / length;
    const reactionA = uniformLoad * length + pointLoad - reactionB;
    const sigma = length * 0.025;
    const loadSamples = makeSamples(180, 0, length, x => uniformLoad + (pointLoad / (sigma * Math.sqrt(2 * Math.PI))) * gaussian(x, pointX, sigma));
    const momentSamples = makeSamples(180, 0, length, x => {
      const pointTerm = x >= pointX ? pointLoad * (x - pointX) : 0;
      return Math.abs(reactionA * x - (uniformLoad * x ** 2) / 2 - pointTerm);
    });
    const energySamples = makeSamples(180, 0, length, x => {
      const pointTerm = x >= pointX ? pointLoad * (x - pointX) : 0;
      const moment = reactionA * x - (uniformLoad * x ** 2) / 2 - pointTerm;
      return moment ** 2 / (2 * stiffness * 1000);
    });
    return {
      pointX,
      reactionA,
      reactionB,
      loadSamples,
      momentSamples,
      energySamples,
      energyMoments: calculateLineMoments(energySamples),
      peakMoment: momentSamples.reduce((max, sample) => Math.max(max, sample.intensity), 0),
    };
  }, [pointLoad, pointPosition, stiffness, uniformLoad]);

  return (
    <LabFrame
      controls={
        <>
          <SliderControl label="Uniform load" value={uniformLoad} min={0} max={24} step={1} unit="kN/m" onChange={setUniformLoad} />
          <SliderControl label="Point load" value={pointLoad} min={0} max={60} step={1} unit="kN" onChange={setPointLoad} />
          <SliderControl label="Point location" value={pointPosition} min={15} max={85} step={1} unit="%" onChange={setPointPosition} />
          <SliderControl label="EI scale" value={stiffness} min={30} max={160} step={5} unit="" onChange={setStiffness} />
          <EquationPanel
            title="Energy intensity"
            equations={[
              '$V(x)=R_A-\\int_0^x w(s)\\,ds-PH(x-a)$',
              '$M(x)=\\int_0^x V(s)\\,ds$',
              '$I(x)=u_b(x)=M(x)^2/(2EI)\\ge0$',
              '$U=\\int_0^L u_b(x)\\,dx$',
            ]}
          />
        </>
      }
      visual={
        <Card className="border-border/50 bg-card/70">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between gap-3 text-base">
              <span>Load To Energy Chain</span>
              <Badge variant="secondary" className="font-mono text-xs">
                RA {formatNumber(beam.reactionA, 1)} / RB {formatNumber(beam.reactionB, 1)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <LineChart
              title="Load intensity, bending moment magnitude, and strain-energy density"
              series={[
                { label: 'load', samples: beam.loadSamples, color: 'hsl(var(--primary))' },
                { label: '|M|', samples: beam.momentSamples, color: 'hsl(var(--accent))' },
                { label: 'energy', samples: beam.energySamples, color: 'hsl(var(--success))' },
              ]}
            />
          </CardContent>
        </Card>
      }
      metrics={
        <>
          <MetricTile title="Total Energy" icon={Gauge} value={formatNumber(beam.energyMoments.resultant, 3)} detail={'$U=\\int u_b\\,dx$'} />
          <MetricTile title="Energy Centroid" icon={Target} value={`${formatNumber(beam.energyMoments.centroid, 2)} m`} detail={'$\\bar{x}=U^{-1}\\int xu_b\\,dx$'} />
          <MetricTile title="Energy Spread" icon={Sigma} value={`${formatNumber(beam.energyMoments.spread, 2)} m`} detail={'$\\sigma_x=\\sqrt{\\mu_2}$'} />
          <MetricTile title="Peak Moment" icon={Zap} value={`${formatNumber(beam.peakMoment, 1)}`} detail={'$\\max |M(x)|$'} />
        </>
      }
      signPolicy="Loads, shear, and bending moment can be signed. The energy ladder uses squared moment or signed fields split by direction, so the intensity over the beam is nonnegative."
    />
  );
}

function FrequencyMomentLab() {
  const [primaryFreq, setPrimaryFreq] = useState(44);
  const [secondaryFreq, setSecondaryFreq] = useState(128);
  const [bandwidth, setBandwidth] = useState(11);
  const [secondaryStrength, setSecondaryStrength] = useState(45);
  const [noiseFloor, setNoiseFloor] = useState(7);

  const spectrum = useMemo(() => {
    const samples = makeSamples(240, 0, 200, frequency => {
      const firstPeak = gaussian(frequency, primaryFreq, bandwidth);
      const secondPeak = (secondaryStrength / 100) * gaussian(frequency, secondaryFreq, bandwidth * 1.8);
      const floor = noiseFloor / 100;
      return floor + firstPeak + secondPeak;
    });
    return { samples, moments: calculateLineMoments(samples, 0.015) };
  }, [bandwidth, noiseFloor, primaryFreq, secondaryFreq, secondaryStrength]);

  return (
    <LabFrame
      controls={
        <>
          <SliderControl label="Primary peak" value={primaryFreq} min={8} max={100} step={1} unit="Hz" onChange={setPrimaryFreq} />
          <SliderControl label="Secondary peak" value={secondaryFreq} min={70} max={190} step={1} unit="Hz" onChange={setSecondaryFreq} />
          <SliderControl label="Bandwidth" value={bandwidth} min={4} max={32} step={1} unit="Hz" onChange={setBandwidth} />
          <SliderControl label="Secondary strength" value={secondaryStrength} min={0} max={100} step={5} unit="%" onChange={setSecondaryStrength} />
          <SliderControl label="Noise floor" value={noiseFloor} min={0} max={25} step={1} unit="%" onChange={setNoiseFloor} />
          <EquationPanel
            title="Spectral intensity"
            equations={[
              '$I(f)=S_{xx}(f)\\ge0$',
              '$I_0=\\int S_{xx}(f)\\,df$',
              '$\\bar{f}=I_0^{-1}\\int fS_{xx}(f)\\,df$',
              '$\\sigma_f^2=I_0^{-1}\\int(f-\\bar{f})^2S_{xx}(f)\\,df$',
            ]}
          />
        </>
      }
      visual={
        <Card className="border-border/50 bg-card/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Power Spectrum As A Domain Field</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart
              title="Spectral density"
              series={[{ label: 'PSD', samples: spectrum.samples, color: 'hsl(var(--primary))' }]}
              centroid={spectrum.moments.centroid}
            />
          </CardContent>
        </Card>
      }
      metrics={
        <>
          <MetricTile title="Spectral Resultant" icon={Gauge} value={formatNumber(spectrum.moments.resultant, 2)} detail={'$I_0=\\int I(f)df$'} />
          <MetricTile title="Centroid Freq." icon={Target} value={`${formatNumber(spectrum.moments.centroid, 1)} Hz`} detail={'$\\bar{f}$'} />
          <MetricTile title="RMS Bandwidth" icon={Sigma} value={`${formatNumber(spectrum.moments.spread, 1)} Hz`} detail={'$\\sigma_f$'} />
          <MetricTile title="Effective Width" icon={Crosshair} value={`${formatNumber(spectrum.moments.effectiveRadius, 1)} Hz`} detail={'$1/\\mu_{-1,\\varepsilon}$'} />
        </>
      }
      signPolicy="Spectral densities, shock spectra, and response spectra are nonnegative by construction. Signed time signals should be transformed to PSD, magnitude spectra, or positive and negative event families before moment analysis."
    />
  );
}

function HeatFinLab() {
  const [finLength, setFinLength] = useState(120);
  const [decayLength, setDecayLength] = useState(36);
  const [baseExcess, setBaseExcess] = useState(95);
  const [heatTransfer, setHeatTransfer] = useState(55);

  const fin = useMemo(() => {
    const temperatureSamples = makeSamples(180, 0, finLength, x => baseExcess * Math.exp(-x / decayLength));
    const lossSamples = makeSamples(180, 0, finLength, x => {
      const theta = baseExcess * Math.exp(-x / decayLength);
      const convective = (heatTransfer / 100) * theta;
      const radiativeProxy = 0.16 * baseExcess * (theta / Math.max(baseExcess, 1)) ** 4;
      return convective + radiativeProxy;
    });
    const moments = calculateLineMoments(lossSamples, 0.025);
    const tipFraction = Math.exp(-finLength / decayLength);
    return { temperatureSamples, lossSamples, moments, tipFraction };
  }, [baseExcess, decayLength, finLength, heatTransfer]);

  return (
    <LabFrame
      controls={
        <>
          <SliderControl label="Fin length" value={finLength} min={50} max={220} step={5} unit="mm" onChange={setFinLength} />
          <SliderControl label="Decay length" value={decayLength} min={12} max={90} step={2} unit="mm" onChange={setDecayLength} />
          <SliderControl label="Base excess temp." value={baseExcess} min={20} max={180} step={5} unit="K" onChange={setBaseExcess} />
          <SliderControl label="hP scale" value={heatTransfer} min={15} max={120} step={5} unit="%" onChange={setHeatTransfer} />
          <EquationPanel
            title="Fin and boundary flux"
            equations={[
              '$\\theta(x)=\\theta_b e^{-x/\\lambda}$',
              "$I(x)=q'(x)=hP\\theta(x)\\ge0$",
              "$\\dot{Q}=\\int_0^L q'(x)\\,dx$",
              "$q''=h(T_s-T_\\infty)+\\epsilon\\sigma(T_s^4-T_\\infty^4)$",
            ]}
          />
        </>
      }
      visual={
        <Card className="border-border/50 bg-card/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Fin Heat-Loss Intensity</CardTitle>
          </CardHeader>
          <CardContent>
            <LineChart
              title="Temperature excess and heat loss per length"
              series={[
                { label: 'temperature excess', samples: fin.temperatureSamples, color: 'hsl(var(--accent))' },
                { label: 'heat loss', samples: fin.lossSamples, color: 'hsl(var(--primary))' },
              ]}
              centroid={fin.moments.centroid}
            />
          </CardContent>
        </Card>
      }
      metrics={
        <>
          <MetricTile title="Heat Rate" icon={Gauge} value={formatNumber(fin.moments.resultant, 1)} detail={"$\\dot{Q}=\\int q' dx$"} />
          <MetricTile title="Loss Centroid" icon={Target} value={`${formatNumber(fin.moments.centroid, 1)} mm`} detail={'$\\bar{x}_Q$'} />
          <MetricTile title="Active Spread" icon={Sigma} value={`${formatNumber(fin.moments.spread, 1)} mm`} detail={'$\\sigma_Q$'} />
          <MetricTile title="Tip Excess" icon={Flame} value={`${formatNumber(fin.tipFraction * 100, 1)}%`} detail={'$\\theta(L)/\\theta_b$'} />
        </>
      }
      signPolicy="Heat entering and heat leaving a boundary should be split into separate nonnegative fields. The fin-loss view tracks outward heat loss, so its intensity is positive along the fin."
    />
  );
}

function PropulsionBurnMapLab() {
  const [burnTime, setBurnTime] = useState(72);
  const [maxThrust, setMaxThrust] = useState(86);
  const [tailPercent, setTailPercent] = useState(26);
  const [massFlow, setMassFlow] = useState(24);
  const [operatingPoint, setOperatingPoint] = useState(62);
  const [mapWidth, setMapWidth] = useState(18);

  const propulsion = useMemo(() => {
    const tailStart = burnTime * (1 - tailPercent / 100);
    const riseEnd = burnTime * 0.14;
    const thrustSamples = makeSamples(220, 0, burnTime, time => {
      const rise = clamp(time / riseEnd, 0, 1);
      const tail = time <= tailStart ? 1 : clamp(1 - (time - tailStart) / Math.max(1e-6, burnTime - tailStart), 0, 1);
      return maxThrust * Math.min(rise, tail) * (0.96 + 0.04 * Math.sin((Math.PI * time) / burnTime));
    });
    const propellantSamples = makeSamples(220, 0, burnTime, time => {
      const thrustFactor = thrustSamples[Math.round((time / burnTime) * (thrustSamples.length - 1))]?.intensity / Math.max(maxThrust, 1);
      return massFlow * (0.58 + 0.42 * thrustFactor);
    });
    const mapSamples = makeSamples(180, 0, 100, parameter => {
      const robustBand = gaussian(parameter, operatingPoint, mapWidth);
      const surgeLoss = 0.28 * gaussian(parameter, 18, 10);
      const chokeLoss = 0.32 * gaussian(parameter, 92, 8);
      return Math.max(0, robustBand * (1 - surgeLoss - chokeLoss));
    });
    return {
      thrustSamples,
      propellantSamples,
      mapSamples,
      impulseMoments: calculateLineMoments(thrustSamples, 0.02),
      propellantMoments: calculateLineMoments(propellantSamples, 0.02),
      mapMoments: calculateLineMoments(mapSamples, 0.02),
    };
  }, [burnTime, mapWidth, massFlow, maxThrust, operatingPoint, tailPercent]);

  return (
    <LabFrame
      controls={
        <>
          <SliderControl label="Burn time" value={burnTime} min={25} max={140} step={1} unit="s" onChange={setBurnTime} />
          <SliderControl label="Max thrust" value={maxThrust} min={25} max={160} step={1} unit="kN" onChange={setMaxThrust} />
          <SliderControl label="Tailoff fraction" value={tailPercent} min={5} max={55} step={1} unit="%" onChange={setTailPercent} />
          <SliderControl label="Mass-flow scale" value={massFlow} min={5} max={60} step={1} unit="kg/s" onChange={setMassFlow} />
          <SliderControl label="Map operating point" value={operatingPoint} min={20} max={90} step={1} unit="%" onChange={setOperatingPoint} />
          <SliderControl label="Robust band width" value={mapWidth} min={6} max={32} step={1} unit="%" onChange={setMapWidth} />
          <EquationPanel
            title="Impulse and map fields"
            equations={[
              '$I_t(t)=T(t)\\ge0$',
              '$J=\\int_0^{t_b}T(t)\\,dt$',
              '$I_m(t)=\\dot{m}_p(t)\\ge0$',
              '$I_\\Pi(\\pi)=\\text{performance score}(\\pi)\\ge0$',
            ]}
          />
        </>
      }
      visual={
        <Card className="border-border/50 bg-card/70">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Burn Timeline And Performance Band</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <LineChart
              title="Thrust and propellant mass-flow history"
              series={[
                { label: 'thrust', samples: propulsion.thrustSamples, color: 'hsl(var(--primary))' },
                { label: 'mass flow', samples: propulsion.propellantSamples, color: 'hsl(var(--accent))' },
              ]}
              centroid={propulsion.impulseMoments.centroid}
            />
            <LineChart
              title="Performance map intensity over operating parameter"
              series={[{ label: 'performance band', samples: propulsion.mapSamples, color: 'hsl(var(--success))' }]}
              centroid={propulsion.mapMoments.centroid}
              height={180}
            />
          </CardContent>
        </Card>
      }
      metrics={
        <>
          <MetricTile title="Total Impulse" icon={Gauge} value={`${formatNumber(propulsion.impulseMoments.resultant, 1)} kN s`} detail={'$J=\\int Tdt$'} />
          <MetricTile title="Impulse Centroid" icon={Target} value={`${formatNumber(propulsion.impulseMoments.centroid, 1)} s`} detail={'$\\bar{t}_J$'} />
          <MetricTile title="Propellant Used" icon={Rocket} value={`${formatNumber(propulsion.propellantMoments.resultant, 1)} kg`} detail={'$m_p=\\int\\dot{m}_pdt$'} />
          <MetricTile title="Map Centroid" icon={Sigma} value={`${formatNumber(propulsion.mapMoments.centroid, 1)}%`} detail={'$\\bar{\\pi}$'} />
        </>
      }
      signPolicy="Thrust magnitude, propellant mass flow, and performance scores are nonnegative. Loss maps can be shown as positive loss intensity or converted into a nonnegative performance-band intensity depending on the question."
    />
  );
}

function StressHotspotLab() {
  const [loadPercent, setLoadPercent] = useState(76);
  const [yieldStress, setYieldStress] = useState(250);
  const [notchRadius, setNotchRadius] = useState(16);
  const [hotspotSpread, setHotspotSpread] = useState(22);

  const stress = useMemo(() => {
    const cols = 48;
    const rows = 30;
    const points: GridPoint[] = [];
    const violationPoints: GridPoint[] = [];
    const base = (loadPercent / 100) * yieldStress;
    const notchFactor = 0.8 + 22 / (notchRadius + 8);
    const width = hotspotSpread / 100;

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const x = col / (cols - 1);
        const y = row / (rows - 1);
        const dx = x - 0.32;
        const dy = y - 0.5;
        const secondaryDx = x - 0.72;
        const secondaryDy = y - 0.38;
        const concentration = 1 + notchFactor * Math.exp(-(dx * dx + dy * dy) / (2 * width * width));
        const secondary = 0.38 * Math.exp(-(secondaryDx * secondaryDx + secondaryDy * secondaryDy) / (2 * (width * 1.4) ** 2));
        const sigmaEq = base * (0.48 + 0.52 * concentration + secondary);
        const utilization = sigmaEq / yieldStress;
        const demand = sigmaEq ** 2;
        const violation = Math.max(0, utilization - 1) ** 2;
        points.push({ x, y, intensity: demand, value: utilization });
        violationPoints.push({ x, y, intensity: violation, value: utilization });
      }
    }

    const violationMoment = calculateGridMoments(violationPoints);
    const demandMoment = calculateGridMoments(points);
    return {
      cols,
      rows,
      points,
      demandMoment,
      violationMoment,
      activeMoment: violationMoment.resultant > 1e-8 ? violationMoment : demandMoment,
      peakUtilization: points.reduce((max, point) => Math.max(max, point.value ?? 0), 0),
    };
  }, [hotspotSpread, loadPercent, notchRadius, yieldStress]);

  return (
    <LabFrame
      controls={
        <>
          <SliderControl label="Applied load" value={loadPercent} min={30} max={125} step={1} unit="%" onChange={setLoadPercent} />
          <SliderControl label="Yield stress" value={yieldStress} min={120} max={520} step={5} unit="MPa" onChange={setYieldStress} />
          <SliderControl label="Notch radius" value={notchRadius} min={6} max={45} step={1} unit="mm" onChange={setNotchRadius} />
          <SliderControl label="Hotspot spread" value={hotspotSpread} min={8} max={42} step={1} unit="%" onChange={setHotspotSpread} />
          <EquationPanel
            title="Demand and violation"
            equations={[
              '$I_\\sigma(x,y)=\\sigma_{eq}(x,y)^2\\ge0$',
              '$u(x,y)=\\sigma_{eq}/\\sigma_y$',
              '$I_v(x,y)=\\max(0,u-1)^2$',
              '$\\bar{r}_v=I_{v0}^{-1}\\int rI_v\\,dA$',
            ]}
          />
        </>
      }
      visual={
        <Card className="border-border/50 bg-card/70">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between gap-3 text-base">
              <span>Equivalent Stress And Violation Field</span>
              <Badge variant={stress.peakUtilization > 1 ? 'destructive' : 'secondary'} className="font-mono text-xs">
                peak u {formatNumber(stress.peakUtilization, 2)}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StressCanvas stress={stress} />
          </CardContent>
        </Card>
      }
      metrics={
        <>
          <MetricTile title="Peak Utilization" icon={Gauge} value={formatNumber(stress.peakUtilization, 2)} detail={'$u_{max}=\\sigma_{eq}/\\sigma_y$'} />
          <MetricTile title="Violation Resultant" icon={Target} value={formatNumber(stress.violationMoment.resultant, 2)} detail={'$I_{v0}=\\int I_vdA$'} />
          <MetricTile title="Demand Center" icon={Crosshair} value={`(${formatNumber(stress.activeMoment.centroidX, 2)}, ${formatNumber(stress.activeMoment.centroidY, 2)})`} detail={'$\\bar{r}$'} />
          <MetricTile title="Hotspot Spread" icon={Sigma} value={formatNumber(stress.activeMoment.spread, 2)} detail={'$\\sigma_r$'} />
        </>
      }
      signPolicy="Equivalent stress, strain-energy proxies, plastic work, and failure utilization are nonnegative scalar demand fields. Signed stress components belong in separate component views before being collapsed into demand intensity."
    />
  );
}

function LabFrame({
  controls,
  visual,
  metrics,
  signPolicy,
}: {
  controls: ReactNode;
  visual: ReactNode;
  metrics: ReactNode;
  signPolicy: string;
}) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[360px_1fr]">
        <Card className="border-border/50 bg-card/70">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Gauge className="h-4 w-4 text-primary" />
              Controls
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">{controls}</CardContent>
        </Card>
        {visual}
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">{metrics}</div>
      <Card className="border-border/50 bg-card/70">
        <CardContent className="pt-6">
          <p className="text-sm leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">Sign policy: </span>
            {signPolicy}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function SliderControl({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-medium text-foreground">{label}</label>
        <span className="font-mono text-xs text-muted-foreground">
          {formatCompact(value, 1)}
          {unit}
        </span>
      </div>
      <Slider value={[value]} min={min} max={max} step={step} onValueChange={([next]) => onChange(next)} />
    </div>
  );
}

function EquationPanel({ title, equations }: { title: string; equations: string[] }) {
  return (
    <div className="rounded-md border border-border/40 bg-muted/20 p-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <div className="mt-3 flex flex-col gap-2">
        {equations.map(equation => (
          <div key={equation} className="overflow-x-auto text-xs text-primary/85">
            <EquationRenderer equation={equation} />
          </div>
        ))}
      </div>
    </div>
  );
}

function MetricTile({
  title,
  icon: Icon,
  value,
  detail,
}: {
  title: string;
  icon: ElementType;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-card/70 p-4">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-4 w-4 text-primary" />
        {title}
      </div>
      <div className="text-xl font-semibold text-foreground">{value}</div>
      <div className="mt-2 overflow-x-auto whitespace-nowrap text-xs text-primary/85">
        <EquationRenderer equation={detail} />
      </div>
    </div>
  );
}

function LineChart({
  title,
  series,
  centroid,
  height = CHART_HEIGHT,
}: {
  title: string;
  series: ChartSeries[];
  centroid?: number;
  height?: number;
}) {
  const allSamples = series.flatMap(item => item.samples);
  const minX = Math.min(...allSamples.map(sample => sample.x));
  const maxX = Math.max(...allSamples.map(sample => sample.x));
  const innerWidth = CHART_WIDTH - CHART_PADDING * 2;
  const innerHeight = height - CHART_PADDING * 2;
  const xScale = (x: number) => CHART_PADDING + ((x - minX) / Math.max(1e-9, maxX - minX)) * innerWidth;
  const yScale = (y: number, maxY: number) => height - CHART_PADDING - (y / Math.max(1e-9, maxY)) * innerHeight;

  return (
    <div className="overflow-hidden rounded-lg border border-border/40 bg-background/50">
      <svg viewBox={`0 0 ${CHART_WIDTH} ${height}`} role="img" aria-label={title} className="aspect-[18/7] w-full">
        <rect width={CHART_WIDTH} height={height} fill="hsl(var(--background))" />
        <line x1={CHART_PADDING} y1={height - CHART_PADDING} x2={CHART_WIDTH - CHART_PADDING} y2={height - CHART_PADDING} stroke="hsl(var(--border))" />
        <line x1={CHART_PADDING} y1={CHART_PADDING} x2={CHART_PADDING} y2={height - CHART_PADDING} stroke="hsl(var(--border))" />
        {series.map(item => {
          const seriesMax = Math.max(1e-9, ...item.samples.map(sample => sample.intensity));
          const path = item.samples
            .map((sample, index) => `${index === 0 ? 'M' : 'L'} ${xScale(sample.x).toFixed(2)} ${yScale(sample.intensity, seriesMax).toFixed(2)}`)
            .join(' ');
          return <path key={item.label} d={path} fill="none" stroke={item.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />;
        })}
        {centroid !== undefined && (
          <g>
            <line x1={xScale(centroid)} y1={CHART_PADDING} x2={xScale(centroid)} y2={height - CHART_PADDING} stroke="hsl(var(--success))" strokeDasharray="5 5" />
            <text x={xScale(centroid) + 8} y={CHART_PADDING + 16} fill="hsl(var(--success))" className="text-[12px] font-semibold">
              centroid
            </text>
          </g>
        )}
        <g>
          {series.map((item, index) => (
            <g key={item.label} transform={`translate(${CHART_PADDING + index * 120}, ${height - 12})`}>
              <circle r="4" fill={item.color} />
              <text x="10" y="4" fill="hsl(var(--muted-foreground))" className="text-[11px]">
                {item.label}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

function SectionCanvas({
  section,
}: {
  section: {
    components: Array<
      | { kind: 'rect'; sign: number; cx: number; cy: number; w: number; h: number; area: number; ix: number; iy: number }
      | { kind: 'circle'; sign: number; cx: number; cy: number; r: number; area: number; ix: number; iy: number }
    >;
    centroidX: number;
    centroidY: number;
    principalAngle: number;
  };
}) {
  const viewWidth = 720;
  const viewHeight = 420;
  const xMin = -115;
  const xMax = 115;
  const yMin = -86;
  const yMax = 86;
  const mapX = (x: number) => ((x - xMin) / (xMax - xMin)) * viewWidth;
  const mapY = (y: number) => viewHeight - ((y - yMin) / (yMax - yMin)) * viewHeight;
  const centroidX = mapX(section.centroidX);
  const centroidY = mapY(section.centroidY);
  const axisLength = 170;
  const axisDX = Math.cos(section.principalAngle) * axisLength;
  const axisDY = -Math.sin(section.principalAngle) * axisLength;

  return (
    <div className="overflow-hidden rounded-lg border border-border/40 bg-background/50">
      <svg viewBox={`0 0 ${viewWidth} ${viewHeight}`} role="img" aria-label="Composite section properties visualization" className="aspect-[12/7] w-full">
        <rect width={viewWidth} height={viewHeight} fill="hsl(var(--background))" />
        {section.components.map((component, index) => {
          if (component.kind === 'rect') {
            const x = mapX(component.cx - component.w / 2);
            const y = mapY(component.cy + component.h / 2);
            const width = mapX(component.cx + component.w / 2) - x;
            const height = mapY(component.cy - component.h / 2) - y;
            return (
              <rect
                key={`${component.kind}-${index}`}
                x={x}
                y={y}
                width={width}
                height={height}
                rx="3"
                fill="hsl(var(--primary))"
                fillOpacity="0.58"
                stroke="hsl(var(--primary))"
                strokeOpacity="0.95"
              />
            );
          }
          return (
            <circle
              key={`${component.kind}-${index}`}
              cx={mapX(component.cx)}
              cy={mapY(component.cy)}
              r={(component.r / (xMax - xMin)) * viewWidth}
              fill="hsl(var(--background))"
              stroke="hsl(var(--accent))"
              strokeWidth="2"
              strokeDasharray="5 5"
            />
          );
        })}
        <line x1={centroidX - axisDX / 2} y1={centroidY - axisDY / 2} x2={centroidX + axisDX / 2} y2={centroidY + axisDY / 2} stroke="hsl(var(--success))" strokeWidth="2" />
        <line x1={centroidX} y1="24" x2={centroidX} y2={viewHeight - 24} stroke="hsl(var(--muted-foreground))" strokeOpacity="0.22" strokeDasharray="4 6" />
        <line x1="24" y1={centroidY} x2={viewWidth - 24} y2={centroidY} stroke="hsl(var(--muted-foreground))" strokeOpacity="0.22" strokeDasharray="4 6" />
        <circle cx={centroidX} cy={centroidY} r="9" fill="hsl(var(--success))" />
        <text x={centroidX + 14} y={centroidY - 10} fill="hsl(var(--success))" className="text-[12px] font-semibold">
          centroid
        </text>
      </svg>
    </div>
  );
}

function StressCanvas({
  stress,
}: {
  stress: {
    cols: number;
    rows: number;
    points: GridPoint[];
    activeMoment: Moment2D;
  };
}) {
  const width = 720;
  const height = 420;
  const pad = 34;
  const cellW = (width - pad * 2) / stress.cols;
  const cellH = (height - pad * 2) / stress.rows;
  const maxValue = Math.max(1, ...stress.points.map(point => point.value ?? 0));
  const centroidX = pad + stress.activeMoment.centroidX * (width - pad * 2);
  const centroidY = pad + stress.activeMoment.centroidY * (height - pad * 2);

  return (
    <div className="overflow-hidden rounded-lg border border-border/40 bg-background/50">
      <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Stress hotspot heatmap" className="aspect-[12/7] w-full">
        <rect width={width} height={height} fill="hsl(var(--background))" />
        {stress.points.map((point, index) => {
          const value = point.value ?? 0;
          const opacity = clamp(value / maxValue, 0.08, 0.92);
          const fill = value > 1 ? 'hsl(var(--destructive))' : 'hsl(var(--primary))';
          const col = index % stress.cols;
          const row = Math.floor(index / stress.cols);
          return (
            <rect
              key={`${col}-${row}`}
              x={pad + col * cellW}
              y={pad + row * cellH}
              width={cellW + 0.4}
              height={cellH + 0.4}
              fill={fill}
              opacity={opacity}
            />
          );
        })}
        <circle cx={pad + 0.32 * (width - pad * 2)} cy={pad + 0.5 * (height - pad * 2)} r="34" fill="hsl(var(--background))" stroke="hsl(var(--accent))" strokeWidth="2" />
        <circle cx={centroidX} cy={centroidY} r="10" fill="hsl(var(--success))" />
        <circle cx={centroidX} cy={centroidY} r={stress.activeMoment.spread * (width - pad * 2)} fill="none" stroke="hsl(var(--success))" strokeOpacity="0.5" strokeDasharray="7 7" />
        <text x={centroidX + 14} y={centroidY - 12} fill="hsl(var(--success))" className="text-[12px] font-semibold">
          demand center
        </text>
      </svg>
    </div>
  );
}
