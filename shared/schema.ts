import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, boolean, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/auth";

// User Settings
export const userSettings = pgTable("user_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().unique(),
  appName: text("app_name").notNull().default("MallenniumDash"),
  openaiApiKey: text("openai_api_key"),
  openaiApiBaseUrl: text("openai_api_base_url"),
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({ id: true, userId: true });
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type UserSettings = typeof userSettings.$inferSelect;

// Desktops table
export const desktops = pgTable("desktops", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  backgroundColor: text("background_color").notNull().default("#09090b"),
  order: integer("order").notNull().default(0),
});

export const insertDesktopSchema = createInsertSchema(desktops).omit({
  id: true,
  userId: true,
});

export type InsertDesktop = z.infer<typeof insertDesktopSchema>;
export type Desktop = typeof desktops.$inferSelect;

// Widget types enum
export const widgetTypes = ["notes", "priorities", "revenue", "iframe", "code", "context_mode", "quick_capture", "habit_tracker", "daily_journal", "weekly_scorecard", "kpi_dashboard", "waiting_for", "crm_pipeline", "time_blocks", "expense_tracker", "meeting_prep", "google_calendar", "ai_chat", "timer", "custom", "ad_board"] as const;
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
  userId: varchar("user_id").notNull(),
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
  userId: true,
});

export type InsertWidget = z.infer<typeof insertWidgetSchema>;
export type Widget = typeof widgets.$inferSelect;

// Business ventures for priorities widget
export const ventures = pgTable("ventures", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#3B82F6"),
});

export const insertVentureSchema = createInsertSchema(ventures).omit({
  id: true,
  userId: true,
});

export type InsertVenture = z.infer<typeof insertVentureSchema>;
export type Venture = typeof ventures.$inferSelect;

// Priorities for a venture (max 3 per venture)
export const priorities = pgTable("priorities", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  ventureId: varchar("venture_id").notNull().references(() => ventures.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  completed: boolean("completed").default(false),
  order: integer("order").notNull().default(0),
});

export const insertPrioritySchema = createInsertSchema(priorities).omit({
  id: true,
  userId: true,
});

export type InsertPriority = z.infer<typeof insertPrioritySchema>;
export type Priority = typeof priorities.$inferSelect;

// Revenue data for graphs
export const revenueData = pgTable("revenue_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  ventureId: varchar("venture_id").notNull().references(() => ventures.id, { onDelete: "cascade" }),
  month: text("month").notNull(),
  amount: real("amount").notNull().default(0),
  year: integer("year").notNull(),
  description: text("description"),
  date: text("date"),
});

export const insertRevenueDataSchema = createInsertSchema(revenueData).omit({
  id: true,
  userId: true,
});

export type InsertRevenueData = z.infer<typeof insertRevenueDataSchema>;
export type RevenueData = typeof revenueData.$inferSelect;

// Dashboard layout persistence
export const dashboardLayouts = pgTable("dashboard_layouts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  layouts: jsonb("layouts").$type<LayoutItem[]>().default([]),
});

export const insertDashboardLayoutSchema = createInsertSchema(dashboardLayouts).omit({
  id: true,
  userId: true,
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
  userId: varchar("user_id").notNull(),
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
  userId: true,
});

export type InsertFocusContract = z.infer<typeof insertFocusContractSchema>;
export type FocusContract = typeof focusContracts.$inferSelect;

// App settings (single row)
export type ExitGuardMode = "off" | "soft_warn" | "strict";

export const appSettings = pgTable("app_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  showContextModal: boolean("show_context_modal").default(true),
  exitGuardMode: text("exit_guard_mode").$type<ExitGuardMode>().default("soft_warn"),
});

export const insertAppSettingsSchema = createInsertSchema(appSettings).omit({
  id: true,
  userId: true,
});

export type InsertAppSettings = z.infer<typeof insertAppSettingsSchema>;
export type AppSettings = typeof appSettings.$inferSelect;

// ============ NEW WIDGET TABLES ============

// Quick Capture Inbox
export const captureItems = pgTable("capture_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  widgetId: varchar("widget_id"),
  text: text("text").notNull(),
  processed: boolean("processed").default(false),
  createdAt: text("created_at").notNull().default(sql`now()::text`),
});

export const insertCaptureItemSchema = createInsertSchema(captureItems).omit({ id: true, userId: true });
export type InsertCaptureItem = z.infer<typeof insertCaptureItemSchema>;
export type CaptureItem = typeof captureItems.$inferSelect;

// Habit Streak Tracker
export const habits = pgTable("habits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  widgetId: varchar("widget_id"),
  name: text("name").notNull(),
  color: text("color").notNull().default("#3B82F6"),
  order: integer("order").notNull().default(0),
});

export const insertHabitSchema = createInsertSchema(habits).omit({ id: true, userId: true });
export type InsertHabit = z.infer<typeof insertHabitSchema>;
export type Habit = typeof habits.$inferSelect;

