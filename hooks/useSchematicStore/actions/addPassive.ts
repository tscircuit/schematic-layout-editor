import type { StateCreator } from "zustand"
import { v4 as uuidv4 } from "uuid"
import { snapToGrid, snapToHalfGrid } from "@/lib/geometry"
import { PASSIVE_BODY_WIDTH, PASSIVE_PIN_TO_PIN_DIST } from "@/types/schematic"
import type { SchematicStore } from "../types"

export const createAddPassive =
  (
    set: StateCreator<SchematicStore, [], [], SchematicStore>["1"],
    get: () => SchematicStore,
    _updateConnectionPaths: () => void,
    _updateDisplayedCoords: () => void,
  ) =>
  (worldPos: { x: number; y: number }) => {
    const { passiveCounter } = get()

    const centerX = snapToGrid(worldPos.x)
    const centerY = snapToHalfGrid(worldPos.y)
    const newBox = {
      id: `passive-${uuidv4()}`,
      x: centerX,
      y: centerY,
      width: PASSIVE_BODY_WIDTH,
      height: PASSIVE_PIN_TO_PIN_DIST,
      pins: [
        { id: `pin-${uuidv4()}-T0`, side: "top" as const, index: 0 },
        { id: `pin-${uuidv4()}-B0`, side: "bottom" as const, index: 0 },
      ],
      name: `P${passiveCounter}`,
      type: "passive" as const,
      isPassive: true,
      rotation: 0 as const,
    }

    set((state) => ({
      boxes: [...state.boxes, newBox],
      passiveCounter: state.passiveCounter + 1,
    }))

    _updateConnectionPaths()
    _updateDisplayedCoords()
  }
