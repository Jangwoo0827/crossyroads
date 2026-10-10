import * as THREE from 'three';
import { Coin } from '../../entities/coin';
import { groundMats, mergeParts, vertexMat } from '../../render/materials';
import { PLAYER_HALF } from '../../utils/constants';
import { obstacleParts } from '../obstacles';
import type { GrassSpec } from '../types';
import { BaseRow } from './baseRow';

export class GrassRow extends BaseRow {
  readonly kind = 'grass' as const;
  private blockedCols: Set<number>;
  private coins: Coin[] = [];

  constructor(spec: GrassSpec) {
    super(spec.index);
    this.slab(spec.index % 2 === 0 ? groundMats.grassA : groundMats.grassB, 0);
    this.blockedCols = new Set(spec.obstacles.map((o) => o.col));

    const parts = [...spec.obstacles, ...spec.side].flatMap(obstacleParts);
    if (parts.length) {
      const geo = mergeParts(parts);
      this.owned.push(geo);
      const m = new THREE.Mesh(geo, vertexMat);
      m.castShadow = true;
      m.receiveShadow = true;
      this.group.add(m);
    }
    for (const c of spec.coins) {
      const coin = new Coin(c, 0);
      this.coins.push(coin);
      this.group.add(coin.mesh);
    }
  }

  blocked(col: number) {
    return this.blockedCols.has(col);
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
    for (const c of this.coins) c.update(time);
  }
}
