import { Room, Client } from "colyseus";
import { MapState, Player, Monster, LootDrop, ChatMessage } from "../schema/GameState.js";

const MONSTER_TEMPLATES = [
  { name: "Dread Zombie", type: "normal", hp: 70, dmg: 8, exp: 20, speed: 45 },
  { name: "Skeleton Archer", type: "normal", hp: 55, dmg: 10, exp: 22, speed: 55 },
  { name: "Roa Screamer", type: "magic", hp: 120, dmg: 14, exp: 45, speed: 85 },
  { name: "Hillock the Despoiler", type: "boss", hp: 380, dmg: 22, exp: 180, speed: 60 }
];

export class MapRoom extends Room<MapState> {
  maxClients = 6; // Max 6 players per party like PoE!

  private nextMonsterId = 1;
  private nextLootId = 1;

  onCreate(options: any) {
    this.setState(new MapState());

    this.state.mapName = options.mapName || "The Twilight Strand (Tier 1)";
    this.state.tier = options.tier || 1;
    this.state.partyId = options.partyId || "solo";
    this.state.portalX = 120;
    this.state.portalY = 320;

    // Spawn initial monsters
    this.spawnInitialMonsters(12);

    // Combat & Simulation Loop at 20 ticks/sec (50ms)
    this.setSimulationInterval((deltaTime) => this.update(deltaTime), 50);

    // Initial message
    const msg = new ChatMessage();
    msg.id = `msg_${Date.now()}`;
    msg.sender = "Area";
    msg.text = `Entered ${this.state.mapName}. Slay monsters to earn experience and currency!`;
    msg.channel = "system";
    msg.timestamp = Date.now();
    this.state.messages.push(msg);

    // Movement handler
    this.onMessage("move", (client, data: { x: number; y: number }) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.targetX = Math.max(50, Math.min(1350, data.x));
        player.targetY = Math.max(50, Math.min(750, data.y));
        // If manual move, keep auto state unless player intentionally clicked
      }
    });

    // Toggle Auto-Farm
    this.onMessage("toggle_auto", (client) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.isAuto = !player.isAuto;
        client.send("notification", {
          message: player.isAuto ? "Auto Farm: ENABLED ⚔️" : "Auto Farm: DISABLED 🛑"
        });
      }
    });

    // Manual Attack Target
    this.onMessage("attack_monster", (client, data: { monsterId: string }) => {
      const player = this.state.players.get(client.sessionId);
      const monster = this.state.monsters.get(data.monsterId);
      if (player && monster) {
        this.playerAttackMonster(player, monster);
      }
    });

    // Pick up loot
    this.onMessage("pickup_loot", (client, data: { lootId: string }) => {
      const player = this.state.players.get(client.sessionId);
      const loot = this.state.loot.get(data.lootId);
      if (player && loot) {
        const dx = loot.x - player.x;
        const dy = loot.y - player.y;
        if (Math.hypot(dx, dy) < 120) {
          this.collectLoot(player, loot);
        }
      }
    });

    // Chat in map
    this.onMessage("chat", (client, data: { text: string }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player || !data.text?.trim()) return;

      const chatMsg = new ChatMessage();
      chatMsg.id = `msg_${Date.now()}`;
      chatMsg.sender = player.name;
      chatMsg.text = data.text.trim().substring(0, 120);
      chatMsg.channel = "party";
      chatMsg.timestamp = Date.now();
      this.state.messages.push(chatMsg);
    });
  }

  onJoin(client: Client, options: any) {
    const player = new Player();
    player.id = client.sessionId;
    player.name = options.name || `Exile_${client.sessionId.substring(0, 4)}`;
    player.characterClass = options.characterClass || "Duelist";
    player.x = 140 + Math.random() * 40;
    player.y = 320 + Math.random() * 40;
    player.targetX = player.x;
    player.targetY = player.y;

    // Load persisted stats
    if (options.level) player.level = options.level;
    if (options.exp) player.exp = options.exp;
    if (options.hp) player.hp = options.hp;
    if (options.maxHp) player.maxHp = options.maxHp;
    if (options.energyShield !== undefined) player.energyShield = options.energyShield;
    if (options.maxEnergyShield !== undefined) player.maxEnergyShield = options.maxEnergyShield;
    if (options.strength) player.strength = options.strength;
    if (options.dexterity) player.dexterity = options.dexterity;
    if (options.intelligence) player.intelligence = options.intelligence;
    if (options.chaosOrbs) player.chaosOrbs = options.chaosOrbs;
    if (options.divineOrbs) player.divineOrbs = options.divineOrbs;
    if (options.wisdomScrolls) player.wisdomScrolls = options.wisdomScrolls;
    if (options.kills) player.kills = options.kills;
    if (options.dps) player.dps = options.dps;

    // Scale DPS based on level
    player.dps = 30 + (player.level - 1) * 15;
    player.maxHp = 220 + (player.level - 1) * 45;
    player.hp = player.maxHp;

    this.state.players.set(client.sessionId, player);

    const joinMsg = new ChatMessage();
    joinMsg.id = `msg_${Date.now()}`;
    joinMsg.sender = "Party";
    joinMsg.text = `${player.name} joined the map instance.`;
    joinMsg.channel = "party";
    joinMsg.timestamp = Date.now();
    this.state.messages.push(joinMsg);
  }

  onLeave(client: Client) {
    this.state.players.delete(client.sessionId);
  }

  private spawnInitialMonsters(count: number) {
    for (let i = 0; i < count; i++) {
      this.spawnMonster();
    }
  }

  private spawnMonster() {
    const m = new Monster();
    m.id = `m_${this.nextMonsterId++}`;

    // Random template
    const rand = Math.random();
    let template = MONSTER_TEMPLATES[0];
    if (rand > 0.92) {
      template = MONSTER_TEMPLATES[3]; // Boss
    } else if (rand > 0.7) {
      template = MONSTER_TEMPLATES[2]; // Roa magic
    } else if (rand > 0.35) {
      template = MONSTER_TEMPLATES[1]; // Skeleton
    }

    m.name = template.name;
    m.monsterType = template.type;
    const tierScale = 1 + (this.state.tier - 1) * 0.35;
    m.maxHp = Math.floor(template.hp * tierScale);
    m.hp = m.maxHp;
    m.damage = Math.floor(template.dmg * tierScale);
    m.speed = template.speed;
    m.expValue = Math.floor(template.exp * tierScale);

    // Spawn across the battle zone (x: 280 - 1300, y: 100 - 700)
    m.x = 280 + Math.random() * 1020;
    m.y = 100 + Math.random() * 600;
    m.targetX = m.x;
    m.targetY = m.y;

    this.state.monsters.set(m.id, m);
    this.state.monstersRemaining = this.state.monsters.size;
  }

  private playerAttackMonster(player: Player, monster: Monster) {
    const now = Date.now();
    if (now - player.lastAttackTime < 500) return; // Attack cooldown (0.5s)
    player.lastAttackTime = now;

    // Calculate damage with some critical strike chance
    const isCrit = Math.random() < 0.15;
    const damage = Math.floor((player.dps * (0.85 + Math.random() * 0.3)) * (isCrit ? 1.7 : 1));

    monster.hp -= damage;

    // Broadcast damage event to clients
    this.broadcast("damage_hit", {
      targetId: monster.id,
      damage,
      isCrit,
      x: monster.x,
      y: monster.y
    });

    if (monster.hp <= 0) {
      this.onMonsterKilled(player, monster);
    }
  }

  private onMonsterKilled(killer: Player, monster: Monster) {
    killer.kills++;
    this.state.monsters.delete(monster.id);

    // Award EXP to all players in map
    this.state.players.forEach((p) => {
      p.exp += monster.expValue;
      if (p.exp >= p.maxExp) {
        p.level++;
        p.exp -= p.maxExp;
        p.maxExp = Math.floor(p.maxExp * 1.5);
        p.maxHp += 45;
        p.hp = p.maxHp;
        p.dps += 15;

        const lvlMsg = new ChatMessage();
        lvlMsg.id = `msg_${Date.now()}`;
        lvlMsg.sender = "Level Up";
        lvlMsg.text = `⚡ ${p.name} has reached Level ${p.level}! (DPS: ${p.dps}, HP: ${p.maxHp})`;
        lvlMsg.channel = "system";
        lvlMsg.timestamp = Date.now();
        this.state.messages.push(lvlMsg);
      }
    });

    // Roll Loot Drop
    this.rollLoot(monster.x, monster.y, killer.id);

    // Respawn monster after 3.5 seconds to keep idle farm going!
    this.clock.setTimeout(() => {
      if (this.state.monsters.size < 14) {
        this.spawnMonster();
      }
    }, 3500);

    this.state.monstersRemaining = this.state.monsters.size;
  }

  private rollLoot(x: number, y: number, killerId: string) {
    const rand = Math.random();
    let lootName = "";
    let rarity = "currency";

    if (rand < 0.003) {
      lootName = "Mirror of Kalandra";
      rarity = "unique";
    } else if (rand < 0.02) {
      lootName = "Divine Orb";
      rarity = "unique";
    } else if (rand < 0.08) {
      lootName = "Exalted Orb";
      rarity = "rare";
    } else if (rand < 0.22) {
      lootName = "Chaos Orb";
      rarity = "rare";
    } else if (rand < 0.45) {
      lootName = "Orb of Alteration";
      rarity = "magic";
    } else if (rand < 0.75) {
      lootName = "Scroll of Wisdom";
      rarity = "currency";
    }

    if (lootName) {
      const loot = new LootDrop();
      loot.id = `loot_${this.nextLootId++}`;
      loot.name = lootName;
      loot.rarity = rarity;
      loot.x = x + (Math.random() * 30 - 15);
      loot.y = y + (Math.random() * 30 - 15);
      loot.allocatedTo = killerId;
      this.state.loot.set(loot.id, loot);

      // System announcement for valuable currency
      if (lootName === "Divine Orb" || lootName === "Mirror of Kalandra" || lootName === "Exalted Orb") {
        const dropMsg = new ChatMessage();
        dropMsg.id = `msg_${Date.now()}`;
        dropMsg.sender = "Loot";
        dropMsg.text = `✨ High-tier Drop: [${lootName}] dropped!`;
        dropMsg.channel = "system";
        dropMsg.timestamp = Date.now();
        this.state.messages.push(dropMsg);
      }
    }
  }

  private collectLoot(player: Player, loot: LootDrop) {
    if (loot.name === "Scroll of Wisdom") player.wisdomScrolls++;
    else if (loot.name === "Chaos Orb") player.chaosOrbs++;
    else if (loot.name === "Divine Orb" || loot.name === "Exalted Orb") player.divineOrbs++;
    else player.chaosOrbs++; // Generic orbs contribute to currency

    this.state.loot.delete(loot.id);
  }

  update(deltaTime: number) {
    const deltaSec = deltaTime / 1000;

    // 1. Process Players
    this.state.players.forEach((player) => {
      // Life Regen: 2% of max HP per second
      if (player.hp < player.maxHp) {
        player.hp = Math.min(player.maxHp, player.hp + player.maxHp * 0.02 * deltaSec);
      }

      // Auto-Farm AI behavior
      if (player.isAuto) {
        // Priority A: Auto-pickup nearby loot
        let nearestLoot: LootDrop | null = null;
        let nearestLootDist = 280;

        this.state.loot.forEach((loot) => {
          const dist = Math.hypot(loot.x - player.x, loot.y - player.y);
          if (dist < nearestLootDist) {
            nearestLootDist = dist;
            nearestLoot = loot;
          }
        });

        if (nearestLoot) {
          if (nearestLootDist < 35) {
            this.collectLoot(player, nearestLoot);
          } else {
            player.targetX = (nearestLoot as LootDrop).x;
            player.targetY = (nearestLoot as LootDrop).y;
          }
        } else {
          // Priority B: Hunt nearest monster
          let nearestMonster: Monster | null = null;
          let nearestDist = 650;

          this.state.monsters.forEach((monster) => {
            const dist = Math.hypot(monster.x - player.x, monster.y - player.y);
            if (dist < nearestDist) {
              nearestDist = dist;
              nearestMonster = monster;
            }
          });

          if (nearestMonster) {
            const m = nearestMonster as Monster;
            const attackRange = 75; // Melee/Spell attack range

            if (nearestDist <= attackRange) {
              // In attack range, stop moving and attack!
              player.targetX = player.x;
              player.targetY = player.y;
              this.playerAttackMonster(player, m);
            } else {
              // Move towards monster
              player.targetX = m.x;
              player.targetY = m.y;
            }
          }
        }
      }

      // Move player towards target
      const dx = player.targetX - player.x;
      const dy = player.targetY - player.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 4) {
        const moveDist = Math.min(dist, player.speed * deltaSec);
        player.x += (dx / dist) * moveDist;
        player.y += (dy / dist) * moveDist;
      } else {
        player.x = player.targetX;
        player.y = player.targetY;
      }
    });

    // 2. Process Monsters AI
    this.state.monsters.forEach((monster) => {
      // Find nearest player
      let targetPlayer: Player | null = null;
      let minDistance = 250; // Monster aggro radius

      this.state.players.forEach((player) => {
        const dist = Math.hypot(player.x - monster.x, player.y - monster.y);
        if (dist < minDistance) {
          minDistance = dist;
          targetPlayer = player;
        }
      });

      if (targetPlayer) {
        const p = targetPlayer as Player;
        const attackRange = 40;

        if (minDistance > attackRange) {
          // Move towards player
          const mdx = p.x - monster.x;
          const mdy = p.y - monster.y;
          const mdist = Math.hypot(mdx, mdy);
          monster.x += (mdx / mdist) * monster.speed * deltaSec;
          monster.y += (mdy / mdist) * monster.speed * deltaSec;
        } else {
          // Attack player
          p.hp = Math.max(0, p.hp - monster.damage * deltaSec);
          if (p.hp <= 0) {
            // Player death -> Respawn at portal with 50% HP
            p.hp = p.maxHp * 0.5;
            p.x = this.state.portalX;
            p.y = this.state.portalY;
            p.targetX = p.x;
            p.targetY = p.y;
            p.isAuto = false;

            const deathMsg = new ChatMessage();
            deathMsg.id = `msg_${Date.now()}`;
            deathMsg.sender = "Death";
            deathMsg.text = `☠️ ${p.name} was slain by ${monster.name}!`;
            deathMsg.channel = "system";
            deathMsg.timestamp = Date.now();
            this.state.messages.push(deathMsg);
          }
        }
      }
    });
  }
}
