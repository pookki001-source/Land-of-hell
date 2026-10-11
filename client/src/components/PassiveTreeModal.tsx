import React, { useState, useRef, useEffect } from "react";
import { PASSIVE_NODES, PassiveNode, NodeType } from "../data/passiveTreeData";
import { sounds } from "../utils/soundEffects";
import { X, ZoomIn, ZoomOut, RotateCcw, Sparkles, Check, Info } from "lucide-react";

interface PassiveTreeModalProps {
  isOpen: boolean;
  onClose: () => void;
  allocatedNodeIds: string[];
  onUpdateAllocatedNodes: (nodeIds: string[]) => void;
  playerLevel: number;
  characterClass: string;
}

export const PassiveTreeModal: React.FC<PassiveTreeModalProps> = ({
  isOpen,
  onClose,
  allocatedNodeIds,
  onUpdateAllocatedNodes,
  playerLevel,
  characterClass
}) => {
  const [zoom, setZoom] = useState<number>(0.85);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<{ node: PassiveNode; x: number; y: number } | null>(null);

  // Automatically ensure the character's class starting node is allocated
  const classStartNodeId = getStartNodeForClass(characterClass);
  useEffect(() => {
    if (classStartNodeId && !allocatedNodeIds.includes(classStartNodeId)) {
      onUpdateAllocatedNodes([...allocatedNodeIds, classStartNodeId]);
    }
  }, [classStartNodeId]);

  if (!isOpen) return null;

  // Calculate available points (1 point per level, minus spent points excluding start node)
  const spentPoints = allocatedNodeIds.filter((id) => PASSIVE_NODES[id]?.type !== "start").length;
  const totalEarnedPoints = Math.max(1, playerLevel);
  const availablePoints = Math.max(0, totalEarnedPoints - spentPoints);

  // Calculate reachable nodes (connected to already allocated nodes)
  const reachableNodeIds = new Set<string>();
  allocatedNodeIds.forEach((allocId) => {
    const node = PASSIVE_NODES[allocId];
    if (node && node.connections) {
      node.connections.forEach((connId) => {
        if (!allocatedNodeIds.includes(connId)) {
          reachableNodeIds.add(connId);
        }
      });
    }
  });

  // Pan & Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY < 0 ? 0.1 : -0.1;
    setZoom((prev) => Math.max(0.4, Math.min(1.8, prev + zoomDelta)));
  };

  const resetView = () => {
    const startNode = PASSIVE_NODES[classStartNodeId];
    if (startNode) {
      setPan({ x: -startNode.x * zoom, y: -startNode.y * zoom });
    } else {
      setPan({ x: 0, y: 0 });
    }
    setZoom(0.85);
  };

  // Node Click: Allocate or Refund
  const handleNodeClick = (node: PassiveNode) => {
    if (node.type === "start") return;

    if (allocatedNodeIds.includes(node.id)) {
      // Refund: Check if it's a leaf node in the allocated tree
      if (canRefundNode(node.id, allocatedNodeIds, classStartNodeId)) {
        sounds.playHitSound();
        onUpdateAllocatedNodes(allocatedNodeIds.filter((id) => id !== node.id));
      } else {
        alert("Cannot refund a node that bridges other allocated passives!");
      }
    } else if (reachableNodeIds.has(node.id)) {
      // Allocate: Check if points available
      if (availablePoints > 0) {
        sounds.playLevelUp();
        onUpdateAllocatedNodes([...allocatedNodeIds, node.id]);
      } else {
        alert("No Passive Skill Points remaining! Level up to earn more points.");
      }
    }
  };

  // Calculate live cumulative passive tree bonuses
  const treeTotals = calculatePassiveTotals(allocatedNodeIds);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "rgba(5, 4, 4, 0.95)",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        userSelect: "none"
      }}
    >
      {/* 1. TOP HEADER & POINT COUNTER */}
      <div
        style={{
          height: "56px",
          backgroundColor: "#14110f",
          borderBottom: "1.5px solid #3d352a",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          color: "#f0dfb6",
          zIndex: 10
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ fontSize: "16px", fontWeight: 700, letterSpacing: "2px" }}>
            PASSIVE SKILL CONSTELLATION
          </span>
          <span style={{ fontSize: "13px", color: "#8a7e6b" }}>
            {characterClass} • Level {playerLevel}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <div
            style={{
              backgroundColor: "#20180f",
              border: "1.5px solid #d4ac0d",
              boxShadow: "0 0 15px rgba(212, 172, 13, 0.3)",
              padding: "6px 18px",
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <Sparkles size={16} color="#f1c40f" />
            <span style={{ fontSize: "13px", fontWeight: 700, color: "#f9e79f" }}>
              Passive Points Available:{" "}
              <strong style={{ fontSize: "15px", color: "#ffffff" }}>{availablePoints}</strong>
            </span>
          </div>

          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => setZoom((z) => Math.min(1.8, z + 0.15))}
              style={iconBtnStyle}
              title="Zoom In"
            >
              <ZoomIn size={16} />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
              style={iconBtnStyle}
              title="Zoom Out"
            >
              <ZoomOut size={16} />
            </button>
            <button onClick={resetView} style={iconBtnStyle} title="Reset View to Character">
              <RotateCcw size={16} />
            </button>
            <button onClick={onClose} style={iconBtnStyle} title="Close (P)">
              <X size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* 2. INTERACTIVE CANVAS / SVG WORKSPACE */}
      <div
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        style={{
          flex: 1,
          position: "relative",
          cursor: isDragging ? "grabbing" : "grab",
          overflow: "hidden",
          backgroundColor: "#070606",
          backgroundImage:
            "radial-gradient(circle at 50% 50%, #15100c 0%, #070606 80%)"
        }}
      >
        <svg
          style={{
            width: "100%",
            height: "100%",
            position: "absolute",
            top: 0,
            left: 0
          }}
        >
          <g
            transform={`translate(${window.innerWidth / 2 + pan.x}, ${
              (window.innerHeight - 56) / 2 + pan.y
            }) scale(${zoom})`}
          >
            {/* Draw Background Constellation Starfield Rings */}
            <circle cx={0} cy={0} r={420} fill="none" stroke="#251e18" strokeWidth={1.5} strokeDasharray="6,6" />
            <circle cx={0} cy={0} r={240} fill="none" stroke="#1f1812" strokeWidth={1} strokeDasharray="4,4" />

            {/* A. DRAW CONNECTING LINES (LINKS) */}
            {Object.values(PASSIVE_NODES).map((node) => {
              return node.connections.map((targetId) => {
                const target = PASSIVE_NODES[targetId];
                if (!target || node.id > targetId) return null; // Avoid duplicate lines

                const isBothAllocated =
                  allocatedNodeIds.includes(node.id) && allocatedNodeIds.includes(target.id);
                const isReachable =
                  (allocatedNodeIds.includes(node.id) && reachableNodeIds.has(target.id)) ||
                  (allocatedNodeIds.includes(target.id) && reachableNodeIds.has(node.id));

                return (
                  <line
                    key={`${node.id}-${target.id}`}
                    x1={node.x}
                    y1={node.y}
                    x2={target.x}
                    y2={target.y}
                    stroke={
                      isBothAllocated
                        ? "#f1c40f"
                        : isReachable
                        ? "rgba(212, 172, 13, 0.4)"
                        : "#2c231c"
                    }
                    strokeWidth={isBothAllocated ? 3.5 : isReachable ? 2 : 1.5}
                    strokeDasharray={isReachable && !isBothAllocated ? "4,4" : "none"}
                    style={{
                      filter: isBothAllocated
                        ? "drop-shadow(0 0 6px rgba(241, 196, 15, 0.7))"
                        : "none"
                    }}
                  />
                );
              });
            })}

            {/* B. DRAW PASSIVE NODES */}
            {Object.values(PASSIVE_NODES).map((node) => {
              const isAllocated = allocatedNodeIds.includes(node.id);
              const isReachable = reachableNodeIds.has(node.id);
              const isStart = node.type === "start";
              const isKeystone = node.type === "keystone";
              const isNotable = node.type === "notable";

              const radius = isStart ? 36 : isKeystone ? 26 : isNotable ? 20 : 13;

              let fillColor = "#161311";
              let strokeColor = "#4a3c2c";
              let strokeWidth = 2;

              if (isAllocated) {
                fillColor = isKeystone ? "#78281f" : isNotable ? "#5c430e" : "#3e3215";
                strokeColor = "#f1c40f";
                strokeWidth = 3;
              } else if (isReachable) {
                strokeColor = "#d4ac0d";
                strokeWidth = 2.5;
              }

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNodeClick(node);
                  }}
                  onMouseEnter={(e) =>
                    setHoveredNode({ node, x: e.clientX, y: e.clientY })
                  }
                  onMouseLeave={() => setHoveredNode(null)}
                  style={{
                    cursor: isStart
                      ? "default"
                      : isAllocated || isReachable
                      ? "pointer"
                      : "not-allowed"
                  }}
                >
                  {/* Outer Glowing Halo for Allocated / Notable / Keystone */}
                  {(isAllocated || isKeystone || isNotable) && (
                    <circle
                      cx={0}
                      cy={0}
                      r={radius + (isKeystone ? 8 : 5)}
                      fill="none"
                      stroke={
                        isAllocated
                          ? isKeystone
                            ? "#e74c3c"
                            : "#f39c12"
                          : "rgba(212, 172, 13, 0.25)"
                      }
                      strokeWidth={1.5}
                      style={{
                        animation: isAllocated ? "pulseGlow 2s infinite" : "none"
                      }}
                    />
                  )}

                  {/* Main Node Body */}
                  {isKeystone ? (
                    /* Keystone: Diamond Shape */
                    <polygon
                      points={`0,-${radius} ${radius},0 0,${radius} -${radius},0`}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                    />
                  ) : (
                    /* Circular Node */
                    <circle
                      cx={0}
                      cy={0}
                      r={radius}
                      fill={fillColor}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                    />
                  )}

                  {/* Inner Constellation Jewel / Core (PoE Style) */}
                  {isKeystone && (
                    <polygon
                      points={`0,-${radius * 0.55} ${radius * 0.55},0 0,${radius * 0.55} -${radius * 0.55},0`}
                      fill={isAllocated ? "#ff7675" : "rgba(231, 76, 60, 0.4)"}
                      stroke="#ff7675"
                      strokeWidth={1}
                    />
                  )}

                  {isNotable && (
                    <>
                      <circle
                        cx={0}
                        cy={0}
                        r={radius * 0.5}
                        fill={isAllocated ? "#f39c12" : "rgba(243, 156, 18, 0.35)"}
                      />
                      <circle
                        cx={0}
                        cy={0}
                        r={radius * 0.22}
                        fill={isAllocated ? "#ffffff" : "#f1c40f"}
                      />
                    </>
                  )}

                  {isStart && (
                    <>
                      <circle
                        cx={0}
                        cy={0}
                        r={radius * 0.65}
                        fill="none"
                        stroke="#d4ac0d"
                        strokeWidth={1.5}
                        strokeDasharray="4,3"
                      />
                      <circle
                        cx={0}
                        cy={0}
                        r={radius * 0.35}
                        fill="#f1c40f"
                      />
                    </>
                  )}

                  {!isKeystone && !isNotable && !isStart && (
                    <circle
                      cx={0}
                      cy={0}
                      r={radius * 0.45}
                      fill={isAllocated ? "#f1c40f" : isReachable ? "rgba(212, 172, 13, 0.7)" : "#4a3c2c"}
                    />
                  )}
                </g>
              );
            })}
          </g>
        </svg>

        {/* 3. FLOATING NODE HOVER TOOLTIP */}
        {hoveredNode && (
          <div
            style={{
              position: "fixed",
              left: hoveredNode.x + 18,
              top: hoveredNode.y - 20,
              width: "280px",
              backgroundColor: "#110f0e",
              border: `1.5px solid ${
                hoveredNode.node.type === "keystone"
                  ? "#e74c3c"
                  : hoveredNode.node.type === "notable"
                  ? "#f39c12"
                  : "#7f745e"
              }`,
              boxShadow: "0 8px 30px rgba(0,0,0,0.9)",
              borderRadius: "6px",
              padding: "12px 14px",
              zIndex: 99999,
              pointerEvents: "none",
              color: "#c9b99a",
              fontSize: "12px",
              lineHeight: "1.5"
            }}
          >
            <div
              style={{
                fontSize: "14px",
                fontWeight: 700,
                color:
                  hoveredNode.node.type === "keystone"
                    ? "#ff7675"
                    : hoveredNode.node.type === "notable"
                    ? "#ffeaa7"
                    : "#ffffff",
                marginBottom: "4px"
              }}
            >
              {hoveredNode.node.name}
            </div>

            <div
              style={{
                fontSize: "10px",
                color: "#8a7e6b",
                textTransform: "uppercase",
                letterSpacing: "1px",
                marginBottom: "8px"
              }}
            >
              {hoveredNode.node.type} Passive Node
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "3px", color: "#85c1e9" }}>
              {hoveredNode.node.statsText.map((txt, idx) => (
                <div key={idx}>{txt}</div>
              ))}
            </div>

            <div
              style={{
                marginTop: "10px",
                paddingTop: "6px",
                borderTop: "1px solid #2d261e",
                fontSize: "10px",
                color: allocatedNodeIds.includes(hoveredNode.node.id)
                  ? "#2ecc71"
                  : reachableNodeIds.has(hoveredNode.node.id)
                  ? "#f1c40f"
                  : "#e74c3c"
              }}
            >
              {allocatedNodeIds.includes(hoveredNode.node.id)
                ? "[Allocated] Click to Refund"
                : reachableNodeIds.has(hoveredNode.node.id)
                ? "[Available] Click to Allocate (1 Point)"
                : "[Locked] Path not connected"}
            </div>
          </div>
        )}

        {/* 4. SIDEBAR STATS SUMMARY */}
        <div
          style={{
            position: "absolute",
            bottom: "20px",
            left: "20px",
            backgroundColor: "rgba(18, 16, 14, 0.9)",
            border: "1px solid #3d352a",
            borderRadius: "6px",
            padding: "14px 18px",
            width: "260px",
            fontSize: "11px",
            color: "#c9b99a",
            pointerEvents: "auto"
          }}
        >
          <div style={{ fontWeight: 700, color: "#f0dfb6", marginBottom: "8px" }}>
            PASSIVE BONUSES ACCUMULATED:
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div>
              Strength: <strong style={{ color: "#c0392b" }}>+{treeTotals.strength}</strong> |
              Dex: <strong style={{ color: "#27ae60" }}>+{treeTotals.dexterity}</strong> |
              Int: <strong style={{ color: "#3498db" }}>+{treeTotals.intelligence}</strong>
            </div>
            <div>
              Max Life:{" "}
              <strong style={{ color: "#e74c3c" }}>
                +{treeTotals.maxHpFlat} ({treeTotals.maxHpPercent > 0 ? `+${treeTotals.maxHpPercent}%` : "0%"})
              </strong>
            </div>
            <div>
              Energy Shield:{" "}
              <strong style={{ color: "#85c1e9" }}>
                +{treeTotals.energyShieldFlat} ({treeTotals.energyShieldPercent > 0 ? `+${treeTotals.energyShieldPercent}%` : "0%"})
              </strong>
            </div>
            <div>
              Increased Damage:{" "}
              <strong style={{ color: "#f39c12" }}>+{treeTotals.dpsPercent}%</strong>
            </div>
            <div>
              Elemental Resists:{" "}
              <strong style={{ color: "#f1c40f" }}>+{treeTotals.fireRes}% All</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Styling helper
