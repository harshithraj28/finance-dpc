import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { db } from "./db";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ==============================
  // 🔐 Fake local admin login
  // ==============================
  app.get("/api/auth/user", async (_req, res) => {
    res.json({
      id: 1,
      email: "admin@local.com",
      name: "Admin"
    });
  });

  // ==============================
  // 🔎 Search account
  // ==============================
  app.get("/api/accounts/search", async (req, res) => {
    const query = String(req.query.q || "");
    if (!query) return res.json([]);

    const results = await storage.searchAccounts(query);
    res.json(results);
  });

  // ==============================
  // ➕ Create account
  // ==============================
  app.post("/api/accounts", async (req, res) => {
    try {
      const { name, code } = req.body;

      if (!name || !code) {
        return res.status(400).json({ message: "Name and Code required" });
      }

      const existing = await storage.getAccountByCode(code);
      if (existing) {
        return res.status(400).json({ message: "Code already exists" });
      }

      const account = await storage.createAccount({ name, code });
      res.status(201).json(account);

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  // ==============================
  // 📅 Get Today's Transactions (FIXED)
  // ==============================
  app.get("/api/transactions/today", async (_req, res) => {
    try {
      const result = await db.execute(`
        SELECT 
          t.id,
          t.account_id as "accountId",
          t.amount,
          t.type,
          t.detail,
          t.date,
          a.name
        FROM transactions t
        JOIN accounts a ON t.account_id = a.id
        WHERE t.date >= CURRENT_DATE
        AND t.date < CURRENT_DATE + INTERVAL '1 day'
        ORDER BY t.id ASC
      `);

      res.json(result.rows || []);

    } catch (error) {
      console.error("Transactions error:", error);
      res.status(500).json([]);
    }
  });

  // ==============================
  // ➕ Create Transaction (FIXED)
  // ==============================
  app.post("/api/transactions", async (req, res) => {
    try {
      const { accountId, amount, type, detail } = req.body;

      if (!accountId || !amount || !type) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      await db.execute(
        `INSERT INTO transactions (account_id, amount, type, detail, date)
         VALUES ($1, $2, $3, $4, NOW())`,
        [accountId, amount, type, detail || ""]
      );

      res.status(201).json({ message: "Transaction created" });

    } catch (error) {
      console.error("Insert error:", error);
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  // ==============================
  // ✏️ Edit Transaction
  // ==============================
  app.put("/api/transactions/:id", async (req, res) => {
    try {
      const { amount, type, detail } = req.body;

      await db.execute(
        `UPDATE transactions
         SET amount = $1,
             type = $2,
             detail = $3
         WHERE id = $4`,
        [amount, type, detail || "", req.params.id]
      );

      res.json({ message: "Updated" });

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Update failed" });
    }
  });

  // ==============================
  // 🗑 Delete Transaction
  // ==============================
  app.delete("/api/transactions/:id", async (req, res) => {
    try {
      await db.execute(
        `DELETE FROM transactions WHERE id = $1`,
        [req.params.id]
      );

      res.json({ message: "Deleted" });

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Delete failed" });
    }
  });

  // ==============================
  // 📊 Dashboard (Today Only - FIXED)
  // ==============================
  app.get("/api/dashboard", async (_req, res) => {
    try {
      const result = await db.execute(`
        SELECT
          COALESCE(SUM(CASE WHEN type = 'credit' THEN amount END),0) as credit,
          COALESCE(SUM(CASE WHEN type = 'debit' THEN amount END),0) as debit
        FROM transactions
        WHERE date >= CURRENT_DATE
        AND date < CURRENT_DATE + INTERVAL '1 day'
      `);

      const credit = Number(result.rows[0].credit || 0);
      const debit = Number(result.rows[0].debit || 0);

      res.json({
        totalCredit: credit,
        totalDebit: debit,
        outstanding: debit - credit
      });

    } catch (error) {
      console.error(error);
      res.status(500).json({
        totalCredit: 0,
        totalDebit: 0,
        outstanding: 0
      });
    }
  });

  return httpServer;
}