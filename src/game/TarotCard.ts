// src/game/TarotCard.ts
import * as PIXI from "pixi.js";
import gsap from "gsap";
import { getMultiplierColor } from "../config/multipliers";

const CARD_WIDTH = 120;
const CARD_HEIGHT = 180;

export class TarotCard extends PIXI.Container {
  public multiplier = 1;
  public isRevealed = false;

  private back: PIXI.Sprite;
  private front: PIXI.Graphics;
  private label: PIXI.Text;

  private baseScale = 1;
  private hoverScale = 1.06;

  constructor() {
    super();

    // BACK – SVG texture card back
    // Make sure download.svg is in /public so this path works
    const backTexture = PIXI.Texture.from("/download.svg");
    this.back = new PIXI.Sprite(backTexture);
    this.back.anchor.set(0.5);
    this.back.width = CARD_WIDTH;
    this.back.height = CARD_HEIGHT;
    this.addChild(this.back);

    // FRONT – will be recolored based on multiplier
    this.front = new PIXI.Graphics();
    this.drawFront(0xf6f2e9); // default
    this.front.visible = false;
    this.addChild(this.front);

    // Multiplier label on front
    this.label = new PIXI.Text("x1", {
      fill: 0x2c3e50,
      fontFamily: "Arial",
      fontWeight: "bold",
      fontSize: 36,
      align: "center",
      dropShadow: true,
      dropShadowColor: "#000000",
      dropShadowBlur: 4,
      dropShadowDistance: 3,
    });
    this.label.anchor.set(0.5);
    this.label.position.set(0, 0);
    this.label.visible = false;
    this.addChild(this.label);

    // Soft shadow under card
    const shadow = new PIXI.Graphics();
    shadow.beginFill(0x000000, 0.35);
    shadow.drawRoundedRect(
      -CARD_WIDTH / 2,
      -CARD_HEIGHT / 2,
      CARD_WIDTH,
      CARD_HEIGHT,
      16,
    );
    shadow.endFill();
    shadow.position.set(4, 6);
    shadow.zIndex = -1;
    this.addChildAt(shadow, 0);

    this.interactive = true;
    (this as any).buttonMode = true;

    this.on("pointerover", () => this.onHover(true));
    this.on("pointerout", () => this.onHover(false));
  }

  private drawFront(fillColor: number): void {
    this.front.clear();
    this.front.lineStyle(3, 0x9b59ff);
    this.front.beginFill(fillColor);
    this.front.drawRoundedRect(
      -CARD_WIDTH / 2,
      -CARD_HEIGHT / 2,
      CARD_WIDTH,
      CARD_HEIGHT,
      16,
    );
    this.front.endFill();
  }

  private onHover(hovering: boolean): void {
    const targetScale = hovering ? this.hoverScale : this.baseScale;

    gsap.to(this.scale, {
      x: targetScale,
      y: targetScale,
      duration: 0.12,
      ease: "sine.out",
    });
  }

  setMultiplier(multiplier: number): void {
    this.multiplier = multiplier;
    this.label.text = `x${multiplier}`;
    const color = getMultiplierColor(multiplier);
    this.drawFront(color);
  }

  resetVisual(): void {
    this.isRevealed = false;
    this.scale.set(this.baseScale);
    this.back.visible = true;
    this.front.visible = false;
    this.label.visible = false;
  }

  /**
   * Simple flip animation: scale X to 0, swap front/back, scale back.
   */
  createFlipTimeline(flipDuration: number = 0.15): gsap.core.Timeline {
    const tl = gsap.timeline({
      onComplete: () => {
        this.isRevealed = true;
      },
    });

    // 1) shrink to an edge
    tl.to(this.scale, {
      x: 0,
      duration: flipDuration,
      ease: "power2.in",
      onComplete: () => {
        this.back.visible = false;
        this.front.visible = true;
        this.label.visible = true;
      },
    });

    // 2) expand back
    tl.to(this.scale, {
      x: this.baseScale,
      duration: flipDuration,
      ease: "power2.out",
    });

    return tl;
  }
}
