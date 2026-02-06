// 2D Moment Calculus for Surface Loading
// Implements double integrals over 2D domains (rectangles, circles, triangles)

export type Shape2D = 'rectangle' | 'circle' | 'triangle';

export interface Shape2DParams {
  shape: Shape2D;
  // Rectangle: width, height
  // Circle: radius
  // Triangle: base, height
  width?: number;
  height?: number;
  radius?: number;
  base?: number;
  // Loading parameters
  magnitude: number;
  loadingType: 'uniform' | 'linear-x' | 'linear-y' | 'radial' | 'parabolic';
}

export interface Moment2DResults {
  // Zeroth moment: Total force/load
  I0: number;
  // Centroid: (x̄, ȳ)
  centroidX: number;
  centroidY: number;
  // Second moments of area
  Ixx: number;  // About x-axis
  Iyy: number;  // About y-axis
  Ixy: number;  // Product of inertia
  // Principal moments and axes
  I1: number;   // Maximum principal moment
  I2: number;   // Minimum principal moment
  theta: number; // Principal axis angle (radians)
  // Radius of gyration
  kx: number;
  ky: number;
}

export interface NegativeOrder2DMoments {
  // Regularization parameter ε
  epsilon: number;
  // Inverse moment tensor components (2x2 symmetric)
  // μ₋₂,ε = ∬ (r² + ε²)⁻¹ f(x,y) dA where r² = (x-x̄)² + (y-ȳ)²
  mu_inv_scalar: number;
  // Directional inverse moments
  // μ₋₂,xx,ε = ∬ ((x-x̄)² + ε²)⁻¹ f(x,y) dA
  mu_inv_xx: number;
  // μ₋₂,yy,ε = ∬ ((y-ȳ)² + ε²)⁻¹ f(x,y) dA
  mu_inv_yy: number;
  // Principal inverse moments (eigenvalues of inverse tensor)
  mu_inv_1: number;
  mu_inv_2: number;
  theta_inv: number; // Principal axis angle
  // Effective radii (inverse of inverse moments)
  effectiveRadiusScalar: number;
  effectiveRadiusX: number;
  effectiveRadiusY: number;
}

export interface Point2D {
  x: number;
  y: number;
  intensity: number;
}

/**
 * Generate sample points for a 2D shape with loading
 */
export function generate2DField(params: Shape2DParams, resolution: number = 50): Point2D[] {
  const points: Point2D[] = [];
  
  switch (params.shape) {
    case 'rectangle':
      return generateRectangleField(params, resolution);
    case 'circle':
      return generateCircleField(params, resolution);
    case 'triangle':
      return generateTriangleField(params, resolution);
    default:
      return points;
  }
}

function generateRectangleField(params: Shape2DParams, resolution: number): Point2D[] {
  const points: Point2D[] = [];
  const w = params.width || 2;
  const h = params.height || 1;
  const dx = w / resolution;
  const dy = h / resolution;
  
  for (let i = 0; i <= resolution; i++) {
    for (let j = 0; j <= resolution; j++) {
      const x = -w/2 + i * dx;
      const y = -h/2 + j * dy;
      const intensity = getIntensity(x, y, params, w, h);
      points.push({ x, y, intensity });
    }
  }
  return points;
}

function generateCircleField(params: Shape2DParams, resolution: number): Point2D[] {
  const points: Point2D[] = [];
  const r = params.radius || 1;
  const dTheta = (2 * Math.PI) / resolution;
  const dr = r / (resolution / 2);
  
  // Center point
  points.push({ x: 0, y: 0, intensity: getIntensity(0, 0, params, r, r) });
  
  // Radial sampling
  for (let ri = 1; ri <= resolution / 2; ri++) {
    const currentR = ri * dr;
    const circumference = 2 * Math.PI * currentR;
    const numPoints = Math.max(8, Math.floor(circumference / dr));
    
    for (let ti = 0; ti < numPoints; ti++) {
      const theta = (ti / numPoints) * 2 * Math.PI;
      const x = currentR * Math.cos(theta);
      const y = currentR * Math.sin(theta);
      const intensity = getIntensity(x, y, params, r, r);
      points.push({ x, y, intensity });
    }
  }
  return points;
}

function generateTriangleField(params: Shape2DParams, resolution: number): Point2D[] {
  const points: Point2D[] = [];
  const base = params.base || 2;
  const height = params.height || 1.5;
  
  // Triangle vertices: (-base/2, 0), (base/2, 0), (0, height)
  for (let i = 0; i <= resolution; i++) {
    const t = i / resolution;
    const currentHeight = t * height;
    const currentWidth = base * (1 - t);
    const numPoints = Math.max(1, Math.floor(resolution * (1 - t)));
    
    for (let j = 0; j <= numPoints; j++) {
      const s = numPoints > 0 ? j / numPoints : 0.5;
      const x = -currentWidth/2 + s * currentWidth;
      const y = currentHeight;
      const intensity = getIntensity(x, y, params, base, height);
      points.push({ x, y, intensity });
    }
  }
  return points;
}

