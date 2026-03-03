import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { InverseMomentComparisonProps } from './inverse-moment/types';
import { useComparisonData, loadingLabels } from './inverse-moment/useComparisonData';
import { ComparisonTable } from './inverse-moment/ComparisonTable';
import { EffectiveRadiiChart } from './inverse-moment/EffectiveRadiiChart';
import { AnisotropyRadarChart } from './inverse-moment/AnisotropyRadarChart';
import { PrincipalMoments } from './inverse-moment/PrincipalMoments';

export function InverseMomentComparison({ loadingType, magnitude, epsilonPercent }: InverseMomentComparisonProps) {
  const comparisonData = useComparisonData(loadingType, magnitude, epsilonPercent);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="border-border/50 bg-card/60 backdrop-blur">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-math" />
              Shape Comparison: 3D Inverse Moments
            </CardTitle>
            <Badge variant="outline" className="bg-math/10 text-math border-math/30">
              {loadingLabels[loadingType]} Loading
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            ε = {epsilonPercent}% of characteristic length for each shape
          </p>
        </CardHeader>
        <CardContent>
          <ComparisonTable data={comparisonData} />
          <EffectiveRadiiChart comparisonData={comparisonData} />
          <AnisotropyRadarChart comparisonData={comparisonData} />
          <PrincipalMoments data={comparisonData} />
          <div className="mt-4 p-3 rounded-lg bg-muted/30 text-xs text-muted-foreground">
            <p>
              <strong>Interpretation:</strong> Higher μ₋₂,ε indicates more concentrated loading. 
              Smaller r_eff means tighter spatial localization. Anisotropic shapes (box, cylinder) 
              show directional variation in M_xx, M_yy, M_zz, while the sphere shows near-isotropy 
              with uniform loading.
            </p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
