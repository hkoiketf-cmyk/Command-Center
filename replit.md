# MalleniumDash - Personal Dashboard

## Overview
MalleniumDash (formerly HunterOS) is a multi-user modular personal dashboard web application for solopreneurs. Each user gets their own isolated workspace with customizable app name (editable via pencil icon in header). Features include:
- Notes (with markdown and code block support)
- Top 3 priorities per business venture
- Revenue graphs
- Embedded iframes for external tools

## Authentication
- Uses Replit Auth (OIDC) for login/signup (Google, GitHub, email)
- Auth module at `server/replit_integrations/auth/`
- Auth models at `shared/models/auth.ts` (users, sessions tables)
- All data tables have `userId` column for multi-user data isolation
- All API routes protected with `isAuthenticated` middleware
- Frontend uses `useAuth()` hook from `client/src/hooks/use-auth.ts`
- Landing page shown for logged-out users, dashboard for logged-in users
- Per-user customizable app name via `user_settings` table
- User avatar and logout button in dashboard header

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
7. **Quick Capture** - Inbox for capturing ideas/tasks, mark as processed, filter by status
8. **Habit Tracker** - GitHub-style 7-week streak grid, color-coded per habit, streak counter
9. **Daily Journal** - Date-navigable journal entries with auto-save (800ms debounce)
10. **Weekly Scorecard** - Define metrics with targets, week-over-week comparison with trend indicators
11. **KPI Dashboard** - Progress bars with 3-tier color thresholds (green/yellow/red at 80%/50%)
12. **Waiting For** - Track delegated items with date-based status colors (overdue warnings)
13. **CRM Pipeline** - 5-column kanban (Lead→Closed), drag-and-drop between stages, stale indicators
14. **Time Blocks** - Vertical timeline with color-coded blocks, day navigation, 12-hour format
15. **Expense Tracker** - Recurring (monthly) + variable expenses, displays monthly burn rate
16. **Meeting Prep** - Two-phase workflow (prep with talking points → notes with action items)
17. **Google Calendar** - Native Google Calendar integration via Replit connector (OAuth sign-in), displays events with day/week/month/agenda views, navigation, calendar selector
18. **AI Chat** - Embed any AI assistant (ChatGPT, Claude, Gemini, Perplexity, etc.) via URL, quick-select popular tools or paste custom URL
19. **Timer** - Countdown or count-up (stopwatch) timer with customizable duration, progress bar, multiple alert sound options, mute toggle

## HunterAI Assistant
- Floating chat button on dashboard (bottom-right corner)
- Users provide their own OpenAI API key (stored per-user in user_settings)
- Searches across ALL dashboard data: KPIs, priorities, revenue, deals, habits, expenses, notes, journal, scorecard, meetings, waiting items, capture items
- Streaming SSE responses from OpenAI (gpt-4o-mini)
- Hunt-themed personality ("Tracking down your data...", "Here's what I hunted down for you!")
- API endpoint: POST /api/hunter-ai/chat (body: { message: string })
- Settings dialog to add/update OpenAI API key
- API key is masked in GET /api/user-settings responses (never exposed to frontend)

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

### Quick Capture
- `GET /api/capture-items` - Get all capture items
- `POST /api/capture-items` - Create capture item
- `PATCH /api/capture-items/:id` - Update capture item (mark processed)
- `DELETE /api/capture-items/:id` - Delete capture item

### Habits
- `GET /api/habits` - Get all habits
- `POST /api/habits` - Create habit
- `DELETE /api/habits/:id` - Delete habit
- `GET /api/habit-entries/:habitId` - Get entries for habit
- `PUT /api/habit-entries` - Upsert habit entry (habitId, date, completed)

### Journal
- `GET /api/journal/:date` - Get journal entry for date
- `PUT /api/journal` - Upsert journal entry (date, content)

### Scorecard
- `GET /api/scorecard-metrics` - Get all scorecard metrics
- `POST /api/scorecard-metrics` - Create metric
- `DELETE /api/scorecard-metrics/:id` - Delete metric
- `GET /api/scorecard-entries` - Get all scorecard entries
- `PUT /api/scorecard-entries` - Upsert entry (metricId, weekStart, value)

