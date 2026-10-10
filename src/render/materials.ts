import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { COLORS } from '../utils/constants';

/** 정점 색상을 쓰는 공용 머티리얼 (합쳐진 박스 지오메트리용) */
export const vertexMat = new THREE.MeshLambertMaterial({ vertexColors: true });

const cache = new Map<number, THREE.MeshLambertMaterial>();
export function colorMat(hex: number): THREE.MeshLambertMaterial {
  let m = cache.get(hex);
  if (!m) {
    m = new THREE.MeshLambertMaterial({ color: hex });
    cache.set(hex, m);
  }
  return m;
}

export const groundMats = {
  grassA: colorMat(COLORS.grassA),
  grassB: colorMat(COLORS.grassB),
  road: colorMat(COLORS.road),
  water: colorMat(COLORS.water),
  rail: colorMat(COLORS.rail),
};

export const lightOn = new THREE.MeshBasicMaterial({ color: 0xff3b3b });
export const lightOff = new THREE.MeshLambertMaterial({ color: 0x6b2a2a });

/** 박스 한 조각 (정점 색 포함, 위치 적용 완료) */
export function boxPart(
  w: number,
  h: number,
  d: number,
  x: number,
  y: number,
  z: number,
  color: number,
): THREE.BufferGeometry {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(x, y, z);
  const c = new THREE.Color(color);
  const n = g.getAttribute('position').count;
  const arr = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    arr[i * 3] = c.r;
    arr[i * 3 + 1] = c.g;
    arr[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  g.deleteAttribute('uv');
  return g;
}

/** 박스 조각들을 하나의 지오메트리(= 1 draw call)로 합치기 */
export function mergeParts(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const merged = mergeGeometries(parts, false);
  parts.forEach((p) => p.dispose());
  return merged ?? new THREE.BufferGeometry();
}

/** 공용 단위 박스 (바닥 슬랩 등에서 scale 로 재사용) */
export const unitBox = new THREE.BoxGeometry(1, 1, 1);
