import { Fragment, useMemo, useState, type ElementType } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Atom,
  Beaker,
  BookOpen,
  Box,
  Building2,
  Calculator,
  ChevronRight,
  Droplets,
  Flame,
  Gauge,
  Radio,
  Rocket,
  Search,
  Sigma,
  Sparkles,
  X,
  Zap,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EquationRenderer } from '@/components/knowledge/EquationRenderer';

type AtlasDomain =
  | 'unified'
  | 'structures'
  | 'heat'
  | 'fluids'
  | 'dynamics'
  | 'circuits'
  | 'propulsion'
  | 'materials'
  | 'waves';

type DomainKind = 'line' | 'surface' | 'volume' | 'time' | 'graph' | 'parameter' | 'frequency' | 'point';
type ContentFilter = 'all' | 'foundations' | 'atlas';
type DomainFilter = AtlasDomain | 'all';

interface FoundationConcept {
  id: string;
  title: string;
  summary: string;
  equations: string[];
}

interface AtlasEntry {
  id: string;
  domain: AtlasDomain;
  kind: DomainKind;
  quantity: string;
  recommendedI: string;
  omega: string;
  resultant: string;
  centroid: string;
  spread: string;
  signHandling: string;
  intuition: string;
  status?: 'simulated' | 'candidate';
}

interface MomentTemplate {
  field: string;
  resultant: string;
  density: string;
  centroid: string;
  spread: string;
  localization: string;
}

interface EquationBlock {
  title: string;
  icon: ElementType;
  equations: string[];
  note: string;
}

const FOUNDATIONS: FoundationConcept[] = [
  {
    id: 'field',
    title: 'Universal object',
    summary:
      'Any admissible load becomes a nonnegative intensity field on a domain. The domain can be a line, surface, volume, time interval, graph, or parameter axis.',
    equations: [
      '$I(z) \\ge 0,\\; z \\in \\Omega$',
      '$I_0 = \\int_\\Omega I(z)\\,d\\mu(z)$',
      '$[I_0] = [I]\\,[\\mu]$',
    ],
  },
  {
    id: 'density',
    title: 'Normalize to compare',
    summary:
      'Dividing by the resultant turns the load into a dimensionless density. That is the bridge from engineering fields to moments.',
    equations: [
      '$f(z) = I(z) / I_0$',
      '$\\int_\\Omega f(z)\\,d\\mu(z) = 1$',
      '$f$ is the universal weighting function',
    ],
  },
  {
    id: 'ladder',
    title: 'Moment ladder',
    summary:
      'The ladder extracts what engineers already care about: total amount, where it acts, how spread out it is, and whether it has asymmetric or tail-heavy concentration.',
    equations: [
      '$I_0 = \\int_\\Omega I\\,d\\mu$',
      '$\\bar{\\phi}=I_0^{-1}\\int_\\Omega \\phi(z)I(z)\\,d\\mu$',
      '$\\Sigma=\\int_\\Omega (\\phi-\\bar{\\phi})(\\phi-\\bar{\\phi})^T f\\,d\\mu$',
    ],
  },
  {
    id: 'signs',
    title: 'Signed fields need a policy',
    summary:
      'A signed load is not itself an intensity. Use magnitude, square, physically nonnegative power/energy, or split positive and negative parts before applying the ladder.',
    equations: [
      '$I \\in \\{|S|,\\;S^2,\\;\\text{energy density}\\}$',
      '$S=S^+-S^-,\\; S^+\\ge 0,\\; S^-\\ge 0$',
      'Compute ladders separately for $S^+$ and $S^-$ when sign matters',
    ],
  },
  {
    id: 'negative-order',
    title: 'Localization needs resolution',
    summary:
      'Inverse moments are powerful hotspot measures, but they become singular without a physical resolution scale such as mesh size, sensor footprint, or minimum separation.',
    equations: [
      '$\\mu_{-k,\\varepsilon}=\\int_\\Omega (r^2+\\varepsilon^2)^{-k/2}f(z)\\,d\\mu$',
      '$r=\\phi(z)-\\bar{\\phi}$',
      '$w_{eff}=\\mu_{-1,\\varepsilon}^{-1}$',
    ],
  },
  {
    id: 'balance-laws',
    title: 'Balance-law backbone',
    summary:
      'Mass, momentum, energy, and charge balances are already integrals of densities, fluxes, and sources. The framework makes that shared structure explicit.',
    equations: [
      '$\\frac{d}{dt}\\int_V \\psi\\,dV=-\\int_{\\partial V} \\mathbf{J}\\cdot\\mathbf{n}\\,dA+\\int_V s\\,dV$',
      'Density, flux, and source terms are candidate intensity fields',
    ],
  },
];