export const habitEntries = pgTable("habit_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  widgetId: varchar("widget_id"),
  habitId: varchar("habit_id").notNull().references(() => habits.id, { onDelete: "cascade" }),
  date: text("date").notNull(),
  completed: boolean("completed").default(true),
});

export const insertHabitEntrySchema = createInsertSchema(habitEntries).omit({ id: true, userId: true });
export type InsertHabitEntry = z.infer<typeof insertHabitEntrySchema>;
export type HabitEntry = typeof habitEntries.$inferSelect;

// Daily Journal
export const journalEntries = pgTable("journal_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  widgetId: varchar("widget_id"),
  date: text("date").notNull(),
  content: text("content").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`now()::text`),
});

export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({ id: true, userId: true, createdAt: true });
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type JournalEntry = typeof journalEntries.$inferSelect;

// Weekly Scorecard
export const scorecardMetrics = pgTable("scorecard_metrics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  widgetId: varchar("widget_id"),
  name: text("name").notNull(),
  target: real("target").notNull().default(0),
  unit: text("unit").default(""),
  order: integer("order").notNull().default(0),
});

export const insertScorecardMetricSchema = createInsertSchema(scorecardMetrics).omit({ id: true, userId: true });
export type InsertScorecardMetric = z.infer<typeof insertScorecardMetricSchema>;
export type ScorecardMetric = typeof scorecardMetrics.$inferSelect;

export const scorecardEntries = pgTable("scorecard_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  widgetId: varchar("widget_id"),
  metricId: varchar("metric_id").notNull().references(() => scorecardMetrics.id, { onDelete: "cascade" }),
  weekStart: text("week_start").notNull(),
  value: real("value").notNull().default(0),
});

export const insertScorecardEntrySchema = createInsertSchema(scorecardEntries).omit({ id: true, userId: true });
export type InsertScorecardEntry = z.infer<typeof insertScorecardEntrySchema>;
export type ScorecardEntry = typeof scorecardEntries.$inferSelect;

// KPI Dashboard
export const kpis = pgTable("kpis", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  widgetId: varchar("widget_id"),
  name: text("name").notNull(),
  currentValue: real("current_value").notNull().default(0),
  targetValue: real("target_value").notNull().default(0),
  unit: text("unit").default(""),
  prefix: text("prefix").default(""),
  order: integer("order").notNull().default(0),
});

export const insertKpiSchema = createInsertSchema(kpis).omit({ id: true, userId: true });
export type InsertKpi = z.infer<typeof insertKpiSchema>;
export type Kpi = typeof kpis.$inferSelect;

// Waiting-For List
export const waitingItems = pgTable("waiting_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  widgetId: varchar("widget_id"),
  person: text("person").notNull(),
  description: text("description").notNull(),
  dateSent: text("date_sent").notNull(),
  expectedDate: text("expected_date"),
  completed: boolean("completed").default(false),
});

export const insertWaitingItemSchema = createInsertSchema(waitingItems).omit({ id: true, userId: true });
export type InsertWaitingItem = z.infer<typeof insertWaitingItemSchema>;
export type WaitingItem = typeof waitingItems.$inferSelect;

// CRM Mini Pipeline
export const deals = pgTable("deals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  widgetId: varchar("widget_id"),
  name: text("name").notNull(),
  value: real("value").default(0),
  stage: text("stage").notNull().default("lead"),
  lastContactDate: text("last_contact_date").notNull(),
  nextAction: text("next_action").default(""),
  createdAt: text("created_at").notNull().default(sql`now()::text`),
});

export const insertDealSchema = createInsertSchema(deals).omit({ id: true, userId: true });
export type InsertDeal = z.infer<typeof insertDealSchema>;
export type Deal = typeof deals.$inferSelect;

// Time Block Planner
export const timeBlocks = pgTable("time_blocks", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  widgetId: varchar("widget_id"),
  date: text("date").notNull(),
  startTime: text("start_time").notNull(),
  endTime: text("end_time").notNull(),
  label: text("label").notNull(),
  color: text("color").notNull().default("#3B82F6"),
});

export const insertTimeBlockSchema = createInsertSchema(timeBlocks).omit({ id: true, userId: true });
export type InsertTimeBlock = z.infer<typeof insertTimeBlockSchema>;
export type TimeBlock = typeof timeBlocks.$inferSelect;

// Expense Burn Rate
export const recurringExpenses = pgTable("recurring_expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  widgetId: varchar("widget_id"),
  name: text("name").notNull(),
  amount: real("amount").notNull().default(0),
  category: text("category").default(""),
});

export const insertRecurringExpenseSchema = createInsertSchema(recurringExpenses).omit({ id: true, userId: true });
export type InsertRecurringExpense = z.infer<typeof insertRecurringExpenseSchema>;
export type RecurringExpense = typeof recurringExpenses.$inferSelect;

export const variableExpenses = pgTable("variable_expenses", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  widgetId: varchar("widget_id"),
  name: text("name").notNull(),
  amount: real("amount").notNull().default(0),
  date: text("date").notNull(),
  category: text("category").default(""),
});

