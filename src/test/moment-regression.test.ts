import { describe, expect, it } from 'vitest';
import {
  calculateMoments,
  calculateNegativeOrderMoments,
  generateField,
} from '@/lib/physics/momentCalculus';
import {
  calculate2DMoments,
  calculate2DNegativeOrderMoments,
  generate2DField,
  getClosedFormMoments,
  Shape2DParams,
} from '@/lib/physics/moment2D';
import {
  calculate3DMoments,
  calculate3DNegativeOrderMoments,
  generate3DField,
  Shape3DParams,
} from '@/lib/physics/moment3D';

describe('moment calculus regression checks', () => {
  it('computes the known 1D uniform field ladder', () => {
    const field = generateField(() => 10, { magnitude: 10, length: 10 }, 1001);
    const moments = calculateMoments(field);
    const inverse = calculateNegativeOrderMoments(field, moments.centroid, moments.zerothMoment, 0.5);

    expect(moments.zerothMoment).toBeCloseTo(100, 8);
    expect(moments.centroid).toBeCloseTo(5, 8);
    expect(moments.firstCentralMoment).toBeCloseTo(0, 8);
    expect(moments.standardDeviation).toBeCloseTo(Math.sqrt(100 / 12), 4);
    expect(inverse.centralInverseMoment1).toBeGreaterThan(0);
    expect(inverse.effectiveWidth2).toBeGreaterThan(0);
    expect(inverse.effectiveWidth2).toBeLessThan(moments.standardDeviation);
  });

  it('keeps the 2D uniform rectangle close to the closed form moments', () => {
    const params: Shape2DParams = {
      shape: 'rectangle',
      width: 2,
      height: 1,
      magnitude: 10,
      loadingType: 'uniform',
    };
    const points = generate2DField(params, 160);
    const moments = calculate2DMoments(points, params.shape, params);
    const closed = getClosedFormMoments(params);
    const inverse = calculate2DNegativeOrderMoments(points, moments.centroidX, moments.centroidY, moments.I0, 0.1);

    expect(closed).not.toBeNull();
    expect(moments.I0).toBeCloseTo(closed!.I0, 8);
    expect(moments.centroidX).toBeCloseTo(0, 8);
    expect(moments.centroidY).toBeCloseTo(0, 8);
    expect(Math.abs((moments.Ixx - closed!.Ixx) / closed!.Ixx)).toBeLessThan(0.02);
    expect(Math.abs((moments.Iyy - closed!.Iyy) / closed!.Iyy)).toBeLessThan(0.02);
    expect(inverse.effectiveRadiusScalar).toBeGreaterThan(0);
    expect(inverse.effectiveRadiusX).toBeGreaterThan(0);
    expect(inverse.effectiveRadiusY).toBeGreaterThan(0);
  });

  it('computes a stable 3D uniform box field and finite inverse moments', () => {
    const params: Shape3DParams = {
      shape: 'box',
      width: 2,
      height: 1.5,
      depth: 1,
      magnitude: 10,
      loadingType: 'uniform',
    };
    const points = generate3DField(params, 14);
    const moments = calculate3DMoments(points, params.shape, params);
    const inverse = calculate3DNegativeOrderMoments(
      points,
      params.shape,
      params,
      0.1,
      { x: moments.centroidX, y: moments.centroidY, z: moments.centroidZ }
    );

    expect(moments.I0).toBeCloseTo(30, 8);
    expect(moments.centroidX).toBeCloseTo(0, 8);
    expect(moments.centroidY).toBeCloseTo(0, 8);
    expect(moments.centroidZ).toBeCloseTo(0, 8);
    expect(moments.I1).toBeGreaterThanOrEqual(moments.I2);
    expect(moments.I2).toBeGreaterThanOrEqual(moments.I3);
    expect(inverse.scalarInverseMoment).toBeGreaterThan(0);
    expect(inverse.effectiveRadius).toBeGreaterThan(0);
    expect(inverse.effectiveRadiusX).toBeGreaterThan(0);
    expect(inverse.effectiveRadiusY).toBeGreaterThan(0);
    expect(inverse.effectiveRadiusZ).toBeGreaterThan(0);
  });
});
