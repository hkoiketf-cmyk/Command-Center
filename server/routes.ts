import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertWidgetSchema, insertVentureSchema, insertPrioritySchema, insertRevenueDataSchema, insertDesktopSchema } from "@shared/schema";
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

  return httpServer;
}
