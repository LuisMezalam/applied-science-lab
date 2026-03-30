import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { KnowledgeConcept, DomainType } from '@/types/physics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { EquationRenderer } from '@/components/knowledge/EquationRenderer';
import { BookOpen, Beaker, Lightbulb, Building2, Flame, Droplets, Calculator, Zap, Activity, CheckCircle, Search, X, Rocket } from 'lucide-react';

// Knowledge base from "A Total Unification of Engineering Loads via Moment Calculus" (Feb 2026)
const initialConcepts: KnowledgeConcept[] = [
  // ============ UNIVERSAL CALCULUS (Secs. 1–4) ============
  {
    id: 'unified-formulation',
    title: 'Universal Object: Nonnegative Intensity Field',
    category: 'theory',
    domain: 'unified',
    content: 'A load is represented by a nonnegative intensity field I(z) ≥ 0 on a measurable domain Ω, whose integral is finite and positive. The domain may be space (ℝᵈ), time ([t₀,t₁]), parameter axis (Mach number, frequency), or a graph (circuit branches).',
    equations: [
      '\\(I(z) \\geq 0,\\; z \\in \\Omega\\)',
      '\\(I_0 := \\int_{\\Omega} I(z)\\, d\\mu(z) \\in (0, \\infty)\\)',
      '\\([I_0] = [I] \\cdot [\\mu]\\) (dimensional sanity)',
      'Examples: \\(w(x)\\) [N/m], \\(q\'\'\\) [W/m²], \\(p\\) [Pa], \\(P\\) [W]',
    ],
    sourceDocument: 'ATotalUnificationofEngineeringLoadsviaMomentCalculus.pdf',
  },
  {
    id: 'normalization',
    title: 'Normalization into Density',
    category: 'theory',
    domain: 'unified',
    content: 'Normalizing an intensity field I(z) by its resultant I₀ produces a dimensionless density f(z) that integrates to 1. This is the "functional relation" that makes disparate engineering loads comparable and enables the statistical moment ladder.',
    equations: [
      '\\(f(z) := I(z)/I_0\\)',
      '\\(\\int_{\\Omega} f(z)\\, d\\mu(z) = 1\\)',
      '\\(f\\) is the universal weighting function',
    ],
    sourceDocument: 'ATotalUnificationofEngineeringLoadsviaMomentCalculus.pdf',
  },
  {
    id: 'moment-ladder',
    title: 'The Moment Ladder',
    category: 'theory',
    domain: 'unified',
    content: 'Given a coordinate map ϕ: Ω → ℝᵐ, the moment ladder systematically extracts: zeroth moment (resultant I₀), first raw moment/centroid (point of action ϕ̄), second central moment (spread/nonuniformity Σ), and higher moments (asymmetry, tails).',
    equations: [
      '\\(n=0:\\; I_0 = \\int_{\\Omega} I\\, d\\mu\\) (resultant)',
      '\\(n=1:\\; \\bar{\\phi} = \\frac{1}{I_0} \\int_{\\Omega} \\phi(z) \\cdot I(z)\\, d\\mu\\) (centroid)',
      '\\(n=2:\\; \\Sigma = \\int_{\\Omega} r(z)\\,r(z)^{\\!\\top} f(z)\\, d\\mu,\\; r = \\phi - \\bar{\\phi}\\)',
      '\\(\\text{1D: } \\sigma^2 = \\int (x - \\bar{x})^2 f(x)\\, dx\\)',
      '\\(\\gamma_1 = \\mu_3/\\sigma^3\\) (skewness), \\(\\gamma_2 = \\mu_4/\\sigma^4\\) (kurtosis)',
    ],
    sourceDocument: 'ATotalUnificationofEngineeringLoadsviaMomentCalculus.pdf',
  },
  {
    id: 'balance-law-backbone',
    title: 'Balance-Law Backbone',
    category: 'theory',
    domain: 'unified',
    content: 'Classical physics is built on integral balance laws. A generic conserved quantity Ψ in control volume V satisfies: (d/dt)∫ψ dV = −∫J·n dA + ∫s dV. Each integrand is an intensity field; its integral is a resultant. The moment ladder applies when integrands are nonnegative.',
    equations: [
      '\\(\\frac{d}{dt} \\int_V \\psi\\, dV = -\\int_{\\partial V} \\mathbf{J} \\cdot \\mathbf{n}\\, dA + \\int_V s\\, dV\\)',
      '\\(\\psi\\) = density (per volume)',
      '\\(\\mathbf{J} \\cdot \\mathbf{n}\\) = boundary flux (per area)',
      '\\(s\\) = volumetric source (per volume)',
      'Applies to mass, momentum, energy, charge',
    ],
    sourceDocument: 'ATotalUnificationofEngineeringLoadsviaMomentCalculus.pdf',
  },
  {
    id: 'effort-flow-power',
    title: 'Effort–Flow and Power (Cross-Domain Glue)',
    category: 'theory',
    domain: 'unified',
    content: 'Many engineering domains have effort variables e and flow variables f such that power P = e·f. Power dissipation or throughput is often the cleanest nonnegative intensity to unify domains, especially when signed conventions obscure raw fields.',
    equations: [
      '\\(P = e \\cdot f\\) (power conjugate pair)',
      '\\(P = F \\cdot v\\) (mechanical, translational)',
      '\\(P = \\tau \\cdot \\omega\\) (mechanical, rotational)',
      '\\(P = V \\cdot I\\) (electrical)',
      '\\(P = \\Delta p \\cdot Q\\) (hydraulic)',
    ],
    sourceDocument: 'ATotalUnificationofEngineeringLoadsviaMomentCalculus.pdf',
  },
  {
    id: 'signed-field-rule',
    title: 'Signed Fields: Rigorous Handling Rules',
    category: 'theory',
    domain: 'unified',
    content: 'A signed field S(z) is not a probability/intensity by itself. Two rigorous options: (A) Intensity transform—choose a nonnegative surrogate |S|, S², energy density, etc. (B) Jordan decomposition—split S = S⁺ − S⁻ and compute ladders separately. This is critical for negative-order moments.',
    equations: [
      'Option A: \\(I(z) \\in \\{|S|,\\, S^2,\\, \\text{energy density}\\}\\)',
      'Option B: \\(S(z) = S^+(z) - S^-(z),\\; S^{\\pm} \\geq 0\\)',
      'Compute ladders for \\(S^+\\) and \\(S^-\\) separately',
      'Critical for inverse-power moments near sign changes',
    ],
    sourceDocument: 'ATotalUnificationofEngineeringLoadsviaMomentCalculus.pdf',
  },
  // ============ NEGATIVE-ORDER LADDER (Sec. 4) ============
  {
    id: 'negative-order-raw',
    title: 'Negative-Order Moments: Raw Inverse Powers',
    category: 'theory',
    domain: 'unified',
    content: 'For a nonnegative scalar coordinate X ≥ 0 with density fₓ, the s-moment mₛ = E[Xˢ]. For s = −k < 0, the inverse moment m₋ₖ = ∫x⁻ᵏfₓ(x)dx exists only if the density near x = 0 decays sufficiently fast.',
    equations: [
      '\\(m_s = E[X^s] = \\int_0^{\\infty} x^s f_X(x)\\, dx,\\; s \\in \\mathbb{R}\\)',
      '\\(m_{-k} = E[X^{-k}] = \\int_0^{\\infty} x^{-k} f_X(x)\\, dx\\)',
      'Existence requires \\(f_X(0) \\to 0\\) fast enough',
      'Diverges if \\(f_X(0) > 0\\) and continuous',
    ],
    sourceDocument: 'ATotalUnificationofEngineeringLoadsviaMomentCalculus.pdf',
  },
  {
    id: 'negative-order-central',
    title: 'Central Inverse Moments and Singularity',
    category: 'theory',
    domain: 'unified',
    content: 'If μ₋ₖ = ∫|r(z)|⁻ᵏf(z)dμ with r = ϕ − ϕ̄, then in 1D, if f(ϕ̄) > 0 and continuous, μ₋ₖ diverges for all k ≥ 1. This encodes that inverse-power localization is singular at perfect centering in continuous fields.',
    equations: [
      '\\(\\mu_{-k} = \\int_{\\Omega} |r(z)|^{-k} f(z)\\, d\\mu(z)\\)',
      '\\(r(z) = \\phi(z) - \\bar{\\phi}\\) (distance from centroid)',
      'Diverges if \\(f(\\bar{\\phi}) > 0\\) for \\(k \\geq 1\\)',
      'Not a defect: encodes singular localization',
    ],
    sourceDocument: 'ATotalUnificationofEngineeringLoadsviaMomentCalculus.pdf',
  },
  {
    id: 'negative-order-regularization',
    title: 'Regularization (Resolution Model)',
    category: 'theory',
    domain: 'unified',
    content: 'Adopt a physically meaningful resolution scale ε > 0 to regularize inverse moments. ε represents sensor footprint, mesh size, minimum resolvable scale, or minimum physically meaningful separation. Always report ε when using negative-order metrics.',
    equations: [
      '\\(\\mu_{-k,\\varepsilon} = \\int_{\\Omega} (r^2 + \\varepsilon^2)^{-k/2} f(z)\\, d\\mu(z)\\)',
      '\\(\\varepsilon\\) = sensor footprint / mesh size / min scale',
      '\\(w_{\\text{eff}}(k,\\varepsilon) = \\mu_{-k,\\varepsilon}^{\\,-1/k}\\)',
      'Must report \\(\\varepsilon\\) with any negative-order statistic',
    ],
    sourceDocument: 'ATotalUnificationofEngineeringLoadsviaMomentCalculus.pdf',
  },
  // ============ DIMENSIONAL HIERARCHY ============
  {
    id: 'dim-1d-loading',
    title: '1-D Loading: Lines & Walls',
    category: 'theory',
    domain: 'unified',
    content: 'For one-dimensional domains Ω = [a, b] ⊂ ℝ¹, the intensity field I(x) represents line loads (N/m), linear heat sources (W/m), or pressure along edges. Integration reduces to single integrals over the line segment.',
    equations: [
      '\\(\\Omega = [a, b] \\subset \\mathbb{R}^1\\) (line segment)',
      '\\(I_0 = \\int_a^b I(x)\\, dx\\)',
      '\\(\\bar{x} = \\frac{1}{I_0} \\int_a^b x \\cdot I(x)\\, dx\\)',
      '\\(\\sigma^2 = \\frac{1}{I_0} \\int_a^b (x - \\bar{x})^2 \\cdot I(x)\\, dx\\)',
    ],
    sourceDocument: 'ATotalUnificationofEngineeringLoadsviaMomentCalculus.pdf',
  },
  {
    id: 'dim-2d-elementary',
    title: '2-D Loading: Elementary Shapes',
    category: 'theory',
    domain: 'unified',
    content: 'For two-dimensional domains Ω ⊂ ℝ², elementary shapes (rectangles, circles, triangles) allow closed-form moment calculations. The intensity field I(x,y) represents surface pressure (Pa), heat flux (W/m²), or distributed loads.',
    equations: [
      '\\(\\Omega \\subset \\mathbb{R}^2\\) (rectangle, circle, triangle)',
      '\\(I_0 = \\iint_{\\Omega} I(x,y)\\, dA\\)',
      '\\((\\bar{x},\\, \\bar{y}) = \\frac{1}{I_0} \\iint_{\\Omega} (x,y) \\cdot I\\, dA\\)',
      '\\(I_{xx} = \\iint (y - \\bar{y})^2 I\\, dA,\\quad I_{yy} = \\iint (x - \\bar{x})^2 I\\, dA\\)',
      '\\(I_{xy} = \\iint (x - \\bar{x})(y - \\bar{y}) I\\, dA\\)',
    ],
    sourceDocument: 'ATotalUnificationofEngineeringLoadsviaMomentCalculus.pdf',
  },
  {
    id: 'dim-3d-volumes',
    title: '3-D Loading: Volumes',
    category: 'theory',
    domain: 'unified',
    content: 'Volumetric intensity fields I(x,y,z) on V ⊂ ℝ³ represent body forces (N/m³), volumetric heat generation (W/m³), or density distributions. Triple integrals yield 3D moments and inertia tensors.',
    equations: [
      '\\(V \\subset \\mathbb{R}^3\\) (3D volume)',
      '\\(I_0 = \\iiint_V I(x,y,z)\\, dV\\)',
      '\\(\\bar{\\mathbf{r}} = \\frac{1}{I_0} \\iiint_V \\mathbf{r} \\cdot I(\\mathbf{r})\\, dV\\) (centroid)',
      '\\(I_{jk} = \\iiint_V (r_j - \\bar{r}_j)(r_k - \\bar{r}_k) \\cdot I\\, dV\\) (inertia tensor)',
    ],
    sourceDocument: 'ATotalUnificationofEngineeringLoadsviaMomentCalculus.pdf',
  },
  // ============ MASTER LOADING DICTIONARY ============
  {
    id: 'master-m001',
    title: 'M-001: Distributed Line Load w(x)',
    category: 'application',
    domain: 'structures',
    content: 'Line load w(x) [N/m] on a beam or structural element. May be signed (upward/downward). Resultant force ∫w dx; line of action x̄; load spread μ₂. Centered inverse moments need ε regularization.',
    equations: [
      '\\(I(x) = w(x)\\) (or \\(|w|\\), split \\(w^+/w^-\\))',
      '\\(\\Omega = x \\in [0, L]\\)',
      '\\(I_0 = \\int_0^L w(x)\\, dx\\) (resultant force)',
      '\\(\\bar{x} = \\frac{1}{I_0} \\int_0^L x \\cdot w(x)\\, dx\\) (line of action)',
    ],
    sourceDocument: 'ATotalUnificationofEngineeringLoadsviaMomentCalculus.pdf',
  },
  {
    id: 'master-m002',
    title: 'M-002: Pressure Magnitude on Surface',
    category: 'application',
    domain: 'fluids',
    content: 'Pressure p ≥ 0 (or |p|, p² if gauge/signed) on area A. Resultant ∫p dA; centroid ≈ center of pressure if direction uniform; spread gives pressure footprint. Negative-order localizes hotspots.',
    equations: [
      '\\(I = p \\geq 0\\) (or \\(|p|\\), \\(p^2\\) if signed)',
      '\\(\\Omega = \\mathbf{x} \\in A\\) (surface)',
      '\\(I_0 = \\iint_A p\\, dA\\) (resultant force proxy)',
      '\\((\\bar{x},\\, \\bar{y})\\) = centroid of pressure distribution',
    ],
    sourceDocument: 'ATotalUnificationofEngineeringLoadsviaMomentCalculus.pdf',
  },
  {
    id: 'master-m003',
    title: 'M-003: Surface Heat Flux q″',
    category: 'application',
    domain: 'heat',
    content: 'Surface heat flux q″ [W/m²]. If q″ ≥ 0 use directly, else use |q″| or split. Total heat rate Q̇ = ∫q″ dA; thermal centroid x̄; spatial nonuniformity Σ.',
    equations: [
      '\\(I = q\'\'\\) if \\(q\'\' \\geq 0\\), else \\(|q\'\'|\\) or split',
      '\\(\\Omega = \\mathbf{x} \\in A\\) (surface)',
      '\\(\\dot{Q} = \\iint_A q\'\'\\, dA\\) (total heat rate)',
      '\\(\\bar{x} = \\frac{1}{\\dot{Q}} \\iint_A x \\cdot q\'\'\\, dA\\) (center of heating)',
    ],
    sourceDocument: 'ATotalUnificationofEngineeringLoadsviaMomentCalculus.pdf',
  },
  {
    id: 'master-m004',
    title: 'M-004: Volumetric Heat Generation q‴',
    category: 'application',
    domain: 'heat',
    content: 'Volumetric heat generation q‴(x) [W/m³] in reactors, Joule heating, chemical reactions. Total generation Q̇ = ∫q‴ dV; centroid and spread in volume. Regularize with ε for negative-order.',
    equations: [
      '\\(I = q\'\'\'(\\mathbf{x}) \\geq 0\\)',
      '\\(\\Omega = V\\) (volume)',
      '\\(\\dot{Q} = \\iiint_V q\'\'\'\\, dV\\) (total generation)',
      '\\(\\bar{\\mathbf{r}} = \\frac{1}{\\dot{Q}} \\iiint_V \\mathbf{r} \\cdot q\'\'\'\\, dV\\) (thermal centroid)',
    ],
    sourceDocument: 'ATotalUnificationofEngineeringLoadsviaMomentCalculus.pdf',
  },
  {
    id: 'master-m005',
    title: 'M-005: Wall Shear Magnitude |τw|',
    category: 'application',
    domain: 'fluids',
    content: 'Wall shear stress magnitude |τw| on surfaces. Total shear intensity ∫|τw| dA; shear centroid and spread characterize friction distribution.',
    equations: [
      '\\(I = |\\tau_w|\\)',
      '\\(\\Omega = \\mathbf{x} \\in A\\) (surface)',
      '\\(I_0 = \\iint_A |\\tau_w|\\, dA\\) (total shear intensity)',
      '\\((\\bar{x},\\, \\bar{y})\\) = shear centroid',
    ],
    sourceDocument: 'ATotalUnificationofEngineeringLoadsviaMomentCalculus.pdf',
  },
  {
    id: 'master-m006',
    title: 'M-006: Time-Domain Force Input F(t)',
    category: 'application',
    domain: 'dynamics',
    content: 'External force input F(t) over time. Use I(t) = |F(t)| or F(t)² or |F(t)v(t)| (power). Time-integrated forcing magnitude; center-of-action in time; temporal spread. Needs ε or cutoff for negative-order.',
    equations: [
      '\\(I(t) = |F(t)|\\) or \\(F(t)^2\\) or \\(|F(t)\\,v(t)|\\)',
      '\\(\\Omega = t \\in [t_0,\\, t_1]\\)',
      '\\(I_0 = \\int I(t)\\, dt\\) (impulse/energy proxy)',
      '\\(\\bar{t} = \\frac{1}{I_0} \\int t \\cdot I(t)\\, dt\\) (temporal centroid)',
    ],
    sourceDocument: 'ATotalUnificationofEngineeringLoadsviaMomentCalculus.pdf',
  },
  {
    id: 'master-m007',
    title: 'M-007: Torque Input τ(t)',
    category: 'application',
    domain: 'dynamics',
    content: 'Torque input τ(t) over time. Use I(t) = |τ(t)| or |τ(t)ω(t)| or τ(t)². Total torque intensity/work proxy; temporal centroid; temporal spread.',
    equations: [
      '\\(I(t) = |\\tau(t)|\\) or \\(|\\tau(t)\\,\\omega(t)|\\) or \\(\\tau(t)^2\\)',
      '\\(\\Omega = t \\in [t_0,\\, t_1]\\)',
      '\\(I_0 = \\int I(t)\\, dt\\) (angular impulse/work)',
      '\\(\\bar{t}\\) = temporal centroid of torque action',
    ],
    sourceDocument: 'ATotalUnificationofEngineeringLoadsviaMomentCalculus.pdf',
  },
  {
    id: 'master-m008',
    title: 'M-008: Viscous Damper Dissipation',
    category: 'application',
    domain: 'dynamics',
    content: 'Translational viscous damper dissipation I(t) = bẋ(t)². Nonnegative by definition; integrates to total dissipated energy; centroid/spread show intermittency.',
    equations: [
      '\\(I(t) = b\\,\\dot{x}(t)^2 \\geq 0\\)',
      '\\(\\Omega = t \\in [t_0,\\, t_1]\\)',
      '\\(E_{\\text{diss}} = \\int b\\,\\dot{x}^2\\, dt\\) (dissipated energy)',
      '\\(\\bar{t}\\) = temporal centroid of dissipation',
    ],
    sourceDocument: 'ATotalUnificationofEngineeringLoadsviaMomentCalculus.pdf',
  },
  {
    id: 'master-m009',
    title: 'M-009: Rotational Damper Dissipation',
    category: 'application',
    domain: 'dynamics',
    content: 'Rotational damper dissipation I(t) = c(Δω(t))² or |τ_f·ω|. Nonnegative dissipation intensity; integrates to total dissipated rotational energy. Temporal centroid/spread localize bursts of rotational dissipation.',
    equations: [
      '\\(I(t) = c\\,(\\Delta\\omega(t))^2\\) or \\(|\\tau_f \\omega|\\)',
      '\\(\\Omega = t \\in [t_0,\\, t_1]\\)',
      '\\(E_{\\text{diss}} = \\int c\\,(\\Delta\\omega)^2\\, dt\\)',
      '\\(\\bar{t}\\) = temporal centroid of rotational dissipation',
    ],
    sourceDocument: 'ATotalUnificationofEngineeringLoadsviaMomentCalculus.pdf',
  },
  {
    id: 'master-m010',
    title: 'M-010: Circuit Branch Current',
    category: 'application',
    domain: 'circuits',
    content: 'Circuit branch current magnitude Iₑ = |iₑ| or iₑ². Discrete support on graph edges. Centroid/spread require a graph metric or embedding map ϕ.',
    equations: [
      '\\(I_e = |i_e|\\) or \\(i_e^2\\)',
      '\\(\\Omega = e \\in E\\) (graph edges)',
      '\\(I_0 = \\sum_e I_e\\) (total current intensity)',
      'Graph centroid requires metric definition',
    ],
    sourceDocument: 'ATotalUnificationofEngineeringLoadsviaMomentCalculus.pdf',
  },
  {
    id: 'master-m011',
    title: 'M-011: Circuit Power Dissipation',
    category: 'application',
    domain: 'circuits',
    content: 'Circuit component power dissipation Pₑ ≥ 0. Total dissipation Σₑ Pₑ; hot-spot identification; spread across components. Graph-domain centroid uses discrete measure.',
    equations: [
      '\\(I_e = P_e = V_e \\cdot i_e \\geq 0\\)',
      '\\(\\Omega = e \\in E\\) (graph edges/nodes)',
      '\\(I_0 = \\sum_e P_e\\) (total power dissipation)',
      '\\(f_e = P_e / I_0\\) (discrete density)',
    ],
    sourceDocument: 'ATotalUnificationofEngineeringLoadsviaMomentCalculus.pdf',
  },
  {
    id: 'master-m013',
    title: 'M-013: Mach-Kernel (MFP)',
    category: 'application',
    domain: 'propulsion',
    content: 'Mass flow parameter MFP(M) ≥ 0 as intensity on Mach-space. Mach-space centroid and spread quantify operating characteristics. Negative-order: low-M sensitivity depends on M_min; needs ε.',
    equations: [
      '\\(I(M) = \\text{MFP}(M) \\geq 0\\)',
      '\\(\\Omega = M \\in [M_{\\min},\\, M_{\\max}]\\)',
      '\\(\\bar{M} = \\frac{1}{I_0} \\int M \\cdot \\text{MFP}(M)\\, dM\\)',
      '\\(\\Sigma\\) = Mach-space spread',
    ],
    sourceDocument: 'ATotalUnificationofEngineeringLoadsviaMomentCalculus.pdf',
  },
  {
    id: 'master-m016',
    title: 'M-016: Momentum-Flux Density (Thrust)',
    category: 'application',
    domain: 'propulsion',
    content: 'Momentum-flux density on exit plane I(x) = ρ(x)u(x)² for thrust contribution. Treat as intensity on exit plane; centroid/spread diagnose alignment and off-axis torque propensity.',
    equations: [
      '\\(I(\\mathbf{x}) = \\rho(\\mathbf{x})\\, u(\\mathbf{x})^2\\)',
      '\\(\\Omega = \\mathbf{x} \\in A_{\\text{exit}}\\) (nozzle exit plane)',
      '\\(F = \\iint \\rho\\, u^2\\, dA\\) (thrust contribution)',
      'Centroid diagnoses thrust alignment',
    ],
    sourceDocument: 'ATotalUnificationofEngineeringLoadsviaMomentCalculus.pdf',
  },
  {
    id: 'master-m017',
    title: 'M-017: Body Force Density',
    category: 'application',
    domain: 'structures',
    content: 'Body force density magnitude ∥b∥ [N/m³] in a volume. Vector loads require scalarization (magnitude or componentwise) before normalization.',
    equations: [
      '\\(I = \\|\\mathbf{b}(\\mathbf{x})\\|\\) [N/m³]',
      '\\(\\Omega = \\mathbf{x} \\in V\\) (volume)',
      '\\(I_0 = \\iiint \\|\\mathbf{b}\\|\\, dV\\) (total body force intensity)',
      'Componentwise ladders also valid',
    ],
    sourceDocument: 'ATotalUnificationofEngineeringLoadsviaMomentCalculus.pdf',
  },
  {
    id: 'master-m012',
    title: 'M-012: Performance Coefficient Curve CF(ξ)',
    category: 'application',
    domain: 'propulsion',
    content: 'Performance coefficient CF(ξ) ≥ 0 as intensity on parameter axis ξ ∈ [ξ_min, ξ_max]. Parameter-space centroid and spread quantify the typical operating region and robustness of performance.',
    equations: [
      '\\(I(\\xi) = C_F(\\xi) \\geq 0\\)',
      '\\(\\Omega = \\xi \\in [\\xi_{\\min},\\, \\xi_{\\max}]\\)',
      '\\(\\bar{\\xi} = \\frac{1}{I_0} \\int \\xi \\cdot C_F(\\xi)\\, d\\xi\\) (operating centroid)',
      '\\(\\sigma^2\\) = parameter-space spread (robustness)',
    ],
    sourceDocument: 'ATotalUnificationofEngineeringLoadsviaMomentCalculus.pdf',
  },
  {
    id: 'master-m014',
    title: 'M-014: Nacelle Pressure-Drag Integrand',
    category: 'application',
    domain: 'propulsion',
    content: 'Nacelle pressure-drag integrand (relative to ambient). Sign handling required via |P − P₀| or split (P − P₀)⁺, (P − P₀)⁻. Centroid/spread give drag footprint.',
    equations: [
      '\\(I = |P - P_0|\\) or split \\((P-P_0)^+,\\, (P-P_0)^-\\)',
      '\\(\\Omega = \\mathbf{x} \\in A_y\\) (nacelle surface)',
      '\\(I_0 = \\iint |P - P_0|\\, dA\\) (drag proxy)',
      'Centroid/spread give drag footprint',
    ],
    sourceDocument: 'ATotalUnificationofEngineeringLoadsviaMomentCalculus.pdf',
  },
  {
    id: 'master-m015',
    title: 'M-015: Thrust-Plane Pressure Term',
    category: 'application',
    domain: 'propulsion',
    content: 'Pressure thrust density I(x) = |p(x) − pₐ|. Pressure-thrust footprint centroid/spread; asymmetry indicates off-axis loading tendency.',
    equations: [
      '\\(I(\\mathbf{x}) = |p(\\mathbf{x}) - p_a|\\)',
      '\\(\\Omega = \\mathbf{x} \\in A_e\\) (exit plane)',
      '\\(I_0 = \\iint |p - p_a|\\, dA\\) (pressure thrust)',
      'Asymmetry indicates off-axis loading tendency',
    ],
    sourceDocument: 'ATotalUnificationofEngineeringLoadsviaMomentCalculus.pdf',
  },
  {
    id: 'master-m018',
    title: 'M-018: Absolute Traction ∥t(x)∥',
    category: 'application',
    domain: 'structures',
    content: 'Traction magnitude ∥t(x)∥ on a surface. Total traction intensity, centroid, and spread characterize the distribution of surface forces.',
    equations: [
      '\\(I(\\mathbf{x}) = \\|\\mathbf{t}(\\mathbf{x})\\|\\)',
      '\\(\\Omega = \\mathbf{x} \\in A\\) (surface)',
      '\\(I_0 = \\iint \\|\\mathbf{t}\\|\\, dA\\) (total traction intensity)',
      '\\((\\bar{x},\\, \\bar{y})\\) = traction centroid',
    ],
    sourceDocument: 'ATotalUnificationofEngineeringLoadsviaMomentCalculus.pdf',
  },
  {
    id: 'master-m019',
    title: 'M-019: Concentrated Force (Point Load)',
    category: 'application',
    domain: 'structures',
    content: 'Concentrated force idealization I = F·δ(z − z₀). A generalized measure on a point support. Negative-order moments require regularization; the Dirac delta collapses centroid to z₀ with zero spread.',
    equations: [
      '\\(I = F\\,\\delta(z - z_0)\\) (generalized measure)',
      '\\(\\Omega\\) = point support',
      '\\(I_0 = F\\),\\; \\(\\bar{z} = z_0\\)',
      'Negative orders require \\(\\varepsilon\\)-regularization',
    ],
    sourceDocument: 'ATotalUnificationofEngineeringLoadsviaMomentCalculus.pdf',
  },
  // ============ STATE VARIABLES CONVERSION ============
  {
    id: 'state-temperature',
    title: 'State Variable: Temperature Field T(x,t)',
    category: 'theory',
    domain: 'heat',
    content: 'Temperature is a state variable, not a load intensity. May be negative relative to reference. Fix: use derived surrogates like (T−T_ref)₊, (T−T̄)², ∥∇T∥, or |q″|. Centered inverse moments require ε.',
    equations: [
      '\\(T(\\mathbf{x},t)\\) is state, not additive load',
      '\\(I = (T - T_{\\text{ref}})_+ \\text{ or } (T - \\bar{T})^2 \\text{ or } \\|\\nabla T\\| \\text{ or } |q\'\'|\\)',
      '\\(\\Omega = A \\text{ or } V\\) (optionally \\(\\times [t_0, t_1]\\))',
      'Centroid = hot spot location',
    ],
    sourceDocument: 'ATotalUnificationofEngineeringLoadsviaMomentCalculus.pdf',
  },
  {
    id: 'state-voltage',
    title: 'State Variable: Voltage V(t) / Node Potentials',
    category: 'theory',
    domain: 'circuits',
    content: 'Voltage is a potential (signed), not additive as density. Fix: use power/energy surrogate Iₑ = Pₑ = Vₑiₑ or V²/Rₑ. Centroid/spread show hot components. Inverse-moment graph metrics require cutoff.',
    equations: [
      '\\(V\\) is signed potential, not intensity',
      '\\(I_e = P_e = V_e \\cdot i_e\\) (dissipation) or \\(V^2/R_e\\)',
      '\\(\\Omega = e \\in E\\) (optionally \\(\\times\\) time)',
      'Use dissipation as intensity',
    ],
    sourceDocument: 'ATotalUnificationofEngineeringLoadsviaMomentCalculus.pdf',
  },
  {
    id: 'state-transfer-function',
    title: 'State Variable: Transfer Function G(s)',
    category: 'theory',
    domain: 'dynamics',
    content: 'Transfer function G(s) is complex-valued, not nonnegative. Fix: use frequency magnitude I(ω) = |G(jω)|² on ω ∈ [0,∞). Resultant = spectral-energy proxy; centroid = spectral center; spread = bandwidth.',
    equations: [
      '\\(G(s)\\) is complex-valued',
      '\\(I(\\omega) = |G(j\\omega)|^2 \\geq 0\\)',
      '\\(\\Omega = \\omega \\in [0, \\infty)\\) or finite band',
      'Spectral centroid and bandwidth from moments',
    ],
    sourceDocument: 'ATotalUnificationofEngineeringLoadsviaMomentCalculus.pdf',
  },
  {
    id: 'state-gauge-pressure',
    title: 'State Variable: Gauge Pressure pₘ(x)',
    category: 'theory',
    domain: 'fluids',
    content: 'Gauge pressure is signed relative to ambient; can change sign. Fix: split into p⁺, p⁻ or use |pₘ| or p². After mapping to I ≥ 0, centroid/spread give footprint. Negative-order dominated by near-zero reference.',
    equations: [
      '\\(p_m = p - p_{\\text{ambient}}\\) (signed)',
      '\\(I = |p_m|\\) or \\(p_m^2\\) or split \\(p_m^+,\\, p_m^-\\)',
      'After mapping: apply standard ladder',
      'Report \\(\\varepsilon\\) for negative-order metrics',
    ],
    sourceDocument: 'ATotalUnificationofEngineeringLoadsviaMomentCalculus.pdf',
  },
  {
    id: 'state-current',
    title: 'State Variable: Current i(t) / Branch Current',
    category: 'theory',
    domain: 'circuits',
    content: 'Current is signed; cancellation artifacts arise. Fix: use magnitude |i| or i² or prefer power I = P. Inverse moments can blow up near zeros if used in denominators.',
    equations: [
      '\\(i(t)\\) is signed; cancellation artifacts',
      '\\(I = |i|\\) or \\(i^2\\) or prefer \\(I = P\\)',
      '\\(\\Omega = t\\) or \\(e \\in E\\)',
      'Inverse moments blow up near zero crossings',
    ],
    sourceDocument: 'ATotalUnificationofEngineeringLoadsviaMomentCalculus.pdf',
  },
  {
    id: 'state-delta-temp',
    title: 'State Variable: Temperature Difference ΔT',
    category: 'theory',
    domain: 'heat',
    content: 'Temperature difference ΔT is signed depending on reference. Fix: use (ΔT)² or (ΔT)₊. Deviation intensity; centroid/spread locate where deviation concentrates.',
    equations: [
      '\\(\\Delta T\\) is signed depending on reference',
      '\\(I = (\\Delta T)^2\\) or \\((\\Delta T)_+\\)',
      '\\(\\Omega\\) depends on definition',
      'Centroid/spread locate deviation concentration',
    ],
    sourceDocument: 'ATotalUnificationofEngineeringLoadsviaMomentCalculus.pdf',
  },
  {
    id: 'state-phase',
    title: 'State Variable: Frequency Response Phase ∠G(jω)',
    category: 'theory',
    domain: 'dynamics',
    content: 'Phase is a periodic signed angle, not additive. Moment ladder applies to magnitude energy |G(jω)|², not phase. Phase requires a separate formalism if a ladder is desired.',
    equations: [
      '\\(\\angle G(j\\omega)\\) is periodic signed angle',
      'Use \\(I(\\omega) = |G(j\\omega)|^2\\) for ladder',
      'Treat phase separately from magnitude',
      'No standard moment ladder for phase',
    ],
    sourceDocument: 'ATotalUnificationofEngineeringLoadsviaMomentCalculus.pdf',
  },
  {
    id: 'state-mach-number',
    title: 'State Variable: Mach Number M',
    category: 'theory',
    domain: 'propulsion',
    content: 'Mach number is a coordinate/state, not a load. Fix: choose a nonnegative kernel I(M) (e.g., MFP(M)) on Ω = [M_min, M_max]. Negative-order requires explicit M_min and/or ε.',
    equations: [
      '\\(M\\) is a coordinate, not a load',
      'Choose kernel \\(I(M) \\geq 0\\) (e.g., MFP)',
      '\\(\\Omega = M \\in [M_{\\min},\\, M_{\\max}]\\)',
      'Negative orders require \\(M_{\\min}\\) and/or \\(\\varepsilon\\)',
    ],
    sourceDocument: 'ATotalUnificationofEngineeringLoadsviaMomentCalculus.pdf',
  },
  // ============ CROSS-DOMAIN EQUIVALENCES ============
  {
    id: 'equiv-structures-prob',
    title: 'Equivalence: Structures ↔ Probability Densities',
    category: 'example',
    domain: 'unified',
    content: 'A beam line load w(x) is a density over length. Normalizing yields f(x) = w(x)/F where F = ∫w dx. The centroid x̄ is the center of mass of the load distribution.',
    equations: [
      '\\(F = \\int_0^L w(x)\\, dx\\) (resultant)',
      '\\(f(x) = w(x)/F\\) (density)',
      '\\(\\bar{x} = \\int_0^L x \\cdot f(x)\\, dx\\) (centroid)',
    ],
    sourceDocument: 'ATotalUnificationofEngineeringLoadsviaMomentCalculus.pdf',
  },
  {
    id: 'equiv-heat-power',
    title: 'Equivalence: Heat Flux ↔ Spatial Density of Power',
    category: 'example',
    domain: 'unified',
    content: 'Surface heat flux q″ [W/m²] is literally power per unit area. Q̇ = ∫q″ dA gives total power; x̄ = (1/Q̇)∫x·q″ dA gives the "center of heating".',
    equations: [
      '\\(\\dot{Q} = \\int_A q\'\'\\, dA\\) (total power)',
      '\\(\\bar{x} = \\frac{1}{\\dot{Q}} \\int_A x \\cdot q\'\'\\, dA\\) (center of heating)',
    ],
    sourceDocument: 'ATotalUnificationofEngineeringLoadsviaMomentCalculus.pdf',
  },
  {
    id: 'equiv-circuits-discrete',
    title: 'Equivalence: Circuits ↔ Discrete Measures on Graphs',
    category: 'example',
    domain: 'unified',
    content: 'Power dissipation per component is nonnegative. I₀ = Σₑ Pₑ; fₑ = Pₑ/I₀ forms a discrete probability distribution. Centroid/spread require a graph metric (hop distance or physical embedding).',
    equations: [
      '\\(I_0 = \\sum_{e \\in E} P_e\\) (total dissipation)',
      '\\(f_e = P_e / I_0\\) (discrete density)',
      '\\(\\bar{e} = \\sum_e \\phi(e) \\cdot f_e\\) (graph centroid)',
      '\\(\\phi\\) = hop distance or physical position',
    ],
    sourceDocument: 'ATotalUnificationofEngineeringLoadsviaMomentCalculus.pdf',
  },
  {
    id: 'equiv-pressure-shear',
    title: 'Equivalence: Pressure/Shear ↔ Traction-Intensity Densities',
    category: 'example',
    domain: 'unified',
    content: 'Pressure magnitude p(x) and shear magnitude |τw(x)| are force-per-area intensities. Integrating gives resultant forces; centroids give points of action; spreads give footprints.',
    equations: [
      '\\(I_p = p(\\mathbf{x})\\) [N/m²] (pressure intensity)',
      '\\(I_\\tau = |\\tau_w(\\mathbf{x})|\\) [N/m²] (shear intensity)',
      '\\(F = \\iint I\\, dA\\) (resultant force)',
      'Centroid = point of action; spread = footprint',
    ],
    sourceDocument: 'ATotalUnificationofEngineeringLoadsviaMomentCalculus.pdf',
  },
  {
    id: 'equiv-propulsion-flux',
    title: 'Equivalence: Propulsion ↔ Flux Densities',
    category: 'example',
    domain: 'unified',
    content: 'Thrust arises from momentum-flux and pressure-thrust terms. When expressed over exit planes or control surfaces, these are intensities with centroids/spreads diagnosing alignment and off-axis tendencies.',
    equations: [
      '\\(I = \\rho u^2\\) (momentum flux density)',
      '\\(I = |p - p_a|\\) (pressure thrust density)',
      'Centroid diagnoses thrust alignment',
      'Spread diagnoses off-axis torque propensity',
    ],
    sourceDocument: 'ATotalUnificationofEngineeringLoadsviaMomentCalculus.pdf',
  },
  // ============ VERIFICATION HARNESSES ============
  {
    id: 'verify-units',
    title: 'Verification: Units / Dimensional Analysis',
    category: 'theory',
    domain: 'unified',
    content: 'For each master row, verify: (1) Choose Ω and measure μ; (2) Confirm [I] = [quantity]/[μ]; (3) Confirm [I₀] = [quantity]; (4) Confirm f = I/I₀ is dimensionless and integrates to 1; (5) Confirm moments have units [ϕ]ⁿ.',
    equations: [
      '\\([I_0] = [I] \\cdot [\\mu] = [\\text{quantity}]\\)',
      '\\([f] = \\text{dimensionless},\\; \\int f\\, d\\mu = 1\\)',
      '\\([\\mu_n] = [\\phi]^n\\) (moment units)',
      'Example: \\([w] = \\text{N/m},\\; [\\mu] = \\text{m},\\; [I_0] = \\text{N}\\)',
    ],
    sourceDocument: 'ATotalUnificationofEngineeringLoadsviaMomentCalculus.pdf',
  },
  {
    id: 'verify-invariants',
    title: 'Verification: Conservation-Law Invariants',
    category: 'theory',
    domain: 'unified',
    content: 'When load is derived from a balance law, verify invariants: Mass (fluids): ṁ consistency across stations. Momentum: control-volume balance closes with pressure. Energy: dissipated power integrates to energy change. Charge (circuits): KCL consistency.',
    equations: [
      'Mass: \\(\\dot{m}_{\\text{in}} = \\dot{m}_{\\text{out}}\\) (steady flow)',
      'Momentum: \\(\\sum F = \\dot{m}(V_{\\text{out}} - V_{\\text{in}})\\)',
      'Energy: \\(\\dot{Q} - \\dot{W} = \\Delta \\dot{E}\\)',
      'Charge: \\(\\sum i_{\\text{node}} = 0\\) (KCL)',
    ],
    sourceDocument: 'ATotalUnificationofEngineeringLoadsviaMomentCalculus.pdf',
  },
  {
    id: 'verify-negative-order',
    title: 'Verification: Negative-Order Audit',
    category: 'theory',
    domain: 'unified',
    content: 'If any negative-order statistic is reported: (1) State chosen reference point (origin vs centroid vs physics-selected); (2) State whether raw or central; (3) Provide cutoff/regularization ε; (4) Demonstrate stability under reasonable variation of ε.',
    equations: [
      '1. Reference point: origin / centroid / physics',
      '2. Type: raw \\(\\mu_{-k}\\) or central \\(\\mu_{-k,c}\\)',
      '3. Regularization: \\(\\varepsilon\\) (mesh/sensor/scale)',
      '4. Stability: \\(\\partial \\mu_{-k}/\\partial \\varepsilon\\) well-behaved',
    ],
    sourceDocument: 'ATotalUnificationofEngineeringLoadsviaMomentCalculus.pdf',
  },
  // ============ ELEMENTARY SHAPE FORMULAS ============
  {
    id: 'elementary-shapes-formulas',
    title: 'Elementary Shape Centroids & Second Moments',
    category: 'example',
    domain: 'unified',
    content: 'Closed-form centroid and second moment formulas for common shapes with uniform intensity I₀ = ∫I dA. The second moments are about centroidal axes, scaled by resultant I₀.',
    equations: [
      'Rectangle \\((L \\times H)\\): \\(\\bar{x} = \\bar{y} = 0\\)',
      '\\(I_{xx} = I_0 H^2/12,\\quad I_{yy} = I_0 L^2/12\\)',
      'Triangle (base \\(b\\), height \\(h\\)): \\(\\bar{x} = 0,\\; \\bar{y} = h/3\\)',
      '\\(I_{xx} = I_0 h^2/18,\\quad I_{yy} = I_0 b^2/24\\)',
      'Circle (radius \\(R\\)): \\(\\bar{x} = \\bar{y} = 0\\)',
      '\\(I_{xx} = I_{yy} = I_0 R^2/4,\\quad J = I_0 R^2/2\\)',
    ],
    sourceDocument: 'ATotalUnificationofEngineeringLoadsviaMomentCalculus.pdf',
  },
];

