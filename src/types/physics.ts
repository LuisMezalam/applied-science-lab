// Physics simulation types for Unified Moment Calculus

export type DomainType = 'structures' | 'heat' | 'fluids';

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

export interface LoadingProfile {
  id: string;
  name: string;
  description: string;
  domain: DomainType;
  // Function to generate intensity values
  generator: (x: number, params: LoadingParams) => number;
  // Default parameters
  defaultParams: LoadingParams;
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
