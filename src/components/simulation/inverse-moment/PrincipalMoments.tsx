import { formatValue } from '@/lib/physics/momentCalculus';
import { ComparisonData } from './types';

export function PrincipalMoments({ data }: { data: ComparisonData[] }) {
  return (
    <div className="mt-6 pt-4 border-t border-border/30">
      <h4 className="text-sm font-medium text-foreground/80 mb-3 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
        Principal Inverse Moments
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {data.map(d => (
          <div key={d.shape} className="rounded-lg border border-border/50 bg-card/50 p-3">
            <div className="flex items-center gap-2 mb-2">
              {d.icon}
              <span className="text-sm font-medium">{d.label}</span>
            </div>
            {d.negMoments && (
              <div className="space-y-1 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">λ₁:</span>
                  <span className="text-primary">{formatValue(d.negMoments.inversePrincipal1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">λ₂:</span>
                  <span>{formatValue(d.negMoments.inversePrincipal2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">λ₃:</span>
                  <span>{formatValue(d.negMoments.inversePrincipal3)}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
