// Jordan Decomposition for Signed Intensity Fields
// Splits I(x) = S⁺(x) - S⁻(x) where S⁺ = max(I,0), S⁻ = max(-I,0)

import { IntensityField, MomentResults, JordanDecomposition, LoadingParams } from '@/types/physics';
import { calculateMoments } from './momentCalculus';

/**
 * Generate an intensity field allowing negative values (no clamping)
 */
export function generateSignedField(
  generator: (x: number, params: LoadingParams) => number,
  params: LoadingParams,
  resolution: number = 300
): IntensityField {
  const domain: [number, number] = [0, params.length];
  const positions: number[] = [];
  const values: number[] = [];
  const dx = params.length / (resolution - 1);
  for (let i = 0; i < resolution; i++) {
    const x = i * dx;
    positions.push(x);
    values.push(generator(x, params)); // No clamping — allow signed values
  }
  return { values, positions, domain };
}

/**
 * Perform Jordan decomposition: I = S⁺ − S⁻
 */
export function jordanDecompose(field: IntensityField): JordanDecomposition {
  const { values, positions, domain } = field;

  const posValues = values.map(v => Math.max(v, 0));
  const negValues = values.map(v => Math.max(-v, 0));

  const positivePart: IntensityField = { values: posValues, positions: [...positions], domain };
  const negativePart: IntensityField = { values: negValues, positions: [...positions], domain };

  const positiveMoments = calculateMoments(positivePart);
  const negativeMoments = calculateMoments(negativePart);

  const totalVariation = positiveMoments.zerothMoment + negativeMoments.zerothMoment;
  const netResultant = positiveMoments.zerothMoment - negativeMoments.zerothMoment;
  const signedRatio = totalVariation > 0
    ? Math.min(positiveMoments.zerothMoment, negativeMoments.zerothMoment) / (totalVariation / 2)
    : 0;

  return {
    positivePart,
    negativePart,
    positiveMoments,
    negativeMoments,
    totalVariation,
    netResultant,
    signedRatio,
  };
}

/**
 * Check if a field has any negative values
 */
export function fieldHasNegativeValues(field: IntensityField): boolean {
  return field.values.some(v => v < 0);
}
