import { useMemo } from 'react';
import { Box, Cylinder } from 'lucide-react';
import { createElement } from 'react';
import {
  Shape3D,
  Shape3DParams,
  generate3DField,
  calculate3DMoments,
  calculate3DNegativeOrderMoments,
} from '@/lib/physics/moment3D';
import { ComparisonData } from './types';

const shapeConfigs: { shape: Shape3D; label: string; iconName: string; defaultParams: Partial<Shape3DParams> }[] = [
  { shape: 'box', label: 'Box', iconName: 'box', defaultParams: { width: 2, height: 1.5, depth: 1 } },
  { shape: 'sphere', label: 'Sphere', iconName: 'sphere', defaultParams: { radius: 1 } },
  { shape: 'cylinder', label: 'Cylinder', iconName: 'cylinder', defaultParams: { radius: 1, height: 2 } },
];

function getCharacteristicLength(shape: Shape3D, params: Shape3DParams): number {
  switch (shape) {
    case 'box':
      return Math.max(params.width || 2, params.height || 1.5, params.depth || 1);
    case 'sphere':
      return (params.radius || 1) * 2;
    case 'cylinder':
      return Math.max((params.radius || 1) * 2, params.height || 2);
    default:
      return 2;
  }
}

export function useComparisonData(
  loadingType: Shape3DParams['loadingType'],
  magnitude: number,
  epsilonPercent: number
) {
  return useMemo<ComparisonData[]>(() => {
    return shapeConfigs.map(config => {
      const params: Shape3DParams = {
        shape: config.shape,
        ...config.defaultParams,
        magnitude,
        loadingType,
      };

      const charLength = getCharacteristicLength(config.shape, params);
      const epsilon = (epsilonPercent / 100) * charLength;

      const points = generate3DField(params, 12);
      const moments = calculate3DMoments(points, config.shape, params);
      const centroid = { x: moments.centroidX, y: moments.centroidY, z: moments.centroidZ };
      const negMoments = calculate3DNegativeOrderMoments(points, config.shape, params, epsilon, centroid);

      // Icons will be created in the component layer
      const icon = config.iconName === 'box'
        ? createElement(Box, { className: 'h-4 w-4' })
        : config.iconName === 'cylinder'
          ? createElement(Cylinder, { className: 'h-4 w-4' })
          : createElement('div', { className: 'h-4 w-4 rounded-full border-2 border-current' });

      return {
        shape: config.shape,
        label: config.label,
        icon,
        params,
        characteristicLength: charLength,
        negMoments,
        centroid,
        I0: moments.I0,
      };
    });
  }, [loadingType, magnitude, epsilonPercent]);
}

export const loadingLabels: Record<string, string> = {
  'uniform': 'Uniform',
  'linear-z': 'Linear (Z)',
  'radial': 'Radial',
  'parabolic': 'Parabolic',
  'exponential': 'Exponential',
};
