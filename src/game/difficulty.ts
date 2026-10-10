import { DIFFICULTY } from '../utils/constants';
import { clamp, lerp } from '../utils/math';

export const difficulty01 = (score: number) => clamp(score / DIFFICULTY.rampScore, 0, 1);
export const cameraSpeed = (score: number) => lerp(DIFFICULTY.cameraSpeedBase, DIFFICULTY.cameraSpeedMax, difficulty01(score));
