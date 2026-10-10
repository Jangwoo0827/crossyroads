import * as THREE from 'three';
import { colorMat } from '../render/materials';
import { COLORS } from '../utils/constants';

const geo = new THREE.CylinderGeometry(0.27, 0.27, 0.09, 14);
geo.rotateX(Math.PI / 2);
const rim = new THREE.CylinderGeometry(0.3, 0.3, 0.06, 14);
rim.rotateX(Math.PI / 2);

export class Coin {
  readonly mesh: THREE.Group;
  collected = false;
  private phase = Math.random() * 6;
  constructor(readonly col: number, private baseY: number) {
    this.mesh = new THREE.Group();
    const face = new THREE.Mesh(geo, colorMat(COLORS.coin));
    const edge = new THREE.Mesh(rim, colorMat(0xf0a500));
    face.castShadow = true;
    this.mesh.add(edge, face);
    this.mesh.position.set(col, baseY + 0.55, 0);
  }
  update(time: number) {
    if (this.collected) return;
    this.mesh.rotation.y = time * 3 + this.phase;
    this.mesh.position.y = this.baseY + 0.55 + Math.sin(time * 3 + this.phase) * 0.1;
  }
  take() {
    this.collected = true;
    this.mesh.visible = false;
  }
}
