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
- **Storage**: PostgreSQL with Drizzle ORM (persistent storage)
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
│   │   ├── code-widget.tsx
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

### Desktops
- `GET /api/desktops` - Get all desktops (ordered by order field)
- `POST /api/desktops` - Create desktop (name, backgroundColor, order)
- `PATCH /api/desktops/:id` - Update desktop (name, backgroundColor)
- `DELETE /api/desktops/:id` - Delete desktop and all its widgets

### Widgets
- `GET /api/widgets` - Get all widgets (optionally filter by `?desktopId=`)
- `POST /api/widgets` - Create widget (includes desktopId, cardColor)
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
1. **Notes** - Sticky notes with rich text formatting toolbar (bold, italic, headings, lists), color-coded backgrounds with auto-adjusting text colors
2. **Code Block** - Execute and render HTML/JavaScript code (like a mini embedded app), with preview/code toggle
3. **Priorities** - Track top 3 priorities per business venture
4. **Revenue** - Customer payment tracking per month with charts
5. **Iframe** - Embed external tools and websites
6. **Context Mode** - Focused work sessions with objective, top 3 actions, ignore list, exit condition, and timebox timer

## Features
- **Multiple Desktops**: Create separate desktop layouts (e.g., "Business", "Personal") with tab switching
- **Desktop Background Colors**: Customizable background color per desktop (presets + custom color picker)
- **Widget Card Colors**: Per-widget card color customization (palette icon in widget header)
- Drag-and-drop widget positioning (drag via grip icon)
- Widget resizing from all 8 directions (corners and sides)
- Editable widget titles (click title to edit)
- Desktop rename (double-click desktop tab)
- Collapse/expand widgets
- Dark/light theme toggle
- Layout persistence
- Venture management with color coding
- Notes color-coding with 9 color options (auto-adjusting text contrast)
- Revenue data with descriptions (add customer payments, invoices, etc.)
- Revenue data editing (add/edit/delete entries)
- **Mobile responsive layout**: Complete mobile-optimized experience (viewport < 768px)
  - Compact header with logo, desktop name, and hamburger menu button
  - Bottom Sheet menu for all secondary actions (desktop switching, add desktop, background color, delete desktop, context settings, ventures, theme toggle)
  - Stacked full-width card layout (no GridLayout/drag/resize on mobile)
  - Fixed bottom action bar with Add Widget button
  - Larger touch targets on widget header buttons, hidden drag handles
  - All mobile changes gated by `isMobile` check, desktop experience unchanged
- Confirmation dialogs before deletions
- **Context Mode**: Focus contracts per desktop/day, pin-to-all-desktops, enter context modal, exit warnings, configurable exit guard modes (off/soft_warn/strict)

## API Endpoints (Context Mode)

### Focus Contracts
- `GET /api/focus-contracts/:desktopId/:date` - Get focus contract for desktop on date
- `PUT /api/focus-contracts` - Upsert focus contract (desktopId, date, objective, top3, ignoreList, exitCondition, timeboxMinutes)

### App Settings
- `GET /api/settings` - Get app settings
- `PATCH /api/settings` - Update app settings (showContextModal, exitGuardMode)

### Pinned Widgets
- `GET /api/widgets/pinned` - Get all widgets pinned to all desktops

## Running the App
```bash
npm run dev
```

The app runs on port 5000.
