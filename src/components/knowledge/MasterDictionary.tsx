import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EquationRenderer } from './EquationRenderer';
import { Search, Filter, X } from 'lucide-react';

type DomainKey = 'space-1D' | 'space-2D' | 'space-3D' | 'time' | 'graph' | 'parameter' | 'discrete';

interface DictEntry {
  id: string;
  domain: DomainKey;
  quantity: string;
  recommendedI: string;
  omega: string;
  notes: string;
}

const ENTRIES: DictEntry[] = [
  {
    id: 'M-001', domain: 'space-1D',
    quantity: 'Distributed line load $w(x)$ [N/m]',
    recommendedI: '$I(x) = w(x)$ (or $|w|$ / split $w^+, w^-$)',
    omega: '$x \\in [0, L]$',
    notes: 'Resultant $R = \\int_0^L w\\,dx$; line of action $\\bar{x}$; load spread $\\mu_2$. Sign: sometimes. Negative order: centered inverse moments need $\\varepsilon$.',
  },
  {
    id: 'M-002', domain: 'space-2D',
    quantity: 'Pressure magnitude $p(x,y)$ on surface',
    recommendedI: '$I = p \\ge 0$ (or $|p|$, $p^2$ if gauge/signed)',
    omega: '$\\mathbf{x} \\in A$',
    notes: 'Resultant proxy $= \\int_A p\\,dA$; centroid of pressure; spread/covariance of footprint. Negative order: localizes hotspots; needs $\\varepsilon$.',
  },
  {
    id: 'M-003', domain: 'space-2D',
    quantity: "Surface heat flux $q''(x,y)$ [W/m²]",
    recommendedI: "$I = q''$ if $q'' \\ge 0$, else $|q''|$ or split $q''^+, q''^-$",
    omega: '$\\mathbf{x} \\in A$',
    notes: "Total heat rate $\\dot{Q} = \\int_A q''\\,dA$; center of heating $\\bar{x}$; spread $\\Sigma$. Negative order: nonuniformity report $\\varepsilon$.",
  },
  {
    id: 'M-004', domain: 'space-3D',
    quantity: 'Volumetric heat generation $\\dot{q}(\\mathbf{x})$ [W/m³]',
    recommendedI: '$I = \\dot{q} \\ge 0$ (or split sources/sinks)',
    omega: '$\\mathbf{x} \\in V$',
    notes: 'Total generation $\\dot{Q}_{\\text{gen}} = \\int_V \\dot{q}\\,dV$; centroid and spread in volume.',
  },
  {
    id: 'M-005', domain: 'space-2D',
    quantity: 'Wall shear magnitude $\\tau_w(x,y)$',
    recommendedI: '$I = |\\tau_w|$',
    omega: '$\\mathbf{x} \\in A$',
    notes: 'Total shear intensity $\\int_A |\\tau_w|\\,dA$; shear centroid; spread.',
  },
  {
    id: 'M-006', domain: 'time',
    quantity: 'Force input $F(t)$',
    recommendedI: '$I(t) = |F(t)|$ or $F(t)^2$ or $|F(t)v(t)|$',
    omega: '$t \\in [t_0, t_1]$',
    notes: 'Time-integrated forcing magnitude; center-of-action in time; temporal spread. Negative order: needs $\\varepsilon$ or cutoff.',
  },
  {
    id: 'M-007', domain: 'time',
    quantity: 'Torque input $\\tau(t)$',
    recommendedI: '$I(t) = |\\tau(t)|$ or $|\\tau(t)\\omega(t)|$ or $\\tau(t)^2$',
    omega: '$t \\in [t_0, t_1]$',
    notes: 'Total torque intensity/work proxy; temporal centroid; temporal spread.',
  },
  {
    id: 'M-008', domain: 'time',
    quantity: 'Viscous damper dissipation (translational)',
    recommendedI: '$I(t) = b\\,\\dot{x}(t)^2$',
    omega: '$t \\in [t_0, t_1]$',
    notes: 'Dissipation is nonnegative; integrates to dissipated energy; centroid/spread show intermittency.',
  },
  {
    id: 'M-009', domain: 'time',
    quantity: 'Rotational damper dissipation',
    recommendedI: '$I(t) = c\\,(\\Delta\\omega(t))^2$ or $|\\tau_f \\omega|$',
    omega: '$t \\in [t_0, t_1]$',
    notes: 'Nonnegative dissipation intensity; localizes bursts.',
  },
  {
    id: 'M-010', domain: 'graph',
    quantity: 'Circuit branch current magnitude',
    recommendedI: '$I_e = |i_e|$ or $i_e^2$',
    omega: '$e \\in E$',
    notes: 'Discrete support; centroid/spread require a graph metric or embedding map $\\varphi$.',
  },
  {
    id: 'M-011', domain: 'graph',
    quantity: 'Circuit component power dissipation',
    recommendedI: '$I_e = P_e \\ge 0$',
    omega: '$e \\in E$',
    notes: 'Total dissipation; hot-spot identification; spread across components.',
  },
  {
    id: 'M-012', domain: 'parameter',
    quantity: 'Performance coefficient curve $C_F(\\xi)$',
    recommendedI: '$I(\\xi) = C_F(\\xi) \\ge 0$',
    omega: '$\\xi \\in [\\xi_{\\min}, \\xi_{\\max}]$',
    notes: 'Parameter-space centroid and spread quantify typical operating region and robustness.',
  },
  {
    id: 'M-013', domain: 'parameter',
    quantity: 'Mach-kernel (e.g., MFP$(M)$)',
    recommendedI: '$I(M) = \\text{MFP}(M) \\ge 0$',
    omega: '$M \\in [M_{\\min}, M_{\\max}]$',
    notes: 'Mach-space centroid and spread. Negative order: low-$M$ sensitivity depends on $M_{\\min}$; centered inverse moments need $\\varepsilon$.',
  },
  {
    id: 'M-014', domain: 'space-2D',
    quantity: 'Nacelle pressure-drag integrand',
    recommendedI: '$I = |P - P_0|$ or split $(P - P_0)^+, (P - P_0)^-$',
    omega: '$\\mathbf{x} \\in A_y$',
    notes: 'Sign handling required; centroid/spread give drag footprint.',
  },
  {
    id: 'M-015', domain: 'space-2D',
    quantity: 'Thrust-plane pressure term (pressure thrust density)',
    recommendedI: '$I(x) = |p(x) - p_a|$',
    omega: '$\\mathbf{x} \\in A_e$',
    notes: 'Pressure-thrust footprint centroid/spread; asymmetry indicates off-axis loading tendency.',
  },
  {
    id: 'M-016', domain: 'space-2D',
    quantity: 'Momentum-flux density on exit plane (thrust contribution)',
    recommendedI: '$I(x) = \\rho(x)u(x)^2$ (componentwise or scalarized)',
    omega: '$\\mathbf{x} \\in A_e$',
    notes: 'Treat as intensity on exit plane; centroid/spread diagnose alignment/torque propensity. Negative order: regularize with $\\varepsilon$.',
  },
  {
    id: 'M-017', domain: 'space-3D',
    quantity: 'Body force density',
    recommendedI: '$I = \\|\\mathbf{b}\\|$ (or componentwise)',
    omega: '$\\mathbf{x} \\in V$',
    notes: 'Vector loads require scalarization policy (magnitude or componentwise) before normalization.',
  },
  {
    id: 'M-018', domain: 'space-2D',
    quantity: 'Absolute traction',
    recommendedI: '$I(\\mathbf{x}) = \\|\\mathbf{t}(\\mathbf{x})\\|$',
    omega: '$\\mathbf{x} \\in A$',
    notes: 'Traction magnitude yields total intensity, centroid, and spread.',
  },
  {
    id: 'M-019', domain: 'discrete',
    quantity: 'Concentrated force idealization',
    recommendedI: '$I = F\\,\\delta(z - z_0)$',
    omega: 'point support',
    notes: 'Generalized measure; negative orders require regularization.',
  },
];

