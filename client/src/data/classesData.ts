export interface ClassProfile {
  id: string;
  name: string;
  attributeType: "Strength" | "Dexterity" | "Intelligence" | "Str/Dex" | "Str/Int" | "Dex/Int" | "Hybrid";
  themeColor: string;
  icon: string;
  title: string;
  tagline: string;
  description: string;
  baseStats: {
    strength: number;
    dexterity: number;
    intelligence: number;
    maxHp: number;
    maxMana: number;
    maxEnergyShield: number;
    dps: number;
    armour: number;
    evasion: number;
  };
  startingSkill: string;
}

export const CORE_CLASSES: Record<string, ClassProfile> = {
  Marauder: {
    id: "Marauder",
    name: "Marauder",
    attributeType: "Strength",
    themeColor: "#c0392b",
    icon: "🪓",
    title: "The Juggernaut of War",
    tagline: "Pure Strength • Heavy Slams • Immense Fortitude",
    description: "A towering warrior from Karui. Relies on brutal brute force, colossal maces, and massive pools of Life and Armour to crush demonic hordes.",
    baseStats: {
      strength: 32,
      dexterity: 14,
      intelligence: 14,
      maxHp: 320,
      maxMana: 70,
      maxEnergyShield: 0,
      dps: 42,
      armour: 80,
      evasion: 20
    },
    startingSkill: "Heavy Strike"
  },
  Ranger: {
    id: "Ranger",
    name: "Ranger",
    attributeType: "Dexterity",
    themeColor: "#27ae60",
    icon: "🏹",
    title: "The Silent Stalker",
    tagline: "Pure Dexterity • Master of Archery • High Evasion",
    description: "Banished for protecting sacred beasts. Moves with wind-like swiftness, firing volleys of piercing arrows and evading lethal counter-attacks.",
    baseStats: {
      strength: 14,
      dexterity: 32,
      intelligence: 14,
      maxHp: 240,
      maxMana: 90,
      maxEnergyShield: 0,
      dps: 40,
      armour: 20,
      evasion: 130
    },
    startingSkill: "Split Arrow"
  },
  Witch: {
    id: "Witch",
    name: "Witch",
    attributeType: "Intelligence",
    themeColor: "#8e44ad",
    icon: "🔮",
    title: "The Occult Sorceress",
    tagline: "Pure Intelligence • Elemental Spells • Energy Shield",
    description: "Cast out for her forbidden studies. Channels destructive elemental fire, cold, and lightning while shielded by an ethereal barrier of Energy Shield.",
    baseStats: {
      strength: 14,
      dexterity: 14,
      intelligence: 32,
      maxHp: 210,
      maxMana: 160,
      maxEnergyShield: 65,
      dps: 38,
      armour: 10,
      evasion: 25
    },
    startingSkill: "Fireball"
  },
  Duelist: {
    id: "Duelist",
    name: "Duelist",
    attributeType: "Str/Dex",
    themeColor: "#e67e22",
    icon: "⚔️",
    title: "The Grand Gladiator",
    tagline: "Strength / Dexterity • Rapid Blades • Balanced Defense",
    description: "Pride of the imperial arenas. Master of dual-wielding and swordplay, blending lethal attack speed with versatile physical mitigation.",
    baseStats: {
      strength: 23,
      dexterity: 23,
      intelligence: 14,
      maxHp: 275,
      maxMana: 85,
      maxEnergyShield: 0,
      dps: 45,
      armour: 50,
      evasion: 65
    },
    startingSkill: "Cleave"
  },
  Templar: {
    id: "Templar",
    name: "Templar",
    attributeType: "Str/Int",
    themeColor: "#3498db",
    icon: "⚡",
    title: "The Zealous Inquisitor",
    tagline: "Strength / Intelligence • Holy Melee • Totems & Spells",
    description: "Exiled defender of the faith. Fights on the frontlines wielding elemental-infused scepters, summoning sacred totems, and smiting heresy.",
    baseStats: {
      strength: 23,
      dexterity: 14,
      intelligence: 23,
      maxHp: 285,
      maxMana: 125,
      maxEnergyShield: 35,
      dps: 41,
      armour: 55,
      evasion: 20
    },
    startingSkill: "Smite"
  },
  Shadow: {
    id: "Shadow",
    name: "Shadow",
    attributeType: "Dex/Int",
    themeColor: "#16a085",
    icon: "🗡️",
    title: "The Silent Assassin",
    tagline: "Dexterity / Intelligence • Critical Strikes • Traps & Toxins",
    description: "An assassin for hire whose skills proved too terrifying. Uses coated daggers, lethal critical hits, and ingenious traps to dismantle prey.",
    baseStats: {
      strength: 14,
      dexterity: 23,
      intelligence: 23,
      maxHp: 235,
      maxMana: 110,
      maxEnergyShield: 30,
      dps: 47,
      armour: 15,
      evasion: 85
    },
    startingSkill: "Cobra Lash"
  },
  Scion: {
    id: "Scion",
    name: "Scion",
    attributeType: "Hybrid",
    themeColor: "#f1c40f",
    icon: "👑",
    title: "The Daughter of Wraeclast",
    tagline: "All Attributes • Boundless Versatility • Center of the Passive Tree",
    description: "Banished noblewoman endowed with peerless adaptability. Starts at the exact center of the Passive Tree with limitless multi-class build potential.",
    baseStats: {
      strength: 20,
      dexterity: 20,
      intelligence: 20,
      maxHp: 260,
      maxMana: 110,
      maxEnergyShield: 25,
      dps: 42,
      armour: 35,
      evasion: 45
    },
    startingSkill: "Spectral Throw"
  }
};
