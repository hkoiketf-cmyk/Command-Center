import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWidgetSchema, insertVentureSchema, insertPrioritySchema, insertRevenueDataSchema, insertDesktopSchema, insertFocusContractSchema, insertCaptureItemSchema, insertHabitSchema, insertHabitEntrySchema, insertJournalEntrySchema, insertScorecardMetricSchema, insertScorecardEntrySchema, insertKpiSchema, insertWaitingItemSchema, insertDealSchema, insertTimeBlockSchema, insertRecurringExpenseSchema, insertVariableExpenseSchema, insertMeetingSchema, insertAiConversationSchema, insertAiMessageSchema } from "@shared/schema";
import { z } from "zod";
import OpenAI from "openai";
import { listCalendars, listEvents } from "./google-calendar";
import { isAuthenticated } from "./replit_integrations/auth";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import { sql } from "drizzle-orm";
import { db } from "./db";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const getUserId = (req: any): string => req.user?.claims?.sub;

  // ============ DESKTOPS ============

  app.get("/api/desktops", isAuthenticated, async (req, res) => {
    try {
      const desktopList = await storage.getDesktops(getUserId(req));
      res.json(desktopList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch desktops" });
    }
  });

  app.post("/api/desktops", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertDesktopSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const desktop = await storage.createDesktop(getUserId(req), parsed.data);
      res.status(201).json(desktop);
    } catch (error) {
      res.status(500).json({ error: "Failed to create desktop" });
    }
  });

  app.patch("/api/desktops/:id", isAuthenticated, async (req, res) => {
    try {
      const desktop = await storage.updateDesktop(getUserId(req), req.params.id, req.body);
      if (!desktop) {
        return res.status(404).json({ error: "Desktop not found" });
      }
      res.json(desktop);
    } catch (error) {
      res.status(500).json({ error: "Failed to update desktop" });
    }
  });

  app.delete("/api/desktops/:id", isAuthenticated, async (req, res) => {
    try {
      const deleted = await storage.deleteDesktop(getUserId(req), req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Desktop not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete desktop" });
    }
  });

  // ============ WIDGETS ============
  
  app.get("/api/widgets", isAuthenticated, async (req, res) => {
    try {
      const desktopId = req.query.desktopId as string | undefined;
      if (desktopId) {
        const widgetList = await storage.getWidgetsByDesktop(getUserId(req), desktopId);
        res.json(widgetList);
      } else {
        const widgetList = await storage.getWidgets(getUserId(req));
        res.json(widgetList);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch widgets" });
    }
  });

  app.get("/api/widgets/pinned", isAuthenticated, async (req, res) => {
    try {
      const pinnedWidgets = await storage.getPinnedWidgets(getUserId(req));
      res.json(pinnedWidgets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pinned widgets" });
    }
  });

  app.post("/api/widgets", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertWidgetSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const widget = await storage.createWidget(getUserId(req), parsed.data);
      res.status(201).json(widget);
    } catch (error) {
      res.status(500).json({ error: "Failed to create widget" });
    }
  });

  app.patch("/api/widgets/:id", isAuthenticated, async (req, res) => {
    try {
      const widget = await storage.updateWidget(getUserId(req), req.params.id, req.body);
      if (!widget) {
        return res.status(404).json({ error: "Widget not found" });
      }
      res.json(widget);
    } catch (error) {
      res.status(500).json({ error: "Failed to update widget" });
    }
  });

  app.delete("/api/widgets/:id", isAuthenticated, async (req, res) => {
    try {
      const deleted = await storage.deleteWidget(getUserId(req), req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Widget not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete widget" });
    }
  });

  // ============ LAYOUT ============

  app.get("/api/layout", isAuthenticated, async (req, res) => {
    try {
      const layout = await storage.getLayout(getUserId(req));
      res.json(layout || { layouts: [] });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch layout" });
    }
  });

  app.put("/api/layout", isAuthenticated, async (req, res) => {
    try {
      const { layouts } = req.body;
      const layout = await storage.saveLayout(getUserId(req), layouts || []);
      res.json(layout);
    } catch (error) {
      res.status(500).json({ error: "Failed to save layout" });
    }
  });

  // ============ VENTURES ============

  app.get("/api/ventures", isAuthenticated, async (req, res) => {
    try {
      const ventureList = await storage.getVentures(getUserId(req));
      res.json(ventureList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ventures" });
    }
  });

  app.post("/api/ventures", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertVentureSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const venture = await storage.createVenture(getUserId(req), parsed.data);
      res.status(201).json(venture);
    } catch (error) {
      res.status(500).json({ error: "Failed to create venture" });
    }
  });

  app.delete("/api/ventures/:id", isAuthenticated, async (req, res) => {
    try {
      const deleted = await storage.deleteVenture(getUserId(req), req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Venture not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete venture" });
    }
  });

  // ============ PRIORITIES ============

  app.get("/api/priorities/:ventureId", isAuthenticated, async (req, res) => {
    try {
      const priorityList = await storage.getPriorities(getUserId(req), req.params.ventureId);
      res.json(priorityList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch priorities" });
    }
  });

  app.post("/api/priorities", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertPrioritySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      
      const existing = await storage.getPriorities(getUserId(req), parsed.data.ventureId);
      if (existing.length >= 3) {
        return res.status(400).json({ error: "Maximum 3 priorities per venture" });
      }
      
      const priority = await storage.createPriority(getUserId(req), parsed.data);
      res.status(201).json(priority);
    } catch (error) {
      res.status(500).json({ error: "Failed to create priority" });
    }
  });

  app.patch("/api/priorities/:id", isAuthenticated, async (req, res) => {
    try {
      const priority = await storage.updatePriority(getUserId(req), req.params.id, req.body);
      if (!priority) {
        return res.status(404).json({ error: "Priority not found" });
      }
      res.json(priority);
    } catch (error) {
      res.status(500).json({ error: "Failed to update priority" });
    }
  });

  app.delete("/api/priorities/:id", isAuthenticated, async (req, res) => {
    try {
      const deleted = await storage.deletePriority(getUserId(req), req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Priority not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete priority" });
    }
  });

  // ============ REVENUE ============

  app.get("/api/revenue/:ventureId", isAuthenticated, async (req, res) => {
    try {
      const data = await storage.getRevenueData(getUserId(req), req.params.ventureId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch revenue data" });
    }
  });

  app.post("/api/revenue", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertRevenueDataSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const data = await storage.createRevenueData(getUserId(req), parsed.data);
      res.status(201).json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to create revenue data" });
    }
  });

  app.patch("/api/revenue/:id", isAuthenticated, async (req, res) => {
    try {
      const data = await storage.updateRevenueData(getUserId(req), req.params.id, req.body);
      if (!data) {
        return res.status(404).json({ error: "Revenue data not found" });
      }
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to update revenue data" });
    }
  });

  app.delete("/api/revenue/:id", isAuthenticated, async (req, res) => {
    try {
      const deleted = await storage.deleteRevenueData(getUserId(req), req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Revenue data not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete revenue data" });
    }
  });

  // ============ FOCUS CONTRACTS ============

  app.get("/api/focus-contracts", isAuthenticated, async (req, res) => {
    try {
      const { desktopId, date } = req.query;
      if (!desktopId || !date) {
        return res.status(400).json({ error: "desktopId and date are required" });
      }
      const contract = await storage.getFocusContract(getUserId(req), desktopId as string, date as string);
      res.json(contract || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch focus contract" });
    }
  });

  app.put("/api/focus-contracts", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertFocusContractSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const contract = await storage.upsertFocusContract(getUserId(req), parsed.data);
      res.json(contract);
    } catch (error) {
      res.status(500).json({ error: "Failed to save focus contract" });
    }
  });

  // ============ APP SETTINGS ============

  app.get("/api/settings", isAuthenticated, async (req, res) => {
    try {
      const settings = await storage.getAppSettings(getUserId(req));
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.patch("/api/settings", isAuthenticated, async (req, res) => {
    try {
      const settings = await storage.updateAppSettings(getUserId(req), req.body);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // ============ QUICK CAPTURE ============

  app.get("/api/capture-items", isAuthenticated, async (req, res) => {
    try {
      const items = await storage.getCaptureItems(getUserId(req));
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch capture items" });
    }
  });

  app.post("/api/capture-items", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertCaptureItemSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
      const item = await storage.createCaptureItem(getUserId(req), parsed.data);
      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to create capture item" });
    }
  });

  app.patch("/api/capture-items/:id", isAuthenticated, async (req, res) => {
    try {
      const item = await storage.updateCaptureItem(getUserId(req), req.params.id, req.body);
      if (!item) return res.status(404).json({ error: "Item not found" });
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update capture item" });
    }
  });

  app.delete("/api/capture-items/:id", isAuthenticated, async (req, res) => {
    try {
      const deleted = await storage.deleteCaptureItem(getUserId(req), req.params.id);
      if (!deleted) return res.status(404).json({ error: "Item not found" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete capture item" });
    }
  });

  // ============ HABITS ============

  app.get("/api/habits", isAuthenticated, async (req, res) => {
    try {
      const habitList = await storage.getHabits(getUserId(req));
      res.json(habitList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch habits" });
    }
  });

  app.post("/api/habits", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertHabitSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
      const habit = await storage.createHabit(getUserId(req), parsed.data);
      res.status(201).json(habit);
    } catch (error) {
      res.status(500).json({ error: "Failed to create habit" });
    }
  });

  app.patch("/api/habits/:id", isAuthenticated, async (req, res) => {
    try {
      const allowedFields: Record<string, any> = {};
      if (req.body.name !== undefined) allowedFields.name = req.body.name;
      if (req.body.color !== undefined) allowedFields.color = req.body.color;
      if (req.body.order !== undefined) allowedFields.order = req.body.order;
      const habit = await storage.updateHabit(getUserId(req), req.params.id, allowedFields);
      if (!habit) return res.status(404).json({ error: "Habit not found" });
      res.json(habit);
    } catch (error) {
      res.status(500).json({ error: "Failed to update habit" });
    }
  });

  app.delete("/api/habits/:id", isAuthenticated, async (req, res) => {
    try {
      const deleted = await storage.deleteHabit(getUserId(req), req.params.id);
      if (!deleted) return res.status(404).json({ error: "Habit not found" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete habit" });
    }
  });

  app.get("/api/habit-entries", isAuthenticated, async (req, res) => {
    try {
      const entries = await storage.getAllHabitEntries(getUserId(req));
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch habit entries" });
    }
  });

  app.post("/api/habit-entries", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertHabitEntrySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
      const entry = await storage.createHabitEntry(getUserId(req), parsed.data);
      res.status(201).json(entry);
    } catch (error) {
      res.status(500).json({ error: "Failed to create habit entry" });
    }
  });

  app.delete("/api/habit-entries/:habitId/:date", isAuthenticated, async (req, res) => {
    try {
      const deleted = await storage.deleteHabitEntry(getUserId(req), req.params.habitId, req.params.date);
      if (!deleted) return res.status(404).json({ error: "Entry not found" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete habit entry" });
    }
  });

  // ============ JOURNAL ============

  app.get("/api/journal", isAuthenticated, async (req, res) => {
    try {
      const entries = await storage.getJournalEntries(getUserId(req));
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch journal entries" });
    }
  });

  app.get("/api/journal/:date", isAuthenticated, async (req, res) => {
    try {
      const entry = await storage.getJournalEntry(getUserId(req), req.params.date);
      res.json(entry || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch journal entry" });
    }
  });

  app.put("/api/journal", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertJournalEntrySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
      const entry = await storage.upsertJournalEntry(getUserId(req), parsed.data);
      res.json(entry);
    } catch (error) {
      res.status(500).json({ error: "Failed to save journal entry" });
    }
  });

  // ============ SCORECARD ============

  app.get("/api/scorecard-metrics", isAuthenticated, async (req, res) => {
    try {
      const metrics = await storage.getScorecardMetrics(getUserId(req));
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scorecard metrics" });
    }
  });

  app.post("/api/scorecard-metrics", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertScorecardMetricSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
      const metric = await storage.createScorecardMetric(getUserId(req), parsed.data);
      res.status(201).json(metric);
    } catch (error) {
      res.status(500).json({ error: "Failed to create scorecard metric" });
    }
  });

  app.patch("/api/scorecard-metrics/:id", isAuthenticated, async (req, res) => {
    try {
      const metric = await storage.updateScorecardMetric(getUserId(req), req.params.id, req.body);
      if (!metric) return res.status(404).json({ error: "Metric not found" });
      res.json(metric);
    } catch (error) {
      res.status(500).json({ error: "Failed to update scorecard metric" });
    }
  });

  app.delete("/api/scorecard-metrics/:id", isAuthenticated, async (req, res) => {
    try {
      const deleted = await storage.deleteScorecardMetric(getUserId(req), req.params.id);
      if (!deleted) return res.status(404).json({ error: "Metric not found" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete scorecard metric" });
    }
  });

  app.get("/api/scorecard-entries", isAuthenticated, async (req, res) => {
    try {
      const entries = await storage.getAllScorecardEntries(getUserId(req));
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scorecard entries" });
    }
  });

  app.put("/api/scorecard-entries", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertScorecardEntrySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
      const entry = await storage.upsertScorecardEntry(getUserId(req), parsed.data);
      res.json(entry);
    } catch (error) {
      res.status(500).json({ error: "Failed to save scorecard entry" });
    }
  });

  // ============ KPIs ============

  app.get("/api/kpis", isAuthenticated, async (req, res) => {
    try {
      const kpiList = await storage.getKpis(getUserId(req));
      res.json(kpiList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch KPIs" });
    }
  });

  app.post("/api/kpis", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertKpiSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
      const kpi = await storage.createKpi(getUserId(req), parsed.data);
      res.status(201).json(kpi);
    } catch (error) {
      res.status(500).json({ error: "Failed to create KPI" });
    }
  });

  app.patch("/api/kpis/:id", isAuthenticated, async (req, res) => {
    try {
      const kpi = await storage.updateKpi(getUserId(req), req.params.id, req.body);
      if (!kpi) return res.status(404).json({ error: "KPI not found" });
      res.json(kpi);
    } catch (error) {
      res.status(500).json({ error: "Failed to update KPI" });
    }
  });

  app.delete("/api/kpis/:id", isAuthenticated, async (req, res) => {
    try {
      const deleted = await storage.deleteKpi(getUserId(req), req.params.id);
      if (!deleted) return res.status(404).json({ error: "KPI not found" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete KPI" });
    }
  });

  // ============ WAITING FOR ============

  app.get("/api/waiting-items", isAuthenticated, async (req, res) => {
    try {
      const items = await storage.getWaitingItems(getUserId(req));
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch waiting items" });
    }
  });

  app.post("/api/waiting-items", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertWaitingItemSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
      const item = await storage.createWaitingItem(getUserId(req), parsed.data);
      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to create waiting item" });
    }
  });

  app.patch("/api/waiting-items/:id", isAuthenticated, async (req, res) => {
    try {
      const item = await storage.updateWaitingItem(getUserId(req), req.params.id, req.body);
      if (!item) return res.status(404).json({ error: "Item not found" });
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update waiting item" });
    }
  });

  app.delete("/api/waiting-items/:id", isAuthenticated, async (req, res) => {
    try {
      const deleted = await storage.deleteWaitingItem(getUserId(req), req.params.id);
      if (!deleted) return res.status(404).json({ error: "Item not found" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete waiting item" });
    }
  });

  // ============ DEALS (CRM) ============

  app.get("/api/deals", isAuthenticated, async (req, res) => {
    try {
      const dealList = await storage.getDeals(getUserId(req));
      res.json(dealList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch deals" });
    }
  });

  app.post("/api/deals", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertDealSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
      const deal = await storage.createDeal(getUserId(req), parsed.data);
      res.status(201).json(deal);
    } catch (error) {
      res.status(500).json({ error: "Failed to create deal" });
    }
  });

  app.patch("/api/deals/:id", isAuthenticated, async (req, res) => {
    try {
      const deal = await storage.updateDeal(getUserId(req), req.params.id, req.body);
      if (!deal) return res.status(404).json({ error: "Deal not found" });
      res.json(deal);
    } catch (error) {
      res.status(500).json({ error: "Failed to update deal" });
    }
  });

  app.delete("/api/deals/:id", isAuthenticated, async (req, res) => {
    try {
      const deleted = await storage.deleteDeal(getUserId(req), req.params.id);
      if (!deleted) return res.status(404).json({ error: "Deal not found" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete deal" });
    }
  });

  // ============ TIME BLOCKS ============

  app.get("/api/time-blocks/:date", isAuthenticated, async (req, res) => {
    try {
      const blocks = await storage.getTimeBlocks(getUserId(req), req.params.date);
      res.json(blocks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch time blocks" });
    }
  });

  app.post("/api/time-blocks", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertTimeBlockSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
      const block = await storage.createTimeBlock(getUserId(req), parsed.data);
      res.status(201).json(block);
    } catch (error) {
      res.status(500).json({ error: "Failed to create time block" });
    }
  });

  app.patch("/api/time-blocks/:id", isAuthenticated, async (req, res) => {
    try {
      const block = await storage.updateTimeBlock(getUserId(req), req.params.id, req.body);
      if (!block) return res.status(404).json({ error: "Time block not found" });
      res.json(block);
    } catch (error) {
      res.status(500).json({ error: "Failed to update time block" });
    }
  });

  app.delete("/api/time-blocks/:id", isAuthenticated, async (req, res) => {
    try {
      const deleted = await storage.deleteTimeBlock(getUserId(req), req.params.id);
      if (!deleted) return res.status(404).json({ error: "Time block not found" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete time block" });
    }
  });

  // ============ EXPENSES ============

  app.get("/api/recurring-expenses", isAuthenticated, async (req, res) => {
    try {
      const expenses = await storage.getRecurringExpenses(getUserId(req));
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recurring expenses" });
    }
  });

  app.post("/api/recurring-expenses", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertRecurringExpenseSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
      const expense = await storage.createRecurringExpense(getUserId(req), parsed.data);
      res.status(201).json(expense);
    } catch (error) {
      res.status(500).json({ error: "Failed to create recurring expense" });
    }
  });

  app.patch("/api/recurring-expenses/:id", isAuthenticated, async (req, res) => {
    try {
      const expense = await storage.updateRecurringExpense(getUserId(req), req.params.id, req.body);
      if (!expense) return res.status(404).json({ error: "Expense not found" });
      res.json(expense);
    } catch (error) {
      res.status(500).json({ error: "Failed to update recurring expense" });
    }
  });

  app.delete("/api/recurring-expenses/:id", isAuthenticated, async (req, res) => {
    try {
      const deleted = await storage.deleteRecurringExpense(getUserId(req), req.params.id);
      if (!deleted) return res.status(404).json({ error: "Expense not found" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete recurring expense" });
    }
  });

  app.get("/api/variable-expenses", isAuthenticated, async (req, res) => {
    try {
      const expenses = await storage.getVariableExpenses(getUserId(req));
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch variable expenses" });
    }
  });

  app.post("/api/variable-expenses", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertVariableExpenseSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
      const expense = await storage.createVariableExpense(getUserId(req), parsed.data);
      res.status(201).json(expense);
    } catch (error) {
      res.status(500).json({ error: "Failed to create variable expense" });
    }
  });

  app.delete("/api/variable-expenses/:id", isAuthenticated, async (req, res) => {
    try {
      const deleted = await storage.deleteVariableExpense(getUserId(req), req.params.id);
      if (!deleted) return res.status(404).json({ error: "Expense not found" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete variable expense" });
    }
  });

  // ============ MEETINGS ============

  app.get("/api/meetings", isAuthenticated, async (req, res) => {
    try {
      const meetingList = await storage.getMeetings(getUserId(req));
      res.json(meetingList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch meetings" });
    }
  });

  app.post("/api/meetings", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertMeetingSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
      const meeting = await storage.createMeeting(getUserId(req), parsed.data);
      res.status(201).json(meeting);
    } catch (error) {
      res.status(500).json({ error: "Failed to create meeting" });
    }
  });

  app.patch("/api/meetings/:id", isAuthenticated, async (req, res) => {
    try {
      const meeting = await storage.updateMeeting(getUserId(req), req.params.id, req.body);
      if (!meeting) return res.status(404).json({ error: "Meeting not found" });
      res.json(meeting);
    } catch (error) {
      res.status(500).json({ error: "Failed to update meeting" });
    }
  });

  app.delete("/api/meetings/:id", isAuthenticated, async (req, res) => {
    try {
      const deleted = await storage.deleteMeeting(getUserId(req), req.params.id);
      if (!deleted) return res.status(404).json({ error: "Meeting not found" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete meeting" });
    }
  });

  // ============ AI CHAT ============

  app.get("/api/ai/conversations", isAuthenticated, async (req, res) => {
    try {
      const conversations = await storage.getAiConversations(getUserId(req));
      res.json(conversations);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch conversations" });
    }
  });

  app.post("/api/ai/conversations", isAuthenticated, async (req, res) => {
    try {
      const conv = await storage.createAiConversation(getUserId(req), { title: req.body.title || "New Chat" });
      res.status(201).json(conv);
    } catch (error) {
      res.status(500).json({ error: "Failed to create conversation" });
    }
  });

  app.delete("/api/ai/conversations/:id", isAuthenticated, async (req, res) => {
    try {
      const deleted = await storage.deleteAiConversation(getUserId(req), req.params.id);
      if (!deleted) return res.status(404).json({ error: "Conversation not found" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete conversation" });
    }
  });

  app.get("/api/ai/conversations/:id/messages", isAuthenticated, async (req, res) => {
    try {
      const messages = await storage.getAiMessages(getUserId(req), req.params.id);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  app.post("/api/ai/conversations/:id/chat", isAuthenticated, async (req, res) => {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: "OpenAI API key not configured. Please add OPENAI_API_KEY to your secrets." });
      }

      const { message } = req.body;
      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Message is required" });
      }

      const conversationId = req.params.id;
      const userId = getUserId(req);

      await storage.createAiMessage(userId, { conversationId, role: "user", content: message });

      const history = await storage.getAiMessages(userId, conversationId);
      const openaiMessages = history.map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      }));

      const openai = new OpenAI({ apiKey });

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      const stream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a helpful assistant embedded in a personal productivity dashboard called MalleniumDash. Be concise and practical. Help the user with brainstorming, writing, planning, and problem-solving." },
          ...openaiMessages,
        ],
        stream: true,
        max_tokens: 2048,
      });

      let fullResponse = "";

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        if (content) {
          fullResponse += content;
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }

      await storage.createAiMessage(userId, { conversationId, role: "assistant", content: fullResponse });

      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    } catch (error: any) {
      console.error("AI chat error:", error);
      if (!res.headersSent) {
        res.status(500).json({ error: error.message || "Failed to get AI response" });
      } else {
        res.write(`data: ${JSON.stringify({ error: error.message || "Stream error" })}\n\n`);
        res.end();
      }
    }
  });

  // ============ USER SETTINGS ============

  app.get("/api/user-settings", isAuthenticated, async (req, res) => {
    try {
      const settings = await storage.getUserSettings(getUserId(req));
      const adminIds = (process.env.ADMIN_USER_IDS || "").split(",").map(s => s.trim()).filter(Boolean);
      const userId = getUserId(req);
      const user = await storage.getUserById(userId);
      const userIsAdmin = adminIds.includes(userId) || !!(user?.email && adminIds.includes(user.email));
      const masked = {
        ...settings,
        openaiApiKey: settings.openaiApiKey
          ? `sk-...${settings.openaiApiKey.slice(-4)}`
          : null,
        hasOpenaiKey: !!settings.openaiApiKey,
        isAdmin: userIsAdmin,
      };
      res.json(masked);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user settings" });
    }
  });

  app.patch("/api/user-settings", isAuthenticated, async (req, res) => {
    try {
      const allowedFields: Record<string, any> = {};
      if (req.body.appName !== undefined) allowedFields.appName = req.body.appName;
      if (req.body.openaiApiKey !== undefined) {
        const key = req.body.openaiApiKey;
        if (key && typeof key === "string" && !key.startsWith("sk-...")) {
          allowedFields.openaiApiKey = key;
        } else if (key === "" || key === null) {
          allowedFields.openaiApiKey = null;
        }
      }
      const settings = await storage.updateUserSettings(getUserId(req), allowedFields);
      const masked = {
        ...settings,
        openaiApiKey: settings.openaiApiKey
          ? `sk-...${settings.openaiApiKey.slice(-4)}`
          : null,
        hasOpenaiKey: !!settings.openaiApiKey,
      };
      res.json(masked);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user settings" });
    }
  });

  // ============ GOOGLE CALENDAR (via Replit connector) ============

  app.get("/api/google-calendar/calendars", isAuthenticated, async (req, res) => {
    try {
      const calendars = await listCalendars();
      res.json(calendars);
    } catch (error: any) {
      console.error("Google Calendar list error:", error.message);
      res.status(500).json({ error: error.message || "Failed to fetch calendars" });
    }
  });

  app.get("/api/google-calendar/events", isAuthenticated, async (req, res) => {
    try {
      const calendarId = (req.query.calendarId as string) || "primary";
      const timeMin = req.query.timeMin as string;
      const timeMax = req.query.timeMax as string;

      if (!timeMin || !timeMax) {
        return res.status(400).json({ error: "timeMin and timeMax query params required" });
      }

      const events = await listEvents(calendarId, timeMin, timeMax);
      res.json(events);
    } catch (error: any) {
      console.error("Google Calendar events error:", error.message);
      res.status(500).json({ error: error.message || "Failed to fetch events" });
    }
  });

  // ============ DASHBOARD PRESETS ============

  const isAdminUser = async (req: any): Promise<boolean> => {
    const adminIds = (process.env.ADMIN_USER_IDS || "").split(",").map(s => s.trim()).filter(Boolean);
    const userId = getUserId(req);
    if (adminIds.includes(userId)) return true;
    const user = await storage.getUserById(userId);
    if (user?.email && adminIds.includes(user.email)) return true;
    return false;
  };

  app.get("/api/presets", isAuthenticated, async (req, res) => {
    try {
      const presets = await storage.getPresets(getUserId(req));
      res.json(presets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch presets" });
    }
  });

  app.post("/api/presets", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { name, description, category, isPublic, widgets, backgroundColor } = req.body;

      if (!name || !widgets || !Array.isArray(widgets)) {
        return res.status(400).json({ error: "Name and widgets array are required" });
      }

      if (isPublic && !await isAdminUser(req)) {
        return res.status(403).json({ error: "Only admins can create public presets" });
      }

      const preset = await storage.createPreset({
        userId,
        name,
        description: description || null,
        category: category || null,
        isPublic: isPublic && await isAdminUser(req) ? true : false,
        widgets,
        backgroundColor: backgroundColor || null,
      });
      res.json(preset);
    } catch (error) {
      res.status(500).json({ error: "Failed to create preset" });
    }
  });

  app.post("/api/presets/save-desktop/:desktopId", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { desktopId } = req.params;
      const { name, description, category, isPublic } = req.body;

      if (!name) {
        return res.status(400).json({ error: "Name is required" });
      }

      const desktop = await storage.getDesktop(userId, desktopId);
      if (!desktop) {
        return res.status(404).json({ error: "Desktop not found" });
      }

      const desktopWidgets = await storage.getWidgetsByDesktop(userId, desktopId);
      const widgetSnapshots = desktopWidgets.map(w => ({
        type: w.type,
        title: w.title,
        content: w.content || {},
        cardColor: w.cardColor || null,
        layout: w.layout || undefined,
      }));

      if (isPublic && !await isAdminUser(req)) {
        return res.status(403).json({ error: "Only admins can create public presets" });
      }

      const preset = await storage.createPreset({
        userId,
        name,
        description: description || null,
        category: category || null,
        isPublic: isPublic && await isAdminUser(req) ? true : false,
        widgets: widgetSnapshots,
        backgroundColor: desktop.backgroundColor || null,
      });
      res.json(preset);
    } catch (error) {
      res.status(500).json({ error: "Failed to save desktop as preset" });
    }
  });

  app.post("/api/presets/:id/apply", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const preset = await storage.getPreset(req.params.id);

      if (!preset) {
        return res.status(404).json({ error: "Preset not found" });
      }

      if (!preset.isPublic && preset.userId !== userId) {
        return res.status(403).json({ error: "Access denied" });
      }

      const existingDesktops = await storage.getDesktops(userId);
      const newDesktop = await storage.createDesktop(userId, {
        userId,
        name: req.body.desktopName || preset.name,
        backgroundColor: preset.backgroundColor || "#09090b",
        order: existingDesktops.length,
      });

      const presetWidgets = preset.widgets as any[];
      for (const pw of presetWidgets) {
        await storage.createWidget(userId, {
          userId,
          type: pw.type,
          title: pw.title,
          content: pw.content || {},
          cardColor: pw.cardColor || null,
          desktopId: newDesktop.id,
          layout: pw.layout || null,
          collapsed: false,
          pinnedAllDesktops: false,
        });
      }

      res.json({ desktop: newDesktop, widgetCount: presetWidgets.length });
    } catch (error) {
      res.status(500).json({ error: "Failed to apply preset" });
    }
  });

  app.patch("/api/presets/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { name, description, category, isPublic } = req.body;
      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (category !== undefined) updates.category = category;
      if (isPublic !== undefined && await isAdminUser(req)) updates.isPublic = isPublic;

      const preset = await storage.updatePreset(userId, req.params.id, updates);
      if (!preset) return res.status(404).json({ error: "Preset not found or access denied" });
      res.json(preset);
    } catch (error) {
      res.status(500).json({ error: "Failed to update preset" });
    }
  });

  app.delete("/api/presets/:id", isAuthenticated, async (req, res) => {
    try {
      const deleted = await storage.deletePreset(getUserId(req), req.params.id);
      if (!deleted) return res.status(404).json({ error: "Preset not found or access denied" });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete preset" });
    }
  });

  // ============ STRIPE PAYMENT ROUTES ============

  app.get("/api/stripe/publishable-key", async (_req, res) => {
    try {
      const key = await getStripePublishableKey();
      res.json({ publishableKey: key });
    } catch (error) {
      res.status(500).json({ error: "Failed to get publishable key" });
    }
  });

  app.get("/api/subscription", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.accessCodeId) {
        const code = await storage.getAccessCodeByCode(user.accessCodeId);
        if (code && code.active) {
          if (user.subscriptionEndedAt) {
            await storage.updateUser(userId, { subscriptionEndedAt: null });
          }
          return res.json({
            status: "active",
            plan: "free",
            accessCode: true,
          });
        }
      }

      if (!user.stripeSubscriptionId) {
        const trialEnd = user.createdAt ? new Date(user.createdAt).getTime() + 3 * 24 * 60 * 60 * 1000 : 0;
        const now = Date.now();
        if (now < trialEnd) {
          if (user.subscriptionEndedAt) {
            await storage.updateUser(userId, { subscriptionEndedAt: null });
          }
          return res.json({
            status: "trialing",
            trialEnd: new Date(trialEnd).toISOString(),
            plan: null,
          });
        }
        if (!user.subscriptionEndedAt) {
          await storage.updateUser(userId, { subscriptionEndedAt: new Date() });
        }
        return res.json({
          status: "expired",
          trialEnd: user.createdAt ? new Date(trialEnd).toISOString() : null,
          plan: null,
        });
      }

      const subResult = await db.execute(
        sql`SELECT * FROM stripe.subscriptions WHERE id = ${user.stripeSubscriptionId}`
      );
      const subscription = subResult.rows[0];
      if (!subscription) {
        if (!user.subscriptionEndedAt) {
          await storage.updateUser(userId, { subscriptionEndedAt: new Date() });
        }
        return res.json({ status: "expired", plan: null });
      }

      const subStatus = subscription.status as string;
      let plan: string | null = null;
      const itemsResult = await db.execute(
        sql`SELECT si.price, sp.recurring FROM stripe.subscription_items si 
            JOIN stripe.prices sp ON sp.id = si.price 
            WHERE si.subscription = ${user.stripeSubscriptionId}`
      );
      if (itemsResult.rows.length > 0) {
        const recurring = itemsResult.rows[0].recurring as any;
        plan = recurring?.interval === "year" ? "yearly" : "monthly";
      }

      if (subStatus === "active" || subStatus === "trialing") {
        if (user.subscriptionEndedAt) {
          await storage.updateUser(userId, { subscriptionEndedAt: null });
        }
      } else if (subStatus === "canceled" || subStatus === "unpaid") {
        if (!user.subscriptionEndedAt) {
          await storage.updateUser(userId, { subscriptionEndedAt: new Date() });
        }
      }

      res.json({
        status: subStatus,
        plan,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      });
    } catch (error) {
      console.error("Subscription check error:", error);
      res.status(500).json({ error: "Failed to check subscription" });
    }
  });

  app.get("/api/stripe/prices", isAuthenticated, async (_req, res) => {
    try {
      const productsResult = await db.execute(
        sql`SELECT id FROM stripe.products WHERE active = true AND name = 'HunterOS Pro' LIMIT 1`
      );
      if (productsResult.rows.length === 0) {
        return res.json({ prices: [] });
      }
      const productId = productsResult.rows[0].id;
      const pricesResult = await db.execute(
        sql`SELECT id, unit_amount, currency, recurring, metadata FROM stripe.prices WHERE product = ${productId} AND active = true ORDER BY unit_amount`
      );
      res.json({ prices: pricesResult.rows });
    } catch (error) {
      console.error("Prices fetch error:", error);
      res.status(500).json({ error: "Failed to fetch prices" });
    }
  });

  app.post("/api/stripe/checkout", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUserById(userId);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const { priceId } = req.body;
      if (!priceId) {
        return res.status(400).json({ error: "priceId is required" });
      }

      const stripe = await getUncachableStripeClient();

      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email || undefined,
          metadata: { userId },
        });
        customerId = customer.id;
        await storage.updateUser(userId, { stripeCustomerId: customerId });
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: "subscription",
        success_url: `${req.protocol}://${req.get("host")}/?checkout=success`,
        cancel_url: `${req.protocol}://${req.get("host")}/?checkout=cancel`,
        subscription_data: {
          trial_period_days: 3,
        },
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Checkout error:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  app.post("/api/stripe/portal", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUserById(userId);
      if (!user || !user.stripeCustomerId) {
        return res.status(400).json({ error: "No billing account found" });
      }

      const stripe = await getUncachableStripeClient();
      const session = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${req.protocol}://${req.get("host")}/`,
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error("Portal error:", error);
      res.status(500).json({ error: "Failed to create portal session" });
    }
  });

  app.post("/api/stripe/sync-subscription", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUserById(userId);
      if (!user || !user.stripeCustomerId) {
        return res.json({ synced: false });
      }

      const stripe = await getUncachableStripeClient();
      const allSubs = await stripe.subscriptions.list({
        customer: user.stripeCustomerId,
        status: "all",
        limit: 10,
      });

      const preferred = allSubs.data.find((s) => s.status === "active" || s.status === "trialing")
        || allSubs.data.find((s) => s.status === "past_due")
        || allSubs.data[0];

      if (preferred) {
        await storage.updateUser(userId, { stripeSubscriptionId: preferred.id });
        return res.json({ synced: true, status: preferred.status });
      }

      res.json({ synced: false });
    } catch (error) {
      console.error("Sync subscription error:", error);
      res.status(500).json({ error: "Failed to sync subscription" });
    }
  });

  const isAdmin = async (userId: string): Promise<boolean> => {
    const adminValues = (process.env.ADMIN_USER_IDS || "").split(",").map((s) => s.trim()).filter(Boolean);
    if (adminValues.includes(userId)) return true;
    const user = await storage.getUserById(userId);
    if (user?.email && adminValues.includes(user.email)) return true;
    return false;
  };

  app.post("/api/access-codes", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!(await isAdmin(userId))) {
        return res.status(403).json({ error: "Admin access required" });
      }
      const { label, maxUses } = req.body;
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const accessCode = await storage.createAccessCode({
        code,
        label: label || null,
        maxUses: maxUses || 1,
        createdBy: userId,
        active: true,
      });
      res.json(accessCode);
    } catch (error) {
      console.error("Create access code error:", error);
      res.status(500).json({ error: "Failed to create access code" });
    }
  });

  app.get("/api/access-codes", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!(await isAdmin(userId))) {
        return res.status(403).json({ error: "Admin access required" });
      }
      const codes = await storage.getAccessCodes(userId);
      res.json(codes);
    } catch (error) {
      console.error("Get access codes error:", error);
      res.status(500).json({ error: "Failed to get access codes" });
    }
  });

  app.post("/api/redeem-code", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { code } = req.body;
      if (!code || typeof code !== "string") {
        return res.status(400).json({ error: "Access code is required" });
      }

      const accessCode = await storage.getAccessCodeByCode(code.trim().toUpperCase());
      if (!accessCode) {
        return res.status(404).json({ error: "Invalid access code" });
      }
      if (!accessCode.active) {
        return res.status(400).json({ error: "This access code is no longer active" });
      }
      if (accessCode.usedCount >= accessCode.maxUses) {
        return res.status(400).json({ error: "This access code has reached its maximum uses" });
      }

      const user = await storage.getUserById(userId);
      if (user?.accessCodeId) {
        return res.status(400).json({ error: "You already have an access code applied" });
      }

      await storage.updateUser(userId, { accessCodeId: accessCode.code, subscriptionEndedAt: null });
      await storage.incrementAccessCodeUsage(accessCode.id);
      res.json({ success: true, message: "Access code redeemed successfully" });
    } catch (error) {
      console.error("Redeem code error:", error);
      res.status(500).json({ error: "Failed to redeem access code" });
    }
  });

  // ============ HUNTER AI ============

  app.post("/api/hunter-ai/chat", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { message } = req.body;
      if (!message || typeof message !== "string") {
        return res.status(400).json({ error: "Message is required" });
      }

      const settings = await storage.getUserSettings(userId);
      if (!settings.openaiApiKey) {
        return res.status(400).json({ error: "Please add your OpenAI API key in the HunterAI settings to use this feature." });
      }

      const [
        desktops,
        widgets,
        ventures,
        kpis,
        waitingItems,
        deals,
        captureItems,
        habits,
        recurringExpenses,
        variableExpenses,
        meetings,
        scorecardMetrics,
        allScorecardEntries,
      ] = await Promise.all([
        storage.getDesktops(userId),
        storage.getWidgets(userId),
        storage.getVentures(userId),
        storage.getKpis(userId),
        storage.getWaitingItems(userId),
        storage.getDeals(userId),
        storage.getCaptureItems(userId),
        storage.getHabits(userId),
        storage.getRecurringExpenses(userId),
        storage.getVariableExpenses(userId),
        storage.getMeetings(userId),
        storage.getScorecardMetrics(userId),
        storage.getAllScorecardEntries(userId),
      ]);

      const prioritiesMap: Record<string, any[]> = {};
      const revenueMap: Record<string, any[]> = {};
      for (const v of ventures) {
        const [priorities, revenue] = await Promise.all([
          storage.getPriorities(userId, v.id),
          storage.getRevenueData(userId, v.id),
        ]);
        prioritiesMap[v.name] = priorities;
        revenueMap[v.name] = revenue;
      }

      const today = new Date().toISOString().split("T")[0];
      const journalEntry = await storage.getJournalEntry(userId, today);

      const notesWidgets = widgets.filter(w => w.type === "notes").map(w => ({
        title: w.title,
        content: w.content,
      }));

      const dashboardContext = JSON.stringify({
        desktops: desktops.map(d => ({ name: d.name, id: d.id })),
        ventures: ventures.map(v => ({
          name: v.name,
          color: v.color,
          priorities: prioritiesMap[v.name] || [],
          revenue: (revenueMap[v.name] || []).slice(-12),
        })),
        kpis: kpis.map(k => ({ name: k.name, target: k.target, currentValue: k.currentValue, unit: k.unit })),
        notes: notesWidgets,
        deals: deals.map(d => ({ name: d.name, company: d.company, value: d.value, stage: d.stage, lastContactDate: d.lastContactDate })),
        waitingItems: waitingItems.map(w => ({ description: w.description, person: w.person, dueDate: w.dueDate, completed: w.completed })),
        captureItems: captureItems.filter(c => !c.processed).map(c => ({ content: c.content })),
        habits: habits.map(h => ({ name: h.name, color: h.color })),
        scorecardMetrics: scorecardMetrics.map(m => {
          const entries = allScorecardEntries.filter(e => e.metricId === m.id).slice(-4);
          return { name: m.name, target: m.target, unit: m.unit, recentEntries: entries };
        }),
        recurringExpenses: recurringExpenses.map(e => ({ name: e.name, amount: e.amount, category: e.category })),
        variableExpenses: variableExpenses.slice(-20).map(e => ({ name: e.name, amount: e.amount, category: e.category, date: e.date })),
        meetings: meetings.filter(m => !m.completed).map(m => ({ title: m.title, objective: m.objective, date: m.date })),
        todayJournal: journalEntry?.content || null,
      }, null, 0);

      const openai = new OpenAI({ apiKey: settings.openaiApiKey });

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      const stream = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        stream: true,
        messages: [
          {
            role: "system",
            content: `You are HunterAI, a fun and enthusiastic personal dashboard assistant. Your personality is hunt-themed - you "hunt down", "track", "sniff out", and "gather" information for the user from their dashboard data.

Your style rules:
- Start responses with a hunt-themed opener like "Here's what I hunted down for you!" or "I tracked this down!" or "Found your prey!" or "Let me show you what I gathered!" etc.
- Be concise and helpful - present data clearly
- Use bold markdown for key numbers and names
- If data doesn't exist for what they're asking, say something like "Came back empty-pawed on that one!" or "No tracks found for that!"
- You can reference specific widgets, desktops, ventures by name
- Format numbers nicely (currency with $, percentages with %)
- Keep responses focused and scannable

Here is the user's complete dashboard data:
${dashboardContext}

Today's date is ${today}.`,
          },
          { role: "user", content: message },
        ],
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          res.write(`data: ${JSON.stringify({ content })}\n\n`);
        }
      }
      res.write(`data: [DONE]\n\n`);
      res.end();
    } catch (error: any) {
      console.error("HunterAI error:", error.message);
      if (!res.headersSent) {
        if (error.message?.includes("Incorrect API key") || error.status === 401) {
          return res.status(401).json({ error: "Invalid OpenAI API key. Please check your key in settings." });
        }
        return res.status(500).json({ error: "HunterAI encountered an error. Please try again." });
      }
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  });

  // Platform Announcements - Admin CRUD
  app.get("/api/announcements/admin", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!(await isAdmin(userId))) {
        return res.status(403).json({ error: "Admin access required" });
      }
      const announcements = await storage.getAnnouncements();
      res.json(announcements);
    } catch (error) {
      console.error("Get announcements error:", error);
      res.status(500).json({ error: "Failed to get announcements" });
    }
  });

  app.post("/api/announcements", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!(await isAdmin(userId))) {
        return res.status(403).json({ error: "Admin access required" });
      }
      const { title, content, type, targetType, targetUserIds } = req.body;
      if (!title || !content) {
        return res.status(400).json({ error: "Title and content required" });
      }
      const validTypes = ["info", "update", "warning"];
      const validTargets = ["all", "specific"];
      const announcementType = validTypes.includes(type) ? type : "info";
      const announcementTarget = validTargets.includes(targetType) ? targetType : "all";
      const validUserIds = announcementTarget === "specific" && Array.isArray(targetUserIds)
        ? targetUserIds.filter((id: any) => typeof id === "string")
        : null;
      if (announcementTarget === "specific" && (!validUserIds || validUserIds.length === 0)) {
        return res.status(400).json({ error: "At least one user must be selected for targeted announcements" });
      }
      const announcement = await storage.createAnnouncement({
        title: String(title).slice(0, 200),
        content: String(content).slice(0, 2000),
        type: announcementType,
        targetType: announcementTarget,
        targetUserIds: validUserIds,
        isActive: true,
        createdBy: userId,
      });
      res.json(announcement);
    } catch (error) {
      console.error("Create announcement error:", error);
      res.status(500).json({ error: "Failed to create announcement" });
    }
  });

  app.patch("/api/announcements/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!(await isAdmin(userId))) {
        return res.status(403).json({ error: "Admin access required" });
      }
      const updated = await storage.updateAnnouncement(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: "Announcement not found" });
      res.json(updated);
    } catch (error) {
      console.error("Update announcement error:", error);
      res.status(500).json({ error: "Failed to update announcement" });
    }
  });

  app.delete("/api/announcements/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!(await isAdmin(userId))) {
        return res.status(403).json({ error: "Admin access required" });
      }
      const deleted = await storage.deleteAnnouncement(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Announcement not found" });
      res.json({ success: true });
    } catch (error) {
      console.error("Delete announcement error:", error);
      res.status(500).json({ error: "Failed to delete announcement" });
    }
  });

  // Platform Announcements - User endpoints
  app.get("/api/announcements", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const announcements = await storage.getAnnouncementsForUser(userId);
      res.json(announcements);
    } catch (error) {
      console.error("Get user announcements error:", error);
      res.status(500).json({ error: "Failed to get announcements" });
    }
  });

  app.post("/api/announcements/:id/read", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      await storage.markAnnouncementRead(userId, req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Mark announcement read error:", error);
      res.status(500).json({ error: "Failed to mark announcement as read" });
    }
  });

  // Admin: Get all users for targeting announcements
  app.get("/api/admin/users", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!(await isAdmin(userId))) {
        return res.status(403).json({ error: "Admin access required" });
      }
      const allUsers = await storage.getAllUsers();
      res.json(allUsers);
    } catch (error) {
      console.error("Get all users error:", error);
      res.status(500).json({ error: "Failed to get users" });
    }
  });

  return httpServer;
}
