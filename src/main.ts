// src/main.ts
import * as PIXI from "pixi.js";
import * as Projection from "pixi-projection";
import { Game } from "./game/Game";

function bootstrap() {
  const app = new PIXI.Application({
    resizeTo: window,         // renderer matches browser/phone size
    backgroundColor: 0x000000,
    antialias: true,
  });

  const container = document.getElementById("app");
  if (!container) {
    throw new Error("No #app element found");
  }

  container.appendChild(app.view as HTMLCanvasElement);

  // Debug: check that pixi-projection is loaded
  console.log("pixi-projection exports:", Object.keys(Projection));

  // Use current renderer size as our initial "design" size
  const width = app.renderer.width;
  const height = app.renderer.height;

  const game = new Game(app, { width, height });

  // Handle window / phone resize
  function handleResize() {
    const newWidth = window.innerWidth;
    const newHeight = window.innerHeight;

    app.renderer.resize(newWidth, newHeight);

    // Let the game know so it can scale & center its root container
    (app.stage as any).emit("resize", {
      width: newWidth,
      height: newHeight,
    });
  }

  window.addEventListener("resize", handleResize);
  // Call once on startup (some mobile browsers report size after first paint)
  handleResize();
}

bootstrap();
