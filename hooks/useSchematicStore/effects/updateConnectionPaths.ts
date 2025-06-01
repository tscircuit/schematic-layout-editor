import type { StoreSet, StoreGet } from "../types"
import { getEndpointPosition } from "@/lib/schematic-utils"

export const createUpdateConnectionPaths = (set: StoreSet, get: StoreGet) => () => {
  const { boxes, junctions, connections } = get()
  const updatedConnections = connections.map((conn) => {
    const fromPos = getEndpointPosition(conn.from, boxes, junctions)
    const toPos = getEndpointPosition(conn.to, boxes, junctions)
    if (fromPos && toPos) {
      const newPath = [...conn.path]
      if (newPath.length > 0) {
        newPath[0] = fromPos
        if (newPath.length > 1) {
          newPath[newPath.length - 1] = toPos
        } else {
          // Path was just a single point, or empty, ensure it has start and end
          newPath.push(toPos)
        }
      } else {
        // Path was empty, initialize with from and to
        newPath.push(fromPos, toPos)
      }
      return { ...conn, path: newPath }
    }
    return conn // Return original if positions can't be determined
  })
  set({ connections: updatedConnections })
}
