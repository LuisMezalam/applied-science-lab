// 3D Moment Calculus for Volumetric Loading
// Implements triple integrals over 3D domains (box, sphere, cylinder)

export type Shape3D = 'box' | 'sphere' | 'cylinder';

export interface Shape3DParams {
  shape: Shape3D;
  // Box: width, height, depth
  // Sphere: radius
  // Cylinder: radius, height
  width?: number;
  height?: number;
  depth?: number;
  radius?: number;
  // Loading parameters
  magnitude: number;
  loadingType: 'uniform' | 'linear-z' | 'radial' | 'parabolic' | 'exponential';
}

export interface Moment3DResults {
  // Zeroth moment: Total mass/load
  I0: number;
  // Centroid: (x̄, ȳ, z̄)
  centroidX: number;
  centroidY: number;
  centroidZ: number;
  // Inertia tensor components (about centroid)
  Ixx: number;
  Iyy: number;
  Izz: number;
  Ixy: number;
  Ixz: number;
  Iyz: number;
  // Principal moments (eigenvalues)
  I1: number;
  I2: number;
  I3: number;
}

export interface Moment3DNegativeOrder {
  // Regularization parameter ε
  epsilon: number;
  // Scalar inverse moment: μ₋₂,ε = ∫(r² + ε²)^(-1) f(x,y,z) dV
  scalarInverseMoment: number;
  // Directional inverse moment tensor (diagonal components)
  inverseTensorXX: number;
  inverseTensorYY: number;
  inverseTensorZZ: number;
  // Off-diagonal (for anisotropic distributions)
  inverseTensorXY: number;
  inverseTensorXZ: number;
  inverseTensorYZ: number;
  // Principal inverse moments (eigenvalues)
  inversePrincipal1: number;
  inversePrincipal2: number;
  inversePrincipal3: number;
  // Effective radii from scalar inverse moment
  effectiveRadius: number;
  // Effective radii from directional components
  effectiveRadiusX: number;
  effectiveRadiusY: number;
  effectiveRadiusZ: number;
}

export interface Point3D {
  x: number;
  y: number;
  z: number;
  intensity: number;
}

/**
 * Generate sample points for a 3D shape with loading
 */
export function generate3DField(params: Shape3DParams, resolution: number = 15): Point3D[] {
  switch (params.shape) {
    case 'box':
      return generateBoxField(params, resolution);
    case 'sphere':
      return generateSphereField(params, resolution);
    case 'cylinder':
      return generateCylinderField(params, resolution);
    default:
      return [];
  }
}

function generateBoxField(params: Shape3DParams, resolution: number): Point3D[] {
  const points: Point3D[] = [];
  const w = params.width || 2;
  const h = params.height || 1;
  const d = params.depth || 1.5;
  
  const dx = w / resolution;
  const dy = h / resolution;
  const dz = d / resolution;
  
  for (let i = 0; i <= resolution; i++) {
    for (let j = 0; j <= resolution; j++) {
      for (let k = 0; k <= resolution; k++) {
        const x = -w/2 + i * dx;
        const y = -h/2 + j * dy;
        const z = -d/2 + k * dz;
        const intensity = get3DIntensity(x, y, z, params, w, h, d);
        points.push({ x, y, z, intensity });
      }
    }
  }
  return points;
}

function generateSphereField(params: Shape3DParams, resolution: number): Point3D[] {
  const points: Point3D[] = [];
  const r = params.radius || 1;
  
  // Spherical sampling
  const phiSteps = resolution;
  const thetaSteps = resolution * 2;
  const rSteps = Math.ceil(resolution / 2);
  
  for (let ri = 0; ri <= rSteps; ri++) {
    const currentR = (ri / rSteps) * r;
    if (currentR === 0) {
      points.push({ x: 0, y: 0, z: 0, intensity: get3DIntensity(0, 0, 0, params, r, r, r) });
      continue;
    }
    
    for (let pi = 0; pi <= phiSteps; pi++) {
      const phi = (pi / phiSteps) * Math.PI;
      const sinPhi = Math.sin(phi);
      
      const numTheta = Math.max(1, Math.floor(thetaSteps * sinPhi));
      for (let ti = 0; ti < numTheta; ti++) {
        const theta = (ti / numTheta) * 2 * Math.PI;
        const x = currentR * sinPhi * Math.cos(theta);
        const y = currentR * sinPhi * Math.sin(theta);
        const z = currentR * Math.cos(phi);
        const intensity = get3DIntensity(x, y, z, params, r, r, r);
        points.push({ x, y, z, intensity });
      }
    }
  }
  return points;
}

