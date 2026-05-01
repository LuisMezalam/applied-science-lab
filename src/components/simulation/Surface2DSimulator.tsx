import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  NegativeOrder2DMoments
} from '@/lib/physics/moment2D';
import { formatValue } from '@/lib/physics/momentCalculus';
import { DomainType } from '@/types/physics';
import { EquationRenderer } from '@/components/knowledge/EquationRenderer';

// ─── Domain-specific mapping for 2D surfaces ─────────────────────────
// Matches dictionary entries: M-002, M-003, M-005, M-014, M-015, M-016, M-018

interface Domain2DMapping {
  label: string;
  icon: typeof Building2;
  colorClass: string;
  badgeColor: string;
  dictRef: string;
  intensityName: string;         // What I(x,y) represents
  intensitySymbol: string;       // Symbol for I(x,y)
  intensityUnit: string;         // Unit of the surface intensity
  resultantName: string;         // What I₀ = ∬I dA represents
  resultantUnit: string;
  centroidName: string;          // Physical meaning of centroid
  centroidUnit: string;
  secondMomentName: string;      // What Ixx, Iyy represent
  secondMomentUnit: string;
  radiusOfGyrationName: string;
  effectiveRadiusInterpretation: string;
  interpretation: string;        // Domain-specific explanation
}

const domain2DMappings: Record<DomainType, Domain2DMapping> = {
  structures: {
    label: 'Structures',
    icon: Building2,
    colorClass: 'text-structures',
    badgeColor: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    dictRef: 'M-002',
    intensityName: 'Surface Pressure',
    intensitySymbol: 'p(x,y)',
    intensityUnit: 'kPa',
    resultantName: 'Total Force',
    resultantUnit: 'kN',
    centroidName: 'Center of Pressure',
    centroidUnit: 'm',
    secondMomentName: 'Second Moment of Force',
    secondMomentUnit: 'kN·m²',
    radiusOfGyrationName: 'Radius of gyration',
    effectiveRadiusInterpretation: 'Localization radius of pressure concentration',
    interpretation: 'Surface pressure p(x,y) acts on a plate or membrane. The resultant is the total force, the centroid is the center of pressure, and principal moments reveal directional bending stiffness requirements.',
  },
  heat: {
    label: 'Heat Transfer',
    icon: Flame,
    colorClass: 'text-heat',
    badgeColor: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
    dictRef: 'M-003',
    intensityName: 'Surface Heat Flux',
    intensitySymbol: 'q″(x,y)',
    intensityUnit: 'W/m²',
    resultantName: 'Total Heat Flow',
    resultantUnit: 'W',
    centroidName: 'Thermal Center',
    centroidUnit: 'm',
    secondMomentName: 'Second Moment of Flux',
    secondMomentUnit: 'W·m²',
    radiusOfGyrationName: 'Thermal spread radius',
    effectiveRadiusInterpretation: 'Effective radius of thermal concentration (hot-spot size)',
    interpretation: 'Surface heat flux q″(x,y) over a heated plate or boundary. The resultant gives total heat transfer rate, the centroid locates the thermal center, and inverse moments quantify hot-spot localization.',
  },
  fluids: {
    label: 'Fluids',
    icon: Droplets,
    colorClass: 'text-fluids',
    badgeColor: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/30',
    dictRef: 'M-005',
    intensityName: 'Hydrostatic Pressure',
    intensitySymbol: 'p(x,y)',
    intensityUnit: 'kPa',
    resultantName: 'Resultant Force',
    resultantUnit: 'kN',
    centroidName: 'Center of Pressure',
    centroidUnit: 'm',
    secondMomentName: 'Second Moment of Area',
    secondMomentUnit: 'kN·m²',
    radiusOfGyrationName: 'Pressure spread',
    effectiveRadiusInterpretation: 'Effective radius of pressure distribution on submerged surface',
    interpretation: 'Hydrostatic pressure p(x,y) on a submerged surface. The centroid shift from the area centroid captures the pressure center offset, critical for dam and gate design.',
  },
  dynamics: {
    label: 'Dynamics',
    icon: Activity,
    colorClass: 'text-primary',
    badgeColor: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
    dictRef: 'M-014',
    intensityName: 'Mass Density',
    intensitySymbol: 'ρ_s(x,y)',
    intensityUnit: 'kg/m²',
    resultantName: 'Total Mass',
    resultantUnit: 'kg',
    centroidName: 'Center of Mass',
    centroidUnit: 'm',
    secondMomentName: 'Mass Moment of Inertia',
    secondMomentUnit: 'kg·m²',
    radiusOfGyrationName: 'Radius of gyration',
    effectiveRadiusInterpretation: 'Effective radius for rotational inertia localization',
    interpretation: 'Surface mass density ρ_s(x,y) of a plate or lamina. The second moments give the mass moments of inertia Ixx, Iyy about principal axes — essential for rotational dynamics and vibration analysis.',
  },
  circuits: {
    label: 'Circuits',
    icon: Zap,
    colorClass: 'text-warning',
    badgeColor: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/30',
    dictRef: 'M-016',
    intensityName: 'Current Density',
    intensitySymbol: 'J(x,y)',
    intensityUnit: 'A/m²',
    resultantName: 'Total Current',
    resultantUnit: 'A',
    centroidName: 'Current Center',
    centroidUnit: 'm',
    secondMomentName: 'Second Moment of Current',
    secondMomentUnit: 'A·m²',
    radiusOfGyrationName: 'Current spread',
    effectiveRadiusInterpretation: 'Effective radius of current concentration (skin depth analogy)',
    interpretation: 'Surface current density J(x,y) through a conductor cross-section. The centroid locates the effective current center, and inverse moments quantify current crowding effects (analogous to skin depth).',
  },
  propulsion: {
    label: 'Propulsion',
    icon: Rocket,
    colorClass: 'text-success',
    badgeColor: 'bg-green-500/10 text-green-600 border-green-500/30',
    dictRef: 'M-018',
    intensityName: 'Exhaust Flux',
    intensitySymbol: 'ṁ″(x,y)',
    intensityUnit: 'kg/(m²·s)',
    resultantName: 'Mass Flow Rate',
    resultantUnit: 'kg/s',
    centroidName: 'Thrust Center',
    centroidUnit: 'm',
    secondMomentName: 'Second Moment of Flux',
    secondMomentUnit: 'kg·m²/s',
    radiusOfGyrationName: 'Exhaust spread',
    effectiveRadiusInterpretation: 'Effective nozzle exit radius for thrust localization',
    interpretation: 'Exhaust mass flux ṁ″(x,y) across a nozzle exit plane. The centroid is the thrust center, and anisotropy in principal moments indicates asymmetric nozzle flow (thrust vectoring).',
  },
};

