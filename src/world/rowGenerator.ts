import {
  CAR_COLORS,
  CAR_GAP,
  CAR_SPEED,
  COIN_CHANCE_GRASS,
  COIN_CHANCE_ROAD,
  DIFFICULTY,
  EASY,
  GRASS_MAX_OBSTACLES,
  GRASS_OBSTACLE_CHANCE,
  GRASS_SIDE_DENSITY,
  LANE_HALF,
  LANE_PERIOD,
  LOG_GAP,
  LOG_LENGTHS,
  LOG_SPEED,
  MAX_HAZARD_CHAIN,
  MAX_RUN,
  PLAY_HALF,
  RAIL_IDLE,
  RAIL_WARN,
  ROW_WEIGHTS,
  ROW_WEIGHT_GROWTH,
  SAFE_START_ROWS,
  SAME_KIND_BONUS,
  TRAIN_CARS,
  TRAIN_CAR_LEN,
  TRAIN_SPEED,
  TRUCK_CHANCE,
} from '../utils/constants';
import { clamp, createRng, lerp, type Rng } from '../utils/math';
import { carLength } from '../entities/car';
import type { CarSpec, CarType, GrassSpec, LogSpec, Obstacle, RailSpec, RiverSpec, RoadSpec, RowKind, RowSpec } from './types';

const CAR_TYPES: CarType[] = ['sedan', 'taxi', 'van'];

/** 점수(=행 번호)가 올라갈수록 0→1 로 증가하는 난이도 */
export function difficultyAt(score: number) {
  return clamp(score / DIFFICULTY.rampScore, 0, 1);
}

/** 연속 규칙을 지키면서 행 명세를 하나씩 만들어 낸다 */
export class RowGenerator {
  private rng: Rng = createRng();
  private lastKind: RowKind = 'grass';
  private run = 0;
  private hazardChain = 0;
  private lastDir: 1 | -1 = 1;
  private corridor = 0;

  reset(seed?: number) {
    this.rng = createRng(seed);
    this.lastKind = 'grass';
    this.run = 0;
    this.hazardChain = 0;
    this.lastDir = 1;
    this.corridor = 0;
  }

  generate(index: number): RowSpec {
    const kind = this.pickKind(index);
    if (kind === this.lastKind) this.run++;
    else {
      this.lastKind = kind;
      this.run = 1;
    }
    this.hazardChain = kind === 'grass' ? 0 : this.hazardChain + 1;

    switch (kind) {
      case 'road':
        return this.road(index);
      case 'river':
        return this.river(index);
      case 'rail':
        return this.rail(index);
      default:
        return this.grass(index);
    }
  }

  private pickKind(index: number): RowKind {
    if (index < SAFE_START_ROWS) return 'grass';
    const d = difficultyAt(index);
    const score = index;
    const w: Record<RowKind, number> = {
      grass: Math.max(1.4, ROW_WEIGHTS.grass - score * ROW_WEIGHT_GROWTH.grassDecay),
      road: ROW_WEIGHTS.road,
      river: ROW_WEIGHTS.river + Math.min(score, 150) * ROW_WEIGHT_GROWTH.river,
      rail: ROW_WEIGHTS.rail + Math.min(score, 150) * ROW_WEIGHT_GROWTH.rail,
    };
    void d;
    // 같은 종류가 이어지도록 약간 보정
    w[this.lastKind] *= this.lastKind === 'grass' ? 0.8 : SAME_KIND_BONUS;
    // 연속 제한 (초반엔 도로 연속을 더 짧게)
    (Object.keys(MAX_RUN) as RowKind[]).forEach((k) => {
      const max = k === 'road' && index < EASY.shortRoadRunUntil ? EASY.shortRoadRun : MAX_RUN[k];
      if (this.lastKind === k && this.run >= max) w[k] = 0;
    });
    // 초반엔 강/선로가 나오지 않는다
    if (index < EASY.riverFromRow) w.river = 0;
    if (index < EASY.railFromRow) w.rail = 0;
    if (this.hazardChain >= MAX_HAZARD_CHAIN) {
      w.road = w.river = w.rail = 0;
    }
    // 위험 줄 바로 뒤에 같은 종류가 끊기고 다른 위험이 오는 건 허용, 선로→선로는 제한 위에서 처리
    const total = w.grass + w.road + w.river + w.rail;
    let r = this.rng.next() * total;
    for (const k of ['grass', 'road', 'river', 'rail'] as RowKind[]) {
      r -= w[k];
      if (r <= 0) return k;
    }
    return 'grass';
  }

  private nextDir(sameKindAsLast: boolean): 1 | -1 {
    const dir = sameKindAsLast && this.rng.chance(0.8) ? (-this.lastDir as 1 | -1) : this.rng.chance(0.5) ? 1 : -1;
    this.lastDir = dir;
    return dir;
  }

