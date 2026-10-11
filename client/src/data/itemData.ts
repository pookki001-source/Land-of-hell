export type ItemRarity = "normal" | "magic" | "rare" | "unique" | "currency";

export type SlotType =
  | "mainHand"
  | "offHand"
  | "helmet"
  | "bodyArmour"
  | "gloves"
  | "boots"
  | "amulet"
  | "ring1"
  | "ring2"
  | "belt";

export interface ItemAffix {
  text: string;
  type: "prefix" | "suffix" | "implicit";
  stat: string;
  value: number;
}

export interface GameItem {
  id: string;
  name: string;
  baseName: string;
  slotType: SlotType | "currency";
  rarity: ItemRarity;
  icon: string;
  width: number;  // Grid cells wide (1 or 2)
  height: number; // Grid cells tall (1, 2, 3, or 4)
  gridX?: number; // 0..11
  gridY?: number; // 0..4
  levelReq: number;
  strReq?: number;
  dexReq?: number;
  intReq?: number;
  implicitMods: string[];
  explicitMods: string[];
  stats: {
    physicalDamageMin?: number;
    physicalDamageMax?: number;
    attackSpeed?: number;
    critChance?: number;
    armour?: number;
    evasion?: number;
    energyShield?: number;
    life?: number;
    mana?: number;
    fireRes?: number;
    coldRes?: number;
    lightningRes?: number;
    chaosRes?: number;
    movementSpeed?: number;
  };
  sockets?: string[]; // e.g. ["R", "R", "G"]
  links?: number[][]; // e.g. [[0, 1]]
  flavorText?: string;
}

export interface EquippedGear {
  mainHand: GameItem | null;
  offHand: GameItem | null;
  helmet: GameItem | null;
  bodyArmour: GameItem | null;
  gloves: GameItem | null;
  boots: GameItem | null;
  amulet: GameItem | null;
  ring1: GameItem | null;
  ring2: GameItem | null;
  belt: GameItem | null;
}

export const EMPTY_EQUIPMENT: EquippedGear = {
  mainHand: null,
  offHand: null,
  helmet: null,
  bodyArmour: null,
  gloves: null,
  boots: null,
  amulet: null,
  ring1: null,
  ring2: null,
  belt: null
};

export const RARITY_COLORS: Record<ItemRarity, { text: string; border: string; bg: string }> = {
  normal: { text: "#c8c8c8", border: "#7f7f7f", bg: "#161514" },
  magic: { text: "#8888ff", border: "#4444ff", bg: "#141524" },
  rare: { text: "#ffff77", border: "#d4ac0d", bg: "#232014" },
  unique: { text: "#af601a", border: "#d35400", bg: "#281b14" },
  currency: { text: "#aa9e82", border: "#8a7e6b", bg: "#1c1a17" }
};

