import { pgTable, text, serial, integer, timestamp, numeric, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";

export * from "./models/auth";

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'debit' or 'credit'
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  code: text("code"),
  name: text("name"),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  less: numeric("less", { precision: 12, scale: 2 }).default("0"),
  type: text("type").notNull(), // 'debit' or 'credit'
  categoryId: integer("category_id").references(() => categories.id),
  notes: text("notes"),
  date: timestamp("date").notNull().defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const dailyReports = pgTable("daily_reports", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  reportDate: date("report_date").notNull(), // YYYY-MM-DD
  totalDebit: numeric("total_debit", { precision: 12, scale: 2 }).notNull().default("0"),
  totalCredit: numeric("total_credit", { precision: 12, scale: 2 }).notNull().default("0"),
  netChange: numeric("net_change", { precision: 12, scale: 2 }).notNull().default("0"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}));

export const insertCategorySchema = createInsertSchema(categories).omit({ id: true, createdAt: true, userId: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, createdAt: true, userId: true });
export const insertDailyReportSchema = createInsertSchema(dailyReports).omit({ id: true, createdAt: true, userId: true });

// Types
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type DailyReport = typeof dailyReports.$inferSelect;
export type InsertDailyReport = z.infer<typeof insertDailyReportSchema>;

// Request types
export type CreateTransactionRequest = InsertTransaction;
export type UpdateTransactionRequest = Partial<InsertTransaction>;

// Response types
export type TransactionResponse = Transaction & { category?: Category };
