# MallenniumDash - Personal Dashboard

## Overview
MallenniumDash is a multi-user modular personal dashboard web application designed for solopreneurs. It provides each user with an isolated and customizable workspace to manage various aspects of their business. Key capabilities include notes, priority tracking, revenue visualization, and the integration of external tools via iframes. The project aims to empower solopreneurs with a comprehensive and personalized hub for their daily operations and strategic planning.

## User Preferences
- I want iterative development where I am involved in the process.
- Please ask before making any major changes or architectural decisions.
- Use clear and simple language in explanations.
- I prefer detailed explanations for complex parts.

## System Architecture
MallenniumDash is built with a modern web stack, featuring React with TypeScript for the frontend, an Express.js backend, and PostgreSQL with Drizzle ORM for persistent data storage. UI components are styled using shadcn/ui and Tailwind CSS, providing a consistent and responsive design.

The application supports multiple customizable "desktops" (workspaces), each with its own background color and a drag-and-drop grid layout powered by `react-grid-layout`. Widgets are the core modular components of the dashboard, allowing users to add functionalities like:
- **Notes Widget**: Rich text notes with markdown support and color-coded backgrounds.
- **Code Block Widget**: Embed and execute HTML/JavaScript snippets.
- **Priorities Widget**: Track top 3 priorities per business venture.
- **Revenue Widget**: Visualize customer payment data with charts using Chart.js.
- **Iframe Widget**: Embed any external web application.
- **Context Mode**: Focused work sessions with objectives and timeboxing.
- **Quick Capture**: Inbox for ideas and tasks.
- **Habit Tracker**: Visualize habit streaks.
- **Daily Journal**: Date-navigable journal entries.
- **Weekly Scorecard**: Metric tracking with week-over-week comparisons.
- **KPI Dashboard**: Progress visualization with color-coded thresholds.
- **Waiting For**: Track delegated tasks with date-based status.
- **CRM Pipeline**: Kanban-style deal tracking.
- **Time Blocks**: Visual daily schedule management.
- **Expense Tracker**: Monitor recurring and variable expenses.
- **Meeting Prep**: Structure meeting agendas and capture action items.
- **Google Calendar**: Embed personal Google Calendars.
- **AI Chat**: Integrate various AI assistants with user-provided API keys.
- **Timer**: Countdown or stopwatch functionality.
- **Custom Widgets**: Admin-created templates rendered via sandboxed iframes. Live-update from templates every 30 seconds.
- **AI Widget Builder**: Any user can build custom widgets using AI (OpenAI). Describe what you want, AI generates HTML/CSS/JS code, preview it live, iterate, then add to dashboard. Requires user's OpenAI API key in settings.

The application ensures multi-user data isolation by associating all data with a `userId`. Authentication is handled via Replit Auth (OIDC). The UI is designed to be fully mobile-responsive, adapting to smaller viewports with a stacked layout and touch-optimized controls.

## External Dependencies
- **Replit Auth**: For user authentication and authorization.
- **PostgreSQL**: Primary database for all application data, managed with Drizzle ORM.
- **shadcn/ui & Tailwind CSS**: UI component library and utility-first CSS framework.
- **Chart.js (via react-chartjs-2)**: For rendering interactive charts and graphs.
- **react-markdown, remark-gfm, react-syntax-highlighter**: For markdown rendering in notes and code blocks.
- **OpenAI API**: Integrated for the HunterAI Assistant feature, requiring user-provided API keys.
- **Google Calendar**: Embedded via iframes for calendar integration.
- **Stripe**: For subscription management, payment processing, and billing portal. Uses Replit Stripe connector for integration and `stripe-replit-sync` for schema and webhook handling.