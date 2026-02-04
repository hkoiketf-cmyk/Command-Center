import { eq } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  widgets,
  ventures,
  priorities,
  revenueData,
  dashboardLayouts,
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
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Widgets
  getWidgets(): Promise<Widget[]>;
  getWidget(id: string): Promise<Widget | undefined>;
  createWidget(widget: InsertWidget): Promise<Widget>;
  updateWidget(id: string, updates: Partial<Widget>): Promise<Widget | undefined>;
  deleteWidget(id: string): Promise<boolean>;

  // Dashboard Layouts
  getLayout(userId: string): Promise<DashboardLayout | undefined>;
  saveLayout(userId: string, layouts: LayoutItem[]): Promise<DashboardLayout>;

  // Ventures
  getVentures(): Promise<Venture[]>;
  getVenture(id: string): Promise<Venture | undefined>;
  createVenture(venture: InsertVenture): Promise<Venture>;
  deleteVenture(id: string): Promise<boolean>;

  // Priorities
  getPriorities(ventureId: string): Promise<Priority[]>;
  createPriority(priority: InsertPriority): Promise<Priority>;
  updatePriority(id: string, updates: Partial<Priority>): Promise<Priority | undefined>;
  deletePriority(id: string): Promise<boolean>;

  // Revenue Data
  getRevenueData(ventureId: string): Promise<RevenueData[]>;
  createRevenueData(data: InsertRevenueData): Promise<RevenueData>;
  updateRevenueData(id: string, updates: Partial<RevenueData>): Promise<RevenueData | undefined>;
  deleteRevenueData(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  // Users
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

  // Widgets
  async getWidgets(): Promise<Widget[]> {
    return await db.select().from(widgets);
  }

  async getWidget(id: string): Promise<Widget | undefined> {
    const result = await db.select().from(widgets).where(eq(widgets.id, id));
    return result[0];
  }

  async createWidget(widget: InsertWidget): Promise<Widget> {
    const result = await db.insert(widgets).values(widget).returning();
    return result[0];
  }

  async updateWidget(id: string, updates: Partial<Widget>): Promise<Widget | undefined> {
    const result = await db
      .update(widgets)
      .set(updates)
      .where(eq(widgets.id, id))
      .returning();
    return result[0];
  }

  async deleteWidget(id: string): Promise<boolean> {
    const result = await db.delete(widgets).where(eq(widgets.id, id)).returning();
    return result.length > 0;
  }

  // Dashboard Layouts
  async getLayout(userId: string): Promise<DashboardLayout | undefined> {
    const result = await db
      .select()
      .from(dashboardLayouts)
      .where(eq(dashboardLayouts.userId, userId));
    return result[0];
  }

  async saveLayout(userId: string, layouts: LayoutItem[]): Promise<DashboardLayout> {
    const existing = await this.getLayout(userId);
    if (existing) {
      const result = await db
        .update(dashboardLayouts)
        .set({ layouts })
        .where(eq(dashboardLayouts.id, existing.id))
        .returning();
      return result[0];
    }
    const result = await db
      .insert(dashboardLayouts)
      .values({ userId, layouts })
      .returning();
    return result[0];
  }

  // Ventures
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
    // Priorities and revenue data will be cascade deleted due to FK constraints
    const result = await db.delete(ventures).where(eq(ventures.id, id)).returning();
    return result.length > 0;
  }

  // Priorities
  async getPriorities(ventureId: string): Promise<Priority[]> {
    return await db
      .select()
      .from(priorities)
      .where(eq(priorities.ventureId, ventureId))
      .orderBy(priorities.order);
  }

  async createPriority(priority: InsertPriority): Promise<Priority> {
    const result = await db.insert(priorities).values(priority).returning();
    return result[0];
  }

  async updatePriority(id: string, updates: Partial<Priority>): Promise<Priority | undefined> {
    const result = await db
      .update(priorities)
      .set(updates)
      .where(eq(priorities.id, id))
      .returning();
    return result[0];
  }

  async deletePriority(id: string): Promise<boolean> {
    const result = await db.delete(priorities).where(eq(priorities.id, id)).returning();
    return result.length > 0;
  }

  // Revenue Data
  async getRevenueData(ventureId: string): Promise<RevenueData[]> {
    return await db
      .select()
      .from(revenueData)
      .where(eq(revenueData.ventureId, ventureId));
  }

  async createRevenueData(data: InsertRevenueData): Promise<RevenueData> {
    const result = await db.insert(revenueData).values(data).returning();
    return result[0];
  }

  async updateRevenueData(id: string, updates: Partial<RevenueData>): Promise<RevenueData | undefined> {
    const result = await db
      .update(revenueData)
      .set(updates)
      .where(eq(revenueData.id, id))
      .returning();
    return result[0];
  }

  async deleteRevenueData(id: string): Promise<boolean> {
    const result = await db.delete(revenueData).where(eq(revenueData.id, id)).returning();
    return result.length > 0;
  }
}

export const storage = new DatabaseStorage();
