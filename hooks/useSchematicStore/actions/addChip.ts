import { v4 as uuidv4 } from "uuid"
import type { StoreSet, StoreGet } from "../types"
import type { Box } from "@/types/schematic"
import { GRID_SIZE } from "@/types/schematic"
import { snapToGrid } from "@/lib/geometry"

export const createAddChip =
  (
    set: StoreSet,
    get: StoreGet,
    _updateConnectionPaths: () => void, // If adding a box could affect connections (e.g. if it replaced something)
    _updateDisplayedCoords: () => void,
  ) =>
  (worldPos: { x: number; y: number }) => {
    const targetCenterX = snapToGrid(worldPos.x)
    const targetCenterY = snapToGrid(worldPos.y)
    const chipId = `chip-${uuidv4()}`

    const initialPins: Box["pins"] = []
    const defaultPinCount = 2 // Default pins per side for a new chip
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

    const initialWidth = GRID_SIZE * 4
    // Calculate height based on pins: (number of pins on one side * grid size for spacing) + grid size for top/bottom margin
    const calculatedHeight = defaultPinCount * GRID_SIZE + GRID_SIZE
    const initialHeight = Math.max(GRID_SIZE * 2, calculatedHeight) // Ensure minimum height

    const newBox: Box = {
      id: chipId,
      x: targetCenterX - initialWidth / 2, // Position by top-left
      y: targetCenterY - initialHeight / 2, // Position by top-left
      width: initialWidth,
      height: initialHeight,
      pins: initialPins,
      name: `U${get().chipCounter}`,
      type: "chip",
      isPassive: false, // Chips are not passive
      rotation: 0, // Default rotation
    }

    set((state) => ({
      boxes: [...state.boxes, newBox],
      chipCounter: state.chipCounter + 1,
    }))

    // _updateConnectionPaths() // Call if adding a box could affect existing connection paths
    // _updateDisplayedCoords() // Call if selection or coords change
  }
