"use client"
import { useState, useEffect } from "react"
import { Toolbar } from "@/components/toolbar"
import { SchematicEditor } from "@/components/schematic-editor"
import { CoordinateDisplay } from "@/components/coordinate-display"
import { LoadDialog } from "@/components/load-dialog"
import { useSchematicState } from "@/hooks/useSchematicState"
import type { Tool } from "@/types/schematic"

export default function GridDrawingAppPage() {
  const {
    boxes,
    junctions,
    connections,
    selectedBoxId,
    setSelectedBoxId,
    selectedConnectionId,
    setSelectedConnectionId,
    selectedJunctionId,
    setSelectedJunctionId,
    connectionStart,
    currentConnectionWaypoints,
    editingNameBoxId,
    tempName,
    setTempName,
    editingConnLabelId,
    tempConnLabel,
    setTempConnLabel,
    displayedCoords,
    addChip,
    addPassive,
    addNetLabel,
    addJunction,
    addJunctionToSegment,
    startConnection,
    addWaypoint,
    finishConnection,
    cancelConnection,
    deleteSelected,
    rotateSelectedBox,
    addPinToSelectedBox,
    startEditingBoxNameHandler,
    finishEditingBoxNameHandler,
    startEditingConnLabelHandler,
    finishEditingConnLabelHandler,
    updateBoxPosition,
    clearSelections,
    handleDownload,
    handleLoadData,
  } = useSchematicState()

  const [selectedTool, setSelectedTool] = useState<Tool>("select")
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 })
  const [showLoadDialog, setShowLoadDialog] = useState(false)

  // Effect to clear connection state if tool changes away from "connect"
  useEffect(() => {
    if (selectedTool !== "connect" && connectionStart) {
      cancelConnection()
    }
  }, [selectedTool, connectionStart, cancelConnection])

  const handleSelectTool = (tool: Tool) => {
    setSelectedTool(tool)
    // If switching away from connect tool while a connection is in progress, cancel it.
    if (tool !== "connect" && connectionStart) {
      cancelConnection()
    }
    // Clear selections when changing tools, except if going to select (which might be for an existing selection)
    if (tool !== "select") {
      clearSelections()
    }
  }

  const clearSelectionsAndCancelConnection = () => {
    clearSelections()
    if (connectionStart) {
      cancelConnection()
    }
  }

  // Add hotkey handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger hotkeys if user is typing in an input field
      if (document.activeElement?.tagName.toLowerCase() === "input") {
        return
      }

      switch (e.key) {
        case "1":
          handleSelectTool("select")
          break
        case "2":
          handleSelectTool("add-chip")
          break
        case "3":
          handleSelectTool("add-passive")
          break
        case "4":
          handleSelectTool("add-net-label")
          break
        case "5":
        case "c":
        case "C":
          handleSelectTool("connect")
          break
        case "6":
          handleSelectTool("add-junction")
          break
        case "Escape":
          handleSelectTool("select")
          break
        case "r":
        case "R":
          if (selectedBoxId) {
            const selectedBox = boxes.find((b) => b.id === selectedBoxId)
            if (
              selectedBox &&
              (selectedBox.type === "passive" ||
                selectedBox.type === "net-label")
            ) {
              rotateSelectedBox()
            }
          }
          break
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedBoxId, boxes, rotateSelectedBox])

  return (
    <div className="w-full h-screen flex flex-col bg-gray-50 relative">
      <Toolbar
        selectedTool={selectedTool}
        onSelectTool={handleSelectTool}
        selectedBoxId={selectedBoxId}
        selectedConnectionId={selectedConnectionId}
        selectedJunctionId={selectedJunctionId}
        boxes={boxes}
        onDelete={deleteSelected}
        onRotate={rotateSelectedBox}
        onAddPin={addPinToSelectedBox}
        onEditConnLabel={() =>
          selectedConnectionId &&
          startEditingConnLabelHandler(selectedConnectionId)
        }
        onDownload={handleDownload}
        onShowLoadDialog={() => setShowLoadDialog(true)}
      />
      <SchematicEditor
        boxes={boxes}
        connections={connections}
        junctions={junctions}
        selectedTool={selectedTool}
        panOffset={panOffset}
        setPanOffset={setPanOffset}
        selectedBoxId={selectedBoxId}
        onSelectBox={setSelectedBoxId}
        selectedConnectionId={selectedConnectionId}
        onSelectConnection={setSelectedConnectionId}
        selectedJunctionId={selectedJunctionId}
        onSelectJunction={setSelectedJunctionId}
        connectionStart={connectionStart}
        currentConnectionWaypoints={currentConnectionWaypoints}
        editingName={editingNameBoxId}
        tempName={tempName}
        onTempNameChange={setTempName}
        onStartEditingBoxName={startEditingBoxNameHandler}
        onFinishEditingBoxName={finishEditingBoxNameHandler}
        editingConnLabelId={editingConnLabelId}
        tempConnLabel={tempConnLabel}
        onTempConnLabelChange={setTempConnLabel}
        onStartEditingConnLabel={startEditingConnLabelHandler}
        onFinishEditingConnLabel={finishEditingConnLabelHandler}
        onAddChip={addChip}
        onAddPassive={addPassive}
        onAddNetLabel={addNetLabel}
        onAddJunction={addJunction}
        onAddJunctionToSegment={addJunctionToSegment}
        onStartConnection={startConnection}
        onAddWaypoint={addWaypoint}
        onFinishConnection={finishConnection}
        onUpdateBoxPosition={updateBoxPosition}
        onClearSelectionsAndCancelConnection={
          clearSelectionsAndCancelConnection
        }
        onSelectTool={handleSelectTool}
      />
      <CoordinateDisplay coords={displayedCoords} />
      <LoadDialog
        isOpen={showLoadDialog}
        onOpenChange={setShowLoadDialog}
        onLoadData={handleLoadData}
      />
    </div>
  )
}
