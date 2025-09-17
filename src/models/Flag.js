import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

export default class Flag {
  constructor(scene, x, y, disposeObject) {
    this.x = x;
    this.y = y;
    this.flag = null;
    this.disposeObject = disposeObject;

    this.loadingPromise = new Promise((resolve, reject) => {
      loader.load(
        "/assets/flag/scene144.gltf",
        (gltf) => {
          this.flag = gltf.scene;
          scene.add(this.flag);
          this.flag.scale.set(1, 1, 1);
          this.flag.position.set(this.x, 1, this.y);
          this.flag.rotation.y = -1.5;
          resolve(this.flag);
        },
        undefined,
        reject
      );
    });
  }

  getObject() {
    return this.loadingPromise;
  }

  dispose() {
    if (this.flag && this.disposeObject) {
      this.disposeObject(this.flag);
    }
  }
}