const ATLAS_ENTRIES: AtlasEntry[] = [
  {
    id: 'M-001',
    domain: 'structures',
    kind: 'line',
    quantity: 'Distributed line load $w(x)$ [N/m]',
    recommendedI: '$I(x)=w(x)$, or $|w|$ / Jordan split if signed',
    omega: '$x\\in[0,L]$',
    resultant: '$I_0=\\int_0^L w(x)\\,dx$ [N]',
    centroid: '$\\bar{x}=I_0^{-1}\\int_0^L xw(x)\\,dx$',
    spread: '$\\mu_2=I_0^{-1}\\int_0^L (x-\\bar{x})^2w(x)\\,dx$',
    signHandling: 'Use magnitude for total load intensity, or split upward/downward loads when direction matters.',
    intuition: 'Beam loads, wing span loads, and distributed reactions all become line densities.',
    status: 'simulated',
  },
  {
    id: 'M-002',
    domain: 'fluids',
    kind: 'surface',
    quantity: 'Pressure magnitude $p(x,y)$ [Pa]',
    recommendedI: '$I=p\\ge0$, or $|p|$ / $p^2$ for signed gauge pressure',
    omega: '$\\mathbf{x}\\in A$',
    resultant: '$I_0=\\int_A p\\,dA$ [N]',
    centroid: '$\\bar{\\mathbf{x}}=I_0^{-1}\\int_A \\mathbf{x}p\\,dA$',
    spread: '$\\Sigma=I_0^{-1}\\int_A (\\mathbf{x}-\\bar{\\mathbf{x}})(\\mathbf{x}-\\bar{\\mathbf{x}})^Tp\\,dA$',
    signHandling: 'Gauge pressure can be signed; choose magnitude, square, or split suction/pressure regions.',
    intuition: 'This is the center-of-pressure idea generalized into a full footprint.',
    status: 'simulated',
  },
  {
    id: 'M-003',
    domain: 'heat',
    kind: 'surface',
    quantity: "Surface heat flux $q''(x,y)$ [W/m^2]",
    recommendedI: "$I=q''$ if incoming/nonnegative, otherwise $|q''|$ or split",
    omega: '$\\mathbf{x}\\in A$',
    resultant: "$I_0=\\dot{Q}=\\int_A q''\\,dA$ [W]",
    centroid: "$\\bar{\\mathbf{x}}=\\dot{Q}^{-1}\\int_A \\mathbf{x}q''\\,dA$",
    spread: 'Surface covariance of heating footprint',
    signHandling: 'Separate heat entering and leaving a surface if sign carries physical meaning.',
    intuition: 'The center of heating is the thermal analog of center of pressure.',
    status: 'simulated',
  },
  {
    id: 'M-004',
    domain: 'heat',
    kind: 'volume',
    quantity: "Volumetric heat generation $q'''(x,y,z)$ [W/m^3]",
    recommendedI: "$I=q'''\\ge0$, or split sources and sinks",
    omega: '$\\mathbf{x}\\in V$',
    resultant: "$I_0=\\dot{Q}_{gen}=\\int_V q'''\\,dV$ [W]",
    centroid: "$\\bar{\\mathbf{x}}=I_0^{-1}\\int_V \\mathbf{x}q'''\\,dV$",
    spread: '3D covariance tensor of heat-source distribution',
    signHandling: 'Treat generation and absorption as separate nonnegative fields.',
    intuition: 'A hotspot in a battery or reactor is a volumetric intensity concentration.',
    status: 'simulated',
  },
  {
    id: 'M-005',
    domain: 'fluids',
    kind: 'surface',
    quantity: 'Wall shear stress magnitude $|\\tau_w(x,y)|$',
    recommendedI: '$I=|\\tau_w|$',
    omega: '$\\mathbf{x}\\in A_{wall}$',
    resultant: '$I_0=\\int_A |\\tau_w|\\,dA$',
    centroid: 'Centroid of shear footprint',
    spread: 'Surface covariance of friction loading',
    signHandling: 'Use vector direction separately; the scalar ladder sees magnitude.',
    intuition: 'Skin-friction concentration becomes measurable like a load footprint.',
    status: 'simulated',
  },
  {
    id: 'M-006',
    domain: 'dynamics',
    kind: 'time',
    quantity: 'Force input $F(t)$',
    recommendedI: '$I(t)=|F(t)|$, $F(t)^2$, or $|F(t)v(t)|$',
    omega: '$t\\in[t_0,t_1]$',
    resultant: '$I_0=\\int |F(t)|\\,dt$ [N s]',
    centroid: '$\\bar{t}=I_0^{-1}\\int t|F(t)|\\,dt$',
    spread: 'Temporal spread distinguishes impulse-like versus sustained forcing',
    signHandling: 'Use magnitude, square, or mechanical power depending on the question.',
    intuition: 'The same ladder describes when a force acts, not only where a load acts.',
    status: 'simulated',
  },
  {
    id: 'M-007',
    domain: 'dynamics',
    kind: 'time',
    quantity: 'Torque input $\\tau(t)$',
    recommendedI: '$I(t)=|\\tau(t)|$, $\\tau(t)^2$, or $|\\tau(t)\\omega(t)|$',
    omega: '$t\\in[t_0,t_1]$',
    resultant: '$I_0=\\int |\\tau(t)|\\,dt$',
    centroid: 'Temporal center of torque application',
    spread: 'Temporal spread of torque loading',
    signHandling: 'Magnitude for activity; signed split for clockwise/counterclockwise contributions.',
    intuition: 'Angular impulse fits the same time-domain intensity model as force impulse.',
    status: 'simulated',
  },
  {
    id: 'M-008',
    domain: 'dynamics',
    kind: 'time',
    quantity: 'Translational damper dissipation',
    recommendedI: '$I(t)=b\\dot{x}(t)^2$',
    omega: '$t\\in[t_0,t_1]$',
    resultant: '$I_0=\\int b\\dot{x}^2\\,dt$ [J]',
    centroid: 'Temporal center of dissipated energy',
    spread: 'Burstiness of dissipation',
    signHandling: 'Already nonnegative by construction.',
    intuition: 'Damping energy has a time centroid, just like a load has a spatial centroid.',
    status: 'simulated',
  },
  {
    id: 'M-009',
    domain: 'dynamics',
    kind: 'time',
    quantity: 'Rotational damper dissipation',
    recommendedI: '$I(t)=c(\\Delta\\omega(t))^2$ or $|\\tau_f\\omega|$',
    omega: '$t\\in[t_0,t_1]$',
    resultant: 'Total rotational energy dissipated',
    centroid: 'Average time of rotational dissipation',
    spread: 'Burst versus persistent rotational loss',
    signHandling: 'Dissipation is nonnegative; signed torque is not required.',
    intuition: 'Rotational energy loss is another nonnegative temporal density.',
    status: 'simulated',
  },
  {
    id: 'M-010',
    domain: 'circuits',
    kind: 'graph',
    quantity: 'Circuit branch current magnitude',
    recommendedI: '$I_e=|i_e|$ or $i_e^2$',
    omega: '$e\\in E$',
    resultant: '$I_0=\\sum_{e\\in E}|i_e|$',
    centroid: '$\\bar{\\phi}=I_0^{-1}\\sum_e \\phi(e)|i_e|$',
    spread: 'Spread on graph embedding or hop-distance coordinate',
    signHandling: 'Current direction is signed; intensity uses magnitude or square.',
    intuition: 'A circuit becomes a discrete measure on branches or components.',
    status: 'simulated',
  },
  {
    id: 'M-011',
    domain: 'circuits',
    kind: 'graph',
    quantity: 'Circuit component power dissipation $P_e$',
    recommendedI: '$I_e=P_e\\ge0$',
    omega: '$e\\in E$',
    resultant: '$I_0=\\sum_e P_e$ [W]',
    centroid: 'Center of dissipation on graph or board layout',
    spread: 'Thermal/electrical concentration across components',
    signHandling: 'Use dissipated power, not signed delivered power, unless split by source/load role.',
    intuition: 'Hot components are graph-domain hotspots.',
    status: 'simulated',
  },
  {
    id: 'M-012',
    domain: 'propulsion',
    kind: 'parameter',
    quantity: 'Performance coefficient curve $C_F(\\xi)$',
    recommendedI: '$I(\\xi)=C_F(\\xi)\\ge0$',
    omega: '$\\xi\\in[\\xi_{min},\\xi_{max}]$',
    resultant: 'Integrated performance over parameter sweep',
    centroid: 'Typical or effective operating condition',
    spread: 'Robustness over the design parameter',
    signHandling: 'If coefficient can be negative, shift/split or choose a nonnegative objective.',
    intuition: 'A design curve can be treated as an intensity over parameter space.',
    status: 'simulated',
  },
  {
    id: 'M-013',
    domain: 'propulsion',
    kind: 'parameter',
    quantity: 'Mach flow parameter kernel $MFP(M)$',
    recommendedI: '$I(M)=MFP(M)\\ge0$',
    omega: '$M\\in[M_{min},M_{max}]$',
    resultant: '$I_0=\\int MFP(M)\\,dM$',
    centroid: 'Effective Mach number',
    spread: 'Mach-range sensitivity',
    signHandling: 'Nonnegative by definition; define $M_{min}$ for inverse moments.',
    intuition: 'Mach number is the coordinate; the kernel is the intensity.',
    status: 'simulated',
  },
  {
    id: 'M-014',
    domain: 'propulsion',
    kind: 'surface',
    quantity: 'Nacelle pressure-drag integrand',
    recommendedI: '$I=|p-p_0|$ or split $(p-p_0)^+$ and $(p-p_0)^-$',
    omega: '$\\mathbf{x}\\in A_y$',
    resultant: 'Integrated drag/thrust pressure contribution',
    centroid: 'Center of pressure-drag footprint',
    spread: 'Drag footprint extent and asymmetry',
    signHandling: 'Split favorable and unfavorable pressure contributions when direction matters.',
    intuition: 'Aerodynamic drag maps naturally to a surface intensity.',
    status: 'simulated',
  },
  {
    id: 'M-015',
    domain: 'propulsion',
    kind: 'surface',
    quantity: 'Pressure-thrust density $|p-p_a|$',
    recommendedI: '$I=|p-p_a|$',
    omega: '$\\mathbf{x}\\in A_e$',
    resultant: 'Pressure-thrust contribution',
    centroid: 'Center of exit-plane pressure thrust',
    spread: 'Off-axis pressure-thrust tendency',
    signHandling: 'Absolute value for intensity; signed split for over/under-expanded regions.',
    intuition: 'Exit-plane pressure imbalance becomes a thrust footprint.',
    status: 'simulated',
  },
  {
    id: 'M-016',
    domain: 'propulsion',
    kind: 'surface',
    quantity: 'Momentum-flux density $\\rho u^2$',
    recommendedI: '$I(\\mathbf{x})=\\rho(\\mathbf{x})u(\\mathbf{x})^2$',
    omega: '$\\mathbf{x}\\in A_e$',
    resultant: 'Momentum-thrust component',
    centroid: 'Center of momentum flux',
    spread: 'Alignment and off-axis torque propensity',
    signHandling: 'Use componentwise flux or scalar speed depending on axis of interest.',
    intuition: 'Thrust alignment is a centroid problem.',
    status: 'simulated',
  },
  {
    id: 'M-017',
    domain: 'structures',
    kind: 'volume',
    quantity: 'Body force density $\\mathbf{b}(x,y,z)$',
    recommendedI: '$I=\\|\\mathbf{b}\\|$ or componentwise $|b_i|$',
    omega: '$\\mathbf{x}\\in V$',
    resultant: '$I_0=\\int_V \\|\\mathbf{b}\\|\\,dV$',
    centroid: 'Center of body-force action',
    spread: '3D distribution of body loading',
    signHandling: 'Vector direction is handled outside the scalar intensity, or by component splits.',
    intuition: 'Gravity, electromagnetic body forces, and inertial loads are volume intensities.',
    status: 'simulated',
  },
  {
    id: 'M-018',
    domain: 'structures',
    kind: 'surface',
    quantity: 'Traction magnitude $\\|\\mathbf{t}(x,y)\\|$',
    recommendedI: '$I=\\|\\mathbf{t}\\|$',
    omega: '$\\mathbf{x}\\in A$',
    resultant: '$I_0=\\int_A \\|\\mathbf{t}\\|\\,dA$',
    centroid: 'Center of applied surface traction',
    spread: 'Contact or boundary-load footprint',
    signHandling: 'Analyze direction separately or use componentwise fields.',
    intuition: 'Boundary loading is pressure/shear wrapped into one traction field.',
    status: 'simulated',
  },
  {
    id: 'M-019',
    domain: 'structures',
    kind: 'point',
    quantity: 'Concentrated force idealization $F\\delta(z-z_0)$',
    recommendedI: '$I=F\\delta(z-z_0)$ with finite footprint regularization',
    omega: 'Point support or small contact patch',
    resultant: '$I_0=F$',
    centroid: '$\\bar{z}=z_0$',
    spread: 'Zero in ideal form; finite once contact footprint is modeled',
    signHandling: 'Use $F\\ge0$, magnitude, or signed split.',
    intuition: 'A point load is the limiting case of a narrow intensity field.',
    status: 'simulated',
  },
  {
    id: 'M-020',
    domain: 'structures',
    kind: 'line',
    quantity: 'Distributed moment or torque density $m(x)$',
    recommendedI: '$I(x)=|m(x)|$ or split $m^+,m^-$',
    omega: '$x\\in[0,L]$',
    resultant: '$I_0=\\int_0^L |m(x)|\\,dx$',
    centroid: 'Line coordinate where moment loading concentrates',
    spread: 'Moment-loading footprint along the member',
    signHandling: 'Moment sign usually matters; use split for sagging/hogging or clockwise/counterclockwise.',
    intuition: 'Couples distributed along a beam form a line intensity just like forces.',
    status: 'simulated',
  },
  {
    id: 'M-021',
    domain: 'materials',
    kind: 'volume',
    quantity: 'Elastic strain energy density $u_s=\\frac{1}{2}\\sigma:\\varepsilon$',
    recommendedI: '$I=u_s\\ge0$',
    omega: '$\\mathbf{x}\\in V$',
    resultant: '$I_0=\\int_V u_s\\,dV$ [J]',
    centroid: 'Center of stored elastic energy',
    spread: 'Where structural energy is distributed or concentrated',
    signHandling: 'Energy density is nonnegative for stable elastic response.',
    intuition: 'Stress concentration becomes an energy-density localization problem.',
    status: 'simulated',
  },
  {
    id: 'M-022',
    domain: 'structures',
    kind: 'surface',
    quantity: 'Contact or bearing pressure $p_c(x,y)$',
    recommendedI: '$I=p_c\\ge0$',
    omega: '$\\mathbf{x}\\in A_c$',
    resultant: '$I_0=\\int_{A_c}p_c\\,dA$',
    centroid: 'Center of contact load',
    spread: 'Contact patch size and eccentricity',
    signHandling: 'Contact pressure is compressive/nonnegative; adhesion should be split.',
    intuition: 'Bolted joints, bearings, tires, and seals share the same footprint math.',
    status: 'simulated',
  },
  {
    id: 'M-023',
    domain: 'structures',
    kind: 'line',
    quantity: 'Foundation reaction $q(x)$ [N/m]',
    recommendedI: '$I(x)=q(x)\\ge0$ for compression, or split uplift/compression',
    omega: '$x\\in[0,L]$',
    resultant: '$I_0=\\int q(x)\\,dx$',
    centroid: 'Line of action of soil/foundation support',
    spread: 'Support pressure distribution along the footing or beam',
    signHandling: 'Separate compression from uplift if the model permits tensionless contact.',
    intuition: 'Soil reaction is the mirror image of a distributed beam load.',
    status: 'simulated',
  },
  {
    id: 'M-024',
    domain: 'materials',
    kind: 'volume',
    quantity: 'Mass density $\\rho(x,y,z)$',
    recommendedI: '$I=\\rho\\ge0$',
    omega: '$\\mathbf{x}\\in V$',
    resultant: '$I_0=\\int_V \\rho\\,dV$ [kg]',
    centroid: 'Center of mass',
    spread: 'Mass moment/covariance tensor',
    signHandling: 'Mass density is nonnegative.',
    intuition: 'The framework contains center-of-mass as a special case.',
    status: 'candidate',
  },
  {
    id: 'M-025',
    domain: 'fluids',
    kind: 'surface',
    quantity: 'Mass flux density $\\rho\\mathbf{u}\\cdot\\mathbf{n}$',
    recommendedI: '$I=|\\rho\\mathbf{u}\\cdot\\mathbf{n}|$ or inflow/outflow split',
    omega: '$\\mathbf{x}\\in A$',
    resultant: '$I_0=\\int_A |\\rho\\mathbf{u}\\cdot\\mathbf{n}|\\,dA$',
    centroid: 'Center of mass-flow crossing a surface',
    spread: 'Flow distribution over inlet, outlet, or porous boundary',
    signHandling: 'Split inflow and outflow when direction matters.',
    intuition: 'Flow rate is a surface integral of a flux intensity.',
    status: 'candidate',
  },
  {
    id: 'M-026',
    domain: 'fluids',
    kind: 'volume',
    quantity: 'Kinetic energy density $\\frac{1}{2}\\rho\\|\\mathbf{u}\\|^2$',
    recommendedI: '$I=\\frac{1}{2}\\rho\\|\\mathbf{u}\\|^2\\ge0$',
    omega: '$\\mathbf{x}\\in V$',
    resultant: 'Total kinetic energy in the control volume',
    centroid: 'Center of kinetic-energy concentration',
    spread: 'How broadly motion energy is distributed',
    signHandling: 'Nonnegative by construction.',
    intuition: 'Jets, wakes, and recirculation zones become energy-density maps.',
    status: 'candidate',
  },
  {
    id: 'M-027',
    domain: 'fluids',
    kind: 'volume',
    quantity: 'Viscous dissipation rate $\\Phi(x,y,z)$ [W/m^3]',
    recommendedI: '$I=\\Phi\\ge0$',
    omega: '$\\mathbf{x}\\in V$',
    resultant: '$I_0=\\int_V \\Phi\\,dV$ [W]',
    centroid: 'Center of viscous loss',
    spread: 'Localization of boundary-layer or mixing losses',
    signHandling: 'Dissipation is nonnegative.',
    intuition: 'Losses in a flow are volumetric heat-generation-like intensities.',
    status: 'candidate',
  },
  {
    id: 'M-028',
    domain: 'fluids',
    kind: 'volume',
    quantity: 'Turbulent kinetic energy density $\\rho k$',
    recommendedI: '$I=\\rho k\\ge0$',
    omega: '$\\mathbf{x}\\in V$',
    resultant: 'Integrated turbulent kinetic energy',
    centroid: 'Center of turbulent activity',
    spread: 'Extent of turbulence production or transport',
    signHandling: 'Nonnegative by definition.',
    intuition: 'Turbulence intensity becomes another spatial density.',
    status: 'candidate',
  },
  {
    id: 'M-029',
    domain: 'circuits',
    kind: 'surface',
    quantity: 'Current density magnitude $\\|\\mathbf{J}(x,y)\\|$',
    recommendedI: '$I=\\|\\mathbf{J}\\|$ or componentwise $|J_n|$',
    omega: '$\\mathbf{x}\\in A$',
    resultant: '$I_0=\\int_A \\|\\mathbf{J}\\|\\,dA$',
    centroid: 'Center of conduction through a cross-section',
    spread: 'Current crowding and conductor utilization',
    signHandling: 'Use normal component with inflow/outflow split for signed transport.',
    intuition: 'Current crowding is a surface intensity concentration.',
    status: 'candidate',
  },
  {
    id: 'M-030',
    domain: 'circuits',
    kind: 'volume',
    quantity: 'Joule heating density $\\sigma\\|\\mathbf{E}\\|^2$',
    recommendedI: '$I=\\sigma\\|\\mathbf{E}\\|^2\\ge0$',
    omega: '$\\mathbf{x}\\in V$',
    resultant: '$I_0=\\int_V \\sigma\\|\\mathbf{E}\\|^2\\,dV$ [W]',
    centroid: 'Center of electrical heat generation',
    spread: 'Thermal hotspot spread in conductors',
    signHandling: 'Nonnegative by construction.',
    intuition: 'Electrical and thermal views meet exactly here.',
    status: 'candidate',
  },
  {
    id: 'M-031',
    domain: 'circuits',
    kind: 'volume',
    quantity: 'Electromagnetic energy density',
    recommendedI: '$I=\\frac{1}{2}(\\epsilon\\|\\mathbf{E}\\|^2+\\mu\\|\\mathbf{H}\\|^2)\\ge0$',
    omega: '$\\mathbf{x}\\in V$',
    resultant: 'Stored electromagnetic energy',
    centroid: 'Center of stored field energy',
    spread: 'Field localization around conductors, cavities, or antennas',
    signHandling: 'Energy density is nonnegative.',
    intuition: 'Fields become spatial energy densities, ready for the same ladder.',
    status: 'candidate',
  },
  {
    id: 'M-032',
    domain: 'waves',
    kind: 'surface',
    quantity: 'Acoustic intensity magnitude',
    recommendedI: '$I=|p^{\\prime}\\mathbf{u}^{\\prime}\\cdot\\mathbf{n}|$ or time-averaged positive intensity',
    omega: '$\\mathbf{x}\\in A$',
    resultant: 'Total acoustic power crossing a surface',
    centroid: 'Center of acoustic radiation',
    spread: 'Directivity footprint',
    signHandling: 'Use outward/inward split for signed acoustic power flow.',
    intuition: 'Sound radiation has a center and spread over a measurement surface.',
    status: 'candidate',
  },
  {
    id: 'M-033',
    domain: 'propulsion',
    kind: 'volume',
    quantity: 'Combustor heat-release rate $\\dot{q}_{chem}$',
    recommendedI: '$I=\\dot{q}_{chem}\\ge0$',
    omega: '$\\mathbf{x}\\in V_{comb}$',
    resultant: 'Total chemical heat release [W]',
    centroid: 'Flame or heat-release center',
    spread: 'Combustion-zone thickness and shape',
    signHandling: 'Separate heat release from endothermic zones if both appear.',
    intuition: 'Combustion becomes a volumetric source intensity.',
    status: 'candidate',
  },
  {
    id: 'M-034',
    domain: 'heat',
    kind: 'volume',
    quantity: 'Entropy generation density $\\dot{s}_{gen}$',
    recommendedI: '$I=\\dot{s}_{gen}\\ge0$',
    omega: '$\\mathbf{x}\\in V$',
    resultant: '$I_0=\\int_V \\dot{s}_{gen}\\,dV$',
    centroid: 'Center of irreversibility',
    spread: 'Where thermodynamic losses are concentrated',
    signHandling: 'Entropy generation is nonnegative for irreversible processes.',
    intuition: 'Second-law losses can be mapped with the same geometric ladder.',
    status: 'candidate',
  },
  {
    id: 'M-035',
    domain: 'heat',
    kind: 'surface',
    quantity: 'Radiative heat flux or irradiance $G(x,y)$',
    recommendedI: '$I=G\\ge0$ or $|q_{rad}|$',
    omega: '$\\mathbf{x}\\in A$',
    resultant: 'Total radiative power',
    centroid: 'Center of radiative loading',
    spread: 'Illumination or thermal-radiation footprint',
    signHandling: 'Split incident and emitted radiation if direction matters.',
    intuition: 'Radiation loading is another surface flux intensity.',
    status: 'simulated',
  },
  {
    id: 'M-036',
    domain: 'waves',
    kind: 'frequency',
    quantity: 'Power spectral density $S_{xx}(f)$',
    recommendedI: '$I(f)=S_{xx}(f)\\ge0$',
    omega: '$f\\in[f_{min},f_{max}]$',
    resultant: 'Total signal power or variance over the band',
    centroid: 'Spectral centroid',
    spread: 'Bandwidth or spectral dispersion',
    signHandling: 'PSD is nonnegative; phase requires a separate formalism.',
    intuition: 'Frequency content has a center and spread just like spatial loads.',
    status: 'simulated',
  },
  {
    id: 'M-037',
    domain: 'materials',
    kind: 'line',
    quantity: 'Crack-front energy release rate $G(s)$',
    recommendedI: '$I(s)=G(s)\\ge0$',
    omega: '$s$ along crack front',
    resultant: 'Integrated fracture-driving intensity along the front',
    centroid: 'Region of dominant crack-driving force',
    spread: 'Uniform versus localized fracture demand',
    signHandling: 'Use positive release rate; inactive/closing regions can be zeroed or split.',
    intuition: 'Fracture mechanics can be read as an intensity along a curve.',
    status: 'candidate',
  },
  {
    id: 'M-038',
    domain: 'propulsion',
    kind: 'surface',
    quantity: 'Mass-flow density at nozzle or inlet',
    recommendedI: '$I=\\rho\\mathbf{u}\\cdot\\mathbf{n}$ for outward flow, or magnitude/split',
    omega: '$\\mathbf{x}\\in A$',
    resultant: '$\\dot{m}=\\int_A \\rho\\mathbf{u}\\cdot\\mathbf{n}\\,dA$',
    centroid: 'Center of mass flow through the plane',
    spread: 'Flow uniformity and distortion',
    signHandling: 'Use signed split if recirculation creates backflow.',
    intuition: 'Inlet distortion and nozzle nonuniformity are moment-ladder problems.',
    status: 'candidate',
  },
  {
    id: 'M-039',
    domain: 'structures',
    kind: 'line',
    quantity: 'Aerodynamic lift or drag distribution $l(x),d(x)$ [N/m]',
    recommendedI: '$I(x)=l(x)$ or $d(x)$ when nonnegative; otherwise split',
    omega: '$x$ along span or chord',
    resultant: 'Total lift or drag',
    centroid: 'Center of pressure/load along span or chord',
    spread: 'Load distribution and root-bending tendency',
    signHandling: 'Split sign-changing lift or use magnitude when total activity is desired.',
    intuition: 'A wing load is a structural line load with aerodynamic origins.',
    status: 'candidate',
  },
  {
    id: 'M-040',
    domain: 'materials',
    kind: 'volume',
    quantity: 'Damage or fatigue density $D(x)$',
    recommendedI: '$I=D\\ge0$ or cycle damage rate $\\dot{D}\\ge0$',
    omega: '$\\mathbf{x}\\in V$ or surface hot-spot set',
    resultant: 'Total accumulated damage proxy',
    centroid: 'Center of fatigue demand',
    spread: 'Distributed versus localized damage',
    signHandling: 'Damage accumulation is nonnegative; recovery models should be split.',
    intuition: 'Fatigue hot spots can be mapped as an evolving intensity field.',
    status: 'candidate',
  },
  {
    id: 'M-041',
    domain: 'structures',
    kind: 'surface',
    quantity: 'Section area density for centroids $dA$',
    recommendedI: '$I(\\mathbf{x})=1$ for uniform area, or $I=t(\\mathbf{x})\\ge0$ for plate thickness',
    omega: '$\\mathbf{x}\\in A$',
    resultant: '$I_0=A$ or effective area',
    centroid: 'Geometric centroid or thickness-weighted centroid',
    spread: 'Area covariance; the backbone of second moments of area',
    signHandling: 'Area and thickness are nonnegative; holes should be modeled as removed domains or separate negative parts.',
    intuition: 'Statics centroid tables are just the moment ladder applied to a flat area intensity.',
    status: 'simulated',
  },
  {
    id: 'M-042',
    domain: 'structures',
    kind: 'surface',
    quantity: 'Second moment of area kernel $(y-y_0)^2$ or $r^2$',
    recommendedI: '$I(\\mathbf{x})=(y-y_0)^2$ for $I_x$, or $I(\\mathbf{x})=r^2$ for polar area moment',
    omega: '$\\mathbf{x}\\in A$',
    resultant: '$I_0=\\int_A (y-y_0)^2\\,dA$ or $J=\\int_A r^2\\,dA$',
    centroid: 'Where geometric bending or torsion contribution is concentrated',
    spread: 'How far the stiffness kernel itself is distributed over the section',
    signHandling: 'Square-distance kernels are nonnegative; signed products of inertia should be split by quadrant sign.',
    intuition: 'Area moments are intensity fields whose mass is geometric leverage.',
    status: 'simulated',
  },
  {
    id: 'M-043',
    domain: 'dynamics',
    kind: 'volume',
    quantity: 'Mass moment of inertia density $\\rho r_\\perp^2$',
    recommendedI: '$I(\\mathbf{x})=\\rho(\\mathbf{x})r_\\perp(\\mathbf{x})^2\\ge0$',
    omega: '$\\mathbf{x}\\in V$',
    resultant: '$I_0=\\int_V \\rho r_\\perp^2\\,dV$',
    centroid: 'Center of rotational inertia contribution about the chosen axis',
    spread: 'How broadly inertial resistance is distributed through the body',
    signHandling: 'Mass and squared distance are nonnegative; tensor cross-products need componentwise sign policies.',
    intuition: 'Rigid-body inertia is a weighted volume field, not a mysterious scalar from nowhere.',
    status: 'candidate',
  },
  {
    id: 'M-044',
    domain: 'materials',
    kind: 'volume',
    quantity: 'Equivalent stress field $\\sigma_{eq}(\\mathbf{x})$',
    recommendedI: '$I=\\sigma_{vm}\\ge0$, $|\\sigma_n|$, or $|\\tau|$ depending on the failure question',
    omega: '$\\mathbf{x}\\in V$',
    resultant: 'Total stress demand proxy over the part',
    centroid: 'Stress-demand center inside the body',
    spread: 'Diffuse loading versus stress concentration',
    signHandling: 'Use equivalent or magnitude stress for intensity; split tension/compression when sign has design meaning.',
    intuition: 'Stress plots become measurable fields whose hotspots, centers, and spreads can be compared.',
    status: 'simulated',
  },
  {
    id: 'M-045',
    domain: 'materials',
    kind: 'volume',
    quantity: 'Plastic work density $w_p(\\mathbf{x})$',
    recommendedI: '$I=w_p=\\int \\sigma:d\\varepsilon_p\\ge0$ or rate $\\dot{w}_p\\ge0$',
    omega: '$\\mathbf{x}\\in V$',
    resultant: 'Total plastic dissipation',
    centroid: 'Center of permanent deformation work',
    spread: 'Localized hinge or shear band versus distributed yielding',
    signHandling: 'Dissipated work is nonnegative; unloading energy should be tracked as a separate stored/recovered field.',
    intuition: 'Yielding is not only a threshold event; it has a spatial intensity.',
    status: 'simulated',
  },
  {
    id: 'M-046',
    domain: 'materials',
    kind: 'volume',
    quantity: 'Equivalent strain or strain-rate magnitude',
    recommendedI: '$I=\\varepsilon_{eq}\\ge0$, $\\dot{\\varepsilon}_{eq}\\ge0$, or $\\|\\varepsilon\\|$',
    omega: '$\\mathbf{x}\\in V$',
    resultant: 'Total deformation demand proxy',
    centroid: 'Center of strain demand',
    spread: 'Broad compliance versus localized deformation',
    signHandling: 'Equivalent strain is nonnegative; signed normal strain should be split into tensile and compressive parts.',
    intuition: 'A strain map can be read with the same centroid and spread language as a load map.',
    status: 'simulated',
  },
  {
    id: 'M-047',
    domain: 'materials',
    kind: 'graph',
    quantity: 'Finite-element nodal force magnitude $\\|\\mathbf{F}_i\\|$',
    recommendedI: '$I_i=\\|\\mathbf{F}_i\\|$ on mesh nodes, or split force components by sign',
    omega: '$i\\in \\mathcal{N}$ with node embedding $\\phi(i)$',
    resultant: '$I_0=\\sum_i \\|\\mathbf{F}_i\\|$',
    centroid: 'Load center over the mesh graph',
    spread: 'Point-loaded versus distributed nodal forcing',
    signHandling: 'Use magnitudes for demand; split components when equilibrium direction matters.',
    intuition: 'FE load vectors become graph intensities once each node has a position.',
    status: 'simulated',
  },
  {
    id: 'M-048',
    domain: 'materials',
    kind: 'graph',
    quantity: 'Finite-element error indicator $\\eta_e^2$',
    recommendedI: '$I_e=\\eta_e^2\\ge0$ on elements',
    omega: '$e\\in \\mathcal{E}$ with element centroid embedding $\\phi(e)$',
    resultant: '$I_0=\\sum_e \\eta_e^2$',
    centroid: 'Center of estimated discretization error',
    spread: 'Localized mesh defect versus global refinement need',
    signHandling: 'Squared estimators are nonnegative; signed residual components should be squared or split.',
    intuition: 'Adaptive meshing already chases an intensity field: where the error lives.',
    status: 'simulated',
  },
  {
    id: 'M-049',
    domain: 'heat',
    kind: 'volume',
    quantity: 'Thermal energy storage density $\\rho c_p(T-T_{ref})$',
    recommendedI: '$I=\\rho c_p\\max(T-T_{ref},0)$, or split above/below reference temperature',
    omega: '$\\mathbf{x}\\in V$',
    resultant: 'Stored sensible heat relative to the reference state',
    centroid: 'Thermal-energy center',
    spread: 'Uniform heating versus localized thermal mass',
    signHandling: 'Temperature relative to a reference can be signed; use positive/negative split or absolute departure.',
    intuition: 'Heat capacity turns a temperature field into stored-energy intensity.',
    status: 'candidate',
  },
  {
    id: 'M-050',
    domain: 'heat',
    kind: 'surface',
    quantity: "Convective heat-transfer density $q''_{conv}$",
    recommendedI: "$I=h|T_s-T_\\infty|$ or incoming $q''_{conv}\\ge0$",
    omega: '$\\mathbf{x}\\in A_s$',
    resultant: 'Total convective heat-transfer rate',
    centroid: 'Center of convective exchange on the surface',
    spread: 'Uniform cooling/heating versus concentrated thermal exchange',
    signHandling: 'Use magnitude for exchange intensity; split heating and cooling when direction matters.',
    intuition: 'Convection maps become surface load maps for thermal design.',
    status: 'simulated',
  },
  {
    id: 'M-051',
    domain: 'heat',
    kind: 'surface',
    quantity: 'Conductive normal heat flux $\\mathbf{q}\\cdot\\mathbf{n}$',
    recommendedI: '$I=|\\mathbf{q}\\cdot\\mathbf{n}|$ or split inward/outward conduction',
    omega: '$\\mathbf{x}\\in A$',
    resultant: 'Total conductive heat rate across a boundary',
    centroid: 'Center of heat crossing the boundary',
    spread: 'Broad thermal leakage versus a local bridge',
    signHandling: 'Normal flux is signed by convention; split inward and outward flow for balances.',
    intuition: 'Boundary heat leakage is a surface intensity with a very physical centroid.',
    status: 'simulated',
  },
  {
    id: 'M-052',
    domain: 'heat',
    kind: 'volume',
    quantity: 'Species concentration or mass fraction field',
    recommendedI: '$I=C_A(\\mathbf{x})\\ge0$ or $I=\\rho Y_A\\ge0$',
    omega: '$\\mathbf{x}\\in V$',
    resultant: 'Total species amount in the domain',
    centroid: 'Center of concentration or mixture component',
    spread: 'Mixed species versus plume or pocket',
    signHandling: 'Concentration and mass fraction are nonnegative; use departure-from-baseline split for anomalies.',
    intuition: 'Mass transfer fits the same density logic as heat, charge, or load.',
    status: 'candidate',
  },
  {
    id: 'M-053',
    domain: 'fluids',
    kind: 'volume',
    quantity: 'Enstrophy or vorticity intensity $\\frac{1}{2}\\|\\boldsymbol{\\omega}\\|^2$',
    recommendedI: '$I=\\frac{1}{2}\\|\\nabla\\times\\mathbf{u}\\|^2\\ge0$',
    omega: '$\\mathbf{x}\\in V$',
    resultant: 'Total rotational flow activity proxy',
    centroid: 'Vortex-activity center',
    spread: 'Coherent vortex core versus diffuse shear',
    signHandling: 'Vorticity components are signed; square magnitude or split components by sign.',
    intuition: 'Rotational flow structures become visible as a nonnegative field over the fluid volume.',
    status: 'candidate',
  },
  {
    id: 'M-054',
    domain: 'circuits',
    kind: 'time',
    quantity: 'Charge-delivery waveform from current $i(t)$',
    recommendedI: '$I(t)=|i(t)|$, $i(t)^2$, or signed split $i^+,i^-$',
    omega: '$t\\in[t_0,t_1]$',
    resultant: 'Total charge throughput or current activity',
    centroid: 'Time at which charge transfer is centered',
    spread: 'Pulse duration or temporal concentration',
    signHandling: 'Current direction is signed; split charge directions when polarity matters.',
    intuition: 'A current pulse has a resultant, center time, and width just like a force pulse.',
    status: 'candidate',
  },
  {
    id: 'M-055',
    domain: 'circuits',
    kind: 'graph',
    quantity: 'Capacitor stored energy $\\frac{1}{2}C_ev_e^2$',
    recommendedI: '$I_e=\\frac{1}{2}C_ev_e^2\\ge0$ on capacitor elements',
    omega: '$e\\in E_C$',
    resultant: 'Total electric energy stored in capacitors',
    centroid: 'Where capacitive energy is concentrated in the circuit graph',
    spread: 'Distributed storage versus one dominant capacitor',
    signHandling: 'Energy is nonnegative even when voltage polarity changes.',
    intuition: 'Energy storage components can be located and compared as graph intensities.',
    status: 'simulated',
  },
  {
    id: 'M-056',
    domain: 'circuits',
    kind: 'graph',
    quantity: 'Inductor stored energy $\\frac{1}{2}L_ei_e^2$',
    recommendedI: '$I_e=\\frac{1}{2}L_ei_e^2\\ge0$ on inductor elements',
    omega: '$e\\in E_L$',
    resultant: 'Total magnetic energy stored in inductors',
    centroid: 'Where inductive energy is concentrated in the circuit graph',
    spread: 'Distributed inductive storage versus a dominant coil',
    signHandling: 'Energy is nonnegative even when current direction changes.',
    intuition: 'Inductive storage sits on branches and obeys the same moment ladder as any graph field.',
    status: 'simulated',
  },
  {
    id: 'M-057',
    domain: 'circuits',
    kind: 'surface',
    quantity: 'Surface charge density $\\sigma_s(x,y)$',
    recommendedI: '$I=|\\sigma_s|$ or split positive/negative surface charge',
    omega: '$\\mathbf{x}\\in A_c$',
    resultant: 'Total unsigned surface charge or polarity-specific charge',
    centroid: 'Center of charge on a conductor or dielectric surface',
    spread: 'Charge crowding versus uniform distribution',
    signHandling: 'Charge is signed; split positive and negative charge to preserve polarity.',
    intuition: 'Electrostatic charge distributions are literal surface intensity fields once sign is handled.',
    status: 'candidate',
  },
  {
    id: 'M-058',
    domain: 'dynamics',
    kind: 'time',
    quantity: 'Control effort density $u(t)^TRu(t)$',
    recommendedI: '$I(t)=u(t)^TRu(t)\\ge0$ with $R\\succeq0$',
    omega: '$t\\in[t_0,t_1]$',
    resultant: 'Total weighted control effort',
    centroid: 'Time at which actuation effort is centered',
    spread: 'Short aggressive actuation versus broad gentle actuation',
    signHandling: 'The quadratic effort is nonnegative; signed control inputs may also be split by actuator direction.',
    intuition: 'Control cost functions already define a time-domain intensity field.',
    status: 'candidate',
  },
  {
    id: 'M-059',
    domain: 'waves',
    kind: 'frequency',
    quantity: 'Frequency-response output power density $|H(f)|^2S_{xx}(f)$',
    recommendedI: '$I(f)=|H(f)|^2S_{xx}(f)\\ge0$',
    omega: '$f\\in[f_{min},f_{max}]$',
    resultant: 'Predicted output variance or response power',
    centroid: 'Dominant response frequency',
    spread: 'Narrow resonance versus broadband response',
    signHandling: 'Power spectra and squared gains are nonnegative; signed phase is separate from intensity.',
    intuition: 'Vibration and measurement spectra become frequency-domain loads.',
    status: 'simulated',
  },
  {
    id: 'M-060',
    domain: 'propulsion',
    kind: 'time',
    quantity: 'Thrust history $T(t)$',
    recommendedI: '$I(t)=T(t)\\ge0$ for axial thrust, or $|T(t)|$ / split for signed axes',
    omega: '$t\\in[t_0,t_b]$',
    resultant: 'Total impulse $\\int T\\,dt$',
    centroid: 'Impulse center time',
    spread: 'Burn duration and thrust concentration',
    signHandling: 'Thrust along a declared positive axis is nonnegative; split reverse thrust or vector components.',
    intuition: 'Rocket and turbine thrust curves are time-domain intensity fields whose centroid is burn timing.',
    status: 'simulated',
  },
  {
    id: 'M-061',
    domain: 'propulsion',
    kind: 'time',
    quantity: 'Propellant mass-flow history $\\dot{m}_p(t)$',
    recommendedI: '$I(t)=\\dot{m}_p(t)\\ge0$',
    omega: '$t\\in[t_0,t_b]$',
    resultant: 'Total propellant consumed',
    centroid: 'Mass-consumption center time',
    spread: 'Steady burn versus front- or back-loaded consumption',
    signHandling: 'Consumption rate is nonnegative; tank refill or reverse flow should be separate.',
    intuition: 'Mass flow over time is the fuel-side twin of the thrust impulse ladder.',
    status: 'simulated',
  },
  {
    id: 'M-062',
    domain: 'propulsion',
    kind: 'surface',
    quantity: "Combustor or nozzle wall heat flux $q''_w$",
    recommendedI: "$I=q''_w\\ge0$ for incoming wall heating, or $|q''_w|$",
    omega: '$\\mathbf{x}\\in A_{wall}$',
    resultant: 'Total wall heat load',
    centroid: 'Thermal-load center on the engine wall',
    spread: 'Localized hot streak versus distributed heating',
    signHandling: 'Use incoming heat as positive; split cooling and heating when both occur.',
    intuition: 'Thermal protection design needs not just peak heat flux, but where the whole field acts.',
    status: 'candidate',
  },
  {
    id: 'M-063',
    domain: 'propulsion',
    kind: 'parameter',
    quantity: 'Compressor or turbine loss coefficient map $\\zeta(\\xi)$',
    recommendedI: '$I(\\xi)=\\zeta(\\xi)\\ge0$ or entropy-rise proxy $\\Delta s(\\xi)\\ge0$',
    omega: '$\\xi$ along stage, radius, corrected flow, or operating line',
    resultant: 'Total loss accumulation over the chosen parameter axis',
    centroid: 'Where losses concentrate in the operating map or machine coordinate',
    spread: 'Localized loss mechanism versus broad efficiency penalty',
    signHandling: 'Loss coefficients are nonnegative; efficiency gains should be tracked as separate improvement fields.',
    intuition: 'Performance maps can be read as intensity fields over design or operating coordinates.',
    status: 'simulated',
  },
  {
    id: 'M-064',
    domain: 'fluids',
    kind: 'surface',
    quantity: 'Drag or lift pressure coefficient magnitude $|C_p-C_{p,ref}|$',
    recommendedI: '$I=|C_p-C_{p,ref}|$ or split suction/pressure sides',
    omega: '$\\mathbf{x}\\in A_{body}$',
    resultant: 'Integrated aerodynamic pressure activity',
    centroid: 'Center of pressure-coefficient activity on the body',
    spread: 'Broad pressure loading versus localized separation or shock effect',
    signHandling: 'Pressure coefficient is signed relative to reference; split positive and negative regions when force direction matters.',
    intuition: 'Dimensionless aerodynamic maps still become intensities once a sign convention is declared.',
    status: 'candidate',
  },
  {
    id: 'M-065',
    domain: 'structures',
    kind: 'line',
    quantity: 'Beam bending strain-energy density $M(x)^2/(2EI)$',
    recommendedI: '$I(x)=M(x)^2/(2E(x)I_b(x))\\ge0$',
    omega: '$x\\in[0,L]$',
    resultant: 'Total flexural strain energy',
    centroid: 'Where bending energy is centered along the member',
    spread: 'Broad curvature demand versus localized hinge-like bending',
    signHandling: 'The squared moment kernel is nonnegative; signed moment diagrams can be split separately for sagging/hogging interpretation.',
    intuition: 'Beam energy methods become a line intensity over the span.',
    status: 'simulated',
  },
  {
    id: 'M-066',
    domain: 'structures',
    kind: 'line',
    quantity: 'Shaft torsional strain-energy density $T(x)^2/(2GJ)$',
    recommendedI: '$I(x)=T(x)^2/(2G(x)J(x))\\ge0$',
    omega: '$x\\in[0,L]$',
    resultant: 'Total torsional strain energy',
    centroid: 'Where twist energy is centered along a shaft',
    spread: 'Distributed torsion versus a concentrated torque-transfer region',
    signHandling: 'The energy kernel is nonnegative; split torque sign only when rotation direction matters.',
    intuition: 'Torsion diagrams can be read as energy intensity fields, not only signed internal resultants.',
    status: 'simulated',
  },
  {
    id: 'M-067',
    domain: 'structures',
    kind: 'line',
    quantity: 'Axial member strain-energy density $N(x)^2/(2EA)$',
    recommendedI: '$I(x)=N(x)^2/(2E(x)A(x))\\ge0$',
    omega: '$x\\in[0,L]$',
    resultant: 'Total axial strain energy',
    centroid: 'Where axial deformation energy is centered',
    spread: 'Uniform member stretch versus localized compliance',
    signHandling: 'The squared force energy is nonnegative; split tension and compression if stability or material response differs.',
    intuition: 'Truss and rod energy can join bending and torsion in the same line-domain ladder.',
    status: 'simulated',
  },
  {
    id: 'M-068',
    domain: 'structures',
    kind: 'line',
    quantity: 'Thin-wall shear flow magnitude $|q_s(s)|$',
    recommendedI: '$I(s)=|q_s(s)|$ or split clockwise/counterclockwise flow',
    omega: '$s$ along a thin-wall section midline',
    resultant: 'Total shear-flow activity around the section',
    centroid: 'Where shear transfer is concentrated along the wall',
    spread: 'Localized web demand versus distributed closed-section flow',
    signHandling: 'Shear flow is signed by wall tangent; use magnitude for demand or split by circulation direction.',
    intuition: 'Thin-wall beams turn a cross-section outline into a one-dimensional intensity domain.',
    status: 'candidate',
  },
  {
    id: 'M-069',
    domain: 'heat',
    kind: 'volume',
    quantity: 'Thermal-gradient energy $k\\|\\nabla T\\|^2$',
    recommendedI: '$I(\\mathbf{x})=k(\\mathbf{x})\\|\\nabla T(\\mathbf{x})\\|^2\\ge0$',
    omega: '$\\mathbf{x}\\in V$',
    resultant: 'Total conduction-gradient activity',
    centroid: 'Center of thermal-gradient demand',
    spread: 'Smooth conduction field versus localized thermal bottleneck',
    signHandling: 'Gradient energy is nonnegative; signed temperature gradients should be treated componentwise if direction matters.',
    intuition: 'A steep thermal gradient is a spatial intensity even before a boundary heat rate is integrated.',
    status: 'candidate',
  },
  {
    id: 'M-070',
    domain: 'heat',
    kind: 'line',
    quantity: 'Fin heat-loss density $hP(T(x)-T_\\infty)$',
    recommendedI: '$I(x)=h(x)P(x)|T(x)-T_\\infty|$ or outgoing positive heat loss',
    omega: '$x$ along a fin or extended surface',
    resultant: 'Total heat removed or added by the fin',
    centroid: 'Effective heat-transfer location along the fin',
    spread: 'Tip-loaded versus base-loaded fin performance',
    signHandling: 'Use magnitude for exchange intensity; split heating and cooling if ambient direction changes.',
    intuition: 'Fin equations are line-domain heat-flow intensity models.',
    status: 'simulated',
  },
  {
    id: 'M-071',
    domain: 'heat',
    kind: 'surface',
    quantity: 'Diffusive species flux $|\\mathbf{j}_A\\cdot\\mathbf{n}|$',
    recommendedI: '$I=|\\mathbf{j}_A\\cdot\\mathbf{n}|=|(-D\\nabla C_A)\\cdot\\mathbf{n}|$',
    omega: '$\\mathbf{x}\\in A$',
    resultant: 'Total species transfer rate across the boundary',
    centroid: 'Center of diffusive exchange',
    spread: 'Uniform diffusion versus localized membrane or boundary-layer transport',
    signHandling: 'Normal diffusive flux is signed by the chosen normal; split inward and outward species transfer.',
    intuition: 'Mass transfer is heat-flux logic with concentration replacing temperature.',
    status: 'candidate',
  },
  {
    id: 'M-072',
    domain: 'heat',
    kind: 'volume',
    quantity: 'Reaction-rate density $\\dot{\\omega}_A(\\mathbf{x})$',
    recommendedI: '$I=|\\dot{\\omega}_A|$ or split production and consumption',
    omega: '$\\mathbf{x}\\in V$',
    resultant: 'Total reaction production or consumption rate',
    centroid: 'Center of chemical activity',
    spread: 'Distributed reaction zone versus localized front',
    signHandling: 'Species source terms can be signed; compute separate ladders for production and consumption.',
    intuition: 'Chemical source terms are volumetric intensity fields once their sign is declared.',
    status: 'candidate',
  },
  {
    id: 'M-073',
    domain: 'fluids',
    kind: 'parameter',
    quantity: 'Pressure-loss coefficient density $K(\\xi)$',
    recommendedI: '$I(\\xi)=K(\\xi)\\ge0$ or local loss contribution $dK/d\\xi\\ge0$',
    omega: '$\\xi$ along fittings, components, or flow path index',
    resultant: 'Total minor-loss coefficient over the path',
    centroid: 'Where losses concentrate in the flow path',
    spread: 'One dominant restriction versus distributed loss',
    signHandling: 'Loss coefficients are nonnegative; pressure recovery should be modeled as a separate gain field.',
    intuition: 'Pipe networks and ducts can expose where head is being spent.',
    status: 'candidate',
  },
  {
    id: 'M-074',
    domain: 'fluids',
    kind: 'line',
    quantity: 'Hydraulic head-loss density $dh_L/dx$',
    recommendedI: '$I(x)=dh_L/dx\\ge0$ or friction-loss rate per length',
    omega: '$x$ along a pipe, duct, or channel',
    resultant: 'Total distributed head loss',
    centroid: 'Effective location of frictional loss',
    spread: 'Uniform pipe loss versus localized roughness or restriction',
    signHandling: 'Head loss is nonnegative along the declared flow direction; reverse flow should use its own orientation.',
    intuition: 'Frictional pressure drop is a line load in energy units.',
    status: 'candidate',
  },
  {
    id: 'M-075',
    domain: 'circuits',
    kind: 'surface',
    quantity: 'Magnetic flux density magnitude $|\\mathbf{B}\\cdot\\mathbf{n}|$',
    recommendedI: '$I=|\\mathbf{B}\\cdot\\mathbf{n}|$ or split flux direction',
    omega: '$\\mathbf{x}\\in A$',
    resultant: 'Unsigned magnetic flux through a surface',
    centroid: 'Center of magnetic flux crossing the surface',
    spread: 'Concentrated core flux versus leakage field',
    signHandling: 'Magnetic flux is oriented; split positive and negative normal flux when sign matters.',
    intuition: 'Flux maps become surface intensities once the normal orientation is explicit.',
    status: 'candidate',
  },
  {
    id: 'M-076',
    domain: 'dynamics',
    kind: 'time',
    quantity: 'Tracking-error cost $e(t)^TQe(t)$',
    recommendedI: '$I(t)=e(t)^TQe(t)\\ge0$ with $Q\\succeq0$',
    omega: '$t\\in[t_0,t_1]$',
    resultant: 'Total tracking-error cost',
    centroid: 'Time at which the error cost is centered',
    spread: 'Brief transient miss versus persistent tracking error',
    signHandling: 'Quadratic error is nonnegative; signed error components can also be split by direction.',
    intuition: 'Control performance indexes are time-domain intensity fields.',
    status: 'candidate',
  },
  {
    id: 'M-077',
    domain: 'dynamics',
    kind: 'time',
    quantity: 'State-energy measure $x(t)^TPx(t)$',
    recommendedI: '$I(t)=x(t)^TPx(t)\\ge0$ with $P\\succeq0$',
    omega: '$t\\in[t_0,t_1]$',
    resultant: 'Total state-energy or Lyapunov activity over time',
    centroid: 'Time at which system-state activity is centered',
    spread: 'Impulsive state excursion versus long settling tail',
    signHandling: 'The quadratic form is nonnegative for positive semidefinite $P$; signed states should not be used directly as intensities.',
    intuition: 'A state-space trajectory can be summarized by the moment ladder without losing timing intuition.',
    status: 'candidate',
  },
  {
    id: 'M-078',
    domain: 'waves',
    kind: 'frequency',
    quantity: 'Sensor-noise spectral density $S_n(f)$',
    recommendedI: '$I(f)=S_n(f)\\ge0$',
    omega: '$f\\in[f_{min},f_{max}]$',
    resultant: 'Total noise variance over the band',
    centroid: 'Noise-weighted center frequency',
    spread: 'Narrowband interference versus broadband sensor noise',
    signHandling: 'Spectral density is nonnegative; phase and bias signs are separate fields.',
    intuition: 'Measurement noise becomes easier to compare when treated as a frequency intensity.',
    status: 'simulated',
  },
  {
    id: 'M-079',
    domain: 'waves',
    kind: 'frequency',
    quantity: 'Shock or response spectrum ordinate $S_a(f)$',
    recommendedI: '$I(f)=S_a(f)^2$ or $|S_a(f)|$ over a selected response band',
    omega: '$f\\in[f_{min},f_{max}]$',
    resultant: 'Total response-spectrum demand proxy',
    centroid: 'Dominant response frequency',
    spread: 'Sharp resonance versus broadband shock demand',
    signHandling: 'Spectrum ordinates are usually nonnegative; signed time response belongs in a separate time-domain split.',
    intuition: 'Shock and vibration specifications can be read as frequency-domain load shapes.',
    status: 'simulated',
  },
  {
    id: 'M-080',
    domain: 'propulsion',
    kind: 'parameter',
    quantity: 'Turbomachinery stage-work density $\\Delta h_0(\\xi)$',
    recommendedI: '$I(\\xi)=|\\Delta h_0(\\xi)|$ or split compressor work and turbine work',
    omega: '$\\xi$ along stage number, radius, or operating line',
    resultant: 'Total stagnation-enthalpy work over the chosen coordinate',
    centroid: 'Where stage work is concentrated',
    spread: 'Single-stage loading versus distributed work split',
    signHandling: 'Compressor and turbine work have opposite signs by convention; split work input and work extraction.',
    intuition: 'Stage matching becomes a parameter-domain intensity problem.',
    status: 'simulated',
  },
  {
    id: 'M-081',
    domain: 'propulsion',
    kind: 'line',
    quantity: 'Blade loading distribution $\\Delta p(s)$ or $f(s)$',
    recommendedI: '$I(s)=|\\Delta p(s)|$ or aerodynamic force per span $|f(s)|$',
    omega: '$s$ along blade span or chord',
    resultant: 'Total blade loading proxy',
    centroid: 'Effective load center on the blade coordinate',
    spread: 'Root-heavy loading versus tip-heavy loading',
    signHandling: 'Pressure difference and force can be signed; split suction/pressure-side or use magnitude for demand.',
    intuition: 'Blade aerodynamics mirrors beam loading once span or chord becomes the domain.',
    status: 'candidate',
  },
  {
    id: 'M-082',
    domain: 'propulsion',
    kind: 'time',
    quantity: 'Emission mass-rate history $\\dot{m}_{em}(t)$',
    recommendedI: '$I(t)=\\dot{m}_{em}(t)\\ge0$ for each species',
    omega: '$t\\in[t_0,t_1]$',
    resultant: 'Total emitted mass for the chosen species',
    centroid: 'Emission-weighted time during a run or mission segment',
    spread: 'Startup spike versus sustained emission production',
    signHandling: 'Emission rates are nonnegative; sequestration or cleanup should be a separate removal field.',
    intuition: 'Environmental outputs can be put on the same time-domain ladder as thrust and fuel flow.',
    status: 'candidate',
  },
  {
    id: 'M-083',
    domain: 'materials',
    kind: 'volume',
    quantity: 'Failure index or utilization field $U(\\mathbf{x})$',
    recommendedI: '$I(\\mathbf{x})=U(\\mathbf{x})\\ge0$ or $\\max(U-1,0)$ for violation intensity',
    omega: '$\\mathbf{x}\\in V$',
    resultant: 'Total utilization or violation demand',
    centroid: 'Center of critical design demand',
    spread: 'Distributed margin usage versus isolated failure risk',
    signHandling: 'Utilization is nonnegative; reserve margin can be tracked separately from violation intensity.',
    intuition: 'Design checks become spatial intensity fields instead of only pass/fail flags.',
    status: 'simulated',
  },
  {
    id: 'M-084',
    domain: 'materials',
    kind: 'graph',
    quantity: 'Element compliance contribution $\\mathbf{u}_e^T\\mathbf{k}_e\\mathbf{u}_e$',
    recommendedI: '$I_e=\\mathbf{u}_e^T\\mathbf{k}_e\\mathbf{u}_e\\ge0$',
    omega: '$e\\in\\mathcal{E}$ with element centroid embedding $\\phi(e)$',
    resultant: 'Total structural compliance contribution',
    centroid: 'Where flexibility or strain energy is concentrated in the mesh',
    spread: 'Global compliance versus local weak region',
    signHandling: 'Positive semidefinite element stiffness makes the quadratic contribution nonnegative.',
    intuition: 'Topology optimization objectives already live as graph intensities over elements.',
    status: 'simulated',
  },
  {
    id: 'M-085',
    domain: 'heat',
    kind: 'volume',
    quantity: 'Temperature-excess field $|T(\\mathbf{x})-T_{ref}|$',
    recommendedI: '$I(\\mathbf{x})=|T(\\mathbf{x})-T_{ref}|$ or split hot/cold departures',
    omega: '$\\mathbf{x}\\in V$',
    resultant: 'Total thermal departure from reference',
    centroid: 'Center of temperature excursion',
    spread: 'Localized hot/cold spot versus broad temperature drift',
    signHandling: 'Temperature departure is signed before magnitude; split above-reference and below-reference fields when direction matters.',
    intuition: 'Temperature plots become moment-ladder objects even before material heat capacity is applied.',
    status: 'candidate',
  },
];

