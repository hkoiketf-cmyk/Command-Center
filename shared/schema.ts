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
export const widgetTypes = ["notes", "priorities", "revenue", "iframe", "code", "context_mode"] as const;
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
