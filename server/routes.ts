import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWidgetSchema, insertVentureSchema, insertPrioritySchema, insertRevenueDataSchema, insertDesktopSchema, insertFocusContractSchema, insertCaptureItemSchema, insertHabitSchema, insertHabitEntrySchema, insertJournalEntrySchema, insertScorecardMetricSchema, insertScorecardEntrySchema, insertKpiSchema, insertWaitingItemSchema, insertDealSchema, insertTimeBlockSchema, insertRecurringExpenseSchema, insertVariableExpenseSchema, insertMeetingSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // ============ DESKTOPS ============

  app.get("/api/desktops", async (req, res) => {
    try {
      const desktopList = await storage.getDesktops();
      res.json(desktopList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch desktops" });
    }
  });

  app.post("/api/desktops", async (req, res) => {
    try {
      const parsed = insertDesktopSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const desktop = await storage.createDesktop(parsed.data);
      res.status(201).json(desktop);
    } catch (error) {
      res.status(500).json({ error: "Failed to create desktop" });
    }
  });

  app.patch("/api/desktops/:id", async (req, res) => {
    try {
      const desktop = await storage.updateDesktop(req.params.id, req.body);
      if (!desktop) {
        return res.status(404).json({ error: "Desktop not found" });
      }
      res.json(desktop);
    } catch (error) {
      res.status(500).json({ error: "Failed to update desktop" });
    }
  });

  app.delete("/api/desktops/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteDesktop(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Desktop not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete desktop" });
    }
  });

  // ============ WIDGETS ============
  
  app.get("/api/widgets", async (req, res) => {
    try {
      const desktopId = req.query.desktopId as string | undefined;
      if (desktopId) {
        const widgetList = await storage.getWidgetsByDesktop(desktopId);
        res.json(widgetList);
      } else {
        const widgetList = await storage.getWidgets();
        res.json(widgetList);
      }
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch widgets" });
    }
  });

  app.get("/api/widgets/pinned", async (req, res) => {
    try {
      const pinnedWidgets = await storage.getPinnedWidgets();
      res.json(pinnedWidgets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch pinned widgets" });
    }
  });

  app.post("/api/widgets", async (req, res) => {
    try {
      const parsed = insertWidgetSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const widget = await storage.createWidget(parsed.data);
      res.status(201).json(widget);
    } catch (error) {
      res.status(500).json({ error: "Failed to create widget" });
    }
  });

  app.patch("/api/widgets/:id", async (req, res) => {
    try {
      const widget = await storage.updateWidget(req.params.id, req.body);
      if (!widget) {
        return res.status(404).json({ error: "Widget not found" });
      }
      res.json(widget);
    } catch (error) {
      res.status(500).json({ error: "Failed to update widget" });
    }
  });

  app.delete("/api/widgets/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteWidget(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Widget not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete widget" });
    }
  });

  // ============ LAYOUT ============

  app.get("/api/layout", async (req, res) => {
    try {
      const layout = await storage.getLayout("default");
      res.json(layout || { layouts: [] });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch layout" });
    }
  });

  app.put("/api/layout", async (req, res) => {
    try {
      const { layouts } = req.body;
      const layout = await storage.saveLayout("default", layouts || []);
      res.json(layout);
    } catch (error) {
      res.status(500).json({ error: "Failed to save layout" });
    }
  });

  // ============ VENTURES ============

  app.get("/api/ventures", async (req, res) => {
    try {
      const ventureList = await storage.getVentures();
      res.json(ventureList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ventures" });
    }
  });

  app.post("/api/ventures", async (req, res) => {
    try {
      const parsed = insertVentureSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const venture = await storage.createVenture(parsed.data);
      res.status(201).json(venture);
    } catch (error) {
      res.status(500).json({ error: "Failed to create venture" });
    }
  });

  app.delete("/api/ventures/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteVenture(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Venture not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete venture" });
    }
  });

  // ============ PRIORITIES ============

  app.get("/api/priorities/:ventureId", async (req, res) => {
    try {
      const priorityList = await storage.getPriorities(req.params.ventureId);
      res.json(priorityList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch priorities" });
    }
  });

  app.post("/api/priorities", async (req, res) => {
    try {
      const parsed = insertPrioritySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      
      const existing = await storage.getPriorities(parsed.data.ventureId);
      if (existing.length >= 3) {
        return res.status(400).json({ error: "Maximum 3 priorities per venture" });
      }
      
      const priority = await storage.createPriority(parsed.data);
      res.status(201).json(priority);
    } catch (error) {
      res.status(500).json({ error: "Failed to create priority" });
    }
  });

  app.patch("/api/priorities/:id", async (req, res) => {
    try {
      const priority = await storage.updatePriority(req.params.id, req.body);
      if (!priority) {
        return res.status(404).json({ error: "Priority not found" });
      }
      res.json(priority);
    } catch (error) {
      res.status(500).json({ error: "Failed to update priority" });
    }
  });

  app.delete("/api/priorities/:id", async (req, res) => {
    try {
      const deleted = await storage.deletePriority(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Priority not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete priority" });
    }
  });

  // ============ REVENUE ============

  app.get("/api/revenue/:ventureId", async (req, res) => {
    try {
      const data = await storage.getRevenueData(req.params.ventureId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch revenue data" });
    }
  });

  app.post("/api/revenue", async (req, res) => {
    try {
      const parsed = insertRevenueDataSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const data = await storage.createRevenueData(parsed.data);
      res.status(201).json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to create revenue data" });
    }
  });

  app.patch("/api/revenue/:id", async (req, res) => {
    try {
      const data = await storage.updateRevenueData(req.params.id, req.body);
      if (!data) {
        return res.status(404).json({ error: "Revenue data not found" });
      }
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to update revenue data" });
    }
  });

  app.delete("/api/revenue/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteRevenueData(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Revenue data not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete revenue data" });
    }
  });

  // ============ FOCUS CONTRACTS ============

  app.get("/api/focus-contracts", async (req, res) => {
    try {
      const { desktopId, date } = req.query;
      if (!desktopId || !date) {
        return res.status(400).json({ error: "desktopId and date are required" });
      }
      const contract = await storage.getFocusContract(desktopId as string, date as string);
      res.json(contract || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch focus contract" });
    }
  });

  app.put("/api/focus-contracts", async (req, res) => {
    try {
      const parsed = insertFocusContractSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      const contract = await storage.upsertFocusContract(parsed.data);
      res.json(contract);
    } catch (error) {
      res.status(500).json({ error: "Failed to save focus contract" });
    }
  });

  // ============ APP SETTINGS ============

  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getAppSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.patch("/api/settings", async (req, res) => {
    try {
      const settings = await storage.updateAppSettings(req.body);
      res.json(settings);
    } catch (error) {
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  // ============ QUICK CAPTURE ============

  app.get("/api/capture-items", async (req, res) => {
    try {
      const items = await storage.getCaptureItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch capture items" });
    }
  });

  app.post("/api/capture-items", async (req, res) => {
    try {
      const parsed = insertCaptureItemSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
      const item = await storage.createCaptureItem(parsed.data);
      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to create capture item" });
    }
  });

  app.patch("/api/capture-items/:id", async (req, res) => {
    try {
      const item = await storage.updateCaptureItem(req.params.id, req.body);
      if (!item) return res.status(404).json({ error: "Item not found" });
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update capture item" });
    }
  });

  app.delete("/api/capture-items/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteCaptureItem(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Item not found" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete capture item" });
    }
  });

  // ============ HABITS ============

  app.get("/api/habits", async (req, res) => {
    try {
      const habitList = await storage.getHabits();
      res.json(habitList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch habits" });
    }
  });

  app.post("/api/habits", async (req, res) => {
    try {
      const parsed = insertHabitSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
      const habit = await storage.createHabit(parsed.data);
      res.status(201).json(habit);
    } catch (error) {
      res.status(500).json({ error: "Failed to create habit" });
    }
  });

  app.delete("/api/habits/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteHabit(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Habit not found" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete habit" });
    }
  });

  app.get("/api/habit-entries", async (req, res) => {
    try {
      const entries = await storage.getAllHabitEntries();
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch habit entries" });
    }
  });

  app.post("/api/habit-entries", async (req, res) => {
    try {
      const parsed = insertHabitEntrySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
      const entry = await storage.createHabitEntry(parsed.data);
      res.status(201).json(entry);
    } catch (error) {
      res.status(500).json({ error: "Failed to create habit entry" });
    }
  });

  app.delete("/api/habit-entries/:habitId/:date", async (req, res) => {
    try {
      const deleted = await storage.deleteHabitEntry(req.params.habitId, req.params.date);
      if (!deleted) return res.status(404).json({ error: "Entry not found" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete habit entry" });
    }
  });

  // ============ JOURNAL ============

  app.get("/api/journal", async (req, res) => {
    try {
      const entries = await storage.getJournalEntries();
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch journal entries" });
    }
  });

  app.get("/api/journal/:date", async (req, res) => {
    try {
      const entry = await storage.getJournalEntry(req.params.date);
      res.json(entry || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch journal entry" });
    }
  });

  app.put("/api/journal", async (req, res) => {
    try {
      const parsed = insertJournalEntrySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
      const entry = await storage.upsertJournalEntry(parsed.data);
      res.json(entry);
    } catch (error) {
      res.status(500).json({ error: "Failed to save journal entry" });
    }
  });

  // ============ SCORECARD ============

  app.get("/api/scorecard-metrics", async (req, res) => {
    try {
      const metrics = await storage.getScorecardMetrics();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scorecard metrics" });
    }
  });

  app.post("/api/scorecard-metrics", async (req, res) => {
    try {
      const parsed = insertScorecardMetricSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
      const metric = await storage.createScorecardMetric(parsed.data);
      res.status(201).json(metric);
    } catch (error) {
      res.status(500).json({ error: "Failed to create scorecard metric" });
    }
  });

  app.patch("/api/scorecard-metrics/:id", async (req, res) => {
    try {
      const metric = await storage.updateScorecardMetric(req.params.id, req.body);
      if (!metric) return res.status(404).json({ error: "Metric not found" });
      res.json(metric);
    } catch (error) {
      res.status(500).json({ error: "Failed to update scorecard metric" });
    }
  });

  app.delete("/api/scorecard-metrics/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteScorecardMetric(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Metric not found" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete scorecard metric" });
    }
  });

  app.get("/api/scorecard-entries", async (req, res) => {
    try {
      const entries = await storage.getAllScorecardEntries();
      res.json(entries);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch scorecard entries" });
    }
  });

  app.put("/api/scorecard-entries", async (req, res) => {
    try {
      const parsed = insertScorecardEntrySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
      const entry = await storage.upsertScorecardEntry(parsed.data);
      res.json(entry);
    } catch (error) {
      res.status(500).json({ error: "Failed to save scorecard entry" });
    }
  });

  // ============ KPIs ============

  app.get("/api/kpis", async (req, res) => {
    try {
      const kpiList = await storage.getKpis();
      res.json(kpiList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch KPIs" });
    }
  });

  app.post("/api/kpis", async (req, res) => {
    try {
      const parsed = insertKpiSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
      const kpi = await storage.createKpi(parsed.data);
      res.status(201).json(kpi);
    } catch (error) {
      res.status(500).json({ error: "Failed to create KPI" });
    }
  });

  app.patch("/api/kpis/:id", async (req, res) => {
    try {
      const kpi = await storage.updateKpi(req.params.id, req.body);
      if (!kpi) return res.status(404).json({ error: "KPI not found" });
      res.json(kpi);
    } catch (error) {
      res.status(500).json({ error: "Failed to update KPI" });
    }
  });

  app.delete("/api/kpis/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteKpi(req.params.id);
      if (!deleted) return res.status(404).json({ error: "KPI not found" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete KPI" });
    }
  });

  // ============ WAITING FOR ============

  app.get("/api/waiting-items", async (req, res) => {
    try {
      const items = await storage.getWaitingItems();
      res.json(items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch waiting items" });
    }
  });

  app.post("/api/waiting-items", async (req, res) => {
    try {
      const parsed = insertWaitingItemSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
      const item = await storage.createWaitingItem(parsed.data);
      res.status(201).json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to create waiting item" });
    }
  });

  app.patch("/api/waiting-items/:id", async (req, res) => {
    try {
      const item = await storage.updateWaitingItem(req.params.id, req.body);
      if (!item) return res.status(404).json({ error: "Item not found" });
      res.json(item);
    } catch (error) {
      res.status(500).json({ error: "Failed to update waiting item" });
    }
  });

  app.delete("/api/waiting-items/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteWaitingItem(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Item not found" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete waiting item" });
    }
  });

  // ============ DEALS (CRM) ============

  app.get("/api/deals", async (req, res) => {
    try {
      const dealList = await storage.getDeals();
      res.json(dealList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch deals" });
    }
  });

  app.post("/api/deals", async (req, res) => {
    try {
      const parsed = insertDealSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
      const deal = await storage.createDeal(parsed.data);
      res.status(201).json(deal);
    } catch (error) {
      res.status(500).json({ error: "Failed to create deal" });
    }
  });

  app.patch("/api/deals/:id", async (req, res) => {
    try {
      const deal = await storage.updateDeal(req.params.id, req.body);
      if (!deal) return res.status(404).json({ error: "Deal not found" });
      res.json(deal);
    } catch (error) {
      res.status(500).json({ error: "Failed to update deal" });
    }
  });

  app.delete("/api/deals/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteDeal(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Deal not found" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete deal" });
    }
  });

  // ============ TIME BLOCKS ============

  app.get("/api/time-blocks/:date", async (req, res) => {
    try {
      const blocks = await storage.getTimeBlocks(req.params.date);
      res.json(blocks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch time blocks" });
    }
  });

  app.post("/api/time-blocks", async (req, res) => {
    try {
      const parsed = insertTimeBlockSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
      const block = await storage.createTimeBlock(parsed.data);
      res.status(201).json(block);
    } catch (error) {
      res.status(500).json({ error: "Failed to create time block" });
    }
  });

  app.patch("/api/time-blocks/:id", async (req, res) => {
    try {
      const block = await storage.updateTimeBlock(req.params.id, req.body);
      if (!block) return res.status(404).json({ error: "Time block not found" });
      res.json(block);
    } catch (error) {
      res.status(500).json({ error: "Failed to update time block" });
    }
  });

  app.delete("/api/time-blocks/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTimeBlock(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Time block not found" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete time block" });
    }
  });

  // ============ EXPENSES ============

  app.get("/api/recurring-expenses", async (req, res) => {
    try {
      const expenses = await storage.getRecurringExpenses();
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch recurring expenses" });
    }
  });

  app.post("/api/recurring-expenses", async (req, res) => {
    try {
      const parsed = insertRecurringExpenseSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
      const expense = await storage.createRecurringExpense(parsed.data);
      res.status(201).json(expense);
    } catch (error) {
      res.status(500).json({ error: "Failed to create recurring expense" });
    }
  });

  app.patch("/api/recurring-expenses/:id", async (req, res) => {
    try {
      const expense = await storage.updateRecurringExpense(req.params.id, req.body);
      if (!expense) return res.status(404).json({ error: "Expense not found" });
      res.json(expense);
    } catch (error) {
      res.status(500).json({ error: "Failed to update recurring expense" });
    }
  });

  app.delete("/api/recurring-expenses/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteRecurringExpense(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Expense not found" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete recurring expense" });
    }
  });

  app.get("/api/variable-expenses", async (req, res) => {
    try {
      const expenses = await storage.getVariableExpenses();
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch variable expenses" });
    }
  });

  app.post("/api/variable-expenses", async (req, res) => {
    try {
      const parsed = insertVariableExpenseSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
      const expense = await storage.createVariableExpense(parsed.data);
      res.status(201).json(expense);
    } catch (error) {
      res.status(500).json({ error: "Failed to create variable expense" });
    }
  });

  app.delete("/api/variable-expenses/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteVariableExpense(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Expense not found" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete variable expense" });
    }
  });

  // ============ MEETINGS ============

  app.get("/api/meetings", async (req, res) => {
    try {
      const meetingList = await storage.getMeetings();
      res.json(meetingList);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch meetings" });
    }
  });

  app.post("/api/meetings", async (req, res) => {
    try {
      const parsed = insertMeetingSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.message });
      const meeting = await storage.createMeeting(parsed.data);
      res.status(201).json(meeting);
    } catch (error) {
      res.status(500).json({ error: "Failed to create meeting" });
    }
  });

  app.patch("/api/meetings/:id", async (req, res) => {
    try {
      const meeting = await storage.updateMeeting(req.params.id, req.body);
      if (!meeting) return res.status(404).json({ error: "Meeting not found" });
      res.json(meeting);
    } catch (error) {
      res.status(500).json({ error: "Failed to update meeting" });
    }
  });

  app.delete("/api/meetings/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteMeeting(req.params.id);
      if (!deleted) return res.status(404).json({ error: "Meeting not found" });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete meeting" });
    }
  });

  return httpServer;
}