  private coinCols(chance: number, blocked: Set<number>): number[] {
    if (!this.rng.chance(chance)) return [];
    const cols: number[] = [];
    for (let tries = 0; tries < 6; tries++) {
      const c = this.rng.int(-PLAY_HALF + 1, PLAY_HALF - 1);
      if (!blocked.has(c)) {
        cols.push(c);
        break;
      }
    }
    return cols;
  }

  private grass(index: number): GrassSpec {
    const rng = this.rng;
    const start = index < SAFE_START_ROWS;
    const obstacles: Obstacle[] = [];
    // 모든 잔디 줄이 통과 가능하도록 이어지는 통로 열은 항상 비워 둔다
    this.corridor = clamp(this.corridor + (rng.chance(0.3) ? rng.int(-1, 1) : 0), -PLAY_HALF + 1, PLAY_HALF - 1);
    const chance = start ? 0.08 : GRASS_OBSTACLE_CHANCE;
    let lastCol = -99;
    for (let c = -PLAY_HALF; c <= PLAY_HALF; c++) {
      if (obstacles.length >= GRASS_MAX_OBSTACLES) break;
      if (c === this.corridor || Math.abs(c - this.corridor) === 0) continue;
      if (start && Math.abs(c) <= 1) continue;
      if (c - lastCol <= 1) continue; // 붙어 있는 장애물 금지 → 막다른 길 방지
      if (rng.chance(chance)) {
        obstacles.push({ col: c, type: rng.chance(0.62) ? 'tree' : rng.chance(0.6) ? 'rock' : 'bush', h: rng.next() });
        lastCol = c;
      }
    }
    const side: Obstacle[] = [];
    for (let c = PLAY_HALF + 1; c < LANE_HALF - 1; c++) {
      for (const sgn of [-1, 1]) {
        const p = GRASS_SIDE_DENSITY * (c < 8 ? 1 : c < 16 ? 0.7 : 0.45);
        if (rng.chance(p)) {
          side.push({ col: sgn * c, type: rng.chance(0.78) ? 'tree' : rng.chance(0.5) ? 'rock' : 'bush', h: rng.next() });
        }
      }
    }
    const blocked = new Set(obstacles.map((o) => o.col));
    const coins = index < 2 ? [] : this.coinCols(COIN_CHANCE_GRASS, blocked);
    return { kind: 'grass', index, obstacles, side, coins };
  }

  private road(index: number): RoadSpec {
    const rng = this.rng;
    const d = difficultyAt(index);
    const gapMul = lerp(DIFFICULTY.startGapMul, DIFFICULTY.gapMinMul, d);
    const speed = rng.range(CAR_SPEED.min, CAR_SPEED.max) * lerp(DIFFICULTY.startSpeedMul, DIFFICULTY.speedMaxMul, d);
    const dir = this.nextDir(this.run > 1);
    const minGap = CAR_GAP.min;
    const cars: CarSpec[] = [];
    let x = rng.range(0, CAR_GAP.max * gapMul);
    for (;;) {
      const type: CarType = rng.chance(TRUCK_CHANCE) ? 'truck' : rng.pick(CAR_TYPES);
      const len = carLength(type);
      if (x + len + minGap > LANE_PERIOD) break;
      cars.push({ offset: x + len / 2, type, color: rng.pick(CAR_COLORS) });
      x += len + Math.max(minGap, rng.range(CAR_GAP.min, CAR_GAP.max) * gapMul);
    }
    if (cars.length === 0) cars.push({ offset: 0, type: 'sedan', color: CAR_COLORS[0] });
    const coins = this.coinCols(COIN_CHANCE_ROAD, new Set());
    return { kind: 'road', index, dir, speed, cars, coins };
  }

  private river(index: number): RiverSpec {
    const rng = this.rng;
    const d = difficultyAt(index);
    const speed = rng.range(LOG_SPEED.min, LOG_SPEED.max) * lerp(DIFFICULTY.startSpeedMul, Math.min(DIFFICULTY.speedMaxMul, 1.4), d);
    const dir = this.nextDir(this.run > 1);
    const gapMul = lerp(0.8, 1.3, d);
    const logs: LogSpec[] = [];
    let x = rng.range(0, 3);
    for (;;) {
      const len = rng.pick(LOG_LENGTHS);
      if (x + len + LOG_GAP.min > LANE_PERIOD) break;
      logs.push({ offset: x + len / 2, len });
      x += len + rng.range(LOG_GAP.min, LOG_GAP.max) * gapMul;
    }
    return { kind: 'river', index, dir, speed, logs };
  }

  private rail(index: number): RailSpec {
    const rng = this.rng;
    const trainCars = rng.pick(TRAIN_CARS);
    const idle = rng.range(RAIL_IDLE.min, RAIL_IDLE.max);
    const pass = (LANE_HALF * 2 + trainCars * TRAIN_CAR_LEN) / TRAIN_SPEED;
    const cycle = idle + RAIL_WARN + pass + 0.4;
    return { kind: 'rail', index, dir: rng.chance(0.5) ? 1 : -1, idle, trainCars, phase: rng.range(0, cycle) };
  }
}
