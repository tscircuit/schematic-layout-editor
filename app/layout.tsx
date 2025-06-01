import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "Schematic Layout Editor",
  description:
    "Create schematic layouts with chips, passives, connections, net labels and juncitons.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
