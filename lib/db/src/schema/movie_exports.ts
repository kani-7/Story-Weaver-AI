import { pgTable, serial, integer, text, varchar, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const movieExportsTable = pgTable("movie_exports", {
  id: serial("id").primaryKey(),
  storyboardId: varchar("storyboard_id", { length: 128 }).notNull(),
  exportId: varchar("export_id", { length: 64 }).notNull().unique(),
  format: varchar("format", { length: 32 }).notNull(),
  status: varchar("status", { length: 16 }).notNull().default("processing"),
  sceneOrder: jsonb("scene_order").$type<number[]>().default([]),
  transitionType: varchar("transition_type", { length: 32 }).default("cinematic_cut"),
  audioLayer: jsonb("audio_layer").default({}),
  subtitleConfig: jsonb("subtitle_config").default({}),
  exportUrl: text("export_url"),
  exportProgress: integer("export_progress").default(0),
  exportError: text("export_error"),
  fileSize: integer("file_size"),
  duration: integer("duration"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const insertMovieExportSchema = createInsertSchema(movieExportsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMovieExport = z.infer<typeof insertMovieExportSchema>;
export type MovieExport = typeof movieExportsTable.$inferSelect;
