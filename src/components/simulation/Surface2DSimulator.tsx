import { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Square, Circle, Triangle, AlertTriangle, Building2, Flame, Droplets, Activity, Zap, Rocket } from 'lucide-react';
import {
  Shape2D,
  Shape2DParams,
  generate2DField,
  calculate2DMoments,
  getClosedFormMoments,
  calculate2DNegativeOrderMoments,
} from '@/lib/physics/moment2D';
import { formatValue } from '@/lib/physics/momentCalculus';
import { DomainType } from '@/types/physics';
import { EquationRenderer } from '@/components/knowledge/EquationRenderer';
import {
  readBooleanParam,
  readEnumParam,
  readNumberParam,
  writeQueryParams,
} from '@/lib/urlState';

interface Domain2DMapping {
  label: string;
  icon: typeof Building2;
  colorClass: string;
  badgeColor: string;
  dictRef: string;
  intensityName: string;
  intensitySymbol: string;
  intensitySymbolTex: string;
  intensityUnit: string;
  resultantName: string;
  resultantUnit: string;
  centroidName: string;
  centroidUnit: string;
  secondMomentName: string;
  secondMomentUnit: string;
  radiusOfGyrationName: string;
  effectiveRadiusInterpretation: string;
  interpretation: string;
}

const domain2DMappings: Record<DomainType, Domain2DMapping> = {
  structures: {
    label: 'Structures',
    icon: Building2,
    colorClass: 'text-structures',
    badgeColor: 'bg-structures/10 text-structures border-structures/30',
    dictRef: 'M-002',
    intensityName: 'Surface Pressure',
    intensitySymbol: 'p(x,y)',
    intensitySymbolTex: 'p(x,y)',
    intensityUnit: 'kPa',
    resultantName: 'Total Force',
    resultantUnit: 'kN',
    centroidName: 'Center of Pressure',
    centroidUnit: 'm',
    secondMomentName: 'Second Moment of Force',
    secondMomentUnit: 'kN*m^2',
    radiusOfGyrationName: 'Radius of gyration',
    effectiveRadiusInterpretation: 'Localization radius of pressure concentration',
    interpretation: 'Surface pressure p(x,y) acts on a plate or membrane. The resultant is the total force, the centroid is the center of pressure, and principal moments reveal directional bending demands.',
  },
  heat: {
    label: 'Heat Transfer',
    icon: Flame,
    colorClass: 'text-heat',
    badgeColor: 'bg-heat/10 text-heat border-heat/30',
    dictRef: 'M-003',
    intensityName: 'Surface Heat Flux',
    intensitySymbol: "q''(x,y)",
    intensitySymbolTex: "q''(x,y)",
    intensityUnit: 'W/m^2',
    resultantName: 'Total Heat Flow',
    resultantUnit: 'W',
    centroidName: 'Thermal Center',
    centroidUnit: 'm',
    secondMomentName: 'Second Moment of Flux',
    secondMomentUnit: 'W*m^2',
    radiusOfGyrationName: 'Thermal spread radius',
    effectiveRadiusInterpretation: 'Effective radius of thermal concentration',
    interpretation: "Surface heat flux q''(x,y) over a boundary. The resultant gives total heat transfer rate, the centroid locates the thermal center, and inverse moments quantify hot-spot localization.",
  },
  fluids: {
    label: 'Fluids',
    icon: Droplets,
    colorClass: 'text-fluids',
    badgeColor: 'bg-fluids/10 text-fluids border-fluids/30',
    dictRef: 'M-005',
    intensityName: 'Hydrostatic Pressure',
    intensitySymbol: 'p(x,y)',
    intensitySymbolTex: 'p(x,y)',
    intensityUnit: 'kPa',
    resultantName: 'Resultant Force',
    resultantUnit: 'kN',
    centroidName: 'Center of Pressure',
    centroidUnit: 'm',
    secondMomentName: 'Second Moment of Area',
    secondMomentUnit: 'kN*m^2',
    radiusOfGyrationName: 'Pressure spread',
    effectiveRadiusInterpretation: 'Effective radius of pressure distribution on a submerged surface',
    interpretation: 'Hydrostatic pressure p(x,y) on a submerged surface. The centroid shift from the area centroid captures the pressure center offset used in dam and gate design.',
  },
  dynamics: {
    label: 'Dynamics',
    icon: Activity,
    colorClass: 'text-dynamics',
    badgeColor: 'bg-dynamics/10 text-dynamics border-dynamics/30',
    dictRef: 'M-014',
    intensityName: 'Mass Density',
    intensitySymbol: 'rho_s(x,y)',
    intensitySymbolTex: '\\rho_s(x,y)',
    intensityUnit: 'kg/m^2',
    resultantName: 'Total Mass',
    resultantUnit: 'kg',
    centroidName: 'Center of Mass',
    centroidUnit: 'm',
    secondMomentName: 'Mass Moment of Inertia',
    secondMomentUnit: 'kg*m^2',
    radiusOfGyrationName: 'Radius of gyration',
    effectiveRadiusInterpretation: 'Effective radius for rotational inertia localization',
    interpretation: 'Surface mass density of a lamina. The second moments give mass moments of inertia about principal axes for rotational dynamics and vibration analysis.',
  },
  circuits: {
    label: 'Circuits',
    icon: Zap,
    colorClass: 'text-circuits',
    badgeColor: 'bg-circuits/10 text-circuits border-circuits/30',
    dictRef: 'M-016',
    intensityName: 'Current Density',
    intensitySymbol: 'J(x,y)',
    intensitySymbolTex: 'J(x,y)',
    intensityUnit: 'A/m^2',
    resultantName: 'Total Current',
    resultantUnit: 'A',
    centroidName: 'Current Center',
    centroidUnit: 'm',
    secondMomentName: 'Second Moment of Current',
    secondMomentUnit: 'A*m^2',
    radiusOfGyrationName: 'Current spread',
    effectiveRadiusInterpretation: 'Effective radius of current concentration',
    interpretation: 'Surface current density J(x,y) through a conductor cross-section. The centroid locates the effective current center, and inverse moments quantify current crowding.',
  },
  propulsion: {
    label: 'Propulsion',
    icon: Rocket,
    colorClass: 'text-propulsion',
    badgeColor: 'bg-propulsion/10 text-propulsion border-propulsion/30',
    dictRef: 'M-018',
    intensityName: 'Exhaust Flux',
    intensitySymbol: "mdot''(x,y)",
    intensitySymbolTex: "\\dot{m}''(x,y)",
    intensityUnit: 'kg/(m^2*s)',
    resultantName: 'Mass Flow Rate',
    resultantUnit: 'kg/s',
    centroidName: 'Thrust Center',
    centroidUnit: 'm',
    secondMomentName: 'Second Moment of Flux',
    secondMomentUnit: 'kg*m^2/s',
    radiusOfGyrationName: 'Exhaust spread',
    effectiveRadiusInterpretation: 'Effective nozzle exit radius for thrust localization',
    interpretation: 'Exhaust mass flux across a nozzle exit plane. The centroid is the thrust center, and anisotropy in principal moments indicates asymmetric nozzle flow.',
  },
};

