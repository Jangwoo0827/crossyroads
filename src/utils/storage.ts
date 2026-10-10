import { STORAGE_KEY } from './constants';

export interface SaveData {
  best: number;
  coins: number;
  unlocked: string[];
  selected: string;
  muted: boolean;
}

const defaults = (): SaveData => ({ best: 0, coins: 0, unlocked: ['chicken'], selected: 'chicken', muted: false });

function load(): SaveData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaults();
    const d = { ...defaults(), ...JSON.parse(raw) } as SaveData;
    if (!d.unlocked.includes('chicken')) d.unlocked.push('chicken');
    return d;
  } catch {
    return defaults();
  }
}

export const save: SaveData = load();

export function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(save));
  } catch {
    /* 사생활 보호 모드 등에서는 무시 */
  }
}
