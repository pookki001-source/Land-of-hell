import React from "react";
import { GameItem, RARITY_COLORS } from "../data/itemData";

interface ItemTooltipProps {
  item: GameItem;
}

export const ItemTooltip: React.FC<ItemTooltipProps> = ({ item }) => {
  const colors = RARITY_COLORS[item.rarity] || RARITY_COLORS.normal;

  return (
    <div
      style={{
        position: "absolute",
        zIndex: 99999,
        pointerEvents: "none",
        width: "290px",
        backgroundColor: "#0d0b0a",
        backgroundImage: "linear-gradient(to bottom, #181412, #0d0b0a)",
        border: `1.5px solid ${colors.border}`,
        boxShadow: `0 8px 30px rgba(0,0,0,0.9), 0 0 15px ${colors.border}44`,
        borderRadius: "4px",
        padding: "10px 14px",
        fontFamily: "'Cinzel', serif",
        fontSize: "12px",
        color: "#c9b99a",
        lineHeight: "1.5"
      }}
    >
      {/* 1. Header (Name & Base Type) */}
      <div
        style={{
          textAlign: "center",
          paddingBottom: "8px",
          borderBottom: `1px solid ${colors.border}66`,
          marginBottom: "8px"
        }}
      >
        <div style={{ fontSize: "14px", fontWeight: 700, color: colors.text }}>{item.name}</div>
        {item.name !== item.baseName && (
          <div style={{ fontSize: "12px", color: "#8a7e6b" }}>{item.baseName}</div>
        )}
      </div>

      {/* 2. Core Stats (Damage, Speed, Defenses) */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginBottom: "8px" }}>
        {item.stats.physicalDamageMin !== undefined && (
          <div>
            Physical Damage:{" "}
            <strong style={{ color: "#ffffff" }}>
              {item.stats.physicalDamageMin}–{item.stats.physicalDamageMax}
            </strong>
          </div>
        )}

        {item.stats.attackSpeed !== undefined && (
          <div>
            Attacks per Second:{" "}
            <strong style={{ color: "#ffffff" }}>{item.stats.attackSpeed.toFixed(2)}</strong>
          </div>
        )}

        {item.stats.armour !== undefined && (
          <div>
            Armour: <strong style={{ color: "#ffffff" }}>{item.stats.armour}</strong>
          </div>
        )}

        {item.stats.evasion !== undefined && (
          <div>
            Evasion Rating: <strong style={{ color: "#ffffff" }}>{item.stats.evasion}</strong>
          </div>
        )}

        {item.stats.energyShield !== undefined && (
          <div>
            Energy Shield: <strong style={{ color: "#85c1e9" }}>{item.stats.energyShield}</strong>
          </div>
        )}
      </div>

      {/* 3. Requirements */}
      {(item.levelReq > 1 || item.strReq || item.dexReq || item.intReq) && (
        <div
          style={{
            fontSize: "11px",
            color: "#8a7e6b",
            paddingTop: "4px",
            borderTop: "1px solid #2d261e",
            marginBottom: "8px"
          }}
        >
          Requires{" "}
          {item.levelReq > 1 && <span>Level {item.levelReq} </span>}
          {item.strReq && <span>• {item.strReq} Str </span>}
          {item.dexReq && <span>• {item.dexReq} Dex </span>}
          {item.intReq && <span>• {item.intReq} Int</span>}
        </div>
      )}

      {/* 4. Implicit Modifiers */}
      {item.implicitMods && item.implicitMods.length > 0 && (
        <div
          style={{
            padding: "6px 0",
            borderTop: "1px solid #3d352a",
            borderBottom: "1px solid #3d352a",
            marginBottom: "8px",
            color: "#8888ff",
            textAlign: "center"
          }}
        >
          {item.implicitMods.map((mod, idx) => (
            <div key={idx}>{mod}</div>
          ))}
        </div>
      )}

      {/* 5. Explicit Modifiers */}
      {item.explicitMods && item.explicitMods.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: "3px", color: "#8888ff" }}>
          {item.explicitMods.map((mod, idx) => (
            <div key={idx}>{mod}</div>
          ))}
        </div>
      )}

      {/* 6. Unique Flavor Text */}
      {item.flavorText && (
        <div
          style={{
            marginTop: "8px",
            paddingTop: "6px",
            borderTop: "1px solid #3d352a",
            fontStyle: "italic",
            color: "#af601a",
            fontSize: "11px",
            textAlign: "center"
          }}
        >
          "{item.flavorText}"
        </div>
      )}
    </div>
  );
};
