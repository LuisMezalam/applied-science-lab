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
  const theta = Ixy !== 0 ? 0.5 * Math.atan2(-2 * Ixy, Ixx - Iyy) : 0;
  
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
      return {
        I0,
        centroidX: 0,
        centroidY: 0,
        Ixx: mag * w * h * h * h / 12,
        Iyy: mag * h * w * w * w / 12,
        Ixy: 0,
        I1: mag * w * h * h * h / 12,
        I2: mag * h * w * w * w / 12,
        theta: 0,
        kx: h / Math.sqrt(12),
        ky: w / Math.sqrt(12)
      };
    }
    case 'circle': {
      const r = params.radius || 1;
      const I0 = mag * Math.PI * r * r;
      const Ixx = mag * Math.PI * r * r * r * r / 4;
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
        kx: r / 2,
        ky: r / 2
      };
    }
    case 'triangle': {
      const b = params.base || 2;
      const h = params.height || 1.5;
      const I0 = mag * 0.5 * b * h;
      // Centroid at (0, h/3) for triangle with base on x-axis and apex at (0, h)
      return {
        I0,
        centroidX: 0,
        centroidY: h / 3,
        Ixx: mag * b * h * h * h / 36,
        Iyy: mag * h * b * b * b / 48,
        Ixy: 0,
        I1: mag * b * h * h * h / 36,
        I2: mag * h * b * b * b / 48,
        theta: 0,
        kx: h / Math.sqrt(18),
        ky: b / Math.sqrt(24)
      };
    }
    default:
      return null;
  }
}
