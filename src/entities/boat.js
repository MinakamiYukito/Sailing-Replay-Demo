import * as BOATGLTF from "../assets/boat/scene.gltf";

export class Boat {
  constructor(loader, scene) {
    loader.load(BOATGLTF, (gltf) => {
      scene.add(gltf.scene);
      gltf.scene.scale.set(5, 5, 5);
      // gltf.scene.position.set(5, 3, 50);
      // gltf.scene.rotation.y = 1.5;
      gltf.scene.position.set(-17.3285, 3, -29.7828);
      gltf.scene.rotation.y = 0;
      this.boat = gltf.scene;
      this.speed = {
        vel: 0,
        rot: 0,
      };
    });
  }

  stop() {
    this.speed.vel = 0;
    this.speed.rot = 0;
  }

  update() {
    if (this.boat) {
      this.boat.rotation.y += this.speed.rot;
      this.boat.translateX(this.speed.vel);
      //print position x,y,z
      // console.log(this.boat.position);
    }
  }
}
