import { motion } from 'framer-motion';
import { MomentResults, DomainType } from '@/types/physics';
import { formatValue, getMomentInterpretation } from '@/lib/physics/momentCalculus';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MomentDisplayProps {
  moments: MomentResults;
  domain: DomainType;
  units?: {
    intensity: string;
    position: string;
  };
}

const domainStyles: Record<DomainType, string> = {
  structures: 'border-structures/30 bg-structures/5',
  heat: 'border-heat/30 bg-heat/5',
  fluids: 'border-fluids/30 bg-fluids/5',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0 },
};

function MomentCard({
  label,
  value,
  symbol,
  interpretation,
  unit,
  highlight,
  tooltip,
}: {
  label: string;
  value: number;
  symbol: string;
  interpretation: string;
  unit?: string;
  highlight?: 'primary' | 'accent' | 'muted';
  tooltip?: string;
}) {
  const highlightStyles = {
    primary: 'border-primary/40 bg-primary/10',
    accent: 'border-accent/40 bg-accent/10',
    muted: 'border-muted-foreground/20 bg-muted/30',
  };

  return (
    <motion.div
      variants={itemVariants}
      className={`rounded-lg border p-3 ${highlight ? highlightStyles[highlight] : 'border-border/50 bg-card/50'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs text-muted-foreground uppercase tracking-wide">{label}</span>
            {tooltip && (
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-3 w-3 text-muted-foreground/60" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">{tooltip}</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          <div className="font-mono text-lg font-medium text-foreground">
            {formatValue(value)}
            {unit && <span className="text-xs text-muted-foreground ml-1">{unit}</span>}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">{interpretation}</div>
        </div>
        <div className="font-mono text-sm text-primary/80 shrink-0">
          {symbol}
        </div>
      </div>
    </motion.div>
  );
}

export function MomentDisplay({ moments, domain, units }: MomentDisplayProps) {
  const posUnit = units?.position || 'm';
  const intUnit = units?.intensity || 'N/m';

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-3"
    >
      {/* n-Moment Ladder Section */}
      <div className="mb-4">
        <h3 className="text-sm font-medium text-foreground/80 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          n-Moment Ladder
        </h3>
        
        <div className="grid gap-2">
          <MomentCard
            label="Zeroth Moment (n=0)"
            value={moments.zerothMoment}
            symbol="I₀"
            interpretation={getMomentInterpretation(domain, 'zeroth')}
            unit={intUnit}
            highlight="primary"
            tooltip="The integral of I(x) over the domain - represents the total resultant magnitude"
          />
          
          <MomentCard
            label="Centroid (n=1 raw)"
            value={moments.centroid}
            symbol="x̄"
            interpretation={getMomentInterpretation(domain, 'centroid')}
            unit={posUnit}
            highlight="accent"
            tooltip="The 'center of mass' of the intensity distribution - where the resultant effectively acts"
          />
          
          <MomentCard
            label="First Central Moment"
            value={moments.firstCentralMoment}
            symbol="μ₁"
            interpretation="Identically zero (centering identity)"
            highlight="muted"
            tooltip="Always zero when computed about the centroid - this is a fundamental mathematical identity"
          />
          
          <MomentCard
            label="Second Central Moment"
            value={moments.secondCentralMoment}
            symbol="σ²"
            interpretation={getMomentInterpretation(domain, 'second')}
            unit={`${posUnit}²`}
            tooltip="Variance of the distribution - measures how spread out the intensity is from the centroid"
          />
        </div>
      </div>

      {/* Higher Moments Section */}
      <div>
        <h3 className="text-sm font-medium text-foreground/80 mb-3 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-math" />
          Higher Statistical Moments
        </h3>
        
        <div className="grid grid-cols-2 gap-2">
          <MomentCard
            label="Std Deviation"
            value={moments.standardDeviation}
            symbol="σ"
            interpretation="Dispersion measure"
            unit={posUnit}
            tooltip="Square root of variance - same units as position"
          />
          
          <MomentCard
            label="Skewness (n=3)"
            value={moments.skewness}
            symbol="γ₁"
            interpretation={moments.skewness > 0.1 ? 'Right-skewed' : moments.skewness < -0.1 ? 'Left-skewed' : 'Symmetric'}
            tooltip="Measures asymmetry: positive means tail extends right, negative means left"
          />
          
          <MomentCard
            label="Kurtosis (n=4)"
            value={moments.kurtosis}
            symbol="γ₂"
            interpretation={moments.kurtosis > 3 ? 'Heavy tails' : moments.kurtosis < 3 ? 'Light tails' : 'Normal-like'}
            tooltip="Measures 'tailedness': 3 is normal distribution, higher means heavier tails"
          />
          
          <MomentCard
            label="First Raw Moment"
            value={moments.firstRawMoment}
            symbol="I₁"
            interpretation="Position-weighted integral"
            unit={`${intUnit}·${posUnit}`}
            tooltip="∫x·I(x)dx - used to compute the centroid"
          />
        </div>
      </div>
    </motion.div>
  );
}
