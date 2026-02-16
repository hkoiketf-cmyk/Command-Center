import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, boolean, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Desktops table
export const desktops = pgTable("desktops", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  backgroundColor: text("background_color").notNull().default("#09090b"),
  order: integer("order").notNull().default(0),
});

export const insertDesktopSchema = createInsertSchema(desktops).omit({
  id: true,
});

export type InsertDesktop = z.infer<typeof insertDesktopSchema>;
export type Desktop = typeof desktops.$inferSelect;

// Widget types enum
export const widgetTypes = ["notes", "priorities", "revenue", "iframe", "code", "context_mode", "quick_capture", "habit_tracker", "daily_journal", "weekly_scorecard", "kpi_dashboard", "waiting_for", "crm_pipeline", "time_blocks", "expense_tracker", "meeting_prep", "google_calendar", "ai_chat"] as const;
export type WidgetType = typeof widgetTypes[number];

// Layout item for react-grid-layout
export const layoutItemSchema = z.object({
  i: z.string(),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  minW: z.number().optional(),
  minH: z.number().optional(),
  mobileHeight: z.number().optional(),
  mobileOrder: z.number().optional(),
});

export type LayoutItem = z.infer<typeof layoutItemSchema>;

// Widgets table
export const widgets = pgTable("widgets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull().$type<WidgetType>(),
  title: text("title").notNull(),
  content: jsonb("content").default({}),
  collapsed: boolean("collapsed").default(false),
  layout: jsonb("layout").$type<LayoutItem>(),
  desktopId: varchar("desktop_id"),
  cardColor: text("card_color"),
  pinnedAllDesktops: boolean("pinned_all_desktops").default(false),
});

export const insertWidgetSchema = createInsertSchema(widgets).omit({
  id: true,
});

export type InsertWidget = z.infer<typeof insertWidgetSchema>;
export type Widget = typeof widgets.$inferSelect;

// Business ventures for priorities widget
export const ventures = pgTable("ventures", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  color: text("color").notNull().default("#3B82F6"),
});

export const insertVentureSchema = createInsertSchema(ventures).omit({
  id: true,
});

export type InsertVenture = z.infer<typeof insertVentureSchema>;
export type Venture = typeof ventures.$inferSelect;

// Priorities for a venture (max 3 per venture)
export const priorities = pgTable("priorities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ventureId: varchar("venture_id").notNull().references(() => ventures.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  completed: boolean("completed").default(false),
  order: integer("order").notNull().default(0),
});

export const insertPrioritySchema = createInsertSchema(priorities).omit({
  id: true,
});

export type InsertPriority = z.infer<typeof insertPrioritySchema>;
export type Priority = typeof priorities.$inferSelect;

// Revenue data for graphs
export const revenueData = pgTable("revenue_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  ventureId: varchar("venture_id").notNull().references(() => ventures.id, { onDelete: "cascade" }),
  month: text("month").notNull(),
  amount: real("amount").notNull().default(0),
  year: integer("year").notNull(),
  description: text("description"),
  date: text("date"),
});

export const insertRevenueDataSchema = createInsertSchema(revenueData).omit({
  id: true,
});

export type InsertRevenueData = z.infer<typeof insertRevenueDataSchema>;
export type RevenueData = typeof revenueData.$inferSelect;

// Dashboard layout persistence
export const dashboardLayouts = pgTable("dashboard_layouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().default("default"),
  layouts: jsonb("layouts").$type<LayoutItem[]>().default([]),
});

export const insertDashboardLayoutSchema = createInsertSchema(dashboardLayouts).omit({
  id: true,
});

export type InsertDashboardLayout = z.infer<typeof insertDashboardLayoutSchema>;
export type DashboardLayout = typeof dashboardLayouts.$inferSelect;

// Notes content type
export type NotesContent = {
  markdown: string;
  backgroundColor?: string;
};

// Priorities content type
export type PrioritiesContent = {
  ventureId: string;
};

// Revenue content type
export type RevenueContent = {
  ventureId: string;
  chartType: "line" | "bar";
};

// Iframe content type
export type IframeContent = {
  url: string;
};

// Code block content type
export type CodeContent = {
  code: string;
  language?: string;
};

// Context Mode content type
export type ContextModeContent = {};

