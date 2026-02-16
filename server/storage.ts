import { eq, and, desc, sql } from "drizzle-orm";
import { db } from "./db";
import {
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
  userSettings,
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
  aiConversations,
  aiMessages,
  type AiConversation,
  type InsertAiConversation,
  type AiMessage,
  type InsertAiMessage,
  type UserSettings,
  accessCodes,
  type AccessCode,
  type InsertAccessCode,
  dashboardPresets,
  type DashboardPreset,
  type InsertDashboardPreset,
  platformAnnouncements,
  announcementReads,
  type PlatformAnnouncement,
  type InsertAnnouncement,
  users,
  type User,
} from "@shared/schema";

export interface IStorage {
  getUserById(userId: string): Promise<User | undefined>;
  updateUser(userId: string, updates: Partial<User>): Promise<User | undefined>;
  getDesktops(userId: string): Promise<Desktop[]>;
  getDesktop(userId: string, id: string): Promise<Desktop | undefined>;
  createDesktop(userId: string, desktop: InsertDesktop): Promise<Desktop>;
  updateDesktop(userId: string, id: string, updates: Partial<Desktop>): Promise<Desktop | undefined>;
  deleteDesktop(userId: string, id: string): Promise<boolean>;
  getWidgets(userId: string): Promise<Widget[]>;
  getWidgetsByDesktop(userId: string, desktopId: string): Promise<Widget[]>;
  getWidget(userId: string, id: string): Promise<Widget | undefined>;
  createWidget(userId: string, widget: InsertWidget): Promise<Widget>;
  updateWidget(userId: string, id: string, updates: Partial<Widget>): Promise<Widget | undefined>;
  deleteWidget(userId: string, id: string): Promise<boolean>;
  getLayout(userId: string): Promise<DashboardLayout | undefined>;
  saveLayout(userId: string, layouts: LayoutItem[]): Promise<DashboardLayout>;
  getVentures(userId: string): Promise<Venture[]>;
  getVenture(userId: string, id: string): Promise<Venture | undefined>;
  createVenture(userId: string, venture: InsertVenture): Promise<Venture>;
  deleteVenture(userId: string, id: string): Promise<boolean>;
  getPriorities(userId: string, ventureId: string): Promise<Priority[]>;
  createPriority(userId: string, priority: InsertPriority): Promise<Priority>;
  updatePriority(userId: string, id: string, updates: Partial<Priority>): Promise<Priority | undefined>;
  deletePriority(userId: string, id: string): Promise<boolean>;
  getRevenueData(userId: string, ventureId: string): Promise<RevenueData[]>;
  createRevenueData(userId: string, data: InsertRevenueData): Promise<RevenueData>;
  updateRevenueData(userId: string, id: string, updates: Partial<RevenueData>): Promise<RevenueData | undefined>;
  deleteRevenueData(userId: string, id: string): Promise<boolean>;
  getFocusContract(userId: string, desktopId: string, date: string): Promise<FocusContract | undefined>;
  upsertFocusContract(userId: string, data: InsertFocusContract): Promise<FocusContract>;
  getAppSettings(userId: string): Promise<AppSettings>;
  updateAppSettings(userId: string, updates: Partial<AppSettings>): Promise<AppSettings>;
  getPinnedWidgets(userId: string): Promise<Widget[]>;
  getCaptureItems(userId: string): Promise<CaptureItem[]>;
  createCaptureItem(userId: string, item: InsertCaptureItem): Promise<CaptureItem>;
  updateCaptureItem(userId: string, id: string, updates: Partial<CaptureItem>): Promise<CaptureItem | undefined>;
  deleteCaptureItem(userId: string, id: string): Promise<boolean>;
  getHabits(userId: string): Promise<Habit[]>;
  createHabit(userId: string, habit: InsertHabit): Promise<Habit>;
  updateHabit(userId: string, id: string, updates: Partial<Habit>): Promise<Habit | undefined>;
  deleteHabit(userId: string, id: string): Promise<boolean>;
  getHabitEntries(userId: string, habitId: string): Promise<HabitEntry[]>;
  getAllHabitEntries(userId: string): Promise<HabitEntry[]>;
  createHabitEntry(userId: string, entry: InsertHabitEntry): Promise<HabitEntry>;
  deleteHabitEntry(userId: string, habitId: string, date: string): Promise<boolean>;
  getJournalEntries(userId: string): Promise<JournalEntry[]>;
  getJournalEntry(userId: string, date: string): Promise<JournalEntry | undefined>;
  upsertJournalEntry(userId: string, data: InsertJournalEntry): Promise<JournalEntry>;
  getScorecardMetrics(userId: string): Promise<ScorecardMetric[]>;
  createScorecardMetric(userId: string, metric: InsertScorecardMetric): Promise<ScorecardMetric>;
  updateScorecardMetric(userId: string, id: string, updates: Partial<ScorecardMetric>): Promise<ScorecardMetric | undefined>;
  deleteScorecardMetric(userId: string, id: string): Promise<boolean>;
  getScorecardEntries(userId: string, metricId: string): Promise<ScorecardEntry[]>;
  getAllScorecardEntries(userId: string): Promise<ScorecardEntry[]>;
  upsertScorecardEntry(userId: string, data: InsertScorecardEntry): Promise<ScorecardEntry>;
  getKpis(userId: string): Promise<Kpi[]>;
  createKpi(userId: string, kpi: InsertKpi): Promise<Kpi>;
  updateKpi(userId: string, id: string, updates: Partial<Kpi>): Promise<Kpi | undefined>;
  deleteKpi(userId: string, id: string): Promise<boolean>;
  getWaitingItems(userId: string): Promise<WaitingItem[]>;
  createWaitingItem(userId: string, item: InsertWaitingItem): Promise<WaitingItem>;
  updateWaitingItem(userId: string, id: string, updates: Partial<WaitingItem>): Promise<WaitingItem | undefined>;
  deleteWaitingItem(userId: string, id: string): Promise<boolean>;
  getDeals(userId: string): Promise<Deal[]>;
  createDeal(userId: string, deal: InsertDeal): Promise<Deal>;
  updateDeal(userId: string, id: string, updates: Partial<Deal>): Promise<Deal | undefined>;
  deleteDeal(userId: string, id: string): Promise<boolean>;
  getTimeBlocks(userId: string, date: string): Promise<TimeBlock[]>;
  createTimeBlock(userId: string, block: InsertTimeBlock): Promise<TimeBlock>;
  updateTimeBlock(userId: string, id: string, updates: Partial<TimeBlock>): Promise<TimeBlock | undefined>;
  deleteTimeBlock(userId: string, id: string): Promise<boolean>;
  getRecurringExpenses(userId: string): Promise<RecurringExpense[]>;
  createRecurringExpense(userId: string, expense: InsertRecurringExpense): Promise<RecurringExpense>;
  updateRecurringExpense(userId: string, id: string, updates: Partial<RecurringExpense>): Promise<RecurringExpense | undefined>;
  deleteRecurringExpense(userId: string, id: string): Promise<boolean>;
  getVariableExpenses(userId: string): Promise<VariableExpense[]>;
  createVariableExpense(userId: string, expense: InsertVariableExpense): Promise<VariableExpense>;
  deleteVariableExpense(userId: string, id: string): Promise<boolean>;
  getMeetings(userId: string): Promise<Meeting[]>;
  createMeeting(userId: string, meeting: InsertMeeting): Promise<Meeting>;
  updateMeeting(userId: string, id: string, updates: Partial<Meeting>): Promise<Meeting | undefined>;
  deleteMeeting(userId: string, id: string): Promise<boolean>;
  getAiConversations(userId: string): Promise<AiConversation[]>;
  createAiConversation(userId: string, conv: InsertAiConversation): Promise<AiConversation>;
  deleteAiConversation(userId: string, id: string): Promise<boolean>;
  getAiMessages(userId: string, conversationId: string): Promise<AiMessage[]>;
  createAiMessage(userId: string, msg: InsertAiMessage): Promise<AiMessage>;
  getUserSettings(userId: string): Promise<UserSettings>;
  updateUserSettings(userId: string, updates: Partial<UserSettings>): Promise<UserSettings>;
  getAccessCodeByCode(code: string): Promise<AccessCode | undefined>;
  getAccessCodes(createdBy: string): Promise<AccessCode[]>;
  createAccessCode(data: InsertAccessCode): Promise<AccessCode>;
  incrementAccessCodeUsage(id: string): Promise<void>;
  getPresets(userId: string): Promise<DashboardPreset[]>;
  getPreset(id: string): Promise<DashboardPreset | undefined>;
  createPreset(data: InsertDashboardPreset): Promise<DashboardPreset>;
  updatePreset(userId: string, id: string, updates: Partial<DashboardPreset>): Promise<DashboardPreset | undefined>;
  deletePreset(userId: string, id: string): Promise<boolean>;
  getAnnouncements(): Promise<PlatformAnnouncement[]>;
  getAnnouncementsForUser(userId: string): Promise<(PlatformAnnouncement & { isRead: boolean })[]>;
  createAnnouncement(data: InsertAnnouncement): Promise<PlatformAnnouncement>;
  updateAnnouncement(id: string, updates: Partial<PlatformAnnouncement>): Promise<PlatformAnnouncement | undefined>;
  deleteAnnouncement(id: string): Promise<boolean>;
  markAnnouncementRead(userId: string, announcementId: string): Promise<void>;
  getAllUsers(): Promise<{ id: string; email: string | null; firstName: string | null; lastName: string | null }[]>;
}

