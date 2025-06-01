import type { SchematicStateStore } from "./types"

export const initialState: SchematicStateStore = {
  boxes: [],
  connections: [],
  junctions: [],
  selectedBoxId: null,
  selectedConnectionId: null,
  selectedJunctionId: null,
  connectionStart: null,
  currentConnectionWaypoints: [],
  editingNameBoxId: null,
  tempName: "",
  editingConnLabelId: null,
  tempConnLabel: "",
  chipCounter: 1,
  passiveCounter: 1,
  netLabelCounter: 1,
  junctionCounter: 1,
  displayedCoords: "No selection",
}
