import { create } from "zustand"
import { type SchematicStore, type SchematicStateStore } from "./types"
import { initialState } from "./initialState"

// Action implementations will be imported here
import { createClearSelections } from "./actions/clearSelections"
import { createAddChip } from "./actions/addChip"
import { createAddPassive } from "./actions/addPassive"
import { createAddNetLabel } from "./actions/addNetLabel"
import { createStartConnection } from "./actions/startConnection"
import { createFinishConnection } from "./actions/finishConnection"
import { createAddWaypoint } from "./actions/addWaypoint"

// Effect helper implementations
import { createUpdateConnectionPaths } from "./effects/updateConnectionPaths"
import { createUpdateDisplayedCoords } from "./effects/updateDisplayedCoords"

export const useSchematicStore = create<SchematicStore>((set, get) => {
  // Initialize effect helpers
  const _updateConnectionPaths = createUpdateConnectionPaths(set, get)
  const _updateDisplayedCoords = createUpdateDisplayedCoords(set, get)

  return {
    ...initialState,

    // Simple setters
    setSelectedBoxId: (id) => {
      set({
        selectedBoxId: id,
        selectedConnectionId: null,
        selectedJunctionId: null,
      })
      _updateDisplayedCoords()
    },
    setSelectedConnectionId: (id) => {
      set({
        selectedBoxId: null,
        selectedConnectionId: id,
        selectedJunctionId: null,
      })
      _updateDisplayedCoords()
    },
    setSelectedJunctionId: (id) => {
      set({
        selectedBoxId: null,
        selectedConnectionId: null,
        selectedJunctionId: id,
      })
      _updateDisplayedCoords()
    },
    setTempName: (name) => set({ tempName: name }),
    setTempConnLabel: (label) => set({ tempConnLabel: label }),
    setConnectionStart: (endpoint) => set({ connectionStart: endpoint }),
    setCurrentConnectionWaypoints: (waypoints) =>
      set({ currentConnectionWaypoints: waypoints }),
    setEditingNameBoxId: (id) => set({ editingNameBoxId: id }),
    setEditingConnLabelId: (id) => set({ editingConnLabelId: id }),

    // Actions (examples, others will be imported and spread)
    clearSelections: createClearSelections(set, get, _updateDisplayedCoords),
    addChip: createAddChip(
      set,
      get,
      _updateConnectionPaths,
      _updateDisplayedCoords,
    ),
    addPassive: createAddPassive(
      set,
      get,
      _updateConnectionPaths,
      _updateDisplayedCoords,
    ),
    addNetLabel: createAddNetLabel(
      set,
      get,
      _updateConnectionPaths,
      _updateDisplayedCoords,
    ),
    startConnection: createStartConnection(
      set,
      get,
      _updateConnectionPaths,
      _updateDisplayedCoords,
    ),
    finishConnection: createFinishConnection(
      set,
      get,
      _updateConnectionPaths,
      _updateDisplayedCoords,
    ),
    addWaypoint: createAddWaypoint(
      set,
      get,
      _updateConnectionPaths,
      _updateDisplayedCoords,
    ),

    // Placeholder for other actions that need to be implemented in separate files
    addJunction: (worldPos) =>
      console.warn("addJunction not implemented", worldPos),
    addJunctionToSegment: (worldPos, connId, segmentStart, segmentEnd) =>
      console.warn(
        "addJunctionToSegment not implemented",
        worldPos,
        connId,
        segmentStart,
        segmentEnd,
      ),
    cancelConnection: () => {
      set({ connectionStart: null, currentConnectionWaypoints: [] })
    },
    deleteSelected: () => console.warn("deleteSelected not implemented"),
    rotateSelectedBox: () => console.warn("rotateSelectedBox not implemented"),
    addPinToSelectedBox: (side) =>
      console.warn("addPinToSelectedBox not implemented", side),
    startEditingBoxName: (boxId) =>
      console.warn("startEditingBoxName not implemented", boxId),
    finishEditingBoxName: () =>
      console.warn("finishEditingBoxName not implemented"),
    startEditingConnLabel: (connId) =>
      console.warn("startEditingConnLabel not implemented", connId),
    finishEditingConnLabel: () =>
      console.warn("finishEditingConnLabel not implemented"),
    updateBoxPosition: (boxId, newX, newY) =>
      console.warn("updateBoxPosition not implemented", boxId, newX, newY),
    handleDownload: () => console.warn("handleDownload not implemented"),
    handleLoadData: (jsonData) =>
      console.warn("handleLoadData not implemented", jsonData),
    _handleLoadNewFormat: (loadedData) =>
      console.warn("_handleLoadNewFormat not implemented", loadedData),
    _handleLoadLegacyFormat: (loadedData) =>
      console.warn("_handleLoadLegacyFormat not implemented", loadedData),

    // Effect helpers exposed (or called internally by other actions)
    _updateConnectionPaths,
    _updateDisplayedCoords,
  }
})
