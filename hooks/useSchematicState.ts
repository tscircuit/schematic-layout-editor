"use client"

import { useState, useCallback, useEffect } from "react"
import { v4 as uuidv4 } from "uuid"
import {
  type Box,
  type Junction,
  type Connection,
  type ConnectionEndpointSource,
  type CircuitLayoutJson,
  type ParsedCircuitLayoutJson,
  type LaidOutBox,
  type LaidOutNetLabel,
  type LaidOutPath,
  type LayoutPointRef,
  type SchematicLayout,
  GRID_SIZE,
  PASSIVE_BODY_WIDTH,
  PASSIVE_PIN_TO_PIN_DIST,
  SINGLE_SIDED_CHIP_WIDTH,
  DOUBLE_SIDED_CHIP_WIDTH,
  NET_LABEL_WIDTH,
  NET_LABEL_HEIGHT,
  type Pin,
} from "@/types/schematic"
import {
  getEndpointPosition,
  getEffectiveAnchorSide,
} from "@/lib/schematic-utils"
import { snapToGrid, snapToHalfGrid } from "@/lib/geometry"

export function useSchematicState() {
  const [boxes, setBoxes] = useState<Box[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const [junctions, setJunctions] = useState<Junction[]>([])

  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null)
  const [selectedConnectionId, setSelectedConnectionId] = useState<
    string | null
  >(null)
  const [selectedJunctionId, setSelectedJunctionId] = useState<string | null>(
    null,
  )

  const [connectionStart, setConnectionStart] =
    useState<ConnectionEndpointSource | null>(null)
  const [currentConnectionWaypoints, setCurrentConnectionWaypoints] = useState<
    { x: number; y: number }[]
  >([])

  const [editingNameBoxId, setEditingNameBoxId] = useState<string | null>(null) // ID of the box whose name is being edited
  const [tempName, setTempName] = useState("") // Value of the name field being edited
  const [editingConnLabelId, setEditingConnLabelId] = useState<string | null>(
    null,
  )
  const [tempConnLabel, setTempConnLabel] = useState("")

  const [chipCounter, setChipCounter] = useState(1)
  const [passiveCounter, setPassiveCounter] = useState(1)
  const [netLabelCounter, setNetLabelCounter] = useState(1)
  const [junctionCounter, setJunctionCounter] = useState(1)

  const [displayedCoords, setDisplayedCoords] = useState<string>("No selection")

  const clearSelections = useCallback(() => {
    setSelectedBoxId(null)
    setSelectedConnectionId(null)
    setSelectedJunctionId(null)
  }, [])

  const startEditingBoxNameHandler = useCallback(
    (boxId: string) => {
      const box = boxes.find((b) => b.id === boxId)
      if (!box) return
      setEditingNameBoxId(boxId)
      setTempName(box.name)
      setSelectedConnectionId(null)
      setSelectedJunctionId(null)
      setSelectedBoxId(boxId) // Keep the box selected while editing its name
    },
    [boxes],
  )

  const addChip = useCallback(
    (worldPos: { x: number; y: number }) => {
      const chipId = `chip-${uuidv4()}`

      const initialPins: Box["pins"] = []
      const defaultPinCount = 2
      for (let i = 0; i < defaultPinCount; i++) {
        initialPins.push({
          id: `pin-${uuidv4()}-L${i}`,
          side: "left",
          index: i,
        })
        initialPins.push({
          id: `pin-${uuidv4()}-R${i}`,
          side: "right",
          index: i,
        })
      }

      const initialWidth = calculateChipWidth(initialPins)
      const initialHeight = calculateChipHeight(initialPins)

      // Calculate top-left position from center, then snap to grid (same as dragging)
      const targetTopLeftX = worldPos.x - initialWidth / 2
      const targetTopLeftY = worldPos.y - initialHeight / 2
      const snappedX = snapToGrid(targetTopLeftX)
      const snappedY = snapToGrid(targetTopLeftY)

      const newBox: Box = {
        id: chipId,
        x: snappedX,
        y: snappedY,
        width: initialWidth,
        height: initialHeight,
        pins: initialPins,
        name: `U${chipCounter}`,
        type: "chip",
        isPassive: false,
        rotation: 0,
      }
      setBoxes((prev) => [...prev, newBox])
      setChipCounter((prev) => prev + 1)
    },
    [chipCounter],
  )

  const addPassive = useCallback(
    (worldPos: { x: number; y: number }) => {
      const centerX = snapToGrid(worldPos.x)
      const centerY = snapToHalfGrid(worldPos.y)
      const newBox: Box = {
        id: `passive-${uuidv4()}`,
        x: centerX,
        y: centerY,
        width: PASSIVE_BODY_WIDTH,
        height: PASSIVE_PIN_TO_PIN_DIST,
        pins: [
          { id: `pin-${uuidv4()}-T0`, side: "top", index: 0 },
          { id: `pin-${uuidv4()}-B0`, side: "bottom", index: 0 },
        ],
        name: `P${passiveCounter}`,
        type: "passive",
        isPassive: true,
        rotation: 0,
      }
      setBoxes((prev) => [...prev, newBox])
      setPassiveCounter((prev) => prev + 1)
    },
    [passiveCounter],
  )

  const addNetLabel = useCallback(
    (worldPos: { x: number; y: number }) => {
      const snappedX = snapToGrid(worldPos.x)
      const snappedY = snapToGrid(worldPos.y)
      const newNetLabel: Box = {
        id: `netlabel-${uuidv4()}`,
        x: snappedX,
        y: snappedY,
        width: NET_LABEL_WIDTH,
        height: NET_LABEL_HEIGHT,
        pins: [{ id: `pin-${uuidv4()}-C0`, side: "center", index: 0 }],
        name: `NET${netLabelCounter}`,
        type: "net-label",
        isPassive: false,
        rotation: 0,
        anchorSide: "left",
      }
      setBoxes((prev) => [...prev, newNetLabel])
      setNetLabelCounter((prev) => prev + 1)
      startEditingBoxNameHandler(newNetLabel.id)
    },
    [netLabelCounter, startEditingBoxNameHandler],
  )

  const addJunctionToSegment = useCallback(
    (
      worldPos: { x: number; y: number },
      connId: string,
      segmentStart: { x: number; y: number },
      segmentEnd: { x: number; y: number },
    ) => {
      const snappedX = snapToGrid(worldPos.x)
      const snappedY = snapToGrid(worldPos.y)
      const newJunction: Junction = {
        id: `junc-${junctionCounter}`,
        x: snappedX,
        y: snappedY,
      }
      setJunctions((prev) => [...prev, newJunction])
      setJunctionCounter((prev) => prev + 1)
      // TODO: Logic to modify the connection `connId`
    },
    [junctionCounter],
  )

  const addJunction = useCallback(
    (worldPos: { x: number; y: number }) => {
      const snappedX = snapToGrid(worldPos.x)
      const snappedY = snapToGrid(worldPos.y)
      const newJunction: Junction = {
        id: `junc-${junctionCounter}`,
        x: snappedX,
        y: snappedY,
      }
      setJunctions((prev) => [...prev, newJunction])
      setJunctionCounter((prev) => prev + 1)
    },
    [junctionCounter],
  )

  const startConnection = useCallback(
    (endpoint: ConnectionEndpointSource) => {
      const pos = getEndpointPosition(endpoint, boxes, junctions)
      if (!pos) return
      setConnectionStart(endpoint)
      setCurrentConnectionWaypoints([pos])
      clearSelections()
    },
    [boxes, junctions, clearSelections],
  )

  const addWaypoint = useCallback(
    (worldPos: { x: number; y: number }) => {
      if (!connectionStart) return
      const snappedWaypointPos = {
        x: snapToGrid(worldPos.x),
        y: snapToGrid(worldPos.y),
      }
      const lastWp =
        currentConnectionWaypoints[currentConnectionWaypoints.length - 1]
      if (
        lastWp &&
        (Math.abs(snappedWaypointPos.x - lastWp.x) >= GRID_SIZE ||
          Math.abs(snappedWaypointPos.y - lastWp.y) >= GRID_SIZE)
      ) {
        setCurrentConnectionWaypoints((prev) => [...prev, snappedWaypointPos])
      }
    },
    [connectionStart, currentConnectionWaypoints],
  )

  const finishConnection = useCallback(
    (endpoint: ConnectionEndpointSource) => {
      if (!connectionStart) return
      const endPos = getEndpointPosition(endpoint, boxes, junctions)
      if (!endPos) return

      if (connectionStart.type === endpoint.type) {
        if (
          connectionStart.type === "pin" &&
          endpoint.type === "pin" &&
          connectionStart.boxId === endpoint.boxId &&
          connectionStart.pinId === endpoint.pinId
        )
          return
        if (
          connectionStart.type === "junction" &&
          endpoint.type === "junction" &&
          connectionStart.junctionId === endpoint.junctionId
        )
          return
      }

      const finalWaypoints = [...currentConnectionWaypoints, endPos]
      const newConnection: Connection = {
        id: `conn-${uuidv4()}`,
        from: connectionStart,
        to: endpoint,
        path: finalWaypoints,
        label: "",
      }
      setConnections((prev) => [...prev, newConnection])
      setConnectionStart(null)
      setCurrentConnectionWaypoints([])
    },
    [connectionStart, currentConnectionWaypoints, boxes, junctions],
  )

  const cancelConnection = useCallback(() => {
    setConnectionStart(null)
    setCurrentConnectionWaypoints([])
  }, [])

  const deleteSelected = useCallback(() => {
    if (selectedBoxId) {
      setConnections((prev) =>
        prev.filter(
          (conn) =>
            !(conn.from.type === "pin" && conn.from.boxId === selectedBoxId) &&
            !(conn.to.type === "pin" && conn.to.boxId === selectedBoxId),
        ),
      )
      setBoxes((prev) => prev.filter((box) => box.id !== selectedBoxId))
      setSelectedBoxId(null)
    } else if (selectedConnectionId) {
      setConnections((prev) =>
        prev.filter((conn) => conn.id !== selectedConnectionId),
      )
      setSelectedConnectionId(null)
    } else if (selectedJunctionId) {
      setConnections((prev) =>
        prev.filter(
          (conn) =>
            !(
              conn.from.type === "junction" &&
              conn.from.junctionId === selectedJunctionId
            ) &&
            !(
              conn.to.type === "junction" &&
              conn.to.junctionId === selectedJunctionId
            ),
        ),
      )
      setJunctions((prev) => prev.filter((j) => j.id !== selectedJunctionId))
      setSelectedJunctionId(null)
    }
  }, [selectedBoxId, selectedConnectionId, selectedJunctionId])

  const rotateSelectedBox = useCallback(() => {
    if (!selectedBoxId) return
    setBoxes((prevBoxes) =>
      prevBoxes.map((box) => {
        if (
          box.id === selectedBoxId &&
          (box.type === "passive" || box.type === "net-label")
        ) {
          let newRotation: 0 | 90 | 180 | 270
          if (box.type === "passive") {
            // For passives, only allow 0 and 90 degree rotations
            newRotation = box.rotation === 0 ? 90 : 0
            let newX = box.x
            let newY = box.y
            const isOldRotationVertical = box.rotation === 0
            const isNewRotationVertical = newRotation === 0
            if (isOldRotationVertical && !isNewRotationVertical) {
              // Going from vertical (0°) to horizontal (90°)
              newX = snapToHalfGrid(box.x)
              newY = snapToGrid(box.y)
            } else if (!isOldRotationVertical && isNewRotationVertical) {
              // Going from horizontal (90°) to vertical (0°)
              newX = snapToGrid(box.x)
              newY = snapToHalfGrid(box.y)
            }
            return { ...box, rotation: newRotation, x: newX, y: newY }
          } else {
            // For net-labels, keep the full rotation cycle
            newRotation = ((box.rotation + 90) % 360) as 0 | 90 | 180 | 270
            return { ...box, rotation: newRotation }
          }
        }
        return box
      }),
    )
  }, [selectedBoxId])

  const addPinToSelectedBox = useCallback(
    (side: "left" | "right") => {
      if (!selectedBoxId) return
      setBoxes((prevBoxes) =>
        prevBoxes.map((box) => {
          if (box.id === selectedBoxId && box.type === "chip") {
            const pinsOnSide = box.pins.filter((p) => p.side === side)
            const newIndex = pinsOnSide.length
            const newPin = {
              id: `pin-${uuidv4()}-${side.charAt(0)}${newIndex}`,
              side,
              index: newIndex,
            }
            const newPins = [...box.pins, newPin]

            const newHeight = calculateChipHeight(newPins)
            const newWidth = calculateChipWidth(newPins)

            return { ...box, pins: newPins, height: newHeight, width: newWidth }
          }
          return box
        }),
      )
    },
    [selectedBoxId],
  )

  const finishEditingBoxNameHandler = useCallback(() => {
    if (editingNameBoxId) {
      setBoxes((prev) =>
        prev.map((b) =>
          b.id === editingNameBoxId ? { ...b, name: tempName || b.name } : b,
        ),
      )
    }
    setEditingNameBoxId(null)
    setTempName("")
  }, [editingNameBoxId, tempName])

  const startEditingConnLabelHandler = useCallback(
    (connId: string) => {
      const conn = connections.find((c) => c.id === connId)
      if (!conn) return
      setEditingConnLabelId(connId)
      setTempConnLabel(conn.label || "")
      setSelectedBoxId(null)
      setSelectedJunctionId(null)
      setSelectedConnectionId(connId)
    },
    [connections],
  )

  const finishEditingConnLabelHandler = useCallback(() => {
    if (editingConnLabelId) {
      setConnections((prev) =>
        prev.map((c) =>
          c.id === editingConnLabelId ? { ...c, label: tempConnLabel } : c,
        ),
      )
    }
    setEditingConnLabelId(null)
    setTempConnLabel("")
  }, [editingConnLabelId, tempConnLabel])

  const updateBoxPosition = useCallback(
    (boxId: string, newX: number, newY: number) => {
      setBoxes((prevBoxes) =>
        prevBoxes.map((b) => {
          if (b.id === boxId) {
            return { ...b, x: newX, y: newY }
          }
          return b
        }),
      )
    },
    [],
  )

  const updatePinMargins = useCallback((boxId: string, updatedPins: Pin[]) => {
    setBoxes((prevBoxes) =>
      prevBoxes.map((box) => {
        if (box.id === boxId && box.type === "chip") {
          const newHeight = calculateChipHeight(updatedPins)
          const newWidth = calculateChipWidth(updatedPins)
          return { ...box, pins: updatedPins, height: newHeight, width: newWidth }
        }
        return box
      }),
    )
  }, [])

  useEffect(() => {
    setConnections((prevConns) =>
      prevConns.map((conn) => {
        const fromPos = getEndpointPosition(conn.from, boxes, junctions)
        const toPos = getEndpointPosition(conn.to, boxes, junctions)
        if (fromPos && toPos) {
          const newPath = [...conn.path]
          if (newPath.length > 0) {
            newPath[0] = fromPos
            if (newPath.length > 1) {
              newPath[newPath.length - 1] = toPos
            } else {
              newPath.push(toPos)
            }
          } else {
            newPath.push(fromPos, toPos)
          }
          return { ...conn, path: newPath }
        }
        return conn
      }),
    )
  }, [boxes, junctions])

  useEffect(() => {
    let coordsText = "No selection"
    if (selectedBoxId) {
      const box = boxes.find((b) => b.id === selectedBoxId)
      if (box) {
        let typeRef = ""
        if (box.type === "passive") typeRef = " (center)"
        else if (box.type === "net-label") typeRef = " (pin)"
        else typeRef = " (top-left)"
        coordsText = `X: ${box.x.toFixed(2)}, Y: ${(-box.y).toFixed(2)}${typeRef}`
      }
    } else if (selectedConnectionId) {
      const conn = connections.find((c) => c.id === selectedConnectionId)
      if (conn) {
        const startPoint = getEndpointPosition(conn.from, boxes, junctions)
        if (startPoint)
          coordsText = `Start: X: ${startPoint.x.toFixed(2)}, Y: ${(-startPoint.y).toFixed(2)}`
        else coordsText = "Connection start invalid"
      } else {
        coordsText = "Connection selected (no path data)"
      }
    } else if (selectedJunctionId) {
      const junc = junctions.find((j) => j.id === selectedJunctionId)
      if (junc) {
        coordsText = `Junction ${junc.id}: X: ${junc.x.toFixed(2)}, Y: ${(-junc.y).toFixed(2)}`
      }
    }
    setDisplayedCoords(coordsText)
  }, [
    selectedBoxId,
    selectedConnectionId,
    selectedJunctionId,
    boxes,
    connections,
    junctions,
  ])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (editingNameBoxId) finishEditingBoxNameHandler()
        if (editingConnLabelId) finishEditingConnLabelHandler()
        if (connectionStart) cancelConnection()
        clearSelections()
      }
      if (
        (e.key === "Delete" || e.key === "Backspace") &&
        (selectedBoxId || selectedConnectionId || selectedJunctionId)
      ) {
        if (document.activeElement?.tagName.toLowerCase() !== "input") {
          deleteSelected()
        }
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [
    selectedBoxId,
    selectedConnectionId,
    selectedJunctionId,
    editingNameBoxId,
    editingConnLabelId,
    connectionStart,
    finishEditingBoxNameHandler,
    finishEditingConnLabelHandler,
    cancelConnection,
    clearSelections,
    deleteSelected,
  ])

  // Helper function to calculate chip height based on pin margins
  const calculateChipHeight = (pins: Pin[]): number => {
    const leftPins = pins
      .filter((p) => p.side === "left")
      .sort((a, b) => a.index - b.index)
    const rightPins = pins
      .filter((p) => p.side === "right")
      .sort((a, b) => a.index - b.index)

    const calculateSideHeight = (sidePins: Pin[]): number => {
      if (sidePins.length === 0) return 0
      let totalHeight = GRID_SIZE // Base margin from top
      for (let i = 1; i < sidePins.length; i++) {
        const pin = sidePins[i]
        const margin = pin.marginFromLastPin ?? GRID_SIZE
        totalHeight += margin
      }
      totalHeight += GRID_SIZE // Base margin to bottom
      return totalHeight
    }

    const leftHeight = calculateSideHeight(leftPins)
    const rightHeight = calculateSideHeight(rightPins)
    const maxHeight = Math.max(leftHeight, rightHeight)

    return Math.max(GRID_SIZE * 2, maxHeight)
  }

  const calculateChipWidth = (pins: Pin[]): number => {
    const hasLeft = pins.some((p) => p.side === "left")
    const hasRight = pins.some((p) => p.side === "right")
    return hasLeft && hasRight
      ? DOUBLE_SIDED_CHIP_WIDTH
      : SINGLE_SIDED_CHIP_WIDTH
  }

  // Helper function to compute pin margins from actual pin positions
  const computePinMarginsFromPositions = (
    pins: Array<{ pinNumber: number; x: number; y: number }>,
    box: LaidOutBox,
  ): Pin[] => {
    const result: Pin[] = []

    // Find unique X positions to determine left/right sides
    const uniqueX = [...new Set(pins.map(p => p.x))].sort((a, b) => a - b)
    const leftX = uniqueX[0]
    const rightX = uniqueX[uniqueX.length - 1]

    // Create pins for left side
    const leftPins = pins
      .filter((p) => Math.abs(p.x - leftX) < 0.001) // Use small tolerance for floating point comparison
      .sort((a, b) => a.y - b.y)
    for (let i = 0; i < leftPins.length; i++) {
      const pin = leftPins[i]
      let marginFromLastPin: number | undefined
      if (i > 0) {
        const prevPin = leftPins[i - 1]
        marginFromLastPin = Math.abs(pin.y - prevPin.y)
      }
      result.push({
        id: `pin-${box.boxId}-L${i}`,
        side: "left",
        index: i,
        marginFromLastPin,
      })
    }

    // Create pins for right side (only if there are multiple X positions)
    if (uniqueX.length > 1) {
      const rightPins = pins
        .filter((p) => Math.abs(p.x - rightX) < 0.001) // Use small tolerance for floating point comparison
        .sort((a, b) => a.y - b.y)
      for (let i = 0; i < rightPins.length; i++) {
        const pin = rightPins[i]
        let marginFromLastPin: number | undefined
        if (i > 0) {
          const prevPin = rightPins[i - 1]
          marginFromLastPin = Math.abs(pin.y - prevPin.y)
        }
        result.push({
          id: `pin-${box.boxId}-R${i}`,
          side: "right",
          index: i,
          marginFromLastPin,
        })
      }
    }

    return result
  }

  // Helper function to get pin number from pin ID and side
  const getPinNumber = (pin: Pin, box: Box): number => {
    if (box.type === "passive") {
      // For passives, pin1 is bottom/left, pin2 is top/right
      return pin.side === "bottom" || pin.side === "left" ? 1 : 2
    } else if (box.type === "chip") {
      // For chips, number pins sequentially by side
      const pinsOnSameSide = box.pins
        .filter((p) => p.side === pin.side)
        .sort((a, b) => a.index - b.index)
      const indexInSide = pinsOnSameSide.findIndex((p) => p.id === pin.id)

      // Calculate base offset for each side
      let baseOffset = 0
      if (pin.side === "right") {
        baseOffset = box.pins.filter((p) => p.side === "left").length
      } else if (pin.side === "top") {
        baseOffset =
          box.pins.filter((p) => p.side === "left").length +
          box.pins.filter((p) => p.side === "right").length
      } else if (pin.side === "bottom") {
        baseOffset =
          box.pins.filter((p) => p.side === "left").length +
          box.pins.filter((p) => p.side === "right").length +
          box.pins.filter((p) => p.side === "top").length
      }

      return baseOffset + indexInSide + 1 // 1-indexed
    }
    return 1 // Default for net-labels
  }

  const handleDownload = useCallback(() => {
    // Create boxes with explicit pin coordinates
    const laidOutBoxes: LaidOutBox[] = boxes
      .filter((box) => box.type !== "net-label")
      .map((box) => {
        let leftPinCount = 0,
          topPinCount = 0,
          bottomPinCount = 0,
          rightPinCount = 0
        let centerX = box.x,
          centerY = -box.y

        if (box.type === "chip") {
          box.pins.forEach((pin) => {
            if (pin.side === "left") leftPinCount++
            else if (pin.side === "right") rightPinCount++
            else if (pin.side === "top") topPinCount++
            else if (pin.side === "bottom") bottomPinCount++
          })
          centerX = box.x + box.width / 2
          centerY = -(box.y + box.height / 2)
        } else if (box.type === "passive") {
          if (box.rotation === 0 || box.rotation === 180) {
            topPinCount = 1
            bottomPinCount = 1
          } else {
            leftPinCount = 1
            rightPinCount = 1
          }
        }

        // Generate pin coordinates
        const pins = box.pins.map((pin) => {
          const pinPos = getEndpointPosition(
            { type: "pin", boxId: box.id, pinId: pin.id },
            boxes,
            junctions,
          )
          return {
            pinNumber: getPinNumber(pin, box),
            x: pinPos?.x || 0,
            y: pinPos ? -pinPos.y : 0, // Convert to standard Y+ up coordinate system
          }
        })

        return {
          boxId: box.name, // Use box name as boxId
          leftPinCount,
          rightPinCount,
          topPinCount,
          bottomPinCount,
          centerX,
          centerY,
          pins,
        }
      })

    // Create net labels
    const laidOutNetLabels: LaidOutNetLabel[] = boxes
      .filter((box) => box.type === "net-label")
      .map((box) => ({
        netId: box.name, // Use box name as netId (displayed label)
        netLabelId: box.id, // Use box id as netLabelId (unique identifier)
        anchorPosition: getEffectiveAnchorSide(
          box.anchorSide || "left",
          box.rotation,
        ),
        x: box.x,
        y: -box.y, // Convert to standard Y+ up coordinate system
      }))

    // Create paths with proper point references
    const laidOutPaths: LaidOutPath[] = connections.map((conn) => {
      const fromRef: LayoutPointRef = (() => {
        if (conn.from.type === "pin") {
          const fromBox = boxes.find((b) => b.id === conn.from.boxId)
          const fromPin = fromBox?.pins.find((p) => p.id === conn.from.pinId)
          if (fromBox && fromPin) {
            if (fromBox.type === "net-label") {
              return { netLabelId: fromBox.id }
            } else {
              return {
                boxId: fromBox.name, // Use box name as boxId
                pinNumber: getPinNumber(fromPin, fromBox),
              }
            }
          }
        } else if (conn.from.type === "junction") {
          return { junctionId: conn.from.junctionId }
        }
        // Fallback
        return { junctionId: "unknown" }
      })()

      const toRef: LayoutPointRef = (() => {
        if (conn.to.type === "pin") {
          const toBox = boxes.find((b) => b.id === conn.to.boxId)
          const toPin = toBox?.pins.find((p) => p.id === conn.to.pinId)
          if (toBox && toPin) {
            if (toBox.type === "net-label") {
              return { netLabelId: toBox.id }
            } else {
              return {
                boxId: toBox.name, // Use box name as boxId
                pinNumber: getPinNumber(toPin, toBox),
              }
            }
          }
        } else if (conn.to.type === "junction") {
          return { junctionId: conn.to.junctionId }
        }
        // Fallback
        return { junctionId: "unknown" }
      })()

      return {
        points: conn.path.map((p) => ({ x: p.x, y: -p.y })), // Convert to standard Y+ up coordinate system
        from: fromRef,
        to: toRef,
      }
    })

    // Create junctions
    const laidOutJunctions = junctions.map((j) => ({
      junctionId: j.id,
      x: j.x,
      y: -j.y, // Convert to standard Y+ up coordinate system
    }))

    const layout: CircuitLayoutJson = {
      boxes: laidOutBoxes,
      netLabels: laidOutNetLabels,
      paths: laidOutPaths,
      junctions: laidOutJunctions,
    }

    const jsonString = JSON.stringify(layout, null, 2)
    const simpleHash = (str: string): string => {
      let hash = 0
      for (let i = 0; i < str.length; i++) {
        hash = (hash * 31 + str.charCodeAt(i)) >>> 0
      }
      return hash.toString(16).padStart(8, "0").slice(0, 8)
    }
    const hashHex = simpleHash(jsonString)
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const day = String(now.getDate()).padStart(2, "0")
    const fileName = `corpus${year}-${month}-${day}-${hashHex}.json`
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [boxes, connections, junctions])

  const handleLoadData = useCallback((jsonData: string) => {
    try {
      // Try to parse as new format first
      let loadedData: ParsedCircuitLayoutJson | SchematicLayout
      try {
        loadedData = JSON.parse(jsonData) as ParsedCircuitLayoutJson
        // Check if it's the new format by looking for the structure
        if (
          loadedData &&
          "boxes" in loadedData &&
          Array.isArray(loadedData.boxes) &&
          loadedData.boxes.length > 0 &&
          "pins" in loadedData.boxes[0]
        ) {
          // New format detected
          handleLoadNewFormat(loadedData as ParsedCircuitLayoutJson)
          return
        }
      } catch (e) {
        // Fall through to legacy format
      }

      // Try legacy format
      loadedData = JSON.parse(jsonData) as SchematicLayout
      if (
        !loadedData ||
        !Array.isArray(loadedData.boxes) ||
        !Array.isArray(loadedData.paths) ||
        !Array.isArray(loadedData.junctions) ||
        !Array.isArray(loadedData.netLabels)
      ) {
        alert("Invalid data structure.")
        return
      }

      handleLoadLegacyFormat(loadedData)
    } catch (error) {
      console.error("Failed to load circuit data:", error)
      alert("Failed to parse circuit data. Please ensure it's valid JSON.")
    }
  }, [])

  const handleLoadNewFormat = useCallback(
    (loadedData: ParsedCircuitLayoutJson) => {
      const loadedBoxesState: Box[] = []
      let maxChipNum = 0,
        maxPassiveNum = 0

      // Load boxes
      loadedData.boxes.forEach((b, index) => {
        const newId = `loaded-box-${uuidv4()}-${index}`
        let type: "chip" | "passive" = "chip"
        let isPassiveFromFile = false
        let width = SINGLE_SIDED_CHIP_WIDTH
        let height = GRID_SIZE * 2
        let rotation: 0 | 90 | 180 | 270 = 0

        // Determine if it's a passive component
        if (
          b.topPinCount === 1 &&
          b.bottomPinCount === 1 &&
          b.leftPinCount === 0 &&
          b.rightPinCount === 0
        ) {
          type = "passive"
          isPassiveFromFile = true
          width = PASSIVE_BODY_WIDTH
          height = PASSIVE_PIN_TO_PIN_DIST
          rotation = 0
        } else if (
          b.leftPinCount === 1 &&
          b.rightPinCount === 1 &&
          b.topPinCount === 0 &&
          b.bottomPinCount === 0
        ) {
          type = "passive"
          isPassiveFromFile = true
          width = PASSIVE_BODY_WIDTH
          height = PASSIVE_PIN_TO_PIN_DIST
          rotation = 90
        } else {
          type = "chip"
          isPassiveFromFile = false
          // Height will be calculated after pins are computed
        }

        // Create pins based on pin counts and positions
        const pins: Box["pins"] = []
        if (type === "passive") {
          pins.push({ id: `pin-${newId}-T0`, side: "top", index: 0 })
          pins.push({ id: `pin-${newId}-B0`, side: "bottom", index: 0 })
        } else if (type === "chip") {
          // Use the helper function to compute margins from actual pin positions
          const computedPins = computePinMarginsFromPositions(b.pins, b)
          pins.push(...computedPins)
          // Calculate size based on computed pins
          height = calculateChipHeight(computedPins)
          width = calculateChipWidth(computedPins)
        }

        // Calculate position after height is finalized
        let appX = b.centerX
        let appY = -b.centerY
        if (type === "chip") {
          appX = b.centerX - width / 2
          appY = -b.centerY - height / 2
        }

        // Extract number from boxId for counter tracking
        const nameFromFile = b.boxId
        if (type === "chip" && nameFromFile.startsWith("U")) {
          const num = Number.parseInt(nameFromFile.substring(1))
          if (!isNaN(num)) maxChipNum = Math.max(maxChipNum, num)
        } else if (type === "passive" && nameFromFile.startsWith("P")) {
          const num = Number.parseInt(nameFromFile.substring(1))
          if (!isNaN(num)) maxPassiveNum = Math.max(maxPassiveNum, num)
        }

        loadedBoxesState.push({
          id: newId,
          x:
            type === "passive" && rotation === 90
              ? snapToHalfGrid(appX)
              : snapToGrid(appX),
          y:
            type === "passive" && rotation === 0
              ? snapToHalfGrid(appY)
              : snapToGrid(appY),
          width,
          height,
          pins,
          name: nameFromFile,
          type,
          isPassive: isPassiveFromFile,
          rotation,
        })
      })

      // Load net labels and create mapping for netLabelId to actual box ID
      let maxNetLabelNum = 0
      const netLabelIdMapping = new Map<string, string>()
      loadedData.netLabels.forEach((nl, index) => {
        const newId = `loaded-nl-${uuidv4()}-${index}`

        // Map the original netLabelId to our new box ID
        // For backward compatibility, use a fallback if netLabelId is missing
        const netLabelId = nl.netLabelId || `fallback-netlabel-${index}`
        netLabelIdMapping.set(netLabelId, newId)

        // Extract number from netId for counter tracking
        if (nl.netId.startsWith("NET")) {
          const num = Number.parseInt(nl.netId.substring(3))
          if (!isNaN(num)) maxNetLabelNum = Math.max(maxNetLabelNum, num)
        }

        loadedBoxesState.push({
          id: newId,
          x: snapToGrid(nl.x),
          y: snapToGrid(-nl.y),
          width: NET_LABEL_WIDTH,
          height: NET_LABEL_HEIGHT,
          pins: [{ id: `pin-${newId}-C0`, side: "center", index: 0 }],
          name: nl.netId,
          type: "net-label",
          isPassive: false,
          rotation: 0,
          anchorSide: nl.anchorPosition,
        })
      })

      setBoxes(loadedBoxesState)
      setChipCounter(maxChipNum + 1)
      setPassiveCounter(maxPassiveNum + 1)
      setNetLabelCounter(maxNetLabelNum + 1)

      // Load junctions
      let maxJunctionNum = 0
      const loadedJunctionsState: Junction[] = loadedData.junctions.map(
        (j, index) => {
          maxJunctionNum++
          return {
            id: j.junctionId,
            x: j.x,
            y: -j.y,
          }
        },
      )
      setJunctions(loadedJunctionsState)
      setJunctionCounter(maxJunctionNum + 1)

      // Load connections
      const loadedConnectionsState: Connection[] = loadedData.paths.map(
        (p, index) => {
          const newId = `loaded-conn-${uuidv4()}-${index}`
          const appPath = p.points.map((pt) => ({ x: pt.x, y: -pt.y }))
          

          // Convert from LayoutPointRef to ConnectionEndpointSource
          let fromTarget: ConnectionEndpointSource
          if ("junctionId" in p.from) {
            fromTarget = { type: "junction", junctionId: p.from.junctionId }
          } else if ("netLabelId" in p.from || "netId" in p.from) {
            // Handle net label connections (both new format with netLabelId and old format with netId)
            let netLabelBox: Box | undefined
            
            // First try netLabelId mapping if it exists
            if ("netLabelId" in p.from) {
              const actualBoxId = netLabelIdMapping.get(p.from.netLabelId)
              netLabelBox = loadedBoxesState.find(
                (b) => b.type === "net-label" && b.id === actualBoxId,
              )
            }
            
            // If netLabelId mapping failed or doesn't exist, try finding by netId/name
            if (!netLabelBox && "netId" in p.from) {
              netLabelBox = loadedBoxesState.find(
                (b) => b.type === "net-label" && b.name === (p.from as any).netId,
              )
            }
            
            if (netLabelBox) {
              fromTarget = {
                type: "pin",
                boxId: netLabelBox.id,
                pinId: netLabelBox.pins[0].id,
              }
            } else {
              fromTarget = {
                type: "pin",
                boxId: "unknown-netlabel",
                pinId: "unknown-pin",
              }
            }
          } else if ("boxId" in p.from) {
            const fromBox = loadedBoxesState.find(
              (b) => b.name === p.from.boxId,
            )
            if (fromBox && fromBox.pins.length > 0) {
              // Find pin by pin number
              const targetPinNumber = p.from.pinNumber
              let targetPin = fromBox.pins[0] // Default fallback

              if (fromBox.type === "passive") {
                // For passives: pin1 = bottom/left, pin2 = top/right
                if (targetPinNumber === 1) {
                  targetPin =
                    fromBox.pins.find(
                      (pin) => pin.side === "bottom" || pin.side === "left",
                    ) || fromBox.pins[0]
                } else {
                  targetPin =
                    fromBox.pins.find(
                      (pin) => pin.side === "top" || pin.side === "right",
                    ) || fromBox.pins[0]
                }
              } else {
                // For chips: find by matching against original pin positions
                const originalBox = loadedData.boxes.find(box => box.boxId === fromBox.name)
                const originalPin = originalBox?.pins.find(op => op.pinNumber === targetPinNumber)
                if (originalPin) {
                  // Find the corresponding pin in the loaded box by position
                  const tolerance = 0.001
                  targetPin = fromBox.pins.find(pin => {
                    const pinPos = getEndpointPosition(
                      { type: "pin", boxId: fromBox.id, pinId: pin.id },
                      loadedBoxesState,
                      []
                    )
                    return pinPos && 
                           Math.abs(pinPos.x - originalPin.x) < tolerance && 
                           Math.abs(pinPos.y - (-originalPin.y)) < tolerance // Convert Y coordinate
                  }) || fromBox.pins[0]
                } else {
                  // Fallback to sequential numbering
                  const sortedPins = [...fromBox.pins].sort((a, b) => {
                    const sideOrder = { left: 0, right: 1, top: 2, bottom: 3 }
                    if (a.side !== b.side)
                      return sideOrder[a.side] - sideOrder[b.side]
                    return a.index - b.index
                  })
                  targetPin = sortedPins[targetPinNumber - 1] || fromBox.pins[0]
                }
              }

              fromTarget = {
                type: "pin",
                boxId: fromBox.id,
                pinId: targetPin.id,
              }
            } else {
              fromTarget = {
                type: "pin",
                boxId: "unknown-box-from",
                pinId: "unknown-pin",
              }
            }
          } else {
            fromTarget = {
              type: "pin",
              boxId: "unknown-box-from",
              pinId: "unknown-pin",
            }
          }

          // Similar logic for 'to' endpoint
          let toTarget: ConnectionEndpointSource
          if ("junctionId" in p.to) {
            toTarget = { type: "junction", junctionId: p.to.junctionId }
          } else if ("netLabelId" in p.to || "netId" in p.to) {
            // Handle net label connections (both new format with netLabelId and old format with netId)
            let netLabelBox: Box | undefined
            
            // First try netLabelId mapping if it exists
            if ("netLabelId" in p.to) {
              const actualBoxId = netLabelIdMapping.get(p.to.netLabelId)
              netLabelBox = loadedBoxesState.find(
                (b) => b.type === "net-label" && b.id === actualBoxId,
              )
            }
            
            // If netLabelId mapping failed or doesn't exist, try finding by netId/name
            if (!netLabelBox && "netId" in p.to) {
              netLabelBox = loadedBoxesState.find(
                (b) => b.type === "net-label" && b.name === (p.to as any).netId,
              )
            }
            
            if (netLabelBox) {
              toTarget = {
                type: "pin",
                boxId: netLabelBox.id,
                pinId: netLabelBox.pins[0].id,
              }
            } else {
              toTarget = {
                type: "pin",
                boxId: "unknown-netlabel",
                pinId: "unknown-pin",
              }
            }
          } else if ("boxId" in p.to) {
            const toBox = loadedBoxesState.find((b) => b.name === p.to.boxId)
            if (toBox && toBox.pins.length > 0) {
              const targetPinNumber = p.to.pinNumber
              let targetPin = toBox.pins[0]

              if (toBox.type === "passive") {
                if (targetPinNumber === 1) {
                  targetPin =
                    toBox.pins.find(
                      (pin) => pin.side === "bottom" || pin.side === "left",
                    ) || toBox.pins[0]
                } else {
                  targetPin =
                    toBox.pins.find(
                      (pin) => pin.side === "top" || pin.side === "right",
                    ) || toBox.pins[0]
                }
              } else {
                // For chips: find by matching against original pin positions
                const originalBox = loadedData.boxes.find(box => box.boxId === toBox.name)
                const originalPin = originalBox?.pins.find(op => op.pinNumber === targetPinNumber)
                if (originalPin) {
                  // Find the corresponding pin in the loaded box by position
                  const tolerance = 0.001
                  targetPin = toBox.pins.find(pin => {
                    const pinPos = getEndpointPosition(
                      { type: "pin", boxId: toBox.id, pinId: pin.id },
                      loadedBoxesState,
                      []
                    )
                    return pinPos && 
                           Math.abs(pinPos.x - originalPin.x) < tolerance && 
                           Math.abs(pinPos.y - (-originalPin.y)) < tolerance // Convert Y coordinate
                  }) || toBox.pins[0]
                } else {
                  // Fallback to sequential numbering
                  const sortedPins = [...toBox.pins].sort((a, b) => {
                    const sideOrder = { left: 0, right: 1, top: 2, bottom: 3 }
                    if (a.side !== b.side)
                      return sideOrder[a.side] - sideOrder[b.side]
                    return a.index - b.index
                  })
                  targetPin = sortedPins[targetPinNumber - 1] || toBox.pins[0]
                }
              }

              toTarget = { type: "pin", boxId: toBox.id, pinId: targetPin.id }
            } else {
              toTarget = {
                type: "pin",
                boxId: "unknown-box-to",
                pinId: "unknown-pin",
              }
            }
          } else {
            toTarget = {
              type: "pin",
              boxId: "unknown-box-to",
              pinId: "unknown-pin",
            }
          }

          return {
            id: newId,
            from: fromTarget,
            to: toTarget,
            path: appPath,
            label: "",
          }
        },
      )
      setConnections(loadedConnectionsState)
    },
    [],
  )

  const handleLoadLegacyFormat = useCallback((loadedData: SchematicLayout) => {
    const loadedBoxesState: Box[] = []
    let maxChipNum = 0,
      maxPassiveNum = 0

    loadedData.boxes.forEach((b, index) => {
      const newId = b.boxId || `loaded-box-${uuidv4()}-${index}`
      let type: "chip" | "passive" = "chip"
      let isPassiveFromFile = false
      let width = SINGLE_SIDED_CHIP_WIDTH
      let height = GRID_SIZE * 2
      let rotation: 0 | 90 | 180 | 270 = 0

      if (
        b.topPinCount === 1 &&
        b.bottomPinCount === 1 &&
        b.leftPinCount === 0 &&
        b.rightPinCount === 0
      ) {
        type = "passive"
        isPassiveFromFile = true
        width = PASSIVE_BODY_WIDTH
        height = PASSIVE_PIN_TO_PIN_DIST
        rotation = 0
      } else if (
        b.leftPinCount === 1 &&
        b.rightPinCount === 1 &&
        b.topPinCount === 0 &&
        b.bottomPinCount === 0
      ) {
        type = "passive"
        isPassiveFromFile = true
        width = PASSIVE_BODY_WIDTH
        height = PASSIVE_PIN_TO_PIN_DIST
        rotation = 90
      } else {
        type = "chip"
        isPassiveFromFile = false
        const maxPinsHorizontal = Math.max(b.leftPinCount, b.rightPinCount)
        const calculatedChipHeight = maxPinsHorizontal * GRID_SIZE + GRID_SIZE
        height = Math.max(GRID_SIZE * 2, calculatedChipHeight)
        width =
          b.leftPinCount > 0 && b.rightPinCount > 0
            ? DOUBLE_SIDED_CHIP_WIDTH
            : SINGLE_SIDED_CHIP_WIDTH
      }

      let appX = b.centerX
      let appY = -b.centerY
      if (type === "chip") {
        appX = b.centerX - width / 2
        appY = -b.centerY - height / 2
      }

      const pins: Box["pins"] = []
      if (type === "passive") {
        pins.push({ id: `pin-${newId}-T0`, side: "top", index: 0 })
        pins.push({ id: `pin-${newId}-B0`, side: "bottom", index: 0 })
      } else if (type === "chip") {
        for (let i = 0; i < b.leftPinCount; i++)
          pins.push({ id: `pin-${newId}-L${i}`, side: "left", index: i })
        for (let i = 0; i < b.rightPinCount; i++)
          pins.push({ id: `pin-${newId}-R${i}`, side: "right", index: i })
      }

      const nameFromFile =
        b.name || (type === "chip" ? `U${++maxChipNum}` : `P${++maxPassiveNum}`)
      if (type === "chip" && !b.name) maxChipNum--
      else if (type === "passive" && !b.name) maxPassiveNum--

      loadedBoxesState.push({
        id: newId,
        x:
          type === "passive" && rotation === 90
            ? snapToHalfGrid(appX)
            : snapToGrid(appX),
        y:
          type === "passive" && rotation === 0
            ? snapToHalfGrid(appY)
            : snapToGrid(appY),
        width,
        height,
        pins,
        name: nameFromFile,
        type,
        isPassive: isPassiveFromFile,
        rotation,
      })
    })

    let maxNetLabelNum = 0
    loadedData.netLabels.forEach((nl, index) => {
      const newId = nl.netLabelId || `loaded-nl-${uuidv4()}-${index}`
      maxNetLabelNum++
      loadedBoxesState.push({
        id: newId,
        x: snapToGrid(nl.x),
        y: snapToGrid(-nl.y),
        width: NET_LABEL_WIDTH,
        height: NET_LABEL_HEIGHT,
        pins: [{ id: `pin-${newId}-C0`, side: "center", index: 0 }],
        name: nl.netName || `NET${maxNetLabelNum}`,
        type: "net-label",
        isPassive: false,
        rotation: (nl.rotation as 0 | 90 | 180 | 270) || 0,
        anchorSide: nl.anchorPosition,
      })
    })
    setBoxes(loadedBoxesState)
    const uNames = loadedBoxesState
      .filter((b) => b.type === "chip" && b.name.startsWith("U"))
      .map((b) => Number.parseInt(b.name.substring(1)))
      .filter((n) => !isNaN(n))
    const pNames = loadedBoxesState
      .filter((b) => b.type === "passive" && b.name.startsWith("P"))
      .map((b) => Number.parseInt(b.name.substring(1)))
      .filter((n) => !isNaN(n))
    const netNames = loadedBoxesState
      .filter((b) => b.type === "net-label" && b.name.startsWith("NET"))
      .map((b) => Number.parseInt(b.name.substring(3)))
      .filter((n) => !isNaN(n))

    setChipCounter(uNames.length > 0 ? Math.max(...uNames) + 1 : 1)
    setPassiveCounter(pNames.length > 0 ? Math.max(...pNames) + 1 : 1)
    setNetLabelCounter(netNames.length > 0 ? Math.max(...netNames) + 1 : 1)

    let maxJunctionNum = 0
    const loadedJunctionsState: Junction[] = loadedData.junctions.map(
      (j, index) => {
        maxJunctionNum++
        return {
          id: j.junctionId || `loaded-junc-${uuidv4()}-${index}`,
          x: j.x,
          y: -j.y,
        }
      },
    )
    setJunctions(loadedJunctionsState)
    setJunctionCounter(maxJunctionNum + 1)

    const loadedConnectionsState: Connection[] = loadedData.paths.map(
      (p, index) => {
        const newId = p.pathId || `loaded-conn-${uuidv4()}-${index}`
        const appPath = p.points.map((pt) => ({ x: pt.x, y: -pt.y }))

        let fromTarget: ConnectionEndpointSource
        if (p.from.junctionId) {
          fromTarget = { type: "junction", junctionId: p.from.junctionId }
        } else if (p.from.boxId) {
          const fromBox = loadedBoxesState.find((b) => b.id === p.from.boxId)
          const fromPos = appPath[0]
          let bestPinId =
            fromBox?.pins[0]?.id ||
            `placeholder-pin-from-${p.from.boxId}-${index}`
          if (fromBox && fromPos && fromBox.pins.length > 0) {
            let minDistSq = Number.POSITIVE_INFINITY
            fromBox.pins.forEach((pin) => {
              const pinActualPos = getEndpointPosition(
                { type: "pin", boxId: fromBox.id, pinId: pin.id },
                loadedBoxesState,
                [],
              )
              if (pinActualPos) {
                const dSq =
                  (pinActualPos.x - fromPos.x) ** 2 +
                  (pinActualPos.y - fromPos.y) ** 2
                if (dSq < minDistSq) {
                  minDistSq = dSq
                  bestPinId = pin.id
                }
              }
            })
          }
          fromTarget = { type: "pin", boxId: p.from.boxId, pinId: bestPinId }
        } else {
          fromTarget = {
            type: "pin",
            boxId: "unknown-box-from",
            pinId: "unknown-pin",
          }
        }

        let toTarget: ConnectionEndpointSource
        if (p.to.junctionId) {
          toTarget = { type: "junction", junctionId: p.to.junctionId }
        } else if (p.to.boxId) {
          const toBox = loadedBoxesState.find((b) => b.id === p.to.boxId)
          const toPos = appPath[appPath.length - 1]
          let bestPinId =
            toBox?.pins[0]?.id || `placeholder-pin-to-${p.to.boxId}-${index}`
          if (toBox && toPos && toBox.pins.length > 0) {
            let minDistSq = Number.POSITIVE_INFINITY
            toBox.pins.forEach((pin) => {
              const pinActualPos = getEndpointPosition(
                { type: "pin", boxId: toBox.id, pinId: pin.id },
                loadedBoxesState,
                [],
              )
              if (pinActualPos) {
                const dSq =
                  (pinActualPos.x - toPos.x) ** 2 +
                  (pinActualPos.y - toPos.y) ** 2
                if (dSq < minDistSq) {
                  minDistSq = dSq
                  bestPinId = pin.id
                }
              }
            })
          }
          toTarget = { type: "pin", boxId: p.to.boxId, pinId: bestPinId }
        } else {
          toTarget = {
            type: "pin",
            boxId: "unknown-box-to",
            pinId: "unknown-pin",
          }
        }
        return {
          id: newId,
          from: fromTarget,
          to: toTarget,
          path: appPath,
          label: "",
        }
      },
    )
    setConnections(loadedConnectionsState)
    alert("Schematic data loaded. Pin reconstruction is approximate.")
  }, [])

  return {
    boxes,
    junctions,
    connections,
    selectedBoxId,
    setSelectedBoxId,
    selectedConnectionId,
    setSelectedConnectionId,
    selectedJunctionId,
    setSelectedJunctionId,
    connectionStart,
    currentConnectionWaypoints,
    editingNameBoxId,
    tempName,
    setTempName,
    editingConnLabelId,
    tempConnLabel,
    setTempConnLabel,
    displayedCoords,
    addChip,
    addPassive,
    addNetLabel,
    addJunction,
    addJunctionToSegment,
    startConnection,
    addWaypoint,
    finishConnection,
    cancelConnection,
    deleteSelected,
    rotateSelectedBox,
    addPinToSelectedBox,
    startEditingBoxNameHandler,
    finishEditingBoxNameHandler,
    startEditingConnLabelHandler,
    finishEditingConnLabelHandler,
    updateBoxPosition,
    clearSelections,
    handleDownload,
    handleLoadData,
    updatePinMargins,
  }
}
