export type GemColor = "red" | "green" | "blue";
export type GemType = "active" | "support";

export interface SkillGem {
  id: string;
  name: string;
  type: GemType;
  color: GemColor;
  icon: string;
  levelReq: number;
  manaCost: number;
  description: string;
  tags: string[]; // e.g. ["Attack", "Melee", "AoE"] or ["Spell", "Projectile", "Fire"]
  effects: {
    baseDamageMultiplier?: number; // e.g. 1.2 = 120%
    addedProjectiles?: number;     // e.g. +4 for GMP
    attackSpeedMultiplier?: number;
    areaOfEffectMultiplier?: number;
    flatPhysicalDamage?: number;
    flatFireDamage?: number;
    flatLightningDamage?: number;
    chains?: number;
    summonMinions?: boolean;
    minionCount?: number;
  };
}

export const SKILL_GEMS: Record<string, SkillGem> = {
  // ================= 🔴 RED GEMS (STRENGTH) =================
  heavy_strike: {
    id: "heavy_strike",
    name: "Heavy Strike",
    type: "active",
    color: "red",
    icon: "🔨",
    levelReq: 1,
    manaCost: 6,
    description: "A colossal melee strike that pulverizes the target with immense force and high stun chance.",
    tags: ["Attack", "Melee", "Strike"],
    effects: { baseDamageMultiplier: 1.6 }
  },
  cleave: {
    id: "cleave",
    name: "Cleave",
    type: "active",
    color: "red",
    icon: "🪓",
    levelReq: 1,
    manaCost: 8,
    description: "The exile swings weapons in a lethal arc, striking all enemies in front of them.",
    tags: ["Attack", "Melee", "AoE"],
    effects: { baseDamageMultiplier: 1.25, areaOfEffectMultiplier: 1.4 }
  },
  molten_strike: {
    id: "molten_strike",
    name: "Molten Strike",
    type: "active",
    color: "red",
    icon: "🌋",
    levelReq: 1,
    manaCost: 9,
    description: "Strikes with fiery fury, launching blazing volcanic projectiles that explode on impact.",
    tags: ["Attack", "Melee", "Projectile", "Fire"],
    effects: { baseDamageMultiplier: 1.35, addedProjectiles: 3, flatFireDamage: 15 }
  },
  support_added_fire: {
    id: "support_added_fire",
    name: "Added Fire Damage Support",
    type: "support",
    color: "red",
    icon: "🔥",
    levelReq: 1,
    manaCost: 0,
    description: "Supported skills gain 35% of Physical Damage as Extra Fire Damage.",
    tags: ["Support", "Fire"],
    effects: { flatFireDamage: 25, baseDamageMultiplier: 1.15 }
  },
  support_melee_phys: {
    id: "support_melee_phys",
    name: "Melee Physical Damage Support",
    type: "support",
    color: "red",
    icon: "💪",
    levelReq: 1,
    manaCost: 0,
    description: "Supported Melee Skills deal 40% More Melee Physical Damage.",
    tags: ["Support", "Melee"],
    effects: { baseDamageMultiplier: 1.4 }
  },

  // ================= 🟢 GREEN GEMS (DEXTERITY) =================
  split_arrow: {
    id: "split_arrow",
    name: "Split Arrow",
    type: "active",
    color: "green",
    icon: "🏹",
    levelReq: 1,
    manaCost: 7,
    description: "Fires a fan of piercing arrows that shred multiple targets simultaneously.",
    tags: ["Attack", "Ranged", "Bow", "Projectile"],
    effects: { baseDamageMultiplier: 1.1, addedProjectiles: 4 }
  },
  toxic_rain: {
    id: "toxic_rain",
    name: "Toxic Rain",
    type: "active",
    color: "green",
    icon: "🌧️",
    levelReq: 1,
    manaCost: 10,
    description: "Fires a volley of caustic spore pods into the air that rain down, creating poisonous zones.",
    tags: ["Attack", "Ranged", "Bow", "Chaos", "AoE"],
    effects: { baseDamageMultiplier: 1.2, addedProjectiles: 4, areaOfEffectMultiplier: 1.5 }
  },
  cyclone: {
    id: "cyclone",
    name: "Cyclone",
    type: "active",
    color: "green",
    icon: "🌪️",
    levelReq: 1,
    manaCost: 5,
    description: "Spins in a whirlwind of razor blades, slicing through all enemies continuously.",
    tags: ["Attack", "Melee", "AoE", "Movement"],
    effects: { baseDamageMultiplier: 0.9, attackSpeedMultiplier: 1.8, areaOfEffectMultiplier: 1.3 }
  },
  support_gmp: {
    id: "support_gmp",
    name: "Greater Multiple Projectiles (GMP)",
    type: "support",
    color: "green",
    icon: "🎯",
    levelReq: 1,
    manaCost: 0,
    description: "Supported Projectile Skills fire 4 additional projectiles in a devastating spread.",
    tags: ["Support", "Projectile"],
    effects: { addedProjectiles: 4, baseDamageMultiplier: 0.85 }
  },
  support_faster_attacks: {
    id: "support_faster_attacks",
    name: "Faster Attacks Support",
    type: "support",
    color: "green",
    icon: "⚡",
    levelReq: 1,
    manaCost: 0,
    description: "Supported Skills have 35% increased Attack Speed.",
    tags: ["Support", "Attack"],
    effects: { attackSpeedMultiplier: 1.35 }
  },

  // ================= 🔵 BLUE GEMS (INTELLIGENCE) =================
  fireball: {
    id: "fireball",
    name: "Fireball",
    type: "active",
    color: "blue",
    icon: "☄️",
    levelReq: 1,
    manaCost: 8,
    description: "Hurls an explosive sphere of arcane flame that erupts in an area of effect.",
    tags: ["Spell", "Projectile", "Fire", "AoE"],
    effects: { baseDamageMultiplier: 1.3, flatFireDamage: 20, areaOfEffectMultiplier: 1.2 }
  },
  arc: {
    id: "arc",
    name: "Arc",
    type: "active",
    color: "blue",
    icon: "⚡",
    levelReq: 1,
    manaCost: 10,
    description: "Unleashes a surge of lightning that zaps the target and violently chains to nearby enemies.",
    tags: ["Spell", "Lightning", "Chaining"],
    effects: { baseDamageMultiplier: 1.2, flatLightningDamage: 25, chains: 4 }
  },
  raise_zombie: {
    id: "raise_zombie",
    name: "Raise Zombie",
    type: "active",
    color: "blue",
    icon: "🧟",
    levelReq: 1,
    manaCost: 15,
    description: "Raises undead zombie minions from the earth to march and auto-attack enemies.",
    tags: ["Spell", "Minion"],
    effects: { summonMinions: true, minionCount: 3, baseDamageMultiplier: 1.0 }
  },
  support_spell_echo: {
    id: "support_spell_echo",
    name: "Spell Echo Support",
    type: "support",
    color: "blue",
    icon: "🔮",
    levelReq: 1,
    manaCost: 0,
    description: "Supported Spells repeat their cast automatically and have 35% more Cast Speed.",
    tags: ["Support", "Spell"],
    effects: { attackSpeedMultiplier: 1.35, baseDamageMultiplier: 1.1 }
  },
  support_added_lightning: {
    id: "support_added_lightning",
    name: "Added Lightning Damage Support",
    type: "support",
    color: "blue",
    icon: "✨",
    levelReq: 1,
    manaCost: 0,
    description: "Adds 10 to 45 Lightning Damage to supported skills.",
    tags: ["Support", "Lightning"],
    effects: { flatLightningDamage: 30 }
  }
};