const shapeOptions: { value: Shape2D; label: string; icon: React.ReactNode }[] = [
  { value: 'rectangle', label: 'Rectangle', icon: <Square className="h-4 w-4" /> },
  { value: 'circle', label: 'Circle', icon: <Circle className="h-4 w-4" /> },
  { value: 'triangle', label: 'Triangle', icon: <Triangle className="h-4 w-4" /> },
];

const loadingOptions = [
  { value: 'uniform', label: 'Uniform' },
  { value: 'linear-x', label: 'Linear (X)' },
  { value: 'linear-y', label: 'Linear (Y)' },
  { value: 'radial', label: 'Radial' },
  { value: 'parabolic', label: 'Parabolic' },
];

export function Surface2DSimulator() {
  const [activeDomain, setActiveDomain] = useState<DomainType>('structures');
  const [params, setParams] = useState<Shape2DParams>({
    shape: 'rectangle',
    width: 2,
    height: 1,
    radius: 1,
    base: 2,
    magnitude: 10,
    loadingType: 'uniform',
  });
  
  const [epsilonPercent, setEpsilonPercent] = useState(5);
  const [showEffectiveRadius, setShowEffectiveRadius] = useState(true);

  const dm = domain2DMappings[activeDomain];

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
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
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

  const svgWidth = 400;
  const svgHeight = 300;
  const toSvgX = (x: number) => ((x - bounds.minX) / (bounds.maxX - bounds.minX)) * svgWidth;
  const toSvgY = (y: number) => svgHeight - ((y - bounds.minY) / (bounds.maxY - bounds.minY)) * svgHeight;

  const getColor = (intensity: number) => {
    const t = intensity / maxIntensity;
    const r = Math.floor(255 * t);
    const g = Math.floor(200 * t + 55 * (1 - t));
    const b = Math.floor(255 * (1 - t));
    return `rgb(${r}, ${g}, ${b})`;
  };

  const DomainIcon = dm.icon;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <DomainIcon className={`h-5 w-5 ${dm.colorClass}`} />
            2D Surface — {dm.intensityName}
          </h2>
          <p className="text-sm text-muted-foreground">
            {dm.intensitySymbol} over Ω → ∬_Ω {dm.intensitySymbol} dA · Dict ref: {dm.dictRef}
          </p>
        </div>
        <Badge variant="outline" className={dm.badgeColor}>
          {dm.label}
        </Badge>
      </div>

      {/* Domain Selector */}
      <Card className="border-border/50 bg-card/60 backdrop-blur">
        <CardContent className="pt-4 pb-3">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">
            Engineering Domain
          </Label>
          <Tabs value={activeDomain} onValueChange={(v) => setActiveDomain(v as DomainType)}>
            <TabsList className="grid grid-cols-3 md:grid-cols-6 gap-1 h-auto p-1">
              {(Object.keys(domain2DMappings) as DomainType[]).map((domain) => {
                const mapping = domain2DMappings[domain];
                const Icon = mapping.icon;
                return (
                  <TabsTrigger
                    key={domain}
                    value={domain}
                    className="flex flex-col items-center gap-1 py-2 px-2 data-[state=active]:bg-primary/20"
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <Card className="border-border/50 bg-card/60 backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Shape & {dm.intensityName}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Shape Selection */}
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

            {/* Shape Dimensions */}
            {params.shape === 'rectangle' && (
              <>
                <div className="space-y-2">
                  <Label>Width: {params.width?.toFixed(1)} {dm.centroidUnit}</Label>
                  <Slider
                    value={[params.width || 2]}
                    onValueChange={([v]) => setParams(p => ({ ...p, width: v }))}
                    min={0.5}
                    max={4}
                    step={0.1}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Height: {params.height?.toFixed(1)} {dm.centroidUnit}</Label>
                  <Slider
                    value={[params.height || 1]}
                    onValueChange={([v]) => setParams(p => ({ ...p, height: v }))}
                    min={0.5}
                    max={3}
                    step={0.1}
                  />
                </div>
              </>
            )}

            {params.shape === 'circle' && (
              <div className="space-y-2">
                <Label>Radius: {params.radius?.toFixed(1)} {dm.centroidUnit}</Label>
                <Slider
                  value={[params.radius || 1]}
                  onValueChange={([v]) => setParams(p => ({ ...p, radius: v }))}
                  min={0.5}
                  max={2}
                  step={0.1}
                />
              </div>
            )}

            {params.shape === 'triangle' && (
              <>
                <div className="space-y-2">
                  <Label>Base: {params.base?.toFixed(1)} {dm.centroidUnit}</Label>
                  <Slider
                    value={[params.base || 2]}
                    onValueChange={([v]) => setParams(p => ({ ...p, base: v }))}
                    min={0.5}
                    max={4}
                    step={0.1}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Height: {params.height?.toFixed(1)} {dm.centroidUnit}</Label>
                  <Slider
                    value={[params.height || 1.5]}
                    onValueChange={([v]) => setParams(p => ({ ...p, height: v }))}
                    min={0.5}
                    max={3}
                    step={0.1}
                  />
                </div>
              </>
            )}

            {/* Loading Type */}
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
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Epsilon */}
            <div className="space-y-2">
              <Label>ε (regularization): {epsilonPercent.toFixed(1)}% of L = {epsilon.toFixed(3)} {dm.centroidUnit}</Label>
              <Slider
                value={[epsilonPercent]}
                onValueChange={([v]) => setEpsilonPercent(v)}
                min={0.5}
                max={20}
                step={0.5}
              />
              {epsilonPercent < 2 && (
                <div className="flex items-center gap-2 text-xs text-yellow-600 dark:text-yellow-500">
                  <AlertTriangle className="h-3 w-3" />
                  Small ε amplifies singularity effects
                </div>
              )}
            </div>

            {/* Show effective radius toggle */}
            <div className="flex items-center justify-between">
              <Label htmlFor="show-reff" className="text-sm">Show r_eff on canvas</Label>
              <Switch
                id="show-reff"
                checked={showEffectiveRadius}
                onCheckedChange={setShowEffectiveRadius}
              />
            </div>

            {/* Magnitude */}
            <div className="space-y-2">
              <Label>Magnitude: {params.magnitude.toFixed(1)} {dm.intensityUnit}</Label>
              <Slider
                value={[params.magnitude]}
                onValueChange={([v]) => setParams(p => ({ ...p, magnitude: v }))}
                min={1}
                max={50}
                step={1}
              />
            </div>
          </CardContent>
        </Card>

        {/* Visualization */}
        <Card className="border-border/50 bg-card/60 backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">{dm.intensityName} Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto bg-background/50 rounded-lg border border-border/30"
            >
              <defs>
                <pattern id="grid2d" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeOpacity="0.1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid2d)" />

              {points.map((p, i) => (
                <circle
                  key={i}
                  cx={toSvgX(p.x)}
                  cy={toSvgY(p.y)}
                  r={3}
                  fill={getColor(p.intensity)}
                  opacity={0.8}
                />
              ))}

              {showEffectiveRadius && isFinite(negativeOrderMoments.effectiveRadiusScalar) && (
                <ellipse
                  cx={toSvgX(moments.centroidX)}
                  cy={toSvgY(moments.centroidY)}
                  rx={Math.abs(toSvgX(moments.centroidX + negativeOrderMoments.effectiveRadiusX) - toSvgX(moments.centroidX))}
                  ry={Math.abs(toSvgY(moments.centroidY + negativeOrderMoments.effectiveRadiusY) - toSvgY(moments.centroidY))}
                  fill="rgba(34, 211, 238, 0.15)"
                  stroke="rgb(34, 211, 238)"
                  strokeWidth={2}
                  strokeDasharray="6,3"
                />
              )}

              {/* Centroid marker */}
              <g transform={`translate(${toSvgX(moments.centroidX)}, ${toSvgY(moments.centroidY)})`}>
                <circle r={8} fill="none" stroke="hsl(var(--primary))" strokeWidth={2} />
                <line x1={-12} x2={12} y1={0} y2={0} stroke="hsl(var(--primary))" strokeWidth={2} />
                <line x1={0} x2={0} y1={-12} y2={12} stroke="hsl(var(--primary))" strokeWidth={2} />
                <text y={-16} textAnchor="middle" className="fill-primary text-xs font-medium">
                  {dm.centroidName}
                </text>
              </g>

              {/* Axes labels */}
              <text x={svgWidth / 2} y={svgHeight - 5} textAnchor="middle" className="fill-muted-foreground text-xs">
                x ({dm.centroidUnit})
              </text>
              <text x={10} y={svgHeight / 2} textAnchor="middle" className="fill-muted-foreground text-xs" transform={`rotate(-90, 10, ${svgHeight / 2})`}>
                y ({dm.centroidUnit})
              </text>
            </svg>

            {/* Color legend */}
            <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
              <span>Low {dm.intensityName.toLowerCase()}</span>
              <div className="flex-1 mx-4 h-2 rounded" style={{
                background: 'linear-gradient(to right, rgb(55, 155, 255), rgb(255, 200, 0))'
              }} />
              <span>High {dm.intensityName.toLowerCase()}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Moment Results */}
      <Card className="border-border/50 bg-card/60 backdrop-blur">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">2D Moment Ladder — {dm.label}</CardTitle>
          <p className="text-xs text-muted-foreground">
            Moment hierarchy for {dm.intensitySymbol} · Dictionary ref: {dm.dictRef}
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MomentCard
              label={`${dm.resultantName} I₀`}
              value={moments.I0}
              unit={dm.resultantUnit}
              description={`∬ ${dm.intensitySymbol} dA`}
              closedForm={closedForm?.I0}
            />
            <MomentCard
              label={`${dm.centroidName} x̄`}
              value={moments.centroidX}
              unit={dm.centroidUnit}
              description={`(1/I₀) ∬ x·${dm.intensitySymbol} dA`}
              closedForm={closedForm?.centroidX}
            />
            <MomentCard
              label={`${dm.centroidName} ȳ`}
              value={moments.centroidY}
              unit={dm.centroidUnit}
              description={`(1/I₀) ∬ y·${dm.intensitySymbol} dA`}
              closedForm={closedForm?.centroidY}
            />
            <MomentCard
              label="Ixx (about ȳ)"
              value={moments.Ixx}
              unit={dm.secondMomentUnit}
              description={`∬(y-ȳ)²·${dm.intensitySymbol} dA`}
              closedForm={closedForm?.Ixx}
            />
            <MomentCard
              label="Iyy (about x̄)"
              value={moments.Iyy}
              unit={dm.secondMomentUnit}
              description={`∬(x-x̄)²·${dm.intensitySymbol} dA`}
              closedForm={closedForm?.Iyy}
            />
            <MomentCard
              label="Ixy (product)"
              value={moments.Ixy}
              unit={dm.secondMomentUnit}
              description={`∬(x-x̄)(y-ȳ)·${dm.intensitySymbol} dA`}
              closedForm={closedForm?.Ixy}
            />
            <MomentCard
              label="I₁ (principal)"
              value={moments.I1}
              unit={dm.secondMomentUnit}
              description="Max eigenvalue"
            />
            <MomentCard
              label="I₂ (principal)"
              value={moments.I2}
              unit={dm.secondMomentUnit}
              description="Min eigenvalue"
            />
            <MomentCard
              label="θ (principal axis)"
              value={moments.theta * 180 / Math.PI}
              unit="°"
              description="Principal angle"
            />
          </div>

          {/* Domain interpretation */}
          <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border/30">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">{dm.label} interpretation:</strong>{' '}
              {dm.interpretation}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Negative-Order Moments */}
      <Card className="border-border/50 bg-card/60 backdrop-blur border-l-4 border-l-cyan-500">
        <CardHeader className="pb-4">
          <CardTitle className="text-base flex items-center gap-2">
            <span>2D Inverse Moment Tensor — {dm.label}</span>
            <Badge variant="outline" className="text-xs bg-cyan-500/10 text-cyan-600 border-cyan-500/30">
              ε = {epsilon.toFixed(3)} {dm.centroidUnit}
            </Badge>
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Regularized inverse moments: μ₋₂,ε = ∬ (r² + ε²)⁻¹ f(x,y) dA
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MomentCard
              label="μ₋₂,ε (scalar)"
              value={negativeOrderMoments.mu_inv_scalar}
              unit={`${dm.centroidUnit}⁻²`}
              description="∬(r²+ε²)⁻¹f dA"
            />
            <MomentCard
              label="μ₋₂,xx,ε"
              value={negativeOrderMoments.mu_inv_xx}
              unit={`${dm.centroidUnit}⁻²`}
              description="X-directional"
            />
            <MomentCard
              label="μ₋₂,yy,ε"
              value={negativeOrderMoments.mu_inv_yy}
              unit={`${dm.centroidUnit}⁻²`}
              description="Y-directional"
            />
            <MomentCard
              label="r_eff (scalar)"
              value={negativeOrderMoments.effectiveRadiusScalar}
              unit={dm.centroidUnit}
              description="μ₋₂,ε^(-1/2)"
            />
            <MomentCard
              label="μ₋₂,₁,ε (principal)"
              value={negativeOrderMoments.mu_inv_1}
              unit={`${dm.centroidUnit}⁻²`}
              description="Max eigenvalue"
            />
            <MomentCard
              label="μ₋₂,₂,ε (principal)"
              value={negativeOrderMoments.mu_inv_2}
              unit={`${dm.centroidUnit}⁻²`}
              description="Min eigenvalue"
            />
            <MomentCard
              label="r_eff,x"
              value={negativeOrderMoments.effectiveRadiusX}
              unit={dm.centroidUnit}
              description="X effective radius"
            />
            <MomentCard
              label="r_eff,y"
              value={negativeOrderMoments.effectiveRadiusY}
              unit={dm.centroidUnit}
              description="Y effective radius"
            />
          </div>
          
          {/* Interpretation */}
          <div className="mt-4 p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/20">
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Localization ({dm.label}):</strong>{' '}
              {dm.effectiveRadiusInterpretation}. The effective radius r_eff = μ₋₂,ε^(-1/2) provides a 
              characteristic length scale — smaller values indicate more concentrated {dm.intensityName.toLowerCase()}.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MomentCard({
  label,
  value,
  unit,
  description,
  closedForm
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
      className="p-3 rounded-lg bg-background/50 border border-border/30"
    >
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-lg font-mono font-semibold text-foreground">
        {formatValue(value)} <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
      <div className="text-xs text-primary/70 mt-1">{description}</div>
      {hasClosedForm && (
        <div className="text-xs text-muted-foreground mt-1">
          Closed: {formatValue(closedForm)} {error > 0.1 && <span className="text-warning">({error.toFixed(1)}% err)</span>}
        </div>
      )}
    </motion.div>
  );
}
