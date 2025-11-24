declare module "pixi-projection" {
  import type { Container, Sprite, Texture } from "pixi.js";

  // Simple approximation of the real classes so TS is happy
  export class Container2d extends Container {
    // extra projection properties exposed by the plugin
    euler: { x: number; y: number; z: number };
    position3d: { x: number; y: number; z: number };
  }

  export class Sprite2d extends Sprite {
    constructor(texture?: Texture);
  }
}
