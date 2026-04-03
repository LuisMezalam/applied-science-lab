// Standard loading profiles for engineering simulations

import { LoadingProfile, LoadingParams } from '@/types/physics';

// Uniform distributed load: w(x) = w₀
const uniformLoad: LoadingProfile = {
  id: 'uniform',
  name: 'Uniform Load',
  description: 'Constant intensity across the domain (e.g., uniform beam load, constant heat flux)',
  domain: 'structures',
  dictionaryRef: 'M-001',
  generator: (x: number, params: LoadingParams) => {
    if (x >= 0 && x <= params.length) {
      return params.magnitude;
    }
    return 0;
  },
  defaultParams: {
    magnitude: 10,
    length: 10,
  },
};

// Triangular load: w(x) = w₀ · (x/L) or w(x) = w₀ · (1 - x/L)
const triangularLoad: LoadingProfile = {
  id: 'triangular',
  name: 'Triangular Load',
  description: 'Linearly varying load (e.g., hydrostatic pressure on dam, linearly varying heat source)',
  domain: 'structures',
  dictionaryRef: 'M-001',
  generator: (x: number, params: LoadingParams) => {
    if (x >= 0 && x <= params.length) {
      return params.magnitude * (x / params.length);
    }
    return 0;
  },
  defaultParams: {
    magnitude: 20,
    length: 10,
  },
};

// Inverse triangular (decreasing)
const inverseTriangularLoad: LoadingProfile = {
  id: 'inverse-triangular',
  name: 'Inverse Triangular',
  description: 'Decreasing linear load from maximum at start to zero at end',
  domain: 'structures',
  generator: (x: number, params: LoadingParams) => {
    if (x >= 0 && x <= params.length) {
      return params.magnitude * (1 - x / params.length);
    }
    return 0;
  },
  defaultParams: {
    magnitude: 20,
    length: 10,
  },
};

// Parabolic/Quadratic load: w(x) = w₀ · (x/L)²
const parabolicLoad: LoadingProfile = {
  id: 'parabolic',
  name: 'Parabolic Load',
  description: 'Quadratically increasing intensity (e.g., centrifugal loading)',
  domain: 'structures',
  generator: (x: number, params: LoadingParams) => {
    if (x >= 0 && x <= params.length) {
      return params.magnitude * Math.pow(x / params.length, 2);
    }
    return 0;
  },
  defaultParams: {
    magnitude: 15,
    length: 10,
  },
};

// Sinusoidal load: w(x) = w₀ · sin(πx/L)
const sinusoidalLoad: LoadingProfile = {
  id: 'sinusoidal',
  name: 'Sinusoidal Load',
  description: 'Half-sine distribution (e.g., thermal gradients, pressure pulses)',
  domain: 'heat',
  dictionaryRef: 'M-003',
  generator: (x: number, params: LoadingParams) => {
    if (x >= 0 && x <= params.length) {
      return params.magnitude * Math.sin(Math.PI * x / params.length);
    }
    return 0;
  },
  defaultParams: {
    magnitude: 12,
    length: 10,
  },
};

// Gaussian/Normal distribution (concentrated load spread)
const gaussianLoad: LoadingProfile = {
  id: 'gaussian',
  name: 'Gaussian Distribution',
  description: 'Bell curve intensity (e.g., localized heating, point load spread)',
  domain: 'heat',
  dictionaryRef: 'M-003',
  generator: (x: number, params: LoadingParams) => {
    const center = params.position ?? params.length / 2;
    const width = params.width ?? params.length / 6;
    const exponent = -Math.pow(x - center, 2) / (2 * width * width);
    return params.magnitude * Math.exp(exponent);
  },
  defaultParams: {
    magnitude: 15,
    length: 10,
    position: 5,
    width: 1.5,
  },
};

// Trapezoidal load
const trapezoidalLoad: LoadingProfile = {
  id: 'trapezoidal',
  name: 'Trapezoidal Load',
  description: 'Linear transition between two intensity levels',
  domain: 'structures',
  generator: (x: number, params: LoadingParams) => {
    if (x >= 0 && x <= params.length) {
      const start = params.startMagnitude ?? params.magnitude * 0.3;
      const end = params.endMagnitude ?? params.magnitude;
      return start + (end - start) * (x / params.length);
    }
    return 0;
  },
  defaultParams: {
    magnitude: 20,
    length: 10,
    startMagnitude: 5,
    endMagnitude: 20,
  },
};

