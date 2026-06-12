import { pgTable, serial, integer, text, varchar, jsonb, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const sceneImagesTable = pgTable("scene_images", {
  id: serial("id").primaryKey(),
  storyboardId: varchar("storyboard_id", { length: 128 }).notNull(),
  sceneNumber: integer("scene_number").notNull(),
  imageUrl: text("image_url"),
  imageProvider: varchar("image_provider", { length: 32 }).notNull(),
  generationTime: integer("generation_time").default(0),
  generationError: text("generation_error"),
  imageStatus: varchar("image_status", { length: 16 }).notNull().default("success"),
  prompt: text("prompt"),
  colorPalette: text("color_palette"),
  cinematicMood: text("cinematic_mood"),
  renderStyle: text("render_style"),
  visualEngine: varchar("visual_engine", { length: 32 }),
  characterVisualContinuity: text("character_visual_continuity"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const insertSceneImageSchema = createInsertSchema(sceneImagesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSceneImage = z.infer<typeof insertSceneImageSchema>;
export type SceneImage = typeof sceneImagesTable.$inferSelect;