function generateCylinderField(params: Shape3DParams, resolution: number): Point3D[] {
  const points: Point3D[] = [];
  const r = params.radius || 1;
  const h = params.height || 2;
  
  const dz = h / resolution;
  const rSteps = Math.ceil(resolution / 2);
  
  for (let zi = 0; zi <= resolution; zi++) {
    const z = -h/2 + zi * dz;
    
    for (let ri = 0; ri <= rSteps; ri++) {
      const currentR = (ri / rSteps) * r;
      if (currentR === 0) {
        points.push({ x: 0, y: 0, z, intensity: get3DIntensity(0, 0, z, params, r, h, r) });
        continue;
      }
      
      const circumference = 2 * Math.PI * currentR;
      const numPoints = Math.max(8, Math.floor(circumference / (r / rSteps)));
      
      for (let ti = 0; ti < numPoints; ti++) {
        const theta = (ti / numPoints) * 2 * Math.PI;
        const x = currentR * Math.cos(theta);
        const y = currentR * Math.sin(theta);
        const intensity = get3DIntensity(x, y, z, params, r, h, r);
        points.push({ x, y, z, intensity });
      }
    }
  }
  return points;
}

function get3DIntensity(x: number, y: number, z: number, params: Shape3DParams, maxW: number, maxH: number, maxD: number): number {
  const mag = params.magnitude;
  const r = Math.sqrt(x * x + y * y);
  const rSphere = Math.sqrt(x * x + y * y + z * z);
  const maxR = Math.max(maxW, maxD) / 2;
  
  switch (params.loadingType) {
    case 'uniform':
      return mag;
    case 'linear-z':
      return mag * (0.5 + z / maxH);
    case 'radial':
      return Math.max(0, mag * (1 - r / maxR));
    case 'parabolic':
      return Math.max(0, mag * (1 - (rSphere / Math.max(maxW, maxH, maxD)) ** 2));
    case 'exponential':
      return mag * Math.exp(-2 * rSphere / Math.max(maxW, maxH, maxD));
    default:
      return mag;
  }
}

/**
 * Calculate 3D moments using numerical integration
 */
