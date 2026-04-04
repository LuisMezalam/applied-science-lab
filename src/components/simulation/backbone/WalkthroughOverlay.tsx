import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, BookOpen } from 'lucide-react';

export interface WalkthroughStep {
  stageId: string;
  title: string;
  description: string;
}

export const WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    stageId: 'conservation',
    title: 'Universal Conservation Law',
    description:
      'Every physical system obeys the same abstract balance: the rate of change of a conserved quantity ψ, plus the divergence of its flux J, equals a source term s.',
  },
  {
    stageId: 'pillars',
    title: 'Three Fundamental Pillars',
    description:
      'The abstract symbols ψ, J, and s map to concrete physical quantities in each domain — displacement, heat, momentum, charge, etc.',
  },
  {
    stageId: 'domain-eq',
    title: 'Domain-Specific Equation',
    description:
      'Substituting the domain\'s variables into the conservation law yields the governing PDE or ODE for that field — e.g., Fourier\'s equation for heat, Navier–Stokes for fluids.',
  },
  {
    stageId: 'constitutive',
    title: 'Constitutive & Intensity',
    description:
      'A constitutive law (e.g., Fourier, Hooke, Newton) closes the system. The resulting intensity field I(x) is the distribution we analyze with moments.',
  },
  {
    stageId: 'moments',
    title: 'Unified Moment Ladder',
    description:
      'Integrating xⁿ I(x) dx produces the moment ladder: I₀ (total), x̄ (centroid), σ (spread), γ₁ (skewness), κ (kurtosis) — identical math across every domain.',
  },
];

interface WalkthroughControlsProps {
  step: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onExit: () => void;
}

export function WalkthroughControls({ step, total, onPrev, onNext, onExit }: WalkthroughControlsProps) {
  const current = WALKTHROUGH_STEPS[step];
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={step}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.2 }}
        className="rounded-lg border border-primary/40 bg-card/95 backdrop-blur-md p-3 shadow-lg"
      >
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-semibold text-primary">
              Step {step + 1}/{total}
            </span>
          </div>
          <button onClick={onExit} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="text-sm font-medium text-foreground mb-0.5">{current.title}</p>
        <p className="text-xs text-muted-foreground leading-relaxed mb-2">{current.description}</p>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            disabled={step === 0}
            onClick={onPrev}
          >
            <ChevronLeft className="h-3 w-3 mr-0.5" /> Back
          </Button>
          <div className="flex gap-1 flex-1 justify-center">
            {Array.from({ length: total }).map((_, i) => (
              <div
                key={i}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === step ? 16 : 6,
                  backgroundColor: i === step ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground) / 0.3)',
                }}
              />
            ))}
          </div>
          <Button
            size="sm"
            variant={step === total - 1 ? 'default' : 'ghost'}
            className="h-7 px-2 text-xs"
            onClick={step === total - 1 ? onExit : onNext}
          >
            {step === total - 1 ? 'Done' : (
              <>Next <ChevronRight className="h-3 w-3 ml-0.5" /></>
            )}
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/** Highlight ring that wraps around the active walkthrough stage */
export function StageHighlight({
  active,
  stageId,
  currentStageId,
  children,
}: {
  active: boolean;
  stageId: string;
  currentStageId: string;
  children: React.ReactNode;
}) {
  const isHighlighted = active && stageId === currentStageId;

  return (
    <div className="relative w-full">
      {isHighlighted && (
        <motion.div
          layoutId="walkthrough-ring"
          className="absolute -inset-1.5 rounded-xl border-2 border-primary pointer-events-none z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          {/* Pulsing glow */}
          <motion.div
            className="absolute inset-0 rounded-xl border-2 border-primary/40"
            animate={{ scale: [1, 1.02, 1], opacity: [0.4, 0.15, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      )}
      <div className={isHighlighted ? 'relative z-20' : ''}>{children}</div>
    </div>
  );
}
