import type { StateCreator } from "zustand"
import { getEndpointPosition } from "@/lib/schematic-utils"
import type { SchematicStore } from "../types"
import type { ConnectionEndpointSource } from "@/types/schematic"

export const createStartConnection =
  (
    set: StateCreator<SchematicStore, [], [], SchematicStore>["1"],
    get: () => SchematicStore,
    _updateConnectionPaths: () => void,
    _updateDisplayedCoords: () => void,
  ) =>
  (endpoint: ConnectionEndpointSource) => {
    const { boxes, junctions } = get()
    const pos = getEndpointPosition(endpoint, boxes, junctions)
    if (!pos) return

    set({
      connectionStart: endpoint,
      currentConnectionWaypoints: [pos],
      selectedBoxId: null,
      selectedConnectionId: null,
      selectedJunctionId: null,
    })

    _updateDisplayedCoords()
  }
