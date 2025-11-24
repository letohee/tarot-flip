// src/config/multipliers.ts

import rawTable from "./multipliers.json";

export type Rarity = "rare" | "common" | "dead";

export interface MultiplierEntry {
  value: number;   // e.g. 10, 5, 0.3, 0
  chance: number;  // weight / chance from JSON
}

// Use the JSON as our data source
export const MULTIPLIER_TABLE: MultiplierEntry[] = rawTable as MultiplierEntry[];

/**
 * Weighted pick based on "chance" from multipliers.json.
 * Values don't need to sum to 100 – they’re treated as relative weights.
 */
export function pickWeightedMultiplier(): number {
  const totalWeight = MULTIPLIER_TABLE.reduce(
    (sum, entry) => sum + entry.chance,
    0,
  );

  const roll = Math.random() * totalWeight;

  let acc = 0;
  for (const entry of MULTIPLIER_TABLE) {
    acc += entry.chance;
    if (roll <= acc) {
      return entry.value;
    }
  }

  // Fallback – in case of floating-point edge cases
  return MULTIPLIER_TABLE[MULTIPLIER_TABLE.length - 1]!.value;
}

/**
 * Simple rarity rule for visuals:
 *  - dead:   0x
 *  - rare:   value >= 3x (high / "gold-ish")
 *  - common: the rest (smaller / "blue-ish")
 *
 * This doesn’t try to perfectly reproduce Stake’s internal grouping,
 * just gives a clear visual separation between big and small hits.
 */
export function getMultiplierRarity(value: number): Rarity {
  if (value === 0) return "dead";
  if (value >= 3) return "rare";
  return "common";
}

/**
 * Hex color used for a given multiplier:
 *  - rare   → gold/yellow
 *  - common → blue
 *  - dead   → grey
 */
export function getMultiplierColor(value: number): number {
  const rarity = getMultiplierRarity(value);

  switch (rarity) {
    case "dead":
      return 0x9e9e9e; // grey
    case "rare":
      return 0xffd54f; // gold/yellow
    case "common":
    default:
      return 0x90caf9; // blue
  }
}