const DOMAIN_META: Record<AtlasDomain, { label: string; icon: ElementType; className: string }> = {
  unified: { label: 'Unified', icon: Calculator, className: 'border-math/30 bg-math/10 text-math' },
  structures: { label: 'Structures', icon: Building2, className: 'border-structures/30 bg-structures/10 text-structures' },
  heat: { label: 'Heat', icon: Flame, className: 'border-heat/30 bg-heat/10 text-heat' },
  fluids: { label: 'Fluids', icon: Droplets, className: 'border-fluids/30 bg-fluids/10 text-fluids' },
  dynamics: { label: 'Dynamics', icon: Activity, className: 'border-dynamics/30 bg-dynamics/10 text-dynamics' },
  circuits: { label: 'Circuits', icon: Zap, className: 'border-circuits/30 bg-circuits/10 text-circuits' },
  propulsion: { label: 'Propulsion', icon: Rocket, className: 'border-propulsion/30 bg-propulsion/10 text-propulsion' },
  materials: { label: 'Materials', icon: Box, className: 'border-accent/30 bg-accent/10 text-accent' },
  waves: { label: 'Waves', icon: Radio, className: 'border-primary/30 bg-primary/10 text-primary' },
};

const DOMAIN_FILTERS: Array<{ value: DomainFilter; label: string; icon: ElementType }> = [
  { value: 'all', label: 'All', icon: Sigma },
  ...Object.entries(DOMAIN_META).map(([value, meta]) => ({
    value: value as AtlasDomain,
    label: meta.label,
    icon: meta.icon,
  })),
];

