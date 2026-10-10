import { Player, type Dir, type DeathKind } from '../entities/player';
import { CHARACTERS, CAMERA_DEATH_BEHIND, CAMERA_MIN_BEHIND, DRIFT_DEATH_X } from '../utils/constants';
import { LOG_TOP } from '../entities/log';
import { CameraRig } from '../render/camera';
import { Particles } from '../render/particles';
import { createScene, type SceneRig } from '../render/scene';
import { Hud } from '../ui/hud';
import { Screens } from '../ui/screens';
import { setupInput } from '../ui/input';
import { GrassRow } from '../world/rows/grassRow';
import { RailRow } from '../world/rows/railRow';
import { RiverRow } from '../world/rows/riverRow';
import { RoadRow } from '../world/rows/roadRow';
import { World } from '../world/world';
import { sfx, unlockAudio } from '../utils/audio';
import { save } from '../utils/storage';
import { cameraSpeed } from './difficulty';
import { scoring } from './scoring';
import { createState, type GameState } from './state';

const REASON: Record<DeathKind, string> = {
  car: '차에 치였어요!',
  water: '물에 빠졌어요!',
  train: '기차에 날아갔어요!',
  behind: '너무 느려요!',
  drift: '떠내려갔어요!',
};

export class Game {
  readonly rig: SceneRig;
  readonly cam = new CameraRig();
  readonly world: World;
  readonly player: Player;
  readonly particles = new Particles();
  readonly hud = new Hud();
  readonly screens: Screens;
  state: GameState = createState();
  private overShown = false;

  constructor(canvas: HTMLCanvasElement) {
    this.rig = createScene(canvas);
    this.world = new World(this.rig.world);
    this.world.events.onTrainWarn = (row) => {
      // 가까운 선로만 경고음
      if (Math.abs(row.index - this.player.row) < 9) sfx.bell();
    };
    this.player = new Player(
      this.world,
      {
        onHop: () => sfx.jump(),
        onLand: () => this.onLand(),
        onBump: () => sfx.bump(),
      },
      () => Math.floor(this.cam.camRow) - CAMERA_MIN_BEHIND,
    );
    this.rig.scene.add(this.player.group, this.particles.mesh);

    this.screens = new Screens({
      onStart: () => this.start(),
      onRetry: () => this.retry(),
      onMenu: () => this.toMenu(),
      onCharacterChange: (id, un) => this.player.setCharacter(id, un),
    });

    scoring.init();
    setupInput(
      document.getElementById('app')!,
      (d) => this.onDir(d),
      () => unlockAudio(),
    );
    this.toMenu();
  }

  private onDir(d: Dir) {
    if (this.state.phase !== 'playing') return;
    this.player.request(d);
  }

  private resetWorld() {
    this.world.reset();
    this.player.reset();
    const id = save.selected;
    this.player.setCharacter(id, save.unlocked.includes(id));
    this.cam.reset(0, 0);
    this.particles.clear();
    this.state = createState();
    this.overShown = false;
    this.hud.set(0, 0);
    this.world.ensure(0, Math.floor(this.cam.camRow));
  }

  toMenu() {
    this.resetWorld();
    this.state.phase = 'menu';
    this.hud.show(false);
    this.screens.showStart();
  }

  start() {
    if (!save.unlocked.includes(this.screens.selectedId)) return;
    this.resetWorld();
    this.state.phase = 'playing';
    this.hud.show(true);
    this.screens.showPlaying();
  }

  retry() {
    this.start();
  }

  private onLand() {
    if (this.state.phase !== 'playing') return;
    if (scoring.onRow(this.state, this.player.row)) this.hud.set(this.state.score, this.state.runCoins);
  }

  private kill(kind: DeathKind, dirX = 1) {
    if (this.state.phase !== 'playing') return;
    this.state.phase = 'dead';
    this.state.deadTime = 0;
    const p = this.player;
    p.die(kind, dirX);
    const x = p.x;
    const z = -p.rowF;
    switch (kind) {
      case 'car':
        sfx.hit();
        this.cam.shake(0.22);
        this.particles.burst(x, 0.3, z, 14, [0xffffff, 0xff6b6b, 0xffd23f], { speed: 3.5, up: 4 });
        break;
      case 'train':
        sfx.train();
        this.cam.shake(0.4);
        this.particles.burst(x, 0.5, z, 18, [0xffffff, 0xffa733, 0xe8383d], { speed: 5, up: 5 });
        break;
      case 'water':
      case 'drift':
        sfx.splash();
        this.cam.shake(0.12);
        this.particles.burst(x, -0.1, z, 26, [0xbfeaff, 0x7fd4ff, 0xffffff], { speed: 2.6, up: 6, size: 0.16 });
        break;
      default:
        sfx.hit();
        this.cam.shake(0.18);
    }
    try {
      navigator.vibrate?.(kind === 'train' ? [60, 30, 80] : 70);
    } catch {
      /* 미지원 */
    }
    scoring.finish(this.state);
    this.reason = REASON[kind];
  }
  private reason = '';

  private checks(dt: number) {
    const p = this.player;
    if (!p.alive) return;
    const idx = Math.round(p.rowF);
    const row = this.world.row(idx);
    const t = this.world.time;
    if (row) {
      const grounded = !p.hopping || p.y < 0.4;
      if (row instanceof RoadRow) {
        if (grounded && row.hit(p.x, t)) return this.kill('car', row.direction);
      } else if (row instanceof RailRow) {
        if (grounded && row.hit(p.x, t)) return this.kill('train', row.direction);
      } else if (row instanceof RiverRow) {
        if (!p.hopping) {
          const v = row.logVelocityAt(p.x, t);
          if (v === null) return this.kill('water');
          p.x += v * dt;
          p.settle(true);
          if (Math.abs(p.x) > DRIFT_DEATH_X) return this.kill('drift');
        }
      }
      if (!p.hopping && (row instanceof GrassRow || row instanceof RoadRow) && row.collectCoin(p.x)) {
        scoring.addCoin(this.state);
        sfx.coin();
        this.hud.set(this.state.score, this.state.runCoins);
        this.particles.burst(p.x, 0.6, -p.rowF, 8, [0xffd23f, 0xfff3a0], { speed: 1.8, up: 3.5, size: 0.1 });
      }
    }
    if (p.rowF < this.cam.camRow - CAMERA_DEATH_BEHIND) this.kill('behind');
  }

  update(dt: number) {
    const s = this.state;
    this.world.update(dt);
    if (s.phase === 'playing') {
      this.player.update(dt);
      this.cam.update(dt, this.player.rowF, this.player.x, true, cameraSpeed(s.score));
      this.checks(dt);
    } else if (s.phase === 'menu') {
      this.player.idle(dt);
      this.cam.update(dt, 0, 0, false, 0);
    } else {
      this.player.update(dt);
      this.cam.update(dt, this.player.rowF, this.player.x, false, 0);
      s.deadTime += dt;
      if (!this.overShown && s.deadTime > 0.95) {
        this.overShown = true;
        this.hud.show(false);
        this.screens.showOver(s.score, save.best, s.runCoins, s.newBest, this.reason);
      }
    }
    this.world.ensure(this.player.row, Math.floor(this.cam.camRow));
    this.particles.update(dt);
    this.rig.followSun(this.cam.target);
    this.rig.renderer.render(this.rig.scene, this.cam.camera);
  }
}

export const characterCount = CHARACTERS.length;
void LOG_TOP;
