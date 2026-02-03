import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { KnowledgeConcept, DomainType } from '@/types/physics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
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
      'I(z) ≥ 0, z ∈ Ω',
      'I₀ := ∫_Ω I(z) dμ(z) ∈ (0, ∞)',
      '[I₀] = [I] · [μ] (dimensional sanity)',
      'Examples: w(x) [N/m], q″ [W/m²], p [Pa], P [W]',
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
      'f(z) := I(z)/I₀',
      '∫_Ω f(z) dμ(z) = 1',
      'f is the universal weighting function',
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
      'n=0: I₀ = ∫_Ω I dμ (resultant)',
      'n=1 (raw): ϕ̄ = (1/I₀) ∫_Ω ϕ(z)·I(z) dμ (centroid)',
      'n=2 (central): Σ = ∫_Ω r(z)r(z)ᵀf(z) dμ, where r = ϕ - ϕ̄',
      '1D: σ² = ∫(x-x̄)²f(x)dx',
      'Higher: γ₁ = μ₃/σ³ (skewness), γ₂ = μ₄/σ⁴ (kurtosis)',
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
      '(d/dt) ∫_V ψ dV = −∫_∂V J·n dA + ∫_V s dV',
      'ψ = density (per volume)',
      'J·n = boundary flux (per area)',
      's = volumetric source (per volume)',
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
      'P = e · f (power conjugate pair)',
      'P = F·v (mechanical, translational)',
      'P = τ·ω (mechanical, rotational)',
      'P = V·I (electrical)',
      'P = Δp·Q (hydraulic)',
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
      'Option A: I(z) ∈ {|S|, S², energy density, dissipation rate}',
      'Option B: S(z) = S⁺(z) − S⁻(z), S± ≥ 0',
      'Compute ladders for S⁺ and S⁻ separately',
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
      'mₛ = E[Xˢ] = ∫₀^∞ xˢ fₓ(x) dx, s ∈ ℝ',
      'm₋ₖ = E[X⁻ᵏ] = ∫₀^∞ x⁻ᵏ fₓ(x) dx',
      'Existence requires fₓ(0) → 0 fast enough',
      'Diverges if fₓ(0) > 0 and continuous',
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
      'μ₋ₖ = ∫_Ω |r(z)|⁻ᵏ f(z) dμ(z)',
      'r(z) = ϕ(z) − ϕ̄ (distance from centroid)',
      'Diverges if f(ϕ̄) > 0 for k ≥ 1',
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
      'μ₋ₖ,ε = ∫_Ω (r² + ε²)^(−k/2) f(z) dμ(z)',
      'ε = sensor footprint / mesh size / min scale',
      'Effective width: w_eff(k,ε) = μ₋ₖ,ε^(−1/k)',
      'Must report ε with any negative-order statistic',
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
      'Ω = [a, b] ⊂ ℝ¹ (line segment)',
      'I₀ = ∫ₐᵇ I(x) dx',
      'x̄ = (1/I₀) ∫ₐᵇ x·I(x) dx',
      'σ² = (1/I₀) ∫ₐᵇ (x-x̄)²·I(x) dx',
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
      'Ω ⊂ ℝ² (rectangle, circle, triangle)',
      'I₀ = ∬_Ω I(x,y) dA',
      '(x̄, ȳ) = (1/I₀) ∬_Ω (x,y)·I dA',
      'Iₓₓ = ∬(y-ȳ)²·I dA, Iᵧᵧ = ∬(x-x̄)²·I dA',
      'Iₓᵧ = ∬(x-x̄)(y-ȳ)·I dA',
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
      'V ⊂ ℝ³ (3D volume)',
      'I₀ = ∭_V I(x,y,z) dV',
      'r̄ = (1/I₀) ∭_V r·I(r) dV (centroid)',
      'Iⱼₖ = ∭_V (rⱼ−r̄ⱼ)(rₖ−r̄ₖ)·I dV (inertia tensor)',
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
      'I(x) = w(x) (or |w|, split w⁺/w⁻)',
      'Ω = x ∈ [0, L]',
      'I₀ = ∫₀ᴸ w(x) dx (resultant force)',
      'x̄ = (1/I₀) ∫₀ᴸ x·w(x) dx (line of action)',
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
      'I = p ≥ 0 (or |p|, p² if signed)',
      'Ω = x ∈ A (surface)',
      'I₀ = ∬_A p dA (resultant force proxy)',
      '(x̄, ȳ) = centroid of pressure distribution',
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
      'I = q″ if q″ ≥ 0, else |q″| or split',
      'Ω = x ∈ A (surface)',
      'Q̇ = ∬_A q″ dA (total heat rate)',
      'x̄ = (1/Q̇) ∬_A x·q″ dA (center of heating)',
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
      'I = q‴(x) ≥ 0',
      'Ω = V (volume)',
      'Q̇ = ∭_V q‴ dV (total generation)',
      'r̄ = (1/Q̇) ∭_V r·q‴ dV (thermal centroid)',
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
      'I = |τw|',
      'Ω = x ∈ A (surface)',
      'I₀ = ∬_A |τw| dA (total shear intensity)',
      '(x̄, ȳ) = shear centroid',
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
      'I(t) = |F(t)| or F(t)² or |F(t)v(t)|',
      'Ω = t ∈ [t₀, t₁]',
      'I₀ = ∫ I(t) dt (impulse/energy proxy)',
      't̄ = (1/I₀) ∫ t·I(t) dt (temporal centroid)',
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
      'I(t) = |τ(t)| or |τ(t)ω(t)| or τ(t)²',
      'Ω = t ∈ [t₀, t₁]',
      'I₀ = ∫ I(t) dt (angular impulse/work)',
      't̄ = temporal centroid of torque action',
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
      'I(t) = b·ẋ(t)² ≥ 0',
      'Ω = t ∈ [t₀, t₁]',
      'E_diss = ∫ b·ẋ² dt (dissipated energy)',
      't̄ = temporal centroid of dissipation',
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
      'Iₑ = |iₑ| or iₑ²',
      'Ω = e ∈ E (graph edges)',
      'I₀ = Σₑ Iₑ (total current intensity)',
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
      'Iₑ = Pₑ = Vₑ·iₑ ≥ 0',
      'Ω = e ∈ E (graph edges/nodes)',
      'I₀ = Σₑ Pₑ (total power dissipation)',
      'fₑ = Pₑ/I₀ (discrete density)',
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
      'I(M) = MFP(M) ≥ 0',
      'Ω = M ∈ [M_min, M_max]',
      'M̄ = (1/I₀) ∫ M·MFP(M) dM',
      'Σ = Mach-space spread',
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
      'I(x) = ρ(x)·u(x)²',
      'Ω = x ∈ A_exit (nozzle exit plane)',
      'F = ∬ ρu² dA (thrust contribution)',
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
      'I = ∥b(x)∥ [N/m³]',
      'Ω = x ∈ V (volume)',
      'I₀ = ∭ ∥b∥ dV (total body force intensity)',
      'Componentwise ladders also valid',
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
      'T(x,t) is state, not additive load',
      'I = (T − T_ref)₊ or (T − T̄)² or ∥∇T∥ or |q″|',
      'Ω = A or V (optionally × [t₀,t₁])',
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
      'V is signed potential, not intensity',
      'Iₑ = Pₑ = Vₑ·iₑ (dissipation) or V²/Rₑ',
      'Ω = e ∈ E (optionally × time)',
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
      'G(s) is complex-valued',
      'I(ω) = |G(jω)|² ≥ 0',
      'Ω = ω ∈ [0, ∞) or finite band',
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
      'pₘ = p − p_ambient (signed)',
      'I = |pₘ| or pₘ² or split pₘ⁺, pₘ⁻',
      'After mapping: apply standard ladder',
      'Report ε for negative-order metrics',
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
      'F = ∫₀ᴸ w(x) dx (resultant)',
      'f(x) = w(x)/F (density)',
      'x̄ = ∫₀ᴸ x·f(x) dx (centroid)',
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
      'Q̇ = ∫_A q″ dA (total power)',
      'x̄ = (1/Q̇) ∫_A x·q″ dA (center of heating)',
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
      'I₀ = Σₑ∈E Pₑ (total dissipation)',
      'fₑ = Pₑ / I₀ (discrete density)',
      'Graph centroid: ē = Σₑ ϕ(e)·fₑ',
      'ϕ = hop distance or physical position',
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
      '[I₀] = [I] · [μ] = [quantity]',
      '[f] = dimensionless, ∫f dμ = 1',
      '[μₙ] = [ϕ]ⁿ (moment units)',
      'Example: [w] = N/m, [μ] = m, [I₀] = N',
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
      'Mass: ṁ_in = ṁ_out (steady flow)',
      'Momentum: ΣF = ṁ(V_out − V_in)',
      'Energy: Q̇ − Ẇ = ΔĖ',
      'Charge: Σi_node = 0 (KCL)',
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
      '2. Type: raw μ₋ₖ or central μ₋ₖ,c',
      '3. Regularization: ε (mesh/sensor/scale)',
      '4. Stability: ∂μ₋ₖ/∂ε well-behaved',
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
      'Rectangle (L×H centered): x̄ = ȳ = 0',
      '  Iₓₓ = I₀·H²/12, Iᵧᵧ = I₀·L²/12',
      'Triangle (base b, height h): x̄ = 0, ȳ = h/3',
      '  Iₓₓ = I₀·h²/18, Iᵧᵧ = I₀·b²/24',
      'Circle (radius R): x̄ = ȳ = 0',
      '  Iₓₓ = Iᵧᵧ = I₀·R²/4, J = I₀·R²/2',
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
                        <div className="equation-box text-xs space-y-1">
                          {concept.equations.map((eq, i) => (
                            <div key={i} className="text-primary/80">{eq}</div>
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
