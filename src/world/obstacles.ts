import type * as THREE from 'three';
import { boxPart } from '../render/materials';
import { COLORS } from '../utils/constants';
import type { Obstacle } from './types';

/** 행 로컬 좌표(x=열, z=0)에 놓이는 장애물 조각들. 나중에 한 행 단위로 합쳐진다. */
export function obstacleParts(o: Obstacle): THREE.BufferGeometry[] {
  const x = o.col;
  switch (o.type) {
    case 'tree': {
      const trunkH = 0.5 + o.h * 0.25;
      const leafH = 0.7 + o.h * 0.5;
      return [
        boxPart(0.24, trunkH, 0.24, x, trunkH / 2, 0, COLORS.trunk),
        boxPart(0.84, leafH, 0.84, x, trunkH + leafH / 2, 0, COLORS.leaf),
        boxPart(0.54, 0.4, 0.54, x, trunkH + leafH + 0.2, 0, COLORS.leafDark),
      ];
    }
    case 'rock': {
      const h = 0.45 + o.h * 0.25;
      return [
        boxPart(0.78, h, 0.7, x, h / 2, 0, COLORS.rock),
        boxPart(0.42, h * 0.7, 0.42, x + 0.12, h + h * 0.35 - 0.05, -0.06, 0xcfd3dc),
      ];
    }
    default:
      return [
        boxPart(0.7, 0.4, 0.7, x, 0.2, 0, 0x6fd07f),
        boxPart(0.44, 0.22, 0.44, x - 0.05, 0.5, 0.05, 0x8ae69a),
        boxPart(0.1, 0.1, 0.1, x + 0.2, 0.46, -0.2, 0xff8fb8),
      ];
  }
}
