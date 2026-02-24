import { 
  categories, transactions, dailyReports,
  type Category, type InsertCategory,
  type Transaction, type InsertTransaction,
  type DailyReport, type InsertDailyReport,
  type CreateTransactionRequest,
  type UpdateTransactionRequest
} from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, lte, desc } from "drizzle-orm";

export interface IStorage {
  getCategories(userId: string): Promise<Category[]>;
  createCategory(userId: string, category: InsertCategory): Promise<Category>;
  
  getTransactions(userId: string, filters?: { type?: string, startDate?: string, endDate?: string, categoryId?: number }): Promise<(Transaction & { category?: Category })[]>;
  createTransaction(userId: string, transaction: InsertTransaction): Promise<Transaction>;
  updateTransaction(id: number, userId: string, updates: UpdateTransactionRequest): Promise<Transaction | undefined>;
  deleteTransaction(id: number, userId: string): Promise<boolean>;

  getDailyReports(userId: string): Promise<DailyReport[]>;
  getDashboardSummary(userId: string): Promise<{
    totalCredit: number;
    totalDebit: number;
    outstandingBalance: number;
    todaySummary: { credit: number; debit: number; };
  }>;
}

export class DatabaseStorage implements IStorage {
  async getCategories(userId: string): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.userId, userId));
  }

  async createCategory(userId: string, category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values({ ...category, userId }).returning();
    return newCategory;
  }

  async getTransactions(userId: string, filters?: { type?: string, startDate?: string, endDate?: string, categoryId?: number }): Promise<(Transaction & { category?: Category })[]> {
    let query = db.query.transactions.findMany({
      where: (t, { eq, and, gte, lte }) => {
        const conditions = [eq(t.userId, userId)];
        if (filters?.type) conditions.push(eq(t.type, filters.type));
        if (filters?.categoryId) conditions.push(eq(t.categoryId, filters.categoryId));
        if (filters?.startDate) conditions.push(gte(t.date, new Date(filters.startDate)));
        if (filters?.endDate) conditions.push(lte(t.date, new Date(filters.endDate)));
        return and(...conditions);
      },
      with: {
        category: true
      },
      orderBy: (t, { desc }) => [desc(t.date)]
    });
    return await query;
  }

  async createTransaction(userId: string, transaction: InsertTransaction): Promise<Transaction> {
    const [newTx] = await db.insert(transactions).values({ ...transaction, userId }).returning();
    return newTx;
  }

  async updateTransaction(id: number, userId: string, updates: UpdateTransactionRequest): Promise<Transaction | undefined> {
    const [updated] = await db.update(transactions)
      .set(updates)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .returning();
    return updated;
  }

  async deleteTransaction(id: number, userId: string): Promise<boolean> {
    const [deleted] = await db.delete(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .returning();
    return !!deleted;
  }

  async getDailyReports(userId: string): Promise<DailyReport[]> {
    return await db.select().from(dailyReports).where(eq(dailyReports.userId, userId)).orderBy(desc(dailyReports.reportDate));
  }

  async getDashboardSummary(userId: string) {
    const userTxs = await db.select().from(transactions).where(eq(transactions.userId, userId));
    let totalCredit = 0;
    let totalDebit = 0;
    let todayCredit = 0;
    let todayDebit = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    userTxs.forEach(tx => {
      const amount = parseFloat(tx.amount.toString());
      if (tx.type === 'credit') {
        totalCredit += amount;
        if (new Date(tx.date) >= today) todayCredit += amount;
      } else {
        totalDebit += amount;
        if (new Date(tx.date) >= today) todayDebit += amount;
      }
    });

    return {
      totalCredit,
      totalDebit,
      outstandingBalance: totalCredit - totalDebit,
      todaySummary: {
        credit: todayCredit,
        debit: todayDebit
      }
    };
  }
}

export const storage = new DatabaseStorage();
