export type NodeType = "start" | "minor" | "notable" | "keystone";

export interface PassiveNode {
  id: string;
  name: string;
  type: NodeType;
  x: number; // Virtual coordinate on the tree canvas (-800 to 800)
  y: number; // Virtual coordinate on the tree canvas (-800 to 800)
  icon: string;
  statsText: string[];
  connections: string[]; // Connected node IDs
  startingClass?: string; // If 'start' node
  statsModifiers: {
    strength?: number;
    dexterity?: number;
    intelligence?: number;
    maxHpFlat?: number;
    maxHpPercent?: number;
    energyShieldFlat?: number;
    energyShieldPercent?: number;
    manaFlat?: number;
    dpsPercent?: number;
    armourPercent?: number;
    evasionPercent?: number;
    fireRes?: number;
    coldRes?: number;
    lightningRes?: number;
    chaosRes?: number;
    movementSpeedPercent?: number;
    isChaosInoculation?: boolean;
    isResoluteTechnique?: boolean;
    isBloodMagic?: boolean;
  };
}

// 7 Starting Positions radiating from Center (Scion at 0, 0)
// Radius ~380-450 around center
export const PASSIVE_NODES: Record<string, PassiveNode> = {
  // ================= SCION (CENTER) =================
  start_scion: {
    id: "start_scion",
    name: "Scion Starting Dais",
    type: "start",
    x: 0,
    y: 0,
    icon: "👑",
    statsText: ["Starting point for the Scion", "+10 to All Attributes"],
    connections: ["scion_str_1", "scion_dex_1", "scion_int_1"],
    startingClass: "Scion",
    statsModifiers: { strength: 10, dexterity: 10, intelligence: 10 }
  },
  scion_str_1: {
    id: "scion_str_1",
    name: "Scion Might",
    type: "minor",
    x: -40,
    y: 60,
    icon: "💪",
    statsText: ["+10 to Strength", "+15 to maximum Life"],
    connections: ["start_scion", "duelist_bridge_1", "marauder_bridge_1"],
    statsModifiers: { strength: 10, maxHpFlat: 15 }
  },
  scion_dex_1: {
    id: "scion_dex_1",
    name: "Scion Grace",
    type: "minor",
    x: 60,
    y: 40,
    icon: "👟",
    statsText: ["+10 to Dexterity", "4% increased Attack Speed"],
    connections: ["start_scion", "ranger_bridge_1"],
    statsModifiers: { dexterity: 10, dpsPercent: 4 }
  },
  scion_int_1: {
    id: "scion_int_1",
    name: "Scion Intellect",
    type: "minor",
    x: 0,
    y: -70,
    icon: "🧠",
    statsText: ["+10 to Intelligence", "+15 to maximum Mana"],
    connections: ["start_scion", "witch_bridge_1"],
    statsModifiers: { intelligence: 10, manaFlat: 15 }
  },

  // ================= MARAUDER (SOUTH-WEST) =================
  start_marauder: {
    id: "start_marauder",
    name: "Marauder Starting Gate",
    type: "start",
    x: -320,
    y: 280,
    icon: "🪓",
    statsText: ["Starting point for the Marauder", "+14 to Strength"],
    connections: ["mar_life_1", "mar_dmg_1"],
    startingClass: "Marauder",
    statsModifiers: { strength: 14 }
  },
  mar_life_1: {
    id: "mar_life_1",
    name: "Hearty Constitution",
    type: "minor",
    x: -380,
    y: 330,
    icon: "❤️",
    statsText: ["+5% to maximum Life", "+10 to Strength"],
    connections: ["start_marauder", "mar_life_2"],
    statsModifiers: { maxHpPercent: 5, strength: 10 }
  },
  mar_life_2: {
    id: "mar_life_2",
    name: "Discipline and Training",
    type: "notable",
    x: -460,
    y: 390,
    icon: "🩸",
    statsText: ["+30 to maximum Life", "+10% to maximum Life", "+2% Life Regenerated per second"],
    connections: ["mar_life_1", "keystone_resolute_technique"],
    statsModifiers: { maxHpFlat: 30, maxHpPercent: 10 }
  },
  mar_dmg_1: {
    id: "mar_dmg_1",
    name: "Heavy Blows",
    type: "minor",
    x: -270,
    y: 340,
    icon: "🔨",
    statsText: ["12% increased Melee Physical Damage", "+10 to Strength"],
    connections: ["start_marauder", "mar_dmg_2", "marauder_bridge_1"],
    statsModifiers: { dpsPercent: 12, strength: 10 }
  },
  mar_dmg_2: {
    id: "mar_dmg_2",
    name: "Berserker's Fury",
    type: "notable",
    x: -240,
    y: 430,
    icon: "🔥",
    statsText: ["25% increased Physical Damage", "10% increased Attack Speed", "+20 to Armour"],
    connections: ["mar_dmg_1", "keystone_blood_magic"],
    statsModifiers: { dpsPercent: 25, armourPercent: 20 }
  },
  marauder_bridge_1: {
    id: "marauder_bridge_1",
    name: "Karui Resilience",
    type: "minor",
    x: -160,
    y: 190,
    icon: "🛡️",
    statsText: ["+15 to Armour", "+15 to maximum Life"],
    connections: ["mar_dmg_1", "scion_str_1"],
    statsModifiers: { maxHpFlat: 15, armourPercent: 15 }
  },
  keystone_resolute_technique: {
    id: "keystone_resolute_technique",
    name: "Resolute Technique",
    type: "keystone",
    x: -540,
    y: 460,
    icon: "🎯",
    statsText: [
      "KEYSTONE PASSIVE:",
      "Your Hits cannot be Evaded (100% Accuracy)",
      "Never deal Critical Strikes"
    ],
    connections: ["mar_life_2"],
    statsModifiers: { isResoluteTechnique: true, dpsPercent: 15 }
  },
  keystone_blood_magic: {
    id: "keystone_blood_magic",
    name: "Blood Magic",
    type: "keystone",
    x: -180,
    y: 520,
    icon: "💉",
    statsText: [
      "KEYSTONE PASSIVE:",
      "Removes all Mana",
      "Skills cost Life instead of Mana",
      "+35% to maximum Life"
    ],
    connections: ["mar_dmg_2"],
    statsModifiers: { isBloodMagic: true, maxHpPercent: 35 }
  },

  // ================= DUELIST (SOUTH) =================
  start_duelist: {
    id: "start_duelist",
    name: "Duelist Starting Arena",
    type: "start",
    x: 0,
    y: 350,
    icon: "⚔️",
    statsText: ["Starting point for the Duelist", "+10 to Strength", "+10 to Dexterity"],
    connections: ["due_speed_1", "due_leech_1"],
    startingClass: "Duelist",
    statsModifiers: { strength: 10, dexterity: 10 }
  },
  due_speed_1: {
    id: "due_speed_1",
    name: "Swift Strikes",
    type: "minor",
    x: -60,
    y: 420,
    icon: "💨",
    statsText: ["6% increased Attack Speed", "+10 to Dexterity"],
    connections: ["start_duelist", "due_speed_2"],
    statsModifiers: { dpsPercent: 6, dexterity: 10 }
  },
  due_speed_2: {
    id: "due_speed_2",
    name: "Master of the Arena",
    type: "notable",
    x: -80,
    y: 510,
    icon: "🏆",
    statsText: ["+20 to maximum Life", "20% increased Melee Physical Damage", "+15 to Armour and Evasion"],
    connections: ["due_speed_1", "keystone_iron_reflexes"],
    statsModifiers: { maxHpFlat: 20, dpsPercent: 20, armourPercent: 15, evasionPercent: 15 }
  },
  due_leech_1: {
    id: "due_leech_1",
    name: "Blood Siphon",
    type: "minor",
    x: 60,
    y: 420,
    icon: "🍷",
    statsText: ["0.6% of Physical Attack Damage Leeched as Life", "+10 to Strength"],
    connections: ["start_duelist", "due_leech_2"],
    statsModifiers: { strength: 10, maxHpFlat: 15 }
  },
  due_leech_2: {
    id: "due_leech_2",
    name: "Vaal Pact",
    type: "notable",
    x: 80,
    y: 510,
    icon: "🧛",
    statsText: ["Life Leech rate doubled", "+25% to maximum Life Recovery per second"],
    connections: ["due_leech_1"],
    statsModifiers: { maxHpPercent: 8, dpsPercent: 12 }
  },
  duelist_bridge_1: {
    id: "duelist_bridge_1",
    name: "Arena Prowess",
    type: "minor",
    x: -20,
    y: 190,
    icon: "🏅",
    statsText: ["+10 to Strength", "+10 to Dexterity"],
    connections: ["start_duelist", "scion_str_1"],
    statsModifiers: { strength: 10, dexterity: 10 }
  },
  keystone_iron_reflexes: {
    id: "keystone_iron_reflexes",
    name: "Iron Reflexes",
    type: "keystone",
    x: -120,
    y: 590,
    icon: "🛡️",
    statsText: [
      "KEYSTONE PASSIVE:",
      "Converts all Evasion Rating to Armour",
      "+40% increased Total Armour"
    ],
    connections: ["due_speed_2"],
    statsModifiers: { armourPercent: 40 }
  },

  // ================= RANGER (SOUTH-EAST) =================
  start_ranger: {
    id: "start_ranger",
    name: "Ranger Starting Glade",
    type: "start",
    x: 320,
    y: 280,
    icon: "🏹",
    statsText: ["Starting point for the Ranger", "+14 to Dexterity"],
    connections: ["ran_bow_1", "ran_eva_1"],
    startingClass: "Ranger",
    statsModifiers: { dexterity: 14 }
  },
  ran_bow_1: {
    id: "ran_bow_1",
    name: "Piercing Shots",
    type: "minor",
    x: 370,
    y: 340,
    icon: "🎯",
    statsText: ["12% increased Projectile Damage", "4% increased Attack Speed"],
    connections: ["start_ranger", "ran_bow_2"],
    statsModifiers: { dpsPercent: 12, dexterity: 10 }
  },
  ran_bow_2: {
    id: "ran_bow_2",
    name: "King of the Hill",
    type: "notable",
    x: 450,
    y: 400,
    icon: "🦅",
    statsText: ["30% increased Critical Strike Chance with Bows", "+20% to Critical Strike Multiplier"],
    connections: ["ran_bow_1"],
    statsModifiers: { dpsPercent: 26 }
  },
  ran_eva_1: {
    id: "ran_eva_1",
    name: "Wind Walker",
    type: "minor",
    x: 270,
    y: 350,
    icon: "🍃",
    statsText: ["15% increased Evasion Rating", "+5% increased Movement Speed"],
    connections: ["start_ranger", "ran_eva_2", "ranger_bridge_1"],
    statsModifiers: { evasionPercent: 15, movementSpeedPercent: 5 }
  },
  ran_eva_2: {
    id: "ran_eva_2",
    name: "Acrobatics Mastery",
    type: "notable",
    x: 290,
    y: 460,
    icon: "🤸",
    statsText: ["+30% to Evasion Rating", "+10% to Spell Suppression Chance", "+15 to maximum Life"],
    connections: ["ran_eva_1", "keystone_acrobatics"],
    statsModifiers: { evasionPercent: 30, maxHpFlat: 15 }
  },
  ranger_bridge_1: {
    id: "ranger_bridge_1",
    name: "Wilderness Path",
    type: "minor",
    x: 180,
    y: 160,
    icon: "🌿",
    statsText: ["+10 to Dexterity", "+10 to maximum Life"],
    connections: ["ran_eva_1", "scion_dex_1"],
    statsModifiers: { dexterity: 10, maxHpFlat: 10 }
  },
  keystone_acrobatics: {
    id: "keystone_acrobatics",
    name: "Acrobatics",
    type: "keystone",
    x: 340,
    y: 540,
    icon: "🌪️",
    statsText: [
      "KEYSTONE PASSIVE:",
      "50% More chance to Evade Attacks",
      "+15% increased Movement Speed",
      "Armour and Energy Shield are halved"
    ],
    connections: ["ran_eva_2"],
    statsModifiers: { evasionPercent: 60, movementSpeedPercent: 15 }
  },

  // ================= WITCH (NORTH) =================
  start_witch: {
    id: "start_witch",
    name: "Witch Starting Spire",
    type: "start",
    x: 0,
    y: -330,
    icon: "🔮",
    statsText: ["Starting point for the Witch", "+14 to Intelligence"],
    connections: ["wit_spell_1", "wit_es_1"],
    startingClass: "Witch",
    statsModifiers: { intelligence: 14 }
  },
  wit_spell_1: {
    id: "wit_spell_1",
    name: "Arcane Destruction",
    type: "minor",
    x: -70,
    y: -390,
    icon: "⚡",
    statsText: ["12% increased Spell Damage", "+10 to Intelligence"],
    connections: ["start_witch", "wit_spell_2"],
    statsModifiers: { dpsPercent: 12, intelligence: 10 }
  },
  wit_spell_2: {
    id: "wit_spell_2",
    name: "Heart of Destruction",
    type: "notable",
    x: -110,
    y: -480,
    icon: "☄️",
    statsText: ["25% increased Elemental Damage", "+15% to All Elemental Resistances"],
    connections: ["wit_spell_1", "keystone_elemental_overload"],
    statsModifiers: { dpsPercent: 25, fireRes: 15, coldRes: 15, lightningRes: 15 }
  },
  wit_es_1: {
    id: "wit_es_1",
    name: "Ethereal Barrier",
    type: "minor",
    x: 70,
    y: -390,
    icon: "🔷",
    statsText: ["+25 to maximum Energy Shield", "+10 to Intelligence"],
    connections: ["start_witch", "wit_es_2", "witch_bridge_1"],
    statsModifiers: { energyShieldFlat: 25, intelligence: 10 }
  },
  wit_es_2: {
    id: "wit_es_2",
    name: "Arcane Sanctuary",
    type: "notable",
    x: 120,
    y: -480,
    icon: "💎",
    statsText: ["+50 to maximum Energy Shield", "+20% increased Energy Shield Recovery rate"],
    connections: ["wit_es_1", "keystone_chaos_inoculation"],
    statsModifiers: { energyShieldFlat: 50, energyShieldPercent: 20 }
  },
  witch_bridge_1: {
    id: "witch_bridge_1",
    name: "Scholastic Leyline",
    type: "minor",
    x: 30,
    y: -190,
    icon: "📖",
    statsText: ["+10 to Intelligence", "+15 to maximum Mana"],
    connections: ["wit_es_1", "scion_int_1"],
    statsModifiers: { intelligence: 10, manaFlat: 15 }
  },
  keystone_chaos_inoculation: {
    id: "keystone_chaos_inoculation",
    name: "Chaos Inoculation",
    type: "keystone",
    x: 180,
    y: -570,
    icon: "💀",
    statsText: [
      "KEYSTONE PASSIVE:",
      "Maximum Life becomes 1",
      "Immune to Chaos Damage (100% Chaos Resistance)",
      "+50% more Energy Shield"
    ],
    connections: ["wit_es_2"],
    statsModifiers: { isChaosInoculation: true, chaosRes: 100, energyShieldPercent: 50 }
  },
  keystone_elemental_overload: {
    id: "keystone_elemental_overload",
    name: "Elemental Overload",
    type: "keystone",
    x: -160,
    y: -570,
    icon: "✨",
    statsText: [
      "KEYSTONE PASSIVE:",
      "40% More Elemental Damage if you've Crit in the past 8 seconds",
      "No critical strike damage multiplier"
    ],
    connections: ["wit_spell_2"],
    statsModifiers: { dpsPercent: 40 }
  },

  // ================= TEMPLAR (NORTH-WEST) =================
  start_templar: {
    id: "start_templar",
    name: "Templar Starting Cathedral",
    type: "start",
    x: -280,
    y: -220,
    icon: "⚡",
    statsText: ["Starting point for the Templar", "+10 to Strength", "+10 to Intelligence"],
    connections: ["tem_faith_1", "tem_smite_1"],
    startingClass: "Templar",
    statsModifiers: { strength: 10, intelligence: 10 }
  },
  tem_faith_1: {
    id: "tem_faith_1",
    name: "Righteous Zeal",
    type: "minor",
    x: -350,
    y: -270,
    icon: "🕯️",
    statsText: ["+15 to maximum Life", "+15 to maximum Energy Shield"],
    connections: ["start_templar", "tem_faith_2"],
    statsModifiers: { maxHpFlat: 15, energyShieldFlat: 15 }
  },
  tem_faith_2: {
    id: "tem_faith_2",
    name: "Sanctuary of the Divine",
    type: "notable",
    x: -430,
    y: -340,
    icon: "⛪",
    statsText: ["+30 to maximum Life", "+30 to Energy Shield", "+15% to All Elemental Resistances"],
    connections: ["tem_faith_1"],
    statsModifiers: { maxHpFlat: 30, energyShieldFlat: 30, fireRes: 15, coldRes: 15, lightningRes: 15 }
  },
  tem_smite_1: {
    id: "tem_smite_1",
    name: "Holy Crusader",
    type: "minor",
    x: -220,
    y: -300,
    icon: "🔨",
    statsText: ["12% increased Physical & Elemental Damage"],
    connections: ["start_templar", "wit_spell_1"],
    statsModifiers: { dpsPercent: 12 }
  },

  // ================= SHADOW (NORTH-EAST) =================
  start_shadow: {
    id: "start_shadow",
    name: "Shadow Starting Alley",
    type: "start",
    x: 280,
    y: -220,
    icon: "🗡️",
    statsText: ["Starting point for the Shadow", "+10 to Dexterity", "+10 to Intelligence"],
    connections: ["sha_crit_1", "sha_poison_1"],
    startingClass: "Shadow",
    statsModifiers: { dexterity: 10, intelligence: 10 }
  },
  sha_crit_1: {
    id: "sha_crit_1",
    name: "Assassination Prowess",
    type: "minor",
    x: 350,
    y: -270,
    icon: "🩸",
    statsText: ["20% increased Critical Strike Chance", "4% increased Attack & Cast Speed"],
    connections: ["start_shadow", "sha_crit_2"],
    statsModifiers: { dpsPercent: 10, dexterity: 5 }
  },
  sha_crit_2: {
    id: "sha_crit_2",
    name: "Nightstalker",
    type: "notable",
    x: 430,
    y: -340,
    icon: "🥷",
    statsText: ["40% increased Critical Strike Chance", "+25% to Critical Strike Multiplier", "+10% to Chaos Resistance"],
    connections: ["sha_crit_1", "keystone_ghost_dance"],
    statsModifiers: { dpsPercent: 28, chaosRes: 10 }
  },
  sha_poison_1: {
    id: "sha_poison_1",
    name: "Toxic Infusion",
    type: "minor",
    x: 220,
    y: -300,
    icon: "🧪",
    statsText: ["15% increased Chaos and Poison Damage"],
    connections: ["start_shadow", "wit_es_1"],
    statsModifiers: { dpsPercent: 12, chaosRes: 5 }
  },
  keystone_ghost_dance: {
    id: "keystone_ghost_dance",
    name: "Ghost Dance",
    type: "keystone",
    x: 510,
    y: -410,
    icon: "👻",
    statsText: [
      "KEYSTONE PASSIVE:",
      "Surround yourself with 3 Ghost Shrouds",
      "When hit, Ghost Shroud instantly recovers Energy Shield based on your Evasion Rating",
      "+25% increased Evasion Rating"
    ],
    connections: ["sha_crit_2"],
    statsModifiers: { evasionPercent: 25, energyShieldFlat: 40 }
  }
};
