import type React from "react"
import { GRID_SIZE, SCALE } from "@/types/schematic"

export const snapToGrid = (value: number): number =>
  Math.round(value / GRID_SIZE) * GRID_SIZE
export const snapToHalfGrid = (value: number): number =>
  Math.round((value - GRID_SIZE / 2) / GRID_SIZE) * GRID_SIZE + GRID_SIZE / 2

export const worldToScreen = (
  x: number,
  y: number,
  panOffset: { x: number; y: number },
): { x: number; y: number } => ({
  x: x * SCALE + panOffset.x,
  y: y * SCALE + panOffset.y,
})

export const screenToWorld = (
  x: number,
  y: number,
  panOffset: { x: number; y: number },
): { x: number; y: number } => ({
  x: (x - panOffset.x) / SCALE,
  y: (y - panOffset.y) / SCALE,
})

export const getMousePosition = (
  e: React.MouseEvent | MouseEvent,
  svgRef: React.RefObject<SVGSVGElement>,
): { x: number; y: number } => {
  const rect = svgRef.current?.getBoundingClientRect()
  if (!rect) return { x: 0, y: 0 }
  return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}

export const distSq = (
  p1: { x: number; y: number },
  p2: { x: number; y: number },
): number => {
  return (p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2
}

export const distToSegmentSquared = (
  p: { x: number; y: number },
  v: { x: number; y: number },
  w: { x: number; y: number },
): number => {
  const l2 = distSq(v, w)
  if (l2 === 0) return distSq(p, v)
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2
  t = Math.max(0, Math.min(1, t))
  const projection = { x: v.x + t * (w.x - v.x), y: v.y + t * (w.y - v.y) }
  return distSq(p, projection)
}

// Direction enum to track the last direction of movement
export enum Direction {
  None = 0,
  Horizontal = 1,
  Vertical = 2,
}

export const generateDrawableOrthogonalPath = (
  waypoints: { x: number; y: number }[],
): { x: number; y: number }[] => {
  if (waypoints.length < 2) return waypoints

  const drawablePoints: { x: number; y: number }[] = [waypoints[0]]
  let lastDirection = Direction.None

  for (let i = 0; i < waypoints.length - 1; i++) {
    const p1 = waypoints[i]
    const p2 = waypoints[i + 1]
    if (!p1 || !p2) continue

    if (p1.x !== p2.x && p1.y !== p2.y) {
      // Determine the preferred direction for this segment
      let preferHorizontalFirst = true

      // If this is not the first segment, use the last direction
      if (i > 0 && lastDirection !== Direction.None) {
        preferHorizontalFirst = lastDirection === Direction.Vertical
      }
      // For the first segment, determine direction based on pin orientation
      else if (i === 0) {
        // For the first point, we need to infer the direction from the pin orientation
        // We'll use the relative position of the next waypoint to determine this
        const dx = Math.abs(p2.x - p1.x)
        const dy = Math.abs(p2.y - p1.y)

        // If the pin is on the left or right side of a component, prefer vertical first
        // If the pin is on the top or bottom, prefer horizontal first
        if (dx > dy) {
          // Pin is likely on left or right side
          preferHorizontalFirst = false
        } else {
          // Pin is likely on top or bottom side
          preferHorizontalFirst = true
        }
      }

      // Create the elbow based on the preferred direction
      if (preferHorizontalFirst) {
        drawablePoints.push({ x: p2.x, y: p1.y })
        lastDirection = Direction.Horizontal
      } else {
        drawablePoints.push({ x: p1.x, y: p2.y })
        lastDirection = Direction.Vertical
      }
    } else {
      // Update the last direction based on straight segments
      if (p1.x !== p2.x) {
        lastDirection = Direction.Horizontal
      } else if (p1.y !== p2.y) {
        lastDirection = Direction.Vertical
      }
    }

    drawablePoints.push(p2)
  }

  return drawablePoints
}
