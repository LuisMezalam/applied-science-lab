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

// Export all profiles
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
];

// Group profiles by domain
export const profilesByDomain = {
  structures: loadingProfiles.filter(p => p.domain === 'structures'),
  heat: loadingProfiles.filter(p => p.domain === 'heat'),
  fluids: loadingProfiles.filter(p => p.domain === 'fluids'),
};

// Get profile by ID
export function getProfileById(id: string): LoadingProfile | undefined {
  return loadingProfiles.find(p => p.id === id);
}
