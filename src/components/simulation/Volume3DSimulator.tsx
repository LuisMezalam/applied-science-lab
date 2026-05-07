import { useEffect, useRef, useState, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, PerspectiveCamera } from '@react-three/drei';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Box, Cylinder, AlertTriangle, Info, Building2, Flame, Droplets, Activity, Zap, Rocket } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import * as THREE from 'three';
import {
  Shape3D,
  Shape3DParams,
  generate3DField,
  calculate3DMoments,
  calculate3DNegativeOrderMoments,
  Point3D,
  Moment3DNegativeOrder,
} from '@/lib/physics/moment3D';
import { InverseMomentComparison } from './InverseMomentComparison';
import { formatValue } from '@/lib/physics/momentCalculus';
import { EquationRenderer } from '@/components/knowledge/EquationRenderer';
import { DomainType } from '@/types/physics';
import {
  readBooleanParam,
  readEnumParam,
  readNumberParam,
  writeQueryParams,
} from '@/lib/urlState';

// ─── Domain-specific mapping for 3D volumes ─────────────────────────
// Matches dictionary entries: M-004 (volumetric heat source) and M-017 (body force)
interface Domain3DMapping {
  label: string;
  icon: typeof Building2;
  colorClass: string;
  badgeColor: string;
  dictRef: string;
  intensityName: string;
  intensitySymbol: string;       // plain-text fallback
  intensitySymbolTex: string;    // KaTeX
  intensityUnit: string;
  resultantName: string;
  resultantUnit: string;
  centroidName: string;
  secondMomentName: string;
  secondMomentUnit: string;
  effectiveRadiusInterpretation: string;
  interpretation: string;
}

const domain3DMappings: Record<DomainType, Domain3DMapping> = {
  structures: {
    label: 'Structures',
    icon: Building2,
    colorClass: 'text-structures',
    badgeColor: 'bg-structures/10 text-structures border-structures/30',
    dictRef: 'M-017',
    intensityName: 'Body Force Density',
    intensitySymbol: 'b(x,y,z)',
    intensitySymbolTex: '\\mathbf{b}(x,y,z)',
    intensityUnit: 'kN/m³',
    resultantName: 'Total Body Force',
    resultantUnit: 'kN',
    centroidName: 'Center of Force',
    secondMomentName: 'Second Moment of Force',
    secondMomentUnit: 'kN·m²',
    effectiveRadiusInterpretation: 'Localization radius of body-force concentration',
    interpretation: 'Volumetric body force density b(x,y,z) — gravity, inertia, or distributed load on a 3D solid. The resultant is the total force, the centroid is its line of action.',
  },
  heat: {
    label: 'Heat Transfer',
    icon: Flame,
    colorClass: 'text-heat',
    badgeColor: 'bg-heat/10 text-heat border-heat/30',
    dictRef: 'M-004',
    intensityName: 'Volumetric Heat Source',
    intensitySymbol: "q'''(x,y,z)",
    intensitySymbolTex: "q'''(x,y,z)",
    intensityUnit: 'W/m³',
    resultantName: 'Total Heat Generation',
    resultantUnit: 'W',
    centroidName: 'Thermal Center',
    secondMomentName: 'Second Moment of Heat',
    secondMomentUnit: 'W·m²',
    effectiveRadiusInterpretation: 'Effective radius of internal hot-spot',
    interpretation: 'Volumetric heat generation q‴(x,y,z) — Joule heating, nuclear sources, or chemical reactions. Resultant is total heat rate, inverse moments quantify hot-spot localization.',
  },
  fluids: {
    label: 'Fluids',
    icon: Droplets,
    colorClass: 'text-fluids',
    badgeColor: 'bg-fluids/10 text-fluids border-fluids/30',
    dictRef: 'M-017',
    intensityName: 'Buoyancy Force Density',
    intensitySymbol: 'f_b(x,y,z)',
    intensitySymbolTex: '\\mathbf{f}_b(x,y,z)',
    intensityUnit: 'kN/m³',
    resultantName: 'Net Buoyancy',
    resultantUnit: 'kN',
    centroidName: 'Center of Buoyancy',
    secondMomentName: 'Second Moment of Buoyancy',
    secondMomentUnit: 'kN·m²',
    effectiveRadiusInterpretation: 'Effective radius of buoyancy distribution',
    interpretation: 'Volumetric buoyancy force in a submerged body. The centroid locates the center of buoyancy, critical for ship and submarine stability.',
  },
  dynamics: {
    label: 'Dynamics',
    icon: Activity,
    colorClass: 'text-dynamics',
    badgeColor: 'bg-dynamics/10 text-dynamics border-dynamics/30',
    dictRef: 'M-014',
    intensityName: 'Mass Density',
    intensitySymbol: 'ρ(x,y,z)',
    intensitySymbolTex: '\\rho(x,y,z)',
    intensityUnit: 'kg/m³',
    resultantName: 'Total Mass',
    resultantUnit: 'kg',
    centroidName: 'Center of Mass',
    secondMomentName: 'Mass Moment of Inertia',
    secondMomentUnit: 'kg·m²',
    effectiveRadiusInterpretation: 'Radius of gyration for rotational inertia',
    interpretation: 'Volumetric mass density ρ(x,y,z) of a 3D solid. Second moments give the full inertia tensor — essential for rigid-body rotational dynamics.',
  },
  circuits: {
    label: 'Circuits',
    icon: Zap,
    colorClass: 'text-circuits',
    badgeColor: 'bg-circuits/10 text-circuits border-circuits/30',
    dictRef: 'M-016',
    intensityName: 'Current Density',
    intensitySymbol: 'J(x,y,z)',
    intensitySymbolTex: '\\mathbf{J}(x,y,z)',
    intensityUnit: 'A/m³',
    resultantName: 'Total Current Source',
    resultantUnit: 'A',
    centroidName: 'Current Center',
    secondMomentName: 'Second Moment of Current',
    secondMomentUnit: 'A·m²',
    effectiveRadiusInterpretation: 'Effective radius of volumetric current concentration',
    interpretation: 'Volumetric current density in a 3D conductor. Inverse moments quantify current crowding analogous to skin/proximity effects.',
  },
  propulsion: {
    label: 'Propulsion',
    icon: Rocket,
    colorClass: 'text-propulsion',
    badgeColor: 'bg-propulsion/10 text-propulsion border-propulsion/30',
    dictRef: 'M-018',
    intensityName: 'Thrust Density',
    intensitySymbol: 'f_T(x,y,z)',
    intensitySymbolTex: '\\mathbf{f}_T(x,y,z)',
    intensityUnit: 'kN/m³',
    resultantName: 'Total Thrust',
    resultantUnit: 'kN',
    centroidName: 'Thrust Center',
    secondMomentName: 'Second Moment of Thrust',
    secondMomentUnit: 'kN·m²',
    effectiveRadiusInterpretation: 'Effective radius of thrust localization',
    interpretation: 'Volumetric thrust density across a combustion chamber or nozzle. Anisotropy in principal moments indicates thrust-vectoring asymmetry.',
  },
};

