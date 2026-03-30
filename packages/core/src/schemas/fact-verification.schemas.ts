/**
 * Zod schemas for Fact Verification models
 */

import { z } from "zod";

/**
 * Verification status schema
 */
export const verificationStatusSchema = z.enum(["PASS", "WARNING", "FAIL"]);

/**
 * Issue severity schema
 */
export const issueSeveritySchema = z.enum(["critical", "warning", "info"]);

/**
 * Issue category schema
 */
export const issueCategorySchema = z.enum(["timeline", "era_context", "entity", "logic", "general"]);

/**
 * Strictness schema
 */
export const strictnessSchema = z.enum(["strict", "normal", "loose"]);

/**
 * Verification source schema
 */
export const verificationSourceSchema = z.object({
  url: z.string().url().max(2000),
  title: z.string().min(1).max(500),
  excerpt: z.string().min(1).max(2000),
  reliability: z.number().min(0).max(1),
});

/**
 * Verification issue schema
 */
export const verificationIssueSchema = z.object({
  severity: issueSeveritySchema,
  category: issueCategorySchema,
  description: z.string().min(1).max(1000),
  suggestion: z.string().min(1).max(500),
});

/**
 * Fact verification result schema
 */
export const factVerificationResultSchema = z.object({
  status: verificationStatusSchema,
  fact: z.string().min(1).max(1000),
  summary: z.string().min(1).max(2000),
  issues: z.array(verificationIssueSchema),
  sources: z.array(verificationSourceSchema),
  confidence: z.number().min(0).max(1),
  suggestions: z.array(z.string().min(1).max(500)),
});

/**
 * Fact verification context schema
 */
export const factVerificationContextSchema = z.object({
  birthYear: z.number().int().min(1900).max(2024).optional(),
  location: z.string().min(1).max(200).optional(),
  era: z.string().min(1).max(50).optional(),
});

/**
 * Fact verification options schema
 */
export const factVerificationOptionsSchema = z.object({
  strictness: strictnessSchema.optional().default("normal"),
  enableWebVerification: z.boolean().optional().default(true),
  maxSources: z.number().int().min(1).max(20).optional().default(5),
});

/**
 * Fact verification request schema
 */
export const factVerificationRequestSchema = z.object({
  fact: z.string().min(1).max(1000),
  context: factVerificationContextSchema.optional(),
  options: factVerificationOptionsSchema.optional(),
});

/**
 * Extracted entities schema (for fact verification)
 */
export const factExtractedEntitiesSchema = z.object({
  years: z.array(z.number().int().min(1000).max(2030)).optional(),
  locations: z.array(z.string().min(1).max(100)).optional(),
  entities: z.array(z.string().min(1).max(100)).optional(),
  events: z.array(z.string().min(1).max(200)).optional(),
  missingEntities: z.array(z.string().min(1).max(100)).optional(),
});

/**
 * Verification request batch schema (for multiple facts)
 */
export const batchVerificationRequestSchema = z.object({
  facts: z.array(z.string().min(1).max(1000)).min(1).max(50),
  context: factVerificationContextSchema.optional(),
  options: factVerificationOptionsSchema.optional(),
});

/**
 * Batch verification result schema
 */
export const batchVerificationResultSchema = z.object({
  results: z.array(
    z.object({
      fact: z.string().min(1).max(1000),
      result: factVerificationResultSchema,
    })
  ),
  totalProcessed: z.number().int().min(1),
  passedCount: z.number().int().min(0),
  warningCount: z.number().int().min(0),
  failedCount: z.number().int().min(0),
  summary: z.string().min(1).max(2000),
});
