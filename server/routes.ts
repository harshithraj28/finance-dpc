import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { setupAuth, registerAuthRoutes } from "./replit_integrations/auth";
import { isAuthenticated } from "./replit_integrations/auth/replitAuth";
import { z } from "zod";

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // Setup Replit Auth
  await setupAuth(app);
  registerAuthRoutes(app);

  app.get(api.categories.list.path, isAuthenticated, async (req: any, res) => {
    const categories = await storage.getCategories(req.user.claims.sub);
    res.json(categories);
  });

  app.post(api.categories.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.categories.create.input.parse(req.body);
      const category = await storage.createCategory(req.user.claims.sub, input);
      res.status(201).json(category);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.get(api.transactions.list.path, isAuthenticated, async (req: any, res) => {
    try {
      let filters = {};
      if (req.query.type || req.query.startDate || req.query.endDate || req.query.categoryId) {
        filters = api.transactions.list.input!.parse(req.query);
      }
      const txs = await storage.getTransactions(req.user.claims.sub, filters);
      res.json(txs);
    } catch (err) {
      res.status(400).json({ message: "Invalid filters" });
    }
  });

  app.post(api.transactions.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.transactions.create.input.parse(req.body);
      const tx = await storage.createTransaction(req.user.claims.sub, input);
      res.status(201).json(tx);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.put(api.transactions.update.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.transactions.update.input.parse(req.body);
      const tx = await storage.updateTransaction(Number(req.params.id), req.user.claims.sub, input);
      if (!tx) {
        return res.status(404).json({ message: "Transaction not found" });
      }
      res.json(tx);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message, field: err.errors[0].path.join('.') });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.delete(api.transactions.delete.path, isAuthenticated, async (req: any, res) => {
    const success = await storage.deleteTransaction(Number(req.params.id), req.user.claims.sub);
    if (!success) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    res.status(204).end();
  });

  app.get(api.reports.dashboard.path, isAuthenticated, async (req: any, res) => {
    const summary = await storage.getDashboardSummary(req.user.claims.sub);
    res.json(summary);
  });

  app.get(api.reports.daily.path, isAuthenticated, async (req: any, res) => {
    const reports = await storage.getDailyReports(req.user.claims.sub);
    res.json(reports);
  });

  // Seed endpoint - creates example data for new users
  app.post("/api/seed", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Check if user already has data
      const existingTxs = await storage.getTransactions(userId);
      if (existingTxs.length > 0) {
        return res.json({ message: "User already has data" });
      }

      // Create example categories
      const salaryCategory = await storage.createCategory(userId, { name: "Salary", type: "credit" });
      const freelanceCategory = await storage.createCategory(userId, { name: "Freelance", type: "credit" });
      const groceriesCategory = await storage.createCategory(userId, { name: "Groceries", type: "debit" });
      const rentCategory = await storage.createCategory(userId, { name: "Rent", type: "debit" });
      const utilitiesCategory = await storage.createCategory(userId, { name: "Utilities", type: "debit" });

      // Create example transactions
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      await storage.createTransaction(userId, {
        amount: "5000.00",
        type: "credit",
        categoryId: salaryCategory.id,
        notes: "Monthly salary payment",
        date: lastWeek
      });

      await storage.createTransaction(userId, {
        amount: "800.00",
        type: "credit",
        categoryId: freelanceCategory.id,
        notes: "Website redesign project",
        date: yesterday
      });

      await storage.createTransaction(userId, {
        amount: "1200.00",
        type: "debit",
        categoryId: rentCategory.id,
        notes: "Monthly rent",
        date: lastWeek
      });

      await storage.createTransaction(userId, {
        amount: "156.75",
        type: "debit",
        categoryId: groceriesCategory.id,
        notes: "Weekly grocery shopping",
        date: yesterday
      });

      await storage.createTransaction(userId, {
        amount: "89.50",
        type: "debit",
        categoryId: utilitiesCategory.id,
        notes: "Electricity bill",
        date: now
      });

      res.json({ message: "Seed data created successfully" });
    } catch (error) {
      console.error("Seed error:", error);
      res.status(500).json({ message: "Failed to seed data" });
    }
  });

  return httpServer;
}