const shapeOptions: { value: Shape3D; label: string; icon: React.ReactNode }[] = [
  { value: 'box', label: 'Box', icon: <Box className="h-4 w-4" /> },
  { value: 'sphere', label: 'Sphere', icon: <div className="h-4 w-4 rounded-full border-2" /> },
  { value: 'cylinder', label: 'Cylinder', icon: <Cylinder className="h-4 w-4" /> },
];

const loadingOptions = [
  { value: 'uniform', label: 'Uniform' },
  { value: 'linear-z', label: 'Linear (Z)' },
  { value: 'radial', label: 'Radial' },
  { value: 'parabolic', label: 'Parabolic' },
  { value: 'exponential', label: 'Exponential' },
];

type ColorMap = 'thermal' | 'viridis' | 'grayscale';

const colorMapOptions: Array<{ value: ColorMap; label: string }> = [
  { value: 'thermal', label: 'Thermal' },
  { value: 'viridis', label: 'Viridis' },
  { value: 'grayscale', label: 'Grayscale' },
];

const DOMAIN_VALUES: readonly DomainType[] = [
  'structures',
  'heat',
  'fluids',
  'dynamics',
  'circuits',
  'propulsion',
];
const SHAPE_VALUES: readonly Shape3D[] = ['box', 'sphere', 'cylinder'];
const LOADING_VALUES: readonly Shape3DParams['loadingType'][] = [
  'uniform',
  'linear-z',
  'radial',
  'parabolic',
  'exponential',
];
const COLOR_MAP_VALUES: readonly ColorMap[] = ['thermal', 'viridis', 'grayscale'];

function getInitial3DParams(): Shape3DParams {
  return {
    shape: readEnumParam('shape3d', SHAPE_VALUES, 'box'),
    width: readNumberParam('width3d', 2),
    height: readNumberParam('height3d', 1.5),
    depth: readNumberParam('depth3d', 1),
    radius: readNumberParam('radius3d', 1),
    magnitude: readNumberParam('magnitude3d', 10),
    loadingType: readEnumParam('loading3d', LOADING_VALUES, 'uniform'),
  };
}

function applyColorMap(color: THREE.Color, t: number, colorMap: ColorMap) {
  const clamped = Math.max(0, Math.min(1, t));

  switch (colorMap) {
    case 'viridis':
      color.setHSL(0.76 - 0.58 * clamped, 0.82, 0.34 + 0.16 * clamped);
      break;
    case 'grayscale':
      color.setHSL(0.58, 0.04, 0.24 + 0.52 * clamped);
      break;
    default:
      color.setHSL(0.58 - 0.46 * clamped, 0.9, 0.48 + 0.12 * clamped);
      break;
  }
}