export class DatabaseStorage implements IStorage {
  async getUserById(userId: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, userId));
    return result[0];
  }

  async updateUser(userId: string, updates: Partial<User>): Promise<User | undefined> {
    const result = await db.update(users).set({ ...updates, updatedAt: new Date() }).where(eq(users.id, userId)).returning();
    return result[0];
  }

  async getDesktops(userId: string): Promise<Desktop[]> {
    return await db.select().from(desktops).where(eq(desktops.userId, userId)).orderBy(desktops.order);
  }
  async getDesktop(userId: string, id: string): Promise<Desktop | undefined> {
    const result = await db.select().from(desktops).where(and(eq(desktops.id, id), eq(desktops.userId, userId)));
    return result[0];
  }
  async createDesktop(userId: string, desktop: InsertDesktop): Promise<Desktop> {
    const result = await db.insert(desktops).values({ ...desktop, userId }).returning();
    return result[0];
  }
  async updateDesktop(userId: string, id: string, updates: Partial<Desktop>): Promise<Desktop | undefined> {
    const result = await db.update(desktops).set(updates).where(and(eq(desktops.id, id), eq(desktops.userId, userId))).returning();
    return result[0];
  }
  async deleteDesktop(userId: string, id: string): Promise<boolean> {
    await db.delete(widgets).where(and(eq(widgets.desktopId, id), eq(widgets.userId, userId)));
    const result = await db.delete(desktops).where(and(eq(desktops.id, id), eq(desktops.userId, userId))).returning();
    return result.length > 0;
  }
  async getWidgets(userId: string): Promise<Widget[]> {
    return await db.select().from(widgets).where(eq(widgets.userId, userId));
  }
  async getWidgetsByDesktop(userId: string, desktopId: string): Promise<Widget[]> {
    return await db.select().from(widgets).where(and(eq(widgets.desktopId, desktopId), eq(widgets.userId, userId)));
  }
  async getWidget(userId: string, id: string): Promise<Widget | undefined> {
    const result = await db.select().from(widgets).where(and(eq(widgets.id, id), eq(widgets.userId, userId)));
    return result[0];
  }
  async createWidget(userId: string, widget: InsertWidget): Promise<Widget> {
    const result = await db.insert(widgets).values({ ...widget, userId } as any).returning();
    return result[0];
  }
  async updateWidget(userId: string, id: string, updates: Partial<Widget>): Promise<Widget | undefined> {
    const result = await db.update(widgets).set(updates).where(and(eq(widgets.id, id), eq(widgets.userId, userId))).returning();
    return result[0];
  }
  async deleteWidget(userId: string, id: string): Promise<boolean> {
    const result = await db.delete(widgets).where(and(eq(widgets.id, id), eq(widgets.userId, userId))).returning();
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
  async getVentures(userId: string): Promise<Venture[]> {
    return await db.select().from(ventures).where(eq(ventures.userId, userId));
  }
  async getVenture(userId: string, id: string): Promise<Venture | undefined> {
    const result = await db.select().from(ventures).where(and(eq(ventures.id, id), eq(ventures.userId, userId)));
    return result[0];
  }
  async createVenture(userId: string, venture: InsertVenture): Promise<Venture> {
    const result = await db.insert(ventures).values({ ...venture, userId }).returning();
    return result[0];
  }
  async deleteVenture(userId: string, id: string): Promise<boolean> {
    const result = await db.delete(ventures).where(and(eq(ventures.id, id), eq(ventures.userId, userId))).returning();
    return result.length > 0;
  }
  async getPriorities(userId: string, ventureId: string): Promise<Priority[]> {
    return await db.select().from(priorities).where(and(eq(priorities.userId, userId), eq(priorities.ventureId, ventureId))).orderBy(priorities.order);
  }
  async createPriority(userId: string, priority: InsertPriority): Promise<Priority> {
    const result = await db.insert(priorities).values({ ...priority, userId }).returning();
    return result[0];
  }
  async updatePriority(userId: string, id: string, updates: Partial<Priority>): Promise<Priority | undefined> {
    const result = await db.update(priorities).set(updates).where(and(eq(priorities.id, id), eq(priorities.userId, userId))).returning();
    return result[0];
  }
  async deletePriority(userId: string, id: string): Promise<boolean> {
    const result = await db.delete(priorities).where(and(eq(priorities.id, id), eq(priorities.userId, userId))).returning();
    return result.length > 0;
  }
  async getRevenueData(userId: string, ventureId: string): Promise<RevenueData[]> {
    return await db.select().from(revenueData).where(and(eq(revenueData.userId, userId), eq(revenueData.ventureId, ventureId)));
  }
  async createRevenueData(userId: string, data: InsertRevenueData): Promise<RevenueData> {
    const result = await db.insert(revenueData).values({ ...data, userId }).returning();
    return result[0];
  }
  async updateRevenueData(userId: string, id: string, updates: Partial<RevenueData>): Promise<RevenueData | undefined> {
    const result = await db.update(revenueData).set(updates).where(and(eq(revenueData.id, id), eq(revenueData.userId, userId))).returning();
    return result[0];
  }
  async deleteRevenueData(userId: string, id: string): Promise<boolean> {
    const result = await db.delete(revenueData).where(and(eq(revenueData.id, id), eq(revenueData.userId, userId))).returning();
    return result.length > 0;
  }
  async getFocusContract(userId: string, desktopId: string, date: string): Promise<FocusContract | undefined> {
    const result = await db.select().from(focusContracts).where(and(eq(focusContracts.desktopId, desktopId), eq(focusContracts.date, date), eq(focusContracts.userId, userId)));
    return result[0];
  }
  async upsertFocusContract(userId: string, data: InsertFocusContract): Promise<FocusContract> {
    const existing = await this.getFocusContract(userId, data.desktopId, data.date);
    const values = { ...data, userId, top3: data.top3 as { text: string; done: boolean }[] | undefined, ignoreList: data.ignoreList as string[] | undefined };
    if (existing) {
      const result = await db.update(focusContracts).set(values).where(eq(focusContracts.id, existing.id)).returning();
      return result[0];
    }
    const result = await db.insert(focusContracts).values(values).returning();
    return result[0];
  }
  async getAppSettings(userId: string): Promise<AppSettings> {
    const result = await db.select().from(appSettings).where(eq(appSettings.userId, userId));
    if (result.length === 0) {
      const created = await db.insert(appSettings).values({ userId }).returning();
      return created[0];
    }
    return result[0];
  }
  async updateAppSettings(userId: string, updates: Partial<AppSettings>): Promise<AppSettings> {
    const current = await this.getAppSettings(userId);
    const result = await db.update(appSettings).set(updates).where(eq(appSettings.id, current.id)).returning();
    return result[0];
  }
  async getPinnedWidgets(userId: string): Promise<Widget[]> {
    return await db.select().from(widgets).where(and(eq(widgets.pinnedAllDesktops, true), eq(widgets.userId, userId)));
  }

  // Quick Capture
  async getCaptureItems(userId: string): Promise<CaptureItem[]> {
    return await db.select().from(captureItems).where(eq(captureItems.userId, userId)).orderBy(desc(captureItems.createdAt));
  }
  async createCaptureItem(userId: string, item: InsertCaptureItem): Promise<CaptureItem> {
    const result = await db.insert(captureItems).values({ ...item, userId }).returning();
    return result[0];
  }
  async updateCaptureItem(userId: string, id: string, updates: Partial<CaptureItem>): Promise<CaptureItem | undefined> {
    const result = await db.update(captureItems).set(updates).where(and(eq(captureItems.id, id), eq(captureItems.userId, userId))).returning();
    return result[0];
  }
  async deleteCaptureItem(userId: string, id: string): Promise<boolean> {
    const result = await db.delete(captureItems).where(and(eq(captureItems.id, id), eq(captureItems.userId, userId))).returning();
    return result.length > 0;
  }

  // Habits
  async getHabits(userId: string): Promise<Habit[]> {
    return await db.select().from(habits).where(eq(habits.userId, userId)).orderBy(habits.order);
  }
  async createHabit(userId: string, habit: InsertHabit): Promise<Habit> {
    const result = await db.insert(habits).values({ ...habit, userId }).returning();
    return result[0];
  }
  async updateHabit(userId: string, id: string, updates: Partial<Habit>): Promise<Habit | undefined> {
    const result = await db.update(habits).set(updates).where(and(eq(habits.id, id), eq(habits.userId, userId))).returning();
    return result[0];
  }
  async deleteHabit(userId: string, id: string): Promise<boolean> {
    const result = await db.delete(habits).where(and(eq(habits.id, id), eq(habits.userId, userId))).returning();
    return result.length > 0;
  }
  async getHabitEntries(userId: string, habitId: string): Promise<HabitEntry[]> {
    return await db.select().from(habitEntries).where(and(eq(habitEntries.habitId, habitId), eq(habitEntries.userId, userId)));
  }
  async getAllHabitEntries(userId: string): Promise<HabitEntry[]> {
    return await db.select().from(habitEntries).where(eq(habitEntries.userId, userId));
  }
  async createHabitEntry(userId: string, entry: InsertHabitEntry): Promise<HabitEntry> {
    const result = await db.insert(habitEntries).values({ ...entry, userId }).returning();
    return result[0];
  }
  async deleteHabitEntry(userId: string, habitId: string, date: string): Promise<boolean> {
    const result = await db.delete(habitEntries).where(and(eq(habitEntries.habitId, habitId), eq(habitEntries.date, date), eq(habitEntries.userId, userId))).returning();
    return result.length > 0;
  }

  // Journal
  async getJournalEntries(userId: string): Promise<JournalEntry[]> {
    return await db.select().from(journalEntries).where(eq(journalEntries.userId, userId)).orderBy(desc(journalEntries.date));
  }
  async getJournalEntry(userId: string, date: string): Promise<JournalEntry | undefined> {
    const result = await db.select().from(journalEntries).where(and(eq(journalEntries.date, date), eq(journalEntries.userId, userId)));
    return result[0];
  }
  async upsertJournalEntry(userId: string, data: InsertJournalEntry): Promise<JournalEntry> {
    const existing = await this.getJournalEntry(userId, data.date);
    if (existing) {
      const result = await db.update(journalEntries).set(data).where(eq(journalEntries.id, existing.id)).returning();
      return result[0];
    }
    const result = await db.insert(journalEntries).values({ ...data, userId }).returning();
    return result[0];
  }

  // Scorecard
  async getScorecardMetrics(userId: string): Promise<ScorecardMetric[]> {
    return await db.select().from(scorecardMetrics).where(eq(scorecardMetrics.userId, userId)).orderBy(scorecardMetrics.order);
  }
  async createScorecardMetric(userId: string, metric: InsertScorecardMetric): Promise<ScorecardMetric> {
    const result = await db.insert(scorecardMetrics).values({ ...metric, userId }).returning();
    return result[0];
  }
  async updateScorecardMetric(userId: string, id: string, updates: Partial<ScorecardMetric>): Promise<ScorecardMetric | undefined> {
    const result = await db.update(scorecardMetrics).set(updates).where(and(eq(scorecardMetrics.id, id), eq(scorecardMetrics.userId, userId))).returning();
    return result[0];
  }
  async deleteScorecardMetric(userId: string, id: string): Promise<boolean> {
    const result = await db.delete(scorecardMetrics).where(and(eq(scorecardMetrics.id, id), eq(scorecardMetrics.userId, userId))).returning();
    return result.length > 0;
  }
  async getScorecardEntries(userId: string, metricId: string): Promise<ScorecardEntry[]> {
    return await db.select().from(scorecardEntries).where(and(eq(scorecardEntries.metricId, metricId), eq(scorecardEntries.userId, userId)));
  }
  async getAllScorecardEntries(userId: string): Promise<ScorecardEntry[]> {
    return await db.select().from(scorecardEntries).where(eq(scorecardEntries.userId, userId));
  }
  async upsertScorecardEntry(userId: string, data: InsertScorecardEntry): Promise<ScorecardEntry> {
    const existing = await db.select().from(scorecardEntries).where(and(eq(scorecardEntries.metricId, data.metricId), eq(scorecardEntries.weekStart, data.weekStart), eq(scorecardEntries.userId, userId)));
    if (existing.length > 0) {
      const result = await db.update(scorecardEntries).set(data).where(eq(scorecardEntries.id, existing[0].id)).returning();
      return result[0];
    }
    const result = await db.insert(scorecardEntries).values({ ...data, userId }).returning();
    return result[0];
  }

  // KPIs
  async getKpis(userId: string): Promise<Kpi[]> {
    return await db.select().from(kpis).where(eq(kpis.userId, userId)).orderBy(kpis.order);
  }
  async createKpi(userId: string, kpi: InsertKpi): Promise<Kpi> {
    const result = await db.insert(kpis).values({ ...kpi, userId }).returning();
    return result[0];
  }
  async updateKpi(userId: string, id: string, updates: Partial<Kpi>): Promise<Kpi | undefined> {
    const result = await db.update(kpis).set(updates).where(and(eq(kpis.id, id), eq(kpis.userId, userId))).returning();
    return result[0];
  }
  async deleteKpi(userId: string, id: string): Promise<boolean> {
    const result = await db.delete(kpis).where(and(eq(kpis.id, id), eq(kpis.userId, userId))).returning();
    return result.length > 0;
  }

  // Waiting For
  async getWaitingItems(userId: string): Promise<WaitingItem[]> {
    return await db.select().from(waitingItems).where(eq(waitingItems.userId, userId));
  }
  async createWaitingItem(userId: string, item: InsertWaitingItem): Promise<WaitingItem> {
    const result = await db.insert(waitingItems).values({ ...item, userId }).returning();
    return result[0];
  }
  async updateWaitingItem(userId: string, id: string, updates: Partial<WaitingItem>): Promise<WaitingItem | undefined> {
    const result = await db.update(waitingItems).set(updates).where(and(eq(waitingItems.id, id), eq(waitingItems.userId, userId))).returning();
    return result[0];
  }
  async deleteWaitingItem(userId: string, id: string): Promise<boolean> {
    const result = await db.delete(waitingItems).where(and(eq(waitingItems.id, id), eq(waitingItems.userId, userId))).returning();
    return result.length > 0;
  }

  // Deals (CRM)
  async getDeals(userId: string): Promise<Deal[]> {
    return await db.select().from(deals).where(eq(deals.userId, userId));
  }
  async createDeal(userId: string, deal: InsertDeal): Promise<Deal> {
    const result = await db.insert(deals).values({ ...deal, userId }).returning();
    return result[0];
  }
  async updateDeal(userId: string, id: string, updates: Partial<Deal>): Promise<Deal | undefined> {
    const result = await db.update(deals).set(updates).where(and(eq(deals.id, id), eq(deals.userId, userId))).returning();
    return result[0];
  }
  async deleteDeal(userId: string, id: string): Promise<boolean> {
    const result = await db.delete(deals).where(and(eq(deals.id, id), eq(deals.userId, userId))).returning();
    return result.length > 0;
  }

  // Time Blocks
  async getTimeBlocks(userId: string, date: string): Promise<TimeBlock[]> {
    return await db.select().from(timeBlocks).where(and(eq(timeBlocks.date, date), eq(timeBlocks.userId, userId)));
  }
  async createTimeBlock(userId: string, block: InsertTimeBlock): Promise<TimeBlock> {
    const result = await db.insert(timeBlocks).values({ ...block, userId }).returning();
    return result[0];
  }
  async updateTimeBlock(userId: string, id: string, updates: Partial<TimeBlock>): Promise<TimeBlock | undefined> {
    const result = await db.update(timeBlocks).set(updates).where(and(eq(timeBlocks.id, id), eq(timeBlocks.userId, userId))).returning();
    return result[0];
  }
  async deleteTimeBlock(userId: string, id: string): Promise<boolean> {
    const result = await db.delete(timeBlocks).where(and(eq(timeBlocks.id, id), eq(timeBlocks.userId, userId))).returning();
    return result.length > 0;
  }

  // Expenses
  async getRecurringExpenses(userId: string): Promise<RecurringExpense[]> {
    return await db.select().from(recurringExpenses).where(eq(recurringExpenses.userId, userId));
  }
  async createRecurringExpense(userId: string, expense: InsertRecurringExpense): Promise<RecurringExpense> {
    const result = await db.insert(recurringExpenses).values({ ...expense, userId }).returning();
    return result[0];
  }
  async updateRecurringExpense(userId: string, id: string, updates: Partial<RecurringExpense>): Promise<RecurringExpense | undefined> {
    const result = await db.update(recurringExpenses).set(updates).where(and(eq(recurringExpenses.id, id), eq(recurringExpenses.userId, userId))).returning();
    return result[0];
  }
  async deleteRecurringExpense(userId: string, id: string): Promise<boolean> {
    const result = await db.delete(recurringExpenses).where(and(eq(recurringExpenses.id, id), eq(recurringExpenses.userId, userId))).returning();
    return result.length > 0;
  }
  async getVariableExpenses(userId: string): Promise<VariableExpense[]> {
    return await db.select().from(variableExpenses).where(eq(variableExpenses.userId, userId)).orderBy(desc(variableExpenses.date));
  }
  async createVariableExpense(userId: string, expense: InsertVariableExpense): Promise<VariableExpense> {
    const result = await db.insert(variableExpenses).values({ ...expense, userId }).returning();
    return result[0];
  }
  async deleteVariableExpense(userId: string, id: string): Promise<boolean> {
    const result = await db.delete(variableExpenses).where(and(eq(variableExpenses.id, id), eq(variableExpenses.userId, userId))).returning();
    return result.length > 0;
  }

  // Meetings
  async getMeetings(userId: string): Promise<Meeting[]> {
    return await db.select().from(meetings).where(eq(meetings.userId, userId)).orderBy(meetings.date);
  }
  async createMeeting(userId: string, meeting: InsertMeeting): Promise<Meeting> {
    const result = await db.insert(meetings).values({ ...meeting, userId } as any).returning();
    return result[0];
  }
  async updateMeeting(userId: string, id: string, updates: Partial<Meeting>): Promise<Meeting | undefined> {
    const result = await db.update(meetings).set(updates as any).where(and(eq(meetings.id, id), eq(meetings.userId, userId))).returning();
    return result[0];
  }
  async deleteMeeting(userId: string, id: string): Promise<boolean> {
    const result = await db.delete(meetings).where(and(eq(meetings.id, id), eq(meetings.userId, userId))).returning();
    return result.length > 0;
  }

  // AI Chat
  async getAiConversations(userId: string): Promise<AiConversation[]> {
    return await db.select().from(aiConversations).where(eq(aiConversations.userId, userId)).orderBy(desc(aiConversations.createdAt));
  }
  async createAiConversation(userId: string, conv: InsertAiConversation): Promise<AiConversation> {
    const result = await db.insert(aiConversations).values({ ...conv, userId } as any).returning();
    return result[0];
  }
  async deleteAiConversation(userId: string, id: string): Promise<boolean> {
    await db.delete(aiMessages).where(and(eq(aiMessages.conversationId, id), eq(aiMessages.userId, userId)));
    const result = await db.delete(aiConversations).where(and(eq(aiConversations.id, id), eq(aiConversations.userId, userId))).returning();
    return result.length > 0;
  }
  async getAiMessages(userId: string, conversationId: string): Promise<AiMessage[]> {
    return await db.select().from(aiMessages).where(and(eq(aiMessages.conversationId, conversationId), eq(aiMessages.userId, userId))).orderBy(aiMessages.createdAt);
  }
  async createAiMessage(userId: string, msg: InsertAiMessage): Promise<AiMessage> {
    const result = await db.insert(aiMessages).values({ ...msg, userId } as any).returning();
    return result[0];
  }

  // User Settings
  async getUserSettings(userId: string): Promise<UserSettings> {
    const result = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    if (result.length === 0) {
      const created = await db.insert(userSettings).values({ userId }).returning();
      return created[0];
    }
    return result[0];
  }
  async updateUserSettings(userId: string, updates: Partial<UserSettings>): Promise<UserSettings> {
    const current = await this.getUserSettings(userId);
    const result = await db.update(userSettings).set(updates).where(eq(userSettings.id, current.id)).returning();
    return result[0];
  }

  async getAccessCodeByCode(code: string): Promise<AccessCode | undefined> {
    const result = await db.select().from(accessCodes).where(eq(accessCodes.code, code));
    return result[0];
  }
  async getAccessCodes(createdBy: string): Promise<AccessCode[]> {
    return await db.select().from(accessCodes).where(eq(accessCodes.createdBy, createdBy)).orderBy(desc(accessCodes.createdAt));
  }
  async createAccessCode(data: InsertAccessCode): Promise<AccessCode> {
    const result = await db.insert(accessCodes).values(data).returning();
    return result[0];
  }
  async incrementAccessCodeUsage(id: string): Promise<void> {
    await db.execute(sql`UPDATE access_codes SET used_count = used_count + 1 WHERE id = ${id}`);
  }

  async getPresets(userId: string): Promise<DashboardPreset[]> {
    return await db.select().from(dashboardPresets)
      .where(sql`${dashboardPresets.userId} = ${userId} OR ${dashboardPresets.isPublic} = true`)
      .orderBy(desc(dashboardPresets.createdAt));
  }

  async getPreset(id: string): Promise<DashboardPreset | undefined> {
    const result = await db.select().from(dashboardPresets).where(eq(dashboardPresets.id, id));
    return result[0];
  }

  async createPreset(data: InsertDashboardPreset): Promise<DashboardPreset> {
    const result = await db.insert(dashboardPresets).values(data).returning();
    return result[0];
  }

  async updatePreset(userId: string, id: string, updates: Partial<DashboardPreset>): Promise<DashboardPreset | undefined> {
    const result = await db.update(dashboardPresets).set(updates)
      .where(and(eq(dashboardPresets.id, id), eq(dashboardPresets.userId, userId)))
      .returning();
    return result[0];
  }

  async deletePreset(userId: string, id: string): Promise<boolean> {
    const result = await db.delete(dashboardPresets)
      .where(and(eq(dashboardPresets.id, id), eq(dashboardPresets.userId, userId)))
      .returning();
    return result.length > 0;
  }

  async getAnnouncements(): Promise<PlatformAnnouncement[]> {
    return await db.select().from(platformAnnouncements).orderBy(desc(platformAnnouncements.createdAt));
  }

  async getAnnouncementsForUser(userId: string): Promise<(PlatformAnnouncement & { isRead: boolean })[]> {
    const allAnnouncements = await db.select().from(platformAnnouncements)
      .where(eq(platformAnnouncements.isActive, true))
      .orderBy(desc(platformAnnouncements.createdAt));
    const reads = await db.select().from(announcementReads)
      .where(eq(announcementReads.userId, userId));
    const readIds = new Set(reads.map(r => r.announcementId));
    return allAnnouncements
      .filter(a => a.targetType === "all" || (a.targetUserIds && a.targetUserIds.includes(userId)))
      .map(a => ({ ...a, isRead: readIds.has(a.id) }));
  }

  async createAnnouncement(data: InsertAnnouncement): Promise<PlatformAnnouncement> {
    const result = await db.insert(platformAnnouncements).values(data).returning();
    return result[0];
  }

  async updateAnnouncement(id: string, updates: Partial<PlatformAnnouncement>): Promise<PlatformAnnouncement | undefined> {
    const result = await db.update(platformAnnouncements).set(updates)
      .where(eq(platformAnnouncements.id, id)).returning();
    return result[0];
  }

  async deleteAnnouncement(id: string): Promise<boolean> {
    await db.delete(announcementReads).where(eq(announcementReads.announcementId, id));
    const result = await db.delete(platformAnnouncements)
      .where(eq(platformAnnouncements.id, id)).returning();
    return result.length > 0;
  }

  async markAnnouncementRead(userId: string, announcementId: string): Promise<void> {
    const existing = await db.select().from(announcementReads)
      .where(and(eq(announcementReads.userId, userId), eq(announcementReads.announcementId, announcementId)));
    if (existing.length === 0) {
      await db.insert(announcementReads).values({ userId, announcementId });
    }
  }

  async getAllUsers(): Promise<{ id: string; email: string | null; firstName: string | null; lastName: string | null }[]> {
    const result = await db.select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
    }).from(users);
    return result;
  }
}

export const storage = new DatabaseStorage();
