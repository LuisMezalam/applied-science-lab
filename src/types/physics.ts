// Physics simulation types for Unified Moment Calculus

export type DomainType = 'structures' | 'heat' | 'fluids' | 'dynamics' | 'circuits' | 'propulsion';

export interface IntensityField {
  // The intensity function I(x) evaluated at discrete points
  values: number[];
  // Corresponding x positions
  positions: number[];
  // Domain bounds [start, end]
  domain: [number, number];
}

export interface MomentResults {
  // Zeroth moment: resultant I₀ = ∫I(x)dx
  zerothMoment: number;
  // First raw moment: I₁ = ∫x·I(x)dx
  firstRawMoment: number;
  // Centroid: x̄ = I₁/I₀
  centroid: number;
  // First central moment (always zero by definition)
  firstCentralMoment: number;
  // Second central moment (variance): σ² = ∫(x-x̄)²·f(x)dx
  secondCentralMoment: number;
  // Standard deviation: σ = √(σ²)
  standardDeviation: number;
  // Skewness (third standardized moment)
  skewness: number;
  // Kurtosis (fourth standardized moment)
  kurtosis: number;
}

export interface NegativeOrderMoments {
  // Regularization parameter ε (resolution scale)
  epsilon: number;
  // Raw inverse moment m₋₁,ε = ∫(x² + ε²)^(-1/2) f(x) dx
  rawInverseMoment1: number;
  // Raw inverse moment m₋₂,ε = ∫(x² + ε²)^(-1) f(x) dx
  rawInverseMoment2: number;
  // Central inverse moment μ₋₁,ε = ∫(r² + ε²)^(-1/2) f(x) dx
  centralInverseMoment1: number;
  // Central inverse moment μ₋₂,ε = ∫(r² + ε²)^(-1) f(x) dx
  centralInverseMoment2: number;
  // Effective width from inverse moment: w_eff = μ₋₁,ε^(-1)
  effectiveWidth1: number;
  // Effective width from second inverse: w_eff² = μ₋₂,ε^(-1/2)
  effectiveWidth2: number;
}

export interface JordanDecomposition {
  // S⁺(x) = max(I(x), 0) — positive part
  positivePart: IntensityField;
  // S⁻(x) = max(-I(x), 0) — negative part (stored as non-negative values)
  negativePart: IntensityField;
  // Moment ladders for each component
  positiveMoments: MomentResults;
  negativeMoments: MomentResults;
  // Total variation |S| = S⁺ + S⁻
  totalVariation: number;
  // Net resultant = S⁺ - S⁻ (= I₀ of original)
  netResultant: number;
  // Ratio: how "signed" the field is (0 = all positive, 1 = perfectly balanced)
  signedRatio: number;
}

export interface LoadingProfile {
  id: string;
  name: string;
  description: string;
  domain: DomainType;
  // Function to generate intensity values
  generator: (x: number, params: LoadingParams) => number;
  // Default parameters
  defaultParams: LoadingParams;
  // Reference to dictionary entry (e.g., 'M-001')
  dictionaryRef?: string;
}

export interface LoadingParams {
  magnitude: number;
  length: number;
  position?: number;
  width?: number;
  // For triangular/trapezoidal loads
  startMagnitude?: number;
  endMagnitude?: number;
}

export interface SimulationState {
  currentProfile: LoadingProfile;
  params: LoadingParams;
  field: IntensityField;
  moments: MomentResults;
  resolution: number; // Number of discrete points
}

// Knowledge library types
export interface KnowledgeConcept {
  id: string;
  title: string;
  category: 'theory' | 'application' | 'example';
  domain: DomainType | 'unified';
  content: string;
  equations: string[];
  sourceDocument?: string;
}

export interface PDFDocument {
  id: string;
  title: string;
  uploadedAt: Date;
  concepts: KnowledgeConcept[];
}
