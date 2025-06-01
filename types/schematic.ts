export const GRID_SIZE = 0.2
export const SCALE = 100 // This might be better managed as state if zoom is implemented
export const PASSIVE_BODY_WIDTH = 0.2
export const PASSIVE_PIN_TO_PIN_DIST = 1.0
export const NET_LABEL_WIDTH = 1.0
export const NET_LABEL_HEIGHT = 0.4
export const NET_LABEL_TEXT_OFFSET_PX = 8
export const CONNECTION_SELECTION_THRESHOLD_PX = 5
export const JUNCTION_RADIUS_PX = 5

export interface Pin {
  id: string
  side: "left" | "right" | "top" | "bottom" | "center"
  index: number
}

export type AnchorSide = "left" | "right" | "top" | "bottom"
export const SIDES_ORDER: AnchorSide[] = ["left", "top", "right", "bottom"]

export interface Box {
  id: string
  x: number // World coordinates, typically top-left for chips, center for passives/net-labels
  y: number // World coordinates
  width: number // World units
  height: number // World units
  pins: Pin[]
  name: string // Primary identifier/designator (e.g., U1, R1, or the net name for net-labels)
  type: "chip" | "passive" | "net-label"
  isPassive: boolean // True if the component is a passive type
  rotation: 0 | 90 | 180 | 270
  anchorSide?: AnchorSide // For net-labels
}

export interface Junction {
  id: string
  x: number // World coordinates
  y: number // World coordinates
}

export type ConnectionEndpointSource =
  | { type: "pin"; boxId: string; pinId: string }
  | { type: "junction"; junctionId: string }

export interface Connection {
  id: string
  from: ConnectionEndpointSource
  to: ConnectionEndpointSource
  path: { x: number; y: number }[] // Includes start/end points derived from 'from' and 'to', in world coordinates
  label?: string
}

export type Tool =
  | "select"
  | "add-chip"
  | "add-passive"
  | "add-net-label"
  | "connect"
  | "add-junction"

// --- New Standard Format ---
export type LayoutPointRef =
  | {
      boxId: string
      pinNumber: number
    }
  | {
      junctionId: string
    }
  | {
      netId: string
    }

export interface LaidOutBox {
  boxId: string

  leftPinCount: number
  rightPinCount: number
  topPinCount: number
  bottomPinCount: number

  centerX: number
  centerY: number

  pins: Array<{
    pinNumber: number
    x: number
    y: number
  }>
}

export interface LaidOutPath {
  points: Array<{
    x: number
    y: number
  }>
  from: LayoutPointRef
  to: LayoutPointRef
}

export interface LaidOutNetLabel {
  netId: string
  anchorPosition: "top" | "bottom" | "left" | "right"
  x: number
  y: number
}

export interface CircuitLayoutJson {
  boxes: LaidOutBox[]
  netLabels: Array<LaidOutNetLabel>
  paths: Array<LaidOutPath>
  junctions: Array<{
    junctionId: string
    x: number
    y: number
  }>
}

// --- Legacy format for backward compatibility ---
export interface SchematicLayoutNetLabel {
  netLabelId: string
  netName: string
  x: number
  y: number
  anchorPosition: AnchorSide
  rotation?: 0 | 90 | 180 | 270
}
export interface SchematicLayoutJunction {
  junctionId: string
  x: number
  y: number
}
export interface SchematicLayoutPathEndpoint {
  boxId?: string
  junctionId?: string
}
export interface SchematicLayoutPath {
  pathId: string
  points: Array<{ x: number; y: number }>
  from: SchematicLayoutPathEndpoint
  to: SchematicLayoutPathEndpoint
}
export interface SchematicLayoutBox {
  boxId: string
  name?: string
  leftPinCount: number
  topPinCount: number
  bottomPinCount: number
  rightPinCount: number
  centerX: number
  centerY: number
}
export interface SchematicLayout {
  boxes: SchematicLayoutBox[]
  paths: SchematicLayoutPath[]
  junctions: SchematicLayoutJunction[]
  netLabels: SchematicLayoutNetLabel[]
}
