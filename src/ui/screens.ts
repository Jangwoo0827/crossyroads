import { CHARACTERS } from '../utils/constants';
import { persist, save } from '../utils/storage';
import { setMuted, sfx, unlockAudio } from '../utils/audio';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;

export interface ScreenHandlers {
  onStart(): void;
  onRetry(): void;
  onMenu(): void;
  onCharacterChange(id: string, unlocked: boolean): void;
}

export class Screens {
  private start = $('startScreen');
  private over = $('overScreen');
  private idx = Math.max(0, CHARACTERS.findIndex((c) => c.id === save.selected));
  private overAt = 0;
  private toastTimer = 0;

  constructor(private h: ScreenHandlers) {
    // 시작 화면: 버튼이 아닌 곳을 탭하면 시작
    this.start.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('button')) return;
      this.tryStart();
    });
    window.addEventListener('keydown', (e) => {
      if (!this.start.classList.contains('hidden') && (e.code === 'Space' || e.code === 'Enter')) {
        e.preventDefault();
        this.tryStart();
      }
      if (!this.start.classList.contains('hidden')) {
        if (e.code === 'ArrowLeft') this.step(-1);
        if (e.code === 'ArrowRight') this.step(1);
      }
      if (!this.over.classList.contains('hidden') && (e.code === 'Space' || e.code === 'Enter') && this.canRetry()) {
        e.preventDefault();
        h.onRetry();
      }
    });
    $('prevChar').addEventListener('click', () => this.step(-1));
    $('nextChar').addEventListener('click', () => this.step(1));
    $('unlockBtn').addEventListener('click', () => this.unlock());
    $('retryBtn').addEventListener('click', () => this.canRetry() && h.onRetry());
    $('menuBtn').addEventListener('click', () => h.onMenu());
    const mute = $('muteBtn');
    const paint = () => (mute.textContent = save.muted ? '🔇' : '🔊');
    paint();
    mute.addEventListener('click', () => {
      unlockAudio();
      setMuted(!save.muted);
      paint();
    });
    mute.addEventListener('pointerdown', (e) => e.stopPropagation());
    this.refreshChar(false);
  }

  private canRetry() {
    return performance.now() - this.overAt > 300;
  }

  private cur() {
    return CHARACTERS[this.idx];
  }
  private isUnlocked() {
    return save.unlocked.includes(this.cur().id);
  }

  private tryStart() {
    if (!this.isUnlocked()) return this.toast('잠긴 캐릭터예요! 코인으로 해금하세요');
    this.h.onStart();
  }

  private step(d: number) {
    this.idx = (this.idx + d + CHARACTERS.length) % CHARACTERS.length;
    this.refreshChar(true);
  }

  private unlock() {
    const c = this.cur();
    if (this.isUnlocked() || save.coins < c.cost) return;
    save.coins -= c.cost;
    save.unlocked.push(c.id);
    save.selected = c.id;
    persist();
    sfx.unlock();
    this.refreshChar(true);
    this.toast(`${c.name} 해금!`);
  }

  refreshChar(notify: boolean) {
    const c = this.cur();
    const un = this.isUnlocked();
    $('charName').textContent = c.name;
    $('walletCoins').textContent = String(save.coins);
    $('startBest').textContent = String(save.best);
    const st = $('charStatus');
    const btn = $<HTMLButtonElement>('unlockBtn');
    if (un) {
      st.textContent = save.selected === c.id ? '사용 중' : '보유함';
      btn.classList.add('hidden');
      save.selected = c.id;
      persist();
    } else {
      st.textContent = `🔒 잠김 · ${c.cost} 코인`;
      btn.classList.remove('hidden');
      btn.textContent = `해금하기 (${c.cost})`;
      btn.disabled = save.coins < c.cost;
    }
    $('startHint').textContent = un ? '탭하여 시작' : '해금 후 시작할 수 있어요';
    if (notify) this.h.onCharacterChange(c.id, un);
  }

  get selectedId() {
    return this.cur().id;
  }
  get selectedUnlocked() {
    return this.isUnlocked();
  }

  showStart() {
    this.over.classList.add('hidden');
    this.start.classList.remove('hidden');
    $('muteBtn').classList.remove('hidden');
    this.refreshChar(true);
  }

  showPlaying() {
    this.start.classList.add('hidden');
    this.over.classList.add('hidden');
  }

  showOver(score: number, best: number, coins: number, newBest: boolean, reason: string) {
    $('overTitle').textContent = reason;
    $('overScore').textContent = String(score);
    $('overBest').textContent = String(best);
    $('overCoins').textContent = String(coins);
    $('newBest').classList.toggle('hidden', !newBest);
    this.overAt = performance.now();
    this.over.classList.remove('hidden');
  }

  toast(msg: string) {
    const t = $('toast');
    t.textContent = msg;
    t.classList.remove('hidden');
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => t.classList.add('hidden'), 1600);
  }
}
