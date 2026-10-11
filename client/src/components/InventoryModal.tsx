import React, { useState } from "react";
import { GameItem, EquippedGear, SlotType, RARITY_COLORS } from "../data/itemData";
import { ItemTooltip } from "./ItemTooltip";
import { X, Shield, Zap, Heart, Sword, Wind, Flame, Snowflake, Sparkles } from "lucide-react";

interface InventoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  equipment: EquippedGear;
  inventory: GameItem[];
  onUpdateEquipment: (gear: EquippedGear) => void;
  onUpdateInventory: (items: GameItem[]) => void;
  characterName: string;
  characterClass: string;
}

const GRID_COLS = 12;
const GRID_ROWS = 5;
const CELL_SIZE = 42; // pixels

export const InventoryModal: React.FC<InventoryModalProps> = ({
  isOpen,
  onClose,
  equipment,
  inventory,
  onUpdateEquipment,
  onUpdateInventory,
  characterName,
  characterClass
}) => {
  const [hoveredItem, setHoveredItem] = useState<{ item: GameItem; x: number; y: number } | null>(null);
  const [draggedItem, setDraggedItem] = useState<GameItem | null>(null);

  if (!isOpen) return null;

  // Calculate live total stats from equipped gear
  const totalStats = calculateGearTotals(equipment);

  // Equip item from inventory
  const handleEquipItem = (item: GameItem) => {
    if (item.slotType === "currency") return;

    let targetSlot = item.slotType as SlotType;
    if (targetSlot === "ring1" && equipment.ring1 && !equipment.ring2) {
      targetSlot = "ring2";
    }

    const currentEquipped = equipment[targetSlot];
    const newEquipment = { ...equipment, [targetSlot]: item };

    // Remove from inventory
    let newInventory = inventory.filter((i) => i.id !== item.id);

    // If there was an equipped item, put it in inventory
    if (currentEquipped) {
      const freePos = findFreeGridSpace(newInventory, currentEquipped.width, currentEquipped.height);
      if (freePos) {
        newInventory.push({ ...currentEquipped, gridX: freePos.x, gridY: freePos.y });
      }
    }

    onUpdateEquipment(newEquipment);
    onUpdateInventory(newInventory);
    setHoveredItem(null);
  };

  // Unequip item to inventory
  const handleUnequipItem = (slot: SlotType) => {
    const item = equipment[slot];
    if (!item) return;

    const freePos = findFreeGridSpace(inventory, item.width, item.height);
    if (!freePos) {
      alert("Inventory is full! Free up space first.");
      return;
    }

    const newEquipment = { ...equipment, [slot]: null };
    const newInventory = [...inventory, { ...item, gridX: freePos.x, gridY: freePos.y }];

    onUpdateEquipment(newEquipment);
    onUpdateInventory(newInventory);
    setHoveredItem(null);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(8, 7, 7, 0.75)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        pointerEvents: "auto"
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "1080px",
          height: "640px",
          backgroundColor: "#110f0e",
          border: "2px solid #5d4f3b",
          boxShadow: "0 10px 40px rgba(0,0,0,0.95), 0 0 20px rgba(93, 79, 59, 0.3)",
          borderRadius: "8px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div
          style={{
            height: "44px",
            backgroundColor: "#1c1815",
            borderBottom: "1px solid #3d352a",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 18px",
            color: "#f0dfb6",
            fontWeight: 700,
            fontSize: "14px",
            letterSpacing: "1.5px"
          }}
        >
          <div>
            EXILE INVENTORY & EQUIPMENT •{" "}
            <span style={{ color: "#d4ac0d" }}>{characterName}</span> ({characterClass})
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

        {/* Content Body: Left Paperdoll + Right Tetris Grid */}
        <div style={{ flex: 1, display: "flex", padding: "16px", gap: "20px" }}>
          {/* ================= LEFT: EQUIPMENT PAPERDOLL ================= */}
          <div
            style={{
              width: "440px",
              backgroundColor: "#151311",
              border: "1px solid #2d261e",
              borderRadius: "6px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
          >
            {/* Paperdoll Layout Slots */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                gridTemplateRows: "repeat(4, auto)",
                gap: "10px",
                alignItems: "center",
                justifyItems: "center"
              }}
            >
              {/* Row 1: Weapon (col 1), Helmet (col 3), Amulet (col 4), Shield (col 5) */}
              <div style={{ gridColumn: 3, gridRow: 1 }}>
                <EquipmentSlotBox
                  slot="helmet"
                  item={equipment.helmet}
                  label="Helmet"
                  onUnequip={() => handleUnequipItem("helmet")}
                  onHover={(item, e) => setHoveredItem({ item, x: e.clientX, y: e.clientY })}
                  onLeave={() => setHoveredItem(null)}
                />
              </div>

              <div style={{ gridColumn: 4, gridRow: 1 }}>
                <EquipmentSlotBox
                  slot="amulet"
                  item={equipment.amulet}
                  label="Amulet"
                  size="small"
                  onUnequip={() => handleUnequipItem("amulet")}
                  onHover={(item, e) => setHoveredItem({ item, x: e.clientX, y: e.clientY })}
                  onLeave={() => setHoveredItem(null)}
                />
              </div>

              {/* Row 2: MainHand (col 1-2 tall), BodyArmour (col 3), OffHand (col 4-5 tall) */}
              <div style={{ gridColumn: "1 / span 2", gridRow: "2 / span 2" }}>
                <EquipmentSlotBox
                  slot="mainHand"
                  item={equipment.mainHand}
                  label="Main Hand"
                  size="tall"
                  onUnequip={() => handleUnequipItem("mainHand")}
                  onHover={(item, e) => setHoveredItem({ item, x: e.clientX, y: e.clientY })}
                  onLeave={() => setHoveredItem(null)}
                />
              </div>

              <div style={{ gridColumn: 3, gridRow: 2 }}>
                <EquipmentSlotBox
                  slot="bodyArmour"
                  item={equipment.bodyArmour}
                  label="Body Armour"
                  size="medium"
                  onUnequip={() => handleUnequipItem("bodyArmour")}
                  onHover={(item, e) => setHoveredItem({ item, x: e.clientX, y: e.clientY })}
                  onLeave={() => setHoveredItem(null)}
                />
              </div>

              <div style={{ gridColumn: "4 / span 2", gridRow: "2 / span 2" }}>
                <EquipmentSlotBox
                  slot="offHand"
                  item={equipment.offHand}
                  label="Off Hand"
                  size="tall"
                  onUnequip={() => handleUnequipItem("offHand")}
                  onHover={(item, e) => setHoveredItem({ item, x: e.clientX, y: e.clientY })}
                  onLeave={() => setHoveredItem(null)}
                />
              </div>

              {/* Row 3: Gloves (col 2), Belt (col 3), Boots (col 4) */}
              <div style={{ gridColumn: 2, gridRow: 4 }}>
                <EquipmentSlotBox
                  slot="gloves"
                  item={equipment.gloves}
                  label="Gloves"
                  onUnequip={() => handleUnequipItem("gloves")}
                  onHover={(item, e) => setHoveredItem({ item, x: e.clientX, y: e.clientY })}
                  onLeave={() => setHoveredItem(null)}
                />
              </div>

              <div style={{ gridColumn: 3, gridRow: 3 }}>
                <EquipmentSlotBox
                  slot="belt"
                  item={equipment.belt}
                  label="Belt"
                  size="wide"
                  onUnequip={() => handleUnequipItem("belt")}
                  onHover={(item, e) => setHoveredItem({ item, x: e.clientX, y: e.clientY })}
                  onLeave={() => setHoveredItem(null)}
                />
              </div>

              <div style={{ gridColumn: 4, gridRow: 4 }}>
                <EquipmentSlotBox
                  slot="boots"
                  item={equipment.boots}
                  label="Boots"
                  onUnequip={() => handleUnequipItem("boots")}
                  onHover={(item, e) => setHoveredItem({ item, x: e.clientX, y: e.clientY })}
                  onLeave={() => setHoveredItem(null)}
                />
              </div>

              {/* Rings: Ring 1 (col 2 row 3), Ring 2 (col 4 row 3) */}
              <div style={{ gridColumn: 2, gridRow: 3 }}>
                <EquipmentSlotBox
                  slot="ring1"
                  item={equipment.ring1}
                  label="Ring 1"
                  size="small"
                  onUnequip={() => handleUnequipItem("ring1")}
                  onHover={(item, e) => setHoveredItem({ item, x: e.clientX, y: e.clientY })}
                  onLeave={() => setHoveredItem(null)}
                />
              </div>

              <div style={{ gridColumn: 4, gridRow: 3 }}>
                <EquipmentSlotBox
                  slot="ring2"
                  item={equipment.ring2}
                  label="Ring 2"
                  size="small"
                  onUnequip={() => handleUnequipItem("ring2")}
                  onHover={(item, e) => setHoveredItem({ item, x: e.clientX, y: e.clientY })}
                  onLeave={() => setHoveredItem(null)}
                />
              </div>
            </div>

            {/* Total Gear Stats Summary */}
            <div
              style={{
                backgroundColor: "#0d0b0a",
                border: "1px solid #2a231c",
                borderRadius: "4px",
                padding: "10px",
                marginTop: "12px",
                fontSize: "11px",
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "6px"
              }}
            >
              <div>
                <span style={{ color: "#8a7e6b" }}>Bonus Life: </span>
                <strong style={{ color: "#e74c3c" }}>+{totalStats.life}</strong>
              </div>
              <div>
                <span style={{ color: "#8a7e6b" }}>Energy Shield: </span>
                <strong style={{ color: "#85c1e9" }}>+{totalStats.energyShield}</strong>
              </div>
              <div>
                <span style={{ color: "#8a7e6b" }}>Total Armour: </span>
                <strong style={{ color: "#bdc3c7" }}>+{totalStats.armour}</strong>
              </div>
              <div>
                <span style={{ color: "#8a7e6b" }}>Total Evasion: </span>
                <strong style={{ color: "#2ecc71" }}>+{totalStats.evasion}</strong>
              </div>
              <div>
                <span style={{ color: "#8a7e6b" }}>Fire Res: </span>
                <strong style={{ color: "#e67e22" }}>+{totalStats.fireRes}%</strong>
              </div>
              <div>
                <span style={{ color: "#8a7e6b" }}>Cold Res: </span>
                <strong style={{ color: "#3498db" }}>+{totalStats.coldRes}%</strong>
              </div>
            </div>
          </div>

          {/* ================= RIGHT: TETRIS INVENTORY GRID ================= */}
          <div
            style={{
              flex: 1,
              backgroundColor: "#151311",
              border: "1px solid #2d261e",
              borderRadius: "6px",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between"
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "10px",
                  fontSize: "12px",
                  color: "#8a7e6b"
                }}
              >
                <span>BAG SPACE: 12 × 5 CELLS</span>
                <span style={{ color: "#f0dfb6" }}>Right-click item to Equip/Unequip</span>
              </div>

              {/* 12 x 5 Grid Container */}
              <div
                style={{
                  position: "relative",
                  width: `${GRID_COLS * CELL_SIZE}px`,
                  height: `${GRID_ROWS * CELL_SIZE}px`,
                  backgroundColor: "#0a0908",
                  border: "1.5px solid #3d352a",
                  display: "grid",
                  gridTemplateColumns: `repeat(${GRID_COLS}, ${CELL_SIZE}px)`,
                  gridTemplateRows: `repeat(${GRID_ROWS}, ${CELL_SIZE}px)`
                }}
              >
                {/* Background Grid Cells */}
                {Array.from({ length: GRID_COLS * GRID_ROWS }).map((_, idx) => (
                  <div
                    key={idx}
                    style={{
                      border: "0.5px solid #1f1b17",
                      boxSizing: "border-box"
                    }}
                  />
                ))}

                {/* Placed Inventory Items */}
                {inventory.map((item) => {
                  const gx = item.gridX ?? 0;
                  const gy = item.gridY ?? 0;
                  const colors = RARITY_COLORS[item.rarity] || RARITY_COLORS.normal;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleEquipItem(item)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        handleEquipItem(item);
                      }}
                      onMouseEnter={(e) => setHoveredItem({ item, x: e.clientX, y: e.clientY })}
                      onMouseLeave={() => setHoveredItem(null)}
                      style={{
                        position: "absolute",
                        left: `${gx * CELL_SIZE + 1}px`,
                        top: `${gy * CELL_SIZE + 1}px`,
                        width: `${item.width * CELL_SIZE - 2}px`,
                        height: `${item.height * CELL_SIZE - 2}px`,
                        backgroundColor: colors.bg,
                        border: `1.5px solid ${colors.border}`,
                        boxShadow: `inset 0 0 8px rgba(0,0,0,0.8), 0 0 6px ${colors.border}44`,
                        borderRadius: "3px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                        zIndex: 2,
                        transition: "transform 0.1s"
                      }}
                    >
                      <span style={{ fontSize: `${item.height > 2 ? 28 : 20}px` }}>{item.icon}</span>
                      {item.width >= 2 && (
                        <span
                          style={{
                            fontSize: "9px",
                            color: colors.text,
                            textAlign: "center",
                            padding: "0 2px",
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                            textOverflow: "ellipsis",
                            maxWidth: "90%"
                          }}
                        >
                          {item.name}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ fontSize: "11px", color: "#6e6454", textAlign: "right" }}>
              Tip: Normal items can be upgraded with Orb of Transmutation or crafted with Chaos Orb!
            </div>
          </div>
        </div>
      </div>

      {/* Floating Hover Tooltip */}
      {hoveredItem && (
        <div style={{ position: "fixed", left: hoveredItem.x + 15, top: hoveredItem.y - 20, zIndex: 99999 }}>
          <ItemTooltip item={hoveredItem.item} />
        </div>
      )}
    </div>
  );
};

// Sub-component for an Equipment Slot
interface EquipmentSlotBoxProps {
  slot: SlotType;
  item: GameItem | null;
  label: string;
  size?: "small" | "medium" | "tall" | "wide";
  onUnequip: () => void;
  onHover: (item: GameItem, e: React.MouseEvent) => void;
  onLeave: () => void;
}

const EquipmentSlotBox: React.FC<EquipmentSlotBoxProps> = ({
  slot,
  item,
  label,
  size = "medium",
  onUnequip,
  onHover,
  onLeave
}) => {
  let width = 64;
  let height = 64;

  if (size === "small") {
    width = 46;
    height = 46;
  } else if (size === "tall") {
    width = 72;
    height = 110;
  } else if (size === "wide") {
    width = 80;
    height = 46;
  }

  const colors = item ? RARITY_COLORS[item.rarity] : null;

  return (
    <div
      onContextMenu={(e) => {
        e.preventDefault();
        onUnequip();
      }}
      onClick={onUnequip}
      onMouseEnter={(e) => item && onHover(item, e)}
      onMouseLeave={onLeave}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        backgroundColor: colors ? colors.bg : "#0c0a09",
        border: `1.5px solid ${colors ? colors.border : "#3d352a"}`,
        boxShadow: colors ? `0 0 10px ${colors.border}44` : "none",
        borderRadius: "4px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        cursor: item ? "pointer" : "default"
      }}
      title={item ? `Right click to unequip ${item.name}` : label}
    >
      {item ? (
        <>
          <span style={{ fontSize: size === "tall" ? "32px" : "22px" }}>{item.icon}</span>
          <span
            style={{
              fontSize: "8px",
              color: colors?.text || "#c9b99a",
              textAlign: "center",
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              maxWidth: "90%",
              marginTop: "2px"
            }}
          >
            {item.name}
          </span>
        </>
      ) : (
        <span style={{ fontSize: "10px", color: "#4a3e30", textAlign: "center", padding: "2px" }}>
          {label}
        </span>
      )}
    </div>
  );
};

