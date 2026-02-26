CREATE TABLE "accounts" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "accounts_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "categories" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "daily_reports" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "sessions" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "users" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "categories" CASCADE;--> statement-breakpoint
DROP TABLE "daily_reports" CASCADE;--> statement-breakpoint
DROP TABLE "sessions" CASCADE;--> statement-breakpoint
DROP TABLE "users" CASCADE;--> statement-breakpoint
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "transactions" DROP CONSTRAINT "transactions_category_id_categories_id_fk";
--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "date" SET DATA TYPE date;--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "date" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "serial" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "account_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "detail" text;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_account_id_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN "code";--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN "less";--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN "category_id";--> statement-breakpoint
ALTER TABLE "transactions" DROP COLUMN "notes";