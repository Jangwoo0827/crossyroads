export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const mod = (v: number, m: number) => ((v % m) + m) % m;
export const easeOut = (t: number) => 1 - (1 - t) * (1 - t);

/** 시드 가능한 난수 (mulberry32) */
export function createRng(seed = (Math.random() * 2 ** 32) >>> 0) {
  let a = seed >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    range: (min: number, max: number) => min + (max - min) * next(),
    int: (min: number, max: number) => Math.floor(min + (max - min + 1) * next()),
    chance: (p: number) => next() < p,
    pick: <T>(arr: readonly T[]) => arr[Math.floor(next() * arr.length)],
  };
}
export type Rng = ReturnType<typeof createRng>;

/** 일정 속도로 돌아가는 레인의 위치: offset 에서 출발해 주기 period 로 순환 */
export function laneX(offset: number, dir: number, speed: number, time: number, period: number) {
  return mod(offset + dir * speed * time, period) - period / 2;
}
