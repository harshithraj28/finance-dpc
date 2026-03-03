import { accounts, transactions, type Account, type InsertAccount, type Transaction, type InsertTransaction } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lt,lte, sql } from "drizzle-orm";

export interface IStorage {
  searchAccounts(query: string): Promise<Account[]>;
  getAccountByCode(code: string): Promise<Account | undefined>;
  createAccount(data: InsertAccount): Promise<Account>;

  getTodayTransactions(): Promise<Transaction[]>;
  createTransaction(data: InsertTransaction): Promise<Transaction>;

  getDashboardSummary(): Promise<{
    totalCredit: number;
    totalDebit: number;
    outstanding: number;
  }>;
}

export class DatabaseStorage implements IStorage {

  // 🔎 Search by name OR code
  async searchAccounts(query: string): Promise<Account[]> {
    return await db
      .select()
      .from(accounts)
      .where(
        sql`lower(${accounts.name}) like ${'%' + query.toLowerCase() + '%'}
        OR lower(${accounts.code}) like ${'%' + query.toLowerCase() + '%'}`
      )
      .orderBy(accounts.name);
  }

  async getAccountByCode(code: string): Promise<Account | undefined> {
    const result = await db
      .select()
      .from(accounts)
      .where(eq(accounts.code, code));

    return result[0];
  }

  async createAccount(data: InsertAccount): Promise<Account> {
    const [account] = await db.insert(accounts).values(data).returning();
    return account;
  }

  // 📅 Get today's transactions only
  async getTodayTransactions(): Promise<Transaction[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    return await db
      .select()
      .from(transactions)
      .where(
        and(
          gte(transactions.date, today),
          lt(transactions.date, tomorrow)
        )
      )
      .orderBy(desc(transactions.serial));
  }

  async getOutstandingTillDate(selectedDate: string) {
    const result = await db.execute(`
      SELECT 
        a.id,
        a.name,
        MAX(t.date) as "lastDate",
        COALESCE(SUM(CASE WHEN t.type = 'debit' THEN t.amount END),0) 
        -
        COALESCE(SUM(CASE WHEN t.type = 'credit' THEN t.amount END),0) 
        as balance
      FROM accounts a
      LEFT JOIN transactions t 
        ON a.id = t.account_id
        AND DATE(t.date) <= '${selectedDate}'
      GROUP BY a.id, a.name
      ORDER BY a.name ASC
    `);

    return result.rows;
  }
  // 🔢 Auto daily serial + create transaction
  async createTransaction(data: InsertTransaction): Promise<Transaction> {

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const todayTxs = await db
      .select()
      .from(transactions)
      .where(
        and(
          gte(transactions.date, today),
          lt(transactions.date, tomorrow)
        )
      );

    const nextSerial = todayTxs.length + 1;

    const [tx] = await db
      .insert(transactions)
      .values({
        ...data,
        serial: nextSerial,
        date: new Date()
      })
      .returning();

    return tx;
  }

  // 📊 Dashboard Summary
  async getDashboardSummary() {

    const allTxs = await db.select().from(transactions);

    let totalCredit = 0;
    let totalDebit = 0;

    allTxs.forEach(tx => {
      const amount = parseFloat(tx.amount.toString());
      if (tx.type === "credit") totalCredit += amount;
      else totalDebit += amount;
    });

    return {
      totalCredit,
      totalDebit,
      outstanding: totalDebit - totalCredit
    };
  }
}

export const storage = new DatabaseStorage();