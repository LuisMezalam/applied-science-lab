import { useRef, useState, useMemo } from 'react';
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
import { Box, Cylinder, AlertTriangle, Info } from 'lucide-react';
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
import { formatValue } from '@/lib/physics/momentCalculus';

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

function VolumetricPoints({ points, maxIntensity }: { points: Point3D[]; maxIntensity: number }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Update instance matrices and colors
  useMemo(() => {
    if (!meshRef.current) return;
    
    const color = new THREE.Color();
    
    points.forEach((p, i) => {
      dummy.position.set(p.x, p.z, p.y); // Swap y/z for three.js convention
      const scale = 0.03 + 0.05 * (p.intensity / maxIntensity);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
      
      // Color based on intensity (blue to orange)
      const t = p.intensity / maxIntensity;
      color.setHSL(0.6 - 0.5 * t, 0.8, 0.5);
      meshRef.current!.setColorAt(i, color);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [points, maxIntensity, dummy]);

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, points.length]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial vertexColors />
    </instancedMesh>
  );
}

function CentroidMarker({ x, y, z }: { x: number; y: number; z: number }) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (groupRef.current) {
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
  visible 
}: { 
  centroid: { x: number; y: number; z: number };
  radii: { x: number; y: number; z: number };
  visible: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
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

function Scene({ 
  points, 
  moments, 
  maxIntensity,
  negativeOrderMoments,
  showEllipsoid
}: { 
  points: Point3D[]; 
  moments: ReturnType<typeof calculate3DMoments>;
  maxIntensity: number;
  negativeOrderMoments: Moment3DNegativeOrder | null;
  showEllipsoid: boolean;
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
  
  return (
    <>
      <PerspectiveCamera makeDefault position={[4, 3, 4]} />
      <OrbitControls enableDamping dampingFactor={0.05} />
      
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 5, 5]} intensity={0.8} />
      <directionalLight position={[-5, 3, -5]} intensity={0.4} />
      
      <AxesHelper />
      <VolumetricPoints points={points} maxIntensity={maxIntensity} />
      <CentroidMarker x={moments.centroidX} y={moments.centroidY} z={moments.centroidZ} />
      
      {/* Effective radius ellipsoid visualization */}
      <EffectiveRadiusEllipsoid centroid={centroid} radii={effectiveRadii} visible={showEllipsoid} />
      <EffectiveRadiusWireframe centroid={centroid} radii={effectiveRadii} visible={showEllipsoid} />
      
      {/* Ground grid */}
      <gridHelper args={[6, 12, '#444444', '#333333']} position={[0, -1.5, 0]} />
    </>
  );
}

export function Volume3DSimulator() {
  const [params, setParams] = useState<Shape3DParams>({
    shape: 'box',
    width: 2,
    height: 1.5,
    depth: 1,
    radius: 1,
    magnitude: 10,
    loadingType: 'uniform',
  });
  
  const [epsilonPercent, setEpsilonPercent] = useState(5); // % of characteristic length
  const [showEllipsoid, setShowEllipsoid] = useState(true);
  const [showNegativeMoments, setShowNegativeMoments] = useState(true);

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
    const pts = generate3DField(params, 12);
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
  }, [params, epsilon, showNegativeMoments]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">3D Volumetric Loading</h2>
          <p className="text-sm text-muted-foreground">
            Triple integrals over volumes: ∭_V I(x,y,z) dV
          </p>
        </div>
        <Badge variant="outline" className="bg-fluids/10 text-fluids border-fluids/30">
          3D Moments
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <Card className="border-border/50 bg-card/60 backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Volume & Loading</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
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
        <Card className="border-border/50 bg-card/60 backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Volumetric Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px] rounded-lg overflow-hidden bg-background/50 border border-border/30">
              <Canvas>
                <Scene 
                  points={points} 
                  moments={moments} 
                  maxIntensity={maxIntensity}
                  negativeOrderMoments={negativeOrderMoments}
                  showEllipsoid={showEllipsoid}
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
              </div>
              <span>Drag to rotate • Scroll to zoom</span>
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
