import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EquationRenderer } from './EquationRenderer';
import { Search, Filter, X, ChevronRight } from 'lucide-react';

type DomainKey = 'space-1D' | 'space-2D' | 'space-3D' | 'time' | 'graph' | 'parameter' | 'discrete';

interface MomentLadder {
  resultant: string;
  centroid: string;
  spread: string;
  negativeOrder: string;
  signHandling: string;
}

interface DictEntry {
  id: string;
  domain: DomainKey;
  quantity: string;
  recommendedI: string;
  omega: string;
  notes: string;
  ladder: MomentLadder;
}

const ENTRIES: DictEntry[] = [
  {
    id: 'M-001', domain: 'space-1D',
    quantity: 'Distributed line load $w(x)$ [N/m]',
    recommendedI: '$I(x) = w(x)$ (or $|w|$ / split $w^+, w^-$)',
    omega: '$x \\in [0, L]$',
    notes: 'Resultant $R = \\int_0^L w\\,dx$; line of action $\\bar{x}$; load spread $\\mu_2$. Sign: sometimes. Negative order: centered inverse moments need $\\varepsilon$.',
    ladder: {
      resultant: '$I_0 = R = \\int_0^L w(x)\\,dx$ — total force [N]',
      centroid: '$\\bar{x} = \\frac{1}{I_0}\\int_0^L x\\,w(x)\\,dx$ — line of action',
      spread: '$\\mu_2 = \\frac{1}{I_0}\\int_0^L (x - \\bar{x})^2 w(x)\\,dx$ — load nonuniformity [m²]',
      negativeOrder: '$\\mu_{-2,\\varepsilon} = \\frac{1}{I_0}\\int_0^L \\bigl((x-\\bar{x})^2 + \\varepsilon^2\\bigr)^{-1} w(x)\\,dx$ — localization index',
      signHandling: 'Use $|w|$ or Jordan split $w^+, w^-$ when $w$ takes negative values.',
    },
  },
  {
    id: 'M-002', domain: 'space-2D',
    quantity: 'Pressure magnitude $p(x,y)$ on surface',
    recommendedI: '$I = p \\ge 0$ (or $|p|$, $p^2$ if gauge/signed)',
    omega: '$\\mathbf{x} \\in A$',
    notes: 'Resultant proxy $= \\int_A p\\,dA$; centroid of pressure; spread/covariance of footprint. Negative order: localizes hotspots; needs $\\varepsilon$.',
    ladder: {
      resultant: '$I_0 = \\int_A p\\,dA$ — total pressure resultant [N]',
      centroid: '$\\bar{\\mathbf{x}} = \\frac{1}{I_0}\\int_A \\mathbf{x}\\,p\\,dA$ — center of pressure',
      spread: '$\\Sigma = \\frac{1}{I_0}\\int_A (\\mathbf{x}-\\bar{\\mathbf{x}})(\\mathbf{x}-\\bar{\\mathbf{x}})^T p\\,dA$ — covariance tensor',
      negativeOrder: 'Scalar $\\mu_{-2,\\varepsilon}$ localizes pressure hotspots; report $\\varepsilon$ (mesh/sensor size).',
      signHandling: 'Gauge pressure may be signed; use $|p|$ or $p^2$ for intensity.',
    },
  },
  {
    id: 'M-003', domain: 'space-2D',
    quantity: "Surface heat flux $q''(x,y)$ [W/m²]",
    recommendedI: "$I = q''$ if $q'' \\ge 0$, else $|q''|$ or split $q''^+, q''^-$",
    omega: '$\\mathbf{x} \\in A$',
    notes: "Total heat rate $\\dot{Q} = \\int_A q''\\,dA$; center of heating $\\bar{x}$; spread $\\Sigma$. Negative order: nonuniformity report $\\varepsilon$.",
    ladder: {
      resultant: "$I_0 = \\dot{Q} = \\int_A q''\\,dA$ — total heat transfer rate [W]",
      centroid: "$\\bar{\\mathbf{x}} = \\frac{1}{\\dot{Q}}\\int_A \\mathbf{x}\\,q''\\,dA$ — center of heating",
      spread: '$\\Sigma$ — spatial covariance of heat flux footprint',
      negativeOrder: 'Nonuniformity index via $\\mu_{-2,\\varepsilon}$; always report $\\varepsilon$.',
      signHandling: "Split $q''^+$ (into surface) and $q''^-$ (out of surface) if bidirectional.",
    },
  },
  {
    id: 'M-004', domain: 'space-3D',
    quantity: 'Volumetric heat generation $\\dot{q}(\\mathbf{x})$ [W/m³]',
    recommendedI: '$I = \\dot{q} \\ge 0$ (or split sources/sinks)',
    omega: '$\\mathbf{x} \\in V$',
    notes: 'Total generation $\\dot{Q}_{\\text{gen}} = \\int_V \\dot{q}\\,dV$; centroid and spread in volume.',
    ladder: {
      resultant: '$I_0 = \\dot{Q}_{\\text{gen}} = \\int_V \\dot{q}\\,dV$ — total volumetric generation [W]',
      centroid: '$\\bar{\\mathbf{x}} = \\frac{1}{I_0}\\int_V \\mathbf{x}\\,\\dot{q}\\,dV$ — center of generation',
      spread: '$\\Sigma_{3\\times 3}$ — 3D inertia/covariance tensor of heat source distribution',
      negativeOrder: 'Applicable; regularize with mesh-scale $\\varepsilon$ for volumetric hotspot detection.',
      signHandling: 'Sources ($\\dot{q}>0$) vs. sinks ($\\dot{q}<0$) — split if mixed.',
    },
  },
  {
    id: 'M-005', domain: 'space-2D',
    quantity: 'Wall shear magnitude $\\tau_w(x,y)$',
    recommendedI: '$I = |\\tau_w|$',
    omega: '$\\mathbf{x} \\in A$',
    notes: 'Total shear intensity $\\int_A |\\tau_w|\\,dA$; shear centroid; spread.',
    ladder: {
      resultant: '$I_0 = \\int_A |\\tau_w|\\,dA$ — total shear intensity',
      centroid: '$\\bar{\\mathbf{x}}$ — centroid of shear distribution on wall',
      spread: '$\\Sigma$ — spatial spread of shear footprint',
      negativeOrder: 'Localize shear concentration regions; needs $\\varepsilon$.',
      signHandling: 'Magnitude $|\\tau_w|$ ensures nonnegativity; direction handled separately.',
    },
  },
  {
    id: 'M-006', domain: 'time',
    quantity: 'Force input $F(t)$',
    recommendedI: '$I(t) = |F(t)|$ or $F(t)^2$ or $|F(t)v(t)|$',
    omega: '$t \\in [t_0, t_1]$',
    notes: 'Time-integrated forcing magnitude; center-of-action in time; temporal spread. Negative order: needs $\\varepsilon$ or cutoff.',
    ladder: {
      resultant: '$I_0 = \\int_{t_0}^{t_1} |F(t)|\\,dt$ — impulse magnitude [N·s]',
      centroid: '$\\bar{t} = \\frac{1}{I_0}\\int_{t_0}^{t_1} t\\,|F(t)|\\,dt$ — temporal center of action',
      spread: '$\\mu_2 = \\frac{1}{I_0}\\int_{t_0}^{t_1}(t-\\bar{t})^2|F(t)|\\,dt$ — temporal spread [s²]',
      negativeOrder: 'Needs $\\varepsilon$ (temporal resolution) or hard cutoff near $t = \\bar{t}$.',
      signHandling: 'Use $|F|$, $F^2$, or power $|Fv|$ depending on analysis goal.',
    },
  },
  {
    id: 'M-007', domain: 'time',
    quantity: 'Torque input $\\tau(t)$',
    recommendedI: '$I(t) = |\\tau(t)|$ or $|\\tau(t)\\omega(t)|$ or $\\tau(t)^2$',
    omega: '$t \\in [t_0, t_1]$',
    notes: 'Total torque intensity/work proxy; temporal centroid; temporal spread.',
    ladder: {
      resultant: '$I_0 = \\int_{t_0}^{t_1}|\\tau(t)|\\,dt$ — angular impulse magnitude',
      centroid: '$\\bar{t}$ — temporal center of torque application',
      spread: '$\\mu_2$ — temporal spread of torque loading',
      negativeOrder: 'Same regularization rules as M-006; report $\\varepsilon$.',
      signHandling: 'Use $|\\tau|$ or power-based $|\\tau\\omega|$ for nonnegative intensity.',
    },
  },
  {
    id: 'M-008', domain: 'time',
    quantity: 'Viscous damper dissipation (translational)',
    recommendedI: '$I(t) = b\\,\\dot{x}(t)^2$',
    omega: '$t \\in [t_0, t_1]$',
    notes: 'Dissipation is nonnegative; integrates to dissipated energy; centroid/spread show intermittency.',
    ladder: {
      resultant: '$I_0 = \\int_{t_0}^{t_1} b\\dot{x}^2\\,dt$ — total dissipated energy [J]',
      centroid: '$\\bar{t}$ — temporal center of dissipation',
      spread: '$\\mu_2$ — identifies intermittent vs. sustained dissipation',
      negativeOrder: 'Always well-defined since $I(t) = b\\dot{x}^2 \\ge 0$; still regularize central form.',
      signHandling: 'Inherently nonnegative — no sign handling needed.',
    },
  },
  {
    id: 'M-009', domain: 'time',
    quantity: 'Rotational damper dissipation',
    recommendedI: '$I(t) = c\\,(\\Delta\\omega(t))^2$ or $|\\tau_f \\omega|$',
    omega: '$t \\in [t_0, t_1]$',
    notes: 'Nonnegative dissipation intensity; localizes bursts.',
    ladder: {
      resultant: '$I_0 = \\int_{t_0}^{t_1} c(\\Delta\\omega)^2\\,dt$ — total rotational dissipation [J]',
      centroid: '$\\bar{t}$ — when dissipation peaks on average',
      spread: '$\\mu_2$ — burst vs. steady dissipation pattern',
      negativeOrder: 'Localizes sharp dissipation bursts; nonnegative by construction.',
      signHandling: 'Inherently nonnegative ($\\ge 0$).',
    },
  },
  {
    id: 'M-010', domain: 'graph',
    quantity: 'Circuit branch current magnitude',
    recommendedI: '$I_e = |i_e|$ or $i_e^2$',
    omega: '$e \\in E$',
    notes: 'Discrete support; centroid/spread require a graph metric or embedding map $\\varphi$.',
    ladder: {
      resultant: '$I_0 = \\sum_{e \\in E} |i_e|$ — total current intensity across branches',
      centroid: '$\\bar{\\varphi} = \\frac{1}{I_0}\\sum_e \\varphi(e)|i_e|$ — requires embedding map $\\varphi: E \\to \\mathbb{R}^d$',
      spread: 'Spread $\\mu_2$ quantifies current distribution uniformity across branches',
      negativeOrder: 'Discrete sum; regularize with $\\varepsilon$ on embedded coordinates.',
      signHandling: 'Current is signed; use $|i_e|$ or $i_e^2$ for intensity.',
    },
  },
  {
    id: 'M-011', domain: 'graph',
    quantity: 'Circuit component power dissipation',
    recommendedI: '$I_e = P_e \\ge 0$',
    omega: '$e \\in E$',
    notes: 'Total dissipation; hot-spot identification; spread across components.',
    ladder: {
      resultant: '$I_0 = \\sum_{e \\in E} P_e$ — total circuit power dissipation [W]',
      centroid: '$\\bar{\\varphi}$ — center of dissipation (requires graph embedding)',
      spread: '$\\mu_2$ — identifies whether dissipation is concentrated or spread',
      negativeOrder: 'Hot-spot identification via inverse moments on graph embedding.',
      signHandling: 'Power dissipation $P_e = |v_e i_e| \\ge 0$ is nonnegative.',
    },
  },
  {
    id: 'M-012', domain: 'parameter',
    quantity: 'Performance coefficient curve $C_F(\\xi)$',
    recommendedI: '$I(\\xi) = C_F(\\xi) \\ge 0$',
    omega: '$\\xi \\in [\\xi_{\\min}, \\xi_{\\max}]$',
    notes: 'Parameter-space centroid and spread quantify typical operating region and robustness.',
    ladder: {
      resultant: '$I_0 = \\int_{\\xi_{\\min}}^{\\xi_{\\max}} C_F(\\xi)\\,d\\xi$ — integrated performance',
      centroid: '$\\bar{\\xi}$ — typical/optimal operating point in parameter space',
      spread: '$\\mu_2$ — robustness measure (wide = robust, narrow = sensitive)',
      negativeOrder: 'Localizes peak-performance region; useful for design optimization.',
      signHandling: 'Performance coefficients are typically nonnegative by definition.',
    },
  },
  {
    id: 'M-013', domain: 'parameter',
    quantity: 'Mach-kernel (e.g., MFP$(M)$)',
    recommendedI: '$I(M) = \\text{MFP}(M) \\ge 0$',
    omega: '$M \\in [M_{\\min}, M_{\\max}]$',
    notes: 'Mach-space centroid and spread. Negative order: low-$M$ sensitivity depends on $M_{\\min}$; centered inverse moments need $\\varepsilon$.',
    ladder: {
      resultant: '$I_0 = \\int_{M_{\\min}}^{M_{\\max}} \\text{MFP}(M)\\,dM$ — integrated Mach flow parameter',
      centroid: '$\\bar{M}$ — effective operating Mach number',
      spread: '$\\mu_2$ — Mach-range sensitivity',
      negativeOrder: 'Low-$M$ sensitivity depends on $M_{\\min}$; centered inverse moments need $\\varepsilon$.',
      signHandling: 'MFP is nonnegative; no sign issues.',
    },
  },
  {
    id: 'M-014', domain: 'space-2D',
    quantity: 'Nacelle pressure-drag integrand',
    recommendedI: '$I = |P - P_0|$ or split $(P - P_0)^+, (P - P_0)^-$',
    omega: '$\\mathbf{x} \\in A_y$',
    notes: 'Sign handling required; centroid/spread give drag footprint.',
    ladder: {
      resultant: '$I_0 = \\int_{A_y} |P - P_0|\\,dA$ — total pressure-drag proxy',
      centroid: '$\\bar{\\mathbf{x}}$ — center of drag footprint on nacelle',
      spread: '$\\Sigma$ — drag distribution extent',
      negativeOrder: 'Regularize for drag concentration analysis.',
      signHandling: 'Jordan split $(P-P_0)^+, (P-P_0)^-$ separates drag/thrust contributions.',
    },
  },
  {
    id: 'M-015', domain: 'space-2D',
    quantity: 'Thrust-plane pressure term (pressure thrust density)',
    recommendedI: '$I(x) = |p(x) - p_a|$',
    omega: '$\\mathbf{x} \\in A_e$',
    notes: 'Pressure-thrust footprint centroid/spread; asymmetry indicates off-axis loading tendency.',
    ladder: {
      resultant: '$I_0 = \\int_{A_e} |p - p_a|\\,dA$ — pressure-thrust component',
      centroid: '$\\bar{\\mathbf{x}}$ — center of pressure thrust on exit plane',
      spread: '$\\Sigma$ — asymmetry indicates off-axis loading tendency',
      negativeOrder: 'Localize pressure-thrust concentration regions.',
      signHandling: 'Absolute value ensures nonnegative intensity.',
    },
  },
  {
    id: 'M-016', domain: 'space-2D',
    quantity: 'Momentum-flux density on exit plane (thrust contribution)',
    recommendedI: '$I(x) = \\rho(x)u(x)^2$ (componentwise or scalarized)',
    omega: '$\\mathbf{x} \\in A_e$',
    notes: 'Treat as intensity on exit plane; centroid/spread diagnose alignment/torque propensity. Negative order: regularize with $\\varepsilon$.',
    ladder: {
      resultant: '$I_0 = \\int_{A_e} \\rho u^2\\,dA$ — momentum-thrust component [N]',
      centroid: '$\\bar{\\mathbf{x}}$ — center of momentum flux (misalignment = torque)',
      spread: '$\\Sigma$ — diagnoses alignment and torque propensity',
      negativeOrder: 'Regularize with $\\varepsilon$ (exit-plane mesh scale).',
      signHandling: '$\\rho u^2 \\ge 0$ inherently nonnegative.',
    },
  },
  {
    id: 'M-017', domain: 'space-3D',
    quantity: 'Body force density',
    recommendedI: '$I = \\|\\mathbf{b}\\|$ (or componentwise)',
    omega: '$\\mathbf{x} \\in V$',
    notes: 'Vector loads require scalarization policy (magnitude or componentwise) before normalization.',
    ladder: {
      resultant: '$I_0 = \\int_V \\|\\mathbf{b}\\|\\,dV$ — total body-force intensity',
      centroid: '$\\bar{\\mathbf{x}} = \\frac{1}{I_0}\\int_V \\mathbf{x}\\|\\mathbf{b}\\|\\,dV$ — center of body forces',
      spread: '$\\Sigma_{3\\times 3}$ — volumetric distribution tensor',
      negativeOrder: 'Volumetric localization; regularize with mesh $\\varepsilon$.',
      signHandling: 'Scalarize via magnitude $\\|\\mathbf{b}\\|$ or analyze componentwise.',
    },
  },
  {
    id: 'M-018', domain: 'space-2D',
    quantity: 'Absolute traction',
    recommendedI: '$I(\\mathbf{x}) = \\|\\mathbf{t}(\\mathbf{x})\\|$',
    omega: '$\\mathbf{x} \\in A$',
    notes: 'Traction magnitude yields total intensity, centroid, and spread.',
    ladder: {
      resultant: '$I_0 = \\int_A \\|\\mathbf{t}\\|\\,dA$ — total traction intensity',
      centroid: '$\\bar{\\mathbf{x}}$ — center of traction on surface',
      spread: '$\\Sigma$ — traction footprint spread',
      negativeOrder: 'Localize traction concentration; regularize with surface mesh $\\varepsilon$.',
      signHandling: 'Magnitude ensures nonnegativity; direction ignored in scalar ladder.',
    },
  },
  {
    id: 'M-019', domain: 'discrete',
    quantity: 'Concentrated force idealization',
    recommendedI: '$I = F\\,\\delta(z - z_0)$',
    omega: 'point support',
    notes: 'Generalized measure; negative orders require regularization.',
    ladder: {
      resultant: '$I_0 = F$ — the force itself (Dirac measure)',
      centroid: '$\\bar{z} = z_0$ — application point (trivially defined)',
      spread: '$\\mu_2 = 0$ — zero spread (point load has no extent)',
      negativeOrder: '$\\mu_{-k}$ diverges for all $k \\ge 1$; must regularize with physical footprint $\\varepsilon > 0$.',
      signHandling: 'Generalized (distributional) measure; $F \\ge 0$ assumed or use $|F|$.',
    },
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

const LADDER_LABELS: { key: keyof MomentLadder; label: string; icon: string }[] = [
  { key: 'resultant', label: 'Resultant (I₀)', icon: '∫' },
  { key: 'centroid', label: 'Centroid (x̄)', icon: '⊕' },
  { key: 'spread', label: 'Spread (μ₂)', icon: '↔' },
  { key: 'negativeOrder', label: 'Negative Order (μ₋ₖ,ε)', icon: '⁻¹' },
  { key: 'signHandling', label: 'Sign Handling', icon: '±' },
];

export function MasterDictionary() {
  const [search, setSearch] = useState('');
  const [activeDomains, setActiveDomains] = useState<Set<DomainKey>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleDomain = (d: DomainKey) => {
    setActiveDomains(prev => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d); else next.add(d);
      return next;
    });
  };

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
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
          All 19 canonical load types from the unified framework — Section 5 of the paper. Click any row to expand the full moment ladder.
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
                <TableHead className="w-8"></TableHead>
                <TableHead className="w-20 font-semibold">ID</TableHead>
                <TableHead className="w-24 font-semibold">Domain</TableHead>
                <TableHead className="min-w-[180px] font-semibold">Quantity</TableHead>
                <TableHead className="min-w-[200px] font-semibold">Recommended I(·)</TableHead>
                <TableHead className="w-36 font-semibold">Ω</TableHead>
                <TableHead className="min-w-[250px] font-semibold">Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((e, idx) => {
                const isExpanded = expandedRows.has(e.id);
                return (
                  <>
                    <TableRow
                      key={e.id}
                      className={`cursor-pointer transition-colors ${idx % 2 === 0 ? 'bg-muted/10' : ''} ${isExpanded ? 'border-b-0 bg-muted/20' : ''}`}
                      onClick={() => toggleRow(e.id)}
                    >
                      <TableCell className="w-8 pr-0">
                        <ChevronRight
                          className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                        />
                      </TableCell>
                      <TableCell className="font-mono font-semibold text-primary text-sm">{e.id}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${DOMAIN_COLORS[e.domain]}`}>
                          {e.domain}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        <EquationRenderer equation={e.quantity} />
                      </TableCell>
                      <TableCell className="text-sm">
                        <EquationRenderer equation={e.recommendedI} />
                      </TableCell>
                      <TableCell className="text-sm font-mono">
                        <EquationRenderer equation={e.omega} />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground leading-relaxed">
                        <EquationRenderer equation={e.notes} />
                      </TableCell>
                    </TableRow>
                    <AnimatePresence>
                      {isExpanded && (
                        <TableRow key={`${e.id}-ladder`} className="bg-card/80 border-b border-border/30">
                          <TableCell colSpan={7} className="p-0">
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: 'easeInOut' }}
                              className="overflow-hidden"
                            >
                              <div className="px-6 py-4 ml-8">
                                <div className="flex items-center gap-2 mb-3">
                                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">Moment Ladder</span>
                                  <span className="text-xs text-muted-foreground">— {e.id}</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                  {LADDER_LABELS.map(({ key, label, icon }) => (
                                    <div
                                      key={key}
                                      className="rounded-md border border-border/40 bg-muted/20 p-3 space-y-1"
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded flex items-center justify-center bg-primary/10 text-primary text-xs font-bold">
                                          {icon}
                                        </span>
                                        <span className="text-xs font-medium text-foreground">{label}</span>
                                      </div>
                                      <div className="text-xs text-muted-foreground leading-relaxed pl-8">
                                        <EquationRenderer equation={e.ladder[key]} />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          </TableCell>
                        </TableRow>
                      )}
                    </AnimatePresence>
                  </>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
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
