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
import { sounds } from "./utils/soundEffects";

export const App: React.FC = () => {
  const [room, setRoom] = useState<Room<any> | null>(null);
  const [zoneType, setZoneType] = useState<"town" | "map">("town");
  const [playerData, setPlayerData] = useState<LocalPlayerData>(() => {
    const saved = localStorage.getItem("land_of_hell_char");
    if (saved) {
      try {
        return { ...defaultPlayerData, ...JSON.parse(saved) };
      } catch (e) {}
    }
    return defaultPlayerData;
  });
  const [localPlayerState, setLocalPlayerState] = useState<any>(null);
  const [onlineCount, setOnlineCount] = useState<number>(1);
  const [statusMessage, setStatusMessage] = useState<string>("Connecting to Land of Hell Realm...");
  const [notification, setNotification] = useState<string | null>(null);

  const prevLevelRef = useRef<number>(playerData.level);

  // Save character data to localStorage on change
  useEffect(() => {
    localStorage.setItem("land_of_hell_char", JSON.stringify(playerData));
  }, [playerData]);

  // Connect to Town on initial load
  useEffect(() => {
    let currentRoom: Room<any> | null = null;

    async function initTown() {
      try {
        setStatusMessage("Entering Lioneye's Watch...");
        currentRoom = await joinTownRoom(playerData);
        setRoom(currentRoom);
        setZoneType("town");
        setStatusMessage("");

        setupRoomListeners(currentRoom);
      } catch (err: any) {
        console.error("Failed to connect to town room:", err);
        setStatusMessage("Cannot connect to Game Server. Make sure the server is running!");
      }
    }

    initTown();

    return () => {
      if (currentRoom) currentRoom.leave();
    };
  }, []);

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

          // Update persisted player data
          setPlayerData((prev) => ({
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
          }));
        }

        setOnlineCount(state.players.size || 1);
      }
    });

    activeRoom.onMessage("notification", (data: any) => {
      if (data.message) showPopupNotification(data.message);
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
    if (!room) return;
    try {
      setStatusMessage("Entering Map Instance...");
      const currentPartyId = partyId || playerData.partyId || `party_${room.sessionId}`;

      await room.leave();

      const newMapRoom = await joinMapRoom(
        currentPartyId,
        "The Twilight Strand (Tier 1)",
        1,
        playerData
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
    if (!room) return;
    try {
      setStatusMessage("Returning to Lioneye's Watch...");
      await room.leave();

      const townRoom = await joinTownRoom(playerData);
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
      {/* 2D CANVAS GAME ENGINE */}
      <GameCanvas
        room={room}
        zoneType={zoneType}
        onEnterPortal={zoneType === "town" ? handleEnterPortal : handleReturnToTown}
      />

      {/* POE HUD & ACTION OVERLAY */}
      <PoEOverlay
        room={room}
        zoneType={zoneType}
        localPlayer={localPlayerState || playerData}
        onlineCount={onlineCount}
        onOpenPortal={() => handleEnterPortal("custom_portal")}
        onReturnToTown={handleReturnToTown}
        onToggleAuto={handleToggleAuto}
      />

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