export function calculate3DMoments(points: Point3D[], shape: Shape3D, params: Shape3DParams): Moment3DResults {
  if (points.length === 0) {
    return {
      I0: 0, centroidX: 0, centroidY: 0, centroidZ: 0,
      Ixx: 0, Iyy: 0, Izz: 0, Ixy: 0, Ixz: 0, Iyz: 0,
      I1: 0, I2: 0, I3: 0
    };
  }
  
  // Estimate volume element
  let totalVolume: number;
  switch (shape) {
    case 'box':
      totalVolume = (params.width || 2) * (params.height || 1) * (params.depth || 1.5);
      break;
    case 'sphere':
      totalVolume = (4/3) * Math.PI * (params.radius || 1) ** 3;
      break;
    case 'cylinder':
      totalVolume = Math.PI * (params.radius || 1) ** 2 * (params.height || 2);
      break;
    default:
      totalVolume = 1;
  }
  
  const dV = totalVolume / points.length;
  
  // Zeroth moment
  let I0 = 0;
  let sumX = 0, sumY = 0, sumZ = 0;
  
  for (const p of points) {
    I0 += p.intensity * dV;
    sumX += p.x * p.intensity * dV;
    sumY += p.y * p.intensity * dV;
    sumZ += p.z * p.intensity * dV;
  }
  
  // Centroid
  const centroidX = I0 > 0 ? sumX / I0 : 0;
  const centroidY = I0 > 0 ? sumY / I0 : 0;
  const centroidZ = I0 > 0 ? sumZ / I0 : 0;
  
  // Inertia tensor about centroid
  let Ixx = 0, Iyy = 0, Izz = 0;
  let Ixy = 0, Ixz = 0, Iyz = 0;
  
  for (const p of points) {
    const dx = p.x - centroidX;
    const dy = p.y - centroidY;
    const dz = p.z - centroidZ;
    
    // Diagonal elements: Ixx = ∫(y² + z²)ρ dV, etc.
    Ixx += (dy * dy + dz * dz) * p.intensity * dV;
    Iyy += (dx * dx + dz * dz) * p.intensity * dV;
    Izz += (dx * dx + dy * dy) * p.intensity * dV;
    
    // Off-diagonal elements
    Ixy -= dx * dy * p.intensity * dV;
    Ixz -= dx * dz * p.intensity * dV;
    Iyz -= dy * dz * p.intensity * dV;
  }
  
  // Principal moments (eigenvalues) - simplified for symmetric tensors
  // Using characteristic polynomial for 3x3 symmetric matrix
  const trace = Ixx + Iyy + Izz;
  const q = trace / 3;
  
  const A = [
    [Ixx - q, Ixy, Ixz],
    [Ixy, Iyy - q, Iyz],
    [Ixz, Iyz, Izz - q]
  ];
  
  const p2 = A[0][0] ** 2 + A[1][1] ** 2 + A[2][2] ** 2 + 
             2 * (A[0][1] ** 2 + A[0][2] ** 2 + A[1][2] ** 2);
  const p = Math.sqrt(p2 / 6);
  
  let I1: number, I2: number, I3: number;
  
  if (p < 1e-10) {
    // Already diagonal
    I1 = Ixx;
    I2 = Iyy;
    I3 = Izz;
  } else {
    const B = A.map(row => row.map(val => val / p));
    const detB = B[0][0] * (B[1][1] * B[2][2] - B[1][2] * B[2][1]) -
                 B[0][1] * (B[1][0] * B[2][2] - B[1][2] * B[2][0]) +
                 B[0][2] * (B[1][0] * B[2][1] - B[1][1] * B[2][0]);
    
    const r = detB / 2;
    const phi = Math.abs(r) >= 1 ? (r >= 0 ? 0 : Math.PI / 3) : Math.acos(r) / 3;
    
    I1 = q + 2 * p * Math.cos(phi);
    I3 = q + 2 * p * Math.cos(phi + 2 * Math.PI / 3);
    I2 = 3 * q - I1 - I3;
  }
  
  // Sort principal moments
  [I1, I2, I3] = [I1, I2, I3].sort((a, b) => b - a);
  
  return {
    I0, centroidX, centroidY, centroidZ,
    Ixx, Iyy, Izz, Ixy, Ixz, Iyz,
    I1, I2, I3
  };
}

/**
 * Calculate 3D negative-order moments with ε-regularization
 * Computes the 3x3 inverse moment tensor about the centroid
 */
