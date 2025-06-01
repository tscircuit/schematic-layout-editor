import type { StateCreator } from "zustand"
import { v4 as uuidv4 } from "uuid"
import { getEndpointPosition } from "@/lib/schematic-utils"
import type { SchematicStore } from "../types"
import type { ConnectionEndpointSource } from "@/types/schematic"

export const createFinishConnection =
  (
    set: StateCreator<SchematicStore, [], [], SchematicStore>["1"],
    get: () => SchematicStore,
    _updateConnectionPaths: () => void,
    _updateDisplayedCoords: () => void,
  ) =>
  (endpoint: ConnectionEndpointSource) => {
    const { connectionStart, currentConnectionWaypoints, boxes, junctions } =
      get()
    if (!connectionStart) return

    const endPos = getEndpointPosition(endpoint, boxes, junctions)
    if (!endPos) return

    // Check if trying to connect to itself
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
    const newConnection = {
      id: `conn-${uuidv4()}`,
      from: connectionStart,
      to: endpoint,
      path: finalWaypoints,
      label: "",
    }

    set((state) => ({
      connections: [...state.connections, newConnection],
      connectionStart: null,
      currentConnectionWaypoints: [],
    }))

    _updateConnectionPaths()
    _updateDisplayedCoords()
  }
