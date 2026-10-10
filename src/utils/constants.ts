// 밸런스/튜닝 상수는 전부 여기에 모읍니다.

export const TILE = 1;

// ── 월드 ──────────────────────────────────────────────
export const PLAY_HALF = 4; // 이동 가능한 열: -4 ~ +4 (9칸)
export const LANE_HALF = 30; // 차/통나무가 움직이는 반폭 (화면 밖에서 생성/소멸)
export const LANE_PERIOD = LANE_HALF * 2 + 10; // 한 바퀴 길이
export const ROWS_AHEAD = 18; // 플레이어 앞쪽으로 유지할 행 수
export const ROWS_BEHIND = 16; // 카메라 뒤쪽으로 유지할 행 수(이보다 뒤는 제거)
export const SAFE_START_ROWS = 6; // 시작 시 항상 안전한 잔디 줄 수
export const START_FILL_BEHIND = 10; // 시작 지점 뒤쪽 장식 잔디

// 행 종류 연속 제한
export const MAX_RUN = { grass: 4, road: 4, river: 3, rail: 2 } as const;
export const MAX_HAZARD_CHAIN = 7; // 잔디 없이 이어질 수 있는 최대 위험 줄 수

// 행 종류 가중치 (점수가 오르면 river/rail 비중이 조금 증가)
export const ROW_WEIGHTS = { grass: 3.2, road: 4, river: 2.4, rail: 1.1 };
export const ROW_WEIGHT_GROWTH = { river: 0.012, rail: 0.006, grassDecay: 0.006 }; // 점수당
export const SAME_KIND_BONUS = 1.6; // 같은 종류가 이어질 확률 보정

// 잔디
export const GRASS_OBSTACLE_CHANCE = 0.2; // 칸당 장애물 확률
export const GRASS_MAX_OBSTACLES = 4;
export const GRASS_SIDE_DENSITY = 0.45; // 플레이 영역 바깥 장식 밀도
export const COIN_CHANCE_GRASS = 0.14;
export const COIN_CHANCE_ROAD = 0.08;

// 도로
export const CAR_SPEED = { min: 2.2, max: 5.2 }; // 칸/초 (난이도 1.0배 기준)
export const CAR_GAP = { min: 3.4, max: 10 }; // 차 사이 간격 (난이도로 좁아짐)
export const TRUCK_CHANCE = 0.22;

// 강
export const LOG_SPEED = { min: 0.9, max: 2.3 };
export const LOG_LENGTHS = [2, 3, 4];
export const LOG_GAP = { min: 1.6, max: 4.2 };
export const LOG_STAND_MARGIN = 0.2; // 통나무 가장자리 여유(플레이어에게 유리)
export const DRIFT_DEATH_X = PLAY_HALF + 1.6; // 통나무에 실려 이 밖으로 나가면 사망

// 선로
export const TRAIN_SPEED = 30;
export const TRAIN_CARS = [5, 7, 9];
export const TRAIN_CAR_LEN = 2.2;
export const RAIL_IDLE = { min: 2.5, max: 6 }; // 기차가 없는 시간(초)
export const RAIL_WARN = 1.6; // 경고등 점등 시간(초)

// ── 난이도 ────────────────────────────────────────────
export const DIFFICULTY = {
  rampScore: 180, // 이 점수에서 최대 난이도
  speedMaxMul: 1.7, // 차/통나무 속도 최대 배율(상한)
  gapMinMul: 0.78, // 간격 축소 최대치(상한)
  cameraSpeedBase: 0.55, // 카메라 자동 전진 속도(행/초)
  cameraSpeedMax: 1.25,
};

// ── 판정 ──────────────────────────────────────────────
export const HITBOX_SCALE = 0.85;
export const PLAYER_HALF = 0.34;

// ── 플레이어 / 카메라 ─────────────────────────────────
export const HOP_TIME = 0.12;
export const HOP_HEIGHT = 0.6;
export const SWIPE_THRESHOLD = 20; // px
export const CAMERA_YAW = Math.PI / 4;
export const CAMERA_PITCH = (35 * Math.PI) / 180;
export const CAMERA_DISTANCE = 60;
export const VIEW_HALF_WIDTH_PORTRAIT = 5.6; // 세로 화면에서 화면 반폭(월드 단위)
export const VIEW_HALF_HEIGHT_LANDSCAPE = 7.5;
export const CAMERA_LEAD = 2.4; // 카메라 중심이 플레이어보다 앞서는 행 수
export const CAMERA_FOLLOW = 3.2; // 따라가는 부드러움
export const CAMERA_DEATH_BEHIND = 6.2; // 카메라 중심보다 이만큼 뒤로 밀리면 사망(화면 아래로 이탈)
export const CAMERA_MIN_BEHIND = 5; // 뒤로 이동 가능한 한계

// ── 코인 / 캐릭터 ────────────────────────────────────
export const CHARACTERS = [
  { id: 'chicken', name: '병아리 닭', cost: 0 },
  { id: 'cat', name: '고양이', cost: 25 },
  { id: 'frog', name: '개구리', cost: 50 },
  { id: 'robot', name: '로봇', cost: 90 },
  { id: 'panda', name: '판다', cost: 140 },
] as const;

// ── 저장 키 ───────────────────────────────────────────
export const STORAGE_KEY = 'crossyroads.v1';

// ── 팔레트 (파스텔) ───────────────────────────────────
export const COLORS = {
  sky: 0xbfe6ff,
  grassA: 0x9be37a,
  grassB: 0x8ad66b,
  road: 0x6e7684,
  roadLine: 0xf3f0e4,
  water: 0x5ec8f2,
  waterLight: 0x8adcf8,
  rail: 0x9a8f86,
  railMetal: 0xc7ccd4,
  trunk: 0x9b6b43,
  leaf: 0x4fbf6b,
  leafDark: 0x3fa85a,
  rock: 0xb8bcc6,
  log: 0xb07a4a,
  logEnd: 0xd6a06d,
  coin: 0xffd23f,
};
export const CAR_COLORS = [0xff6b6b, 0xffb84d, 0x6bcB77, 0x4d96ff, 0xb983ff, 0xff8fb8, 0xf4f1de];
