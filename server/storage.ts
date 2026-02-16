import { eq, and, desc } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  widgets,
  ventures,
  priorities,
  revenueData,
  dashboardLayouts,
  desktops,
  focusContracts,
  appSettings,
  captureItems,
  habits,
  habitEntries,
  journalEntries,
  scorecardMetrics,
  scorecardEntries,
  kpis,
  waitingItems,
  deals,
  timeBlocks,
  recurringExpenses,
  variableExpenses,
  meetings,
  type User,
  type InsertUser,
  type Widget,
  type InsertWidget,
  type Venture,
  type InsertVenture,
  type Priority,
  type InsertPriority,
  type RevenueData,
  type InsertRevenueData,
  type DashboardLayout,
  type LayoutItem,
  type Desktop,
  type InsertDesktop,
  type FocusContract,
  type InsertFocusContract,
  type AppSettings,
  type CaptureItem,
  type InsertCaptureItem,
  type Habit,
  type InsertHabit,
  type HabitEntry,
  type InsertHabitEntry,
  type JournalEntry,
  type InsertJournalEntry,
  type ScorecardMetric,
  type InsertScorecardMetric,
  type ScorecardEntry,
  type InsertScorecardEntry,
  type Kpi,
  type InsertKpi,
  type WaitingItem,
  type InsertWaitingItem,
  type Deal,
  type InsertDeal,
  type TimeBlock,
  type InsertTimeBlock,
  type RecurringExpense,
  type InsertRecurringExpense,
  type VariableExpense,
  type InsertVariableExpense,
  type Meeting,
  type InsertMeeting,
} from "@shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getDesktops(): Promise<Desktop[]>;
  getDesktop(id: string): Promise<Desktop | undefined>;
  createDesktop(desktop: InsertDesktop): Promise<Desktop>;
  updateDesktop(id: string, updates: Partial<Desktop>): Promise<Desktop | undefined>;
  deleteDesktop(id: string): Promise<boolean>;
  getWidgets(): Promise<Widget[]>;
  getWidgetsByDesktop(desktopId: string): Promise<Widget[]>;
  getWidget(id: string): Promise<Widget | undefined>;
  createWidget(widget: InsertWidget): Promise<Widget>;
  updateWidget(id: string, updates: Partial<Widget>): Promise<Widget | undefined>;
  deleteWidget(id: string): Promise<boolean>;
  getLayout(userId: string): Promise<DashboardLayout | undefined>;
  saveLayout(userId: string, layouts: LayoutItem[]): Promise<DashboardLayout>;
  getVentures(): Promise<Venture[]>;
  getVenture(id: string): Promise<Venture | undefined>;
  createVenture(venture: InsertVenture): Promise<Venture>;
  deleteVenture(id: string): Promise<boolean>;
  getPriorities(ventureId: string): Promise<Priority[]>;
  createPriority(priority: InsertPriority): Promise<Priority>;
  updatePriority(id: string, updates: Partial<Priority>): Promise<Priority | undefined>;
  deletePriority(id: string): Promise<boolean>;
  getRevenueData(ventureId: string): Promise<RevenueData[]>;
  createRevenueData(data: InsertRevenueData): Promise<RevenueData>;
  updateRevenueData(id: string, updates: Partial<RevenueData>): Promise<RevenueData | undefined>;
  deleteRevenueData(id: string): Promise<boolean>;
  getFocusContract(desktopId: string, date: string): Promise<FocusContract | undefined>;
  upsertFocusContract(data: InsertFocusContract): Promise<FocusContract>;
  getAppSettings(): Promise<AppSettings>;
  updateAppSettings(updates: Partial<AppSettings>): Promise<AppSettings>;
  getPinnedWidgets(): Promise<Widget[]>;
  // Quick Capture
  getCaptureItems(): Promise<CaptureItem[]>;
  createCaptureItem(item: InsertCaptureItem): Promise<CaptureItem>;
  updateCaptureItem(id: string, updates: Partial<CaptureItem>): Promise<CaptureItem | undefined>;
  deleteCaptureItem(id: string): Promise<boolean>;
  // Habits
  getHabits(): Promise<Habit[]>;
  createHabit(habit: InsertHabit): Promise<Habit>;
  deleteHabit(id: string): Promise<boolean>;
  getHabitEntries(habitId: string): Promise<HabitEntry[]>;
  getAllHabitEntries(): Promise<HabitEntry[]>;
  createHabitEntry(entry: InsertHabitEntry): Promise<HabitEntry>;
  deleteHabitEntry(habitId: string, date: string): Promise<boolean>;
  // Journal
  getJournalEntries(): Promise<JournalEntry[]>;
  getJournalEntry(date: string): Promise<JournalEntry | undefined>;
  upsertJournalEntry(data: InsertJournalEntry): Promise<JournalEntry>;
  // Scorecard
  getScorecardMetrics(): Promise<ScorecardMetric[]>;
  createScorecardMetric(metric: InsertScorecardMetric): Promise<ScorecardMetric>;
  updateScorecardMetric(id: string, updates: Partial<ScorecardMetric>): Promise<ScorecardMetric | undefined>;
  deleteScorecardMetric(id: string): Promise<boolean>;
  getScorecardEntries(metricId: string): Promise<ScorecardEntry[]>;
  getAllScorecardEntries(): Promise<ScorecardEntry[]>;
  upsertScorecardEntry(data: InsertScorecardEntry): Promise<ScorecardEntry>;
  // KPIs
  getKpis(): Promise<Kpi[]>;
  createKpi(kpi: InsertKpi): Promise<Kpi>;
  updateKpi(id: string, updates: Partial<Kpi>): Promise<Kpi | undefined>;
  deleteKpi(id: string): Promise<boolean>;
  // Waiting For
  getWaitingItems(): Promise<WaitingItem[]>;
  createWaitingItem(item: InsertWaitingItem): Promise<WaitingItem>;
  updateWaitingItem(id: string, updates: Partial<WaitingItem>): Promise<WaitingItem | undefined>;
  deleteWaitingItem(id: string): Promise<boolean>;
  // Deals
  getDeals(): Promise<Deal[]>;
  createDeal(deal: InsertDeal): Promise<Deal>;
  updateDeal(id: string, updates: Partial<Deal>): Promise<Deal | undefined>;
  deleteDeal(id: string): Promise<boolean>;
  // Time Blocks
  getTimeBlocks(date: string): Promise<TimeBlock[]>;
  createTimeBlock(block: InsertTimeBlock): Promise<TimeBlock>;
  updateTimeBlock(id: string, updates: Partial<TimeBlock>): Promise<TimeBlock | undefined>;
  deleteTimeBlock(id: string): Promise<boolean>;
  // Expenses
  getRecurringExpenses(): Promise<RecurringExpense[]>;
  createRecurringExpense(expense: InsertRecurringExpense): Promise<RecurringExpense>;
  updateRecurringExpense(id: string, updates: Partial<RecurringExpense>): Promise<RecurringExpense | undefined>;
  deleteRecurringExpense(id: string): Promise<boolean>;
  getVariableExpenses(): Promise<VariableExpense[]>;
  createVariableExpense(expense: InsertVariableExpense): Promise<VariableExpense>;
  deleteVariableExpense(id: string): Promise<boolean>;
  // Meetings
  getMeetings(): Promise<Meeting[]>;
  createMeeting(meeting: InsertMeeting): Promise<Meeting>;
  updateMeeting(id: string, updates: Partial<Meeting>): Promise<Meeting | undefined>;
  deleteMeeting(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }
  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }
  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }
  async getDesktops(): Promise<Desktop[]> {
    return await db.select().from(desktops).orderBy(desktops.order);
  }
  async getDesktop(id: string): Promise<Desktop | undefined> {
    const result = await db.select().from(desktops).where(eq(desktops.id, id));
    return result[0];
  }
  async createDesktop(desktop: InsertDesktop): Promise<Desktop> {
    const result = await db.insert(desktops).values(desktop).returning();
    return result[0];
  }
  async updateDesktop(id: string, updates: Partial<Desktop>): Promise<Desktop | undefined> {
    const result = await db.update(desktops).set(updates).where(eq(desktops.id, id)).returning();
    return result[0];
  }
  async deleteDesktop(id: string): Promise<boolean> {
    await db.delete(widgets).where(eq(widgets.desktopId, id));
    const result = await db.delete(desktops).where(eq(desktops.id, id)).returning();
    return result.length > 0;
  }
  async getWidgets(): Promise<Widget[]> {
    return await db.select().from(widgets);
  }
  async getWidgetsByDesktop(desktopId: string): Promise<Widget[]> {
    return await db.select().from(widgets).where(eq(widgets.desktopId, desktopId));
  }
  async getWidget(id: string): Promise<Widget | undefined> {
    const result = await db.select().from(widgets).where(eq(widgets.id, id));
    return result[0];
  }
  async createWidget(widget: InsertWidget): Promise<Widget> {
    const result = await db.insert(widgets).values(widget as any).returning();
    return result[0];
  }
  async updateWidget(id: string, updates: Partial<Widget>): Promise<Widget | undefined> {
    const result = await db.update(widgets).set(updates).where(eq(widgets.id, id)).returning();
    return result[0];
  }
  async deleteWidget(id: string): Promise<boolean> {
    const result = await db.delete(widgets).where(eq(widgets.id, id)).returning();
    return result.length > 0;
  }
  async getLayout(userId: string): Promise<DashboardLayout | undefined> {
    const result = await db.select().from(dashboardLayouts).where(eq(dashboardLayouts.userId, userId));
    return result[0];
  }
  async saveLayout(userId: string, layouts: LayoutItem[]): Promise<DashboardLayout> {
    const existing = await this.getLayout(userId);
    if (existing) {
      const result = await db.update(dashboardLayouts).set({ layouts }).where(eq(dashboardLayouts.id, existing.id)).returning();
      return result[0];
    }
    const result = await db.insert(dashboardLayouts).values({ userId, layouts }).returning();
    return result[0];
  }
  async getVentures(): Promise<Venture[]> {
    return await db.select().from(ventures);
  }
  async getVenture(id: string): Promise<Venture | undefined> {
    const result = await db.select().from(ventures).where(eq(ventures.id, id));
    return result[0];
  }
  async createVenture(venture: InsertVenture): Promise<Venture> {
    const result = await db.insert(ventures).values(venture).returning();
    return result[0];
  }
  async deleteVenture(id: string): Promise<boolean> {
    const result = await db.delete(ventures).where(eq(ventures.id, id)).returning();
    return result.length > 0;
  }
  async getPriorities(ventureId: string): Promise<Priority[]> {
    return await db.select().from(priorities).where(eq(priorities.ventureId, ventureId)).orderBy(priorities.order);
  }
  async createPriority(priority: InsertPriority): Promise<Priority> {
    const result = await db.insert(priorities).values(priority).returning();
    return result[0];
  }
  async updatePriority(id: string, updates: Partial<Priority>): Promise<Priority | undefined> {
    const result = await db.update(priorities).set(updates).where(eq(priorities.id, id)).returning();
    return result[0];
  }
  async deletePriority(id: string): Promise<boolean> {
    const result = await db.delete(priorities).where(eq(priorities.id, id)).returning();
    return result.length > 0;
  }
  async getRevenueData(ventureId: string): Promise<RevenueData[]> {
    return await db.select().from(revenueData).where(eq(revenueData.ventureId, ventureId));
  }
  async createRevenueData(data: InsertRevenueData): Promise<RevenueData> {
    const result = await db.insert(revenueData).values(data).returning();
    return result[0];
  }
  async updateRevenueData(id: string, updates: Partial<RevenueData>): Promise<RevenueData | undefined> {
    const result = await db.update(revenueData).set(updates).where(eq(revenueData.id, id)).returning();
    return result[0];
  }
  async deleteRevenueData(id: string): Promise<boolean> {
    const result = await db.delete(revenueData).where(eq(revenueData.id, id)).returning();
    return result.length > 0;
  }
  async getFocusContract(desktopId: string, date: string): Promise<FocusContract | undefined> {
    const result = await db.select().from(focusContracts).where(and(eq(focusContracts.desktopId, desktopId), eq(focusContracts.date, date)));
    return result[0];
  }
  async upsertFocusContract(data: InsertFocusContract): Promise<FocusContract> {
    const existing = await this.getFocusContract(data.desktopId, data.date);
    const values = { ...data, top3: data.top3 as { text: string; done: boolean }[] | undefined, ignoreList: data.ignoreList as string[] | undefined };
    if (existing) {
      const result = await db.update(focusContracts).set(values).where(eq(focusContracts.id, existing.id)).returning();
      return result[0];
    }
    const result = await db.insert(focusContracts).values(values).returning();
    return result[0];
  }
  async getAppSettings(): Promise<AppSettings> {
    const result = await db.select().from(appSettings);
    if (result.length === 0) {
      const created = await db.insert(appSettings).values({}).returning();
      return created[0];
    }
    return result[0];
  }
  async updateAppSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.getAppSettings();
    const result = await db.update(appSettings).set(updates).where(eq(appSettings.id, current.id)).returning();
    return result[0];
  }
  async getPinnedWidgets(): Promise<Widget[]> {
    return await db.select().from(widgets).where(eq(widgets.pinnedAllDesktops, true));
  }

  // Quick Capture
  async getCaptureItems(): Promise<CaptureItem[]> {
    return await db.select().from(captureItems).orderBy(desc(captureItems.createdAt));
  }
  async createCaptureItem(item: InsertCaptureItem): Promise<CaptureItem> {
    const result = await db.insert(captureItems).values(item).returning();
    return result[0];
  }
  async updateCaptureItem(id: string, updates: Partial<CaptureItem>): Promise<CaptureItem | undefined> {
    const result = await db.update(captureItems).set(updates).where(eq(captureItems.id, id)).returning();
    return result[0];
  }
  async deleteCaptureItem(id: string): Promise<boolean> {
    const result = await db.delete(captureItems).where(eq(captureItems.id, id)).returning();
    return result.length > 0;
  }

  // Habits
  async getHabits(): Promise<Habit[]> {
    return await db.select().from(habits).orderBy(habits.order);
  }
  async createHabit(habit: InsertHabit): Promise<Habit> {
    const result = await db.insert(habits).values(habit).returning();
    return result[0];
  }
  async deleteHabit(id: string): Promise<boolean> {
    const result = await db.delete(habits).where(eq(habits.id, id)).returning();
    return result.length > 0;
  }
  async getHabitEntries(habitId: string): Promise<HabitEntry[]> {
    return await db.select().from(habitEntries).where(eq(habitEntries.habitId, habitId));
  }
  async getAllHabitEntries(): Promise<HabitEntry[]> {
    return await db.select().from(habitEntries);
  }
  async createHabitEntry(entry: InsertHabitEntry): Promise<HabitEntry> {
    const result = await db.insert(habitEntries).values(entry).returning();
    return result[0];
  }
  async deleteHabitEntry(habitId: string, date: string): Promise<boolean> {
    const result = await db.delete(habitEntries).where(and(eq(habitEntries.habitId, habitId), eq(habitEntries.date, date))).returning();
    return result.length > 0;
  }

  // Journal
  async getJournalEntries(): Promise<JournalEntry[]> {
    return await db.select().from(journalEntries).orderBy(desc(journalEntries.date));
  }
  async getJournalEntry(date: string): Promise<JournalEntry | undefined> {
    const result = await db.select().from(journalEntries).where(eq(journalEntries.date, date));
    return result[0];
  }
  async upsertJournalEntry(data: InsertJournalEntry): Promise<JournalEntry> {
    const existing = await this.getJournalEntry(data.date);
    if (existing) {
      const result = await db.update(journalEntries).set(data).where(eq(journalEntries.id, existing.id)).returning();
      return result[0];
    }
    const result = await db.insert(journalEntries).values(data).returning();
    return result[0];
  }

  // Scorecard
  async getScorecardMetrics(): Promise<ScorecardMetric[]> {
    return await db.select().from(scorecardMetrics).orderBy(scorecardMetrics.order);
  }
  async createScorecardMetric(metric: InsertScorecardMetric): Promise<ScorecardMetric> {
    const result = await db.insert(scorecardMetrics).values(metric).returning();
    return result[0];
  }
  async updateScorecardMetric(id: string, updates: Partial<ScorecardMetric>): Promise<ScorecardMetric | undefined> {
    const result = await db.update(scorecardMetrics).set(updates).where(eq(scorecardMetrics.id, id)).returning();
    return result[0];
  }
  async deleteScorecardMetric(id: string): Promise<boolean> {
    const result = await db.delete(scorecardMetrics).where(eq(scorecardMetrics.id, id)).returning();
    return result.length > 0;
  }
  async getScorecardEntries(metricId: string): Promise<ScorecardEntry[]> {
    return await db.select().from(scorecardEntries).where(eq(scorecardEntries.metricId, metricId));
  }
  async getAllScorecardEntries(): Promise<ScorecardEntry[]> {
    return await db.select().from(scorecardEntries);
  }
  async upsertScorecardEntry(data: InsertScorecardEntry): Promise<ScorecardEntry> {
    const existing = await db.select().from(scorecardEntries).where(and(eq(scorecardEntries.metricId, data.metricId), eq(scorecardEntries.weekStart, data.weekStart)));
    if (existing.length > 0) {
      const result = await db.update(scorecardEntries).set(data).where(eq(scorecardEntries.id, existing[0].id)).returning();
      return result[0];
    }
    const result = await db.insert(scorecardEntries).values(data).returning();
    return result[0];
  }

  // KPIs
  async getKpis(): Promise<Kpi[]> {
    return await db.select().from(kpis).orderBy(kpis.order);
  }
  async createKpi(kpi: InsertKpi): Promise<Kpi> {
    const result = await db.insert(kpis).values(kpi).returning();
    return result[0];
  }
  async updateKpi(id: string, updates: Partial<Kpi>): Promise<Kpi | undefined> {
    const result = await db.update(kpis).set(updates).where(eq(kpis.id, id)).returning();
    return result[0];
  }
  async deleteKpi(id: string): Promise<boolean> {
    const result = await db.delete(kpis).where(eq(kpis.id, id)).returning();
    return result.length > 0;
  }

  // Waiting For
  async getWaitingItems(): Promise<WaitingItem[]> {
    return await db.select().from(waitingItems);
  }
  async createWaitingItem(item: InsertWaitingItem): Promise<WaitingItem> {
    const result = await db.insert(waitingItems).values(item).returning();
    return result[0];
  }
  async updateWaitingItem(id: string, updates: Partial<WaitingItem>): Promise<WaitingItem | undefined> {
    const result = await db.update(waitingItems).set(updates).where(eq(waitingItems.id, id)).returning();
    return result[0];
  }
  async deleteWaitingItem(id: string): Promise<boolean> {
    const result = await db.delete(waitingItems).where(eq(waitingItems.id, id)).returning();
    return result.length > 0;
  }

  // Deals (CRM)
  async getDeals(): Promise<Deal[]> {
    return await db.select().from(deals);
  }
  async createDeal(deal: InsertDeal): Promise<Deal> {
    const result = await db.insert(deals).values(deal).returning();
    return result[0];
  }
  async updateDeal(id: string, updates: Partial<Deal>): Promise<Deal | undefined> {
    const result = await db.update(deals).set(updates).where(eq(deals.id, id)).returning();
    return result[0];
  }
  async deleteDeal(id: string): Promise<boolean> {
    const result = await db.delete(deals).where(eq(deals.id, id)).returning();
    return result.length > 0;
  }

  // Time Blocks
  async getTimeBlocks(date: string): Promise<TimeBlock[]> {
    return await db.select().from(timeBlocks).where(eq(timeBlocks.date, date));
  }
  async createTimeBlock(block: InsertTimeBlock): Promise<TimeBlock> {
    const result = await db.insert(timeBlocks).values(block).returning();
    return result[0];
  }
  async updateTimeBlock(id: string, updates: Partial<TimeBlock>): Promise<TimeBlock | undefined> {
    const result = await db.update(timeBlocks).set(updates).where(eq(timeBlocks.id, id)).returning();
    return result[0];
  }
  async deleteTimeBlock(id: string): Promise<boolean> {
    const result = await db.delete(timeBlocks).where(eq(timeBlocks.id, id)).returning();
    return result.length > 0;
  }

  // Expenses
  async getRecurringExpenses(): Promise<RecurringExpense[]> {
    return await db.select().from(recurringExpenses);
  }
  async createRecurringExpense(expense: InsertRecurringExpense): Promise<RecurringExpense> {
    const result = await db.insert(recurringExpenses).values(expense).returning();
    return result[0];
  }
  async updateRecurringExpense(id: string, updates: Partial<RecurringExpense>): Promise<RecurringExpense | undefined> {
    const result = await db.update(recurringExpenses).set(updates).where(eq(recurringExpenses.id, id)).returning();
    return result[0];
  }
  async deleteRecurringExpense(id: string): Promise<boolean> {
    const result = await db.delete(recurringExpenses).where(eq(recurringExpenses.id, id)).returning();
    return result.length > 0;
  }
  async getVariableExpenses(): Promise<VariableExpense[]> {
    return await db.select().from(variableExpenses).orderBy(desc(variableExpenses.date));
  }
  async createVariableExpense(expense: InsertVariableExpense): Promise<VariableExpense> {
    const result = await db.insert(variableExpenses).values(expense).returning();
    return result[0];
  }
  async deleteVariableExpense(id: string): Promise<boolean> {
    const result = await db.delete(variableExpenses).where(eq(variableExpenses.id, id)).returning();
    return result.length > 0;
  }

  // Meetings
  async getMeetings(): Promise<Meeting[]> {
    return await db.select().from(meetings).orderBy(meetings.date);
  }
  async createMeeting(meeting: InsertMeeting): Promise<Meeting> {
    const result = await db.insert(meetings).values(meeting as any).returning();
    return result[0];
  }
  async updateMeeting(id: string, updates: Partial<Meeting>): Promise<Meeting | undefined> {
    const result = await db.update(meetings).set(updates as any).where(eq(meetings.id, id)).returning();
    return result[0];
  }
  async deleteMeeting(id: string): Promise<boolean> {
    const result = await db.delete(meetings).where(eq(meetings.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
