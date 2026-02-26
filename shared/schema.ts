import { pgTable, text, serial, integer, timestamp, numeric, date } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ======================
// ACCOUNTS TABLE
// ======================
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  createdAt: timestamp("created_at").defaultNow(),
});

// ======================
// TRANSACTIONS TABLE
// ======================
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),

  serial: integer("serial").notNull(), // Daily serial number

  accountId: integer("account_id")
    .references(() => accounts.id)
    .notNull(),

  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),

  type: text("type").notNull(), // 'debit' or 'credit'

  detail: text("detail"),

  date: date("date").notNull(),

  createdAt: timestamp("created_at").defaultNow(),
});

// ======================
// RELATIONS
// ======================
export const accountsRelations = relations(accounts, ({ many }) => ({
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id],
  }),
}));

// ======================
// INSERT SCHEMAS
// ======================
export const insertAccountSchema = createInsertSchema(accounts).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

// ======================
// TYPES
// ======================
export type Account = typeof accounts.$inferSelect;
export type InsertAccount = z.infer<typeof insertAccountSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;