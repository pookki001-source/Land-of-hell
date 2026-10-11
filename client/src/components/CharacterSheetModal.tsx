import React, { useState } from "react";
import {
  ASCENDANCY_CLASSES,
  AscendancyClass,
  getAscendanciesForClass
} from "../data/ascendancyData";
import { LocalPlayerData } from "../network/colyseusClient";
import { SKILL_GEMS } from "../data/gemData";
import { sounds } from "../utils/soundEffects";
import {
  X,
  Shield,
  Sword,
  Zap,
  Flame,
  Snowflake,
  Sparkles,
  Heart,
  Droplet,
  Crown,
  Check,
  ChevronRight,
  Info
} from "lucide-react";

interface CharacterSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: LocalPlayerData;
  onSelectAscendancy: (ascendancyId: string) => void;
  onToggleAscendancyNode: (nodeId: string) => void;
}

export const CharacterSheetModal: React.FC<CharacterSheetModalProps> = ({
  isOpen,
  onClose,
  player,
  onSelectAscendancy,
  onToggleAscendancyNode
}) => {
  const [activeTab, setActiveTab] = useState<"defence" | "offence" | "ascendancy" | "attributes">("defence");
  const [inspectingAscendancy, setInspectingAscendancy] = useState<string | null>(null);

  if (!isOpen) return null;

  const characterClass = player.characterClass || "Duelist";
  const availableAscendancies = getAscendanciesForClass(characterClass);
  const currentAscendancy = player.ascendancyClass ? ASCENDANCY_CLASSES[player.ascendancyClass] : null;

  // Active Ascendancy allocation (up to 4 notables)
  const allocatedNodes = player.ascendancyNodes || [];

  // Calculate totals from Ascendancy nodes
  let ascDpsBuff = 0;
  let ascLifeBuff = 0;
  let ascArmourBuff = 0;
  let ascEvasionBuff = 0;
  let ascEsBuff = 0;
  let ascFireRes = 0;
  let ascColdRes = 0;
  let ascLightningRes = 0;
  let ascChaosRes = 0;
  let ascBlock = 0;
  let ascSpellSupp = 0;
  let ascCrit = 0;
  let ascPhysRed = 0;

  if (currentAscendancy) {
    currentAscendancy.nodes.forEach((node) => {
      if (allocatedNodes.includes(node.id)) {
        ascDpsBuff += node.stats.bonusDpsPercent || 0;
        ascLifeBuff += node.stats.bonusLifePercent || 0;
        ascArmourBuff += node.stats.bonusArmourPercent || 0;
        ascEvasionBuff += node.stats.bonusEvasionPercent || 0;
        ascEsBuff += node.stats.bonusEnergyShieldPercent || 0;
        ascFireRes += node.stats.fireRes || 0;
        ascColdRes += node.stats.coldRes || 0;
        ascLightningRes += node.stats.lightningRes || 0;
        ascChaosRes += node.stats.chaosRes || 0;
        ascBlock += node.stats.blockChance || 0;
        ascSpellSupp += node.stats.spellSuppression || 0;
        ascCrit += node.stats.critChance || 0;
        ascPhysRed += node.stats.physicalDamageReduction || 0;
      }
    });
  }

  // Derive final stats
  const totalHp = Math.floor((player.maxHp || 275) * (1 + ascLifeBuff / 100));
  const totalEs = Math.floor((player.maxEnergyShield || 0) * (1 + ascEsBuff / 100));
  const totalArmour = Math.floor((player.armour || 50) * (1 + ascArmourBuff / 100));
  const totalEvasion = Math.floor((player.evasion || 65) * (1 + ascEvasionBuff / 100));
  const totalDps = Math.floor((player.dps || 45) * (1 + ascDpsBuff / 100));

  // Mitigations
  const estimatedPhysReduction = Math.min(90, Math.floor((totalArmour / (totalArmour + 1500)) * 100) + ascPhysRed);
  const estimatedEvadeChance = Math.min(95, Math.floor((totalEvasion / (totalEvasion + 1200)) * 100));

  // Resistances (Capped at 75%)
  const fireRes = Math.min(75, 40 + ascFireRes);
  const coldRes = Math.min(75, 35 + ascColdRes);
  const lightningRes = Math.min(75, 45 + ascLightningRes);
  const chaosRes = Math.min(75, 15 + ascChaosRes);

  // Active socketed skill
  const mainGemId = player.socketsSetup?.socketedGems?.[0];
  const mainSkill = mainGemId && SKILL_GEMS[mainGemId] ? SKILL_GEMS[mainGemId] : null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(8, 6, 6, 0.82)",
        backdropFilter: "blur(5px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 5000,
        fontFamily: "'Cinzel', serif"
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "920px",
          maxWidth: "95vw",
          height: "640px",
          maxHeight: "92vh",
          backgroundColor: "#120f0d",
          border: "2px solid #5a4b37",
          boxShadow: "0 0 35px rgba(0,0,0,0.9), inset 0 0 40px #0a0807",
          borderRadius: "8px",
          display: "flex",
          flexDirection: "column",
          color: "#dcd0b8",
          overflow: "hidden"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid #3d3325",
            backgroundColor: "#181411",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <span style={{ fontSize: "24px" }}>📜</span>
            <div>
              <div style={{ fontSize: "19px", fontWeight: 700, color: "#f3e1b7", letterSpacing: "1px" }}>
                {player.name}
              </div>
              <div style={{ fontSize: "12px", color: "#8f826e", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>Level {player.level || 1} {characterClass}</span>
                {currentAscendancy && (
                  <span
                    style={{
                      color: "#f1c40f",
                      backgroundColor: "#2e210b",
                      border: "1px solid #9c7b28",
                      padding: "1px 8px",
                      borderRadius: "4px",
                      fontWeight: 700
                    }}
                  >
                    👑 {currentAscendancy.name}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* TAB BUTTONS */}
          <div style={{ display: "flex", gap: "8px" }}>
            {[
              { id: "defence", label: "🛡️ Defences" },
              { id: "offence", label: "⚔️ Offence" },
              { id: "ascendancy", label: "👑 Ascendancy" },
              { id: "attributes", label: "✨ Attributes" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  sounds.playHitSound();
                  setActiveTab(tab.id as any);
                }}
                style={{
                  padding: "7px 16px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: 700,
                  cursor: "pointer",
                  backgroundColor: activeTab === tab.id ? "#34281a" : "#171411",
                  border: `1px solid ${activeTab === tab.id ? "#d4ac0d" : "#423727"}`,
                  color: activeTab === tab.id ? "#f9e79f" : "#9e917d",
                  transition: "all 0.15s"
                }}
              >
                {tab.label}
              </button>
            ))}

            <button
              onClick={onClose}
              style={{
                backgroundColor: "transparent",
                border: "none",
                color: "#aa9e89",
                cursor: "pointer",
                padding: "6px",
                marginLeft: "8px"
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* MODAL BODY */}
        <div style={{ flex: 1, padding: "22px", overflowY: "auto", backgroundColor: "#0f0d0b" }}>
          {/* ================= 1. DEFENCES TAB ================= */}
          {activeTab === "defence" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* PRIMARY LIFE & ES POOL */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "14px"
                }}
              >
                {/* LIFE */}
                <div
                  style={{
                    backgroundColor: "#181010",
                    border: "1px solid #78281f",
                    borderRadius: "6px",
                    padding: "14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#e74c3c", fontWeight: 700 }}>
                    <Heart size={18} /> Maximum Life
                  </div>
                  <div style={{ fontSize: "22px", fontWeight: 900, color: "#f5b7b1" }}>
                    {totalHp} <span style={{ fontSize: "13px", color: "#922b21" }}>HP</span>
                  </div>
                  <div style={{ fontSize: "11px", color: "#a93226" }}>
                    Regenerate {Math.floor(totalHp * 0.03)} Life per second
                  </div>
                </div>

                {/* ENERGY SHIELD */}
                <div
                  style={{
                    backgroundColor: "#0d141a",
                    border: "1px solid #1b4f72",
                    borderRadius: "6px",
                    padding: "14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#3498db", fontWeight: 700 }}>
                    <Shield size={18} /> Energy Shield
                  </div>
                  <div style={{ fontSize: "22px", fontWeight: 900, color: "#aed6f1" }}>
                    {totalEs} <span style={{ fontSize: "13px", color: "#2874a6" }}>ES</span>
                  </div>
                  <div style={{ fontSize: "11px", color: "#2980b9" }}>
                    Recharge: {Math.floor(totalEs * 0.2)} / sec (starts after 2s without damage)
                  </div>
                </div>

                {/* MANA */}
                <div
                  style={{
                    backgroundColor: "#10161a",
                    border: "1px solid #21618c",
                    borderRadius: "6px",
                    padding: "14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#5dade2", fontWeight: 700 }}>
                    <Droplet size={18} /> Maximum Mana
                  </div>
                  <div style={{ fontSize: "22px", fontWeight: 900, color: "#d6eaf8" }}>
                    {player.maxMana || 100} <span style={{ fontSize: "13px", color: "#2e86c1" }}>MANA</span>
                  </div>
                  <div style={{ fontSize: "11px", color: "#5499c7" }}>
                    100% Unreserved (No active auras reserved)
                  </div>
                </div>
              </div>

              {/* 4 RESISTANCES (CAP 75%) */}
              <div
                style={{
                  backgroundColor: "#14110e",
                  border: "1px solid #3a3022",
                  borderRadius: "6px",
                  padding: "18px"
                }}
              >
                <div style={{ fontSize: "14px", fontWeight: 700, color: "#f0dfb6", marginBottom: "14px" }}>
                  Elemental & Chaos Resistances (Capped at 75%)
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  {/* Fire */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                      <span style={{ color: "#e74c3c", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Flame size={14} /> Fire Resistance
                      </span>
                      <span style={{ fontWeight: 700, color: fireRes >= 75 ? "#f1c40f" : "#f5b7b1" }}>
                        {fireRes}% / 75% {fireRes >= 75 && "✨ (CAP)"}
                      </span>
                    </div>
                    <div style={{ height: "8px", backgroundColor: "#201715", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: `${(fireRes / 75) * 100}%`, height: "100%", backgroundColor: "#c0392b" }} />
                    </div>
                  </div>

                  {/* Cold */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                      <span style={{ color: "#3498db", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Snowflake size={14} /> Cold Resistance
                      </span>
                      <span style={{ fontWeight: 700, color: coldRes >= 75 ? "#f1c40f" : "#aed6f1" }}>
                        {coldRes}% / 75% {coldRes >= 75 && "✨ (CAP)"}
                      </span>
                    </div>
                    <div style={{ height: "8px", backgroundColor: "#151c20", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: `${(coldRes / 75) * 100}%`, height: "100%", backgroundColor: "#2980b9" }} />
                    </div>
                  </div>

                  {/* Lightning */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                      <span style={{ color: "#f39c12", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Zap size={14} /> Lightning Resistance
                      </span>
                      <span style={{ fontWeight: 700, color: lightningRes >= 75 ? "#f1c40f" : "#fad7a0" }}>
                        {lightningRes}% / 75% {lightningRes >= 75 && "✨ (CAP)"}
                      </span>
                    </div>
                    <div style={{ height: "8px", backgroundColor: "#221c13", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: `${(lightningRes / 75) * 100}%`, height: "100%", backgroundColor: "#d68910" }} />
                    </div>
                  </div>

                  {/* Chaos */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                      <span style={{ color: "#9b59b6", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Sparkles size={14} /> Chaos Resistance
                      </span>
                      <span style={{ fontWeight: 700, color: chaosRes >= 75 ? "#f1c40f" : "#d7bde2" }}>
                        {chaosRes}% / 75% {chaosRes >= 75 && "✨ (CAP)"}
                      </span>
                    </div>
                    <div style={{ height: "8px", backgroundColor: "#1d1622", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ width: `${(chaosRes / 75) * 100}%`, height: "100%", backgroundColor: "#8e44ad" }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* MITIGATION LAYERS (Armour, Evasion, Block, Suppression) */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr 1fr",
                  gap: "12px"
                }}
              >
                <div style={{ backgroundColor: "#151310", border: "1px solid #332b20", padding: "12px", borderRadius: "6px" }}>
                  <div style={{ fontSize: "11px", color: "#8c7e6b" }}>Armour Rating</div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "#f0dfb6", margin: "4px 0" }}>{totalArmour}</div>
                  <div style={{ fontSize: "11px", color: "#27ae60" }}>{estimatedPhysReduction}% Phys Reduction</div>
                </div>

                <div style={{ backgroundColor: "#151310", border: "1px solid #332b20", padding: "12px", borderRadius: "6px" }}>
                  <div style={{ fontSize: "11px", color: "#8c7e6b" }}>Evasion Rating</div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "#f0dfb6", margin: "4px 0" }}>{totalEvasion}</div>
                  <div style={{ fontSize: "11px", color: "#2ecc71" }}>{estimatedEvadeChance}% Chance to Evade</div>
                </div>

                <div style={{ backgroundColor: "#151310", border: "1px solid #332b20", padding: "12px", borderRadius: "6px" }}>
                  <div style={{ fontSize: "11px", color: "#8c7e6b" }}>Block Chance</div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "#f0dfb6", margin: "4px 0" }}>
                    {ascBlock + 15}%
                  </div>
                  <div style={{ fontSize: "11px", color: "#f39c12" }}>Attacks & Spells</div>
                </div>

                <div style={{ backgroundColor: "#151310", border: "1px solid #332b20", padding: "12px", borderRadius: "6px" }}>
                  <div style={{ fontSize: "11px", color: "#8c7e6b" }}>Spell Suppression</div>
                  <div style={{ fontSize: "18px", fontWeight: 700, color: "#f0dfb6", margin: "4px 0" }}>
                    {ascSpellSupp + 20}%
                  </div>
                  <div style={{ fontSize: "11px", color: "#3498db" }}>Halves Spell Damage</div>
                </div>
              </div>
            </div>
          )}

          {/* ================= 2. OFFENCE TAB ================= */}
          {activeTab === "offence" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div
                style={{
                  backgroundColor: "#161310",
                  border: "1px solid #453828",
                  borderRadius: "6px",
                  padding: "18px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div>
                  <div style={{ fontSize: "12px", color: "#8a7d69" }}>PRIMARY ACTIVE SKILL</div>
                  <div style={{ fontSize: "22px", fontWeight: 700, color: "#f4d03f", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>{mainSkill?.icon || "⚔️"}</span>
                    <span>{mainSkill?.name || "Default Strike"}</span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#bdae93", marginTop: "4px" }}>
                    Mana Cost: {mainSkill?.manaCost || 0} | Tags: {mainSkill?.tags.join(", ") || "Attack, Melee"}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "12px", color: "#8a7d69" }}>ESTIMATED TOTAL DPS</div>
                  <div style={{ fontSize: "32px", fontWeight: 900, color: "#e74c3c" }}>
                    {totalDps}
                  </div>
                  <div style={{ fontSize: "11px", color: "#27ae60" }}>
                    +{ascDpsBuff}% from Ascendancy Notables
                  </div>
                </div>
              </div>

              {/* OFFENCE ATTRIBUTES */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "14px"
                }}
              >
                <div style={{ backgroundColor: "#14110e", border: "1px solid #332a1e", padding: "14px", borderRadius: "6px" }}>
                  <div style={{ fontSize: "11px", color: "#8a7e6b" }}>Attack / Cast Speed</div>
                  <div style={{ fontSize: "20px", fontWeight: 700, color: "#f0dfb6", margin: "6px 0" }}>
                    2.40 <span style={{ fontSize: "12px" }}>hits/s</span>
                  </div>
                  <div style={{ fontSize: "11px", color: "#6e6250" }}>Weapon Base + Gem Multiplier</div>
                </div>

                <div style={{ backgroundColor: "#14110e", border: "1px solid #332a1e", padding: "14px", borderRadius: "6px" }}>
                  <div style={{ fontSize: "11px", color: "#8a7e6b" }}>Critical Strike Chance</div>
                  <div style={{ fontSize: "20px", fontWeight: 700, color: "#f1c40f", margin: "6px 0" }}>
                    {(15 + ascCrit).toFixed(1)}%
                  </div>
                  <div style={{ fontSize: "11px", color: "#6e6250" }}>Critical Damage: 195%</div>
                </div>

                <div style={{ backgroundColor: "#14110e", border: "1px solid #332a1e", padding: "14px", borderRadius: "6px" }}>
                  <div style={{ fontSize: "11px", color: "#8a7e6b" }}>Damage Conversion / Extra</div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "#e67e22", margin: "6px 0" }}>
                    Physical + Fire + Chaos
                  </div>
                  <div style={{ fontSize: "11px", color: "#6e6250" }}>Socketed Support Gem Buffs</div>
                </div>
              </div>
            </div>
          )}

          {/* ================= 3. ASCENDANCY TAB ================= */}
          {activeTab === "ascendancy" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Altar Banner */}
              <div
                style={{
                  backgroundColor: "#18130e",
                  border: "1px solid #785a28",
                  borderRadius: "6px",
                  padding: "16px 20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div>
                  <div style={{ fontSize: "16px", fontWeight: 700, color: "#f3e1b7", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Crown size={18} color="#f1c40f" /> The Altar of Ascendancy (The Labyrinth)
                  </div>
                  <div style={{ fontSize: "12px", color: "#9a8b75", marginTop: "4px" }}>
                    {currentAscendancy
                      ? `Active Specialization: ${currentAscendancy.name} — ${currentAscendancy.title}`
                      : `Choose one of 3 legendary Ascendancy subclasses for ${characterClass}.`}
                  </div>
                </div>

                {currentAscendancy && (
                  <button
                    onClick={() => onSelectAscendancy("")}
                    style={{
                      backgroundColor: "#2e1a1a",
                      border: "1px solid #78281f",
                      color: "#f5b7b1",
                      padding: "6px 14px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Respec Ascendancy
                  </button>
                )}
              </div>

              {/* IF NOT YET SELECTED: SHOW 3 SUBCLASSES TO CHOOSE */}
              {!currentAscendancy && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                  {availableAscendancies.map((asc) => (
                    <div
                      key={asc.id}
                      style={{
                        backgroundColor: "#15120e",
                        border: "1px solid #4a3e2b",
                        borderRadius: "6px",
                        padding: "16px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between"
                      }}
                    >
                      <div>
                        <div style={{ fontSize: "32px", textAlign: "center", marginBottom: "8px" }}>{asc.icon}</div>
                        <div style={{ fontSize: "16px", fontWeight: 700, color: "#f1c40f", textAlign: "center" }}>
                          {asc.name}
                        </div>
                        <div style={{ fontSize: "11px", color: "#aa9a82", textAlign: "center", fontStyle: "italic", marginBottom: "12px" }}>
                          "{asc.flavorQuote}"
                        </div>
                        <div style={{ fontSize: "12px", color: "#d5c9b1", marginBottom: "14px", lineHeight: "1.4" }}>
                          {asc.description}
                        </div>

                        {/* List of 4 Notables */}
                        <div style={{ borderTop: "1px solid #2e261b", paddingTop: "10px", display: "flex", flexDirection: "column", gap: "6px" }}>
                          {asc.nodes.map((node) => (
                            <div key={node.id} style={{ fontSize: "11px", color: "#bfae93" }}>
                              <span style={{ color: "#f39c12", fontWeight: 700 }}>• {node.name}:</span> {node.description}
                            </div>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          sounds.playLevelUp();
                          onSelectAscendancy(asc.id);
                        }}
                        style={{
                          marginTop: "16px",
                          padding: "10px",
                          backgroundColor: "#362612",
                          border: "1px solid #f1c40f",
                          color: "#fcf3cf",
                          borderRadius: "4px",
                          fontWeight: 700,
                          fontSize: "12px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          boxShadow: "0 0 15px rgba(241, 196, 15, 0.25)"
                        }}
                      >
                        <Crown size={14} /> Ascend to {asc.name}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* IF ALREADY SELECTED: SHOW NOTABLES WHEEL TO ALLOCATE / INSPECT */}
              {currentAscendancy && (
                <div>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "#f0dfb6", marginBottom: "12px" }}>
                    Allocate Ascendancy Notables (Click to toggle allocation):
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                    {currentAscendancy.nodes.map((node) => {
                      const isAllocated = allocatedNodes.includes(node.id);
                      return (
                        <div
                          key={node.id}
                          onClick={() => {
                            sounds.playLevelUp();
                            onToggleAscendancyNode(node.id);
                          }}
                          style={{
                            backgroundColor: isAllocated ? "#261e12" : "#14110e",
                            border: `2px solid ${isAllocated ? "#f1c40f" : "#3b3122"}`,
                            borderRadius: "6px",
                            padding: "16px",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            display: "flex",
                            gap: "14px",
                            boxShadow: isAllocated ? "0 0 15px rgba(241, 196, 15, 0.3)" : "none"
                          }}
                        >
                          <div
                            style={{
                              fontSize: "28px",
                              width: "48px",
                              height: "48px",
                              backgroundColor: isAllocated ? "#423214" : "#1f1a14",
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              border: `1px solid ${isAllocated ? "#f39c12" : "#423522"}`
                            }}
                          >
                            {node.icon}
                          </div>

                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: "14px", fontWeight: 700, color: isAllocated ? "#f9e79f" : "#c4b59b" }}>
                                {node.name}
                              </span>
                              {isAllocated ? (
                                <span style={{ fontSize: "11px", color: "#2ecc71", fontWeight: 700, display: "flex", alignItems: "center", gap: "3px" }}>
                                  <Check size={14} /> ALLOCATED
                                </span>
                              ) : (
                                <span style={{ fontSize: "11px", color: "#8a7d6a" }}>Click to Allocate</span>
                              )}
                            </div>
                            <div style={{ fontSize: "12px", color: "#e0d3ba", marginTop: "6px", lineHeight: "1.4" }}>
                              {node.description}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= 4. ATTRIBUTES TAB ================= */}
          {activeTab === "attributes" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                {/* STR */}
                <div style={{ backgroundColor: "#191110", border: "1px solid #78281f", padding: "18px", borderRadius: "6px" }}>
                  <div style={{ fontSize: "13px", color: "#e74c3c", fontWeight: 700 }}>🔴 STRENGTH (STR)</div>
                  <div style={{ fontSize: "30px", fontWeight: 900, color: "#f5b7b1", margin: "8px 0" }}>
                    {player.strength || 23}
                  </div>
                  <div style={{ fontSize: "11px", color: "#a93226", lineHeight: "1.5" }}>
                    • +{Math.floor((player.strength || 23) * 0.5)} Maximum Life<br />
                    • +{Math.floor((player.strength || 23) * 0.2)}% Melee Physical Damage
                  </div>
                </div>

                {/* DEX */}
                <div style={{ backgroundColor: "#101912", border: "1px solid #1e8449", padding: "18px", borderRadius: "6px" }}>
                  <div style={{ fontSize: "13px", color: "#2ecc71", fontWeight: 700 }}>🟢 DEXTERITY (DEX)</div>
                  <div style={{ fontSize: "30px", fontWeight: 900, color: "#a9dfbf", margin: "8px 0" }}>
                    {player.dexterity || 23}
                  </div>
                  <div style={{ fontSize: "11px", color: "#229954", lineHeight: "1.5" }}>
                    • +{Math.floor((player.dexterity || 23) * 2)} Accuracy Rating<br />
                    • +{Math.floor((player.dexterity || 23) * 0.2)}% Evasion Rating
                  </div>
                </div>

                {/* INT */}
                <div style={{ backgroundColor: "#10151c", border: "1px solid #2874a6", padding: "18px", borderRadius: "6px" }}>
                  <div style={{ fontSize: "13px", color: "#3498db", fontWeight: 700 }}>🔵 INTELLIGENCE (INT)</div>
                  <div style={{ fontSize: "30px", fontWeight: 900, color: "#aed6f1", margin: "8px 0" }}>
                    {player.intelligence || 14}
                  </div>
                  <div style={{ fontSize: "11px", color: "#2e86c1", lineHeight: "1.5" }}>
                    • +{Math.floor((player.intelligence || 14) * 0.5)} Maximum Mana<br />
                    • +{Math.floor((player.intelligence || 14) * 0.2)}% Maximum Energy Shield
                  </div>
                </div>
              </div>

              {/* General Exiles Record */}
              <div style={{ backgroundColor: "#151310", border: "1px solid #332a1e", padding: "16px", borderRadius: "6px" }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#f0dfb6", marginBottom: "10px" }}>Exile History & Progress</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", fontSize: "12px", color: "#aa9d85" }}>
                  <div>Total Monsters Slain: <strong style={{ color: "#e74c3c" }}>{player.kills || 0}</strong></div>
                  <div>Wisdom Scrolls: <strong style={{ color: "#c9b99a" }}>{player.wisdomScrolls || 0}</strong></div>
                  <div>Chaos Orbs: <strong style={{ color: "#f1c40f" }}>{player.chaosOrbs || 0}</strong></div>
                  <div>Divine Orbs: <strong style={{ color: "#f39c12" }}>{player.divineOrbs || 0}</strong></div>
                  <div>Party ID: <strong style={{ color: "#3498db" }}>{player.partyId || "Solo"}</strong></div>
                  <div>Ascendancy Trial: <strong style={{ color: "#2ecc71" }}>Labyrinth Qualified</strong></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
