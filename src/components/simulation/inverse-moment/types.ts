import { Shape3D, Shape3DParams, Moment3DNegativeOrder } from '@/lib/physics/moment3D';

export interface ComparisonData {
  shape: Shape3D;
  label: string;
  icon: React.ReactNode;
  params: Shape3DParams;
  characteristicLength: number;
  negMoments: Moment3DNegativeOrder | null;
  centroid: { x: number; y: number; z: number };
  I0: number;
}

export interface InverseMomentComparisonProps {
  loadingType: Shape3DParams['loadingType'];
  magnitude: number;
  epsilonPercent: number;
}
