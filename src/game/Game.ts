// src/game/Game.ts
import * as PIXI from "pixi.js";
import gsap from "gsap";
import { TarotCard } from "./TarotCard";
import { GameState } from "./state";
import { pickWeightedMultiplier } from "../config/multipliers";
import { ResultPopup, ResultData } from "../ui/ResultPopup";
import { PayTableOverlay } from "../ui/PayTable";
// Helper so we can use buttonMode without fighting the TS types
function setButtonMode(obj: PIXI.DisplayObject): void {
  // pixi v7 supports `buttonMode`, but the typings we're using don't.
  (obj as any).buttonMode = true;
}

export interface GameOptions {
  width: number;
  height: number;
  bet?: number;
  balance?: number;
}

type SpeedMode = "normal" | "fast";

interface PersistedState {
  bet: number;
  balance: number;
}

export class Game {
  private app: PIXI.Application;
  private root: PIXI.Container;

  private state: GameState = GameState.Idle;

  private cards: TarotCard[] = [];
  private playButton!: PIXI.Graphics;
  private playLabel!: PIXI.Text;
  private statusText!: PIXI.Text;

  private resultPopup!: ResultPopup;
  private payTable!: PayTableOverlay;
  private winText!: PIXI.Text;

  // BET UI
  private bet: number;
  private betText!: PIXI.Text;
  private betMinusBtn!: PIXI.Graphics;
  private betPlusBtn!: PIXI.Graphics;
  private readonly minBet = 1;
  private readonly maxBet = 10;

  // BALANCE UI
  private balance: number;
  private balanceText!: PIXI.Text;

  // SPEED UI
  private speed: SpeedMode = "normal";
  private speedText!: PIXI.Text;

  // AUTO-PLAY
  private autoButton!: PIXI.Graphics;
  private autoLabel!: PIXI.Text;
  private readonly autoRoundsTarget = 10;
  private isAutoPlay = false;
  private autoRoundsRemaining = 0;
  private autoStopRequested = false;
  private autoSpeedBackup: SpeedMode = "normal";

  private currentRevealIndex = 0;
  private currentMultipliers: number[] = [];

  constructor(app: PIXI.Application, options: GameOptions) {
    this.app = app;
    this.root = new PIXI.Container();
    this.app.stage.addChild(this.root);

    const persisted = this.loadPersistentState();

    this.bet = persisted?.bet ?? options.bet ?? 1;
    this.balance = persisted?.balance ?? options.balance ?? 100;

    this.init(options.width, options.height);
  }

  // ---------- Persistence ----------

  private loadPersistentState(): PersistedState | null {
    if (typeof window === "undefined") return null;

    try {
      const raw = window.localStorage.getItem("tarot_state");
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (typeof data.bet === "number" && typeof data.balance === "number") {
        return { bet: data.bet, balance: data.balance };
      }
    } catch {
      // ignore
    }
    return null;
  }