const categoryIcons = {
  theory: BookOpen,
  application: Beaker,
  example: Lightbulb,
};

const domainIcons = {
  unified: Calculator,
  structures: Building2,
  heat: Flame,
  fluids: Droplets,
  dynamics: Activity,
  circuits: Zap,
  propulsion: Activity,
};

const domainColors = {
  unified: 'bg-math/20 text-math border-math/30',
  structures: 'bg-structures/20 text-structures border-structures/30',
  heat: 'bg-heat/20 text-heat border-heat/30',
  fluids: 'bg-fluids/20 text-fluids border-fluids/30',
  dynamics: 'bg-primary/20 text-primary border-primary/30',
  circuits: 'bg-warning/20 text-warning border-warning/30',
  propulsion: 'bg-success/20 text-success border-success/30',
};

interface KnowledgeLibraryProps {
  onConceptSelect?: (concept: KnowledgeConcept) => void;
}

type CategoryType = 'theory' | 'application' | 'example';
type FilterDomain = DomainType | 'unified' | 'all';
type FilterCategory = CategoryType | 'all';

const allDomains: { value: FilterDomain; label: string; icon: React.ElementType }[] = [
  { value: 'all', label: 'All Domains', icon: Calculator },
  { value: 'unified', label: 'Unified', icon: Calculator },
  { value: 'structures', label: 'Structures', icon: Building2 },
  { value: 'heat', label: 'Heat', icon: Flame },
  { value: 'fluids', label: 'Fluids', icon: Droplets },
  { value: 'dynamics', label: 'Dynamics', icon: Activity },
  { value: 'circuits', label: 'Circuits', icon: Zap },
  { value: 'propulsion', label: 'Propulsion', icon: Rocket },
];

