import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WalkthroughControls, StageHighlight, WALKTHROUGH_STEPS } from './backbone/WalkthroughOverlay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EquationRenderer } from '@/components/knowledge/EquationRenderer';
import { DomainType } from '@/types/physics';
import {
  ArrowRight,
  ArrowDown,
  Layers,
  BookOpen,
  Zap,
  Flame,
  Droplets,
  Activity,
  Cpu,
  Rocket,
} from 'lucide-react';

/* ── Domain-specific mapping of the generic conservation law ── */

interface BalanceLawMapping {
  domain: DomainType;
  label: string;
  icon: React.ReactNode;
  color: string; // tailwind token
  hslStroke: string;
  conservedQty: { symbol: string; name: string; unit: string };
  flux: { symbol: string; name: string; unit: string; law: string };
  source: { symbol: string; name: string; unit: string };
  intensity: { symbol: string; name: string; unit: string };
  genericEq: string;
  specificEq: string;
  constitutive: string;
  momentInterpretation: string;
}

const MAPPINGS: BalanceLawMapping[] = [
  {
    domain: 'structures',
    label: 'Structures',
    icon: <Layers className="h-5 w-5" />,
    color: 'structures',
    hslStroke: 'hsl(210, 100%, 60%)',
    conservedQty: { symbol: '\\psi', name: 'Displacement u(x)', unit: 'm' },
    flux: { symbol: 'J', name: 'Internal force V(x)', unit: 'N', law: 'V = EI·u\'\'\'' },
    source: { symbol: 's', name: 'Applied load w(x)', unit: 'N/m' },
    intensity: { symbol: 'I(x)', name: 'Force density w(x)', unit: 'N/m' },
    genericEq: '\\frac{\\partial \\psi}{\\partial t} + \\nabla \\cdot \\mathbf{J} = s',
    specificEq: '\\frac{dV}{dx} = -w(x)',
    constitutive: 'V(x) = \\int w(x)\\,dx,\\quad M(x) = \\int V(x)\\,dx',
    momentInterpretation: 'I₀ = total applied load (resultant force), x̄ = point of application, σ = load spread',
  },
  {
    domain: 'heat',
    label: 'Heat Transfer',
    icon: <Flame className="h-5 w-5" />,
    color: 'heat',
    hslStroke: 'hsl(20, 95%, 55%)',
    conservedQty: { symbol: '\\psi', name: 'Temperature T(x)', unit: 'K' },
    flux: { symbol: 'J', name: 'Heat flux q(x)', unit: 'W/m²', law: "q = -k∇T (Fourier's law)" },
    source: { symbol: 's', name: 'Volumetric generation Q̇', unit: 'W/m³' },
    intensity: { symbol: 'I(x)', name: 'Heat source Q̇(x)', unit: 'W/m²' },
    genericEq: '\\rho c_p \\frac{\\partial T}{\\partial t} + \\nabla \\cdot \\mathbf{q} = \\dot{Q}',
    specificEq: '\\rho c_p \\frac{\\partial T}{\\partial t} = k\\nabla^2 T + \\dot{Q}',
    constitutive: '\\mathbf{q} = -k\\nabla T \\quad \\text{(Fourier)}',
    momentInterpretation: 'I₀ = total heat generation, x̄ = thermal centroid, σ = heat spread',
  },
  {
    domain: 'fluids',
    label: 'Fluids',
    icon: <Droplets className="h-5 w-5" />,
    color: 'fluids',
    hslStroke: 'hsl(180, 70%, 50%)',
    conservedQty: { symbol: '\\psi', name: 'Momentum ρu', unit: 'kg/(m²·s)' },
    flux: { symbol: 'J', name: 'Stress tensor σ + ρuu', unit: 'Pa', law: 'σ = -pI + τ' },
    source: { symbol: 's', name: 'Body force ρg', unit: 'N/m³' },
    intensity: { symbol: 'I(x)', name: 'Pressure p(x)', unit: 'Pa' },
    genericEq: '\\frac{\\partial(\\rho \\mathbf{u})}{\\partial t} + \\nabla \\cdot (\\rho \\mathbf{u}\\mathbf{u}) = -\\nabla p + \\nabla \\cdot \\boldsymbol{\\tau} + \\rho\\mathbf{g}',
    specificEq: '\\nabla p = \\rho \\mathbf{g} \\quad \\text{(hydrostatic)}',
    constitutive: '\\boldsymbol{\\tau} = \\mu(\\nabla\\mathbf{u} + \\nabla\\mathbf{u}^T) \\quad \\text{(Newtonian)}',
    momentInterpretation: 'I₀ = total pressure resultant, x̄ = center of pressure, σ = pressure spread',
  },
  {
    domain: 'dynamics',
    label: 'Dynamics',
    icon: <Activity className="h-5 w-5" />,
    color: 'dynamics',
    hslStroke: 'hsl(265, 80%, 60%)',
    conservedQty: { symbol: '\\psi', name: 'Momentum p(t)', unit: 'kg·m/s' },
    flux: { symbol: 'J', name: 'Internal force F_int', unit: 'N', law: 'F = ma' },
    source: { symbol: 's', name: 'Applied force F(t)', unit: 'N' },
    intensity: { symbol: 'I(t)', name: 'Force / Dissipation F(t)', unit: 'N' },
    genericEq: '\\frac{dp}{dt} = F_{\\text{ext}}(t) - F_{\\text{int}}(t)',
    specificEq: 'm\\ddot{x} + c\\dot{x} + kx = F(t)',
    constitutive: 'F_{\\text{spring}} = kx,\\quad F_{\\text{damp}} = c\\dot{x}',
    momentInterpretation: 'I₀ = total impulse, t̄ = impulse centroid (timing), σ = impulse duration',
  },
  {
    domain: 'circuits',
    label: 'Circuits',
    icon: <Cpu className="h-5 w-5" />,
    color: 'circuits',
    hslStroke: 'hsl(45, 95%, 55%)',
    conservedQty: { symbol: '\\psi', name: 'Charge q(t)', unit: 'C' },
    flux: { symbol: 'J', name: 'Current i(t)', unit: 'A', law: 'i = dq/dt' },
    source: { symbol: 's', name: 'Source voltage / current', unit: 'V or A' },
    intensity: { symbol: 'I(x)', name: 'Power dissipation P(x)', unit: 'W' },
    genericEq: '\\frac{dq}{dt} = i(t),\\quad \\sum_k i_k = 0 \\;\\text{(KCL)}',
    specificEq: 'L\\frac{di}{dt} + Ri + \\frac{q}{C} = V_s(t)',
    constitutive: 'P = i^2 R \\quad \\text{(Joule heating)}',
    momentInterpretation: 'I₀ = total power dissipated, x̄ = dissipation centroid, σ = dissipation spread',
  },
  {
    domain: 'propulsion',
    label: 'Propulsion',
    icon: <Rocket className="h-5 w-5" />,
    color: 'propulsion',
    hslStroke: 'hsl(140, 70%, 50%)',
    conservedQty: { symbol: '\\psi', name: 'Momentum flux ṁu', unit: 'N' },
    flux: { symbol: 'J', name: 'Thrust T = ṁuₑ + (pₑ−p∞)Aₑ', unit: 'N', law: 'Momentum theorem' },
    source: { symbol: 's', name: 'Pressure thrust (pₑ−p∞)Aₑ', unit: 'N' },
    intensity: { symbol: 'I(x)', name: 'Thrust density ρu²', unit: 'N/m²' },
    genericEq: 'T = \\dot{m}u_e + (p_e - p_\\infty)A_e',
    specificEq: '\\frac{\\partial(\\rho u)}{\\partial t} + \\frac{\\partial(\\rho u^2 + p)}{\\partial x} = 0',
    constitutive: '\\dot{m} = \\rho_e u_e A_e,\\quad T_{\\text{sp}} = \\frac{T}{\\dot{m}g_0}',
    momentInterpretation: 'I₀ = total thrust, x̄ = thrust centroid, σ = thrust distribution width',
  },
];