const shapeOptions: { value: Shape2D; label: string; icon: React.ReactNode }[] = [
  { value: 'rectangle', label: 'Rectangle', icon: <Square className="h-4 w-4" /> },
  { value: 'circle', label: 'Circle', icon: <Circle className="h-4 w-4" /> },
  { value: 'triangle', label: 'Triangle', icon: <Triangle className="h-4 w-4" /> },
];

const loadingOptions = [
  { value: 'uniform', label: 'Uniform' },
  { value: 'linear-x', label: 'Linear X' },
  { value: 'linear-y', label: 'Linear Y' },
  { value: 'radial', label: 'Radial' },
  { value: 'parabolic', label: 'Parabolic' },
];

const DOMAIN_VALUES: readonly DomainType[] = [
  'structures',
  'heat',
  'fluids',
  'dynamics',
  'circuits',
  'propulsion',
];
const SHAPE_VALUES: readonly Shape2D[] = ['rectangle', 'circle', 'triangle'];
const LOADING_VALUES: readonly Shape2DParams['loadingType'][] = [
  'uniform',
  'linear-x',
  'linear-y',
  'radial',
  'parabolic',
];

function getInitial2DParams(): Shape2DParams {
  return {
    shape: readEnumParam('shape2d', SHAPE_VALUES, 'rectangle'),
    width: readNumberParam('width2d', 2),
    height: readNumberParam('height2d', 1),
    radius: readNumberParam('radius2d', 1),
    base: readNumberParam('base2d', 2),
    magnitude: readNumberParam('magnitude2d', 10),
    loadingType: readEnumParam('loading2d', LOADING_VALUES, 'uniform'),
  };
}

