export type Phase = 'menu' | 'playing' | 'dead';

export interface GameState {
  phase: Phase;
  score: number; // 전진한 거리(행)
  runCoins: number; // 이번 판에서 먹은 코인
  deadTime: number;
  newBest: boolean;
}

export const createState = (): GameState => ({ phase: 'menu', score: 0, runCoins: 0, deadTime: 0, newBest: false });
