"use client"
import type React from "react"
import { useRef, useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import {
  type Box,
  type Connection,
  type Junction,
  type ConnectionEndpointSource,
  type Tool,
  GRID_SIZE,
  SCALE,
  CONNECTION_SELECTION_THRESHOLD_PX,
  JUNCTION_RADIUS_PX,
} from "@/types/schematic"
import {
  worldToScreen,
  screenToWorld,
  getMousePosition,
  generateDrawableOrthogonalPath,
  distSq,
  distToSegmentSquared,
  snapToGrid,
  snapToHalfGrid,
} from "@/lib/geometry"
import {
  getVisualDetails,
  getEndpointPosition,
  getEffectiveAnchorSide,
  getNetLabelTextAttributes,
  getNetLabelForeignObjectPos,
} from "@/lib/schematic-utils"

interface SchematicEditorProps {
  boxes: Box[]
  connections: Connection[]
  junctions: Junction[]
  selectedTool: Tool
  panOffset: { x: number; y: number }
  setPanOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>

  selectedBoxId: string | null
  onSelectBox: (id: string | null) => void
  selectedConnectionId: string | null
  onSelectConnection: (id: string | null) => void
  selectedJunctionId: string | null
  onSelectJunction: (id: string | null) => void

  connectionStart: ConnectionEndpointSource | null
  currentConnectionWaypoints: { x: number; y: number }[]

  editingName: string | null
  tempName: string
  onTempNameChange: (name: string) => void
  onStartEditingBoxName: (boxId: string) => void
  onFinishEditingBoxName: () => void

  editingConnLabelId: string | null
  tempConnLabel: string
  onTempConnLabelChange: (label: string) => void
  onStartEditingConnLabel: (connId: string) => void
  onFinishEditingConnLabel: () => void

  onAddChip: (worldPos: { x: number; y: number }) => void
  onAddPassive: (worldPos: { x: number; y: number }) => void
  onAddNetLabel: (worldPos: { x: number; y: number }) => void
  onAddJunction: (worldPos: { x: number; y: number }) => void
  onAddJunctionToSegment: (
    worldPos: { x: number; y: number },
    connId: string,
    segmentStart: { x: number; y: number },
    segmentEnd: { x: number; y: number },
  ) => void

  onStartConnection: (endpoint: ConnectionEndpointSource) => void
  onAddWaypoint: (worldPos: { x: number; y: number }) => void
  onFinishConnection: (endpoint: ConnectionEndpointSource) => void

  onUpdateBoxPosition: (boxId: string, newX: number, newY: number) => void
  onClearSelectionsAndCancelConnection: () => void
  onSelectTool: (tool: Tool) => void
}

export function SchematicEditor({
  boxes,
  connections,
  junctions,
  selectedTool,
  panOffset: panOffsetProp,
  setPanOffset,
  selectedBoxId,
  onSelectBox,
  selectedConnectionId,
  onSelectConnection,
  selectedJunctionId,
  onSelectJunction,
  connectionStart,
  currentConnectionWaypoints,
  editingName,
  tempName,
  onTempNameChange,
  onStartEditingBoxName,
  onFinishEditingBoxName,
  editingConnLabelId,
  tempConnLabel,
  onTempConnLabelChange,
  onStartEditingConnLabel,
  onFinishEditingConnLabel,
  onAddChip,
  onAddPassive,
  onAddNetLabel,
  onAddJunction,
  onAddJunctionToSegment,
  onStartConnection,
  onAddWaypoint,
  onFinishConnection,
  onUpdateBoxPosition,
  onClearSelectionsAndCancelConnection,
  onSelectTool,
}: SchematicEditorProps) {
  const currentPanOffset =
    panOffsetProp &&
    typeof panOffsetProp.x === "number" &&
    typeof panOffsetProp.y === "number"
      ? panOffsetProp
      : { x: 0, y: 0 }

  const svgRef = useRef<SVGSVGElement>(null)
  const [isPanning, setIsPanning] = useState(false)
  const lastPanPosition = useRef({ x: 0, y: 0 })
  const [draggedBoxId, setDraggedBoxId] = useState<string | null>(null)
  const dragOffset = useRef({ x: 0, y: 0 })
  const [currentMouseScreenPos, setCurrentMouseScreenPos] = useState({
    x: 0,
    y: 0,
  })

  // Initialize lastPanPosition if SVG is available
  useEffect(() => {
    if (svgRef.current) {
      const rect = svgRef.current.getBoundingClientRect()
      lastPanPosition.current = { x: rect.width / 2, y: rect.height / 2 }
      setCurrentMouseScreenPos({ x: rect.width / 2, y: rect.height / 2 })
    }
  }, [])

  const handlePinClick = (
    e: React.MouseEvent,
    boxId: string,
    pinId: string,
  ) => {
    e.stopPropagation()
    if (editingName || editingConnLabelId) return
    const endpoint: ConnectionEndpointSource = { type: "pin", boxId, pinId }
    const mousePos = getMousePosition(e, svgRef)
    setCurrentMouseScreenPos(mousePos)
    lastPanPosition.current = mousePos

    if (selectedTool !== "connect") {
      onSelectTool("connect")
      onStartConnection(endpoint)
    } else {
      if (!connectionStart) {
        onStartConnection(endpoint)
      } else {
        if (
          connectionStart.type === "pin" &&
          connectionStart.boxId === boxId &&
          connectionStart.pinId === pinId
        ) {
          return
        }
        onFinishConnection(endpoint)
      }
    }
  }

  const handleJunctionClick = (e: React.MouseEvent, junctionId: string) => {
    e.stopPropagation()
    if (editingName || editingConnLabelId) return
    const endpoint: ConnectionEndpointSource = { type: "junction", junctionId }
    const mousePos = getMousePosition(e, svgRef)
    setCurrentMouseScreenPos(mousePos)
    lastPanPosition.current = mousePos

    if (selectedTool === "select") {
      onSelectJunction(junctionId)
      onSelectBox(null)
      onSelectConnection(null)
    } else if (selectedTool === "connect") {
      if (!connectionStart) {
        onStartConnection(endpoint)
      } else {
        onFinishConnection(endpoint)
      }
    }
  }

  const handleBoxMouseDown = (e: React.MouseEvent, boxId: string) => {
    e.stopPropagation()
    if (editingName || editingConnLabelId) return

    const box = boxes.find((b) => b.id === boxId)
    if (!box) return

    // Universal selection: if a box body is clicked, switch to select mode and select it.
    onSelectTool("select")
    onSelectBox(boxId)
    onSelectConnection(null)
    onSelectJunction(null)

    // Allow dragging the selected box
    setDraggedBoxId(boxId)
    const mousePos = getMousePosition(e, svgRef)
    setCurrentMouseScreenPos(mousePos)
    lastPanPosition.current = mousePos
    const worldPos = screenToWorld(mousePos.x, mousePos.y, currentPanOffset)
    dragOffset.current = { x: worldPos.x - box.x, y: worldPos.y - box.y }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    const mousePos = getMousePosition(e, svgRef)
    setCurrentMouseScreenPos(mousePos)
    lastPanPosition.current = mousePos
    const worldPos = screenToWorld(mousePos.x, mousePos.y, currentPanOffset)

    if (editingName || editingConnLabelId) return

    // Check for explicit panning triggers (middle click or shift+click)
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      setIsPanning(true)
      e.preventDefault()
      return
    }

    if (e.button !== 0) return

    // Check if we clicked on empty space and should start panning for select tool
    let clickedOnSomething = false

    // Check if we clicked on a connection
    for (const conn of connections) {
      const screenPathPoints = conn.path.map((p) =>
        worldToScreen(p.x, p.y, currentPanOffset),
      )
      const drawableScreenPath =
        generateDrawableOrthogonalPath(screenPathPoints)
      for (let i = 0; i < drawableScreenPath.length - 1; i++) {
        if (
          distToSegmentSquared(
            mousePos,
            drawableScreenPath[i],
            drawableScreenPath[i + 1],
          ) <
          CONNECTION_SELECTION_THRESHOLD_PX ** 2
        ) {
          clickedOnSomething = true
          if (selectedTool === "select") {
            onSelectConnection(conn.id)
            onSelectBox(null)
            onSelectJunction(null)
          }
          break
        }
      }
      if (clickedOnSomething) break
    }

    // Check if we clicked on a junction
    if (!clickedOnSomething) {
      for (const jct of junctions) {
        const jctScreen = worldToScreen(jct.x, jct.y, currentPanOffset)
        if (distSq(mousePos, jctScreen) < (JUNCTION_RADIUS_PX + 2) ** 2) {
          clickedOnSomething = true
          if (selectedTool === "select") {
            onSelectJunction(jct.id)
            onSelectBox(null)
            onSelectConnection(null)
          }
          break
        }
      }
    }

    // If we didn't click on anything and we're in select mode, start panning
    if (!clickedOnSomething && selectedTool === "select") {
      setIsPanning(true)
      onClearSelectionsAndCancelConnection()
      return
    }

    // Handle tool-specific actions
    if (selectedTool === "add-chip") {
      onAddChip(worldPos)
    } else if (selectedTool === "add-passive") {
      onAddPassive(worldPos)
    } else if (selectedTool === "add-net-label") {
      onAddNetLabel(worldPos)
    } else if (selectedTool === "add-junction") {
      let closestDistSq = ((CONNECTION_SELECTION_THRESHOLD_PX * 2) / SCALE) ** 2
      let segmentDetails = null
      for (const conn of connections) {
        const drawableWorldPath = generateDrawableOrthogonalPath(conn.path)
        for (let i = 0; i < drawableWorldPath.length - 1; i++) {
          const p1 = drawableWorldPath[i]
          const p2 = drawableWorldPath[i + 1]
          const distToSegSq = distToSegmentSquared(worldPos, p1, p2)
          if (distToSegSq < closestDistSq) {
            closestDistSq = distToSegSq
            segmentDetails = { connId: conn.id, p1, p2 }
          }
        }
      }
      if (segmentDetails) {
        onAddJunctionToSegment(
          worldPos,
          segmentDetails.connId,
          segmentDetails.p1,
          segmentDetails.p2,
        )
      } else {
        onAddJunction(worldPos)
      }
    } else if (selectedTool === "connect" && connectionStart) {
      onAddWaypoint(worldPos)
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    const mousePos = getMousePosition(e, svgRef)
    setCurrentMouseScreenPos(mousePos)

    if (isPanning) {
      const dx = mousePos.x - lastPanPosition.current.x
      const dy = mousePos.y - lastPanPosition.current.y
      setPanOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }))
      lastPanPosition.current = mousePos
      return
    }
    if (draggedBoxId) {
      const box = boxes.find((b) => b.id === draggedBoxId)
      if (!box) return
      const worldPos = screenToWorld(mousePos.x, mousePos.y, currentPanOffset)
      const rawNewX = worldPos.x - dragOffset.current.x
      const rawNewY = worldPos.y - dragOffset.current.y
      let finalX = rawNewX,
        finalY = rawNewY
      if (box.type === "passive") {
        if (box.rotation === 0 || box.rotation === 180) {
          finalX = snapToGrid(rawNewX)
          finalY = snapToHalfGrid(rawNewY)
        } else {
          finalX = snapToHalfGrid(rawNewX)
          finalY = snapToGrid(rawNewY)
        }
      } else if (box.type === "chip" || box.type === "net-label") {
        finalX = snapToGrid(rawNewX)
        finalY = snapToGrid(rawNewY)
      }
      onUpdateBoxPosition(draggedBoxId, finalX, finalY)
      lastPanPosition.current = mousePos
      return
    }
    lastPanPosition.current = mousePos
  }

  const handleMouseUp = () => {
    if (isPanning) setIsPanning(false)
    if (draggedBoxId) setDraggedBoxId(null)
  }

  const drawablePreviewPath = (() => {
    if (
      !connectionStart ||
      !currentConnectionWaypoints ||
      currentConnectionWaypoints.length === 0
    ) {
      return []
    }
    const mouseWorldNow = screenToWorld(
      currentMouseScreenPos.x,
      currentMouseScreenPos.y,
      currentPanOffset,
    )
    const waypointsWithPreviewInWorld = [
      ...currentConnectionWaypoints,
      mouseWorldNow,
    ]
    const screenPathPoints = waypointsWithPreviewInWorld.map((p) =>
      p ? worldToScreen(p.x, p.y, currentPanOffset) : { x: 0, y: 0 },
    )
    return generateDrawableOrthogonalPath(screenPathPoints)
  })()

  return (
    <svg
      ref={svgRef}
      className={`flex-1 bg-gray-100 ${isPanning ? "cursor-grabbing" : selectedTool === "select" ? "cursor-grab" : "cursor-crosshair"}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <defs>
        <pattern
          id="grid"
          width={GRID_SIZE * SCALE}
          height={GRID_SIZE * SCALE}
          patternUnits="userSpaceOnUse"
          x={currentPanOffset.x % (GRID_SIZE * SCALE)}
          y={currentPanOffset.y % (GRID_SIZE * SCALE)}
        >
          <circle cx="0.5" cy="0.5" r="1" fill="#d1d5db" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />

      {connections.map((conn) => {
        const screenPath = conn.path.map((p) =>
          worldToScreen(p.x, p.y, currentPanOffset),
        )
        const drawableScreenPath = generateDrawableOrthogonalPath(screenPath)
        const isSelected = conn.id === selectedConnectionId
        let labelScreenPos = { x: 0, y: 0 }
        if (drawableScreenPath.length >= 1) {
          const firstSegmentStart = drawableScreenPath[0]
          const firstSegmentEnd =
            drawableScreenPath.length > 1
              ? drawableScreenPath[1]
              : drawableScreenPath[0]
          labelScreenPos = {
            x: (firstSegmentStart.x + firstSegmentEnd.x) / 2,
            y: (firstSegmentStart.y + firstSegmentEnd.y) / 2 - 8,
          }
        }
        return (
          <g key={conn.id}>
            <polyline
              points={drawableScreenPath.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke={
                isSelected
                  ? "#ef4444"
                  : editingConnLabelId === conn.id
                    ? "#f97316"
                    : "#3b82f6"
              }
              strokeWidth={isSelected || editingConnLabelId === conn.id ? 3 : 2}
              className="cursor-pointer"
              onDoubleClick={(e) => {
                e.stopPropagation()
                onStartEditingConnLabel(conn.id)
              }}
            />
            {conn.label && editingConnLabelId !== conn.id && (
              <text
                x={labelScreenPos.x}
                y={labelScreenPos.y}
                textAnchor="middle"
                dominantBaseline="auto"
                fontSize="10"
                fill="#059669"
                className="select-none pointer-events-none"
              >
                {conn.label}
              </text>
            )}
            {editingConnLabelId === conn.id && (
              <foreignObject
                x={labelScreenPos.x - 40}
                y={labelScreenPos.y - 10}
                width="80"
                height="22"
              >
                <Input
                  type="text"
                  value={tempConnLabel}
                  onChange={(e) => onTempConnLabelChange(e.target.value)}
                  onBlur={onFinishEditingConnLabel}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onFinishEditingConnLabel()
                    if (e.key === "Escape") onFinishEditingConnLabel()
                  }}
                  className="h-full w-full text-xs text-center p-0.5 bg-white border border-orange-500"
                  autoFocus
                />
              </foreignObject>
            )}
          </g>
        )
      })}

      {drawablePreviewPath.length > 0 && (
        <polyline
          points={drawablePreviewPath.map((p) => `${p.x},${p.y}`).join(" ")}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          strokeDasharray="5,5"
          opacity="0.5"
        />
      )}

      {boxes.map((box) => {
        const visual = getVisualDetails(box)
        const screenVisualPos = worldToScreen(
          visual.x,
          visual.y,
          currentPanOffset,
        )
        const isSelected = box.id === selectedBoxId
        let netLabelTextRenderDetails = {
          textX: 0,
          textY: 0,
          textAnchor: "start" as "start" | "middle" | "end",
          dominantBaseline: "middle" as "middle" | "hanging" | "alphabetic",
        }
        let netLabelFOAttributes = {
          foX: 0,
          foY: 0,
          inputWidth: 60,
          inputHeight: 22,
        }

        if (box.type === "net-label") {
          const pinScreenPos = worldToScreen(box.x, box.y, currentPanOffset)
          const effectiveAnchor = getEffectiveAnchorSide(
            box.anchorSide || "left",
            box.rotation,
          )
          netLabelTextRenderDetails = getNetLabelTextAttributes(
            effectiveAnchor,
            pinScreenPos.x,
            pinScreenPos.y,
          )
          if (editingName === box.id) {
            netLabelFOAttributes = getNetLabelForeignObjectPos(
              effectiveAnchor,
              pinScreenPos.x,
              pinScreenPos.y,
            )
          }
        }

        return (
          <g key={box.id} onMouseDown={(e) => handleBoxMouseDown(e, box.id)}>
            {box.type !== "net-label" && (
              <rect
                x={screenVisualPos.x}
                y={screenVisualPos.y}
                width={visual.width * SCALE}
                height={visual.height * SCALE}
                fill="white"
                stroke={
                  isSelected
                    ? "#3b82f6"
                    : editingName === box.id
                      ? "#f97316"
                      : "#6b7280"
                }
                strokeWidth={isSelected || editingName === box.id ? 2 : 1}
                className="cursor-move"
                transform={`rotate(${box.rotation}, ${worldToScreen(box.x, box.y, currentPanOffset).x}, ${worldToScreen(box.x, box.y, currentPanOffset).y})`}
              />
            )}
            {editingName === box.id ? (
              <foreignObject
                x={
                  box.type === "net-label"
                    ? netLabelFOAttributes.foX
                    : screenVisualPos.x + (visual.width * SCALE) / 2 - 30
                }
                y={
                  box.type === "net-label"
                    ? netLabelFOAttributes.foY
                    : screenVisualPos.y + (visual.height * SCALE) / 2 - 11
                }
                width={
                  box.type === "net-label"
                    ? netLabelFOAttributes.inputWidth
                    : 60
                }
                height={
                  box.type === "net-label"
                    ? netLabelFOAttributes.inputHeight
                    : 22
                }
              >
                <Input
                  type="text"
                  value={tempName}
                  onChange={(e) => onTempNameChange(e.target.value)}
                  onBlur={onFinishEditingBoxName}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onFinishEditingBoxName()
                    if (e.key === "Escape") onFinishEditingBoxName()
                  }}
                  className="h-full w-full text-xs text-center p-0.5 bg-white border border-orange-500"
                  autoFocus
                />
              </foreignObject>
            ) : (
              <text
                x={
                  box.type === "net-label"
                    ? netLabelTextRenderDetails.textX
                    : screenVisualPos.x + (visual.width * SCALE) / 2
                }
                y={
                  box.type === "net-label"
                    ? netLabelTextRenderDetails.textY
                    : screenVisualPos.y + (visual.height * SCALE) / 2
                }
                textAnchor={
                  box.type === "net-label"
                    ? netLabelTextRenderDetails.textAnchor
                    : "middle"
                }
                dominantBaseline={
                  box.type === "net-label"
                    ? netLabelTextRenderDetails.dominantBaseline
                    : "middle"
                }
                fontSize={12}
                fill={
                  box.type === "net-label"
                    ? isSelected
                      ? "#3b82f6"
                      : "#166534"
                    : "#374151"
                }
                className="cursor-text select-none"
                fontWeight={box.type === "net-label" ? "bold" : "normal"}
                onDoubleClick={(e) => {
                  e.stopPropagation()
                  onStartEditingBoxName(box.id)
                }}
              >
                {box.name}
              </text>
            )}
            {box.pins.map((pin) => {
              const pinPos = getEndpointPosition(
                { type: "pin", boxId: box.id, pinId: pin.id },
                boxes,
                junctions,
              )
              if (!pinPos) return null

              // Calculate offset to move pin slightly inside the box
              const insetAmount = 8 // pixels
              let offsetX = 0,
                offsetY = 0

              if (box.type === "chip") {
                // For chips, move pins inward based on their side
                if (pin.side === "left") offsetX = insetAmount
                else if (pin.side === "right") offsetX = -insetAmount
                else if (pin.side === "top") offsetY = insetAmount
                else if (pin.side === "bottom") offsetY = -insetAmount
              }
              // For passives and net-labels, keep pins at their original position

              const pinScreen = worldToScreen(
                pinPos.x,
                pinPos.y,
                currentPanOffset,
              )

              // Apply the inset offset
              const displayPinX = pinScreen.x + offsetX
              const displayPinY = pinScreen.y + offsetY

              const pinFillColor =
                connectionStart?.type === "pin" &&
                connectionStart.pinId === pin.id
                  ? "#3b82f6"
                  : isSelected && box.type === "net-label"
                    ? "#3b82f6"
                    : "#6b7280"

              return (
                <g key={pin.id}>
                  {/* Larger semi-transparent circle for easier clicking */}
                  <circle
                    cx={pinScreen.x}
                    cy={pinScreen.y}
                    r="8"
                    fill={pinFillColor}
                    opacity="0.2"
                    className="cursor-pointer hover:opacity-30"
                    onMouseDown={(e) => handlePinClick(e, box.id, pin.id)}
                  />
                  {/* Visible pin circle - keep at original position */}
                  <circle
                    cx={pinScreen.x}
                    cy={pinScreen.y}
                    r="4"
                    fill={pinFillColor}
                    className="cursor-pointer hover:fill-blue-500 pointer-events-none"
                    onMouseDown={(e) => handlePinClick(e, box.id, pin.id)}
                  />
                  {/* Pin number text - moved inward */}
                  <text
                    x={displayPinX}
                    y={displayPinY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize="8"
                    fill="#9ca3af"
                    className="select-none pointer-events-none"
                  >
                    {(() => {
                      // Calculate CCW pin number starting from top-left
                      if (box.type !== "chip") return pin.index + 1

                      const leftPins = box.pins
                        .filter((p) => p.side === "left")
                        .sort((a, b) => a.index - b.index)
                      const rightPins = box.pins
                        .filter((p) => p.side === "right")
                        .sort((a, b) => b.index - a.index) // bottom to top
                      const topPins = box.pins
                        .filter((p) => p.side === "top")
                        .sort((a, b) => a.index - b.index)
                      const bottomPins = box.pins
                        .filter((p) => p.side === "bottom")
                        .sort((a, b) => b.index - a.index) // right to left

                      let pinNumber = 1

                      // Left side (top to bottom)
                      for (const leftPin of leftPins) {
                        if (leftPin.id === pin.id) return pinNumber
                        pinNumber++
                      }

                      // Bottom side (left to right)
                      for (const bottomPin of bottomPins) {
                        if (bottomPin.id === pin.id) return pinNumber
                        pinNumber++
                      }

                      // Right side (bottom to top)
                      for (const rightPin of rightPins) {
                        if (rightPin.id === pin.id) return pinNumber
                        pinNumber++
                      }

                      // Top side (right to left)
                      for (const topPin of topPins) {
                        if (topPin.id === pin.id) return pinNumber
                        pinNumber++
                      }

                      return pin.index + 1 // fallback
                    })()}
                  </text>
                </g>
              )
            })}
          </g>
        )
      })}

      {junctions.map((junc) => {
        const juncScreen = worldToScreen(junc.x, junc.y, currentPanOffset)
        const isSelected = junc.id === selectedJunctionId
        return (
          <circle
            key={junc.id}
            cx={juncScreen.x}
            cy={juncScreen.y}
            r={JUNCTION_RADIUS_PX}
            fill={
              isSelected
                ? "#ef4444"
                : connectionStart?.type === "junction" &&
                    connectionStart.junctionId === junc.id
                  ? "#3b82f6"
                  : "#16a34a"
            }
            stroke="#065f46"
            strokeWidth="1"
            className="cursor-pointer hover:fill-green-400"
            onMouseDown={(e) => handleJunctionClick(e, junc.id)}
          />
        )
      })}
    </svg>
  )
}
