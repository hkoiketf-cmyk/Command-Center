import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWidgetSchema, insertVentureSchema, insertPrioritySchema, insertRevenueDataSchema, insertDesktopSchema, insertFocusContractSchema, insertCaptureItemSchema, insertHabitSchema, insertHabitEntrySchema, insertJournalEntrySchema, insertScorecardMetricSchema, insertScorecardEntrySchema, insertKpiSchema, insertWaitingItemSchema, insertDealSchema, insertTimeBlockSchema, insertRecurringExpenseSchema, insertVariableExpenseSchema, insertMeetingSchema, insertAiConversationSchema, insertAiMessageSchema } from "@shared/schema";
import { z } from "zod";
import OpenAI from "openai";
import { isAuthenticated } from "./replit_integrations/auth";
import { registerObjectStorageRoutes } from "./replit_integrations/object_storage";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import { sql } from "drizzle-orm";
import { db } from "./db";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const getUserId = (req: any): string => req.user?.claims?.sub;

  // ============ OBJECT STORAGE (File Uploads) ============
  registerObjectStorageRoutes(app);

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

  app.put("/api/desktops/reorder", isAuthenticated, async (req, res) => {
    try {
      const { orderedIds } = req.body;
      if (!Array.isArray(orderedIds)) {
        return res.status(400).json({ error: "orderedIds must be an array" });
      }
      await storage.reorderDesktops(getUserId(req), orderedIds);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to reorder desktops" });
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
      const widgetId = req.query.widgetId as string | undefined;
      const items = await storage.getCaptureItems(getUserId(req), widgetId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch capture items" });
    }
  });

  app.post("/api/capture-items", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertCaptureItemSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
      const widgetId = req.body.widgetId as string | undefined;
      const item = await storage.createCaptureItem(getUserId(req), parsed.data, widgetId);
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
      const widgetId = req.query.widgetId as string | undefined;
      const habitList = await storage.getHabits(getUserId(req), widgetId);
      res.json(habitList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch habits" });
    }
  });

  app.post("/api/habits", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertHabitSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
      const widgetId = req.body.widgetId as string | undefined;
      const habit = await storage.createHabit(getUserId(req), parsed.data, widgetId);
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
      const widgetId = req.query.widgetId as string | undefined;
      const entries = await storage.getAllHabitEntries(getUserId(req), widgetId);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch habit entries" });
    }
  });

  app.post("/api/habit-entries", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertHabitEntrySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
      const widgetId = req.body.widgetId as string | undefined;
      const entry = await storage.createHabitEntry(getUserId(req), parsed.data, widgetId);
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
      const widgetId = req.query.widgetId as string | undefined;
      const entries = await storage.getJournalEntries(getUserId(req), widgetId);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch journal entries" });
    }
  });

  app.get("/api/journal/:date", isAuthenticated, async (req, res) => {
    try {
      const widgetId = req.query.widgetId as string | undefined;
      const entries = await storage.getJournalEntriesByDate(getUserId(req), req.params.date, widgetId);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch journal entries" });
    }
  });

  app.post("/api/journal", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertJournalEntrySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
      const widgetId = req.body.widgetId as string | undefined;
      const entry = await storage.createJournalEntry(getUserId(req), parsed.data, widgetId);
      res.status(201).json(entry);
    } catch (error) {
      res.status(500).json({ error: "Failed to create journal entry" });
    }
  });

  app.put("/api/journal", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertJournalEntrySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
      const widgetId = req.body.widgetId as string | undefined;
      const entry = await storage.upsertJournalEntry(getUserId(req), parsed.data, widgetId);
      res.json(entry);
    } catch (error) {
      res.status(500).json({ error: "Failed to save journal entry" });
    }
  });

  app.delete("/api/journal/:id", isAuthenticated, async (req, res) => {
    try {
      const deleted = await storage.deleteJournalEntry(getUserId(req), req.params.id);
      if (!deleted) return res.status(404).json({ error: "Journal entry not found" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete journal entry" });
    }
  });

  // ============ SCORECARD ============

  app.get("/api/scorecard-metrics", isAuthenticated, async (req, res) => {
    try {
      const widgetId = req.query.widgetId as string | undefined;
      const metrics = await storage.getScorecardMetrics(getUserId(req), widgetId);
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scorecard metrics" });
    }
  });

  app.post("/api/scorecard-metrics", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertScorecardMetricSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
      const widgetId = req.body.widgetId as string | undefined;
      const metric = await storage.createScorecardMetric(getUserId(req), parsed.data, widgetId);
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
      const widgetId = req.query.widgetId as string | undefined;
      const entries = await storage.getAllScorecardEntries(getUserId(req), widgetId);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scorecard entries" });
    }
  });

  app.put("/api/scorecard-entries", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertScorecardEntrySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
      const widgetId = req.body.widgetId as string | undefined;
      const entry = await storage.upsertScorecardEntry(getUserId(req), parsed.data, widgetId);
      res.json(entry);
    } catch (error) {
      res.status(500).json({ error: "Failed to save scorecard entry" });
    }
  });

  // ============ KPIs ============

  app.get("/api/kpis", isAuthenticated, async (req, res) => {
    try {
      const widgetId = req.query.widgetId as string | undefined;
      const kpiList = await storage.getKpis(getUserId(req), widgetId);
      res.json(kpiList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch KPIs" });
    }
  });

  app.post("/api/kpis", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertKpiSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
      const widgetId = req.body.widgetId as string | undefined;
      const kpi = await storage.createKpi(getUserId(req), parsed.data, widgetId);
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
      const widgetId = req.query.widgetId as string | undefined;
      const items = await storage.getWaitingItems(getUserId(req), widgetId);
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch waiting items" });
    }
  });

  app.post("/api/waiting-items", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertWaitingItemSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
      const widgetId = req.body.widgetId as string | undefined;
      const item = await storage.createWaitingItem(getUserId(req), parsed.data, widgetId);
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
      const widgetId = req.query.widgetId as string | undefined;
      const dealList = await storage.getDeals(getUserId(req), widgetId);
      res.json(dealList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch deals" });
    }
  });

  app.post("/api/deals", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertDealSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
      const widgetId = req.body.widgetId as string | undefined;
      const deal = await storage.createDeal(getUserId(req), parsed.data, widgetId);
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
      const widgetId = req.query.widgetId as string | undefined;
      const blocks = await storage.getTimeBlocks(getUserId(req), req.params.date, widgetId);
      res.json(blocks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch time blocks" });
    }
  });

  app.post("/api/time-blocks", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertTimeBlockSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
      const widgetId = req.body.widgetId as string | undefined;
      const block = await storage.createTimeBlock(getUserId(req), parsed.data, widgetId);
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
      const widgetId = req.query.widgetId as string | undefined;
      const expenses = await storage.getRecurringExpenses(getUserId(req), widgetId);
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recurring expenses" });
    }
  });

  app.post("/api/recurring-expenses", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertRecurringExpenseSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
      const widgetId = req.body.widgetId as string | undefined;
      const expense = await storage.createRecurringExpense(getUserId(req), parsed.data, widgetId);
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
      const widgetId = req.query.widgetId as string | undefined;
      const expenses = await storage.getVariableExpenses(getUserId(req), widgetId);
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch variable expenses" });
    }
  });

  app.post("/api/variable-expenses", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertVariableExpenseSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
      const widgetId = req.body.widgetId as string | undefined;
      const expense = await storage.createVariableExpense(getUserId(req), parsed.data, widgetId);
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
      const widgetId = req.query.widgetId as string | undefined;
      const meetingList = await storage.getMeetings(getUserId(req), widgetId);
      res.json(meetingList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch meetings" });
    }
  });

  app.post("/api/meetings", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertMeetingSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
      const widgetId = req.body.widgetId as string | undefined;
      const meeting = await storage.createMeeting(getUserId(req), parsed.data, widgetId);
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
          { role: "system", content: "You are a helpful assistant embedded in a personal productivity dashboard called MallenniumDash. Be concise and practical. Help the user with brainstorming, writing, planning, and problem-solving." },
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
        openaiApiBaseUrl: settings.openaiApiBaseUrl ?? null,
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
      if (req.body.openaiApiBaseUrl !== undefined) {
        const url = req.body.openaiApiBaseUrl;
        allowedFields.openaiApiBaseUrl = (url && typeof url === "string" && url.trim()) ? url.trim() : null;
      }
      const settings = await storage.updateUserSettings(getUserId(req), allowedFields);
      const masked = {
        ...settings,
        openaiApiKey: settings.openaiApiKey
          ? `sk-...${settings.openaiApiKey.slice(-4)}`
          : null,
        hasOpenaiKey: !!settings.openaiApiKey,
        openaiApiBaseUrl: settings.openaiApiBaseUrl ?? null,
      };
      res.json(masked);
    } catch (error) {
      res.status(500).json({ error: "Failed to update user settings" });
    }
  });

  // ============ GOOGLE CALENDAR ============
  // Calendar widget now uses per-user iframe embed (no server-side API needed)
  // Each user connects their own Google Calendar directly in the widget

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
      let user = await storage.getUserById(userId);
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

      // No Stripe subscription: try to attach one if they have a customer (e.g. completed checkout in another tab)
      if (!user.stripeSubscriptionId && user.stripeCustomerId) {
        try {
          const stripe = await getUncachableStripeClient();
          const list = await stripe.subscriptions.list({
            customer: user.stripeCustomerId,
            status: "all",
            limit: 5,
          });
          const preferred =
            list.data.find((s) => s.status === "active" || s.status === "trialing") ||
            list.data.find((s) => s.status === "past_due") ||
            list.data[0];
          if (preferred) {
            await storage.updateUser(userId, { stripeSubscriptionId: preferred.id });
            const updated = await storage.getUserById(userId);
            if (updated) user = updated;
          }
        } catch (_) {
          // ignore sync errors
        }
      }

      if (!user.stripeSubscriptionId) {
        if (!user.subscriptionEndedAt) {
          await storage.updateUser(userId, { subscriptionEndedAt: new Date() });
        }
        return res.json({
          status: "expired",
          trialEnd: null,
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

      // trial_end is when the free trial ends (Stripe charges after this)
      const trialEndRaw = subscription.trial_end ?? (subStatus === "trialing" ? subscription.current_period_end : null);
      const trialEndMs =
        trialEndRaw == null
          ? null
          : typeof trialEndRaw === "number"
            ? trialEndRaw < 1e12
              ? trialEndRaw * 1000
              : trialEndRaw
            : new Date(trialEndRaw).getTime();

      res.json({
        status: subStatus,
        plan,
        trialEnd: trialEndMs != null ? new Date(trialEndMs).toISOString() : null,
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

      // Card is collected upfront; first charge happens after 3-day trial (Stripe default for subscription + trial)
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: "subscription",
        success_url: `${req.protocol}://${req.get("host")}/?checkout=success`,
        cancel_url: `${req.protocol}://${req.get("host")}/pricing?checkout=cancel`,
        subscription_data: {
          trial_period_days: 3,
        },
        payment_method_collection: "always",
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

      const today = new Date().toISOString().split("T")[0];

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
        allHabitEntries,
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
        storage.getAllHabitEntries(userId),
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

      const habitEntriesByHabit: Record<string, { date: string; completed: boolean }[]> = {};
      for (const e of allHabitEntries) {
        if (!habitEntriesByHabit[e.habitId]) habitEntriesByHabit[e.habitId] = [];
        habitEntriesByHabit[e.habitId].push({ date: e.date, completed: e.completed ?? true });
      }
      for (const arr of Object.values(habitEntriesByHabit)) {
        arr.sort((a, b) => b.date.localeCompare(a.date));
      }

      const focusContractsToday = await Promise.all(
        desktops.map(d => storage.getFocusContract(userId, d.id, today))
      );
      const focusList = desktops.map((d, i) => ({
        desktopName: d.name,
        contract: focusContractsToday[i] ? {
          objective: focusContractsToday[i]?.objective,
          top3: focusContractsToday[i]?.top3,
          timeboxMinutes: focusContractsToday[i]?.timeboxMinutes,
        } : null,
      })).filter(x => x.contract != null);

      const journalDates: string[] = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        journalDates.push(d.toISOString().split("T")[0]);
      }
      const recentJournalEntries = await Promise.all(
        journalDates.map(date => storage.getJournalEntry(userId, date))
      );
      const recentJournal = journalDates.map((date, i) => ({
        date,
        content: recentJournalEntries[i]?.content || null,
      })).filter(j => j.content != null && j.content.trim() !== "");

      const timeBlocksToday = await storage.getTimeBlocks(userId, today);

      const desktopNames: Record<string, string> = {};
      for (const d of desktops) desktopNames[d.id] = d.name;
      const widgetLayout = desktops.map(d => ({
        desktopName: d.name,
        widgets: widgets
          .filter(w => w.desktopId === d.id || w.pinnedAllDesktops)
          .map(w => ({ type: w.type, title: w.title })),
      }));

      const notesWidgets = widgets.filter(w => w.type === "notes").map(w => ({
        title: w.title,
        content: w.content,
      }));

      const dashboardContext = JSON.stringify({
        desktops: desktops.map(d => ({ name: d.name, id: d.id })),
        widgetLayout,
        ventures: ventures.map(v => ({
          name: v.name,
          color: v.color,
          priorities: prioritiesMap[v.name] || [],
          revenue: (revenueMap[v.name] || []).slice(-24),
        })),
        kpis: kpis.map(k => ({ name: k.name, targetValue: k.targetValue, currentValue: k.currentValue, unit: k.unit, prefix: k.prefix })),
        notes: notesWidgets,
        deals: deals.map(d => ({ name: d.name, company: d.company, value: d.value, stage: d.stage, lastContactDate: d.lastContactDate })),
        waitingItems: waitingItems.map(w => ({ description: w.description, person: w.person, dueDate: w.dueDate, completed: w.completed })),
        captureItems: captureItems.filter(c => !c.processed).map(c => ({ content: c.content })),
        habits: habits.map(h => ({
          name: h.name,
          color: h.color,
          completionDates: (habitEntriesByHabit[h.id] || []).slice(0, 90).map(e => e.date),
        })),
        scorecardMetrics: scorecardMetrics.map(m => {
          const entries = allScorecardEntries.filter(e => e.metricId === m.id).slice(-12);
          return { name: m.name, target: m.target, unit: m.unit, recentEntries: entries };
        }),
        recurringExpenses: recurringExpenses.map(e => ({ name: e.name, amount: e.amount, category: e.category })),
        variableExpenses: variableExpenses.slice(-30).map(e => ({ name: e.name, amount: e.amount, category: e.category, date: e.date })),
        meetings: meetings.map(m => ({ title: m.title, objective: m.objective, date: m.date, completed: m.completed })),
        todayJournal: recentJournal.find(j => j.date === today)?.content ?? null,
        recentJournal,
        focusContractsToday: focusList,
        timeBlocksToday: timeBlocksToday.map(b => ({ label: b.label, startTime: b.startTime, endTime: b.endTime })),
      }, null, 0);

      const openai = new OpenAI({
        apiKey: settings.openaiApiKey,
        ...(settings.openaiApiBaseUrl ? { baseURL: settings.openaiApiBaseUrl } : {}),
      });

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

You have access to EVERYTHING on the user's dashboard. Use it all to answer questions accurately:
- **Widget layout (widgetLayout)**: Which widgets (type, title) are on each desktop.
- **Ventures & priorities**: Priorities per venture; **revenue** is an array of { month, year, amount } — use it to describe trends, totals, or "graph" data.
- **KPIs**: name, currentValue, targetValue, unit — describe progress, % to target, or list all.
- **Habits**: Each habit has \`completionDates\` (array of YYYY-MM-DD). Use this to compute streaks (consecutive days), "last 7 days", or "how many times this week/month". Describe habit progress in plain language.
- **Weekly scorecard (scorecardMetrics)**: Each metric has \`recentEntries\` (weekStart, value). Summarize trends or latest values.
- **Notes**: Per-notes-widget title and content (markdown).
- **Deals (CRM)**: name, company, value, stage, lastContactDate.
- **Waiting items**: description, person, dueDate, completed.
- **Quick capture**: Unprocessed capture items.
- **Expenses**: recurringExpenses and variableExpenses — use for spending questions, monthly burn, totals.
- **Meetings**: title, objective, date, completed — upcoming vs past.
- **Journal**: todayJournal and recentJournal (last 7 days with date + content).
- **Focus (focusContractsToday)**: Today's focus per desktop: objective, top3 tasks, timebox.
- **Time blocks (timeBlocksToday)**: Today's schedule: label, startTime, endTime.

Your style rules:
- Start with a hunt-themed opener ("Here's what I hunted down!", "I tracked this down!", etc.).
- Be concise; use **bold** for key numbers and names.
- If no data: "Came back empty-pawed on that one!" or "No tracks found for that!"
- Format currency with $, percentages with %; describe graphs/trends in words when they ask about "revenue graph" or "habit streaks".

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

  // AI Widget Builder - Generate widget code from natural language
  app.post("/api/ai/generate-widget", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { prompt, currentCode, mode, conversationHistory, originalPrompt } = req.body;
      if (!prompt || typeof prompt !== "string") {
        return res.status(400).json({ error: "A description of your widget is required." });
      }

      const settings = await storage.getUserSettings(userId);
      if (!settings.openaiApiKey) {
        return res.status(400).json({ error: "Please add your OpenAI API key in Settings (gear icon) to use the AI Widget Builder." });
      }

      const openai = new OpenAI({ apiKey: settings.openaiApiKey });

      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      res.flushHeaders();

      const baseConstraints = `TECHNICAL CONSTRAINTS:
- This widget runs in a sandboxed iframe with sandbox="allow-scripts" ONLY.
- localStorage and sessionStorage are NOT available (no allow-same-origin).
- You CAN use fetch(), XMLHttpRequest to load external data.
- You CAN load external CDN libraries: Chart.js, D3.js, Font Awesome, Google Fonts, animate.css, axios, moment.js, etc. via <script src="https://cdn.jsdelivr.net/..."> or https://cdnjs.cloudflare.com.
- You CANNOT access the parent page's DOM or data. Do NOT try to read window.parent properties or manipulate the parent page.
- For persisting data (API keys, user settings), use in-memory JavaScript variables with a setup UI that asks on each load, OR use a simple closure pattern. Do NOT use localStorage.
- Target container: 250-800px wide, 200-500px tall. MUST be fully responsive.

CRITICAL JAVASCRIPT RULES (follow these exactly):
1. ALL JavaScript code MUST go inside a <script> tag at the END of <body>, AFTER all HTML elements.
2. Use DOMContentLoaded or place scripts after HTML elements to ensure DOM is ready.
3. EVERY interactive element (button, input, select, etc.) MUST have a working event listener attached in JavaScript.
4. NEVER use onclick="functionName()" inline attributes. ALWAYS use addEventListener or document.getElementById().addEventListener().
5. NEVER define functions and leave them uncalled. Every function must be invoked where appropriate.
6. If using fetch() for API data, ALWAYS include proper error handling with try/catch or .catch(), and show a user-friendly message on failure.
7. If an API key is needed, include a settings/config section in the widget UI where the user can paste their API key. Store it in a JavaScript closure variable (NOT localStorage). Re-prompt on each page load.
8. For API calls, use HTTPS endpoints. Handle CORS issues by noting them in the UI if they occur.
9. Test your logic mentally: trace through every user interaction and verify the code handles it.
10. Do NOT use fetch() to save or load user-entered data (steps, logs, habits) to any URL. There is no backend. Store all such data in JavaScript variables only.

API KEY PATTERN (use when the widget needs an external API):
- On first load, show a setup screen with an input field and "Save Key" button
- When key is saved, store in a JavaScript variable (closure) and immediately load data
- Show a small gear/settings icon to change the key later
- The key will need to be re-entered each time the page is refreshed (no localStorage available)
- NEVER hardcode API keys

DATA FETCHING PATTERN:
- Wrap fetch calls in async functions with try/catch
- Show a loading spinner/skeleton while data loads
- Show clear error messages if fetch fails
- If data needs refreshing, use setInterval and show "Last updated: X" timestamp
- Keep fetched data in JavaScript variables (no localStorage available)

CRITICAL - IN-MEMORY DATA (trackers, logs, step counters, habits, expenses, etc.):
- There is NO backend for this widget. Do NOT use fetch() to save or load user data to any URL. Never call example.com, placeholder URLs, or fake APIs. The widget has no server.
- Store ALL user-entered data in a single in-memory variable (e.g. let entries = [] or let stepData = []). When the user clicks Save/Add/Log, push to that array (or update it), then re-render every view that displays data.
- EVERY table, list, or chart that shows "user's data" MUST be built from that in-memory array in JavaScript. Do NOT put static sample rows in the HTML (e.g. <tr><td>2023-10-01</td><td>5000</td></tr>). Either render all rows from the array in script (e.g. entries.forEach(...) and appendChild or innerHTML) or show an empty state ("No entries yet"). If you have Day/Week/Month views, each view must compute from the SAME array: day = list entries; week = group by week start, sum; month = group by month, sum. Implement the aggregation logic.
- Set sensible defaults: e.g. date input to today (new Date().toISOString().slice(0,10)), empty array for data. Initialize the date input in DOMContentLoaded.
- Prefer in-widget feedback over alert(): e.g. a small "Saved!" message that fades, or update the list immediately so the user sees their entry. Use alert() only for real errors if needed.

QUALITY REQUIREMENTS:
1. Start with <!DOCTYPE html>. Include complete <html>, <head> (with <title>), and <body>.
2. Use CSS custom properties at :root (--primary, --bg, --text, --accent, --surface, --border) for theming.
3. Dark-friendly color scheme: dark backgrounds (e.g. #1a1a2e, #16213e) with light text (#e0e0e0). Subtle borders (rgba(255,255,255,0.1)). Professional box-shadows.
4. Typography: use system-ui,-apple-system,sans-serif or import Inter/Poppins from Google Fonts. Proper font-size hierarchy (headings 1.25-1.5rem, body 0.9-1rem, labels 0.75rem). line-height 1.5.
5. Spacing: consistent padding (16-24px), proper margins between sections. No cramped elements.
6. Interactivity: cursor:pointer on clickable elements. Hover effects with transition:all 0.2s ease. Focus outlines on inputs. All buttons/inputs MUST be functional with JavaScript.
7. Animations: subtle CSS @keyframes for load-in (fadeIn, slideUp). Smooth transitions on state changes.
8. Realistic data: use meaningful sample data, real-world names/numbers. Never "Lorem ipsum" or "Item 1".
9. Polish: border-radius 8-12px, subtle box-shadow (0 4px 16px rgba(0,0,0,0.2)), clean visual hierarchy.
10. NO horizontal scrollbar. Content must not overflow. Use overflow:hidden or overflow:auto where needed.`;

      let messages: { role: "system" | "user" | "assistant"; content: string }[] = [];

      if (mode === "clarify") {
        messages = [
          {
            role: "system",
            content: `You are a friendly widget specifier for a dashboard app. The user has described something they want to build (e.g. step counter, habit tracker, expense log). Your job is to ask 2-4 short clarifying questions so we can build exactly what they need. Do NOT write any code. Do NOT use markdown code blocks.

RULES:
- Be concise and warm. One short intro sentence, then your questions.
- For each question, offer 2-4 concrete options in parentheses so they can pick or describe in their own words. Examples: "How do you want to log data? (Manual entry each day | One input + Save button | Connect an API like Fitbit later)" or "Do you want a daily goal? (Yes, with a number I can set | No, just show total)".
- Always include at least one question about HOW they want to input or log data (manual form, API, type and save, etc.).
- Include questions about: data input method, any goals/targets, and how they want to see history (list, chart, total only).
- End with one line: "Reply with your choices (or say **Use defaults** and I'll build it with sensible options)."
- Keep the whole response under 400 words. Use simple formatting: numbered questions, options in parentheses or separated by |.`
          },
          { role: "user", content: prompt }
        ];
      } else if (mode === "refine") {
        const userRequestHistory: string[] = [];
        if (Array.isArray(conversationHistory)) {
          for (const msg of conversationHistory) {
            if (msg.role === "user" && typeof msg.content === "string") {
              userRequestHistory.push(msg.content);
            }
          }
        }

        const historySection = userRequestHistory.length > 0
          ? `\nPREVIOUS USER REQUESTS (in order):\n${userRequestHistory.map((r, i) => `${i + 1}. "${r}"`).join("\n")}\n\nAll of these requests have already been applied to the current code. The user is now asking for additional changes.`
          : "";

        messages = [
          {
            role: "system",
            content: `You are a world-class front-end developer maintaining an HTML widget through iterative improvements. Your goal is to fully address what the user asked for so the widget solves their problem. The user has been working with you to build this widget and now wants changes.

CRITICAL RULES:
- Output ONLY the complete, updated HTML code. No explanations, no markdown, no code fences (no triple backticks), no comments about what changed. The very first character of your response must be <!DOCTYPE html>.
- There is NO line or length limit. Output the ENTIRE widget from <!DOCTYPE html> to </html>. Do not truncate or summarize; long widgets (300–600+ lines) are expected.
- You MUST preserve ALL existing functionality that the user hasn't asked to change.
- Apply the specific changes the user requests.
- Keep the same overall design language, color scheme, layout, and features unless asked to change them.
- If the user reports a bug or the code isn't working, you MUST actually fix the code - don't just describe what's wrong.
- Never simplify, remove, or replace features that were already working.
- The current code below is the GROUND TRUTH of what the widget looks like. Your job is to make targeted edits to it.
- IMPORTANT: If fixing JavaScript issues, make sure ALL scripts are at the END of <body> after all HTML elements, ALL event listeners are properly attached, and ALL functions are actually called.
- IMPORTANT: Do NOT use localStorage or sessionStorage - they are not available in sandbox="allow-scripts" mode. Use in-memory variables instead.

${baseConstraints}

${originalPrompt ? `ORIGINAL USER REQUEST (what they initially asked for): "${originalPrompt}"` : ""}
${historySection}

CURRENT WIDGET CODE (this is what the user sees right now - modify it based on the new request):
${currentCode}`
          },
          { role: "user", content: prompt }
        ];
      } else {
        messages = [
          {
            role: "system",
            content: `You are a world-class front-end developer who builds stunning, production-quality HTML widgets. Your goal is to fully solve the user's problem with one complete widget—completeness and correctness over brevity. Every widget you build is fully functional, beautifully designed, and works on first try.

OUTPUT FORMAT (CRITICAL): Output ONLY one single, complete HTML document. No explanations, no markdown, no code fences (no triple backticks), no text before or after the HTML. Start the very first character of your response with <!DOCTYPE html>. The widget must be fully self-contained with inline <style> and <script> tags. The entire response must be valid HTML that can be dropped into an iframe.
LENGTH: There is NO line or character limit. Produce the COMPLETE widget from <!DOCTYPE html> to </html>. Do not truncate, abbreviate, or "simplify" to keep it short. A full-featured widget can be 300–600+ lines; that is expected and correct.

${baseConstraints}

STRUCTURE YOUR CODE EXACTLY LIKE THIS:
\`\`\`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Widget Title</title>
  <!-- External CDN scripts/styles here if needed -->
  <style>
    /* ALL CSS here */
  </style>
</head>
<body>
  <!-- ALL HTML elements here -->

  <script>
    // ALL JavaScript here - AFTER the HTML
    // This ensures all DOM elements exist when the script runs
    
    (function() {
      // Your widget code wrapped in an IIFE
      // 1. Get DOM references
      // 2. Define state variables
      // 3. Define functions
      // 4. Attach event listeners
      // 5. Initialize / fetch data
    })();
  </script>
</body>
</html>
\`\`\`

HANDLING VAGUE PROMPTS:
If the user's description is vague or short (e.g. "a timer", "todo list", "weather"), interpret it generously and build a fully-featured, polished version. Add sensible features, professional styling, and interactivity. Make reasonable assumptions about what would make the widget useful and complete.

THINK THROUGH THE LOGIC BEFORE CODING (mandatory for trackers, logs, counters, habits, expenses):
1. Where does user input go? → A single in-memory array/object (e.g. stepData = []). No fetch() to save; no example.com or placeholder API.
2. When the user clicks Save/Add/Log → Push the new entry (date, value, etc.) to that array, then call a render function that rebuilds ALL views from the array.
3. If there are multiple views (e.g. Day / Week / Month) → Day view: list entries from the array (maybe sorted by date). Week view: group entries by week (e.g. getWeekStart(date)), sum the values, render rows. Month view: group by month, sum, render. Implement these aggregations in JavaScript; do not hardcode sample rows in HTML.
4. Empty state → When the array is empty, show a friendly message ("No steps logged yet" / "Add your first entry") instead of an empty table or fake data.
5. Defaults → Set date input to today on load. Initialize the data array as empty.

BEFORE YOU WRITE CODE, plan your approach:
1. Does this widget need to store user-entered data? If yes → in-memory array only. No fetch to save. No example.com.
2. Does it need an external API (e.g. weather)? Only if the user asked for one. Then use a real API with error handling and optional API key in a closure.
3. What are ALL the interactive elements and their exact behaviors? Every button/input must have a listener that updates state and re-renders what needs to change.
4. What views/tabs (day/week/month, list/chart) exist? Each must be populated from the same data source with real logic (filter, group, sum as needed).
5. What's the visual layout? (header, main content, controls, feedback area for "Saved!")

Then write the COMPLETE, FULLY WORKING code. Every button must do something. Every table/list must be driven by the in-memory data. No placeholder APIs. No static sample rows mixed with dynamic data.
Do not stop early or trim the code for length. Output the entire HTML document; 300–600+ lines is normal for a complete widget.`
          },
          { role: "user", content: prompt }
        ];
      }

      const modelChain = mode === "clarify"
        ? ["gpt-5-mini", "gpt-4.1-mini", "gpt-4o-mini"]
        : ["gpt-5.2", "gpt-4.1", "gpt-4o"];

      const runStream = async (model: string) => {
        const stream = await openai.chat.completions.create({
          model,
          stream: true,
          messages,
          max_tokens: 16384,
          temperature: mode === "refine" ? 0.3 : 0.6,
        });
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            res.write(`data: ${JSON.stringify({ content })}\n\n`);
          }
        }
      };

      let lastError: any;
      for (const model of modelChain) {
        try {
          await runStream(model);
          lastError = null;
          break;
        } catch (streamError: any) {
          lastError = streamError;
          const isModelNotFound = streamError?.code === "model_not_found" || streamError?.message?.toLowerCase().includes("model");
          if (!isModelNotFound) break;
        }
      }
      if (lastError) throw lastError;
      res.write(`data: [DONE]\n\n`);
      res.end();
    } catch (error: any) {
      console.error("AI Widget Builder error:", error.message);
      if (!res.headersSent) {
        if (error.message?.includes("Incorrect API key") || error.status === 401) {
          return res.status(401).json({ error: "Invalid OpenAI API key. Please check your key in Settings." });
        }
        if (error.message?.includes("model") || error.code === "model_not_found") {
          return res.status(400).json({ error: "Your API key doesn't have access to GPT-5.2 / GPT-5-mini. Ensure your OpenAI account has API access to GPT-5 or GPT-4, or upgrade at platform.openai.com." });
        }
        return res.status(500).json({ error: "AI generation failed. Please try again." });
      }
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
      res.end();
    }
  });

  // AI Widget Builder - Critique code quality (prefer gpt-5-mini → gpt-4.1-mini → gpt-4o-mini)
  app.post("/api/ai/critique-widget", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { code, userPrompt } = req.body;
      if (!code || typeof code !== "string") {
        return res.status(400).json({ error: "Code is required for critique." });
      }

      const settings = await storage.getUserSettings(userId);
      if (!settings.openaiApiKey) {
        return res.status(400).json({ error: "OpenAI API key required." });
      }

      const openai = new OpenAI({ apiKey: settings.openaiApiKey });

      const createCritique = (model: string) => openai.chat.completions.create({
        model,
        messages: [
          {
            role: "system",
            content: `You are a strict QA engineer reviewing an HTML widget. Analyze the code for real, actionable issues ONLY. Do NOT invent problems that don't exist.

The user asked for: "${userPrompt || "a widget"}"

IMPORTANT CONTEXT: This widget runs in sandbox="allow-scripts" ONLY. localStorage and sessionStorage are NOT available. If the code uses localStorage, that IS a critical bug.

Check these categories:
1. FUNCTIONALITY: Do all buttons/inputs have working event listeners? Scripts after HTML? All functions called? No localStorage/sessionStorage (won't work in sandbox)?
2. DATA/API: CRITICAL - If the code uses fetch() to save or load user data (steps, logs, habits) to any URL, that is a critical bug. There is no backend; example.com, placeholder URLs, or "api/save" are fake. User data must be stored only in JavaScript variables (e.g. an array) and all tables/lists must be rendered from that array in script. Flag: fetch to example.com or placeholder; static HTML table rows with sample data (e.g. <tr><td>2023-10-01</td><td>5000</td></tr>) that are not generated by script from the data array; Day/Week/Month views where week or month are not computed from the same data (e.g. hardcoded "Week 1: 35000" instead of grouping and summing).
3. VISUAL: Layout broken? Unreadable text? Bad spacing?
4. COMPLETENESS: Does it fulfill the request? Are views (day/week/month) all driven by real data and aggregation logic?

CRITICAL: For each issue, the "fix" field must contain SPECIFIC, ACTIONABLE code instructions - not vague suggestions. Example:
- BAD fix: "Add error handling"
- GOOD fix: "Wrap the fetch call on line X in a try/catch block and display error.message in the #error-display element"

IMPORTANT: Only report REAL issues. If the code looks good and works, say it passes.
Minor style preferences are NOT issues. "Could be better" is NOT an issue.

You MUST respond with valid JSON matching this schema:
{
  "passed": true/false,
  "score": 1-10,
  "issues": [
    { "category": "functionality|data|visual|completeness", "severity": "critical|major|minor", "description": "specific problem", "fix": "specific actionable fix with exact code changes needed" }
  ]
}

Only set passed=false if there are critical or major issues. Minor issues alone should still pass.`
          },
          {
            role: "user",
            content: `Review this widget code:\n\n${code}`
          }
        ],
        max_tokens: 2000,
        temperature: 0.1,
        response_format: { type: "json_object" },
      });

      const critiqueModelChain = ["gpt-5-mini", "gpt-4.1-mini", "gpt-4o-mini"];
      let response: Awaited<ReturnType<typeof createCritique>> | undefined;
      let lastCritiqueError: any;
      for (const model of critiqueModelChain) {
        try {
          response = await createCritique(model);
          break;
        } catch (err: any) {
          lastCritiqueError = err;
          const isModelNotFound = err?.code === "model_not_found" || err?.message?.toLowerCase().includes("model");
          if (!isModelNotFound) throw err;
        }
      }
      if (!response) throw lastCritiqueError;

      const content = response.choices[0]?.message?.content || "";
      try {
        const cleaned = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
        const critique = JSON.parse(cleaned);
        res.json(critique);
      } catch {
        res.json({ passed: true, score: 7, issues: [] });
      }
    } catch (error: any) {
      console.error("AI Critique error:", error.message);
      if (!res.headersSent) {
        if (error.message?.includes("Incorrect API key") || error.status === 401) {
          return res.status(401).json({ error: "Invalid OpenAI API key." });
        }
        return res.status(500).json({ error: "Critique failed." });
      }
      res.status(500).json({ error: "Critique failed." });
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

  // ============ WIDGET TEMPLATES ============

  app.get("/api/widget-templates", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (await isAdmin(userId)) {
        const templates = await storage.getWidgetTemplates();
        res.json(templates);
      } else {
        const templates = await storage.getPublicWidgetTemplates();
        res.json(templates);
      }
    } catch (error) {
      console.error("Get widget templates error:", error);
      res.status(500).json({ error: "Failed to fetch widget templates" });
    }
  });

  app.get("/api/widget-templates/:id", isAuthenticated, async (req, res) => {
    try {
      const template = await storage.getWidgetTemplate(req.params.id);
      if (!template) return res.status(404).json({ error: "Template not found" });
      const userId = getUserId(req);
      if (!template.isPublic && !(await isAdmin(userId))) {
        return res.status(403).json({ error: "Access denied" });
      }
      res.json(template);
    } catch (error) {
      console.error("Get widget template error:", error);
      res.status(500).json({ error: "Failed to fetch widget template" });
    }
  });

  app.post("/api/widget-templates", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!(await isAdmin(userId))) {
        return res.status(403).json({ error: "Admin access required" });
      }
      const { name, description, code, icon, isPublic } = req.body;
      if (!name || !code) {
        return res.status(400).json({ error: "Name and code are required" });
      }
      const template = await storage.createWidgetTemplate({
        name,
        description: description || "",
        code,
        icon: icon || "Blocks",
        isPublic: isPublic ?? false,
        createdBy: userId,
      });
      res.json(template);
    } catch (error) {
      console.error("Create widget template error:", error);
      res.status(500).json({ error: "Failed to create widget template" });
    }
  });

  app.patch("/api/widget-templates/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!(await isAdmin(userId))) {
        return res.status(403).json({ error: "Admin access required" });
      }
      const { name, description, code, icon, isPublic } = req.body;
      const updates: any = {};
      if (name !== undefined) updates.name = name;
      if (description !== undefined) updates.description = description;
      if (code !== undefined) updates.code = code;
      if (icon !== undefined) updates.icon = icon;
      if (isPublic !== undefined) updates.isPublic = isPublic;
      const template = await storage.updateWidgetTemplate(req.params.id, updates);
      if (!template) return res.status(404).json({ error: "Template not found" });
      res.json(template);
    } catch (error) {
      console.error("Update widget template error:", error);
      res.status(500).json({ error: "Failed to update widget template" });
    }
  });

  app.delete("/api/widget-templates/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      if (!(await isAdmin(userId))) {
        return res.status(403).json({ error: "Admin access required" });
      }
      const deleted = await storage.deleteWidgetTemplate(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Template not found" });
      res.json({ success: true });
    } catch (error) {
      console.error("Delete widget template error:", error);
      res.status(500).json({ error: "Failed to delete widget template" });
    }
  });

  app.get("/api/ads", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const widgetId = req.query.widgetId as string | undefined;
      const userAds = await storage.getAds(userId, widgetId);
      res.json(userAds);
    } catch (error) {
      console.error("Get ads error:", error);
      res.status(500).json({ error: "Failed to get ads" });
    }
  });

  app.get("/api/ads/global", isAuthenticated, async (req, res) => {
    try {
      const globalAds = await storage.getGlobalAds();
      res.json(globalAds);
    } catch (error) {
      console.error("Get global ads error:", error);
      res.status(500).json({ error: "Failed to get global ads" });
    }
  });

  app.post("/api/ads", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const isAdminFlag = req.body.isGlobal ? await isAdmin(userId) : false;
      if (req.body.isGlobal && !isAdminFlag) {
        return res.status(403).json({ error: "Admin access required for global ads" });
      }
      const widgetId = req.body.widgetId as string | undefined;
      const ad = await storage.createAd(userId, req.body, widgetId);
      res.json(ad);
    } catch (error) {
      console.error("Create ad error:", error);
      res.status(500).json({ error: "Failed to create ad" });
    }
  });

  app.patch("/api/ads/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { headline, description, imageUrl, mediaType, ctaText, ctaLink, active, order } = req.body;
      const allowedUpdates: Record<string, any> = {};
      if (headline !== undefined) allowedUpdates.headline = headline;
      if (description !== undefined) allowedUpdates.description = description;
      if (imageUrl !== undefined) allowedUpdates.imageUrl = imageUrl;
      if (mediaType !== undefined) allowedUpdates.mediaType = mediaType;
      if (ctaText !== undefined) allowedUpdates.ctaText = ctaText;
      if (ctaLink !== undefined) allowedUpdates.ctaLink = ctaLink;
      if (active !== undefined) allowedUpdates.active = active;
      if (order !== undefined) allowedUpdates.order = order;
      if (req.body.isGlobal !== undefined) {
        const isAdminFlag = await isAdmin(userId);
        if (!isAdminFlag) {
          return res.status(403).json({ error: "Admin access required to set global ads" });
        }
        allowedUpdates.isGlobal = req.body.isGlobal;
      }
      const ad = await storage.updateAd(userId, req.params.id, allowedUpdates);
      if (!ad) return res.status(404).json({ error: "Ad not found" });
      res.json(ad);
    } catch (error) {
      console.error("Update ad error:", error);
      res.status(500).json({ error: "Failed to update ad" });
    }
  });

  app.delete("/api/ads/:id", isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const deleted = await storage.deleteAd(userId, req.params.id);
      if (!deleted) return res.status(404).json({ error: "Ad not found" });
      res.json({ success: true });
    } catch (error) {
      console.error("Delete ad error:", error);
      res.status(500).json({ error: "Failed to delete ad" });
    }
  });

  return httpServer;
}
