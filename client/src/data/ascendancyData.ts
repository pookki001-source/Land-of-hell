export interface AscendancyNode {
  id: string;
  name: string;
  icon: string;
  description: string;
  stats: {
    bonusDpsPercent?: number;
    bonusLifePercent?: number;
    bonusArmourPercent?: number;
    bonusEvasionPercent?: number;
    bonusEnergyShieldPercent?: number;
    fireRes?: number;
    coldRes?: number;
    lightningRes?: number;
    chaosRes?: number;
    critChance?: number;
    attackSpeedPercent?: number;
    movementSpeedPercent?: number;
    physicalDamageReduction?: number;
    blockChance?: number;
    spellSuppression?: number;
  };
}

export interface AscendancyClass {
  id: string;
  name: string;
  baseClass: string;
  title: string;
  icon: string;
  description: string;
  flavorQuote: string;
  nodes: AscendancyNode[];
}

export const ASCENDANCY_CLASSES: Record<string, AscendancyClass> = {
  // ================= 🔴 MARAUDER ASCENDANCIES =================
  juggernaut: {
    id: "juggernaut",
    name: "Juggernaut",
    baseClass: "Marauder",
    title: "The Unstoppable Mountain",
    icon: "🛡️",
    description: "Master of extreme physical mitigation, armour stacking, and complete crowd-control immunity.",
    flavorQuote: "There is no force on Wraeclast that can fell an unyielding mountain.",
    nodes: [
      {
        id: "jug_unbreakable",
        name: "Unbreakable",
        icon: "🧱",
        description: "+50% to Maximum Armour, 8% of Armour applies to Elemental Damage taken.",
        stats: { bonusArmourPercent: 50, physicalDamageReduction: 10 }
      },
      {
        id: "jug_unstoppable",
        name: "Unstoppable",
        icon: "🏃‍♂️",
        description: "Action Speed cannot be modified to below base value. +10% increased Movement Speed.",
        stats: { movementSpeedPercent: 10 }
      },
      {
        id: "jug_undeniable",
        name: "Undeniable",
        icon: "🎯",
        description: "Accuracy Rating is doubled. +30% increased Attack Speed.",
        stats: { attackSpeedPercent: 30, bonusDpsPercent: 15 }
      },
      {
        id: "jug_untiring",
        name: "Untiring",
        icon: "❤️",
        description: "+25% to Maximum Life. Regenerate 2% of Life per second.",
        stats: { bonusLifePercent: 25 }
      }
    ]
  },
  berserker: {
    id: "berserker",
    name: "Berserker",
    baseClass: "Marauder",
    title: "The Savage Bloodrager",
    icon: "🪓",
    description: "Deals monstrous melee damage and rapid attack speeds at the cost of bloodlust frenzy.",
    flavorQuote: "Pain is merely kindling for the furnace of true savagery.",
    nodes: [
      {
        id: "ber_aspect_carnage",
        name: "Aspect of Carnage",
        icon: "🩸",
        description: "40% MORE Total Damage. 10% increased damage taken.",
        stats: { bonusDpsPercent: 40 }
      },
      {
        id: "ber_blitz",
        name: "Blitz Charges",
        icon: "⚡",
        description: "+50% increased Attack Speed, +15% Critical Strike Chance.",
        stats: { attackSpeedPercent: 50, critChance: 15 }
      },
      {
        id: "ber_rite_ruin",
        name: "Rite of Ruin",
        icon: "🔥",
        description: "Triple rage bonuses. Gain +25% increased Physical and Fire Damage.",
        stats: { bonusDpsPercent: 25 }
      },
      {
        id: "ber_flawless_savagery",
        name: "Flawless Savagery",
        icon: "💥",
        description: "+50% to Critical Strike Multiplier, +20% flat Damage.",
        stats: { bonusDpsPercent: 20, critChance: 10 }
      }
    ]
  },
  chieftain: {
    id: "chieftain",
    name: "Chieftain",
    baseClass: "Marauder",
    title: "The Karui Fire Shaman",
    icon: "🌋",
    description: "Channels ancestral spirits and volcanic flames for maximum Fire Resistance and burning devastation.",
    flavorQuote: "The volcano breathes, and in its breath we hear our ancestors roar.",
    nodes: [
      {
        id: "chi_tasalio",
        name: "Tasalio, Cleansing Water",
        icon: "🌊",
        description: "+50% to Fire Resistance, Fire Resistance also applies to Cold and Lightning.",
        stats: { fireRes: 50, coldRes: 25, lightningRes: 25 }
      },
      {
        id: "chi_ngamahu",
        name: "Ngamahu, Flame's Advance",
        icon: "🔥",
        description: "100% of Physical Damage converted to Fire Damage. Enemies explode for 500% Life.",
        stats: { bonusDpsPercent: 35 }
      },
      {
        id: "chi_hinekora",
        name: "Hinekora, Death's Fury",
        icon: "💀",
        description: "+20% to Maximum Life, Enemies have -20% Fire Resistance against your hits.",
        stats: { bonusLifePercent: 20, bonusDpsPercent: 20 }
      },
      {
        id: "chi_valako",
        name: "Valako, Storm's Embrace",
        icon: "⚡",
        description: "Maximum Elemental Resistances are all increased to 80% (above default 75% cap).",
        stats: { fireRes: 15, coldRes: 15, lightningRes: 15 }
      }
    ]
  },

  // ================= 🟢 RANGER ASCENDANCIES =================
  deadeye: {
    id: "deadeye",
    name: "Deadeye",
    baseClass: "Ranger",
    title: "Master of Projectiles & Tailwind",
    icon: "🏹",
    description: "Supreme ruler of bows, extra projectiles, chain bouncing, and supersonic Tailwind speed.",
    flavorQuote: "One arrow for one heart. If they stand together, one arrow for three.",
    nodes: [
      {
        id: "dea_tailwind",
        name: "Gathering Winds",
        icon: "💨",
        description: "Gain Tailwind. +20% increased Action Speed and +25% Evasion Rating.",
        stats: { movementSpeedPercent: 20, bonusEvasionPercent: 25 }
      },
      {
        id: "dea_endless_munitions",
        name: "Endless Munitions",
        icon: "🎯",
        description: "Skills fire 2 additional Projectiles. +30% increased Area of Effect.",
        stats: { bonusDpsPercent: 35 }
      },
      {
        id: "dea_ricochet",
        name: "Ricochet",
        icon: "↩️",
        description: "Projectiles chain +1 additional time and deal 10% more damage per remaining chain.",
        stats: { bonusDpsPercent: 25 }
      },
      {
        id: "dea_focal_point",
        name: "Focal Point",
        icon: "👁️",
        description: "75% increased effect of Marks on Enemies. +15% Critical Strike Multiplier.",
        stats: { bonusDpsPercent: 20, critChance: 10 }
      }
    ]
  },
  raider: {
    id: "raider",
    name: "Raider",
    baseClass: "Ranger",
    title: "The Phantom Wind Dancer",
    icon: "🌪️",
    description: "Specializes in maximum Frenzy Charges, Phase Acrobatics, Spell Suppression, and untouchable Evasion.",
    flavorQuote: "You cannot strike what you cannot catch; you cannot catch the wind.",
    nodes: [
      {
        id: "rai_avatar_slaughter",
        name: "Avatar of the Slaughter",
        icon: "⚡",
        description: "+3 to Maximum Frenzy Charges, +30% increased Attack Speed, +30% Movement Speed.",
        stats: { attackSpeedPercent: 30, movementSpeedPercent: 30, bonusDpsPercent: 20 }
      },
      {
        id: "rai_quartz",
        name: "Quartz Infusion",
        icon: "💎",
        description: "+40% chance to Suppress Spell Damage. Permanent Phasing.",
        stats: { spellSuppression: 40, bonusEvasionPercent: 30 }
      },
      {
        id: "rai_avatar_veil",
        name: "Avatar of the Veil",
        icon: "🌫️",
        description: "Nearby enemies have -20% Elemental Resistances. Immune to Elemental Ailments.",
        stats: { fireRes: 15, coldRes: 15, lightningRes: 15, bonusDpsPercent: 20 }
      },
      {
        id: "rai_rapid_assault",
        name: "Rapid Assault",
        icon: "⚔️",
        description: "Permanent Onslaught with 100% increased Onslaught Effect.",
        stats: { attackSpeedPercent: 20, movementSpeedPercent: 20 }
      }
    ]
  },
  pathfinder: {
    id: "pathfinder",
    name: "Pathfinder",
    baseClass: "Ranger",
    title: "Master of Alchemy & Venom",
    icon: "🧪",
    description: "Infinite flask charges, immense chaos poison proliferation, and alchemical life sustain.",
    flavorQuote: "The greatest poisons are distilled from the rarest blossoms of Wraeclast.",
    nodes: [
      {
        id: "pat_nature_reprisal",
        name: "Nature's Reprisal",
        icon: "🐍",
        description: "Chaos Damage inflicts virulent Poison that spreads to all nearby enemies.",
        stats: { chaosRes: 30, bonusDpsPercent: 35 }
      },
      {
        id: "pat_master_surgeon",
        name: "Master Surgeon",
        icon: "❤️",
        description: "Life Flasks do not queue and continuously regenerate life during effects.",
        stats: { bonusLifePercent: 25 }
      },
      {
        id: "pat_nature_adrenalin",
        name: "Nature's Adrenaline",
        icon: "💧",
        description: "Flasks gain 3 charges every 3 seconds automatically. Permanent 100% flask uptime.",
        stats: { movementSpeedPercent: 15, bonusEvasionPercent: 20 }
      },
      {
        id: "pat_master_alchemist",
        name: "Master Alchemist",
        icon: "✨",
        description: "Elemental Resistances are increased by +40% while using any flask.",
        stats: { fireRes: 25, coldRes: 25, lightningRes: 25 }
      }
    ]
  },

  // ================= 🔵 WITCH ASCENDANCIES =================
  necromancer: {
    id: "necromancer",
    name: "Necromancer",
    baseClass: "Witch",
    title: "Queen of the Undead Legion",
    icon: "🧟",
    description: "Awakens armies of Skeletons, Zombies, and Spectres while commanding darkness and corpses.",
    flavorQuote: "Death is not the end of service; it is merely the beginning of obedience.",
    nodes: [
      {
        id: "nec_commander_darkness",
        name: "Commander of Darkness",
        icon: "👑",
        description: "Auras grant you and your allies +30% to all Elemental Resistances and +30% Damage.",
        stats: { fireRes: 30, coldRes: 30, lightningRes: 30, bonusDpsPercent: 30 }
      },
      {
        id: "nec_mindless_aggression",
        name: "Mindless Aggression",
        icon: "💀",
        description: "Minions have 30% increased Movement Speed and deal 45% More Damage.",
        stats: { bonusDpsPercent: 45 }
      },
      {
        id: "nec_mistress_sacrifice",
        name: "Mistress of Sacrifice",
        icon: "🩸",
        description: "Offerings affect you as well. +25% chance to Block Attacks and Spells.",
        stats: { blockChance: 25, bonusLifePercent: 15 }
      },
      {
        id: "nec_essence_glutton",
        name: "Essence Glutton",
        icon: "🔮",
        description: "+30% to Maximum Energy Shield, recover 8% Mana and ES per second near corpses.",
        stats: { bonusEnergyShieldPercent: 30 }
      }
    ]
  },
  elementalist: {
    id: "elementalist",
    name: "Elementalist",
    baseClass: "Witch",
    title: "Master of Primal Elements",
    icon: "🔥",
    description: "Channels triple elemental storms with guaranteed Ignite, Shock (+50% dmg taken), and Chill.",
    flavorQuote: "Fire burns, Lightning shocks, Ice shatters. Together, they dissolve worlds.",
    nodes: [
      {
        id: "ele_shaper_flames",
        name: "Shaper of Flames",
        icon: "🌋",
        description: "All damage can Ignite. Ignites deal 40% more Damage.",
        stats: { bonusDpsPercent: 40, fireRes: 25 }
      },
      {
        id: "ele_shaper_storms",
        name: "Shaper of Storms",
        icon: "⚡",
        description: "All damage shocks. Shocks always increase enemy damage taken by at least 30%.",
        stats: { bonusDpsPercent: 30, lightningRes: 25 }
      },
      {
        id: "ele_bastion_elements",
        name: "Bastion of Elements",
        icon: "🛡️",
        description: "Primal Aegis absorbs up to 1,500 Elemental Damage. Immune to reflected damage.",
        stats: { fireRes: 20, coldRes: 20, lightningRes: 20, bonusEnergyShieldPercent: 20 }
      },
      {
        id: "ele_mastermind_discord",
        name: "Mastermind of Discord",
        icon: "🌀",
        description: "Exposure reduces enemy Elemental Resistances by an extra -25%.",
        stats: { bonusDpsPercent: 25 }
      }
    ]
  },
  occultist: {
    id: "occultist",
    name: "Occultist",
    baseClass: "Witch",
    title: "The Empress of Curses & Void",
    icon: "🔮",
    description: "Dominates with Chaos and Cold damage, screen-wide corpse explosions, and indestructible Energy Shield.",
    flavorQuote: "Stare into the void long enough, and the void obeys your whispered command.",
    nodes: [
      {
        id: "occ_profane_bloom",
        name: "Profane Bloom",
        icon: "💥",
        description: "Cursed enemies have a 50% chance to explode on death for 25% of their Max Life as Chaos damage.",
        stats: { chaosRes: 35, bonusDpsPercent: 35 }
      },
      {
        id: "occ_vile_bastion",
        name: "Vile Bastion",
        icon: "💎",
        description: "+60% to Maximum Energy Shield. Regenerate 40 ES per slain enemy.",
        stats: { bonusEnergyShieldPercent: 60 }
      },
      {
        id: "occ_void_beacon",
        name: "Void Beacon",
        icon: "🌌",
        description: "Nearby enemies have -20% to Cold and Chaos Resistances and cannot regenerate life.",
        stats: { bonusDpsPercent: 25 }
      },
      {
        id: "occ_malediction",
        name: "Malediction",
        icon: "📜",
        description: "You can apply an additional Curse to enemies. Cursed enemies deal 10% reduced damage.",
        stats: { bonusDpsPercent: 20 }
      }
    ]
  },

  // ================= ⚔️ DUELIST ASCENDANCIES =================
  slayer: {
    id: "slayer",
    name: "Slayer",
    baseClass: "Duelist",
    title: "Executioner of Titans",
    icon: "🗡️",
    description: "Specializes in 20% Life Culling Strike, endless Overleech that persists through full life, and wide AoE.",
    flavorQuote: "No monster is too colossal to be decapitated by a swift, resolute edge.",
    nodes: [
      {
        id: "sla_headsman",
        name: "Headsman",
        icon: "💀",
        description: "Bane of Titans: Kill enemies instantly at 20% Life (Culling Strike). Cannot take Reflected Damage.",
        stats: { bonusDpsPercent: 35 }
      },
      {
        id: "sla_endless_hunger",
        name: "Endless Hunger",
        icon: "🩸",
        description: "Life Leech effects are not removed when reaching Maximum Life (Overleech). Immune to Bleeding.",
        stats: { bonusLifePercent: 20 }
      },
      {
        id: "sla_brutal_fervour",
        name: "Brutal Fervour",
        icon: "💪",
        description: "100% increased Maximum Recovery per Life Leech. +20% Attack Speed while leeching.",
        stats: { attackSpeedPercent: 25, bonusLifePercent: 15 }
      },
      {
        id: "sla_masterful_form",
        name: "Masterful Form",
        icon: "🥋",
        description: "Maximum Endurance Charges are equal to Maximum Frenzy Charges. Massive defence and damage.",
        stats: { physicalDamageReduction: 12, bonusDpsPercent: 20 }
      }
    ]
  },
  gladiator: {
    id: "gladiator",
    name: "Gladiator",
    baseClass: "Duelist",
    title: "Master of Bleed & 100% Block",
    icon: "🛡️",
    description: "King of the arena with explosive Bleeding explosions and maximum Attack/Spell Block.",
    flavorQuote: "Let them bleed upon the sand; in our iron guard, their weapons find only sorrow.",
    nodes: [
      {
        id: "gla_blood_eyes",
        name: "Bleeding Explosions",
        icon: "🩸",
        description: "Bleeding enemies explode on death dealing 20% of their Maximum Life as Physical Damage.",
        stats: { bonusDpsPercent: 35 }
      },
      {
        id: "gla_versatile_combatant",
        name: "Versatile Combatant",
        icon: "🛡️",
        description: "+35% Chance to Block Attacks and Spells. Counter-attack on every successful block.",
        stats: { blockChance: 35, physicalDamageReduction: 10 }
      },
      {
        id: "gla_violent_retaliation",
        name: "Violent Retaliation",
        icon: "⚔️",
        description: "+8% Maximum Block Cap. Gain +4% Damage and +1% Block for every hit blocked recently.",
        stats: { blockChance: 8, bonusDpsPercent: 25 }
      },
      {
        id: "gla_outmatch_outlast",
        name: "Outmatch and Outlast",
        icon: "⚡",
        description: "+25% More Physical Damage with Main Hand, 10% reduced Physical Damage taken with Off Hand.",
        stats: { bonusDpsPercent: 25, physicalDamageReduction: 10 }
      }
    ]
  },
  champion: {
    id: "champion",
    name: "Champion",
    baseClass: "Duelist",
    title: "The Unyielding Bannerlord",
    icon: "🚩",
    description: "Supreme defensive anchor with permanent Fortification (20% less damage taken) and Taunt armour buffs.",
    flavorQuote: "Stand behind my shield, exiles. No demon shall cross this line alive.",
    nodes: [
      {
        id: "cha_fortitude",
        name: "Fortitude",
        icon: "🏰",
        description: "Permanent 20 Fortification: Grants 20% less damage taken from all hits permanently.",
        stats: { physicalDamageReduction: 20, bonusArmourPercent: 35 }
      },
      {
        id: "cha_inspirational",
        name: "Inspirational",
        icon: "🚩",
        description: "Banners cost no reservation. +30% increased effect of Non-Curse Auras.",
        stats: { bonusDpsPercent: 25, movementSpeedPercent: 12 }
      },
      {
        id: "cha_first_to_strike",
        name: "First to Strike, Last to Fall",
        icon: "⚡",
        description: "Hits Intimidate enemies for 10% increased damage. Gain Adrenaline (100% damage) on low life.",
        stats: { bonusDpsPercent: 30, bonusLifePercent: 15 }
      },
      {
        id: "cha_unstoppable_hero",
        name: "Unstoppable Hero",
        icon: "🛡️",
        description: "+20% Attack Speed and +500 Armour and Evasion Rating while Fortified.",
        stats: { attackSpeedPercent: 20, bonusArmourPercent: 25, bonusEvasionPercent: 25 }
      }
    ]
  },

  // ================= ✝️ TEMPLAR ASCENDANCIES =================
  inquisitor: {
    id: "inquisitor",
    name: "Inquisitor",
    baseClass: "Templar",
    title: "Righteous Judgement",
    icon: "⚖️",
    description: "Critical strikes ignore all enemy Elemental Resistances completely while standing in Consecrated Ground.",
    flavorQuote: "The heretics burn not from our hatred, but from the searing light of divine truth.",
    nodes: [
      {
        id: "inq_inevitable_judgement",
        name: "Inevitable Judgement",
        icon: "⚡",
        description: "Critical Strikes IGNORE enemy Monster Elemental Resistances completely (0% res).",
        stats: { bonusDpsPercent: 45, critChance: 15 }
      },
      {
        id: "inq_righteous_providence",
        name: "Righteous Providence",
        icon: "✝️",
        description: "1% increased Critical Strike Chance per 1 Strength or Intelligence, whichever is lower.",
        stats: { critChance: 25 }
      },
      {
        id: "inq_sanctuary",
        name: "Sanctuary",
        icon: "🕊️",
        description: "Create Consecrated Ground while stationary. +15% Block Chance against attacks and spells.",
        stats: { blockChance: 15, bonusLifePercent: 15 }
      },
      {
        id: "inq_pious_path",
        name: "Pious Path",
        icon: "✨",
        description: "Consecrated Ground regenerates Energy Shield simultaneously with Life.",
        stats: { bonusEnergyShieldPercent: 30 }
      }
    ]
  },
  hierophant: {
    id: "hierophant",
    name: "Hierophant",
    baseClass: "Templar",
    title: "High Archon of Totems & Mana",
    icon: "🗿",
    description: "Summons multiple spell totems, transforms maximum mana into gigantic energy shields and Mind over Matter.",
    flavorQuote: "One voice is a whisper; twenty totems chanting in unison become a thunderous decree.",
    nodes: [
      {
        id: "hie_pursuit_faith",
        name: "Pursuit of Faith",
        icon: "🗿",
        description: "+2 to Maximum number of Summoned Totems. 100% increased Totem Placement Speed.",
        stats: { bonusDpsPercent: 40 }
      },
      {
        id: "hie_ritual_awakening",
        name: "Ritual of Awakening",
        icon: "⚡",
        description: "5% More Damage per Summoned Totem. Regenerate 1% of Life and Mana per Totem.",
        stats: { bonusDpsPercent: 20, bonusLifePercent: 15 }
      },
      {
        id: "hie_divine_guidance",
        name: "Divine Guidance",
        icon: "💧",
        description: "+150 to Maximum Mana. Mind over Matter takes 10% additional damage from Mana before Life.",
        stats: { bonusLifePercent: 10, bonusEnergyShieldPercent: 25 }
      },
      {
        id: "hie_sanctuary_thought",
        name: "Sanctuary of Thought",
        icon: "🧠",
        description: "50% less Mana Cost of Skills. Gain 20% of Maximum Mana as Extra Maximum Energy Shield.",
        stats: { bonusEnergyShieldPercent: 40 }
      }
    ]
  },
  guardian: {
    id: "guardian",
    name: "Guardian",
    baseClass: "Templar",
    title: "Protector of the Party",
    icon: "🛡️",
    description: "Radiates colossal auras, summons the Sentinel of Radiance, and bestows enormous Armour and ES to party.",
    flavorQuote: "No soul walks the shadow of death alone while my lantern remains alight.",
    nodes: [
      {
        id: "gua_radiant_crusade",
        name: "Radiant Crusade",
        icon: "☀️",
        description: "Summons the Sentinel of Radiance minion who burns nearby monsters for huge Fire damage.",
        stats: { bonusDpsPercent: 35, fireRes: 25 }
      },
      {
        id: "gua_unwavering_faith",
        name: "Unwavering Faith",
        icon: "✝️",
        description: "Auras grant you and allies +1% Physical Damage Reduction and +0.2% Life Regen per Aura.",
        stats: { physicalDamageReduction: 15, bonusLifePercent: 15 }
      },
      {
        id: "gua_bastion_hope",
        name: "Bastion of Hope",
        icon: "🛡️",
        description: "+20% Chance to Block Attacks and Spells. Attack Block is capped at 80%.",
        stats: { blockChance: 20 }
      },
      {
        id: "gua_time_need",
        name: "Time of Need",
        icon: "⏳",
        description: "Every 4 seconds, cleanse all curses and instantly recover 100% of Maximum Life.",
        stats: { bonusLifePercent: 25 }
      }
    ]
  },

  // ================= 🥷 SHADOW ASCENDANCIES =================
  assassin: {
    id: "assassin",
    name: "Assassin",
    baseClass: "Shadow",
    title: "Lord of Lethal Ambush",
    icon: "🗡️",
    description: "Reaches 100% Critical Strike Chance, extreme Critical Multipliers, and poisonous executions.",
    flavorQuote: "Every king and god has a carotid artery waiting for a razor's caress.",
    nodes: [
      {
        id: "ass_deadly_infusion",
        name: "Deadly Infusion",
        icon: "⚡",
        description: "+2 to Maximum Power Charges. +1.5% Base Critical Strike Chance and +5% Crit Multiplier per charge.",
        stats: { critChance: 35, bonusDpsPercent: 30 }
      },
      {
        id: "ass_ambush_assassinate",
        name: "Ambush and Assassinate",
        icon: "🩸",
        description: "Critical Strike against full life or low life deals 50% More Damage and culls.",
        stats: { bonusDpsPercent: 35 }
      },
      {
        id: "ass_noxious_strike",
        name: "Noxious Strike",
        icon: "🧪",
        description: "40% chance to Poison on Hit. Recover 0.5% Life per poison applied to target.",
        stats: { chaosRes: 25, bonusDpsPercent: 25 }
      },
      {
        id: "ass_mistwalker",
        name: "Mistwalker",
        icon: "🌫️",
        description: "Gain Elusive on Critical Strike. 8% reduced damage taken, +20% Movement Speed.",
        stats: { movementSpeedPercent: 20, bonusEvasionPercent: 25 }
      }
    ]
  },
  trickster: {
    id: "trickster",
    name: "Trickster",
    baseClass: "Shadow",
    title: "The Untouchable Shade",
    icon: "👻",
    description: "Combines Polymath skill diversity, massive Energy Shield recharge, spell suppression, and ghost shrouds.",
    flavorQuote: "A blade cannot cut smoke, and a cage cannot restrain a phantom.",
    nodes: [
      {
        id: "tri_polymath",
        name: "Polymath",
        icon: "🌟",
        description: "3% MORE Damage and 1% Life/Mana/ES recovered on kill per allocated mastery skill.",
        stats: { bonusDpsPercent: 30, bonusLifePercent: 15 }
      },
      {
        id: "tri_escape_artist",
        name: "Escape Artist",
        icon: "🧥",
        description: "+5 Maximum Energy Shield per 6 Evasion on Helmet, +1 Evasion per 6 ES on Body Armour.",
        stats: { bonusEnergyShieldPercent: 40, bonusEvasionPercent: 35 }
      },
      {
        id: "tri_spellbreaker",
        name: "Spellbreaker",
        icon: "💎",
        description: "+20% Chance to Suppress Spell Damage. Suppressed spells start Energy Shield Recharge.",
        stats: { spellSuppression: 20, bonusEnergyShieldPercent: 25 }
      },
      {
        id: "tri_soul_drinker",
        name: "Soul Drinker",
        icon: "🔮",
        description: "Energy Shield Leech effects are not removed when ES is full. 20% increased Attack/Cast Speed.",
        stats: { attackSpeedPercent: 20, bonusEnergyShieldPercent: 20 }
      }
    ]
  },
  saboteur: {
    id: "saboteur",
    name: "Saboteur",
    baseClass: "Shadow",
    title: "Master of Traps & Mines",
    icon: "💣",
    description: "Screen-filling explosive traps, chain reaction detonations, and blinding flash powder.",
    flavorQuote: "Why engage a beast face to face when ten kilograms of gunpowder can solve the dilemma?",
    nodes: [
      {
        id: "sab_chain_reaction",
        name: "Chain Reaction",
        icon: "💥",
        description: "When one trap triggers, ALL traps detonate in a colossal cascading explosion.",
        stats: { bonusDpsPercent: 45 }
      },
      {
        id: "sab_born_shadows",
        name: "Born in the Shadows",
        icon: "🕶️",
        description: "Nearby enemies are Blinded. You take 15% reduced damage from Blinded enemies.",
        stats: { bonusEvasionPercent: 30, physicalDamageReduction: 10 }
      },
      {
        id: "sab_pyromaniac",
        name: "Pyromaniac",
        icon: "🔥",
        description: "Immune to Shock and Ignite. Regenerate up to 10% Life per second from triggered traps.",
        stats: { bonusLifePercent: 20, fireRes: 25, lightningRes: 25 }
      },
      {
        id: "sab_demolitions",
        name: "Demolitions Specialist",
        icon: "🧨",
        description: "Mines and Traps have 150% increased Area of Effect and +25% Critical Multiplier.",
        stats: { bonusDpsPercent: 25, critChance: 15 }
      }
    ]
  },

  // ================= 👑 SCION ASCENDANCY =================
  ascendant: {
    id: "ascendant",
    name: "Ascendant",
    baseClass: "Scion",
    title: "The Infinite Synthesis",
    icon: "👑",
    description: "The ultimate hybrid capable of taking passive masteries from any two core classes simultaneously.",
    flavorQuote: "Wraeclast belongs not to a single path, but to the exile who walks all seven.",
    nodes: [
      {
        id: "asc_champion_path",
        name: "Champion & Slayer Soul",
        icon: "⚔️",
        description: "Permanent Fortify, Culling Strike at 10% life, +25% increased Attack Damage.",
        stats: { bonusDpsPercent: 25, physicalDamageReduction: 10 }
      },
      {
        id: "asc_deadeye_path",
        name: "Deadeye & Raider Soul",
        icon: "🏹",
        description: "+1 Additional Projectile, +20% Movement Speed, +20% Evasion Rating.",
        stats: { movementSpeedPercent: 20, bonusEvasionPercent: 20, bonusDpsPercent: 20 }
      },
      {
        id: "asc_elementalist_path",
        name: "Elementalist & Necro Soul",
        icon: "🔮",
        description: "All elemental damage shocks and ignites, +20% all Elemental Resistances, +25% Spell Damage.",
        stats: { fireRes: 20, coldRes: 20, lightningRes: 20, bonusDpsPercent: 25 }
      },
      {
        id: "asc_juggernaut_path",
        name: "Juggernaut & Inquisitor Soul",
        icon: "🛡️",
        description: "+35% Maximum Armour, Critical Strikes ignore 50% monster resistance, +20% Life.",
        stats: { bonusArmourPercent: 35, bonusLifePercent: 20, critChance: 15 }
      }
    ]
  }
};

export function getAscendanciesForClass(characterClass: string): AscendancyClass[] {
  return Object.values(ASCENDANCY_CLASSES).filter(
    (asc) => asc.baseClass.toLowerCase() === characterClass.toLowerCase()
  );
}
