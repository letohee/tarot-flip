// src/ui/PayTable.ts
import * as PIXI from "pixi.js";
import gsap from "gsap";
import { MULTIPLIER_TABLE, getMultiplierColor } from "../config/multipliers";

export class PayTableOverlay extends PIXI.Container {
  private overlay: PIXI.Graphics;
  private panel: PIXI.Graphics;

  constructor(width: number, height: number) {
    super();

    this.visible = false;
    this.alpha = 0;

    // Full-screen dark overlay to block clicks behind
    this.overlay = new PIXI.Graphics();
    this.overlay.beginFill(0x000000, 0.6);
    this.overlay.drawRect(0, 0, width, height);
    this.overlay.endFill();
    this.overlay.interactive = true;
    this.overlay.on("pointertap", () => this.hide()); // click outside to close
    this.addChild(this.overlay);

    // Panel
    const panelWidth = 280;
    const panelHeight = 320;

    this.panel = new PIXI.Graphics();
    this.panel.beginFill(0x0f1c2b);
    this.panel.drawRoundedRect(
      -panelWidth / 2,
      -panelHeight / 2,
      panelWidth,
      panelHeight,
      16,
    );
    this.panel.endFill();
    this.panel.position.set(width / 2, height / 2);
    this.panel.interactive = true; // prevent overlay click through
    this.addChild(this.panel);

    const title = new PIXI.Text("Pay Table", {
      fill: 0xffffff,
      fontFamily: "Arial",
      fontSize: 20,
      fontWeight: "bold",
    });
    title.anchor.set(0, 0.5);
    title.position.set(this.panel.x - panelWidth / 2 + 16, this.panel.y - panelHeight / 2 + 28);
    this.addChild(title);

    const close = new PIXI.Text("✕", {
      fill: 0xffffff,
      fontFamily: "Arial",
      fontSize: 20,
    });
    close.anchor.set(1, 0.5);
    close.position.set(this.panel.x + panelWidth / 2 - 16, this.panel.y - panelHeight / 2 + 28);
    close.interactive = true;
(close as any).buttonMode = true;

    close.on("pointertap", () => this.hide());
    this.addChild(close);

    const headerCards = new PIXI.Text("Cards", {
      fill: 0xb0bec5,
      fontFamily: "Arial",
      fontSize: 14,
    });
    headerCards.anchor.set(0, 0.5);
    headerCards.position.set(this.panel.x - panelWidth / 2 + 20, this.panel.y - panelHeight / 2 + 60);
    this.addChild(headerCards);

    const headerChance = new PIXI.Text("Chance", {
      fill: 0xb0bec5,
      fontFamily: "Arial",
      fontSize: 14,
    });
    headerChance.anchor.set(1, 0.5);
    headerChance.position.set(this.panel.x + panelWidth / 2 - 20, this.panel.y - panelHeight / 2 + 60);
    this.addChild(headerChance);

    // Rows
    const startY = this.panel.y - panelHeight / 2 + 90;
    const rowHeight = 24;

    MULTIPLIER_TABLE.forEach((entry, index) => {
      const y = startY + index * rowHeight;

      // color square
      const swatch = new PIXI.Graphics();
      swatch.beginFill(getMultiplierColor(entry.value));
      swatch.drawRoundedRect(0, 0, 14, 14, 3);
      swatch.endFill();
      swatch.position.set(this.panel.x - panelWidth / 2 + 20, y - 7);
      this.addChild(swatch);

      // multiplier text
      const multText = new PIXI.Text(`${entry.value.toFixed(2)}x`, {
        fill: 0xffffff,
        fontFamily: "Arial",
        fontSize: 14,
      });
      multText.anchor.set(0, 0.5);
      multText.position.set(swatch.position.x + 20, y);
      this.addChild(multText);

      // chance text
      const chanceText = new PIXI.Text(`${entry.chance.toFixed(3)} %`, {
        fill: 0xffffff,
        fontFamily: "Arial",
        fontSize: 14,
      });
      chanceText.anchor.set(1, 0.5);
      chanceText.position.set(this.panel.x + panelWidth / 2 - 20, y);
      this.addChild(chanceText);
    });
  }

  show(): void {
    if (this.visible) return;
    this.visible = true;
    this.alpha = 0;
    gsap.to(this, { alpha: 1, duration: 0.25, ease: "sine.out" });
  }

  hide(): void {
    if (!this.visible) return;
    gsap.to(this, {
      alpha: 0,
      duration: 0.25,
      ease: "sine.in",
      onComplete: () => {
        this.visible = false;
      },
    });
  }

  toggle(): void {
    if (this.visible) this.hide();
    else this.show();
  }
}
