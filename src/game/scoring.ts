import { nativeBest, nativeSubmit } from '../utils/native';
import { persist, save } from '../utils/storage';
import type { GameState } from './state';

/** 점수/코인 집계와 저장 */
export const scoring = {
  init() {
    const nb = nativeBest();
    if (nb > save.best) {
      save.best = nb;
      persist();
    }
  },
  /** 새 최대 행에 도달하면 점수 +1 */
  onRow(state: GameState, row: number): boolean {
    if (row > state.score) {
      state.score = row;
      return true;
    }
    return false;
  },
  addCoin(state: GameState) {
    state.runCoins++;
    save.coins++;
    persist();
  },
  finish(state: GameState) {
    state.newBest = state.score > save.best;
    if (state.newBest) save.best = state.score;
    persist();
    if (state.score > 0) nativeSubmit(state.score);
  },
};