// Exponential decay (heat dissipation, boundary layer)
const exponentialDecay: LoadingProfile = {
  id: 'exponential-decay',
  name: 'Exponential Decay',
  description: 'Exponentially decreasing intensity (e.g., heat dissipation, boundary effects)',
  domain: 'heat',
  generator: (x: number, params: LoadingParams) => {
    if (x >= 0 && x <= params.length) {
      const decayRate = 3 / params.length; // ~95% decay over domain
      return params.magnitude * Math.exp(-decayRate * x);
    }
    return 0;
  },
  defaultParams: {
    magnitude: 20,
    length: 10,
  },
};

// Step function (partial uniform load)
const stepLoad: LoadingProfile = {
  id: 'step',
  name: 'Step Load',
  description: 'Uniform load over partial domain (e.g., partial span loading)',
  domain: 'structures',
  generator: (x: number, params: LoadingParams) => {
    const start = params.position ?? params.length * 0.25;
    const width = params.width ?? params.length * 0.5;
    if (x >= start && x <= start + width) {
      return params.magnitude;
    }
    return 0;
  },
  defaultParams: {
    magnitude: 15,
    length: 10,
    position: 2.5,
    width: 5,
  },
};

// Pressure distribution (aerodynamic profile)
const pressureProfile: LoadingProfile = {
  id: 'pressure',
  name: 'Pressure Profile',
  description: 'Typical aerodynamic pressure distribution (e.g., airfoil loading)',
  domain: 'fluids',
  dictionaryRef: 'M-002',
  generator: (x: number, params: LoadingParams) => {
    if (x >= 0 && x <= params.length) {
      const normalized = x / params.length;
      // Approximate NACA-style pressure coefficient (simplified)
      const suction = Math.sqrt(normalized) * (1 - normalized);
      return params.magnitude * suction * 4; // Scale factor
    }
    return 0;
  },
  defaultParams: {
    magnitude: 10,
    length: 10,
  },
};

// Boundary layer velocity profile
const boundaryLayer: LoadingProfile = {
  id: 'boundary-layer',
  name: 'Boundary Layer',
  description: 'Power-law velocity profile in boundary layer (τ proportional to du/dy)',
  domain: 'fluids',
  dictionaryRef: 'M-005',
  generator: (x: number, params: LoadingParams) => {
    if (x >= 0 && x <= params.length) {
      const normalized = x / params.length;
      // 1/7th power law velocity profile derivative (wall shear)
      return params.magnitude * Math.pow(normalized, 1/7);
    }
    return 0;
  },
  defaultParams: {
    magnitude: 15,
    length: 10,
  },
};

// Double peak (bimodal distribution)
const bimodalLoad: LoadingProfile = {
  id: 'bimodal',
  name: 'Bimodal Distribution',
  description: 'Two peaks of intensity (e.g., two heat sources, dual loading)',
  domain: 'heat',
  generator: (x: number, params: LoadingParams) => {
    if (x >= 0 && x <= params.length) {
      const center1 = params.length * 0.3;
      const center2 = params.length * 0.7;
      const width = params.width ?? params.length / 10;
      
      const peak1 = Math.exp(-Math.pow(x - center1, 2) / (2 * width * width));
      const peak2 = Math.exp(-Math.pow(x - center2, 2) / (2 * width * width));
      
      return params.magnitude * (peak1 + peak2);
    }
    return 0;
  },
  defaultParams: {
    magnitude: 12,
    length: 10,
    width: 0.8,
  },
};

// ============= DYNAMICS PROFILES (M-006, M-007, M-008, M-009) =============

// Impulse force: F(t) = F₀ · e^(-(t-t₀)²/(2w²))
const impulseForce: LoadingProfile = {
  id: 'impulse-force',
  name: 'Impulse Force |F(t)|',
  description: 'Gaussian impulse force in time domain — models impact, shock, or transient excitation (M-006)',
  domain: 'dynamics',
  dictionaryRef: 'M-006',
  generator: (x: number, params: LoadingParams) => {
    const center = params.position ?? params.length * 0.35;
    const width = params.width ?? params.length / 8;
    return params.magnitude * Math.exp(-Math.pow(x - center, 2) / (2 * width * width));
  },
  defaultParams: { magnitude: 20, length: 10, position: 3.5, width: 0.8 },
};

