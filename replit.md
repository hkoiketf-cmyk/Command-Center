# HunterOS - Personal Dashboard

## Overview
HunterOS is a modular personal dashboard web application for tracking:
- Notes (with markdown and code block support)
- Top 3 priorities per business venture
- Revenue graphs
- Embedded iframes for external tools

## Tech Stack
- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js
- **Storage**: In-memory storage (MemStorage)
- **UI Components**: shadcn/ui + Tailwind CSS
- **Grid Layout**: react-grid-layout for drag & drop
- **Charts**: Chart.js via react-chartjs-2
- **Markdown**: react-markdown + remark-gfm + react-syntax-highlighter

## Project Structure
```
client/
├── src/
│   ├── components/
│   │   ├── ui/           # shadcn components
│   │   ├── theme-provider.tsx
│   │   ├── theme-toggle.tsx
│   │   ├── widget-wrapper.tsx
│   │   ├── notes-widget.tsx
│   │   ├── priorities-widget.tsx
│   │   ├── revenue-widget.tsx
│   │   ├── iframe-widget.tsx
│   │   ├── add-widget-dialog.tsx
│   │   └── venture-manager.tsx
│   ├── pages/
│   │   └── dashboard.tsx  # Main dashboard page
│   └── App.tsx
server/
├── index.ts              # Express server entry
├── routes.ts             # API routes
├── storage.ts            # In-memory storage
└── seed.ts               # Seed data
shared/
└── schema.ts             # Shared types and schemas
```

## API Endpoints

### Widgets
- `GET /api/widgets` - Get all widgets
- `POST /api/widgets` - Create widget
- `PATCH /api/widgets/:id` - Update widget
- `DELETE /api/widgets/:id` - Delete widget

### Layout
- `GET /api/layout` - Get dashboard layout
- `PUT /api/layout` - Save dashboard layout

### Ventures
- `GET /api/ventures` - Get all ventures
- `POST /api/ventures` - Create venture
- `DELETE /api/ventures/:id` - Delete venture

### Priorities
- `GET /api/priorities/:ventureId` - Get priorities for venture
- `POST /api/priorities` - Create priority (max 3 per venture)
- `PATCH /api/priorities/:id` - Update priority
- `DELETE /api/priorities/:id` - Delete priority

### Revenue
- `GET /api/revenue/:ventureId` - Get revenue data
- `POST /api/revenue` - Create revenue data point

## Widget Types
1. **Notes** - Markdown editor with syntax highlighting for code blocks
2. **Priorities** - Track top 3 priorities per business venture
3. **Revenue** - Line/bar charts showing revenue data
4. **Iframe** - Embed external tools and websites

## Features
- Drag-and-drop widget positioning
- Widget resizing
- Collapse/expand widgets
- Dark/light theme toggle
- Layout persistence
- Venture management with color coding

## Running the App
```bash
npm run dev
```

The app runs on port 5000.
