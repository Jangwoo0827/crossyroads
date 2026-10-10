export type RowKind = 'grass' | 'road' | 'river' | 'rail';
export type CarType = 'sedan' | 'taxi' | 'van' | 'truck';
export type ObstacleType = 'tree' | 'rock' | 'bush';

export interface Obstacle {
  col: number;
  type: ObstacleType;
  h: number; // 높이 변화(0~1)
}
export interface GrassSpec {
  kind: 'grass';
  index: number;
  obstacles: Obstacle[];
  side: Obstacle[];
  coins: number[];
}
export interface CarSpec {
  offset: number;
  type: CarType;
  color: number;
}
export interface RoadSpec {
  kind: 'road';
  index: number;
  dir: 1 | -1;
  speed: number;
  cars: CarSpec[];
  coins: number[];
}
export interface LogSpec {
  offset: number;
  len: number;
}
export interface RiverSpec {
  kind: 'river';
  index: number;
  dir: 1 | -1;
  speed: number;
  logs: LogSpec[];
}
export interface RailSpec {
  kind: 'rail';
  index: number;
  dir: 1 | -1;
  idle: number;
  trainCars: number;
  phase: number;
}
export type RowSpec = GrassSpec | RoadSpec | RiverSpec | RailSpec;
