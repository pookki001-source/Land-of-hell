import { Schema, type, MapSchema, ArraySchema } from "@colyseus/schema";

export class LootDrop extends Schema {
  @type("string") id: string = "";
  @type("string") name: string = "";
  @type("string") rarity: string = "currency"; // currency, magic, rare, unique
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("string") allocatedTo: string = ""; // sessionId or empty for free-for-all
}

export class ChatMessage extends Schema {
  @type("string") id: string = "";
  @type("string") sender: string = "";
  @type("string") text: string = "";
  @type("string") channel: string = "global"; // global, party, system
  @type("number") timestamp: number = 0;
}

export class Player extends Schema {
  @type("string") id: string = "";
  @type("string") name: string = "Exile";
  @type("string") characterClass: string = "Duelist"; // Duelist, Ranger, Witch, Marauder
  @type("number") x: number = 400;
  @type("number") y: number = 300;
  @type("number") targetX: number = 400;
  @type("number") targetY: number = 300;
  @type("number") speed: number = 190;
  @type("number") level: number = 1;
  @type("number") exp: number = 0;
  @type("number") maxExp: number = 100;
  @type("number") hp: number = 250;
  @type("number") maxHp: number = 250;
  @type("number") energyShield: number = 0;
  @type("number") maxEnergyShield: number = 0;
  @type("number") mana: number = 100;
  @type("number") maxMana: number = 100;
  @type("number") strength: number = 20;
  @type("number") dexterity: number = 20;
  @type("number") intelligence: number = 20;
  @type("number") dps: number = 35;
  @type("boolean") isAuto: boolean = false;
  @type("string") partyId: string = "";
  @type("number") kills: number = 0;
  @type("number") wisdomScrolls: number = 5;
  @type("number") chaosOrbs: number = 0;
  @type("number") divineOrbs: number = 0;
  @type("number") lastAttackTime: number = 0;
}

export class Monster extends Schema {
  @type("string") id: string = "";
  @type("string") name: string = "Zombie";
  @type("string") monsterType: string = "normal"; // normal, magic, rare, boss
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("number") targetX: number = 0;
  @type("number") targetY: number = 0;
  @type("number") hp: number = 60;
  @type("number") maxHp: number = 60;
  @type("number") damage: number = 12;
  @type("number") speed: number = 70;
  @type("number") expValue: number = 25;
}

export class Portal extends Schema {
  @type("string") id: string = "";
  @type("string") partyId: string = "";
  @type("string") mapName: string = "The Coast (Tier 1)";
  @type("number") x: number = 550;
  @type("number") y: number = 300;
  @type("string") targetRoomId: string = "";
}

export class TownState extends Schema {
  @type({ map: Player }) players = new MapSchema<Player>();
  @type({ map: Portal }) portals = new MapSchema<Portal>();
  @type([ChatMessage]) messages = new ArraySchema<ChatMessage>();
}

export class MapState extends Schema {
  @type("string") mapName: string = "The Twilight Strand";
  @type("number") tier: number = 1;
  @type("string") partyId: string = "";
  @type({ map: Player }) players = new MapSchema<Player>();
  @type({ map: Monster }) monsters = new MapSchema<Monster>();
  @type({ map: LootDrop }) loot = new MapSchema<LootDrop>();
  @type([ChatMessage]) messages = new ArraySchema<ChatMessage>();
  @type("number") monstersRemaining: number = 0;
  @type("number") portalX: number = 100;
  @type("number") portalY: number = 300;
}
