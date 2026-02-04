import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWidgetSchema, insertVentureSchema, insertPrioritySchema, insertRevenueDataSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // ============ WIDGETS ============
  
  // Get all widgets
  app.get("/api/widgets", async (req, res) => {
    try {
      const widgets = await storage.getWidgets();
      res.json(widgets);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch widgets" });
    }
  });

  // Create widget
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

  // Update widget
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

  // Delete widget
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

  // Get layout
  app.get("/api/layout", async (req, res) => {
    try {
      const layout = await storage.getLayout("default");
      res.json(layout || { layouts: [] });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch layout" });
    }
  });

  // Save layout
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

  // Get all ventures
  app.get("/api/ventures", async (req, res) => {
    try {
      const ventures = await storage.getVentures();
      res.json(ventures);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch ventures" });
    }
  });

  // Create venture
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

  // Delete venture
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

  // Get priorities for a venture
  app.get("/api/priorities/:ventureId", async (req, res) => {
    try {
      const priorities = await storage.getPriorities(req.params.ventureId);
      res.json(priorities);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch priorities" });
    }
  });

  // Create priority
  app.post("/api/priorities", async (req, res) => {
    try {
      const parsed = insertPrioritySchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: parsed.error.message });
      }
      
      // Check max 3 priorities per venture
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

  // Update priority
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

  // Delete priority
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

  // Get revenue data for a venture
  app.get("/api/revenue/:ventureId", async (req, res) => {
    try {
      const data = await storage.getRevenueData(req.params.ventureId);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch revenue data" });
    }
  });

  // Create revenue data
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

  return httpServer;
}