export const insertVariableExpenseSchema = createInsertSchema(variableExpenses).omit({ id: true, userId: true });
export type InsertVariableExpense = z.infer<typeof insertVariableExpenseSchema>;
export type VariableExpense = typeof variableExpenses.$inferSelect;

// Meeting Prep & Agenda
export const meetings = pgTable("meetings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  widgetId: varchar("widget_id"),
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

export const insertMeetingSchema = createInsertSchema(meetings).omit({ id: true, userId: true });
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
export type AiChatContent = { embedUrl?: string };
export type TimerContent = { mode?: "countdown" | "countup"; hours?: number; minutes?: number; seconds?: number; sound?: string };
export type CustomWidgetContent = { templateId?: string; code?: string; templateName?: string };

// AI Chat tables
export const aiConversations = pgTable("ai_conversations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull().default("New Chat"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAiConversationSchema = createInsertSchema(aiConversations).omit({ id: true, userId: true, createdAt: true });
export type InsertAiConversation = z.infer<typeof insertAiConversationSchema>;
export type AiConversation = typeof aiConversations.$inferSelect;

export const aiMessages = pgTable("ai_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  conversationId: varchar("conversation_id").notNull(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAiMessageSchema = createInsertSchema(aiMessages).omit({ id: true, userId: true, createdAt: true });
export type InsertAiMessage = z.infer<typeof insertAiMessageSchema>;
export type AiMessage = typeof aiMessages.$inferSelect;

// Dashboard Presets (Templates)
export const presetWidgetSchema = z.object({
  type: z.string(),
  title: z.string(),
  content: z.any().optional(),
  cardColor: z.string().nullable().optional(),
  layout: layoutItemSchema.optional(),
});

export type PresetWidget = z.infer<typeof presetWidgetSchema>;

export const dashboardPresets = pgTable("dashboard_presets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  category: text("category"),
  isPublic: boolean("is_public").notNull().default(false),
  widgets: jsonb("widgets").notNull().$type<PresetWidget[]>(),
  backgroundColor: text("background_color"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDashboardPresetSchema = createInsertSchema(dashboardPresets).omit({ id: true, userId: true, createdAt: true });
export type InsertDashboardPreset = z.infer<typeof insertDashboardPresetSchema>;
export type DashboardPreset = typeof dashboardPresets.$inferSelect;

export const accessCodes = pgTable("access_codes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  code: varchar("code").notNull().unique(),
  label: text("label"),
  maxUses: integer("max_uses").notNull().default(1),
  usedCount: integer("used_count").notNull().default(0),
  createdBy: varchar("created_by").notNull(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAccessCodeSchema = createInsertSchema(accessCodes).omit({ id: true, usedCount: true, createdAt: true });
export type InsertAccessCode = z.infer<typeof insertAccessCodeSchema>;
export type AccessCode = typeof accessCodes.$inferSelect;

export const platformAnnouncements = pgTable("platform_announcements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull().default("info"),
  targetType: text("target_type").notNull().default("all"),
  targetUserIds: text("target_user_ids").array(),
  isActive: boolean("is_active").notNull().default(true),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAnnouncementSchema = createInsertSchema(platformAnnouncements).omit({ id: true, createdAt: true });
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type PlatformAnnouncement = typeof platformAnnouncements.$inferSelect;

export const announcementReads = pgTable("announcement_reads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  announcementId: varchar("announcement_id").notNull(),
  userId: varchar("user_id").notNull(),
  readAt: timestamp("read_at").notNull().defaultNow(),
});

export const widgetTemplates = pgTable("widget_templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  code: text("code").notNull(),
  icon: text("icon").notNull().default("Blocks"),
  isPublic: boolean("is_public").notNull().default(false),
  createdBy: varchar("created_by").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertWidgetTemplateSchema = createInsertSchema(widgetTemplates).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertWidgetTemplate = z.infer<typeof insertWidgetTemplateSchema>;
export type WidgetTemplate = typeof widgetTemplates.$inferSelect;

export const ads = pgTable("ads", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  widgetId: varchar("widget_id"),
  imageUrl: text("image_url").notNull().default(""),
  mediaType: text("media_type").notNull().default("image"),
  headline: text("headline").notNull(),
  description: text("description").notNull().default(""),
  ctaText: text("cta_text").notNull().default("Learn More"),
  ctaLink: text("cta_link").notNull().default(""),
  isGlobal: boolean("is_global").notNull().default(false),
  order: integer("order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertAdSchema = createInsertSchema(ads).omit({ id: true, userId: true, createdAt: true });
export type InsertAd = z.infer<typeof insertAdSchema>;
export type Ad = typeof ads.$inferSelect;

export type AdBoardContent = {
  viewMode?: "grid" | "spotlight";
  rotationInterval?: number;
  showOwnAds?: boolean;
  showGlobalAds?: boolean;
};
