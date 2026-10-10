import * as THREE from 'three';
import {
  CAMERA_DISTANCE,
  CAMERA_FOLLOW,
  CAMERA_LEAD,
  CAMERA_PITCH,
  CAMERA_YAW,
  DIFFICULTY,
  VIEW_HALF_HEIGHT_LANDSCAPE,
  VIEW_HALF_WIDTH_PORTRAIT,
} from '../utils/constants';
import { lerp } from '../utils/math';

/**
 * 대각선(yaw 45°, pitch 35°) 직교 카메라.
 * camRow : 카메라 중심의 행 번호(실수). 앞(증가 방향)으로만 움직인다.
 */
export class CameraRig {
  readonly camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 400);
  /** 카메라가 바라보는 지점(월드) */
  readonly target = new THREE.Vector3();
  camRow = 0;
  camX = 0;
  private shakeAmp = 0;
  private shakeT = 0;
  private offset = new THREE.Vector3();

  constructor() {
    const h = Math.sin(CAMERA_PITCH) * CAMERA_DISTANCE;
    const r = Math.cos(CAMERA_PITCH) * CAMERA_DISTANCE;
    this.offset.set(Math.sin(CAMERA_YAW) * r, h, Math.cos(CAMERA_YAW) * r);
    window.addEventListener('game-resize', ((e: CustomEvent<{ w: number; h: number }>) => {
      this.resize(e.detail.w, e.detail.h);
    }) as EventListener);
    this.resize(window.innerWidth, window.innerHeight);
    this.reset(0, 0);
  }

  resize(w: number, h: number) {
    const aspect = w / Math.max(1, h);
    let halfW: number;
    let halfH: number;
    if (aspect < 1) {
      halfW = VIEW_HALF_WIDTH_PORTRAIT;
      halfH = halfW / aspect;
    } else {
      halfH = VIEW_HALF_HEIGHT_LANDSCAPE;
      halfW = halfH * aspect;
    }
    const c = this.camera;
    c.left = -halfW;
    c.right = halfW;
    c.top = halfH;
    c.bottom = -halfH;
    c.updateProjectionMatrix();
  }

  reset(row: number, x: number) {
    this.camRow = row + CAMERA_LEAD;
    this.camX = x;
    this.shakeAmp = 0;
    this.apply(0);
  }

  /** 난이도에 따른 카메라 자동 전진 속도(행/초) */
  static autoSpeed(difficulty01: number) {
    return lerp(DIFFICULTY.cameraSpeedBase, DIFFICULTY.cameraSpeedMax, difficulty01);
  }

  update(dt: number, playerRow: number, playerX: number, autoAdvance: boolean, autoSpeed: number) {
    if (autoAdvance) this.camRow += autoSpeed * dt;
    const desired = playerRow + CAMERA_LEAD;
    if (desired > this.camRow) this.camRow += (desired - this.camRow) * Math.min(1, dt * CAMERA_FOLLOW);
    this.camX += (playerX - this.camX) * Math.min(1, dt * 4);
    this.apply(dt);
  }

  shake(amount: number) {
    this.shakeAmp = Math.max(this.shakeAmp, amount);
    this.shakeT = 0;
  }

  private apply(dt: number) {
    this.target.set(this.camX, 0, -this.camRow);
    let sx = 0;
    let sy = 0;
    if (this.shakeAmp > 0.001) {
      this.shakeT += dt;
      sx = (Math.random() - 0.5) * 2 * this.shakeAmp;
      sy = (Math.random() - 0.5) * 2 * this.shakeAmp;
      this.shakeAmp *= Math.pow(0.002, dt); // 빠르게 감쇠
    }
    this.camera.position.copy(this.target).add(this.offset);
    this.camera.lookAt(this.target);
    if (sx || sy) {
      this.camera.translateX(sx);
      this.camera.translateY(sy);
    }
  }
}