  private savePersistentState(): void {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        "tarot_state",
        JSON.stringify({ bet: this.bet, balance: this.balance }),
      );
    } catch {
      // ignore
    }
  }

  // ---------- Init ----------

  private init(width: number, height: number): void {
    // BACKGROUND
    const bg = new PIXI.Graphics();
    bg.beginFill(0x080816);
    bg.drawRect(0, 0, width, height);
    bg.endFill();
    this.root.addChild(bg);

    const bgOverlay = new PIXI.Graphics();
    bgOverlay.beginFill(0x201040, 0.6);
    bgOverlay.drawCircle(width / 2, height * 0.2, width * 0.6);
    bgOverlay.endFill();
    this.root.addChild(bgOverlay);

    // TABLE
    const tableWidth = width * 0.8;
    const tableHeight = height * 0.6;

    const tableGlow = new PIXI.Graphics();
    tableGlow.beginFill(0x000000, 0.7);
    tableGlow.drawRoundedRect(
      (width - tableWidth) / 2 - 18,
      (height - tableHeight) / 2 - 14,
      tableWidth + 36,
      tableHeight + 28,
      48,
    );
    tableGlow.endFill();
    this.root.addChild(tableGlow);

    const table = new PIXI.Graphics();
    table.beginFill(0x064f2c);
    table.drawRoundedRect(0, 0, tableWidth, tableHeight, 40);
    table.endFill();
    table.x = (width - tableWidth) / 2;
    table.y = (height - tableHeight) / 2;
    this.root.addChild(table);

    const inner = new PIXI.Graphics();
    inner.beginFill(0x0b8a53, 0.25);
    inner.drawRoundedRect(20, 20, tableWidth - 40, tableHeight - 40, 30);
    inner.endFill();
    inner.x = table.x;
    inner.y = table.y;
    this.root.addChild(inner);

    // CARDS LAYER
    const cardLayer = new PIXI.Container();
    cardLayer.x = width / 2;
    cardLayer.y = height / 2 + 20;
    this.root.addChild(cardLayer);

    const spacing = 180;

    for (let i = 0; i < 3; i += 1) {
      const card = new TarotCard();
      card.x = (i - 1) * spacing;
      card.y = 0;
      card.rotation = (i - 1) * 0.08;

      card.on("pointertap", () => this.onCardClicked(card));

      this.cards.push(card);
      cardLayer.addChild(card);
    }

    // WIN SPLASH
    this.winText = new PIXI.Text("", {
      fill: 0xfff176,
      fontFamily: "Arial",
      fontWeight: "bold",
      fontSize: 26,
      dropShadow: true,
      dropShadowColor: "#000000",
      dropShadowBlur: 6,
      dropShadowDistance: 3,
    });
    this.winText.anchor.set(0.5);
    this.winText.position.set(width / 2, table.y + 30);
    this.winText.visible = false;
    this.root.addChild(this.winText);

    // TOP UI
    this.statusText = new PIXI.Text("Idle – adjust bet and press Play", {
      fill: 0xffffff,
      fontFamily: "Arial",
      fontSize: 18,
    });
    this.statusText.anchor.set(0.5);
    this.statusText.position.set(width / 2, 40);
    this.root.addChild(this.statusText);

    this.balanceText = new PIXI.Text(this.formatBalance(), {
      fill: 0xffffff,
      fontFamily: "Arial",
      fontSize: 18,
    });
    this.balanceText.anchor.set(0, 0);
    this.balanceText.position.set(20, 20);
    this.root.addChild(this.balanceText);

    this.speedText = new PIXI.Text(this.formatSpeed(), {
      fill: 0xffffff,
      fontFamily: "Arial",
      fontSize: 18,
    });
    this.speedText.anchor.set(1, 0);
    this.speedText.position.set(width - 20, 20);
  this.speedText.interactive = true;
  setButtonMode(this.speedText);
    this.speedText.on("pointertap", () => this.toggleSpeed());
    this.root.addChild(this.speedText);

    // "Pay Table" button (top-right under speed)
    const payTableBtn = new PIXI.Text("Pay Table", {
      fill: 0x90caf9,
      fontFamily: "Arial",
      fontSize: 14,
    });
    payTableBtn.anchor.set(1, 0);
    payTableBtn.position.set(width - 20, 45);
  payTableBtn.interactive = true;
  setButtonMode(payTableBtn);
    payTableBtn.on("pointertap", () => this.payTable.toggle());
    this.root.addChild(payTableBtn);

    // BET UI
    const betY = height - 130;

    this.betText = new PIXI.Text(this.formatBet(), {
      fill: 0xffffff,
      fontFamily: "Arial",
      fontSize: 18,
    });
    this.betText.anchor.set(0.5);
    this.betText.position.set(width / 2, betY);
    this.root.addChild(this.betText);

    this.betMinusBtn = new PIXI.Graphics();
    this.betMinusBtn.beginFill(0x333333);
    this.betMinusBtn.drawRoundedRect(-20, -20, 40, 40, 8);
    this.betMinusBtn.endFill();
    this.betMinusBtn.position.set(width / 2 - 100, betY);
  this.betMinusBtn.interactive = true;
  setButtonMode(this.betMinusBtn);
    this.betMinusBtn.on("pointertap", () => this.adjustBet(-1));
    this.root.addChild(this.betMinusBtn);

    const minusLabel = new PIXI.Text("−", {
      fill: 0xffffff,
      fontFamily: "Arial",
      fontSize: 24,
    });
    minusLabel.anchor.set(0.5);
    minusLabel.position.set(this.betMinusBtn.position.x, this.betMinusBtn.position.y - 1);
    this.root.addChild(minusLabel);

    this.betPlusBtn = new PIXI.Graphics();
    this.betPlusBtn.beginFill(0x333333);
    this.betPlusBtn.drawRoundedRect(-20, -20, 40, 40, 8);
    this.betPlusBtn.endFill();
    this.betPlusBtn.position.set(width / 2 + 100, betY);
  this.betPlusBtn.interactive = true;
  setButtonMode(this.betPlusBtn);
    this.betPlusBtn.on("pointertap", () => this.adjustBet(1));
    this.root.addChild(this.betPlusBtn);

    const plusLabel = new PIXI.Text("+", {
      fill: 0xffffff,
      fontFamily: "Arial",
      fontSize: 24,
    });
    plusLabel.anchor.set(0.5);
    plusLabel.position.set(this.betPlusBtn.position.x, this.betPlusBtn.position.y - 1);
    this.root.addChild(plusLabel);

    // PLAY BUTTON
    this.playButton = new PIXI.Graphics();
    this.playButton.beginFill(0x4f2aa0);
    this.playButton.drawRoundedRect(-70, -22, 140, 44, 12);
    this.playButton.endFill();
    this.playButton.x = width / 2;
    this.playButton.y = height - 70;
  this.playButton.interactive = true;
  setButtonMode(this.playButton);
    this.playButton.on("pointertap", () => this.startRound());
    this.root.addChild(this.playButton);

    this.playLabel = new PIXI.Text("Play", {
      fill: 0xffffff,
      fontFamily: "Arial",
      fontSize: 18,
    });
    this.playLabel.anchor.set(0.5);
    this.playLabel.position.set(this.playButton.x, this.playButton.y);
    this.root.addChild(this.playLabel);

    // AUTO-PLAY BUTTON
    this.autoButton = new PIXI.Graphics();
    this.autoButton.beginFill(0x333366);
    this.autoButton.drawRoundedRect(-70, -18, 140, 36, 10);
    this.autoButton.endFill();
    this.autoButton.x = width / 2;
    this.autoButton.y = height - 30;
  this.autoButton.interactive = true;
  setButtonMode(this.autoButton);
    this.autoButton.on("pointertap", () => this.onAutoButtonClick());
    this.root.addChild(this.autoButton);

    this.autoLabel = new PIXI.Text("", {
      fill: 0xffffff,
      fontFamily: "Arial",
      fontSize: 16,
    });
    this.autoLabel.anchor.set(0.5);
    this.autoLabel.position.set(this.autoButton.x, this.autoButton.y);
    this.root.addChild(this.autoLabel);

    // POPUP + PAY TABLE
    this.resultPopup = new ResultPopup();
    this.resultPopup.position.set(width / 2, height / 2);
    this.root.addChild(this.resultPopup);

    this.payTable = new PayTableOverlay(width, height);
    this.root.addChild(this.payTable);

    this.root.setChildIndex(this.resultPopup, this.root.children.length - 1);
    this.updateBetDisplay();
    this.updateBalanceDisplay();
    this.updateAutoButton();
    this.setState(GameState.Idle);
  }

  // ---------- Formatting helpers ----------

  private formatBet(): string {
    return `Bet: ${this.bet.toFixed(2)}`;
  }

  private formatBalance(): string {
    return `Balance: ${this.balance.toFixed(2)}`;
  }

  private formatSpeed(): string {
    return this.speed === "normal" ? "Speed: Normal" : "Speed: Fast";
  }

  private updateBetDisplay(): void {
    this.betText.text = this.formatBet();
    this.savePersistentState();
  }

  private updateBalanceDisplay(): void {
    this.balanceText.text = this.formatBalance();
    this.savePersistentState();
  }

  private updateSpeedDisplay(): void {
    this.speedText.text = this.formatSpeed();
  }

  private updateAutoButton(): void {
    if (this.isAutoPlay) {
      this.autoLabel.text = `Stop Auto (${this.autoRoundsRemaining})`;
      this.autoButton.alpha = 1;
    } else {
      this.autoLabel.text = `Auto x${this.autoRoundsTarget}`;
      this.autoButton.alpha = 1;
    }
  }

  private toggleSpeed(): void {
    if (this.isAutoPlay) return;
    this.speed = this.speed === "normal" ? "fast" : "normal";
    this.updateSpeedDisplay();
  }

  private getFlipDuration(): number {
    return this.speed === "fast" ? 0.08 : 0.15;
  }

  private getShuffleDuration(): number {
    return this.speed === "fast" ? 0.08 : 0.15;
  }

  private adjustBet(delta: number): void {
    if (this.state !== GameState.Idle || this.isAutoPlay) return;

    const newBet = this.bet + delta;
    if (newBet < this.minBet || newBet > this.maxBet) return;
    if (newBet > this.balance) return;

    this.bet = newBet;
    this.updateBetDisplay();
  }

  private setBetControlsEnabled(enabled: boolean): void {
    const alpha = enabled ? 1 : 0.5;

    this.betMinusBtn.alpha = alpha;
    this.betPlusBtn.alpha = alpha;

    this.betMinusBtn.interactive = enabled;
    this.betPlusBtn.interactive = enabled;
  }

  // ---------- AUTO-PLAY ----------

  private onAutoButtonClick(): void {
    if (this.isAutoPlay) {
      this.autoStopRequested = true;
      this.statusText.text = "Auto-play: will stop after this round";
      return;
    }

    if (this.state !== GameState.Idle) return;
    if (this.bet > this.balance) {
      this.statusText.text = "Insufficient balance for auto-play";
      return;
    }

    this.isAutoPlay = true;
    this.autoStopRequested = false;
    this.autoRoundsRemaining = this.autoRoundsTarget;
    this.autoSpeedBackup = this.speed;

    this.speed = "fast";
    this.updateSpeedDisplay();
    this.updateAutoButton();

    this.statusText.text = `Auto-play: ${this.autoRoundsRemaining} rounds (Fast)`;
    this.startRound();
  }

  private handleRoundComplete(): void {
    if (this.isAutoPlay) {
      const canAffordNext = this.bet <= this.balance;
      const hasRoundsLeft = this.autoRoundsRemaining > 0;

      if (!canAffordNext || !hasRoundsLeft || this.autoStopRequested) {
        this.isAutoPlay = false;
        this.autoStopRequested = false;
        this.speed = this.autoSpeedBackup;
        this.updateSpeedDisplay();
        this.updateAutoButton();
        this.setState(GameState.Idle);
        this.statusText.text = "Auto-play finished";
        return;
      }

      this.autoRoundsRemaining -= 1;
      this.updateAutoButton();
      this.statusText.text = `Auto-play: ${this.autoRoundsRemaining + 1} rounds left`;

      this.setState(GameState.Idle);
      this.startRound();
      return;
    }

    this.setState(GameState.Idle);
  }

  // ---------- State management ----------

  private setState(next: GameState): void {
    console.log(`State: ${this.state} → ${next}`);
    this.state = next;

    const idle = this.state === GameState.Idle && !this.isAutoPlay;
    this.setBetControlsEnabled(idle);

    switch (this.state) {
      case GameState.Idle:
        this.playButton.alpha = this.isAutoPlay ? 0.5 : 1;
        this.playButton.interactive = !this.isAutoPlay;
        if (!this.isAutoPlay) {
          this.statusText.text = "Idle – adjust bet and press Play";
        }
        break;

      case GameState.RoundStart:
        this.playButton.alpha = 0.5;
        this.playButton.interactive = false;
        this.statusText.text = this.isAutoPlay ? "Auto-play: dealing…" : "Preparing cards…";
        break;

      case GameState.Reveal:
        this.statusText.text = this.isAutoPlay
          ? "Auto-play: revealing cards"
          : "Tap cards in order to reveal";
        break;

      case GameState.Result:
        this.statusText.text = "Result!";
        break;
    }
  }

  // ---------- Game flow ----------

  private startRound(): void {
    if (this.state !== GameState.Idle) return;

    if (this.bet > this.balance) {
      this.statusText.text = "Insufficient balance";
      return;
    }

    this.balance -= this.bet;
    this.updateBalanceDisplay();

    this.setState(GameState.RoundStart);
    this.currentRevealIndex = 0;
    this.currentMultipliers = [];

    const multipliers = [
      pickWeightedMultiplier(),
      pickWeightedMultiplier(),
      pickWeightedMultiplier(),
    ];
    multipliers.sort(() => Math.random() - 0.5);

    this.cards.forEach((card, index) => {
      card.resetVisual();
      card.setMultiplier(multipliers[index] ?? 1);
    });

    const shuffleDuration = this.getShuffleDuration();

    const tl = gsap.timeline({
      onComplete: () => {
        this.setState(GameState.Reveal);
        if (this.isAutoPlay) {
          this.currentRevealIndex = 0;
          this.currentMultipliers = [];
          this.autoRevealNextCard();
        }
      },
    });

    this.cards.forEach((card, i) => {
      tl.to(
        card,
        {
          y: -20,
          duration: shuffleDuration,
          yoyo: true,
          repeat: 1,
          ease: "sine.inOut",
        },
        i * 0.05,
      );
    });
  }

  private autoRevealNextCard(): void {
    if (this.currentRevealIndex >= this.cards.length) {
      this.showResult();
      return;
    }

    const card = this.cards[this.currentRevealIndex];
    const flipDuration = this.getFlipDuration();
    const tl = card.createFlipTimeline(flipDuration);

    this.currentMultipliers.push(card.multiplier);
    this.currentRevealIndex += 1;

    tl.call(() => this.autoRevealNextCard());
  }

  private onCardClicked(card: TarotCard): void {
    if (this.isAutoPlay) return;
    if (this.state !== GameState.Reveal) return;
    if (card.isRevealed) return;

    const index = this.cards.indexOf(card);
    if (index !== this.currentRevealIndex) return;

    const flipDuration = this.getFlipDuration();
    const tl = card.createFlipTimeline(flipDuration);

    this.currentMultipliers.push(card.multiplier);
    this.currentRevealIndex += 1;

    if (this.currentRevealIndex >= this.cards.length) {
      tl.call(() => this.showResult());
    }
  }

  private playWinSplash(payout: number, product: number): void {
  // Only show splash for positive wins
  if (payout <= 0) return;

  // Ensure the splash text is above everything else
  this.root.setChildIndex(this.winText, this.root.children.length - 1);

  this.winText.text = `Win x${product.toFixed(2)} (+${payout.toFixed(2)})`;
  this.winText.visible = true;
  this.winText.alpha = 0;
  this.winText.scale.set(0.8);

  // Pop in
  gsap.to(this.winText, {
    alpha: 1,
    scale: 1.1,
    y: this.winText.y - 8,
    duration: 0.3,
    ease: "back.out(1.7)",
  });

  // Float & fade out
  gsap.to(this.winText, {
    alpha: 0,
    y: this.winText.y - 20,
    duration: 0.5,
    delay: 0.7,
    ease: "sine.in",
    onComplete: () => {
      this.winText.visible = false;
    },
  });
}


 private showResult(): void {
  this.setState(GameState.Result);

  // Raw card multipliers, including any 0.0x cards
  const rawMultipliers = this.currentMultipliers;

  // 🟡 NEW LOGIC:
  // - ignore 0x cards when computing the effective product
  // - if ALL cards are 0x → product = 0 (no win)
  const positiveMultipliers = rawMultipliers.filter((m) => m > 0);
  const product =
    positiveMultipliers.length > 0
      ? positiveMultipliers.reduce((acc, m) => acc * m, 1)
      : 0;

  const payout = product * this.bet;

  const data: ResultData = {
    bet: this.bet,
    multipliers: rawMultipliers, // still show all cards in the popup
    product,
    payout,
  };

  console.log("showResult() called with:", data);

  // Update balance with payout
  this.balance += payout;
  this.updateBalanceDisplay();

  // 🔔 Win splash uses the effective product and payout
  // Make sure popup is on top and visible
  this.root.setChildIndex(this.resultPopup, this.root.children.length - 1);
  this.resultPopup.show(data, () => {
    this.handleRoundComplete(); // whatever you had here before
  });

  // Ensure the win splash is above the popup so it's visible to the player
  this.root.setChildIndex(this.winText, this.root.children.length - 1);
  this.playWinSplash(payout, product);
}

}
