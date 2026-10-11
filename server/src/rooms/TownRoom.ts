import { Room, Client } from "colyseus";
import { TownState, Player, ChatMessage, Portal } from "../schema/GameState.js";

export class TownRoom extends Room<TownState> {
  maxClients = 50;

  onCreate(options: any) {
    this.setState(new TownState());

    // Main game loop for moving players smoothly in town (20 ticks/sec)
    this.setSimulationInterval((deltaTime) => this.update(deltaTime), 50);

    // Initial welcome message
    const welcome = new ChatMessage();
    welcome.id = `msg_${Date.now()}`;
    welcome.sender = "System";
    welcome.text = "Welcome to Lioneye's Watch! Click to move. Gather your party or step into a Map Portal to hunt monsters.";
    welcome.channel = "system";
    welcome.timestamp = Date.now();
    this.state.messages.push(welcome);

    // Default Town Portal to Map
    const defaultPortal = new Portal();
    defaultPortal.id = "portal_strand";
    defaultPortal.mapName = "The Twilight Strand";
    defaultPortal.x = 750;
    defaultPortal.y = 350;
    defaultPortal.partyId = "public_strand";
    this.state.portals.set(defaultPortal.id, defaultPortal);

    // Handle movement
    this.onMessage("move", (client, data: { x: number; y: number }) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.targetX = Math.max(50, Math.min(1150, data.x));
        player.targetY = Math.max(50, Math.min(750, data.y));
      }
    });

    // Handle character class selection / rename
    this.onMessage("update_profile", (client, data: { name?: string; characterClass?: string }) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        if (data.name) player.name = data.name.trim().substring(0, 16);
        if (data.characterClass) player.characterClass = data.characterClass;
      }
    });

    // Handle chat
    this.onMessage("chat", (client, data: { text: string; channel?: string }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player || !data.text?.trim()) return;

      const msg = new ChatMessage();
      msg.id = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      msg.sender = player.name;
      msg.text = data.text.trim().substring(0, 120);
      msg.channel = data.channel || "global";
      msg.timestamp = Date.now();

      this.state.messages.push(msg);
      if (this.state.messages.length > 50) {
        this.state.messages.shift();
      }
    });

    // Handle party invite / create
    this.onMessage("party_create", (client) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.partyId = `party_${client.sessionId}`;
        // Create custom portal for party
        const partyPortal = new Portal();
        partyPortal.id = `portal_${player.partyId}`;
        partyPortal.partyId = player.partyId;
        partyPortal.mapName = `${player.name}'s Map`;
        partyPortal.x = 750;
        partyPortal.y = 450;
        this.state.portals.set(partyPortal.id, partyPortal);

        client.send("notification", { message: `Party created! Map Portal opened.` });
      }
    });

    this.onMessage("party_join", (client, data: { targetSessionId: string }) => {
      const player = this.state.players.get(client.sessionId);
      const target = this.state.players.get(data.targetSessionId);
      if (player && target) {
        player.partyId = target.partyId || `party_${target.id}`;
        target.partyId = player.partyId;
        client.send("notification", { message: `Joined ${target.name}'s party!` });
      }
    });
  }

  onJoin(client: Client, options: any) {
    const player = new Player();
    player.id = client.sessionId;
    player.name = options.name || `Exile_${client.sessionId.substring(0, 4)}`;
    player.characterClass = options.characterClass || "Duelist";
    player.x = 350 + Math.floor(Math.random() * 100);
    player.y = 350 + Math.floor(Math.random() * 100);
    player.targetX = player.x;
    player.targetY = player.y;

    // Load persisted stats if passed
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

    this.state.players.set(client.sessionId, player);

    const joinMsg = new ChatMessage();
    joinMsg.id = `msg_${Date.now()}`;
    joinMsg.sender = "Town";
    joinMsg.text = `${player.name} (${player.characterClass}) has entered Lioneye's Watch.`;
    joinMsg.channel = "system";
    joinMsg.timestamp = Date.now();
    this.state.messages.push(joinMsg);
  }

  onLeave(client: Client, consented: boolean) {
    const player = this.state.players.get(client.sessionId);
    if (player) {
      this.state.players.delete(client.sessionId);
    }
  }

  update(deltaTime: number) {
    const deltaSec = deltaTime / 1000;

    // Move players towards targetX, targetY
    this.state.players.forEach((player) => {
      const dx = player.targetX - player.x;
      const dy = player.targetY - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 4) {
        const moveDist = Math.min(dist, player.speed * deltaSec);
        player.x += (dx / dist) * moveDist;
        player.y += (dy / dist) * moveDist;
      } else {
        player.x = player.targetX;
        player.y = player.targetY;
      }
    });
  }
}