export function Surface2DSimulator() {
  const [activeDomain, setActiveDomain] = useState<DomainType>(() => readEnumParam('domain2d', DOMAIN_VALUES, 'structures'));
  const [params, setParams] = useState<Shape2DParams>(() => getInitial2DParams());
  const [epsilonPercent, setEpsilonPercent] = useState(() => readNumberParam('eps2d', 5));
  const [showEffectiveRadius, setShowEffectiveRadius] = useState(() => readBooleanParam('reff2d', true));

  const dm = domain2DMappings[activeDomain];
  const DomainIcon = dm.icon;

  const characteristicLength = useMemo(() => {
    switch (params.shape) {
      case 'rectangle':
        return Math.max(params.width || 2, params.height || 1);
      case 'circle':
        return (params.radius || 1) * 2;
      case 'triangle':
        return Math.max(params.base || 2, params.height || 1.5);
      default:
        return 1;
    }
  }, [params]);

  const epsilon = (epsilonPercent / 100) * characteristicLength;

  const { points, moments, closedForm, negativeOrderMoments } = useMemo(() => {
    const pts = generate2DField(params, 200);
    const mom = calculate2DMoments(pts, params.shape, params);
    const closed = getClosedFormMoments(params);
    const negMom = calculate2DNegativeOrderMoments(pts, mom.centroidX, mom.centroidY, mom.I0, epsilon);
    return { points: pts, moments: mom, closedForm: closed, negativeOrderMoments: negMom };
  }, [params, epsilon]);

  const bounds = useMemo(() => {
    if (points.length === 0) return { minX: -2, maxX: 2, minY: -1.5, maxY: 1.5 };
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    for (const p of points) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }

    const padX = (maxX - minX) * 0.2 || 0.5;
    const padY = (maxY - minY) * 0.2 || 0.5;
    return { minX: minX - padX, maxX: maxX + padX, minY: minY - padY, maxY: maxY + padY };
  }, [points]);

  const maxIntensity = useMemo(() => {
    return Math.max(...points.map(p => p.intensity), 0.001);
  }, [points]);

  const renderedPoints = useMemo(() => {
    const stride = Math.max(1, Math.ceil(points.length / 2800));
    return points.filter((_, index) => index % stride === 0);
  }, [points]);

  const svgWidth = 720;
  const svgHeight = 460;
  const toSvgX = (x: number) => ((x - bounds.minX) / (bounds.maxX - bounds.minX)) * svgWidth;
  const toSvgY = (y: number) => svgHeight - ((y - bounds.minY) / (bounds.maxY - bounds.minY)) * svgHeight;

  const getColor = (intensity: number) => {
    const t = intensity / maxIntensity;
    const hue = 205 - 165 * t;
    const lightness = 44 + 14 * t;
    return `hsl(${hue} 88% ${lightness}%)`;
  };

  const getPointRadius = (intensity: number) => {
    const t = intensity / maxIntensity;
    return 2.2 + 4.8 * Math.sqrt(Math.max(0, t));
  };

  useEffect(() => {
    writeQueryParams({
      domain2d: activeDomain,
      shape2d: params.shape,
      loading2d: params.loadingType,
      magnitude2d: params.magnitude,
      width2d: params.width,
      height2d: params.height,
      radius2d: params.radius,
      base2d: params.base,
      eps2d: epsilonPercent,
      reff2d: showEffectiveRadius,
    });
  }, [activeDomain, params, epsilonPercent, showEffectiveRadius]);

  const renderShapeOutline = () => {
    if (params.shape === 'rectangle') {
      const width = params.width || 2;
      const height = params.height || 1;
      const x = toSvgX(-width / 2);
      const y = toSvgY(height / 2);
      const w = toSvgX(width / 2) - toSvgX(-width / 2);
      const h = toSvgY(-height / 2) - toSvgY(height / 2);
      return <rect x={x} y={y} width={w} height={h} rx={10} fill="hsl(var(--primary) / 0.04)" stroke="hsl(var(--primary))" strokeOpacity={0.45} strokeWidth={2} />;
    }

    if (params.shape === 'circle') {
      const radius = params.radius || 1;
      return (
        <ellipse
          cx={toSvgX(0)}
          cy={toSvgY(0)}
          rx={Math.abs(toSvgX(radius) - toSvgX(0))}
          ry={Math.abs(toSvgY(radius) - toSvgY(0))}
          fill="hsl(var(--primary) / 0.04)"
          stroke="hsl(var(--primary))"
          strokeOpacity={0.45}
          strokeWidth={2}
        />
      );
    }

    const base = params.base || 2;
    const height = params.height || 1.5;
    const path = [
      `${toSvgX(-base / 2)},${toSvgY(0)}`,
      `${toSvgX(base / 2)},${toSvgY(0)}`,
      `${toSvgX(0)},${toSvgY(height)}`,
    ].join(' ');
    return <polygon points={path} fill="hsl(var(--primary) / 0.04)" stroke="hsl(var(--primary))" strokeOpacity={0.45} strokeWidth={2} />;
  };

  return (
    <div className="space-y-5">
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-lg border border-border/50 bg-[radial-gradient(circle_at_18%_0%,hsl(var(--primary)/0.16),transparent_34%),linear-gradient(135deg,hsl(var(--card)/0.92),hsl(var(--background)/0.86))] p-4 shadow-lg"
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <DomainIcon className={`h-5 w-5 ${dm.colorClass}`} />
              <Badge variant="outline" className={dm.badgeColor}>{dm.label}</Badge>
              <Badge variant="outline" className="border-border/50 bg-background/40 text-muted-foreground">2D domain Omega</Badge>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">2D Surface Field Lab</h2>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              <EquationRenderer equation={`$${dm.intensitySymbolTex}$ over $\\Omega$ -> $\\iint_\\Omega ${dm.intensitySymbolTex}\\, dA$`} />
              {' '}with centroid, principal spread, anisotropy, and inverse-radius localization.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[540px]">
            <SurfaceStat label={`${dm.resultantName} I0`} value={formatValue(moments.I0)} unit={dm.resultantUnit} tone="primary" />
            <SurfaceStat label="Centroid xbar" value={formatValue(moments.centroidX)} unit={dm.centroidUnit} tone="accent" />
            <SurfaceStat label="Centroid ybar" value={formatValue(moments.centroidY)} unit={dm.centroidUnit} tone="accent" />
            <SurfaceStat label="r_eff" value={formatValue(negativeOrderMoments.effectiveRadiusScalar)} unit={dm.centroidUnit} tone="warning" />
          </div>
        </div>
      </motion.section>

      <Card className="border-border/50 bg-card/70 backdrop-blur">
        <CardContent className="pt-4 pb-3">
          <Label className="mb-2 block text-xs uppercase tracking-wide text-muted-foreground">
            Engineering Domain
          </Label>
          <Tabs value={activeDomain} onValueChange={(v) => setActiveDomain(v as DomainType)}>
            <TabsList className="grid h-auto grid-cols-3 gap-1 p-1 md:grid-cols-6">
              {(Object.keys(domain2DMappings) as DomainType[]).map((domain) => {
                const mapping = domain2DMappings[domain];
                const Icon = mapping.icon;
                return (
                  <TabsTrigger
                    key={domain}
                    value={domain}
                    className="flex flex-col items-center gap-1 px-2 py-2 data-[state=active]:bg-primary/20"
                  >
                    <Icon className={`h-4 w-4 ${mapping.colorClass}`} />
                    <span className="text-xs">{mapping.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        <Card className="border-border/50 bg-card/75 backdrop-blur">
          <CardHeader className="border-b border-border/30 pb-3">
            <CardTitle className="text-base">Shape and Field Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            <div className="space-y-2">
              <Label>Shape</Label>
              <Tabs
                value={params.shape}
                onValueChange={(v) => setParams(p => ({ ...p, shape: v as Shape2D }))}
              >
                <TabsList className="w-full">
                  {shapeOptions.map(opt => (
                    <TabsTrigger key={opt.value} value={opt.value} className="flex-1 gap-2">
                      {opt.icon}
                      {opt.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {params.shape === 'rectangle' && (
              <>
                <SliderRow label="Width" value={params.width || 2} unit={dm.centroidUnit} min={0.5} max={4} step={0.1} onChange={(v) => setParams(p => ({ ...p, width: v }))} />
                <SliderRow label="Height" value={params.height || 1} unit={dm.centroidUnit} min={0.5} max={3} step={0.1} onChange={(v) => setParams(p => ({ ...p, height: v }))} />
              </>
            )}

            {params.shape === 'circle' && (
              <SliderRow label="Radius" value={params.radius || 1} unit={dm.centroidUnit} min={0.5} max={2} step={0.1} onChange={(v) => setParams(p => ({ ...p, radius: v }))} />
            )}

            {params.shape === 'triangle' && (
              <>
                <SliderRow label="Base" value={params.base || 2} unit={dm.centroidUnit} min={0.5} max={4} step={0.1} onChange={(v) => setParams(p => ({ ...p, base: v }))} />
                <SliderRow label="Height" value={params.height || 1.5} unit={dm.centroidUnit} min={0.5} max={3} step={0.1} onChange={(v) => setParams(p => ({ ...p, height: v }))} />
              </>
            )}

            <div className="space-y-2">
              <Label>{dm.intensityName} Distribution</Label>
              <Select
                value={params.loadingType}
                onValueChange={(v) => setParams(p => ({ ...p, loadingType: v as Shape2DParams['loadingType'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {loadingOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <SliderRow
              label="epsilon regularization"
              value={epsilonPercent}
              unit={`% of L = ${epsilon.toFixed(3)} ${dm.centroidUnit}`}
              min={0.5}
              max={20}
              step={0.5}
              onChange={setEpsilonPercent}
              tone="warning"
            />

            {epsilonPercent < 2 && (
              <div className="flex items-center gap-2 rounded-md border border-warning/20 bg-warning/5 px-2 py-1.5 text-xs text-warning">
                <AlertTriangle className="h-3 w-3" />
                Small epsilon amplifies singularity effects.
              </div>
            )}

            <div className="flex items-center justify-between gap-4 rounded-md border border-border/30 bg-background/30 px-3 py-2">
              <Label htmlFor="show-reff" className="text-sm">Show r_eff on canvas</Label>
              <Switch
                id="show-reff"
                checked={showEffectiveRadius}
                onCheckedChange={setShowEffectiveRadius}
              />
            </div>

            <SliderRow label="Magnitude" value={params.magnitude} unit={dm.intensityUnit} min={1} max={50} step={1} onChange={(v) => setParams(p => ({ ...p, magnitude: v }))} />
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-border/50 bg-card/80 backdrop-blur">
          <CardHeader className="border-b border-border/30 pb-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base">{dm.intensityName} Map</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={dm.badgeColor}>{params.shape}</Badge>
                <Badge variant="outline" className="border-border/40 bg-background/40 text-muted-foreground">
                  {renderedPoints.length.toLocaleString()} visual samples
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-4">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              role="img"
              aria-label={`${dm.label} 2D ${dm.intensityName} map with centroid and effective radius`}
              className="min-h-[380px] w-full rounded-lg border border-border/35 bg-background/70 shadow-inner"
            >
              <title>{`${dm.label} 2D ${dm.intensityName} map`}</title>
              <desc>
                {`Resultant ${formatValue(moments.I0)} ${dm.resultantUnit}; centroid (${formatValue(moments.centroidX)}, ${formatValue(moments.centroidY)}) ${dm.centroidUnit}; effective radius ${formatValue(negativeOrderMoments.effectiveRadiusScalar)} ${dm.centroidUnit}.`}
              </desc>
              <defs>
                <radialGradient id="surface2d-bg" cx="50%" cy="45%" r="70%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.13" />
                  <stop offset="70%" stopColor="hsl(var(--background))" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="hsl(var(--background))" stopOpacity="0.75" />
                </radialGradient>
                <pattern id="grid2d" width="36" height="36" patternUnits="userSpaceOnUse">
                  <path d="M 36 0 L 0 0 0 36" fill="none" stroke="hsl(var(--border))" strokeOpacity="0.28" />
                </pattern>
                <filter id="centroidGlow2d" x="-80%" y="-80%" width="260%" height="260%">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <rect width="100%" height="100%" fill="url(#surface2d-bg)" />
              <rect width="100%" height="100%" fill="url(#grid2d)" />

              {bounds.minX < 0 && bounds.maxX > 0 && (
                <line x1={toSvgX(0)} x2={toSvgX(0)} y1={0} y2={svgHeight} stroke="hsl(var(--border))" strokeOpacity={0.45} strokeDasharray="6 8" />
              )}
              {bounds.minY < 0 && bounds.maxY > 0 && (
                <line x1={0} x2={svgWidth} y1={toSvgY(0)} y2={toSvgY(0)} stroke="hsl(var(--border))" strokeOpacity={0.45} strokeDasharray="6 8" />
              )}

              {renderShapeOutline()}

              <g opacity={0.92}>
                {renderedPoints.map((p, i) => (
                  <circle
                    key={`${i}-${p.x}-${p.y}`}
                    cx={toSvgX(p.x)}
                    cy={toSvgY(p.y)}
                    r={getPointRadius(p.intensity)}
                    fill={getColor(p.intensity)}
                    opacity={0.42 + 0.5 * (p.intensity / maxIntensity)}
                  />
                ))}
              </g>

              {showEffectiveRadius && isFinite(negativeOrderMoments.effectiveRadiusScalar) && (
                <ellipse
                  cx={toSvgX(moments.centroidX)}
                  cy={toSvgY(moments.centroidY)}
                  rx={Math.abs(toSvgX(moments.centroidX + negativeOrderMoments.effectiveRadiusX) - toSvgX(moments.centroidX))}
                  ry={Math.abs(toSvgY(moments.centroidY + negativeOrderMoments.effectiveRadiusY) - toSvgY(moments.centroidY))}
                  fill="hsl(var(--fluids) / 0.1)"
                  stroke="hsl(var(--fluids))"
                  strokeWidth={2}
                  strokeDasharray="8 5"
                />
              )}

              <g transform={`translate(${toSvgX(moments.centroidX)}, ${toSvgY(moments.centroidY)})`} filter="url(#centroidGlow2d)">
                <circle r={18} fill="hsl(var(--accent) / 0.14)" stroke="hsl(var(--accent))" strokeWidth={1.5} />
                <circle r={5} fill="hsl(var(--accent))" />
                <line x1={-24} x2={24} y1={0} y2={0} stroke="hsl(var(--accent))" strokeWidth={1.8} strokeLinecap="round" />
                <line x1={0} x2={0} y1={-24} y2={24} stroke="hsl(var(--accent))" strokeWidth={1.8} strokeLinecap="round" />
                <text y={-30} textAnchor="middle" className="fill-accent text-xs font-medium">
                  centroid
                </text>
              </g>

              <text x={svgWidth / 2} y={svgHeight - 12} textAnchor="middle" className="fill-muted-foreground text-xs">
                x ({dm.centroidUnit})
              </text>
              <text x={18} y={svgHeight / 2} textAnchor="middle" className="fill-muted-foreground text-xs" transform={`rotate(-90, 18, ${svgHeight / 2})`}>
                y ({dm.centroidUnit})
              </text>
            </svg>

            <div className="mt-3 flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>Low {dm.intensityName.toLowerCase()}</span>
              <div
                className="h-2 flex-1 rounded-full border border-border/35"
                style={{ background: 'linear-gradient(to right, hsl(205 88% 44%), hsl(122 88% 50%), hsl(40 88% 58%))' }}
              />
              <span>High {dm.intensityName.toLowerCase()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 bg-card/70 backdrop-blur">
        <CardHeader className="border-b border-border/30 pb-3">
          <CardTitle className="text-base">2D Moment Ladder - {dm.label}</CardTitle>
          <p className="text-xs text-muted-foreground">
            Moment hierarchy for {dm.intensitySymbol}. Library ref: {dm.dictRef}
          </p>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <MomentCard label={`${dm.resultantName} I0`} value={moments.I0} unit={dm.resultantUnit} description={`double integral ${dm.intensitySymbol} dA`} closedForm={closedForm?.I0} />
            <MomentCard label={`${dm.centroidName} xbar`} value={moments.centroidX} unit={dm.centroidUnit} description={`(1/I0) integral x*${dm.intensitySymbol} dA`} closedForm={closedForm?.centroidX} />
            <MomentCard label={`${dm.centroidName} ybar`} value={moments.centroidY} unit={dm.centroidUnit} description={`(1/I0) integral y*${dm.intensitySymbol} dA`} closedForm={closedForm?.centroidY} />
            <MomentCard label="Ixx about ybar" value={moments.Ixx} unit={dm.secondMomentUnit} description={`integral (y-ybar)^2*${dm.intensitySymbol} dA`} closedForm={closedForm?.Ixx} />
            <MomentCard label="Iyy about xbar" value={moments.Iyy} unit={dm.secondMomentUnit} description={`integral (x-xbar)^2*${dm.intensitySymbol} dA`} closedForm={closedForm?.Iyy} />
            <MomentCard label="Ixy product" value={moments.Ixy} unit={dm.secondMomentUnit} description={`integral (x-xbar)(y-ybar)*${dm.intensitySymbol} dA`} closedForm={closedForm?.Ixy} />
            <MomentCard label="I1 principal" value={moments.I1} unit={dm.secondMomentUnit} description="Maximum eigenvalue" />
            <MomentCard label="I2 principal" value={moments.I2} unit={dm.secondMomentUnit} description="Minimum eigenvalue" />
            <MomentCard label="theta principal axis" value={moments.theta * 180 / Math.PI} unit="deg" description="Principal angle" />
          </div>

          <div className="mt-4 rounded-md border border-border/30 bg-muted/25 p-3">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">{dm.label} interpretation:</strong>{' '}
              {dm.interpretation}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-fluids border-border/50 bg-card/70 backdrop-blur">
        <CardHeader className="border-b border-border/30 pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <span>2D Inverse Moment Tensor - {dm.label}</span>
            <Badge variant="outline" className="border-fluids/30 bg-fluids/10 text-fluids">
              epsilon = {epsilon.toFixed(3)} {dm.centroidUnit}
            </Badge>
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Regularized inverse moments: mu_-2,epsilon = double integral (r^2 + epsilon^2)^-1 f(x,y) dA.
          </p>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <MomentCard label="mu_-2,epsilon scalar" value={negativeOrderMoments.mu_inv_scalar} unit={`${dm.centroidUnit}^-2`} description="isotropic localization" />
            <MomentCard label="mu_-2,xx,epsilon" value={negativeOrderMoments.mu_inv_xx} unit={`${dm.centroidUnit}^-2`} description="X-directional" />
            <MomentCard label="mu_-2,yy,epsilon" value={negativeOrderMoments.mu_inv_yy} unit={`${dm.centroidUnit}^-2`} description="Y-directional" />
            <MomentCard label="r_eff scalar" value={negativeOrderMoments.effectiveRadiusScalar} unit={dm.centroidUnit} description="mu_-2,epsilon^(-1/2)" />
            <MomentCard label="mu_-2,1,epsilon" value={negativeOrderMoments.mu_inv_1} unit={`${dm.centroidUnit}^-2`} description="Max principal inverse" />
            <MomentCard label="mu_-2,2,epsilon" value={negativeOrderMoments.mu_inv_2} unit={`${dm.centroidUnit}^-2`} description="Min principal inverse" />
            <MomentCard label="r_eff,x" value={negativeOrderMoments.effectiveRadiusX} unit={dm.centroidUnit} description="X effective radius" />
            <MomentCard label="r_eff,y" value={negativeOrderMoments.effectiveRadiusY} unit={dm.centroidUnit} description="Y effective radius" />
          </div>

          <div className="mt-4 rounded-md border border-fluids/20 bg-fluids/5 p-3">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Localization ({dm.label}):</strong>{' '}
              {dm.effectiveRadiusInterpretation}. Smaller r_eff means tighter spatial concentration.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SliderRow({
  label,
  value,
  unit,
  min,
  max,
  step,
  onChange,
  tone = 'primary',
}: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  tone?: 'primary' | 'warning';
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <Label className="text-sm">{label}</Label>
        <span className={`font-mono text-xs ${tone === 'warning' ? 'text-warning' : 'text-primary'}`}>
          {value.toFixed(step < 1 ? 1 : 0)} {unit}
        </span>
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
      />
    </div>
  );
}

function SurfaceStat({
  label,
  value,
  unit,
  tone,
}: {
  label: string;
  value: string;
  unit: string;
  tone: 'primary' | 'accent' | 'warning';
}) {
  const toneClasses = {
    primary: 'border-primary/25 bg-primary/10 text-primary',
    accent: 'border-accent/25 bg-accent/10 text-accent',
    warning: 'border-warning/25 bg-warning/10 text-warning',
  };

  return (
    <div className={`rounded-md border px-3 py-2 ${toneClasses[tone]}`}>
      <div className="mb-1 truncate text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="truncate font-mono text-sm font-semibold text-foreground">
        {value}
        <span className="ml-1 text-[10px] font-normal text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}

function MomentCard({
  label,
  value,
  unit,
  description,
  closedForm,
}: {
  label: string;
  value: number;
  unit: string;
  description: string;
  closedForm?: number;
}) {
  const hasClosedForm = closedForm !== undefined;
  const error = hasClosedForm && closedForm !== 0
    ? Math.abs((value - closedForm) / closedForm) * 100
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-md border border-border/35 bg-background/35 p-3"
    >
      <div className="mb-1 text-xs text-muted-foreground">{label}</div>
      <div className="font-mono text-lg font-semibold text-foreground">
        {formatValue(value)} <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
      <div className="mt-1 text-xs text-primary/75">{description}</div>
      {hasClosedForm && (
        <div className="mt-1 text-xs text-muted-foreground">
          Closed: {formatValue(closedForm)} {error > 0.1 && <span className="text-warning">({error.toFixed(1)}% err)</span>}
        </div>
      )}
    </motion.div>
  );
}
