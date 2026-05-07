import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { SimulationCanvas } from './SimulationCanvas';
import { MomentDisplay } from './MomentDisplay';
import { JordanDisplay } from './JordanDisplay';
import { LoadingControls } from './LoadingControls';
import { LoadingProfile, LoadingParams, DomainType, JordanDecomposition } from '@/types/physics';
import { loadingProfiles, profilesByDomain } from '@/lib/physics/loadingProfiles';
import {
  readBooleanParam,
  readEnumParam,
  readNumberParam,
  readStringParam,
  writeQueryParams,
} from '@/lib/urlState';
import {
  generateField,
  calculateMoments,
  calculateNegativeOrderMoments,
  formatValue,
} from '@/lib/physics/momentCalculus';
import { generateSignedField, jordanDecompose } from '@/lib/physics/jordanDecomposition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, AlertTriangle, SplitSquareHorizontal, Activity, Target, Ruler } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const SIMULATOR_DOMAIN_META: Record<DomainType, {
  label: string;
  dot: string;
  badge: string;
  tint: string;
}> = {
  structures: {
    label: 'Structures',
    dot: 'bg-structures shadow-[0_0_20px_hsl(var(--structures)/0.65)]',
    badge: 'border-structures/30 bg-structures/10 text-structures',
    tint: 'from-structures/20',
  },
  heat: {
    label: 'Heat Transfer',
    dot: 'bg-heat shadow-[0_0_20px_hsl(var(--heat)/0.65)]',
    badge: 'border-heat/30 bg-heat/10 text-heat',
    tint: 'from-heat/20',
  },
  fluids: {
    label: 'Fluids',
    dot: 'bg-fluids shadow-[0_0_20px_hsl(var(--fluids)/0.65)]',
    badge: 'border-fluids/30 bg-fluids/10 text-fluids',
    tint: 'from-fluids/20',
  },
  dynamics: {
    label: 'Dynamics',
    dot: 'bg-dynamics shadow-[0_0_20px_hsl(var(--dynamics)/0.65)]',
    badge: 'border-dynamics/30 bg-dynamics/10 text-dynamics',
    tint: 'from-dynamics/20',
  },
  circuits: {
    label: 'Circuits',
    dot: 'bg-circuits shadow-[0_0_20px_hsl(var(--circuits)/0.65)]',
    badge: 'border-circuits/30 bg-circuits/10 text-circuits',
    tint: 'from-circuits/20',
  },
  propulsion: {
    label: 'Propulsion',
    dot: 'bg-propulsion shadow-[0_0_20px_hsl(var(--propulsion)/0.65)]',
    badge: 'border-propulsion/30 bg-propulsion/10 text-propulsion',
    tint: 'from-propulsion/20',
  },
};

const DOMAIN_VALUES: readonly DomainType[] = [
  'structures',
  'heat',
  'fluids',
  'dynamics',
  'circuits',
  'propulsion',
];

function getInitialDomain() {
  const requestedProfile = loadingProfiles.find(profile => profile.id === readStringParam('profile'));
  return requestedProfile?.domain ?? readEnumParam('domain', DOMAIN_VALUES, 'structures');
}

function getInitialProfile(domain: DomainType) {
  const requestedProfile = loadingProfiles.find(profile => profile.id === readStringParam('profile'));
  return requestedProfile ?? profilesByDomain[domain][0];
}

function getInitialParams(profile: LoadingProfile): LoadingParams {
  return {
    magnitude: readNumberParam('magnitude', profile.defaultParams.magnitude),
    length: readNumberParam('length', profile.defaultParams.length),
    ...(profile.defaultParams.position !== undefined
      ? { position: readNumberParam('position', profile.defaultParams.position) }
      : {}),
    ...(profile.defaultParams.width !== undefined
      ? { width: readNumberParam('width', profile.defaultParams.width) }
      : {}),
    ...(profile.defaultParams.startMagnitude !== undefined
      ? { startMagnitude: readNumberParam('start', profile.defaultParams.startMagnitude) }
      : {}),
    ...(profile.defaultParams.endMagnitude !== undefined
      ? { endMagnitude: readNumberParam('end', profile.defaultParams.endMagnitude) }
      : {}),
  };
}

