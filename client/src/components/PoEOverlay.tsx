import React, { useState } from "react";
import { Room } from "colyseus.js";
import {
  Shield,
  Zap,
  Sword,
  Users,
  User,
  Compass,
  MessageSquare,
  Sparkles,
  RefreshCw,
  Coins
} from "lucide-react";

interface PoEOverlayProps {
  room: Room<any> | null;
  zoneType: "town" | "map";
  localPlayer: any;
  onlineCount: number;
  onOpenPortal?: () => void;
  onReturnToTown?: () => void;
  onToggleAuto?: () => void;
  onSwitchCharacter?: () => void;
  onToggleInventory?: () => void;
}

export const PoEOverlay: React.FC<PoEOverlayProps> = ({
  room,
  zoneType,
  localPlayer,
  onlineCount,
  onOpenPortal,
  onReturnToTown,
  onToggleAuto,
  onSwitchCharacter,
  onToggleInventory
}) => {
  const [chatInput, setChatInput] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [targetPartyId, setTargetPartyId] = useState("");

  const hp = localPlayer ? Math.max(0, Math.floor(localPlayer.hp || 0)) : 250;
  const maxHp = localPlayer ? Math.floor(localPlayer.maxHp || 250) : 250;
  const hpPct = Math.min(100, Math.max(0, (hp / maxHp) * 100));

  const mana = localPlayer ? Math.max(0, Math.floor(localPlayer.mana || 100)) : 100;
  const maxMana = localPlayer ? Math.floor(localPlayer.maxMana || 100) : 100;
  const manaPct = Math.min(100, Math.max(0, (mana / maxMana) * 100));

  const exp = localPlayer ? localPlayer.exp || 0 : 0;
  const maxExp = localPlayer ? localPlayer.maxExp || 100 : 100;
  const expPct = Math.min(100, Math.max(0, (exp / maxExp) * 100));

  const isAuto = localPlayer?.isAuto || false;

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!room || !chatInput.trim()) return;
    room.send("chat", { text: chatInput });
    setChatInput("");
  };

  const handleUpdateProfile = () => {
    if (!room || !newName.trim()) return;
    room.send("update_profile", { name: newName });
    setIsProfileOpen(false);
  };

  const handleJoinParty = () => {
    if (!room || !targetPartyId.trim()) return;
    room.send("party_join", { targetSessionId: targetPartyId });
    setTargetPartyId("");
    setIsProfileOpen(false);
  };

  return (
    <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none" }}>
      {/* 1. TOP HEADER BAR */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "54px",
          backgroundColor: "rgba(18, 16, 14, 0.88)",
          borderBottom: "1px solid #3d352a",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0 20px",
          pointerEvents: "auto",
          backdropFilter: "blur(6px)"
        }}
      >
        {/* Zone Info */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              padding: "4px 10px",
              borderRadius: "4px",
              backgroundColor: zoneType === "town" ? "#1e3a24" : "#4a2323",
              border: `1px solid ${zoneType === "town" ? "#2ecc71" : "#e74c3c"}`,
              fontSize: "12px",
              fontWeight: 700,
              color: "#f5e6ca"
            }}
          >
            {zoneType === "town" ? "TOWN HUB" : "MAP INSTANCE"}
          </div>
          <div>
            <div style={{ fontSize: "14px", fontWeight: 700, color: "#f0dfb6" }}>
              {zoneType === "town" ? "Lioneye's Watch (Act 1)" : (room?.state?.mapName || "The Twilight Strand")}
            </div>
            <div style={{ fontSize: "11px", color: "#8a7e6b" }}>
              Exiles Online: <span style={{ color: "#2ecc71" }}>{onlineCount}</span>
            </div>
          </div>
        </div>

        {/* Currency Tracker */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            backgroundColor: "#12100e",
            padding: "6px 16px",
            borderRadius: "6px",
            border: "1px solid #332d24"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }} title="Scroll of Wisdom">
            <span style={{ fontSize: "14px" }}>📜</span>
            <span style={{ fontSize: "13px", color: "#c9b99a", fontWeight: 600 }}>
              {localPlayer?.wisdomScrolls || 0}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }} title="Chaos Orb">
            <span style={{ fontSize: "14px" }}>🟡</span>
            <span style={{ fontSize: "13px", color: "#f1c40f", fontWeight: 700 }}>
              {localPlayer?.chaosOrbs || 0} Chaos
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }} title="Divine Orb">
            <span style={{ fontSize: "14px" }}>🌟</span>
            <span style={{ fontSize: "13px", color: "#f39c12", fontWeight: 700 }}>
              {localPlayer?.divineOrbs || 0} Divine
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }} title="Total Monsters Slain">
            <Sword size={14} color="#e74c3c" />
            <span style={{ fontSize: "12px", color: "#e74c3c", fontWeight: 600 }}>
              {localPlayer?.kills || 0} Kills
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {zoneType === "town" ? (
            <button
              onClick={onOpenPortal}
              style={{
                backgroundColor: "#2e213b",
                border: "1px solid #9b59b6",
                color: "#e8daef",
                padding: "6px 14px",
                borderRadius: "4px",
                fontSize: "12px",
                cursor: "pointer",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <Sparkles size={14} /> Open Party Map
            </button>
          ) : (
            <button
              onClick={onReturnToTown}
              style={{
                backgroundColor: "#1c2833",
                border: "1px solid #3498db",
                color: "#d6eaf8",
                padding: "6px 14px",
                borderRadius: "4px",
                fontSize: "12px",
                cursor: "pointer",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <Compass size={14} /> Return to Town
            </button>
          )}

          <button
            onClick={onToggleInventory}
            style={{
              backgroundColor: "#2e2316",
              border: "1px solid #d4ac0d",
              color: "#f5e6ca",
              padding: "6px 14px",
              borderRadius: "4px",
              fontSize: "12px",
              cursor: "pointer",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 0 10px rgba(212, 172, 13, 0.25)"
            }}
          >
            🎒 Gear & Bags (I)
          </button>

          <button
            onClick={onSwitchCharacter}
            style={{
              backgroundColor: "#1c1916",
              border: "1px solid #4a4034",
              color: "#c9b99a",
              padding: "6px 12px",
              borderRadius: "4px",
              fontSize: "12px",
              cursor: "pointer",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <User size={14} /> Switch Exile
          </button>

          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            style={{
              backgroundColor: "#23201b",
              border: "1px solid #4a4034",
              color: "#c9b99a",
              padding: "6px 12px",
              borderRadius: "4px",
              fontSize: "12px",
              cursor: "pointer",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <Users size={14} /> Exile Profile
          </button>
        </div>
      </div>

      {/* 2. CHAT BOX (Bottom Left) */}
      <div
        style={{
          position: "absolute",
          bottom: "160px",
          left: "20px",
          width: "380px",
          height: isChatOpen ? "220px" : "36px",
          backgroundColor: "rgba(14, 12, 11, 0.92)",
          border: "1px solid #3d352a",
          borderRadius: "6px",
          display: "flex",
          flexDirection: "column",
          pointerEvents: "auto",
          transition: "height 0.2s ease"
        }}
      >
        <div
          onClick={() => setIsChatOpen(!isChatOpen)}
          style={{
            padding: "6px 12px",
            backgroundColor: "#1c1916",
            borderBottom: isChatOpen ? "1px solid #3d352a" : "none",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
            fontSize: "11px",
            color: "#c9b99a",
            fontWeight: 700
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <MessageSquare size={12} /> GLOBAL & PARTY CHAT
          </div>
          <div>{isChatOpen ? "▼" : "▲"}</div>
        </div>

        {isChatOpen && (
          <>
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "8px 12px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                fontSize: "12px"
              }}
            >
              {room?.state?.messages?.map((msg: any) => (
                <div key={msg.id} style={{ lineHeight: "1.4" }}>
                  <span
                    style={{
                      color:
                        msg.channel === "system"
                          ? "#f39c12"
                          : msg.channel === "party"
                          ? "#3498db"
                          : "#2ecc71",
                      fontWeight: 700,
                      marginRight: "6px"
                    }}
                  >
                    [{msg.sender}]:
                  </span>
                  <span style={{ color: msg.channel === "system" ? "#f9e79f" : "#ecf0f1" }}>
                    {msg.text}
                  </span>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendChat} style={{ display: "flex", borderTop: "1px solid #2d261e" }}>
              <input
                type="text"
                placeholder="Press Enter to chat..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                style={{
                  flex: 1,
                  backgroundColor: "#0d0c0b",
                  border: "none",
                  padding: "8px 12px",
                  color: "#f5e6ca",
                  fontSize: "12px",
                  outline: "none"
                }}
              />
            </form>
          </>
        )}
      </div>

      {/* 3. PROFILE / PARTY MODAL */}
      {isProfileOpen && (
        <div
          style={{
            position: "absolute",
            top: "80px",
            right: "20px",
            width: "320px",
            backgroundColor: "rgba(18, 16, 14, 0.96)",
            border: "1px solid #7f745e",
            borderRadius: "6px",
            padding: "16px",
            pointerEvents: "auto",
            boxShadow: "0 8px 30px rgba(0,0,0,0.8)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ fontWeight: 700, color: "#f0dfb6" }}>Exile Character Sheet</span>
            <button
              onClick={() => setIsProfileOpen(false)}
              style={{ background: "none", border: "none", color: "#8a7e6b", cursor: "pointer" }}
            >
              ✕
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
            <div>
              <span style={{ color: "#8a7e6b" }}>Class: </span>
              <span style={{ color: "#e67e22", fontWeight: 700 }}>{localPlayer?.characterClass || "Duelist"}</span>
            </div>
            <div>
              <span style={{ color: "#8a7e6b" }}>Estimated DPS: </span>
              <span style={{ color: "#e74c3c", fontWeight: 700 }}>{localPlayer?.dps || 35}</span>
            </div>
            <div>
              <span style={{ color: "#8a7e6b" }}>Your Session ID: </span>
              <span style={{ color: "#f1c40f", fontSize: "11px", wordBreak: "break-all" }}>{room?.sessionId}</span>
            </div>

            <hr style={{ borderColor: "#332d24", margin: "6px 0" }} />

            <div>
              <label style={{ color: "#8a7e6b", display: "block", marginBottom: "4px" }}>Rename Character:</label>
              <div style={{ display: "flex", gap: "6px" }}>
                <input
                  type="text"
                  placeholder="New Name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  style={{
                    flex: 1,
                    backgroundColor: "#110f0d",
                    border: "1px solid #4a4034",
                    color: "#f5e6ca",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "12px"
                  }}
                />
                <button
                  onClick={handleUpdateProfile}
                  style={{
                    backgroundColor: "#2e251a",
                    border: "1px solid #c9b99a",
                    color: "#f0dfb6",
                    padding: "4px 10px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    cursor: "pointer"
                  }}
                >
                  Save
                </button>
              </div>
            </div>

            {zoneType === "town" && (
              <div style={{ marginTop: "6px" }}>
                <label style={{ color: "#8a7e6b", display: "block", marginBottom: "4px" }}>Join Player's Party (Enter Session ID):</label>
                <div style={{ display: "flex", gap: "6px" }}>
                  <input
                    type="text"
                    placeholder="Player Session ID"
                    value={targetPartyId}
                    onChange={(e) => setTargetPartyId(e.target.value)}
                    style={{
                      flex: 1,
                      backgroundColor: "#110f0d",
                      border: "1px solid #4a4034",
                      color: "#f5e6ca",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      fontSize: "12px"
                    }}
                  />
                  <button
                    onClick={handleJoinParty}
                    style={{
                      backgroundColor: "#1c2d3d",
                      border: "1px solid #3498db",
                      color: "#85c1e9",
                      padding: "4px 10px",
                      borderRadius: "4px",
                      fontSize: "11px",
                      cursor: "pointer"
                    }}
                  >
                    Join
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. POE BOTTOM ACTION BAR & ORBS */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "135px",
          pointerEvents: "none",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          padding: "0 20px"
        }}
      >
        {/* RED LIFE GLOBE (Left) */}
        <div
          style={{
            width: "125px",
            height: "125px",
            borderRadius: "50%",
            backgroundColor: "#1a0808",
            border: "4px solid #4a1515",
            boxShadow: "0 0 15px rgba(0,0,0,0.9), inset 0 0 20px #000000",
            position: "relative",
            overflow: "hidden",
            pointerEvents: "auto",
            marginBottom: "10px"
          }}
        >
          {/* Liquid level */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: `${hpPct}%`,
              backgroundColor: "#c0392b",
              backgroundImage: "linear-gradient(to top, #962d22, #e74c3c)",
              transition: "height 0.25s ease-out"
            }}
          />
          {/* Glass Highlight */}
          <div
            style={{
              position: "absolute",
              top: "10%",
              left: "20%",
              width: "35px",
              height: "20px",
              borderRadius: "50%",
              backgroundColor: "rgba(255, 255, 255, 0.25)",
              transform: "rotate(-30deg)",
              pointerEvents: "none"
            }}
          />
          {/* Text */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center",
              color: "#ffffff",
              textShadow: "0 1px 4px #000000",
              fontWeight: 900,
              fontSize: "13px"
            }}
          >
            <div>{hp}</div>
            <div style={{ fontSize: "10px", color: "#f5b7b1" }}>/{maxHp}</div>
            <div style={{ fontSize: "9px", color: "#e6b0aa" }}>LIFE</div>
            {localPlayer?.maxEnergyShield > 0 && (
              <div style={{ fontSize: "9px", color: "#85c1e9", marginTop: "2px" }}>
                ES: {localPlayer.energyShield || 0}
              </div>
            )}
          </div>
        </div>

        {/* CENTER CONTROLS: FLASKS, SKILLS & AUTO FARM BUTTON */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "10px",
            marginBottom: "16px",
            pointerEvents: "auto"
          }}
        >
          {/* PROMINENT [AUTO FARM] TOGGLE BUTTON */}
          <button
            onClick={onToggleAuto}
            style={{
              padding: "10px 28px",
              borderRadius: "6px",
              backgroundColor: isAuto ? "#922b21" : "#241f1a",
              border: `2px solid ${isAuto ? "#ff4757" : "#5d4f3b"}`,
              color: isAuto ? "#ffffff" : "#c9b99a",
              fontSize: "14px",
              fontWeight: 900,
              letterSpacing: "1.5px",
              cursor: "pointer",
              boxShadow: isAuto
                ? "0 0 25px rgba(231, 76, 60, 0.7), 0 0 10px rgba(255, 71, 87, 0.9)"
                : "0 4px 10px rgba(0,0,0,0.5)",
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              gap: "10px"
            }}
          >
            <Sword size={18} color={isAuto ? "#ffffff" : "#f1c40f"} />
            {isAuto ? "AUTO FARM: ACTIVE ⚡" : "ACTIVATE AUTO FARM"}
          </button>

          {/* PoE Skill & Flask Bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: "rgba(18, 16, 14, 0.9)",
              padding: "6px 14px",
              borderRadius: "6px",
              border: "1px solid #3d352a"
            }}
          >
            {/* Flasks 1-5 */}
            {["Life", "Mana", "Speed", "Armor", "Crit"].map((flask, idx) => (
              <div
                key={flask}
                style={{
                  width: "36px",
                  height: "50px",
                  backgroundColor: "#161311",
                  border: "1px solid #4a3e30",
                  borderRadius: "3px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "4px 0",
                  fontSize: "10px"
                }}
              >
                <span style={{ color: "#8a7e6b" }}>{idx + 1}</span>
                <span style={{ fontSize: "14px" }}>🧪</span>
                <span style={{ fontSize: "8px", color: "#c9b99a" }}>{flask}</span>
              </div>
            ))}

            <div style={{ width: "1px", height: "40px", backgroundColor: "#3d352a", margin: "0 4px" }} />

            {/* Skills: LMB, Q, W, E */}
            {[
              { key: "LMB", name: "Strike", icon: "⚔️" },
              { key: "Q", name: "Cleave", icon: "🪓" },
              { key: "W", name: "Dash", icon: "💨" },
              { key: "E", name: "Molten", icon: "🛡️" }
            ].map((skill) => (
              <div
                key={skill.key}
                style={{
                  width: "48px",
                  height: "50px",
                  backgroundColor: "#201c18",
                  border: "1px solid #7f745e",
                  borderRadius: "3px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "4px 0",
                  fontSize: "10px"
                }}
              >
                <span style={{ color: "#f0dfb6", fontWeight: 700 }}>{skill.key}</span>
                <span style={{ fontSize: "16px" }}>{skill.icon}</span>
                <span style={{ fontSize: "8px", color: "#8a7e6b" }}>{skill.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* BLUE MANA GLOBE (Right) */}
        <div
          style={{
            width: "125px",
            height: "125px",
            borderRadius: "50%",
            backgroundColor: "#08131a",
            border: "4px solid #15324a",
            boxShadow: "0 0 15px rgba(0,0,0,0.9), inset 0 0 20px #000000",
            position: "relative",
            overflow: "hidden",
            pointerEvents: "auto",
            marginBottom: "10px"
          }}
        >
          {/* Liquid level */}
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: `${manaPct}%`,
              backgroundColor: "#2980b9",
              backgroundImage: "linear-gradient(to top, #1f618d, #3498db)",
              transition: "height 0.25s ease-out"
            }}
          />
          {/* Glass Highlight */}
          <div
            style={{
              position: "absolute",
              top: "10%",
              right: "20%",
              width: "35px",
              height: "20px",
              borderRadius: "50%",
              backgroundColor: "rgba(255, 255, 255, 0.25)",
              transform: "rotate(30deg)",
              pointerEvents: "none"
            }}
          />
          {/* Text */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center",
              color: "#ffffff",
              textShadow: "0 1px 4px #000000",
              fontWeight: 900,
              fontSize: "13px"
            }}
          >
            <div>{mana}</div>
            <div style={{ fontSize: "10px", color: "#aed6f1" }}>/{maxMana}</div>
            <div style={{ fontSize: "9px", color: "#85c1e9" }}>MANA</div>
          </div>
        </div>
      </div>

      {/* 5. POE 10-SEGMENT EXP BAR (Very Bottom) */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "8px",
          backgroundColor: "#0d0b0a",
          borderTop: "1px solid #2d261e",
          pointerEvents: "none",
          display: "flex"
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${expPct}%`,
            backgroundColor: "#f39c12",
            backgroundImage: "linear-gradient(to right, #d35400, #f1c40f)",
            transition: "width 0.3s ease-out"
          }}
        />
      </div>
    </div>
  );
};
