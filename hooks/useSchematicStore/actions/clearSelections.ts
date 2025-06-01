import type { StoreSet, StoreGet } from "../types"

export const createClearSelections =
  (set: StoreSet, get: StoreGet, _updateDisplayedCoords: () => void) => () => {
    set({
      selectedBoxId: null,
      selectedConnectionId: null,
      selectedJunctionId: null,
    })
    _updateDisplayedCoords()
  }