// Harmonic force: |F(t)| = F₀|sin(ωt)|
const harmonicForce: LoadingProfile = {
  id: 'harmonic-force',
  name: 'Harmonic |F(t)|',
  description: 'Rectified sinusoidal force — harmonic excitation magnitude over time (M-006)',
  domain: 'dynamics',
  dictionaryRef: 'M-006',
  generator: (x: number, params: LoadingParams) => {
    if (x < 0 || x > params.length) return 0;
    return params.magnitude * Math.abs(Math.sin(2 * Math.PI * x / params.length * 2));
  },
  defaultParams: { magnitude: 15, length: 10 },
};

// Viscous damper dissipation: I(t) = b·ẋ² (decaying oscillation)
const damperDissipation: LoadingProfile = {
  id: 'damper-dissipation',
  name: 'Damper Dissipation',
  description: 'Viscous dissipation bẋ² from decaying oscillation — nonnegative by construction (M-008)',
  domain: 'dynamics',
  dictionaryRef: 'M-008',
  generator: (x: number, params: LoadingParams) => {
    if (x < 0 || x > params.length) return 0;
    const decay = Math.exp(-2 * x / params.length);
    const velocity = Math.cos(6 * Math.PI * x / params.length);
    return params.magnitude * decay * velocity * velocity;
  },
  defaultParams: { magnitude: 18, length: 10 },
};

// Torque burst: |τ(t)| concentrated burst
const torqueBurst: LoadingProfile = {
  id: 'torque-burst',
  name: 'Torque Burst |τ(t)|',
  description: 'Short torque burst followed by decay — rotational impulse in time (M-007)',
  domain: 'dynamics',
  dictionaryRef: 'M-007',
  generator: (x: number, params: LoadingParams) => {
    if (x < 0 || x > params.length) return 0;
    const t = x / params.length;
    return params.magnitude * t * Math.exp(-4 * t) * 4 * Math.E;
  },
  defaultParams: { magnitude: 25, length: 10 },
};

// ============= CIRCUITS PROFILES (M-010, M-011) =============

// Power dissipation across resistive network (continuous approximation)
const circuitPowerDissipation: LoadingProfile = {
  id: 'circuit-power',
  name: 'Power Dissipation P(x)',
  description: 'Spatial power dissipation in a resistive strip — hot-spot identification (M-011)',
  domain: 'circuits',
  dictionaryRef: 'M-011',
  generator: (x: number, params: LoadingParams) => {
    if (x < 0 || x > params.length) return 0;
    const n = x / params.length;
    // Non-uniform power: higher near center with a secondary peak
    return params.magnitude * (0.3 + 0.7 * Math.exp(-Math.pow(n - 0.4, 2) / 0.02) + 0.4 * Math.exp(-Math.pow(n - 0.8, 2) / 0.01));
  },
  defaultParams: { magnitude: 12, length: 10 },
};

// Current magnitude distribution I_e = |i_e|
const currentDistribution: LoadingProfile = {
  id: 'current-distribution',
  name: 'Current |i(x)|',
  description: 'Current magnitude distribution across branches — discrete-measure analogy (M-010)',
  domain: 'circuits',
  dictionaryRef: 'M-010',
  generator: (x: number, params: LoadingParams) => {
    if (x < 0 || x > params.length) return 0;
    const n = x / params.length;
    // Step-like distribution: discrete branches approximated
    return params.magnitude * (0.5 + 0.5 * Math.sin(5 * Math.PI * n)) * (1 - 0.3 * n);
  },
  defaultParams: { magnitude: 10, length: 10 },
};

// Joule heating I²R profile
const jouleHeating: LoadingProfile = {
  id: 'joule-heating',
  name: 'Joule Heating i²R',
  description: 'Quadratic current-squared dissipation — thermal hotspot in conductor (M-011)',
  domain: 'circuits',
  dictionaryRef: 'M-011',
  generator: (x: number, params: LoadingParams) => {
    if (x < 0 || x > params.length) return 0;
    const n = x / params.length;
    // Current concentrates near one end → i²R peaks
    const current = 1 - 0.6 * n;
    const resistance = 0.5 + n; // increasing R
    return params.magnitude * current * current * resistance;
  },
  defaultParams: { magnitude: 15, length: 10 },
};

// ============= PROPULSION PROFILES (M-012, M-013, M-015, M-016) =============

