import * as THREE from 'three';
import { boxPart, mergeParts, vertexMat } from '../render/materials';
import type { CarType } from '../world/types';

const LENGTH: Record<CarType, number> = { sedan: 1.7, taxi: 1.5, van: 2.0, truck: 3.4 };
export const carLength = (t: CarType) => LENGTH[t];

const WINDOW = 0xcdeeff;
const TIRE = 0x3a3a46;
const LAMP = 0xfff3a0;
const geoCache = new Map<string, THREE.BufferGeometry>();

/** +x 방향을 바라보는 차량. 원점은 차량 중심, y=0 이 지면 */
function build(type: CarType, body: number): THREE.BufferGeometry {
  const L = LENGTH[type];
  const p: THREE.BufferGeometry[] = [];
  const wheel = (x: number, z: number) => p.push(boxPart(0.34, 0.34, 0.14, x, 0.17, z, TIRE));
  const lamps = (x: number, h: number) => {
    p.push(boxPart(0.06, 0.1, 0.16, x, h, 0.28, LAMP), boxPart(0.06, 0.1, 0.16, x, h, -0.28, LAMP));
  };
  switch (type) {
    case 'sedan':
      p.push(boxPart(L, 0.42, 0.84, 0, 0.39, 0, body));
      p.push(boxPart(0.95, 0.34, 0.74, -0.1, 0.77, 0, WINDOW));
      p.push(boxPart(0.9, 0.06, 0.78, -0.1, 0.97, 0, body));
      [-0.5, 0.5].forEach((x) => [-0.42, 0.42].forEach((z) => wheel(x, z)));
      lamps(L / 2, 0.42);
      break;
    case 'taxi':
      p.push(boxPart(L, 0.42, 0.84, 0, 0.39, 0, 0xffd23f));
      p.push(boxPart(0.85, 0.34, 0.74, -0.08, 0.77, 0, WINDOW));
      p.push(boxPart(0.8, 0.06, 0.78, -0.08, 0.97, 0, 0xffd23f));
      p.push(boxPart(0.24, 0.1, 0.3, -0.08, 1.05, 0, 0xffffff));
      [-0.45, 0.45].forEach((x) => [-0.42, 0.42].forEach((z) => wheel(x, z)));
      lamps(L / 2, 0.42);
      break;
    case 'van':
      p.push(boxPart(L, 0.8, 0.9, 0, 0.55, 0, body));
      p.push(boxPart(0.5, 0.36, 0.92, 0.55, 0.78, 0, WINDOW));
      [-0.62, 0.62].forEach((x) => [-0.46, 0.46].forEach((z) => wheel(x, z)));
      lamps(L / 2, 0.42);
      break;
    case 'truck':
      p.push(boxPart(0.95, 0.9, 0.92, L / 2 - 0.5, 0.62, 0, body));
      p.push(boxPart(0.4, 0.38, 0.94, L / 2 - 0.3, 0.8, 0, WINDOW));
      p.push(boxPart(L - 1.05, 1.15, 0.96, -0.55, 0.75, 0, 0xf4f1de));
      p.push(boxPart(L - 1.05, 0.1, 0.98, -0.55, 0.2, 0, 0x8f8a96));
      [-1.2, -0.5, 1.0].forEach((x) => [-0.45, 0.45].forEach((z) => wheel(x, z)));
      lamps(L / 2, 0.4);
      break;
  }
  return mergeParts(p);
}

export function carGeometry(type: CarType, color: number) {
  const key = `${type}_${color}`;
  let g = geoCache.get(key);
  if (!g) {
    g = build(type, color);
    geoCache.set(key, g);
  }
  return g;
}

export class Car {
  readonly mesh: THREE.Mesh;
  readonly half: number;
  constructor(readonly type: CarType, color: number, readonly offset: number, dir: number) {
    this.half = LENGTH[type] / 2;
    this.mesh = new THREE.Mesh(carGeometry(type, color), vertexMat);
    this.mesh.castShadow = true;
    this.mesh.rotation.y = dir > 0 ? 0 : Math.PI;
  }
}