// Focus contracts for context mode widget
export const focusContracts = pgTable("focus_contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  desktopId: varchar("desktop_id").notNull().references(() => desktops.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  objective: text("objective").default(""),
  top3: jsonb("top3").$type<{ text: string; done: boolean }[]>().default([
    { text: "", done: false },
    { text: "", done: false },
    { text: "", done: false },
  ]),
  ignoreList: jsonb("ignore_list").$type<string[]>().default([]),
  exitCondition: text("exit_condition").default(""),
  timeboxMinutes: integer("timebox_minutes"),
});

export const insertFocusContractSchema = createInsertSchema(focusContracts).omit({
  id: true,
});

export type InsertFocusContract = z.infer<typeof insertFocusContractSchema>;
export type FocusContract = typeof focusContracts.$inferSelect;

// App settings (single row)
export type ExitGuardMode = "off" | "soft_warn" | "strict";

export const appSettings = pgTable("app_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  showContextModal: boolean("show_context_modal").default(true),
  exitGuardMode: text("exit_guard_mode").$type<ExitGuardMode>().default("soft_warn"),
});

export const insertAppSettingsSchema = createInsertSchema(appSettings).omit({
  id: true,
});

export type InsertAppSettings = z.infer<typeof insertAppSettingsSchema>;
export type AppSettings = typeof appSettings.$inferSelect;

// ============ NEW WIDGET TABLES ============

// Quick Capture Inbox
export const captureItems = pgTable("capture_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  text: text("text").notNull(),
  processed: boolean("processed").default(false),
  createdAt: text("created_at").notNull().default(sql`now()::text`),
});

export const insertCaptureItemSchema = createInsertSchema(captureItems).omit({ id: true });
export type InsertCaptureItem = z.infer<typeof insertCaptureItemSchema>;
export type CaptureItem = typeof captureItems.$inferSelect;

// Habit Streak Tracker
export const habits = pgTable("habits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  color: text("color").notNull().default("#3B82F6"),
  order: integer("order").notNull().default(0),
});

export const insertHabitSchema = createInsertSchema(habits).omit({ id: true });
export type InsertHabit = z.infer<typeof insertHabitSchema>;
export type Habit = typeof habits.$inferSelect;

export const habitEntries = pgTable("habit_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  habitId: varchar("habit_id").notNull().references(() => habits.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  completed: boolean("completed").default(true),
});

export const insertHabitEntrySchema = createInsertSchema(habitEntries).omit({ id: true });
export type InsertHabitEntry = z.infer<typeof insertHabitEntrySchema>;
export type HabitEntry = typeof habitEntries.$inferSelect;

// Daily Journal
export const journalEntries = pgTable("journal_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: text("date").notNull(),
  content: text("content").notNull().default(""),
});

export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({ id: true });
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type JournalEntry = typeof journalEntries.$inferSelect;

// Weekly Scorecard
export const scorecardMetrics = pgTable("scorecard_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  target: real("target").notNull().default(0),
  unit: text("unit").default(""),
  order: integer("order").notNull().default(0),
});

export const insertScorecardMetricSchema = createInsertSchema(scorecardMetrics).omit({ id: true });
export type InsertScorecardMetric = z.infer<typeof insertScorecardMetricSchema>;
export type ScorecardMetric = typeof scorecardMetrics.$inferSelect;

export const scorecardEntries = pgTable("scorecard_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  metricId: varchar("metric_id").notNull().references(() => scorecardMetrics.id, { onDelete: "cascade" }),
  weekStart: text("week_start").notNull(),
  value: real("value").notNull().default(0),
});

export const insertScorecardEntrySchema = createInsertSchema(scorecardEntries).omit({ id: true });
export type InsertScorecardEntry = z.infer<typeof insertScorecardEntrySchema>;
export type ScorecardEntry = typeof scorecardEntries.$inferSelect;

// KPI Dashboard
export const kpis = pgTable("kpis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  currentValue: real("current_value").notNull().default(0),
  targetValue: real("target_value").notNull().default(0),
  unit: text("unit").default(""),
  prefix: text("prefix").default(""),
  order: integer("order").notNull().default(0),
});

export const insertKpiSchema = createInsertSchema(kpis).omit({ id: true });
export type InsertKpi = z.infer<typeof insertKpiSchema>;
export type Kpi = typeof kpis.$inferSelect;

