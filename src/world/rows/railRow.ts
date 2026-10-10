import * as THREE from 'three';
import { createTrainMesh } from '../../entities/train';
import { boxPart, groundMats, lightOff, lightOn, mergeParts, vertexMat } from '../../render/materials';
import {
  COLORS,
  HITBOX_SCALE,
  LANE_HALF,
  PLAYER_HALF,
  RAIL_WARN,
  TRAIN_CAR_LEN,
  TRAIN_SPEED,
} from '../../utils/constants';
import { mod } from '../../utils/math';
import type { RailSpec } from '../types';
import { BaseRow } from './baseRow';

const RAIL_TOP = -0.12;

let trackGeo: THREE.BufferGeometry | null = null;
function tracks() {
  if (!trackGeo) {
    const p: THREE.BufferGeometry[] = [];
    for (let x = -LANE_HALF + 0.4; x < LANE_HALF; x += 0.8) p.push(boxPart(0.2, 0.06, 0.86, x, RAIL_TOP + 0.03, 0, 0x7a5a3c));
    p.push(boxPart(LANE_HALF * 2, 0.07, 0.07, 0, RAIL_TOP + 0.09, 0.26, COLORS.railMetal));
    p.push(boxPart(LANE_HALF * 2, 0.07, 0.07, 0, RAIL_TOP + 0.09, -0.26, COLORS.railMetal));
    trackGeo = mergeParts(p);
  }
  return trackGeo;
}
let poleGeo: THREE.BufferGeometry | null = null;
function pole() {
  if (!poleGeo) {
    poleGeo = mergeParts([
      boxPart(0.1, 1.3, 0.1, 0, 0.65, 0, 0x8d8996),
      boxPart(0.46, 0.2, 0.1, 0, 1.3, 0, 0xf4f1de),
    ]);
  }
  return poleGeo;
}

export type RailPhase = 'idle' | 'warn' | 'pass';

export class RailRow extends BaseRow {
  readonly kind = 'rail' as const;
  private train: THREE.Mesh;
  private trainLen: number;
  private idle: number;
  private cycle: number;
  private pass: number;
  private phaseOffset: number;
  private dir: number;
  private lampL: THREE.Mesh;
  private lampR: THREE.Mesh;
  private lastPhase: RailPhase = 'idle';
  private trainPos = 0;
  onWarn?: (row: RailRow) => void;
  onPass?: (row: RailRow) => void;

  constructor(spec: RailSpec) {
    super(spec.index);
    this.dir = spec.dir;
    this.idle = spec.idle;
    this.trainLen = spec.trainCars * TRAIN_CAR_LEN;
    this.pass = (LANE_HALF * 2 + this.trainLen) / TRAIN_SPEED;
    this.cycle = this.idle + RAIL_WARN + this.pass + 0.4;
    this.phaseOffset = spec.phase;
    this.slab(groundMats.rail, RAIL_TOP, 0.5);
    const t = new THREE.Mesh(tracks(), vertexMat);
    t.receiveShadow = true;
    this.group.add(t);
    this.train = createTrainMesh(spec.trainCars, spec.dir);
    this.group.add(this.train);

    for (const sx of [-1, 1]) {
      const p = new THREE.Mesh(pole(), vertexMat);
      p.position.set(sx * (4.9 + 0.4), 0, 0.15);
      p.castShadow = true;
      this.group.add(p);
    }
    const lampGeo = new THREE.BoxGeometry(0.16, 0.16, 0.14);
    this.lampL = new THREE.Mesh(lampGeo, lightOff);
    this.lampR = new THREE.Mesh(lampGeo, lightOff);
    this.lampL.position.set(-5.3 - 0.1, 1.3, 0.22);
    this.lampR.position.set(5.3 - 0.1, 1.3, 0.22);
    this.lampL.position.x = -5.3 - 0.12;
    this.lampR.position.x = 5.3 + 0.12;
    this.group.add(this.lampL, this.lampR);
  }

  private phaseAt(time: number): { phase: RailPhase; t: number } {
    const c = mod(time + this.phaseOffset, this.cycle);
    if (c < this.idle) return { phase: 'idle', t: c };
    if (c < this.idle + RAIL_WARN) return { phase: 'warn', t: c - this.idle };
    if (c < this.idle + RAIL_WARN + this.pass) return { phase: 'pass', t: c - this.idle - RAIL_WARN };
    return { phase: 'idle', t: 0 };
  }

  /** 지금 기차 중심의 x (없으면 null) */
  trainX(time: number): number | null {
    const { phase, t } = this.phaseAt(time);
    if (phase !== 'pass') return null;
    return this.dir * (-(LANE_HALF + this.trainLen / 2) + TRAIN_SPEED * t);
  }

  hit(px: number, time: number): boolean {
    const tx = this.trainX(time);
    if (tx === null) return false;
    return Math.abs(tx - px) < (this.trainLen / 2 + PLAYER_HALF) * HITBOX_SCALE;
  }

  get direction() {
    return this.dir;
  }

  update(_dt: number, time: number) {
    const { phase, t } = this.phaseAt(time);
    if (phase !== this.lastPhase) {
      if (phase === 'warn') this.onWarn?.(this);
      if (phase === 'pass') this.onPass?.(this);
      this.lastPhase = phase;
    }
    if (phase === 'warn') {
      const blink = Math.floor(t * 5) % 2 === 0;
      this.lampL.material = blink ? lightOn : lightOff;
      this.lampR.material = blink ? lightOff : lightOn;
    } else if (phase === 'pass') {
      this.lampL.material = lightOn;
      this.lampR.material = lightOn;
    } else {
      this.lampL.material = lightOff;
      this.lampR.material = lightOff;
    }
    const tx = this.trainX(time);
    this.train.visible = tx !== null;
    if (tx !== null) this.train.position.x = tx;
    this.trainPos = tx ?? 0;
  }

  get currentTrainX() {
    return this.trainPos;
  }
}
