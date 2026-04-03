import { motion } from 'framer-motion';
import { MomentResults, JordanDecomposition } from '@/types/physics';
import { formatValue } from '@/lib/physics/momentCalculus';
import { SplitSquareHorizontal, Plus, Minus, Scale } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface JordanDisplayProps {
  jordan: JordanDecomposition;
  posUnit: string;
  intUnit: string;
}

function MiniLadder({ label, icon, moments, posUnit, intUnit, accentClass }: {
  label: string;
  icon: React.ReactNode;
  moments: MomentResults;
  posUnit: string;
  intUnit: string;
  accentClass: string;
}) {
  return (
    <div className={`rounded-lg border p-3 space-y-2 ${accentClass}`}>
      <div className="flex items-center gap-2 text-sm font-medium">
        {icon}
        {label}
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono">
        <span className="text-muted-foreground">I₀</span>
        <span className="text-foreground">{formatValue(moments.zerothMoment)} {intUnit}</span>
        <span className="text-muted-foreground">x̄</span>
        <span className="text-foreground">{formatValue(moments.centroid)} {posUnit}</span>
        <span className="text-muted-foreground">σ</span>
        <span className="text-foreground">{formatValue(moments.standardDeviation)} {posUnit}</span>
        <span className="text-muted-foreground">γ₁</span>
        <span className="text-foreground">{formatValue(moments.skewness)}</span>
        <span className="text-muted-foreground">κ</span>
        <span className="text-foreground">{formatValue(moments.kurtosis)}</span>
      </div>
    </div>
  );
}

export function JordanDisplay({ jordan, posUnit, intUnit }: JordanDisplayProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-3"
    >
      <h3 className="text-sm font-medium text-foreground/80 flex items-center gap-2">
        <SplitSquareHorizontal className="h-4 w-4 text-primary" />
        Jordan Decomposition
        <Tooltip>
          <TooltipTrigger>
            <span className="text-xs text-muted-foreground cursor-help">(?)</span>
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            <p className="text-xs">
              I(x) = S⁺(x) − S⁻(x) where S⁺ = max(I, 0) and S⁻ = max(−I, 0).
              Each component gets its own moment ladder.
            </p>
          </TooltipContent>
        </Tooltip>
      </h3>

      {/* Summary metrics */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg border border-border/50 bg-card/50 p-2">
          <div className="text-[10px] text-muted-foreground uppercase">Total Variation</div>
          <div className="text-sm font-mono font-medium text-foreground">{formatValue(jordan.totalVariation)}</div>
        </div>
        <div className="rounded-lg border border-border/50 bg-card/50 p-2">
          <div className="text-[10px] text-muted-foreground uppercase">Net Resultant</div>
          <div className="text-sm font-mono font-medium text-foreground">{formatValue(jordan.netResultant)}</div>
        </div>
        <div className="rounded-lg border border-border/50 bg-card/50 p-2">
          <div className="text-[10px] text-muted-foreground uppercase">Signed Ratio</div>
          <div className="text-sm font-mono font-medium text-foreground">{(jordan.signedRatio * 100).toFixed(1)}%</div>
        </div>
      </div>

      {/* Side-by-side moment ladders */}
      <MiniLadder
        label="S⁺ — Positive Part"
        icon={<Plus className="h-3.5 w-3.5 text-emerald-400" />}
        moments={jordan.positiveMoments}
        posUnit={posUnit}
        intUnit={intUnit}
        accentClass="border-emerald-500/30 bg-emerald-500/5"
      />
      <MiniLadder
        label="S⁻ — Negative Part"
        icon={<Minus className="h-3.5 w-3.5 text-rose-400" />}
        moments={jordan.negativeMoments}
        posUnit={posUnit}
        intUnit={intUnit}
        accentClass="border-rose-500/30 bg-rose-500/5"
      />

      {/* Centroid comparison */}
      {jordan.positiveMoments.zerothMoment > 0 && jordan.negativeMoments.zerothMoment > 0 && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-medium text-primary">
            <Scale className="h-3.5 w-3.5" />
            Centroid Separation
          </div>
          <div className="text-xs text-muted-foreground">
            Δx̄ = x̄⁺ − x̄⁻ ={' '}
            <span className="text-foreground font-mono">
              {formatValue(jordan.positiveMoments.centroid - jordan.negativeMoments.centroid)} {posUnit}
            </span>
          </div>
          <div className="text-[10px] text-muted-foreground">
            The spatial separation between positive and negative load centers reveals the internal couple structure.
          </div>
        </div>
      )}
    </motion.div>
  );
}
