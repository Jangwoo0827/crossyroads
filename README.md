# 횡단 대작전

모바일 브라우저에서 즐기는 **아이소메트릭 길 건너기 러너**. 한 칸씩 전진하며 차, 기차, 강물을 피해 최대한 멀리 가세요.
외부 에셋(모델/텍스처/이미지/사운드) 없이 코드로 만든 박스형(voxel) 도형과 Web Audio 효과음만 사용합니다.

- Vite + TypeScript + Three.js (React 없음, CDN 의존 없음)
- 모바일 세로 화면 우선, 데스크톱 키보드 지원

## 실행

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # dist/ 생성 (타입체크 포함)
npm run typecheck    # TypeScript 에러 확인
```

## 조작법

| 환경 | 앞으로 | 좌 / 우 / 뒤 |
| --- | --- | --- |
| 모바일 | 탭 | 좌·우·아래 스와이프 (20px 이상), 위 스와이프도 앞으로 |
| 데스크톱 | ↑ / W / 스페이스 | ← → ↓ / A D S |

이동 중 입력은 1개까지 버퍼링됩니다. 시작 화면에서 ◀ ▶ 로 캐릭터를 고르고, 아무 곳이나 탭하면 시작합니다.

## 규칙 요약

- **카메라가 천천히 자동 전진**합니다. 가만히 있으면 화면 밖으로 밀려나 게임 오버.
- **잔디**: 나무/바위는 통과 불가, 안전지대. **도로**: 차에 닿으면 사망. **강**: 통나무 위에서만 생존(같이 이동, 화면 밖으로 밀려나면 사망). **선로**: 빨간 경고등이 깜빡인 뒤 기차가 빠르게 지나감.
- 같은 종류의 줄은 길게 이어지지 않습니다(강 최대 3, 도로 최대 4, 선로 최대 2). 시작 6줄은 항상 안전한 잔디.
- 점수 = 전진한 거리. 멀리 갈수록 차/통나무 속도와 밀도, 카메라 속도가 서서히 올라가며 상한이 있습니다.
- 코인을 모아 캐릭터 해금(병아리 닭 · 고양이 · 개구리 · 로봇 · 판다). 최고 점수/코인/해금/선택/음소거는 `localStorage` 에 저장됩니다.
- 충돌은 격자 행 + 연속 x 좌표 AABB, 히트박스 85%.

## 밸런스 조정

속도, 간격, 난이도 곡선, 코인 확률, 카메라, 캐릭터 가격 등 모든 숫자 상수는 [`src/utils/constants.ts`](src/utils/constants.ts) 한 곳에 있습니다.

## 폰에서 테스트 (같은 와이파이)

```bash
npm run dev:host      # = vite --host
```

터미널에 표시되는 `Network: http://192.168.x.x:5173/` 주소를 폰 브라우저에서 엽니다. (PC 방화벽에서 5173 포트 허용 필요)
소리는 첫 터치 이후에 켜집니다. iOS는 무음 모드이면 효과음이 나지 않을 수 있습니다.

## 배포

### GitHub Pages (권장)

1. 저장소 **Settings → Pages → Source** 를 **GitHub Actions** 로 설정
2. `main` 브랜치에 푸시하면 `.github/workflows/deploy.yml` 이 빌드해서 배포합니다.
3. `vite.config.ts` 의 `base: './'` 덕분에 `https://<사용자>.github.io/crossyroads/` 하위 경로에서도 그대로 동작합니다.

### Netlify

`npm run build` 후 `dist/` 폴더를 Netlify에 드래그하거나, 저장소를 연결해 Build command `npm run build`, Publish directory `dist` 로 설정합니다.

## SuperDialer(안드로이드 앱)에 내장

`window.Native.getBest()` / `window.Native.submitScore(score)` 브릿지가 있으면 자동으로 점수를 연동하고, 없으면(일반 브라우저) 조용히 무시합니다.
빌드 결과(`dist/`)를 앱의 `assets/games/crossyroads/` 에 넣고 `games.json` 에 등록하면 됩니다.

## 구조

```
src/
  main.ts            진입점, 게임 루프, 자동 화질 조정
  game/              state, loop, scoring, difficulty, game(전체 조립)
  world/             rowGenerator, rows/(grass·road·river·rail), obstacles, world
  entities/          player, characters, car, log, train, coin
  render/            scene, camera, materials, particles
  ui/                hud, screens(시작/게임오버/캐릭터), input
  utils/             storage, audio, constants, math, native
```

성능: 같은 모양은 지오메트리를 캐시해서 공유하고, 한 행의 장애물은 하나의 메시로 합칩니다. 카메라 뒤쪽 행은 제거(dispose)되어 오래 플레이해도 행 수가 일정합니다(약 36행). devicePixelRatio 는 최대 2, 프레임이 느리면 화질/그림자 해상도를 자동으로 낮춥니다.