function VolumetricPoints({
  points,
  maxIntensity,
  colorMap,
}: {
  points: Point3D[];
  maxIntensity: number;
  colorMap: ColorMap;
}) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Update instance matrices and colors
  useEffect(() => {
    if (!meshRef.current) return;
    
    const color = new THREE.Color();
    
    points.forEach((p, i) => {
      dummy.position.set(p.x, p.z, p.y); // Swap y/z for three.js convention
      const t = p.intensity / maxIntensity;
      const scale = 0.035 + 0.075 * Math.sqrt(Math.max(0, t));
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
      
      applyColorMap(color, t, colorMap);
      meshRef.current!.setColorAt(i, color);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [points, maxIntensity, dummy, colorMap]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, points.length]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial vertexColors roughness={0.38} metalness={0.08} emissive="#0ea5e9" emissiveIntensity={0.08} />
    </instancedMesh>
  );
}

function CentroidMarker({ x, y, z, animated }: { x: number; y: number; z: number; animated: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (animated && groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.5;
    }
  });

  return (
    <group ref={groupRef} position={[x, z, y]}>
      {/* Crosshair */}
      <mesh>
        <boxGeometry args={[0.3, 0.02, 0.02]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.5} />
      </mesh>
      <mesh>
        <boxGeometry args={[0.02, 0.3, 0.02]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.5} />
      </mesh>
      <mesh>
        <boxGeometry args={[0.02, 0.02, 0.3]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.5} />
      </mesh>
      {/* Sphere at center */}
      <mesh>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

function AxesHelper() {
  return (
    <group>
      {/* X axis - red */}
      <mesh position={[1, 0, 0]}>
        <boxGeometry args={[2, 0.02, 0.02]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      <Text position={[2.2, 0, 0]} fontSize={0.15} color="#ef4444">X</Text>
      
      {/* Y axis - green (vertical in three.js) */}
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[0.02, 2, 0.02]} />
        <meshBasicMaterial color="#22c55e" />
      </mesh>
      <Text position={[0, 2.2, 0]} fontSize={0.15} color="#22c55e">Z</Text>
      
      {/* Z axis - blue */}
      <mesh position={[0, 0, 1]}>
        <boxGeometry args={[0.02, 0.02, 2]} />
        <meshBasicMaterial color="#3b82f6" />
      </mesh>
      <Text position={[0, 0, 2.2]} fontSize={0.15} color="#3b82f6">Y</Text>
    </group>
  );
}

function EffectiveRadiusEllipsoid({ 
  centroid, 
  radii,
  visible,
  animated,
}: { 
  centroid: { x: number; y: number; z: number };
  radii: { x: number; y: number; z: number };
  visible: boolean;
  animated: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (animated && meshRef.current) {
      // Subtle pulsing effect
      const scale = 1 + 0.02 * Math.sin(state.clock.elapsedTime * 2);
      meshRef.current.scale.set(
        radii.x * scale,
        radii.z * scale, // Swap y/z for three.js
        radii.y * scale
      );
    }
  });
  
  if (!visible || radii.x === 0 || radii.y === 0 || radii.z === 0) return null;
  
  return (
    <mesh 
      ref={meshRef} 
      position={[centroid.x, centroid.z, centroid.y]}
    >
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial 
        color="#00e5ff" 
        transparent 
        opacity={0.15} 
        wireframe={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function EffectiveRadiusWireframe({ 
  centroid, 
  radii,
  visible 
}: { 
  centroid: { x: number; y: number; z: number };
  radii: { x: number; y: number; z: number };
  visible: boolean;
}) {
  if (!visible || radii.x === 0 || radii.y === 0 || radii.z === 0) return null;
  
  return (
    <mesh position={[centroid.x, centroid.z, centroid.y]} scale={[radii.x, radii.z, radii.y]}>
      <sphereGeometry args={[1, 16, 12]} />
      <meshBasicMaterial 
        color="#00e5ff" 
        wireframe 
        transparent 
        opacity={0.6}
      />
    </mesh>
  );
}

function ShapeFrame({ params }: { params: Shape3DParams }) {
  const material = (
    <meshBasicMaterial
      color="#60a5fa"
      wireframe
      transparent
      opacity={0.28}
      depthWrite={false}
    />
  );

  if (params.shape === 'sphere') {
    const radius = params.radius || 1;
    return (
      <mesh>
        <sphereGeometry args={[radius, 40, 20]} />
        {material}
      </mesh>
    );
  }

  if (params.shape === 'cylinder') {
    const radius = params.radius || 1;
    const height = params.height || 2;
    return (
      <mesh>
        <cylinderGeometry args={[radius, radius, height, 48, 8, true]} />
        {material}
      </mesh>
    );
  }

  return (
    <mesh>
      <boxGeometry args={[params.width || 2, params.depth || 1, params.height || 1.5]} />
      {material}
    </mesh>
  );
}

function SlicePlane({
  params,
  sliceZ,
  visible,
}: {
  params: Shape3DParams;
  sliceZ: number;
  visible: boolean;
}) {
  if (!visible) return null;

  const planeSize =
    params.shape === 'sphere'
      ? (params.radius || 1) * 2.25
      : Math.max(params.width || 2, params.depth || params.radius || 1) * 1.15;

  return (
    <mesh position={[0, sliceZ, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[planeSize, planeSize]} />
      <meshBasicMaterial color="#facc15" transparent opacity={0.16} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}

function Scene({ 
  points, 
  moments, 
  maxIntensity,
  negativeOrderMoments,
  showEllipsoid,
  params,
  colorMap,
  sliceZ,
  sliceActive,
}: { 
  points: Point3D[]; 
  moments: ReturnType<typeof calculate3DMoments>;
  maxIntensity: number;
  negativeOrderMoments: Moment3DNegativeOrder | null;
  showEllipsoid: boolean;
  params: Shape3DParams;
  colorMap: ColorMap;
  sliceZ: number;
  sliceActive: boolean;
}) {
  const effectiveRadii = negativeOrderMoments ? {
    x: negativeOrderMoments.effectiveRadiusX,
    y: negativeOrderMoments.effectiveRadiusY,
    z: negativeOrderMoments.effectiveRadiusZ
  } : { x: 0, y: 0, z: 0 };
  
  const centroid = {
    x: moments.centroidX,
    y: moments.centroidY,
    z: moments.centroidZ
  };
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animated = !prefersReducedMotion;
  
  return (
    <>
      <color attach="background" args={['#040714']} />
      <fog attach="fog" args={['#040714', 5.5, 10]} />
      <PerspectiveCamera makeDefault position={[4.4, 3.4, 4.4]} fov={46} />
      <OrbitControls enableDamping dampingFactor={0.05} enablePan={false} minDistance={2.4} maxDistance={8} />
      
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1.1} />
      <directionalLight position={[-5, 3, -5]} intensity={0.45} />
      <pointLight position={[0, 2.8, 2.5]} intensity={0.75} color="#38bdf8" />
      
      <ShapeFrame params={params} />
      <SlicePlane params={params} sliceZ={sliceZ} visible={sliceActive} />
      <AxesHelper />
      <VolumetricPoints points={points} maxIntensity={maxIntensity} colorMap={colorMap} />
      <CentroidMarker x={moments.centroidX} y={moments.centroidY} z={moments.centroidZ} animated={animated} />
      
      {/* Effective radius ellipsoid visualization */}
      <EffectiveRadiusEllipsoid centroid={centroid} radii={effectiveRadii} visible={showEllipsoid} animated={animated} />
      <EffectiveRadiusWireframe centroid={centroid} radii={effectiveRadii} visible={showEllipsoid} />
      
      {/* Ground grid */}
      <gridHelper args={[6, 18, '#1d4ed8', '#1f2937']} position={[0, -1.55, 0]} />
    </>
  );
}

export function Volume3DSimulator() {
  const [params, setParams] = useState<Shape3DParams>(() => getInitial3DParams());
  
  const [epsilonPercent, setEpsilonPercent] = useState(() => readNumberParam('eps3d', 5));
  const [showEllipsoid, setShowEllipsoid] = useState(() => readBooleanParam('ellipsoid3d', true));
  const [showNegativeMoments, setShowNegativeMoments] = useState(() => readBooleanParam('neg3d', true));
  const [activeDomain, setActiveDomain] = useState<DomainType>(() => readEnumParam('domain3d', DOMAIN_VALUES, 'structures'));
  const [sampleResolution, setSampleResolution] = useState(() => readNumberParam('density3d', 12));
  const [slicePercent, setSlicePercent] = useState(() => readNumberParam('slice3d', 100));
  const [colorMap, setColorMap] = useState<ColorMap>(() => readEnumParam('color3d', COLOR_MAP_VALUES, 'thermal'));
  const dm = domain3DMappings[activeDomain];
  const DomainIcon = dm.icon;

  // Get characteristic length for ε scaling
  const characteristicLength = useMemo(() => {
    switch (params.shape) {
      case 'box':
        return Math.max(params.width || 2, params.height || 1.5, params.depth || 1);
      case 'sphere':
        return (params.radius || 1) * 2;
      case 'cylinder':
        return Math.max((params.radius || 1) * 2, params.height || 2);
      default:
        return 2;
    }
  }, [params.shape, params.width, params.height, params.depth, params.radius]);
  
  const epsilon = (epsilonPercent / 100) * characteristicLength;

  const { points, moments, maxIntensity, negativeOrderMoments } = useMemo(() => {
    const pts = generate3DField(params, sampleResolution);
    const mom = calculate3DMoments(pts, params.shape, params);
    const maxI = Math.max(...pts.map(p => p.intensity), 0.001);
    
    const negMom = showNegativeMoments ? calculate3DNegativeOrderMoments(
      pts,
      params.shape,
      params,
      epsilon,
      { x: mom.centroidX, y: mom.centroidY, z: mom.centroidZ }
    ) : null;
    
    return { points: pts, moments: mom, maxIntensity: maxI, negativeOrderMoments: negMom };
  }, [params, epsilon, showNegativeMoments, sampleResolution]);

  const { displayedPoints, sliceZ, sliceActive } = useMemo(() => {
    if (points.length === 0) {
      return { displayedPoints: points, sliceZ: 0, sliceActive: false };
    }

    const zValues = points.map(point => point.z);
    const minZ = Math.min(...zValues);
    const maxZ = Math.max(...zValues);
    const boundedPercent = Math.max(0, Math.min(100, slicePercent));
    const nextSliceZ = minZ + (boundedPercent / 100) * (maxZ - minZ);
    const clipped = points.filter(point => point.z <= nextSliceZ + 1e-9);

    return {
      displayedPoints: clipped.length > 0 ? clipped : points.slice(0, 1),
      sliceZ: nextSliceZ,
      sliceActive: boundedPercent < 99.5,
    };
  }, [points, slicePercent]);

  useEffect(() => {
    writeQueryParams({
      domain3d: activeDomain,
      shape3d: params.shape,
      loading3d: params.loadingType,
      magnitude3d: params.magnitude,
      width3d: params.width,
      height3d: params.height,
      depth3d: params.depth,
      radius3d: params.radius,
      eps3d: epsilonPercent,
      ellipsoid3d: showEllipsoid,
      neg3d: showNegativeMoments,
      density3d: sampleResolution,
      slice3d: slicePercent,
      color3d: colorMap,
    });
  }, [activeDomain, params, epsilonPercent, showEllipsoid, showNegativeMoments, sampleResolution, slicePercent, colorMap]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <DomainIcon className={`h-5 w-5 ${dm.colorClass}`} />
            3D Volume — {dm.intensityName}
          </h2>
          <p className="text-sm text-muted-foreground">
            <EquationRenderer
              equation={`$${dm.intensitySymbolTex}$ over $V$ → $\\iiint_V ${dm.intensitySymbolTex}\\, dV$`}
            />
            {' '}· Dict ref: {dm.dictRef}
          </p>
        </div>
        <Badge variant="outline" className={dm.badgeColor}>
          {dm.label}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <VolumeStat label={`${dm.resultantName} I0`} value={formatValue(moments.I0)} unit={dm.resultantUnit} tone="primary" />
        <VolumeStat label="Centroid xbar" value={formatValue(moments.centroidX)} unit="m" tone="accent" />
        <VolumeStat label="Centroid ybar" value={formatValue(moments.centroidY)} unit="m" tone="accent" />
        <VolumeStat
          label="r_eff"
          value={negativeOrderMoments ? formatValue(negativeOrderMoments.effectiveRadius) : 'off'}
          unit={negativeOrderMoments ? 'm' : ''}
          tone="warning"
        />
      </div>

      {/* Domain Selector */}
      <Card className="border-border/50 bg-card/70 backdrop-blur">
        <CardContent className="pt-4 pb-3">
          <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-2 block">
            Engineering Domain
          </Label>
          <Tabs value={activeDomain} onValueChange={(v) => setActiveDomain(v as DomainType)}>
            <TabsList className="grid grid-cols-3 md:grid-cols-6 gap-1 h-auto p-1 w-full">
              {(Object.keys(domain3DMappings) as DomainType[]).map((domain) => {
                const m = domain3DMappings[domain];
                const Icon = m.icon;
                return (
                  <TabsTrigger
                    key={domain}
                    value={domain}
                    className="flex flex-col items-center gap-1 py-2 px-1 h-auto text-xs"
                  >
                    <Icon className={`h-4 w-4 ${m.colorClass}`} />
                    <span>{m.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </Tabs>
          <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
            {dm.interpretation}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
        {/* Controls */}
        <Card className="border-border/50 bg-card/75 backdrop-blur">
          <CardHeader className="border-b border-border/30 pb-3">
            <CardTitle className="text-base">Volume & Loading</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            {/* Shape Selection */}
            <div className="space-y-2">
              <Label>Shape</Label>
              <Tabs
                value={params.shape}
                onValueChange={(v) => setParams(p => ({ ...p, shape: v as Shape3D }))}
              >
                <TabsList className="w-full">
                  {shapeOptions.map(opt => (
                    <TabsTrigger key={opt.value} value={opt.value} className="flex-1 gap-2">
                      {opt.icon}
                      {opt.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {/* Shape Dimensions */}
            {params.shape === 'box' && (
              <>
                <div className="space-y-2">
                  <Label>Width (X): {params.width?.toFixed(1)} m</Label>
                  <Slider
                    value={[params.width || 2]}
                    onValueChange={([v]) => setParams(p => ({ ...p, width: v }))}
                    min={0.5}
                    max={3}
                    step={0.1}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Height (Z): {params.height?.toFixed(1)} m</Label>
                  <Slider
                    value={[params.height || 1.5]}
                    onValueChange={([v]) => setParams(p => ({ ...p, height: v }))}
                    min={0.5}
                    max={3}
                    step={0.1}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Depth (Y): {params.depth?.toFixed(1)} m</Label>
                  <Slider
                    value={[params.depth || 1]}
                    onValueChange={([v]) => setParams(p => ({ ...p, depth: v }))}
                    min={0.5}
                    max={3}
                    step={0.1}
                  />
                </div>
              </>
            )}

            {params.shape === 'sphere' && (
              <div className="space-y-2">
                <Label>Radius: {params.radius?.toFixed(1)} m</Label>
                <Slider
                  value={[params.radius || 1]}
                  onValueChange={([v]) => setParams(p => ({ ...p, radius: v }))}
                  min={0.3}
                  max={1.5}
                  step={0.1}
                />
              </div>
            )}

            {params.shape === 'cylinder' && (
              <>
                <div className="space-y-2">
                  <Label>Radius: {params.radius?.toFixed(1)} m</Label>
                  <Slider
                    value={[params.radius || 1]}
                    onValueChange={([v]) => setParams(p => ({ ...p, radius: v }))}
                    min={0.3}
                    max={1.5}
                    step={0.1}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Height: {params.height?.toFixed(1)} m</Label>
                  <Slider
                    value={[params.height || 2]}
                    onValueChange={([v]) => setParams(p => ({ ...p, height: v }))}
                    min={0.5}
                    max={3}
                    step={0.1}
                  />
                </div>
              </>
            )}

            {/* Loading Type */}
            <div className="space-y-2">
              <Label>Loading Distribution</Label>
              <Select
                value={params.loadingType}
                onValueChange={(v) => setParams(p => ({ ...p, loadingType: v as Shape3DParams['loadingType'] }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {loadingOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Magnitude */}
            <div className="space-y-2">
              <Label>Magnitude: {params.magnitude.toFixed(1)} kN/m³</Label>
              <Slider
                value={[params.magnitude]}
                onValueChange={([v]) => setParams(p => ({ ...p, magnitude: v }))}
                min={1}
                max={50}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label>Point Density: {sampleResolution}</Label>
              <Slider
                value={[sampleResolution]}
                onValueChange={([v]) => setSampleResolution(v)}
                min={8}
                max={16}
                step={1}
              />
            </div>

            <div className="space-y-2">
              <Label>Visible Z Slice: {slicePercent.toFixed(0)}%</Label>
              <Slider
                value={[slicePercent]}
                onValueChange={([v]) => setSlicePercent(v)}
                min={5}
                max={100}
                step={5}
              />
            </div>

            <div className="space-y-2">
              <Label>Color Map</Label>
              <Select value={colorMap} onValueChange={(value) => setColorMap(value as ColorMap)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colorMapOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Toggle for Negative-Order Moments */}
            <div className="flex items-center justify-between pt-2 border-t border-border/30">
              <Label className="text-sm">Negative-Order Moments (ε-Regularized)</Label>
              <Switch 
                checked={showNegativeMoments} 
                onCheckedChange={setShowNegativeMoments}
              />
            </div>
          </CardContent>
        </Card>

        {/* 3D Visualization */}
        <Card className="overflow-hidden border-border/50 bg-card/80 backdrop-blur">
          <CardHeader className="border-b border-border/30 pb-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-base">Volumetric Distribution</CardTitle>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className={dm.badgeColor}>{params.shape}</Badge>
                <Badge variant="outline" className="border-border/40 bg-background/40 text-muted-foreground">
                  {displayedPoints.length.toLocaleString()} / {points.length.toLocaleString()} samples
                </Badge>
                <Badge variant="outline" className="border-border/40 bg-background/40 text-muted-foreground">
                  {colorMap}
                </Badge>
              </div>
            </div>
          </CardHeader>
            <CardContent className="pt-4">
            <div
              className="relative h-[460px] overflow-hidden rounded-lg border border-border/35 bg-background/70 shadow-inner"
              role="region"
              aria-label={`${dm.label} 3D ${dm.intensityName} volumetric visualization`}
            >
              <p className="sr-only">
                {`3D ${dm.intensityName} field. Resultant ${formatValue(moments.I0)} ${dm.resultantUnit}; centroid (${formatValue(moments.centroidX)}, ${formatValue(moments.centroidY)}, ${formatValue(moments.centroidZ)}) meters; ${displayedPoints.length} of ${points.length} samples visible.`}
              </p>
              <div className="pointer-events-none absolute left-3 top-3 z-10 rounded-md border border-border/40 bg-background/55 px-2 py-1 text-[11px] text-muted-foreground backdrop-blur">
                Orbit drag / Scroll zoom
              </div>
              <Canvas
                role="img"
                aria-label={`${dm.label} 3D ${dm.intensityName} point cloud and centroid`}
              >
                <Scene 
                  points={displayedPoints} 
                  moments={moments} 
                  maxIntensity={maxIntensity}
                  negativeOrderMoments={negativeOrderMoments}
                  showEllipsoid={showEllipsoid}
                  params={params}
                  colorMap={colorMap}
                  sliceZ={sliceZ}
                  sliceActive={sliceActive}
                />
              </Canvas>
            </div>
            <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-green-500" />
                  Centroid
                </span>
                {showEllipsoid && showNegativeMoments && (
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-cyan-400/60" />
                    r_eff ellipsoid
                  </span>
                )}
                {sliceActive && (
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-sm bg-yellow-400/50" />
                    slice plane
                  </span>
                )}
              </div>
              <span>Drag to rotate / Scroll to zoom</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Negative-Order Moments Section */}
      {showNegativeMoments && negativeOrderMoments && (
        <Card className="border-warning/30 bg-warning/5 backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-warning" />
              3D Inverse Moment Tensor (ε-Regularized)
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-xs">
                    The 3x3 inverse moment tensor measures volumetric load concentration.
                    Higher inverse moments and smaller effective radii indicate more localized distributions.
                  </p>
                </TooltipContent>
              </Tooltip>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Epsilon Control */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  ε (regularization scale): {epsilonPercent}% of L
                  {epsilonPercent < 2 && (
                    <span className="flex items-center gap-1 text-warning text-xs">
                      <AlertTriangle className="h-3 w-3" />
                      Small ε amplifies singularity effects
                    </span>
                  )}
                </Label>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Show Ellipsoid</Label>
                  <Switch checked={showEllipsoid} onCheckedChange={setShowEllipsoid} />
                </div>
              </div>
              <Slider
                value={[epsilonPercent]}
                onValueChange={([v]) => setEpsilonPercent(v)}
                min={0.5}
                max={20}
                step={0.5}
                className="w-full"
              />
              <div className="text-xs text-muted-foreground">
                ε = {formatValue(epsilon)} m (resolution scale)
              </div>
            </div>

            {/* Scalar Inverse Moment */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MomentCard3D
                label="μ₋₂,ε (scalar)"
                value={negativeOrderMoments.scalarInverseMoment}
                unit="m⁻²"
                description="∭(r² + ε²)⁻¹ f dV"
              />
              <MomentCard3D
                label="r_eff (scalar)"
                value={negativeOrderMoments.effectiveRadius}
                unit="m"
                description="(μ₋₂,ε)⁻¹/²"
              />
              <MomentCard3D
                label="r_eff,x"
                value={negativeOrderMoments.effectiveRadiusX}
                unit="m"
                description="X-direction"
              />
              <MomentCard3D
                label="r_eff,y"
                value={negativeOrderMoments.effectiveRadiusY}
                unit="m"
                description="Y-direction"
              />
            </div>

            {/* Inverse Tensor Matrix */}
            <div className="p-4 rounded-lg bg-background/50 border border-warning/20">
              <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                Inverse Moment Tensor M₋₂,ε (about centroid)
              </h4>
              <div className="grid grid-cols-3 gap-2 text-center font-mono text-sm">
                <div className="p-2 rounded bg-warning/10 text-warning">
                  Mxx = {formatValue(negativeOrderMoments.inverseTensorXX)}
                </div>
                <div className="p-2 rounded bg-muted/50 text-muted-foreground">
                  Mxy = {formatValue(negativeOrderMoments.inverseTensorXY)}
                </div>
                <div className="p-2 rounded bg-muted/50 text-muted-foreground">
                  Mxz = {formatValue(negativeOrderMoments.inverseTensorXZ)}
                </div>
                <div className="p-2 rounded bg-muted/50 text-muted-foreground">
                  Mxy = {formatValue(negativeOrderMoments.inverseTensorXY)}
                </div>
                <div className="p-2 rounded bg-warning/10 text-warning">
                  Myy = {formatValue(negativeOrderMoments.inverseTensorYY)}
                </div>
                <div className="p-2 rounded bg-muted/50 text-muted-foreground">
                  Myz = {formatValue(negativeOrderMoments.inverseTensorYZ)}
                </div>
                <div className="p-2 rounded bg-muted/50 text-muted-foreground">
                  Mxz = {formatValue(negativeOrderMoments.inverseTensorXZ)}
                </div>
                <div className="p-2 rounded bg-muted/50 text-muted-foreground">
                  Myz = {formatValue(negativeOrderMoments.inverseTensorYZ)}
                </div>
                <div className="p-2 rounded bg-warning/10 text-warning">
                  Mzz = {formatValue(negativeOrderMoments.inverseTensorZZ)}
                </div>
              </div>
            </div>

            {/* Principal Inverse Moments */}
            <div className="grid grid-cols-3 gap-3">
              <MomentCard3D
                label="M₋₂,₁ (principal)"
                value={negativeOrderMoments.inversePrincipal1}
                unit="m⁻²"
                description="Maximum"
              />
              <MomentCard3D
                label="M₋₂,₂ (principal)"
                value={negativeOrderMoments.inversePrincipal2}
                unit="m⁻²"
                description="Intermediate"
              />
              <MomentCard3D
                label="M₋₂,₃ (principal)"
                value={negativeOrderMoments.inversePrincipal3}
                unit="m⁻²"
                description="Minimum"
              />
            </div>

            {/* Z-direction effective radius */}
            <div className="grid grid-cols-1 gap-3">
              <MomentCard3D
                label="r_eff,z"
                value={negativeOrderMoments.effectiveRadiusZ}
                unit="m"
                description="Z-direction effective radius"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Shape Comparison Table */}
      {showNegativeMoments && (
        <InverseMomentComparison
          loadingType={params.loadingType}
          magnitude={params.magnitude}
          epsilonPercent={epsilonPercent}
        />
      )}

      {/* Moment Results */}
      <Card className="border-border/50 bg-card/60 backdrop-blur">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">3D Moment Results & Inertia Tensor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MomentCard3D
              label="Resultant I₀"
              value={moments.I0}
              unit="kN"
              description="∭ I(r) dV"
            />
            <MomentCard3D
              label="Centroid x̄"
              value={moments.centroidX}
              unit="m"
              description="(1/I₀) ∭ x·I dV"
            />
            <MomentCard3D
              label="Centroid ȳ"
              value={moments.centroidY}
              unit="m"
              description="(1/I₀) ∭ y·I dV"
            />
            <MomentCard3D
              label="Centroid z̄"
              value={moments.centroidZ}
              unit="m"
              description="(1/I₀) ∭ z·I dV"
            />
          </div>

          <div className="mt-4 p-4 rounded-lg bg-background/50 border border-border/30">
            <h4 className="text-sm font-medium text-foreground mb-3">Inertia Tensor (about centroid)</h4>
            <div className="grid grid-cols-3 gap-2 text-center font-mono text-sm">
              <div className="p-2 rounded bg-primary/10 text-primary">
                Ixx = {formatValue(moments.Ixx)}
              </div>
              <div className="p-2 rounded bg-muted/50 text-muted-foreground">
                Ixy = {formatValue(moments.Ixy)}
              </div>
              <div className="p-2 rounded bg-muted/50 text-muted-foreground">
                Ixz = {formatValue(moments.Ixz)}
              </div>
              <div className="p-2 rounded bg-muted/50 text-muted-foreground">
                Ixy = {formatValue(moments.Ixy)}
              </div>
              <div className="p-2 rounded bg-primary/10 text-primary">
                Iyy = {formatValue(moments.Iyy)}
              </div>
              <div className="p-2 rounded bg-muted/50 text-muted-foreground">
                Iyz = {formatValue(moments.Iyz)}
              </div>
              <div className="p-2 rounded bg-muted/50 text-muted-foreground">
                Ixz = {formatValue(moments.Ixz)}
              </div>
              <div className="p-2 rounded bg-muted/50 text-muted-foreground">
                Iyz = {formatValue(moments.Iyz)}
              </div>
              <div className="p-2 rounded bg-primary/10 text-primary">
                Izz = {formatValue(moments.Izz)}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-4">
            <MomentCard3D label="I₁ (principal)" value={moments.I1} unit="kN·m²" description="Maximum" />
            <MomentCard3D label="I₂ (principal)" value={moments.I2} unit="kN·m²" description="Intermediate" />
            <MomentCard3D label="I₃ (principal)" value={moments.I3} unit="kN·m²" description="Minimum" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MomentCard3D({
  label,
  value,
  unit,
  description,
}: {
  label: string;
  value: number;
  unit: string;
  description: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 rounded-lg bg-background/50 border border-border/30"
    >
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-lg font-mono font-semibold text-foreground">
        {formatValue(value)} <span className="text-xs text-muted-foreground">{unit}</span>
      </div>
      <div className="text-xs text-fluids/70 mt-1">{description}</div>
    </motion.div>
  );
}

function VolumeStat({
  label,
  value,
  unit,
  tone,
}: {
  label: string;
  value: string;
  unit: string;
  tone: 'primary' | 'accent' | 'warning';
}) {
  const toneClasses = {
    primary: 'border-primary/25 bg-primary/10 text-primary',
    accent: 'border-accent/25 bg-accent/10 text-accent',
    warning: 'border-warning/25 bg-warning/10 text-warning',
  };

  return (
    <div className={`rounded-md border px-3 py-2 ${toneClasses[tone]}`}>
      <div className="mb-1 truncate text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className="truncate font-mono text-sm font-semibold text-foreground">
        {value}
        {unit && <span className="ml-1 text-[10px] font-normal text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}
