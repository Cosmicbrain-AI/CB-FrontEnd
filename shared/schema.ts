import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  size: integer("size").notNull(),
  mimetype: text("mimetype").notNull(),
  path: text("path").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const processingJobs = pgTable("processing_jobs", {
  id: serial("id").primaryKey(),
  videoId: integer("video_id").references(() => videos.id).notNull(),
  type: text("type").notNull(), // 'synthetic' or 'vla'
  status: text("status").notNull().default("pending"), // 'pending', 'processing', 'completed', 'failed'
  progress: integer("progress").default(0),
  parameters: jsonb("parameters"),
  result: jsonb("result"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const syntheticVariations = pgTable("synthetic_variations", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => processingJobs.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  filename: text("filename").notNull(),
  path: text("path").notNull(),
  size: integer("size").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const vlaOutputs = pgTable("vla_outputs", {
  id: serial("id").primaryKey(),
  jobId: integer("job_id").references(() => processingJobs.id).notNull(),
  filename: text("filename").notNull(),
  path: text("path").notNull(),
  size: integer("size").notNull(),
  format: text("format").notNull(),
  episodes: integer("episodes"),
  actions: integer("actions"),
  duration: text("duration"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertVideoSchema = createInsertSchema(videos).omit({
  id: true,
  uploadedAt: true,
});

export const insertProcessingJobSchema = createInsertSchema(processingJobs).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSyntheticVariationSchema = createInsertSchema(syntheticVariations).omit({
  id: true,
  createdAt: true,
});

export const insertVlaOutputSchema = createInsertSchema(vlaOutputs).omit({
  id: true,
  createdAt: true,
});

export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type ProcessingJob = typeof processingJobs.$inferSelect;
export type InsertProcessingJob = z.infer<typeof insertProcessingJobSchema>;
export type SyntheticVariation = typeof syntheticVariations.$inferSelect;
export type InsertSyntheticVariation = z.infer<typeof insertSyntheticVariationSchema>;
export type VlaOutput = typeof vlaOutputs.$inferSelect;
export type InsertVlaOutput = z.infer<typeof insertVlaOutputSchema>;