const CONTENT_FILTERS: Array<{ value: ContentFilter; label: string; icon: ElementType }> = [
  { value: 'all', label: 'All', icon: Sparkles },
  { value: 'foundations', label: 'Foundations', icon: BookOpen },
  { value: 'atlas', label: 'Atlas', icon: Beaker },
];

const KIND_LABELS: Record<DomainKind, string> = {
  line: 'Line',
  surface: 'Surface',
  volume: 'Volume',
  time: 'Time',
  graph: 'Graph',
  parameter: 'Parameter',
  frequency: 'Frequency',
  point: 'Point',
};

const DOMAIN_ALIASES: Record<AtlasDomain, string[]> = {
  unified: ['measure space', 'moment ladder', 'universal framework'],
  structures: ['beam', 'truss', 'load path', 'reaction', 'stress', 'strain'],
  heat: ['thermal', 'conduction', 'heat flux', 'temperature', 'hotspot'],
  fluids: ['pressure', 'shear', 'flow', 'flux', 'center of pressure'],
  dynamics: ['impulse', 'vibration', 'time response', 'forcing', 'control'],
  circuits: ['current', 'voltage', 'power', 'component', 'branch', 'network'],
  propulsion: ['thrust', 'nozzle', 'mach', 'rocket', 'gas turbine'],
  materials: ['mass', 'energy density', 'fatigue', 'damage', 'material'],
  waves: ['frequency', 'spectrum', 'mode shape', 'signal', 'response'],
};

