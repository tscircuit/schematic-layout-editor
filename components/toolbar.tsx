"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import type { Tool, Box } from "@/types/schematic"
import {
  Move,
  Link2,
  Cpu,
  Zap,
  RotateCw,
  Trash2,
  Type,
  Tag,
  Download,
  Upload,
  GitFork,
  PlusSquare,
  CloudUpload,
  HelpCircle,
} from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface ToolbarProps {
  selectedTool: Tool
  onSelectTool: (tool: Tool) => void
  selectedBoxId: string | null
  selectedConnectionId: string | null
  selectedJunctionId: string | null
  boxes: Box[]
  onDelete: () => void
  onRotate: () => void
  onAddPin: (side: "left" | "right") => void
  onEditConnLabel: () => void
  onDownload: () => void
  onShowLoadDialog: () => void
}

export function Toolbar({
  selectedTool,
  onSelectTool,
  selectedBoxId,
  selectedConnectionId,
  selectedJunctionId,
  boxes,
  onDelete,
  onRotate,
  onAddPin,
  onEditConnLabel,
  onDownload,
  onShowLoadDialog,
}: ToolbarProps) {
  const selectedBox = boxes.find((b) => b.id === selectedBoxId)
  const canDelete = selectedBoxId || selectedConnectionId || selectedJunctionId
  const canRotate =
    selectedBox &&
    (selectedBox.type === "passive" || selectedBox.type === "net-label")
  const canAddPins = selectedBox && selectedBox.type === "chip"

  const [helpTooltipOpen, setHelpTooltipOpen] = useState(false)

  return (
    <div className="flex items-center gap-1 p-2 bg-white border-b flex-wrap">
      <div className="flex items-center gap-1 flex-grow">
        <Button
          variant={selectedTool === "select" ? "default" : "outline"}
          size="icon"
          onClick={() => onSelectTool("select")}
          title="Select (1 or Esc)"
          className="relative"
        >
          <Move className="w-4 h-4" />
          <span className="absolute bottom-[2px] right-[2px] text-[8px] text-gray-400 leading-none">
            1
          </span>
        </Button>
        <Button
          variant={selectedTool === "add-chip" ? "default" : "outline"}
          size="icon"
          onClick={() => onSelectTool("add-chip")}
          title="Add Chip (2)"
          className="relative"
        >
          <Cpu className="w-4 h-4" />
          <span className="absolute bottom-[2px] right-[2px] text-[8px] text-gray-400 leading-none">
            2
          </span>
        </Button>
        <Button
          variant={selectedTool === "add-passive" ? "default" : "outline"}
          size="icon"
          onClick={() => onSelectTool("add-passive")}
          title="Add Passive (3)"
          className="relative"
        >
          <Zap className="w-4 h-4" />
          <span className="absolute bottom-[2px] right-[2px] text-[8px] text-gray-400 leading-none">
            3
          </span>
        </Button>
        <Button
          variant={selectedTool === "add-net-label" ? "default" : "outline"}
          size="icon"
          onClick={() => onSelectTool("add-net-label")}
          title="Add Net Label (4)"
          className="relative"
        >
          <Tag className="w-4 h-4" />
          <span className="absolute bottom-[2px] right-[2px] text-[8px] text-gray-400 leading-none">
            4
          </span>
        </Button>
        <Button
          variant={selectedTool === "connect" ? "default" : "outline"}
          size="icon"
          onClick={() => onSelectTool("connect")}
          title="Connect (C or 5)"
          className="relative"
        >
          <Link2 className="w-4 h-4" />
          <span className="absolute bottom-[2px] right-[2px] text-[8px] text-gray-400 leading-none">
            C 5
          </span>
        </Button>
        <Button
          variant={selectedTool === "add-junction" ? "default" : "outline"}
          size="icon"
          onClick={() => onSelectTool("add-junction")}
          title="Add Junction (6)"
          className="relative"
        >
          <GitFork className="w-4 h-4" />
          <span className="absolute bottom-[2px] right-[2px] text-[8px] text-gray-400 leading-none">
            6
          </span>
        </Button>

        <div className="mx-1 h-6 w-px bg-gray-300" />

        {canDelete && (
          <Button
            variant="outline"
            size="icon"
            onClick={onDelete}
            title="Delete selected (Del/Backspace)"
            className="relative"
          >
            <Trash2 className="w-4 h-4" />
            <span className="absolute bottom-[2px] right-[2px] text-[8px] text-gray-400 leading-none">
              Del
            </span>
          </Button>
        )}
        {canRotate && (
          <Button
            variant="outline"
            size="icon"
            onClick={onRotate}
            title="Rotate (R)"
            className="relative"
          >
            <RotateCw className="w-4 h-4" />
            <span className="absolute bottom-[2px] right-[2px] text-[8px] text-gray-400 leading-none">
              R
            </span>
          </Button>
        )}
        {canAddPins && (
          <>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onAddPin("left")}
              title="Add Left Pin"
            >
              <PlusSquare className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onAddPin("right")}
              title="Add Right Pin"
            >
              <PlusSquare className="w-4 h-4" />
            </Button>
          </>
        )}
        {selectedConnectionId && (
          <Button
            variant="outline"
            size="icon"
            onClick={onEditConnLabel}
            title="Edit Connection Label"
          >
            <Type className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="flex items-center gap-1">
        <TooltipProvider>
          <Tooltip open={helpTooltipOpen} onOpenChange={setHelpTooltipOpen}>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setHelpTooltipOpen(!helpTooltipOpen)}
                className="text-blue-600"
                title="Help"
              >
                <HelpCircle className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="max-w-md p-4 bg-white text-gray-800 shadow-lg rounded-md">
              <div className="space-y-3 text-sm">
                <p>
                  This schematic editor is used to create reference layouts for
                  the tscircuit schematic layout "match-adapt" algorithm. This
                  algorithm works by matching a user's netlist against a known
                  corpus of schematic designs.
                </p>
                <p>
                  You can download your schematic layout as JSON from this page
                  and contribute hit the "cloud upload" icon to upload it to the
                  corpus of the project. After approval on Github, tscircuit
                  will automatically incorporate your design into automatic
                  schematic layout.
                </p>
                <p>There are 5 key elements in a schematic layout:</p>
                <ul className="list-disc pl-5">
                  <li>
                    A <strong>Chip</strong> is a box with pins on the top, left,
                    right or bottom.
                  </li>
                  <li>
                    A <strong>Passive</strong> (actually any two-pin component)
                    has two pins and can be rotated.
                  </li>
                  <li>
                    A <strong>Connection</strong> is a line between any two
                    pins.
                  </li>
                  <li>
                    A <strong>Net Label</strong> is used to indicate anything
                    with that net label is implicitly connected.
                  </li>
                  <li>
                    A <strong>Junction</strong> is a point on a line that
                    branches off to another pin.
                  </li>
                </ul>
                <p>
                  You can read more about the schematic-match-adapt algorithm
                  here:{" "}
                  <a
                    href="https://github.com/tscircuit/schematic-match-adapt"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    GitHub
                  </a>
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <a
          href="https://github.com/tscircuit/schematic-match-adapt/upload/main/corpus"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block"
        >
          <Button variant="outline" size="icon" title="Upload to GitHub Corpus">
            <CloudUpload className="w-4 h-4" />
          </Button>
        </a>

        <Button
          variant="outline"
          size="icon"
          onClick={onDownload}
          title="Download Schematic"
        >
          <Download className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          onClick={onShowLoadDialog}
          title="Load Schematic"
        >
          <Upload className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
