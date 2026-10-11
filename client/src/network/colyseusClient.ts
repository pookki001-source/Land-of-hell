import { Client, Room } from "colyseus.js";

const isLocal = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ||
  (isLocal
    ? `ws://${window.location.hostname}:2567`
    : `wss://land-of-hell.onrender.com`);

export const colyseus = new Client(SERVER_URL);

import { EquippedGear, GameItem, generateStarterGear } from "../data/itemData";

import { SocketsSetup } from "../components/GemSocketModal";

export interface LocalPlayerData {
  name: string;
  characterClass: string;
  level: number;
  exp: number;
  maxExp: number;
  hp: number;
  maxHp: number;
  energyShield: number;
  maxEnergyShield: number;
  mana: number;
  maxMana: number;
  strength: number;
  dexterity: number;
  intelligence: number;
  armour: number;
  evasion: number;
  dps: number;
  chaosOrbs: number;
  divineOrbs: number;
  wisdomScrolls: number;
  kills: number;
  partyId: string;
  equipment?: EquippedGear;
  inventory?: GameItem[];
  allocatedPassives?: string[];
  socketsSetup?: SocketsSetup;
  inventoryGems?: string[];
  ascendancyClass?: string;
  ascendancyNodes?: string[];
}

const starter = generateStarterGear("Duelist");

export const defaultPlayerData: LocalPlayerData = {
  name: `Exile_${Math.floor(1000 + Math.random() * 9000)}`,
  characterClass: "Duelist",
  level: 1,
  exp: 0,
  maxExp: 100,
  hp: 275,
  maxHp: 275,
  energyShield: 0,
  maxEnergyShield: 0,
  mana: 85,
  maxMana: 85,
  strength: 23,
  dexterity: 23,
  intelligence: 14,
  armour: 50,
  evasion: 65,
  dps: 45,
  chaosOrbs: 0,
  divineOrbs: 0,
  wisdomScrolls: 5,
  kills: 0,
  partyId: "",
  equipment: starter.gear,
  inventory: starter.inventory,
  allocatedPassives: ["start_duelist"],
  socketsSetup: {
    slot: "mainHand",
    colors: ["red", "red", "green"],
    links: [true, false],
    socketedGems: ["cleave", "support_added_fire", null]
  },
  inventoryGems: [
    "heavy_strike",
    "support_melee_phys",
    "split_arrow",
    "support_gmp",
    "support_faster_attacks",
    "fireball",
    "arc",
    "raise_zombie"
  ]
};

export async function joinTownRoom(playerData: LocalPlayerData): Promise<Room<any>> {
  return await colyseus.joinOrCreate("town", {
    name: playerData.name,
    characterClass: playerData.characterClass,
    level: playerData.level,
    exp: playerData.exp,
    chaosOrbs: playerData.chaosOrbs,
    divineOrbs: playerData.divineOrbs,
    wisdomScrolls: playerData.wisdomScrolls
  });
}

export async function joinMapRoom(
  partyId: string,
  mapName: string,
  tier: number,
  playerData: LocalPlayerData
): Promise<Room<any>> {
  return await colyseus.joinOrCreate("map", {
    partyId,
    mapName,
    tier,
    name: playerData.name,
    characterClass: playerData.characterClass,
    level: playerData.level,
    exp: playerData.exp,
    hp: playerData.hp,
    maxHp: playerData.maxHp,
    dps: playerData.dps,
    chaosOrbs: playerData.chaosOrbs,
    divineOrbs: playerData.divineOrbs,
    wisdomScrolls: playerData.wisdomScrolls,
    kills: playerData.kills
  });
}