const DOMAIN_COLORS: Record<DomainKey, string> = {
  'space-1D': 'bg-structures/20 text-structures border-structures/30',
  'space-2D': 'bg-heat/20 text-heat border-heat/30',
  'space-3D': 'bg-fluids/20 text-fluids border-fluids/30',
  'time': 'bg-accent/20 text-accent border-accent/30',
  'graph': 'bg-primary/20 text-primary border-primary/30',
  'parameter': 'bg-success/20 text-success border-success/30',
  'discrete': 'bg-destructive/20 text-destructive border-destructive/30',
};

const ALL_DOMAINS: DomainKey[] = ['space-1D', 'space-2D', 'space-3D', 'time', 'graph', 'parameter', 'discrete'];

export function MasterDictionary() {
  const [search, setSearch] = useState('');
  const [activeDomains, setActiveDomains] = useState<Set<DomainKey>>(new Set());

  const toggleDomain = (d: DomainKey) => {
    setActiveDomains(prev => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d); else next.add(d);
      return next;
    });
  };

  const filtered = useMemo(() => {
    return ENTRIES.filter(e => {
      if (activeDomains.size > 0 && !activeDomains.has(e.domain)) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          e.id.toLowerCase().includes(q) ||
          e.quantity.toLowerCase().includes(q) ||
          e.domain.toLowerCase().includes(q) ||
          e.notes.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [search, activeDomains]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Master Loading Dictionary</h2>
        <p className="text-sm text-muted-foreground mt-1">
          All 19 canonical load types from the unified framework — Section 5 of the paper.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search entries..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <Filter className="h-4 w-4 text-muted-foreground mr-1" />
          {ALL_DOMAINS.map(d => (
            <Badge
              key={d}
              variant="outline"
              className={`cursor-pointer select-none transition-all text-xs ${
                activeDomains.has(d) ? DOMAIN_COLORS[d] : 'opacity-50 hover:opacity-80'
              }`}
              onClick={() => toggleDomain(d)}
            >
              {d}
            </Badge>
          ))}
          {activeDomains.size > 0 && (
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => setActiveDomains(new Set())}>
              <X className="h-3 w-3 mr-1" /> Clear
            </Button>
          )}
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {ENTRIES.length} entries
      </p>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-lg border border-border/50 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 border-border/30">
                <TableHead className="w-20 font-semibold">ID</TableHead>
                <TableHead className="w-24 font-semibold">Domain</TableHead>
                <TableHead className="min-w-[180px] font-semibold">Quantity</TableHead>
                <TableHead className="min-w-[200px] font-semibold">Recommended I(·)</TableHead>
                <TableHead className="w-36 font-semibold">Ω</TableHead>
                <TableHead className="min-w-[250px] font-semibold">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e, idx) => (
                <TableRow key={e.id} className={idx % 2 === 0 ? 'bg-muted/10' : ''}>
                  <TableCell className="font-mono font-semibold text-primary text-sm">{e.id}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-xs ${DOMAIN_COLORS[e.domain]}`}>
                      {e.domain}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    <EquationRenderer content={e.quantity} />
                  </TableCell>
                  <TableCell className="text-sm">
                    <EquationRenderer content={e.recommendedI} />
                  </TableCell>
                  <TableCell className="text-sm font-mono">
                    <EquationRenderer content={e.omega} />
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground leading-relaxed">
                    <EquationRenderer content={e.notes} />
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No entries match your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </motion.div>
    </div>
  );
}
