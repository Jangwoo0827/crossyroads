/** requestAnimationFrame 루프 (dt 상한으로 탭 전환 후 튀는 것을 방지) */
export function startLoop(tick: (dt: number, now: number) => void) {
  let last = performance.now();
  let running = true;
  const frame = (now: number) => {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    tick(dt, now);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
  document.addEventListener('visibilitychange', () => {
    last = performance.now();
  });
  return () => {
    running = false;
  };
}
