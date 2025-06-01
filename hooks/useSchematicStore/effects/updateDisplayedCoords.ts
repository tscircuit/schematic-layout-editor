import type { StoreSet, StoreGet } from "../types"
import { getEndpointPosition } from "@/lib/schematic-utils"

export const createUpdateDisplayedCoords =
  (set: StoreSet, get: StoreGet) => () => {
    const {
      selectedBoxId,
      selectedConnectionId,
      selectedJunctionId,
      boxes,
      connections,
      junctions,
    } = get()

    let coordsText = "No selection"
    if (selectedBoxId) {
      const box = boxes.find((b) => b.id === selectedBoxId)
      if (box) {
        let typeRef = ""
        if (box.type === "passive") typeRef = " (center)"
        else if (box.type === "net-label") typeRef = " (pin)"
        else typeRef = " (top-left)" // Chip
        coordsText = `X: ${box.x.toFixed(2)}, Y: ${(-box.y).toFixed(2)}${typeRef}`
      }
    } else if (selectedConnectionId) {
      const conn = connections.find((c) => c.id === selectedConnectionId)
      if (conn) {
        const startPoint = getEndpointPosition(conn.from, boxes, junctions)
        if (startPoint) {
          coordsText = `Start: X: ${startPoint.x.toFixed(2)}, Y: ${(-startPoint.y).toFixed(2)}`
        } else {
          coordsText = "Connection start invalid"
        }
      } else {
        coordsText = "Connection selected (no path data)"
      }
    } else if (selectedJunctionId) {
      const junc = junctions.find((j) => j.id === selectedJunctionId)
      if (junc) {
        coordsText = `Junction: X: ${junc.x.toFixed(2)}, Y: ${(-junc.y).toFixed(2)}`
      }
    }
    set({ displayedCoords: coordsText })
  }