export function MomentSimulator() {
  const [activeDomain, setActiveDomain] = useState<DomainType>(() => getInitialDomain());
  const [selectedProfile, setSelectedProfile] = useState<LoadingProfile>(() => getInitialProfile(getInitialDomain()));
  const [params, setParams] = useState<LoadingParams>(() => getInitialParams(getInitialProfile(getInitialDomain())));
  const [showCentroid, setShowCentroid] = useState(true);
  const [showDispersion, setShowDispersion] = useState(true);
  const [animated, setAnimated] = useState(() => readBooleanParam('animated1d', true));
  const [showNegativeOrder, setShowNegativeOrder] = useState(() => readBooleanParam('neg1d', true));
  const [showEffectiveWidth, setShowEffectiveWidth] = useState(() => readBooleanParam('weff1d', true));
  const [epsilon, setEpsilon] = useState(() => readNumberParam('eps1d', 0.05));
  const [jordanEnabled, setJordanEnabled] = useState(() => readBooleanParam('jordan', false));

  const isSigned = !!selectedProfile.signed;

  const { field, moments, negativeOrderMoments, jordan } = useMemo(() => {
    const field = isSigned
      ? generateSignedField(selectedProfile.generator, params, 300)
      : generateField(selectedProfile.generator, params, 300);

    const moments = calculateMoments(field);
    const scaledEpsilon = epsilon * params.length;
    const negativeOrderMoments = showNegativeOrder
      ? calculateNegativeOrderMoments(field, moments.centroid, moments.zerothMoment, scaledEpsilon)
      : undefined;

    const jordan: JordanDecomposition | undefined =
      jordanEnabled && isSigned ? jordanDecompose(field) : undefined;

    return { field, moments, negativeOrderMoments, jordan };
  }, [selectedProfile, params, epsilon, showNegativeOrder, jordanEnabled, isSigned]);

  const handleDomainChange = useCallback((domain: DomainType) => {
    setActiveDomain(domain);
    const newProfile = profilesByDomain[domain][0];
    setSelectedProfile(newProfile);
    setParams(newProfile.defaultParams);
  }, []);

  const handleReset = useCallback(() => {
    setParams(selectedProfile.defaultParams);
  }, [selectedProfile]);

  const units = useMemo(() => {
    const unitMap: Record<DomainType, { intensity: string; position: string }> = {
      structures: { intensity: 'N/m', position: 'm' },
      heat: { intensity: 'W/m^2', position: 'm' },
      fluids: { intensity: 'Pa', position: 'm' },
      dynamics: { intensity: 'N or J/s', position: 's' },
      circuits: { intensity: 'W', position: 'node' },
      propulsion: { intensity: 'N/m^2', position: 'm' },
    };
    return unitMap[activeDomain];
  }, [activeDomain]);

  const domainMeta = SIMULATOR_DOMAIN_META[activeDomain];
  const scaledEpsilon = epsilon * params.length;
  const effectiveWidth = negativeOrderMoments?.effectiveWidth2;

  useEffect(() => {
    writeQueryParams({
      domain: activeDomain,
      profile: selectedProfile.id,
      magnitude: params.magnitude,
      length: params.length,
      position: params.position,
      width: params.width,
      start: params.startMagnitude,
      end: params.endMagnitude,
      eps1d: epsilon,
      neg1d: showNegativeOrder,
      weff1d: showEffectiveWidth,
      animated1d: animated,
      jordan: jordanEnabled,
    });
  }, [
    activeDomain,
    selectedProfile.id,
    params,
    epsilon,
    showNegativeOrder,
    showEffectiveWidth,
    animated,
    jordanEnabled,
  ]);

  return (
    <div className="space-y-5">
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-lg border border-border/50 bg-gradient-to-br ${domainMeta.tint} via-card/85 to-card/70 p-4 shadow-lg`}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${domainMeta.dot}`} />
              <Badge variant="outline" className={domainMeta.badge}>
                {domainMeta.label}
              </Badge>
              <Badge variant="outline" className="border-border/50 bg-background/40 text-muted-foreground">
                {isSigned ? 'Signed field' : 'Nonnegative field'}
              </Badge>
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              1D Intensity Field Lab
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              A line-domain simulator for reading a load, flux, density, or signal as one object:
              resultant, centroid, spread, localization, and sign policy.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[520px]">
            <MetricTile
              icon={<Activity className="h-3.5 w-3.5" />}
              label="Resultant I0"
              value={formatValue(moments.zerothMoment)}
              tone="primary"
            />
            <MetricTile
              icon={<Target className="h-3.5 w-3.5" />}
              label="Centroid xbar"
              value={formatValue(moments.centroid)}
              unit={units.position}
              tone="accent"
            />
            <MetricTile
              icon={<Ruler className="h-3.5 w-3.5" />}
              label="Spread sigma"
              value={formatValue(moments.standardDeviation)}
              unit={units.position}
              tone="math"
            />
            <MetricTile
              icon={<AlertTriangle className="h-3.5 w-3.5" />}
              label="Localization"
              value={effectiveWidth && Number.isFinite(effectiveWidth) ? formatValue(effectiveWidth) : 'off'}
              unit={effectiveWidth && Number.isFinite(effectiveWidth) ? units.position : undefined}
              tone="warning"
            />
          </div>
        </div>
      </motion.section>

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[340px_minmax(0,1fr)_340px]">
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.05 }}
          className="space-y-4"
        >
          <Card className="overflow-hidden border-border/50 bg-card/80 backdrop-blur">
            <CardHeader className="border-b border-border/30 pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  1D Field Setup
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={handleReset}
                  aria-label="Reset 1D field parameters"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <LoadingControls
                selectedProfile={selectedProfile}
                params={params}
                onProfileChange={setSelectedProfile}
                onParamsChange={setParams}
                activeDomain={activeDomain}
                onDomainChange={handleDomainChange}
              />
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/75 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Canvas Layers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="centroid" className="text-sm">Centroid xbar</Label>
                <Switch id="centroid" checked={showCentroid} onCheckedChange={setShowCentroid} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="dispersion" className="text-sm">Spread band +/- sigma</Label>
                <Switch id="dispersion" checked={showDispersion} onCheckedChange={setShowDispersion} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="animated" className="text-sm">Animated field glow</Label>
                <Switch id="animated" checked={animated} onCheckedChange={setAnimated} />
              </div>
            </CardContent>
          </Card>

          <Card className={`border-border/50 bg-card/75 backdrop-blur ${isSigned ? 'border-primary/30' : ''}`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <SplitSquareHorizontal className="h-4 w-4 text-primary" />
                Sign Policy
                <Tooltip>
                  <TooltipTrigger>
                    <span className="cursor-help text-xs text-muted-foreground">(?)</span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">
                      Signed fields are split into positive and negative measures before the moment ladder is read.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="jordan" className="text-sm">Enable S+ / S- split</Label>
                <Switch
                  id="jordan"
                  checked={jordanEnabled}
                  onCheckedChange={setJordanEnabled}
                  disabled={!isSigned}
                />
              </div>
              {!isSigned && (
                <p className="rounded-md border border-border/30 bg-muted/20 px-2 py-1.5 text-xs text-muted-foreground">
                  Choose a signed profile marked +/- to activate the split.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-warning/30 bg-card/75 backdrop-blur">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-warning" />
                Inverse Moments
                <Tooltip>
                  <TooltipTrigger>
                    <span className="cursor-help text-xs text-muted-foreground">(?)</span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">
                      Negative-order moments require an epsilon resolution scale so localization remains finite.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="negOrder" className="text-sm">Compute mu_-n,epsilon</Label>
                <Switch id="negOrder" checked={showNegativeOrder} onCheckedChange={setShowNegativeOrder} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="effWidth" className="text-sm">Show w_eff band</Label>
                <Switch
                  id="effWidth"
                  checked={showEffectiveWidth}
                  onCheckedChange={setShowEffectiveWidth}
                  disabled={!showNegativeOrder}
                />
              </div>
              {showNegativeOrder && (
                <div className="space-y-2 rounded-md border border-warning/20 bg-warning/5 p-3">
                  <div className="flex items-center justify-between gap-4">
                    <Label className="text-sm">epsilon resolution</Label>
                    <span className="font-mono text-xs text-warning">
                      {(epsilon * 100).toFixed(1)}% of L
                    </span>
                  </div>
                  <Slider
                    value={[epsilon * 100]}
                    onValueChange={([v]) => setEpsilon(v / 100)}
                    min={0.5}
                    max={20}
                    step={0.5}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    epsilon = {formatValue(scaledEpsilon)} {units.position}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="min-w-0"
        >
          <Card className="overflow-hidden border-border/50 bg-card/85 shadow-xl backdrop-blur">
            <CardHeader className="border-b border-border/30 pb-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className={`h-2 w-2 rounded-full ${domainMeta.dot}`} />
                  Intensity Field Canvas
                </CardTitle>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="border-border/40 bg-background/40 text-muted-foreground">
                    {selectedProfile.dictionaryRef ?? 'Library ref'}
                  </Badge>
                  <Badge variant="outline" className={domainMeta.badge}>
                    {selectedProfile.name}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="h-[540px] p-3 md:p-4 xl:h-[640px]">
              <SimulationCanvas
                field={field}
                moments={moments}
                domain={activeDomain}
                showCentroid={showCentroid}
                showDispersion={showDispersion}
                showEffectiveWidth={showNegativeOrder && showEffectiveWidth}
                negativeOrderMoments={negativeOrderMoments}
                animated={animated}
                jordan={jordanEnabled ? jordan : undefined}
              />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="space-y-4"
        >
          <Card className="overflow-hidden border-border/50 bg-card/80 backdrop-blur">
            <CardHeader className="border-b border-border/30 pb-3">
              <CardTitle className="text-base">Moment Ladder</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <MomentDisplay
                moments={moments}
                negativeOrderMoments={negativeOrderMoments}
                domain={activeDomain}
                dictionaryRef={selectedProfile.dictionaryRef}
                units={units}
              />
            </CardContent>
          </Card>

          {jordan && (
            <Card className="overflow-hidden border-primary/30 bg-card/80 backdrop-blur">
              <CardContent className="pt-4">
                <JordanDisplay
                  jordan={jordan}
                  posUnit={units.position}
                  intUnit={units.intensity}
                />
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}

function MetricTile({
  icon,
  label,
  value,
  unit,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit?: string;
  tone: 'primary' | 'accent' | 'math' | 'warning';
}) {
  const toneClasses = {
    primary: 'border-primary/25 bg-primary/10 text-primary',
    accent: 'border-accent/25 bg-accent/10 text-accent',
    math: 'border-math/25 bg-math/10 text-math',
    warning: 'border-warning/25 bg-warning/10 text-warning',
  };

  return (
    <div className={`rounded-md border px-3 py-2 ${toneClasses[tone]}`}>
      <div className="mb-1 flex items-center gap-1.5 text-[11px] uppercase tracking-wide opacity-90">
        {icon}
        <span>{label}</span>
      </div>
      <div className="min-w-0 font-mono text-base font-semibold text-foreground">
        {value}
        {unit && <span className="ml-1 text-[11px] font-normal text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}
