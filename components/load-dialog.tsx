"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"

interface LoadDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onLoadData: (jsonData: string) => void
}

export function LoadDialog({ isOpen, onOpenChange, onLoadData }: LoadDialogProps) {
  const [loadDialogText, setLoadDialogText] = useState("")

  const handleLoad = () => {
    onLoadData(loadDialogText)
    onOpenChange(false) // Close dialog after attempting load
    setLoadDialogText("") // Clear text area
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white">
        <DialogHeader>
          <DialogTitle>Load Schematic Data</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea
            placeholder="Paste schematic JSON here..."
            value={loadDialogText}
            onChange={(e) => setLoadDialogText(e.target.value)}
            className="min-h-[200px]"
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" onClick={() => setLoadDialogText("")}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleLoad}>
            Load Data
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