export function calculate3DNegativeOrderMoments(
  points: Point3D[],
  shape: Shape3D,
  params: Shape3DParams,
  epsilon: number,
  centroid: { x: number; y: number; z: number }
): Moment3DNegativeOrder {
  if (points.length === 0) {
    return {
      epsilon,
      scalarInverseMoment: 0,
      inverseTensorXX: 0, inverseTensorYY: 0, inverseTensorZZ: 0,
      inverseTensorXY: 0, inverseTensorXZ: 0, inverseTensorYZ: 0,
      inversePrincipal1: 0, inversePrincipal2: 0, inversePrincipal3: 0,
      effectiveRadius: 0,
      effectiveRadiusX: 0, effectiveRadiusY: 0, effectiveRadiusZ: 0
    };
  }
  
  // Estimate volume element
  let totalVolume: number;
  switch (shape) {
    case 'box':
      totalVolume = (params.width || 2) * (params.height || 1) * (params.depth || 1.5);
      break;
    case 'sphere':
      totalVolume = (4/3) * Math.PI * (params.radius || 1) ** 3;
      break;
    case 'cylinder':
      totalVolume = Math.PI * (params.radius || 1) ** 2 * (params.height || 2);
      break;
    default:
      totalVolume = 1;
  }
  
  const dV = totalVolume / points.length;
  const eps2 = epsilon * epsilon;
  
  // Compute total intensity for normalization
  let totalIntensity = 0;
  for (const p of points) {
    totalIntensity += p.intensity * dV;
  }
  
  if (totalIntensity === 0) {
    return {
      epsilon,
      scalarInverseMoment: 0,
      inverseTensorXX: 0, inverseTensorYY: 0, inverseTensorZZ: 0,
      inverseTensorXY: 0, inverseTensorXZ: 0, inverseTensorYZ: 0,
      inversePrincipal1: 0, inversePrincipal2: 0, inversePrincipal3: 0,
      effectiveRadius: 0,
      effectiveRadiusX: 0, effectiveRadiusY: 0, effectiveRadiusZ: 0
    };
  }
  
  // Normalize intensity for probability density
  const normFactor = 1 / totalIntensity;
  
  // Compute scalar and tensor inverse moments
  let scalarInverse = 0;
  let Mxx = 0, Myy = 0, Mzz = 0;
  let Mxy = 0, Mxz = 0, Myz = 0;
  
  for (const p of points) {
    const dx = p.x - centroid.x;
    const dy = p.y - centroid.y;
    const dz = p.z - centroid.z;
    const r2 = dx * dx + dy * dy + dz * dz;
    
    const f = p.intensity * dV * normFactor;
    
    // Scalar inverse moment: μ₋₂,ε = ∫(r² + ε²)^(-1) f dV
    scalarInverse += f / (r2 + eps2);
    
    // Directional inverse tensor components
    // Using regularized forms: Mxx = ∫(dx² + ε²)^(-1) f dV, etc.
    Mxx += f / (dx * dx + eps2);
    Myy += f / (dy * dy + eps2);
    Mzz += f / (dz * dz + eps2);
    
    // Off-diagonal: weighted by sign and regularized
    const rxy2 = dx * dx + dy * dy + eps2;
    const rxz2 = dx * dx + dz * dz + eps2;
    const ryz2 = dy * dy + dz * dz + eps2;
    
    Mxy += f * dx * dy / (rxy2 * Math.sqrt(rxy2));
    Mxz += f * dx * dz / (rxz2 * Math.sqrt(rxz2));
    Myz += f * dy * dz / (ryz2 * Math.sqrt(ryz2));
  }
  
  // Compute principal inverse moments (eigenvalues of symmetric tensor)
  // Construct the tensor matrix
  const trace = Mxx + Myy + Mzz;
  const q = trace / 3;
  
  const A = [
    [Mxx - q, Mxy, Mxz],
    [Mxy, Myy - q, Myz],
    [Mxz, Myz, Mzz - q]
  ];
  
  const p2 = A[0][0] ** 2 + A[1][1] ** 2 + A[2][2] ** 2 + 
             2 * (A[0][1] ** 2 + A[0][2] ** 2 + A[1][2] ** 2);
  const p = Math.sqrt(p2 / 6);
  
  let inv1: number, inv2: number, inv3: number;
  
  if (p < 1e-10) {
    inv1 = Mxx;
    inv2 = Myy;
    inv3 = Mzz;
  } else {
    const B = A.map(row => row.map(val => val / p));
    const detB = B[0][0] * (B[1][1] * B[2][2] - B[1][2] * B[2][1]) -
                 B[0][1] * (B[1][0] * B[2][2] - B[1][2] * B[2][0]) +
                 B[0][2] * (B[1][0] * B[2][1] - B[1][1] * B[2][0]);
    
    const r = detB / 2;
    const phi = Math.abs(r) >= 1 ? (r >= 0 ? 0 : Math.PI / 3) : Math.acos(r) / 3;
    
    inv1 = q + 2 * p * Math.cos(phi);
    inv3 = q + 2 * p * Math.cos(phi + 2 * Math.PI / 3);
    inv2 = 3 * q - inv1 - inv3;
  }
  
  // Sort principal moments (descending)
  [inv1, inv2, inv3] = [inv1, inv2, inv3].sort((a, b) => b - a);
  
  // Compute effective radii
  const effectiveRadius = scalarInverse > 0 ? Math.sqrt(1 / scalarInverse) : 0;
  const effectiveRadiusX = Mxx > 0 ? Math.sqrt(1 / Mxx) : 0;
  const effectiveRadiusY = Myy > 0 ? Math.sqrt(1 / Myy) : 0;
  const effectiveRadiusZ = Mzz > 0 ? Math.sqrt(1 / Mzz) : 0;
  
  return {
    epsilon,
    scalarInverseMoment: scalarInverse,
    inverseTensorXX: Mxx,
    inverseTensorYY: Myy,
    inverseTensorZZ: Mzz,
    inverseTensorXY: Mxy,
    inverseTensorXZ: Mxz,
    inverseTensorYZ: Myz,
    inversePrincipal1: inv1,
    inversePrincipal2: inv2,
    inversePrincipal3: inv3,
    effectiveRadius,
    effectiveRadiusX,
    effectiveRadiusY,
    effectiveRadiusZ
  };
}
