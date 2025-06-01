import type {
  Box,
  Connection,
  Junction,
  ConnectionEndpointSource,
  Pin,
  CircuitLayoutJson,
  SchematicLayout,
} from "@/types/schematic"

export interface SchematicStateStore {
  boxes: Box[]
  connections: Connection[]
  junctions: Junction[]
  selectedBoxId: string | null
  selectedConnectionId: string | null
  selectedJunctionId: string | null
  connectionStart: ConnectionEndpointSource | null
  currentConnectionWaypoints: { x: number; y: number }[]
  editingNameBoxId: string | null
  tempName: string
  editingConnLabelId: string | null
  tempConnLabel: string
  chipCounter: number
  passiveCounter: number
  netLabelCounter: number
  junctionCounter: number
  displayedCoords: string
}

export interface SchematicActions {
  // Setters for simple state
  setSelectedBoxId: (id: string | null) => void
  setSelectedConnectionId: (id: string | null) => void
  setSelectedJunctionId: (id: string | null) => void
  setTempName: (name: string) => void
  setTempConnLabel: (label: string) => void
  setConnectionStart: (endpoint: ConnectionEndpointSource | null) => void
  setCurrentConnectionWaypoints: (waypoints: { x: number; y: number }[]) => void
  setEditingNameBoxId: (id: string | null) => void
  setEditingConnLabelId: (id: string | null) => void

  // Core actions
  addChip: (worldPos: { x: number; y: number }) => void
  addPassive: (worldPos: { x: number; y: number }) => void
  addNetLabel: (worldPos: { x: number; y: number }) => void
  addJunction: (worldPos: { x: number; y: number }) => void
  addJunctionToSegment: (
    worldPos: { x: number; y: number },
    connId: string,
    segmentStart: { x: number; y: number },
    segmentEnd: { x: number; y: number },
  ) => void
  startConnection: (endpoint: ConnectionEndpointSource) => void
  addWaypoint: (worldPos: { x: number; y: number }) => void
  finishConnection: (endpoint: ConnectionEndpointSource) => void
  cancelConnection: () => void
  deleteSelected: () => void
  rotateSelectedBox: () => void
  addPinToSelectedBox: (side: "left" | "right") => void
  startEditingBoxName: (boxId: string) => void
  finishEditingBoxName: () => void
  startEditingConnLabel: (connId: string) => void
  finishEditingConnLabel: () => void
  updateBoxPosition: (boxId: string, newX: number, newY: number) => void
  clearSelections: () => void

  // File operations
  handleDownload: () => void
  handleLoadData: (jsonData: string) => void
  // Internal load helpers (if exposed, otherwise they are called by handleLoadData)
  _handleLoadNewFormat: (loadedData: CircuitLayoutJson) => void
  _handleLoadLegacyFormat: (loadedData: SchematicLayout) => void

  // Internal effect-like updaters
  _updateConnectionPaths: () => void
  _updateDisplayedCoords: () => void
}

export type SchematicStore = SchematicStateStore & SchematicActions

// Define a type for the Zustand store's set and get functions
export type StoreSet = (
  partial:
    | SchematicStore
    | Partial<SchematicStore>
    | ((state: SchematicStore) => SchematicStore | Partial<SchematicStore>),
  replace?: boolean | undefined,
) => void

export type StoreGet = () => SchematicStore
