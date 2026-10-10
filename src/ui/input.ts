import { SWIPE_THRESHOLD } from '../utils/constants';
import type { Dir } from '../entities/player';

/** 키보드 + 터치(탭=앞으로, 스와이프=해당 방향). 메뉴/버튼 위 입력은 무시한다. */
export function setupInput(target: HTMLElement, onDir: (d: Dir) => void, onAny: () => void) {
  const keyMap: Record<string, Dir> = {
    ArrowUp: 'up',
    KeyW: 'up',
    Space: 'up',
    ArrowDown: 'down',
    KeyS: 'down',
    ArrowLeft: 'left',
    KeyA: 'left',
    ArrowRight: 'right',
    KeyD: 'right',
  };
  window.addEventListener('keydown', (e) => {
    onAny();
    const d = keyMap[e.code];
    if (d) {
      e.preventDefault();
      if (!e.repeat) onDir(d);
    }
  });

  let sx = 0;
  let sy = 0;
  let id = -1;
  target.addEventListener('pointerdown', (e) => {
    onAny();
    id = e.pointerId;
    sx = e.clientX;
    sy = e.clientY;
  });
  const end = (e: PointerEvent) => {
    if (e.pointerId !== id) return;
    id = -1;
    const dx = e.clientX - sx;
    const dy = e.clientY - sy;
    if (Math.hypot(dx, dy) < SWIPE_THRESHOLD) return onDir('up');
    if (Math.abs(dx) > Math.abs(dy)) onDir(dx > 0 ? 'right' : 'left');
    else onDir(dy > 0 ? 'down' : 'up');
  };
  target.addEventListener('pointerup', end);
  target.addEventListener('pointercancel', () => (id = -1));
  // 스크롤/확대/당겨서 새로고침 방지
  const stop = (e: Event) => e.preventDefault();
  target.addEventListener('touchmove', stop, { passive: false });
  target.addEventListener('contextmenu', stop);
  document.addEventListener('gesturestart', stop);
}