export interface SocketLinkSlot {
  socketColor: GemColor;
  gemId: string | null; // ID of socketed gem
}

export interface ItemSocketGroup {
  sockets: SocketLinkSlot[];
  isLinked: boolean; // Are all sockets in this item linked together
}

// Calculate fully buffed active skill stats when linked with support gems
export function calculateLinkedSkill(
  activeGem: SkillGem,
  supportGems: SkillGem[]
): {
  dpsMultiplier: number;
  projectiles: number;
  attackSpeedMultiplier: number;
  flatFire: number;
  flatLightning: number;
  chains: number;
  summonMinions: boolean;
  minionCount: number;
  manaCost: number;
  supportNames: string[];
} {
  let dpsMultiplier = activeGem.effects.baseDamageMultiplier || 1.0;
  let projectiles = 1 + (activeGem.effects.addedProjectiles || 0);
  let attackSpeedMultiplier = activeGem.effects.attackSpeedMultiplier || 1.0;
  let flatFire = activeGem.effects.flatFireDamage || 0;
  let flatLightning = activeGem.effects.flatLightningDamage || 0;
  let chains = activeGem.effects.chains || 0;
  let summonMinions = activeGem.effects.summonMinions || false;
  let minionCount = activeGem.effects.minionCount || 0;
  let manaCost = activeGem.manaCost;
  const supportNames: string[] = [];

  supportGems.forEach((sup) => {
    supportNames.push(sup.name);
    if (sup.effects.baseDamageMultiplier) dpsMultiplier *= sup.effects.baseDamageMultiplier;
    if (sup.effects.addedProjectiles) projectiles += sup.effects.addedProjectiles;
    if (sup.effects.attackSpeedMultiplier) attackSpeedMultiplier *= sup.effects.attackSpeedMultiplier;
    if (sup.effects.flatFireDamage) flatFire += sup.effects.flatFireDamage;
    if (sup.effects.flatLightningDamage) flatLightning += sup.effects.flatLightningDamage;
    manaCost = Math.floor(manaCost * 1.2); // Support gems increase mana multiplier!
  });

  return {
    dpsMultiplier,
    projectiles,
    attackSpeedMultiplier,
    flatFire,
    flatLightning,
    chains,
    summonMinions,
    minionCount,
    manaCost,
    supportNames
  };
}
