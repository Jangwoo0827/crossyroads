import * as THREE from 'three';
import { Car } from '../../entities/car';
import { Coin } from '../../entities/coin';
import { boxPart, groundMats, mergeParts, vertexMat } from '../../render/materials';
import { COLORS, HITBOX_SCALE, LANE_HALF, LANE_PERIOD, PLAYER_HALF } from '../../utils/constants';
import { laneX } from '../../utils/math';
import type { RoadSpec } from '../types';
import { BaseRow } from './baseRow';

const ROAD_TOP = -0.12;

let lineGeo: THREE.BufferGeometry | null = null;
function roadLines() {
  if (!lineGeo) {
    const p: THREE.BufferGeometry[] = [];
    for (let x = -LANE_HALF + 1; x < LANE_HALF; x += 2.4) p.push(boxPart(1.1, 0.02, 0.1, x, ROAD_TOP + 0.011, 0, COLORS.roadLine));
    lineGeo = mergeParts(p);
  }
  return lineGeo;
}

export class RoadRow extends BaseRow {
  readonly kind = 'road' as const;
  private cars: Car[] = [];
  private coins: Coin[] = [];
  private dir: number;
  private speed: number;

  constructor(spec: RoadSpec) {
    super(spec.index);
    this.dir = spec.dir;
    this.speed = spec.speed;
    this.slab(groundMats.road, ROAD_TOP, 0.5);
    const lines = new THREE.Mesh(roadLines(), vertexMat);
    lines.receiveShadow = true;
    this.group.add(lines);
    for (const c of spec.cars) {
      const car = new Car(c.type, c.color, c.offset, spec.dir);
      this.cars.push(car);
      this.group.add(car.mesh);
    }
    for (const c of spec.coins) {
      const coin = new Coin(c, ROAD_TOP);
      this.coins.push(coin);
      this.group.add(coin.mesh);
    }
  }

  private carX(c: Car, time: number) {
    return laneX(c.offset, this.dir, this.speed, time, LANE_PERIOD);
  }

  /** 플레이어(연속 위치 px)가 차에 치였는가 — 히트박스 85% */
  hit(px: number, time: number): boolean {
    for (const c of this.cars) {
      if (Math.abs(this.carX(c, time) - px) < (c.half + PLAYER_HALF) * HITBOX_SCALE) return true;
    }
    return false;
  }

  /** 가장 가까운 차의 진행 방향 (사망 연출용) */
  get direction() {
    return this.dir;
  }

  collectCoin(px: number): boolean {
    for (const c of this.coins) {
      if (!c.collected && Math.abs(c.col - px) < 0.5 + PLAYER_HALF * 0.3) {
        c.take();
        return true;
      }
    }
    return false;
  }

  update(_dt: number, time: number) {
    for (const c of this.cars) c.mesh.position.x = this.carX(c, time);
    for (const c of this.coins) c.update(time);
  }
}
