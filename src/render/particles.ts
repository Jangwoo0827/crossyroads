import * as THREE from 'three';

const MAX = 160;

/** InstancedMesh 하나로 처리하는 박스 파티클 풀 */
export class Particles {
  readonly mesh: THREE.InstancedMesh;
  private pos = new Float32Array(MAX * 3);
  private vel = new Float32Array(MAX * 3);
  private life = new Float32Array(MAX);
  private maxLife = new Float32Array(MAX);
  private size = new Float32Array(MAX);
  private cursor = 0;
  private dummy = new THREE.Object3D();
  private color = new THREE.Color();

  constructor() {
    const geo = new THREE.BoxGeometry(1, 1, 1);
    const mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    this.mesh = new THREE.InstancedMesh(geo, mat, MAX);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;
    this.mesh.castShadow = false;
    for (let i = 0; i < MAX; i++) {
      this.mesh.setColorAt(i, this.color.set(0xffffff));
      this.hide(i);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }

  private hide(i: number) {
    this.dummy.position.set(0, -100, 0);
    this.dummy.scale.setScalar(0);
    this.dummy.rotation.set(0, 0, 0);
    this.dummy.updateMatrix();
    this.mesh.setMatrixAt(i, this.dummy.matrix);
  }

  burst(
    x: number,
    y: number,
    z: number,
    count: number,
    colors: number[],
    opts: { speed?: number; up?: number; life?: number; size?: number; spread?: number } = {},
  ) {
    const { speed = 3, up = 4, life = 0.7, size = 0.14, spread = 0.2 } = opts;
    for (let n = 0; n < count; n++) {
      const i = this.cursor;
      this.cursor = (this.cursor + 1) % MAX;
      const a = Math.random() * Math.PI * 2;
      const s = speed * (0.35 + Math.random() * 0.65);
      this.pos[i * 3] = x + (Math.random() - 0.5) * spread;
      this.pos[i * 3 + 1] = y;
      this.pos[i * 3 + 2] = z + (Math.random() - 0.5) * spread;
      this.vel[i * 3] = Math.cos(a) * s;
      this.vel[i * 3 + 1] = up * (0.5 + Math.random() * 0.7);
      this.vel[i * 3 + 2] = Math.sin(a) * s;
      this.maxLife[i] = this.life[i] = life * (0.7 + Math.random() * 0.6);
      this.size[i] = size * (0.7 + Math.random() * 0.8);
      this.mesh.setColorAt(i, this.color.set(colors[Math.floor(Math.random() * colors.length)]));
    }
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  update(dt: number) {
    let any = false;
    for (let i = 0; i < MAX; i++) {
      if (this.life[i] <= 0) continue;
      any = true;
      this.life[i] -= dt;
      if (this.life[i] <= 0) {
        this.hide(i);
        continue;
      }
      this.vel[i * 3 + 1] -= 14 * dt;
      this.pos[i * 3] += this.vel[i * 3] * dt;
      this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt;
      this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      const k = this.life[i] / this.maxLife[i];
      this.dummy.position.set(this.pos[i * 3], this.pos[i * 3 + 1], this.pos[i * 3 + 2]);
      this.dummy.scale.setScalar(this.size[i] * Math.min(1, k * 2.5));
      this.dummy.rotation.set(k * 6, k * 4, 0);
      this.dummy.updateMatrix();
      this.mesh.setMatrixAt(i, this.dummy.matrix);
    }
    if (any) this.mesh.instanceMatrix.needsUpdate = true;
  }

  clear() {
    for (let i = 0; i < MAX; i++) {
      this.life[i] = 0;
      this.hide(i);
    }
    this.mesh.instanceMatrix.needsUpdate = true;
  }
}
