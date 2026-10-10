import * as THREE from 'three';
import { boxPart, mergeParts, vertexMat } from '../render/materials';
import { COLORS } from '../utils/constants';

const cache = new Map<number, THREE.BufferGeometry>();
export const LOG_TOP = 0.3;

function build(len: number) {
  return mergeParts([
    boxPart(len, 0.42, 0.84, 0, 0.09, 0, COLORS.log),
    boxPart(len + 0.04, 0.34, 0.7, 0, 0.09, 0, COLORS.logEnd),
    boxPart(len - 0.04, 0.44, 0.74, 0, 0.09, 0, COLORS.log),
    boxPart(len * 0.5, 0.05, 0.3, 0.1, 0.32, 0, 0x946238),
  ]);
}

export function logGeometry(len: number) {
  let g = cache.get(len);
  if (!g) {
    g = build(len);
    cache.set(len, g);
  }
  return g;
}

export class Log {
  readonly mesh: THREE.Mesh;
  readonly half: number;
  constructor(len: number, readonly offset: number) {
    this.half = len / 2;
    this.mesh = new THREE.Mesh(logGeometry(len), vertexMat);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
  }
}
