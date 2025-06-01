interface CoordinateDisplayProps {
  coords: string
}

export function CoordinateDisplay({ coords }: CoordinateDisplayProps) {
  return (
    <div className="absolute bottom-4 right-4 bg-slate-800 text-slate-100 p-2 rounded text-xs shadow-lg pointer-events-none z-10">
      {coords}
    </div>
  )
}
