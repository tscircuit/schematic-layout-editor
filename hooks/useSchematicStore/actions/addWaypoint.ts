import type { StateCreator } from "zustand"
import { snapToGrid } from "@/lib/geometry"
import { GRID_SIZE } from "@/types/schematic"
import type { SchematicStore } from "../types"

export const createAddWaypoint =
  (
    set: StateCreator<SchematicStore, [], [], SchematicStore>["1"],
    get: () => SchematicStore,
    _updateConnectionPaths: () => void,
    _updateDisplayedCoords: () => void,
  ) =>
  (worldPos: { x: number; y: number }) => {
    const { connectionStart, currentConnectionWaypoints } = get()
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
      set((state) => ({
        currentConnectionWaypoints: [
          ...state.currentConnectionWaypoints,
          snappedWaypointPos,
        ],
      }))
    }
  }
