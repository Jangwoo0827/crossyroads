// SuperDialer(안드로이드 WebView) 안에서 실행될 때만 존재하는 점수 브릿지. 브라우저에서는 조용히 무시된다.
interface NativeBridge {
  getBest(): number;
  submitScore(score: number): void;
}
const native = (): NativeBridge | undefined => (window as unknown as { Native?: NativeBridge }).Native;

export function nativeBest(): number {
  try {
    return (native()?.getBest() ?? 0) | 0;
  } catch {
    return 0;
  }
}
export function nativeSubmit(score: number) {
  try {
    native()?.submitScore(score | 0);
  } catch {
    /* 브릿지 없음 */
  }
}