// Generate starting starter pack equipment based on class
export function generateStarterGear(characterClass: string): { gear: EquippedGear; inventory: GameItem[] } {
  const gear: EquippedGear = { ...EMPTY_EQUIPMENT };
  const inventory: GameItem[] = [];

  // Starting Weapon based on class
  if (characterClass === "Marauder") {
    gear.mainHand = {
      id: "item_start_wep",
      name: "Driftwood Club",
      baseName: "Driftwood Club",
      slotType: "mainHand",
      rarity: "normal",
      icon: "🔨",
      width: 1,
      height: 3,
      levelReq: 1,
      implicitMods: ["10% reduced Enemy Stun Threshold"],
      explicitMods: [],
      stats: { physicalDamageMin: 12, physicalDamageMax: 22, attackSpeed: 1.25 }
    };
    gear.offHand = {
      id: "item_start_shield",
      name: "Splintered Tower Shield",
      baseName: "Tower Shield",
      slotType: "offHand",
      rarity: "normal",
      icon: "🛡️",
      width: 2,
      height: 2,
      levelReq: 1,
      implicitMods: ["+15 to Maximum Life"],
      explicitMods: [],
      stats: { armour: 35, life: 15 }
    };
  } else if (characterClass === "Ranger") {
    gear.mainHand = {
      id: "item_start_bow",
      name: "Crude Bow",
      baseName: "Crude Bow",
      slotType: "mainHand",
      rarity: "normal",
      icon: "🏹",
      width: 2,
      height: 4,
      levelReq: 1,
      implicitMods: [],
      explicitMods: [],
      stats: { physicalDamageMin: 9, physicalDamageMax: 20, attackSpeed: 1.45 }
    };
    gear.offHand = {
      id: "item_start_quiver",
      name: "Serrated Quiver",
      baseName: "Serrated Quiver",
      slotType: "offHand",
      rarity: "normal",
      icon: "🎯",
      width: 2,
      height: 2,
      levelReq: 1,
      implicitMods: ["Adds 2 to 4 Physical Damage to Bow Attacks"],
      explicitMods: [],
      stats: { physicalDamageMin: 2, physicalDamageMax: 4 }
    };
  } else if (characterClass === "Witch") {
    gear.mainHand = {
      id: "item_start_wand",
      name: "Driftwood Wand",
      baseName: "Driftwood Wand",
      slotType: "mainHand",
      rarity: "magic",
      icon: "🪄",
      width: 1,
      height: 3,
      levelReq: 1,
      implicitMods: ["12% increased Spell Damage"],
      explicitMods: ["Adds 3 to 6 Fire Damage to Spells", "+15 to Maximum Mana"],
      stats: { physicalDamageMin: 6, physicalDamageMax: 11, attackSpeed: 1.3, mana: 15 }
    };
    gear.bodyArmour = {
      id: "item_start_robe",
      name: "Simple Robe",
      baseName: "Simple Robe",
      slotType: "bodyArmour",
      rarity: "normal",
      icon: "👘",
      width: 2,
      height: 3,
      levelReq: 1,
      implicitMods: [],
      explicitMods: [],
      stats: { energyShield: 35 }
    };
  } else {
    // Duelist / Templar / Shadow / Scion default sword
    gear.mainHand = {
      id: "item_start_sword",
      name: "Rusted Sword",
      baseName: "Rusted Sword",
      slotType: "mainHand",
      rarity: "magic",
      icon: "🗡️",
      width: 1,
      height: 3,
      levelReq: 1,
      implicitMods: ["+18% to Global Critical Strike Multiplier"],
      explicitMods: ["15% increased Physical Damage"],
      stats: { physicalDamageMin: 10, physicalDamageMax: 18, attackSpeed: 1.4 }
    };
  }

  // Common Starter Chest
  if (!gear.bodyArmour) {
    gear.bodyArmour = {
      id: "item_start_vest",
      name: "Plate Vest",
      baseName: "Plate Vest",
      slotType: "bodyArmour",
      rarity: "normal",
      icon: "🥋",
      width: 2,
      height: 3,
      levelReq: 1,
      implicitMods: [],
      explicitMods: [],
      stats: { armour: 28 }
    };
  }

  // Starter Boots (with Movement Speed)
  gear.boots = {
    id: "item_start_boots",
    name: "Wanderer's Rawhide Boots",
    baseName: "Rawhide Boots",
    slotType: "boots",
    rarity: "magic",
    icon: "👢",
    width: 2,
    height: 2,
    levelReq: 1,
    implicitMods: [],
    explicitMods: ["10% increased Movement Speed", "+12 to Maximum Life"],
    stats: { evasion: 22, movementSpeed: 10, life: 12 }
  };

  // Starter Ring
  gear.ring1 = {
    id: "item_start_ring",
    name: "Iron Ring",
    baseName: "Iron Ring",
    slotType: "ring1",
    rarity: "normal",
    icon: "💍",
    width: 1,
    height: 1,
    levelReq: 1,
    implicitMods: ["Adds 1 to 4 Physical Damage to Attacks"],
    explicitMods: [],
    stats: { physicalDamageMin: 1, physicalDamageMax: 4 }
  };

  // Starter Belt
  gear.belt = {
    id: "item_start_belt",
    name: "Leather Belt",
    baseName: "Leather Belt",
    slotType: "belt",
    rarity: "magic",
    icon: "🪢",
    width: 2,
    height: 1,
    levelReq: 1,
    implicitMods: ["+25 to Maximum Life"],
    explicitMods: ["+14% to Fire Resistance"],
    stats: { life: 25, fireRes: 14 }
  };

  // Starter Inventory Items (Currency & Rare drop to play with)
  inventory.push({
    id: "item_inv_scroll",
    name: "Scroll of Wisdom (x10)",
    baseName: "Scroll of Wisdom",
    slotType: "currency",
    rarity: "currency",
    icon: "📜",
    width: 1,
    height: 1,
    gridX: 0,
    gridY: 0,
    levelReq: 1,
    implicitMods: ["Identifies an unverified item"],
    explicitMods: [],
    stats: {}
  });

  inventory.push({
    id: "item_inv_transmute",
    name: "Orb of Transmutation (x5)",
    baseName: "Orb of Transmutation",
    slotType: "currency",
    rarity: "currency",
    icon: "🔵",
    width: 1,
    height: 1,
    gridX: 1,
    gridY: 0,
    levelReq: 1,
    implicitMods: ["Upgrades a Normal item to a Magic item"],
    explicitMods: [],
    stats: {}
  });

  inventory.push({
    id: "item_inv_chaos",
    name: "Chaos Orb (x2)",
    baseName: "Chaos Orb",
    slotType: "currency",
    rarity: "currency",
    icon: "🟡",
    width: 1,
    height: 1,
    gridX: 2,
    gridY: 0,
    levelReq: 1,
    implicitMods: ["Reforges a Rare item with new random modifiers"],
    explicitMods: [],
    stats: {}
  });

  // A juicy Rare helmet in inventory!
  inventory.push({
    id: "item_inv_helm",
    name: "Bramble Crown Iron Circlet",
    baseName: "Iron Circlet",
    slotType: "helmet",
    rarity: "rare",
    icon: "👑",
    width: 2,
    height: 2,
    gridX: 4,
    gridY: 0,
    levelReq: 2,
    implicitMods: [],
    explicitMods: [
      "+32 to Maximum Life",
      "+18 to Energy Shield",
      "+22% to Cold Resistance",
      "+15% to Lightning Resistance"
    ],
    stats: { life: 32, energyShield: 18, coldRes: 22, lightningRes: 15 }
  });

  return { gear, inventory };
}
