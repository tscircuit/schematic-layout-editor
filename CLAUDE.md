# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a schematic layout editor for tscircuit that creates reference layouts for the "match-adapt" algorithm. Users can create schematic designs with chips, passives, connections, net labels, and junctions, then export them as JSON to contribute to tscircuit's automatic schematic layout corpus.

## Development Commands

- **Start development server**: `bun run dev` or `npm run dev`
- **Build for production**: `bun run build` or `npm run build`
- **Format code**: `bun run format` (writes) or `bun run format:check` (check only)

The project uses Biome for formatting

## Architecture

### Core State Management

- **useSchematicStore** (`hooks/useSchematicStore/useSchematicStore.ts`): Central state store managing all schematic entities (boxes, connections, junctions) and editing operations
- State includes selections, connection-in-progress tracking, and temporary editing values

### Main Components

- **SchematicEditor** (`components/schematic-editor.tsx`): Main SVG-based canvas for drawing and interaction
- **Toolbar** (`components/toolbar.tsx`): Tool selection and actions (select, add-chip, add-passive, connect, etc.)
- **LoadDialog** (`components/load-dialog.tsx`): Import/export functionality

### Core Types

All schematic entities are defined in `types/schematic.ts`:

- **Box**: Chips, passives, and net-labels with pins and positioning
- **Connection**: Lines between pins/junctions with waypoints
- **Junction**: Branch points on connections
- **CircuitLayoutJson**: Export format for tscircuit integration

### Coordinate System

- Uses world coordinates (floating point) with grid snapping
- **GRID_SIZE**: 0.2 world units
- **SCALE**: 100 (world to screen pixel conversion)
- Grid snapping functions in `lib/geometry.ts`

### Tool System

Tools: "select", "add-chip", "add-passive", "add-net-label", "connect", "add-junction"

- Hotkeys: 1-6 for tools, C for connect, R for rotate, Escape for select
- Connection tool supports multi-waypoint orthogonal routing

### Export Formats

- **CircuitLayoutJson**: New standard format for tscircuit
- **SchematicLayout**: Legacy format for backward compatibility
- Export conversion handled in `useSchematicStore.ts`

## Styling & UI

- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS + Shadcn/UI components
- **Theme**: Uses next-themes for dark/light mode
- **File naming**: kebab-case enforced by Biome

## Development Notes

- TypeScript strict mode enabled
- All new components should follow existing patterns in `components/`
- Coordinate transformations use functions from `lib/geometry.ts`
- Visual rendering logic centralized in `lib/schematic-utils.ts`
