import React from "react";
import {
  Hammer,
  Axe,
  Flame,
  Zap,
  Target,
  Wind,
  Droplets,
  Skull,
  Sparkles,
  Sword,
  Wand2,
  Crosshair,
  Shield,
  CircleDot,
  ScrollText,
  SunMedium,
  Footprints,
  Crown,
  ShieldAlert,
  Activity,
  Check,
  Lock
} from "lucide-react";

export const GemIcon: React.FC<{
  gemId: string | null;
  size?: number;
  color?: string;
}> = ({ gemId, size = 18, color = "#f0dfb6" }) => {
  if (!gemId) return <Sword size={size} color={color} />;

  switch (gemId) {
    case "heavy_strike":
      return <Hammer size={size} color={color} />;
    case "cleave":
      return <Axe size={size} color={color} />;
    case "molten_strike":
      return <Flame size={size} color={color} />;
    case "support_added_fire":
      return <Flame size={size} color={color} />;
    case "support_melee_phys":
      return <Sword size={size} color={color} />;
    case "split_arrow":
      return <Crosshair size={size} color={color} />;
    case "toxic_rain":
      return <Droplets size={size} color={color} />;
    case "cyclone":
      return <Wind size={size} color={color} />;
    case "support_gmp":
      return <Target size={size} color={color} />;
    case "support_faster_attacks":
      return <Zap size={size} color={color} />;
    case "fireball":
      return <Flame size={size} color={color} />;
    case "arc":
      return <Zap size={size} color={color} />;
    case "raise_zombie":
      return <Skull size={size} color={color} />;
    case "support_spell_echo":
      return <Wand2 size={size} color={color} />;
    case "support_added_lightning":
      return <Sparkles size={size} color={color} />;
    default:
      return <Sword size={size} color={color} />;
  }
};

