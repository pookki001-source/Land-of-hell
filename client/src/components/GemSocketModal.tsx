import React, { useState } from "react";
import { SKILL_GEMS, SkillGem, GemColor, calculateLinkedSkill } from "../data/gemData";
import { GameItem, EquippedGear } from "../data/itemData";
import { sounds } from "../utils/soundEffects";
import { X, Sparkles, RefreshCw, Zap, Shield, Link2, Plus, Trash2, Palette, CircleDot } from "lucide-react";
import { GemIcon } from "./GemIconHelper";

export interface SocketsSetup {
  slot: "mainHand" | "bodyArmour";
  colors: GemColor[];
  links: boolean[]; // links[i] = true means socket i is linked to i+1
  socketedGems: (string | null)[]; // Gem IDs
}

interface GemSocketModalProps {
  isOpen: boolean;
  onClose: () => void;
  socketsSetup: SocketsSetup;
  onUpdateSocketsSetup: (newSetup: SocketsSetup) => void;
  inventoryGems: string[]; // List of Gem IDs in player's inventory
  onUpdateInventoryGems: (gems: string[]) => void;
  chaosOrbs: number;
  wisdomScrolls: number;
  onCraftCurrency: (currency: "chromatic" | "jeweller" | "fusing") => void;
}

export const GemSocketModal: React.FC<GemSocketModalProps> = ({
  isOpen,
  onClose,
  socketsSetup,
  onUpdateSocketsSetup,
  inventoryGems,
  onUpdateInventoryGems,
  chaosOrbs,
  wisdomScrolls,
  onCraftCurrency
}) => {
  const [selectedGemToSocket, setSelectedGemToSocket] = useState<string | null>(null);

  if (!isOpen) return null;

  // Insert gem into socket
  const handleSocketGem = (socketIndex: number) => {
    if (!selectedGemToSocket) {
      // If clicking already socketed gem: unsocket it!
      const existingGemId = socketsSetup.socketedGems[socketIndex];
      if (existingGemId) {
        sounds.playHitSound();
        const newGems = [...socketsSetup.socketedGems];
        newGems[socketIndex] = null;
        onUpdateSocketsSetup({ ...socketsSetup, socketedGems: newGems });
        onUpdateInventoryGems([...inventoryGems, existingGemId]);
      }
      return;
    }

    const gem = SKILL_GEMS[selectedGemToSocket];
    if (!gem) return;

    // Check color matching
    const socketColor = socketsSetup.colors[socketIndex];
    if (socketColor !== gem.color) {
      alert(`Cannot socket a ${gem.color.toUpperCase()} gem into a ${socketColor.toUpperCase()} socket!`);
      return;
    }

    sounds.playLevelUp();
    const newSocketedGems = [...socketsSetup.socketedGems];

    // If socket already had a gem, return it to inventory
    const oldGemId = newSocketedGems[socketIndex];
    if (oldGemId) {
      inventoryGems.push(oldGemId);
    }

    newSocketedGems[socketIndex] = gem.id;

    // Remove socketed gem from inventory
    const newInventoryGems = inventoryGems.filter((g) => g !== selectedGemToSocket);

    onUpdateSocketsSetup({ ...socketsSetup, socketedGems: newSocketedGems });
    onUpdateInventoryGems(newInventoryGems);
    setSelectedGemToSocket(null);
  };

  // Crafting handlers
  const handleRerollColors = () => {
    sounds.playHitSound();
    const colors: GemColor[] = ["red", "green", "blue"];
    const newColors = socketsSetup.colors.map(
      () => colors[Math.floor(Math.random() * colors.length)]
    );
    // Unsocket any gems that no longer match their new socket color
    const newSocketed = [...socketsSetup.socketedGems];
    const returnedToInv: string[] = [];
    newSocketed.forEach((gId, idx) => {
      if (gId && SKILL_GEMS[gId]?.color !== newColors[idx]) {
        returnedToInv.push(gId);
        newSocketed[idx] = null;
      }
    });

    onUpdateSocketsSetup({ ...socketsSetup, colors: newColors, socketedGems: newSocketed });
    if (returnedToInv.length > 0) {
      onUpdateInventoryGems([...inventoryGems, ...returnedToInv]);
    }
    onCraftCurrency("chromatic");
  };

  const handleRerollSockets = () => {
    sounds.playHitSound();
    const maxSockets = socketsSetup.slot === "bodyArmour" ? 6 : 4;
    const count = Math.min(maxSockets, Math.max(2, Math.floor(2 + Math.random() * (maxSockets - 1))));
    const colorsList: GemColor[] = ["red", "green", "blue"];

    const newColors: GemColor[] = Array.from({ length: count }, () =>
      colorsList[Math.floor(Math.random() * colorsList.length)]
    );
    const newLinks: boolean[] = Array.from({ length: count - 1 }, () => Math.random() > 0.4);
    const newSocketed: (string | null)[] = Array.from({ length: count }, () => null);

    // Return all currently socketed gems to inventory
    const returnedGems = socketsSetup.socketedGems.filter(Boolean) as string[];
    onUpdateInventoryGems([...inventoryGems, ...returnedGems]);

    onUpdateSocketsSetup({
      ...socketsSetup,
      colors: newColors,
      links: newLinks,
      socketedGems: newSocketed
    });
    onCraftCurrency("jeweller");
  };

  const handleRerollLinks = () => {
    sounds.playHitSound();
    // High chance of 2-3 links, smaller chance of fully linked!
    const isFullLink = Math.random() < 0.35;
    const newLinks = socketsSetup.links.map(() => isFullLink || Math.random() > 0.3);

    onUpdateSocketsSetup({ ...socketsSetup, links: newLinks });
    onCraftCurrency("fusing");
  };

  // Find active skills and their linked supports
  const activeSkillsLinked = getActiveSkillsAndSupports(socketsSetup);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(8, 7, 7, 0.8)",
        backdropFilter: "blur(5px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 99999,
        pointerEvents: "auto"
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "920px",
          height: "600px",
          backgroundColor: "#110f0e",
          border: "2px solid #5d4f3b",
          boxShadow: "0 10px 40px rgba(0,0,0,0.95), 0 0 20px rgba(93, 79, 59, 0.4)",
          borderRadius: "8px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            height: "46px",
            backgroundColor: "#1c1815",
            borderBottom: "1px solid #3d352a",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 20px",
            color: "#f0dfb6",
            fontWeight: 700,
            fontSize: "14px",
            letterSpacing: "1.5px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Sparkles size={16} color="#1abc9c" /> SKILL GEMS & SOCKET LINKING FORGE
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#8a7e6b",
              cursor: "pointer",
              display: "flex",
              alignItems: "center"
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, display: "flex", padding: "18px", gap: "20px" }}>
          {/* ================= LEFT: EQUIPMENT SOCKET FORGE ================= */}
          <div
            style={{
              flex: 1.2,
              backgroundColor: "#151311",
              border: "1px solid #2d261e",
              borderRadius: "6px",
              padding: "18px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
          >
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#f0dfb6", marginBottom: "4px" }}>
                EQUIPPED WEAPON SOCKETS ({socketsSetup.colors.length} Sockets)
              </div>
              <div style={{ fontSize: "11px", color: "#8a7e6b", marginBottom: "20px" }}>
                Click a Gem below, then click a matching colored Socket to insert. Right-click to remove.
              </div>

              {/* Sockets Chain Visualizer */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "24px",
                  backgroundColor: "#0d0b0a",
                  border: "1.5px solid #3d352a",
                  borderRadius: "8px",
                  marginBottom: "20px"
                }}
              >
                {socketsSetup.colors.map((color, idx) => {
                  const gemId = socketsSetup.socketedGems[idx];
                  const gem = gemId ? SKILL_GEMS[gemId] : null;
                  const isLinkedToNext = socketsSetup.links[idx];

                  const colorHex =
                    color === "red" ? "#e74c3c" : color === "green" ? "#2ecc71" : "#3498db";

                  return (
                    <React.Fragment key={idx}>
                      {/* Socket Circle */}
                      <div
                        onClick={() => handleSocketGem(idx)}
                        style={{
                          width: "56px",
                          height: "56px",
                          borderRadius: "50%",
                          backgroundColor: "#161311",
                          border: `3px solid ${colorHex}`,
                          boxShadow: gem
                            ? `0 0 15px ${colorHex}88, inset 0 0 10px rgba(0,0,0,0.9)`
                            : `inset 0 0 8px rgba(0,0,0,0.9)`,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          transition: "transform 0.15s",
                          position: "relative"
                        }}
                        title={
                          gem
                            ? `${gem.name} (${gem.type.toUpperCase()})\nClick to remove`
                            : `Empty ${color.toUpperCase()} Socket`
                        }
                      >
                        {gem ? (
                          <>
                            <GemIcon gemId={gem.id} size={22} color={colorHex} />
                            <span
                              style={{
                                fontSize: "8px",
                                color: colorHex,
                                fontWeight: 700,
                                textTransform: "uppercase"
                              }}
                            >
                              {gem.type === "active" ? "ACTIVE" : "SUP"}
                            </span>
                          </>
                        ) : (
                          <span style={{ fontSize: "10px", color: colorHex, fontWeight: 700 }}>
                            {color[0].toUpperCase()}
                          </span>
                        )}
                      </div>

                      {/* Link Bar to next socket */}
                      {idx < socketsSetup.colors.length - 1 && (
                        <div
                          style={{
                            width: "30px",
                            height: "8px",
                            backgroundColor: isLinkedToNext ? "#d4ac0d" : "#2d261e",
                            boxShadow: isLinkedToNext ? "0 0 8px rgba(212, 172, 13, 0.7)" : "none",
                            borderRadius: "3px"
                          }}
                          title={isLinkedToNext ? "LINKED (Supports share effects)" : "NOT LINKED"}
                        />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>

              {/* Crafting Orbs Actions */}
              <div
                style={{
                  display: "flex",
                  gap: "10px",
                  backgroundColor: "#100e0d",
                  padding: "12px",
                  borderRadius: "6px",
                  border: "1px solid #2a231c"
                }}
              >
                <button onClick={handleRerollColors} style={craftBtnStyle} title="Re-roll Socket Colors">
                  <Palette size={16} color="#e67e22" />
                  <span>Chromatic Orb (Colors)</span>
                </button>
                <button onClick={handleRerollSockets} style={craftBtnStyle} title="Re-roll Number of Sockets">
                  <CircleDot size={16} color="#3498db" />
                  <span>Jeweller's Orb (Sockets)</span>
                </button>
                <button onClick={handleRerollLinks} style={craftBtnStyle} title="Re-roll Socket Links">
                  <Link2 size={16} color="#f1c40f" />
                  <span>Orb of Fusing (Links)</span>
                </button>
              </div>
            </div>

            {/* Active Linked Skills Feedback */}
            <div
              style={{
                backgroundColor: "#0d0b0a",
                border: "1px solid #2a241c",
                borderRadius: "6px",
                padding: "12px",
                fontSize: "12px"
              }}
            >
              <div style={{ fontWeight: 700, color: "#f0dfb6", marginBottom: "6px" }}>
                ACTIVE SKILL COMBINATIONS EMPOWERED:
              </div>
              {activeSkillsLinked.length === 0 ? (
                <div style={{ color: "#8a7e6b" }}>
                  No active skill socketed. Insert an Active Skill Gem (Heavy Strike, Fireball, Split Arrow) to begin!
                </div>
              ) : (
                activeSkillsLinked.map(({ active, supports, calculation }, idx) => (
                  <div key={idx} style={{ lineHeight: "1.6" }}>
                    <span style={{ color: "#f1c40f", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "5px" }}>
                      <GemIcon gemId={active.id} size={15} color="#f1c40f" /> {active.name}:
                    </span>{" "}
                    <span style={{ color: "#ecf0f1" }}>
                      DPS: {Math.round(calculation.dpsMultiplier * 100)}% • Projectiles:{" "}
                      {calculation.projectiles}
                    </span>
                    {supports.length > 0 && (
                      <div style={{ color: "#85c1e9", fontSize: "11px", marginLeft: "14px" }}>
                        ↳ Supported by: {supports.map((s) => s.name).join(", ")}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* ================= RIGHT: GEM INVENTORY ================= */}
          <div
            style={{
              flex: 0.8,
              backgroundColor: "#151311",
              border: "1px solid #2d261e",
              borderRadius: "6px",
              padding: "18px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
          >
            <div>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#f0dfb6", marginBottom: "4px" }}>
                YOUR GEM INVENTORY
              </div>
              <div style={{ fontSize: "11px", color: "#8a7e6b", marginBottom: "12px" }}>
                Click a gem to select, then click an empty socket on the left.
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  maxHeight: "420px",
                  overflowY: "auto",
                  paddingRight: "6px"
                }}
              >
                {inventoryGems.map((gId, idx) => {
                  const gem = SKILL_GEMS[gId];
                  if (!gem) return null;
                  const isSelected = selectedGemToSocket === gId;
                  const colorHex =
                    gem.color === "red"
                      ? "#e74c3c"
                      : gem.color === "green"
                      ? "#2ecc71"
                      : "#3498db";

                  return (
                    <div
                      key={`${gId}-${idx}`}
                      onClick={() => setSelectedGemToSocket(isSelected ? null : gId)}
                      style={{
                        backgroundColor: isSelected ? "#2a221a" : "#100e0d",
                        border: `1.5px solid ${isSelected ? "#f1c40f" : `${colorHex}66`}`,
                        boxShadow: isSelected ? "0 0 10px rgba(241, 196, 15, 0.4)" : "none",
                        borderRadius: "5px",
                        padding: "8px 12px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                        transition: "all 0.15s"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <GemIcon gemId={gem.id} size={22} color={colorHex} />
                        <div>
                          <div style={{ fontSize: "12px", fontWeight: 700, color: "#f5e6ca" }}>
                            {gem.name}
                          </div>
                          <div style={{ fontSize: "10px", color: colorHex }}>
                            {gem.color.toUpperCase()} • {gem.type.toUpperCase()} GEM
                          </div>
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: "10px",
                          padding: "2px 6px",
                          borderRadius: "3px",
                          backgroundColor: `${colorHex}22`,
                          color: colorHex,
                          fontWeight: 700
                        }}
                      >
                        {gem.type === "active" ? "ATTACK" : "SUPPORT"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ fontSize: "11px", color: "#6e6454", textAlign: "center" }}>
              Tip: Support gems only affect Active gems if connected by a glowing golden Link bar!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Crafting button style
const craftBtnStyle: React.CSSProperties = {
  flex: 1,
  backgroundColor: "#1c1815",
  border: "1px solid #4a3e30",
  borderRadius: "4px",
  color: "#c9b99a",
  padding: "8px 6px",
  fontSize: "11px",
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "4px",
  transition: "all 0.15s"
};

// Helper: Calculate active skills and their linked supports from socketsSetup
function getActiveSkillsAndSupports(setup: SocketsSetup) {
  const result: {
    active: SkillGem;
    supports: SkillGem[];
    calculation: ReturnType<typeof calculateLinkedSkill>;
  }[] = [];

  // Group sockets by linked clusters
  let currentCluster: SkillGem[] = [];
  setup.socketedGems.forEach((gId, idx) => {
    if (gId && SKILL_GEMS[gId]) {
      currentCluster.push(SKILL_GEMS[gId]);
    }

    const hasLinkToNext = setup.links[idx];
    if (!hasLinkToNext || idx === setup.socketedGems.length - 1) {
      // Process cluster
      const actives = currentCluster.filter((g) => g.type === "active");
      const supports = currentCluster.filter((g) => g.type === "support");

      actives.forEach((act) => {
        result.push({
          active: act,
          supports,
          calculation: calculateLinkedSkill(act, supports)
        });
      });

      currentCluster = [];
    }
  });

  return result;
}
