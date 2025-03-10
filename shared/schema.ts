import { pgTable, text, serial, integer, boolean, jsonb, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema for authentication if needed
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

// Soil moisture data schema
export const soilMoistureData = pgTable("soil_moisture_data", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  region: text("region").notNull(),
  value: doublePrecision("value").notNull(),
  average: doublePrecision("average").notNull(),
  status: text("status").notNull(),
  geojson: jsonb("geojson").notNull()
});

export const insertSoilMoistureSchema = createInsertSchema(soilMoistureData).omit({
  id: true
});

// Regions schema
export const regions = pgTable("regions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  geojson: jsonb("geojson").notNull()
});

export const insertRegionSchema = createInsertSchema(regions).omit({
  id: true
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertSoilMoistureData = z.infer<typeof insertSoilMoistureSchema>;
export type SoilMoistureData = typeof soilMoistureData.$inferSelect;

export type InsertRegion = z.infer<typeof insertRegionSchema>;
export type Region = typeof regions.$inferSelect;

// Request schemas for API endpoints
export const soilMoistureQuerySchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  timeStep: z.enum(["daily", "weekly", "monthly"]),
  region: z.string().optional()
});

export type SoilMoistureQuery = z.infer<typeof soilMoistureQuerySchema>;