const KIND_ALIASES: Record<DomainKind, string[]> = {
  line: ['1d', 'beam axis', 'spanwise'],
  surface: ['2d', 'area', 'footprint', 'map'],
  volume: ['3d', 'solid', 'field volume'],
  time: ['temporal', 'history', 'signal'],
  graph: ['network', 'node', 'edge', 'topology'],
  parameter: ['design sweep', 'operating range', 'curve'],
  frequency: ['spectrum', 'band', 'frequency response'],
  point: ['concentrated load', 'delta load', 'contact'],
};

const MODULE_STATUS_META: Record<NonNullable<AtlasEntry['status']>, { label: string; className: string; aliases: string[] }> = {
  simulated: {
    label: 'Interactive',
    className: 'border-success/30 bg-success/10 text-success',
    aliases: ['interactive', 'simulated', 'module', 'available lab'],
  },
  candidate: {
    label: 'Make interactive',
    className: 'border-warning/30 bg-warning/10 text-warning',
    aliases: ['candidate', 'make interactive', 'future module', 'roadmap module'],
  },
};

const MOMENT_TEMPLATES: Record<DomainKind, MomentTemplate> = {
  line: {
    field: '$I:\\Omega\\subset\\mathbb{R}\\to\\mathbb{R}_{\\ge0},\\; z=x,\\; d\\mu=dx$',
    resultant: '$I_0=\\int_{\\Omega}I(x)\\,dx$',
    density: '$f(x)=I(x)/I_0,\\; \\int_{\\Omega}f(x)\\,dx=1$',
    centroid: '$\\bar{x}=I_0^{-1}\\int_{\\Omega}xI(x)\\,dx=\\int_{\\Omega}x f(x)\\,dx$',
    spread: '$\\mu_2=I_0^{-1}\\int_{\\Omega}(x-\\bar{x})^2I(x)\\,dx=\\int_{\\Omega}(x-\\bar{x})^2f(x)\\,dx$',
    localization:
      '$\\mu_{-k,\\varepsilon}=\\int_{\\Omega}((x-\\bar{x})^2+\\varepsilon^2)^{-k/2}f(x)\\,dx$',
  },
  surface: {
    field:
      '$I:\\Omega\\subset\\mathbb{R}^2\\to\\mathbb{R}_{\\ge0},\\; z=\\mathbf{x}=(x,y),\\; d\\mu=dA$',
    resultant: '$I_0=\\iint_{\\Omega}I(\\mathbf{x})\\,dA$',
    density: '$f(\\mathbf{x})=I(\\mathbf{x})/I_0,\\; \\iint_{\\Omega}f(\\mathbf{x})\\,dA=1$',
    centroid:
      '$\\bar{\\mathbf{x}}=I_0^{-1}\\iint_{\\Omega}\\mathbf{x}I(\\mathbf{x})\\,dA=\\iint_{\\Omega}\\mathbf{x}f(\\mathbf{x})\\,dA$',
    spread:
      '$\\Sigma=I_0^{-1}\\iint_{\\Omega}(\\mathbf{x}-\\bar{\\mathbf{x}})(\\mathbf{x}-\\bar{\\mathbf{x}})^T I(\\mathbf{x})\\,dA$',
    localization:
      '$\\mu_{-k,\\varepsilon}=\\iint_{\\Omega}(\\|\\mathbf{x}-\\bar{\\mathbf{x}}\\|^2+\\varepsilon^2)^{-k/2}f(\\mathbf{x})\\,dA$',
  },
  volume: {
    field:
      '$I:\\Omega\\subset\\mathbb{R}^3\\to\\mathbb{R}_{\\ge0},\\; z=\\mathbf{x}=(x,y,z),\\; d\\mu=dV$',
    resultant: '$I_0=\\iiint_{\\Omega}I(\\mathbf{x})\\,dV$',
    density: '$f(\\mathbf{x})=I(\\mathbf{x})/I_0,\\; \\iiint_{\\Omega}f(\\mathbf{x})\\,dV=1$',
    centroid:
      '$\\bar{\\mathbf{x}}=I_0^{-1}\\iiint_{\\Omega}\\mathbf{x}I(\\mathbf{x})\\,dV=\\iiint_{\\Omega}\\mathbf{x}f(\\mathbf{x})\\,dV$',
    spread:
      '$\\Sigma=I_0^{-1}\\iiint_{\\Omega}(\\mathbf{x}-\\bar{\\mathbf{x}})(\\mathbf{x}-\\bar{\\mathbf{x}})^T I(\\mathbf{x})\\,dV$',
    localization:
      '$\\mu_{-k,\\varepsilon}=\\iiint_{\\Omega}(\\|\\mathbf{x}-\\bar{\\mathbf{x}}\\|^2+\\varepsilon^2)^{-k/2}f(\\mathbf{x})\\,dV$',
  },
  time: {
    field: '$I:\\Omega\\subset\\mathbb{R}\\to\\mathbb{R}_{\\ge0},\\; z=t,\\; d\\mu=dt$',
    resultant: '$I_0=\\int_{t_0}^{t_1}I(t)\\,dt$',
    density: '$f(t)=I(t)/I_0,\\; \\int_{t_0}^{t_1}f(t)\\,dt=1$',
    centroid: '$\\bar{t}=I_0^{-1}\\int_{t_0}^{t_1}tI(t)\\,dt=\\int_{t_0}^{t_1}t f(t)\\,dt$',
    spread:
      '$\\mu_2=I_0^{-1}\\int_{t_0}^{t_1}(t-\\bar{t})^2I(t)\\,dt=\\int_{t_0}^{t_1}(t-\\bar{t})^2f(t)\\,dt$',
    localization:
      '$\\mu_{-k,\\varepsilon}=\\int_{t_0}^{t_1}((t-\\bar{t})^2+\\varepsilon^2)^{-k/2}f(t)\\,dt$',
  },
  graph: {
    field: '$I:E\\to\\mathbb{R}_{\\ge0},\\; z=e,\\; d\\mu=\\text{counting measure on graph edges/nodes}$',
    resultant: '$I_0=\\sum_{e\\in E}I_e$',
    density: '$p_e=I_e/I_0,\\; \\sum_{e\\in E}p_e=1$',
    centroid: '$\\bar{\\phi}=\\sum_{e\\in E}\\phi(e)p_e$ where $\\phi:E\\to\\mathbb{R}^m$ embeds the graph',
    spread:
      '$\\Sigma=\\sum_{e\\in E}(\\phi(e)-\\bar{\\phi})(\\phi(e)-\\bar{\\phi})^T p_e$',
    localization:
      '$\\mu_{-k,\\varepsilon}=\\sum_{e\\in E}(\\|\\phi(e)-\\bar{\\phi}\\|^2+\\varepsilon^2)^{-k/2}p_e$',
  },
  parameter: {
    field: '$I:\\Omega\\subset\\mathbb{R}\\to\\mathbb{R}_{\\ge0},\\; z=\\xi,\\; d\\mu=d\\xi$',
    resultant: '$I_0=\\int_{\\xi_{min}}^{\\xi_{max}}I(\\xi)\\,d\\xi$',
    density:
      '$f(\\xi)=I(\\xi)/I_0,\\; \\int_{\\xi_{min}}^{\\xi_{max}}f(\\xi)\\,d\\xi=1$',
    centroid:
      '$\\bar{\\xi}=I_0^{-1}\\int_{\\xi_{min}}^{\\xi_{max}}\\xi I(\\xi)\\,d\\xi=\\int_{\\xi_{min}}^{\\xi_{max}}\\xi f(\\xi)\\,d\\xi$',
    spread:
      '$\\mu_2=\\int_{\\xi_{min}}^{\\xi_{max}}(\\xi-\\bar{\\xi})^2f(\\xi)\\,d\\xi$',
    localization:
      '$\\mu_{-k,\\varepsilon}=\\int_{\\xi_{min}}^{\\xi_{max}}((\\xi-\\bar{\\xi})^2+\\varepsilon^2)^{-k/2}f(\\xi)\\,d\\xi$',
  },
  frequency: {
    field: '$I:\\Omega\\subset\\mathbb{R}_{\\ge0}\\to\\mathbb{R}_{\\ge0},\\; z=\\nu,\\; d\\mu=d\\nu$',
    resultant: '$I_0=\\int_{\\nu_{min}}^{\\nu_{max}}I(\\nu)\\,d\\nu$',
    density:
      '$f_I(\\nu)=I(\\nu)/I_0,\\; \\int_{\\nu_{min}}^{\\nu_{max}}f_I(\\nu)\\,d\\nu=1$',
    centroid:
      '$\\bar{\\nu}=I_0^{-1}\\int_{\\nu_{min}}^{\\nu_{max}}\\nu I(\\nu)\\,d\\nu$',
    spread:
      '$\\mu_2=\\int_{\\nu_{min}}^{\\nu_{max}}(\\nu-\\bar{\\nu})^2 f_I(\\nu)\\,d\\nu$',
    localization:
      '$\\mu_{-k,\\varepsilon}=\\int_{\\nu_{min}}^{\\nu_{max}}((\\nu-\\bar{\\nu})^2+\\varepsilon^2)^{-k/2}f_I(\\nu)\\,d\\nu$',
  },
  point: {
    field: '$I(z)=F\\delta(z-z_0)$ as a generalized nonnegative measure on $\\Omega$',
    resultant: '$I_0=\\int_{\\Omega}F\\delta(z-z_0)\\,d\\mu(z)=F$',
    density: '$f(z)=\\delta(z-z_0)$ after normalization by $F$',
    centroid: '$\\bar{z}=I_0^{-1}\\int_{\\Omega}zF\\delta(z-z_0)\\,d\\mu(z)=z_0$',
    spread: '$\\mu_2=\\int_{\\Omega}(z-z_0)^2\\delta(z-z_0)\\,d\\mu(z)=0$',
    localization: '$\\mu_{-k}$ is singular for an ideal point; replace $\\delta$ with a finite footprint or report $\\varepsilon$',
  },
};