### KPIs
- `GET /api/kpis` - Get all KPIs
- `POST /api/kpis` - Create KPI
- `PATCH /api/kpis/:id` - Update KPI (currentValue)
- `DELETE /api/kpis/:id` - Delete KPI

### Waiting For
- `GET /api/waiting-items` - Get all waiting items
- `POST /api/waiting-items` - Create waiting item
- `PATCH /api/waiting-items/:id` - Update waiting item
- `DELETE /api/waiting-items/:id` - Delete waiting item

### CRM Deals
- `GET /api/deals` - Get all deals
- `POST /api/deals` - Create deal
- `PATCH /api/deals/:id` - Update deal (stage, lastContactDate)
- `DELETE /api/deals/:id` - Delete deal

### Time Blocks
- `GET /api/time-blocks?date=` - Get time blocks for date
- `POST /api/time-blocks` - Create time block
- `DELETE /api/time-blocks/:id` - Delete time block

### Expenses
- `GET /api/recurring-expenses` - Get recurring expenses
- `POST /api/recurring-expenses` - Create recurring expense
- `DELETE /api/recurring-expenses/:id` - Delete recurring expense
- `GET /api/variable-expenses` - Get variable expenses
- `POST /api/variable-expenses` - Create variable expense
- `DELETE /api/variable-expenses/:id` - Delete variable expense

### Meetings
- `GET /api/meetings` - Get all meetings
- `POST /api/meetings` - Create meeting
- `PATCH /api/meetings/:id` - Update meeting (objective, talkingPoints, notes, actionItems, completed)
- `DELETE /api/meetings/:id` - Delete meeting

### AI Chat
- `GET /api/ai/conversations` - Get all AI conversations
- `POST /api/ai/conversations` - Create conversation
- `DELETE /api/ai/conversations/:id` - Delete conversation and messages
- `GET /api/ai/conversations/:id/messages` - Get messages for conversation
- `POST /api/ai/conversations/:id/chat` - Send message and get streaming SSE response (requires OPENAI_API_KEY secret)

### Google Calendar
- `GET /api/google-calendar/calendars` - Get user's calendar list (via Replit connector OAuth)
- `GET /api/google-calendar/events?calendarId=&timeMin=&timeMax=` - Get events for a calendar

### Stripe Payments
- `GET /api/stripe/publishable-key` - Get Stripe publishable key (public)
- `GET /api/subscription` - Get current user's subscription status (trialing/active/expired)
- `GET /api/stripe/prices` - Get available pricing plans
- `POST /api/stripe/checkout` - Create Stripe Checkout session (body: { priceId })
- `POST /api/stripe/portal` - Create Stripe billing portal session
- `POST /api/stripe/sync-subscription` - Sync subscription from Stripe after checkout
- `POST /api/stripe/webhook` - Stripe webhook handler (registered before express.json())

## Stripe Integration
- Uses Replit Stripe connector for API key management
- `stripe-replit-sync` handles schema, webhooks, and data sync automatically
- Products/prices created via `server/seed-products.ts` script
- Stripe data stored in `stripe` schema (managed by stripe-replit-sync, never modify directly)
- Users table has `stripeCustomerId` and `stripeSubscriptionId` columns
- Pricing: 3-day free trial, $9/month or $75.60/year (30% savings)
- Dashboard gated behind active subscription or trial
- Billing management via Stripe Customer Portal
- Data retention: expired/canceled users' data kept for 30 days, then automatically cleaned up
- `subscriptionEndedAt` field tracks when a user's access ended
- Daily cleanup job removes all data for users whose subscription ended 30+ days ago
- Access codes for friends/family: admin generates codes, users redeem on pricing page
- Admin access controlled via ADMIN_USER_IDS environment variable (comma-separated user IDs)

## Running the App
```bash
npm run dev
```

The app runs on port 5000.
