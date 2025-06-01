import type { StateCreator } from "zustand"
import { v4 as uuidv4 } from "uuid"
import { snapToGrid } from "@/lib/geometry"
import { NET_LABEL_WIDTH, NET_LABEL_HEIGHT } from "@/types/schematic"
import type { SchematicStore } from "../types"

export const createAddNetLabel =
  (
    set: StateCreator<SchematicStore, [], [], SchematicStore>["1"],
    get: () => SchematicStore,
    _updateConnectionPaths: () => void,
    _updateDisplayedCoords: () => void,
  ) =>
  (worldPos: { x: number; y: number }) => {
    const { netLabelCounter } = get()

    const snappedX = snapToGrid(worldPos.x)
    const snappedY = snapToGrid(worldPos.y)
    const newNetLabel = {
      id: `netlabel-${uuidv4()}`,
      x: snappedX,
      y: snappedY,
      width: NET_LABEL_WIDTH,
      height: NET_LABEL_HEIGHT,
      pins: [{ id: `pin-${uuidv4()}-C0`, side: "center" as const, index: 0 }],
      name: `NET${netLabelCounter}`,
      type: "net-label" as const,
      isPassive: false,
      rotation: 0 as const,
      anchorSide: "left" as const,
    }

    set((state) => ({
      boxes: [...state.boxes, newNetLabel],
      netLabelCounter: state.netLabelCounter + 1,
      editingNameBoxId: newNetLabel.id,
      tempName: newNetLabel.name,
      selectedConnectionId: null,
      selectedJunctionId: null,
      selectedBoxId: newNetLabel.id,
    }))

    _updateConnectionPaths()
    _updateDisplayedCoords()
  }
