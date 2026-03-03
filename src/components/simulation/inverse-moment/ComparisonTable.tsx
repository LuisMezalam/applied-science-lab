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

export function ComparisonTable({ data }: ComparisonTableProps) {
  return (
    <div className="overflow-x-auto">
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
  );
}
