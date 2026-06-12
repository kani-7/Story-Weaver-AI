import { pgTable, serial, integer, text, varchar, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const batchQueueStateTable = pgTable("batch_queue_state", {
  id: serial("id").primaryKey(),
  storyboardId: varchar("storyboard_id", { length: 128 }).notNull().unique(),
  status: varchar("status", { length: 16 }).notNull().default("idle"),
  completedScenes: jsonb("completed_scenes").$type<number[]>().default([]),
  failedScenes: jsonb("failed_scenes").$type<number[]>().default([]),
  activeScene: integer("active_scene"),
  sceneResults: jsonb("scene_results").default({}),
  queueProgress: integer("queue_progress").default(0),
  estimatedRemainingTime: integer("estimated_remaining_time").default(0),
  totalScenes: integer("total_scenes").default(0),
  provider: varchar("provider", { length: 32 }).default("luma"),
  duration: integer("duration").default(5),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const insertBatchQueueStateSchema = createInsertSchema(batchQueueStateTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBatchQueueState = z.infer<typeof insertBatchQueueStateSchema>;
export type BatchQueueState = typeof batchQueueStateTable.$inferSelect;
