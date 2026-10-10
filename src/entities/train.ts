import * as THREE from 'three';
import { boxPart, mergeParts, vertexMat } from '../render/materials';
import { TRAIN_CAR_LEN } from '../utils/constants';

const cache = new Map<number, THREE.BufferGeometry>();

/** +x 방향으로 달리는 기차: 맨 앞 기관차 + 객차들, 중심이 원점 */
function build(n: number) {
  const total = n * TRAIN_CAR_LEN;
  const p: THREE.BufferGeometry[] = [];
  for (let i = 0; i < n; i++) {
    const cx = total / 2 - TRAIN_CAR_LEN / 2 - i * TRAIN_CAR_LEN;
    const loco = i === 0;
    const color = loco ? 0xe8505b : i % 2 ? 0x6fb7e9 : 0xf2a65a;
    p.push(boxPart(TRAIN_CAR_LEN - 0.12, 1.05, 0.96, cx, 0.82, 0, color));
    p.push(boxPart(TRAIN_CAR_LEN - 0.3, 0.3, 0.98, cx, 1.05, 0, 0xcdeeff));
    p.push(boxPart(TRAIN_CAR_LEN - 0.12, 0.12, 0.98, cx, 0.5, 0, 0x4a4a5a));
    p.push(boxPart(0.3, 0.14, 0.7, cx + 0.5, 0.2, 0, 0x3a3a46));
    p.push(boxPart(0.3, 0.14, 0.7, cx - 0.5, 0.2, 0, 0x3a3a46));
    if (loco) {
      p.push(boxPart(0.12, 0.3, 0.5, cx + TRAIN_CAR_LEN / 2 - 0.06, 0.9, 0, 0xfff3a0));
      p.push(boxPart(0.5, 0.2, 0.7, cx - 0.2, 1.45, 0, 0xc23b46));
    }
  }
  return mergeParts(p);
}

export function trainGeometry(n: number) {
  let g = cache.get(n);
  if (!g) {
    g = build(n);
    cache.set(n, g);
  }
  return g;
}

export function createTrainMesh(n: number, dir: number) {
  const m = new THREE.Mesh(trainGeometry(n), vertexMat);
  m.castShadow = true;
  m.rotation.y = dir > 0 ? 0 : Math.PI;
  m.visible = false;
  return m;
}
