import * as PIXI from "pixi.js";
import gsap from "gsap";

export interface ResultData {
  bet: number;
  multipliers: number[];
  product: number;
  payout: number;
}

export class ResultPopup extends PIXI.Container {
  private panel: PIXI.Graphics;
  private text: PIXI.Text;

  constructor() {
    super();

    // Start hidden
    this.visible = false;
    this.alpha = 1;
    this.scale.set(1);

    // Dark panel with purple border (casino-ish)
    this.panel = new PIXI.Graphics();
    this.panel.beginFill(0x101020);     // dark navy
    this.panel.lineStyle(3, 0x9b59ff);  // purple border
    this.panel.drawRoundedRect(-180, -120, 360, 240, 24);
    this.panel.endFill();
    this.addChild(this.panel);

    // Centered text
    this.text = new PIXI.Text("", {
      fill: 0xffffff,
      fontFamily: "Arial",
      fontSize: 18,
      align: "center",
      lineHeight: 26,
    });
    this.text.anchor.set(0.5);
    this.addChild(this.text);
  }

  show(result: ResultData, onComplete: () => void): void {
    const { bet, multipliers, product, payout } = result;

    this.text.text =
      `Bet: ${bet.toFixed(2)}\n` +
      `Multipliers: ${multipliers.join(" × ")}\n` +
      `Product: ${product}\n` +
      `Payout: ${payout.toFixed(2)}`;

    // Reset visual state
    this.visible = true;
    this.alpha = 1;
    this.scale.set(0.5); // start smaller for a little pop

    // Simple pop-in animation on scale only
    gsap.to(this.scale, {
      x: 1.05,
      y: 1.05,
      duration: 0.3,
      ease: "back.out(1.7)",
    });

    // Auto-hide after 1.5s, then let the game go back to Idle
    setTimeout(() => {
      this.visible = false;
      onComplete();
    }, 1500);
  }
}
