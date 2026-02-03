// Unified Moment Calculus Engine
// Implements the mathematical framework from "A Total Unification of Engineering Loads via Moment Calculus"

import { IntensityField, MomentResults, NegativeOrderMoments, LoadingParams } from '@/types/physics';

/**
 * Numerical integration using the trapezoidal rule
 */
function integrate(values: number[], positions: number[]): number {
  let sum = 0;
  for (let i = 1; i < values.length; i++) {
    const dx = positions[i] - positions[i - 1];
    sum += 0.5 * (values[i] + values[i - 1]) * dx;
  }
  return sum;
}

/**
 * Generate an intensity field from a generator function
 */
export function generateField(
  generator: (x: number, params: LoadingParams) => number,
  params: LoadingParams,
  resolution: number = 200
): IntensityField {
  const domain: [number, number] = [0, params.length];
  const positions: number[] = [];
  const values: number[] = [];
  
  const dx = params.length / (resolution - 1);
  
  for (let i = 0; i < resolution; i++) {
    const x = i * dx;
    positions.push(x);
    values.push(Math.max(0, generator(x, params))); // Ensure non-negative
  }
  
  return { values, positions, domain };
}

/**
 * Calculate all moments from an intensity field
 * Implements the n-moment ladder from the paper:
 * - n=0: resultant I₀
 * - n=1 (raw): centroid x̄
 * - n=1 (central): identically zero
 * - n=2 (central): variance/dispersion
 * - n≥3: asymmetry and tails
 */
export function calculateMoments(field: IntensityField): MomentResults {
  const { values, positions } = field;
  
  // Zeroth moment: I₀ = ∫I(x)dx (resultant)
  const zerothMoment = integrate(values, positions);
  
  if (zerothMoment === 0) {
    return {
      zerothMoment: 0,
      firstRawMoment: 0,
      centroid: 0,
      firstCentralMoment: 0,
      secondCentralMoment: 0,
      standardDeviation: 0,
      skewness: 0,
      kurtosis: 0,
    };
  }
  
  // First raw moment: I₁ = ∫x·I(x)dx
  const xTimesI = values.map((v, i) => positions[i] * v);
  const firstRawMoment = integrate(xTimesI, positions);
  
  // Centroid: x̄ = I₁/I₀
  const centroid = firstRawMoment / zerothMoment;
  
  // Normalized density: f(x) = I(x)/I₀
  const normalizedDensity = values.map(v => v / zerothMoment);
  
  // First central moment: ∫(x-x̄)·f(x)dx (identically zero by definition)
  const firstCentralValues = normalizedDensity.map((f, i) => (positions[i] - centroid) * f);
  const firstCentralMoment = integrate(firstCentralValues, positions);
  
  // Second central moment (variance): σ² = ∫(x-x̄)²·f(x)dx
  const secondCentralValues = normalizedDensity.map((f, i) => 
    Math.pow(positions[i] - centroid, 2) * f
  );
  const secondCentralMoment = integrate(secondCentralValues, positions);
  const standardDeviation = Math.sqrt(secondCentralMoment);
  
  // Third central moment for skewness
  const thirdCentralValues = normalizedDensity.map((f, i) => 
    Math.pow(positions[i] - centroid, 3) * f
  );
  const thirdCentralMoment = integrate(thirdCentralValues, positions);
  const skewness = standardDeviation > 0 
    ? thirdCentralMoment / Math.pow(standardDeviation, 3)
    : 0;
  
  // Fourth central moment for kurtosis
  const fourthCentralValues = normalizedDensity.map((f, i) => 
    Math.pow(positions[i] - centroid, 4) * f
  );
  const fourthCentralMoment = integrate(fourthCentralValues, positions);
  const kurtosis = standardDeviation > 0 
    ? fourthCentralMoment / Math.pow(standardDeviation, 4)
    : 0;
  
  return {
    zerothMoment,
    firstRawMoment,
    centroid,
    firstCentralMoment, // Should be ~0 (numerical precision)
    secondCentralMoment,
    standardDeviation,
    skewness,
    kurtosis,
  };
}

/**
 * Calculate negative-order moments with ε regularization
 * From Section 4 of the paper:
 * - Raw inverse moments: m₋ₖ,ε = ∫(x² + ε²)^(-k/2) f(x) dx
 * - Central inverse moments: μ₋ₖ,ε = ∫(r² + ε²)^(-k/2) f(x) dx where r = x - x̄
 * - ε is the resolution/regularization scale (sensor footprint, mesh size, etc.)
 */
