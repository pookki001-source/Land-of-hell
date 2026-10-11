import React, { useState } from "react";
import { Shield, Sword, X, MessageSquare, Sparkles, ScrollText, CheckCircle2, ChevronRight } from "lucide-react";
import { sounds } from "../utils/soundEffects";

interface NpcDialogueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnterStrand?: () => void;
  onClaimStarterPack?: () => void;
  hasClaimedStarterPack?: boolean;
}

export const NpcDialogueModal: React.FC<NpcDialogueModalProps> = ({
  isOpen,
  onClose,
  onEnterStrand,
  onClaimStarterPack,
  hasClaimedStarterPack = false
}) => {
  const [activeTopic, setActiveTopic] = useState<"greeting" | "wraeclast" | "strand">("greeting");

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.78)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
        pointerEvents: "auto",
        backdropFilter: "blur(6px)"
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "680px",
          backgroundColor: "#120f0d",
          backgroundImage: "linear-gradient(180deg, #181411 0%, #0d0a08 100%)",
          border: "2px solid #5a472c",
          borderRadius: "8px",
          boxShadow: "0 10px 40px rgba(0, 0, 0, 0.95), 0 0 25px rgba(212, 172, 13, 0.15)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: "16px 20px",
            backgroundColor: "#1b1612",
            borderBottom: "1px solid #3d3020",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                backgroundColor: "#2a2016",
                border: "2px solid #d4ac0d",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                boxShadow: "0 0 12px rgba(212, 172, 13, 0.3)"
              }}
            >
              <Shield size={22} color="#f1c40f" />
            </div>
            <div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "#f5e6ca", fontFamily: "'Cinzel', serif", letterSpacing: "1px" }}>
                TARKLEIGH
              </div>
              <div style={{ fontSize: "11px", color: "#a59273", letterSpacing: "0.5px" }}>
                COMMANDER OF LIONEYE'S WATCH
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: "#8a7e6b",
              cursor: "pointer",
              padding: "4px"
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div style={{ display: "flex", minHeight: "260px" }}>
          {/* Left Menu Topics */}
          <div
            style={{
              width: "210px",
              backgroundColor: "#14100d",
              borderRight: "1px solid #2e2417",
              padding: "12px 8px",
              display: "flex",
              flexDirection: "column",
              gap: "6px"
            }}
          >
            <button
              onClick={() => setActiveTopic("greeting")}
              style={{
                padding: "8px 12px",
                textAlign: "left",
                backgroundColor: activeTopic === "greeting" ? "#2a2016" : "transparent",
                border: activeTopic === "greeting" ? "1px solid #7d6608" : "1px solid transparent",
                borderRadius: "4px",
                color: activeTopic === "greeting" ? "#f1c40f" : "#b0a088",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <span>Introduction</span>
              {activeTopic === "greeting" && <ChevronRight size={14} />}
            </button>

            <button
              onClick={() => setActiveTopic("wraeclast")}
              style={{
                padding: "8px 12px",
                textAlign: "left",
                backgroundColor: activeTopic === "wraeclast" ? "#2a2016" : "transparent",
                border: activeTopic === "wraeclast" ? "1px solid #7d6608" : "1px solid transparent",
                borderRadius: "4px",
                color: activeTopic === "wraeclast" ? "#f1c40f" : "#b0a088",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <span>About Wraeclast</span>
              {activeTopic === "wraeclast" && <ChevronRight size={14} />}
            </button>

            <button
              onClick={() => setActiveTopic("strand")}
              style={{
                padding: "8px 12px",
                textAlign: "left",
                backgroundColor: activeTopic === "strand" ? "#2a2016" : "transparent",
                border: activeTopic === "strand" ? "1px solid #7d6608" : "1px solid transparent",
                borderRadius: "4px",
                color: activeTopic === "strand" ? "#f1c40f" : "#b0a088",
                fontSize: "12px",
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}
            >
              <span>The Twilight Strand</span>
              {activeTopic === "strand" && <ChevronRight size={14} />}
            </button>
          </div>

          {/* Right Text Dialogue */}
          <div style={{ flex: 1, padding: "20px 24px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div style={{ color: "#d9cbaf", fontSize: "13.5px", lineHeight: "1.7", fontStyle: "italic" }}>
              {activeTopic === "greeting" && (
                <>
                  <p style={{ marginTop: 0 }}>
                    "Still breathing, Exile? That puts you ahead of most who wash ashore on this blighted rock."
                  </p>
                  <p>
                    "This watchpost is <strong>Lioneye's Watch</strong>. It's the only sanctuary you'll find before the horrors of Wraeclast swallow you whole. If you intend to stay breathing, you'll need steel, cunning, and no mercy."
                  </p>
                  <p style={{ color: "#bfa373", fontStyle: "normal", fontSize: "12.5px" }}>
                    💡 <em>Tip: Inspect your Stash to equip weapons, sockets, and passive skill nodes before heading into combat.</em>
                  </p>
                </>
              )}

              {activeTopic === "wraeclast" && (
                <>
                  <p style={{ marginTop: 0 }}>
                    "Wraeclast is where Oriath tosses its refuse. Thieves, murderers, rebels... and heretics like you and me."
                  </p>
                  <p>
                    "The land is diseased, Exile. The dead don't stay in the dirt, and the beasts grow venomous and twisted. But for an exile with ambition? There is ancient power sleeping in these ruins."
                  </p>
                </>
              )}

              {activeTopic === "strand" && (
                <>
                  <p style={{ marginTop: 0 }}>
                    "Just beyond that blue Portal lies <strong>The Twilight Strand</strong>. The drowned dead are rising from the sand, led by monstrosities and carrion beasts."
                  </p>
                  <p>
                    "Step through the portal and purge the beach. Slay the monsters, gather their loot, and return when your pockets are heavy."
                  </p>
                </>
              )}
            </div>

            {/* Bottom Actions */}
            <div style={{ display: "flex", gap: "10px", marginTop: "18px", paddingTop: "14px", borderTop: "1px solid #2e2417" }}>
              {!hasClaimedStarterPack && onClaimStarterPack && (
                <button
                  onClick={() => {
                    sounds.playLootTink(true);
                    onClaimStarterPack();
                  }}
                  style={{
                    flex: 1,
                    padding: "9px 14px",
                    backgroundColor: "#2e2114",
                    border: "1px solid #d4ac0d",
                    borderRadius: "4px",
                    color: "#f5e6ca",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: "0 0 10px rgba(212, 172, 13, 0.25)"
                  }}
                >
                  <ScrollText size={15} color="#f1c40f" />
                  <span>Claim Exile Supplies (Scrolls & Chaos)</span>
                </button>
              )}

              {onEnterStrand && (
                <button
                  onClick={() => {
                    sounds.playPortalSound();
                    onClose();
                    onEnterStrand();
                  }}
                  style={{
                    flex: 1,
                    padding: "9px 14px",
                    backgroundColor: "#1c2d3d",
                    border: "1px solid #3498db",
                    borderRadius: "4px",
                    color: "#d4e6f1",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: "0 0 10px rgba(52, 152, 219, 0.3)"
                  }}
                >
                  <Sword size={15} color="#85c1e9" />
                  <span>Enter The Strand</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
