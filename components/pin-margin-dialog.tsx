"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Box, Pin } from "@/types/schematic"
import { GRID_SIZE } from "@/types/schematic"

interface PinMarginDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  selectedBox: Box | null
  onUpdatePinMargins: (boxId: string, updatedPins: Pin[]) => void
}

export function PinMarginDialog({
  isOpen,
  onOpenChange,
  selectedBox,
  onUpdatePinMargins,
}: PinMarginDialogProps) {
  const [pinMargins, setPinMargins] = useState<Record<string, number>>({})

  useEffect(() => {
    if (selectedBox && selectedBox.type === "chip") {
      const margins: Record<string, number> = {}
      for (const pin of selectedBox.pins) {
        margins[pin.id] = pin.marginFromLastPin ?? GRID_SIZE
      }
      setPinMargins(margins)
    }
  }, [selectedBox])

  const handleMarginChange = (pinId: string, value: string) => {
    const numValue = Number.parseFloat(value)
    if (!Number.isNaN(numValue) && numValue >= 0) {
      setPinMargins((prev) => ({
        ...prev,
        [pinId]: numValue,
      }))
    }
  }

  const handleSave = () => {
    if (!selectedBox || selectedBox.type !== "chip") return

    const updatedPins = selectedBox.pins.map((pin) => ({
      ...pin,
      marginFromLastPin: pinMargins[pin.id],
    }))

    onUpdatePinMargins(selectedBox.id, updatedPins)
    onOpenChange(false)
  }

  const handleReset = () => {
    if (!selectedBox || selectedBox.type !== "chip") return

    const margins: Record<string, number> = {}
    for (const pin of selectedBox.pins) {
      margins[pin.id] = GRID_SIZE
    }
    setPinMargins(margins)
  }

  if (!selectedBox || selectedBox.type !== "chip") {
    return null
  }

  const leftPins = selectedBox.pins
    .filter((p) => p.side === "left")
    .sort((a, b) => a.index - b.index)
  const rightPins = selectedBox.pins
    .filter((p) => p.side === "right")
    .sort((a, b) => a.index - b.index)

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Configure Pin Margins</DialogTitle>
          <DialogDescription>
            Set the margin from the previous pin for each pin on{" "}
            {selectedBox.name}. Default margin is {GRID_SIZE}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {leftPins.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2">Left Side Pins</h4>
              <div className="space-y-2">
                {leftPins.map((pin, index) => (
                  <div key={pin.id} className="flex items-center gap-2">
                    <Label className="w-16 text-xs">Pin {index + 1}</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={pinMargins[pin.id] || GRID_SIZE}
                      onChange={(e) =>
                        handleMarginChange(pin.id, e.target.value)
                      }
                      className="flex-1"
                      disabled={index === 0} // First pin doesn't have a margin
                    />
                    {index === 0 && (
                      <span className="text-xs text-gray-500">(first pin)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {rightPins.length > 0 && (
            <div>
              <h4 className="font-medium text-sm mb-2">Right Side Pins</h4>
              <div className="space-y-2">
                {rightPins.map((pin, index) => (
                  <div key={pin.id} className="flex items-center gap-2">
                    <Label className="w-16 text-xs">Pin {index + 1}</Label>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      value={pinMargins[pin.id] || GRID_SIZE}
                      onChange={(e) =>
                        handleMarginChange(pin.id, e.target.value)
                      }
                      className="flex-1"
                      disabled={index === 0} // First pin doesn't have a margin
                    />
                    {index === 0 && (
                      <span className="text-xs text-gray-500">(first pin)</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={handleReset}>
            Reset to Default
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