// Momentum-flux density: ρu²
const momentumFlux: LoadingProfile = {
  id: 'momentum-flux',
  name: 'Momentum Flux ρu²',
  description: 'Momentum-flux density on nozzle exit plane — thrust contribution (M-016)',
  domain: 'propulsion',
  dictionaryRef: 'M-016',
  generator: (x: number, params: LoadingParams) => {
    if (x < 0 || x > params.length) return 0;
    const r = (x / params.length - 0.5) * 2; // normalized [-1, 1]
    // Bell-shaped velocity profile across nozzle
    return params.magnitude * Math.max(0, 1 - r * r) * (1 + 0.2 * r);
  },
  defaultParams: { magnitude: 20, length: 10 },
};

// Pressure thrust density: |p - p_a|
const pressureThrust: LoadingProfile = {
  id: 'pressure-thrust',
  name: 'Pressure Thrust |p−pₐ|',
  description: 'Pressure difference on exit plane — pressure-thrust component (M-015)',
  domain: 'propulsion',
  dictionaryRef: 'M-015',
  generator: (x: number, params: LoadingParams) => {
    if (x < 0 || x > params.length) return 0;
    const r = (x / params.length - 0.5) * 2;
    // Parabolic pressure excess with slight asymmetry
    return params.magnitude * 0.6 * Math.max(0, 1 - r * r * 0.8) * (1 - 0.15 * r);
  },
  defaultParams: { magnitude: 18, length: 10 },
};

// Performance coefficient: C_F(ξ) bell curve in parameter space
const performanceCurve: LoadingProfile = {
  id: 'performance-curve',
  name: 'Performance C_F(ξ)',
  description: 'Performance coefficient over parameter space — operating-point centroid & robustness (M-012)',
  domain: 'propulsion',
  dictionaryRef: 'M-012',
  generator: (x: number, params: LoadingParams) => {
    if (x < 0 || x > params.length) return 0;
    const n = x / params.length;
    // Skewed bell: performance peaks and falls off
    return params.magnitude * Math.pow(n, 1.5) * Math.pow(1 - n, 2) * 6.75;
  },
  defaultParams: { magnitude: 14, length: 10 },
};

// Mach flow parameter: MFP(M)
const machFlowParam: LoadingProfile = {
  id: 'mach-flow',
  name: 'MFP(M) Mach Kernel',
  description: 'Mass flow parameter vs. Mach number — isentropic flow characteristic (M-013)',
  domain: 'propulsion',
  dictionaryRef: 'M-013',
  generator: (x: number, params: LoadingParams) => {
    if (x < 0 || x > params.length) return 0;
    const M = x / params.length * 2; // Mach 0 to 2
    const gamma = 1.4;
    // Simplified MFP: M * (1 + (γ-1)/2 M²)^(-(γ+1)/(2(γ-1)))
    const factor = 1 + (gamma - 1) / 2 * M * M;
    return params.magnitude * M * Math.pow(factor, -(gamma + 1) / (2 * (gamma - 1)));
  },
  defaultParams: { magnitude: 15, length: 10 },
};

// ============= SIGNED PROFILES (for Jordan Decomposition) =============

// Full sine wave (goes negative): w(x) = w₀ · sin(2πx/L)
const fullSineWave: LoadingProfile = {
  id: 'full-sine',
  name: 'Full Sine Wave',
  description: 'Complete sinusoidal cycle with positive and negative regions — ideal for Jordan decomposition',
  domain: 'structures',
  dictionaryRef: 'M-001',
  signed: true,
  generator: (x: number, params: LoadingParams) => {
    if (x < 0 || x > params.length) return 0;
    return params.magnitude * Math.sin(2 * Math.PI * x / params.length);
  },
  defaultParams: { magnitude: 15, length: 10 },
};

// Bending moment diagram (signed): M(x) for simply-supported beam with center load
const bendingMoment: LoadingProfile = {
  id: 'bending-moment',
  name: 'Bending Moment M(x)',
  description: 'Signed bending moment diagram — positive sagging, negative hogging regions',
  domain: 'structures',
  signed: true,
  generator: (x: number, params: LoadingParams) => {
    if (x < 0 || x > params.length) return 0;
    const L = params.length;
    // Continuous beam with overhang: creates sign change
    const n = x / L;
    return params.magnitude * (Math.sin(2 * Math.PI * n) + 0.4 * Math.sin(4 * Math.PI * n));
  },
  defaultParams: { magnitude: 20, length: 10 },
};

