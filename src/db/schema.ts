import {
  pgTable,
  text,
  timestamp,
  integer,
  uuid,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const testRunStatusEnum = pgEnum("test_run_status", [
  "queued",
  "running",
  "completed",
  "failed",
]);

export const testRunModeEnum = pgEnum("test_run_mode", ["standard", "fast"]);

export const issueSeverityEnum = pgEnum("issue_severity", [
  "error",
  "warning",
  "info",
]);

export const issueCategoryEnum = pgEnum("issue_category", [
  "broken_link",
  "console_error",
  "broken_image",
  "accessibility",
  "performance",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email").notNull(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const testRuns = pgTable("test_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  url: text("url").notNull(),
  status: testRunStatusEnum("status").default("queued").notNull(),
  mode: testRunModeEnum("mode").default("standard").notNull(),
  mobileViewport: boolean("mobile_viewport").default(false).notNull(),
  issueCount: integer("issue_count").default(0),
  durationMs: integer("duration_ms"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const credits = pgTable("credits", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull()
    .unique(),
  balance: integer("balance").default(0).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const issues = pgTable("issues", {
  id: uuid("id").defaultRandom().primaryKey(),
  testRunId: uuid("test_run_id")
    .references(() => testRuns.id, { onDelete: "cascade" })
    .notNull(),
  category: issueCategoryEnum("category").notNull(),
  severity: issueSeverityEnum("severity").notNull(),
  message: text("message").notNull(),
  selector: text("selector"),
  context: text("context"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations for query builder
export const usersRelations = relations(users, ({ many, one }) => ({
  testRuns: many(testRuns),
  credits: one(credits),
}));

export const testRunsRelations = relations(testRuns, ({ one, many }) => ({
  user: one(users, { fields: [testRuns.userId], references: [users.id] }),
  issues: many(issues),
}));

export const creditsRelations = relations(credits, ({ one }) => ({
  user: one(users, { fields: [credits.userId], references: [users.id] }),
}));

export const issuesRelations = relations(issues, ({ one }) => ({
  testRun: one(testRuns, {
    fields: [issues.testRunId],
    references: [testRuns.id],
  }),
}));