const iconBtnStyle: React.CSSProperties = {
  backgroundColor: "#201c18",
  border: "1px solid #4a3e30",
  color: "#c9b99a",
  padding: "7px 10px",
  borderRadius: "4px",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
};

// Helper: Find Start Node for given Class
export function getStartNodeForClass(cls: string): string {
  const map: Record<string, string> = {
    Marauder: "start_marauder",
    Ranger: "start_ranger",
    Witch: "start_witch",
    Duelist: "start_duelist",
    Templar: "start_templar",
    Shadow: "start_shadow",
    Scion: "start_scion"
  };
  return map[cls] || "start_duelist";
}

// Helper: Calculate total stats from allocated nodes
export function calculatePassiveTotals(nodeIds: string[]) {
  const totals = {
    strength: 0,
    dexterity: 0,
    intelligence: 0,
    maxHpFlat: 0,
    maxHpPercent: 0,
    energyShieldFlat: 0,
    energyShieldPercent: 0,
    manaFlat: 0,
    dpsPercent: 0,
    armourPercent: 0,
    evasionPercent: 0,
    fireRes: 0,
    coldRes: 0,
    lightningRes: 0,
    chaosRes: 0,
    movementSpeedPercent: 0,
    isChaosInoculation: false,
    isResoluteTechnique: false,
    isBloodMagic: false
  };

  nodeIds.forEach((id) => {
    const node = PASSIVE_NODES[id];
    if (!node || !node.statsModifiers) return;
    const m = node.statsModifiers;

    if (m.strength) totals.strength += m.strength;
    if (m.dexterity) totals.dexterity += m.dexterity;
    if (m.intelligence) totals.intelligence += m.intelligence;
    if (m.maxHpFlat) totals.maxHpFlat += m.maxHpFlat;
    if (m.maxHpPercent) totals.maxHpPercent += m.maxHpPercent;
    if (m.energyShieldFlat) totals.energyShieldFlat += m.energyShieldFlat;
    if (m.energyShieldPercent) totals.energyShieldPercent += m.energyShieldPercent;
    if (m.manaFlat) totals.manaFlat += m.manaFlat;
    if (m.dpsPercent) totals.dpsPercent += m.dpsPercent;
    if (m.armourPercent) totals.armourPercent += m.armourPercent;
    if (m.evasionPercent) totals.evasionPercent += m.evasionPercent;
    if (m.fireRes) totals.fireRes += m.fireRes;
    if (m.coldRes) totals.coldRes += m.coldRes;
    if (m.lightningRes) totals.lightningRes += m.lightningRes;
    if (m.chaosRes) totals.chaosRes += m.chaosRes;
    if (m.movementSpeedPercent) totals.movementSpeedPercent += m.movementSpeedPercent;
    if (m.isChaosInoculation) totals.isChaosInoculation = true;
    if (m.isResoluteTechnique) totals.isResoluteTechnique = true;
    if (m.isBloodMagic) totals.isBloodMagic = true;
  });

  return totals;
}

// Helper: Verify if node can be refunded safely without disconnecting remaining tree
function canRefundNode(nodeId: string, currentAllocated: string[], startNodeId: string): boolean {
  const remaining = currentAllocated.filter((id) => id !== nodeId);
  if (!remaining.includes(startNodeId)) return false;

  // BFS flood fill from start node to see if all remaining nodes are still reachable
  const visited = new Set<string>();
  const queue = [startNodeId];
  visited.add(startNodeId);

  while (queue.length > 0) {
    const curr = queue.shift()!;
    const node = PASSIVE_NODES[curr];
    if (node && node.connections) {
      node.connections.forEach((neighbor) => {
        if (remaining.includes(neighbor) && !visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      });
    }
  }

  return visited.size === remaining.length;
}
