import { z } from "zod";

// Normalize emails so mobile keyboards' auto-capitalization / stray spaces
// can't cause sign-up and later sign-in to disagree.
const emailField = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.string().email("Enter a valid email"));

export const signupSchema = z.object({
  name: z.string().min(1, "Name is required").max(60),
  email: emailField,
  password: z.string().min(6, "At least 6 characters"),
  homeCountry: z.string().max(60).optional().or(z.literal("")),
});

export const reviewSchema = z.object({
  placeId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1000).optional().or(z.literal("")),
});

export const favoriteSchema = z.object({
  placeId: z.string().min(1),
  kind: z.enum(["save", "wish"]).default("save"),
});

export const messageSchema = z.object({
  conversationId: z.string().min(1),
  body: z.string().min(1).max(2000),
});

export const meetupSchema = z
  .object({
    type: z.enum(["MEAL", "SHOPPING", "TRIP", "ACTIVITY"]),
    title: z.string().min(1).max(120),
    description: z.string().max(1000).optional().or(z.literal("")),
    cityId: z.string().optional().or(z.literal("")),
    placeId: z.string().optional().or(z.literal("")),
    startTime: z.string().optional().or(z.literal("")),
    endTime: z.string().optional().or(z.literal("")),
    maxPeople: z.coerce.number().int().min(2).max(50).default(4),
    recurrence: z.enum(["none", "weekly", "monthly"]).default("none"),
    recurrenceDay: z.coerce.number().int().min(1).max(31).optional(),
  })
  // Safety: a meetup can't be scheduled in the past (allow 1 min of clock skew).
  .refine(
    (d) => !d.startTime || new Date(d.startTime).getTime() > Date.now() - 60_000,
    { message: "Start time must be in the future", path: ["startTime"] },
  )
  // End must be after start when both are given.
  .refine(
    (d) => !d.endTime || !d.startTime || new Date(d.endTime) > new Date(d.startTime),
    { message: "End time must be after the start time", path: ["endTime"] },
  );

export const tripSchema = z.object({
  title: z.string().trim().min(1, "Name your trip").max(100),
  cityId: z.string().optional().or(z.literal("")),
});

export const tripStopSchema = z.object({
  tripId: z.string().min(1),
  placeId: z.string().min(1),
  day: z.coerce.number().int().min(1).max(30).default(1),
});

export const poolSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(120),
    description: z.string().max(1000).optional().or(z.literal("")),
    cityId: z.string().optional().or(z.literal("")),
    placeId: z.string().optional().or(z.literal("")),
    productUrl: z.string().url().max(500).optional().or(z.literal("")),
    unitPriceYuan: z.coerce.number().min(0).max(1000000).optional(),
    targetPeople: z.coerce.number().int().min(2).max(100),
    maxPeople: z.coerce.number().int().min(2).max(100).optional(),
    deadline: z.string().optional().or(z.literal("")),
  })
  .refine((d) => !d.maxPeople || d.maxPeople >= d.targetPeople, {
    message: "Cap must be at least the target",
    path: ["maxPeople"],
  })
  .refine(
    (d) => !d.deadline || new Date(d.deadline).getTime() > Date.now() - 60_000,
    { message: "Deadline must be in the future", path: ["deadline"] },
  );

export const postSchema = z.object({
  body: z.string().trim().min(1, "Write something").max(500),
  cityId: z.string().optional().or(z.literal("")),
});

export const PLACE_CATEGORIES = [
  "FOOD",
  "ATTRACTION",
  "HOTEL",
  "NATURE",
  "NIGHTLIFE",
  "SHOPPING",
] as const;

export type PlaceCategory = (typeof PLACE_CATEGORIES)[number];

// Foreigner-friendly attributes a community can confirm for a place.
export const FOREIGNER_TAGS = [
  "ENGLISH_MENU",
  "PICTURE_MENU",
  "STAFF_ENGLISH",
  "CARD_PAY",
  "MOBILE_PAY",
  "HALAL",
  "VEG_FRIENDLY",
  "ENGLISH_SIGN",
] as const;

export type ForeignerTag = (typeof FOREIGNER_TAGS)[number];

// Reports — reusable moderation signal across entities (priority ⑤ groundwork).
export const REPORT_TARGET_TYPES = ["MEETUP", "USER", "REVIEW", "POST", "PLACE", "POOL"] as const;
export const REPORT_REASONS = [
  "SPAM",
  "INAPPROPRIATE",
  "SAFETY",
  "SCAM",
  "OTHER",
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

export const MOD_ACTIONS = [
  "DISMISS",
  "HIDE_CONTENT",
  "SUSPEND_USER",
  "UNSUSPEND_USER",
] as const;

export const moderateActionSchema = z.object({
  reportId: z.string().optional().or(z.literal("")),
  action: z.enum(MOD_ACTIONS),
  targetType: z.enum(REPORT_TARGET_TYPES),
  targetId: z.string().min(1),
  note: z.string().max(500).optional().or(z.literal("")),
});

export const reportSchema = z.object({
  targetType: z.enum(REPORT_TARGET_TYPES),
  targetId: z.string().min(1),
  reason: z.enum(REPORT_REASONS),
  detail: z.string().max(500).optional().or(z.literal("")),
});

// A new dish added under a place. Price is entered in 元 (yuan) and converted to
// 分 (cents) before storage; keep it optional.
export const placeCreateSchema = z.object({
  name: z.string().trim().min(1, "Chinese name required").max(120),
  nameEn: z.string().trim().min(1, "English name required").max(120),
  category: z.enum(PLACE_CATEGORIES),
  cityId: z.string().min(1, "City required"),
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  address: z.string().max(200).optional().or(z.literal("")),
  description: z.string().max(500).optional().or(z.literal("")),
  priceLevel: z.coerce.number().int().min(1).max(4).default(2),
});

export const dishSchema = z.object({
  placeId: z.string().min(1),
  name: z.string().trim().min(1, "Chinese name required").max(80),
  nameEn: z.string().trim().min(1, "English name required").max(80),
  description: z.string().max(300).optional().or(z.literal("")),
  priceYuan: z.coerce.number().min(0).max(100000).optional(),
});

export const dishReviewSchema = z.object({
  dishId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1000).optional().or(z.literal("")),
  mustTry: z.coerce.boolean().default(false),
});

export const foreignerTagSchema = z.object({
  placeId: z.string().min(1),
  tag: z.enum(FOREIGNER_TAGS),
});
