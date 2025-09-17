import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

export default class Boat {
  constructor(scene, color, boatId) { // recieve scene
    this.color = color;
    this.boat = null;

    let boatModelPath;
    switch (boatId) {
        case "1000": boatModelPath = "/assets/boat/scenelaser.gltf"; break;
        case "1001": boatModelPath = "/assets/boat/scenebyte.gltf"; break;
        case "1002": boatModelPath = "/assets/boat/sceneoptimist.gltf"; break;
        case "1011": boatModelPath = "/assets/boat/scenemegabyte.gltf"; break;
        case "1012": boatModelPath = "/assets/boat/sceneliberty.gltf"; break;
        case "1013": boatModelPath = "/assets/boat/sceneliberty.gltf"; break;
        case "1014": boatModelPath = "/assets/boat/scene29er.gltf"; break;
        default: boatModelPath = "/assets/boat/scene.gltf"; break;
}

    this.loadingPromise = new Promise((resolve, reject) => {
      loader.load(
        boatModelPath,
        (gltf) => {
          this.boat = gltf.scene;
          this.boat.scale.set(2, 2, 2);
          this.boat.position.set(0, -10, 0);
          this.boat.rotation.y = -1.5;

          this.boat.traverse((child) => {
            if (child.isMesh) {
              child.material = child.material.clone();
              child.material.color.set(this.color);
              child.material.transparent = false;
              child.material.needsUpdate = true;
            }
          });

          scene.add(this.boat);
          resolve(this.boat);
        },
        undefined,
        reject
      );
    });
  }

  getObject() {
    return this.loadingPromise;
  }
}