function getIntensity(x: number, y: number, params: Shape2DParams, maxW: number, maxH: number): number {
  const mag = params.magnitude;
  const r = Math.sqrt(x * x + y * y);
  const maxR = Math.max(maxW, maxH) / 2;
  
  switch (params.loadingType) {
    case 'uniform':
      return mag;
    case 'linear-x':
      return mag * (0.5 + x / maxW);
    case 'linear-y':
      return mag * (0.5 + y / maxH);
    case 'radial':
      return mag * (1 - r / maxR);
    case 'parabolic':
      return mag * (1 - (r / maxR) ** 2);
    default:
      return mag;
  }
}

/**
 * Calculate 2D moments using numerical integration
 */
export function calculate2DMoments(points: Point2D[], shape: Shape2D, params: Shape2DParams): Moment2DResults {
  if (points.length === 0) {
    return {
      I0: 0, centroidX: 0, centroidY: 0,
      Ixx: 0, Iyy: 0, Ixy: 0,
      I1: 0, I2: 0, theta: 0,
      kx: 0, ky: 0
    };
  }
  
  // Estimate area element based on shape
  let totalArea: number;
  switch (shape) {
    case 'rectangle':
      totalArea = (params.width || 2) * (params.height || 1);
      break;
    case 'circle':
      totalArea = Math.PI * (params.radius || 1) ** 2;
      break;
    case 'triangle':
      totalArea = 0.5 * (params.base || 2) * (params.height || 1.5);
      break;
    default:
      totalArea = 1;
  }
  
  const dA = totalArea / points.length;
  
  // Zeroth moment: I₀ = ∬ I(x,y) dA
  let I0 = 0;
  let sumX = 0;
  let sumY = 0;
  
  for (const p of points) {
    I0 += p.intensity * dA;
    sumX += p.x * p.intensity * dA;
    sumY += p.y * p.intensity * dA;
  }
  
  // Centroid
  const centroidX = I0 > 0 ? sumX / I0 : 0;
  const centroidY = I0 > 0 ? sumY / I0 : 0;
  
  // Second moments about centroid
  let Ixx = 0; // ∬ (y - ȳ)² I dA
  let Iyy = 0; // ∬ (x - x̄)² I dA
  let Ixy = 0; // ∬ (x - x̄)(y - ȳ) I dA
  
  for (const p of points) {
    const dx = p.x - centroidX;
    const dy = p.y - centroidY;
    Ixx += dy * dy * p.intensity * dA;
    Iyy += dx * dx * p.intensity * dA;
    Ixy += dx * dy * p.intensity * dA;
  }
  
  // Principal moments (eigenvalues of inertia tensor)
  const avg = (Ixx + Iyy) / 2;
  const diff = (Ixx - Iyy) / 2;
  const discriminant = Math.sqrt(diff * diff + Ixy * Ixy);
  
  const I1 = avg + discriminant;
  const I2 = avg - discriminant;
  
  // Principal axis angle
  // Principal axis angle: tan(2θ) = -2Ixy / (Ixx - Iyy)
  // Using atan2 with correct sign convention for counterclockwise positive
  const theta = Math.abs(Ixy) > 1e-10 ? 0.5 * Math.atan2(-2 * Ixy, Ixx - Iyy) : 0;
  
  // Radius of gyration
  const kx = I0 > 0 ? Math.sqrt(Ixx / I0) : 0;
  const ky = I0 > 0 ? Math.sqrt(Iyy / I0) : 0;
  
  return {
    I0, centroidX, centroidY,
    Ixx, Iyy, Ixy,
    I1, I2, theta,
    kx, ky
  };
}

/**
 * Get closed-form solutions for comparison (uniform loading only)
 */
