import './style.css';
import { Game } from './game/game';
import { startLoop } from './game/loop';

const canvas = document.getElementById('game') as HTMLCanvasElement;
const game = new Game(canvas);

// 프레임 시간이 계속 길면 화질을 단계적으로 낮춘다 (저사양 폰 대응)
let avg = 1 / 60;
let slow = 0;
let level: 0 | 1 | 2 = window.matchMedia('(pointer: coarse)').matches ? 1 : 2;
startLoop((dt) => {
  game.update(dt);
  avg += (dt - avg) * 0.05;
  slow = avg > 1 / 40 ? slow + 1 : 0;
  if (slow > 120 && level > 0) {
    level = (level - 1) as 0 | 1;
    game.rig.setQuality(level);
    slow = 0;
  }
});

if (import.meta.env.DEV) (window as unknown as { __game: Game }).__game = game;
