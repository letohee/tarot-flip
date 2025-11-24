// src/main.ts
import * as PIXI from "pixi.js";
import * as Projection from "pixi-projection";
import { Game } from "./game/Game";

function bootstrap() {
  const app = new PIXI.Application({
    // 👇 This makes the renderer size follow the browser window
    resizeTo: window,
    backgroundColor: 0x000000,
    antialias: true,
  });

  const container = document.getElementById("app");
  if (!container) {
    throw new Error("No #app element found");
  }

  container.appendChild(app.view as HTMLCanvasElement);

  // Debug: see what pixi-projection exports (optional)
  console.log("pixi-projection exports:", Object.keys(Projection));

  // Use the actual renderer size (which now matches the window)
  new Game(app, {
    width: app.renderer.width,
    height: app.renderer.height,
  });
}

bootstrap();