/* ── Animated flow arrow ── */

function FlowArrow({
  color,
  label,
  delay = 0,
}: {
  color: string;
  label?: string;
  delay?: number;
}) {
  return (
    <div className="relative flex flex-col items-center w-full py-1">
      <svg width="40" height="28" viewBox="0 0 40 28" className="overflow-visible">
        {/* Track line */}
        <line x1="20" y1="0" x2="20" y2="28" stroke={color} strokeWidth="1.5" strokeOpacity="0.25" />
        {/* Arrowhead */}
        <polygon points="14,20 20,28 26,20" fill={color} fillOpacity="0.5" />
        {/* Pulsing particle */}
        <motion.circle
          cx="20"
          r="3"
          fill={color}
          initial={{ cy: 0, opacity: 0.9 }}
          animate={{ cy: 24, opacity: [0.9, 1, 0.4] }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            ease: 'easeInOut',
            delay,
          }}
        />
        {/* Glow */}
        <motion.circle
          cx="20"
          r="6"
          fill={color}
          initial={{ cy: 0, opacity: 0 }}
          animate={{ cy: 24, opacity: [0, 0.25, 0] }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            ease: 'easeInOut',
            delay,
          }}
        />
      </svg>
      {label && (
        <span
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full ml-2 text-[9px] font-mono tracking-wider uppercase"
          style={{ color, paddingLeft: 6 }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

/* ── Tri-flow: three parallel arrows for ψ, J, s ── */

function TriFlowArrow({ color }: { color: string }) {
  return (
    <div className="flex items-center justify-center gap-10 w-full py-1">
      {['ψ', 'J', 's'].map((sym, i) => (
        <div key={sym} className="relative flex flex-col items-center">
          <svg width="24" height="24" viewBox="0 0 24 24" className="overflow-visible">
            <line x1="12" y1="0" x2="12" y2="24" stroke={color} strokeWidth="1" strokeOpacity="0.2" />
            <polygon points="8,17 12,24 16,17" fill={color} fillOpacity="0.4" />
            <motion.circle
              cx="12"
              r="2.5"
              fill={color}
              initial={{ cy: 0, opacity: 0.8 }}
              animate={{ cy: 20, opacity: [0.8, 1, 0.3] }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.2,
              }}
            />
          </svg>
          <span className="text-[9px] font-mono mt-0.5" style={{ color }}>
            {sym}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ── Backbone diagram ── */

function BackboneDiagram({
  selected,
  walkthroughActive,
  walkthroughStageId,
}: {
  selected: BalanceLawMapping | null;
  walkthroughActive: boolean;
  walkthroughStageId: string;
}) {
  const arrowColor = selected ? selected.hslStroke : 'hsl(var(--primary))';
  const hl = (id: string) => ({ active: walkthroughActive, stageId: id, currentStageId: walkthroughStageId });

  return (
    <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          Conservation Law Backbone
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center gap-0">
          {/* Generic equation */}
          <StageHighlight {...hl('conservation')}>
            <div className="px-4 py-3 rounded-lg border border-primary/30 bg-primary/5 w-full text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                Universal Conservation Law
              </p>
              <div className="text-lg">
                <EquationRenderer equation="$\frac{\partial \psi}{\partial t} + \nabla \cdot \mathbf{J} = s$" />
              </div>
            </div>
          </StageHighlight>

          <TriFlowArrow color={arrowColor} />

          {/* Three pillars */}
          <StageHighlight {...hl('pillars')}>
            <div className="grid grid-cols-3 gap-3 w-full">
              <PillarCard label="Conserved Quantity" symbol="ψ" value={selected?.conservedQty.name} unit={selected?.conservedQty.unit} accent="primary" />
              <PillarCard label="Flux" symbol="J" value={selected?.flux.name} unit={selected?.flux.unit} accent="primary" />
              <PillarCard label="Source / Sink" symbol="s" value={selected?.source.name} unit={selected?.source.unit} accent="primary" />
            </div>
          </StageHighlight>

          <FlowArrow color={arrowColor} label="specialize" delay={0.3} />

          {/* Domain-specific equation */}
          <StageHighlight {...hl('domain-eq')}>
            <div
              className="px-4 py-3 rounded-lg border w-full text-center transition-colors duration-300"
              style={{
                borderColor: selected ? selected.hslStroke + '40' : 'hsl(var(--border))',
                backgroundColor: selected ? selected.hslStroke + '08' : 'transparent',
              }}
            >
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                {selected ? `${selected.label} Domain` : 'Select a domain'}
              </p>
              {selected ? (
                <div className="text-base">
                  <EquationRenderer equation={`$${selected.specificEq}$`} />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Click a domain card below</p>
              )}
            </div>
          </StageHighlight>

          <FlowArrow color={arrowColor} label="constitutive" delay={0.6} />

          {/* Intensity mapping */}
          <StageHighlight {...hl('constitutive')}>
            <div className="grid grid-cols-2 gap-3 w-full">
              <div
                className="px-3 py-2.5 rounded-lg border text-center transition-colors duration-300"
                style={{
                  borderColor: selected ? selected.hslStroke + '30' : 'hsl(var(--border))',
                  backgroundColor: selected ? selected.hslStroke + '06' : 'transparent',
                }}
              >
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Constitutive Law</p>
                {selected ? (
                  <div className="text-xs">
                    <EquationRenderer equation={`$${selected.constitutive}$`} />
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">—</p>
                )}
              </div>
              <div
                className="px-3 py-2.5 rounded-lg border text-center transition-colors duration-300"
                style={{
                  borderColor: selected ? selected.hslStroke + '30' : 'hsl(var(--border))',
                  backgroundColor: selected ? selected.hslStroke + '06' : 'transparent',
                }}
              >
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Intensity Field</p>
                {selected ? (
                  <p className="text-xs font-medium text-foreground">
                    {selected.intensity.symbol} → {selected.intensity.name}
                    <span className="text-muted-foreground ml-1">[{selected.intensity.unit}]</span>
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">—</p>
                )}
              </div>
            </div>
          </StageHighlight>

          <FlowArrow color="hsl(var(--accent))" label="integrate" delay={0.9} />

          {/* Moment ladder */}
          <StageHighlight {...hl('moments')}>
            <div className="px-4 py-3 rounded-lg border border-accent/30 bg-accent/5 w-full text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                Unified Moment Ladder
              </p>
              <div className="text-sm">
                <EquationRenderer equation="$I_n = \int x^n I(x)\,dx \quad \Rightarrow \quad I_0,\;\bar{x},\;\sigma,\;\gamma_1,\;\kappa$" />
              </div>
              {selected && (
                <p className="text-[11px] text-muted-foreground mt-2 italic">
                  {selected.momentInterpretation}
                </p>
              )}
            </div>
          </StageHighlight>
        </div>
      </CardContent>
    </Card>
  );
}

function PillarCard({
  label,
  symbol,
  value,
  unit,
  accent,
}: {
  label: string;
  symbol: string;
  value?: string;
  unit?: string;
  accent: string;
}) {
  return (
    <div className="px-2 py-2 rounded-lg border border-border/50 bg-muted/30 text-center">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className="text-lg font-mono text-primary font-semibold">{symbol}</p>
      {value ? (
        <p className="text-[11px] text-foreground mt-0.5">
          {value} <span className="text-muted-foreground">[{unit}]</span>
        </p>
      ) : (
        <p className="text-[11px] text-muted-foreground mt-0.5">—</p>
      )}
    </div>
  );
}

/* ── Domain selector cards ── */

function DomainCard({
  mapping,
  isSelected,
  onClick,
}: {
  mapping: BalanceLawMapping;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative p-4 rounded-xl border text-left transition-all duration-200 ${
        isSelected
          ? 'ring-2 shadow-lg'
          : 'border-border/50 hover:border-border'
      }`}
      style={{
        borderColor: isSelected ? mapping.hslStroke : undefined,
        boxShadow: isSelected ? `0 0 0 2px ${mapping.hslStroke}, 0 4px 20px ${mapping.hslStroke}20` : undefined,
        background: isSelected ? `${mapping.hslStroke}08` : undefined,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="p-2 rounded-lg"
          style={{ backgroundColor: mapping.hslStroke + '15', color: mapping.hslStroke }}
        >
          {mapping.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-sm text-foreground">{mapping.label}</h3>
            {isSelected && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0" style={{ borderColor: mapping.hslStroke, color: mapping.hslStroke }}>
                Active
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            <span className="font-mono">{mapping.conservedQty.symbol}</span> = {mapping.conservedQty.name}
          </p>
          <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground">
            <ArrowRight className="h-3 w-3" />
            <span className="font-mono">{mapping.intensity.symbol}</span> = {mapping.intensity.name}
          </div>
        </div>
      </div>
    </motion.button>
  );
}

/* ── Main component ── */

export function BalanceLawBackbone() {
  const [selectedDomain, setSelectedDomain] = useState<DomainType>('structures');
  const selected = MAPPINGS.find((m) => m.domain === selectedDomain) ?? null;

  const [walkthroughStep, setWalkthroughStep] = useState(-1); // -1 = inactive
  const walkthroughActive = walkthroughStep >= 0;
  const currentStageId = walkthroughActive ? WALKTHROUGH_STEPS[walkthroughStep].stageId : '';

  const startWalkthrough = useCallback(() => setWalkthroughStep(0), []);
  const exitWalkthrough = useCallback(() => setWalkthroughStep(-1), []);
  const nextStep = useCallback(() => setWalkthroughStep((s) => Math.min(s + 1, WALKTHROUGH_STEPS.length - 1)), []);
  const prevStep = useCallback(() => setWalkthroughStep((s) => Math.max(s - 1, 0)), []);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Balance-Law Backbone
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Every domain obeys the same conservation equation — click a domain to see how{' '}
            <span className="font-mono text-primary">∂ψ/∂t + ∇·J = s</span>{' '}
            specializes and feeds the unified moment ladder.
          </p>
        </div>
        {!walkthroughActive && (
          <Button
            size="sm"
            variant="outline"
            className="shrink-0 gap-1.5 border-primary/30 text-primary hover:bg-primary/10"
            onClick={startWalkthrough}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Guided Tour
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Domain cards */}
        <div className="lg:col-span-5 space-y-3">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Select Domain
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {MAPPINGS.map((m) => (
              <DomainCard
                key={m.domain}
                mapping={m}
                isSelected={selectedDomain === m.domain}
                onClick={() => setSelectedDomain(m.domain)}
              />
            ))}
          </div>
        </div>

        {/* Backbone diagram */}
        <div className="lg:col-span-7 space-y-3">
          <motion.div
            key={selectedDomain}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            <BackboneDiagram
              selected={selected}
              walkthroughActive={walkthroughActive}
              walkthroughStageId={currentStageId}
            />
          </motion.div>

          {/* Walkthrough controls */}
          {walkthroughActive && (
            <WalkthroughControls
              step={walkthroughStep}
              total={WALKTHROUGH_STEPS.length}
              onPrev={prevStep}
              onNext={nextStep}
              onExit={exitWalkthrough}
            />
          )}
        </div>
      </div>
    </div>
  );
}
