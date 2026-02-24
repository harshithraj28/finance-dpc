import { z } from 'zod';
import { insertCategorySchema, insertTransactionSchema, categories, transactions, dailyReports } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  categories: {
    list: {
      method: 'GET' as const,
      path: '/api/categories' as const,
      responses: {
        200: z.array(z.custom<typeof categories.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/categories' as const,
      input: insertCategorySchema,
      responses: {
        201: z.custom<typeof categories.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      }
    }
  },
  transactions: {
    list: {
      method: 'GET' as const,
      path: '/api/transactions' as const,
      input: z.object({
        type: z.string().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        categoryId: z.coerce.number().optional(),
      }).optional(),
      responses: {
        200: z.array(z.custom<typeof transactions.$inferSelect & { category?: typeof categories.$inferSelect }>()),
        401: errorSchemas.unauthorized,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/transactions' as const,
      input: insertTransactionSchema.extend({
        amount: z.coerce.string(),
        categoryId: z.coerce.number().optional(),
        date: z.coerce.date().optional()
      }),
      responses: {
        201: z.custom<typeof transactions.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
    update: {
      method: 'PUT' as const,
      path: '/api/transactions/:id' as const,
      input: insertTransactionSchema.partial().extend({
        amount: z.coerce.string().optional(),
        categoryId: z.coerce.number().optional(),
        date: z.coerce.date().optional()
      }),
      responses: {
        200: z.custom<typeof transactions.$inferSelect>(),
        400: errorSchemas.validation,
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/transactions/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    }
  },
  reports: {
    daily: {
      method: 'GET' as const,
      path: '/api/reports/daily' as const,
      responses: {
        200: z.array(z.custom<typeof dailyReports.$inferSelect>()),
        401: errorSchemas.unauthorized,
      }
    },
    generate: {
      method: 'POST' as const,
      path: '/api/reports/generate' as const,
      input: z.object({
        date: z.string() // YYYY-MM-DD
      }),
      responses: {
        200: z.custom<typeof dailyReports.$inferSelect>(),
        401: errorSchemas.unauthorized,
      }
    },
    dashboard: {
      method: 'GET' as const,
      path: '/api/reports/dashboard' as const,
      responses: {
        200: z.object({
          totalCredit: z.number(),
          totalDebit: z.number(),
          outstandingBalance: z.number(),
          todaySummary: z.object({
            credit: z.number(),
            debit: z.number(),
          })
        }),
        401: errorSchemas.unauthorized,
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type CategoryResponse = z.infer<typeof api.categories.create.responses[201]>;
export type TransactionResponse = z.infer<typeof api.transactions.create.responses[201]>;
export type DashboardResponse = z.infer<typeof api.reports.dashboard.responses[200]>;
