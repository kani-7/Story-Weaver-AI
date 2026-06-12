import { pgTable, serial, integer, text, varchar, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sceneVideosTable = pgTable("scene_videos", {
  id: serial("id").primaryKey(),
  storyboardId: varchar("storyboard_id", { length: 128 }).notNull(),
  sceneNumber: integer("scene_number").notNull(),
  videoUrl: text("video_url"),
  videoProvider: varchar("video_provider", { length: 32 }).notNull(),
  videoDuration: integer("video_duration").default(5),
  generationTime: integer("generation_time").default(0),
  generationError: text("generation_error"),
  generationProgress: integer("generation_progress").default(0),
  videoStatus: varchar("video_status", { length: 16 }).notNull().default("processing"),
  prompt: text("prompt"),
  cinematicMood: text("cinematic_mood"),
  lightingStyle: text("lighting_style"),
  animationStyle: text("animation_style"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const insertSceneVideoSchema = createInsertSchema(sceneVideosTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSceneVideo = z.infer<typeof insertSceneVideoSchema>;
export type SceneVideo = typeof sceneVideosTable.$inferSelect;
