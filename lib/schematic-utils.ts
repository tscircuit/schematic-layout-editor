import {
  type Box,
  type Junction,
  type ConnectionEndpointSource,
  type AnchorSide,
  GRID_SIZE,
  NET_LABEL_WIDTH,
  NET_LABEL_HEIGHT,
  NET_LABEL_TEXT_OFFSET_PX,
  SIDES_ORDER,
} from "@/types/schematic"
import { snapToGrid } from "./geometry"

export const getEndpointPosition = (
  endpoint: ConnectionEndpointSource,
  boxes: Box[],
  junctions: Junction[],
): { x: number; y: number } | null => {
  if (endpoint.type === "pin") {
    const box = boxes.find((b) => b.id === endpoint.boxId)
    const pin = box?.pins.find((p) => p.id === endpoint.pinId)
    if (box && pin) {
      if (box.type === "passive") {
        const centerX = box.x
        const centerY = box.y
        // For passives, height in the Box object IS the pin-to-pin distance along its main axis before rotation
        const pinOffsetFromCenter = box.height / 2
        const pinX = centerX // Pin is initially along Y axis relative to center
        let pinYValue = centerY

        if (pin.side === "top") pinYValue -= pinOffsetFromCenter
        else if (pin.side === "bottom") pinYValue += pinOffsetFromCenter

        const angleRad = box.rotation * (Math.PI / 180)
        const cosAngle = Math.cos(angleRad)
        const sinAngle = Math.sin(angleRad)

        const rotatedPinX =
          (pinX - centerX) * cosAngle -
          (pinYValue - centerY) * sinAngle +
          centerX
        const rotatedPinY =
          (pinX - centerX) * sinAngle +
          (pinYValue - centerY) * cosAngle +
          centerY
        return { x: rotatedPinX, y: rotatedPinY }
      } else if (box.type === "net-label") {
        return { x: box.x, y: box.y } // Pin is at the box's x, y (anchor point)
      } else {
        // Chip
        const { width: chipWidth } = box
        let pinX = box.x
        let pinYValue = box.y
        // Assuming pins are placed relative to the box's top-left (x,y)
        // and chip height is dynamically calculated based on pins.
        if (pin.side === "left") {
          pinX = box.x
          pinYValue = box.y + GRID_SIZE + pin.index * GRID_SIZE
        } else if (pin.side === "right") {
          pinX = box.x + chipWidth
          pinYValue = box.y + GRID_SIZE + pin.index * GRID_SIZE
        }
        // Top/Bottom pins would need similar logic if added
        return { x: snapToGrid(pinX), y: snapToGrid(pinYValue) }
      }
    }
  } else if (endpoint.type === "junction") {
    const junction = junctions.find((j) => j.id === endpoint.junctionId)
    if (junction) return { x: junction.x, y: junction.y }
  }
  return null
}

export const getVisualDetails = (
  box: Box,
): { x: number; y: number; width: number; height: number } => {
  if (box.type === "passive") {
    // The box.width is the cross-axis width, box.height is the main-axis (pin-to-pin) length
    const mainAxisLength = box.height // PASSIVE_PIN_TO_PIN_DIST
    const crossAxisWidth = box.width // PASSIVE_BODY_WIDTH
    let vWidth, vHeight
    if (box.rotation === 0 || box.rotation === 180) {
      // Vertical orientation
      vWidth = crossAxisWidth
      vHeight = mainAxisLength
    } else {
      // Horizontal orientation
      vWidth = mainAxisLength
      vHeight = crossAxisWidth
    }
    // x, y for passive is center
    return {
      x: box.x - vWidth / 2,
      y: box.y - vHeight / 2,
      width: vWidth,
      height: vHeight,
    }
  } else if (box.type === "net-label") {
    // x, y for net-label is its anchor point, visual is centered around it for simplicity here
    // but actual rendering might offset based on anchorSide and text.
    // For the bounding box for selection/display, this is fine.
    return {
      x: box.x - NET_LABEL_WIDTH / 2, // This might need adjustment based on how name is rendered
      y: box.y - NET_LABEL_HEIGHT / 2,
      width: NET_LABEL_WIDTH,
      height: NET_LABEL_HEIGHT,
    }
  } else {
    // Chip
    // x, y for chip is top-left
    return { x: box.x, y: box.y, width: box.width, height: box.height }
  }
}

export const getEffectiveAnchorSide = (
  initialAnchor: AnchorSide,
  rotation: 0 | 90 | 180 | 270,
): AnchorSide => {
  const initialIndex = SIDES_ORDER.indexOf(initialAnchor)
  if (initialIndex === -1) return "left" // Default
  const rotationSteps = rotation / 90
  const effectiveIndex = (initialIndex + rotationSteps) % 4
  return SIDES_ORDER[effectiveIndex]
}

export const getNetLabelTextAttributes = (
  effectiveAnchorSide: AnchorSide,
  pinScreenX: number,
  pinScreenY: number,
): {
  textX: number
  textY: number
  textAnchor: "start" | "middle" | "end"
  dominantBaseline: "middle" | "hanging" | "alphabetic"
} => {
  let textX = pinScreenX,
    textY = pinScreenY
  let textAnchor: "start" | "middle" | "end" = "start"
  let dominantBaseline: "middle" | "hanging" | "alphabetic" = "middle"

  switch (effectiveAnchorSide) {
    case "left":
      textX = pinScreenX + NET_LABEL_TEXT_OFFSET_PX
      textAnchor = "start"
      dominantBaseline = "middle"
      break
    case "right":
      textX = pinScreenX - NET_LABEL_TEXT_OFFSET_PX
      textAnchor = "end"
      dominantBaseline = "middle"
      break
    case "top": // Text below the pin
      textY = pinScreenY + NET_LABEL_TEXT_OFFSET_PX
      textAnchor = "middle"
      dominantBaseline = "hanging"
      break
    case "bottom": // Text above the pin
      textY = pinScreenY - NET_LABEL_TEXT_OFFSET_PX
      textAnchor = "middle"
      dominantBaseline = "alphabetic"
      break
  }
  return { textX, textY, textAnchor, dominantBaseline }
}

export const getNetLabelForeignObjectPos = (
  effectiveAnchorSide: AnchorSide,
  pinScreenX: number,
  pinScreenY: number,
): { foX: number; foY: number; inputWidth: number; inputHeight: number } => {
  const inputWidth = 60,
    inputHeight = 22 // Standard input size
  let foX = pinScreenX,
    foY = pinScreenY

  switch (effectiveAnchorSide) {
    case "left":
      foX = pinScreenX + NET_LABEL_TEXT_OFFSET_PX
      foY = pinScreenY - inputHeight / 2
      break
    case "right":
      foX = pinScreenX - NET_LABEL_TEXT_OFFSET_PX - inputWidth
      foY = pinScreenY - inputHeight / 2
      break
    case "top":
      foX = pinScreenX - inputWidth / 2
      foY = pinScreenY + NET_LABEL_TEXT_OFFSET_PX
      break
    case "bottom":
      foX = pinScreenX - inputWidth / 2
      foY = pinScreenY - NET_LABEL_TEXT_OFFSET_PX - inputHeight
      break
  }
  return { foX, foY, inputWidth, inputHeight }
}