function textMatches(query: string, values: string[]) {
  if (!query.trim()) return true;
  const normalized = query.toLowerCase();
  return values.some(value => value.toLowerCase().includes(normalized));
}

function getAtlasSearchValues(entry: AtlasEntry) {
  return [
    entry.id,
    entry.domain,
    DOMAIN_META[entry.domain].label,
    entry.kind,
    KIND_LABELS[entry.kind],
    entry.quantity,
    entry.recommendedI,
    entry.omega,
    entry.resultant,
    entry.centroid,
    entry.spread,
    entry.signHandling,
    entry.intuition,
    ...(entry.status ? [MODULE_STATUS_META[entry.status].label, ...MODULE_STATUS_META[entry.status].aliases] : []),
    ...DOMAIN_ALIASES[entry.domain],
    ...KIND_ALIASES[entry.kind],
  ];
}

function ModuleStatusBadge({ status }: { status?: AtlasEntry['status'] }) {
  if (!status) return null;
  const meta = MODULE_STATUS_META[status];

  return (
    <Badge variant="outline" className={`text-xs ${meta.className}`}>
      {meta.label}
    </Badge>
  );
}

function getMomentEquationBlocks(entry: AtlasEntry): EquationBlock[] {
  const template = MOMENT_TEMPLATES[entry.kind];

  return [
    {
      title: 'Intensity over domain',
      icon: Beaker,
      equations: [template.field, `Domain: ${entry.omega}`, `Admissible field: ${entry.recommendedI}`],
      note: 'Start by declaring a nonnegative intensity field and the measure used by the domain.',
    },
    {
      title: 'Resultant + density',
      icon: Gauge,
      equations: [template.resultant, template.density],
      note: entry.resultant,
    },
    {
      title: 'Centroid',
      icon: Atom,
      equations: [template.centroid],
      note: entry.centroid,
    },
    {
      title: 'Spread',
      icon: Sigma,
      equations: [template.spread],
      note: entry.spread,
    },
    {
      title: 'Localization',
      icon: Sparkles,
      equations: [template.localization],
      note: 'Inverse or negative-order moments require an explicit physical resolution scale, sensor footprint, or mesh length.',
    },
    {
      title: 'Sign policy',
      icon: Beaker,
      equations: [
        '$S=S^+-S^-,\\; S^+=\\max(S,0),\\; S^-=\\max(-S,0)$',
        '$I\\in\\{|S|,\\;S^2,\\;S^+,\\;S^-\\}$',
      ],
      note: entry.signHandling,
    },
  ];
}

