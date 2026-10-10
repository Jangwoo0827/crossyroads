import * as THREE from 'three';
import { HOP_HEIGHT, HOP_TIME, PLAY_HALF } from '../utils/constants';
import { lerp } from '../utils/math';
import type { World } from '../world/world';
import { GrassRow } from '../world/rows/grassRow';
import { LOG_TOP } from './log';
import { buildCharacter, buildLockedCharacter } from './characters';

export type Dir = 'up' | 'down' | 'left' | 'right';
export type DeathKind = 'car' | 'water' | 'train' | 'behind' | 'drift';

const GROUND: Record<string, number> = { grass: 0, road: -0.12, rail: -0.12, river: -0.25 };

export interface PlayerHooks {
  onHop(): void;
  onLand(): void;
  onBump(): void;
}

export class Player {
  readonly group = new THREE.Group();
  private model = new THREE.Group();
  row = 0;
  rowF = 0;
  x = 0;
  y = 0;
  hopping = false;
  alive = true;
  /** 통나무 위에 서 있는 중인지 (y 높이 보정용) */
  onLog = false;
  private t = 0;
  private from = { x: 0, row: 0, y: 0 };
  private to = { x: 0, row: 0, y: 0 };
  private queued: Dir | null = null;
  private targetYaw = 0;
  private yaw = 0;
  private charId = 'chicken';
  private deathKind: DeathKind | null = null;
  private deathT = 0;
  private vel = new THREE.Vector3();
  private spin = new THREE.Vector3();
  private idleT = 0;

  constructor(private world: World, private hooks: PlayerHooks, private minRow: () => number) {
    this.group.add(this.model);
    this.setCharacter('chicken', true);
  }

  setCharacter(id: string, unlocked: boolean) {
    this.charId = id;
    this.group.remove(this.model);
    this.model = unlocked ? buildCharacter(id) : buildLockedCharacter(id);
    this.model.rotation.y = this.yaw;
    this.group.add(this.model);
    this.model.scale.set(1, 1, 1);
  }

  reset() {
    this.row = this.rowF = 0;
    this.x = 0;
    this.y = 0;
    this.hopping = false;
    this.alive = true;
    this.onLog = false;
    this.queued = null;
    this.deathKind = null;
    this.yaw = this.targetYaw = 0;
    this.group.visible = true;
    this.group.rotation.set(0, 0, 0);
    this.model.scale.set(1, 1, 1);
    this.model.rotation.set(0, 0, 0);
    this.model.position.set(0, 0, 0);
    this.sync();
  }

  private groundAt(row: number, x: number): number {
    const r = this.world.row(row);
    return r ? GROUND[r.kind] : 0;
  }

  /** 이동 요청: 이동 중이면 1개까지 버퍼링 */
  request(dir: Dir) {
    if (!this.alive) return;
    if (this.hopping) {
      this.queued = dir;
      return;
    }
    this.startHop(dir);
  }

  private startHop(dir: Dir) {
    const dr = dir === 'up' ? 1 : dir === 'down' ? -1 : 0;
    const dx = dir === 'left' ? -1 : dir === 'right' ? 1 : 0;
    // 진행 방향 바라보기: 모델 앞(-z)이 이동 방향을 향하도록
    this.targetYaw = Math.atan2(-dx, dr);
    const toRow = this.row + dr;
    const cur = this.world.row(this.row);
    const dest = this.world.row(toRow);
    if (!dest || toRow < this.minRow()) return this.bump();

    const fromRiver = cur?.kind === 'river';
    let toX: number;
    if (dx !== 0) toX = (fromRiver ? this.x : Math.round(this.x)) + dx;
    else toX = dest.kind === 'river' ? this.x : Math.round(this.x);

    if (dest.kind !== 'river') {
      toX = Math.round(toX);
      if (Math.abs(toX) > PLAY_HALF) return this.bump();
      if (dest instanceof GrassRow && dest.blocked(toX)) return this.bump();
    } else if (Math.abs(toX) > PLAY_HALF + 1.4) {
      return this.bump();
    }

    this.from = { x: this.x, row: this.row, y: this.y };
    const destKind = dest.kind;
    this.to = { x: toX, row: toRow, y: destKind === 'river' ? LOG_TOP : GROUND[destKind] };
    this.t = 0;
    this.hopping = true;
    this.onLog = false;
    this.hooks.onHop();
  }

  private bump() {
    this.model.position.z = 0.0;
    this.bumpT = 0.12;
    this.hooks.onBump();
    this.queued = null;
  }
  private bumpT = 0;

