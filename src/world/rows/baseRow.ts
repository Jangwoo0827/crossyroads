import * as THREE from 'three';
import { COLORS, LANE_HALF } from '../../utils/constants';
import { unitBox } from '../../render/materials';
import type { RowKind } from '../types';

export abstract class BaseRow {
  readonly group = new THREE.Group();
  protected owned: THREE.BufferGeometry[] = [];
  abstract readonly kind: RowKind;

  constructor(readonly index: number) {
    this.group.position.set(0, 0, -index);
  }

  /** 바닥 슬랩: 윗면이 topY 가 되도록 배치 */
  protected slab(mat: THREE.Material, topY: number, thickness = 0.6) {
    const m = new THREE.Mesh(unitBox, mat);
    m.scale.set(LANE_HALF * 2, thickness, 1);
    m.position.set(0, topY - thickness / 2, 0);
    m.receiveShadow = true;
    this.group.add(m);
    return m;
  }

  abstract update(dt: number, time: number): void;

  dispose() {
    this.group.removeFromParent();
    this.owned.forEach((g) => g.dispose());
    this.owned.length = 0;
  }
}

export const SKY = COLORS.sky;