export const FlaskBottleIcon: React.FC<{
  type: "Life" | "Mana" | "Speed" | "Armor" | "Crit";
  size?: number;
}> = ({ type, size = 20 }) => {
  let liquidColor = "#c0392b"; // Red
  if (type === "Mana") liquidColor = "#2980b9"; // Blue
  else if (type === "Speed") liquidColor = "#27ae60"; // Green
  else if (type === "Armor") liquidColor = "#7f8c8d"; // Iron grey
  else if (type === "Crit") liquidColor = "#f39c12"; // Amber

  return (
    <svg width={size} height={size * 1.3} viewBox="0 0 24 32" fill="none">
      {/* Bottle stopper */}
      <rect x="9" y="1" width="6" height="4" rx="1" fill="#795548" stroke="#4e342e" strokeWidth="1" />
      {/* Bottle neck */}
      <path d="M10 5H14V9H10V5Z" fill="#1e1e1e" stroke="#555" strokeWidth="1" />
      {/* Bottle bulb body */}
      <path
        d="M6 11C6 9.5 8 9 10 9H14C16 9 18 9.5 18 11L21 26C21 28.5 19 30 16 30H8C5 30 3 28.5 3 26L6 11Z"
        fill="#121212"
        stroke="#666"
        strokeWidth="1.5"
      />
      {/* Liquid Fill */}
      <path
        d="M4.5 18L5.5 25.5C5.8 27.5 7.5 28.5 10 28.5H14C16.5 28.5 18.2 27.5 18.5 25.5L19.5 18H4.5Z"
        fill={liquidColor}
      />
      {/* Glass Specular Reflection Highlight */}
      <path
        d="M6.5 13L5.5 24"
        stroke="rgba(255, 255, 255, 0.45)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
};

export const AscendancySubclassIcon: React.FC<{
  id: string;
  size?: number;
  color?: string;
}> = ({ id, size = 32, color = "#f1c40f" }) => {
  switch (id) {
    case "juggernaut":
    case "gladiator":
    case "guardian":
      return <Shield size={size} color={color} />;
    case "berserker":
      return <Axe size={size} color={color} />;
    case "chieftain":
    case "elementalist":
      return <Flame size={size} color={color} />;
    case "deadeye":
    case "assassin":
      return <Crosshair size={size} color={color} />;
    case "raider":
    case "cyclone":
      return <Wind size={size} color={color} />;
    case "pathfinder":
      return <Droplets size={size} color={color} />;
    case "necromancer":
      return <Skull size={size} color={color} />;
    case "occultist":
      return <Sparkles size={size} color={color} />;
    case "slayer":
    case "champion":
      return <Sword size={size} color={color} />;
    case "inquisitor":
      return <Zap size={size} color={color} />;
    case "hierophant":
      return <Target size={size} color={color} />;
    case "trickster":
      return <Sparkles size={size} color={color} />;
    case "saboteur":
      return <Target size={size} color={color} />;
    case "ascendant":
    default:
      return <CircleDot size={size} color={color} />;
  }
};

export const ClassVectorIcon: React.FC<{
  classId: string;
  size?: number;
  color?: string;
}> = ({ classId, size = 24, color }) => {
  const norm = classId.toLowerCase();
  if (norm.includes("marauder")) return <Axe size={size} color={color || "#c0392b"} />;
  if (norm.includes("ranger")) return <Target size={size} color={color || "#27ae60"} />;
  if (norm.includes("witch")) return <Wand2 size={size} color={color || "#8e44ad"} />;
  if (norm.includes("duelist")) return <Sword size={size} color={color || "#e67e22"} />;
  if (norm.includes("templar")) return <Shield size={size} color={color || "#3498db"} />;
  if (norm.includes("shadow")) return <Zap size={size} color={color || "#16a085"} />;
  if (norm.includes("scion")) return <Crown size={size} color={color || "#f1c40f"} />;
  return <Sword size={size} color={color || "#e0d3ba"} />;
};

export const ItemVectorIcon: React.FC<{
  item: {
    name: string;
    baseName?: string;
    slotType?: string;
    rarity?: string;
  };
  size?: number;
}> = ({ item, size = 22 }) => {
  const name = item.name.toLowerCase();
  const base = (item.baseName || "").toLowerCase();
  const slot = item.slotType || "";

  // Currency
  if (slot === "currency" || item.rarity === "currency") {
    if (name.includes("wisdom") || base.includes("wisdom")) {
      return <ScrollText size={size} color="#bfa15f" />;
    }
    if (name.includes("transmut") || base.includes("transmut")) {
      return <CircleDot size={size} color="#5dade2" />;
    }
    if (name.includes("chaos") || base.includes("chaos")) {
      return <SunMedium size={size} color="#f39c12" />;
    }
    if (name.includes("divine") || base.includes("divine")) {
      return <Sparkles size={size} color="#f1c40f" />;
    }
    return <CircleDot size={size} color="#aa9e82" />;
  }

  // Weapons & Offhand
  if (slot === "mainHand") {
    if (name.includes("bow") || base.includes("bow")) {
      return <Target size={size} color="#27ae60" />;
    }
    if (name.includes("wand") || base.includes("wand") || name.includes("staff") || base.includes("staff")) {
      return <Wand2 size={size} color="#af7ac5" />;
    }
    if (name.includes("club") || base.includes("club") || name.includes("mace") || base.includes("mace") || name.includes("hammer")) {
      return <Hammer size={size} color="#bdc3c7" />;
    }
    if (name.includes("axe") || base.includes("axe")) {
      return <Axe size={size} color="#bdc3c7" />;
    }
    return <Sword size={size} color="#bdc3c7" />;
  }

  if (slot === "offHand") {
    if (name.includes("quiver") || base.includes("quiver")) {
      return <Crosshair size={size} color="#2ecc71" />;
    }
    return <Shield size={size} color="#95a5a6" />;
  }

  // Armor slots
  if (slot === "helmet") {
    return <Crown size={size} color="#f1c40f" />;
  }
  if (slot === "bodyArmour") {
    return <ShieldAlert size={size} color="#a6acaf" />;
  }
  if (slot === "boots") {
    return <Footprints size={size} color="#a0522d" />;
  }
  if (slot === "gloves") {
    return <Shield size={size} color="#8a7e6b" />;
  }
  if (slot === "ring1" || slot === "ring2") {
    return <CircleDot size={size} color="#f39c12" />;
  }
  if (slot === "belt") {
    return <Activity size={size} color="#d35400" />;
  }
  if (slot === "amulet") {
    return <Sparkles size={size} color="#5dade2" />;
  }

  // Fallback
  return <Sword size={size} color="#bdc3c7" />;
};