// Waiting-For List
export const waitingItems = pgTable("waiting_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  person: text("person").notNull(),
  description: text("description").notNull(),
  dateSent: text("date_sent").notNull(),
  expectedDate: text("expected_date"),
  completed: boolean("completed").default(false),
});

export const insertWaitingItemSchema = createInsertSchema(waitingItems).omit({ id: true });
export type InsertWaitingItem = z.infer<typeof insertWaitingItemSchema>;
export type WaitingItem = typeof waitingItems.$inferSelect;

// CRM Mini Pipeline
export const deals = pgTable("deals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  value: real("value").default(0),
  stage: text("stage").notNull().default("lead"),
  lastContactDate: text("last_contact_date").notNull(),
  nextAction: text("next_action").default(""),
  createdAt: text("created_at").notNull().default(sql`now()::text`),
});

export const insertDealSchema = createInsertSchema(deals).omit({ id: true });
export type InsertDeal = z.infer<typeof insertDealSchema>;
export type Deal = typeof deals.$inferSelect;

// Time Block Planner
export const timeBlocks = pgTable("time_blocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  label: text("label").notNull(),
  color: text("color").notNull().default("#3B82F6"),
});

export const insertTimeBlockSchema = createInsertSchema(timeBlocks).omit({ id: true });
export type InsertTimeBlock = z.infer<typeof insertTimeBlockSchema>;
export type TimeBlock = typeof timeBlocks.$inferSelect;

// Expense Burn Rate
export const recurringExpenses = pgTable("recurring_expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  amount: real("amount").notNull().default(0),
  category: text("category").default(""),
});

export const insertRecurringExpenseSchema = createInsertSchema(recurringExpenses).omit({ id: true });
export type InsertRecurringExpense = z.infer<typeof insertRecurringExpenseSchema>;
export type RecurringExpense = typeof recurringExpenses.$inferSelect;

export const variableExpenses = pgTable("variable_expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  amount: real("amount").notNull().default(0),
  date: text("date").notNull(),
  category: text("category").default(""),
});

export const insertVariableExpenseSchema = createInsertSchema(variableExpenses).omit({ id: true });
export type InsertVariableExpense = z.infer<typeof insertVariableExpenseSchema>;
export type VariableExpense = typeof variableExpenses.$inferSelect;

// Meeting Prep & Agenda
export const meetings = pgTable("meetings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  person: text("person").default(""),
  date: text("date").notNull(),
  time: text("time").default(""),
  objective: text("objective").default(""),
  talkingPoints: jsonb("talking_points").$type<string[]>().default([]),
  desiredOutcome: text("desired_outcome").default(""),
  notes: text("notes").default(""),
  actionItems: jsonb("action_items").$type<string[]>().default([]),
  completed: boolean("completed").default(false),
});

export const insertMeetingSchema = createInsertSchema(meetings).omit({ id: true });
export type InsertMeeting = z.infer<typeof insertMeetingSchema>;
export type Meeting = typeof meetings.$inferSelect;

// Content types for new widgets
export type QuickCaptureContent = {};
export type HabitTrackerContent = {};
export type DailyJournalContent = {};
export type WeeklyScorecardContent = {};
export type KpiDashboardContent = {};
export type WaitingForContent = {};
export type CrmPipelineContent = {};
export type TimeBlocksContent = { startHour?: number; endHour?: number };
export type ExpenseTrackerContent = {};
export type MeetingPrepContent = {};
export type GoogleCalendarContent = { calendarUrl?: string };
export type AiChatContent = {};

// AI Chat tables
export const aiConversations = pgTable("ai_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull().default("New Chat"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAiConversationSchema = createInsertSchema(aiConversations).omit({ id: true, createdAt: true });
export type InsertAiConversation = z.infer<typeof insertAiConversationSchema>;
export type AiConversation = typeof aiConversations.$inferSelect;

export const aiMessages = pgTable("ai_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAiMessageSchema = createInsertSchema(aiMessages).omit({ id: true, createdAt: true });
export type InsertAiMessage = z.infer<typeof insertAiMessageSchema>;
export type AiMessage = typeof aiMessages.$inferSelect;
