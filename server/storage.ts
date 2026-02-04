import { 
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
  type InsertDashboardLayout,
  type LayoutItem,
} from "@shared/schema";
import { randomUUID } from "crypto";

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
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private widgets: Map<string, Widget>;
  private layouts: Map<string, DashboardLayout>;
  private ventures: Map<string, Venture>;
  private priorities: Map<string, Priority>;
  private revenueData: Map<string, RevenueData>;

  constructor() {
    this.users = new Map();
    this.widgets = new Map();
    this.layouts = new Map();
    this.ventures = new Map();
    this.priorities = new Map();
    this.revenueData = new Map();
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  // Widgets
  async getWidgets(): Promise<Widget[]> {
    return Array.from(this.widgets.values());
  }

  async getWidget(id: string): Promise<Widget | undefined> {
    return this.widgets.get(id);
  }

  async createWidget(insertWidget: InsertWidget): Promise<Widget> {
    const id = randomUUID();
    const widget: Widget = { 
      id, 
      type: insertWidget.type,
      title: insertWidget.title,
      content: insertWidget.content ?? {},
      collapsed: insertWidget.collapsed ?? false,
      layout: insertWidget.layout ?? null,
    };
    this.widgets.set(id, widget);
    return widget;
  }

  async updateWidget(id: string, updates: Partial<Widget>): Promise<Widget | undefined> {
    const widget = this.widgets.get(id);
    if (!widget) return undefined;
    const updated = { ...widget, ...updates };
    this.widgets.set(id, updated);
    return updated;
  }

  async deleteWidget(id: string): Promise<boolean> {
    return this.widgets.delete(id);
  }

  // Dashboard Layouts
  async getLayout(userId: string): Promise<DashboardLayout | undefined> {
    return this.layouts.get(userId);
  }

  async saveLayout(userId: string, layouts: LayoutItem[]): Promise<DashboardLayout> {
    const existing = this.layouts.get(userId);
    if (existing) {
      const updated = { ...existing, layouts };
      this.layouts.set(userId, updated);
      return updated;
    }
    const layout: DashboardLayout = {
      id: randomUUID(),
      userId,
      layouts,
    };
    this.layouts.set(userId, layout);
    return layout;
  }

  // Ventures
  async getVentures(): Promise<Venture[]> {
    return Array.from(this.ventures.values());
  }

  async getVenture(id: string): Promise<Venture | undefined> {
    return this.ventures.get(id);
  }

  async createVenture(insertVenture: InsertVenture): Promise<Venture> {
    const id = randomUUID();
    const venture: Venture = { 
      id, 
      name: insertVenture.name,
      color: insertVenture.color ?? "#3B82F6",
    };
    this.ventures.set(id, venture);
    return venture;
  }

  async deleteVenture(id: string): Promise<boolean> {
    // Also delete associated priorities and revenue data
    for (const [priorityId, priority] of this.priorities.entries()) {
      if (priority.ventureId === id) {
        this.priorities.delete(priorityId);
      }
    }
    for (const [revenueId, revenue] of this.revenueData.entries()) {
      if (revenue.ventureId === id) {
        this.revenueData.delete(revenueId);
      }
    }
    return this.ventures.delete(id);
  }

  // Priorities
  async getPriorities(ventureId: string): Promise<Priority[]> {
    return Array.from(this.priorities.values())
      .filter((p) => p.ventureId === ventureId)
      .sort((a, b) => a.order - b.order);
  }

  async createPriority(insertPriority: InsertPriority): Promise<Priority> {
    const id = randomUUID();
    const priority: Priority = { 
      id, 
      ventureId: insertPriority.ventureId,
      text: insertPriority.text,
      completed: insertPriority.completed ?? false,
      order: insertPriority.order ?? 0,
    };
    this.priorities.set(id, priority);
    return priority;
  }

  async updatePriority(id: string, updates: Partial<Priority>): Promise<Priority | undefined> {
    const priority = this.priorities.get(id);
    if (!priority) return undefined;
    const updated = { ...priority, ...updates };
    this.priorities.set(id, updated);
    return updated;
  }

  async deletePriority(id: string): Promise<boolean> {
    return this.priorities.delete(id);
  }

  // Revenue Data
  async getRevenueData(ventureId: string): Promise<RevenueData[]> {
    return Array.from(this.revenueData.values()).filter(
      (r) => r.ventureId === ventureId
    );
  }

  async createRevenueData(insertData: InsertRevenueData): Promise<RevenueData> {
    const id = randomUUID();
    const data: RevenueData = { 
      id, 
      ventureId: insertData.ventureId,
      month: insertData.month,
      amount: insertData.amount ?? 0,
      year: insertData.year,
    };
    this.revenueData.set(id, data);
    return data;
  }
}

export const storage = new MemStorage();
