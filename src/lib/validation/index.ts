import { z } from 'zod';

export const CreateCustomerSchema = z.object({
  organizationName: z.string().min(1),
  contactName: z.string().min(1),
  email: z.string().email(),
  customerType: z.string().default('BUSINESS'),
  keywordsInclude: z.array(z.string()).default([]),
  keywordsExclude: z.array(z.string()).default([]),
  naicsCodes: z.array(z.string()).default([]),
  agenciesOfInterest: z.array(z.string()).default([]),
  locationsOfInterest: z.array(z.string()).default([]),
  setAsidePreferences: z.array(z.string()).default([]),
  minAwardAmount: z.number().optional(),
  maxAwardAmount: z.number().optional(),
  dueDateMinDaysOut: z.number().int().optional(),
  dueDateMaxDaysOut: z.number().int().optional(),
  activeStatus: z.boolean().default(true),
  weeklyDigestEnabled: z.boolean().default(true),
  weeklyDigestDay: z.number().int().min(0).max(6).default(1),
  timezone: z.string().default('America/New_York'),
  notes: z.string().optional(),
});

export type CreateCustomerInput = z.infer<typeof CreateCustomerSchema>;

export const UpdateCustomerSchema = CreateCustomerSchema.partial();
export type UpdateCustomerInput = z.infer<typeof UpdateCustomerSchema>;

export const OpportunityFiltersSchema = z.object({
  sourceType: z.string().optional(),
  isActive: z.boolean().optional(),
  agencyName: z.string().optional(),
  keyword: z.string().optional(),
  postedAfter: z.string().datetime().optional(),
  postedBefore: z.string().datetime().optional(),
  responseBefore: z.string().datetime().optional(),
  limit: z.number().int().min(1).max(100).default(50),
  offset: z.number().int().min(0).default(0),
});

export type OpportunityFilters = z.infer<typeof OpportunityFiltersSchema>;
