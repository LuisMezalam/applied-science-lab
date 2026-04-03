import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { SimulationCanvas } from './SimulationCanvas';
import { MomentDisplay } from './MomentDisplay';
import { JordanDisplay } from './JordanDisplay';
import { LoadingControls } from './LoadingControls';
import { LoadingProfile, LoadingParams, DomainType, JordanDecomposition } from '@/types/physics';
import { profilesByDomain } from '@/lib/physics/loadingProfiles';
import { generateField, calculateMoments, calculateNegativeOrderMoments } from '@/lib/physics/momentCalculus';
import { generateSignedField, jordanDecompose, fieldHasNegativeValues } from '@/lib/physics/jordanDecomposition';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { RotateCcw, AlertTriangle, SplitSquareHorizontal } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function MomentSimulator() {
  const [activeDomain, setActiveDomain] = useState<DomainType>('structures');
  const [selectedProfile, setSelectedProfile] = useState<LoadingProfile>(profilesByDomain.structures[0]);
  const [params, setParams] = useState<LoadingParams>(profilesByDomain.structures[0].defaultParams);
  const [showCentroid, setShowCentroid] = useState(true);
  const [showDispersion, setShowDispersion] = useState(true);
  const [animated, setAnimated] = useState(true);
  const [showNegativeOrder, setShowNegativeOrder] = useState(true);
  const [showEffectiveWidth, setShowEffectiveWidth] = useState(true);
  const [epsilon, setEpsilon] = useState(0.05);
  const [jordanEnabled, setJordanEnabled] = useState(false);

  const isSigned = !!selectedProfile.signed;

  // Generate field and calculate moments
  const { field, moments, negativeOrderMoments, jordan } = useMemo(() => {
    // Use signed field generator for signed profiles
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
      heat: { intensity: 'W/m²', position: 'm' },
      fluids: { intensity: 'Pa', position: 'm' },
      dynamics: { intensity: 'N or J/s', position: 's' },
      circuits: { intensity: 'W', position: 'node' },
      propulsion: { intensity: 'N/m²', position: 'm' },
    };
    return unitMap[activeDomain];
  }, [activeDomain]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
      {/* Left Panel - Controls */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.1 }}
        className="lg:col-span-3 space-y-4"
      >
        <Card className="border-border/50 bg-card/80 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Loading Configuration</span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
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

        {/* Display Options */}
        <Card className="border-border/50 bg-card/80 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Display Options</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="centroid" className="text-sm">Show Centroid (x̄)</Label>
              <Switch id="centroid" checked={showCentroid} onCheckedChange={setShowCentroid} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="dispersion" className="text-sm">Show ±σ Region</Label>
              <Switch id="dispersion" checked={showDispersion} onCheckedChange={setShowDispersion} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="animated" className="text-sm">Animate Glow</Label>
              <Switch id="animated" checked={animated} onCheckedChange={setAnimated} />
            </div>
          </CardContent>
        </Card>

        {/* Jordan Decomposition Controls */}
        <Card className={`border-border/50 bg-card/80 backdrop-blur ${isSigned ? 'border-primary/30' : ''}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <SplitSquareHorizontal className="h-4 w-4 text-primary" />
              Jordan Decomposition
              <Tooltip>
                <TooltipTrigger>
                  <span className="text-xs text-muted-foreground cursor-help">(?)</span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    Splits a signed field I(x) into S⁺ = max(I, 0) and S⁻ = max(−I, 0),
                    then computes separate moment ladders for each component.
                    Select a signed profile (marked with ±) to use this feature.
                  </p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="jordan" className="text-sm">Enable S⁺/S⁻ Split</Label>
              <Switch
                id="jordan"
                checked={jordanEnabled}
                onCheckedChange={setJordanEnabled}
                disabled={!isSigned}
              />
            </div>
            {!isSigned && (
              <p className="text-xs text-muted-foreground">
                Select a signed profile (marked ±) to enable decomposition.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Negative-Order Moments Controls */}
        <Card className="border-warning/30 bg-card/80 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Negative-Order (ε-Regularized)
              <Tooltip>
                <TooltipTrigger>
                  <span className="text-xs text-muted-foreground cursor-help">(?)</span>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    Inverse-power moments require regularization to avoid divergence at the centroid.
                    The ε parameter represents a physical resolution scale.
                  </p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="negOrder" className="text-sm">Compute μ₋ₖ,ε</Label>
              <Switch id="negOrder" checked={showNegativeOrder} onCheckedChange={setShowNegativeOrder} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="effWidth" className="text-sm">Show w_eff on Canvas</Label>
              <Switch id="effWidth" checked={showEffectiveWidth} onCheckedChange={setShowEffectiveWidth} disabled={!showNegativeOrder} />
            </div>
            {showNegativeOrder && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">ε (Resolution Scale)</Label>
                  <span className="text-xs font-mono text-muted-foreground">
                    {(epsilon * 100).toFixed(1)}% of L
                  </span>
                </div>
                <Slider
                  value={[epsilon * 100]}
                  onValueChange={([v]) => setEpsilon(v / 100)}
                  min={0.5} max={20} step={0.5}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  ε = {(epsilon * params.length).toFixed(4)} m
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Center Panel - Canvas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="lg:col-span-6"
      >
        <Card className="border-border/50 bg-card/80 backdrop-blur h-full">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full bg-${activeDomain}`} />
              Intensity Field Visualization
              {isSigned && (
                <span className="text-xs font-normal text-muted-foreground ml-2">± signed field</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[calc(100%-4rem)]">
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

      {/* Right Panel - Moment Results */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        className="lg:col-span-3 space-y-4"
      >
        <Card className="border-border/50 bg-card/80 backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Moment Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <MomentDisplay
              moments={moments}
              negativeOrderMoments={negativeOrderMoments}
              domain={activeDomain}
              dictionaryRef={selectedProfile.dictionaryRef}
              units={units}
            />
          </CardContent>
        </Card>

        {/* Jordan Decomposition Results */}
        {jordan && (
          <Card className="border-primary/30 bg-card/80 backdrop-blur">
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
  );
}
