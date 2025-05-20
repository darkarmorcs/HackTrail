import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const scans = pgTable("scans", {
  id: serial("id").primaryKey(),
  targetDomain: text("target_domain").notNull(),
  scanType: text("scan_type").notNull(),
  scanDepth: integer("scan_depth").notNull(),
  status: text("status").notNull().default("pending"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  findings: jsonb("findings"),
});

export const insertScanSchema = createInsertSchema(scans)
  .pick({
    targetDomain: true,
    scanType: true,
    scanDepth: true,
  });

export const scanResults = pgTable("scan_results", {
  id: serial("id").primaryKey(),
  scanId: integer("scan_id").notNull(),
  resultType: text("result_type").notNull(),
  severity: text("severity"),
  details: jsonb("details").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertScanResultSchema = createInsertSchema(scanResults)
  .pick({
    scanId: true,
    resultType: true,
    severity: true,
    details: true,
  });

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertScan = z.infer<typeof insertScanSchema>;
export type Scan = typeof scans.$inferSelect;

export type InsertScanResult = z.infer<typeof insertScanResultSchema>;
export type ScanResult = typeof scanResults.$inferSelect;

// Enums
export enum ScanType {
  FULL = "full",
  SUBDOMAIN = "subdomain",
  PARAMETER = "parameter",
  VULNERABILITY = "vulnerability",
  CONTENT = "content",
  PORT_SCAN = "port_scan",
  TECH_DETECTION = "tech_detection"
}

export enum ScanStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled"
}

export enum ResultType {
  SUBDOMAIN = "subdomain",
  PARAMETER = "parameter",
  VULNERABILITY = "vulnerability",
  PORT = "port",
  DIRECTORY = "directory",
  TECHNOLOGY = "technology"
}

export enum Severity {
  CRITICAL = "critical",
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
  INFO = "info"
}
