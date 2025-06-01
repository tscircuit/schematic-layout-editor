import type { Pin, Box } from "@/types/schematic"

export function getPinNumber(pin: Pin, box: Box): number {
  if (box.type === "passive") {
    // For passives, pin 1 is top/left, pin 2 is bottom/right
    // This depends on rotation which might need to be considered if sides change dynamically
    // Assuming 'top' or 'left' is always pin 1 for canonical orientation before rotation.
    // The original logic used pin.side directly.
    // If rotation changes which side is "pin 1", this needs adjustment.
    // For now, sticking to original logic:
    return pin.side === "top" || pin.side === "left" ? 1 : 2
  } else if (box.type === "chip") {
    // For chips, number pins sequentially by side
    const pinsOnSameSide = box.pins
      .filter((p) => p.side === pin.side)
      .sort((a, b) => a.index - b.index)
    const indexInSide = pinsOnSameSide.findIndex((p) => p.id === pin.id)

    // Calculate base offset for each side
    let baseOffset = 0
    if (pin.side === "right") {
      baseOffset = box.pins.filter((p) => p.side === "left").length
    } else if (pin.side === "top") {
      baseOffset =
        box.pins.filter((p) => p.side === "left").length +
        box.pins.filter((p) => p.side === "right").length
    } else if (pin.side === "bottom") {
      baseOffset =
        box.pins.filter((p) => p.side === "left").length +
        box.pins.filter((p) => p.side === "right").length +
        box.pins.filter((p) => p.side === "top").length
    }

    return baseOffset + indexInSide + 1 // 1-indexed
  }
  return 1 // Default for net-labels (center pin)
}
