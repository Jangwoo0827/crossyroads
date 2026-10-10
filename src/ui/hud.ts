export class Hud {
  private root = document.getElementById('hud')!;
  private score = document.getElementById('score')!;
  private coins = document.getElementById('coinCount')!;
  private lastScore = -1;
  private lastCoins = -1;

  show(v: boolean) {
    this.root.classList.toggle('hidden', !v);
  }
  set(score: number, coins: number) {
    if (score !== this.lastScore) {
      this.lastScore = score;
      this.score.textContent = String(score);
    }
    if (coins !== this.lastCoins) {
      this.lastCoins = coins;
      this.coins.textContent = String(coins);
    }
  }
}
