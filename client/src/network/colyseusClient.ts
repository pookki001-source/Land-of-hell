import { Client, Room } from "colyseus.js";

const SERVER_URL =
  import.meta.env.VITE_SERVER_URL ||
  (window.location.protocol === "https:"
    ? `wss://${window.location.hostname}:2567`
    : `ws://${window.location.hostname || "localhost"}:2567`);

export const colyseus = new Client(SERVER_URL);

export interface LocalPlayerData {
  name: string;
  characterClass: string;
  level: number;
  exp: number;
  maxExp: number;
  hp: number;
  maxHp: number;
  mana: number;
  maxMana: number;
  dps: number;
  chaosOrbs: number;
  divineOrbs: number;
  wisdomScrolls: number;
  kills: number;
  partyId: string;
}

export const defaultPlayerData: LocalPlayerData = {
  name: `Exile_${Math.floor(1000 + Math.random() * 9000)}`,
  characterClass: "Duelist",
  level: 1,
  exp: 0,
  maxExp: 100,
  hp: 250,
  maxHp: 250,
  mana: 100,
  maxMana: 100,
  dps: 35,
  chaosOrbs: 0,
  divineOrbs: 0,
  wisdomScrolls: 5,
  kills: 0,
  partyId: ""
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
