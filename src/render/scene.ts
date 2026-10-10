import * as THREE from 'three';
import { COLORS } from '../utils/constants';

export interface SceneRig {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  world: THREE.Group;
  sun: THREE.DirectionalLight;
  resize(): void;
  setQuality(level: 0 | 1 | 2): void;
  followSun(target: THREE.Vector3): void;
}

const SUN_OFFSET = new THREE.Vector3(-6, 17, 9);

export function createScene(canvas: HTMLCanvasElement): SceneRig {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  const isCoarse = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  let quality: 0 | 1 | 2 = isCoarse ? 1 : 2;

  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.setClearColor(COLORS.sky);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(COLORS.sky);

  const hemi = new THREE.HemisphereLight(0xffffff, 0xcfe8c0, 1.15);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight(0xfff4e0, 1.9);
  sun.castShadow = true;
  const s = 15;
  sun.shadow.camera.left = -s;
  sun.shadow.camera.right = s;
  sun.shadow.camera.top = s;
  sun.shadow.camera.bottom = -s;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far = 60;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.03;
  sun.shadow.radius = 3;
  scene.add(sun, sun.target);

  const world = new THREE.Group();
  scene.add(world);

  function applyQuality() {
    const dpr = window.devicePixelRatio || 1;
    const ratio = quality === 2 ? Math.min(dpr, 2) : quality === 1 ? Math.min(dpr, 1.5) : 1;
    renderer.setPixelRatio(ratio);
    const size = quality === 2 ? 2048 : quality === 1 ? 1024 : 512;
    if (sun.shadow.mapSize.x !== size) {
      sun.shadow.mapSize.set(size, size);
      sun.shadow.map?.dispose();
      sun.shadow.map = null;
    }
    renderer.shadowMap.enabled = true;
    resize();
  }

  function resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    renderer.setSize(w, h, false);
    window.dispatchEvent(new CustomEvent('game-resize', { detail: { w, h } }));
  }

  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', () => setTimeout(resize, 200));
  applyQuality();

  return {
    renderer,
    scene,
    world,
    sun,
    resize,
    setQuality(level) {
      if (level === quality) return;
      quality = level;
      applyQuality();
    },
    followSun(target) {
      sun.target.position.copy(target);
      sun.position.copy(target).add(SUN_OFFSET);
    },
  };
}
