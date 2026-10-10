import * as THREE from 'three';
import { Log } from '../../entities/log';
import { boxPart, groundMats, mergeParts, vertexMat } from '../../render/materials';
import { COLORS, LANE_HALF, LANE_PERIOD, LOG_STAND_MARGIN } from '../../utils/constants';
import { laneX } from '../../utils/math';
import type { RiverSpec } from '../types';
import { BaseRow } from './baseRow';

export const WATER_TOP = -0.25;

let rippleGeo: THREE.BufferGeometry | null = null;
function ripples() {
  if (!rippleGeo) {
    const p: THREE.BufferGeometry[] = [];
    for (let x = -LANE_HALF; x < LANE_HALF; x += 3.1) {
      p.push(boxPart(0.9 + ((x * 7) % 3) * 0.2, 0.02, 0.09, x, WATER_TOP + 0.012, ((x * 13) % 5) / 10 - 0.25, COLORS.waterLight));
    }
    rippleGeo = mergeParts(p);
  }
  return rippleGeo;
}

export class RiverRow extends BaseRow {
  readonly kind = 'river' as const;
  private logs: Log[] = [];
  private dir: number;
  private speed: number;
  private waves: THREE.Mesh;
  private seed = Math.random() * 6;

  constructor(spec: RiverSpec) {
    super(spec.index);
    this.dir = spec.dir;
    this.speed = spec.speed;
    this.slab(groundMats.water, WATER_TOP, 0.5);
    this.waves = new THREE.Mesh(ripples(), vertexMat);
    this.group.add(this.waves);
    for (const l of spec.logs) {
      const log = new Log(l.len, l.offset);
      this.logs.push(log);
      this.group.add(log.mesh);
    }
  }

  private logX(l: Log, time: number) {
    return laneX(l.offset, this.dir, this.speed, time, LANE_PERIOD);
  }

  /** px 아래에 통나무가 있으면 그 통나무의 x방향 속도를, 없으면 null */
  logVelocityAt(px: number, time: number): number | null {
    for (const l of this.logs) {
      if (Math.abs(this.logX(l, time) - px) <= l.half + LOG_STAND_MARGIN) return this.dir * this.speed;
    }
    return null;
  }

  update(_dt: number, time: number) {
    for (const l of this.logs) {
      l.mesh.position.x = this.logX(l, time);
      l.mesh.position.y = Math.sin(time * 2 + l.offset) * 0.025;
    }
    this.waves.position.x = Math.sin(time * 0.6 + this.seed) * 0.8;
  }
}