// Helper: Find free space in Tetris grid
function findFreeGridSpace(inventory: GameItem[], width: number, height: number): { x: number; y: number } | null {
  const occupied = Array.from({ length: GRID_ROWS }, () => Array(GRID_COLS).fill(false));

  for (const item of inventory) {
    const ix = item.gridX ?? 0;
    const iy = item.gridY ?? 0;
    for (let r = 0; r < item.height; r++) {
      for (let c = 0; c < item.width; c++) {
        if (iy + r < GRID_ROWS && ix + c < GRID_COLS) {
          occupied[iy + r][ix + c] = true;
        }
      }
    }
  }

  for (let r = 0; r <= GRID_ROWS - height; r++) {
    for (let c = 0; c <= GRID_COLS - width; c++) {
      let canFit = true;
      for (let dr = 0; dr < height; dr++) {
        for (let dc = 0; dc < width; dc++) {
          if (occupied[r + dr][c + dc]) {
            canFit = false;
            break;
          }
        }
        if (!canFit) break;
      }
      if (canFit) return { x: c, y: r };
    }
  }

  return null;
}

// Helper: Calculate total stats from gear
function calculateGearTotals(equipment: EquippedGear) {
  const totals = {
    life: 0,
    energyShield: 0,
    mana: 0,
    armour: 0,
    evasion: 0,
    fireRes: 0,
    coldRes: 0,
    lightningRes: 0,
    dpsBonus: 0
  };

  Object.values(equipment).forEach((item) => {
    if (!item || !item.stats) return;
    if (item.stats.life) totals.life += item.stats.life;
    if (item.stats.energyShield) totals.energyShield += item.stats.energyShield;
    if (item.stats.mana) totals.mana += item.stats.mana;
    if (item.stats.armour) totals.armour += item.stats.armour;
    if (item.stats.evasion) totals.evasion += item.stats.evasion;
    if (item.stats.fireRes) totals.fireRes += item.stats.fireRes;
    if (item.stats.coldRes) totals.coldRes += item.stats.coldRes;
    if (item.stats.lightningRes) totals.lightningRes += item.stats.lightningRes;
  });

  return totals;
}
