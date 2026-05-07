import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { formatValue } from '@/lib/physics/momentCalculus';
import { ComparisonData } from './types';

interface ComparisonTableProps {
  data: ComparisonData[];
}

type MetricDefinition = {
  label: string;
  tone?: string;
  getValue: (datum: ComparisonData) => string;
};

const SUMMARY_METRICS: MetricDefinition[] = [
  { label: 'I0', getValue: datum => formatValue(datum.I0) },
  {
    label: 'mu_-2,eps',
    tone: 'text-warning',
    getValue: datum => (datum.negMoments ? formatValue(datum.negMoments.scalarInverseMoment) : '-'),
  },
  {
    label: 'r_eff',
    tone: 'text-accent-foreground',
    getValue: datum => (datum.negMoments ? formatValue(datum.negMoments.effectiveRadius) : '-'),
  },
];

const TENSOR_METRICS: MetricDefinition[] = [
  {
    label: 'M_xx',
    getValue: datum => (datum.negMoments ? formatValue(datum.negMoments.inverseTensorXX) : '-'),
  },
  {
    label: 'M_yy',
    getValue: datum => (datum.negMoments ? formatValue(datum.negMoments.inverseTensorYY) : '-'),
  },
  {
    label: 'M_zz',
    getValue: datum => (datum.negMoments ? formatValue(datum.negMoments.inverseTensorZZ) : '-'),
  },
  {
    label: 'r_eff,x',
    getValue: datum => (datum.negMoments ? formatValue(datum.negMoments.effectiveRadiusX) : '-'),
  },
  {
    label: 'r_eff,y',
    getValue: datum => (datum.negMoments ? formatValue(datum.negMoments.effectiveRadiusY) : '-'),
  },
  {
    label: 'r_eff,z',
    getValue: datum => (datum.negMoments ? formatValue(datum.negMoments.effectiveRadiusZ) : '-'),
  },
];

export function ComparisonTable({ data }: ComparisonTableProps) {
  return (
    <>
      <div className="grid gap-3 md:hidden" aria-label="Shape inverse moment comparison cards">
        {data.map(datum => (
          <div key={datum.shape} className="rounded-lg border border-border/50 bg-muted/15 p-3">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2 text-sm font-medium">
                {datum.icon}
                <span className="truncate">{datum.label}</span>
              </div>
              <span className="rounded-md border border-border/50 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                {datum.shape}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {SUMMARY_METRICS.map(metric => (
                <MetricCell key={metric.label} metric={metric} datum={datum} />
              ))}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border/40 pt-3">
              {TENSOR_METRICS.map(metric => (
                <MetricCell key={metric.label} metric={metric} datum={datum} compact />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <Table>
        <TableHeader>
          <TableRow className="border-border/30">
            <TableHead className="w-28">Shape</TableHead>
            <TableHead className="text-right">
              <span className="flex items-center justify-end gap-1">
                I₀
                <Tooltip><TooltipTrigger><Info className="h-3 w-3 text-muted-foreground/60" /></TooltipTrigger>
                <TooltipContent>Total load (zeroth moment)</TooltipContent></Tooltip>
              </span>
            </TableHead>
            <TableHead className="text-right">
              <span className="flex items-center justify-end gap-1">
                μ₋₂,ε
                <Tooltip><TooltipTrigger><Info className="h-3 w-3 text-muted-foreground/60" /></TooltipTrigger>
                <TooltipContent>Scalar inverse moment</TooltipContent></Tooltip>
              </span>
            </TableHead>
            <TableHead className="text-right">
              <span className="flex items-center justify-end gap-1">
                r_eff
                <Tooltip><TooltipTrigger><Info className="h-3 w-3 text-muted-foreground/60" /></TooltipTrigger>
                <TooltipContent>Effective radius (m)</TooltipContent></Tooltip>
              </span>
            </TableHead>
            <TableHead className="text-right">M_xx</TableHead>
            <TableHead className="text-right">M_yy</TableHead>
            <TableHead className="text-right">M_zz</TableHead>
            <TableHead className="text-right">
              <span className="flex items-center justify-end gap-1">
                r_eff,x
                <Tooltip><TooltipTrigger><Info className="h-3 w-3 text-muted-foreground/60" /></TooltipTrigger>
                <TooltipContent>Directional effective radius X</TooltipContent></Tooltip>
              </span>
            </TableHead>
            <TableHead className="text-right">r_eff,y</TableHead>
            <TableHead className="text-right">r_eff,z</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((d, idx) => (
            <TableRow key={d.shape} className={idx % 2 === 0 ? 'bg-muted/20' : ''}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">{d.icon}{d.label}</div>
              </TableCell>
              <TableCell className="text-right font-mono text-sm">{formatValue(d.I0)}</TableCell>
              <TableCell className="text-right font-mono text-sm text-warning">
                {d.negMoments ? formatValue(d.negMoments.scalarInverseMoment) : '—'}
              </TableCell>
              <TableCell className="text-right font-mono text-sm text-accent-foreground">
                {d.negMoments ? formatValue(d.negMoments.effectiveRadius) : '—'}
              </TableCell>
              <TableCell className="text-right font-mono text-xs text-muted-foreground">
                {d.negMoments ? formatValue(d.negMoments.inverseTensorXX) : '—'}
              </TableCell>
              <TableCell className="text-right font-mono text-xs text-muted-foreground">
                {d.negMoments ? formatValue(d.negMoments.inverseTensorYY) : '—'}
              </TableCell>
              <TableCell className="text-right font-mono text-xs text-muted-foreground">
                {d.negMoments ? formatValue(d.negMoments.inverseTensorZZ) : '—'}
              </TableCell>
              <TableCell className="text-right font-mono text-xs">
                {d.negMoments ? formatValue(d.negMoments.effectiveRadiusX) : '—'}
              </TableCell>
              <TableCell className="text-right font-mono text-xs">
                {d.negMoments ? formatValue(d.negMoments.effectiveRadiusY) : '—'}
              </TableCell>
              <TableCell className="text-right font-mono text-xs">
                {d.negMoments ? formatValue(d.negMoments.effectiveRadiusZ) : '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    </>
  );
}

function MetricCell({
  metric,
  datum,
  compact = false,
}: {
  metric: MetricDefinition;
  datum: ComparisonData;
  compact?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-md border border-border/40 bg-card/45 p-2">
      <div className="truncate text-[10px] uppercase tracking-wide text-muted-foreground">{metric.label}</div>
      <div className={`truncate font-mono ${compact ? 'text-[11px]' : 'text-xs'} ${metric.tone ?? 'text-foreground'}`}>
        {metric.getValue(datum)}
      </div>
    </div>
  );
}
