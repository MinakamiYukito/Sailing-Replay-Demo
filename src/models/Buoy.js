import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

export default class Buoy {
  constructor(scene, x, y, disposeObject) {
    this.x = x;
    this.y = y;
    this.Buoy = null;
    this.disposeObject = disposeObject;

    this.loadingPromise = new Promise((resolve, reject) => {
      loader.load(
        "/assets/buoy/scene.gltf",
        (gltf) => {
          this.Buoy = gltf.scene;
          scene.add(this.Buoy);
          this.Buoy.scale.set(2, 2, 2);
          this.Buoy.position.set(this.x, 0, this.y);
          this.Buoy.rotation.y = -1.5;
          resolve(this.Buoy);
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
    if (this.Buoy && this.disposeObject) {
      this.disposeObject(this.Buoy);
    }
  }
}