import React, { useState, useEffect, useRef } from "react";
import { Room } from "colyseus.js";
import {
  colyseus,
  joinTownRoom,
  joinMapRoom,
  defaultPlayerData,
  LocalPlayerData
} from "./network/colyseusClient";
import { GameCanvas } from "./game/GameCanvas";
import { PoEOverlay } from "./components/PoEOverlay";
import { CharacterSelectScreen } from "./components/CharacterSelectScreen";
import { InventoryModal } from "./components/InventoryModal";
import {
  PassiveTreeModal,
  calculatePassiveTotals,
  getStartNodeForClass
} from "./components/PassiveTreeModal";
import { EquippedGear, GameItem, generateStarterGear } from "./data/itemData";
import { sounds } from "./utils/soundEffects";
import {
  saveCharacterToCloud,
  fetchUserCharacters,
  deleteCharacterFromCloud
} from "./network/supabaseClient";

export const App: React.FC = () => {
  const [characters, setCharacters] = useState<LocalPlayerData[]>(() => {
    const saved = localStorage.getItem("land_of_hell_roster");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    const singleSaved = localStorage.getItem("land_of_hell_char");
    if (singleSaved) {
      try {
        return [{ ...defaultPlayerData, ...JSON.parse(singleSaved) }];
      } catch (e) {}
    }
    return [];
  });

  const [activeCharacter, setActiveCharacter] = useState<LocalPlayerData | null>(null);
  const [isInventoryOpen, setIsInventoryOpen] = useState<boolean>(false);
  const [isPassiveTreeOpen, setIsPassiveTreeOpen] = useState<boolean>(false);
  const [room, setRoom] = useState<Room<any> | null>(null);
  const [zoneType, setZoneType] = useState<"town" | "map">("town");
  const [localPlayerState, setLocalPlayerState] = useState<any>(null);
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [notification, setNotification] = useState<string | null>(null);

  const prevLevelRef = useRef<number>(1);

  // Keyboard shortcuts: 'I'/'B' for Inventory, 'P' for Passive Tree
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "i" || e.key === "I" || e.key === "b" || e.key === "B") {
        if (activeCharacter) {
          setIsInventoryOpen((prev) => !prev);
        }
      }
      if (e.key === "p" || e.key === "P") {
        if (activeCharacter) {
          setIsPassiveTreeOpen((prev) => !prev);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeCharacter]);

  // Sync roster with Supabase Cloud on mount
  useEffect(() => {
    async function syncRoster() {
      const cloudChars = await fetchUserCharacters();
      if (cloudChars && cloudChars.length > 0) {
        setCharacters(cloudChars);
        localStorage.setItem("land_of_hell_roster", JSON.stringify(cloudChars));
      }
    }
    syncRoster();
  }, []);

  // Save active character data on change
  useEffect(() => {
    if (!activeCharacter) return;

    localStorage.setItem("land_of_hell_char", JSON.stringify(activeCharacter));

    // Update roster array
    setCharacters((prev) => {
      const updated = prev.map((c) =>
        c.name === activeCharacter.name ? { ...activeCharacter } : c
      );
      if (!updated.some((c) => c.name === activeCharacter.name)) {
        updated.push({ ...activeCharacter });
      }
      localStorage.setItem("land_of_hell_roster", JSON.stringify(updated));
      return updated;
    });

    // Debounced Cloud Save to Supabase
    const timer = setTimeout(() => {
      saveCharacterToCloud(activeCharacter);
    }, 5000);

    return () => clearTimeout(timer);
  }, [activeCharacter]);

  // Connect to Town when active character is selected
  useEffect(() => {
    if (!activeCharacter) {
      if (room) room.leave();
      setRoom(null);
      return;
    }

    let currentRoom: Room<any> | null = null;

    async function initTown() {
      try {
        setStatusMessage("Entering Lioneye's Watch...");
        currentRoom = await joinTownRoom(activeCharacter!);
        setRoom(currentRoom);
        setZoneType("town");
        setStatusMessage("");

        setupRoomListeners(currentRoom);
      } catch (err: any) {
        console.error("Failed to connect to town room:", err);
        setStatusMessage("Cannot connect to Game Server. Please try again.");
      }
    }

    initTown();

    return () => {
      if (currentRoom) currentRoom.leave();
    };
  }, [activeCharacter?.name]);

  const setupRoomListeners = (activeRoom: Room<any>) => {
    activeRoom.onStateChange((state: any) => {
      if (state.players) {
        const local = state.players.get(activeRoom.sessionId);
        if (local) {
          setLocalPlayerState({ ...local });

          // Check Level Up
          if (local.level && local.level > prevLevelRef.current) {
            sounds.playLevelUp();
            showPopupNotification(`⚡ LEVEL UP! You reached Level ${local.level}!`);
            prevLevelRef.current = local.level;
          }

          // Update persisted active character data
          setActiveCharacter((prev) => {
            if (!prev) return null;
            return {
              ...prev,
              level: local.level || prev.level,
              exp: local.exp || prev.exp,
              maxExp: local.maxExp || prev.maxExp,
              hp: local.hp || prev.hp,
              maxHp: local.maxHp || prev.maxHp,
              dps: local.dps || prev.dps,
              chaosOrbs: local.chaosOrbs !== undefined ? local.chaosOrbs : prev.chaosOrbs,
              divineOrbs: local.divineOrbs !== undefined ? local.divineOrbs : prev.divineOrbs,
              wisdomScrolls: local.wisdomScrolls !== undefined ? local.wisdomScrolls : prev.wisdomScrolls,
              kills: local.kills !== undefined ? local.kills : prev.kills
            };
          });
        }

        setOnlineCount(state.players.size || 1);
      }
    });

    activeRoom.onMessage("notification", (data: any) => {
      if (data.message) showPopupNotification(data.message);
    });
  };

  const handleSelectCharacter = (char: LocalPlayerData) => {
    prevLevelRef.current = char.level || 1;
    setActiveCharacter(char);
  };

  const handleCreateCharacter = async (newChar: LocalPlayerData) => {
    prevLevelRef.current = 1;
    await saveCharacterToCloud(newChar);
    setCharacters((prev) => [...prev, newChar]);
    setActiveCharacter(newChar);
  };

  const handleDeleteCharacter = async (name: string) => {
    await deleteCharacterFromCloud(name);
    setCharacters((prev) => prev.filter((c) => c.name !== name));
    if (activeCharacter?.name === name) {
      setActiveCharacter(null);
    }
  };

  const handleSwitchCharacter = () => {
    if (room) room.leave();
    setRoom(null);
    setActiveCharacter(null);
    setIsInventoryOpen(false);
  };

  const handleUpdateEquipment = (newGear: EquippedGear) => {
    setActiveCharacter((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        equipment: newGear
      };
    });
  };

  const handleUpdateInventory = (newInv: GameItem[]) => {
    setActiveCharacter((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        inventory: newInv
      };
    });
  };

  const handleUpdateAllocatedNodes = (newNodeIds: string[]) => {
    setActiveCharacter((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        allocatedPassives: newNodeIds
      };
    });
  };

  const showPopupNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 3500);
  };

  // Transition from Town to Map
  const handleEnterPortal = async (portalId: string, partyId?: string) => {
    if (!room || !activeCharacter) return;
    try {
      setStatusMessage("Entering Map Instance...");
      const currentPartyId = partyId || activeCharacter.partyId || `party_${room.sessionId}`;

      await room.leave();

      const newMapRoom = await joinMapRoom(
        currentPartyId,
        "The Twilight Strand (Tier 1)",
        1,
        activeCharacter
      );

      setRoom(newMapRoom);
      setZoneType("map");
      setStatusMessage("");

      setupRoomListeners(newMapRoom);
      showPopupNotification("Entered Map: The Twilight Strand! Turn on [AUTO FARM] or slay beasts manually!");
    } catch (err) {
      console.error("Failed to enter map:", err);
      setStatusMessage("Failed to enter map instance.");
    }
  };

  // Return from Map to Town
  const handleReturnToTown = async () => {
    if (!room || !activeCharacter) return;
    try {
      setStatusMessage("Returning to Lioneye's Watch...");
      await room.leave();

      const townRoom = await joinTownRoom(activeCharacter);
      setRoom(townRoom);
      setZoneType("town");
      setStatusMessage("");

      setupRoomListeners(townRoom);
      showPopupNotification("Welcome back to Lioneye's Watch!");
    } catch (err) {
      console.error("Failed to return to town:", err);
      setStatusMessage("Failed to return to town.");
    }
  };

  const handleToggleAuto = () => {
    if (zoneType === "map" && room) {
      room.send("toggle_auto");
    } else {
      showPopupNotification("Auto-Farm can only be toggled inside Maps!");
    }
  };

  return (
    <div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden" }}>
      {/* 1. CHARACTER SELECT / CREATE SCREEN */}
      {!activeCharacter && (
        <CharacterSelectScreen
          characters={characters}
          onSelectCharacter={handleSelectCharacter}
          onCreateCharacter={handleCreateCharacter}
          onDeleteCharacter={handleDeleteCharacter}
        />
      )}

      {/* 2. 2D CANVAS GAME ENGINE */}
      {activeCharacter && (
        <>
          <GameCanvas
            room={room}
            zoneType={zoneType}
            onEnterPortal={zoneType === "town" ? handleEnterPortal : handleReturnToTown}
          />

          {/* POE HUD & ACTION OVERLAY */}
          <PoEOverlay
            room={room}
            zoneType={zoneType}
            localPlayer={localPlayerState || activeCharacter}
            onlineCount={onlineCount}
            onOpenPortal={() => handleEnterPortal("custom_portal")}
            onReturnToTown={handleReturnToTown}
            onToggleAuto={handleToggleAuto}
            onSwitchCharacter={handleSwitchCharacter}
            onToggleInventory={() => setIsInventoryOpen((prev) => !prev)}
            onTogglePassiveTree={() => setIsPassiveTreeOpen((prev) => !prev)}
          />

          {/* POE TETRIS INVENTORY & EQUIPMENT MODAL */}
          <InventoryModal
            isOpen={isInventoryOpen}
            onClose={() => setIsInventoryOpen(false)}
            equipment={activeCharacter.equipment || (generateStarterGear(activeCharacter.characterClass).gear)}
            inventory={activeCharacter.inventory || (generateStarterGear(activeCharacter.characterClass).inventory)}
            onUpdateEquipment={handleUpdateEquipment}
            onUpdateInventory={handleUpdateInventory}
            characterName={activeCharacter.name}
            characterClass={activeCharacter.characterClass}
          />

          {/* POE PASSIVE SKILL CONSTELLATION MODAL */}
          <PassiveTreeModal
            isOpen={isPassiveTreeOpen}
            onClose={() => setIsPassiveTreeOpen(false)}
            allocatedNodeIds={activeCharacter.allocatedPassives || [getStartNodeForClass(activeCharacter.characterClass)]}
            onUpdateAllocatedNodes={handleUpdateAllocatedNodes}
            playerLevel={activeCharacter.level}
            characterClass={activeCharacter.characterClass}
          />
        </>
      )}

      {/* LOADING / CONNECTING MODAL */}
      {statusMessage && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(10, 8, 8, 0.88)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            color: "#f0dfb6"
          }}
        >
          <div style={{ fontSize: "24px", fontWeight: 700, marginBottom: "16px", letterSpacing: "2px" }}>
            LAND OF HELL: IDLE ONLINE
          </div>
          <div style={{ fontSize: "14px", color: "#c9b99a" }}>{statusMessage}</div>
        </div>
      )}

      {/* POPUP NOTIFICATION BANNER */}
      {notification && (
        <div
          style={{
            position: "absolute",
            top: "70px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(22, 19, 16, 0.95)",
            border: "1px solid #d4ac0d",
            boxShadow: "0 4px 20px rgba(212, 172, 13, 0.4)",
            padding: "10px 24px",
            borderRadius: "6px",
            color: "#f9e79f",
            fontWeight: 700,
            fontSize: "13px",
            zIndex: 8888,
            animation: "pulseGlow 2s infinite"
          }}
        >
          {notification}
        </div>
      )}
    </div>
  );
};