export function getClosedFormMoments(params: Shape2DParams): Moment2DResults | null {
  if (params.loadingType !== 'uniform') return null;
  
  const mag = params.magnitude;
  
  switch (params.shape) {
    case 'rectangle': {
      const w = params.width || 2;
      const h = params.height || 1;
      const I0 = mag * w * h;
      // For rectangle centered at origin with uniform load
      // Ixx = ∬(y-ȳ)²·I dA = I₀·h²/12 (second moment about centroidal x-axis)
      // Iyy = ∬(x-x̄)²·I dA = I₀·w²/12 (second moment about centroidal y-axis)
      const Ixx = I0 * h * h / 12;
      const Iyy = I0 * w * w / 12;
      // Principal moments: for symmetric shapes with Ixy=0, I1=max(Ixx,Iyy), I2=min(Ixx,Iyy)
      const I1 = Math.max(Ixx, Iyy);
      const I2 = Math.min(Ixx, Iyy);
      return {
        I0,
        centroidX: 0,
        centroidY: 0,
        Ixx,
        Iyy,
        Ixy: 0,
        I1,
        I2,
        theta: 0,
        // Radius of gyration: k = √(I/I₀) where I is second moment
        kx: h / Math.sqrt(12),
        ky: w / Math.sqrt(12)
      };
    }
    case 'circle': {
      const r = params.radius || 1;
      const I0 = mag * Math.PI * r * r;
      // For circle: Ixx = Iyy = I₀·r²/4 (second moment about centroidal axes)
      // Note: This is I₀·r²/4, not πr⁴/4 (which is the geometric second moment of area)
      const Ixx = I0 * r * r / 4;
      return {
        I0,
        centroidX: 0,
        centroidY: 0,
        Ixx,
        Iyy: Ixx,
        Ixy: 0,
        I1: Ixx,
        I2: Ixx,
        theta: 0,
        // Radius of gyration: k = √(Ixx/I₀) = r/2
        kx: r / 2,
        ky: r / 2
      };
    }
    case 'triangle': {
      const b = params.base || 2;
      const h = params.height || 1.5;
      const I0 = mag * 0.5 * b * h;
      // Centroid at (0, h/3) for triangle with base centered on x-axis and apex at (0, h)
      // Ixx about centroid = I₀·h²/18 for triangle
      // Iyy about centroid = I₀·b²/24 for triangle
      const Ixx = I0 * h * h / 18;
      const Iyy = I0 * b * b / 24;
      const I1 = Math.max(Ixx, Iyy);
      const I2 = Math.min(Ixx, Iyy);
      return {
        I0,
        centroidX: 0,
        centroidY: h / 3,
        Ixx,
        Iyy,
        Ixy: 0,
        I1,
        I2,
        theta: 0,
        // Radius of gyration: kx = √(Ixx/I₀) = h/√18, ky = √(Iyy/I₀) = b/√24
        kx: h / Math.sqrt(18),
        ky: b / Math.sqrt(24)
      };
    }
    default:
      return null;
  }
}

/**
 * Calculate 2D negative-order moments with ε regularization
 * Extends the 1D concept to 2D inverse moment tensors
 */
export function calculate2DNegativeOrderMoments(
  points: Point2D[],
  centroidX: number,
  centroidY: number,
  I0: number,
  epsilon: number = 0.1
): NegativeOrder2DMoments {
  if (points.length === 0 || I0 === 0 || epsilon <= 0) {
    return {
      epsilon,
      mu_inv_scalar: 0,
      mu_inv_xx: 0,
      mu_inv_yy: 0,
      mu_inv_1: 0,
      mu_inv_2: 0,
      theta_inv: 0,
      effectiveRadiusScalar: Infinity,
      effectiveRadiusX: Infinity,
      effectiveRadiusY: Infinity,
    };
  }

  // Estimate area element
  const dA = 1 / points.length; // Normalized since we divide by I0

  let mu_inv_scalar = 0;
  let mu_inv_xx = 0;
  let mu_inv_yy = 0;
  let mu_inv_xy = 0;

  for (const p of points) {
    const dx = p.x - centroidX;
    const dy = p.y - centroidY;
    const r2 = dx * dx + dy * dy;
    
    // Normalized density at this point
    const f = p.intensity / I0;
    
    // Scalar inverse moment: μ₋₂,ε = ∬ (r² + ε²)⁻¹ f dA
    mu_inv_scalar += (1 / (r2 + epsilon * epsilon)) * f * dA;
    
    // Directional inverse moments (diagonal terms)
    mu_inv_xx += (1 / (dx * dx + epsilon * epsilon)) * f * dA;
    mu_inv_yy += (1 / (dy * dy + epsilon * epsilon)) * f * dA;
    
    // Off-diagonal term for tensor (cross term)
    const denomX = Math.sqrt(dx * dx + epsilon * epsilon);
    const denomY = Math.sqrt(dy * dy + epsilon * epsilon);
    mu_inv_xy += (1 / (denomX * denomY)) * f * dA;
  }

  // Principal inverse moments (eigenvalues of 2x2 tensor [[mu_inv_xx, mu_inv_xy], [mu_inv_xy, mu_inv_yy]])
  const avg = (mu_inv_xx + mu_inv_yy) / 2;
  const diff = (mu_inv_xx - mu_inv_yy) / 2;
  const discriminant = Math.sqrt(diff * diff + mu_inv_xy * mu_inv_xy);
  
  const mu_inv_1 = avg + discriminant;
  const mu_inv_2 = avg - discriminant;
  const theta_inv = Math.abs(mu_inv_xy) > 1e-10 
    ? 0.5 * Math.atan2(-2 * mu_inv_xy, mu_inv_xx - mu_inv_yy) 
    : 0;

  // Effective radii: r_eff = μ₋₂,ε^(-1/2)
  const effectiveRadiusScalar = mu_inv_scalar > 0 ? Math.pow(mu_inv_scalar, -0.5) : Infinity;
  const effectiveRadiusX = mu_inv_xx > 0 ? Math.pow(mu_inv_xx, -0.5) : Infinity;
  const effectiveRadiusY = mu_inv_yy > 0 ? Math.pow(mu_inv_yy, -0.5) : Infinity;

  return {
    epsilon,
    mu_inv_scalar,
    mu_inv_xx,
    mu_inv_yy,
    mu_inv_1,
    mu_inv_2,
    theta_inv,
    effectiveRadiusScalar,
    effectiveRadiusX,
    effectiveRadiusY,
  };
}
