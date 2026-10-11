import React, { useState } from "react";
import { CORE_CLASSES, ClassProfile } from "../data/classesData";
import { LocalPlayerData } from "../network/colyseusClient";
import { generateStarterGear } from "../data/itemData";
import { Plus, Trash2, Play, ArrowLeft, Shield, Zap, Heart, Sparkles, User, Sword } from "lucide-react";

interface CharacterSelectScreenProps {
  characters: LocalPlayerData[];
  onSelectCharacter: (char: LocalPlayerData) => void;
  onCreateCharacter: (newChar: LocalPlayerData) => void;
  onDeleteCharacter: (name: string) => void;
}

export const CharacterSelectScreen: React.FC<CharacterSelectScreenProps> = ({
  characters,
  onSelectCharacter,
  onCreateCharacter,
  onDeleteCharacter
}) => {
  const [selectedCharIndex, setSelectedCharIndex] = useState<number>(0);
  const [isCreating, setIsCreating] = useState<boolean>(characters.length === 0);
  const [selectedClassId, setSelectedClassId] = useState<string>("Duelist");
  const [newCharName, setNewCharName] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");

  const selectedClass: ClassProfile = CORE_CLASSES[selectedClassId] || CORE_CLASSES.Duelist;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newCharName.trim();
    if (!trimmed) {
      setErrorMsg("Please enter a character name.");
      return;
    }
    if (trimmed.length < 3 || trimmed.length > 16) {
      setErrorMsg("Name must be between 3 and 16 characters.");
      return;
    }
    if (characters.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg("A character with this name already exists.");
      return;
    }

    const cls = CORE_CLASSES[selectedClassId];
    const starter = generateStarterGear(cls.id);

    const newPlayer: LocalPlayerData = {
      name: trimmed,
      characterClass: cls.id,
      level: 1,
      exp: 0,
      maxExp: 100,
      hp: cls.baseStats.maxHp,
      maxHp: cls.baseStats.maxHp,
      energyShield: cls.baseStats.maxEnergyShield,
      maxEnergyShield: cls.baseStats.maxEnergyShield,
      mana: cls.baseStats.maxMana,
      maxMana: cls.baseStats.maxMana,
      strength: cls.baseStats.strength,
      dexterity: cls.baseStats.dexterity,
      intelligence: cls.baseStats.intelligence,
      armour: cls.baseStats.armour,
      evasion: cls.baseStats.evasion,
      dps: cls.baseStats.dps,
      chaosOrbs: 0,
      divineOrbs: 0,
      wisdomScrolls: 5,
      kills: 0,
      partyId: "",
      equipment: starter.gear,
      inventory: starter.inventory
    };

    onCreateCharacter(newPlayer);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "#080707",
        backgroundImage:
          "radial-gradient(circle at 50% 20%, rgba(35, 25, 20, 0.7) 0%, rgba(10, 8, 8, 0.98) 75%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "40px 60px",
        zIndex: 10000,
        overflowY: "auto",
        boxSizing: "border-box"
      }}
    >
      {/* 1. TOP HEADER */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <h1
          style={{
            fontSize: "36px",
            fontWeight: 900,
            letterSpacing: "4px",
            color: "#f0dfb6",
            textShadow: "0 0 20px rgba(240, 223, 182, 0.4), 0 2px 4px #000",
            marginBottom: "6px"
          }}
        >
          LAND OF HELL
        </h1>
        <div style={{ fontSize: "14px", color: "#8a7e6b", letterSpacing: "2px" }}>
          {isCreating ? "AWAKEN A NEW EXILE" : "SELECT YOUR CHARACTER"}
        </div>
      </div>

      {/* 2. MAIN CONTENT BODY */}
      {!isCreating ? (
        /* ================= ROSTER SELECTION VIEW ================= */
        <div
          style={{
            display: "flex",
            gap: "40px",
            width: "100%",
            maxWidth: "1100px",
            flex: 1,
            alignItems: "center"
          }}
        >
          {/* Character List Column */}
          <div
            style={{
              flex: 1,
              maxHeight: "520px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              paddingRight: "10px"
            }}
          >
            {characters.map((char, index) => {
              const cls = CORE_CLASSES[char.characterClass] || CORE_CLASSES.Duelist;
              const isSelected = index === selectedCharIndex;

              return (
                <div
                  key={char.name}
                  onClick={() => setSelectedCharIndex(index)}
                  style={{
                    backgroundColor: isSelected ? "rgba(35, 28, 22, 0.9)" : "rgba(18, 16, 14, 0.8)",
                    border: `1.5px solid ${isSelected ? cls.themeColor : "#332d24"}`,
                    boxShadow: isSelected ? `0 0 15px ${cls.themeColor}44` : "none",
                    borderRadius: "6px",
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div
                      style={{
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        backgroundColor: "#12100e",
                        border: `2px solid ${cls.themeColor}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "22px"
                      }}
                    >
                      {cls.icon}
                    </div>

                    <div>
                      <div style={{ fontSize: "17px", fontWeight: 700, color: "#f0dfb6" }}>
                        {char.name}
                      </div>
                      <div style={{ fontSize: "12px", color: cls.themeColor, fontWeight: 600 }}>
                        Level {char.level} • {cls.name}
                      </div>
                      <div style={{ fontSize: "11px", color: "#6e6454", marginTop: "2px" }}>
                        Lioneye's Watch • {char.kills} Kills • {char.chaosOrbs} Chaos
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Are you sure you want to delete ${char.name}?`)) {
                          onDeleteCharacter(char.name);
                        }
                      }}
                      title="Delete Exile"
                      style={{
                        background: "none",
                        border: "none",
                        color: "#7f1d1d",
                        cursor: "pointer",
                        padding: "6px",
                        display: "flex",
                        alignItems: "center"
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Create New Character Button */}
            {characters.length < 8 && (
              <button
                onClick={() => {
                  setIsCreating(true);
                  setErrorMsg("");
                  setNewCharName("");
                }}
                style={{
                  backgroundColor: "rgba(22, 19, 16, 0.6)",
                  border: "1.5px dashed #4a3e30",
                  borderRadius: "6px",
                  padding: "16px",
                  color: "#c9b99a",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  fontSize: "13px",
                  fontWeight: 700,
                  transition: "all 0.2s"
                }}
              >
                <Plus size={18} /> CREATE NEW EXILE ({characters.length}/8 Slots)
              </button>
            )}
          </div>

          {/* Character Details & Play Column */}
          {characters[selectedCharIndex] && (
            <div
              style={{
                width: "360px",
                backgroundColor: "rgba(16, 14, 12, 0.9)",
                border: "1px solid #3d352a",
                borderRadius: "8px",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
            >
              <div>
                <div style={{ textAlign: "center", marginBottom: "20px" }}>
                  <div style={{ fontSize: "42px", marginBottom: "6px" }}>
                    {CORE_CLASSES[characters[selectedCharIndex].characterClass]?.icon || "⚔️"}
                  </div>
                  <h2 style={{ fontSize: "22px", color: "#f0dfb6", fontWeight: 700 }}>
                    {characters[selectedCharIndex].name}
                  </h2>
                  <div
                    style={{
                      fontSize: "13px",
                      color:
                        CORE_CLASSES[characters[selectedCharIndex].characterClass]?.themeColor ||
                        "#e67e22",
                      fontWeight: 600
                    }}
                  >
                    Level {characters[selectedCharIndex].level}{" "}
                    {CORE_CLASSES[characters[selectedCharIndex].characterClass]?.title}
                  </div>
                </div>

                <div
                  style={{
                    backgroundColor: "#110f0d",
                    border: "1px solid #2a241c",
                    borderRadius: "6px",
                    padding: "14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    fontSize: "12px"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#8a7e6b" }}>Life:</span>
                    <span style={{ color: "#e74c3c", fontWeight: 700 }}>
                      {characters[selectedCharIndex].hp} / {characters[selectedCharIndex].maxHp}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#8a7e6b" }}>Estimated DPS:</span>
                    <span style={{ color: "#f39c12", fontWeight: 700 }}>
                      {characters[selectedCharIndex].dps}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#8a7e6b" }}>Monsters Slain:</span>
                    <span style={{ color: "#ecf0f1", fontWeight: 700 }}>
                      {characters[selectedCharIndex].kills}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#8a7e6b" }}>Chaos Orbs Stashed:</span>
                    <span style={{ color: "#f1c40f", fontWeight: 700 }}>
                      🟡 {characters[selectedCharIndex].chaosOrbs}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#8a7e6b" }}>Divine Orbs Stashed:</span>
                    <span style={{ color: "#f39c12", fontWeight: 700 }}>
                      🌟 {characters[selectedCharIndex].divineOrbs}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onSelectCharacter(characters[selectedCharIndex])}
                style={{
                  marginTop: "24px",
                  padding: "14px",
                  backgroundColor: "#922b21",
                  border: "2px solid #e74c3c",
                  borderRadius: "6px",
                  color: "#ffffff",
                  fontSize: "15px",
                  fontWeight: 900,
                  letterSpacing: "2px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  boxShadow: "0 4px 15px rgba(231, 76, 60, 0.4)",
                  transition: "all 0.2s"
                }}
              >
                <Play size={18} /> ENTER WRAECLAST
              </button>
            </div>
          )}
        </div>
      ) : (
        /* ================= CHARACTER CREATION VIEW ================= */
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            width: "100%",
            maxWidth: "1150px",
            flex: 1
          }}
        >
          {/* Class Selection Buttons (All 7 Classes) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "10px"
            }}
          >
            {Object.values(CORE_CLASSES).map((cls) => {
              const isSelected = cls.id === selectedClassId;

              return (
                <div
                  key={cls.id}
                  onClick={() => setSelectedClassId(cls.id)}
                  style={{
                    backgroundColor: isSelected ? "rgba(35, 28, 22, 0.95)" : "rgba(18, 16, 14, 0.7)",
                    border: `2px solid ${isSelected ? cls.themeColor : "#332d24"}`,
                    boxShadow: isSelected ? `0 0 16px ${cls.themeColor}55` : "none",
                    borderRadius: "6px",
                    padding: "14px 8px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    transition: "all 0.2s"
                  }}
                >
                  <div style={{ fontSize: "28px" }}>{cls.icon}</div>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: isSelected ? "#f0dfb6" : "#c9b99a" }}>
                    {cls.name}
                  </div>
                  <div
                    style={{
                      fontSize: "9px",
                      padding: "2px 6px",
                      borderRadius: "3px",
                      backgroundColor: `${cls.themeColor}33`,
                      color: cls.themeColor,
                      fontWeight: 700
                    }}
                  >
                    {cls.attributeType}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Class Showcase */}
          <div
            style={{
              backgroundColor: "rgba(16, 14, 12, 0.9)",
              border: `1px solid ${selectedClass.themeColor}55`,
              borderRadius: "8px",
              padding: "26px",
              display: "flex",
              gap: "36px",
              flex: 1
            }}
          >
            {/* Left: Lore & Description */}
            <div style={{ flex: 1.2, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
                  <span style={{ fontSize: "36px" }}>{selectedClass.icon}</span>
                  <div>
                    <h2 style={{ fontSize: "24px", color: selectedClass.themeColor, fontWeight: 700 }}>
                      {selectedClass.name}
                    </h2>
                    <div style={{ fontSize: "13px", color: "#8a7e6b" }}>{selectedClass.title}</div>
                  </div>
                </div>

                <div
                  style={{
                    fontSize: "12px",
                    color: "#f5e6ca",
                    fontWeight: 600,
                    marginBottom: "14px",
                    letterSpacing: "0.5px"
                  }}
                >
                  {selectedClass.tagline}
                </div>

                <p style={{ fontSize: "13px", color: "#a89b85", lineHeight: "1.7", marginBottom: "16px" }}>
                  {selectedClass.description}
                </p>

                <div
                  style={{
                    backgroundColor: "#12100e",
                    border: "1px solid #2d261e",
                    borderRadius: "6px",
                    padding: "10px 14px",
                    fontSize: "12px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  <Sparkles size={14} color={selectedClass.themeColor} />
                  <span>
                    Starting Active Skill:{" "}
                    <strong style={{ color: "#f0dfb6" }}>{selectedClass.startingSkill}</strong>
                  </span>
                </div>
              </div>

              {/* Form Input for Character Name */}
              <form onSubmit={handleCreate} style={{ marginTop: "20px" }}>
                <label style={{ display: "block", fontSize: "12px", color: "#8a7e6b", marginBottom: "6px" }}>
                  NAME YOUR EXILE:
                </label>
                <div style={{ display: "flex", gap: "10px" }}>
                  <input
                    type="text"
                    placeholder="Enter Character Name..."
                    value={newCharName}
                    onChange={(e) => setNewCharName(e.target.value)}
                    maxLength={16}
                    style={{
                      flex: 1,
                      backgroundColor: "#0d0c0b",
                      border: "1px solid #4a3e30",
                      borderRadius: "4px",
                      padding: "10px 14px",
                      color: "#f0dfb6",
                      fontSize: "14px",
                      outline: "none"
                    }}
                  />

                  <button
                    type="submit"
                    style={{
                      padding: "10px 24px",
                      backgroundColor: "#922b21",
                      border: "1px solid #e74c3c",
                      borderRadius: "4px",
                      color: "#ffffff",
                      fontSize: "13px",
                      fontWeight: 700,
                      cursor: "pointer",
                      letterSpacing: "1px"
                    }}
                  >
                    AWAKEN EXILE
                  </button>
                </div>

                {errorMsg && (
                  <div style={{ color: "#e74c3c", fontSize: "12px", marginTop: "6px" }}>{errorMsg}</div>
                )}
              </form>
            </div>

            {/* Right: Base Stats Overview */}
            <div
              style={{
                flex: 0.8,
                backgroundColor: "#110f0d",
                border: "1px solid #2d261e",
                borderRadius: "6px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
            >
              <div>
                <h3
                  style={{
                    fontSize: "13px",
                    color: "#c9b99a",
                    fontWeight: 700,
                    marginBottom: "14px",
                    letterSpacing: "1px"
                  }}
                >
                  STARTING ATTRIBUTES & DEFENSES
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#c0392b" }}>Strength (STR):</span>
                    <strong style={{ color: "#f5e6ca" }}>{selectedClass.baseStats.strength}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#27ae60" }}>Dexterity (DEX):</span>
                    <strong style={{ color: "#f5e6ca" }}>{selectedClass.baseStats.dexterity}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#3498db" }}>Intelligence (INT):</span>
                    <strong style={{ color: "#f5e6ca" }}>{selectedClass.baseStats.intelligence}</strong>
                  </div>

                  <hr style={{ borderColor: "#221e1a", margin: "4px 0" }} />

                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#e74c3c" }}>Maximum Life:</span>
                    <strong style={{ color: "#e74c3c" }}>{selectedClass.baseStats.maxHp}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#3498db" }}>Maximum Mana:</span>
                    <strong style={{ color: "#3498db" }}>{selectedClass.baseStats.maxMana}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#aed6f1" }}>Energy Shield:</span>
                    <strong style={{ color: "#aed6f1" }}>{selectedClass.baseStats.maxEnergyShield}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#f39c12" }}>Base DPS:</span>
                    <strong style={{ color: "#f39c12" }}>{selectedClass.baseStats.dps}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#95a5a6" }}>Armour:</span>
                    <strong style={{ color: "#95a5a6" }}>{selectedClass.baseStats.armour}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#1abc9c" }}>Evasion Rating:</span>
                    <strong style={{ color: "#1abc9c" }}>{selectedClass.baseStats.evasion}</strong>
                  </div>
                </div>
              </div>

              {characters.length > 0 && (
                <button
                  onClick={() => setIsCreating(false)}
                  style={{
                    marginTop: "16px",
                    background: "none",
                    border: "none",
                    color: "#8a7e6b",
                    fontSize: "12px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <ArrowLeft size={14} /> Back to Character Roster
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
