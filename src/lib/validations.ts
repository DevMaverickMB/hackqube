import { z } from "zod";

export const voteSchema = z.object({
  presentation_id: z.string().uuid(),
  idea_score: z.number().int().min(1).max(5),
  execution_score: z.number().int().min(1).max(5),
  helpfulness_score: z.number().int().min(1).max(5),
  presentation_score: z.number().int().min(1).max(5),
});

export const presentationSchema = z.object({
  title: z.string().min(1).max(200),
  problem_statement: z.string().min(1).max(5000),
  ai_tools_used: z.array(z.string()).min(1),
  approach: z.string().min(1).max(5000),
  demo_link: z.string().url().optional().or(z.literal("")),
  impact_level: z.enum(["low", "medium", "high", "critical"]),
  category: z.enum(["ops", "product", "sales", "support", "engineering", "other"]),
  attachments: z.array(z.string().url()).optional(),
});

export const scheduleAssignSchema = z.object({
  user_id: z.string().uuid(),
  scheduled_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().optional(),
});

export const scoreOverrideSchema = z.object({
  final_score: z.number().min(0).max(5),
  reason: z.string().min(1).max(1000),
});

export const shareArticleSchema = z.object({
  url: z.string().url().max(2000),
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(1000).optional(),
});

export const inviteUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "participant"]).default("participant"),
});

export type VoteInput = z.infer<typeof voteSchema>;
export type PresentationInput = z.infer<typeof presentationSchema>;
export type ScheduleAssignInput = z.infer<typeof scheduleAssignSchema>;
export type ScoreOverrideInput = z.infer<typeof scoreOverrideSchema>;
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
