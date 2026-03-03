import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { db } from "./db";
import { transactions } from "../shared/schema";
import { eq } from "drizzle-orm";
import PDFDocument from "pdfkit";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // ==============================
  // 🔐 Fake Login
  // ==============================
  app.get("/api/auth/user", async (_req, res) => {
    res.json({
      id: 1,
      email: "admin@local.com",
      name: "Admin"
    });
  });

  // ==============================
  // 🔎 Search Account
  // ==============================
  app.get("/api/accounts/search", async (req, res) => {
    const query = String(req.query.q || "");
    if (!query) return res.json([]);

    const results = await storage.searchAccounts(query);
    res.json(results);
  });

  // ==============================
  // ➕ Create Account
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
  // 💰 Account Balance (All Time)
  // ==============================
  app.get("/api/accounts/:id/balance", async (req, res) => {
    try {
      const accountId = Number(req.params.id);

      const result = await db.execute(`
        SELECT
          COALESCE(SUM(CASE WHEN type = 'debit' THEN amount END),0) as debit,
          COALESCE(SUM(CASE WHEN type = 'credit' THEN amount END),0) as credit
        FROM transactions
        WHERE account_id = ${accountId}
      `);

      const debit = Number(result.rows[0]?.debit || 0);
      const credit = Number(result.rows[0]?.credit || 0);

      res.json({
        balance: debit - credit
      });

    } catch (error) {
      console.error("Balance error:", error);
      res.status(500).json({ balance: 0 });
    }
  });

  // ==============================
  // 📅 Get Transactions By Selected Date
  // ==============================
  app.get("/api/transactions", async (req, res) => {
    try {
      const selectedDate = String(req.query.date);

      if (!selectedDate) {
        return res.status(400).json({ message: "Date is required" });
      }

      const result = await db.execute(`
        SELECT 
          t.id,
          t.serial,
          t.account_id as "accountId",
          t.amount,
          t.type,
          t.detail,
          t.date,
          a.name
        FROM transactions t
        JOIN accounts a ON t.account_id = a.id
        WHERE DATE(t.date) = '${selectedDate}'
        ORDER BY t.serial ASC
      `);

      res.json(result.rows || []);

    } catch (error) {
      console.error("Transactions error:", error);
      res.status(500).json([]);
    }
  });

  // ==============================
  // ➕ Create Transaction (Uses Selected Date)
  // ==============================
  app.post("/api/transactions", async (req, res) => {
    try {
      let { accountId, amount, type, detail, date } = req.body;

      accountId = Number(accountId);
      amount = Number(amount);
      type = String(type).toLowerCase();

      if (!accountId || !amount || !type || !date) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // 🔥 Serial per selected date
      const serialResult = await db.execute(`
        SELECT COALESCE(MAX(serial), 0) + 1 as next_serial
        FROM transactions
        WHERE DATE(date) = '${date}'
      `);

      const nextSerial = Number(serialResult.rows[0].next_serial);

      await db.insert(transactions).values({
        serial: nextSerial,
        accountId,
        amount,
        type,
        detail: detail || "",
        date
      });

      res.status(201).json({ message: "Transaction created" });

    } catch (error) {
      console.error("INSERT ERROR:", error);
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  // ==============================
  // ✏️ Edit Transaction
  // ==============================
  app.put("/api/transactions/:id", async (req, res) => {
    try {
      let { amount, type, detail } = req.body;

      amount = Number(amount);
      type = String(type).toLowerCase();

      await db.update(transactions)
        .set({ amount, type, detail: detail || "" })
        .where(eq(transactions.id, Number(req.params.id)));

      res.json({ message: "Updated" });

    } catch (error) {
      console.error("UPDATE ERROR:", error);
      res.status(500).json({ message: "Update failed" });
    }
  });

  // ==============================
  // 🗑 Delete Transaction (Reorder Serial Properly)
  // ==============================
  app.delete("/api/transactions/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);

      const result = await db.execute(`
        SELECT date FROM transactions WHERE id = $1
      `, [id]);

      if (!result.rows.length) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      const txDate = result.rows[0].date;

      await db.execute(`DELETE FROM transactions WHERE id = $1`, [id]);

      const remaining = await db.execute(`
        SELECT id FROM transactions
        WHERE DATE(date) = $1
        ORDER BY serial ASC
      `, [txDate]);

      for (let i = 0; i < remaining.rows.length; i++) {
        await db.execute(`
          UPDATE transactions
          SET serial = $1
          WHERE id = $2
        `, [i + 1, remaining.rows[i].id]);
      }

      res.json({ message: "Deleted and serial reordered" });

    } catch (error) {
      console.error("DELETE ERROR:", error);
      res.status(500).json({ message: "Delete failed" });
    }
  });

  // ==============================
  // 📄 Export Outstanding PDF
  // ==============================
  app.get("/api/export/outstanding", async (req, res) => {
    try {
      const selectedDate = req.query.date as string;

      if (!selectedDate) {
        return res.status(400).json({ message: "Date is required" });
      }

      const data = await storage.getOutstandingTillDate(selectedDate);

      const doc = new PDFDocument({ size: "A4", margin: 40 });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "inline; filename=OutstandingReport.pdf");

      doc.pipe(res);

      doc.font("Courier-Bold").fontSize(16).text("DPC-92", 40, 30);
      doc.fontSize(10).text(`${selectedDate}`, 450, 32);

      doc.moveTo(40, 55).lineTo(555, 55).stroke();

      // ================= PAGE SYSTEM =================
      let pageNumber = 1;

      const drawHeader = () => {


        // ===== PAGE NUMBER (Top Right - Only Number) =====
        // ===== CIRCLED PAGE NUMBER =====
        const circleX = 545;   // horizontal position
        const circleY = 38;    // vertical position
        const radius = 12;

        // Draw circle
        doc.circle(circleX, circleY, radius).stroke();

        // Draw number centered inside circle
        doc.font("Courier-Bold")
          .fontSize(10)
          .text(
            `${pageNumber}`,
            circleX - 5,
            circleY - 6,
            {
              width: 10,
              align: "center"
            }
          );

        // ===== CENTER TEXT (OM SAI RAM) =====
        doc.font("Courier-Bold")
          .fontSize(14)
          .text("OM SAI RAM", 40, 30, {
            width: 515,
            align: "center"
          });

        // ===== SINGLE HEADER LINE =====
        doc.moveTo(40, 70).lineTo(555, 70).stroke();

        // ===== TABLE HEADINGS =====
        doc.font("Courier-Bold")
          .fontSize(11);

        // LEFT COLUMN
        doc.text("Name", 40, 85);
        doc.text("Last Date", 155, 85);
        doc.text("Balance", 235, 85);
        doc.text("CR", 285, 85);

        // RIGHT COLUMN
        doc.text("Name", 310, 85);
        doc.text("Last Date", 415, 85);
        doc.text("Balance", 490, 85);
        doc.text("CR", 540, 85);

        doc.moveTo(40, 100).lineTo(555, 100).stroke();

        // Vertical divider
        doc.moveTo(300, 70).lineTo(300, 800).stroke();

        doc.font("Courier").fontSize(11);
      };

      drawHeader();

      let yLeft = 115;
      let yRight = 115;
      let column = "left";
      const rowHeight = 20;
      const maxY = 770;

      data.forEach((item) => {

        const balance = Number(item.balance || 0);
        if (balance === 0) return;

        const displayBalance = Math.abs(balance).toString(); // No decimals
        const isCR = balance < 0;
        const crText = isCR ? "CR" : "";

        const drawRow = (xStart: number, y: number) => {

          if (isCR) {
            doc.font("Courier-Bold");
          } else {
            doc.font("Courier");
          }

          doc.text(item.name, xStart, y);
          doc.text(item.lastDate ?? "-", xStart + 115, y);

          doc.text(displayBalance, xStart + 190, y, {
            width: 45,
            align: "right"
          });

          doc.text(crText, xStart + 240, y);
        };

        if (column === "left") {

          drawRow(40, yLeft);
          yLeft += rowHeight;

          if (yLeft > maxY) {
            column = "right";
          }

        } else {

          drawRow(310, yRight);
          yRight += rowHeight;

          if (yRight > maxY) {

            pageNumber++;
            doc.addPage();

            yLeft = 115;
            yRight = 115;
            column = "left";

            drawHeader();
          }
        }
      });

      doc.end();

    } catch (err) {
      console.error("PDF Export Error:", err);
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  // ==============================
  // 📊 Dashboard By Date
  // ==============================
  app.get("/api/dashboard", async (req, res) => {
    try {
      const selectedDate = req.query.date;

      if (!selectedDate) {
        return res.status(400).json({
          totalCredit: 0,
          totalDebit: 0,
          outstanding: 0
        });
      }

      const result = await db.execute(`
        SELECT
          COALESCE(SUM(CASE WHEN type = 'credit' THEN amount END),0) as credit,
          COALESCE(SUM(CASE WHEN type = 'debit' THEN amount END),0) as debit
        FROM transactions
         WHERE DATE(date) = '${selectedDate}'
    `);
      const credit = Number(result.rows[0]?.credit || 0);
      const debit = Number(result.rows[0]?.debit || 0);

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