// Alternating thermal gradient
const alternatingThermal: LoadingProfile = {
  id: 'alternating-thermal',
  name: 'Alternating Thermal',
  description: 'Oscillating heat flux — heating and cooling zones along domain',
  domain: 'heat',
  signed: true,
  generator: (x: number, params: LoadingParams) => {
    if (x < 0 || x > params.length) return 0;
    const n = x / params.length;
    return params.magnitude * Math.cos(3 * Math.PI * n) * Math.exp(-0.5 * n);
  },
  defaultParams: { magnitude: 12, length: 10 },
};

// Signed pressure (suction + pressure)
const signedPressure: LoadingProfile = {
  id: 'signed-pressure',
  name: 'Signed Pressure Δp',
  description: 'Pressure coefficient with suction (negative) and compression (positive) zones — airfoil analogy',
  domain: 'fluids',
  dictionaryRef: 'M-002',
  signed: true,
  generator: (x: number, params: LoadingParams) => {
    if (x < 0 || x > params.length) return 0;
    const n = x / params.length;
    // Leading edge suction peak (negative) transitioning to positive pressure recovery
    return params.magnitude * (-2 * Math.sqrt(n) * Math.exp(-3 * n) + 0.5 * (1 - n));
  },
  defaultParams: { magnitude: 15, length: 10 },
};

// Harmonic force (signed, not rectified)
const signedHarmonic: LoadingProfile = {
  id: 'signed-harmonic',
  name: 'Signed Harmonic F(t)',
  description: 'Full sinusoidal force — push and pull phases in time domain',
  domain: 'dynamics',
  dictionaryRef: 'M-006',
  signed: true,
  generator: (x: number, params: LoadingParams) => {
    if (x < 0 || x > params.length) return 0;
    return params.magnitude * Math.sin(4 * Math.PI * x / params.length) * Math.exp(-0.3 * x / params.length);
  },
  defaultParams: { magnitude: 18, length: 10 },
};

// AC power (signed)
const acPower: LoadingProfile = {
  id: 'ac-power',
  name: 'AC Power p(t)',
  description: 'Instantaneous AC power — positive (delivered) and negative (reactive) phases',
  domain: 'circuits',
  dictionaryRef: 'M-011',
  signed: true,
  generator: (x: number, params: LoadingParams) => {
    if (x < 0 || x > params.length) return 0;
    const n = x / params.length;
    // v(t)*i(t) with phase lag → signed power
    return params.magnitude * Math.sin(4 * Math.PI * n) * Math.sin(4 * Math.PI * n - 0.8);
  },
  defaultParams: { magnitude: 14, length: 10 },
};
export const loadingProfiles: LoadingProfile[] = [
  uniformLoad,
  triangularLoad,
  inverseTriangularLoad,
  parabolicLoad,
  sinusoidalLoad,
  gaussianLoad,
  trapezoidalLoad,
  exponentialDecay,
  stepLoad,
  pressureProfile,
  boundaryLayer,
  bimodalLoad,
  // Dynamics
  impulseForce,
  harmonicForce,
  damperDissipation,
  torqueBurst,
  // Circuits
  circuitPowerDissipation,
  currentDistribution,
  jouleHeating,
  // Propulsion
  momentumFlux,
  pressureThrust,
  performanceCurve,
  machFlowParam,
  // Signed profiles (Jordan decomposition)
  fullSineWave,
  bendingMoment,
  alternatingThermal,
  signedPressure,
  signedHarmonic,
  acPower,
];

// Group profiles by domain
export const profilesByDomain: Record<string, LoadingProfile[]> = {
  structures: loadingProfiles.filter(p => p.domain === 'structures'),
  heat: loadingProfiles.filter(p => p.domain === 'heat'),
  fluids: loadingProfiles.filter(p => p.domain === 'fluids'),
  dynamics: loadingProfiles.filter(p => p.domain === 'dynamics'),
  circuits: loadingProfiles.filter(p => p.domain === 'circuits'),
  propulsion: loadingProfiles.filter(p => p.domain === 'propulsion'),
};

// Get profile by ID
export function getProfileById(id: string): LoadingProfile | undefined {
  return loadingProfiles.find(p => p.id === id);
}