export function calculateNegativeOrderMoments(
  field: IntensityField,
  centroid: number,
  zerothMoment: number,
  epsilon: number = 0.01
): NegativeOrderMoments {
  const { values, positions } = field;
  
  if (zerothMoment === 0 || epsilon <= 0) {
    return {
      epsilon,
      rawInverseMoment1: 0,
      rawInverseMoment2: 0,
      centralInverseMoment1: 0,
      centralInverseMoment2: 0,
      effectiveWidth1: Infinity,
      effectiveWidth2: Infinity,
    };
  }
  
  // Normalized density: f(x) = I(x)/I₀
  const normalizedDensity = values.map(v => v / zerothMoment);
  
  // Raw inverse moment of order -1: m₋₁,ε = ∫(x² + ε²)^(-1/2) f(x) dx
  const rawInverse1Values = normalizedDensity.map((f, i) => {
    const x = positions[i];
    return Math.pow(x * x + epsilon * epsilon, -0.5) * f;
  });
  const rawInverseMoment1 = integrate(rawInverse1Values, positions);
  
  // Raw inverse moment of order -2: m₋₂,ε = ∫(x² + ε²)^(-1) f(x) dx
  const rawInverse2Values = normalizedDensity.map((f, i) => {
    const x = positions[i];
    return Math.pow(x * x + epsilon * epsilon, -1) * f;
  });
  const rawInverseMoment2 = integrate(rawInverse2Values, positions);
  
  // Central inverse moment of order -1: μ₋₁,ε = ∫(r² + ε²)^(-1/2) f(x) dx
  const centralInverse1Values = normalizedDensity.map((f, i) => {
    const r = positions[i] - centroid;
    return Math.pow(r * r + epsilon * epsilon, -0.5) * f;
  });
  const centralInverseMoment1 = integrate(centralInverse1Values, positions);
  
  // Central inverse moment of order -2: μ₋₂,ε = ∫(r² + ε²)^(-1) f(x) dx
  const centralInverse2Values = normalizedDensity.map((f, i) => {
    const r = positions[i] - centroid;
    return Math.pow(r * r + epsilon * epsilon, -1) * f;
  });
  const centralInverseMoment2 = integrate(centralInverse2Values, positions);
  
  // Effective widths (inverse of inverse moments raised to appropriate power)
  // w_eff(k,ε) = μ₋ₖ,ε^(-1/k)
  const effectiveWidth1 = centralInverseMoment1 > 0 
    ? Math.pow(centralInverseMoment1, -1) 
    : Infinity;
  const effectiveWidth2 = centralInverseMoment2 > 0 
    ? Math.pow(centralInverseMoment2, -0.5) 
    : Infinity;
  
  return {
    epsilon,
    rawInverseMoment1,
    rawInverseMoment2,
    centralInverseMoment1,
    centralInverseMoment2,
    effectiveWidth1,
    effectiveWidth2,
  };
}

/**
 * Format a number with appropriate precision for display
 */
export function formatValue(value: number, precision: number = 4): string {
  if (!isFinite(value)) return '∞';
  if (Math.abs(value) < 1e-10) return '0';
  if (Math.abs(value) >= 1000 || Math.abs(value) < 0.01) {
    return value.toExponential(precision - 1);
  }
  return value.toFixed(precision);
}

/**
 * Get engineering interpretation of moments based on domain
 */
export function getMomentInterpretation(domain: string, momentType: string): string {
  const interpretations: Record<string, Record<string, string>> = {
    structures: {
      zeroth: 'Total Force (Resultant)',
      centroid: 'Point of Application',
      second: 'Force-weighted Inertia',
      negativeOrder: 'Load Concentration Index',
    },
    heat: {
      zeroth: 'Total Heating Power',
      centroid: 'Center of Heating',
      second: 'Spatial Nonuniformity',
      negativeOrder: 'Hotspot Localization',
    },
    fluids: {
      zeroth: 'Pressure Resultant',
      centroid: 'Center of Pressure',
      second: 'Pressure Distribution Spread',
      negativeOrder: 'Pressure Concentration',
    },
    dynamics: {
      zeroth: 'Force Impulse',
      centroid: 'Temporal Center',
      second: 'Temporal Spread',
      negativeOrder: 'Impact Localization',
    },
    circuits: {
      zeroth: 'Total Power Dissipation',
      centroid: 'Power Center (graph)',
      second: 'Power Distribution',
      negativeOrder: 'Hotspot Intensity',
    },
    propulsion: {
      zeroth: 'Total Thrust',
      centroid: 'Thrust Center',
      second: 'Thrust Nonuniformity',
      negativeOrder: 'Thrust Concentration',
    },
  };
  
  return interpretations[domain]?.[momentType] || momentType;
}