export function KnowledgeLibrary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState<DomainFilter>('all');
  const [contentFilter, setContentFilter] = useState<ContentFilter>('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set(['M-001']));

  const filteredFoundations = useMemo(() => {
    if (contentFilter === 'atlas' || domainFilter !== 'all') return [];
    return FOUNDATIONS.filter(concept =>
      textMatches(searchQuery, [concept.title, concept.summary, ...concept.equations]),
    );
  }, [contentFilter, domainFilter, searchQuery]);

  const filteredAtlas = useMemo(() => {
    if (contentFilter === 'foundations') return [];
    return ATLAS_ENTRIES.filter(entry => {
      if (domainFilter !== 'all' && entry.domain !== domainFilter) return false;
      return textMatches(searchQuery, getAtlasSearchValues(entry));
    });
  }, [contentFilter, domainFilter, searchQuery]);

  const hasActiveFilters = Boolean(searchQuery) || domainFilter !== 'all' || contentFilter !== 'all';

  const clearFilters = () => {
    setSearchQuery('');
    setDomainFilter('all');
    setContentFilter('all');
  };

  const toggleRow = (id: string) => {
    setExpandedRows(previous => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <div className="mb-2 flex items-center gap-2 text-primary">
            <Atom className="h-5 w-5" />
            <span className="text-xs font-semibold uppercase tracking-wider">Unified Library</span>
          </div>
          <h2 className="text-2xl font-bold text-foreground">Intensity Fields Across Engineering Physics</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            A single library for the core framework and the engineering terms that can be treated as
            nonnegative intensity fields over a line, surface, volume, time interval, graph, frequency band, or parameter axis.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
            {FOUNDATIONS.length} foundations
          </Badge>
          <Badge variant="outline" className="border-success/30 bg-success/10 text-success">
            {ATLAS_ENTRIES.length} atlas entries
          </Badge>
        </div>
      </div>

      <Card className="border-border/50 bg-card/70 backdrop-blur">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search loads, aliases, equations, candidates, energy, flux, pressure..."
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                className="pl-9 pr-9"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {CONTENT_FILTERS.map(({ value, label, icon: Icon }) => (
                <Button
                  key={value}
                  type="button"
                  variant={contentFilter === value ? 'secondary' : 'ghost'}
                  size="sm"
                  onClick={() => setContentFilter(value)}
                  className="gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Button>
              ))}
            </div>

            <div className="flex flex-wrap gap-2">
              {DOMAIN_FILTERS.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDomainFilter(value)}
                  className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${
                    domainFilter === value
                      ? value === 'all'
                        ? 'border-primary/30 bg-primary/10 text-primary'
                        : DOMAIN_META[value].className
                      : 'border-border/50 bg-secondary/50 text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
              {hasActiveFilters && (
                <Button type="button" variant="ghost" size="sm" onClick={clearFilters} className="gap-2 text-destructive">
                  <X className="h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {filteredFoundations.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Foundations</h3>
            <span className="text-xs text-muted-foreground">{filteredFoundations.length} concepts</span>
          </div>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {filteredFoundations.map((concept, index) => (
              <motion.div
                key={concept.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <Card className="h-full border-border/50 bg-card/70">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Calculator className="h-4 w-4 text-primary" />
                      {concept.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <p className="text-sm leading-relaxed text-muted-foreground">{concept.summary}</p>
                    <div className="equation-box flex flex-col gap-2">
                      {concept.equations.map(equation => (
                        <div key={equation} className="text-xs text-primary/85">
                          <EquationRenderer equation={equation} />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {filteredAtlas.length > 0 && (
        <section className="flex flex-col gap-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Intensity Field Atlas</h3>
              <p className="text-sm text-muted-foreground">
                Rows are intentionally concise; expand one to see the moment ladder and sign policy.
              </p>
            </div>
            <span className="text-xs text-muted-foreground">
              Showing {filteredAtlas.length} of {ATLAS_ENTRIES.length}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredAtlas.map((entry, index) => (
              <AtlasMobileCard
                key={entry.id}
                entry={entry}
                index={index}
                isExpanded={expandedRows.has(entry.id)}
                onToggle={() => toggleRow(entry.id)}
              />
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="hidden overflow-hidden rounded-lg border border-border/50 md:block"
          >
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/30 bg-muted/30">
                    <TableHead className="w-8" />
                    <TableHead className="w-20">ID</TableHead>
                    <TableHead className="w-32">Domain</TableHead>
                    <TableHead className="w-28">Kind</TableHead>
                    <TableHead className="w-36">Module</TableHead>
                    <TableHead className="min-w-[220px]">Quantity</TableHead>
                    <TableHead className="min-w-[250px]">Recommended intensity</TableHead>
                    <TableHead className="min-w-[180px]">Omega</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAtlas.map((entry, index) => {
                    const isExpanded = expandedRows.has(entry.id);
                    const meta = DOMAIN_META[entry.domain];
                    const DomainIcon = meta.icon;

                    return (
                      <Fragment key={entry.id}>
                        <TableRow
                          className={`cursor-pointer border-border/30 transition-colors hover:bg-muted/20 ${
                            index % 2 === 0 ? 'bg-muted/5' : ''
                          } ${isExpanded ? 'bg-muted/20' : ''}`}
                          onClick={() => toggleRow(entry.id)}
                        >
                          <TableCell className="pr-0">
                            <ChevronRight
                              className={`h-4 w-4 text-muted-foreground transition-transform ${
                                isExpanded ? 'rotate-90' : ''
                              }`}
                            />
                          </TableCell>
                          <TableCell className="font-mono text-sm font-semibold text-primary">{entry.id}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`gap-1.5 text-xs ${meta.className}`}>
                              <DomainIcon className="h-3 w-3" />
                              {meta.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {KIND_LABELS[entry.kind]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <ModuleStatusBadge status={entry.status} />
                          </TableCell>
                          <TableCell className="text-sm">
                            <EquationRenderer equation={entry.quantity} />
                          </TableCell>
                          <TableCell className="text-sm">
                            <EquationRenderer equation={entry.recommendedI} />
                          </TableCell>
                          <TableCell className="text-sm">
                            <EquationRenderer equation={entry.omega} />
                          </TableCell>
                        </TableRow>

                        <AnimatePresence>
                          {isExpanded && (
                            <TableRow className="border-border/30 bg-card/80">
                              <TableCell colSpan={8} className="p-0">
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.22, ease: 'easeInOut' }}
                                  className="overflow-hidden"
                                >
                                  <div className="ml-8 flex flex-col gap-4 px-6 py-4">
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                                        Moment ladder
                                      </span>
                                      <ModuleStatusBadge status={entry.status} />
                                    </div>
                                    <p className="text-sm leading-relaxed text-muted-foreground">{entry.intuition}</p>
                                    <MomentEquationGrid entry={entry} />
                                  </div>
                                </motion.div>
                              </TableCell>
                            </TableRow>
                          )}
                        </AnimatePresence>
                      </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </motion.div>
        </section>
      )}

      {filteredFoundations.length === 0 && filteredAtlas.length === 0 && (
        <Card className="border-border/50 bg-card/70">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Search className="h-8 w-8 text-muted-foreground" />
            <div>
              <p className="font-medium text-foreground">No matching library entries</p>
              <p className="mt-1 text-sm text-muted-foreground">Try clearing filters or searching for another field.</p>
            </div>
            <Button type="button" variant="secondary" onClick={clearFilters}>
              Clear filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function AtlasMobileCard({
  entry,
  index,
  isExpanded,
  onToggle,
}: {
  entry: AtlasEntry;
  index: number;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const meta = DOMAIN_META[entry.domain];
  const DomainIcon = meta.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.015 }}
    >
      <Card className="border-border/50 bg-card/70">
        <button
          type="button"
          onClick={onToggle}
          className="flex w-full items-start gap-3 p-4 text-left"
          aria-expanded={isExpanded}
        >
          <ChevronRight
            className={`mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
              isExpanded ? 'rotate-90' : ''
            }`}
          />
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-semibold text-primary">{entry.id}</span>
              <Badge variant="outline" className={`gap-1.5 text-xs ${meta.className}`}>
                <DomainIcon className="h-3 w-3" />
                {meta.label}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {KIND_LABELS[entry.kind]}
              </Badge>
              <ModuleStatusBadge status={entry.status} />
            </div>
            <div className="text-sm font-medium leading-relaxed text-foreground">
              <EquationRenderer equation={entry.quantity} />
            </div>
            <div className="rounded-md border border-border/40 bg-muted/20 p-3 text-xs leading-relaxed text-muted-foreground">
              <span className="mb-1 block font-semibold uppercase tracking-wider text-muted-foreground">
                Recommended intensity
              </span>
              <EquationRenderer equation={entry.recommendedI} />
            </div>
          </div>
        </button>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-3 border-t border-border/40 px-4 pb-4 pt-3">
                <p className="text-sm leading-relaxed text-muted-foreground">{entry.intuition}</p>
                <MomentEquationGrid entry={entry} compact />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

function MomentEquationGrid({ entry, compact = false }: { entry: AtlasEntry; compact?: boolean }) {
  const blocks = getMomentEquationBlocks(entry);

  return (
    <div className={compact ? 'grid grid-cols-1 gap-3' : 'grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3'}>
      {blocks.map(block => (
        <MomentEquationCard key={block.title} block={block} />
      ))}
    </div>
  );
}

function MomentEquationCard({ block }: { block: EquationBlock }) {
  const Icon = block.icon;

  return (
    <div className="flex min-w-0 flex-col gap-2 rounded-md border border-border/40 bg-muted/20 p-3">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-primary" />
        {block.title}
      </div>
      <div className="equation-box flex min-w-0 flex-col gap-2 overflow-x-auto bg-card/60 p-2">
        {block.equations.map(equation => (
          <div key={equation} className="text-xs leading-relaxed text-primary/85">
            <EquationRenderer equation={equation} />
          </div>
        ))}
      </div>
      <div className="text-xs leading-relaxed text-foreground">
        <EquationRenderer equation={block.note} />
      </div>
    </div>
  );
}