  update(dt: number) {
    if (this.deathKind) return this.updateDeath(dt);
    this.idleT += dt;

    // 방향 부드럽게 회전
    let dy = this.targetYaw - this.yaw;
    dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    this.yaw += dy * Math.min(1, dt * 24);
    this.model.rotation.y = this.yaw;

    if (this.hopping) {
      this.t += dt / HOP_TIME;
      const p = Math.min(1, this.t);
      this.x = lerp(this.from.x, this.to.x, p);
      this.rowF = lerp(this.from.row, this.to.row, p);
      this.y = lerp(this.from.y, this.to.y, p) + Math.sin(Math.PI * p) * HOP_HEIGHT;
      this.model.scale.set(1 - 0.08 * Math.sin(Math.PI * p), 1 + 0.18 * Math.sin(Math.PI * p), 1 - 0.08 * Math.sin(Math.PI * p));
      if (p >= 1) {
        this.hopping = false;
        this.row = this.to.row;
        this.rowF = this.row;
        this.x = this.to.x;
        this.y = this.to.y;
        this.model.scale.set(1.12, 0.84, 1.12); // 착지 찌그러짐
        this.hooks.onLand();
        if (this.queued && this.alive) {
          const q = this.queued;
          this.queued = null;
          this.startHop(q);
        }
      }
    } else {
      // 착지 후 원래 모양으로 복원
      const k = Math.min(1, dt * 16);
      this.model.scale.x += (1 - this.model.scale.x) * k;
      this.model.scale.y += (1 - this.model.scale.y) * k;
      this.model.scale.z += (1 - this.model.scale.z) * k;
    }
    if (this.bumpT > 0) {
      this.bumpT -= dt;
      this.model.position.z = -Math.sin((this.bumpT / 0.12) * Math.PI) * 0.08;
    }
    this.sync();
  }

  /** 서 있는 곳의 높이(통나무 위/바닥)를 부드럽게 반영 */
  settle(onLog: boolean) {
    this.onLog = onLog;
    if (this.hopping || !this.alive) return;
    const kind = this.world.row(this.row)?.kind;
    this.y = kind === 'river' ? (onLog ? LOG_TOP : LOG_TOP) : GROUND[kind ?? 'grass'];
    this.sync();
  }

  /** 메뉴 화면에서 살짝 둥실거리는 대기 모션 */
  idle(dt: number) {
    this.idleT += dt;
    const s = 1 + Math.sin(this.idleT * 4) * 0.04;
    this.model.scale.set(1 / s, s, 1 / s);
    this.yaw += (0 - this.yaw) * Math.min(1, dt * 10);
    this.model.rotation.y = this.yaw + Math.sin(this.idleT * 1.5) * 0.35;
    this.sync();
  }

  private sync() {
    this.group.position.set(this.x, this.y, -this.rowF);
  }

  die(kind: DeathKind, dirX = 1) {
    if (!this.alive) return;
    this.alive = false;
    this.deathKind = kind;
    this.deathT = 0;
    this.queued = null;
    if (kind === 'train') {
      this.vel.set(dirX * 16, 11, -2 + Math.random() * 4);
      this.spin.set(Math.random() * 12 - 6, Math.random() * 16, 14 * dirX);
    } else if (kind === 'water' || kind === 'drift') {
      this.group.visible = false;
    } else if (kind === 'car') {
      this.hopping = false;
      this.model.scale.set(1.5, 0.12, 1.4);
      this.y = Math.max(this.y, GROUND[this.world.row(Math.round(this.rowF))?.kind ?? 'grass']);
    } else {
      this.vel.set(-3, 5, 4);
      this.spin.set(8, 0, 4);
    }
    this.sync();
  }

  private updateDeath(dt: number) {
    this.deathT += dt;
    if (this.deathKind === 'train' || this.deathKind === 'behind') {
      this.vel.y -= 28 * dt;
      this.x += this.vel.x * dt;
      this.y += this.vel.y * dt;
      this.group.position.z += this.vel.z * dt;
      this.model.rotation.x += this.spin.x * dt;
      this.model.rotation.y += this.spin.y * dt;
      this.model.rotation.z += this.spin.z * dt;
      this.group.position.x = this.x;
      this.group.position.y = this.y;
      if (this.deathKind === 'behind' && this.y < -4) this.group.visible = false;
    }
  }

  get unlockedId() {
    return this.charId;
  }
}
