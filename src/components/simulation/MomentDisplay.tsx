import { motion } from 'framer-motion';
import { MomentResults, NegativeOrderMoments, DomainType } from '@/types/physics';
import { formatValue, getMomentInterpretation } from '@/lib/physics/momentCalculus';
import { Info, AlertTriangle } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MomentDisplayProps {
  moments: MomentResults;
  negativeOrderMoments?: NegativeOrderMoments;
  domain: DomainType;
  dictionaryRef?: string;
  units?: {
    intensity: string;
    position: string;
  };
}

const domainStyles: Record<DomainType, string> = {
  structures: 'border-structures/30 bg-structures/5',
  heat: 'border-heat/30 bg-heat/5',
  fluids: 'border-fluids/30 bg-fluids/5',
  dynamics: 'border-dynamics/30 bg-dynamics/5',
  circuits: 'border-circuits/30 bg-circuits/5',
  propulsion: 'border-propulsion/30 bg-propulsion/5',
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

export function MomentDisplay({ moments, negativeOrderMoments, domain, dictionaryRef, units }: MomentDisplayProps) {
  const posUnit = units?.position || 'm';
  const intUnit = units?.intensity || 'N/m';

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-3"
    >
      {/* Dictionary cross-reference */}
      {dictionaryRef && (
        <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-primary/10 border border-primary/20 text-xs">
          <Info className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="text-muted-foreground">
            Dictionary entry: <span className="text-primary font-mono font-medium">{dictionaryRef}</span>
            {' — see Master Dictionary for full moment ladder & sign-handling policy'}
          </span>
        </div>
      )}

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

      {/* Negative-Order Moments Section (ε-regularized) */}
      {negativeOrderMoments && (
        <div>
          <h3 className="text-sm font-medium text-foreground/80 mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-warning" />
            Negative-Order Moments (ε-Regularized)
            <Tooltip>
              <TooltipTrigger>
                <AlertTriangle className="h-3.5 w-3.5 text-warning" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-xs">
                  Inverse-power moments diverge at singularities. The ε parameter acts as a 
                  resolution scale (sensor footprint, mesh size) to regularize the calculation.
                  Always report ε when using these metrics.
                </p>
              </TooltipContent>
            </Tooltip>
          </h3>
          
          <div className="mb-2 px-2 py-1.5 rounded bg-warning/10 border border-warning/20 text-xs text-warning-foreground">
            ε = {formatValue(negativeOrderMoments.epsilon)} {posUnit} (resolution scale)
          </div>
          
          <div className="grid gap-2">
            <MomentCard
              label="Central μ₋₁,ε"
              value={negativeOrderMoments.centralInverseMoment1}
              symbol="μ₋₁"
              interpretation={getMomentInterpretation(domain, 'negativeOrder')}
              unit={`${posUnit}⁻¹`}
              tooltip="∫(r² + ε²)^(-1/2) f(x) dx - measures concentration about centroid"
            />
            
            <MomentCard
              label="Central μ₋₂,ε"
              value={negativeOrderMoments.centralInverseMoment2}
              symbol="μ₋₂"
              interpretation="Stronger localization"
              unit={`${posUnit}⁻²`}
              tooltip="∫(r² + ε²)^(-1) f(x) dx - higher sensitivity to centering"
            />
            
            <div className="grid grid-cols-2 gap-2">
              <MomentCard
                label="Effective Width 1"
                value={negativeOrderMoments.effectiveWidth1}
                symbol="w₁"
                interpretation="From μ₋₁,ε"
                unit={posUnit}
                tooltip="w_eff = μ₋₁,ε^(-1) - characteristic width from first inverse moment"
              />
              
              <MomentCard
                label="Effective Width 2"
                value={negativeOrderMoments.effectiveWidth2}
                symbol="w₂"
                interpretation="From μ₋₂,ε"
                unit={posUnit}
                tooltip="w_eff = μ₋₂,ε^(-1/2) - characteristic width from second inverse moment"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <MomentCard
                label="Raw m₋₁,ε"
                value={negativeOrderMoments.rawInverseMoment1}
                symbol="m₋₁"
                interpretation="From origin"
                unit={`${posUnit}⁻¹`}
                tooltip="∫(x² + ε²)^(-1/2) f(x) dx - inverse moment about origin"
              />
              
              <MomentCard
                label="Raw m₋₂,ε"
                value={negativeOrderMoments.rawInverseMoment2}
                symbol="m₋₂"
                interpretation="From origin"
                unit={`${posUnit}⁻²`}
                tooltip="∫(x² + ε²)^(-1) f(x) dx - second inverse moment about origin"
              />
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
