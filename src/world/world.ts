import * as THREE from 'three';
import { ROWS_AHEAD, ROWS_BEHIND, START_FILL_BEHIND } from '../utils/constants';
import { RowGenerator } from './rowGenerator';
import { BaseRow } from './rows/baseRow';
import { GrassRow } from './rows/grassRow';
import { RailRow } from './rows/railRow';
import { RiverRow } from './rows/riverRow';
import { RoadRow } from './rows/roadRow';
import type { RowSpec } from './types';

export interface WorldEvents {
  onTrainWarn?: (row: RailRow) => void;
}

/** 무한 월드: 앞쪽 행을 생성하고, 카메라 뒤쪽 행은 제거(dispose)한다 */
export class World {
  readonly rows = new Map<number, BaseRow>();
  time = 0;
  private nextIndex = -START_FILL_BEHIND;
  private gen = new RowGenerator();
  events: WorldEvents = {};

  constructor(private root: THREE.Group) {}

  reset() {
    this.rows.forEach((r) => r.dispose());
    this.rows.clear();
    this.gen.reset();
    this.nextIndex = -START_FILL_BEHIND;
    this.time = 0;
    this.ensure(0, 0);
  }

  private build(spec: RowSpec): BaseRow {
    switch (spec.kind) {
      case 'road':
        return new RoadRow(spec);
      case 'river':
        return new RiverRow(spec);
      case 'rail': {
        const r = new RailRow(spec);
        r.onWarn = (row) => this.events.onTrainWarn?.(row);
        return r;
      }
      default:
        return new GrassRow(spec);
    }
  }

  /** 플레이어/카메라 위치에 맞춰 앞은 만들고 뒤는 지운다 */
  ensure(playerRow: number, camRow: number) {
    const target = Math.max(playerRow, camRow) + ROWS_AHEAD;
    while (this.nextIndex <= target) {
      const row = this.build(this.gen.generate(this.nextIndex));
      this.rows.set(row.index, row);
      this.root.add(row.group);
      this.nextIndex++;
    }
    const minKeep = Math.min(playerRow, camRow) - ROWS_BEHIND;
    for (const [i, row] of this.rows) {
      if (i < minKeep) {
        row.dispose();
        this.rows.delete(i);
      }
    }
  }

  update(dt: number) {
    this.time += dt;
    this.rows.forEach((r) => r.update(dt, this.time));
  }

  row(i: number): BaseRow | undefined {
    return this.rows.get(i);
  }

  isBlocked(row: number, col: number) {
    const r = this.rows.get(row);
    return r instanceof GrassRow ? r.blocked(col) : false;
  }
}