const allCategories: { value: FilterCategory; label: string; icon: React.ElementType }[] = [
  { value: 'all', label: 'All', icon: CheckCircle },
  { value: 'theory', label: 'Theory', icon: BookOpen },
  { value: 'application', label: 'Application', icon: Beaker },
  { value: 'example', label: 'Example', icon: Lightbulb },
];

export function KnowledgeLibrary({ onConceptSelect }: KnowledgeLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<FilterDomain>('all');
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');

  const filteredConcepts = useMemo(() => {
    return initialConcepts.filter(concept => {
      // Domain filter
      if (selectedDomain !== 'all' && concept.domain !== selectedDomain) {
        return false;
      }
      // Category filter
      if (selectedCategory !== 'all' && concept.category !== selectedCategory) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = concept.title.toLowerCase().includes(query);
        const matchesContent = concept.content.toLowerCase().includes(query);
        const matchesEquations = concept.equations.some(eq => eq.toLowerCase().includes(query));
        return matchesTitle || matchesContent || matchesEquations;
      }
      return true;
    });
  }, [searchQuery, selectedDomain, selectedCategory]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedDomain('all');
    setSelectedCategory('all');
  };

  const hasActiveFilters = searchQuery || selectedDomain !== 'all' || selectedCategory !== 'all';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Knowledge Library</h2>
          <p className="text-sm text-muted-foreground">
            From "A Total Unification of Engineering Loads via Moment Calculus" (Feb 2026)
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          {filteredConcepts.length} / {initialConcepts.length} concepts
        </Badge>
      </div>

      {/* Search and Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search concepts, equations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Domain Filter */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground self-center mr-1">Domain:</span>
          {allDomains.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setSelectedDomain(value)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedDomain === value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <span className="text-xs text-muted-foreground self-center mr-1">Category:</span>
          {allCategories.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setSelectedCategory(value)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                selectedCategory === value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              <Icon className="h-3 w-3" />
              {label}
            </button>
          ))}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors ml-2"
            >
              <X className="h-3 w-3" />
              Clear All
            </button>
          )}
        </div>
      </div>

      <ScrollArea className="h-[calc(100vh-22rem)]">
        <div className="space-y-3 pr-4">
          {filteredConcepts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No concepts found matching your filters.</p>
              <button onClick={clearFilters} className="text-primary hover:underline text-sm mt-2">
                Clear filters
              </button>
            </div>
          ) : (
            filteredConcepts.map((concept, index) => {
              const CategoryIcon = categoryIcons[concept.category];
              const DomainIcon = domainIcons[concept.domain as keyof typeof domainIcons] || Calculator;
              const colorClass = domainColors[concept.domain as keyof typeof domainColors] || domainColors.unified;

              return (
                <motion.div
                  key={concept.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.02 }}
                >
                  <Card
                    className="border-border/50 bg-card/60 backdrop-blur cursor-pointer hover:bg-card/80 transition-colors"
                    onClick={() => onConceptSelect?.(concept)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded ${colorClass}`}>
                            <DomainIcon className="h-3.5 w-3.5" />
                          </div>
                          <CardTitle className="text-sm font-medium">{concept.title}</CardTitle>
                        </div>
                        <Badge variant="secondary" className="text-xs shrink-0">
                          <CategoryIcon className="h-3 w-3 mr-1" />
                          {concept.category}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-xs text-muted-foreground mb-3">
                        {concept.content}
                      </p>
                      {concept.equations.length > 0 && (
                        <div className="equation-box text-xs space-y-2">
                          {concept.equations.map((eq, i) => (
                            <div key={i} className="text-primary/80">
                              <EquationRenderer equation={eq} />
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
